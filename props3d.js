/* ============================================================================
   props3d.js — el aparato, anclado al cuerpo

   La primera versión colocaba bancos, sillas y máquinas con coordenadas
   escritas a mano. El resultado fue el previsible: bloques que atravesaban el
   cuerpo, bancos flotando al lado, y una pared que tapaba la figura entera.
   Y las mancuernas no se veían porque el desplazamiento respecto a la mano
   estaba adivinado.

   Aquí nada se coloca a ojo. Todo sale de MEDIR la figura ya posada:

     · El banco se pone debajo de lo que apoya en él, del tamaño de lo que
       apoya, con la cara de arriba justo bajo el cuerpo.
     · La silla y la máquina, debajo del glúteo, con el respaldo detrás del
       torso — "detrás" calculado de los ejes del cuerpo, no supuesto.
     · La pared se planta MÁS ALLÁ de las manos, para quedar detrás de la
       figura y no delante.
     · La mancuerna se centra en la caja de la mano y se orienta según un eje
       del cuerpo, no con un desplazamiento a ciegas.

   Los ejes del cuerpo se deducen de la propia figura: el lateral, de una
   cadera a la otra; el frente, del producto vectorial con la vertical, y el
   signo se decide comprobando hacia dónde apuntan los dedos del pie. Así
   funciona en cualquier postura, tumbada o de pie.
   ========================================================================= */

var SUELO = -0.71;

/* ---------------------------------------------------------------- medidas */
function caja(THREE, obj){ return new THREE.Box3().setFromObject(obj, true); }

function cajaDe(THREE, man, nombres){
  var c = new THREE.Box3(), t = new THREE.Box3();
  (nombres || []).forEach(function(n){
    var j = man[n];
    if (j && j.image){ t.setFromObject(j.image, true); c.union(t); }
  });
  return c;
}

export function ejes(THREE, man){
  var up = new THREE.Vector3(0,1,0);
  var a = man.l_leg.point(0,0,0), b = man.r_leg.point(0,0,0);
  var lat = new THREE.Vector3(b.x-a.x, 0, b.z-a.z);
  if (lat.lengthSq() < 1e-8) lat.set(1,0,0);
  lat.normalize();
  var fre = new THREE.Vector3().crossVectors(up, lat).normalize();
  /* el signo lo decide el pie: los dedos apuntan al frente */
  var tob = man.l_ankle.point(0,0,0);
  var pie = cajaDe(THREE, man, ["l_ankle"]).getCenter(new THREE.Vector3());
  var d = new THREE.Vector3(pie.x-tob.x, 0, pie.z-tob.z);
  if (d.dot(fre) < 0) fre.negate();
  return {lateral:lat, frente:fre, arriba:up};
}

/* Convierte un punto de mundo al espacio del grupo que contiene los props.
   `centro` solo traslada, y `pivote` solo gira sobre Y, así que basta con la
   inversa de su matriz de mundo. */
function aLocal(centro, v){ return centro ? centro.worldToLocal(v.clone()) : v.clone(); }

/* Orienta el objeto para que su eje +Y local apunte a una dirección de mundo,
   compensando el giro del padre al que está enganchado. */
function orientar(THREE, obj, dirMundo){
  var q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dirMundo);
  var pq = new THREE.Quaternion();
  if (obj.parent){ obj.parent.getWorldQuaternion(pq); q.premultiply(pq.invert()); }
  obj.quaternion.copy(q);
}

/* ------------------------------------------------------------- geometrías */
function blo(THREE, mat, w, h, d){
  return new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,.02), Math.max(h,.02),
                                              Math.max(d,.02)), mat);
}
function patas(THREE, mat, g, w, d, yTop){
  var alto = yTop - SUELO;
  if (alto <= .02) return;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q){
    var p = blo(THREE, mat, .055, alto, .055);
    p.position.set(q[0]*(w/2-.06), SUELO + alto/2, q[1]*(d/2-.06));
    g.add(p);
  });
}
export function mancuerna(THREE, mat, e){
  e = e || 1;
  var g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.028*e,.028*e,.22*e,10), mat));
  [-1,1].forEach(function(k){
    var d = new THREE.Mesh(new THREE.CylinderGeometry(.085*e,.085*e,.10*e,14), mat);
    d.position.y = k*.145*e; g.add(d);
  });
  return g;
}
export function barra(THREE, mat, largo){
  var L = largo || 1.5, g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,L,10), mat));
  [-1,1].forEach(function(k){
    var d = new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.08,14), mat);
    d.position.y = k*(L/2 - .09); g.add(d);
  });
  return g;
}

