/* Humo de pantallas: con cada juego de datos se recorre Inicio, el detalle de
   una rutina, el modo guiado, Calendario, Progreso y Ajustes con las mismas
   funciones y botones que usa la persona, y se comprueba que se pinta algo.
   Cualquier error de la app durante el recorrido hace fallar la prueba. */
(function(){
  const F=Fixtures;
  const tab=(app,v)=>{app.$('.nav .tab[data-v="'+v+'"]').click();};

  function humo(nombre,semilla,o){
    escenario("Pantallas · "+nombre,semilla,()=>{
      test("Inicio: rutinas, tarjeta de hoy, semana y racha",app=>{
        expect(app.activa()).toBe("home");
        expect(app.$$("#routines .rcard").length).toBe(9);
        expect(app.texto("#todayCard").length).toBeGreaterThan(10);
        expect(app.$$("#weekCard .day").length).toBe(7);
        expect(app.texto("#stCount")).toMatch(/^\d+$/);
        expect(app.texto("#stWeek")).toMatch(/\d+ de \d+ esta semana/);
        expect(app.doc.documentElement.getAttribute("data-theme")).toBe(o.tema);
        expect(!!app.$("#routines .bknag")).toBe(o.avisoCopia);
        if(o.hoy)expect(app.texto("#todayCard")).toContain(o.hoy);});
      test("detalle de rutina: un ejercicio por entrada de effList",app=>{
        app.$$("#routines .rcard").find(c=>c.getAttribute("onclick").indexOf("'"+o.rutina+"'")>=0).click();
        expect(app.activa()).toBe("routine");
        const filas=app.$$("#routine .exgroup .ex:not(.off)").map(e=>e.dataset.ex);
        expect(filas).toEqual(app.w.effList(o.rutina));
        expect(app.texto("#routine .subttl")).toContain(app.w.estMinutes(o.rutina)+" min");
        expect(app.$("#routCta button")).toBeTruthy();});
      test("modo guiado: arranca y el peso propuesto es el de suggestLoad",app=>{
        app.$("#routCta button").click();
        expect(app.activa()).toBe("guided");
        expect(app.$("#guided .gbtn.go")).toBeTruthy();
        app.w.startRoutine(o.cargado);
        expect(app.ev("steps[stepi].id")).toBe(o.cargado);
        const s=app.w.suggestLoad(o.cargado);
        expect(app.texto("#lw")).toBe(app.w.fmtW(s.w));
        expect(app.texto("#lr")).toBe(String(s.reps));
        if(s.why)expect(app.texto("#guided .qwhy")).toContain(s.why);
        app.w.guidedSkipExercise();
        expect(app.ev("steps[stepi].id")).not.toBe(o.cargado);
        expect(app.texto("#guided").length).toBeGreaterThan(20);});
      if(o.bugUnidad)test.skip("modo guiado: el peso se muestra igual antes y despues de tocar + y −",
        "BUG: renderStep pinta #lw solo con el numero ('30'), pero adjW lo reescribe con la unidad ('30 kg'); tras subir y bajar 2,5 kg el mismo peso se ve distinto, y editNum lo vuelve a dejar sin unidad.",
        app=>{app.w.startRoutine(o.cargado);const a=app.texto("#lw");app.w.adjW(2.5);app.w.adjW(-2.5);
          expect(app.texto("#lw")).toBe(a);});
      test("Calendario: mes pintado y dias con actividad",app=>{
        tab(app,"history");
        expect(app.activa()).toBe("history");
        const dias=app.$$("#histBody .calcell:not(.empty)").length;
        expect(dias>=28&&dias<=31).toBe(true);
        expect(app.$$("#histBody .calcell.has").length>0).toBe(o.conHistorial);
        expect(app.$$("#histBody .calcell.istoday").length).toBe(1);
        /* el ultimo dia entrenado muestra su sesion y sus series */
        const h=app.leer("rp_history");
        if(h&&h.length){const p=h[0].date.split("/");app.w.calPick(p[2]+"-"+p[1]+"-"+p[0]);
          expect(app.$$("#histBody .dayblock").length).toBeGreaterThan(0);
          expect(app.texto("#histBody .dayblock")).toContain(h[0].name);}});
      test("Progreso: indice de fuerza, peso, musculos y constancia",app=>{
        tab(app,"progress");
        expect(app.activa()).toBe("progress");
        const t=app.texto("#progBody");
        ["Índice de fuerza","Peso corporal","Medidas","Constancia"].forEach(x=>expect(t).toContain(x));
        expect(app.$("#progBody .hbig")&&/^\d+$/.test(app.texto("#progBody .hbig"))).toBe(o.conIndice);
        if(o.progreso)o.progreso.forEach(x=>expect(t).toContain(x));});
      test("Ajustes: version, objetivo y mancuernas guardadas",app=>{
        tab(app,"settings");
        expect(app.activa()).toBe("settings");
        expect(app.texto("#setBody")).toContain(app.ev("VERSION"));
        expect(app.$("#pesosDB").value).toBe(o.pesos);
        expect(app.texto("#setBody button.minibtn.on")).toBe(o.objetivo);
        expect(app.texto("#dataInfo")).toMatch(/Guardado: \d+ sesiones/);});
      test("volver a Inicio desde la barra",app=>{
        tab(app,"home");
        expect(app.activa()).toBe("home");
        expect(app.$$("#routines .rcard").length).toBe(9);});
    });
  }

  humo("sin datos",F.vacio,{tema:"light",rutina:"gym_empuje",cargado:"press_banca_db",avisoCopia:false,
    conHistorial:false,conIndice:false,pesos:"",objetivo:"Ganar músculo"});
  humo("dueño (gimnasio, masa)",F.dueno,{tema:"dark",rutina:"gym_tiron",cargado:"jalon_pecho",avisoCopia:true,
    conHistorial:true,conIndice:true,pesos:"",objetivo:"Ganar músculo",progreso:["Récords recientes","Series por músculo"],
    bugUnidad:true});
  humo("madre (casa, salud, 1-3 kg)",F.madre,{tema:"light",rutina:"salud_fuerza_a",cargado:"press_hombro_db",avisoCopia:false,
    conHistorial:true,conIndice:true,pesos:"1 2 3",objetivo:"Salud y mantenimiento",hoy:"En curso"});

  /* ---- HU-11: una sola racha, la de semanas cumplidas (weekStats) ----
     Se termina una rutina entera y se leen Inicio, la pantalla de fin,
     «Listo por hoy», Progreso y Ajustes. rp_streak se sigue guardando, pero
     de el solo se muestra el total de sesiones. */
  const DIAS_SEGUIDOS=/d[ií]as? seguid[oa]s?/i;
  const semanas=n=>n+" "+(n===1?"semana cumplida":"semanas cumplidas");
  /* lunes de esta semana a medianoche local */
  const lunes=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;};
  /* el bloque que sigue a un titulo de Progreso */
  const bloque=(app,titulo)=>{const g=app.$$("#progBody .grouptitle").find(x=>x.textContent.trim()===titulo);
    return g?g.nextElementSibling.textContent.replace(/\s+/g," ").trim():"";};
  /* cuenta aparte de la linea de postura: dias distintos desde el lunes con
     alguna rutina que no esta en GYMKEYS */
  function diasPostura(app){const G=app.ev("GYMKEYS"),desde=lunes(),dias={};
    (app.leer("rp_history")||[]).forEach(h=>{const d=new Date(h.iso);if(G.indexOf(h.key)<0&&d>=desde)dias[F.ds(d)]=1;});
    return Object.keys(dias).length;}
  /* termina k con todos sus ejercicios marcados, como quien cierra la lista */
  function terminar(app,k){if(app.$("#guided .done"))return;
    app.w.openRoutine(k);app.w.effList(k).forEach(id=>app.w.markCheck(k,id,true));
    app.w.show("guided");app.w.finish();
    expect(app.texto("#guided")).toContain("Completada");}

  function racha(nombre,semilla,o){
    escenario("Racha única · "+nombre,semilla,()=>{
      let antes=null,total=0;
      test("Inicio, pantalla de fin y Progreso no hablan de días seguidos",app=>{
        antes=app.w.weekStats();total=app.leer("rp_streak").total;
        expect(app.texto("#home")).not.toMatch(DIAS_SEGUIDOS);
        terminar(app,o.rutina);
        expect(app.texto("#guided")).not.toMatch(DIAS_SEGUIDOS);
        tab(app,"home");
        expect(app.texto("#todayCard")).toContain("¡Listo por hoy!");
        expect(app.texto("#home")).not.toMatch(DIAS_SEGUIDOS);
        tab(app,"progress");
        expect(app.texto("#progBody")).not.toMatch(DIAS_SEGUIDOS);});
      test("pantalla de fin: «Esta semana: N de M» con N y M de weekStats()",app=>{
        terminar(app,o.rutina);const w=app.w.weekStats(),s=app.leer("rp_streak");
        /* la rutina terminada entera cuenta para la semana */
        expect(w.hechas).toBe(antes.hechas+1);
        expect(app.texto("#guided .donest")).toBe("Esta semana: "+w.hechas+" de "+w.goal);
        expect(app.$("#guided .donest svg")).toBeTruthy();
        expect(!!app.$("#guided .doneok")).toBe(w.semanaOK);
        if(w.semanaOK)expect(app.texto("#guided .doneok")).toBe("Semana cumplida · "+w.racha+" "+(w.racha===1?"seguida":"seguidas"));
        /* el total de sesiones sigue saliendo de rp_streak, una mas que antes */
        expect(s.total).toBe(total+1);
        expect(app.texto("#guided .donesub")).toBe("Mejor racha: "+w.mejor+" "+(w.mejor===1?"semana":"semanas")+" · "+s.total+" sesiones en total");});
      test("«Listo por hoy», Inicio, «Tu historial» y Ajustes: racha y mejor de weekStats()",app=>{
        terminar(app,o.rutina);tab(app,"home");const w=app.w.weekStats();
        expect(app.texto("#todayCard")).toContain(semanas(w.racha)+" · mejor "+w.mejor);
        expect(app.texto("#stCount")).toBe(String(w.racha));
        expect(app.texto("#stCountL")).toBe(semanas(w.racha).replace(/^\d+ /,""));
        tab(app,"progress");
        const h=bloque(app,"Tu historial");
        expect(h).toContain(semanas(w.racha)+" · mejor "+w.mejor);
        expect(h).toContain(app.leer("rp_streak").total+" sesiones");
        tab(app,"settings");
        expect(app.texto("#dataInfo")).toContain("racha "+w.racha+" "+(w.racha===1?"semana":"semanas"));});
      test(o.salud?"objetivo salud: sale «Postura: N de 7 días esta semana»":"objetivo masa: no sale la línea de postura",app=>{
        tab(app,"home");
        expect(app.$("#stPost").hidden).toBe(!o.salud);
        if(o.salud)expect(app.texto("#stPost")).toBe("Postura: "+diasPostura(app)+" de 7 días esta semana");
        else expect(app.texto(".streak")).not.toContain("Postura");
        app.reiniciarMemoria();});
    });
  }
  racha("gimnasio, masa (Fixtures.dueno)",F.dueno,{rutina:"gym_empuje",salud:false});
  racha("casa, salud (Fixtures.madre)",F.madre,{rutina:"salud_fuerza_b",salud:true});

  /* el juego de gimnasio con todas sus sesiones completas (todas cuentan)
     y la meta una por encima de lo hecho esta semana: la rutina que se
     termina en la prueba es la que la cumple, sea el dia que sea */
  function alBorde(){const D=F.dueno(),desde=lunes();
    D.rp_history.forEach(h=>{h.exTotal=h.exDone;});
    const n=D.rp_history.filter(h=>h.key.indexOf("gym_")===0&&new Date(h.iso)>=desde).length;
    D.rp_plan=["gym_empuje","gym_tiron","gym_pierna","gym_empuje","gym_tiron","gym_pierna","gym_empuje"].map((v,i)=>i<=n?v:null);
    return D;}
  escenario("Racha única · la sesión que cumple la semana",alBorde,()=>{
    let antes=null;
    test("al terminar: «Esta semana: M de M» y «Semana cumplida · R seguidas» con R de weekStats()",app=>{
      antes=app.w.weekStats();
      expect(antes.semanaOK).toBe(false);
      expect(antes.hechas).toBe(antes.goal-1);
      expect(app.texto("#stCount")).toBe(String(antes.racha));
      terminar(app,"gym_empuje");
      const w=app.w.weekStats();
      expect([w.hechas,w.goal,w.semanaOK]).toEqual([antes.goal,antes.goal,true]);
      /* la semana cumplida suma ya, no el lunes que viene */
      expect(w.racha).toBe(antes.racha+1);
      expect(app.texto("#guided .donest")).toBe("Esta semana: "+w.goal+" de "+w.goal);
      expect(app.texto("#guided .doneok")).toBe("Semana cumplida · "+w.racha+" "+(w.racha===1?"seguida":"seguidas"));});
    test("Inicio, «Listo por hoy», Progreso y Ajustes dicen la misma cifra que la pantalla de fin",app=>{
      const w=app.w.weekStats();tab(app,"home");
      expect(app.texto("#stCount")).toBe(String(w.racha));
      expect(app.texto("#stWeek")).toBe(w.goal+" de "+w.goal+" esta semana");
      expect(app.texto("#todayCard")).toContain(semanas(w.racha)+" · mejor "+w.mejor);
      tab(app,"progress");
      expect(bloque(app,"Tu historial")).toContain(semanas(w.racha)+" · mejor "+w.mejor);
      tab(app,"settings");
      expect(app.texto("#dataInfo")).toContain("racha "+w.racha+" "+(w.racha===1?"semana":"semanas"));
      expect(w.mejor).not.toBeLessThan(w.racha);
      app.reiniciarMemoria();});
  });

  /* objetivo salud con postura y cuello esta semana (dos el mismo dia), una
     de postura de la semana pasada y una de fuerza hoy: ninguna de esas dos
     ultimas entra en la linea */
  function conPostura(){const D=F.madre(),dl=(new Date().getDay()+6)%7,p2=x=>String(x).padStart(2,"0");
    const e=(key,n)=>{const d=F.momento(n,0,30);
      return {key:key,name:key,iso:d.toISOString(),day:"",date:p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+d.getFullYear(),time:"00:30"};};
    D.rp_history=D.rp_history.concat([e("postura_movilidad",0),e("cuello_rostro",0),e("salud_fuerza_a",0),
      e("postura_completa",dl),e("postura_movilidad",dl+1)]).sort((a,b)=>a.iso<b.iso?1:-1);
    return D;}
  escenario("Racha única · objetivo salud con postura esta semana",conPostura,()=>{
    test("«Postura: N de 7 días esta semana» cuenta días, no sesiones, y solo rutinas fuera de GYMKEYS",app=>{
      const dl=(new Date().getDay()+6)%7,n=dl===0?1:2;
      expect(diasPostura(app)).toBe(n);
      expect(app.$("#stPost").hidden).toBe(false);
      expect(app.texto("#stPost")).toBe("Postura: "+n+" de 7 días esta semana");
      /* la de fuerza de hoy va a la meta de la semana, no a la postura (las
         de casa de esta semana no llegan al 60 % y no cuentan) */
      expect(app.w.weekStats().hechas).toBe(1);});
    test("al cambiar a «Ganar músculo» la línea se va, y vuelve con salud",app=>{
      app.w.setGoalPref("masa");tab(app,"home");
      expect(app.$("#stPost").hidden).toBe(true);
      expect(app.texto(".streak")).not.toContain("Postura");
      app.w.setGoalPref("salud");tab(app,"home");
      expect(app.$("#stPost").hidden).toBe(false);
      expect(app.texto("#stPost")).toContain(" de 7 días esta semana");});
  });
})();
