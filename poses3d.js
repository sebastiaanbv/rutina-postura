/* ============================================================================
   poses3d.js — los 91 ejercicios como ángulos, no como dibujos

   Cada ejercicio guarda solo los ángulos en los que se aparta de su ARQUETIPO.
   Trece arquetipos cubren los 91: eso convierte 182 posturas en 13 problemas
   y 91 ajustes.

   CONVENIOS DE ESTE RIG (aprendidos midiendo, no mirando):

   · body.turn = -90 es la orientación de reposo. Con ella, cámara 0° es
     FRONTAL y ±90° es PERFIL. El movimiento sagital —sentadilla, press,
     bisagra— solo se ve de perfil o en 3/4; de frente se pierde en
     profundidad.

   · CADERA Y RODILLA GIRAN EN EL MISMO SENTIDO. La tibia vuelve a la vertical
     cuando knee ≈ raise; con knee = raise − 15 queda 15° adelantada, que es lo
     que hace una persona. Con el signo contrario el muñeco no se agacha: se
     sienta en el suelo con las piernas estiradas.

   · El tobillo compensa: ankle.bend ≈ raise − knee, para que el pie quede
     plano en el suelo.

   · arm.raise: 0 cuelga · −90 horizontal al frente · −180 sobre la cabeza.
     arm.straddle: separa del cuerpo hacia el lado. elbow.bend: 0…150 flexión.

   · torso.bend: positivo = inclinarse adelante. Tope anatómico 60°.

   · "alza" sube la figura después de apoyarla, para sentarla en un banco o
     una silla. Sin ella, todo lo que está tumbado acaba en el suelo.
   ========================================================================= */
(function(){

var NEUTRA = {
  body:    {bend:0, tilt:0, turn:-90},
  torso:   {bend:2, tilt:0, turn:0},
  head:    {nod:-4, tilt:0, turn:0},
  l_arm:   {raise:-5, straddle:7, turn:0},   r_arm:   {raise:-5, straddle:7, turn:0},
  l_elbow: {bend:15},                        r_elbow: {bend:15},
  l_wrist: {bend:5, turn:0, tilt:0},         r_wrist: {bend:5, turn:0, tilt:0},
  l_leg:   {raise:0, straddle:5, turn:0},    r_leg:   {raise:0, straddle:5, turn:0},
  l_knee:  {bend:0},                         r_knee:  {bend:0},
  l_ankle: {bend:0, turn:0, tilt:0},         r_ankle: {bend:0, turn:0, tilt:0}
};

function base(d){
  var b = JSON.parse(JSON.stringify(NEUTRA));
  Object.keys(d||{}).forEach(function(j){ b[j] = Object.assign(b[j]||{}, d[j]); });
  return b;
}
/* espejo: mismos ángulos en los dos lados */
function dos(pre, v){ var o = {}; o["l_"+pre] = v; o["r_"+pre] = Object.assign({}, v); return o; }
function amb(o){                     /* aplica el mismo objeto a l_ y r_ */
  var r = {};
  Object.keys(o).forEach(function(k){
    r["l_"+k] = o[k]; r["r_"+k] = Object.assign({}, o[k]);
  });
  return r;
}
function une(){
  var r = {};
  for (var i = 0; i < arguments.length; i++){
    var o = arguments[i] || {};
    Object.keys(o).forEach(function(j){
      /* "alza" es un NÚMERO, no una articulación. Sin esta guarda,
         Object.assign({}, 0.30) devuelve {} y luego position.y += {} da NaN,
         que stepOnGround vuelve a leer en la siguiente figura: un solo
         ejercicio envenenaba a los 60 siguientes. */
      if (typeof o[j] === "number"){ r[j] = o[j]; return; }
      r[j] = Object.assign(r[j]||{}, o[j]);
    });
  }
  return r;
}

/* ==========================================================================
   LOS TRECE ARQUETIPOS
   ======================================================================== */
var ARQUETIPOS = {

  /* 1 */ sentadilla: {
    titulo:"Sentadilla y empuje de pierna", camara:-60, protagonista:"pelvis",
    amplitudMin:0.15, apoyos:["l_ankle","r_ankle"],
    exentos:[["muslo_i","torso"],["muslo_d","torso"],["muslo_i","antebrazo_i"],
             ["muslo_d","antebrazo_d"],["pierna_i","pierna_d"],["muslo_i","muslo_d"],
             ["pie_i","pie_d"],["muslo_i","pierna_d"],["muslo_d","pierna_i"]],
    base: base({ l_leg:{straddle:9,turn:-6}, r_leg:{straddle:9,turn:-6} })
  },

  /* 2 */ bisagra: {
    titulo:"Bisagra de cadera", camara:-90, protagonista:"head",
    amplitudMin:0.16, apoyos:["l_ankle","r_ankle"],
    exentos:[["antebrazo_i","muslo_i"],["antebrazo_d","muslo_d"],["mano_i","muslo_i"],
             ["mano_d","muslo_d"],["torso","muslo_i"],["torso","muslo_d"],
             ["cabeza","brazo_i"],["cabeza","brazo_d"]],
    base: base({ l_leg:{straddle:6}, r_leg:{straddle:6} })
  },

  /* 3 */ puente: {
    titulo:"Puente y empuje de cadera", camara:-90, protagonista:"pelvis",
    amplitudMin:0.055, apoyos:[],
    exentos:[["muslo_i","muslo_d"],["pierna_i","pierna_d"],["pie_i","pie_d"],
             ["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","pelvis"],
             ["antebrazo_d","pelvis"],["mano_i","pelvis"],["mano_d","pelvis"]],
    base: base({ body:{bend:90}, l_leg:{straddle:7}, r_leg:{straddle:7} })
  },

  /* 4 */ pierna_aislada: {
    titulo:"Pierna aislada, sentado o tumbado", camara:-90, protagonista:"l_ankle",
    amplitudMin:0.13, apoyos:[],
    exentos:[["muslo_i","muslo_d"],["pierna_i","pierna_d"],["pie_i","pie_d"],
             ["muslo_i","torso"],["muslo_d","torso"],["antebrazo_i","muslo_i"],
             ["antebrazo_d","muslo_d"],["mano_i","muslo_i"],["mano_d","muslo_d"]],
    base: base({ l_leg:{straddle:7}, r_leg:{straddle:7} })
  },

  /* 5 */ cadera_pie: {
    titulo:"Cadera de pie, balanceo y equilibrio", camara:-90, protagonista:"l_ankle",
    amplitudMin:0.14, apoyos:["r_ankle"],
    exentos:[["muslo_i","muslo_d"],["pierna_i","pierna_d"],["pie_i","pie_d"],
             ["muslo_i","antebrazo_i"],["muslo_d","antebrazo_d"]],
    base: base({})
  },

  /* 6 */ empuje_h: {
    titulo:"Empuje horizontal", camara:-60, protagonista:"l_wrist",
    amplitudMin:0.13, apoyos:[],
    exentos:[["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","torso"],
             ["antebrazo_d","torso"],["mano_i","torso"],["mano_d","torso"],
             ["muslo_i","muslo_d"],["pierna_i","pierna_d"],["pie_i","pie_d"],
             ["brazo_i","pelvis"],["brazo_d","pelvis"]],
    base: base({})
  },

  /* 7 */ empuje_v: {
    titulo:"Empuje vertical y hombro", camara:-25, protagonista:"l_wrist",
    amplitudMin:0.14, apoyos:["l_ankle","r_ankle"],
    exentos:[["brazo_i","torso"],["brazo_d","torso"],["brazo_i","cabeza"],
             ["brazo_d","cabeza"],["antebrazo_i","cabeza"],["antebrazo_d","cabeza"],
             ["mano_i","cabeza"],["mano_d","cabeza"],["brazo_i","cuello"],["brazo_d","cuello"]],
    base: base({})
  },

  /* 8 */ traccion_v: {
    titulo:"Tracción vertical", camara:-25, protagonista:"l_wrist",
    amplitudMin:0.15, apoyos:[],
    exentos:[["brazo_i","cabeza"],["brazo_d","cabeza"],["brazo_i","torso"],
             ["brazo_d","torso"],["antebrazo_i","cabeza"],["antebrazo_d","cabeza"],
             ["muslo_i","muslo_d"],["pierna_i","pierna_d"],["pie_i","pie_d"],
             ["antebrazo_i","torso"],["antebrazo_d","torso"]],
    base: base({})
  },

  /* 9 */ traccion_h: {
    titulo:"Tracción horizontal", camara:-55, protagonista:"l_wrist",
    amplitudMin:0.12, apoyos:["l_ankle","r_ankle"],
    exentos:[["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","torso"],
             ["antebrazo_d","torso"],["mano_i","torso"],["mano_d","torso"],
             ["antebrazo_i","muslo_i"],["antebrazo_d","muslo_d"],
             ["muslo_i","torso"],["muslo_d","torso"],["mano_i","muslo_i"],["mano_d","muslo_d"]],
    base: base({})
  },

  /* 10 */ codo: {
    titulo:"Codo aislado", camara:-70, protagonista:"l_wrist",
    amplitudMin:0.13, apoyos:["l_ankle","r_ankle"],
    exentos:[["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","torso"],
             ["antebrazo_d","torso"],["mano_i","torso"],["mano_d","torso"],
             ["antebrazo_i","cabeza"],["antebrazo_d","cabeza"],["mano_i","cabeza"],
             ["mano_d","cabeza"],["mano_i","muslo_i"],["mano_d","muslo_d"],
             ["antebrazo_i","muslo_i"],["antebrazo_d","muslo_d"],
             ["brazo_i","cabeza"],["brazo_d","cabeza"]],
    base: base({})
  },

  /* 11 */ hombro_fino: {
    titulo:"Hombro pequeño y movilidad torácica", camara:-30, protagonista:"l_wrist",
    amplitudMin:0.11, apoyos:["l_ankle","r_ankle"],
    exentos:[["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","torso"],
             ["antebrazo_d","torso"],["mano_i","torso"],["mano_d","torso"],
             ["brazo_i","cabeza"],["brazo_d","cabeza"],["antebrazo_i","cabeza"],
             ["antebrazo_d","cabeza"],["mano_i","mano_d"],["antebrazo_i","antebrazo_d"]],
    base: base({})
  },

  /* 12 */ core: {
    titulo:"Core, cuadrupedia y antirrotación", camara:-70, protagonista:"l_wrist",
    amplitudMin:0.09, apoyos:[],
    exentos:[["muslo_i","muslo_d"],["pierna_i","pierna_d"],["pie_i","pie_d"],
             ["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","torso"],
             ["antebrazo_d","torso"],["muslo_i","torso"],["muslo_d","torso"],
             ["antebrazo_i","muslo_i"],["antebrazo_d","muslo_d"],
             ["mano_i","torso"],["mano_d","torso"],["muslo_i","pierna_d"],["muslo_d","pierna_i"],
             ["antebrazo_i","antebrazo_d"],["mano_i","mano_d"]],
    base: base({})
  },

  /* 13 */ cuello: {
    titulo:"Cuello y cara", camara:-40, protagonista:"head",
    amplitudMin:0.022, sostiene:true, apoyos:["l_ankle","r_ankle"], busto:true,
    exentos:[["brazo_i","cabeza"],["brazo_d","cabeza"],["antebrazo_i","cabeza"],
             ["antebrazo_d","cabeza"],["mano_i","cabeza"],["mano_d","cabeza"],
             ["brazo_i","torso"],["brazo_d","torso"],["antebrazo_i","torso"],
             ["antebrazo_d","torso"],["mano_i","cuello"],["mano_d","cuello"],
             ["antebrazo_i","cuello"],["antebrazo_d","cuello"],["brazo_i","cuello"],
             ["brazo_d","cuello"],["mano_i","mano_d"]],
    base: base({})
  }
};

/* ==========================================================================
   LOS EJERCICIOS
   ======================================================================== */
var P = {};
function E(id, arq, cfg){ cfg.arquetipo = arq; P[id] = cfg; }

/* piezas reutilizables ---------------------------------------------------- */
var DE_PIE_BRAZOS = amb({arm:{raise:-4, straddle:6}, elbow:{bend:8}});
function sentadilla(prof, incl){          /* prof: 0…1 de profundidad */
  var raise = Math.round(84*prof), knee = Math.round(84*prof) - 15;
  if (knee < 0) knee = 0;
  return une(amb({leg:{raise:raise, straddle:9, turn:-6},
                  knee:{bend:knee},
                  ankle:{bend:Math.max(0, raise-knee)}}),
             {torso:{bend:incl===undefined?30:incl}});
}
/* La mancuerna se centra en la caja de la MANO —props3d.js la mide— y solo hay
   que decirle por dónde va la barra: de frente a espalda en un agarre normal,
   vertical en el goblet, a lo ancho del cuerpo en una barra. */
var MANC = function(en, eje, esc){
  return {tipo:"mancuerna", en:en||["l_wrist","r_wrist"], eje:eje||"frente", escala:esc};
};

/* ---- 1 · SENTADILLA (9) ------------------------------------------------- */
E("sentadilla_aire","sentadilla",{ camara:-60, aparato:[], apoyos:["l_ankle","r_ankle"],
  A: amb({arm:{raise:-8,straddle:8}, elbow:{bend:12}}),
  B: une(sentadilla(0.95,30), amb({arm:{raise:-88,straddle:6}, elbow:{bend:22}})),
  pies:["De pie, pies al ancho","Baja buscando rango"] });

E("sentadilla_goblet","sentadilla",{ camara:-60, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist"],"arriba")],
  A: amb({arm:{raise:-58,straddle:4,turn:10}, elbow:{bend:146}, wrist:{bend:-6}}),
  B: une(sentadilla(0.98,34), amb({arm:{raise:-58,straddle:4,turn:10},
        elbow:{bend:146}, wrist:{bend:-6}})),
  pies:["Mancuerna al pecho","Baja a la paralela"] });

E("sentadilla_silla","sentadilla",{ camara:-60, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"silla", apoya:["pelvis"]}],
  A: une(sentadilla(0.80,34), amb({arm:{raise:-80,straddle:6}, elbow:{bend:18}})),
  B: amb({arm:{raise:-14,straddle:7}, elbow:{bend:10}}),
  pies:["Sentado en la silla","De pie sin impulso"] });

