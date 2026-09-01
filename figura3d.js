/* ============================================================================
   figura3d.js — el motor de las figuras

   Un solo maniquí, un solo contexto WebGL y un solo bucle para toda la app.
   Las figuras se piden poniendo un hueco en el HTML:

     <div data-fig3d="sentadilla_goblet" data-modo="anim"></div>

   y un MutationObserver las monta cuando aparecen. Así los puntos de pintado
   de index.html no tienen que saber nada de three.js ni esperar a que el
   módulo cargue.

   Modos:
     anim  → lienzo vivo, ciclo del ejercicio. Solo se anima el que está a la
             vista (IntersectionObserver): nunca hay 91 figuras corriendo.
     pose  → imagen fija de un momento del ciclo (data-k de 0 a 1).
     fija  → imagen fija de la postura de partida, para la fila de 76 px.
     mini  → igual pero recortada al cuerpo, para la miniatura de 46 px.

   Todo lo estático se cachea por (id, modo, k, tema, alto). Un cambio de tema
   vacía la caché y repinta.
   ========================================================================= */

import * as THREE from "three";
import { Male } from "mannequin";
import { completa as _completa, mezclar, poner as _poner } from "./pose3d.js";
import { montar as montarProps, desmontar as quitarProps } from "./props3d.js";

var D = window.FIG3D || {};
var ARQ = D.ARQUETIPOS || {}, POSES = D.POSES || {};

/* ---------------------------------------------------------------- escenario */
var lienzo = document.createElement("canvas");
lienzo.width = 512; lienzo.height = 512;
var ren, hayWebGL = true;
try {
  ren = new THREE.WebGLRenderer({canvas:lienzo, antialias:true, alpha:true,
                                 preserveDrawingBuffer:true});
  ren.setPixelRatio(1);
  ren.outputColorSpace = THREE.SRGBColorSpace;
} catch (e) { hayWebGL = false; }

var escena, cam, pivote, centro, man, suelo, matApar, aparato = [];

function arrancar(){
  escena = new THREE.Scene();
  cam = new THREE.OrthographicCamera(-1,1,1,-1,-100,100);
  cam.position.set(0,0,40);
  pivote = new THREE.Group(); escena.add(pivote);
  centro = new THREE.Group(); pivote.add(centro);

  /* Luz alta y muy frontal: un punto de volumen para que se lea la pieza, no
     un render de estudio. DISENO §15. */
  escena.add(new THREE.AmbientLight("white", 1.6));
  var dir = new THREE.DirectionalLight("white", 1.2);
  dir.position.set(-3, 8, 10);
  escena.add(dir);

  man = new Male();
  centro.add(man);
  ["l_","r_"].forEach(function(s){ man[s+"fingers"].hide(); });

  var c = document.createElement("canvas"); c.width = c.height = 128;
  var g = c.getContext("2d"), rg = g.createRadialGradient(64,64,3,64,64,62);
  rg.addColorStop(0,"rgba(255,255,255,1)"); rg.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle = rg; g.fillRect(0,0,128,128);
  suelo = new THREE.Mesh(new THREE.CircleGeometry(0.9),
    new THREE.MeshBasicMaterial({transparent:true, depthWrite:false,
                                 map:new THREE.CanvasTexture(c)}));
  suelo.rotation.x = -Math.PI/2; suelo.renderOrder = -1;
  centro.add(suelo);

  matApar = new THREE.MeshLambertMaterial({color:"#cbd3de"});
  repintar();
}

function css(v, alt){
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || alt;
}
function repintar(){
  if (!man) return;
  var ink = css("--diagram-ink","#2b3648");
  /* monocromo: las siete zonas con la misma tinta. Con las articulaciones en
     otro tono el muñeco se lee como palitos y bolitas. */
  man.recolor(ink, ink, ink, ink, ink, ink, ink);
  matApar.color = new THREE.Color(css("--diagram-line","#cbd3de"));
  suelo.material.color = new THREE.Color(css("--diagram-shadow","#d3dae4"));
}

/* ------------------------------------------------------------------ posturas */
/* La aritmética vive en pose3d.js: el motor, la hoja de contacto y el posador
   pintan exactamente la misma figura porque comparten esas funciones. */
function completa(id, cual){ return _completa(id, cual, D); }
function poner(pose){ _poner(man, pose); }

/* ------------------------------------------------------------------- aparato */
/* El aparato se mide de la figura YA POSADA (ver props3d.js): el banco se pone
   debajo de lo que apoya en él, la pared más allá de las manos, y la mancuerna
   centrada en la caja de la mano. Antes iba con coordenadas escritas a mano y
   el resultado eran bloques atravesando el cuerpo. */
