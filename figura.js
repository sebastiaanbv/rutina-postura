/* figura.js -- el renderizador de las figuras.

   Una pose no es un dibujo: es un esqueleto de 18 articulaciones sobre la
   rejilla 0 0 240 160 (DISENO.md §15). De ahi salen las tres cosas que la app
   necesita -- la figura quieta, la miniatura y la animacion -- con la misma
   proporcion, las mismas articulaciones y la misma profundidad.

   El movimiento se interpola por cinematica directa (angulo y longitud por
   hueso, no lerp de coordenadas: eso acortaria el antebrazo un 29% a mitad de
   un giro de 90 grados) y se reproduce con SMIL, para que el tiempo lo lleve
   el navegador y no haya un bucle en JS. §7 de DISENO sigue en pie. */
(function(){
"use strict";

var FLOOR=150;            /* el suelo, unico para todas las figuras */
var uid=0;

/* ============================ geometria ============================ */
function dist(a,b){var x=b[0]-a[0],y=b[1]-a[1];return Math.sqrt(x*x+y*y);}
function shortest(d){while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;}
function n1(v){return (Math.round(v*10)/10);}
function xy(p){return n1(p[0])+" "+n1(p[1]);}
function arcTo(r,p){return "A"+n1(r)+" "+n1(r)+" 0 0 0 "+xy(p);}

/* Un hueso es una capsula conica: dos circulos de radio r0 y r1 unidos por sus
   tangentes exteriores, con los extremos cerrados en dos medios arcos. Como el
   arranque de cada hueso tiene el mismo radio que el final del anterior, la
   union sale lisa a cualquier angulo y no hace falta un disco encima: es lo que
   mata la muesca del codo que los remates redondos no podian evitar.
   El numero de comandos del path es fijo, que es lo que permite luego
   interpolar la 'd' con SMIL. */
function bone(p0,r0,p1,r1){
  var L=dist(p0,p1); if(L<0.6)L=0.6;
  var dx=(p1[0]-p0[0])/L, dy=(p1[1]-p0[1])/L;
  var s=(r0-r1)/L; if(s>0.98)s=0.98; if(s<-0.98)s=-0.98;
  var c=Math.sqrt(1-s*s);
  var ux=-dy*c+dx*s, uy=dx*c+dy*s;      /* tangente por un lado */
  var vx= dy*c+dx*s, vy=-dx*c+dy*s;     /* y por el otro */
  var A=[p0[0]+ux*r0,p0[1]+uy*r0], B=[p1[0]+ux*r1,p1[1]+uy*r1];
  var C=[p1[0]+vx*r1,p1[1]+vy*r1], D=[p0[0]+vx*r0,p0[1]+vy*r0];
  var M1=[p1[0]+dx*r1,p1[1]+dy*r1], M0=[p0[0]-dx*r0,p0[1]-dy*r0];
  return "M"+xy(A)+"L"+xy(B)+arcTo(r1,M1)+arcTo(r1,C)+"L"+xy(D)+arcTo(r0,M0)+arcTo(r0,A)+"Z";
}
function disc(c,r){
  return "M"+n1(c[0]-r)+" "+n1(c[1])+"A"+n1(r)+" "+n1(r)+" 0 0 1 "+n1(c[0]+r)+" "+n1(c[1])+
         "A"+n1(r)+" "+n1(r)+" 0 0 1 "+n1(c[0]-r)+" "+n1(c[1])+"Z";
}
function rectP(x,y,w,h,r){
  r=r||0; if(r>h/2)r=h/2; if(r>w/2)r=w/2;
  if(!r) return "M"+n1(x)+" "+n1(y)+"h"+n1(w)+"v"+n1(h)+"h"+n1(-w)+"Z";
  return "M"+n1(x+r)+" "+n1(y)+"h"+n1(w-2*r)+"a"+n1(r)+" "+n1(r)+" 0 0 1 "+n1(r)+" "+n1(r)+
         "v"+n1(h-2*r)+"a"+n1(r)+" "+n1(r)+" 0 0 1 "+n1(-r)+" "+n1(r)+
         "h"+n1(-(w-2*r))+"a"+n1(r)+" "+n1(r)+" 0 0 1 "+n1(-r)+" "+n1(-r)+
         "v"+n1(-(h-2*r))+"a"+n1(r)+" "+n1(r)+" 0 0 1 "+n1(r)+" "+n1(-r)+"Z";
}

/* ============================ el esqueleto ============================ */
/* 18 articulaciones. N = miembro cercano al espectador, F = lejano. */
var PARENT={chest:"pelvis",neck:"chest",head:"neck",
  shoulderN:"chest",elbowN:"shoulderN",wristN:"elbowN",
  shoulderF:"chest",elbowF:"shoulderF",wristF:"elbowF",
  hipN:"pelvis",kneeN:"hipN",ankleN:"kneeN",toeN:"ankleN",
  hipF:"pelvis",kneeF:"hipF",ankleF:"kneeF",toeF:"ankleF"};
/* orden topologico: el padre siempre antes que el hijo */
var CHAIN=["chest","neck","head",
  "shoulderF","elbowF","wristF","shoulderN","elbowN","wristN",
  "hipF","kneeF","ankleF","toeF","hipN","kneeN","ankleN","toeN"];

/* [grupo, de, a, radio proximal, radio distal, halo]
   halo 0 = hueso interior (clavicula, cresta iliaca): esta dentro de la masa
   del tronco, y rodearlo del color del fondo dibujaria un contorno fantasma
   dentro del torso. */
var BONES=[
  ["legF","pelvis","hipF",13,9,0],["legF","hipF","kneeF",9,7.5,1],
  ["legF","kneeF","ankleF",7.5,5,1],["legF","ankleF","toeF",5,3.5,1],
  ["armF","chest","shoulderF",12,7,0],["armF","shoulderF","elbowF",7,6,1],
  ["armF","elbowF","wristF",6,5,1],
  ["torso","pelvis","waist",13,11,1],["torso","waist","chest",11,13,1],
  ["torso","chest","neck",8,6.5,1],["torso","neck","head",6.5,6.5,1],
  ["legN","pelvis","hipN",13,9,0],["legN","hipN","kneeN",9,7.5,1],
  ["legN","kneeN","ankleN",7.5,5,1],["legN","ankleN","toeN",5,3.5,1],
  ["armN","chest","shoulderN",12,7,0],["armN","shoulderN","elbowN",7,6,1],
  ["armN","elbowN","wristN",6,5,1]
];
/* discos sueltos: manos y cabeza */
var DISCS=[["armF","wristF",5.5],["torso","head",11],["armN","wristN",5.5]];
/* De atras hacia delante. Dos decisiones:
   La pierna cercana va DEBAJO del tronco a proposito: el muslo nace dentro de
   la pelvis, y si se pintara encima su halo dibujaria el contorno del muslo
   por dentro del torso. Debajo, la pelvis lo tapa y la pierna sigue
   separandose de la lejana, que es para lo que estaba el halo.
   Y de frente no hay lado lejano: los dos brazos van encima del tronco y las
   dos piernas debajo, para que el recorte salga igual a izquierda y derecha.
   Con el orden lateral, el brazo de la izquierda quedaba mordido por el halo
   del torso y el de la derecha no. */
var ZORDER={side:["legF","armF","legN","torso","armN"],
            front:["legF","legN","torso","armF","armN"]};

function waistOf(p){
  return [p.pelvis[0]+(p.chest[0]-p.pelvis[0])*0.45,
          p.pelvis[1]+(p.chest[1]-p.pelvis[1])*0.45];
}

/* Interpolacion cinematica directa: la pelvis se traslada, y cada hueso
   interpola su angulo por el arco corto y su longitud. La cadena se
   reconstruye desde la pelvis hacia fuera, asi que ningun miembro cambia de
   tamano por el camino. */
function fk(A,B,t){
  var o={pelvis:[A.pelvis[0]+(B.pelvis[0]-A.pelvis[0])*t,
                 A.pelvis[1]+(B.pelvis[1]-A.pelvis[1])*t]};
  for(var i=0;i<CHAIN.length;i++){
    var j=CHAIN[i], pa=PARENT[j];
    var a0=A[j],a1=A[pa],b0=B[j],b1=B[pa];
    var angA=Math.atan2(a0[1]-a1[1],a0[0]-a1[0]), lenA=dist(a1,a0);
    var angB=Math.atan2(b0[1]-b1[1],b0[0]-b1[0]), lenB=dist(b1,b0);
    var an=angA+shortest(angB-angA)*t, le=lenA+(lenB-lenA)*t;
    o[j]=[o[pa][0]+Math.cos(an)*le, o[pa][1]+Math.sin(an)*le];
  }
  return o;
}

/* ============================ el aparato ============================ */
/* Tres clases y la diferencia importa: los fijos no se mueven, los sujetos
   viajan con una articulacion, y los enlaces se recalculan entre dos puntos en
   cada muestra. Una polea que tira, no una polea dibujada. */
var LINE="var(--diagram-line)";
function seg(a,b,w){ /* barra de aparato: rectangulo, esquinas vivas */
  var L=dist(a,b); if(L<0.4)L=0.4;
  var dx=(b[0]-a[0])/L, dy=(b[1]-a[1])/L, nx=-dy*w/2, ny=dx*w/2;
  return "M"+n1(a[0]+nx)+" "+n1(a[1]+ny)+"L"+n1(b[0]+nx)+" "+n1(b[1]+ny)+
         "L"+n1(b[0]-nx)+" "+n1(b[1]-ny)+"L"+n1(a[0]-nx)+" "+n1(a[1]-ny)+"Z";
}
function pt(p,pose){ return (typeof p==="string")?pose[p]:p; }

var PROPS={
  /* banco plano */
  bench:function(o){var x=o.x,y=o.y,w=o.w||96,h=o.h||9;
    return {z:o.z||"back",bb:[x,y,x+w,FLOOR],s:[
      {d:rectP(x,y,w,h,3),f:LINE},
      {d:seg([x+10,y+h],[x+6,FLOOR],5),f:LINE},
      {d:seg([x+w-10,y+h],[x+w-6,FLOOR],5),f:LINE}]};},
  /* silla o banco con respaldo */
  chair:function(o){var x=o.x,y=o.y,w=o.w||62,bh=o.back===undefined?44:o.back;
    var s=[{d:rectP(x,y,w,9,3),f:LINE},
      {d:seg([x+8,y+9],[x+5,FLOOR],5),f:LINE},
      {d:seg([x+w-8,y+9],[x+w-5,FLOOR],5),f:LINE}];
    if(bh) s.push({d:rectP(o.backX===undefined?x+w-9:o.backX,y-bh,9,bh+4,3),f:LINE});
    return {z:o.z||"back",bb:[x-2,y-bh-2,x+w+2,FLOOR],s:s};},
  /* torre de placas: es lo que hace que una maquina se lea como una maquina */
  stack:function(o){var x=o.x,y=o.y,w=o.w||18,h=o.h||70,i,d=rectP(x,y,w,h,3);
    for(i=1;i<5;i++) d+=rectP(x+2,y+h*i/5-1.5,w-4,3,1.5);
    return {z:o.z||"back",bb:[x,y,x+w,y+h],s:[{d:d,f:LINE}]};},
  /* colchoneta */
  mat:function(o){var x=o.x,w=o.w||150;
    return {z:"back",bb:[x,FLOOR-7,x+w,FLOOR],s:[{d:rectP(x,FLOOR-7,w,7,3),f:LINE}]};},
  /* poste, pared o bastidor vertical */
  post:function(o){var x=o.x,y0=o.y0===undefined?8:o.y0,y1=o.y1===undefined?FLOOR:o.y1,w=o.w||9;
    return {z:o.z||"back",bb:[x-w/2,y0,x+w/2,y1],s:[{d:rectP(x-w/2,y0,w,y1-y0,3),f:LINE}]};},
  /* travesano: barra fija, brazo de maquina, pared */
  beam:function(o){var a=o.a,b=o.b,w=o.w||8;
    return {z:o.z||"back",bb:[Math.min(a[0],b[0])-w,Math.min(a[1],b[1])-w,
                              Math.max(a[0],b[0])+w,Math.max(a[1],b[1])+w],
      s:[{d:seg(a,b,w),f:LINE}]};},
  /* mancuerna: viaja con la muneca y cruza la mano perpendicular al antebrazo */
  dumbbell:function(o,pose){
    var c=pose[o.at], ref=pose[o.along||PARENT[o.at]];
    var ax=c[0]-ref[0], ay=c[1]-ref[1], L=Math.sqrt(ax*ax+ay*ay)||1;
    var nx=-ay/L, ny=ax/L, h=o.len||9;
    var p0=[c[0]-nx*h,c[1]-ny*h], p1=[c[0]+nx*h,c[1]+ny*h];
    return {z:o.z||"front",bb:[c[0]-14,c[1]-14,c[0]+14,c[1]+14],s:[
      {d:seg(p0,p1,5),f:LINE},
      {d:disc(p0,5.5),f:LINE},{d:disc(p1,5.5),f:LINE}]};},
  /* Barra o asa. Dos formas: entre las dos manos (a,b) o centrada en una sola
     articulacion (at). De lado, una barra de jalon apunta hacia el espectador
     y las dos manos caen casi en el mismo punto, asi que dibujarla entre ellas
     saldria vertical; centrada y horizontal se lee por lo que es. */
  bar:function(o,pose){
    var a,b,e=o.ext===undefined?12:o.ext;
    if(o.at){ var c=pose[o.at], h=(o.len||34)/2, t=(o.tilt||0)*Math.PI/180;
      a=[c[0]-Math.cos(t)*h,c[1]-Math.sin(t)*h];
      b=[c[0]+Math.cos(t)*h,c[1]+Math.sin(t)*h]; e=0; }
    else { a=pt(o.a,pose); b=pt(o.b,pose); }
    var L=dist(a,b)||1, dx=(b[0]-a[0])/L, dy=(b[1]-a[1])/L;
    var p0=[a[0]-dx*e,a[1]-dy*e], p1=[b[0]+dx*e,b[1]+dy*e];
    return {z:o.z||"front",bb:[Math.min(p0[0],p1[0])-4,Math.min(p0[1],p1[1])-4,
                               Math.max(p0[0],p1[0])+4,Math.max(p0[1],p1[1])+4],
      s:[{d:seg(p0,p1,6),f:LINE}]};},
  /* cable: recto y tenso entre el ancla y la articulacion */
  cable:function(o,pose){var a=pt(o.from,pose), b=pt(o.to,pose);
    return {z:o.z||"back",bb:[Math.min(a[0],b[0])-3,Math.min(a[1],b[1])-3,
                              Math.max(a[0],b[0])+3,Math.max(a[1],b[1])+3],
      s:[{d:seg(a,b,o.w||3.5),f:LINE}]};},
  /* banda: la misma linea, pero con comba, y la comba se pierde al tensar */
  band:function(o,pose){var a=pt(o.from,pose), b=pt(o.to,pose);
    var L=dist(a,b), slack=Math.max(0,(o.rest||L)-L)*0.6+1.5;
    var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2+slack, w=1.7;
    var dx=(b[0]-a[0])/(L||1), dy=(b[1]-a[1])/(L||1);
    return {z:o.z||"back",bb:[Math.min(a[0],b[0])-4,Math.min(a[1],b[1])-4,
                              Math.max(a[0],b[0])+4,Math.max(Math.max(a[1],b[1]),my)+4],
      s:[{d:"M"+xy([a[0]-dy*w,a[1]+dx*w])+"Q"+xy([mx-dy*w,my+dx*w])+" "+xy([b[0]-dy*w,b[1]+dx*w])+
            "L"+xy([b[0]+dy*w,b[1]-dx*w])+"Q"+xy([mx+dy*w,my-dx*w])+" "+xy([a[0]+dy*w,a[1]-dx*w])+"Z",f:LINE}]};},
  /* escotilla para el aparato heredado que no compensa parametrizar */
  raw:function(o){return {z:o.z||"back",bb:o.bb||[0,0,240,160],s:[{d:o.d,f:o.f||LINE}]};}
};

/* ============================ una pose entera ============================ */
function shapes(pose,cfg){
  var out=[],i,g,b,k;
  var p={}; for(k in pose) p[k]=pose[k]; p.waist=waistOf(pose);
  var mini=!!cfg.mini, k1=mini?1.14:1;
  var ink="var(--diagram-ink)";
  var far=(cfg.view==="side"&&!mini)?"var(--diagram-ink-far)":ink;
  var props=cfg.props||[];

  function pushProps(z){
    for(var a=0;a<props.length;a++){
      var o=props[a], gen=PROPS[o.kind]; if(!gen) continue;
      var r=gen(o,p); if((r.z||"back")!==z) continue;
      for(var j=0;j<r.s.length;j++) out.push(r.s[j]);
    }
  }
  if(!mini) pushProps("back");
  /* Cada miembro se pinta dos veces: primero un halo del color del fondo y
     encima el relleno. En una silueta plana un brazo pegado al torso se funde
     con el, y el halo es lo que lo despega. Va por grupo entero -- brazo, no
     hueso -- para que el relleno del hueso siguiente tape el halo del anterior
     y no salga una costura en el codo. */
  var HALO="var(--diagram-bg)";
  var order=ZORDER[cfg.view==="front"?"front":"side"];
  for(g=0;g<order.length;g++){
    var grp=order[g], fill=(grp==="legF"||grp==="armF")?far:ink, ds=[], hs=[], d;
    for(i=0;i<BONES.length;i++){ b=BONES[i]; if(b[0]!==grp) continue;
      d=bone(p[b[1]],b[3]*k1,p[b[2]],b[4]*k1); ds.push(d); if(b[5]) hs.push(d); }
    for(i=0;i<DISCS.length;i++){ b=DISCS[i]; if(b[0]!==grp) continue;
      d=disc(p[b[1]],b[2]*k1); ds.push(d); hs.push(d); }
    for(i=0;i<hs.length;i++) out.push({d:hs[i],f:HALO,s:HALO,w:3});
    for(i=0;i<ds.length;i++) out.push({d:ds[i],f:fill});
    if(grp==="torso"&&!mini) pushEyes(out,p,cfg);
  }
  if(!mini) pushProps("front");
  return out;
}
/* El ojo gira con la cabeza: el desfase se rota por el angulo del cuello, asi
   que en una figura tumbada mira hacia donde tiene que mirar. */
function pushEyes(out,p,cfg){
  var a=Math.atan2(p.head[1]-p.neck[1],p.head[0]-p.neck[0])+Math.PI/2;
  var ca=Math.cos(a), sa=Math.sin(a), f=cfg.facing||1;
  var eyes=(cfg.view==="front")?[[-5,-2.5],[5,-2.5]]:[[6*f,-2.5]];
  for(var i=0;i<eyes.length;i++){
    var ox=eyes[i][0],oy=eyes[i][1];
    out.push({d:disc([p.head[0]+ox*ca-oy*sa, p.head[1]+ox*sa+oy*ca],2.8),
              f:"var(--diagram-eye)"});
  }
}

/* ============================ el ritmo ============================ */
/* Un press no baja igual de rapido que sube. El perfil sale del type que el
   ejercicio ya declara en EX: a = pausa abajo, c = concentrica, b = pausa
   arriba, e = excentrica, en segundos. */
var TEMPO={reps:{a:0.35,c:0.9,b:0.25,e:1.4},
           cardio:{a:0.12,c:0.5,b:0.1,e:0.55},
           hold:{a:0.5,c:1.1,b:2.4,e:0.9}};
function tempoOf(t){
  if(t==="hold"||t==="hold_side") return TEMPO.hold;
  if(t==="cardio") return TEMPO.cardio;
  return TEMPO.reps;
}
var SUB=[0,0.25,0.5,0.75,1];
/* 11 muestras por ciclo. Entre dos muestras SMIL interpola recto, y con pasos
   de 22 grados el error de longitud queda por debajo del 2%. */
function timeline(tp,effort){
  /* el esfuerzo es el tramo rapido; en una sentadilla es el de vuelta */
  var c=tp.c, e=tp.e; if(effort==="from"){ c=tp.e; e=tp.c; }
  var T=tp.a+c+tp.b+e, kt=[], s=[], i, acc;
  kt.push(0); s.push(0);
  kt.push(tp.a/T); s.push(0);
  for(i=1;i<SUB.length;i++){ kt.push((tp.a+c*SUB[i])/T); s.push(SUB[i]); }
  acc=tp.a+c+tp.b; kt.push(acc/T); s.push(1);
  for(i=1;i<SUB.length;i++){ kt.push((acc+e*SUB[i])/T); s.push(1-SUB[i]); }
  var HOLD="0 0 1 1", IN=".42 0 1 1", MID="0 0 1 1", OUT="0 0 .58 1";
  return {T:T,keyTimes:kt,keySplines:[HOLD,IN,MID,MID,OUT,HOLD,IN,MID,MID,OUT],s:s};
}
/* s en [0,1] recorre las poses clave: con tres poses, 0,5 es la de en medio */
function poseAt(list,s){
  if(list.length===1) return list[0];
  var n=list.length-1, u=s*n, i=Math.min(Math.floor(u),n-1);
  return fk(list[i],list[i+1],u-i);
}

/* ============================ la flecha ============================ */
/* Deja de ser un palo que salta de sitio: se traza sobre la trayectoria real
   de la articulacion y se dibuja durante la fase de esfuerzo. */
function arrowPts(cfg,list){
  var sp=cfg.arrow; if(!sp) return null;
  var dir=sp.dir||(cfg.effort==="from"?-1:1);
  var j=sp.joint, off=sp.off===undefined?15:sp.off, pts=[], i;
  for(i=0;i<SUB.length;i++){
    var q=poseAt(list,dir===-1?1-SUB[i]:SUB[i]);
    var c=q[j];
    if(sp.vec){ pts.push([c[0]+sp.vec[0], c[1]+sp.vec[1]]); continue; }
    var o=q[sp.from||"pelvis"];
    var dx=c[0]-o[0], dy=c[1]-o[1], L=Math.sqrt(dx*dx+dy*dy)||1;
    pts.push([c[0]+dx/L*off, c[1]+dy/L*off]);
  }
  if(dist(pts[0],pts[4])<9) return null;
  pts.dir=dir; return pts;
}
function arrowSVG(cfg,list,tl,id){
  var sp=cfg.arrow, pts=arrowPts(cfg,list); if(!pts) return "";
  var dir=pts.dir;
  var a=pts[0], m=pts[2], b=pts[4];
  /* una flecha de 12 unidades no se lee: se estira por los dos extremos hasta
     un minimo, siguiendo la misma direccion del recorrido */
  var span=dist(a,b), MIN=30;
  if(span<MIN){ var ex=(MIN-span)/2/span;
    var vx=(b[0]-a[0])*ex, vy=(b[1]-a[1])*ex;
    a=[a[0]-vx,a[1]-vy]; b=[b[0]+vx,b[1]+vy]; }
  var cx=2*m[0]-(a[0]+b[0])/2, cy=2*m[1]-(a[1]+b[1])/2;
  var len=dist(a,[cx,cy])+dist([cx,cy],b);
  var d="M"+xy(a)+"Q"+n1(cx)+" "+n1(cy)+" "+xy(b);
  var mk="fgmk"+id, kt=tl.keyTimes, L=n1(len);
  var kts=[kt[0],kt[1],kt[5],kt[6],1].map(function(v){return n1(v*1000)/1000;}).join(";");
  /* la flecha se dibuja mientras el cuerpo recorre ese tramo, y se retira en
     el de vuelta: nunca esta ahi contradiciendo al movimiento */
  var vals=(dir===-1)?("0;0;"+L+";"+L+";0"):(L+";"+L+";0;0;"+L);
  /* y solo esta ahi mientras el cuerpo hace ese tramo: fuera de el se apaga,
     para que nunca senale en direccion contraria a lo que se ve */
  var op=(dir===-1)?"1;0;0;0;1":"0;1;1;1;0";
  var dur=n1(tl.T)+"s";
  return '<defs><marker id="'+mk+'" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="2.2" '+
    'markerHeight="2.2" orient="auto"><path d="M0 0.8 L10 5 L0 9.2 Z" fill="var(--diagram-hi)"/></marker></defs>'+
    '<g><animate attributeName="opacity" values="'+op+'" keyTimes="'+kts+'" dur="'+dur+
    '" repeatCount="indefinite" calcMode="linear"/>'+
    '<path d="'+d+'" fill="none" stroke="var(--diagram-hi)" stroke-width="4.5" stroke-linecap="round" '+
    'marker-end="url(#'+mk+')" stroke-dasharray="'+L+' '+n1(len+2)+'">'+
    '<animate attributeName="stroke-dashoffset" values="'+vals+
    '" keyTimes="'+kts+'" dur="'+dur+'" repeatCount="indefinite" calcMode="linear"/></path></g>';
}

/* ============================ suelo y sombra ============================ */
/* Nadie flota: bajo cada punto que apoya va una elipse blanda. Se calcula del
   esqueleto, asi que el que esta tumbado apoya en toda la espalda y el que
   esta colgado no apoya en nada. */
var CONTACT=["toeN","toeF","ankleN","ankleF","wristN","wristF","kneeN","kneeF",
             "pelvis","chest","head","elbowN","elbowF"];
function groundSVG(cfg,list){
  if(cfg.ground==="none") return "";
  var seen={}, out="";
  for(var k=0;k<list.length;k++){ var p=list[k];
    for(var i=0;i<CONTACT.length;i++){ var c=p[CONTACT[i]];
      if(!c||c[1]<FLOOR-11) continue;
      var b=Math.round(c[0]/13); if(seen[b]) continue; seen[b]=1;
      out+='<ellipse cx="'+n1(c[0])+'" cy="'+n1(FLOOR+1.5)+'" rx="13" ry="2.6" fill="var(--diagram-shadow)"/>';
    }
  }
  return out+'<path d="'+seg([12,FLOOR],[228,FLOOR],3.5)+'" fill="'+LINE+'"/>';
}

/* ============================ encuadre ============================ */
/* Un solo viewBox por ejercicio, calculado sobre TODAS las poses juntas. Es lo
   que impide que la figura salte de escala a mitad del movimiento. */
function viewBox(cfg,list){
  var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,i,k,p;
  for(i=0;i<list.length;i++){ p=list[i];
    for(k in p){ if(!p[k]||typeof p[k][0]!=="number") continue;
      if(p[k][0]<x0)x0=p[k][0]; if(p[k][0]>x1)x1=p[k][0];
      if(p[k][1]<y0)y0=p[k][1]; if(p[k][1]>y1)y1=p[k][1]; }
  }
  x0-=20;x1+=20;y0-=20;y1+=20;
  if(!cfg.mini){
    if(cfg.ground!=="none") y1=Math.max(y1,FLOOR+6);
    var ap=arrowPts(cfg,list);
    if(ap) for(i=0;i<ap.length;i++){
      x0=Math.min(x0,ap[i][0]-9); x1=Math.max(x1,ap[i][0]+9);
      y0=Math.min(y0,ap[i][1]-9); y1=Math.max(y1,ap[i][1]+9); }
    var props=cfg.props||[];
    for(i=0;i<props.length;i++){ var gen=PROPS[props[i].kind]; if(!gen) continue;
      var b=gen(props[i],list[0]).bb;
      x0=Math.min(x0,b[0]-3); y0=Math.min(y0,b[1]-3);
      x1=Math.max(x1,b[2]+3); y1=Math.max(y1,b[3]+3); }
  }
  return n1(x0)+" "+n1(y0)+" "+n1(x1-x0)+" "+n1(y1-y0);
}
function wrap(vb,inner){
  return '<svg viewBox="'+vb+'" xmlns="http://www.w3.org/2000/svg" '+
    'preserveAspectRatio="xMidYMid meet">'+inner+'</svg>';
}

/* ============================ API ============================ */
var memo={};
function poses(){ return window.POSES||{}; }
/* Una pose solo declara lo que cambia: lo que no aparece se hereda de la
   anterior. En un press de banca las piernas se escriben una vez. */
function fill(list){
  var out=[],i,k,prev=null;
  for(i=0;i<list.length;i++){
    var p={};
    if(prev) for(k in prev) p[k]=prev[k];
    for(k in list[i]) p[k]=list[i][k];
    out.push(p); prev=p;
  }
  return out;
}
var cache={};
function cfgOf(id){
  if(cache[id]!==undefined) return cache[id];
  var f=poses()[id];
  if(!f||!f.poses||!f.poses.length) return (cache[id]=null);
  return (cache[id]={view:f.view||"side",facing:f.facing||1,ground:f.ground||"floor",
          props:f.props||[],arrow:f.arrow,type:f.type,effort:f.effort||"to",
          poses:fill(f.poses),still:f.still||0,captions:f.captions||[]});
}
function attrs(sh){
  return ' fill="'+sh.f+'"'+(sh.s?(' stroke="'+sh.s+'" stroke-width="'+sh.w+
    '" stroke-linejoin="round"'):'');
}
function paths(pose,cfg){
  var s=shapes(pose,cfg),o="",i;
  for(i=0;i<s.length;i++) o+='<path d="'+s[i].d+'"'+attrs(s[i])+'/>';
  return o;
}
function reduced(){
  return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

window.FIGURA={
  has:function(id){return !!cfgOf(id);},
  captions:function(id){var c=cfgOf(id);return c?c.captions:null;},
  poseCount:function(id){var c=cfgOf(id);return c?c.poses.length:0;},

  /* la figura quieta, para la fila de la lista y la tira numerada */
  still:function(id,i){
    var c=cfgOf(id); if(!c) return "";
    var p=c.poses[i===undefined?c.still:i]||c.poses[0];
    return wrap(viewBox(c,c.poses), groundSVG(c,[p])+paths(p,c));
  },

  /* la miniatura de 46 px: mismo esqueleto, sin ojo, sin aparato, sin flecha,
     trazo mas grueso y recortada al cuerpo. Sale gratis de ser parametrico. */
  mini:function(id){
    var c=cfgOf(id); if(!c) return "";
    var m={view:c.view,facing:c.facing,ground:"none",props:[],mini:true};
    var p=c.poses[c.still]||c.poses[0];
    return wrap(viewBox(m,[p]), paths(p,m));
  },

  /* la figura haciendo el ejercicio */
  anim:function(id){
    var c=cfgOf(id); if(!c) return "";
    if(c.poses.length<2||reduced()) return window.FIGURA.still(id,0);
    if(memo[id]) return memo[id];
    var tl=timeline(tempoOf(c.type),c.effort), n=++uid, sm=[], i, k;
    for(i=0;i<tl.s.length;i++) sm.push(shapes(poseAt(c.poses,tl.s[i]),c));
    var kt=tl.keyTimes.map(function(v){return n1(v*1000)/1000;}).join(";");
    var ks=tl.keySplines.join(";"), dur=n1(tl.T)+"s", body="";
    for(k=0;k<sm[0].length;k++){
      var vals=[], mov=false;
      for(i=0;i<sm.length;i++){ vals.push(sm[i][k].d); if(sm[i][k].d!==sm[0][k].d) mov=true; }
      body+='<path d="'+sm[0][k].d+'"'+attrs(sm[0][k]);
      body+= mov ? '><animate attributeName="d" values="'+vals.join(";")+'" keyTimes="'+kt+
                   '" keySplines="'+ks+'" calcMode="spline" dur="'+dur+
                   '" repeatCount="indefinite"/></path>'
                 : '/>';
    }
    var out=wrap(viewBox(c,c.poses),
      groundSVG(c,c.poses)+body+arrowSVG(c,c.poses,tl,n));
    memo[id]=out; return out;
  }
};
})();