E("sentadilla_smith","sentadilla",{ camara:-60, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"barra", en:["l_wrist"], eje:"lateral", largo:1.6}],
  A: amb({arm:{raise:-118,straddle:34}, elbow:{bend:96}, wrist:{bend:-14}}),
  B: une(sentadilla(0.92,22), amb({arm:{raise:-118,straddle:34}, elbow:{bend:96}, wrist:{bend:-14}})),
  pies:["Barra en la espalda","Baja a la paralela"] });

E("hack_squat","sentadilla",{ camara:-60, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: une({body:{bend:-16}}, amb({arm:{raise:-30,straddle:22}, elbow:{bend:96}})),
  B: une({body:{bend:-16}}, sentadilla(0.92,10),
         amb({arm:{raise:-30,straddle:22}, elbow:{bend:96}})),
  pies:["Espalda en el respaldo","Baja pasando la paralela"] });

E("prensa_inclinada","sentadilla",{ amplitudMin:0.09, protagonista:"l_knee",  camara:-90, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["torso","pelvis"]}],
  A: une({body:{bend:64}, alza:0.30},
         amb({leg:{raise:52,straddle:9}, knee:{bend:38}, ankle:{bend:14},
              arm:{raise:-16,straddle:26}, elbow:{bend:40}})),
  B: une({body:{bend:64}, alza:0.30},
         amb({leg:{raise:104,straddle:9}, knee:{bend:100}, ankle:{bend:6},
              arm:{raise:-16,straddle:26}, elbow:{bend:40}})),
  pies:["Piernas casi extendidas","Rodillas al pecho"] });

E("sentadilla_bulgara","sentadilla",{ camara:-90, apoyos:[], unilateral:true,
  aparato:[{tipo:"banco", apoya:["r_ankle"]}],
  A: une(amb({arm:{raise:-3,straddle:6}, elbow:{bend:6}}),
         {r_leg:{raise:-34,straddle:5}, r_knee:{bend:64}, r_ankle:{bend:-30},
          l_leg:{raise:14,straddle:5}, l_knee:{bend:10}, l_ankle:{bend:4}}),
  B: une(amb({arm:{raise:-3,straddle:6}, elbow:{bend:6}}), {torso:{bend:16},
          r_leg:{raise:-24,straddle:5}, r_knee:{bend:96}, r_ankle:{bend:-40},
          l_leg:{raise:74,straddle:5}, l_knee:{bend:62}, l_ankle:{bend:12}}),
  pies:["Pie atrás en el banco","Baja con la pierna de delante"] });

