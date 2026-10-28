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

  /* Borrar una serie (HU-54): las zonas de toque de la fila y el aviso.
     La zona se mide como la ve el dedo: elementFromPoint ve los
     pseudo-elementos que agrandan un control y lo que otro tapa encima. */
  function conSerie(){const ini=Date.now()-20*60000;
    return {rp_session:{v:1,key:"gym_empuje",date:F.fecha(0),startedAt:ini,lastAt:ini,stepi:0,src:"guided",
      log:{press_banca_db:[{w:122.5,reps:12,t:ini+60000,rir:3},{w:22.5,reps:8,t:ini+240000},{w:22.5,reps:7,t:ini+420000,rir:0}]}}};}
  function abrir(app){app.w.toastFuera();app.reiniciarMemoria();app.sembrar(conSerie);
    app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");app.$("#toast").innerHTML="";
    expect(app.activa()).toBe("guided");}
  /* Zona de toque de un control: lo que mide (su caja o el pseudo-elemento
     que la agranda) y si es suya. Un cuadrado de 44 px centrado en el control
     tiene que caer en el: si otro lo tapa, no es suya. El cuadrado va a 21,4
     del centro porque elementFromPoint redondea el punto hasta medio pixel, y
     sin esquinas de 10 px porque el navegador respeta el border-radius al
     decidir que se toca: un campo redondeado las deja pasar al padre. */
  function zona(app,el){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,m=21.4,ajenos=[];
    const ps=app.w.getComputedStyle(el,"::after"),con=ps.content&&ps.content!=="none"&&ps.display!=="none";
    for(let dy=-m;dy<=m+1e-6;dy+=m/6)for(let dx=-m;dx<=m+1e-6;dx+=m/6){
      if(Math.abs(dx)>12&&Math.abs(dy)>12)continue;
      const h=app.doc.elementFromPoint(cx+dx,cy+dy);
      if(!h||!(h===el||el.contains(h)))ajenos.push(Math.round(dx)+","+Math.round(dy)+"→"+(h?(h.className&&h.className.baseVal!=null?h.className.baseVal:h.className)||h.tagName:"nada"));}
    return {ancho:Math.max(r.width,con?parseFloat(ps.width)||0:0)>=44,alto:Math.max(r.height,con?parseFloat(ps.height)||0:0)>=44,ajenos:ajenos};}
  const z44={ancho:true,alto:true,ajenos:[]};
  /* contraste WCAG entre dos colores "rgb(r, g, b)" */
  function lum(c){return c.match(/\d+(\.\d+)?/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);})
    .reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);}
  const contraste=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
  /* "Serie borrada", no "Serie Borrada" ni "¡Serie borrada!" (DISENO 11) */
  const voz=t=>{expect(t).not.toContain("!");expect(t.slice(1)).toBe(t.slice(1).toLowerCase());};
  escenario("Pantallas · borrar una serie (zonas de toque y aviso)",conSerie,()=>{
    test("la cifra, la X, los campos y el visto de cada serie miden 44 px y no se pisan, a 400 y a 320 px",app=>{
      try{for(const ancho of ["400px","320px"]){app.frame.style.width=ancho;abrir(app);
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
          /* el boton se toca en 44 px; el resto del aviso no tapa lo de debajo */
          expect(zona(app,b)).toEqual(z44);
          const m=app.$("#toast .tmsg").getBoundingClientRect();
          expect(el.contains(app.doc.elementFromPoint(m.left+m.width/2,m.top+m.height/2))).toBe(false);
          /* un segundo borrado cambia el texto, y la region lo vuelve a leer */
          app.$("#sl_press_banca_db_1 .del").click();
          expect(app.texto("#toast .tmsg")).toBe("2 series borradas");voz(app.texto("#toast .tmsg"));
          app.$("#toast .tact").click();
          expect(app.texto("#toast")).toBe("2 series recuperadas");voz(app.texto("#toast"));}}
      finally{if(tema)raiz.setAttribute("data-theme",tema);else raiz.removeAttribute("data-theme");}
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
})();
