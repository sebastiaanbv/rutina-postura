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
  /* el objetivo de hoy entero, con sus marcas (extiende, subeCarga, dolor, nuevo) */
  const tt=(app,id,k)=>app.w.todayTarget(k,id);
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
    /* era un test.skip (BUG: «La vez pasada 12: hoy 12 con el mismo peso» para
       siempre en las flexiones en la pared). HU-79: sin carga, con el rango
       lleno, una mas hasta tope+2, sin hablar de peso */
    test("suggestLoad sin carga y con el rango lleno: el porque no habla de peso",
      app=>{limpio(app,{rp_logs:{flexiones_pared:[reg(2,"salud_fuerza_a",veces(2,0,12))]}});
        expect(sug(app,"flexiones_pared","salud_fuerza_a").why).not.toContain("peso");
        expect(sug(app,"flexiones_pared","salud_fuerza_a")).toEqual({w:0,reps:13,why:"La vez pasada 12: hoy 13"});});
    test("availDB: solo para mancuerna y solo si se declararon",app=>{limpio(app);
      expect(app.w.availDB("press_banca_db")).toBe(null);
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]}});
      expect(app.w.availDB("press_banca_db")).toEqual([1,2,3]);
      expect(app.w.availDB("jalon_pecho")).toBe(null);
      app.sembrar({rp_prefs:{pesosDB:[]}});
      expect(app.w.availDB("press_banca_db")).toBe(null);});
    test("availDB con la rutina: en casa todo lo que lleva carga se hace con la lista",app=>{
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]}});
      /* sin rutina (botones del guiado, aproximacion) solo los de mancuerna, como en v35 */
      expect(app.w.availDB("sentadilla_silla")).toBe(null);
      expect(app.w.availDB("sentadilla_silla","salud_fuerza_a")).toEqual([1,2,3]);
      expect(app.w.availDB("sentadilla_silla","salud_equilibrio")).toEqual([1,2,3]);
      expect(app.w.availDB("zancada_estatica","salud_fuerza_a")).toEqual([1,2,3]);
      expect(app.w.availDB("elevacion_pantorrilla","salud_fuerza_a")).toEqual([1,2,3]);
      /* fuera de casa los gemelos son de maquina; sin carga no hay mancuerna */
      expect(app.w.availDB("elevacion_pantorrilla","gym_empuje")).toBe(null);
      expect(app.w.availDB("flexiones_pared","salud_fuerza_a")).toBe(null);
      expect(app.w.availDB("press_banca_db","gym_empuje")).toEqual([1,2,3]);
      app.sembrar({});
      expect(app.w.availDB("sentadilla_silla","salud_fuerza_a")).toBe(null);});
    test("repRange, loadStep, progStep y e1rm",app=>{
      expect(app.w.repRange("press_banca_db")).toEqual([6,10]);
      expect(app.w.repRange("jalon_pecho")).toEqual([8,12]);
      expect(app.w.repRange("elevaciones_laterales")).toEqual([12,20]);
      /* v36: loadStep ya no devuelve 0 por encima del 10%; ese corte decide en
         todayTarget cuando se sube (al llenar tope+2), no si se sube */
      expect([8,15,20,25,30].map(w=>app.w.loadStep(w))).toEqual([1,2,2.5,2.5,2.5]);
      expect([5,15,25].map(w=>app.w.progStep(w))).toEqual([1,2,2.5]);
      expect(app.w.e1rm(100,10)).toBeCloseTo(133.333,3);});

    /* ---------- todayTarget: los ligeros vuelven a subir (v36) ----------
       Hasta v35 un salto de mas del 10% (todo peso por debajo de 25 kg) solo
       estiraba el rango a tope+2, para siempre. Ahora, con tope+2 lleno, sube. */
    test("todayTarget a 8 kg con el rango lleno: estira a tope+2, como en v35",app=>{
      limpio(app,{rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(4,8,20))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:8,reps:22,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 22 reps"});});
    test("todayTarget a 8 kg con todas las series en tope+2: sube a 9 kg y vuelve al minimo",app=>{
      limpio(app,{rp_logs:{elevaciones_laterales:[reg(8,"gym_empuje",veces(4,8,20)),reg(3,"gym_empuje",veces(4,8,22))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:9,reps:12,subeCarga:true,
        why:"Llegaste a 22 reps: sube a 9 kg y vuelve a 12"});
      expect(sug(app,"elevaciones_laterales","gym_empuje")).toEqual({w:9,reps:12,why:"Llegaste a 22 reps: sube a 9 kg y vuelve a 12"});});
    test("todayTarget a 8 kg: una serie por debajo de tope+2, o series de menos, todavia no sube",app=>{
      limpio(app,{rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",[[8,22],[8,22],[8,22],[8,21]])]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:8,reps:22,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 22 reps"});
      app.sembrar({rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(3,8,22))]}});
      const t=tt(app,"elevaciones_laterales","gym_empuje");
      expect(t.w).toBe(8);expect(t.subeCarga).toBeFalsy();});
    test("todayTarget a 22 kg (salto de 2,5 = 11%): estira primero y tras tope+2 propone 24,5 kg",app=>{
      limpio(app,{rp_logs:{curl_femoral:[reg(3,"gym_pierna",veces(3,22,12))]}});
      expect(tt(app,"curl_femoral","gym_pierna")).toEqual({w:22,reps:14,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 14 reps"});
      app.sembrar({rp_logs:{curl_femoral:[reg(8,"gym_pierna",veces(3,22,12)),reg(3,"gym_pierna",veces(3,22,14))]}});
      expect(tt(app,"curl_femoral","gym_pierna")).toEqual({w:24.5,reps:8,subeCarga:true,
        why:"Llegaste a 14 reps: sube a 24.5 kg y vuelve a 8"});});
    test("no regresion: a 40 kg con el rango lleno sube directo a 42,5 kg",app=>{
      limpio(app,{rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(4,40,10))]}});
      expect(tt(app,"press_banca_db","gym_empuje")).toEqual({w:42.5,reps:6,subeCarga:true,
        why:"Llenaste el rango entero: sube a 42.5 kg y vuelve a 6"});
      /* el borde: 2,5 kg sobre 25 es justo el 10% y tambien sube sin estirar */
      app.sembrar({rp_logs:{curl_femoral:[reg(3,"gym_pierna",veces(3,25,12))]}});
      expect(tt(app,"curl_femoral","gym_pierna")).toEqual({w:27.5,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 27.5 kg y vuelve a 8"});
      /* sin peso todavia (sentadilla_silla arranca en 0 kg): sube 1 kg, como en v35 */
      app.sembrar({rp_logs:{sentadilla_silla:[reg(3,"salud_fuerza_a",veces(2,0,12))]}});
      expect(tt(app,"sentadilla_silla","salud_fuerza_a")).toEqual({w:1,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 1 kg y vuelve a 8"});});
    test("todayTarget sin lista ni salto con un peso de centesimas: sube a 28,75 kg, no a 28,8",app=>{
      /* HU-57: editNum ya guarda 26.25; la subida teorica no puede redondearlo
         a la decima y proponer un peso que no existe */
      limpio(app,{rp_logs:{curl_barra:[reg(3,"gym_tiron",veces(3,26.25,12))]}});
      expect(tt(app,"curl_barra","gym_tiron")).toEqual({w:28.75,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 28.75 kg y vuelve a 8"});
      expect(sug(app,"curl_barra","gym_tiron")).toEqual({w:28.75,reps:8,why:"Llenaste el rango entero: sube a 28.75 kg y vuelve a 8"});});
    test("no regresion: con pesosDB la rama de mancuernas devuelve lo mismo que en v35",app=>{
      /* [mancuernas, ejercicio, rutina, series de la vez pasada, lo que devolvia v35] */
      const casos=[
        [[1,2,3],"press_hombro_db","salud_fuerza_a",veces(2,2,12),
          {w:2,reps:14,extiende:true,why:"Tu siguiente mancuerna (3 kg) es un salto grande: antes llega a 14 reps"}],
        [[1,2,3],"press_hombro_db","salud_fuerza_a",veces(2,2,14),
          {w:3,reps:8,subeCarga:true,why:"Sube a tu mancuerna de 3 kg y vuelve a 8 reps"}],
        [[1,2,3],"peso_muerto_rumano_db","salud_fuerza_b",veces(2,3,14),
          {w:3,reps:14,extiende:true,why:"Ya usas tu mancuerna más pesada: estira a 14 reps"}],
        [[20,22,24],"press_banca_db","gym_empuje",veces(4,20,10),
          {w:22,reps:6,subeCarga:true,why:"Sube a tu mancuerna de 22 kg y vuelve a 6 reps"}],
        [[6,8,10],"elevaciones_laterales","gym_empuje",veces(4,8,20),
          {w:8,reps:22,extiende:true,why:"Tu siguiente mancuerna (10 kg) es un salto grande: antes llega a 22 reps"}],
        [[6,8,10],"elevaciones_laterales","gym_empuje",veces(4,8,22),
          {w:10,reps:12,subeCarga:true,why:"Sube a tu mancuerna de 10 kg y vuelve a 12 reps"}],
        [[8,8.5,9],"elevaciones_laterales","gym_empuje",veces(4,8,20),
          {w:8.5,reps:12,subeCarga:true,why:"Sube a tu mancuerna de 8.5 kg y vuelve a 12 reps"}],
        [[1,2,3],"press_hombro_db","salud_fuerza_a",veces(2,2,10),
          {w:2,reps:11,why:"La vez pasada 10: hoy 11 con el mismo peso"}]];
      casos.forEach(([l,id,k,series,v35])=>{
        limpio(app,{rp_prefs:{pesosDB:l},rp_logs:{[id]:[reg(3,k,series)]}});
        expect(tt(app,id,k)).toEqual(v35);});});
    test("primera vez y molestia anotada: exactamente lo mismo que en v35",app=>{limpio(app);
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:0,reps:12,why:"Primera vez: busca 12 repeticiones limpias",nuevo:true});
      expect(tt(app,"flexiones_pared","salud_fuerza_a")).toEqual({w:0,reps:8,why:"Primera vez: busca 8 repeticiones limpias",nuevo:true});
      expect(tt(app,"caminadora","gym_empuje")).toBe(null);
      /* un registro de solo visto no trae pesos: sigue siendo la primera vez */
      app.sembrar({rp_logs:{elevaciones_laterales:[{date:F.fecha(3),sets:[],k:"gym_empuje",t:F.momento(3,18,0).getTime(),checked:true}]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:0,reps:12,why:"Primera vez: busca 12 repeticiones limpias",nuevo:true});
      /* molestia la ultima vez: se congela aunque tope+2 este lleno y ahora tocara subir */
      app.sembrar({rp_pain:{elevaciones_laterales:[F.fecha(3)]},rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(4,8,22))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:8,reps:22,dolor:true,
        why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});
      app.sembrar({rp_pain:{elevaciones_laterales:[F.fecha(10),F.fecha(3)]},
        rp_logs:{elevaciones_laterales:[reg(10,"gym_empuje",veces(4,8,20)),reg(3,"gym_empuje",veces(4,8,22))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:8,reps:22,dolor:true,
        why:"Molestia repetida en este ejercicio: no subas y plantéate cambiarlo por otro"});
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]},rp_pain:{press_hombro_db:[F.fecha(3)]},rp_logs:{press_hombro_db:[reg(3,"salud_fuerza_a",veces(2,2,14))]}});
      expect(tt(app,"press_hombro_db","salud_fuerza_a")).toEqual({w:2,reps:14,dolor:true,
        why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});
      app.sembrar({rp_pain:{curl_femoral:[F.fecha(3)]},rp_logs:{curl_femoral:[reg(3,"gym_pierna",veces(3,22,14))]}});
      expect(tt(app,"curl_femoral","gym_pierna")).toEqual({w:22,reps:14,dolor:true,
        why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});});
    test("todayTarget con el peso guardado como texto: suma, no concatena",app=>{
      /* importar valida que rp_logs sea un objeto, no el tipo de cada w: una
         copia editada a mano puede traer "8". En v35 "30"+2.5 salia 302,5 kg;
         con la subida de los ligeros (HU-07) "8"+1 habria sido 81 */
      limpio(app,{rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(4,"8",22))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:9,reps:12,subeCarga:true,
        why:"Llegaste a 22 reps: sube a 9 kg y vuelve a 12"});
      expect(sug(app,"elevaciones_laterales","gym_empuje")).toEqual({w:9,reps:12,why:"Llegaste a 22 reps: sube a 9 kg y vuelve a 12"});
      app.sembrar({rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(4,"8",20))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:8,reps:22,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 22 reps"});
      app.sembrar({rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(4,"30",10))]}});
      expect(tt(app,"press_banca_db","gym_empuje")).toEqual({w:32.5,reps:6,subeCarga:true,
        why:"Llenaste el rango entero: sube a 32.5 kg y vuelve a 6"});
      app.sembrar({rp_logs:{press_banca_db:[reg(3,"gym_empuje",veces(4,"30",8))]}});
      expect(tt(app,"press_banca_db","gym_empuje")).toEqual({w:30,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
      /* con lista, "8" se comparaba como texto y proponia bajar a la de 6 */
      app.sembrar({rp_prefs:{pesosDB:[6,8,10]},rp_logs:{elevaciones_laterales:[reg(3,"gym_empuje",veces(4,"8",22))]}});
      expect(tt(app,"elevaciones_laterales","gym_empuje")).toEqual({w:10,reps:12,subeCarga:true,
        why:"Sube a tu mancuerna de 10 kg y vuelve a 12 reps"});});

    /* ---------- salto de placa por maquina (rp_inc, v36) ---------- */
    /* jalon_pecho: maquina, rango 8-12, 4 series en gym_tiron */
    const obj=(app,id,k)=>{const t=app.w.todayTarget(k,id);return {w:t.w,reps:t.reps,sube:!!t.subeCarga,estira:!!t.extiende,why:t.why};};
    test("todayTarget con salto 5 y el rango lleno a 40 kg: estira a 14 y luego sube a 45, nunca 42,5",app=>{
      limpio(app,{rp_inc:{jalon_pecho:5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,40,12))]}});
      /* 5 sobre 40 es un 12,5 %: primero el rango estirado */
      expect(obj(app,"jalon_pecho","gym_tiron")).toEqual({w:40,reps:14,sube:false,estira:true,
        why:"El siguiente peso que existe (45 kg) es un salto grande: antes llega a 14 reps"});
      app.sembrar({rp_inc:{jalon_pecho:5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,40,14))]}});
      expect(obj(app,"jalon_pecho","gym_tiron")).toEqual({w:45,reps:8,sube:true,estira:false,
        why:"Llegaste a 14 reps: sube a 45 kg y vuelve a 8"});
      expect(sug(app,"jalon_pecho","gym_tiron").w).toBe(45);
      /* el mismo historial sin salto declarado proponia 42,5, que esa maquina no tiene */
      app.sembrar({rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,40,12))]}});
      expect(app.w.todayTarget("gym_tiron","jalon_pecho").w).toBe(42.5);});
    test("todayTarget con salto: suave (≤10%) sube directo; un peso tecleado fuera de escala va al siguiente que existe",app=>{
      limpio(app,{rp_inc:{jalon_pecho:5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,50,12))]}});
      expect(obj(app,"jalon_pecho","gym_tiron")).toEqual({w:55,reps:8,sube:true,estira:false,
        why:"Llenaste el rango entero: sube a 55 kg y vuelve a 8"});
      app.sembrar({rp_inc:{jalon_pecho:5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,42.5,12))]}});
      expect(app.w.todayTarget("gym_tiron","jalon_pecho").w).toBe(45);
      app.sembrar({rp_inc:{jalon_pecho:4.5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,45,12))]}});
      expect(app.w.todayTarget("gym_tiron","jalon_pecho").w).toBe(49.5);
      /* dentro del rango se repite el peso de la vez pasada tal cual, aunque no sea multiplo */
      app.sembrar({rp_inc:{jalon_pecho:5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,42.5,9))]}});
      expect(obj(app,"jalon_pecho","gym_tiron")).toEqual({w:42.5,reps:10,sube:false,estira:false,
        why:"La vez pasada 9: hoy 10 con el mismo peso"});});
    test("todayTarget con salto: series de menos o molestia anotada no suben",app=>{
      limpio(app,{rp_inc:{jalon_pecho:5},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(3,40,14))]}});
      expect(app.w.todayTarget("gym_tiron","jalon_pecho").w).toBe(40);
      app.sembrar({rp_inc:{jalon_pecho:5},rp_pain:{jalon_pecho:[F.fecha(3)]},rp_logs:{jalon_pecho:[reg(3,"gym_tiron",veces(4,40,14))]}});
      const t=app.w.todayTarget("gym_tiron","jalon_pecho");
      expect([t.w,t.reps,t.dolor]).toEqual([40,14,true]);});
    test("suggestLoad primera vez con salto: el peso de arranque baja al que existe",app=>{
      limpio(app,{rp_inc:{jalon_pecho:4.5,pec_deck:7,sentadilla_silla:2}});
      expect(sug(app,"jalon_pecho","gym_tiron").w).toBe(9);
      expect(sug(app,"pec_deck","gym_tiron").w).toBe(7);
      /* startKg:0 sigue siendo sin peso */
      expect(sug(app,"sentadilla_silla","salud_fuerza_a").w).toBe(0);
      app.sembrar({});
      expect(sug(app,"jalon_pecho","gym_tiron").w).toBe(10);});
    /* el paso del guiado tal como lo deja startRoutine, sin pintar */
    const ajusta=(app,id,w,d)=>{app.ev("steps=[{id:'"+id+"',unit:'kg',load:true}];stepi=0;curW="+w);app.w.adjW(d);return app.ev("curW");};
    test("adjW: con salto 5, de 40 sube a 45 y baja a 35; sin salto suma 2,5; con pesosDB, la mancuerna siguiente",app=>{
      limpio(app,{rp_inc:{jalon_pecho:5}});
      expect(ajusta(app,"jalon_pecho",40,1)).toBe(45);
      expect(ajusta(app,"jalon_pecho",40,-1)).toBe(35);
      /* lo tecleado fuera de escala vuelve a la escala al tocar - o + */
      expect(ajusta(app,"jalon_pecho",42.5,1)).toBe(45);
      expect(ajusta(app,"jalon_pecho",42.5,-1)).toBe(40);
      expect(ajusta(app,"jalon_pecho",0,-1)).toBe(0);
      app.sembrar({});
      expect(ajusta(app,"jalon_pecho",40,1)).toBe(42.5);
      expect(ajusta(app,"jalon_pecho",40,-1)).toBe(37.5);
      expect(ajusta(app,"jalon_pecho",10,2.5)).toBe(12.5);
      expect(ajusta(app,"jalon_pecho",1,-1)).toBe(0);
      /* la lista de mancuernas manda aunque haya un salto guardado */
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]},rp_inc:{press_hombro_db:5}});
      expect(ajusta(app,"press_hombro_db",2,1)).toBe(3);
      expect(ajusta(app,"press_hombro_db",2,-1)).toBe(1);
      expect(ajusta(app,"press_hombro_db",3,1)).toBe(3);
      app.ev("steps=[];stepi=0;curW=null");app.reiniciarMemoria();});
    test("warmupHTML: con salto 5 y 60 kg, aproximaciones de 30 y 40 kg",app=>{
      limpio(app,{rp_inc:{jalon_pecho:5}});app.ev("curRoutine='gym_tiron'");
      expect(app.w.warmupHTML("jalon_pecho",60)).toContain("1×10 con 30 kg · 1×5 con 40 kg");
      app.sembrar({rp_inc:{jalon_pecho:4.5}});
      expect(app.w.warmupHTML("jalon_pecho",60)).toContain("1×10 con 27 kg · 1×5 con 40.5 kg");
      /* nunca por debajo de una placa */
      app.sembrar({rp_inc:{jalon_pecho:10}});
      expect(app.w.warmupHTML("jalon_pecho",12)).toContain("1×10 con 10 kg · 1×5 con 10 kg");
      /* sin salto, como en v35 */
      app.sembrar({});
      expect(app.w.warmupHTML("jalon_pecho",60)).toContain("1×10 con 30 kg · 1×5 con 42.5 kg");
      app.reiniciarMemoria();});
    test("warmupHTML: si el peso de hoy no pasa de una placa no hay aproximacion (nunca mas pesada que la serie)",app=>{
      limpio(app,{rp_inc:{jalon_pecho:10}});app.ev("curRoutine='gym_tiron'");
      expect(app.w.warmupHTML("jalon_pecho",9)).toBe("");
      expect(app.w.warmupHTML("jalon_pecho",8)).toBe("");
      expect(app.w.warmupHTML("jalon_pecho",10)).toBe("");
      expect(app.w.warmupHTML("jalon_pecho",15)).toContain("1×10 con 10 kg · 1×5 con 10 kg");
      app.reiniciarMemoria();});
    test("en casa con la lista, −/+ y aproximacion de lo que no es de mancuerna solo dan pesos de la lista",app=>{
      const k0=app.ev("curRoutine");
      limpio(app,{rp_prefs:{pesosDB:[2,4,6,8]}});app.ev("curRoutine='salud_fuerza_a'");
      /* sentarse con una mancuerna al pecho: la propuesta ya salia de la lista
         y los botones sumaban 2,5 (6 → 8,5, 6 → 3,5) */
      expect(ajusta(app,"sentadilla_silla",6,1)).toBe(8);
      expect(ajusta(app,"sentadilla_silla",6,-1)).toBe(4);
      expect(ajusta(app,"sentadilla_silla",8,1)).toBe(8);
      /* se puede hacer sin peso: 0 es su suelo, y de 0 se sube a la mas ligera */
      expect(ajusta(app,"sentadilla_silla",2,-1)).toBe(0);
      expect(ajusta(app,"sentadilla_silla",0,-1)).toBe(0);
      expect(ajusta(app,"sentadilla_silla",0,1)).toBe(2);
      expect(ajusta(app,"zancada_estatica",4,1)).toBe(6);
      expect(ajusta(app,"elevacion_pantorrilla",4,-1)).toBe(2);
      /* los de mancuerna, como en v35: la mas ligera es el suelo */
      expect(ajusta(app,"press_hombro_db",2,-1)).toBe(2);
      app.sembrar({rp_prefs:{pesosDB:[3,5,8]}});
      expect(app.w.warmupHTML("sentadilla_silla",8)).toContain("1×10 con 3 kg · 1×5 con 5 kg");
      /* si la mas ligera de la lista no queda por debajo del peso de hoy no hay
         aproximacion (saldria con el mismo peso que la serie) */
      app.sembrar({rp_prefs:{pesosDB:[8,10]}});
      expect(app.w.warmupHTML("sentadilla_silla",8)).toBe("");
      expect(app.w.warmupHTML("sentadilla_silla",10)).toContain("1×10 con 8 kg · 1×5 con 8 kg");
      /* en el gimnasio los gemelos son de maquina: la lista no manda */
      app.sembrar({rp_prefs:{pesosDB:[2,4,6,8]}});app.ev("curRoutine='gym_empuje'");
      expect(ajusta(app,"elevacion_pantorrilla",6,1)).toBe(8.5);
      app.ev("steps=[];stepi=0;curW=null;curRoutine="+JSON.stringify(k0));app.reiniciarMemoria();});
    test("suggestLoad primera vez con la lista: la mas pesada que no pasa del arranque, o la mas ligera",app=>{
      limpio(app,{rp_prefs:{pesosDB:[2,4,6]}});
      expect(sug(app,"peso_muerto_rumano_db","salud_fuerza_b").w).toBe(2);
      expect(sug(app,"remo_db","salud_fuerza_b").w).toBe(2);
      expect(sug(app,"elevaciones_laterales","salud_fuerza_b").w).toBe(2);
      expect(sug(app,"extension_triceps_db","salud_fuerza_b").w).toBe(2);
      app.sembrar({rp_prefs:{pesosDB:[1.25,2.5,3.75]}});
      expect(sug(app,"elevaciones_laterales","salud_fuerza_b").w).toBe(1.25);
      expect(sug(app,"peso_muerto_rumano_db","salud_fuerza_b").w).toBe(2.5);
      /* startKg:0 sigue siendo sin peso */
      expect(sug(app,"sentadilla_silla","salud_fuerza_a").w).toBe(0);
      /* con la lista de la madre (1-2-3) todo arranque existe: lo mismo que en v35 */
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]}});
      expect(["peso_muerto_rumano_db","remo_db","elevaciones_laterales","extension_triceps_db"]
        .map(id=>sug(app,id,"salud_fuerza_b").w)).toEqual([3,2,1,1]);
      expect(["press_hombro_db","elevacion_pantorrilla"].map(id=>sug(app,id,"salud_fuerza_a").w)).toEqual([2,2]);});
    test("molestia anotada con el peso guardado como texto: numero, y los −/+ suman",app=>{
      const k0=app.ev("curRoutine");
      limpio(app,{rp_pain:{press_hombro_db:[F.fecha(3)]},rp_logs:{press_hombro_db:[reg(3,"salud_fuerza_a",veces(2,"8",10))]}});
      const t=tt(app,"press_hombro_db","salud_fuerza_a");
      expect([t.w,t.reps,t.dolor]).toEqual([8,10,true]);
      expect(typeof t.w).toBe("number");
      expect(sug(app,"press_hombro_db","salud_fuerza_a").w).toBe(8);
      /* aunque llegue texto al guiado, −/+ no concatenan: antes 82,5 y NaN */
      app.ev("curRoutine='salud_fuerza_a'");
      expect(ajusta(app,"press_hombro_db",'"8"',1)).toBe(10.5);
      expect(ajusta(app,"press_hombro_db",'"8"',-1)).toBe(5.5);
      app.sembrar({rp_prefs:{pesosDB:[2,4,6,8,10]}});
      expect(ajusta(app,"press_hombro_db",'"8"',1)).toBe(10);
      expect(ajusta(app,"press_hombro_db",'"8"',-1)).toBe(6);
      app.ev("steps=[];stepi=0;curW=null;curRoutine="+JSON.stringify(k0));app.reiniciarMemoria();});
    test("stepFor y roundDownTo: el salto declarado o el de siempre; un valor raro no cuenta",app=>{
      limpio(app,{rp_inc:{jalon_pecho:4.5,pec_deck:"5",remo_maquina:-5,curl_barra:0,pec_deck_inverso:null}});
      expect(app.w.stepFor("jalon_pecho",40)).toBe(4.5);
      expect([5,15,25].map(w=>app.w.stepFor("pec_deck",w))).toEqual([1,2,2.5]);
      expect(["remo_maquina","curl_barra","pec_deck_inverso"].map(id=>app.w.stepFor(id,40))).toEqual([2.5,2.5,2.5]);
      expect([42,40.5,13.5,4].map(w=>app.w.roundDownTo("jalon_pecho",w))).toEqual([40.5,40.5,13.5,0]);
      expect(app.w.roundDownTo("pec_deck",42)).toBe(42);
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]},rp_inc:{press_hombro_db:5}});
      expect(app.w.incFor("press_hombro_db")).toBe(0);
      expect(app.w.stepFor("press_hombro_db",2)).toBe(1);
      /* rp_inc con otra forma se lee como vacio */
      app.sembrar({rp_inc:[5]});
      expect(app.w.loadInc()).toEqual({});
      expect(app.w.stepFor("jalon_pecho",40)).toBe(2.5);});
    test("datos de v35 sin rp_inc: el salto de siempre, nada escrito, y un salto solo toca su ejercicio",app=>{
      const D=F.dueno();limpio(app,D);
      const EX=app.ev("EX"),ids=Object.keys(D.rp_logs).filter(id=>(EX[id]||{}).load===true&&D.rp_logs[id].some(r=>r.sets.length));
      expect(ids.length).toBeGreaterThan(8);
      const objetivos=()=>ids.map(id=>{const ll=app.w.lastLog(id);return JSON.stringify(app.w.todayTarget(ll.k,id));});
      ids.forEach(id=>{const w=app.w.lastLog(id).sets[0].w;
        expect(app.w.stepFor(id,w)).toBe(app.w.progStep(w));expect(app.w.roundDownTo(id,w)).toBe(w);});
      const antes=objetivos();
      expect(app.leer("rp_inc")).toBe(null);
      app.sembrar(Object.assign(F.dueno(),{rp_inc:{pec_deck_inverso:5}}));
      expect(objetivos()).toEqual(antes);});

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
    test("buildSteps: un descanso de 0 s en un aguante se respeta",
      app=>{limpio(app,{rp_doses:{postura_completa:{isometricos_cervicales:{rest:0}}}});
        const s=app.w.buildSteps("postura_completa").filter(x=>x.id==="isometricos_cervicales");
        expect(s.map(x=>x.restAfter)).toEqual([0,0,0]);});
    test("buildSteps: un descanso de 0 s en un aguante por lado se respeta",app=>{
      limpio(app,{rp_doses:{salud_equilibrio:{equilibrio_unipodal:{rest:0}}}});
      const e=app.w.buildSteps("salud_equilibrio").filter(s=>s.id==="equilibrio_unipodal");
      expect(e.map(s=>s.side)).toEqual(["izq","der","izq","der"]);
      expect(e.map(s=>s.restAfter)).toEqual([0,0,0,0]);});
    test("buildSteps: un aguante propio creado con descanso 0 no descansa entre series",app=>{
      limpio(app,{rp_custom:{u_aguante0:{name:"Aguante de prueba",type:"hold",sets:3,holdSec:20,rest:0,load:false,zona:"core",eq:"",steps:[]},
                             u_lado0:{name:"Aguante por lado de prueba",type:"hold_side",sets:2,holdSec:20,rest:0,load:false,zona:"core",eq:"",steps:[]}},
        rp_extras:{salud_equilibrio:["u_aguante0","u_lado0"]}});
      app.w.mergeCustom();
      const st=app.w.buildSteps("salud_equilibrio");
      expect(st.filter(s=>s.id==="u_aguante0").map(s=>s.restAfter)).toEqual([0,0,0]);
      expect(st.filter(s=>s.id==="u_lado0").map(s=>s.restAfter)).toEqual([0,0,0,0]);});
    test("buildSteps: el descanso del programa en aguantes no cambia",app=>{limpio(app);
      expect(app.w.buildSteps("postura_completa").filter(s=>s.id==="isometricos_cervicales").map(s=>s.restAfter)).toEqual([15,15,0]);
      expect(app.w.buildSteps("salud_equilibrio").filter(s=>s.id==="caminata_granjero").map(s=>s.restAfter)).toEqual([45,0]);});
    test("estMinutes: minutos estimados de cada rutina (linea base)",app=>{limpio(app);
      const m={};Object.keys(app.ev("ROUTINES")).forEach(k=>m[k]=app.w.estMinutes(k));
      expect(m).toEqual({cuello_rostro:19,gym_empuje:62,gym_pierna:68,gym_tiron:64,postura_completa:21,postura_movilidad:14,
        salud_equilibrio:25,salud_fuerza_a:24,salud_fuerza_b:24});
      expect(app.w.estMinutes("no_existe")).toBe(0);});
    test("estMinutes: sube si el usuario anade series",app=>{
      limpio(app,{rp_doses:{gym_empuje:{press_banca_db:{sets:6}}}});
      expect(app.w.estMinutes("gym_empuje")).toBeGreaterThan(62);});
    /* el descanso entre series cuenta entero o nada: con rest:0 resta todo lo
       que habria descansado, no 30 s por hueco */
    test("estMinutes: un descanso de 0 s ajustado se respeta (series)",app=>{
      /* press de banca: 4 series y 120 s, 3 huecos = 6 min exactos */
      limpio(app,{rp_doses:{gym_empuje:{press_banca_db:{rest:0}}}});
      expect(app.w.estMinutes("gym_empuje")).toBe(62-6);});
    test("estMinutes: un descanso de 0 s ajustado se respeta (aguantes)",app=>{
      const m=d=>{limpio(app,{rp_doses:{salud_equilibrio:d}});return app.w.estMinutes("salud_equilibrio");};
      /* granjero a 5 series: 4 huecos de 45 s = 3 min exactos */
      expect(m({caminata_granjero:{sets:5}})-m({caminata_granjero:{sets:5,rest:0}})).toBe(3);
      /* unipodal por lado a 4 series: 3 huecos de 20 s = 1 min exacto */
      expect(m({equilibrio_unipodal:{sets:4}})-m({equilibrio_unipodal:{sets:4,rest:0}})).toBe(1);});

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

  /* ---------- la progresion con los telefonos tal como los dejo v35 ----------
     Calcular el objetivo de hoy de todos los ejercicios de todas las rutinas
     no escribe nada ni crea claves, y ningun objetivo sale roto. Tiene que ser
     la primera prueba del escenario: mira los datos recien arrancados.
     CLAVES_V35: las claves que ya usaba v35, mas rp_schema (v36). */
  const CLAVES_V35=["rp_bw","rp_checks","rp_custom","rp_doses","rp_extras","rp_history","rp_lastexport","rp_logged",
    "rp_logs","rp_medidas","rp_notes","rp_pain","rp_plan","rp_prefs","rp_rem","rp_session","rp_streak","rp_swaps",
    "rp_theme","rp_weekgoal","rp_schema"];
  const nuevas=app=>app.claves().filter(k=>CLAVES_V35.indexOf(k)<0);
  /* con la lista declarada, en casa ninguna subida propone una mancuerna que no hay */
  function sinEscribir(app){app.reiniciarMemoria();
    expect(nuevas(app)).toEqual([]);
    const antes=app.foto(),rotos=[],R=app.ev("ROUTINES"),lista=(app.leer("rp_prefs")||{}).pesosDB;let n=0;
    Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{
      const t=app.w.todayTarget(k,id),s=app.w.suggestLoad(id,k);
      if(t){n++;if(!(isFinite(t.w)&&t.w>=0&&t.reps>=1&&Math.round(t.reps)===t.reps&&t.why))rotos.push(k+" "+id+" "+JSON.stringify(t));
        if(t.subeCarga&&lista&&R[k].group==="Casa"&&lista.indexOf(t.w)<0)rotos.push(k+" "+id+" sube a una mancuerna que no hay "+JSON.stringify(t));}
      if(!(isFinite(s.w)&&s.reps>=1))rotos.push(k+" "+id+" suggestLoad "+JSON.stringify(s));}));
    expect(rotos).toEqual([]);
    expect(n).toBeGreaterThan(20);
    expect(app.foto()).toEqual(antes);}

  escenario("Lógica · progresión con los datos de v35 del gimnasio",F.dueno,()=>{
    test("todas las rutinas: objetivos validos, sin escribir nada ni crear claves",sinEscribir);
    test("en el guiado, elevaciones laterales a 8 kg con tope+2 lleno proponen 9 kg y dicen por que",app=>{
      const D=F.dueno();
      /* en este juego de datos van a 3 series (rp_doses): las tres en 22 */
      D.rp_logs.elevaciones_laterales.push(reg(1,"gym_empuje",veces(3,8,22)));
      limpio(app,D);
      app.w.openRoutine("gym_empuje");app.w.startRoutine("elevaciones_laterales");
      expect(app.ev("steps[stepi].id")).toBe("elevaciones_laterales");
      expect(app.texto("#lw")).toBe("9");
      expect(app.texto("#lr")).toBe("12");
      expect(app.texto("#guided .qwhy")).toContain("Llegaste a 22 reps: sube a 9 kg y vuelve a 12");
      expect(nuevas(app)).toEqual([]);
      app.reiniciarMemoria();});
  });

  escenario("Lógica · progresión con los datos de v35 de casa",F.madre,()=>{
    test("todas las rutinas: objetivos validos, sin escribir nada ni crear claves",sinEscribir);
    /* el ultimo peso muerto rumano de casa es con la mancuerna de 3 kg: 2 series
       de 12 (la anterior, 11). Estas pruebas son de la lista (HU-07/HU-08) y su
       regla es la de masa: el juego va con goal masa salvo que se pida salud,
       que (HU-16) solo sale del rango tras dos sesiones llenas al mismo peso */
    const casa=(lista,series,goal)=>{const D=F.madre();D.rp_prefs.goal=goal||"masa";
      if(lista)D.rp_prefs.pesosDB=lista;else delete D.rp_prefs.pesosDB;
      if(series)D.rp_logs.peso_muerto_rumano_db.push(reg(1,"salud_fuerza_b",series));
      return D;};
    test("sin pesosDB: la mancuerna de 3 kg estira a 14 y, con las series en 14, propone 4 kg",app=>{
      limpio(app,casa(null));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:14,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 14 reps"});
      limpio(app,casa(null,veces(2,3,14)));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:4,reps:8,subeCarga:true,
        why:"Llegaste a 14 reps: sube a 4 kg y vuelve a 8"});
      expect(sug(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:4,reps:8,why:"Llegaste a 14 reps: sube a 4 kg y vuelve a 8"});});
    test("con pesosDB declarado sigue mandando la lista: nunca propone una mancuerna que no hay",app=>{
      limpio(app,casa([1,2,3],veces(2,3,14)));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:14,extiende:true,
        why:"Ya usas tu mancuerna más pesada: estira a 14 reps"});
      limpio(app,casa([1,2,3,5]));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:14,extiende:true,
        why:"Tu siguiente mancuerna (5 kg) es un salto grande: antes llega a 14 reps"});
      limpio(app,casa([1,2,3,5],veces(2,3,14)));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:5,reps:8,subeCarga:true,
        why:"Sube a tu mancuerna de 5 kg y vuelve a 8 reps"});});
    /* En casa lo que lleva carga se hace con esas mancuernas aunque el
       ejercicio no sea "de mancuerna": sentarse con una al pecho (silla), la
       zancada (sin aparato) y los gemelos (maquina en el gimnasio) */
    const otra=(app,id,k,series,lista,goal)=>{const D=F.madre();D.rp_prefs.pesosDB=lista||[1,2,3];D.rp_prefs.goal=goal||"masa";
      (D.rp_logs[id]=D.rp_logs[id]||[]).push(reg(1,k,series));limpio(app,D);return tt(app,id,k);};
    test("con pesosDB, sentarse, zancada y gemelos en casa: con la de 3 kg en tope+2 no proponen 4",app=>{
      const mas=reps=>({w:3,reps:reps,extiende:true,why:"Ya usas tu mancuerna más pesada: estira a "+reps+" reps"});
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,3,14))).toEqual(mas(14));
      expect(otra(app,"sentadilla_silla","salud_equilibrio",veces(2,3,14))).toEqual(mas(14));
      expect(otra(app,"zancada_estatica","salud_fuerza_a",veces(2,3,14))).toEqual(mas(14));
      expect(otra(app,"elevacion_pantorrilla","salud_fuerza_a",veces(2,3,22))).toEqual(mas(22));
      /* en el tope, igual que en v35: se estira con el mismo peso */
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,3,12))).toEqual(mas(14));
      expect(sug(app,"sentadilla_silla","salud_fuerza_a")).toEqual({w:3,reps:14,why:"Ya usas tu mancuerna más pesada: estira a 14 reps"});});
    test("con pesosDB, sentarse en casa sube por la lista: 0 → la mas ligera, 1 → 2 tras tope+2",app=>{
      /* sin peso todavia: al llenar el rango coge la mas ligera, como en v35 subia 1 kg */
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,0,12))).toEqual({w:1,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 1 kg y vuelve a 8"});
      /* y si no hay de 1 kg, la mas ligera que hay; v35 proponia 1 kg igual */
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,0,12),[2,3,5])).toEqual({w:2,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 2 kg y vuelve a 8"});
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,1,12))).toEqual({w:1,reps:14,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 14 reps"});
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,1,14))).toEqual({w:2,reps:8,subeCarga:true,
        why:"Llegaste a 14 reps: sube a 2 kg y vuelve a 8"});
      /* entre dos de la lista (1,5 kg) sube a la siguiente que hay, no a 2,5 */
      expect(otra(app,"zancada_estatica","salud_fuerza_a",veces(2,1.5,14))).toEqual({w:2,reps:8,subeCarga:true,
        why:"Llegaste a 14 reps: sube a 2 kg y vuelve a 8"});
      /* con una de 5 kg, de 3 salta a 5 tras tope+2 */
      expect(otra(app,"elevacion_pantorrilla","salud_fuerza_a",veces(2,3,22),[1,2,3,5])).toEqual({w:5,reps:12,subeCarga:true,
        why:"Llegaste a 22 reps: sube a 5 kg y vuelve a 12"});});
    test("con pesosDB, fuera de casa los gemelos son de maquina: salto teorico, la lista no manda",app=>{
      expect(otra(app,"elevacion_pantorrilla","gym_empuje",veces(2,3,22))).toEqual({w:4,reps:12,subeCarga:true,
        why:"Llegaste a 22 reps: sube a 4 kg y vuelve a 12"});});
    /* HU-16: los mismos casos con el objetivo del juego, salud. El rango lleno
       solo en la ultima sesion (o con otro peso en la anterior) se mantiene, y
       se dice como un logro; lleno en las dos ultimas al mismo peso, la regla
       de la lista de siempre */
    const logro=(w,reps)=>({w:w,reps:reps,mantiene:true,
      why:"Rango completo con "+(w>0?w+" kg × "+reps:reps+" repeticiones")+": mantenerlo es un logro, repítelo"});
    test("salud, sin pesosDB: la de 3 kg llena el rango por primera vez y se mantiene; con las series en 14 propone 4 kg",app=>{
      limpio(app,casa(null,null,"salud"));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual(logro(3,12));
      expect(sug(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:12,why:logro(3,12).why});
      /* 12 y luego 14 con la misma mancuerna: dos llenas, y HU-07 se cumple */
      limpio(app,casa(null,veces(2,3,14),"salud"));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:4,reps:8,subeCarga:true,
        why:"Llegaste a 14 reps: sube a 4 kg y vuelve a 8"});});
    test("salud, con pesosDB: la primera vez en el tope se mantiene y despues manda la lista",app=>{
      limpio(app,casa([1,2,3,5],null,"salud"));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual(logro(3,12));
      limpio(app,casa([1,2,3],veces(2,3,14),"salud"));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:14,extiende:true,
        why:"Ya usas tu mancuerna más pesada: estira a 14 reps"});
      limpio(app,casa([1,2,3,5],veces(2,3,14),"salud"));
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:5,reps:8,subeCarga:true,
        why:"Sube a tu mancuerna de 5 kg y vuelve a 8 reps"});});
    test("salud, con pesosDB: sentarse, zancada y gemelos con un peso nuevo se mantienen; sentarse a 0 kg dos veces sube por la lista",app=>{
      /* la sesion anterior de sentarse fue a 0 kg (o no hay otra): una sola llena a ese peso */
      const S="salud";
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,3,14),null,S)).toEqual(logro(3,14));
      expect(otra(app,"sentadilla_silla","salud_equilibrio",veces(2,3,14),null,S)).toEqual(logro(3,14));
      expect(otra(app,"zancada_estatica","salud_fuerza_a",veces(2,3,14),null,S)).toEqual(logro(3,14));
      expect(otra(app,"elevacion_pantorrilla","salud_fuerza_a",veces(2,3,22),null,S)).toEqual(logro(3,22));
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,3,12),null,S)).toEqual(logro(3,12));
      expect(sug(app,"sentadilla_silla","salud_fuerza_a")).toEqual({w:3,reps:12,why:logro(3,12).why});
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,1,12),null,S)).toEqual(logro(1,12));
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,1,14),null,S)).toEqual(logro(1,14));
      expect(otra(app,"zancada_estatica","salud_fuerza_a",veces(2,1.5,14),null,S)).toEqual(logro(1.5,14));
      expect(otra(app,"elevacion_pantorrilla","salud_fuerza_a",veces(2,3,22),[1,2,3,5],S)).toEqual(logro(3,22));
      expect(otra(app,"elevacion_pantorrilla","gym_empuje",veces(2,3,22),null,S)).toEqual(logro(3,22));
      /* 0 kg × 12 tambien en la sesion del juego: dos llenas, igual que en masa */
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,0,12),null,S)).toEqual({w:1,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 1 kg y vuelve a 8"});
      expect(otra(app,"sentadilla_silla","salud_fuerza_a",veces(2,0,12),[2,3,5],S)).toEqual({w:2,reps:8,subeCarga:true,
        why:"Llenaste el rango entero: sube a 2 kg y vuelve a 8"});});
    test("con pesosDB, ninguna subida en casa propone una mancuerna que no hay, en ningun ejercicio con carga",app=>{
      const R=app.ev("ROUTINES"),EX=app.ev("EX"),malos=[];let n=0;
      ["salud_fuerza_a","salud_fuerza_b","salud_equilibrio"].forEach(k=>{const r=R[k],
          ids=[].concat(r.list||[],r.extras||[]);Object.keys(r.swaps||{}).forEach(o=>ids.push.apply(ids,r.swaps[o]));
        ids.filter(id=>EX[id]&&EX[id].load===true).forEach(id=>{const rng=app.w.repRange(id);
          [0,1,2,3].forEach(w=>[rng[1],rng[1]+2].forEach(reps=>{
            limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_logs:{[id]:[reg(1,k,veces(app.w.dose(k,id).sets,w,reps))]}});
            const t=tt(app,id,k);n++;
            if(!t||[0,1,2,3].indexOf(t.w)<0||(t.subeCarga&&!(t.w>w)))malos.push(k+" "+id+" "+w+"x"+reps+" "+JSON.stringify(t));}));});});
      expect(malos).toEqual([]);
      expect(n).toBeGreaterThan(80);});
    /* HU-08 con HU-07: el salto de una maquina (rp_inc) se dice en el gimnasio.
       En casa, con la lista declarada, lo que lleva carga se hace con esas
       mancuernas y manda la lista, aunque el mismo ejercicio (los gemelos)
       tenga guardado el salto de su maquina */
    test("con pesosDB y un salto de máquina guardado: en casa manda la lista, en el gimnasio el salto",app=>{
      const gem=(k,series)=>{limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_inc:{elevacion_pantorrilla:5},
        rp_logs:{elevacion_pantorrilla:[reg(1,k,series)]}});return tt(app,"elevacion_pantorrilla",k);};
      expect(gem("salud_fuerza_a",veces(2,3,22))).toEqual({w:3,reps:22,extiende:true,
        why:"Ya usas tu mancuerna más pesada: estira a 22 reps"});
      expect(gem("salud_fuerza_a",veces(2,2,22))).toEqual({w:3,reps:12,subeCarga:true,
        why:"Llegaste a 22 reps: sube a 3 kg y vuelve a 12"});
      /* en el gimnasio son de maquina: 5 sobre 40 pasa del 10 %, tras tope+2 sube a 45 */
      expect(gem("gym_empuje",veces(2,40,20))).toEqual({w:40,reps:22,extiende:true,
        why:"El siguiente peso que existe (45 kg) es un salto grande: antes llega a 22 reps"});
      expect(gem("gym_empuje",veces(2,40,22))).toEqual({w:45,reps:12,subeCarga:true,
        why:"Llegaste a 22 reps: sube a 45 kg y vuelve a 12"});
      /* primera vez: en casa el peso de arranque de la rutina (2 kg), no la placa de 5 */
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_inc:{elevacion_pantorrilla:5}});
      expect(sug(app,"elevacion_pantorrilla","salud_fuerza_a").w).toBe(2);
      expect(sug(app,"elevacion_pantorrilla","gym_empuje").w).toBe(10);
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]},rp_inc:{elevacion_pantorrilla:7}});
      expect(sug(app,"elevacion_pantorrilla","gym_empuje").w).toBe(7);
      expect(sug(app,"elevacion_pantorrilla","salud_fuerza_a").w).toBe(2);});
    test("con pesosDB, un salto guardado en cada ejercicio con carga no cambia nada en casa",app=>{
      const R=app.ev("ROUTINES"),EX=app.ev("EX"),distintos=[];let n=0;
      ["salud_fuerza_a","salud_fuerza_b","salud_equilibrio"].forEach(k=>{const r=R[k],
          ids=[].concat(r.list||[],r.extras||[]);Object.keys(r.swaps||{}).forEach(o=>ids.push.apply(ids,r.swaps[o]));
        const cargados=ids.filter(id=>EX[id]&&EX[id].load===true),inc={};cargados.forEach(id=>{inc[id]=5;});
        cargados.forEach(id=>{const rng=app.w.repRange(id);
          [null,0,1,2,3].forEach(w=>[rng[1],rng[1]+2].forEach(reps=>{
            const logs=w==null?{}:{[id]:[reg(1,k,veces(app.w.dose(k,id).sets,w,reps))]},
                  ver=()=>JSON.stringify([tt(app,id,k),sug(app,id,k)]);
            limpio(app,{rp_prefs:{pesosDB:[1,2,3]},rp_logs:logs});const sin=ver();
            app.sembrar({rp_prefs:{pesosDB:[1,2,3]},rp_logs:logs,rp_inc:inc});n++;
            const con=ver();if(con!==sin)distintos.push(k+" "+id+" "+w+"x"+reps+" "+sin+" → "+con);}));});});
      expect(distintos).toEqual([]);
      expect(n).toBeGreaterThan(80);});
  });

  /* ---------- objetivos de hoy iguales que v36 (referencia guardada) ----------
     Sprint 2 cambia la sugerencia de cada ejercicio (todayTarget) historia a
     historia. Esta foto es lo que devolvia v36 para todo effList(k) de todas
     las rutinas con dueno (masa), madre con goal masa y madre (salud),
     generados como si hoy fuera el miercoles 14 de octubre de 2026 (Madrid) y
     con la app en esa zona y ese instante: no depende del dia en que corra.
     referencia_objetivos_v36.js se genero con esta misma fotoObjetivos() sobre
     el index.html de v36 (85b4cbe): Pruebas.fotoObjetivos() desde la consola
     del arnes servido (--servir) da el objeto que se guarda. No se edita a
     mano: lo que cambia a proposito va en CAMBIOS_OBJETIVOS, con la historia
     que lo cambia, y cada cambio tiene que ser distinto de la referencia. */
  const ZONA_OBJ="Europe/Madrid",AHORA_OBJ="2026-10-14T10:30:00Z",
    JUEGOS_OBJ=[["dueno",F.dueno],["madreMasa",()=>{const D=F.madre();D.rp_prefs.goal="masa";return D;}],["madre",F.madre]];
  async function fotoObjetivos(app,juego){let r;
    await app.enZona(ZONA_OBJ,()=>{app.reiniciarMemoria();app.sembrar(Pruebas.conReloj(ZONA_OBJ,AHORA_OBJ,juego));
      const R=app.ev("ROUTINES"),o={};
      Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{o[k+" "+id]=app.w.todayTarget(k,id);}));
      r={hoy:app.w.today(),objetivos:JSON.parse(JSON.stringify(o))};},AHORA_OBJ);
    return r;}
  Pruebas.fotoObjetivos=async()=>{const o={};for(const [n,j] of JUEGOS_OBJ)o[n]=await fotoObjetivos(Pruebas.app,j);return JSON.stringify(o,null,1);};
  /* lo que cada historia cambia a proposito, juego → "rutina ejercicio" → objetivo */
  const mantenido=(w,reps,txt)=>({w:w,reps:reps,mantiene:true,why:"Rango completo con "+txt+": mantenerlo es un logro, repítelo"});
  /* HU-79: sin carga, con el rango lleno, +1 hasta tope+2 y sin hablar de peso.
     Solo ejercicios sin carga (lo comprueba su escenario); dueno no tiene
     ninguno con historial */
  const unaMas=r=>({w:0,reps:r+1,why:"La vez pasada "+r+": hoy "+(r+1)});
  const CAMBIOS_HU79={
    /* flexiones en la pared (en dos rutinas), abduccion y remo con banda,
       todos en 12 de 12: antes «hoy 12 con el mismo peso» para siempre */
    madreMasa:{
      "salud_fuerza_a flexiones_pared":unaMas(12),
      "salud_equilibrio flexiones_pared":unaMas(12),
      "salud_fuerza_a abduccion_banda":unaMas(12),
      "salud_fuerza_b remo_banda":unaMas(12)},
    /* en salud, abduccion y remo con banda llevan dos sesiones en 12; las
       flexiones en la pared, una: siguen en la regla del objetivo (HU-16) */
    madre:{
      "salud_fuerza_a abduccion_banda":unaMas(12),
      "salud_fuerza_b remo_banda":unaMas(12)}};
  const CAMBIOS_OBJETIVOS={
    madreMasa:Object.assign({},CAMBIOS_HU79.madreMasa),
    madre:Object.assign({
      /* HU-16: en salud el rango lleno solo en la ultima sesion se mantiene.
         Sentarse a 0 kg (11 y luego 12) ya no coge la de 1 kg; flexiones en la
         pared siguen en 12 y solo cambia el texto; press de hombro, peso
         muerto y remo (11 y luego 12 con la misma mancuerna) no estiran a 14 */
      "salud_fuerza_a sentadilla_silla":mantenido(0,12,"12 repeticiones"),
      "salud_equilibrio sentadilla_silla":mantenido(0,12,"12 repeticiones"),
      "salud_fuerza_a flexiones_pared":mantenido(0,12,"12 repeticiones"),
      "salud_equilibrio flexiones_pared":mantenido(0,12,"12 repeticiones"),
      "salud_fuerza_a press_hombro_db":mantenido(2,12,"2 kg × 12"),
      "salud_fuerza_b peso_muerto_rumano_db":mantenido(3,12,"3 kg × 12"),
      "salud_fuerza_b remo_db":mantenido(2,12,"2 kg × 12")},CAMBIOS_HU79.madre)};
  escenario("Lógica · objetivos de hoy igual que v36 salvo lo previsto (referencia guardada)",F.vacio,()=>{
    JUEGOS_OBJ.forEach(([nombre,juego])=>{
      test("todayTarget de todas las rutinas coincide con v36 ("+nombre+")",async app=>{
        const ref=REFERENCIA_OBJETIVOS_V36[nombre],r=await fotoObjetivos(app,juego),cambios=CAMBIOS_OBJETIVOS[nombre]||{};
        expect(r.hoy).toBe("2026-10-14");
        expect(Object.keys(r.objetivos)).toEqual(Object.keys(ref.objetivos));
        /* que la comparacion no sea entre vacios */
        expect(Object.keys(ref.objetivos).filter(c=>ref.objetivos[c]&&!ref.objetivos[c].nuevo).length).toBeGreaterThan(10);
        Object.keys(ref.objetivos).forEach(c=>{const esperado=c in cambios?cambios[c]:ref.objetivos[c];
          expect({[c]:r.objetivos[c]}).toEqual({[c]:esperado});});
        /* un cambio previsto es de verdad un cambio, y de un objetivo que existe */
        Object.keys(cambios).forEach(c=>{expect(c in ref.objetivos).toBe(true);
          expect({[c]:cambios[c]}).not.toEqual({[c]:ref.objetivos[c]});});
        app.reiniciarMemoria();app.sembrar(F.vacio);});
      /* HU-13, criterio 4: el mismo juego sin ninguna reserva anotada sale
         exactamente igual (los juegos solo traen reserva 1-2 en la ultima
         serie, que no dispara nada: con ella o sin ella, lo de antes) */
      test("sin reserva en ninguna serie, todayTarget de todas las rutinas sale igual ("+nombre+")",async app=>{
        const sinRir=()=>JSON.parse(JSON.stringify(juego()),(k,x)=>k==="rir"?undefined:x);
        expect(JSON.stringify(juego())).toContain('"rir"');
        expect(JSON.stringify(sinRir())).not.toContain('"rir"');
        const ref=REFERENCIA_OBJETIVOS_V36[nombre],r=await fotoObjetivos(app,sinRir),cambios=CAMBIOS_OBJETIVOS[nombre]||{};
        Object.keys(ref.objetivos).forEach(c=>{const esperado=c in cambios?cambios[c]:ref.objetivos[c];
          expect({[c]:r.objetivos[c]}).toEqual({[c]:esperado});});
        app.reiniciarMemoria();app.sembrar(F.vacio);});});
  });

  /* ---------- HU-16: el objetivo salud progresa mas despacio ----------
     Con el rango lleno, en salud se sale de el (estirar o subir) tras dos
     sesiones seguidas llenas al mismo peso; la primera se mantiene, dicho
     como un logro. En masa, a la primera, como siempre. Los umbrales salen
     de REGLAS (un solo bloque) y reglaObjetivo() lee el objetivo en cada
     llamada. El radar de estancamiento, en salud, no cuenta lo que se
     mantiene en el tope ni lo que se queda igual */
  escenario("Lógica · objetivo salud (HU-16)",F.vacio,()=>{
    const PB="press_banca_db",GE="gym_empuje",
      ses=(n,w,reps,k,id)=>reg(n,k||GE,veces(4,w,reps)),
      con=(goal,logs,extra)=>Object.assign({rp_prefs:goal?{goal:goal}:{},rp_logs:logs},extra||{}),
      logroW=(w,r)=>"Rango completo con "+w+" kg × "+r+": mantenerlo es un logro, repítelo",
      sube425={w:42.5,reps:6,subeCarga:true,why:"Llenaste el rango entero: sube a 42.5 kg y vuelve a 6"};
    test("salud: rango lleno solo en la ultima sesion → mismo peso, mantiene y porque de logro; lleno en las dos ultimas → sube",app=>{
      limpio(app,con("salud",{[PB]:[ses(7,40,9),ses(2,40,10)]}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:10,mantiene:true,why:logroW(40,10)});
      expect(sug(app,PB,GE)).toEqual({w:40,reps:10,why:logroW(40,10)});
      /* una sola sesion en total: tambien se mantiene */
      limpio(app,con("salud",{[PB]:[ses(2,40,10)]}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:10,mantiene:true,why:logroW(40,10)});
      limpio(app,con("salud",{[PB]:[ses(7,40,10),ses(2,40,10)]}));
      expect(tt(app,PB,GE)).toEqual(sube425);
      expect(sug(app,PB,GE)).toEqual({w:42.5,reps:6,why:sube425.why});
      /* por encima del tope cuenta como lleno, y se mantiene lo hecho: nunca menos reps */
      limpio(app,con("salud",{[PB]:[ses(2,40,12)]}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:12,mantiene:true,why:logroW(40,12)});});
    test("salud: la sesion llena anterior cuenta solo al mismo peso, completa y con un registro de solo visto en medio",app=>{
      /* otro peso en la anterior: no dice nada del de hoy */
      limpio(app,con("salud",{[PB]:[ses(7,30,10),ses(2,40,10)]}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:10,mantiene:true,why:logroW(40,10)});
      /* la anterior con series de menos no esta llena */
      limpio(app,con("salud",{[PB]:[reg(7,GE,veces(3,40,10)),ses(2,40,10)]}));
      expect(tt(app,PB,GE).mantiene).toBe(true);
      /* un visto (sin series) entre las dos no corta la cuenta */
      limpio(app,con("salud",{[PB]:[ses(7,40,10),{date:F.fecha(4),sets:[],k:GE,t:F.momento(4,18,0).getTime(),checked:true},ses(2,40,10)]}));
      expect(tt(app,PB,GE)).toEqual(sube425);});
    test("salud: con mancuernas 1-2-3 la madre estira tras dos llenas y sube a la siguiente al llenar el estirado",app=>{
      const RB="remo_db",FB="salud_fuerza_b",n=app.w.dose(FB,RB).sets||2,
        r=(d,w,reps)=>reg(d,FB,veces(n,w,reps)),lista={pesosDB:[1,2,3]};
      limpio(app,{rp_prefs:Object.assign({goal:"salud"},lista),rp_logs:{[RB]:[r(9,2,11),r(2,2,12)]}});
      expect(tt(app,RB,FB)).toEqual({w:2,reps:12,mantiene:true,why:logroW(2,12)});
      limpio(app,{rp_prefs:Object.assign({goal:"salud"},lista),rp_logs:{[RB]:[r(9,2,12),r(2,2,12)]}});
      expect(tt(app,RB,FB)).toEqual({w:2,reps:14,extiende:true,why:"Tu siguiente mancuerna (3 kg) es un salto grande: antes llega a 14 reps"});
      /* 12 y luego 14 con la misma: dos llenas, y el estirado tambien */
      limpio(app,{rp_prefs:Object.assign({goal:"salud"},lista),rp_logs:{[RB]:[r(9,2,12),r(2,2,14)]}});
      expect(tt(app,RB,FB)).toEqual({w:3,reps:8,subeCarga:true,why:"Sube a tu mancuerna de 3 kg y vuelve a 8 reps"});});
    test("salud: lo que no es el rango lleno sigue igual que en masa (molestia, series de menos, dentro del rango, primera vez)",app=>{
      const igual=(logs,extra)=>{limpio(app,con("masa",logs,extra));const m=tt(app,PB,GE);
        limpio(app,con("salud",logs,extra));expect(tt(app,PB,GE)).toEqual(m);return m;};
      expect(igual({[PB]:[ses(2,40,10)]},{rp_pain:{[PB]:[F.fecha(2)]}}).dolor).toBe(true);
      expect(igual({[PB]:[reg(2,GE,veces(3,40,10))]})).toEqual({w:40,reps:10,why:"La vez pasada 10: hoy 10 con el mismo peso"});
      expect(igual({[PB]:[ses(2,40,8)]})).toEqual({w:40,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
      expect(igual({}).nuevo).toBe(true);});
    test("salud sin carga (flexiones en la pared): la primera vez en el tope se mantiene sin hablar de peso",app=>{
      const FP="flexiones_pared",FA="salud_fuerza_a",r=(d,reps)=>reg(d,FA,veces(2,0,reps));
      limpio(app,con("salud",{[FP]:[r(9,11),r(2,12)]}));
      const t=tt(app,FP,FA);
      expect(t).toEqual({w:0,reps:12,mantiene:true,why:"Rango completo con 12 repeticiones: mantenerlo es un logro, repítelo"});
      expect(t.why).not.toMatch(/peso|kg|pesad/i);
      /* sentarse a 0 kg (con carga, sin mancuerna todavia): el mismo texto, sin peso */
      limpio(app,con("salud",{sentadilla_silla:[r(2,12)]}));
      expect(tt(app,"sentadilla_silla",FA)).toEqual({w:0,reps:12,mantiene:true,why:"Rango completo con 12 repeticiones: mantenerlo es un logro, repítelo"});
      /* lleno en las dos: ya no es la regla del objetivo */
      limpio(app,con("salud",{[FP]:[r(9,12),r(2,12)]}));
      expect(tt(app,FP,FA).mantiene).toBeFalsy();});
    test("masa con los mismos datos: sube a la primera, como en v36; y rp_prefs sin goal (v35) es masa",app=>{
      [con("masa",{[PB]:[ses(7,40,9),ses(2,40,10)]}),con(null,{[PB]:[ses(7,40,9),ses(2,40,10)]}),
       con("masa",{[PB]:[ses(2,40,10)]}),con(null,{[PB]:[ses(2,40,10)]}),
       {rp_logs:{[PB]:[ses(2,40,10)]}},{rp_prefs:{goal:"otro"},rp_logs:{[PB]:[ses(2,40,10)]}}].forEach(D=>{
        limpio(app,D);expect(tt(app,PB,GE)).toEqual(sube425);expect(app.w.reglaObjetivo().objetivo).toBe("masa");});
      /* la madre en masa: la de 3 kg estira a la primera, como en v36 */
      const D=F.madre();delete D.rp_prefs.goal;delete D.rp_prefs.pesosDB;limpio(app,D);
      expect(tt(app,"peso_muerto_rumano_db","salud_fuerza_b")).toEqual({w:3,reps:14,extiende:true,
        why:"El salto de peso sería más del 10%: estira el rango a 14 reps"});});
    test("datos de v35 sin goal: nada se rompe, nada se escribe y no hay claves nuevas",app=>{
      const D=F.madre();delete D.rp_prefs.goal;app.reiniciarMemoria();app.sembrar(D);
      const antes=app.foto(),R=app.ev("ROUTINES");let n=0;
      Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{const t=app.w.todayTarget(k,id);
        if(t){n++;expect(isFinite(t.w)&&t.reps>=1&&!!t.why).toBe(true);expect(t.mantiene).toBeFalsy();}}));
      expect(app.w.stalled()).toEqual([]);
      expect(n).toBeGreaterThan(20);
      expect(app.foto()).toEqual(antes);
      expect(app.claves()).toEqual(Object.keys(antes).sort());});
    test("los umbrales salen de un solo bloque: REGLAS por objetivo y reglaObjetivo() que lee el objetivo en cada llamada",app=>{
      limpio(app);
      const S=app.w.reglaObjetivo("salud"),M=app.w.reglaObjetivo("masa");
      /* sesiones para subir, freno por reserva <= 1 y dias de paron: en el bloque */
      expect([S.objetivo,S.llenasParaSalir,S.frenoRir,S.paronDias,S.paronLargo,S.estancadoEnTope,S.estancadoIgual])
        .toEqual(["salud",2,1,14,28,false,false]);
      expect([M.objetivo,M.llenasParaSalir,M.frenoRir,M.paronDias,M.paronLargo,M.estancadoEnTope,M.estancadoIgual])
        .toEqual(["masa",1,null,21,42,true,true]);
      /* lo comun es igual en los dos */
      ["rirSobra","repsSobra","paronFactor","paronHolgura","fallosSesiones","fallosBajadaMax"].forEach(c=>expect(S[c]).toEqual(M[c]));
      expect(app.w.reglaObjetivo()).toEqual(M);
      app.sembrar({rp_prefs:{goal:"salud"}});expect(app.w.reglaObjetivo()).toEqual(S);
      /* cambiar un numero del bloque cambia la regla y la sugerencia, sin cache */
      const R=app.ev("REGLAS"),guarda=JSON.stringify(R);
      try{
        app.ev("REGLAS.salud.paronDias=30;REGLAS.salud.frenoRir=0");
        expect([app.w.reglaObjetivo("salud").paronDias,app.w.reglaObjetivo("salud").frenoRir]).toEqual([30,0]);
        limpio(app,con("salud",{[PB]:[ses(2,40,10)]}));
        expect(tt(app,PB,GE).mantiene).toBe(true);
        app.ev("REGLAS.salud.llenasParaSalir=1");
        expect(tt(app,PB,GE)).toEqual(sube425);
        /* con tres, dos llenas aun se mantienen y tres suben */
        app.ev("REGLAS.salud.llenasParaSalir=3");
        limpio(app,con("salud",{[PB]:[ses(7,40,10),ses(2,40,10)]}));
        expect(tt(app,PB,GE).mantiene).toBe(true);
        limpio(app,con("salud",{[PB]:[ses(12,40,10),ses(7,40,10),ses(2,40,10)]}));
        expect(tt(app,PB,GE)).toEqual(sube425);
        /* y masa tambien sale de ahi */
        app.ev("REGLAS.masa.llenasParaSalir=2");
        limpio(app,con("masa",{[PB]:[ses(2,40,10)]}));
        expect(tt(app,PB,GE)).toEqual({w:40,reps:10,mantiene:true,why:logroW(40,10)});
      }finally{const o=JSON.parse(guarda);["comun","masa","salud"].forEach(g=>{Object.keys(R[g]).forEach(c=>delete R[g][c]);Object.assign(R[g],o[g]);});}
      expect(JSON.stringify(app.ev("REGLAS"))).toBe(guarda);});
    test("cambiar el objetivo en Ajustes cambia la sugerencia en el acto, sin recargar",app=>{
      limpio(app,con("masa",{[PB]:[ses(2,40,10)]}));
      app.$('.nav .tab[data-v="settings"]').click();
      const boton=g=>app.$$("button.minibtn").find(b=>(b.getAttribute("onclick")||"")==="setGoalPref('"+g+"')");
      expect(tt(app,PB,GE)).toEqual(sube425);
      boton("salud").click();
      expect(app.leer("rp_prefs").goal).toBe("salud");
      expect(tt(app,PB,GE)).toEqual({w:40,reps:10,mantiene:true,why:logroW(40,10)});
      expect(sug(app,PB,GE).w).toBe(40);
      boton("masa").click();
      expect(tt(app,PB,GE)).toEqual(sube425);
      app.$('.nav .tab[data-v="home"]').click();});
    test("stalled en salud no marca lo que se mantiene en el tope o por encima; en masa, con los mismos datos, si",app=>{
      /* el mejor, 32 × 10; despues 30 × 10 (en el tope) o 30 × 12 (por encima), con menos e1RM */
      [10,12].forEach(rr=>{const logs={[PB]:[ses(28,32,10),ses(21,30,rr),ses(14,30,rr),ses(7,30,rr)]};
        limpio(app,con("masa",logs));expect(app.w.stalled().map(x=>x.id)).toEqual([PB]);
        limpio(app,con("salud",logs));expect(app.w.stalled()).toEqual([]);
        expect(app.w.stalled(app.w.loadLogs())).toEqual([]);});});
    test("stalled en salud no marca cuatro sesiones iguales y si cuatro que bajan del mejor; en masa las iguales si",app=>{
      const RB="remo_db",FB="salud_fuerza_b",r=(d,w)=>reg(d,FB,veces(2,w,10)),
        iguales={[RB]:[r(28,2),r(21,2),r(14,2),r(7,2)]},bajan={[RB]:[r(28,3),r(21,2),r(14,2),r(7,2)]};
      limpio(app,con("salud",iguales));expect(app.w.stalled()).toEqual([]);
      limpio(app,con("masa",iguales));expect(app.w.stalled().map(x=>x.id)).toEqual([RB]);
      limpio(app,con("salud",bajan));expect(app.w.stalled().map(x=>x.id)).toEqual([RB]);
      limpio(app,con("masa",bajan));expect(app.w.stalled().map(x=>x.id)).toEqual([RB]);});
    test("el porque de mantener: sin «luego avanzas» y de 80 caracteres o menos con el peor caso",app=>{
      /* rango [12,20], 102.75 kg (seis caracteres, HU-57) y 22 reps */
      const EL="elevaciones_laterales",n=app.w.dose(GE,EL).sets||3;
      expect(app.w.repRange(EL)).toEqual([12,20]);
      limpio(app,con("salud",{[EL]:[reg(2,GE,veces(n,102.75,22))]}));
      const t=tt(app,EL,GE);
      expect(t).toEqual({w:102.75,reps:22,mantiene:true,why:logroW("102.75",22)});
      expect(t.why.length<=80).toBe(true);
      expect(t.why).not.toContain("avanzas");
      limpio(app,con("salud",{flexiones_pared:[reg(2,"salud_fuerza_a",veces(2,0,99))]}));
      const f=tt(app,"flexiones_pared","salud_fuerza_a");
      expect(f.mantiene).toBe(true);expect(f.why.length<=80).toBe(true);});
  });

  /* ---------- HU-15: empezar mas suave al volver de un paron ----------
     Mas de R.paronDias sin hacer el ejercicio (21 en masa, 14 en salud): el
     peso x0,9 (x0,8 pasado R.paronLargo: 42 / 28) bajado a un peso real, el
     minimo del rango y sin subir. Si el redondeo quitaria mas de un 20 % al
     objetivo, se mantiene el peso y solo bajan las reps. Las fechas son
     relativas (F.fecha): no dependen del dia en que corre */
  escenario("Lógica · parón (HU-15)",F.vacio,()=>{
    const PB="press_banca_db",GE="gym_empuje",RB="remo_db",FB="salud_fuerza_b",FP="flexiones_pared",FA="salud_fuerza_a",
      SS="sentadilla_silla",EQ="salud_equilibrio",
      ses=(n,w,reps,k,id)=>reg(n,k||GE,veces(4,w,reps)),
      con=(goal,logs,extra)=>Object.assign({rp_prefs:goal?{goal:goal}:{},rp_logs:logs},extra||{}),
      sem=dias=>Math.floor(dias/7)+" semanas",
      vuelve=(w,r,dias)=>({w:w,reps:r,vuelta:true,why:"Llevas "+sem(dias)+" sin hacerlo: vuelve con "+w+" kg y "+r+" reps, sin forzar"}),
      sigue=(w,r,dias)=>({w:w,reps:r,vuelta:true,why:"Llevas "+sem(dias)+" sin hacerlo: sigue con "+w+" kg, solo "+r+" reps y sin forzar"}),
      sinPeso=(r,dias)=>({w:0,reps:r,vuelta:true,why:"Llevas "+sem(dias)+" sin hacerlo: vuelve con "+r+" repeticiones, sin forzar"}),
      visto=(n,k)=>Object.assign({date:F.fecha(n),sets:[],t:F.momento(n,18,0).getTime(),checked:true},k?{k:k}:{});
    test("masa: 22 dias sin hacerlo a 40 kg → 40 × 0,9 bajado al salto real, el minimo del rango y sin subida; 43 dias → × 0,8",app=>{
      expect(app.w.repRange(PB)).toEqual([6,10]);
      /* sin salto declarado: la escala de siempre, 36 → 35 y 32 → 30 */
      limpio(app,con("masa",{[PB]:[ses(22,40,8)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(35,6,22));
      expect(sug(app,PB,GE)).toEqual({w:35,reps:6,why:vuelve(35,6,22).why});
      limpio(app,con("masa",{[PB]:[ses(43,40,8)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(30,6,43));
      /* 42 dias aun es x0,9 */
      limpio(app,con("masa",{[PB]:[ses(42,40,8)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(35,6,42));
      /* con el salto de la maquina (rp_inc): multiplos del salto, hacia abajo */
      [[5,35,30],[2,36,32],[2.5,35,30]].forEach(([s,a,b])=>{
        limpio(app,con("masa",{[PB]:[ses(22,40,8)]},{rp_inc:{[PB]:s}}));expect(tt(app,PB,GE)).toEqual(vuelve(a,6,22));
        limpio(app,con(null,{[PB]:[ses(43,40,8)]},{rp_inc:{[PB]:s}}));expect(tt(app,PB,GE)).toEqual(vuelve(b,6,43));});
      /* con el rango lleno antes del paron tampoco sube: vuelve, no 42,5 */
      limpio(app,con("masa",{[PB]:[ses(29,40,9),ses(22,40,10)]}));
      const t=tt(app,PB,GE);
      expect(t).toEqual(vuelve(35,6,22));expect(t.subeCarga).toBeFalsy();expect(t.extiende).toBeFalsy();
      /* el + de siempre desde el peso de vuelta: 35 → 37,5 → 40 */
      expect(app.w.nextW(PB,35,1)).toBe(37.5);expect(app.w.nextW(PB,37.5,1)).toBe(40);});
    test("masa: con 20 o 21 dias se aplica la regla normal, exactamente lo de antes",app=>{
      [[8,{w:40,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"}],
       [10,{w:42.5,reps:6,subeCarga:true,why:"Llenaste el rango entero: sube a 42.5 kg y vuelve a 6"}]].forEach(([r,esperado])=>{
        limpio(app,con("masa",{[PB]:[ses(2,40,r)]}));expect(tt(app,PB,GE)).toEqual(esperado);
        [20,21].forEach(d=>{limpio(app,con("masa",{[PB]:[ses(d,40,r)]}));expect(tt(app,PB,GE)).toEqual(esperado);
          limpio(app,con(null,{[PB]:[ses(d,40,r)]}));expect(tt(app,PB,GE)).toEqual(esperado);});});
      /* la molestia de hace 21 dias: la rama de siempre */
      limpio(app,con("masa",{[PB]:[ses(21,40,8)]},{rp_pain:{[PB]:[F.fecha(21)]}}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:8,dolor:true,why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});});
    test("salud: el umbral empieza a los 15 dias (mas de 14), y pasa a × 0,8 a los 29",app=>{
      limpio(app,con("salud",{[PB]:[ses(14,40,8)]}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
      limpio(app,con("salud",{[PB]:[ses(15,40,8)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(35,6,15));
      expect(vuelve(35,6,15).why).toContain("Llevas 2 semanas sin hacerlo");
      limpio(app,con("salud",{[PB]:[ses(28,40,8)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(35,6,28));
      limpio(app,con("salud",{[PB]:[ses(29,40,8)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(30,6,29));
      /* los mismos 15 dias en masa: regla normal */
      limpio(app,con("masa",{[PB]:[ses(15,40,8)]}));
      expect(tt(app,PB,GE).vuelta).toBeFalsy();});
    test("pesosDB [1,2,3] a 2 kg: el redondeo bajaria mas de un 20 %, mantiene 2 kg y solo baja las reps al minimo",app=>{
      const n=app.w.dose(FB,RB).sets||2,r=(d,w,reps)=>reg(d,FB,veces(n,w,reps)),
        lista=(l,goal)=>({rp_prefs:{goal:goal||"masa",pesosDB:l}});
      expect(app.w.repRange(RB)).toEqual([8,12]);
      /* 2 x 0,9 = 1,8: la de abajo es 1, y 1 < 1,8 x 0,8 */
      limpio(app,Object.assign(lista([1,2,3]),{rp_logs:{[RB]:[r(22,2,10)]}}));
      expect(tt(app,RB,FB)).toEqual(sigue(2,8,22));
      expect(sug(app,RB,FB)).toEqual({w:2,reps:8,why:sigue(2,8,22).why});
      /* el juego de la madre es salud: 15 dias ya es paron, y lo mismo */
      limpio(app,Object.assign(lista([1,2,3],"salud"),{rp_logs:{[RB]:[r(15,2,12)]}}));
      expect(tt(app,RB,FB)).toEqual(sigue(2,8,15));
      /* con la de 1,5 en la lista si se baja: 1,5 >= 1,44 */
      limpio(app,Object.assign(lista([1,1.5,2,3]),{rp_logs:{[RB]:[r(22,2,10)]}}));
      expect(tt(app,RB,FB)).toEqual(vuelve(1.5,8,22));
      /* 3 kg: x0,9 = 2,7 → 2 es demasiado (< 2,16); x0,8 = 2,4 → 2 vale */
      limpio(app,Object.assign(lista([1,2,3]),{rp_logs:{[RB]:[r(22,3,10)]}}));
      expect(tt(app,RB,FB)).toEqual(sigue(3,8,22));
      limpio(app,Object.assign(lista([1,2,3]),{rp_logs:{[RB]:[r(43,3,10)]}}));
      expect(tt(app,RB,FB)).toEqual(vuelve(2,8,43));
      /* con la mas ligera no hay nada por debajo: tambien se mantiene */
      limpio(app,Object.assign(lista([1,2,3]),{rp_logs:{[RB]:[r(43,1,10)]}}));
      expect(tt(app,RB,FB)).toEqual(sigue(1,8,43));
      /* nunca una mancuerna que no hay */
      [[1,2,3],[2,3,5],[1,1.5,2,3]].forEach(l=>[1,1.5,2,3,5].forEach(w=>[22,43].forEach(d=>{
        limpio(app,Object.assign(lista(l),{rp_logs:{[RB]:[r(d,w,10)]}}));const t=tt(app,RB,FB);
        expect(t.vuelta).toBe(true);expect(t.w===w||l.indexOf(t.w)>=0).toBe(true);expect(t.w<=w).toBe(true);})));
      /* salto declarado de 5 con 5 kg: el de abajo seria 0, se mantiene */
      limpio(app,con("masa",{[PB]:[ses(22,5,8)]},{rp_inc:{[PB]:5}}));
      expect(tt(app,PB,GE)).toEqual(sigue(5,6,22));});
    test("sin carga, tras el paron solo se pide el minimo del rango, sin hablar de peso",app=>{
      expect(app.w.repRange(FP)).toEqual([8,12]);
      [[12,22,"masa"],[16,22,"masa"],[5,22,"masa"],[12,15,"salud"],[12,43,"masa"]].forEach(([reps,d,g])=>{
        limpio(app,con(g,{[FP]:[reg(d,FA,veces(2,0,reps))]}));const t=tt(app,FP,FA);
        expect(t).toEqual(sinPeso(8,d));expect(t.why).not.toMatch(/peso|kg|pesad/i);
        expect(sug(app,FP,FA)).toEqual({w:0,reps:8,why:t.why});});
      /* con carga a 0 kg (sentarse sin mancuerna): el mismo texto, sin peso */
      limpio(app,con("salud",{[SS]:[reg(20,FA,veces(2,0,12))]}));
      expect(tt(app,SS,FA)).toEqual(sinPeso(8,20));});
    test("molestia y paron: el peso y las reps de la vuelta, con la molestia en el porque; sin paron, la rama de siempre",app=>{
      const m=dias=>({rp_pain:{[PB]:[F.fecha(dias)]}});
      limpio(app,con("masa",{[PB]:[ses(43,40,8)]},m(43)));
      expect(tt(app,PB,GE)).toEqual({w:30,reps:6,dolor:true,vuelta:true,
        why:"Molestia la última vez y 6 semanas sin hacerlo: vuelve con 30 kg y 6 reps"});
      limpio(app,con("masa",{[PB]:[ses(7,40,8)]},m(7)));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:8,dolor:true,why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});
      /* reps por debajo del minimo: se quedan las de la ultima vez */
      limpio(app,con("masa",{[PB]:[ses(22,40,5)]},m(22)));
      expect(tt(app,PB,GE)).toEqual({w:35,reps:5,dolor:true,vuelta:true,
        why:"Molestia la última vez y 3 semanas sin hacerlo: vuelve con 35 kg y 5 reps"});
      /* molestia repetida: el aviso de siempre, con el peso ya bajado */
      limpio(app,con("masa",{[PB]:[ses(26,40,8),ses(22,40,8)]},{rp_pain:{[PB]:[F.fecha(26),F.fecha(22)]}}));
      expect(tt(app,PB,GE)).toEqual({w:35,reps:6,dolor:true,vuelta:true,
        why:"Molestia repetida en este ejercicio: no subas y plantéate cambiarlo por otro"});
      /* la guarda del 20 %: mismo peso */
      const n=app.w.dose(FB,RB).sets||2;
      limpio(app,{rp_prefs:{goal:"masa",pesosDB:[1,2,3]},rp_logs:{[RB]:[reg(22,FB,veces(n,2,10))]},rp_pain:{[RB]:[F.fecha(22)]}});
      expect(tt(app,RB,FB)).toEqual({w:2,reps:8,dolor:true,vuelta:true,
        why:"Molestia la última vez y 3 semanas sin hacerlo: sigue con 2 kg y 8 reps"});
      /* sin carga */
      limpio(app,con("masa",{[FP]:[reg(22,FA,veces(2,0,12))]},{rp_pain:{[FP]:[F.fecha(22)]}}));
      const f=tt(app,FP,FA);
      expect(f).toEqual({w:0,reps:8,dolor:true,vuelta:true,why:"Molestia la última vez y 3 semanas sin hacerlo: vuelve con 8 repeticiones"});
      expect(f.why).not.toMatch(/peso|kg|pesad/i);});
    test("sin salto ni lista, la escala inversa de progStep: el + de siempre vuelve al peso de partida",app=>{
      limpio(app);
      [[40,37.5],[21,19],[20,18],[10,9],[22,19.5],[9,8],[2,1],[2.5,1.5],[1,0],[0.5,0]].forEach(([w,abajo])=>{
        expect({[w]:app.w.pasoAbajo(w)}).toEqual({[w]:abajo});
        if(abajo>0&&abajo+app.w.progStep(abajo)===w)expect(app.w.nextW(PB,abajo,1)).toBe(w);});
      /* 10 kg: 9 y 8 (ya no salen iguales); 20 kg: 18 y 16, y 18 + 2 = 20 */
      [[10,22,9],[10,43,8],[20,22,18],[20,43,16],[40,22,35],[40,43,30]].forEach(([w,d,esperado])=>{
        limpio(app,con("masa",{[PB]:[ses(d,w,8)]}));expect(tt(app,PB,GE)).toEqual(vuelve(esperado,6,d));});
      expect(app.w.nextW(PB,18,1)).toBe(20);expect(app.w.nextW(PB,9,1)).toBe(10);expect(app.w.nextW(PB,8,1)).toBe(9);
      /* bajarA, suelta: lista, salto y escala */
      limpio(app,{rp_inc:{[PB]:5}});
      expect([app.w.bajarA(PB,40,36,GE),app.w.bajarA(PB,40,32,GE),app.w.bajarA(PB,5,4.5,GE)]).toEqual([35,30,null]);
      limpio(app);
      expect([app.w.bajarA(PB,40,36,GE),app.w.bajarA(PB,1,0.9,GE)]).toEqual([35,null]);
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]}});
      expect([app.w.bajarA(RB,3,2.7,FB),app.w.bajarA(RB,1,0.9,FB)]).toEqual([2,null]);});
    test("los vistos: con carga solo cuentan los de la misma rutina; sin carga, todos; un visto sin rutina no cuenta con carga",app=>{
      const n=app.w.dose(FA,SS).sets||2,s=(d,k,w)=>reg(d,k,veces(n,w,10));
      /* sentarse con 2 kg en Fuerza A hace 30 dias, visto en Equilibrio hace 2: paron */
      limpio(app,con("salud",{[SS]:[s(30,FA,2),visto(2,EQ)]}));
      expect(tt(app,SS,FA).vuelta).toBe(true);
      /* visto en Fuerza A hace 2: la regla normal */
      limpio(app,con("salud",{[SS]:[s(30,FA,2),visto(2,FA)]}));
      expect(tt(app,SS,FA)).toEqual({w:2,reps:11,why:"La vez pasada 10: hoy 11 con el mismo peso"});
      /* sin carga, el visto de otra rutina tambien cuenta */
      limpio(app,con("salud",{[FP]:[reg(30,FA,veces(2,0,10)),visto(2,EQ)]}));
      expect(tt(app,FP,FA).vuelta).toBeFalsy();
      limpio(app,con("salud",{[FP]:[reg(30,FA,veces(2,0,10))]}));
      expect(tt(app,FP,FA).vuelta).toBe(true);
      /* sin rutina (copias viejas): la ultima sesion con series y el visto, los dos sin k */
      const sinK=r=>{delete r.k;return r;};
      limpio(app,con("salud",{[PB]:[sinK(ses(30,40,8)),visto(2)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(30,6,30));
      limpio(app,con("masa",{[PB]:[sinK(ses(30,40,8)),visto(2)]}));
      expect(tt(app,PB,GE)).toEqual(vuelve(35,6,30));
      limpio(app,con("masa",{[FP]:[sinK(reg(30,FA,veces(2,0,10))),visto(2)]}));
      expect(tt(app,FP,FA).vuelta).toBeFalsy();
      /* una sesion con series mas reciente pero antes en el array tambien cuenta */
      limpio(app,con("masa",{[PB]:[ses(3,30,8,"gym_tiron"),ses(30,40,8)]}));
      expect(tt(app,PB,GE).vuelta).toBeFalsy();});
    test("diasDesde: medianoche local a medianoche local, nula, rota o futura es 0",app=>{
      limpio(app);
      expect([0,1,14,15,21,22,43].map(n=>app.w.diasDesde(F.fecha(n)))).toEqual([0,1,14,15,21,22,43]);
      expect([app.w.diasDesde(null),app.w.diasDesde(""),app.w.diasDesde("no es fecha"),app.w.diasDesde(F.fecha(-5))]).toEqual([0,0,0,0]);});
    test("los dias de paron salen del bloque REGLAS: cambiar un numero cambia la sugerencia",app=>{
      const R=app.ev("REGLAS"),guarda=JSON.stringify(R);
      try{
        limpio(app,con("masa",{[PB]:[ses(22,40,8)]}));
        expect(tt(app,PB,GE)).toEqual(vuelve(35,6,22));
        app.ev("REGLAS.masa.paronDias=30");
        expect(tt(app,PB,GE)).toEqual({w:40,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
        app.ev("REGLAS.masa.paronDias=21;REGLAS.masa.paronLargo=21");
        expect(tt(app,PB,GE)).toEqual(vuelve(30,6,22));
        app.ev("REGLAS.comun.paronFactor=[0.95,0.8];REGLAS.masa.paronLargo=42");
        expect(tt(app,PB,GE)).toEqual(vuelve(37.5,6,22));
        app.ev("REGLAS.salud.paronDias=20");
        limpio(app,con("salud",{[PB]:[ses(15,40,8)]}));
        expect(tt(app,PB,GE).vuelta).toBeFalsy();
        /* la holgura: con 0,5 la de 1 kg desde 2 ya vale (1 >= 1,8 x 0,5) */
        app.ev("REGLAS.comun.paronHolgura=0.5");
        limpio(app,{rp_prefs:{goal:"masa",pesosDB:[1,2,3]},rp_logs:{[RB]:[reg(22,FB,veces(2,2,10))]}});
        expect(tt(app,RB,FB)).toEqual(vuelve(1,8,22));
      }finally{const o=JSON.parse(guarda);["comun","masa","salud"].forEach(g=>{Object.keys(R[g]).forEach(c=>delete R[g][c]);Object.assign(R[g],o[g]);});}
      expect(JSON.stringify(app.ev("REGLAS"))).toBe(guarda);});
    test("stalled despues de una vuelta: el peso de antes del paron no es el mejor que batir",app=>{
      const tras={[PB]:[ses(50,40,8),ses(43,40,8),ses(21,35,6),ses(14,35,7),ses(7,35,8)]},
        semanal={[PB]:[ses(35,40,8),ses(28,40,8),ses(21,35,6),ses(14,35,7),ses(7,35,8)]};
      limpio(app,con("masa",tras));expect(app.w.stalled()).toEqual([]);
      limpio(app,con("masa",semanal));expect(app.w.stalled().map(x=>x.id)).toEqual([PB]);
      /* en salud el hueco de mas de 14 tambien corta (17 dias: en masa no) */
      const salud={[PB]:[ses(50,40,8),ses(38,40,8),ses(21,35,6),ses(14,35,7),ses(7,35,8)]};
      limpio(app,con("masa",salud));expect(app.w.stalled().map(x=>x.id)).toEqual([PB]);
      limpio(app,con("salud",salud));expect(app.w.stalled()).toEqual([]);
      /* tras la vuelta, cuatro sesiones que no superan la primera: si marca */
      limpio(app,con("masa",{[PB]:[ses(55,40,8),ses(30,36,8),ses(21,35,8),ses(14,35,8),ses(7,35,8)]}));
      expect(app.w.stalled().map(x=>x.id)).toEqual([PB]);
      expect(app.w.inicioTramo(PB,app.w.loadLogs()[PB],app.w.reglaObjetivo())).toBe(1);});
    test("los porques del paron: 80 caracteres o menos con el peor caso (12 semanas, 102.75 kg, rango [12,20])",app=>{
      const EL="elevaciones_laterales",n=app.w.dose(GE,EL).sets||3,D=85,
        caso=(w,lista,dolor,reps)=>{limpio(app,Object.assign({rp_prefs:{goal:"masa",pesosDB:lista},rp_logs:{[EL]:[reg(D,GE,veces(n,w,reps||22))]}},
          dolor?{rp_pain:{[EL]:[F.fecha(D)]}}:{}));return tt(app,EL,GE);};
      expect(app.w.repRange(EL)).toEqual([12,20]);
      const todos=[
        [caso(130,[102.75,130]),vuelve(102.75,12,D)],
        [caso(102.75,[1,102.75]),sigue(102.75,12,D)],
        [caso(0,[1,2]),sinPeso(12,D)],
        [caso(130,[102.75,130],true),{w:102.75,reps:12,dolor:true,vuelta:true,why:"Molestia la última vez y 12 semanas sin hacerlo: vuelve con 102.75 kg y 12 reps"}],
        [caso(102.75,[1,102.75],true),{w:102.75,reps:12,dolor:true,vuelta:true,why:"Molestia la última vez y 12 semanas sin hacerlo: sigue con 102.75 kg y 12 reps"}],
        [caso(0,[1,2],true),{w:0,reps:12,dolor:true,vuelta:true,why:"Molestia la última vez y 12 semanas sin hacerlo: vuelve con 12 repeticiones"}]];
      todos.forEach(([t,esperado])=>{expect(t).toEqual(esperado);expect({[t.why]:t.why.length<=80}).toEqual({[t.why]:true});});});
  });

  /* ---------- HU-14: bajar un poco el peso tras dos sesiones por debajo del rango ----------
     Las R.fallosSesiones (2) ultimas sesiones con la primera serie por debajo
     del minimo y al mismo peso: un peso real menos (unSaltoMenos) y el minimo
     + 1. Si bajar quitaria mas de R.fallosBajadaMax (25 %) o no hay nada mas
     ligero, mismo peso y el minimo. Igual en masa y en salud. Fechas relativas
     (F.fecha) y siempre dentro de los dias de paron: no dependen del dia */
  escenario("Lógica · dos sesiones por debajo del rango (HU-14)",F.vacio,()=>{
    const PB="press_banca_db",GE="gym_empuje",PH="press_hombro_db",FA="salud_fuerza_a",FP="flexiones_pared",
      SS="sentadilla_silla",CB="curl_barra",GT="gym_tiron",
      ses=(n,w,reps,k,id,series)=>reg(n,k||GE,veces(series||4,w,reps)),
      /* las dos sesiones: la penultima hace 5 dias y la ultima hace 2 */
      dos=(w,ra,rb,k,series)=>[ses(5,w,ra,k,null,series),ses(2,w,rb==null?ra:rb,k,null,series)],
      con=(goal,logs,extra)=>Object.assign({rp_prefs:goal?{goal:goal}:{},rp_logs:logs},extra||{}),
      baja=(w,min,r)=>({w:w,reps:r,fallos:true,why:"Dos veces por debajo de "+min+": baja a "+w+" kg y busca "+r}),
      sigue=(w,min,motivo)=>({w:w,reps:min,fallos:true,why:"Dos veces por debajo de "+min+": "+
        (motivo==="ligera"?"ya es lo más ligero":"bajar es demasiado")+", sigue con "+w+" kg y busca "+min}),
      facil=min=>({w:0,reps:min,fallos:true,why:"Dos veces por debajo de "+min+": prueba una variante algo más fácil y busca "+min}),
      dolorPen=(w,r,sinPeso)=>({w:w,reps:r,dolor:true,why:"Hace dos sesiones anotaste molestia: "+(sinPeso?"mismas repeticiones":"mismo peso")+" y sin forzar"});
    test("criterio 1: dos sesiones con 40 kg y la primera serie por debajo del minimo → 37,5 kg y el minimo + 1; con rp_inc 5, 35 kg",app=>{
      expect(app.w.repRange(PB)).toEqual([6,10]);
      limpio(app,con("masa",{[PB]:dos(40,5)}));
      expect(tt(app,PB,GE)).toEqual(baja(37.5,6,7));
      expect(sug(app,PB,GE)).toEqual({w:37.5,reps:7,why:baja(37.5,6,7).why});
      limpio(app,con("masa",{[PB]:dos(40,5)},{rp_inc:{[PB]:5}}));
      expect(tt(app,PB,GE)).toEqual(baja(35,6,7));
      expect(sug(app,PB,GE)).toEqual({w:35,reps:7,why:baja(35,6,7).why});
      /* cuenta la primera serie: las demas, mas cortas o no, no cambian nada */
      limpio(app,con("masa",{[PB]:[reg(5,GE,[[40,5],[40,4],[40,3],[40,3]]),reg(2,GE,[[40,4],[40,6],[40,6],[40,6]])]}));
      expect(tt(app,PB,GE)).toEqual(baja(37.5,6,7));
      /* con el salto de la maquina: el boton − de siempre */
      [[45,5,40],[42.5,5,40],[100,10,90],[40,2.5,37.5],[27,4.5,22.5]].forEach(([w,s,abajo])=>{
        limpio(app,con("masa",{[PB]:dos(w,5)},{rp_inc:{[PB]:s}}));
        expect({[w+"/"+s]:tt(app,PB,GE)}).toEqual({[w+"/"+s]:baja(abajo,6,7)});});
      /* sin salto ni lista, la escala inversa de progStep: 20 → 18, no 17,5 */
      expect(app.w.repRange(CB)).toEqual([8,12]);
      limpio(app,con("masa",{[CB]:dos(20,5,null,GT,3)}));
      expect(tt(app,CB,GT)).toEqual(baja(18,8,9));
      expect(app.w.nextW(CB,18,1)).toBe(20);
      /* siguiendo la propuesta, la siguiente sesion va con la regla normal */
      limpio(app,con("masa",{[PB]:dos(40,5).concat([ses(1,37.5,7)])}));
      expect(tt(app,PB,GE)).toEqual({w:37.5,reps:8,why:"La vez pasada 7: hoy 8 con el mismo peso"});
      /* pesos y reps guardados como texto (una copia editada a mano) */
      const txt=dos(40,5);txt.forEach(r=>r.sets.forEach(s=>{s.w="40";s.reps="5";}));
      limpio(app,con("masa",{[PB]:txt}));
      expect(tt(app,PB,GE)).toEqual(baja(37.5,6,7));});
    test("criterio 1: con rp_inc, el salto que deja en 0 es «ya es lo más ligero» y el que baja de mas «bajar es demasiado»",app=>{
      limpio(app,con("masa",{[PB]:dos(5,5)},{rp_inc:{[PB]:5}}));
      expect(tt(app,PB,GE)).toEqual(sigue(5,6,"ligera"));
      limpio(app,con("masa",{[PB]:dos(10,5)},{rp_inc:{[PB]:5}}));
      expect(tt(app,PB,GE)).toEqual(sigue(10,6,"demasiado"));
      /* sin salto ni lista, 1 kg: no hay nada por debajo */
      limpio(app,con("masa",{[PB]:dos(1,5)}));
      expect(tt(app,PB,GE)).toEqual(sigue(1,6,"ligera"));});
    test("unSaltoMenos, suelta: lista, salto declarado y escala; null si no hay nada mas ligero",app=>{
      const con5=s=>limpio(app,{rp_inc:{[PB]:s}});
      con5(5);expect([40,45,42.5,5,3].map(w=>app.w.unSaltoMenos(PB,w,GE))).toEqual([35,40,40,null,null]);
      con5(4.5);expect(app.w.unSaltoMenos(PB,27,GE)).toBe(22.5);
      con5(2.5);expect(app.w.unSaltoMenos(PB,40,GE)).toBe(37.5);
      con5(7);expect(app.w.unSaltoMenos(PB,7,GE)).toBe(null);
      limpio(app);expect([40,20,10,1].map(w=>app.w.unSaltoMenos(PB,w,GE))).toEqual([37.5,18,9,null]);
      limpio(app,{rp_prefs:{pesosDB:[1,2,3]}});
      expect([3,2,1,2.5].map(w=>app.w.unSaltoMenos(PH,w,FA))).toEqual([2,1,null,2]);});
    test("criterio 2: una sola sesion por debajo, o el peso cambiado entre ellas → la regla de mantener de siempre",app=>{
      const mantiene=(w,r1,r)=>({w:w,reps:r,why:"La vez pasada "+r1+": hoy "+r+" con el mismo peso"});
      /* solo la ultima por debajo */
      limpio(app,con("masa",{[PB]:[ses(5,40,7),ses(2,40,5)]}));
      expect(tt(app,PB,GE)).toEqual(mantiene(40,5,6));
      /* solo la penultima por debajo */
      limpio(app,con("masa",{[PB]:[ses(5,40,5),ses(2,40,7)]}));
      expect(tt(app,PB,GE)).toEqual(mantiene(40,7,8));
      /* una sola sesion en todo el historial */
      limpio(app,con("masa",{[PB]:[ses(2,40,5)]}));
      expect(tt(app,PB,GE)).toEqual(mantiene(40,5,6));
      /* el peso cambio entre ellas, en los dos sentidos */
      limpio(app,con("masa",{[PB]:[ses(5,37.5,5),ses(2,40,5)]}));
      expect(tt(app,PB,GE)).toEqual(mantiene(40,5,6));
      limpio(app,con("masa",{[PB]:[ses(5,40,5),ses(2,37.5,5)]}));
      expect(tt(app,PB,GE)).toEqual(mantiene(37.5,5,6));
      /* en el minimo justo no es estar por debajo */
      limpio(app,con("masa",{[PB]:dos(40,6)}));
      expect(tt(app,PB,GE)).toEqual(mantiene(40,6,7));
      /* un visto entre las dos no rompe la cadena (no tiene series) */
      limpio(app,con("masa",{[PB]:[ses(5,40,5),{date:F.fecha(3),sets:[],k:GE,t:F.momento(3,18,0).getTime(),checked:true},ses(2,40,5)]}));
      expect(tt(app,PB,GE)).toEqual(baja(37.5,6,7));});
    test("criterio 3: con molestia anotada en alguna de las dos sesiones no se baja: manda la rama de molestia",app=>{
      const m=(...n)=>({rp_pain:{[PB]:n.map(F.fecha)}});
      /* en la ultima: la rama de siempre */
      limpio(app,con("masa",{[PB]:dos(40,5)},m(2)));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:5,dolor:true,why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});
      /* solo en la penultima: mismo peso y mismas reps, con dolor */
      limpio(app,con("masa",{[PB]:dos(40,5)},m(5)));
      expect(tt(app,PB,GE)).toEqual(dolorPen(40,5));
      expect(sug(app,PB,GE)).toEqual({w:40,reps:5,why:dolorPen(40,5).why});
      /* en las dos: el aviso de la molestia repetida */
      limpio(app,con("masa",{[PB]:dos(40,5)},m(5,2)));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:5,dolor:true,why:"Molestia repetida en este ejercicio: no subas y plantéate cambiarlo por otro"});
      /* con rp_inc y en salud, lo mismo */
      limpio(app,con("salud",{[PB]:dos(40,5)},Object.assign(m(5),{rp_inc:{[PB]:5}})));
      expect(tt(app,PB,GE)).toEqual(dolorPen(40,5));
      /* molestia en la penultima sin los dos fallos: no frena (como en v35) */
      limpio(app,con("masa",{[PB]:dos(40,8)},m(5)));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
      /* sin carga: sin hablar de peso */
      limpio(app,con("masa",{[FP]:dos(0,5,null,FA,2)},{rp_pain:{[FP]:[F.fecha(5)]}}));
      const f=tt(app,FP,FA);
      expect(f).toEqual(dolorPen(0,5,true));expect(f.why).not.toMatch(/peso|kg|pesad/i);});
    test("criterio 4: pesosDB [1,2,3] a 2 kg, bajar a 1 seria mas del 25 % → mantiene 2 kg y pide el minimo",app=>{
      const n=app.w.dose(FA,PH).sets||2,lista=(l,goal)=>({rp_prefs:{goal:goal||"masa",pesosDB:l}}),
        logs=w=>({rp_logs:{[PH]:dos(w,6,null,FA,n)}});
      expect(app.w.repRange(PH)).toEqual([8,12]);
      limpio(app,Object.assign(lista([1,2,3]),logs(2)));
      expect(tt(app,PH,FA)).toEqual(sigue(2,8,"demasiado"));
      expect(sug(app,PH,FA)).toEqual({w:2,reps:8,why:sigue(2,8,"demasiado").why});
      /* el juego de la madre es salud: lo mismo */
      limpio(app,Object.assign(lista([1,2,3],"salud"),logs(2)));
      expect(tt(app,PH,FA)).toEqual(sigue(2,8,"demasiado"));
      /* con la mas ligera: «ya es lo más ligero» */
      limpio(app,Object.assign(lista([1,2,3]),logs(1)));
      expect(tt(app,PH,FA)).toEqual(sigue(1,8,"ligera"));
      /* 3 kg → 2 es -33 %: tambien se mantiene; con la de 2,5 en la lista si baja (-17 %) */
      limpio(app,Object.assign(lista([1,2,3]),logs(3)));
      expect(tt(app,PH,FA)).toEqual(sigue(3,8,"demasiado"));
      limpio(app,Object.assign(lista([1,2,2.5,3]),logs(3)));
      expect(tt(app,PH,FA)).toEqual(baja(2.5,8,9));
      /* nunca una mancuerna que no hay, y nunca mas peso */
      [[1,2,3],[2,3,5],[1,1.5,2,3]].forEach(l=>[1,1.5,2,3,5].forEach(w=>{
        limpio(app,Object.assign(lista(l),logs(w)));const t=tt(app,PH,FA);
        expect(t.fallos).toBe(true);expect(t.w===w||l.indexOf(t.w)>=0).toBe(true);expect(t.w<=w).toBe(true);
        expect(t.w>=w*0.75-1e-9).toBe(true);}));});
    test("criterio 5: la regla es la misma en masa y en salud (y sin objetivo guardado, como en v35)",app=>{
      const casos=[[{[PB]:dos(40,5)},{}],[{[PB]:dos(40,5)},{rp_inc:{[PB]:5}}],[{[PB]:dos(10,5)},{rp_inc:{[PB]:5}}],
        [{[PB]:dos(40,5)},{rp_pain:{[PB]:[F.fecha(5)]}}],[{[CB]:dos(20,5,null,GT,3)},{}],[{[PB]:[ses(5,37.5,5),ses(2,40,5)]},{}]];
      casos.forEach(([logs,extra],i)=>{const id=Object.keys(logs)[0],k=id===CB?GT:GE,
          vale=g=>{limpio(app,con(g,JSON.parse(JSON.stringify(logs)),extra));return tt(app,id,k);};
        const masa=vale("masa");
        expect({[i]:vale("salud")}).toEqual({[i]:masa});
        expect({[i]:vale(null)}).toEqual({[i]:masa});});
      limpio(app,con("salud",{[PB]:dos(40,5)}));
      expect(tt(app,PB,GE)).toEqual(baja(37.5,6,7));});
    test("sin carga, o con carga a 0 kg: una variante algo mas facil y el minimo, sin hablar de peso",app=>{
      expect(app.w.repRange(FP)).toEqual([8,12]);
      ["masa","salud"].forEach(g=>{
        limpio(app,con(g,{[FP]:dos(0,5,null,FA,2)}));const f=tt(app,FP,FA);
        expect(f).toEqual(facil(8));expect(f.why).not.toMatch(/peso|kg|pesad/i);
        expect(sug(app,FP,FA)).toEqual({w:0,reps:8,why:f.why});});
      limpio(app,con("salud",{[SS]:dos(0,5,null,FA,2)}));
      const s=tt(app,SS,FA);
      expect(s).toEqual(facil(8));expect(s.why).not.toMatch(/peso|kg|pesad/i);});
    test("el paron gana a los dos fallos: con semanas sin hacerlo, la vuelta",app=>{
      limpio(app,con("masa",{[PB]:[ses(30,40,5),ses(23,40,5)]}));
      expect(tt(app,PB,GE)).toEqual({w:35,reps:6,vuelta:true,why:"Llevas 3 semanas sin hacerlo: vuelve con 35 kg y 6 reps, sin forzar"});});
    test("los numeros salen del bloque REGLAS: cambiar uno cambia la sugerencia",app=>{
      const R=app.ev("REGLAS"),guarda=JSON.stringify(R);
      try{
        limpio(app,{rp_prefs:{goal:"masa",pesosDB:[1,2,3]},rp_logs:{[PH]:dos(2,6,null,FA,2)}});
        expect(tt(app,PH,FA)).toEqual(sigue(2,8,"demasiado"));
        app.ev("REGLAS.comun.fallosBajadaMax=0.5");
        expect(tt(app,PH,FA)).toEqual(baja(1,8,9));
        app.ev("REGLAS.comun.fallosBajadaMax=0.25;REGLAS.comun.fallosSesiones=3");
        limpio(app,con("masa",{[PB]:dos(40,5)}));
        expect(tt(app,PB,GE)).toEqual({w:40,reps:6,why:"La vez pasada 5: hoy 6 con el mismo peso"});
        limpio(app,con("masa",{[PB]:[ses(8,40,5)].concat(dos(40,5))}));
        expect(tt(app,PB,GE)).toEqual(baja(37.5,6,7));
      }finally{const o=JSON.parse(guarda);["comun","masa","salud"].forEach(g=>{Object.keys(R[g]).forEach(c=>delete R[g][c]);Object.assign(R[g],o[g]);});}
      expect(JSON.stringify(app.ev("REGLAS"))).toBe(guarda);});
    test("stalled despues de la bajada por fallos: el peso de antes no es el mejor que batir",app=>{
      const bajada={[PB]:[ses(29,40,8),ses(22,40,5),ses(15,40,5),ses(8,37.5,7),ses(1,37.5,8)]},
        sinBajar={[PB]:[ses(29,40,8),ses(22,40,5),ses(15,40,5),ses(8,40,6),ses(1,40,6)]},
        descarga={[PB]:[ses(29,40,8),ses(22,40,8),ses(15,40,8),ses(8,37.5,7),ses(1,37.5,8)]};
      ["masa","salud"].forEach(g=>{limpio(app,con(g,bajada));expect(app.w.stalled()).toEqual([]);
        expect(app.w.inicioTramo(PB,app.w.loadLogs()[PB],app.w.reglaObjetivo())).toBe(3);});
      limpio(app,con("masa",sinBajar));expect(app.w.stalled().map(x=>x.id)).toEqual([PB]);
      /* una bajada que no viene de dos fallos (una descarga) no corta */
      limpio(app,con("masa",descarga));expect(app.w.stalled().map(x=>x.id)).toEqual([PB]);
      expect(app.w.inicioTramo(PB,app.w.loadLogs()[PB],app.w.reglaObjetivo())).toBe(0);});
    test("los porques de los dos fallos: 80 caracteres o menos con el peor caso (102.75 kg, rango [12,20])",app=>{
      const EL="elevaciones_laterales",n=app.w.dose(GE,EL).sets||3,
        caso=(w,lista,dolor)=>{limpio(app,Object.assign({rp_prefs:{goal:"masa",pesosDB:lista},rp_logs:{[EL]:dos(w,10,null,GE,n)}},
          dolor?{rp_pain:{[EL]:[F.fecha(5)]}}:{}));return tt(app,EL,GE);};
      expect(app.w.repRange(EL)).toEqual([12,20]);
      const todos=[
        [caso(130,[102.75,130]),baja(102.75,12,13)],
        [caso(102.75,[1,102.75]),sigue(102.75,12,"demasiado")],
        [caso(102.75,[102.75]),sigue(102.75,12,"ligera")],
        [caso(0,[1,2]),facil(12)],
        [caso(102.75,[1,102.75],true),dolorPen(102.75,10)],
        [caso(0,[1,2],true),dolorPen(0,10,true)]];
      todos.forEach(([t,esperado])=>{expect(t).toEqual(esperado);expect({[t.why]:t.why.length<=80}).toEqual({[t.why]:true});});});
    test("criterio 6: con los datos de v35 nada baja por fallos, nada se escribe y no hay claves nuevas",app=>{
      [F.dueno,F.madre].forEach(fx=>{limpio(app,fx());
        expect(nuevas(app)).toEqual([]);
        const antes=app.foto(),R=app.ev("ROUTINES"),malos=[];let n=0;
        Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{const t=app.w.todayTarget(k,id);app.w.suggestLoad(id,k);
          if(!t)return;n++;if(t.fallos)malos.push(k+" "+id+" "+JSON.stringify(t));}));
        expect(malos).toEqual([]);expect(n).toBeGreaterThan(20);
        expect(app.foto()).toEqual(antes);expect(nuevas(app)).toEqual([]);});
      /* y con dos fallos sembrados tampoco se escribe nada */
      limpio(app,con("masa",{[PB]:dos(40,5)},{rp_inc:{[PB]:5}}));
      const antes=app.foto(),claves=app.claves().slice().sort();tt(app,PB,GE);sug(app,PB,GE);
      expect(app.foto()).toEqual(antes);expect(app.claves().slice().sort()).toEqual(claves);});
  });

  /* ---------- HU-13: «¿Cuántas más podías?» cambia la sugerencia ----------
     La reserva anotada (s.rir: 0, 1, 2 o 3 = «3+») mueve la propuesta: (a) en
     masa, el rango lleno con reserva 0 en TODAS las series sube al siguiente
     peso real aunque el salto pase del 10 %; (b) reserva 3+ en la primera
     serie pide +2 reps en vez de +1, sin pasar del tope (y veta la bajada por
     dos fallos); (c) en salud, alguna serie con reserva 0-1 pide mismo peso y
     mismas reps. Una serie sin reserva no cuenta. Fechas relativas (F.fecha) */
  escenario("Lógica · la reserva cambia la sugerencia (HU-13)",F.vacio,()=>{
    const PB="press_banca_db",GE="gym_empuje",EL="elevaciones_laterales",JP="jalon_pecho",GT="gym_tiron",
      PH="press_hombro_db",FA="salud_fuerza_a",FB="salud_fuerza_b",RB="remo_db",FP="flexiones_pared",SS="sentadilla_silla",
      /* un registro con reserva por serie: series = [[w,reps,rir?]] (rir null: sin anotar) */
      regR=(n,k,series)=>{const r=reg(n,k,series);r.sets.forEach((s,i)=>{if(series[i][2]!=null)s.rir=series[i][2];});return r;},
      todas=(n,w,reps,rir)=>Array.from({length:n},()=>[w,reps,rir]),
      con=(goal,logs,extra)=>Object.assign({rp_prefs:goal?{goal:goal}:{},rp_logs:logs},extra||{}),
      sinRir=v=>JSON.parse(JSON.stringify(v),(k,x)=>k==="rir"?undefined:x),
      alFallo=(w,min,lista)=>({w:w,reps:min,subeCarga:true,why:"Llenaste el rango con reserva 0: sube a "+(lista?"tu mancuerna de ":"")+w+" kg y vuelve a "+min}),
      sobra=(w,r1,r,sinPeso)=>({w:w,reps:r,why:"La vez pasada "+r1+" con reserva 3+: hoy "+r+(sinPeso?"":" con el mismo peso")}),
      freno=(w,r,m,sinPeso)=>({w:w,reps:r,mantiene:true,why:m===0
        ?"Llegaste al fallo: "+(sinPeso?"mismas "+r+" repeticiones":"mismo peso y "+r+" reps")+", busca dejar 1 en reserva"
        :"Te quedó solo "+m+": repite "+r+(sinPeso?" repeticiones":" reps con el mismo peso")+", busca dejar 1 en reserva"});
    test("criterio 1 (masa): rango lleno con reserva 0 en todas las series y salto > 10 % → sube con el salto minimo y el porque dice «reserva 0»",app=>{
      const n=app.w.dose(GE,EL).sets||4;
      expect(app.w.repRange(EL)).toEqual([12,20]);
      /* 8 kg: el salto de 1 kg es un 12,5 %; sin reserva estiraba a 22 */
      limpio(app,con("masa",{[EL]:[regR(2,GE,todas(n,8,20,0))]}));
      const t=tt(app,EL,GE);
      expect(t).toEqual(alFallo(9,12));
      expect(t.why).toContain("reserva 0");
      expect(sug(app,EL,GE)).toEqual({w:9,reps:12,why:t.why});
      /* con el salto de la maquina declarado: el siguiente multiplo (40 → 45, +12,5 %) */
      const nj=app.w.dose(GT,JP).sets||4;
      expect(app.w.repRange(JP)).toEqual([8,12]);
      limpio(app,con("masa",{[JP]:[regR(2,GT,todas(nj,40,12,0))]},{rp_inc:{[JP]:5}}));
      expect(tt(app,JP,GT)).toEqual(alFallo(45,8));
      /* con la lista de mancuernas: la siguiente que existe (2 → 3) */
      const nh=app.w.dose(FA,PH).sets||2;
      limpio(app,{rp_prefs:{goal:"masa",pesosDB:[1,2,3]},rp_logs:{[PH]:[regR(2,FA,todas(nh,2,12,0))]}});
      expect(tt(app,PH,FA)).toEqual(alFallo(3,8,true));
      /* lo que en casa se hace con ellas sin ser de mancuerna (availDB con k): sentarse 1 → 2 */
      const ns=app.w.dose(FA,SS).sets||2;
      limpio(app,{rp_prefs:{goal:"masa",pesosDB:[1,2,3]},rp_logs:{[SS]:[regR(2,FA,todas(ns,1,12,0))]}});
      expect(tt(app,SS,FA)).toEqual(alFallo(2,8,true));});
    test("criterio 1: sin reserva 0 en TODAS las series, o con la mas pesada, o con salto suave, lo de siempre (byte a byte)",app=>{
      const n=app.w.dose(GE,EL).sets||4,estira={w:8,reps:22,extiende:true,why:"El salto de peso sería más del 10%: estira el rango a 22 reps"};
      /* una serie sin anotar: no es «al fallo» (las series sin reserva no cuentan como 0) */
      const casi=todas(n,8,20,0);casi[n-1][2]=null;
      limpio(app,con("masa",{[EL]:[regR(2,GE,casi)]}));expect(tt(app,EL,GE)).toEqual(estira);
      /* reserva 1 en una: tampoco */
      const una=todas(n,8,20,0);una[1][2]=1;
      limpio(app,con("masa",{[EL]:[regR(2,GE,una)]}));expect(tt(app,EL,GE)).toEqual(estira);
      /* reserva 0 en todas pero el rango sin llenar: la rep de mas de siempre */
      limpio(app,con("masa",{[EL]:[regR(2,GE,todas(n,8,18,0))]}));
      expect(tt(app,EL,GE)).toEqual({w:8,reps:19,why:"La vez pasada 18: hoy 19 con el mismo peso"});
      /* con la mancuerna mas pesada no hay siguiente: solo estira */
      const nh=app.w.dose(FA,PH).sets||2;
      limpio(app,{rp_prefs:{goal:"masa",pesosDB:[1,2,3]},rp_logs:{[PH]:[regR(2,FA,todas(nh,3,12,0))]}});
      expect(tt(app,PH,FA)).toEqual({w:3,reps:14,extiende:true,why:"Ya usas tu mancuerna más pesada: estira a 14 reps"});
      /* salto de hasta el 10 %: ya subia, con el texto de siempre */
      limpio(app,con("masa",{[PB]:[regR(2,GE,todas(4,40,10,0))]}));
      expect(tt(app,PB,GE)).toEqual({w:42.5,reps:6,subeCarga:true,why:"Llenaste el rango entero: sube a 42.5 kg y vuelve a 6"});
      /* el estirado ya lleno: sube como siempre */
      limpio(app,con("masa",{[EL]:[regR(2,GE,todas(n,8,22,0))]}));
      expect(tt(app,EL,GE)).toEqual({w:9,reps:12,subeCarga:true,why:"Llegaste a 22 reps: sube a 9 kg y vuelve a 12"});});
    test("criterio 1 en salud: la reserva 0 no sube (rirAlFalloSube apagado); manda el freno por reserva",app=>{
      const n=app.w.dose(GE,EL).sets||4,logs={[EL]:[regR(9,GE,todas(n,8,20,0)),regR(2,GE,todas(n,8,20,0))]};
      limpio(app,con("salud",logs));
      expect(tt(app,EL,GE)).toEqual(freno(8,20,0));
      /* sin el freno, salud estira: la regla (a) es solo de masa, y sale del bloque */
      const R=app.ev("REGLAS"),guarda=JSON.stringify(R);
      try{app.ev("REGLAS.salud.frenoRir=null");
        expect(tt(app,EL,GE)).toEqual({w:8,reps:22,extiende:true,why:"El salto de peso sería más del 10%: estira el rango a 22 reps"});
        app.ev("REGLAS.salud.rirAlFalloSube=true");
        expect(tt(app,EL,GE)).toEqual(alFallo(9,12));
        app.ev("REGLAS.masa.rirAlFalloSube=false");
        limpio(app,con("masa",logs));
        expect(tt(app,EL,GE).extiende).toBe(true);
      }finally{const o=JSON.parse(guarda);["comun","masa","salud"].forEach(g=>{Object.keys(R[g]).forEach(c=>delete R[g][c]);Object.assign(R[g],o[g]);});}
      expect(JSON.stringify(app.ev("REGLAS"))).toBe(guarda);});
    test("criterio 2: rango sin llenar y primera serie con reserva 3+ → reps anteriores + 2, sin pasar del tope",app=>{
      expect(app.w.repRange(PB)).toEqual([6,10]);
      const r3=(r,rir)=>{const s=todas(4,30,r);s[0][2]=rir;return s;};
      ["masa","salud",null].forEach(g=>{
        limpio(app,con(g,{[PB]:[regR(2,GE,r3(8,3))]}));
        expect(tt(app,PB,GE)).toEqual(sobra(30,8,10));
        expect(sug(app,PB,GE)).toEqual(sobra(30,8,10));
        /* sin pasar del tope: 9 + 2 → 10 */
        limpio(app,con(g,{[PB]:[regR(2,GE,r3(9,3))]}));
        expect(tt(app,PB,GE)).toEqual(sobra(30,9,10));
        /* por debajo del minimo: 4 + 2 = 6 */
        limpio(app,con(g,{[PB]:[regR(2,GE,r3(4,3))]}));
        expect(tt(app,PB,GE)).toEqual(sobra(30,4,6));});
      /* reserva 2 en la primera, o 3+ solo en otra serie: +1 de siempre */
      limpio(app,con("masa",{[PB]:[regR(2,GE,r3(8,2))]}));
      expect(tt(app,PB,GE)).toEqual({w:30,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
      const ultima=todas(4,30,8);ultima[3][2]=3;
      limpio(app,con("masa",{[PB]:[regR(2,GE,ultima)]}));
      expect(tt(app,PB,GE)).toEqual({w:30,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});
      /* guardada como texto (una copia editada a mano) cuenta igual */
      limpio(app,con("masa",{[PB]:[regR(2,GE,r3(8,"3"))]}));
      expect(tt(app,PB,GE)).toEqual(sobra(30,8,10));
      /* sin carga: el mismo +2, sin hablar de peso */
      limpio(app,con("masa",{[FP]:[regR(2,FA,[[0,8,3],[0,8]])]}));
      const f=tt(app,FP,FA);
      expect(f).toEqual(sobra(0,8,10,true));expect(f.why).not.toMatch(/peso|kg|pesad/i);});
    test("criterio 2 frente a HU-14: dos fallos con reserva 3+ en la primera serie de la ultima no bajan (+2); con molestia en la penultima manda la molestia",app=>{
      const ses=(n,r,rir)=>{const s=todas(4,40,r);s[0][2]=rir;return regR(n,GE,s);};
      limpio(app,con("masa",{[PB]:[ses(5,5),ses(2,5,3)]}));
      const t=tt(app,PB,GE);
      expect(t).toEqual(sobra(40,5,7));expect(t.fallos).toBeFalsy();
      /* en salud igual (la reserva 3+ no frena) */
      limpio(app,con("salud",{[PB]:[ses(5,5),ses(2,5,3)]}));
      expect(tt(app,PB,GE)).toEqual(sobra(40,5,7));
      /* la reserva 3+ solo en la penultima no veta: baja */
      limpio(app,con("masa",{[PB]:[ses(5,5,3),ses(2,5)]}));
      expect(tt(app,PB,GE)).toEqual({w:37.5,reps:7,fallos:true,why:"Dos veces por debajo de 6: baja a 37.5 kg y busca 7"});
      /* molestia en la penultima: fila 4' aunque la ultima traiga 3+ */
      limpio(app,con("masa",{[PB]:[ses(5,5),ses(2,5,3)]},{rp_pain:{[PB]:[F.fecha(5)]}}));
      expect(tt(app,PB,GE)).toEqual({w:40,reps:5,dolor:true,why:"Hace dos sesiones anotaste molestia: mismo peso y sin forzar"});});
    test("criterio 3 (salud): alguna serie con reserva 0-1 → mismo peso y mismas reps, «busca dejar 1 en reserva»",app=>{
      const ses=(n,r,rir,cual)=>{const s=todas(4,30,r);s[cual==null?3:cual][2]=rir;return regR(n,GE,s);};
      limpio(app,con("salud",{[PB]:[ses(2,8,1)]}));
      const t=tt(app,PB,GE);
      expect(t).toEqual(freno(30,8,1));
      expect(t.why).toContain("busca dejar 1 en reserva");
      expect(sug(app,PB,GE)).toEqual({w:30,reps:8,why:t.why});
      limpio(app,con("salud",{[PB]:[ses(2,8,0,0)]}));
      expect(tt(app,PB,GE)).toEqual(freno(30,8,0));
      expect(tt(app,PB,GE).why).toContain("busca dejar 1 en reserva");
      /* reserva 0 en una y 1 en otra: dice la menor */
      const dos=todas(4,30,8);dos[1][2]=1;dos[3][2]=0;
      limpio(app,con("salud",{[PB]:[regR(2,GE,dos)]}));
      expect(tt(app,PB,GE)).toEqual(freno(30,8,0));
      /* repetida: sigue sin sumar (30 × 8, nunca 30 × 9) */
      limpio(app,con("salud",{[PB]:[ses(5,8,1),ses(2,8,1)]}));
      expect(tt(app,PB,GE)).toEqual(freno(30,8,1));
      /* si sumo por su cuenta, mantiene lo que hizo */
      limpio(app,con("salud",{[PB]:[ses(5,8,1),ses(2,9,1)]}));
      expect(tt(app,PB,GE)).toEqual(freno(30,9,1));
      /* tambien con el rango lleno: no sale del rango estando al limite */
      limpio(app,con("salud",{[PB]:[ses(5,10,2),ses(2,10,1)]}));
      expect(tt(app,PB,GE)).toEqual(freno(30,10,1));
      /* sin carga y a 0 kg: sin hablar de peso */
      limpio(app,con("salud",{[FP]:[regR(2,FA,[[0,9],[0,8,0]])]}));
      const f=tt(app,FP,FA);expect(f).toEqual(freno(0,9,0,true));expect(f.why).not.toMatch(/peso|kg|pesad/i);
      limpio(app,con("salud",{[SS]:[regR(2,FA,[[0,9],[0,8,1]])]}));
      const s=tt(app,SS,FA);expect(s).toEqual(freno(0,9,1,true));expect(s.why).not.toMatch(/peso|kg|pesad/i);
      /* masa no frena: la rep de mas de siempre */
      limpio(app,con("masa",{[PB]:[ses(2,8,1)]}));
      expect(tt(app,PB,GE)).toEqual({w:30,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"});});
    test("criterio 3: la madre siguiendo la app con reserva 0 se queda en 2 × 10; sale al anotar 2 o mas, o al no anotarla",app=>{
      const n=app.w.dose(FB,RB).sets||2,r=(d,reps,rir)=>{const s=todas(n,2,reps);s[n-1][2]=rir;return regR(d,FB,s);};
      /* tres sesiones seguidas al fallo, haciendo cada vez lo que propone */
      const logs=[];[9,6,3].forEach(d=>{logs.push(r(d,10,0));limpio(app,con("salud",{[RB]:logs.slice()}));
        expect({[d]:tt(app,RB,FB)}).toEqual({[d]:freno(2,10,0)});});
      /* con reserva 2 la ultima vez: la regla de siempre */
      limpio(app,con("salud",{[RB]:[r(5,10,1),r(2,10,2)]}));
      expect(tt(app,RB,FB)).toEqual({w:2,reps:11,why:"La vez pasada 10: hoy 11 con el mismo peso"});
      /* sin anotar la reserva tras un freno: tampoco frena */
      limpio(app,con("salud",{[RB]:[r(5,10,1),r(2,10,null)]}));
      expect(tt(app,RB,FB)).toEqual({w:2,reps:11,why:"La vez pasada 10: hoy 11 con el mismo peso"});});
    test("criterio 3: el limite del freno sale del bloque REGLAS",app=>{
      const R=app.ev("REGLAS"),guarda=JSON.stringify(R),ses=rir=>{const s=todas(4,30,8);s[3][2]=rir;return regR(2,GE,s);};
      try{limpio(app,con("salud",{[PB]:[ses(2)]}));
        expect(tt(app,PB,GE).reps).toBe(9);
        app.ev("REGLAS.salud.frenoRir=2");
        expect(tt(app,PB,GE)).toEqual(freno(30,8,2));
        app.ev("REGLAS.salud.frenoRir=1;REGLAS.comun.rirSobra=2;REGLAS.comun.repsSobra=3");
        const pri=todas(4,30,6);pri[0][2]=2;
        limpio(app,con("masa",{[PB]:[regR(2,GE,pri)]}));
        expect(tt(app,PB,GE)).toEqual({w:30,reps:9,why:"La vez pasada 6 con reserva 3+: hoy 9 con el mismo peso"});
      }finally{const o=JSON.parse(guarda);["comun","masa","salud"].forEach(g=>{Object.keys(R[g]).forEach(c=>delete R[g][c]);Object.assign(R[g],o[g]);});}
      expect(JSON.stringify(app.ev("REGLAS"))).toBe(guarda);});
    test("criterio 4: sin reserva en ninguna serie, todayTarget devuelve lo mismo que con las reglas de reserva apagadas",app=>{
      /* las tres reglas apagadas en el bloque son el codigo de antes de HU-13:
         con la ultima sesion sin reserva, ninguna de ellas puede actuar */
      const R=app.ev("REGLAS"),guarda=JSON.stringify(R),casos=[];
      [[PB,GE,4,[30,40]],[EL,GE,4,[8,102.75]],[JP,GT,4,[40]],[PH,FA,2,[1,2,3]],[RB,FB,2,[2,3]],[FP,FA,2,[0]],[SS,FA,2,[0,1]]].forEach(([id,k,n,pesos])=>{
        const rng=app.w.repRange(id);
        pesos.forEach(w=>[rng[0]-2,rng[0],rng[1]-1,rng[1],rng[1]+2].forEach(reps=>{
          casos.push([id,k,[regR(2,k,todas(n,w,reps,0).map((s,i)=>[s[0],s[1],i===0?3:1]))]]);
          casos.push([id,k,[regR(5,k,todas(n,w,reps,1)),regR(2,k,todas(n,w,reps,0))]]);}));});
      const extras=[{},{rp_prefs:{pesosDB:[1,2,3]}},{rp_inc:{[JP]:5,[PB]:5}}];
      let n=0;
      try{casos.forEach(([id,k,logs])=>extras.forEach(ex=>["masa","salud"].forEach(g=>{
          const datos=con(g,sinRir(logs),ex);if(ex.rp_prefs)datos.rp_prefs=Object.assign({},ex.rp_prefs,{goal:g});
          limpio(app,datos);const ahora=tt(app,id,k);
          app.ev("REGLAS.comun.rirSobra=Infinity;REGLAS.masa.rirAlFalloSube=false;REGLAS.salud.frenoRir=null");
          const antes=tt(app,id,k);
          const o=JSON.parse(guarda);["comun","masa","salud"].forEach(x=>Object.assign(R[x],o[x]));
          expect({[id+" "+g+" "+JSON.stringify(logs[logs.length-1].sets[0])]:ahora}).toEqual({[id+" "+g+" "+JSON.stringify(logs[logs.length-1].sets[0])]:antes});n++;})));
      }finally{const o=JSON.parse(guarda);["comun","masa","salud"].forEach(g=>{Object.keys(R[g]).forEach(c=>delete R[g][c]);Object.assign(R[g],o[g]);});}
      expect(JSON.stringify(app.ev("REGLAS"))).toBe(guarda);
      expect(n).toBeGreaterThan(400);
      /* y con las reservas puestas, las mismas sesiones si cambian algo */
      limpio(app,con("masa",{[EL]:[regR(2,GE,todas(4,8,20,0))]}));
      expect(tt(app,EL,GE).subeCarga).toBe(true);
      limpio(app,con("masa",sinRir({[EL]:[regR(2,GE,todas(4,8,20,0))]})));
      expect(tt(app,EL,GE).extiende).toBe(true);});
    test("los porques nuevos de la reserva: 80 caracteres o menos con el peor caso (102.75 kg, rango [12,20])",app=>{
      const n=app.w.dose(GE,EL).sets||4,
        caso=(goal,lista,series)=>{limpio(app,{rp_prefs:Object.assign({goal:goal},lista?{pesosDB:lista}:{}),rp_logs:{[EL]:[regR(2,GE,series)]}});return tt(app,EL,GE);},
        pri=(w,r,rir)=>{const s=todas(n,w,r);s[0][2]=rir;return s;};
      const todos=[
        [caso("masa",[102.75,130],todas(n,102.75,20,0)),alFallo(130,12,true)],
        [caso("masa",[1,102.75],todas(n,1,20,0)),alFallo(102.75,12,true)],
        [caso("salud",null,pri(102.75,22,0)),freno(102.75,22,0)],
        [caso("salud",null,pri(102.75,22,1)),freno(102.75,22,1)],
        [caso("salud",null,pri(0,22,0)),freno(0,22,0,true)],
        [caso("salud",null,pri(0,22,1)),freno(0,22,1,true)],
        [caso("masa",null,pri(102.75,18,3)),sobra(102.75,18,20)],
        [caso("masa",null,pri(0,18,3)),sobra(0,18,20,true)]];
      todos.forEach(([t,esperado])=>{expect(t).toEqual(esperado);expect({[t.why]:t.why.length<=80}).toEqual({[t.why]:true});});});
    test("criterio 7: datos de v35 sin reserva (y reservas raras) no rompen nada, no escriben nada y no crean claves",app=>{
      [F.dueno,F.madre].forEach(fx=>{const D=sinRir(fx());delete (D.rp_prefs||{}).goal;limpio(app,D);
        expect(nuevas(app)).toEqual([]);
        const antes=app.foto(),R=app.ev("ROUTINES");let n=0;
        Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{const t=app.w.todayTarget(k,id),s=app.w.suggestLoad(id,k);
          if(t){n++;expect(isFinite(t.w)&&t.reps>=1&&!!t.why).toBe(true);}expect(isFinite(s.w)&&s.reps>=1).toBe(true);}));
        expect(n).toBeGreaterThan(20);
        expect(app.foto()).toEqual(antes);expect(nuevas(app)).toEqual([]);});
      /* reservas que no escribe la app (una copia editada a mano): vacia, nula,
         texto o negativa es no traerla; mas de 3 es «3+» */
      const normal={w:30,reps:9,why:"La vez pasada 8: hoy 9 con el mismo peso"};
      ["",null,"x",-1,7].forEach(v=>["masa","salud"].forEach(g=>{
        const r=reg(2,GE,todas(4,30,8));r.sets.forEach(s=>{s.rir=v;});
        limpio(app,con(g,{[PB]:[r]}));
        expect({[g+" "+v]:tt(app,PB,GE)}).toEqual({[g+" "+v]:v===7?sobra(30,8,10):normal});}));
      expect([undefined,"",null,"x",-1,0,"1",2,3,7].map(v=>app.w.rirDe({rir:v}))).toEqual([null,null,null,null,null,0,1,2,3,3]);});
  });

  /* ---------- HU-79: ejercicios sin carga ----------
     Sin carga (load:false) la progresion va por las reps de la primera serie:
     dentro del rango +1; con el rango lleno +1 hasta tope+2, como la doble
     progresion de HU-07; y en tope+2 o mas se mantienen esas reps y el porque
     propone hacerlo mas dificil (mas lento o la variante mas exigente de su
     indicacion). Nunca baja las reps sin un motivo con su propia regla, y el
     porque nunca habla de peso. Antes la meta se quedaba en el tope «con el
     mismo peso» para siempre. Fechas relativas (F.fecha): no depende del dia */
  escenario("Lógica · ejercicios sin carga (HU-79)",F.vacio,()=>{
    const FP="flexiones_pared",FA="salud_fuerza_a",RI="remo_invertido",GT="gym_tiron",SA="sentadilla_aire",GP="gym_pierna",
      PESO=/peso|kg|pesad/i,
      con=(goal,logs,extra)=>Object.assign({rp_prefs:goal?{goal:goal}:{},rp_logs:logs},extra||{}),
      /* un registro con reserva por serie: series = [[w,reps,rir?]] (rir null: sin anotar) */
      regR=(n,k,series)=>{const r=reg(n,k,series);r.sets.forEach((s,i)=>{if(series[i][2]!=null)s.rir=series[i][2];});return r;},
      mas=(r1,r,sobra)=>({w:0,reps:r,why:"La vez pasada "+r1+(sobra?" con reserva 3+":"")+": hoy "+r}),
      dificil=(r,salud)=>({w:0,reps:r,masDificil:true,why:"Ya haces "+r+": "+(salud
        ?"mantenerlo es un logro. Para más, hazlo más lento o más exigente"
        :"hazlo más difícil, más lento o con la variante más exigente")}),
      completa=(r,n)=>({w:0,reps:r,mantiene:true,why:"Ya haces "+r+": hoy completa las "+n+" series antes de ir a más"}),
      logro=r=>({w:0,reps:r,mantiene:true,why:"Rango completo con "+r+" repeticiones: mantenerlo es un logro, repítelo"}),
      /* sigue la app sesion a sesion, una por semana: hace lo que propone y
         devuelve cada propuesta. La primera sesion, con r0 reps; la ultima
         siempre de hace 2 dias (sin paron) */
      siguiendo=(app,goal,id,k,r0,veces_)=>{const n=app.w.dose(k,id).sets,hechas=[],out=[];let r=r0;
        for(let i=0;i<veces_;i++){hechas.push(r);
          limpio(app,con(goal,{[id]:hechas.map((x,j)=>reg(2+7*(hechas.length-1-j),k,veces(n,0,x)))}));
          const t=tt(app,id,k);expect(sug(app,id,k)).toEqual({w:0,reps:t.reps,why:t.why});out.push(t);r=t.reps;}
        return out;};
    test("criterio 2 (masa): +1 dentro del rango y con el rango lleno hasta tope+2; en tope+2 se mantiene y propone hacerlo mas dificil",app=>{
      expect(app.w.repRange(FP)).toEqual([8,12]);
      expect(app.ev("EX")[FP].load).toBe(false);
      /* siguiendo la app: 10, 11, 12, 13 y 14, y en 14 se queda (nunca vuelve a 12) */
      expect(siguiendo(app,"masa",FP,FA,10,6)).toEqual([mas(10,11),mas(11,12),mas(12,13),mas(13,14),dificil(14),dificil(14)]);
      /* sin objetivo guardado (v35/v36) es masa */
      expect(siguiendo(app,null,FP,FA,12,3)).toEqual([mas(12,13),mas(13,14),dificil(14)]);
      /* por encima de tope+2 tambien se mantiene lo hecho: 16 se queda en 16 */
      const n=app.w.dose(FA,FP).sets;
      [16,20].forEach(r=>{limpio(app,con("masa",{[FP]:[reg(2,FA,veces(n,0,r))]}));
        expect(tt(app,FP,FA)).toEqual(dificil(r));});
      /* el techo es de la primera serie: una ultima serie mas corta no baja la propuesta */
      limpio(app,con("masa",{[FP]:[reg(2,FA,[[0,14],[0,11]])]}));
      expect(tt(app,FP,FA)).toEqual(dificil(14));
      limpio(app,con("masa",{[FP]:[reg(2,FA,[[0,12],[0,9]])]}));
      expect(tt(app,FP,FA)).toEqual(mas(12,13));
      /* con reserva 3+ en la primera: +2 dentro del rango, sin pasar del tope (HU-13);
         en el tope o por encima, +1 como siempre, sin hablar de la reserva */
      const r3=r=>[regR(2,FA,[[0,r,3],[0,r]])];
      limpio(app,con("masa",{[FP]:r3(9)}));expect(tt(app,FP,FA)).toEqual(mas(9,11,true));
      limpio(app,con("masa",{[FP]:r3(11)}));expect(tt(app,FP,FA)).toEqual(mas(11,12,true));
      limpio(app,con("masa",{[FP]:r3(12)}));expect(tt(app,FP,FA)).toEqual(mas(12,13));
      limpio(app,con("masa",{[FP]:r3(13)}));expect(tt(app,FP,FA)).toEqual(mas(13,14));
      limpio(app,con("masa",{[FP]:r3(14)}));expect(tt(app,FP,FA)).toEqual(dificil(14));
      /* otro rango ([12,20]) y otra rutina: el techo es 22 */
      expect(app.w.repRange(SA)).toEqual([12,20]);
      expect(siguiendo(app,"masa",SA,GP,19,5)).toEqual([mas(19,20),mas(20,21),mas(21,22),dificil(22),dificil(22)]);});
    test("criterio 2 (salud): la primera vez en el tope se mantiene (HU-16), luego +1 hasta tope+2 y ahi un logro que propone hacerlo mas dificil",app=>{
      expect(siguiendo(app,"salud",FP,FA,11,7)).toEqual([mas(11,12),logro(12),mas(12,13),mas(13,14),dificil(14,true),dificil(14,true),dificil(14,true)]);
      /* de golpe por encima de tope+2: la primera sesion llena se mantiene con el
         logro de la regla del objetivo (salud sale del rango a la segunda), y a
         la siguiente, el techo; las reps nunca bajan de lo hecho */
      const n=app.w.dose(FA,FP).sets;
      limpio(app,con("salud",{[FP]:[reg(9,FA,veces(n,0,10)),reg(2,FA,veces(n,0,16))]}));
      expect(tt(app,FP,FA)).toEqual(logro(16));
      limpio(app,con("salud",{[FP]:[reg(9,FA,veces(n,0,16)),reg(2,FA,veces(n,0,16))]}));
      expect(tt(app,FP,FA)).toEqual(dificil(16,true));});
    test("criterio 2: en el tope con series de menos, repite las reps y pide completarlas; ni mas dificil ni la regla del objetivo",app=>{
      expect(app.w.dose(FA,FP).sets).toBe(2);
      expect(app.w.dose(GT,RI).sets).toBe(3);
      /* salud, 1 de 2 series de 12: no es la regla del objetivo (exige la sesion completa) */
      limpio(app,con("salud",{[FP]:[reg(2,FA,[[0,12]])]}));
      expect(tt(app,FP,FA)).toEqual(completa(12,2));
      /* masa, 1 de 3 series de 14: sin masDificil */
      limpio(app,con("masa",{[RI]:[reg(2,GT,[[0,14]])]}));
      const t=tt(app,RI,GT);expect(t).toEqual(completa(14,3));expect(t.masDificil).toBeFalsy();
      limpio(app,con("masa",{[RI]:[reg(2,GT,[[0,12],[0,12]])]}));
      expect(tt(app,RI,GT)).toEqual(completa(12,3));
      /* completas: la regla de siempre */
      limpio(app,con("masa",{[RI]:[reg(2,GT,veces(3,0,12))]}));
      expect(tt(app,RI,GT)).toEqual(mas(12,13));
      /* por debajo del tope, series de menos no frenan la rep de mas */
      limpio(app,con("masa",{[FP]:[reg(2,FA,[[0,10]])]}));
      expect(tt(app,FP,FA)).toEqual(mas(10,11));
      /* y la sesion a medias tampoco cuenta como llena para salud: 12 completa y luego 1 serie de 13 */
      limpio(app,con("salud",{[FP]:[reg(9,FA,veces(2,0,12)),reg(2,FA,[[0,13]])]}));
      expect(tt(app,FP,FA)).toEqual(completa(13,2));});
    test("criterio 1: nunca menos reps que la ultima vez salvo tras un paron (barrido de reps 1-25, masa y salud, cada rama)",app=>{
      /* lo que baja las reps tiene su propia regla: solo el paron (vuelve al
         minimo del rango). Molestia, reserva 0-1 en salud y la regla del
         objetivo repiten las de la ultima vez; dos sesiones por debajo del
         minimo piden el minimo, que es mas */
      const casos=[[FP,FA],[RI,GT],[SA,GP],["cuello_lateral_manual","cuello_rostro"]],
        /* [nombre, sesiones, dias con molestia] */
        sit=(r,n,k)=>{const ses=(d,reps,rir)=>regR(d,k,Array.from({length:n},(x,i)=>[0,reps,i===0?rir:null])),pain=(...d)=>d;
          return [
            ["una completa",[ses(2,r)]],
            ["una a medias",[regR(2,k,[[0,r]])]],
            ["series que bajan",[regR(2,k,Array.from({length:n},(x,i)=>[0,Math.max(1,r-2*i)]))]],
            ["dos iguales",[ses(9,r),ses(2,r)]],
            ["antes una menos",[ses(9,Math.max(1,r-1)),ses(2,r)]],
            ["antes tres mas",[ses(9,r+3),ses(2,r)]],
            ["antes a medias",[regR(9,k,[[0,r]]),ses(2,r)]],
            ["reserva 0",[ses(2,r,0)]],["reserva 1",[ses(2,r,1)]],["reserva 2",[ses(2,r,2)]],["reserva 3+",[ses(2,r,3)]],
            ["reserva 1 dos veces",[ses(9,r,1),ses(2,r,1)]],
            ["reps como texto",[{date:F.fecha(2),k:k,t:1,sets:Array.from({length:n},()=>({w:"0",reps:String(r)}))}]],
            ["sin peso guardado",[{date:F.fecha(2),k:k,t:1,sets:Array.from({length:n},()=>({reps:r}))}]],
            ["molestia",[ses(2,r)],pain(2)],
            ["molestia repetida",[ses(9,r),ses(2,r)],pain(9,2)],
            ["molestia en la penultima",[ses(9,r),ses(2,r)],pain(9)],
            ["paron",[ses(30,r)]],["paron largo",[ses(50,r)]],
            ["molestia y paron",[ses(30,r)],pain(30)],
            ["un visto despues de un paron",[ses(30,r),{date:F.fecha(2),sets:[],k:"otra",t:2,checked:true}]]];};
      const malos=[],vistos={},baja=[];let n=0;
      casos.forEach(([id,k])=>{const ns=app.w.dose(k,id).sets||1;
        for(let r=1;r<=25;r++)sit(r,ns,k).forEach(([nombre,logs,dolor])=>["masa","salud"].forEach(g=>{
          limpio(app,con(g,{[id]:logs},dolor?{rp_pain:{[id]:dolor.map(F.fecha)}}:null));const t=tt(app,id,k),s=sug(app,id,k);n++;
          const c=id+" "+g+" "+nombre+" "+r+" → "+JSON.stringify(t);
          if(!t||!(t.reps>=1)||Math.round(t.reps)!==t.reps||t.w!==0||s.reps!==t.reps||s.why!==t.why){malos.push("roto: "+c);return;}
          if(t.reps<r&&!t.vuelta)malos.push("baja sin motivo: "+c);
          if(PESO.test(t.why))malos.push("habla de peso: "+c);
          if(t.reps<r)baja.push(nombre);
          const marcas=["dolor","vuelta","fallos","mantiene","masDificil"].filter(f=>t[f]);
          (marcas.length?marcas:[t.reps>r?"mas":"igual"]).forEach(f=>{vistos[f]=(vistos[f]||0)+1;});}));});
      expect(malos.slice(0,10)).toEqual([]);
      expect(n).toBeGreaterThan(3000);
      /* el barrido pasa por cada rama, y lo que baja es siempre un paron */
      ["dolor","vuelta","fallos","mantiene","masDificil","mas"].forEach(f=>expect({[f]:vistos[f]>0}).toEqual({[f]:true}));
      expect(baja.length).toBeGreaterThan(0);
      expect(baja.filter(x=>x.indexOf("paron")<0)).toEqual([]);});
    test("criterio 3: el porque de un ejercicio sin carga nunca habla de peso (todas las rutinas, todas las ramas; con carga a 0 kg, las ramas nuevas)",app=>{
      const R=app.ev("ROUTINES"),EX=app.ev("EX"),malos=[],faltan=[],porId={};let n=0;
      Object.keys(R).forEach(k=>{const r=R[k],ids=[].concat(r.list||[],r.warm||[],r.secondary||[],r.extras||[]);
        Object.keys(r.swaps||{}).forEach(o=>{ids.push(o);ids.push.apply(ids,r.swaps[o]);});
        ids.forEach(id=>{if(EX[id]&&(EX[id].load===false||EX[id].load===true))(porId[id]=porId[id]||[]).indexOf(k)<0&&porId[id].push(k);});});
      /* cada situacion lleva a una rama; «nueva» marca las de este sprint, que
         tambien a 0 kg con carga hablan sin peso. Las de antes (primera vez,
         molestia, la progresion con carga) conservan su texto con carga */
      const SIT=[
        {n:"primera vez",logs:()=>[],es:t=>t.nuevo},
        {n:"molestia",logs:(k,c,m)=>[c(2,m+1)],pain:[2],es:t=>t.dolor&&!t.vuelta},
        {n:"molestia repetida",logs:(k,c,m)=>[c(9,m+1),c(2,m+1)],pain:[9,2],es:t=>t.dolor&&/repetida/.test(t.why)},
        {n:"molestia y paron",nueva:true,logs:(k,c,m)=>[c(30,m+1)],pain:[30],es:t=>t.dolor&&t.vuelta},
        {n:"paron",nueva:true,logs:(k,c,m)=>[c(30,m+1)],es:t=>t.vuelta&&!t.dolor},
        {n:"paron largo",nueva:true,logs:(k,c,m)=>[c(50,m+1)],es:t=>t.vuelta},
        {n:"dos fallos",nueva:true,logs:(k,c,m)=>[c(9,m-1),c(2,m-1)],es:t=>t.fallos},
        {n:"dos fallos con molestia en la penultima",nueva:true,logs:(k,c,m)=>[c(9,m-1),c(2,m-1)],pain:[9],es:t=>t.dolor&&/dos sesiones/.test(t.why)},
        {n:"reserva 0",nueva:true,goal:"salud",logs:(k,c,m)=>[c(2,m+1,0)],es:t=>t.mantiene&&/reserva/.test(t.why)},
        {n:"reserva 1",nueva:true,goal:"salud",logs:(k,c,m)=>[c(2,m+1,1)],es:t=>t.mantiene&&/reserva/.test(t.why)},
        {n:"regla del objetivo",nueva:true,goal:"salud",logs:(k,c,m,t)=>[c(2,t)],es:t=>t.mantiene&&/logro/.test(t.why)},
        {n:"reserva 3+",nueva:true,logs:(k,c,m)=>[c(2,m,3)],es:t=>/reserva 3\+/.test(t.why)},
        {n:"una mas",logs:(k,c,m)=>[c(2,m)],es:(t,r)=>t.reps===r[0]+1},
        {n:"rango lleno",goal:"masa",logs:(k,c,m,t)=>[c(2,t)],es:(t,r)=>t.reps===r[1]+1},
        {n:"a medias en el tope",logs:(k,c,m,t,ses1)=>[ses1(2,t)],dos:true,es:t=>t.mantiene&&/completa/.test(t.why)},
        {n:"tope+2",logs:(k,c,m,t)=>[c(9,t+2),c(2,t+2)],es:t=>t.masDificil},
        {n:"tope+2 en salud",goal:"salud",logs:(k,c,m,t)=>[c(9,t+2),c(2,t+2)],es:t=>t.masDificil&&/logro/.test(t.why)}];
      Object.keys(porId).forEach(id=>porId[id].forEach(k=>{const e=EX[id],rng=app.w.repRange(id),ns=app.w.dose(k,id).sets||1;
        const c=(d,reps,rir)=>regR(d,k,Array.from({length:ns},(x,i)=>[0,reps,i===0?rir:null])),ses1=(d,reps)=>regR(d,k,[[0,reps]]);
        SIT.forEach(s=>{if(e.load===true&&!s.nueva)return;if(s.dos&&ns<2)return;
          (s.goal?[s.goal]:["masa","salud"]).forEach(g=>{
            limpio(app,con(g,{[id]:s.logs(k,c,rng[0],rng[1],ses1)},s.pain?{rp_pain:{[id]:s.pain.map(F.fecha)}}:null));
            const t=tt(app,id,k),q=app.w.suggestLoad(id,k),c0=k+" "+id+" "+g+" "+s.n;n++;
            if(!t||!s.es(t,rng))faltan.push(c0+" → "+JSON.stringify(t));
            else if(PESO.test(t.why)||PESO.test(q.why))malos.push(c0+" → "+t.why+" / "+q.why);});});}));
      expect(malos).toEqual([]);
      expect(faltan).toEqual([]);
      /* todos los ejercicios sin carga de las rutinas, y algunos con carga a 0 kg */
      const sinCarga=Object.keys(porId).filter(id=>EX[id].load===false);
      expect(sinCarga.length).toBeGreaterThan(15);
      expect(n).toBeGreaterThan(600);});
    test("criterio 3: molestia sin carga, «mismas repeticiones»; con carga, tambien a 0 kg, el texto de siempre",app=>{
      limpio(app,con("masa",{[FP]:[reg(2,FA,veces(2,0,10))]},{rp_pain:{[FP]:[F.fecha(2)]}}));
      expect(tt(app,FP,FA)).toEqual({w:0,reps:10,dolor:true,why:"La vez pasada anotaste molestia: mismas repeticiones y sin forzar"});
      limpio(app,con("masa",{sentadilla_silla:[reg(2,FA,veces(2,0,10))]},{rp_pain:{sentadilla_silla:[F.fecha(2)]}}));
      expect(tt(app,"sentadilla_silla",FA)).toEqual({w:0,reps:10,dolor:true,why:"La vez pasada anotaste molestia: mismo peso y sin forzar"});});
    test("criterio 4: suggestLoad con historial dice lo de todayTarget; su respaldo queda para lo que no declara carga, sin ramas muertas",app=>{
      const EX=app.ev("EX");
      [F.dueno,F.madre].forEach(fx=>{limpio(app,fx());const R=app.ev("ROUTINES");let n=0;
        Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{const e=EX[id]||{};if(!app.w.lastLog(id))return;
          const t=app.w.todayTarget(k,id),s=app.w.suggestLoad(id,k);
          if(e.load===true||e.load===false){n++;expect({[k+" "+id]:[s.reps,s.why]}).toEqual({[k+" "+id]:[t.reps,t.why]});}
          else expect({[k+" "+id]:t}).toEqual({[k+" "+id]:null});}));
        expect(n).toBeGreaterThan(10);});
      /* sin tipo de carga, el respaldo de siempre (no habla de peso) */
      limpio(app,{rp_logs:{wall_angels:[reg(2,"gym_empuje",veces(2,0,10))]}});
      expect(app.w.todayTarget("gym_empuje","wall_angels")).toBe(null);
      expect(sug(app,"wall_angels","gym_empuje")).toEqual({w:0,reps:11,why:"La vez pasada llegaste a 10: prueba con 11"});
      /* las dos ramas que nunca se alcanzaban (con carga responde antes todayTarget) ya no estan */
      const src=String(app.w.suggestLoad);
      ["Completaste las","toca subir","Mismo peso que la vez pasada"].forEach(x=>expect(src).not.toContain(x));});
    test("criterio 5: lo que HU-79 cambia en la referencia de v36 es solo de ejercicios sin carga",app=>{
      const EX=app.ev("EX");let n=0;
      Object.keys(CAMBIOS_HU79).forEach(j=>Object.keys(CAMBIOS_HU79[j]).forEach(c=>{const id=c.split(" ")[1];n++;
        expect({[c]:EX[id].load}).toEqual({[c]:false});
        expect(CAMBIOS_OBJETIVOS[j][c]).toEqual(CAMBIOS_HU79[j][c]);
        expect(CAMBIOS_HU79[j][c].why).not.toMatch(PESO);}));
      expect(n).toBeGreaterThan(0);
      /* y ninguno del gimnasio: dueno no cambia */
      expect(CAMBIOS_HU79.dueno).toBe(undefined);});
    test("criterio 6: datos de v36 (y reps guardadas como texto) no rompen nada, no escriben nada y no crean claves",app=>{
      const EX=app.ev("EX");
      [F.dueno,F.madre,()=>{const D=F.madre();delete D.rp_prefs.goal;return D;}].forEach(fx=>{const D=fx();
        /* las series sin carga como texto, como en una copia editada a mano */
        Object.keys(D.rp_logs||{}).forEach(id=>{if((EX[id]||{}).load===false)D.rp_logs[id].forEach(r=>(r.sets||[]).forEach(s=>{s.reps=String(s.reps);}));});
        limpio(app,D);expect(nuevas(app)).toEqual([]);
        const antes=app.foto(),R=app.ev("ROUTINES");let n=0;
        Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{if((EX[id]||{}).load!==false)return;
          const t=app.w.todayTarget(k,id),s=app.w.suggestLoad(id,k),ll=app.w.lastLog(id);n++;
          expect({[k+" "+id]:isFinite(t.w)&&t.w===0&&t.reps>=1&&Math.round(t.reps)===t.reps&&!!t.why&&!PESO.test(t.why)&&!PESO.test(s.why)}).toEqual({[k+" "+id]:true});
          if(ll)expect({[k+" "+id]:s.reps===t.reps&&(t.reps>=(Number(ll.sets[0].reps)||0)||!!t.vuelta)}).toEqual({[k+" "+id]:true});}));
        expect(n).toBeGreaterThan(5);
        expect(app.foto()).toEqual(antes);expect(nuevas(app)).toEqual([]);});});
    test("los porques nuevos sin carga: 80 caracteres o menos con el peor caso (rango [12,20], 22 reps, 10 series)",app=>{
      expect(app.w.repRange(SA)).toEqual([12,20]);
      const caso=(goal,logs,doses)=>{limpio(app,Object.assign(con(goal,{[SA]:logs}),doses?{rp_doses:{[GP]:{[SA]:{sets:10}}}}:{}));return tt(app,SA,GP);},
        n=app.w.dose(GP,SA).sets;
      const todos=[
        [caso("masa",[reg(2,GP,veces(n,0,22))]),dificil(22)],
        [caso("salud",[reg(9,GP,veces(n,0,22)),reg(2,GP,veces(n,0,22))]),dificil(22,true)],
        [caso("masa",[reg(2,GP,[[0,22]])],true),completa(22,10)],
        [caso("masa",[reg(2,GP,veces(n,0,21))]),mas(21,22)],
        [caso("masa",[regR(2,GP,[[0,18,3]])]),mas(18,20,true)]];
      todos.forEach(([t,esperado])=>{expect(t).toEqual(esperado);expect({[t.why]:t.why.length<=80}).toEqual({[t.why]:true});});
      limpio(app,con("masa",{[SA]:[reg(2,GP,veces(n,0,22))]},{rp_pain:{[SA]:[F.fecha(2)]}}));
      const m=tt(app,SA,GP);expect(m.dolor).toBe(true);expect(m.why.length<=80).toBe(true);});
  });

  /* datos de v35 tras un paron: las sesiones y molestias de los juegos, un
     mes atras. Nada se rompe, nada se escribe y no hay claves nuevas */
  const unMesAtras=fx=>()=>{const D=fx(),atras=f=>{const d=new Date(f+"T12:00:00");d.setDate(d.getDate()-30);
      return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
    Object.keys(D.rp_logs||{}).forEach(id=>D.rp_logs[id].forEach(r=>{r.date=atras(r.date);if(r.t)r.t-=30*864e5;
      (r.sets||[]).forEach(s=>{if(s.t)s.t-=30*864e5;});}));
    Object.keys(D.rp_pain||{}).forEach(id=>{D.rp_pain[id]=D.rp_pain[id].map(atras);});
    return D;};
  [["gimnasio",F.dueno],["casa",F.madre]].forEach(([nombre,fx])=>{
    escenario("Lógica · progresión con los datos de v35 de "+nombre+" tras un mes sin entrenar (HU-15)",unMesAtras(fx),()=>{
      test("todas las rutinas: objetivos validos, sin escribir nada ni crear claves",sinEscribir);
      test("todo lo que se hacia vuelve mas suave: el minimo del rango, nunca mas peso que la ultima vez",app=>{
        app.reiniciarMemoria();const R=app.ev("ROUTINES"),malos=[];let n=0;
        Object.keys(R).forEach(k=>app.w.effList(k).forEach(id=>{const t=app.w.todayTarget(k,id),ll=app.w.lastLog(id);
          if(!t||!ll)return;n++;
          if(!t.vuelta||t.reps>app.w.repRange(id)[0]||t.subeCarga||t.extiende||t.w>(Number(ll.sets[0].w)||0))malos.push(k+" "+id+" "+JSON.stringify(t));}));
        expect(malos).toEqual([]);expect(n).toBeGreaterThan(10);});
    });});

  /* ---------- pendientes al final del guiado (v36) ----------
     Empezar por el 4.º ejercicio y llegar al final cerraba la sesion como
     "Completada" con los tres primeros sin hacer. */
  const R="gym_empuje";
  function empezarPorElCuarto(app,datos){app.reiniciarMemoria();app.sembrar(datos||F.dueno);
    const l=app.w.effList(R);app.w.openRoutine(R);app.w.startRoutine(l[3]);return l;}
  /* avanza paso a paso, como quien termina cada serie, hasta que el guiado
     deja de mostrar pasos (aviso o pantalla de fin). Devuelve los ejercicios
     por los que paso, en orden */
  function hastaElFinal(app){const vistos=[];
    for(let n=0;n<300&&!app.$("#guided .done");n++){const id=app.ev("steps[stepi].id");
      if(vistos[vistos.length-1]!==id)vistos.push(id);app.w.advance();}
    return vistos;}
  function avanzarHasta(app,id){for(let n=0;n<300&&app.ev("steps[stepi].id")!==id;n++)app.w.advance();
    expect(app.ev("steps[stepi].id")).toBe(id);}
  /* cuenta las llamadas a finishSession sin cambiar lo que hace */
  function contarCierres(app){const orig=app.w.finishSession,c={n:0,soltar:()=>{app.w.finishSession=orig;}};
    app.w.finishSession=function(){c.n++;return orig.apply(this,arguments);};return c;}
  const enAviso=app=>app.$$("#guided .finlist [data-ex]").map(e=>e.dataset.ex);
  /* lo que escribe cerrar una sesion, sin las marcas de tiempo */
  function loGuardado(app){const hoy=F.fecha(0),logs=app.leer("rp_logs")||{},out={};
    Object.keys(logs).forEach(id=>{const a=logs[id].filter(r=>r.date===hoy);
      if(a.length)out[id]=a.map(r=>({k:r.k,checked:!!r.checked,sets:(r.sets||[]).map(x=>[x.w,x.reps])}));});
    const h=Object.assign({},app.leer("rp_history")[0]);["iso","day","date","time","dur"].forEach(c=>delete h[c]);
    return {logs:out,logged:(app.leer("rp_logged")||{})[hoy],streak:app.leer("rp_streak"),ultima:h,n:app.leer("rp_history").length};}
  /* una serie real en el press de pecho: registrar, dejar pasar el gesto y saltar el descanso */
  async function unaSerie(app){avanzarHasta(app,"press_banca_db");app.w.logSet();await app.espera(400);app.w.skipRest();}

  escenario("Pendientes al final del guiado (dueño)",F.dueno,()=>{
    test("empezar por el 4.º y llegar al final: avisa de los 3 sin series ni visto y no cierra",app=>{
      app.reiniciarMemoria();app.sembrar(F.dueno);const antes=app.leer("rp_history").length;
      const c=contarCierres(app);let l;
      try{l=empezarPorElCuarto(app);
        expect(app.ev("steps[stepi].id")).toBe(l[3]);
        hastaElFinal(app);}finally{c.soltar();}
      expect(c.n).toBe(0);
      expect(enAviso(app)).toEqual(l.slice(0,3));
      expect(enAviso(app)).toEqual(["caminadora","circulos_brazos","wall_angels"]);
      expect(app.texto("#guided h2")).toBe("Te faltan 3 ejercicios");
      expect([app.texto("#guided .gbtn.go"),app.texto("#guided .gbtn.sec")]).toEqual(["Hacerlos ahora","Terminar así"]);
      expect(app.texto("#guided")).not.toContain("Completada");
      expect(app.leer("rp_history").length).toBe(antes);
      expect(app.leer("rp_session").key).toBe(R);
      app.reiniciarMemoria();});
    test("'Hacerlos ahora' lleva al primer paso del primer pendiente y de uno al siguiente; al acabar, Completada 14 de 14",app=>{
      const l=empezarPorElCuarto(app);hastaElFinal(app);
      app.$("#guided .gbtn.go").click();
      expect(app.ev("steps[stepi].id")).toBe(l[0]);
      expect(app.ev("stepi")).toBe(app.ev("steps.findIndex(x=>x.id==='"+l[0]+"')"));
      expect(app.leer("rp_session").repaso).toEqual(l.slice(0,3));
      const c=contarCierres(app);let vistos;
      try{vistos=hastaElFinal(app);}finally{c.soltar();}
      /* solo los tres pendientes: ninguno de los once ya hechos se repite */
      expect(vistos).toEqual(l.slice(0,3));
      expect(c.n).toBe(1);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      expect(app.texto("#guided")).not.toContain("Guardada");
      const h=app.leer("rp_history")[0];
      expect([h.key,h.exDone,h.exTotal]).toEqual([R,14,14]);
      expect(app.texto("#guided .donesum b")).toBe("14");
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
    test("'Hacerlos ahora' salta los ya hechos que hay entre dos pendientes",app=>{
      /* el 2.º ya marcado con visto desde la lista: faltan el 1.º y el 3.º */
      const datos=F.dueno();datos.rp_checks={[F.fecha(0)]:{[R]:{circulos_brazos:true}}};
      const l=empezarPorElCuarto(app,datos);hastaElFinal(app);
      expect(enAviso(app)).toEqual([l[0],l[2]]);
      app.$("#guided .gbtn.go").click();
      expect(hastaElFinal(app)).toEqual([l[0],l[2]]);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      app.reiniciarMemoria();});
    test("con un solo pendiente el aviso habla en singular",app=>{
      const datos=F.dueno();datos.rp_checks={[F.fecha(0)]:{[R]:{circulos_brazos:true,wall_angels:true}}};
      const l=empezarPorElCuarto(app,datos);hastaElFinal(app);
      expect(enAviso(app)).toEqual([l[0]]);
      expect(app.texto("#guided h2")).toBe("Te falta 1 ejercicio");
      expect(app.texto("#guided .done .mut")).toContain("sin hacer este.");
      expect(app.texto("#guided .gbtn.go")).toBe("Hacerlo ahora");
      app.reiniciarMemoria();});
    test("salir del aviso sin elegir y 'Continuar' lleva a lo que falta, no al último paso",async app=>{
      const l=empezarPorElCuarto(app);hastaElFinal(app);
      /* el boton atras del telefono: el popstate pinta la rutina */
      app.w.history.back();await app.hasta(()=>app.activa()==="routine",3000,"la rutina");
      expect(app.leer("rp_session").repaso).toEqual(l.slice(0,3));
      app.$("#routCta .btn:not(.sec)").click();
      expect(app.activa()).toBe("guided");
      expect(app.ev("stepi")).toBe(app.ev("steps.findIndex(x=>x.id==='"+l[0]+"')"));
      expect(hastaElFinal(app)).toEqual(l.slice(0,3));
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      app.reiniciarMemoria();});
    /* sin el atras del sistema (app instalada en iOS) el aviso necesita su
       propio Salir; y el foco va al aviso, no se queda en BODY */
    test("el aviso tiene su Salir: deja la sesión abierta y 'Continuar' lleva a lo que falta",async app=>{
      const l=empezarPorElCuarto(app);hastaElFinal(app);
      const antes=app.leer("rp_history").length,x=app.$('#guided .icbtn[aria-label="Salir"]');
      expect(!!x).toBe(true);
      expect([x.getAttribute("role"),x.getAttribute("tabindex")]).toEqual(["button","0"]);
      expect(app.doc.activeElement).toBe(app.$("#guided h2"));
      x.click();await app.hasta(()=>app.activa()==="routine",3000,"la rutina");
      expect(app.leer("rp_history").length).toBe(antes);
      const s=app.leer("rp_session");
      expect(s.key).toBe(R);
      expect(s.repaso).toEqual(l.slice(0,3));
      expect(s.stepi).toBe(app.ev("buildSteps('"+R+"').findIndex(x=>x.id==='"+l[0]+"')"));
      app.$("#routCta .btn:not(.sec)").click();
      expect(app.activa()).toBe("guided");
      expect(app.ev("steps[stepi].id")).toBe(l[0]);
      app.reiniciarMemoria();});
    test("marcar con visto desde la lista el primer pendiente y 'Continuar' lleva al siguiente que falta",async app=>{
      const l=empezarPorElCuarto(app);hastaElFinal(app);
      app.w.history.back();await app.hasta(()=>app.activa()==="routine",3000,"la rutina");
      app.$('#routine .ex[data-ex="'+l[0]+'"] .exck').click();
      expect(app.w.pendientes(R)).toEqual(l.slice(1,3));
      app.$("#routCta .btn:not(.sec)").click();
      expect(app.activa()).toBe("guided");
      expect(app.ev("steps[stepi].id")).toBe(l[1]);
      expect(app.ev("stepi")).toBe(app.ev("steps.findIndex(x=>x.id==='"+l[1]+"')"));
      /* y saltarlo no apunta como saltado el que ya tiene visto */
      app.w.guidedSkipExercise();
      expect(app.ev("steps[stepi].id")).toBe(l[2]);
      expect(app.leer("rp_session").saltados||[]).toEqual([l[1]]);
      app.reiniciarMemoria();});
    test("con pendientes y nada hecho, 'Terminar así' no guarda nada ni dice 'Completada'",app=>{
      app.reiniciarMemoria();app.sembrar(F.dueno);const antes=app.leer("rp_history").length,l=app.w.effList(R);
      app.w.openRoutine(R);app.w.startRoutine(l[l.length-1]);app.w.guidedSkipExercise();
      expect(enAviso(app)).toEqual(l.slice(0,-1));
      app.$("#guided .gbtn.sec").click();
      expect(app.texto("#guided .done .mut")).toContain("Nada nuevo que guardar");
      expect(app.texto("#guided")).not.toContain("Completada");
      expect(app.leer("rp_history").length).toBe(antes);
      app.reiniciarMemoria();});
    test("saltar todos los ejercicios: no guarda nada ni dice 'Completada'",app=>{
      app.reiniciarMemoria();app.sembrar(F.dueno);
      const antes=app.leer("rp_history").length,racha=app.leer("rp_streak"),logs=JSON.stringify(app.leer("rp_logs"));
      app.w.openRoutine(R);app.w.startRoutine();
      for(let n=0;n<50&&app.$("#guided .skip");n++)app.w.guidedSkipExercise();
      expect(app.$("#guided .finlist")).toBe(null);
      expect(app.texto("#guided .done .mut")).toContain("Nada nuevo que guardar");
      expect(app.texto("#guided")).not.toContain("Completada");
      expect(app.leer("rp_history").length).toBe(antes);
      expect(app.leer("rp_streak")).toEqual(racha);
      expect(JSON.stringify(app.leer("rp_logs"))).toBe(logs);
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
    test("'Terminar así' guarda igual que antes y dice 'Guardada · 11 de 14 ejercicios', nunca 'Completada'",async app=>{
      /* lo que guardaba cerrar en el guiado hasta v35: finishSession tal cual */
      empezarPorElCuarto(app);await unaSerie(app);hastaElFinal(app);
      app.w.finishSession(R,"guided");const comoAntes=loGuardado(app);
      /* lo mismo, cerrado con el boton del aviso */
      const antes=(empezarPorElCuarto(app),app.leer("rp_history").length),racha=app.leer("rp_streak");
      await unaSerie(app);hastaElFinal(app);
      expect(app.texto("#guided .gbtn.sec")).toBe("Terminar así");
      app.$("#guided .gbtn.sec").click();
      const g=loGuardado(app);
      expect(g).toEqual(comoAntes);
      expect(g.n).toBe(antes+1);
      expect([g.ultima.key,g.ultima.exDone,g.ultima.exTotal,g.ultima.sets]).toEqual([R,11,14,1]);
      expect(g.logs.press_banca_db.length).toBe(1);
      expect(g.logs.press_banca_db[0].sets.length).toBe(1);
      expect(g.logs.caminadora).toBe(undefined);
      expect(Object.keys(g.logged[R]).length).toBe(11);
      expect(g.streak.last).toBe(F.fecha(0));
      expect(g.streak.total).toBe(racha.total+1);
      expect(app.leer("rp_session")).toBe(null);
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 11 de 14 ejercicios");
      expect(app.texto("#guided")).not.toContain("Completada");
      /* el anillo se queda en lo hecho */
      expect(app.$("#guided .hero").getAttribute("style")).toContain("--fin:");
      app.reiniciarMemoria();});
    test("un ejercicio saltado con 'Saltar ejercicio' no sale como pendiente ni cuenta como hecho",app=>{
      const l=empezarPorElCuarto(app);avanzarHasta(app,"press_banca_db");
      app.$("#guided .skip").click();
      expect(app.ev("steps[stepi].id")).not.toBe("press_banca_db");
      expect(app.leer("rp_session").saltados).toEqual(["press_banca_db"]);
      hastaElFinal(app);
      expect(enAviso(app)).toEqual(l.slice(0,3));
      app.$("#guided .gbtn.sec").click();
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 10 de 14 ejercicios");
      const h=app.leer("rp_history")[0];
      expect([h.exDone,h.exTotal]).toEqual([10,14]);
      expect(h.ids.indexOf("press_banca_db")).toBe(-1);
      expect((app.leer("rp_logs").press_banca_db||[]).filter(r=>r.date===F.fecha(0))).toEqual([]);
      app.reiniciarMemoria();});
    test("saltado y sin pendientes: cierra sin aviso, y el saltado tampoco cuenta como hecho",app=>{
      app.reiniciarMemoria();app.sembrar(F.dueno);app.w.openRoutine(R);app.w.startRoutine();
      avanzarHasta(app,"press_banca_db");app.w.guidedSkipExercise();
      hastaElFinal(app);
      expect(app.$("#guided .finlist")).toBe(null);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      const h=app.leer("rp_history")[0];
      expect([h.exDone,h.exTotal]).toEqual([13,14]);
      expect(h.ids.indexOf("press_banca_db")).toBe(-1);
      app.reiniciarMemoria();});
    test("sin pendientes, el final es el de siempre: 'Completada en N min'",app=>{
      app.reiniciarMemoria();app.sembrar(F.dueno);app.w.openRoutine(R);app.w.startRoutine();
      expect(app.ev("stepi")).toBe(0);
      /* HU-63: entrar no crea la sesion; nace con el visto del primer
         ejercicio. Desde ahi, la sesion empezo hace 25 minutos */
      expect(app.leer("rp_session")).toBe(null);
      const l=app.w.effList(R),c=contarCierres(app);let vistos=[l[0]];
      try{for(let n=0;n<300&&app.ev("steps[stepi].id")===l[0];n++)app.w.advance();
        const s=app.leer("rp_session");expect(s.key).toBe(R);
        s.startedAt=Date.now()-25*60000;localStorage.setItem("rp_session",JSON.stringify(s));
        vistos=vistos.concat(hastaElFinal(app));}finally{c.soltar();}
      expect(vistos).toEqual(app.w.effList(R));
      expect(c.n).toBe(1);
      expect(app.$("#guided .finlist")).toBe(null);
      expect(app.texto("#guided .done .mut")).toBe("Completada en 25 min");
      expect(app.texto("#guided")).not.toContain("Guardada");
      expect(app.texto("#guided .donesum b")).toBe("14");
      expect(app.$("#guided .hero").getAttribute("style")).not.toContain("--fin");
      app.reiniciarMemoria();});
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
      /* con HU-09 terminar con ejercicios sin hacer guarda lo hecho y dice
         "Guardada · X de Y", nunca "Completada": aqui solo se hizo el pecho */
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 1 de 14 ejercicios");
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
      /* con HU-09 terminar con ejercicios sin hacer guarda lo hecho y dice
         "Guardada · X de Y", nunca "Completada": aqui solo se hizo el pecho */
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 1 de 14 ejercicios");
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
    /* el nivel se mide contra lo mismo que la etiqueta: historial y las
       series de hoy antes de esta. 30 x 10 (e1RM 40) bate el historial (38)
       pero no a la 32.5 x 8 de hoy (41,2): mas reps, nivel 1, sin aviso */
    test("una serie ligera tras otra fuerte que bate el historial es nivel 1, sin aviso flotante",async app=>{limpio(app,base());
      app.w.openRoutine("gym_empuje");app.w.startRoutine(PECHO);
      sinAviso(app);app.ev("curW=32.5;curReps=8");app.w.logSet();
      expect(app.texto("#toast")).toBe("Récord en "+app.w.shortName(PECHO)+": 32.5 kg × 8");
      await app.espera(400);app.w.skipRest();
      sinAviso(app);app.ev("curW=30;curReps=10");app.w.logSet();
      const lvls=()=>app.leer("rp_session").pr.map(p=>[p.w,p.reps,p.i,p.lvl,p.kind]);
      expect(lvls()).toEqual([[32.5,8,0,2,"Peso máximo"],[30,10,1,1,"Más reps con 30 kg"]]);
      expect(app.texto("#toast")).toBe("");
      await app.espera(400);app.w.skipRest();
      /* sin la fuerte (borrada), los records rehechos la suben a nivel 2 */
      app.w.delSet(PECHO,"s",-1,0,-1);
      expect(lvls()).toEqual([[30,10,0,2,"Mejor 1RM est."]]);
      app.reiniciarMemoria();});
  });
})();