E("zancada_estatica","sentadilla",{ camara:-90, apoyos:["l_ankle"], unilateral:true,
  aparato:[], A: une(amb({arm:{raise:-3,straddle:6}, elbow:{bend:6}}),
         {l_leg:{raise:20,straddle:5}, l_knee:{bend:14}, l_ankle:{bend:6},
          r_leg:{raise:-22,straddle:5}, r_knee:{bend:18}, r_ankle:{bend:-14}}),
  B: une(amb({arm:{raise:-3,straddle:6}, elbow:{bend:6}}), {torso:{bend:10},
          l_leg:{raise:86,straddle:5}, l_knee:{bend:76}, l_ankle:{bend:10},
          r_leg:{raise:-30,straddle:5}, r_knee:{bend:104}, r_ankle:{bend:-46}}),
  pies:["Un pie delante","Baja la rodilla de atrás"] });

E("zancadas_db","sentadilla",{ camara:-90, apoyos:["l_ankle"], unilateral:true,
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: une(amb({arm:{raise:-2,straddle:6}, elbow:{bend:4}}),
         {l_leg:{raise:22,straddle:5}, l_knee:{bend:16}, l_ankle:{bend:6},
          r_leg:{raise:-24,straddle:5}, r_knee:{bend:20}, r_ankle:{bend:-16}}),
  B: une(amb({arm:{raise:-2,straddle:6}, elbow:{bend:4}}), {torso:{bend:10},
          l_leg:{raise:72,straddle:5}, l_knee:{bend:64}, l_ankle:{bend:8},
          r_leg:{raise:-28,straddle:5}, r_knee:{bend:86}, r_ankle:{bend:-44}}),
  pies:["Mancuernas colgando","Baja la rodilla de atrás"] });

/* ---- 2 · BISAGRA (5) ---------------------------------------------------- */
E("bisagra_cadera_pie","bisagra",{ camara:-90, aparato:[], apoyos:["l_ankle","r_ankle"],
  A: amb({arm:{raise:-2,straddle:5}, elbow:{bend:4}}),
  B: une({torso:{bend:56}}, amb({arm:{raise:8,straddle:5}, elbow:{bend:6},
         leg:{raise:24,straddle:6}, knee:{bend:12}, ankle:{bend:10}})),
  pies:["De pie, espalda recta","Cadera atrás, pecho abajo"] });

E("peso_muerto_rumano_db","bisagra",{ camara:-90, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: amb({arm:{raise:-2,straddle:5}, elbow:{bend:4}}),
  B: une({torso:{bend:54}}, amb({arm:{raise:6,straddle:5}, elbow:{bend:4},
         leg:{raise:26,straddle:6}, knee:{bend:14}, ankle:{bend:10}})),
  pies:["Mancuernas al muslo","Cadera atrás, espalda recta"] });

E("hiperextension_banco","bisagra",{ protagonista:"head",  camara:-90, apoyos:[],
  aparato:[{tipo:"banco", apoya:["pelvis"]}],
  A: une({torso:{bend:52}, alza:0.34}, amb({arm:{raise:-52,straddle:14}, elbow:{bend:132},
         leg:{raise:-6,straddle:6}})),
  B: une({torso:{bend:-6}, alza:0.34}, amb({arm:{raise:-52,straddle:14}, elbow:{bend:132},
         leg:{raise:-6,straddle:6}})),
  pies:["Tronco colgando","Sube hasta la línea"] });

E("remo_inclinado","bisagra",{ protagonista:"l_wrist",  camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: une({torso:{bend:52}}, amb({arm:{raise:10,straddle:6}, elbow:{bend:8},
         leg:{raise:22,straddle:6}, knee:{bend:14}, ankle:{bend:8}})),
  B: une({torso:{bend:52}}, amb({arm:{raise:-16,straddle:16}, elbow:{bend:104},
         leg:{raise:22,straddle:6}, knee:{bend:14}, ankle:{bend:8}})),
  pies:["Tronco inclinado, brazos largos","Codos al techo"] });

E("gato_camello_pie","bisagra",{ protagonista:"head",  camara:-90, aparato:[], apoyos:["l_ankle","r_ankle"],
  A: une({torso:{bend:54}, head:{nod:34}}, amb({arm:{raise:-30,straddle:8}, elbow:{bend:52},
         leg:{raise:34,straddle:6}, knee:{bend:24}, ankle:{bend:12}})),
  B: une({torso:{bend:12}, head:{nod:-28}}, amb({arm:{raise:-46,straddle:8}, elbow:{bend:76},
         leg:{raise:18,straddle:6}, knee:{bend:12}, ankle:{bend:6}})),
  pies:["Espalda redonda","Pecho abierto"] });

/* ---- 3 · PUENTE (4) ----------------------------------------------------- */
E("glute_bridge","puente",{ camara:-90, aparato:[], apoyos:[],
  A: une({body:{bend:92}}, amb({leg:{raise:70,straddle:7}, knee:{bend:86}, ankle:{bend:-14},
         arm:{raise:-6,straddle:16}, elbow:{bend:6}})),
  B: une({body:{bend:56}}, amb({leg:{raise:42,straddle:7}, knee:{bend:88}, ankle:{bend:-24},
         arm:{raise:-6,straddle:16}, elbow:{bend:6}})),
  pies:["Espalda en el suelo","Cadera arriba, glúteo apretado"] });

E("puente_gluteo_banda","puente",{ camara:-90, aparato:[], apoyos:[],
  A: une({body:{bend:92}}, amb({leg:{raise:70,straddle:11}, knee:{bend:86}, ankle:{bend:-14},
         arm:{raise:-6,straddle:16}, elbow:{bend:6}})),
  B: une({body:{bend:56}}, amb({leg:{raise:42,straddle:20}, knee:{bend:88}, ankle:{bend:-24},
         arm:{raise:-6,straddle:16}, elbow:{bend:6}})),
  pies:["Banda sobre las rodillas","Sube abriendo rodillas"] });

E("hip_thrust_db","puente",{ camara:-90, apoyos:[],
  aparato:[{tipo:"banco", apoya:["torso"]}, MANC(["l_wrist"],"lateral")],
  A: une({body:{bend:80}, alza:0.10}, amb({leg:{raise:60,straddle:8}, knee:{bend:80},
         ankle:{bend:-16}, arm:{raise:-40,straddle:14}, elbow:{bend:74}})),
  B: une({body:{bend:44}, alza:0.10}, amb({leg:{raise:30,straddle:8}, knee:{bend:84},
         ankle:{bend:-26}, arm:{raise:-40,straddle:14}, elbow:{bend:74}})),
  pies:["Espalda alta en el banco","Cadera a la línea del tronco"] });

E("maquina_gluteo","puente",{ camara:-90, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["torso"]}],
  A: une({body:{bend:78}, alza:0.16}, amb({leg:{raise:58,straddle:8}, knee:{bend:78},
         ankle:{bend:-16}, arm:{raise:-34,straddle:20}, elbow:{bend:84}})),
  B: une({body:{bend:42}, alza:0.16}, amb({leg:{raise:28,straddle:8}, knee:{bend:82},
         ankle:{bend:-28}, arm:{raise:-34,straddle:20}, elbow:{bend:84}})),
  pies:["Cadera abajo en la máquina","Empuja hasta la extensión"] });

/* ---- 4 · PIERNA AISLADA (7) --------------------------------------------- */
function sentado(alza, extra){
  return une({alza: alza===undefined?0.30:alza},
    amb({leg:{raise:88, straddle:8}, knee:{bend:86}, ankle:{bend:2},
         arm:{raise:-14, straddle:14}, elbow:{bend:26}}), extra||{});
}
E("extension_cuadriceps","pierna_aislada",{ camara:-90, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: sentado(0.34), B: sentado(0.34, amb({knee:{bend:14}, ankle:{bend:10}})),
  pies:["Sentado, rodillas dobladas","Estira sin bloquear"] });

E("curl_femoral_sentado","pierna_aislada",{ camara:-90, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: sentado(0.34, amb({knee:{bend:26}, ankle:{bend:12}})),
  B: sentado(0.34, amb({knee:{bend:104}, ankle:{bend:-6}})),
  pies:["Piernas casi rectas","Talones bajo el asiento"] });

E("curl_femoral","pierna_aislada",{ camara:-90, apoyos:[],
  aparato:[{tipo:"banco", apoya:["torso","pelvis"]}],
  A: une({body:{bend:90}, alza:0.30},
         amb({leg:{raise:4,straddle:7}, knee:{bend:6}, ankle:{bend:0},
              arm:{raise:64,straddle:12}, elbow:{bend:96}})),
  B: une({body:{bend:90}, alza:0.30},
         amb({leg:{raise:4,straddle:7}, knee:{bend:112}, ankle:{bend:-8},
              arm:{raise:64,straddle:12}, elbow:{bend:96}})),
  pies:["Boca abajo, piernas rectas","Talones al glúteo"] });

