/* ============================================================================
   pose3d.js — la aritmética de las posturas, en un solo sitio

   Lo usan el motor de la app (figura3d.js) y las herramientas del taller, para
   que los tres pinten exactamente la misma figura.

   POR QUÉ NO SE USAN LOS SETTERS DE LA LIBRERÍA
   ---------------------------------------------
   mannequin.js expone `arm.raise`, `torso.bend`, etc. Cada uno hace
   `rotation.reorder(...)` y escribe UNA componente del Euler. Eso trae dos
   problemas que costaron una tanda entera de 91 ejercicios en rojo:

   1. El resultado depende del ORDEN en que se escriben las tres propiedades,
      y ese orden era el de las claves del objeto — distinto entre la postura A
      y la B. Los mismos ángulos daban rotaciones distintas.

   2. Con `body.bend = 90` (todo lo que está tumbado) el reorder cae en el
      bloqueo de cardán y la matriz sale NaN. Se propagaba a todo: cajas NaN,
      amplitud NaN, encuadre NaN. 61 de 91 ejercicios fallaban cinco
      comprobaciones cada uno por esta única causa.

   Aquí se escribe el Euler ENTERO de una vez, con un orden fijo por
   articulación elegido para que el eje del medio —el que se bloquea— sea
   siempre el ángulo más pequeño:

     · tronco y cabeza → 'YXZ': en medio va el ladeo, que nunca pasa de 25°.
     · miembros        → 'ZYX': en medio va la rotación axial, que es pequeña,
                         y así la elevación puede llegar a −180° sin bloquearse.

   MAPA: cómo se traduce cada ángulo anatómico a ejes, sacado de leer
   lib/mannequin/organs/*.js. leftOrRight vale −1 en el lado izquierdo.
   ========================================================================= */

var R = Math.PI / 180;

/* [ejeDelAngulo, factor] · factor se multiplica por el lado cuando toca */
var MAPA = {
  body:  {orden:"YXZ", ejes:{bend:["z",-1], tilt:["x",-1], turn:["y", 1]}},
  torso: {orden:"YXZ", ejes:{bend:["z",-1], tilt:["x",-1], turn:["y", 1]}},
  /* la cabeza reparte el giro con el cuello: la mitad cada uno */
  head:  {orden:"YXZ", mitad:"neck",
          ejes:{nod:["z",-0.5], tilt:["x",-0.5], turn:["y", 0.5]}},
  arm:   {orden:"ZYX", lado:true,
          ejes:{raise:["z", 1], straddle:["x",-1,"lado"], turn:["y",-1,"lado"]}},
  leg:   {orden:"ZYX", lado:true,
          ejes:{raise:["z", 1], straddle:["x",-1,"lado"], turn:["y",-1,"lado"]}},
  elbow: {orden:"ZYX", ejes:{bend:["z", 1]}},
  knee:  {orden:"ZYX", ejes:{bend:["z", 1]}},
  wrist: {orden:"ZYX", lado:true,
          ejes:{bend:["x",-1,"lado"], tilt:["z", 1,"lado"], turn:["y", 1,"lado"]}},
  ankle: {orden:"ZYX", lado:true,
          ejes:{bend:["z",-1], tilt:["x", 1,"lado"], turn:["y", 1,"lado"]}}
};

function familia(nombre){
  return nombre.replace(/^[lr]_/, "");
}
function ladoDe(nombre){
  /* en la librería LEFT = -1 */
  return nombre.indexOf("l_") === 0 ? -1 : 1;
}

/* Escribe una articulación entera de una vez. Determinista y sin bloqueo. */
export function ponerJunta(man, nombre, valores){
  var j = man[nombre]; if (!j) return;
  var m = MAPA[familia(nombre)]; if (!m) return;
  var lado = ladoDe(nombre), e = {x:0, y:0, z:0}, hay = false;
  Object.keys(m.ejes).forEach(function(prop){
    if (valores[prop] === undefined) return;
    var d = m.ejes[prop], f = d[1] * (d[2] === "lado" ? lado : 1);
    e[d[0]] += valores[prop] * f; hay = true;
  });
  if (!hay) return;
  j.rotation.set(e.x*R, e.y*R, e.z*R, m.orden);
  if (m.mitad && man[m.mitad]) man[m.mitad].rotation.set(e.x*R, e.y*R, e.z*R, m.orden);
}

