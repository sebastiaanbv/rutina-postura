/* poses.js -- los esqueletos.

   Cada ejercicio son 18 articulaciones por pose sobre la rejilla 0 0 240 160,
   mas su aparato. Nada de esto es un dibujo: figura.js saca de aqui la figura
   quieta, la miniatura y la animacion. Las medidas salen de §15 de DISENO.md.

   Convenio de las poses: la primera es la de reposo y la ultima la trabajada.
   Una pose solo declara lo que cambia; lo que falta se hereda de la anterior,
   asi que en un press de banca las piernas se escriben una vez.
   'effort' dice cual de los dos tramos es el esfuerzo y por tanto cual va
   rapido: "to" (por defecto) al ir hacia la ultima, "from" al volver. */
window.POSES={

/* ---------- peso corporal, vista frontal ---------- */
sentadilla_aire:{
  view:"front", ground:"floor", type:"reps", effort:"from", still:1,
  poses:[
    /* de pie */
    {pelvis:[120,90],chest:[120,58],neck:[120,44],head:[120,24],
     shoulderF:[99,56],elbowF:[97,80],wristF:[96,102],
     shoulderN:[141,56],elbowN:[143,80],wristN:[144,102],
     hipF:[110,90],kneeF:[109,116],ankleF:[109,143],toeF:[100,147],
     hipN:[130,90],kneeN:[131,116],ankleN:[131,143],toeN:[140,147]},
    /* abajo: cadera atras, rodillas abiertas, brazos al frente */
    {pelvis:[120,112],chest:[120,82],neck:[120,68],head:[120,48],
     shoulderF:[100,80],elbowF:[95,96],wristF:[106,87],
     shoulderN:[140,80],elbowN:[145,96],wristN:[134,87],
     hipF:[109,112],kneeF:[100,126],ankleF:[107,143],toeF:[99,147],
     hipN:[131,112],kneeN:[140,126],ankleN:[133,143],toeN:[141,147]}
  ],
  arrow:{joint:"pelvis",vec:[46,0],dir:1},
  captions:["De pie, pies al ancho de los hombros","Baja hasta que el muslo quede paralelo"]
},

/* ---------- banco + mancuernas ---------- */
press_banca_db:{
  view:"side", facing:-1, ground:"floor", type:"reps",
  poses:[
    /* abajo: codos abiertos, mancuernas a la altura del pecho */
    {pelvis:[126,94],chest:[158,94],neck:[172,94],head:[190,92],
     shoulderF:[158,86],elbowF:[148,74],wristF:[154,58],
     shoulderN:[157,101],elbowN:[147,89],wristN:[153,73],
     hipF:[128,96],kneeF:[109,114],ankleF:[105,140],toeF:[93,145],
     hipN:[124,98],kneeN:[104,116],ankleN:[100,142],toeN:[88,147]},
    /* arriba: brazos extendidos */
    {shoulderF:[158,86],elbowF:[156,66],wristF:[154,44],
     shoulderN:[157,101],elbowN:[155,81],wristN:[153,59]}
  ],
  props:[{kind:"bench",x:110,y:108,w:94},
         {kind:"dumbbell",at:"wristF",along:"elbowF",z:"back"},
         {kind:"dumbbell",at:"wristN",along:"elbowN"}],
  arrow:{joint:"wristN",vec:[-34,0]},
  captions:["Mancuernas a la altura del pecho, codos abiertos","Empuja hasta extender los brazos"]
},

/* ---------- maquina + polea ---------- */
jalon_pecho:{
  view:"side", facing:-1, ground:"floor", type:"reps",
  poses:[
    /* arriba: brazos extendidos, hombros estirados */
    {pelvis:[156,102],chest:[152,70],neck:[151,55],head:[147,36],
     shoulderF:[156,66],elbowF:[138,49],wristF:[127,30],
     shoulderN:[148,69],elbowN:[130,52],wristN:[119,33],
     hipF:[158,106],kneeF:[133,114],ankleF:[131,140],toeF:[117,145],
     hipN:[154,108],kneeN:[128,116],ankleN:[126,142],toeN:[112,147]},
    /* abajo: barra al pecho, codos a los costados */
    {shoulderF:[156,66],elbowF:[150,89],wristF:[130,77],
     shoulderN:[148,69],elbowN:[142,92],wristN:[122,80]}
  ],
  props:[{kind:"post",x:66,y0:10,y1:150,w:10},
         {kind:"beam",a:[66,16],b:[118,16],w:9},
         {kind:"stack",x:58,y:64,w:18,h:76},
         {kind:"cable",from:[118,21],to:"wristN",w:4},
         {kind:"chair",x:138,y:112,w:46,back:0},
         {kind:"beam",a:[126,103],b:[152,103],w:8,z:"front"},
         {kind:"bar",at:"wristN",len:38,tilt:-8}],
  arrow:{joint:"wristN",vec:[-30,0]},
  captions:["Brazos extendidos, hombros estirados","Lleva la barra al pecho sin echar el cuerpo atras"]
},

/* ---------- cuello, sentado ---------- */
chin_tuck:{
  view:"side", facing:-1, ground:"floor", type:"reps",
  poses:[
    /* cabeza adelantada */
    {pelvis:[156,100],chest:[152,68],neck:[151,53],head:[135,42],
     shoulderF:[156,64],elbowF:[150,86],wristF:[132,96],
     shoulderN:[148,67],elbowN:[142,89],wristN:[124,99],
     hipF:[158,104],kneeF:[133,112],ankleF:[131,138],toeF:[117,143],
     hipN:[154,106],kneeN:[128,114],ankleN:[126,140],toeN:[112,145]},
    /* menton atras, nuca larga */
    {head:[150,36]}
  ],
  props:[{kind:"chair",x:118,y:110,w:66,backX:176,back:50}],
  arrow:{joint:"head",off:22},
  captions:["Cabeza adelantada, la de siempre","Menton atras, sin subir la barbilla"]
},

/* ---------- estiramiento sostenido ---------- */
flexor_cadera:{
  view:"side", facing:-1, ground:"floor", type:"hold",
  poses:[
    /* medio arrodillado, cadera neutra */
    {pelvis:[126,120],chest:[124,88],neck:[123,73],head:[118,55],
     shoulderF:[128,84],elbowF:[122,106],wristF:[106,118],
     shoulderN:[120,87],elbowN:[114,109],wristN:[98,121],
     hipF:[130,124],kneeF:[150,143],ankleF:[174,147],toeF:[186,149],
     hipN:[122,124],kneeN:[96,120],ankleN:[94,144],toeN:[80,148]},
    /* cadera adelante: el estiramiento */
    {pelvis:[136,117],chest:[135,85],neck:[134,70],head:[129,52],
     shoulderF:[139,81],elbowF:[133,103],wristF:[117,115],
     shoulderN:[131,84],elbowN:[125,106],wristN:[109,118],
     hipF:[140,121],kneeF:[150,143],
     hipN:[132,121],kneeN:[106,119],ankleN:[94,144]}
  ],
  captions:["Medio arrodillado, tronco recto","Lleva la cadera adelante y sostiene"]
},

/* ---------- banda ---------- */
remo_banda:{
  view:"side", facing:-1, ground:"floor", type:"reps",
  poses:[
    /* brazos extendidos al frente */
    {pelvis:[128,90],chest:[126,58],neck:[125,43],head:[120,25],
     shoulderF:[130,54],elbowF:[108,60],wristF:[88,65],
     shoulderN:[122,57],elbowN:[100,63],wristN:[80,68],
     hipF:[132,92],kneeF:[130,118],ankleF:[128,142],toeF:[114,146],
     hipN:[124,94],kneeN:[122,120],ankleN:[120,144],toeN:[106,148]},
    /* codos atras, manos a las costillas */
    {elbowF:[136,76],wristF:[116,71],
     elbowN:[128,79],wristN:[108,74]}
  ],
  props:[{kind:"post",x:34,y0:26,y1:150,w:9},
         {kind:"band",from:[39,62],to:"wristF",rest:52,z:"back"},
         {kind:"band",from:[39,68],to:"wristN",rest:50,z:"front"}],
  arrow:{joint:"wristN",off:17},
  captions:["Brazos extendidos, banda tensa","Codos atras, junta las escapulas"]
}

};