E("aductores_maquina","pierna_aislada",{ camara:0, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: sentado(0.34, amb({leg:{straddle:40}, knee:{bend:84}})),
  B: sentado(0.34, amb({leg:{straddle:6}, knee:{bend:84}})),
  pies:["Rodillas abiertas","Junta apretando"] });

E("abductores_maquina","pierna_aislada",{ camara:0, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: sentado(0.34, amb({leg:{straddle:6}, knee:{bend:84}})),
  B: sentado(0.34, amb({leg:{straddle:44}, knee:{bend:84}})),
  pies:["Rodillas juntas","Abre contra la resistencia"] });

E("elevacion_pantorrilla","pierna_aislada",{ amplitudMin:0.035,  camara:-90, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: amb({ankle:{bend:14}, arm:{raise:-2,straddle:5}, elbow:{bend:4}}),
  B: amb({ankle:{bend:-46}, arm:{raise:-2,straddle:5}, elbow:{bend:4}}),
  pies:["Talones abajo","Sube a la punta"] });

E("elevacion_talones_pie","pierna_aislada",{ amplitudMin:0.035,  camara:-90, apoyos:["l_ankle","r_ankle"],
  aparato:[],
  A: amb({ankle:{bend:10}, arm:{raise:-8,straddle:8}, elbow:{bend:16}}),
  B: amb({ankle:{bend:-42}, arm:{raise:-8,straddle:8}, elbow:{bend:16}}),
  pies:["De pie relajado","De puntillas, dos segundos"] });

/* ---- 5 · CADERA DE PIE (7) ---------------------------------------------- */
E("balanceo_pierna_frontal","cadera_pie",{ camara:-90, aparato:[], apoyos:[],
  unilateral:true,
  A: une(amb({arm:{raise:-70,straddle:26}, elbow:{bend:18}}),
         {l_leg:{raise:-28,straddle:5}, l_knee:{bend:6}, l_ankle:{bend:-12}}),
  B: une(amb({arm:{raise:-70,straddle:26}, elbow:{bend:18}}),
         {l_leg:{raise:62,straddle:5}, l_knee:{bend:6}, l_ankle:{bend:8}}),
  pies:["Pierna atrás","Pierna al frente"] });

E("balanceo_pierna_lateral","cadera_pie",{ camara:0, aparato:[], apoyos:["r_ankle"],
  unilateral:true,
  A: une(amb({arm:{raise:-70,straddle:26}, elbow:{bend:18}}),
         {l_leg:{raise:0,straddle:-14}, l_knee:{bend:4}}),
  B: une(amb({arm:{raise:-70,straddle:26}, elbow:{bend:18}}),
         {l_leg:{raise:0,straddle:52}, l_knee:{bend:4}}),
  pies:["Pierna cruzada","Pierna abierta"] });

E("abduccion_banda","cadera_pie",{ camara:0, aparato:[], apoyos:["r_ankle"],
  unilateral:true,
  A: une(amb({arm:{raise:-8,straddle:8}, elbow:{bend:12}}),
         {l_leg:{raise:0,straddle:4}, l_knee:{bend:2}}),
  B: une(amb({arm:{raise:-8,straddle:8}, elbow:{bend:12}}),
         {l_leg:{raise:0,straddle:38}, l_knee:{bend:2}}),
  pies:["Banda en los tobillos","Abre sin ladear el tronco"] });

E("equilibrio_unipodal","cadera_pie",{ amplitudMin:0.03,  sostiene:true, camara:-40, aparato:[], apoyos:["r_ankle"],
  unilateral:true,
  A: une(amb({arm:{raise:-56,straddle:32}, elbow:{bend:14}}),
         {l_leg:{raise:34,straddle:6}, l_knee:{bend:58}, l_ankle:{bend:-16}}),
  B: une(amb({arm:{raise:-38,straddle:52}, elbow:{bend:10}}), {torso:{tilt:9},
          l_leg:{raise:58,straddle:12}, l_knee:{bend:78}, l_ankle:{bend:-22}}),
  pies:["Una pierna, mirada al frente","Aguanta sin apoyar"] });

E("flexor_cadera","cadera_pie",{ sostiene:true, camara:-90, aparato:[], apoyos:["l_ankle"],
  unilateral:true,
  A: une(amb({arm:{raise:-30,straddle:12}, elbow:{bend:40}}),
         {l_leg:{raise:56,straddle:6}, l_knee:{bend:50}, l_ankle:{bend:8},
          r_leg:{raise:-30,straddle:6}, r_knee:{bend:70}, r_ankle:{bend:-38}}),
  B: une(amb({arm:{raise:-30,straddle:12}, elbow:{bend:40}}), {torso:{bend:-8},
          l_leg:{raise:62,straddle:6}, l_knee:{bend:54}, l_ankle:{bend:10},
          r_leg:{raise:-40,straddle:6}, r_knee:{bend:74}, r_ankle:{bend:-40}}),
  pies:["Rodilla atrás en el suelo","Cadera adelante, glúteo apretado"] });

E("marcha_sitio","cadera_pie",{ camara:-70, aparato:[], apoyos:[],
  unilateral:true,
  A: une({l_leg:{raise:56,straddle:6}, l_knee:{bend:70}, l_ankle:{bend:-8},
          l_arm:{raise:-40,straddle:8}, l_elbow:{bend:74},
          r_arm:{raise:22,straddle:8}, r_elbow:{bend:60}}),
  B: une({l_leg:{raise:4,straddle:6}, l_knee:{bend:6}, l_ankle:{bend:0},
          l_arm:{raise:20,straddle:8}, l_elbow:{bend:60},
          r_arm:{raise:-40,straddle:8}, r_elbow:{bend:74},
          r_leg:{raise:50,straddle:6}, r_knee:{bend:66}, r_ankle:{bend:-8}}),
  pies:["Rodilla arriba","Cambia de pierna"] });

E("caminadora","cadera_pie",{ camara:-90, apoyos:[], unilateral:true,
  aparato:[{tipo:"banco", apoya:["l_ankle","r_ankle"]}],
  A: une({l_leg:{raise:30,straddle:5}, l_knee:{bend:22}, l_ankle:{bend:8},
          r_leg:{raise:-22,straddle:5}, r_knee:{bend:8}, r_ankle:{bend:-16},
          l_arm:{raise:-24,straddle:7}, l_elbow:{bend:66},
          r_arm:{raise:16,straddle:7}, r_elbow:{bend:60}, torso:{bend:6}}),
  B: une({l_leg:{raise:-20,straddle:5}, l_knee:{bend:10}, l_ankle:{bend:-14},
          r_leg:{raise:32,straddle:5}, r_knee:{bend:24}, r_ankle:{bend:8},
          l_arm:{raise:16,straddle:7}, l_elbow:{bend:60},
          r_arm:{raise:-24,straddle:7}, r_elbow:{bend:66}, torso:{bend:6}}),
  pies:["Paso adelante","Paso atrás"] });

/* ---- 6 · EMPUJE HORIZONTAL (8) ------------------------------------------ */
/* Tumbado boca arriba en un banco: los pies apoyan en el SUELO, no en el aire.
   Con el tronco tumbado el signo de `raise` se invierte respecto a la postura
   de pie —lo mismo que pasa en la cuadrupedia—, así que el muslo baja con
   valor negativo. Medido en pantalla, no supuesto. */
function tumbado(alza){
  return une({body:{bend:90}, alza:alza||0},
    amb({leg:{raise:118,straddle:8}, knee:{bend:78}, ankle:{bend:-10}}));
}
E("press_banca_db","empuje_h",{ camara:-60, apoyos:[],
  aparato:[{tipo:"banco", apoya:["torso","pelvis"]}, MANC(["l_wrist","r_wrist"],"lateral")],
  A: une(tumbado(0.34), amb({arm:{raise:-84,straddle:52}, elbow:{bend:92}})),
  B: une(tumbado(0.34), amb({arm:{raise:-88,straddle:20}, elbow:{bend:10}})),
  pies:["Codos abajo, pecho abierto","Empuja hasta arriba"] });

E("aperturas_db","empuje_h",{ camara:-60, apoyos:[],
  aparato:[{tipo:"banco", apoya:["torso","pelvis"]}, MANC(["l_wrist","r_wrist"],"lateral")],
  A: une(tumbado(0.34), amb({arm:{raise:-88,straddle:76}, elbow:{bend:22}})),
  B: une(tumbado(0.34), amb({arm:{raise:-90,straddle:12}, elbow:{bend:18}})),
  pies:["Brazos abiertos en cruz","Junta arriba sin chocar"] });

