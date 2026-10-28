/* Datos de ejemplo con la forma EXACTA de las claves rp_* de index.html.
   Las fechas salen de "hoy" para que racha, semana, adherencia y graficas
   tengan siempre datos vivos, y todo es determinista (sin Math.random).

   Formas (ver index.html):
   rp_logs     {exId:[{date:"AAAA-MM-DD",sets:[{w,reps,t,rir?}],k:rutina,t:selloInicio,checked?}]}
   rp_history  [{key,name,iso,day,date:"dd/mm/aaaa",time:"HH:MM",sets,vol,exDone,exTotal,dur,ids,pr?}] (nuevo primero)
   rp_session  {v:1,key,date,startedAt,lastAt,stepi,src,log:{exId:[{w,reps,t}]},pr?}
   rp_prefs    {goal:"masa"|"salud",pesosDB:[kg],chartMetric,keepAwake,restNotify}
   rp_plan     [7 x rutina|"rest"|null], lunes primero
   rp_custom   {u_xxx:{name,type,sets,reps|holdSec,rest,load,zona,eq,steps}}
   rp_extras   {rutina:[exId]}   rp_swaps {rutina:{original:alterno}}   rp_doses {rutina:{exId:{sets,reps,holdSec,rest}}}
   rp_checks   {fecha:{rutina:{exId:true}}}   rp_logged {fecha:{rutina:{exId:1}}}
   rp_pain     {exId:[fechas]}   rp_notes {exId:"texto"}
   rp_inc      {exId:kg} (v36) salto de placa de cada maquina. Los juegos de
               datos no lo traen, como un telefono de v35.
   rp_bw       [{date,kg}]   rp_medidas [{date,cintura,brazo,pecho,muslo,cadera}]
   rp_streak   {count,best,last,total}   rp_weekgoal {lunes:meta}   rp_rem {enabled,times}
   rp_theme    "auto"|"light"|"dark"   rp_lastexport "AAAA-MM-DD"
   rp_schema   n (v36). Los juegos de datos no lo traen, como un telefono de
               v35: la app lo escribe al arrancar. */
