/* Humo de pantallas: con cada juego de datos se recorre Inicio, el detalle de
   una rutina, el modo guiado, Calendario, Progreso y Ajustes con las mismas
   funciones y botones que usa la persona, y se comprueba que se pinta algo.
   Cualquier error de la app durante el recorrido hace fallar la prueba. */
(function(){
  const F=Fixtures;
  const tab=(app,v)=>{app.$('.nav .tab[data-v="'+v+'"]').click();};

  /* Calendario pinta el mes en curso. Los juegos de datos traen sesiones de
     ayer hacia atras: el dia 1 (y el 2 o el 3 si los anteriores no tocan
     entreno) el mes en curso aun no tiene ninguna, y se cuentan las del
     anterior. calShift(1) lo devuelve al mes en curso */
  function calendario(app,o){
    tab(app,"history");
    expect(app.activa()).toBe("history");
    const dias=app.$$("#histBody .calcell:not(.empty)").length;
    expect(dias>=28&&dias<=31).toBe(true);
    let marcados=app.$$("#histBody .calcell.has").length;
    if(o.conHistorial&&!marcados){app.w.calShift(-1);marcados=app.$$("#histBody .calcell.has").length;app.w.calShift(1);}
    expect(marcados>0).toBe(o.conHistorial);
    expect(app.$$("#histBody .calcell.istoday").length).toBe(1);
    /* el ultimo dia entrenado muestra su sesion y sus series */
    const h=app.leer("rp_history");
    if(h&&h.length){const p=h[0].date.split("/");app.w.calPick(p[2]+"-"+p[1]+"-"+p[0]);
      expect(app.$$("#histBody .dayblock").length).toBeGreaterThan(0);
      expect(app.texto("#histBody .dayblock")).toContain(h[0].name);}}

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
      test("Calendario: mes pintado y dias con actividad",app=>calendario(app,o));
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

  /* el mismo recorrido de Calendario con el reloj en un dia 1, cuando el mes
     en curso aun no tiene sesiones: los datos se generan como si hoy fuera el
     1 de octubre de 2026 y la app pinta con el reloj parado ahi */
  [["dueño",F.dueno],["madre",F.madre]].forEach(([nombre,juego])=>{
    const UNO="2026-10-01T10:00:00Z";
    escenario("Pantallas · Calendario el día 1 del mes ("+nombre+")",()=>Pruebas.conReloj("UTC",UNO,juego),()=>{
      test("mes pintado y dias con actividad tambien el dia 1",async app=>{
        await app.enZona("UTC",()=>{app.ev("calY=null;calM=null;calSel=null");
          expect(app.w.today()).toBe("2026-10-01");
          calendario(app,{conHistorial:true});
          app.ev("calY=null;calM=null;calSel=null");},UNO);});
    });
  });

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

  /* los juegos con una sesion de hoy a medias la empiezan hoy, tambien si las
     pruebas corren entre las 00:00 y las 00:25 (UTC en la CI): si empezara
     ayer, al terminarla la app la apuntaria en ayer y las pruebas de racha
     de madre fallarian */
  escenario("Juegos de datos · sesión de hoy pasada la medianoche",F.vacio,()=>{
    [["madre",F.madre],["aMedias",F.aMedias]].forEach(([nombre,juego])=>{
      ["2026-11-02T00:05:00Z","2026-11-02T00:19:00Z","2026-11-02T12:00:00Z"].forEach(ahora=>{
        test(nombre+" a las "+ahora.slice(11,16)+" (UTC): rp_session empieza hoy y no despues de ahora",()=>{
          const s=Pruebas.conReloj("UTC",ahora,juego).rp_session;
          expect(s.date).toBe("2026-11-02");
          expect(new Date(s.startedAt).toISOString().slice(0,10)).toBe("2026-11-02");
          expect(s.startedAt<=Date.parse(ahora)).toBe(true);});});});
  });

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
      const h=app.leer("rp_history");
      expect(h.length).toBe(1);expect(app.w.ds(new Date(h[0].iso))).toBe(F.fecha(1));
      /* HU-63: la de ayer se cierra al entrar, pero la de hoy no nace hasta
         lo primero que se registra. Saltar no registra nada: el saltado vive
         en memoria y entra en rp_session con el visto del siguiente */
      expect(app.leer("rp_session")).toBe(null);
      expect(app.ev("stepi")).toBe(0);
      app.w.guidedSkipExercise();
      expect(app.ev("sessSaltados")).toEqual(["caminadora"]);
      const seg=paso(app);for(let n=0;n<300&&paso(app)===seg;n++)app.w.advance();
      const s=app.leer("rp_session");
      expect([s.date,s.saltados]).toEqual([F.fecha(0),["caminadora"]]);
      hastaElFinal(app);
      expect(app.$("#guided .finlist")).toBe(null);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      expect([app.leer("rp_history")[0].exDone,app.leer("rp_history")[0].exTotal]).toEqual([13,14]);
      app.reiniciarMemoria();});
  });

  /* Borrar una serie (HU-54): las zonas de toque de la fila y el aviso.
     La zona se mide como la ve el dedo: elementFromPoint ve los
     pseudo-elementos que agrandan un control y lo que otro tapa encima. */
  function conSerie(){const ini=F.inicio(20);
    return {rp_session:{v:1,key:"gym_empuje",date:F.fecha(0),startedAt:ini,lastAt:ini,stepi:0,src:"guided",
      log:{press_banca_db:[{w:122.5,reps:12,t:ini+60000,rir:3},{w:22.5,reps:8,t:ini+240000},{w:22.5,reps:7,t:ini+420000,rir:0}]}}};}
  /* la serie 1 con su record, como lo pinta HU-10 */
  function conRecord(){const s=conSerie();s.rp_session.pr=[{id:"press_banca_db",w:122.5,reps:12,lvl:2,i:0,kind:"Peso máximo"}];return s;}
  function abrir(app,semilla){app.w.toastFuera();app.reiniciarMemoria();app.sembrar(semilla||conSerie);
    app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");app.$("#toast").innerHTML="";
    expect(app.activa()).toBe("guided");}
  /* Se mide la pantalla quieta, la que toca el dedo: las entradas que aun
     corren (el fade de la vista, 0,22 s, y el stageIn del paso) se terminan
     antes. Abrir el guiado con el guiado ya en pantalla no reinicia el fade
     de la vista: con reloj real (Playwright) puede ir a medias, y con un
     translateY a medias getBoundingClientRect da 43,99997 de alto a una caja
     de 44. Las infinitas (las figuras) no se tocan: no tienen final. */
  function quieta(app){app.doc.getAnimations().forEach(a=>{
    const fin=a.effect&&a.effect.getComputedTiming().endTime;if(isFinite(fin))a.finish();});}
  /* Zona de toque de un control: lo que mide (su caja o el pseudo-elemento
     que la agranda) y si es suya. Un cuadrado de 44 px centrado en el control
     tiene que caer en el: si otro lo tapa, no es suya. El cuadrado va a 21,4
     del centro porque elementFromPoint redondea el punto hasta medio pixel, y
     sin esquinas de 10 px porque el navegador respeta el border-radius al
     decidir que se toca: un campo redondeado las deja pasar al padre. */
  function zona(app,el){quieta(app);
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,m=21.4,ajenos=[];
    const ps=app.w.getComputedStyle(el,"::after"),con=ps.content&&ps.content!=="none"&&ps.display!=="none";
    for(let dy=-m;dy<=m+1e-6;dy+=m/6)for(let dx=-m;dx<=m+1e-6;dx+=m/6){
      if(Math.abs(dx)>12&&Math.abs(dy)>12)continue;
      const h=app.doc.elementFromPoint(cx+dx,cy+dy);
      if(!h||!(h===el||el.contains(h)))ajenos.push(Math.round(dx)+","+Math.round(dy)+"→"+(h?(h.className&&h.className.baseVal!=null?h.className.baseVal:h.className)||h.tagName:"nada"));}
    return {ancho:Math.max(r.width,con?parseFloat(ps.width)||0:0)>=44,alto:Math.max(r.height,con?parseFloat(ps.height)||0:0)>=44,ajenos:ajenos};}
  const z44={ancho:true,alto:true,ajenos:[]};
  /* la pagina a px de ancho util, como en un telefono de px. En CI Chrome
     pinta la barra de desplazamiento clasica, de 15 px, y un iframe de 320
     dejaba la pagina en 305: mas estrecha que cualquier telefono, donde la
     barra flota sin ocupar sitio (con Playwright tampoco ocupa). El iframe se
     ensancha lo que mida la barra, y se comprueba que la pagina mide px */
  function anchoUtil(app,px){app.frame.style.width=px+"px";
    const barra=app.w.innerWidth-app.doc.documentElement.clientWidth;
    if(barra>0)app.frame.style.width=(px+barra)+"px";
    expect(app.doc.documentElement.clientWidth).toBe(px);}
  /* contraste WCAG entre dos colores "rgb(r, g, b)" */
  function lum(c){return c.match(/\d+(\.\d+)?/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);})
    .reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);}
  const contraste=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
  /* "Serie borrada", no "Serie Borrada" ni "¡Serie borrada!" (DISENO 11) */
  const voz=t=>{expect(t).not.toContain("!");expect(t.slice(1)).toBe(t.slice(1).toLowerCase());};
  escenario("Pantallas · borrar una serie (zonas de toque y aviso)",conSerie,()=>{
    test("la cifra, la X, los campos y el visto de cada serie miden 44 px y no se pisan, a 400 y a 320 px",app=>{
      try{for(const ancho of [400,320]){app.frame.style.width=ancho+"px";abrir(app);anchoUtil(app,ancho);
          app.$("#guided .sets").scrollIntoView({block:"center"});
          expect(app.doc.documentElement.scrollWidth).toBe(app.doc.documentElement.clientWidth);
          app.$$("#guided .sets .setline").forEach(l=>{
            expect(zona(app,l.querySelector(".v"))).toEqual(z44);
            expect(zona(app,l.querySelector(".del"))).toEqual(z44);});
          /* editando: dos campos y el visto junto a la X (a 320 px el visto perdia 5 px bajo la X) */
          app.$("#sl_press_banca_db_0 .v").click();
          expect(app.$("#se_w")).toBeTruthy();
          const fila=app.$("#sl_press_banca_db_0");
          expect(fila.getBoundingClientRect().height).toBeLessThan(50);
          ["#se_w","#se_r",".setok",".del"].forEach(sel=>expect(zona(app,fila.querySelector(sel))).toEqual(z44));
          /* las filas vecinas siguen enteras */
          expect(zona(app,app.$("#sl_press_banca_db_1 .del"))).toEqual(z44);
          expect(zona(app,app.$("#sl_press_banca_db_1 .v"))).toEqual(z44);}}
      finally{app.frame.style.width="400px";}
      app.reiniciarMemoria();});
    /* HU-10 pone la marca en su propia linea, bajo la cifra: la X de 44 baja
       10 px por esa linea, y la marca, pintada despues, se quedaba ese trozo */
    test("en una serie récord la marca no tapa la X ni la cifra, a 400 y a 320 px",app=>{
      try{for(const ancho of [400,320]){app.frame.style.width=ancho+"px";abrir(app,conRecord);anchoUtil(app,ancho);
          app.$("#guided .sets").scrollIntoView({block:"center"});
          const l=app.$("#sl_press_banca_db_0");
          expect(l.classList.contains("pr")).toBe(true);
          expect(app.texto("#sl_press_banca_db_0 .prtag")).toBe("Peso máximo");
          expect(zona(app,l.querySelector(".v"))).toEqual(z44);
          expect(zona(app,l.querySelector(".del"))).toEqual(z44);
          /* la de debajo, sin marca, sigue entera */
          expect(zona(app,app.$("#sl_press_banca_db_1 .v"))).toEqual(z44);
          expect(zona(app,app.$("#sl_press_banca_db_1 .del"))).toEqual(z44);}}
      finally{app.frame.style.width="400px";}
      app.reiniciarMemoria();});
    test("cada X dice qué serie borra",app=>{abrir(app);
      expect(app.$$("#guided .sets .del").map(d=>d.getAttribute("aria-label"))).toEqual(["Borrar serie 1","Borrar serie 2","Borrar serie 3"]);
      app.$$("#guided .sets .del").forEach(d=>{expect(d.getAttribute("role")).toBe("button");expect(d.getAttribute("tabindex")).toBe("0");});
      app.reiniciarMemoria();});
    test("el aviso se anuncia, habla como la app y usa el rojo destructivo en los dos temas",app=>{
      const raiz=app.doc.documentElement,tema=raiz.getAttribute("data-theme");
      try{for(const t of ["light","dark"]){raiz.setAttribute("data-theme",t);abrir(app);
          app.$("#sl_press_banca_db_1 .del").click();
          const el=app.$("#toast"),cs=app.w.getComputedStyle(el);
          /* region viva: lo que entra se lee sin mover el foco */
          expect(el.getAttribute("role")).toBe("status");
          expect(el.getAttribute("aria-live")).toBe("polite");
          expect(el.closest("[aria-hidden]")).toBe(null);
          expect(el.classList.contains("show")).toBe(true);
          const msg=app.texto("#toast .tmsg"),b=app.$("#toast .tact");
          expect(msg).toBe("Serie borrada");voz(msg);
          expect(b.tagName).toBe("BUTTON");expect(b.textContent).toBe("Deshacer");voz(b.textContent);
          /* la X del aviso es la del rojo destructivo, no el ambar del logro */
          const ic=app.$("#toast .ic"),rojo=app.w.getComputedStyle(ic).color;
          const tok=n=>{const p=app.doc.createElement("i");p.style.color="var("+n+")";el.appendChild(p);
            const c=app.w.getComputedStyle(p).color;p.remove();return c;};
          expect(rojo).toBe(tok("--danger-hero"));
          expect(rojo).not.toBe(tok("--energy-hero"));
          /* contra cada tono del degradado del hero, todo por encima de 4,5:1
             (al icono, como grafico, le bastaria 3:1) */
          const fondos=cs.backgroundImage.match(/rgba?\([^)]*\)/g);
          expect(fondos.length).toBeGreaterThan(1);
          fondos.forEach(f=>{expect(contraste(rojo,f)).toBeGreaterThan(4.5);
            expect(contraste(app.w.getComputedStyle(b).color,f)).toBeGreaterThan(4.5);
            expect(contraste(cs.color,f)).toBeGreaterThan(4.5);});
          /* el boton se toca en 44 px; el resto del aviso recibe el toque y
             no lo deja pasar a lo que tapa (abajo, «nada atraviesa el aviso») */
          expect(zona(app,b)).toEqual(z44);
          const m=app.$("#toast .tmsg").getBoundingClientRect();
          expect(el.contains(app.doc.elementFromPoint(m.left+m.width/2,m.top+m.height/2))).toBe(true);
          /* un segundo borrado cambia el texto, y la region lo vuelve a leer */
          app.$("#sl_press_banca_db_1 .del").click();
          expect(app.texto("#toast .tmsg")).toBe("2 series borradas");voz(app.texto("#toast .tmsg"));
          app.$("#toast .tact").click();
          expect(app.texto("#toast")).toBe("2 series recuperadas");voz(app.texto("#toast"));}}
      finally{if(tema)raiz.setAttribute("data-theme",tema);else raiz.removeAttribute("data-theme");}
      app.reiniciarMemoria();});
    /* el aviso no recibia toques salvo en su boton: tocar el texto o la X roja
       de «Serie borrada» activaba lo que hubiera debajo (con los datos del
       dueno, el chip «¿De cuánto sube?»; con los de la madre a 320 px y letra
       grande, «Una serie menos», que guardaba otra dosis sin que se viera).
       Se toca el aviso entero, punto a punto, como el dedo: elementFromPoint
       y un click en lo que devuelve. Nada sale del aviso ni cambia los datos */
    function tocaAviso(app){const el=app.$("#toast"),r=el.getBoundingClientRect(),b=el.querySelector(".tact"),fuera=[];
      const zb=b&&b.getBoundingClientRect(),enBoton=(x,y)=>zb&&x>zb.left-24&&x<zb.right+24&&y>zb.top-24&&y<zb.bottom+24;
      /* la pildora: las esquinas que el borde redondeado deja fuera no son
         aviso (el navegador respeta el border-radius al decidir que se toca) */
      const rad=Math.min(r.height/2,parseFloat(app.w.getComputedStyle(el).borderTopLeftRadius)||0);
      const enPildora=(x,y)=>{const dx=Math.max(r.left+rad-x,x-(r.right-rad),0),dy=Math.max(r.top+rad-y,y-(r.bottom-rad),0);
        return dx*dx+dy*dy<(rad-1.5)*(rad-1.5)||!dx||!dy;};
      for(let y=r.top+1;y<r.bottom-1;y+=4)for(let x=r.left+1;x<r.right-1;x+=4){
        if(enBoton(x,y)||!enPildora(x,y))continue;
        const e=app.doc.elementFromPoint(x,y);
        if(!e||!el.contains(e)){const c=e&&e.closest("button,[role=button],input,summary,a");
          const q=c?"«"+(c.getAttribute("aria-label")||c.textContent.trim().slice(0,25))+"»":e?String(e.className||e.tagName):"nada";
          if(fuera.indexOf(q)<0)fuera.push(q);}
        else{e.dispatchEvent(new app.w.MouseEvent("click",{bubbles:true,cancelable:true,clientX:x,clientY:y}));if(!b)return fuera;}}   /* sin boton: el primer toque lo cierra */
      return fuera;}
    test("nada atraviesa el aviso: tocar su texto o su X no llega a lo que tapa, a 320, 360 y 375 px",app=>{
      const raiz=app.doc.documentElement,datos=()=>Object.keys(app.w.localStorage).filter(k=>k!=="rp_session").sort()
        .map(k=>k+"="+app.w.localStorage.getItem(k)).join("\n");
      try{for(const ancho of [320,360,375])for(const pct of [100,130]){
          app.frame.style.width=ancho+"px";raiz.style.fontSize=pct===100?"":pct+"%";
          abrir(app);anchoUtil(app,ancho);
          app.$("#sl_press_banca_db_2 .del").click();quieta(app);
          expect(app.texto("#toast .tmsg")).toBe("Serie borrada");
          const antes=datos(),dosis=app.w.dose("gym_empuje","press_banca_db").sets;
          expect([ancho,pct,tocaAviso(app)]).toEqual([ancho,pct,[]]);
          /* sigue a la vista, con su Deshacer, y nada cambio por debajo */
          expect(app.$("#toast").classList.contains("show")).toBe(true);
          expect(app.ev("deshacer")).toHaveLength(1);
          expect(datos()).toBe(antes);
          expect(app.w.dose("gym_empuje","press_banca_db").sets).toBe(dosis);
          expect(app.ev("sessionLog").press_banca_db).toHaveLength(2);
          app.$("#toast .tact").click();
          expect(app.ev("sessionLog").press_banca_db).toHaveLength(3);
          /* el aviso sin boton tampoco deja pasar el toque: lo cierra */
          app.w.toast(app.w.ic("check","sm")+" Salto de 4.5 kg guardado");quieta(app);
          const antes2=datos();
          expect([ancho,pct,tocaAviso(app)]).toEqual([ancho,pct,[]]);
          expect(app.$("#toast").classList.contains("show")).toBe(false);
          expect(datos()).toBe(antes2);}}
      finally{raiz.style.fontSize="";app.frame.style.width="400px";}
      app.reiniciarMemoria();});
    /* el caso encontrado: los datos del dueno en la prensa, con letra normal.
       El aviso salia arriba y su texto caia sobre el chip «¿De cuánto sube?»
       (en el arnes, sobre el peso: tocarlo abria el campo). Ahora busca un
       hueco donde no tape ningun control y, si lo tapa, se queda el toque */
    test("con los datos del dueño en la prensa, tocar el aviso no abre ni cambia nada, a 320, 360 y 375 px",app=>{
      const conPrensa=()=>{const d=F.dueno(),ini=F.inicio(20);delete d.rp_inc;
        d.rp_session={v:1,key:"gym_pierna",date:F.fecha(0),startedAt:ini,lastAt:ini,stepi:0,src:"guided",
          log:{prensa_inclinada:[{w:200,reps:10,t:ini+60000}]}};return d;};
      try{for(const ancho of [320,360,375]){app.frame.style.width=ancho+"px";
          app.w.toastFuera();app.reiniciarMemoria();app.sembrar(conPrensa);
          app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");anchoUtil(app,ancho);
          const chip=app.$("#incchip");expect(chip.textContent).toBe("¿De cuánto sube?");
          app.$("#guided .setline .del").scrollIntoView({block:"center"});
          app.$("#guided .setline .del").click();quieta(app);
          expect(app.texto("#toast .tmsg")).toBe("Serie borrada");
          const antes=JSON.stringify(app.ev("sessionLog"));
          expect([ancho,tocaAviso(app)]).toEqual([ancho,[]]);
          expect(chip.getAttribute("aria-expanded")).toBe("false");
          expect(app.$("#numin")).toBe(null);
          expect(JSON.stringify(app.ev("sessionLog"))).toBe(antes);
          expect(app.leer("rp_inc")).toBe(null);
          expect(app.$("#toast").classList.contains("show")).toBe(true);}}
      finally{app.frame.style.width="400px";}
      app.reiniciarMemoria();});
    /* El aviso usa el ancho que declara, el 86 % de la pantalla: si su texto
       cabe en una linea, va en una; si no, el aviso llega a ese 86 % antes de
       partirse, y se parte en las lineas que pide su largo. Que quepa o no
       depende de la letra (con DejaVu Sans, «Salto quitado: vuelven los de
       siempre» no cabe a 320 px), asi que se mide con la que pinta: el largo
       del texto en una sola linea y las lineas que ocupa. El largo se compara
       con el sitio que el aviso deja al texto (su contenido menos el icono,
       los huecos y el boton), no con lo que mide el texto: medido contra su
       propia caja, un texto metido en una columna estrecha dentro de una
       pildora del 86 % cuadraba (5 lineas en una columna de 40 %). Con el
       texto entero en ese sitio, una linea; si no, las que pide mas una (el
       corte va por palabras). max es el ancho declarado. Devuelve los
       problemas */
    function usaElAncho(app,el,max){const w=app.w,s=el.querySelector(".tmsg"),out=[],txt="«"+el.textContent.trim()+"»";
      const cs=w.getComputedStyle(s),linea=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.45;
      const lineas=Math.round(s.getBoundingClientRect().height/linea);
      const rg=app.doc.createRange();s.style.whiteSpace="nowrap";rg.selectNodeContents(s);
      const entero=rg.getBoundingClientRect().width;s.style.whiteSpace="";
      const ce=w.getComputedStyle(el),hijos=[...el.children],
        resto=hijos.filter(h=>h!==s).reduce((a,h)=>{const c=w.getComputedStyle(h);
          return a+h.getBoundingClientRect().width+parseFloat(c.marginLeft)+parseFloat(c.marginRight);},0),
        util=el.clientWidth-parseFloat(ce.paddingLeft)-parseFloat(ce.paddingRight)-resto-(parseFloat(ce.columnGap)||0)*(hijos.length-1);
      if(max==null)max=w.innerWidth*0.86;const caja=el.getBoundingClientRect().width;
      if(caja>max+0.5)out.push(txt+": el aviso mide "+caja.toFixed(1)+" px, mas de lo que declara ("+max.toFixed(1)+")");
      if(lineas>1&&caja<max-1)out.push(txt+": en "+lineas+" lineas con "+caja.toFixed(1)+" px de los "+max.toFixed(1)+" que tiene");
      const pide=entero<=util+0.5?1:Math.ceil(entero/util)+1;
      if(lineas>pide)out.push(txt+": "+lineas+" lineas para "+entero.toFixed(0)+" px de texto con "+util.toFixed(0)+" px de sitio (pide "+pide+")");
      return out;}
    /* el aviso centrado con left:50% solo tenia media pantalla para encoger:
       los avisos nuevos se partian en 2-5 lineas, y el parche de nowrap
       sacaba «Deshacer» de la pildora con letra grande */
    test("los avisos usan el 86 % del ancho: en una línea si caben, y con letra grande Deshacer queda dentro",app=>{
      /* «caben en una linea» era verdad con Inter: con DejaVu Sans «Salto
         quitado: vuelven los de siempre» pide dos a 320 px. Lo que se exige
         con cualquier letra es lo que arreglo HU-54: el aviso usa su 86 %
         antes de partirse (centrado con left:50% se partia en tres lineas, y
         el de record en cinco) */
      const el=app.$("#toast"),raiz=app.doc.documentElement,ic=(n,c)=>app.w.ic(n,c),mal=[];
      const caja=html=>{app.w.toast(html);quieta(app);mal.push(...usaElAncho(app,el));return el.getBoundingClientRect();};
      try{for(const ancho of [320,375]){app.frame.style.width=ancho+"px";abrir(app);anchoUtil(app,ancho);
          ["Ok","Salto quitado: vuelven los de siempre",ic("check","sm")+" Salto de 4.5 kg guardado",ic("check","sm")+" Serie recuperada",
            ic("trophy","sm")+" Récord en "+app.w.esc(app.w.shortName("press_banca_db"))+": <b>122.5 kg × 12</b>"]
            .forEach(t=>{const r=caja(t);
              expect(r.left).toBeGreaterThan(0);expect(r.right).toBeLessThan(ancho);
              /* centrado */
              expect(Math.abs((r.left+r.right)/2-ancho/2)).toBeLessThan(1);});}
        expect(mal).toEqual([]);
        /* letra grande a 320: la pildora se parte en dos lineas y el boton sigue dentro y entero */
        app.frame.style.width="320px";abrir(app);anchoUtil(app,320);
        raiz.style.setProperty("--t-sm","20px");
        app.$("#sl_press_banca_db_1 .del").click();quieta(app);
        const t=el.getBoundingClientRect(),b=app.$("#toast .tact").getBoundingClientRect();
        expect(b.left).not.toBeLessThan(t.left);expect(b.right).not.toBeGreaterThan(t.right);
        expect(t.left).not.toBeLessThan(0);expect(t.right).not.toBeGreaterThan(320);
        expect(app.texto("#toast .tact")).toBe("Deshacer");
        expect(b.height).toBeLessThan(t.height);}
      finally{raiz.style.removeProperty("--t-sm");app.frame.style.width="400px";}
      app.reiniciarMemoria();});
    /* abajo, el boton Deshacer caia sobre «Registrar serie», el + o «Nota
       fija»: volver a registrar justo despues de borrar deshacia. Se mide
       como el dedo: cada control del guiado, punto a punto, no da en el aviso */
    test("el Deshacer no pisa ningún control del guiado (de 320x568 a 412x915, con 1, 3 y 6 series)",app=>{
      const conN=n=>()=>{const s=conSerie(),l=s.rp_session.log.press_banca_db,t=s.rp_session.startedAt;
        s.rp_session.log.press_banca_db=Array.from({length:n},(_,i)=>Object.assign({},l[i%3],{t:t+(i+1)*60000}));return s;};
      const pisados=[];
      try{for(const [w,h] of [[320,568],[360,640],[375,667],[400,800],[412,915]])for(const n of [1,3,6]){
          app.frame.style.height=h+"px";app.frame.style.width=w+"px";abrir(app,conN(n));anchoUtil(app,w);
          const filas=app.$$("#guided .sets .setline"),ult=filas[filas.length-1];
          expect(filas).toHaveLength(n);
          ult.scrollIntoView({block:"nearest"});ult.querySelector(".del").click();quieta(app);
          const t=app.$("#toast"),tr=t.getBoundingClientRect(),bt=t.querySelector(".tact");
          expect(app.texto("#toast .tmsg")).toBe("Serie borrada");
          expect(tr.top).toBeGreaterThan(0);expect(tr.bottom).toBeLessThan(app.w.innerHeight);
          /* el boton y su zona de 44 px (el resto del aviso se queda el toque
             sin hacer nada: «nada atraviesa el aviso») */
          app.$$("#guided button,#guided [role=button],#guided input").forEach(c=>{const r=c.getBoundingClientRect();
            if(!r.width||r.bottom<0||r.top>app.w.innerHeight)return;
            for(let y=r.top+2;y<r.bottom-1;y+=4)for(let x=r.left+2;x<r.right-1;x+=4){
              const e=app.doc.elementFromPoint(x,y);
              if(e&&bt.contains(e)){pisados.push(w+"x"+h+" n="+n+" "+(c.className||c.tagName)+" "+c.textContent.trim().slice(0,20));return;}}});}}
      finally{app.frame.style.height="800px";app.frame.style.width="400px";}
      expect(pisados).toEqual([]);
      app.reiniciarMemoria();});
    /* el aviso se colocaba una sola vez, al salir: si en sus 7 s la pagina se
       desplazaba y «Registrar serie», el + o «Nota fija» pasaban bajo el
       Deshacer, tocarlos deshacia. Se recorre la pagina de arriba abajo y en
       cada parada se mide como el dedo, donde el aviso y el control coinciden */
    test("con la página desplazada el Deshacer sigue sin pisar ningún control",app=>{
      const conN=n=>()=>{const s=conSerie(),l=s.rp_session.log.press_banca_db,t=s.rp_session.startedAt;
        s.rp_session.log.press_banca_db=Array.from({length:n},(_,i)=>Object.assign({},l[i%3],{t:t+(i+1)*60000}));return s;};
      const pisados=[],fuera=[];let paradas=0;
      try{for(const [w,h] of [[320,568],[375,667],[412,915]])for(const n of [3,6]){
          app.frame.style.height=h+"px";app.frame.style.width=w+"px";abrir(app,conN(n));anchoUtil(app,w);
          const filas=app.$$("#guided .sets .setline");
          filas[filas.length-1].querySelector(".del").click();quieta(app);
          expect(app.texto("#toast .tmsg")).toBe("Serie borrada");
          const max=app.doc.documentElement.scrollHeight-app.w.innerHeight;
          for(let y=0;y<=max;y+=12){app.w.scrollTo(0,y);app.w.dispatchEvent(new app.w.Event("scroll"));quieta(app);paradas++;
            const t=app.$("#toast"),tr=t.getBoundingClientRect(),bt=t.querySelector(".tact");
            if(tr.top<0||tr.bottom>app.w.innerHeight)fuera.push(w+"x"+h+" n="+n+" y="+y);
            app.$$("#guided button,#guided [role=button],#guided input").forEach(c=>{const r=c.getBoundingClientRect();
              const x0=Math.max(r.left,tr.left)+1,x1=Math.min(r.right,tr.right)-1,y0=Math.max(r.top,tr.top,0)+1,y1=Math.min(r.bottom,tr.bottom)-1;
              if(!r.width||x0>=x1||y0>=y1)return;
              for(let yy=y0;yy<=y1;yy+=3)for(let x=x0;x<=x1;x+=3){const e=app.doc.elementFromPoint(x,yy);
                if(e&&bt.contains(e)){pisados.push(w+"x"+h+" n="+n+" y="+y+" "+(c.className||c.tagName)+" "+c.textContent.trim().slice(0,20));return;}}});}
          app.w.scrollTo(0,0);}}
      finally{app.frame.style.height="800px";app.frame.style.width="400px";}
      expect(paradas).toBeGreaterThan(30);
      expect(fuera).toEqual([]);
      expect(pisados).toEqual([]);
      app.reiniciarMemoria();});
    /* el aviso se colocaba ANTES de repintar el paso (delSet: ofrecerDeshacer
       y luego renderStep), con la disposicion de antes de borrar: con los
       datos de la madre a 320 px y letra al 130 %, el Deshacer quedaba sobre
       el + de «Series». Tiene que quedar donde lo pondria colocaAviso con la
       pagina ya repintada, y su boton sin pisar ningun control */
    /* y el aviso entero tampoco tapa ningun control: lo que tapa no se puede
       tocar en sus 7 s. Con DejaVu Sans «Serie borrada» se partia a 320 px y
       al 130 % (el aviso, de 48 a 71 px de alto) y tapaba «Una serie menos»
       y «Una serie más» a 320x760, o volvia abajo sobre «Nota fija». Ahora va
       en una linea, y el unico sitio sin hueco para el aviso entero es
       320x568 con letra grande, borrando la primera serie: la pantalla es
       control de arriba abajo, sin 48 px libres entre dos (DISENO §13, HU-54,
       lo que queda abierto) */
    test("tras borrar, el aviso se coloca con la página ya repintada (madre, 320 px, letra al 130 %)",async app=>{
      const raiz=app.doc.documentElement,mal=[],tapan=[];let casos=0,sinHueco=0;
      /* sin barras de scroll que ocupen sitio, como en el telefono: con la
         de 15 px del Chrome de las pruebas, a «320 px» la ventana mide 335 y
         el 86 % del aviso, en vw, tenia 13 px mas que en el telefono (con
         DejaVu Sans, justo lo que «Serie borrada» necesitaba para no
         partirse: la prueba no veia lo que pasaba en el telefono) */
      const sinBarras=app.doc.createElement("style");sinBarras.textContent="*{scrollbar-width:none}";app.doc.head.appendChild(sinBarras);
      try{for(const [w,h] of [[320,760],[320,640],[320,568],[360,640]])for(const pct of [100,115,130])for(const cual of ["primera","última"]){
          app.frame.style.width=w+"px";app.frame.style.height=h+"px";raiz.style.fontSize=pct===100?"":pct+"%";
          app.w.toastFuera();app.reiniciarMemoria();app.sembrar(F.madre);
          app.w.openRoutine("salud_fuerza_b");app.w.startRoutine("remo_db");anchoUtil(app,w);
          app.ev("curW=9;curReps=12");app.w.logSet();app.w.skipRest();
          expect(app.ev("sessionLog").remo_db).toHaveLength(2);
          const filas=app.$$("#guided .sets .setline"),x=(cual==="primera"?filas[0]:filas[filas.length-1]).querySelector(".del");
          /* el desplazamiento, antes de borrar, como el dedo (su evento
             scroll recolocaria el aviso). Se mide con la entrada del paso
             repintado terminada (quieta), donde se quedan los controles */
          x.scrollIntoView({block:"center"});await app.espera(20);
          x.click();quieta(app);casos++;
          const t=app.$("#toast"),bt=t.querySelector(".tact");
          expect(app.texto("#toast .tmsg")).toBe("Serie borrada");
          const donde=[t.className,t.style.top];app.w.colocaAviso(t,true);quieta(app);
          const caso=w+"x"+h+" "+pct+"% "+cual;
          if(JSON.stringify([t.className,t.style.top])!==JSON.stringify(donde))mal.push(caso+": "+donde[1]+" en vez de "+t.style.top);
          app.w.colocaAviso(t,donde[0].indexOf("arriba")>=0);if(donde[1])t.style.top=donde[1];quieta(app);
          /* «Serie borrada» y Deshacer en una linea, con el ancho que declara
             el aviso con boton (hasta 8 px del borde) */
          if(app.w.innerWidth!==w)mal.push(caso+": la ventana mide "+app.w.innerWidth+" px");
          mal.push(...usaElAncho(app,t,w-16).map(m=>caso+": "+m));
          const ms=t.querySelector(".tmsg"),lh=parseFloat(app.w.getComputedStyle(ms).lineHeight);
          if(ms.getBoundingClientRect().height>lh*1.5)mal.push(caso+": «Serie borrada» partido en "+Math.round(ms.getBoundingClientRect().height/lh)+" lineas");
          const tr=t.getBoundingClientRect(),bajo=[];
          app.$$("#guided button,#guided [role=button],#guided input,#guided summary,#guided a").forEach(c=>{const r=c.getBoundingClientRect();
            const x0=Math.max(r.left,tr.left)+1,x1=Math.min(r.right,tr.right)-1,y0=Math.max(r.top,tr.top)+1,y1=Math.min(r.bottom,tr.bottom)-1;
            if(!r.width||x0>=x1||y0>=y1)return;
            for(let yy=y0;yy<=y1;yy+=3)for(let xx=x0;xx<=x1;xx+=3){const e=app.doc.elementFromPoint(xx,yy);
              if(e&&t.contains(e)){bajo.push(c.getAttribute("aria-label")||c.textContent.trim().slice(0,20));return;}}});
          if(bajo.length)tapan.push(caso+": tapa «"+bajo.join("», «")+"»");
          /* y si tapa, es que no habia ningun hueco a ninguna altura, ni
             centrado ni movido a un lado (de 8 en 8 hasta 8 px del borde,
             como lo prueba colocaAviso): se prueban todas las alturas, de
             pixel en pixel (de 8 en 8 se saltaba los huecos justos, con 6 px
             de recorrido). Y de donde al menos Deshacer queda libre, esta en
             el que menos superficie de controles tapa */
          if(app.w.avisoPisa(t,null,true)){const l=t.style.left,r=t.style.right;t.style.left=t.style.right="";
            const xc=t.offsetLeft,cs=app.w.controlesGuiado(),cw=app.doc.documentElement.clientWidth;t.style.left=l;t.style.right=r;
            const lado=Math.max(0,Math.min(xc,cw-xc-t.offsetWidth)-8),dxs=[0];for(let d=8;d<=lado;d+=8)dxs.push(-d,d);
            const altos=[];for(let y=8;y<=app.w.innerHeight-t.offsetHeight;y++)altos.push(y);
            const hueco=dxs.map(dx=>altos.filter(y=>!app.w.avisoPisa(t,cs,true,null,xc+dx,y)).map(y=>dx+","+y)[0]).filter(Boolean);
            if(hueco.length)mal.push(caso+": tapa controles y habia hueco en "+hueco[0]);
            if(t.classList.contains("arriba")&&!app.w.avisoPisa(t,cs,false)){const ya=app.w.avisoTapa(t,cs,t.offsetLeft,t.offsetTop);
              const menos=dxs.map(dx=>altos.filter(y=>!app.w.avisoPisa(t,cs,false,null,xc+dx,y)&&app.w.avisoTapa(t,cs,xc+dx,y)<ya-1)
                .map(y=>dx+","+y+" ("+app.w.avisoTapa(t,cs,xc+dx,y).toFixed(0)+")")[0]).filter(Boolean);
              if(menos.length)mal.push(caso+": tapa "+ya.toFixed(0)+" px² y en "+menos[0]+" taparia menos");}}
          /* sin ningun hueco (320x568 con letra grande) se queda donde siempre */
          if(donde[0].indexOf("arriba")<0){sinHueco++;continue;}
          app.$$("#guided button,#guided [role=button],#guided input").forEach(c=>{const r=c.getBoundingClientRect();
            if(!r.width||r.bottom<0||r.top>app.w.innerHeight)return;
            for(let y=r.top+2;y<r.bottom-1;y+=4)for(let xx=r.left+2;xx<r.right-1;xx+=4){
              const e=app.doc.elementFromPoint(xx,y);
              if(e&&bt.contains(e)){mal.push(caso+": Deshacer sobre «"+(c.getAttribute("aria-label")||c.textContent.trim().slice(0,20))+"»");return;}}});}}
      finally{sinBarras.remove();raiz.style.fontSize="";app.frame.style.width="400px";app.frame.style.height="800px";}
      expect(casos).toBe(24);
      expect(mal).toEqual([]);
      expect(sinHueco).toBeLessThan(3);
      expect(tapan.filter(c=>!/^320x568 1(15|30)% primera:/.test(c))).toEqual([]);
      expect(tapan.length).toBeLessThan(3);
      app.reiniciarMemoria();});
    test("con teclado: Enter en la X lleva el foco a Deshacer, y Deshacer a la serie recuperada",app=>{abrir(app);
      const x=app.$("#sl_press_banca_db_2 .del");x.focus();
      x.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
      expect(app.ev("sessionLog").press_banca_db).toHaveLength(2);
      expect(app.doc.activeElement).toBe(app.$("#toast .tact"));
      app.doc.activeElement.click();
      expect(app.ev("sessionLog").press_banca_db).toHaveLength(3);
      expect(app.doc.activeElement).toBe(app.$("#sl_press_banca_db_2 .v"));
      app.reiniciarMemoria();});
  });
  /* HU-63: el titulo de la hoja de conflicto, «Tienes <rutina> a medias», se
     cortaba con elipsis justo en «a medias» (todas las rutinas de la madre a
     320 px, y con letra grande tambien a 375). Ahora salta de linea */
  escenario("Pantallas · hoja de conflicto a 320 px (madre)",F.madre,()=>{
    test("el título «Tienes … a medias» no se corta con ninguna rutina, a 320 y a 375 con letra grande",app=>{
      const raiz=app.doc.documentElement,cortados=[];
      try{app.frame.style.width="320px";anchoUtil(app,320);
        expect(app.leer("rp_session").key).toBe("salud_fuerza_b");
        app.w.openRoutine("salud_fuerza_a");app.w.startRoutine();
        expect(app.$("#planov").classList.contains("show")).toBe(true);
        const t=app.$("#planTitle");
        expect(t.textContent).toBe("Tienes "+app.ev("ROUTINES").salud_fuerza_b.name+" a medias");
        for(const [ancho,md] of [[320,null],[375,"19.5px"]]){anchoUtil(app,ancho);
          if(md)raiz.style.setProperty("--t-md",md);
          Object.keys(app.ev("ROUTINES")).forEach(k=>{t.textContent="Tienes "+app.ev("ROUTINES")[k].name+" a medias";
            if(t.scrollWidth>t.clientWidth)cortados.push(ancho+" "+k);});}}
      finally{raiz.style.removeProperty("--t-md");app.frame.style.width="400px";}
      expect(cortados).toEqual([]);
      app.reiniciarMemoria();});
  });
})();