E("pec_deck","empuje_h",{ camara:-25, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: une({alza:0.32}, amb({leg:{raise:86,straddle:9}, knee:{bend:84}, ankle:{bend:4},
         arm:{raise:-88,straddle:78}, elbow:{bend:26}})),
  B: une({alza:0.32}, amb({leg:{raise:86,straddle:9}, knee:{bend:84}, ankle:{bend:4},
         arm:{raise:-88,straddle:14}, elbow:{bend:26}})),
  pies:["Codos atrás, pecho abierto","Junta delante del pecho"] });

E("flexiones","empuje_h",{ camara:-90, apoyos:[],
  aparato:[],
  A: une({body:{bend:80}}, amb({arm:{raise:92,straddle:12}, elbow:{bend:4},
         leg:{raise:4,straddle:7}, knee:{bend:2}, ankle:{bend:-40}})),
  B: une({body:{bend:80}}, amb({arm:{raise:74,straddle:42}, elbow:{bend:86},
         leg:{raise:4,straddle:7}, knee:{bend:2}, ankle:{bend:-40}})),
  pies:["Plancha con brazos rectos","Baja el pecho al suelo"] });

E("flexiones_pared","empuje_h",{ camara:-90, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"pared", ante:["l_wrist","r_wrist"]}],
  A: une({torso:{bend:8}}, amb({arm:{raise:-92,straddle:20}, elbow:{bend:6},
         leg:{raise:-6,straddle:6}})),
  B: une({torso:{bend:12}}, amb({arm:{raise:-72,straddle:40}, elbow:{bend:82},
         leg:{raise:-6,straddle:6}})),
  pies:["Manos en la pared","Acerca el pecho"] });

E("flexiones_inclinadas","empuje_h",{ camara:-90, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"barra_fija", ante:["l_wrist","r_wrist"]}],
  A: une({body:{bend:48}}, amb({arm:{raise:96,straddle:14}, elbow:{bend:6},
         leg:{raise:4,straddle:7}, knee:{bend:2}, ankle:{bend:-26}})),
  B: une({body:{bend:48}}, amb({arm:{raise:78,straddle:40}, elbow:{bend:84},
         leg:{raise:4,straddle:7}, knee:{bend:2}, ankle:{bend:-26}})),
  pies:["Manos en la barra","Baja el pecho"] });

E("fondos_banco","empuje_h",{ camara:-90, apoyos:[],
  aparato:[{tipo:"banco", apoya:["l_wrist","r_wrist"]}],
  A: une({torso:{bend:8}}, amb({arm:{raise:34,straddle:12}, elbow:{bend:8},
         leg:{raise:70,straddle:8}, knee:{bend:56}, ankle:{bend:14}})),
  B: une({torso:{bend:8}}, amb({arm:{raise:44,straddle:14}, elbow:{bend:88},
         leg:{raise:78,straddle:8}, knee:{bend:60}, ankle:{bend:18}})),
  pies:["Manos en el banco, brazos rectos","Baja doblando codos"] });

E("fondos_paralelas","empuje_h",{ camara:-70, apoyos:[],
  aparato:[{tipo:"poste", ante:["l_wrist"]}, {tipo:"poste", ante:["r_wrist"]}],
  A: une({torso:{bend:12}}, amb({arm:{raise:12,straddle:10}, elbow:{bend:6},
         leg:{raise:26,straddle:7}, knee:{bend:44}, ankle:{bend:-10}})),
  B: une({torso:{bend:16}}, amb({arm:{raise:24,straddle:12}, elbow:{bend:94},
         leg:{raise:26,straddle:7}, knee:{bend:44}, ankle:{bend:-10}})),
  pies:["Colgado con brazos rectos","Baja hasta 90°"] });

/* ---- 7 · EMPUJE VERTICAL Y HOMBRO (4) ----------------------------------- */
E("press_hombro_db","empuje_v",{ camara:-25, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"lateral")],
  A: amb({arm:{raise:-96,straddle:62}, elbow:{bend:92}}),
  B: amb({arm:{raise:-166,straddle:16}, elbow:{bend:10}}),
  pies:["Mancuernas a la altura de la oreja","Arriba sin encoger el cuello"] });

E("elevaciones_laterales","empuje_v",{ camara:0, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente",0.8)],
  A: amb({arm:{raise:-4,straddle:8}, elbow:{bend:10}}),
  B: amb({arm:{raise:-4,straddle:88}, elbow:{bend:14}}),
  pies:["Brazos al costado","Sube hasta la horizontal"] });

/* El maniquí NO tiene articulación de escápula: el encogimiento de hombros no
   se puede representar tal cual. Se sugiere subiendo algo el brazo y hundiendo
   la cabeza, y queda declarado con gestoLimitado para que el validador lo
   anote como límite conocido en vez de darlo por bueno. */
E("encogimientos_db","empuje_v",{ sostiene:true, gestoLimitado:true, amplitudMin:0.008,
  camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: une({torso:{bend:3}, head:{nod:-8}}, amb({arm:{raise:0,straddle:8}, elbow:{bend:2}})),
  B: une({torso:{bend:-5}, head:{nod:12}}, amb({arm:{raise:-22,straddle:14}, elbow:{bend:14}})),
  pies:["Hombros abajo","Sube los hombros a las orejas"] });

E("cruce_poleas","empuje_v",{ camara:-25, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"poste", ante:["l_wrist"]}, {tipo:"poste", ante:["r_wrist"]}],
  A: amb({arm:{raise:22,straddle:36}, elbow:{bend:14}}),
  B: amb({arm:{raise:-128,straddle:44}, elbow:{bend:16}}),
  pies:["Manos abajo, delante del muslo","Sube en diagonal"] });

/* ---- 8 · TRACCIÓN VERTICAL (3) ------------------------------------------ */
E("jalon_pecho","traccion_v",{ camara:-25, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}, {tipo:"barra", en:["l_wrist"], eje:"lateral", largo:1.4}],
  A: une({alza:0.28, torso:{bend:-6}},
         amb({leg:{raise:88,straddle:8}, knee:{bend:86}, ankle:{bend:4},
              arm:{raise:-158,straddle:24}, elbow:{bend:8}, wrist:{bend:-12}})),
  B: une({alza:0.28, torso:{bend:-12}},
         amb({leg:{raise:88,straddle:8}, knee:{bend:86}, ankle:{bend:4},
              arm:{raise:-76,straddle:44}, elbow:{bend:100}, wrist:{bend:-10}})),
  pies:["Brazos estirados arriba","Barra al pecho, codos abajo"] });

E("colgado_escapular","traccion_v",{ amplitudMin:0.02,  sostiene:true, camara:-25, apoyos:[],
  aparato:[{tipo:"barra_fija", ante:["l_wrist","r_wrist"]}],
  A: amb({arm:{raise:-176,straddle:12}, elbow:{bend:4}, leg:{raise:6,straddle:6},
          knee:{bend:24}, ankle:{bend:-14}}),
  B: amb({arm:{raise:-166,straddle:12}, elbow:{bend:6}, leg:{raise:6,straddle:6},
          knee:{bend:24}, ankle:{bend:-14}}),
  pies:["Colgado, hombros sueltos","Baja los hombros sin doblar codos"] });

E("pullover_polea","traccion_v",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"poste", ante:["l_wrist"]}, {tipo:"barra", en:["l_wrist"], eje:"lateral", largo:1.0}],
  A: une({torso:{bend:20}}, amb({arm:{raise:-138,straddle:16}, elbow:{bend:12},
         leg:{raise:16,straddle:6}, knee:{bend:12}, ankle:{bend:6}})),
  B: une({torso:{bend:26}}, amb({arm:{raise:-34,straddle:12}, elbow:{bend:10},
         leg:{raise:16,straddle:6}, knee:{bend:12}, ankle:{bend:6}})),
  pies:["Brazos arriba, codos casi rectos","Baja hasta los muslos"] });

/* ---- 9 · TRACCIÓN HORIZONTAL (10) --------------------------------------- */
E("remo_db","traccion_h",{ camara:-70, apoyos:[], unilateral:true,
  aparato:[{tipo:"banco", apoya:["r_knee"]}, MANC(["l_wrist"],"frente")],
  A: une({torso:{bend:48}}, {l_arm:{raise:8,straddle:6}, l_elbow:{bend:6},
         r_arm:{raise:-48,straddle:16}, r_elbow:{bend:100},
         l_leg:{raise:18,straddle:6}, l_knee:{bend:10}, l_ankle:{bend:8},
         r_leg:{raise:52,straddle:8}, r_knee:{bend:70}, r_ankle:{bend:-8}}),
  B: une({torso:{bend:48}}, {l_arm:{raise:-14,straddle:14}, l_elbow:{bend:104},
         r_arm:{raise:-48,straddle:16}, r_elbow:{bend:100},
         l_leg:{raise:18,straddle:6}, l_knee:{bend:10}, l_ankle:{bend:8},
         r_leg:{raise:52,straddle:8}, r_knee:{bend:70}, r_ankle:{bend:-8}}),
  pies:["Brazo largo, espalda recta","Codo al bolsillo"] });