var Fixtures=(function(){
  "use strict";
  const DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const p2=n=>String(n).padStart(2,"0");
  function ds(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());}
  /* AAAA-MM-DD de hace n dias (0 = hoy) */
  function fecha(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return ds(d);}
  /* un instante concreto de hace n dias, en hora local */
  function momento(n,h,m){const d=new Date();d.setDate(d.getDate()-n);d.setHours(h,m||0,0,0);return d;}
  /* entrada de rp_history igual a la que escribe recordSession */
  function entrada(key,nombre,d,sum){const e={key:key,name:nombre,iso:d.toISOString(),day:DIAS[d.getDay()],
      date:p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+d.getFullYear(),time:p2(d.getHours())+":"+p2(d.getMinutes())};
    if(sum){e.sets=sum.sets;e.vol=sum.vol;e.exDone=sum.exDone;e.exTotal=sum.exTotal;e.dur=sum.dur;e.ids=sum.ids;}
    return e;}
  /* registra una sesion: series en rp_logs (y vistos de calentamiento) y su
     entrada en el historial. plan = [[exId,kg,series,reps(,rir)]] */
  function sesion(D,key,nombre,n,plan,vistos,exTotal){
    const d=momento(n,18,30),t=d.getTime(),dia=ds(d);let sets=0,vol=0;const ids=[];
    (vistos||[]).forEach(id=>{(D.rp_logs[id]=D.rp_logs[id]||[]).push({date:dia,sets:[],k:key,t:t,checked:true});ids.push(id);});
    plan.forEach(([id,kg,ns,reps,rir],i)=>{const st=[];
      for(let s=0;s<ns;s++){const x={w:kg,reps:Math.max(1,reps-(s>=2?1:0)),t:t+(i*6+s)*150000};
        if(rir!=null&&s===ns-1)x.rir=rir;st.push(x);sets++;vol+=x.w*x.reps;}
      (D.rp_logs[id]=D.rp_logs[id]||[]).push({date:dia,sets:st,k:key,t:t});ids.push(id);});
    D.rp_history.push(entrada(key,nombre,d,{sets:sets,vol:Math.round(vol),exDone:ids.length,
      exTotal:exTotal||ids.length,dur:45+(n%4)*5,ids:ids}));
    (D.rp_logged[dia]=D.rp_logged[dia]||{})[key]=Object.fromEntries(ids.map(id=>[id,1]));
    return dia;}
  function cerrar(D){
    D.rp_history.reverse();   /* la app guarda el mas nuevo primero */
    const dias=[...new Set(D.rp_history.map(h=>{const p=h.date.split("/");return p[2]+"-"+p[1]+"-"+p[0];}))].sort();
    D.rp_streak={count:0,best:3,last:dias[dias.length-1]||null,total:D.rp_history.length};
    const keep={};Object.keys(D.rp_logged).sort().slice(-14).forEach(k=>keep[k]=D.rp_logged[k]);D.rp_logged=keep;
    return D;}

  /* ---- el dueño: gimnasio, objetivo masa, seis semanas ---- */
  function dueno(){
    const D={rp_logs:{},rp_history:[],rp_logged:{}};
    let ultimoHombro=null;
    for(let n=42;n>=1;n--){const d=momento(n,18,30),dow=d.getDay(),sem=Math.floor((42-n)/7),
        sube=Math.floor(sem/2),r=sem%3;
      if(dow===1)ultimoHombro=sesion(D,"gym_empuje","Empuje",n,[
          ["press_banca_db",26+2.5*sube,4,8+r,2],["fondos_paralelas",0,3,10+r],
          ["press_hombro_db",14+2*sube,3,9+r,1],["elevaciones_laterales",8,3,14+r],
          ["extension_triceps_polea",25+2.5*sube,3,13+r],["remo_maquina",50+2.5*sube,3,10]],
        ["caminadora","circulos_brazos","wall_angels"],14);
      else if(dow===3)sesion(D,"gym_tiron","Tirón",n,[
          ["jalon_pecho",50+2.5*sube,4,9+r,2],["remo_maquina",55+2.5*sube,5,10],
          ["curl_barra",20+2*sube,3,9+r],["pec_deck",40,3,12],["u_l8k2x1",30+2.5*sube,3,10]],
        ["caminadora","gato_camello_pie"],17);
      else if(dow===5)sesion(D,"gym_pierna","Pierna",n,[
          ["hack_squat",60+5*sube,4,7+r,1],["prensa_inclinada",120+10*sube,3,10+r],
          ["curl_femoral",35+2.5*sube,3,11+r],["extension_cuadriceps",40+2.5*sube,3,11+r]],
        ["caminadora","sentadilla_aire"],16);
      else if(dow===2)sesion(D,"postura_movilidad","Postura — Movilidad",n,[],
        ["gato_camello","wall_angels","chin_tuck","bird_dog"],9);}
    const bw=[];for(let i=27;i>=0;i--)bw.push({date:fecha(i),kg:Math.round((72+0.035*(27-i)+((i*7)%5-2)*0.15)*10)/10});
    Object.assign(D,{
      rp_prefs:{goal:"masa",chartMetric:"e1rm",keepAwake:true},
      rp_plan:["gym_empuje","postura_movilidad","gym_tiron",null,"gym_pierna","rest","rest"],
      rp_custom:{u_l8k2x1:{name:"Remo en T",type:"reps",sets:3,rest:90,load:true,zona:"espalda",eq:"barra",
        steps:["Pecho apoyado","Tira con los codos"],reps:10}},
      rp_extras:{gym_tiron:["u_l8k2x1","curl_concentrado"]},
      rp_swaps:{gym_empuje:{cruce_poleas:"aperturas_db"}},
      rp_doses:{gym_empuje:{elevaciones_laterales:{sets:3}}},
      /* molestia el dia del ultimo press de hombro: su progresion queda congelada */
      rp_pain:{press_hombro_db:[ultimoHombro]},
      rp_notes:{press_banca_db:"Banco en la muesca 3, agarre neutro",hack_squat:"Pies a media plataforma"},
      rp_bw:bw,
      rp_medidas:[{date:fecha(40),brazo:36,cintura:82,pecho:100},{date:fecha(26),brazo:36.4,cintura:82.3,pecho:100.5},
        {date:fecha(12),brazo:36.9,cintura:82.5,pecho:101.2,muslo:57}],
      rp_checks:{},rp_weekgoal:{},
      rp_rem:{enabled:false,times:["07:00","19:00"]},
      rp_theme:"dark",
      rp_lastexport:fecha(20)});
    return cerrar(D);}

  /* ---- la madre: casa, objetivo salud, mancuernas de 1, 2 y 3 kg ---- */
  function madre(){
    const D={rp_logs:{},rp_history:[],rp_logged:{}};
    for(let n=35;n>=1;n--){const dow=momento(n,9,0).getDay(),r=Math.floor((35-n)/14);
      if(dow===1)sesion(D,"salud_fuerza_a","Casa — Fuerza A",n,[
          ["sentadilla_silla",0,2,10+r],["zancada_estatica",0,2,8+r],["flexiones_pared",0,2,10+r],
          ["press_hombro_db",2,2,10+r,2],["abduccion_banda",0,2,12]],
        ["marcha_sitio","gato_camello"],12);
      else if(dow===3)sesion(D,"salud_fuerza_b","Casa — Fuerza B",n,[
          ["remo_banda",0,2,12],["peso_muerto_rumano_db",3,2,10+r],["remo_db",2,2,10+r,2],["elevaciones_laterales",1,2,12+r]],
        ["marcha_sitio","gato_camello"],12);
      else if(dow===5)sesion(D,"salud_equilibrio","Casa — Equilibrio",n,[],
        ["marcha_sitio","equilibrio_unipodal","sentadilla_silla","flexiones_pared","dead_bug"],13);}
    const bw=[];for(let i=27;i>=0;i--)if(i%2===0)bw.push({date:fecha(i),kg:Math.round((64.2-((i*3)%4)*0.1)*10)/10});
    const ini=momento(0,9,0).getTime()<Date.now()?momento(0,9,0).getTime():Date.now()-20*60000;
    Object.assign(D,{
      rp_prefs:{goal:"salud",pesosDB:[1,2,3]},
      rp_plan:["salud_fuerza_a",null,"salud_fuerza_b",null,"salud_equilibrio",null,"rest"],
      rp_bw:bw,
      rp_medidas:[{date:fecha(30),cintura:92,cadera:101},{date:fecha(16),cintura:91.5,cadera:100.6},{date:fecha(2),cintura:91,cadera:100.4}],
      rp_notes:{peso_muerto_rumano_db:"Mancuerna de 3 kg en cada mano"},
      /* sesion de hoy a medias: la tarjeta de Inicio tiene que decir "En curso" */
      rp_session:{v:1,key:"salud_fuerza_b",date:fecha(0),startedAt:ini,lastAt:ini+60000,stepi:6,src:"guided",
        log:{remo_db:[{w:2,reps:12,t:ini+30000}]}},
      rp_checks:{[fecha(0)]:{salud_fuerza_b:{marcha_sitio:true,gato_camello:true}}},
      rp_rem:{enabled:true,times:["08:00"]},
      rp_theme:"light",
      rp_lastexport:fecha(3)});
    return cerrar(D);}

  /* ---- una sesion de ayer que nunca se cerro ---- */
  function sinCerrar(){const ini=momento(1,19,0).getTime();
    return {rp_history:[],rp_logs:{},
      rp_session:{v:1,key:"gym_empuje",date:fecha(1),startedAt:ini,lastAt:ini+1800000,stepi:7,src:"guided",
        log:{press_banca_db:[{w:30,reps:8,t:ini+600000},{w:30,reps:7,t:ini+780000}]}},
      rp_checks:{[fecha(1)]:{gym_empuje:{caminadora:true}}}};}

  /* ---- semanas que cruzan cambios de hora: fechas FIJAS, no desde hoy ----
     Fuerza lunes, miercoles y viernes a las 12:00 UTC, que es el mismo dia en
     cualquier zona entre UTC-11 y UTC+11:
     - ocho semanas seguidas, del lunes 2 de marzo al domingo 26 de abril de
       2026, que cruzan el cambio de hora de EE. UU. (8 mar), el de Europa
       (29 mar) y el de Chile y Australia (5 abr);
     - tres del 12 de octubre al 1 de noviembre, que cruzan el de Europa (25 oct);
     - la del 2 de noviembre, tras el de EE. UU. (1 nov), con lunes y miercoles.
     Con el reloj en el miercoles 4 de noviembre de 2026 (app.enZona): racha 3,
     las de octubre (la semana en curso va 2 de 3), y mejor 8. */
  function cambioHora(){const D={rp_history:[],rp_logs:{}};
    const RUT=[["gym_empuje","Empuje"],["gym_tiron","Tirón"],["gym_pierna","Pierna"]];
    function semana(a,m,d,n){for(let i=0;i<(n||3);i++){const x=new Date(Date.UTC(a,m-1,d+2*i,12,0));
      D.rp_history.push({key:RUT[i][0],name:RUT[i][1],iso:x.toISOString(),day:DIAS[x.getUTCDay()],
        date:p2(x.getUTCDate())+"/"+p2(x.getUTCMonth()+1)+"/"+x.getUTCFullYear(),time:"12:00",
        sets:12,vol:3000,exDone:6,exTotal:6,dur:60,ids:[]});}}
    for(let i=0;i<8;i++)semana(2026,3,2+7*i);
    [12,19,26].forEach(d=>semana(2026,10,d));
    semana(2026,11,2,2);
    D.rp_history.reverse();   /* el mas nuevo primero */
    return Object.assign(D,{rp_prefs:{goal:"masa"},
      rp_plan:["gym_empuje",null,"gym_tiron",null,"gym_pierna","rest","rest"],
      rp_weekgoal:{},rp_streak:{count:1,best:3,last:"2026-11-04",total:D.rp_history.length}});}

  /* ---- dueno() con Empuje a medias hoy (HU-63): 3 de 14, dos de
     calentamiento con visto y el press con sus tres series ---- */
  function aMedias(){const D=dueno(),ini=Date.now()-25*60000;
    D.rp_session={v:1,key:"gym_empuje",date:fecha(0),startedAt:ini,lastAt:ini+1200000,stepi:0,src:"guided",
      log:{press_banca_db:[{w:30,reps:8,t:ini+600000},{w:30,reps:8,t:ini+800000},{w:30,reps:7,t:ini+1000000}]}};
    D.rp_checks={[fecha(0)]:{gym_empuje:{caminadora:true,circulos_brazos:true,press_banca_db:true}}};
    return D;}

  return {vacio:()=>({}),dueno:dueno,madre:madre,sinCerrar:sinCerrar,cambioHora:cambioHora,
    aMedias:aMedias,fecha:fecha,momento:momento,ds:ds};
})();
