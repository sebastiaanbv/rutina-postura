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
        /* chip "Salto" (v36): con carga sale, salvo mancuernas con lista en
           Ajustes; pintarlo no escribe nada (datos de v35 sin rp_inc) */
        expect(!!app.$("#guided .stepper #incchip")).toBe(o.chip);
        expect(app.leer("rp_inc")).toBe(null);
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
    conHistorial:false,conIndice:false,pesos:"",objetivo:"Ganar músculo",chip:true});
  humo("dueño (gimnasio, masa)",F.dueno,{tema:"dark",rutina:"gym_tiron",cargado:"jalon_pecho",avisoCopia:true,
    conHistorial:true,conIndice:true,pesos:"",objetivo:"Ganar músculo",progreso:["Récords recientes","Series por músculo"],
    bugUnidad:true,chip:true});
  humo("madre (casa, salud, 1-3 kg)",F.madre,{tema:"light",rutina:"salud_fuerza_a",cargado:"press_hombro_db",avisoCopia:false,
    conHistorial:true,conIndice:true,pesos:"1 2 3",objetivo:"Salud y mantenimiento",hoy:"En curso",chip:false});

  /* chip "Salto" (v36): de cuanto en cuanto sube cada maquina. jalon_pecho
     con el rango lleno a 40 kg: sin salto propone 42,5, que una maquina de 5
     en 5 no tiene */
  const lleno40=()=>{const t=F.momento(3,18,30).getTime();
    return {rp_logs:{jalon_pecho:[{date:F.fecha(3),k:"gym_tiron",t:t,sets:[0,1,2,3].map(i=>({w:40,reps:12,t:t+i*150000}))}]}};};
  const guiado=(app,k,id)=>{app.reiniciarMemoria();app.w.openRoutine(k);app.w.startRoutine(id);
    expect(app.ev("steps[stepi].id")).toBe(id);};
  const opciones=app=>app.$$("#incpick .mchip");
  const elige=(app,txt)=>{app.$("#incchip").click();opciones(app).find(b=>b.textContent===txt).click();};
  escenario("Pantallas · chip «Salto» bajo el peso",lleno40,()=>{
    test("en una máquina sale bajo el peso, se despliega y elegir 5 rehace la propuesta",app=>{
      guiado(app,"gym_tiron","jalon_pecho");
      expect(app.texto("#lw")).toBe("42.5");
      const chip=app.$("#guided .stepper #incchip");
      expect(chip).toBeTruthy();
      expect(app.texto("#incchip")).toBe("¿De cuánto sube?");
      expect([chip.tagName,chip.getAttribute("aria-expanded"),chip.getAttribute("aria-controls")]).toEqual(["BUTTON","false","incpick"]);
      expect(app.$("#incpick").hidden).toBe(true);
      chip.click();
      expect(app.$("#incpick").hidden).toBe(false);
      expect(chip.getAttribute("aria-expanded")).toBe("true");
      expect(opciones(app).map(b=>b.textContent)).toEqual(["1","2","2.5","4.5","5","7","10"]);
      expect(opciones(app).every(b=>b.getAttribute("aria-pressed")==="false")).toBe(true);
      opciones(app)[4].click();
      expect(app.leer("rp_inc")).toEqual({jalon_pecho:5});
      expect(app.texto("#incchip")).toBe("Salto 5 kg");
      expect(app.$("#incpick").hidden).toBe(true);
      /* repintar no pierde el foco del teclado */
      expect(app.doc.activeElement.id).toBe("incchip");
      expect(opciones(app).filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.textContent)).toEqual(["5"]);
      /* 5 sobre 40 pasa del 10 %: mismo peso y rango estirado */
      expect([app.texto("#lw"),app.texto("#lr")]).toEqual(["40","14"]);
      expect(app.texto("#guided .qwhy")).toContain("El siguiente peso que existe (45 kg)");
      expect(app.texto("#guided .warmup")).toContain("1×10 con 20 kg · 1×5 con 25 kg");
      /* los botones van por la escala de la maquina */
      const [menos,mas]=app.$$("#guided .logrow .stepper:first-child .sq");
      mas.click();expect(app.ev("curW")).toBe(45);
      menos.click();menos.click();expect(app.ev("curW")).toBe(35);
      mas.click();expect(app.ev("curW")).toBe(40);
      /* tocar el marcado lo quita y vuelve la propuesta de siempre */
      elige(app,"5");
      expect(app.leer("rp_inc")).toEqual({});
      expect(app.texto("#incchip")).toBe("¿De cuánto sube?");
      expect([app.texto("#lw"),app.texto("#lr")]).toEqual(["42.5","8"]);
      app.reiniciarMemoria();});
    test("lo tecleado no se redondea: 42,5 con salto 5 se registra y se guarda tal cual",async app=>{
      app.sembrar(Object.assign(lleno40(),{rp_inc:{jalon_pecho:5}}));
      guiado(app,"gym_tiron","jalon_pecho");
      expect(app.texto("#lw")).toBe("40");
      app.w.editNum("w");
      const i=app.$("#numin");i.value="42.5";
      i.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));
      expect(app.ev("curW")).toBe(42.5);
      expect(app.texto("#lw")).toBe("42.5");
      /* cambiar el salto despues tampoco lo pisa */
      elige(app,"10");
      expect(app.leer("rp_inc")).toEqual({jalon_pecho:10});
      expect(app.texto("#lw")).toBe("42.5");
      app.w.logSet();
      await app.hasta(()=>{const s=app.leer("rp_session");return s&&s.log.jalon_pecho;},3000,"la serie en rp_session");
      expect(app.leer("rp_session").log.jalon_pecho.map(x=>x.w)).toEqual([42.5]);
      app.w.finishSession("gym_tiron","guided");
      expect(app.leer("rp_logs").jalon_pecho.slice(-1)[0].sets.map(x=>x.w)).toEqual([42.5]);
      app.reiniciarMemoria();});
    test("no sale sin carga ni en mancuernas con lista en Ajustes; en mancuernas sin lista, sí",app=>{
      app.sembrar({rp_prefs:{pesosDB:[1,2,3]}});
      guiado(app,"salud_fuerza_a","press_hombro_db");
      expect(app.$("#lw")).toBeTruthy();
      expect(app.$("#incchip")).toBe(null);expect(app.$("#incpick")).toBe(null);
      /* sin carga: ni peso ni chip */
      guiado(app,"gym_empuje","wall_angels");
      expect(app.$("#lw")).toBe(null);expect(app.$("#incchip")).toBe(null);expect(app.$("#incpick")).toBe(null);
      guiado(app,"salud_fuerza_a","flexiones_pared");
      expect(app.$("#lr")).toBeTruthy();
      expect(app.$("#lw")).toBe(null);expect(app.$("#incchip")).toBe(null);
      /* la misma mancuerna sin lista (gimnasio): el chip sale */
      app.sembrar({});
      guiado(app,"salud_fuerza_a","press_hombro_db");
      expect(app.$("#incchip")).toBeTruthy();
      expect(app.leer("rp_inc")).toBe(null);
      app.reiniciarMemoria();});
  });
})();