E("remo_banda","traccion_h",{ camara:-70, aparato:[], apoyos:["l_ankle","r_ankle"],
  A: amb({arm:{raise:-72,straddle:14}, elbow:{bend:12}}),
  B: amb({arm:{raise:-24,straddle:12}, elbow:{bend:104}}),
  pies:["Brazos estirados al frente","Codos atrás, escápulas juntas"] });

E("remo_maquina","traccion_h",{ camara:-70, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: une({alza:0.32, torso:{bend:14}},
         amb({leg:{raise:86,straddle:8}, knee:{bend:84}, ankle:{bend:4},
              arm:{raise:-80,straddle:14}, elbow:{bend:14}})),
  B: une({alza:0.32, torso:{bend:-2}},
         amb({leg:{raise:86,straddle:8}, knee:{bend:84}, ankle:{bend:4},
              arm:{raise:-26,straddle:12}, elbow:{bend:104}})),
  pies:["Brazos largos al frente","Tira hasta el abdomen"] });

E("remo_polea","traccion_h",{ camara:-70, apoyos:[],
  aparato:[{tipo:"poste", ante:["l_wrist"]}],
  A: une({alza:0.06, torso:{bend:22}},
         amb({leg:{raise:70,straddle:8}, knee:{bend:22}, ankle:{bend:34},
              arm:{raise:-74,straddle:12}, elbow:{bend:14}})),
  B: une({alza:0.06, torso:{bend:-4}},
         amb({leg:{raise:70,straddle:8}, knee:{bend:22}, ankle:{bend:34},
              arm:{raise:-22,straddle:10}, elbow:{bend:106}})),
  pies:["Sentado, brazos al frente","Tira al ombligo, pecho alto"] });

E("remo_invertido","traccion_h",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"barra_fija", ante:["l_wrist","r_wrist"]}],
  A: une({body:{bend:66}}, amb({arm:{raise:-96,straddle:18}, elbow:{bend:8},
         leg:{raise:-4,straddle:7}, ankle:{bend:16}})),
  B: une({body:{bend:66}}, amb({arm:{raise:-58,straddle:32}, elbow:{bend:92},
         leg:{raise:-4,straddle:7}, ankle:{bend:16}})),
  pies:["Colgado bajo la barra","Pecho a la barra"] });

E("reverse_fly","traccion_h",{ camara:-25, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente",0.8)],
  A: une({torso:{bend:46}}, amb({arm:{raise:-84,straddle:8}, elbow:{bend:18},
         leg:{raise:20,straddle:6}, knee:{bend:16}, ankle:{bend:6}})),
  B: une({torso:{bend:46}}, amb({arm:{raise:-84,straddle:78}, elbow:{bend:20},
         leg:{raise:20,straddle:6}, knee:{bend:16}, ankle:{bend:6}})),
  pies:["Brazos colgando juntos","Abre en cruz"] });

E("pec_deck_inverso","traccion_h",{ camara:-25, apoyos:[],
  aparato:[{tipo:"maquina", apoya:["pelvis"]}],
  A: une({alza:0.32}, amb({leg:{raise:86,straddle:9}, knee:{bend:84}, ankle:{bend:4},
         arm:{raise:-88,straddle:12}, elbow:{bend:22}})),
  B: une({alza:0.32}, amb({leg:{raise:86,straddle:9}, knee:{bend:84}, ankle:{bend:4},
         arm:{raise:-88,straddle:80}, elbow:{bend:24}})),
  pies:["Brazos al frente","Abre juntando escápulas"] });

E("vuelos_posteriores_ligeros","traccion_h",{ camara:-25, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente",0.7)],
  A: une({torso:{bend:40}}, amb({arm:{raise:-82,straddle:10}, elbow:{bend:22},
         leg:{raise:18,straddle:6}, knee:{bend:14}, ankle:{bend:6}})),
  B: une({torso:{bend:40}}, amb({arm:{raise:-82,straddle:62}, elbow:{bend:24},
         leg:{raise:18,straddle:6}, knee:{bend:14}, ankle:{bend:6}})),
  pies:["Peso ligero, brazos abajo","Abre poco y controlado"] });

E("banda_pull_apart","traccion_h",{ camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"],
  A: amb({arm:{raise:-88,straddle:12}, elbow:{bend:8}}),
  B: amb({arm:{raise:-88,straddle:74}, elbow:{bend:10}}),
  pies:["Banda al frente","Abre hasta el pecho"] });

E("apertura_toracica_rack","traccion_h",{ protagonista:"torso", sostiene:true, camara:-60, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"poste", ante:["l_wrist"]}],
  A: une({torso:{bend:26}}, amb({arm:{raise:-142,straddle:18}, elbow:{bend:16},
         leg:{raise:10,straddle:7}, knee:{bend:8}, ankle:{bend:4}})),
  B: une({torso:{bend:54}}, amb({arm:{raise:-172,straddle:20}, elbow:{bend:4},
         leg:{raise:26,straddle:7}, knee:{bend:16}, ankle:{bend:10}})),
  pies:["Manos en el rack, cadera atrás","Hunde el pecho"] });

/* ---- 10 · CODO AISLADO (9) ---------------------------------------------- */
E("curl_barra","codo",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"barra", en:["l_wrist"], eje:"lateral", largo:1.1}],
  A: amb({arm:{raise:-6,straddle:8}, elbow:{bend:12}, wrist:{bend:-10}}),
  B: amb({arm:{raise:-16,straddle:8}, elbow:{bend:134}, wrist:{bend:-14}}),
  pies:["Barra en los muslos","Sube sin mover el codo"] });

E("curl_biceps_db","codo",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: amb({arm:{raise:-6,straddle:8}, elbow:{bend:10}}),
  B: amb({arm:{raise:-16,straddle:8}, elbow:{bend:132}}),
  pies:["Brazos colgando","Sube hasta el hombro"] });

E("curl_concentrado","codo",{ protagonista:"l_wrist",  camara:-70, apoyos:[], unilateral:true,
  aparato:[{tipo:"banco", apoya:["pelvis"]}, MANC(["l_wrist"],"frente")],
  A: une({alza:0.30, torso:{bend:34, turn:-10}},
         amb({leg:{raise:86,straddle:22}, knee:{bend:84}, ankle:{bend:4}}),
         {l_arm:{raise:-26,straddle:20}, l_elbow:{bend:14},
          r_arm:{raise:-44,straddle:26}, r_elbow:{bend:60}}),
  B: une({alza:0.30, torso:{bend:34, turn:-10}},
         amb({leg:{raise:86,straddle:22}, knee:{bend:84}, ankle:{bend:4}}),
         {l_arm:{raise:-32,straddle:20}, l_elbow:{bend:132},
          r_arm:{raise:-44,straddle:26}, r_elbow:{bend:60}}),
  pies:["Codo apoyado en el muslo","Sube hasta cerrar"] });

E("curl_martillo_cruzado","codo",{ camara:-30, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"lateral")],
  A: amb({arm:{raise:-6,straddle:7}, elbow:{bend:10}, wrist:{turn:40}}),
  B: amb({arm:{raise:-14,straddle:4}, elbow:{bend:128}, wrist:{turn:40}}),
  pies:["Palmas enfrentadas","Cruza hacia el hombro opuesto"] });

E("curl_predicador","codo",{ camara:-70, apoyos:[],
  aparato:[{tipo:"banco", apoya:["l_elbow","r_elbow"]}, {tipo:"barra", en:["l_wrist"], eje:"lateral", largo:0.9}],
  A: une({alza:0.28, torso:{bend:20}},
         amb({leg:{raise:86,straddle:9}, knee:{bend:84}, ankle:{bend:4},
              arm:{raise:-60,straddle:12}, elbow:{bend:16}})),
  B: une({alza:0.28, torso:{bend:20}},
         amb({leg:{raise:86,straddle:9}, knee:{bend:84}, ankle:{bend:4},
              arm:{raise:-60,straddle:12}, elbow:{bend:126}})),
  pies:["Brazos apoyados, casi rectos","Sube sin despegar el codo"] });