var montaje = {colgados:[], fijos:[]};
function montarAparato(id){
  quitarProps(centro, montaje);
  poner(completa(id, "A"));
  montaje = montarProps(THREE, matApar, man, centro, (POSES[id] || {}).aparato);
}

/* ------------------------------------------------------------------ encuadre */
var caja = new THREE.Box3(), tmp = new THREE.Box3(),
    vT = new THREE.Vector3(), vC = new THREE.Vector3(), ejeY = new THREE.Vector3(0,1,0);
var marcos = {};

/* Un solo encuadre para todo el ciclo: la caja de A y B juntas. Es lo que
   impide que la figura cambie de tamaño a mitad de repetición. */
function marco(id, recorta){
  var clave = id + (recorta ? "|m" : "");
  if (marcos[clave]) return marcos[clave];
  var e = POSES[id], ang = (e.camara || 0) * Math.PI/180;
  montarAparato(id);
  pivote.rotation.y = ang; centro.position.set(0,0,0);
  caja.makeEmpty();
  [completa(id,"A"), completa(id,"B")].forEach(function(p){
    poner(p);
    tmp.setFromObject(man, true); caja.union(tmp);
    montaje.fijos.forEach(function(o){ tmp.setFromObject(o, true); caja.union(tmp); });
  });
  /* Los ejercicios de cuello se encuadran como un BUSTO: el cuerpo entero
     dejaría la cabeza en veinte píxeles y el gesto es justo ahí. */
  if (e.busto || (ARQ[e.arquetipo]||{}).busto){
    caja.makeEmpty();
    [completa(id,"A"), completa(id,"B")].forEach(function(p){
      poner(p);
      ["head","neck","torso","l_arm","r_arm","l_elbow","r_elbow","l_wrist","r_wrist"]
        .forEach(function(n){ if (man[n]){ tmp.setFromObject(man[n].image, true); caja.union(tmp); } });
    });
  }
  caja.getSize(vT); caja.getCenter(vC);
  var off = new THREE.Vector3(-vC.x,-vC.y,-vC.z).applyAxisAngle(ejeY, -ang);
  var m = recorta ? 1.01 : 1.06;
  var prop = Math.max(vT.x/vT.y, recorta ? 0.34 : 0.40);
  marcos[clave] = {off:off, alto:vT.y/2*m, prop:prop, suelo:caja.min.y - vC.y, ang:ang};
  return marcos[clave];
}

function dibujar(id, pose, alto, recorta){
  var mk = marco(id, recorta);
  var H = Math.max(24, Math.round(alto)), W = Math.max(16, Math.round(H*mk.prop));
  if (lienzo.width !== W || lienzo.height !== H){
    lienzo.width = W; lienzo.height = H; ren.setSize(W,H,false);
  }
  centro.position.copy(mk.off);
  suelo.visible = !recorta;
  suelo.position.y = mk.suelo + mk.off.y + 0.004;
  pivote.rotation.y = mk.ang;
  cam.left = -mk.alto*mk.prop; cam.right = mk.alto*mk.prop;
  cam.top = mk.alto; cam.bottom = -mk.alto; cam.updateProjectionMatrix();
  poner(pose);
  ren.setClearColor(0x000000, 0);
  ren.render(escena, cam);
  return {w:W, h:H};
}

/* --------------------------------------------------------------------- caché */
var cache = {};
function imagen(id, k, alto, recorta){
  var clave = id + "|" + k.toFixed(3) + "|" + Math.round(alto) + "|" + (recorta?1:0) + "|" + tema();
  if (cache[clave]) return cache[clave];
  var A = completa(id,"A"), B = completa(id,"B");
  dibujar(id, k <= 0 ? A : (k >= 1 ? B : mezclar(A,B,k)), alto, recorta);
  return (cache[clave] = lienzo.toDataURL());
}
function tema(){ return document.documentElement.getAttribute("data-theme") || "light"; }

/* ---------------------------------------------------------------- movimiento */
/* El ritmo sale del `type` que cada ejercicio ya tiene en EX: un press no baja
   igual de rápido que sube, y esa asimetría es la mitad de lo que hace que una
   animación se lea como profesional. */