/* --------------------------------------------------- apartarse del cuerpo */
/* Los huesos, muestreados, para saber si el aparato invade al muñeco. */
var HUESOS = [["pelvis","torso"],["torso","neck"],["neck","head"],
  ["l_leg","l_knee"],["r_leg","r_knee"],["l_knee","l_ankle"],["r_knee","r_ankle"],
  ["l_arm","l_elbow"],["r_arm","r_elbow"],["l_elbow","l_wrist"],["r_elbow","r_wrist"]];

function puntosCuerpo(THREE, man, salvo){
  var pts = [];
  HUESOS.forEach(function(h){
    if (salvo.indexOf(h[0]) >= 0 || salvo.indexOf(h[1]) >= 0) return;
    var a = man[h[0]].point(0,0,0), b = man[h[1]].point(0,0,0);
    for (var i = 1; i < 5; i++) pts.push(new THREE.Vector3().lerpVectors(a,b,i/5));
  });
  return pts;
}

/* Empuja el aparato en la dirección dada hasta que deja de meterse en el
   cuerpo. Es lo que evita tener que ajustar a mano la silla de cada ejercicio:
   se coloca donde toca y luego se retira sola lo justo. */
function apartar(THREE, g, pts, dir, paso, maxPasos){
  var caja = new THREE.Box3();
  for (var n = 0; n < (maxPasos||14); n++){
    var choca = false;
    for (var i = 0; i < g.children.length && !choca; i++){
      caja.setFromObject(g.children[i], true);
      for (var j = 0; j < pts.length; j++)
        if (caja.containsPoint(pts[j])){ choca = true; break; }
    }
    if (!choca) return n;
    g.position.addScaledVector(dir, paso || .035);
    g.updateMatrixWorld(true);
  }
  return -1;
}

