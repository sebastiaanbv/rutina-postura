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
         copia editada a mano puede traer "8". Antes salia "8"+1 = 81 kg */
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
    /* el ultimo peso muerto rumano de casa es con la mancuerna de 3 kg: 2 series de 12 */
    const casa=(lista,series)=>{const D=F.madre();
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
    const otra=(app,id,k,series,lista)=>{const D=F.madre();D.rp_prefs.pesosDB=lista||[1,2,3];
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
    test("con pendientes y nada hecho, 'Terminar así' no guarda nada ni dice 'Completada'",app=>{
      app.reiniciarMemoria();app.sembrar(F.dueno);const antes=app.leer("rp_history").length,l=app.w.effList(R);
      app.w.openRoutine(R);app.w.startRoutine(l[l.length-1]);app.w.guidedSkipExercise();
      expect(enAviso(app)).toEqual(l.slice(0,-1));
      app.$("#guided .gbtn.sec").click();
      expect(app.texto("#guided .done .mut")).toContain("Nada nuevo que guardar");
      expect(app.texto("#guided")).not.toContain("Completada");
      expect(app.leer("rp_history").length).toBe(antes);
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
