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
        /* HU-63: con otra rutina a medias hoy, Empezar pregunta antes; guardar
           la otra y empezar es un toque mas */
        if(o.aMedias){expect(app.$("#planov").classList.contains("show")).toBe(true);
          expect(app.texto("#planTitle")).toBe("Tienes "+o.aMedias+" a medias");
          app.$$("#planBody button").find(b=>b.textContent.indexOf("Guardar")>=0).click();}
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
      test("modo guiado: el peso se muestra igual antes y despues de tocar + y −",
        app=>{app.w.startRoutine(o.cargado);const a=app.texto("#lw");app.w.adjW(2.5);app.w.adjW(-2.5);
          expect(app.texto("#lw")).toBe(a);});
      /* un solo formato del peso: el de renderStep, solo el numero */
      test("modo guiado: el peso tiene el mismo formato al pintar, con − y +, al escribirlo y al cambiar las series",app=>{
        app.w.startRoutine(o.cargado);
        const igual=()=>{const el=app.$("#lw");expect(el.innerHTML).toBe(app.w.fmtW(app.ev("curW")));};
        igual();
        app.w.adjW(2.5);igual();
        app.w.adjW(-2.5);igual();
        app.w.adjW(-2.5);igual();
        app.w.editNum("w");const i=app.$("#numin");i.value="7.5";i.dispatchEvent(new app.w.Event("blur"));
        expect(app.texto("#lw")).toBe("7.5");igual();
        app.w.gAdjSets(1);igual();
        expect(app.texto("#lw")).toBe("7.5");
        app.w.gResetSets();igual();});
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
    chip:true});
  humo("madre (casa, salud, 1-3 kg)",F.madre,{tema:"light",rutina:"salud_fuerza_a",cargado:"press_hombro_db",avisoCopia:false,
    conHistorial:true,conIndice:true,pesos:"1 2 3",objetivo:"Salud y mantenimiento",hoy:"En curso",chip:false,
    aMedias:"Casa — Fuerza B"});

  /* un descanso de 0 s ajustado por la persona: la serie siguiente entra sin
     pasar por la pantalla de descanso; sin el ajuste, el del programa sigue */
  escenario("Pantallas · descanso de 0 s ajustado",()=>({rp_doses:{postura_completa:{isometricos_cervicales:{rest:0}}}}),()=>{
    const aguante=app=>{
      app.$$("#routines .rcard").find(c=>c.getAttribute("onclick").indexOf("'postura_completa'")>=0).click();
      app.w.startRoutine("isometricos_cervicales");
      expect(app.ev("steps[stepi].label")).toBe("Mantén 1 de 3");
      app.w.afterAction();};
    test("modo guiado: tras el aguante entra la serie siguiente, sin descanso",app=>{
      aguante(app);
      expect(app.$("#guided .stage.isrest")).toBeFalsy();
      expect(app.ev("steps[stepi].label")).toBe("Mantén 2 de 3");
      app.reiniciarMemoria();});
    test("modo guiado: sin el ajuste vuelve el descanso del programa",app=>{
      app.sembrar({});tab(app,"home");
      aguante(app);
      expect(app.$("#guided .stage.isrest")).toBeTruthy();
      expect(app.ev("restR")).toBe(15);
      app.reiniciarMemoria();});
  });

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
    /* HU-08 con HU-07: los gemelos son de maquina en el gimnasio y de
       mancuerna en casa. Con la lista de Ajustes, en casa no sale el chip y el
       salto guardado en el gimnasio no toca ni la propuesta ni los -/+ */
    test("gemelos con salto guardado: en el gimnasio el chip sale y manda; en casa con la lista, no",app=>{
      const datos=inc=>Object.assign({rp_prefs:{pesosDB:[1,2,3]},rp_extras:{salud_fuerza_a:["elevacion_pantorrilla"]}},
        inc?{rp_inc:{elevacion_pantorrilla:5}}:{});
      const masUno=()=>{app.$$("#guided .logrow .stepper:first-child .sq")[1].click();return app.ev("curW");};
      app.sembrar(datos(true));
      guiado(app,"gym_empuje","elevacion_pantorrilla");
      expect(app.texto("#incchip")).toBe("Salto 5 kg");
      expect(app.texto("#lw")).toBe("10");
      expect(masUno()).toBe(15);
      guiado(app,"salud_fuerza_a","elevacion_pantorrilla");
      expect(app.$("#lw")).toBeTruthy();
      expect(app.$("#incchip")).toBe(null);expect(app.$("#incpick")).toBe(null);
      expect(app.texto("#lw")).toBe("2");
      const conSalto=masUno();
      /* lo mismo que sin el salto guardado */
      app.sembrar(datos(false));
      guiado(app,"salud_fuerza_a","elevacion_pantorrilla");
      expect(app.texto("#lw")).toBe("2");
      expect(masUno()).toBe(conSalto);
      expect(app.leer("rp_inc")).toBe(null);
      app.reiniciarMemoria();});
  });

  /* ---- HU-11: una sola racha, la de semanas cumplidas (weekStats) ----
     Se termina una rutina entera y se leen Inicio, la pantalla de fin,
     «Listo por hoy», Progreso y Ajustes. rp_streak se sigue guardando, pero
     de el solo se muestra el total de sesiones. */
  const DIAS_SEGUIDOS=/d[ií]as? seguid[oa]s?/i;
  const semanas=n=>n+" "+(n===1?"semana cumplida":"semanas cumplidas");
  const sesiones=n=>n+" "+(n===1?"sesión":"sesiones");
  /* «R semanas cumplidas · mejor M»; sin ninguna semana cumplida, sin «mejor 0» */
  const conMejor=w=>semanas(w.racha)+(w.mejor?" · mejor "+w.mejor:"");
  /* «Mejor racha: M semanas · N sesiones en total», o solo el total si M es 0 */
  const pieFin=(w,total)=>(w.mejor?"Mejor racha: "+w.mejor+" "+(w.mejor===1?"semana":"semanas")+" · ":"")+sesiones(total)+" en total";
  /* lunes de esta semana a medianoche local */
  const lunes=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;};
  /* el bloque que sigue a un titulo de Progreso */
  const bloque=(app,titulo)=>{const g=app.$$("#progBody .grouptitle").find(x=>x.textContent.trim()===titulo);
    return g?g.nextElementSibling.textContent.replace(/\s+/g," ").trim():"";};
  /* las lineas de «Tu historial», partidas por sus <br> */
  const historial=app=>{const g=app.$$("#progBody .grouptitle").find(x=>x.textContent.trim()==="Tu historial");
    return g?g.nextElementSibling.querySelector(".cs").innerHTML.split(/<br\s*\/?>/).map(x=>x.replace(/<[^>]*>/g,"").trim()):[];};
  /* cuenta aparte de la linea de postura: dias distintos desde el lunes con
     alguna rutina que no esta en GYMKEYS */
  function diasPostura(app){const G=app.ev("GYMKEYS"),desde=lunes(),dias={};
    (app.leer("rp_history")||[]).forEach(h=>{const d=new Date(h.iso);if(G.indexOf(h.key)<0&&d>=desde)dias[F.ds(d)]=1;});
    return Object.keys(dias).length;}
  /* termina k con todos sus ejercicios marcados, como quien cierra la lista.
     Si ya hay pantalla de fin no termina otra (salvo que se pida otra sesion),
     pero vuelve a ella: una prueba anterior pudo dejar otra pestana delante,
     y medir la pantalla de fin escondida no mide nada */
  function terminar(app,k,otra){if(!otra&&app.$("#guided .done")){app.w.show("guided");return;}
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
        /* «Semana cumplida» solo en la sesion que la cumple */
        expect(!!app.$("#guided .doneok")).toBe(w.semanaOK&&!antes.semanaOK);
        if(w.semanaOK)expect(app.texto("#guided .doneok")).toBe("Semana cumplida · "+w.racha+" "+(w.racha===1?"seguida":"seguidas"));
        /* el total de sesiones sigue saliendo de rp_streak, una mas que antes */
        expect(s.total).toBe(total+1);
        expect(app.texto("#guided .donesub")).toBe(pieFin(w,s.total));});
      test("pantalla de fin a 320 px con la letra un 30 % mayor: «N de M» no se parte",async app=>{
        terminar(app,o.rutina);
        const f=app.frame,ancho=f.style.width,r=app.doc.documentElement.style,
          grande={"--t-display":"39px","--t-title":"28.6px","--t-base":"18.2px","--t-sm":"16.25px","--t-xs":"14.3px"};
        try{f.style.width="320px";Object.keys(grande).forEach(k=>r.setProperty(k,grande[k]));
          await app.espera(50);
          /* la pantalla de fin delante: escondida mide 0 y todo pasaria */
          expect(app.activa()).toBe("guided");
          const n=app.$("#guided .donest .n"),fs=parseFloat(app.w.getComputedStyle(n).fontSize);
          expect(fs).toBe(39);
          expect(n.getBoundingClientRect().height).toBeGreaterThan(fs*0.8);
          expect(n.getBoundingClientRect().width).toBeGreaterThan(0);
          /* una sola linea: con «2 de» arriba y «3» abajo mide el doble */
          expect(n.getBoundingClientRect().height).toBeLessThan(fs*1.6);
          expect(app.$("#guided .donest").getBoundingClientRect().right).not.toBeGreaterThan(320);
          expect(app.doc.documentElement.scrollWidth).not.toBeGreaterThan(320);
        }finally{f.style.width=ancho;Object.keys(grande).forEach(k=>r.removeProperty(k));}});
      test("«Listo por hoy», Inicio, «Tu historial» y Ajustes: racha y mejor de weekStats()",app=>{
        terminar(app,o.rutina);tab(app,"home");const w=app.w.weekStats();
        expect(app.texto("#todayCard")).toContain(conMejor(w));
        if(!w.mejor)expect(app.texto("#todayCard")).not.toContain("mejor");
        expect(app.texto("#stCount")).toBe(String(w.racha));
        expect(app.texto("#stCountL")).toBe(semanas(w.racha).replace(/^\d+ /,""));
        tab(app,"progress");
        const h=bloque(app,"Tu historial");
        expect(h).toContain(conMejor(w));
        if(!w.mejor)expect(h).not.toContain("mejor");
        expect(h).toContain(sesiones(app.leer("rp_streak").total));
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
    test("ya cumplida, otra de fuerza o una de postura esa semana no repiten «Semana cumplida»",app=>{
      const w0=app.w.weekStats();
      expect(w0.semanaOK).toBe(true);
      terminar(app,"gym_tiron",true);
      let w=app.w.weekStats();
      expect([w.hechas,w.racha]).toEqual([w0.hechas+1,w0.racha]);
      expect(app.texto("#guided .donest")).toBe("Esta semana: "+w.hechas+" de "+w.goal);
      expect(app.$("#guided .doneok")).toBeFalsy();
      expect(app.texto("#guided .donesub")).toContain("Mejor racha: "+w.mejor+" ");
      terminar(app,"postura_movilidad",true);
      w=app.w.weekStats();
      expect(w.hechas).toBe(w0.hechas+1);
      expect(app.$("#guided .doneok")).toBeFalsy();
      app.reiniciarMemoria();});
  });

  /* la primera sesion, sin ninguna semana cumplida: nada de «mejor 0» ni de
     «Mejor racha: 0 semanas», y los plurales en singular donde toca */
  escenario("Racha única · primera sesión (Fixtures.vacio)",F.vacio,()=>{
    test("pantalla de fin: «Esta semana: 1 de 3» y solo «1 sesión en total»",app=>{
      terminar(app,"gym_empuje");const w=app.w.weekStats();
      expect([w.hechas,w.goal,w.racha,w.mejor]).toEqual([1,3,0,0]);
      expect(app.texto("#guided .donest")).toBe("Esta semana: 1 de 3");
      expect(app.$("#guided .doneok")).toBeFalsy();
      expect(app.texto("#guided .donesub")).toBe("1 sesión en total");
      expect(app.texto("#guided")).not.toMatch(/mejor|0 semanas/i);});
    test("«Listo por hoy», «Tu historial» y Ajustes: sin «mejor 0» y con «1 sesión»",app=>{
      terminar(app,"gym_empuje");tab(app,"home");
      expect(app.texto("#todayCard")).toContain("Completaste Empuje · 0 semanas cumplidas");
      expect(app.texto("#todayCard")).not.toContain("mejor");
      tab(app,"progress");
      const h=historial(app);
      expect(h.slice(0,2)).toEqual(["0 semanas cumplidas","1 sesión · 1 de fuerza"]);
      expect(h[2]).toMatch(/^\d+ series registradas$/);
      tab(app,"settings");
      expect(app.texto("#dataInfo")).toBe("Guardado: 1 sesión · 1 en historial · racha 0 semanas.");});
    test("«Tu historial» con una sola serie registrada: «1 serie registrada»",app=>{
      app.sembrar({rp_logs:{press_banca_db:[{date:F.fecha(0),sets:[{w:30,reps:8}],k:"gym_empuje",t:1}]}});
      tab(app,"progress");
      expect(historial(app)[2]).toBe("1 serie registrada");
      app.reiniciarMemoria();});
  });

  /* la mejor racha en pantalla con cifras contadas a mano, no leidas de
     weekStats(): Fixtures.cambioHora con el reloj el miercoles 4 de noviembre
     de 2026, en Madrid (cambios de hora el 29 de marzo y el 25 de octubre) y
     en Santiago de Chile (el 5 de abril). Antes salia «mejor 4» y «mejor 5». */
  ["Europe/Madrid","America/Santiago"].forEach(zona=>{
    escenario("Racha única · mejor racha que cruza cambios de hora ("+zona+")",F.cambioHora,()=>{
      test("Inicio, «Listo por hoy», pantalla de fin, Progreso y Ajustes: mejor 8",async app=>{
        await app.enZona(zona,()=>{
          tab(app,"home");
          expect(app.texto("#stCount")).toBe("3");
          expect(app.texto("#stWeek")).toBe("2 de 3 esta semana");
          expect(app.texto("#todayCard")).toContain("¡Listo por hoy!");
          expect(app.texto("#todayCard")).toContain("3 semanas cumplidas · mejor 8");
          tab(app,"progress");
          expect(bloque(app,"Tu historial")).toContain("3 semanas cumplidas · mejor 8");
          /* el viernes de esta semana se adelanta: es la sesion que la cumple */
          terminar(app,"gym_pierna");
          expect(app.texto("#guided .donest")).toBe("Esta semana: 3 de 3");
          expect(app.texto("#guided .doneok")).toBe("Semana cumplida · 4 seguidas");
          expect(app.texto("#guided .donesub")).toMatch(/^Mejor racha: 8 semanas · \d+ sesiones en total$/);
          tab(app,"home");
          expect(app.texto("#stCount")).toBe("4");
          expect(app.texto("#todayCard")).toContain("4 semanas cumplidas · mejor 8");
          tab(app,"progress");
          expect(bloque(app,"Tu historial")).toContain("4 semanas cumplidas · mejor 8");
          tab(app,"settings");
          expect(app.texto("#dataInfo")).toContain("racha 4 semanas");
        },"2026-11-04T12:30:00Z");
        app.reiniciarMemoria();});
    });
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
