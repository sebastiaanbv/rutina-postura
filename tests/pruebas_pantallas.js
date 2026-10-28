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

  /* v36: aviso de pendientes al final del guiado con datos guardados por v35,
     cuyo rp_session no trae saltados ni repaso */
  const paso=app=>app.ev("steps[stepi].id");
  function hastaElFinal(app){const v=[];for(let n=0;n<300&&!app.$("#guided .done");n++){
      if(v[v.length-1]!==paso(app))v.push(paso(app));app.w.advance();}return v;}
  const enAviso=app=>app.$$("#guided .finlist [data-ex]").map(e=>e.dataset.ex);

  escenario("Pantallas · pendientes con la sesión de v35 del juego madre",F.madre,()=>{
    const K="salud_fuerza_b";
    test("Continuar retoma la sesión de v35 en su paso y con sus series",app=>{
      const s=app.leer("rp_session");
      expect([s.key,s.stepi,s.saltados,s.repaso]).toEqual([K,6,undefined,undefined]);
      app.w.openRoutine(K);app.$("#routCta .btn:not(.sec)").click();
      expect(app.activa()).toBe("guided");
      expect([app.ev("stepi"),paso(app)]).toEqual([6,"peso_muerto_rumano_db"]);
      expect(app.ev("sessionLog").remo_db.length).toBe(1);});
    test("recargar en el guiado retoma el mismo paso",async app=>{
      await app.recargar();
      expect(app.activa()).toBe("guided");
      expect([app.ev("stepi"),paso(app)]).toEqual([6,"peso_muerto_rumano_db"]);
      expect(app.ev("sessionLog").remo_db.length).toBe(1);});
    test("al final avisa de los que faltan; 'Hacerlos ahora' los recorre y cierra con todo",app=>{
      hastaElFinal(app);
      expect(enAviso(app)).toEqual(["extension_toracica","banda_pull_apart","remo_banda"]);
      expect(app.texto("#guided h2")).toBe("Te faltan 3 ejercicios");
      app.$("#guided .gbtn.go").click();
      expect(hastaElFinal(app)).toEqual(["extension_toracica","banda_pull_apart","remo_banda"]);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      const h=app.leer("rp_history")[0];
      expect([h.key,h.exDone,h.exTotal]).toEqual([K,12,12]);
      const r=app.leer("rp_logs").remo_db.slice(-1)[0];
      expect([r.date,r.sets.length]).toEqual([F.fecha(0),1]);
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
  });

  escenario("Pantallas · pendientes tras rescatar la sesión de v35 del juego sinCerrar",F.sinCerrar,()=>{
    test("la de ayer se rescata con la hoja y el guiado de hoy avisa y guarda a medias",async app=>{
      expect(app.texto("#finTitle")).toBe("Entrenamiento sin cerrar");
      const s=app.leer("rp_session");expect([s.saltados,s.repaso]).toEqual([undefined,undefined]);
      app.ev("confirmFinish()");await app.espera(100);
      expect(app.leer("rp_session")).toBe(null);
      expect(app.leer("rp_history").length).toBe(1);
      const l=app.w.effList("gym_empuje");app.w.openRoutine("gym_empuje");app.w.startRoutine(l[3]);
      hastaElFinal(app);
      expect(enAviso(app)).toEqual(l.slice(0,3));
      app.$("#guided .gbtn.sec").click();
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 11 de 14 ejercicios");
      expect(app.leer("rp_history").length).toBe(2);
      app.reiniciarMemoria();});
    test("sin pasar por la hoja, empezar el guiado la cierra sola con su fecha y sigue",async app=>{
      await app.arrancar(F.sinCerrar);
      /* la hoja de rescate sale al arrancar; se cierra sin elegir */
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      app.w.closeFinish();await app.hasta(()=>!app.$("#finov").classList.contains("show"),3000,"que se cierre la hoja");
      app.w.openRoutine("gym_empuje");app.w.startRoutine();
      const h=app.leer("rp_history"),s=app.leer("rp_session");
      expect(h.length).toBe(1);expect(app.w.ds(new Date(h[0].iso))).toBe(F.fecha(1));
      expect([s.date,s.stepi]).toEqual([F.fecha(0),0]);
      app.w.guidedSkipExercise();
      expect(app.leer("rp_session").saltados).toEqual(["caminadora"]);
      hastaElFinal(app);
      expect(app.$("#guided .finlist")).toBe(null);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      expect([app.leer("rp_history")[0].exDone,app.leer("rp_history")[0].exTotal]).toEqual([13,14]);
      app.reiniciarMemoria();});
  });
})();