E("press_frances","codo",{ camara:-70, apoyos:[],
  aparato:[{tipo:"banco", apoya:["torso","pelvis"]}, {tipo:"barra", en:["l_wrist"], eje:"lateral", largo:0.9}],
  A: une(tumbado(0.34), amb({arm:{raise:-96,straddle:14}, elbow:{bend:14}})),
  B: une(tumbado(0.34), amb({arm:{raise:-96,straddle:14}, elbow:{bend:126}})),
  pies:["Brazos verticales","Baja la barra a la frente"] });

E("extension_triceps_db","codo",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[MANC(["l_wrist"],"arriba")],
  A: amb({arm:{raise:-172,straddle:14}, elbow:{bend:130}}),
  B: amb({arm:{raise:-176,straddle:10}, elbow:{bend:12}}),
  pies:["Mancuerna detrás de la nuca","Estira sin abrir los codos"] });

E("extension_triceps_polea","codo",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"poste", ante:["l_wrist"]}],
  A: une({torso:{bend:8}}, amb({arm:{raise:-14,straddle:8}, elbow:{bend:96}})),
  B: une({torso:{bend:8}}, amb({arm:{raise:-8,straddle:8}, elbow:{bend:8}})),
  pies:["Codos pegados, 90°","Estira hasta abajo"] });

E("extension_triceps_sobrecabeza_polea","codo",{ camara:-70, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"poste", ante:["l_wrist"], detras:true}],
  A: une({torso:{bend:16}}, amb({arm:{raise:-152,straddle:12}, elbow:{bend:124},
         leg:{raise:10,straddle:6}, knee:{bend:8}})),
  B: une({torso:{bend:16}}, amb({arm:{raise:-156,straddle:10}, elbow:{bend:10},
         leg:{raise:10,straddle:6}, knee:{bend:8}})),
  pies:["Codos altos, manos en la nuca","Estira al frente"] });

/* ---- 11 · HOMBRO FINO Y TORÁCICA (5) ------------------------------------ */
E("rotacion_externa_db","hombro_fino",{ camara:-25, apoyos:["l_ankle","r_ankle"],
  unilateral:true, aparato:[MANC(["l_wrist"],"frente",0.7)],
  A: une({l_arm:{raise:-8,straddle:6}, l_elbow:{bend:92}, l_wrist:{turn:0},
          r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}}),
  B: une({l_arm:{raise:-8,straddle:6,turn:-58}, l_elbow:{bend:92},
          r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}}),
  pies:["Codo al costado, 90°","Abre el antebrazo"] });

E("circulos_brazos","hombro_fino",{ camara:0, aparato:[], apoyos:["l_ankle","r_ankle"],
  A: amb({arm:{raise:-4,straddle:78}, elbow:{bend:6}}),
  B: amb({arm:{raise:-160,straddle:34}, elbow:{bend:6}}),
  pies:["Brazos en cruz","Círculo hasta arriba"] });

E("wall_angels","hombro_fino",{ camara:-25, apoyos:["l_ankle","r_ankle"],
  aparato:[{tipo:"pared", ante:["torso"], detras:true}],
  A: amb({arm:{raise:-88,straddle:66}, elbow:{bend:92}}),
  B: amb({arm:{raise:-158,straddle:32}, elbow:{bend:24}}),
  pies:["Codos a 90° contra la pared","Sube sin despegar"] });

E("pec_puerta","hombro_fino",{ protagonista:"l_wrist", amplitudMin:0.03,  sostiene:true, camara:-30, apoyos:["l_ankle","r_ankle"], unilateral:true,
  aparato:[{tipo:"pared", ante:["l_wrist"]}],
  A: une({l_arm:{raise:-90,straddle:56}, l_elbow:{bend:88},
          r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}, torso:{turn:0}}),
  B: une({l_arm:{raise:-90,straddle:56}, l_elbow:{bend:88},
          r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}, torso:{turn:26}}),
  pies:["Antebrazo en el marco","Gira el tronco al lado contrario"] });

E("extension_toracica","hombro_fino",{ camara:-90, apoyos:[],
  aparato:[{tipo:"banco", apoya:["torso"]}],
  A: une({body:{bend:90}, alza:0.16, torso:{bend:10}},
         amb({leg:{raise:62,straddle:8}, knee:{bend:78}, ankle:{bend:-10},
              arm:{raise:-120,straddle:20}, elbow:{bend:60}})),
  B: une({body:{bend:90}, alza:0.16, torso:{bend:-18}},
         amb({leg:{raise:62,straddle:8}, knee:{bend:78}, ankle:{bend:-10},
              arm:{raise:-160,straddle:16}, elbow:{bend:26}})),
  pies:["Bloque bajo la espalda alta","Abre el pecho hacia atrás"] });

/* ---- 12 · CORE Y CUADRUPEDIA (9) ---------------------------------------- */
E("dead_bug","core",{ camara:-70, aparato:[], apoyos:[],
  A: une({body:{bend:90}}, {l_arm:{raise:-176,straddle:12}, l_elbow:{bend:6},
         r_arm:{raise:-176,straddle:12}, r_elbow:{bend:6},
         l_leg:{raise:86,straddle:7}, l_knee:{bend:84}, l_ankle:{bend:2},
         r_leg:{raise:86,straddle:7}, r_knee:{bend:84}, r_ankle:{bend:2}}),
  B: une({body:{bend:90}}, {l_arm:{raise:-96,straddle:12}, l_elbow:{bend:8},
         r_arm:{raise:-176,straddle:12}, r_elbow:{bend:6},
         l_leg:{raise:20,straddle:7}, l_knee:{bend:16}, l_ankle:{bend:4},
         r_leg:{raise:86,straddle:7}, r_knee:{bend:84}, r_ankle:{bend:2}}),
  pies:["Brazos y rodillas arriba","Estira brazo y pierna contrarios"] });

E("bird_dog","core",{ camara:-70, aparato:[], apoyos:[], unilateral:true,
  A: une({body:{bend:84}}, amb({arm:{raise:92,straddle:10}, elbow:{bend:6},
         leg:{raise:92,straddle:8}, knee:{bend:84}, ankle:{bend:-6}})),
  B: une({body:{bend:84}}, {l_arm:{raise:172,straddle:10}, l_elbow:{bend:4},
         r_arm:{raise:92,straddle:10}, r_elbow:{bend:6},
         l_leg:{raise:92,straddle:8}, l_knee:{bend:84}, l_ankle:{bend:-6},
         r_leg:{raise:4,straddle:8}, r_knee:{bend:4}, r_ankle:{bend:-30}}),
  pies:["Cuadrupedia, espalda neutra","Brazo y pierna contrarios"] });

E("pallof_banda","core",{ camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"],
  unilateral:true,
  A: une({torso:{turn:8}}, amb({arm:{raise:-58,straddle:14}, elbow:{bend:96},
         leg:{raise:14,straddle:12}, knee:{bend:16}, ankle:{bend:0}})),
  B: une({torso:{turn:8}}, amb({arm:{raise:-88,straddle:10}, elbow:{bend:8},
         leg:{raise:14,straddle:12}, knee:{bend:16}, ankle:{bend:0}})),
  pies:["Manos al pecho","Estira sin girar el tronco"] });

E("caminata_granjero","core",{ protagonista:"l_knee", amplitudMin:0.05,  sostiene:true, camara:-40, apoyos:["r_ankle"],
  aparato:[MANC(["l_wrist","r_wrist"],"frente")],
  A: une({torso:{bend:2}}, amb({arm:{raise:-2,straddle:9}, elbow:{bend:4}})),
  B: une({torso:{bend:2}}, {l_leg:{raise:22,straddle:6}, l_knee:{bend:18}, l_ankle:{bend:6},
          r_leg:{raise:-16,straddle:6}, r_knee:{bend:6}, r_ankle:{bend:-12},
          l_arm:{raise:-2,straddle:9}, l_elbow:{bend:4},
          r_arm:{raise:-2,straddle:9}, r_elbow:{bend:4}}),
  pies:["Peso a los lados, hombros abajo","Camina sin ladearte"] });

/* CUADRUPEDIA. Con el tronco tumbado (body.bend ~ +84) el signo de `raise`
   deja de significar "adelante": positivo manda el miembro HACIA EL SUELO y
   negativo hacia arriba. Medido, no supuesto: con raise +92 en brazo y pierna
   las muñecas quedan a −0,53 y las rodillas a −0,44, que es apoyarse en manos
   y rodillas; con el signo contrario el muñeco queda panza arriba con las
   patas al aire. */