/* ------------------------------------------------------------------ montaje */
/* Se llama DESPUÉS de posar la figura: los props se miden de ella. */
export function montar(THREE, mat, man, centro, lista, opciones){
  var out = {colgados:[], fijos:[]};
  var E = ejes(THREE, man);
  var vc = new THREE.Vector3(), vs = new THREE.Vector3();

  (lista || []).forEach(function(a){

    /* --- lo que cuelga de la mano ------------------------------------- */
    if (a.tipo === "mancuerna" || a.tipo === "barra"){
      (a.en || []).forEach(function(n){
        var j = man[n]; if (!j) return;
        var o = a.tipo === "barra" ? barra(THREE, mat, a.largo)
                                   : mancuerna(THREE, mat, a.escala);
        j.attach(o);
        man.updateMatrixWorld(true);
        /* centrado en la caja de la MANO, no en un desplazamiento adivinado:
           por eso ahora se ven */
        var cm = cajaDe(THREE, man, [n]).getCenter(vc);
        o.position.copy(cm);
        o.parent.worldToLocal(o.position);
        /* el eje de la barra: a lo ancho del cuerpo para una barra, de frente
           a espalda para una mancuerna colgando, vertical en el agarre goblet */
        var dir = a.eje === "arriba" ? E.arriba
                : a.eje === "lateral" ? E.lateral : E.frente;
        orientar(THREE, o, dir);
        out.colgados.push({j:j, o:o});
      });
      return;
    }

    /* --- lo que está fijo en el suelo ---------------------------------- */
    var g = new THREE.Group(), c, tam, ctr;

    if (a.tipo === "banco" || a.tipo === "silla" || a.tipo === "maquina"){
      c = cajaDe(THREE, man, a.apoya && a.apoya.length ? a.apoya : ["pelvis"]);
      if (c.isEmpty()) return;
      tam = c.getSize(vs); ctr = c.getCenter(vc);
      var ancho = Math.max(.36, tam.x + .18), fondo = Math.max(.34, tam.z + .18);
      var yTop = c.min.y - .012;
      var asiento = blo(THREE, mat, ancho, .07, fondo);
      asiento.position.set(ctr.x, yTop - .035, ctr.z);
      g.add(asiento);
      patas(THREE, mat, g, ancho, fondo, yTop - .07);
      if (a.tipo !== "banco"){
        /* respaldo: detrás del torso, en el eje del cuerpo */
        var ct = cajaDe(THREE, man, ["torso"]);
        var at = E.frente.clone().multiplyScalar(-(fondo/2 + .04));
        var alt = Math.max(.30, (ct.isEmpty() ? .5 : ct.max.y) - yTop);
        var resp = blo(THREE, mat, ancho*.95, alt, .06);
        resp.position.set(ctr.x + at.x, yTop + alt/2, ctr.z + at.z);
        g.add(resp);
      }
      if (a.tipo === "maquina"){
        var col = blo(THREE, mat, .12, 1.5, .12);
        var ac = E.frente.clone().multiplyScalar(-(fondo/2 + .22));
        col.position.set(ctr.x + ac.x, SUELO + .75, ctr.z + ac.z);
        g.add(col);
      }
    }

    else if (a.tipo === "pared"){
      /* Se planta MÁS ALLÁ de las manos: así la figura queda delante y no
         desaparece detrás de un rectángulo gris, que es lo que pasaba. */
      c = cajaDe(THREE, man, a.ante && a.ante.length ? a.ante : ["l_wrist","r_wrist"]);
      if (c.isEmpty()) return;
      ctr = c.getCenter(vc);
      var lado1 = a.detras ? -1 : 1;
      var n1 = E.frente.clone().multiplyScalar(.06 * lado1);
      var pared = blo(THREE, mat, 1.3, 2.0, .07);
      pared.position.set(ctr.x + n1.x, SUELO + 1.0, ctr.z + n1.z);
      /* la cara plana mira al cuerpo */
      pared.lookAt(pared.position.clone().add(E.frente.clone().multiplyScalar(lado1)));
      pared.rotateX(Math.PI/2);
      g.add(pared);
    }

    else if (a.tipo === "poste" || a.tipo === "barra_fija"){
      var ref = a.ante && a.ante.length ? a.ante : ["l_wrist"];
      c = cajaDe(THREE, man, ref);
      if (c.isEmpty()) return;
      ctr = c.getCenter(vc);
      var lado = E.frente.clone().multiplyScalar((a.detras ? -1 : 1) * .16);
      if (a.tipo === "barra_fija"){
        var bf = new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,1.1,10), mat);
        bf.position.set(ctr.x, c.max.y + .02, ctr.z);
        orientar(THREE, bf, E.lateral);
        g.add(bf);
        [-1,1].forEach(function(k){
          var v = E.lateral.clone().multiplyScalar(k*.55);
          var p = blo(THREE, mat, .09, c.max.y + .02 - SUELO, .09);
          p.position.set(ctr.x+v.x, (c.max.y + .02 + SUELO)/2, ctr.z+v.z);
          g.add(p);
        });
      } else {
        var alto2 = Math.max(.9, c.max.y + .30 - SUELO);
        var col2 = blo(THREE, mat, .11, alto2, .11);
        col2.position.set(ctr.x + lado.x, SUELO + alto2/2, ctr.z + lado.z);
        g.add(col2);
      }
    }

    else return;

    /* los props viven en el mismo grupo que la figura */
    g.children.forEach(function(m){ centro.worldToLocal(m.position); });
    centro.add(g);
    centro.updateMatrixWorld(true);
    /* y se apartan solos de lo que no deben tocar */
    /* Lo que rodea al punto de apoyo también toca por narices: el respaldo de
       una silla roza el torso, el asiento roza el muslo. Si no se declara,
       el aparato se aparta hasta quedar en otra provincia. */
    var VECINO = {pelvis:["l_leg","r_leg","torso"], torso:["pelvis","neck","l_arm","r_arm"],
                  l_ankle:["l_knee"], r_ankle:["r_knee"],
                  l_wrist:["l_elbow"], r_wrist:["r_elbow"],
                  l_knee:["l_leg","l_ankle"], r_knee:["r_leg","r_ankle"],
                  l_elbow:["l_arm","l_wrist"], r_elbow:["r_arm","r_wrist"]};
    var salvo = (a.apoya || []).concat(a.ante || []);
    salvo.slice().forEach(function(n){
      (VECINO[n]||[]).forEach(function(v){ if (salvo.indexOf(v) < 0) salvo.push(v); });
    });
    var pts = puntosCuerpo(THREE, man, salvo);
    var atras = E.frente.clone().multiplyScalar(a.tipo === "pared" || a.tipo === "poste" ? 1 : -1);
    apartar(THREE, g, pts, atras);
    out.fijos.push(g);
  });

  return out;
}

export function desmontar(centro, montaje){
  (montaje.colgados || []).forEach(function(q){ q.j.detach(q.o); });
  (montaje.fijos || []).forEach(function(o){ centro.remove(o); });
}