export function poner(man, pose){
  Object.keys(pose).forEach(function(n){
    if (typeof pose[n] === "number") return;      // "alza" y compañía
    ponerJunta(man, n, pose[n]);
  });
  man.stepOnGround();
  /* "alza": cuánto sube la figura después de apoyarla, para sentarla en un
     banco o tumbarla en una máquina. Sin ella todo acaba en el suelo. */
  /* cinturón: si algo cuela un valor que no es número, se ignora en vez de
     dejar la posición en NaN y arrastrar el fallo a las figuras siguientes */
  if (typeof pose.alza === "number" && isFinite(pose.alza)) man.position.y += pose.alza;
  if (!isFinite(man.position.y)) man.position.y = 0;
  man.updateMatrixWorld(true);
}

/* La postura completa: el arquetipo, con los deltas del ejercicio encima. */
export function completa(id, cual, datos){
  var D = datos || window.FIG3D;
  var e = D.POSES[id], b = (D.ARQUETIPOS[e.arquetipo] || {}).base || {};
  var p = JSON.parse(JSON.stringify(b));
  Object.keys(e[cual] || {}).forEach(function(j){
    if (typeof e[cual][j] === "number"){ p[j] = e[cual][j]; return; }
    p[j] = Object.assign(p[j] || {}, e[cual][j]);
  });
  return p;
}

/* Se interpolan ángulos ANATÓMICOS, nunca los Euler que devuelve `posture`:
   su descomposición es ambigua y a mitad de ciclo los miembros viajan por el
   camino largo. Medido: las dos piernas llegaban a cruzarse con los dos
   extremos perfectos. */
export function mezclar(A, B, k){
  var o = {};
  Object.keys(A).forEach(function(j){
    if (typeof A[j] === "number"){
      var bn = typeof B[j] === "number" ? B[j] : A[j];
      o[j] = A[j] + (bn - A[j]) * k; return;
    }
    o[j] = {};
    Object.keys(A[j]).forEach(function(p){
      var a = A[j][p], b = (B[j] && B[j][p] !== undefined) ? B[j][p] : a;
      o[j][p] = a + (b - a) * k;
    });
  });
  return o;
}

/* Topes anatómicos por propiedad, sacados de lib/mannequin/organs/*.js.
   Se validan estos y no el Euler en bruto: leer `elbow.x` puede dar −180 en
   una postura legal, porque es otra descomposición de la misma rotación. */
export var TOPES = {
  body:    {bend:[-95,95],  tilt:[-45,45], turn:[-180,180]},
  torso:   {bend:[-25,60],  tilt:[-25,25], turn:[-50,50]},
  head:    {nod:[-45,45],   tilt:[-50,50], turn:[-90,90]},
  /* La elevación de hombro NO lleva tope duro, y es a propósito. Es un ángulo
     que da la vuelta entera: con el tronco de pie, +45 ya es hiperextensión;
     con el tronco tumbado o a cuatro patas, +92 es simplemente el brazo
     apuntando al suelo y +172 es el brazo estirado al frente. Un rango fijo
     aquí solo genera falsos positivos.
     Quien juzga de verdad si el hombro es posible es el test geométrico de la
     librería (`biologicallyImpossibleLevel`), que el validador ya consulta. */
  l_arm:   {raise:[-190,190],straddle:[-30,150], turn:[-135,135]},
  r_arm:   {raise:[-190,190],straddle:[-30,150], turn:[-135,135]},
  l_elbow: {bend:[0,150]},  r_elbow: {bend:[0,150]},
  l_wrist: {bend:[-70,70],  turn:[-90,90], tilt:[-35,35]},
  r_wrist: {bend:[-70,70],  turn:[-90,90], tilt:[-35,35]},
  l_leg:   {raise:[-45,120],straddle:[-30,90], turn:[-90,90]},
  r_leg:   {raise:[-45,120],straddle:[-30,90], turn:[-90,90]},
  l_knee:  {bend:[0,150]},  r_knee:  {bend:[0,150]},
  l_ankle: {bend:[-80,70],  turn:[-30,30], tilt:[-25,25]},
  r_ankle: {bend:[-80,70],  turn:[-30,30], tilt:[-25,25]}
};

export var ETIQ = {
  bend:"flexionar", raise:"elevar", straddle:"abrir", turn:"girar",
  tilt:"ladear", nod:"asentir"
};