E("gato_camello","core",{ protagonista:"head", camara:-90, aparato:[], apoyos:[],
  A: une({body:{bend:84}, torso:{bend:26}, head:{nod:30}},
         amb({arm:{raise:92,straddle:10}, elbow:{bend:6},
              leg:{raise:92,straddle:8}, knee:{bend:84}, ankle:{bend:-6}})),
  B: une({body:{bend:84}, torso:{bend:-20}, head:{nod:-24}},
         amb({arm:{raise:92,straddle:10}, elbow:{bend:6},
              leg:{raise:92,straddle:8}, knee:{bend:84}, ankle:{bend:-6}})),
  pies:["Espalda al techo","Pecho abajo, mirada al frente"] });

E("open_book","core",{ camara:-40, aparato:[], apoyos:[], unilateral:true,
  A: une({body:{bend:90}, torso:{turn:0}},
         {l_arm:{raise:-90,straddle:10}, l_elbow:{bend:8},
          r_arm:{raise:-90,straddle:10}, r_elbow:{bend:8},
          l_leg:{raise:84,straddle:6}, l_knee:{bend:86}, l_ankle:{bend:0},
          r_leg:{raise:84,straddle:6}, r_knee:{bend:86}, r_ankle:{bend:0}}),
  B: une({body:{bend:90}, torso:{turn:44}, head:{turn:44}},
         {l_arm:{raise:-84,straddle:76}, l_elbow:{bend:10},
          r_arm:{raise:-90,straddle:10}, r_elbow:{bend:8},
          l_leg:{raise:84,straddle:6}, l_knee:{bend:86}, l_ankle:{bend:0},
          r_leg:{raise:84,straddle:6}, r_knee:{bend:86}, r_ankle:{bend:0}}),
  pies:["De lado, brazos juntos","Abre el brazo de arriba"] });

E("piernas_pared","core",{ sostiene:true, camara:-90, apoyos:[],
  aparato:[{tipo:"pared", ante:["l_ankle","r_ankle"]}],
  A: une({body:{bend:90}}, amb({leg:{raise:88,straddle:6}, knee:{bend:6}, ankle:{bend:-8},
         arm:{raise:-6,straddle:26}, elbow:{bend:6}})),
  B: une({body:{bend:90}}, amb({leg:{raise:90,straddle:6}, knee:{bend:4}, ankle:{bend:-14},
         arm:{raise:-30,straddle:44}, elbow:{bend:14}})),
  pies:["Piernas apoyadas en la pared","Respira y suelta"] });

E("respiracion_diafragmatica","core",{ sostiene:true, camara:-70, aparato:[], apoyos:[],
  A: une({body:{bend:90}, torso:{bend:2}},
         amb({leg:{raise:62,straddle:8}, knee:{bend:78}, ankle:{bend:-10},
              arm:{raise:-42,straddle:12}, elbow:{bend:104}})),
  B: une({body:{bend:90}, torso:{bend:-4}},
         amb({leg:{raise:62,straddle:8}, knee:{bend:78}, ankle:{bend:-10},
              arm:{raise:-46,straddle:12}, elbow:{bend:108}})),
  pies:["Una mano en el pecho, otra en la tripa","Hincha la tripa, no el pecho"] });

/* ---- 13 · CUELLO Y CARA (12) -------------------------------------------- */
/* Encuadre de busto: se recorta a la cabeza y el tronco alto. Los cuatro
   últimos son gestos DENTRO de la cara, que este maniquí no tiene: la figura
   marca la zona y la explicación la llevan los pasos y el vídeo. */
E("chin_tuck","cuello",{ camara:-40, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  A: {head:{nod:-16}, neck:{}}, B: {head:{nod:18}},
  pies:["Barbilla adelantada","Recoge la barbilla"] });

E("movilidad_cervical","cuello",{ camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  A: {head:{turn:-42, nod:0}}, B: {head:{turn:42, nod:0}},
  pies:["Mira a un lado","Mira al otro"] });

E("isometricos_cervicales","cuello",{ sostiene:true, camara:-40, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  A: une({head:{nod:0}}, {l_arm:{raise:-116,straddle:16}, l_elbow:{bend:118},
         r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}}),
  B: une({head:{nod:20}}, {l_arm:{raise:-132,straddle:20}, l_elbow:{bend:134},
         r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}}),
  pies:["Mano en la frente","Empuja sin mover la cabeza"] });

E("cuello_extension_manual","cuello",{ camara:-40, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  A: une({head:{nod:14}}, amb({arm:{raise:-140,straddle:26}, elbow:{bend:126}})),
  B: une({head:{nod:-16}}, amb({arm:{raise:-138,straddle:24}, elbow:{bend:120}})),
  pies:["Manos en la nuca, barbilla al pecho","Empuja la cabeza atrás"] });

E("cuello_flexion_supina","cuello",{ camara:-90, aparato:[], apoyos:[], busto:true,
  A: une({body:{bend:90}, head:{nod:-14}},
         amb({leg:{raise:62,straddle:8}, knee:{bend:78}, ankle:{bend:-10},
              arm:{raise:-8,straddle:16}, elbow:{bend:8}})),
  B: une({body:{bend:90}, head:{nod:22}},
         amb({leg:{raise:62,straddle:8}, knee:{bend:78}, ankle:{bend:-10},
              arm:{raise:-8,straddle:16}, elbow:{bend:8}})),
  pies:["Cabeza apoyada","Barbilla al pecho"] });

E("cuello_lateral_manual","cuello",{ camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"],
  busto:true, unilateral:true,
  A: une({head:{tilt:0}}, {l_arm:{raise:-150,straddle:34}, l_elbow:{bend:124},
         r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}}),
  B: une({head:{tilt:26}}, {l_arm:{raise:-152,straddle:30}, l_elbow:{bend:128},
         r_arm:{raise:-6,straddle:7}, r_elbow:{bend:10}}),
  pies:["Mano sobre la oreja","Inclina contra la mano"] });

E("trapecio_superior","cuello",{ sostiene:true, camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"],
  busto:true, unilateral:true,
  A: une({head:{tilt:0}}, {l_arm:{raise:-152,straddle:32}, l_elbow:{bend:126},
         r_arm:{raise:8,straddle:4}, r_elbow:{bend:6}}),
  B: une({head:{tilt:32, turn:-14}}, {l_arm:{raise:-154,straddle:28}, l_elbow:{bend:130},
         r_arm:{raise:12,straddle:2}, r_elbow:{bend:6}}),
  pies:["Hombro contrario abajo","Lleva la oreja al hombro"] });

E("elevador_escapula","cuello",{ sostiene:true, camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"],
  busto:true, unilateral:true,
  A: une({head:{tilt:0, turn:0}}, {l_arm:{raise:-150,straddle:30}, l_elbow:{bend:124},
         r_arm:{raise:8,straddle:4}, r_elbow:{bend:6}}),
  B: une({head:{tilt:26, turn:-36, nod:18}}, {l_arm:{raise:-152,straddle:26}, l_elbow:{bend:128},
         r_arm:{raise:12,straddle:2}, r_elbow:{bend:6}}),
  pies:["Mirada al frente","Gira, inclina y mira a la axila"] });

E("mewing_lengua","cuello",{ sostiene:true, gestoLimitado:true, camara:-40, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  gestoFacial:true,
  A: {head:{nod:4}}, B: {head:{nod:-4}},
  pies:["Boca cerrada, dientes sin apretar","Lengua al paladar, respira por la nariz"] });

E("face_yoga","cuello",{ sostiene:true, gestoLimitado:true, camara:0, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  gestoFacial:true,
  A: {head:{nod:2, turn:-6}}, B: {head:{nod:-4, turn:6}},
  pies:["Cara relajada","Sostén el gesto y suelta"] });

E("mandibula_platisma","cuello",{ sostiene:true, gestoLimitado:true, camara:-30, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  gestoFacial:true,
  A: {head:{nod:2}}, B: {head:{nod:-18}},
  pies:["Mirada al frente","Barbilla arriba, cuello tenso"] });

E("tmj_mandibula","cuello",{ sostiene:true, gestoLimitado:true, camara:-25, aparato:[], apoyos:["l_ankle","r_ankle"], busto:true,
  gestoFacial:true,
  A: {head:{turn:-12}}, B: {head:{turn:12}},
  pies:["Boca entreabierta","Abre y cierra sin desviar"] });

/* préstamo honesto: la figura de reverse_fly sirve para el vuelo ligero */
if (!P.vuelos_posteriores_ligeros) P.vuelos_posteriores_ligeros = P.reverse_fly;

window.FIG3D = { NEUTRA:NEUTRA, ARQUETIPOS:ARQUETIPOS, POSES:P };
})();