function ritmo(id){
  var t = (window.EX && window.EX[id] && window.EX[id].type) || "reps";
  if (t === "hold" || t === "hold_side") return {T:4.2, tipo:"sostiene"};
  if (t === "cardio") return {T:1.6, tipo:"ciclo"};
  return {T:2.9, tipo:"rep"};
}
function fase(r, t){
  var u = (t % r.T) / r.T;
  if (r.tipo === "sostiene"){
    /* entra a la postura y se queda, con una respiración muy leve */
    if (u < 0.18) return suave(u/0.18);
    return 1 - 0.035*(0.5 - 0.5*Math.cos((u-0.18)/0.82 * Math.PI*2));
  }
  if (r.tipo === "ciclo") return 0.5 - 0.5*Math.cos(u*Math.PI*2);
  if (u < 0.48) return suave(u/0.48);            // excéntrica, lenta
  if (u < 0.57) return 1;                        // pausa abajo
  if (u < 0.88) return 1 - suave((u-0.57)/0.31); // concéntrica, rápida
  return 0;                                      // pausa arriba
}
function suave(x){ return x*x*(3-2*x); }

var vivos = [], bucle = null;
function quieto(){
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function latir(ahora){
  bucle = requestAnimationFrame(latir);
  var t = ahora/1000;
  vivos.forEach(function(v){
    if (!v.visible || !v.el.isConnected) return;
    var k = fase(v.r, t);
    var d = dibujar(v.id, mezclar(v.A, v.B, k), v.alto, false);
    if (v.cnv.width !== d.w || v.cnv.height !== d.h){ v.cnv.width = d.w; v.cnv.height = d.h; }
    v.ctx.clearRect(0,0,d.w,d.h);
    v.ctx.drawImage(lienzo, 0, 0);
  });
  vivos = vivos.filter(function(v){ return v.el.isConnected; });
  if (!vivos.length){ cancelAnimationFrame(bucle); bucle = null; }
}

var mirilla = ("IntersectionObserver" in window)
  ? new IntersectionObserver(function(es){
      es.forEach(function(e){
        var v = vivos.find(function(x){ return x.el === e.target; });
        if (v) v.visible = e.isIntersecting;
      });
    }, {rootMargin:"120px"})
  : null;

/* ----------------------------------------------------------------- montaje */
function altoDe(el, porDefecto){
  var h = el.clientHeight || porDefecto;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  return Math.max(32, Math.round(h * dpr));
}

function montarUno(el){
  if (el.dataset.fig3dListo === "1") return;
  var id = el.dataset.fig3d;
  if (!POSES[id] || !hayWebGL){ el.dataset.fig3dListo = "1"; return; }
  el.dataset.fig3dListo = "1";
  if (!man) arrancar();

  var modo = el.dataset.modo || "fija";
  if (modo === "anim" && !quieto()){
    var cnv = document.createElement("canvas");
    cnv.style.cssText = "height:100%;width:auto;max-width:100%;display:block";
    el.innerHTML = ""; el.appendChild(cnv);
    var v = {el:el, cnv:cnv, ctx:cnv.getContext("2d"), id:id, visible:true,
             alto:altoDe(el,148), r:ritmo(id),
             A:completa(id,"A"), B:completa(id,"B")};
    vivos.push(v);
    if (mirilla) mirilla.observe(el);
    if (!bucle) bucle = requestAnimationFrame(latir);
    return;
  }
  var k = modo === "pose" ? (+el.dataset.k || 0) : 0;
  if (modo === "anim") k = 0;                       // movimiento reducido: primera postura
  var recorta = modo === "mini";
  var img = new Image();
  img.style.cssText = "height:100%;width:auto;max-width:100%;display:block";
  img.alt = "";
  img.src = imagen(id, k, altoDe(el, recorta ? 40 : 70), recorta);
  el.innerHTML = ""; el.appendChild(img);
}

function montar(raiz){
  (raiz || document).querySelectorAll("[data-fig3d]").forEach(montarUno);
}

if ("MutationObserver" in window){
  new MutationObserver(function(ms){
    var hay = false;
    ms.forEach(function(m){
      m.addedNodes.forEach(function(n){
        if (n.nodeType !== 1) return;
        if (n.hasAttribute && n.hasAttribute("data-fig3d")) hay = true;
        else if (n.querySelector && n.querySelector("[data-fig3d]")) hay = true;
      });
    });
    if (hay) montar();
  }).observe(document.documentElement, {childList:true, subtree:true});
}

/* el tema cambia en caliente: se vacía la caché y se repinta todo */
new MutationObserver(function(){
  cache = {}; repintar();
  document.querySelectorAll("[data-fig3d]").forEach(function(el){
    el.dataset.fig3dListo = "";
  });
  vivos = [];
  montar();
}).observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});

window.addEventListener("pagehide", function(){ if (bucle) cancelAnimationFrame(bucle); });

/* --------------------------------------------------------------------- API */
window.FIGURA3D = {
  has: function(id){ return hayWebGL && !!POSES[id]; },
  pies: function(id){ return (POSES[id] && POSES[id].pies) || []; },
  poses: function(id){ return (POSES[id] && POSES[id].pies || []).length || 2; },
  montar: montar,
  listo: true
};
montar();
