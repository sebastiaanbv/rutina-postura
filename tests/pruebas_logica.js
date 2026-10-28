/* Logica central contra las funciones reales de la app. Cada prueba siembra
   localStorage a su medida (la app lo lee en cada llamada, no hace falta
   recargar) y deja la memoria de la app limpia con reiniciarMemoria(). */
(function(){
  const F=Fixtures,hoy=()=>F.fecha(0);
  /* un registro de rp_logs como los que escribe persistSession */
  const reg=(n,k,series)=>({date:F.fecha(n),sets:series.map((s,i)=>({w:s[0],reps:s[1],t:F.momento(n,18,i).getTime()})),k:k,t:F.momento(n,18,0).getTime()});
  const veces=(n,w,reps)=>Array.from({length:n},()=>[w,reps]);
  /* lo que importa de una sugerencia: peso, reps y el porque que lee el usuario */
  const sug=(app,id,k)=>{const s=app.w.suggestLoad(id,k);return {w:s.w,reps:s.reps,why:s.why};};
  function limpio(app,datos){app.reiniciarMemoria();app.sembrar(datos||{});}

  escenario("Lógica central",F.vacio,()=>{

    /* ---------- integridad de los datos del programa ---------- */
    test("toda rutina referencia ejercicios que existen en EX y ZONAS",app=>{
      const R=app.ev("ROUTINES"),EX=app.ev("EX"),Z=app.ev("ZONAS"),faltan=[];
      Object.keys(R).forEach(k=>{const r=R[k],ids=[].concat(r.list||[],r.warm||[],r.secondary||[],r.extras||[]);
        Object.keys(r.swaps||{}).forEach(o=>{ids.push(o);ids.push.apply(ids,r.swaps[o]);});
        ids.forEach(id=>{if(!EX[id])faltan.push(k+": "+id+" sin EX");if(!Z[id])faltan.push(k+": "+id+" sin ZONAS");});});
      expect(faltan).toEqual([]);});
    test("SECDOSE solo ajusta ejercicios de su propia rutina",app=>{
      const R=app.ev("ROUTINES"),S=app.ev("SECDOSE"),fuera=[];
      Object.keys(S).forEach(k=>{const r=R[k];if(!r){fuera.push(k+" no es rutina");return;}
        const ids=[].concat(r.list||[],r.extras||[]);Object.keys(r.swaps||{}).forEach(o=>ids.push.apply(ids,r.swaps[o]));
        Object.keys(S[k]).forEach(id=>{if(ids.indexOf(id)<0)fuera.push(k+": "+id);});});
      expect(fuera).toEqual([]);});
    test("GROUPS reparte las 9 rutinas sin repetir ni olvidar ninguna",app=>{
      const keys=[].concat.apply([],app.ev("GROUPS").map(g=>g.keys)).sort();
      expect(keys).toEqual(Object.keys(app.ev("ROUTINES")).sort());});

    /* ---------- dose / SECDOSE ---------- */
    test("dose: el bloque secundario pesa menos que el mismo ejercicio como principal",app=>{limpio(app);
      expect(app.w.dose("gym_empuje","remo_maquina").sets).toBe(3);
      expect(app.w.dose("gym_tiron","remo_maquina").sets).toBe(5);
      expect(app.w.dose("gym_empuje","remo_maquina").rest).toBe(120);});
    test("dose: la rutina de casa trae su propia dosis y startKg",app=>{limpio(app);
      expect(app.w.dose("salud_fuerza_a","press_hombro_db")).toEqual({sets:2,reps:12,holdSec:30,rest:45,startKg:2,custom:false});
      expect(app.w.dose("gym_empuje","press_hombro_db")).toEqual({sets:3,reps:10,holdSec:30,rest:120,custom:false});});
    test("dose: rest:0 es un valor real, no cae al defecto de 30",app=>{limpio(app);
      const d=app.w.dose("salud_fuerza_a","gato_camello");
      expect(d.rest).toBe(0);expect(d.reps).toBe(8);});
    test("dose: el ajuste del usuario pisa al programa solo en su rutina",app=>{
      limpio(app,{rp_doses:{gym_empuje:{press_banca_db:{sets:5,rest:0}}}});
      expect(app.w.dose("gym_empuje","press_banca_db")).toEqual({sets:5,reps:8,holdSec:30,rest:0,custom:true});
      expect(app.w.dose("gym_tiron","press_banca_db").sets).toBe(4);
      expect(app.w.dose(null,"press_banca_db")).toEqual({sets:4,reps:8,holdSec:30,rest:120,custom:false});});
    test("dose: ejercicio desconocido cae a los valores por defecto",app=>{limpio(app);
      expect(app.w.dose("gym_empuje","no_existe")).toEqual({sets:1,reps:10,holdSec:30,rest:30,custom:false});});

    /* ---------- suggestLoad ---------- */
    test("suggestLoad sin historial: objetivo del programa y 10 kg por defecto",app=>{limpio(app);
      expect(sug(app,"press_banca_db","gym_empuje")).toEqual({w:10,reps:8,why:"Objetivo del programa: 8 repeticiones"});});
    test("suggestLoad sin historial en casa: arranca en startKg (2 kg, no 10)",app=>{limpio(app);
      expect(sug(app,"press_hombro_db","salud_fuerza_a")).toEqual({w:2,reps:12,why:"Objetivo del programa: 12 repeticiones"});
      expect(sug(app,"sentadilla_silla","salud_fuerza_a").w).toBe(0);});
    test("suggestLoad sin carga (flexiones en la pared): peso 0",app=>{limpio(app);
      expect(sug(app,"flexiones_pared","salud_fuerza_a")).toEqual({w:0,reps:12,why:"Objetivo del programa: 12 repeticiones"});});
    test("suggestLoad dentro del rango: mismo peso y una rep mas",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(4,30,8))]}});
      expect(sug(app,"press_banca_db","gym_empuje")).toEqual({w:30,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});});
    test("suggestLoad parte de la PRIMERA serie, no de la mas cansada",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8],[30,8],[30,7],[30,6]])]}});
      expect(sug(app,"press_banca_db","gym_empuje").reps).toBe(9);});
    test("suggestLoad con el rango lleno y todas las series: sube 2,5 kg y vuelve al minimo",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(4,30,10))]}});
      expect(sug(app,"press_banca_db","gym_empuje")).toEqual({w:32.5,reps:6,why:"Llenaste el rango entero: sube a 32.5 kg y vuelve a 6"});});
    test("suggestLoad con el rango lleno pero series de menos: no sube carga",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(3,30,10))]}});
      expect(sug(app,"press_banca_db","gym_empuje")).toEqual({w:30,reps:10,why:"La vez pasada 10: hoy 10 con el mismo peso"});});
    test("suggestLoad: si el salto pasa del 10% estira el rango en vez de subir",app=>{
      limpio(app,{rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(4,8,20))]}});
      expect(sug(app,"elevaciones_laterales","gym_empuje")).toEqual({w:8,reps:22,why:"El salto de peso sería más del 10%: estira el rango a 22 reps"});});
    test("suggestLoad con mancuernas 1-2-3: salto grande, primero estira a 14",app=>{
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_logs:{press_hombro_db:[reg(2,"salud_fuerza_a",veces(2,2,12))]}});
      expect(sug(app,"press_hombro_db","salud_fuerza_a")).toEqual({w:2,reps:14,why:"Tu siguiente mancuerna (3 kg) es un salto grande: antes llega a 14 reps"});});
    test("suggestLoad con mancuernas 1-2-3: rango estirado lleno, sube a la siguiente que existe",app=>{
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_logs:{press_hombro_db:[reg(2,"salud_fuerza_a",veces(2,2,14))]}});
      expect(sug(app,"press_hombro_db","salud_fuerza_a")).toEqual({w:3,reps:8,why:"Sube a tu mancuerna de 3 kg y vuelve a 8 reps"});});
    test("suggestLoad con mancuernas 1-2-3: ya en la mas pesada, estira",app=>{
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_logs:{peso_muerto_rumano_db:[reg(2,"salud_fuerza_b",veces(2,3,12))]}});
      expect(sug(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:14,why:"Ya usas tu mancuerna más pesada: estira a 14 reps"});});
    test("suggestLoad con mancuernas reales y salto suave (≤10%): sube directo",app=>{
      limpio(app,{rp_prefs:{pesosDB:[20,22,24]},rp_logs:{press_banca_db:[reg(2,"gym_empuje",veces(4,20,10))]}});
      expect(sug(app,"press_banca_db","gym_empuje")).toEqual({w:22,reps:6,why:"Sube a tu mancuerna de 22 kg y vuelve a 6 reps"});});
    test("suggestLoad: molestia la ultima vez congela la progresion",app=>{const d=F.fecha(2);
      limpio(app,{rp_pain:{press_banca_db:[d]},rp_logs:{press_banca_db:[reg(2,"gym_empuje",veces(4,30,10))]}});
      const s=app.w.suggestLoad("press_banca_db","gym_empuje");
      expect({w:s.w,reps:s.reps,why:s.why}).toEqual({w:30,reps:10,why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});
      expect(s.target.dolor).toBe(true);});
    test("suggestLoad: molestia repetida en 28 dias sugiere cambiar el ejercicio",app=>{
      limpio(app,{rp_pain:{press_banca_db:[F.fecha(9),F.fecha(2)]},rp_logs:{press_banca_db:[reg(9,"gym_empuje",veces(4,30,9)),reg(2,"gym_empuje",veces(4,30,10))]}});
      expect(sug(app,"press_banca_db","gym_empuje").why).toBe("Molestia repetida en este ejercicio: no subas y plantéate cambiarlo por otro");});
    test("suggestLoad: una molestia vieja (no de la ultima sesion) ya no frena",app=>{
      limpio(app,{rp_pain:{press_banca_db:[F.fecha(9)]},rp_logs:{press_banca_db:[reg(9,"gym_empuje",veces(4,30,9)),reg(2,"gym_empuje",veces(4,30,10))]}});
      expect(sug(app,"press_banca_db","gym_empuje").w).toBe(32.5);});
    test("suggestLoad: la serie recien registrada en la sesion manda",app=>{const t=Date.now();
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(4,30,8))]},
        rp_session:{v:1,key:"gym_empuje",date:hoy(),startedAt:t,lastAt:t,stepi:0,src:"guided",log:{press_banca_db:[{w:22,reps:7,t:t}]}}});
      app.ev("curRoutine='gym_empuje'");
      expect(sug(app,"press_banca_db","gym_empuje")).toEqual({w:22,reps:7,why:""});
      app.reiniciarMemoria();});
    test("suggestLoad en un ejercicio sin carga declarada: una rep mas que la vez pasada",app=>{
      limpio(app,{rp_logs:{wall_angels:[reg(2,"gym_empuje",veces(2,0,10))]}});
      expect(sug(app,"wall_angels","gym_empuje")).toEqual({w:0,reps:11,why:"La vez pasada llegaste a 10: prueba con 11"});});
    test.skip("suggestLoad sin carga y con el rango lleno: el porque no habla de peso",
      "BUG: en un ejercicio de peso corporal (load:false) con el rango lleno la meta se queda fija en el tope y el texto dice 'con el mismo peso' (flexiones en la pared de la madre: 'La vez pasada 12: hoy 12 con el mismo peso' para siempre).",
      app=>{limpio(app,{rp_logs:{flexiones_pared:[reg(2,"salud_fuerza_a",veces(2,0,12))]}});
        expect(sug(app,"flexiones_pared","salud_fuerza_a").why).not.toContain("peso");});
    test("availDB: solo para mancuerna y solo si se declararon",app=>{limpio(app);
      expect(app.w.availDB("press_banca_db")).toBe(null);
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]}});
      expect(app.w.availDB("press_banca_db")).toEqual([1,2,3]);
      expect(app.w.availDB("jalon_pecho")).toBe(null);
      app.sembrar({rp_prefs:{pesosDB:[]}});
      expect(app.w.availDB("press_banca_db")).toBe(null);});
    test("repRange, loadStep, progStep y e1rm",app=>{
      expect(app.w.repRange("press_banca_db")).toEqual([6,10]);
      expect(app.w.repRange("jalon_pecho")).toEqual([8,12]);
      expect(app.w.repRange("elevaciones_laterales")).toEqual([12,20]);
      expect([8,15,20,25,30].map(w=>app.w.loadStep(w))).toEqual([0,0,0,2.5,2.5]);
      expect([5,15,25].map(w=>app.w.progStep(w))).toEqual([1,2,2.5]);
      expect(app.w.e1rm(100,10)).toBeCloseTo(133.333,3);});

    /* ---------- isPR ---------- */
    test("isPR: record solo si ninguna serie anterior lo domina en peso Y reps",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8],[30,8]])]}});
      const pr=(w,r)=>app.w.isPR("press_banca_db",w,r);
      expect([pr(30,8),pr(30,7),pr(25,8),pr(32.5,6),pr(30,9),pr(25,12)]).toEqual([false,false,false,true,true,true]);});
    test("isPR: sin historial o sin reps no hay record",app=>{limpio(app);
      expect(app.w.isPR("press_banca_db",50,10)).toBe(false);
      app.sembrar({rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8]])]}});
      expect(app.w.isPR("press_banca_db",40,0)).toBe(false);});
    test("isPR: cuenta tambien las series de la sesion en curso",app=>{const t=Date.now();
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8]])]},
        rp_session:{v:1,key:"gym_empuje",date:hoy(),startedAt:t,lastAt:t,stepi:0,src:"guided",log:{press_banca_db:[{w:35,reps:8,t:t}]}}});
      app.ev("curRoutine='gym_empuje'");
      expect(app.w.isPR("press_banca_db",35,8)).toBe(false);
      expect(app.w.isPR("press_banca_db",35,9)).toBe(true);
      app.reiniciarMemoria();});
    /* HU-10: isPR y prFeed (Récords recientes) cuentan lo mismo */
    test("isPR: una serie de calentamiento (warmIds) no es record, igual que en prFeed",app=>{
      expect(app.w.warmIds().rotacion_externa_db).toBe(1);
      /* isPR mide la serie antes de guardarla; prFeed, ya guardada hoy */
      const antes=()=>[reg(3,"gym_empuje",[[2,12]])],guardada=()=>antes().concat([reg(0,"gym_empuje",[[3,12]])]);
      limpio(app,{rp_logs:{rotacion_externa_db:antes(),press_hombro_db:antes()}});
      /* el mismo salto en un ejercicio de trabajo si lo es, en los dos */
      expect(app.w.isPR("press_hombro_db",3,12)).toBe(true);
      expect(app.w.isPR("rotacion_externa_db",3,12)).toBe(false);
      app.sembrar({rp_logs:{rotacion_externa_db:guardada(),press_hombro_db:guardada()}});
      expect(app.w.prFeed(30).map(p=>p.id)).toEqual(["press_hombro_db"]);});
    test("isPR y prFeed coinciden serie a serie con los mismos datos",app=>{const t=Date.now();
      const casos={
        press_banca_db:{hist:[reg(10,"gym_empuje",[[30,8],[30,8]]),reg(3,"gym_empuje",[[32.5,6],[30,9]])],
          hoy:[[30,8],[32.5,7],[32.5,7],[35,5],[25,12],[30,10]]},
        flexiones_pared:{hist:[reg(5,"gym_empuje",[[0,10],[0,12]])],hoy:[[0,11],[0,13],[0,13],[0,14]]},
        rotacion_externa_db:{hist:[reg(5,"gym_empuje",[[2,12]])],hoy:[[3,12],[3,14]]},
        /* primera vez: solo marca el punto de partida (antes isPR celebraba la 2.a serie) */
        curl_barra:{hist:[],hoy:[[20,8],[22,8],[22,9]]},
        /* solo con visto la vez anterior: la primera serie con peso ya es record */
        jalon_pecho:{hist:[{date:F.fecha(4),sets:[],k:"gym_tiron",t:F.momento(4,18,0).getTime(),checked:true}],hoy:[[50,8],[50,8],[55,8]]}};
      const sesion=log=>({v:1,key:"gym_empuje",date:hoy(),startedAt:t,lastAt:t,stepi:0,src:"guided",log:log});
      const res={};
      Object.keys(casos).forEach(id=>{const c=casos[id],hoyReg=n=>c.hist.concat(n?[reg(0,"gym_empuje",c.hoy.slice(0,n))]:[]);
        /* prFeed: la serie n es record si al guardarla aparece una entrada mas de hoy */
        const cuenta=n=>{app.sembrar({rp_logs:{[id]:hoyReg(n)}});return app.w.prFeed(30).filter(p=>p.id===id&&p.date===hoy()).length;};
        const feed=c.hoy.map((x,n)=>cuenta(n+1)-cuenta(n)===1);
        /* isPR como lo llama logSet: historial guardado y las series anteriores en la sesion */
        const vivo=c.hoy.map(([w,r],n)=>{limpio(app,{rp_logs:{[id]:c.hist},rp_session:sesion({[id]:c.hoy.slice(0,n).map(([a,b])=>({w:a,reps:b,t:t}))})});
          app.ev("curRoutine='gym_empuje'");return app.w.isPR(id,w,r);});
        /* y como lo llama prRecalc: la sesion entera y el numero de la serie */
        limpio(app,{rp_logs:{[id]:c.hist},rp_session:sesion({[id]:c.hoy.map(([a,b])=>({w:a,reps:b,t:t}))})});
        app.ev("curRoutine='gym_empuje'");
        const porNumero=c.hoy.map(([w,r],n)=>app.w.isPR(id,w,r,n));
        expect({id:id,isPR:vivo}).toEqual({id:id,isPR:feed});
        expect({id:id,isPR:porNumero}).toEqual({id:id,isPR:feed});
        res[id]=feed;});
      expect(res).toEqual({press_banca_db:[false,true,false,true,true,true],flexiones_pared:[false,true,false,true],
        rotacion_externa_db:[false,false],curl_barra:[false,false,false],jalon_pecho:[true,false,true]});
      app.reiniciarMemoria();});
    test("prKind: Peso máximo, Mejor 1RM est. o Más reps con X kg",app=>{
      /* mejor e1RM previo: 30 x 8 = 38 */
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8],[30,8],[25,10]])],flexiones_pared:[reg(3,"salud_fuerza_a",[[0,12]])]}});
      const caso=(id,w,r)=>[app.w.isPR(id,w,r),app.w.prKind(id,w,r)];
      expect(caso("press_banca_db",32.5,6)).toEqual([true,"Peso máximo"]);
      expect(caso("press_banca_db",30,10)).toEqual([true,"Mejor 1RM est."]);
      expect(caso("press_banca_db",25,11)).toEqual([true,"Más reps con 25 kg"]);
      /* sin carga no hay kilos que nombrar */
      expect(caso("flexiones_pared",0,14)).toEqual([true,"Más reps"]);
      /* bajo el rango (6-10) el e1RM no cuenta, aunque salga mayor: guardarrail de bestE1 */
      app.sembrar({rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8],[35,3]])]}});
      expect(app.w.e1rm(33,5)).toBeGreaterThan(app.w.e1rm(30,8)*1.005);
      expect(caso("press_banca_db",33,5)).toEqual([true,"Más reps con 33 kg"]);});
    test("prKind cuenta las series anteriores de hoy, no la propia ni las siguientes",app=>{const t=Date.now(),S=[[32.5,6],[32.5,8],[35,6]];
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",[[30,8]])]},
        rp_session:{v:1,key:"gym_empuje",date:hoy(),startedAt:t,lastAt:t,stepi:0,src:"guided",
          log:{press_banca_db:S.map(([w,r])=>({w:w,reps:r,t:t}))}}});
      app.ev("curRoutine='gym_empuje'");
      expect(S.map(([w,r],i)=>app.w.prKind("press_banca_db",w,r,i))).toEqual(["Peso máximo","Mejor 1RM est.","Peso máximo"]);
      app.reiniciarMemoria();});

    /* ---------- effList / buildSteps / estMinutes ---------- */
    test("effList: calentamiento, entrenamiento y bloque secundario en ese orden",app=>{limpio(app);
      expect(app.w.effList("gym_empuje")).toEqual(["caminadora","circulos_brazos","wall_angels","rotacion_externa_db","flexiones_inclinadas",
        "press_banca_db","fondos_paralelas","cruce_poleas","press_hombro_db","elevaciones_laterales",
        "extension_triceps_sobrecabeza_polea","extension_triceps_polea","remo_maquina","elevacion_pantorrilla"]);
      expect(app.w.effList("no_existe")).toEqual([]);});
    test("effList: cambio en su sitio, opcionales al final del entrenamiento, sin duplicados",app=>{
      limpio(app,{rp_swaps:{gym_empuje:{press_banca_db:"flexiones"}},rp_extras:{gym_empuje:["reverse_fly","cruce_poleas","no_existe"]}});
      const l=app.w.effList("gym_empuje");
      expect(l.slice(5,13)).toEqual(["flexiones","fondos_paralelas","cruce_poleas","press_hombro_db","elevaciones_laterales",
        "extension_triceps_sobrecabeza_polea","extension_triceps_polea","reverse_fly"]);
      expect(l.slice(-2)).toEqual(["remo_maquina","elevacion_pantorrilla"]);
      expect(l.indexOf("press_banca_db")).toBe(-1);
      expect(l.length).toBe(15);});
    test("effList: un ejercicio propio (rp_custom) entra por rp_extras",app=>{
      limpio(app,{rp_custom:{u_prueba1:{name:"Remo en T",type:"reps",sets:3,reps:10,rest:90,load:true,zona:"espalda",eq:"barra",steps:[]}},
        rp_extras:{gym_tiron:["u_prueba1"]}});
      app.w.mergeCustom();
      const l=app.w.effList("gym_tiron");
      expect(l.indexOf("u_prueba1")).toBe(l.indexOf("pec_deck")-1);
      expect(app.w.dose("gym_tiron","u_prueba1")).toEqual({sets:3,reps:10,holdSec:30,rest:90,custom:false});});
    test("buildSteps: numero de pasos de cada rutina (linea base)",app=>{limpio(app);
      const n={};Object.keys(app.ev("ROUTINES")).forEach(k=>n[k]=app.w.buildSteps(k).length);
      expect(n).toEqual({cuello_rostro:16,gym_empuje:35,gym_pierna:37,gym_tiron:38,postura_completa:22,postura_movilidad:15,
        salud_equilibrio:21,salud_fuerza_a:19,salud_fuerza_b:19});});
    test("buildSteps: cardio es un solo paso cronometrado sin descanso",app=>{limpio(app);
      const s=app.w.buildSteps("gym_empuje")[0];
      expect({id:s.id,kind:s.kind,seconds:s.seconds,restAfter:s.restAfter,label:s.label}).toEqual(
        {id:"caminadora",kind:"timer",seconds:300,restAfter:0,label:"Calentamiento general"});});
    test("buildSteps: series con carga, descanso entre series y no tras la ultima",app=>{limpio(app);
      const st=app.w.buildSteps("gym_empuje").filter(s=>s.id==="press_banca_db");
      expect(st.map(s=>s.label)).toEqual(["Serie 1 de 4","Serie 2 de 4","Serie 3 de 4","Serie 4 de 4"]);
      expect(st.map(s=>s.restAfter)).toEqual([120,120,120,0]);
      expect(st.map(s=>s.first)).toEqual([true,false,false,false]);
      expect([st[0].kind,st[0].reps,st[0].load,st[0].exI,st[0].exN]).toEqual(["count",8,true,6,14]);});
    test("buildSteps: por lado y aguantes por lado",app=>{limpio(app);
      const r=app.w.buildSteps("salud_fuerza_b").filter(s=>s.id==="remo_db");
      expect(r.map(s=>s.label)).toEqual(["Serie 1 de 2 · cada lado","Serie 2 de 2 · cada lado"]);
      expect(r[0].perSide).toBe(true);expect(r[0].reps).toBe(12);
      const e=app.w.buildSteps("salud_equilibrio").filter(s=>s.id==="equilibrio_unipodal");
      expect(e.map(s=>s.side)).toEqual(["izq","der","izq","der"]);
      expect(e.map(s=>s.restAfter)).toEqual([0,20,0,0]);
      expect(e[0].label).toBe("Serie 1/2 · Izquierdo");});
    test("buildSteps: aguante simple y ajuste del usuario a 2 series",app=>{
      limpio(app,{rp_doses:{gym_empuje:{press_banca_db:{sets:2}}}});
      const g=app.w.buildSteps("salud_equilibrio").filter(s=>s.id==="caminata_granjero");
      expect(g.map(s=>[s.kind,s.seconds,s.label,s.restAfter])).toEqual([["timer",30,"Mantén 1 de 2",45],["timer",30,"Mantén 2 de 2",0]]);
      expect(app.w.buildSteps("gym_empuje").filter(s=>s.id==="press_banca_db").length).toBe(2);});
    test.skip("buildSteps: un descanso de 0 s en un aguante se respeta",
      "BUG: buildSteps usa d.rest||15 (aguante) y d.rest||10 (por lado), asi que un rest:0 ajustado por el usuario se convierte en 15/10 s; dose() advierte justo lo contrario ('!=null, nunca ||: rest:0 es un valor real'). estMinutes tiene el mismo patron con d.rest||30.",
      app=>{limpio(app,{rp_doses:{postura_completa:{isometricos_cervicales:{rest:0}}}});
        const s=app.w.buildSteps("postura_completa").filter(x=>x.id==="isometricos_cervicales");
        expect(s.map(x=>x.restAfter)).toEqual([0,0,0]);});
    test("estMinutes: minutos estimados de cada rutina (linea base)",app=>{limpio(app);
      const m={};Object.keys(app.ev("ROUTINES")).forEach(k=>m[k]=app.w.estMinutes(k));
      expect(m).toEqual({cuello_rostro:19,gym_empuje:62,gym_pierna:68,gym_tiron:64,postura_completa:21,postura_movilidad:14,
        salud_equilibrio:25,salud_fuerza_a:24,salud_fuerza_b:24});
      expect(app.w.estMinutes("no_existe")).toBe(0);});
    test("estMinutes: sube si el usuario anade series",app=>{
      limpio(app,{rp_doses:{gym_empuje:{press_banca_db:{sets:6}}}});
      expect(app.w.estMinutes("gym_empuje")).toBeGreaterThan(62);});

    /* ---------- fechas ---------- */
    test("dlocal: AAAA-MM-DD es medianoche LOCAL (no UTC)",app=>{
      const d=app.w.dlocal("2026-09-23");
      expect([d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes()]).toEqual([2026,8,23,0,0]);
      ["2026-01-01","2026-03-08","2026-11-01","2026-12-31","2024-02-29","2027-01-01"].forEach(s=>
        expect(app.w.ds(app.w.dlocal(s))).toBe(s));
      expect(app.w.ds(app.w.dlocal(app.w.today()))).toBe(F.fecha(0));});
    test("wkKey: la semana empieza el lunes, el domingo es del lunes anterior",app=>{
      const k=s=>app.w.wkKey(app.w.dlocal(s));
      expect([k("2026-09-21"),k("2026-09-23"),k("2026-09-27"),k("2026-09-28")]).toEqual(["2026-09-21","2026-09-21","2026-09-21","2026-09-28"]);});

    /* ---------- indice de fuerza ---------- */
    test("strengthIdx: null sin 3 sesiones del mismo ejercicio con peso",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(13,"gym_empuje",[[30,8]]),reg(6,"gym_empuje",[[32.5,8]])]}});
      expect(app.w.strengthIdx(null)).toBe(null);});
    test("strengthIdx: ultimo e1RM contra la mediana de las tres primeras",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(20,"gym_empuje",[[30,8],[25,8]]),reg(13,"gym_empuje",[[32.5,8]]),reg(6,"gym_empuje",[[35,8],[40,15]])]}});
      const e=(w,r)=>w*(1+r/30),r=app.w.strengthIdx(null);
      expect(r.n).toBe(1);
      expect(r.idx).toBeCloseTo(100*e(35,8)/e(32.5,8),6);});
    test("strengthIdx: ignora lo que lleva mas de 21 dias sin entrenar y respeta el corte",app=>{
      const L={press_banca_db:[reg(40,"gym_empuje",[[30,8]]),reg(33,"gym_empuje",[[32.5,8]]),reg(26,"gym_empuje",[[35,8]])]};
      limpio(app,{rp_logs:L});
      expect(app.w.strengthIdx(null)).toBe(null);
      const r=app.w.strengthIdx(F.fecha(20));
      expect(r&&r.n).toBe(1);
      expect(app.w.strengthIdx(F.fecha(30))).toBe(null);});
  });

  /* HU-10: el record se ve en la propia serie, dice que se supero y se limpia
     si la serie se borra o se corrige. Por el guiado real: openRoutine,
     startRoutine, logSet, delSet, editSet y finish. */
  const PECHO="press_banca_db";
  /* hace 3 dias: 30 x 8 (e1RM 38) y 25 x 10 */
  const base=()=>({rp_logs:{[PECHO]:[reg(3,"gym_empuje",[[30,8],[30,8],[25,10]])]}});
  async function anotar(app,series){app.w.openRoutine("gym_empuje");app.w.startRoutine(PECHO);
    for(const [w,r] of series){app.ev("curW="+w+";curReps="+r);app.w.logSet();
      await app.espera(400);   /* el visto de 300 ms antes del descanso */
      if(app.$("#guided .gbtn.rest"))app.w.skipRest();}}
  const prs=app=>((app.leer("rp_session")||{}).pr||[]).map(p=>[p.w,p.reps,p.i,p.kind]);
  const lineas=app=>app.$$("#guided .setline").map(l=>[l.id.replace("sl_"+PECHO+"_",""),l.classList.contains("pr"),
    l.querySelector(".prtag")?l.querySelector(".prtag").textContent.trim():""]);
  const sinAviso=app=>{app.$("#toast").innerHTML="";};

  escenario("Récord en la propia serie",F.vacio,()=>{
    test("dos series iguales que baten la marca: solo la primera lleva la clase pr",async app=>{limpio(app,base());
      await anotar(app,[[32.5,8],[32.5,8]]);
      expect(prs(app)).toEqual([[32.5,8,0,"Peso máximo"]]);
      expect(lineas(app)).toEqual([["0",true,"Peso máximo"],["1",false,""]]);
      app.reiniciarMemoria();});
    test("cada record dice que se supero, en la serie y en la pantalla de fin",async app=>{limpio(app,base());
      await anotar(app,[[32.5,6],[30,10],[25,11]]);
      const tipos=["Peso máximo","Mejor 1RM est.","Más reps con 25 kg"];
      expect(prs(app)).toEqual([[32.5,6,0,tipos[0]],[30,10,1,tipos[1]],[25,11,2,tipos[2]]]);
      expect(lineas(app).map(l=>l[2])).toEqual(tipos);
      app.w.finish();
      expect(app.texto("#guided")).toContain("Completada");
      expect(app.$$("#guided .doneprs .r .k").map(k=>k.textContent)).toEqual(tipos);
      expect(app.texto("#guided .doneprs")).toContain("32.5 kg × 6");
      expect(app.leer("rp_history")[0].pr.map(p=>[p.i,p.kind])).toEqual([[0,tipos[0]],[1,tipos[1]],[2,tipos[2]]]);
      app.reiniciarMemoria();});
    test("borrar la serie record (delSet) quita su record de la sesión y de la pantalla de fin",async app=>{limpio(app,base());
      await anotar(app,[[35,8],[30,8]]);
      expect(prs(app)).toEqual([[35,8,0,"Peso máximo"]]);
      app.w.delSet(PECHO,"s",-1,0,-1);
      expect(prs(app)).toEqual([]);
      expect(lineas(app)).toEqual([["0",false,""]]);
      app.w.finish();
      expect(app.texto("#guided")).toContain("Completada");
      expect(app.$("#guided .doneprs")).toBe(null);
      expect(app.leer("rp_history")[0].pr).toBe(undefined);
      app.reiniciarMemoria();});
    test("corregir la serie record (editSet) quita su record si deja de serlo",async app=>{limpio(app,base());
      await anotar(app,[[35,8]]);
      expect(prs(app)).toEqual([[35,8,0,"Peso máximo"]]);
      app.w.editSet(PECHO,"s",-1,0,-1,0);
      app.$("#se_w").value="30";app.$("#se_r").value="7";app.$("#sl_"+PECHO+"_0 .setok").click();
      expect(app.leer("rp_session").log[PECHO].map(x=>[x.w,x.reps])).toEqual([[30,7]]);
      expect(prs(app)).toEqual([]);
      expect(lineas(app)).toEqual([["0",false,""]]);
      app.w.finish();
      expect(app.$("#guided .doneprs")).toBe(null);
      app.reiniciarMemoria();});
    test("corregir una errata deja el record en su serie; borrar una anterior lo cambia de número",async app=>{limpio(app,base());
      await anotar(app,[[30,8],[35,8]]);
      expect(prs(app)).toEqual([[35,8,1,"Peso máximo"]]);
      app.w.editSet(PECHO,"s",-1,1,-1,1);
      app.$("#se_w").value="37.5";app.$("#sl_"+PECHO+"_1 .setok").click();
      expect(prs(app)).toEqual([[37.5,8,1,"Peso máximo"]]);
      app.w.delSet(PECHO,"s",-1,0,-1);
      expect(prs(app)).toEqual([[37.5,8,0,"Peso máximo"]]);
      expect(lineas(app)).toEqual([["0",true,"Peso máximo"]]);
      app.reiniciarMemoria();});
    test("un record de nivel 1 no lanza aviso flotante; el de nivel 2 sí",async app=>{limpio(app,base());
      app.w.openRoutine("gym_empuje");app.w.startRoutine(PECHO);
      /* 25 x 11: mas reps que nunca con 25 kg, pero el e1RM no mejora */
      sinAviso(app);app.ev("curW=25;curReps=11");app.w.logSet();
      const p1=app.leer("rp_session").pr;
      expect(p1.map(p=>[p.lvl,p.kind])).toEqual([[1,"Más reps con 25 kg"]]);
      expect(app.texto("#toast")).toBe("");
      await app.espera(400);app.w.skipRest();
      expect(lineas(app)).toEqual([["0",true,"Más reps con 25 kg"]]);
      /* 32.5 x 8: nuevo maximo de e1RM */
      sinAviso(app);app.ev("curW=32.5;curReps=8");app.w.logSet();
      expect(app.leer("rp_session").pr.map(p=>p.lvl)).toEqual([1,2]);
      expect(app.texto("#toast")).toBe("Récord en "+app.w.shortName(PECHO)+": 32.5 kg × 8");
      await app.espera(400);
      app.reiniciarMemoria();});
  });
})();
