/* HU-58 · Primera vez: elegir objetivo y material. Con el almacenamiento
   vacio, antes de Inicio sale una pantalla breve con el objetivo (masa o
   salud) y el material (gimnasio o casa, con sus mancuernas). Los telefonos
   que ya tienen datos no la ven y se quedan como estaban. Lo elegido va a
   rp_prefs: lo usan metas, textos y veredictos, se cambia en Ajustes y viaja
   en la copia de seguridad.
   Que la pantalla quepa sin cortes ni solapes a 320, 375 y 430 px, con la
   letra de serie y al 130 %, lo mira el humo de tests/pruebas_letra.js. */
(function(){
  const F=Fixtures;
  const tab=(app,v)=>{app.$('.nav .tab[data-v="'+v+'"]').click();};
  const puesta=app=>app.$("#bienvenida").classList.contains("show");
  const opcion=(app,c,v)=>app.$('#bienvenida .bvopt[data-c="'+c+'"][data-v="'+v+'"]');
  const boton=(app,raiz,txt)=>app.$$(raiz+" button").find(b=>b.textContent.trim()===txt);
  /* lo que hay bajo el dedo en el centro de el, despues de traerlo a la vista */
  function bajoElDedo(app,el){el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();
    return app.doc.elementFromPoint(r.left+r.width/2,r.top+r.height/2);}
  /* un toque como el del dedo: el clic se lo lleva lo que haya en el centro
     del control. Si otra cosa lo tapa, la prueba dice que el toque no llega.
     Cuenta los toques en app.toques */
  function toca(app,el){if(!el)throw new Error("no hay control que tocar");const h=bajoElDedo(app,el);
    if(!h||!(h===el||el.contains(h)))throw new Error("el toque en «"+el.textContent.trim().slice(0,30)+"» cae en "
      +(h?h.tagName.toLowerCase()+"."+[...h.classList].join("."):"nada"));
    /* el clic sube desde lo que toca el dedo (el icono de una pestaña es un
       <svg>, que no tiene .click()) */
    app.toques=(app.toques||0)+1;h.dispatchEvent(new app.w.MouseEvent("click",{bubbles:true,cancelable:true,view:app.w}));}
  /* importa por el campo de archivo de la propia pantalla, como el selector */
  function importarPor(app,input,texto){app.w.__respuestaConfirm=true;
    const dt=new app.w.DataTransfer();dt.items.add(new app.w.File([texto],"copia.json",{type:"application/json"}));
    input.files=dt.files;input.dispatchEvent(new app.w.Event("change"));}
  async function exportar(app){const n=app.w.__descargas.length;app.w.exportData();
    await app.hasta(()=>app.w.__descargas.length>n&&app.w.__descargas[n].texto!=null,5000,"el archivo de la copia");
    return app.w.__descargas[n].texto;}
  /* el telefono: px de ancho y letra al pct %, sin barras de scroll que
     ocupen sitio (como en pruebas_letra.js) */
  async function telefono(app,px,alto,pct){app.frame.style.width=px+"px";app.frame.style.height=alto+"px";
    if(!app.doc.getElementById("sinbarras")){const st=app.doc.createElement("style");st.id="sinbarras";
      st.textContent="*{scrollbar-width:none}";app.doc.head.appendChild(st);}
    app.doc.documentElement.style.fontSize=pct===100?"":pct+"%";await app.espera(30);}
  function deVuelta(app){app.frame.style.width="400px";app.frame.style.height="800px";app.doc.documentElement.style.fontSize="";
    const st=app.doc.getElementById("sinbarras");if(st)st.remove();}

  escenario("Primera vez · almacenamiento vacío",F.vacio,()=>{
    test("antes de Inicio sale la pantalla de objetivo y material, y lo que tapa no recibe toques",app=>{
      expect(puesta(app)).toBe(true);
      /* Inicio esta debajo, ya pintado: al elegir sale sin esperar */
      expect(app.activa()).toBe("home");
      const bv=app.$("#bienvenida");
      expect(bv.getAttribute("role")).toBe("dialog");
      expect(bv.getAttribute("aria-modal")).toBe("true");
      expect(app.texto("#"+bv.getAttribute("aria-labelledby"))).toBe("Dos preguntas para empezar");
      expect(app.$$("#bienvenida .bvopt").map(b=>b.dataset.c+":"+b.dataset.v))
        .toEqual(["goal:masa","goal:salud","material:gimnasio","material:casa"]);
      expect(app.$$("#bienvenida .bvopt").map(b=>b.getAttribute("aria-pressed"))).toEqual(["false","false","false","false"]);
      expect(app.$("#bvGo").disabled).toBe(true);
      /* ni la tarjeta de hoy ni la barra reciben el dedo, y el teclado tampoco
         llega a ellas */
      const alto=app.doc.documentElement.clientHeight;
      [app.$("#todayCard .today-go")].concat(app.$$("#nav .tab")).forEach(el=>{const r=el.getBoundingClientRect();
        const h=app.doc.elementFromPoint(r.left+r.width/2,Math.min(r.top+r.height/2,alto-2));
        expect(bv.contains(h)).toBe(true);});
      expect(app.$(".app").inert).toBe(true);
      expect(app.$("#nav").inert).toBe(true);});

    test("mirar y elegir no escribe nada: solo Empezar guarda, y sin elegir vuelve a preguntar",async app=>{
      const antes=app.foto();
      expect(Object.keys(antes).filter(k=>k!=="rp_schema"&&k!=="rp_weekgoal")).toEqual([]);
      ["salud","masa"].forEach(v=>app.w.bvElige("goal",v));["casa","gimnasio"].forEach(v=>app.w.bvElige("material",v));
      expect(app.foto()).toEqual(antes);
      await app.recargar();
      expect(puesta(app)).toBe(true);
      expect(app.$("#bvGo").disabled).toBe(true);
      expect(app.foto()).toEqual(antes);});

    test("tres toques: objetivo, material y Empezar; Inicio sale con la primera rutina del gimnasio",async app=>{
      await app.arrancar(F.vacio);app.toques=0;
      toca(app,opcion(app,"goal","masa"));
      expect(app.$("#bvGo").disabled).toBe(true);
      toca(app,opcion(app,"material","gimnasio"));
      expect(app.$("#bvGo").disabled).toBe(false);
      expect(app.$$("#bienvenida .bvopt").map(b=>b.getAttribute("aria-pressed"))).toEqual(["true","false","true","false"]);
      /* en el gimnasio no hay mancuernas que preguntar */
      expect(app.$("#bvPesosL").hidden).toBe(true);
      toca(app,app.$("#bvGo"));
      expect(app.toques).toBe(3);
      expect(puesta(app)).toBe(false);
      expect(app.leer("rp_prefs")).toEqual({goal:"masa",material:"gimnasio"});
      expect([app.$(".app").inert,app.$("#nav").inert]).toEqual([false,false]);
      expect(app.texto("#todayCard .tt")).toBe(app.ev("ROUTINES.gym_empuje.name"));
      /* masa: la fila de postura de la racha no sale */
      expect(app.$("#stPost").hidden).toBe(true);
      /* y el dedo ya llega a la barra */
      toca(app,app.$('#nav .tab[data-v="settings"]'));
      expect(app.activa()).toBe("settings");
      expect(boton(app,"#setBody","Ganar músculo").getAttribute("aria-pressed")).toBe("true");
      expect(boton(app,"#setBody","Gimnasio").getAttribute("aria-pressed")).toBe("true");
      expect(boton(app,"#setBody","En casa").getAttribute("aria-pressed")).toBe("false");
      expect(app.$("#pesosDB").value).toBe("");
      tab(app,"home");});

    test("en casa pide las mancuernas: lo escrito se guarda como en Ajustes y manda en la propuesta de peso",async app=>{
      await app.arrancar(F.vacio);
      expect(app.$("#bvPesosL").hidden).toBe(true);
      toca(app,opcion(app,"goal","salud"));toca(app,opcion(app,"material","casa"));
      expect(app.$("#bvPesosL").hidden).toBe(false);
      /* el campo de las mancuernas no baja de 16 px (iOS no amplia al enfocarlo) */
      expect(parseFloat(app.w.getComputedStyle(app.$("#bvPesos")).fontSize)).not.toBeLessThan(16);
      toca(app,app.$("#bvPesos"));app.$("#bvPesos").value="1 2,5 3";
      toca(app,app.$("#bvGo"));
      expect(app.leer("rp_prefs")).toEqual({goal:"salud",material:"casa",pesosDB:[1,2.5,3]});
      expect(app.texto("#todayCard .tt")).toBe(app.ev("ROUTINES.salud_fuerza_a.name"));
      expect(app.$("#stPost").hidden).toBe(false);
      expect(app.w.availDB("press_hombro_db","salud_fuerza_a")).toEqual([1,2.5,3]);
      tab(app,"settings");
      expect(app.$("#pesosDB").value).toBe("1 2.5 3");
      expect(boton(app,"#setBody","Salud y mantenimiento").getAttribute("aria-pressed")).toBe("true");
      expect(boton(app,"#setBody","En casa").getAttribute("aria-pressed")).toBe("true");
      tab(app,"home");});

    test("en casa sin escribir mancuernas no guarda lista; si se escriben y luego se elige gimnasio, tampoco",async app=>{
      await app.arrancar(F.vacio);
      app.w.bvElige("goal","salud");app.w.bvElige("material","casa");app.w.bvEmpezar();
      expect(app.leer("rp_prefs")).toEqual({goal:"salud",material:"casa"});
      await app.arrancar(F.vacio);
      app.w.bvElige("goal","masa");app.w.bvElige("material","casa");app.$("#bvPesos").value="2 4";
      app.w.bvElige("material","gimnasio");
      expect(app.$("#bvPesosL").hidden).toBe(true);
      app.w.bvEmpezar();
      expect(app.leer("rp_prefs")).toEqual({goal:"masa",material:"gimnasio"});});

    test("elegido una vez, no vuelve a preguntar: al recargar sale Inicio directo",async app=>{
      expect(app.leer("rp_prefs").goal).toBe("masa");
      await app.recargar();
      expect(puesta(app)).toBe(false);
      expect(app.$(".app").inert).toBe(false);
      expect(app.activa()).toBe("home");});

    test("solo tapa Inicio: abrir una rutina la quita y volver a Inicio la pone",async app=>{
      await app.arrancar(F.vacio);
      app.w.bvElige("goal","salud");
      app.w.openRoutine("gym_empuje");
      expect(puesta(app)).toBe(false);
      expect(app.$(".app").inert).toBe(false);
      app.w.history.back();
      await app.hasta(()=>app.activa()==="home",3000,"Inicio");
      expect(puesta(app)).toBe(true);
      expect(app.$(".app").inert).toBe(true);
      /* de nuevo sin nada elegido: no se guardo nada */
      expect(app.$("#bvGo").disabled).toBe(true);
      app.reiniciarMemoria();});

    test("a 320, 375 y 430 px, con la letra de serie y al 130 %, el dedo llega a cada opción y a Empezar",async app=>{
      await app.arrancar(F.vacio);
      app.w.bvElige("goal","masa");app.w.bvElige("material","casa");
      const malos=[];
      try{for(const [px,alto] of [[320,568],[375,667],[430,932]])for(const pct of [100,130]){
          await telefono(app,px,alto,pct);
          app.$$("#bienvenida .bvopt").concat([app.$("#bvPesos"),app.$("#bvGo"),boton(app,"#bienvenida","Restaurar una copia de seguridad")])
            .forEach(el=>{const h=bajoElDedo(app,el);
              if(!h||!(h===el||el.contains(h)))malos.push(px+" px al "+pct+" %: «"+(el.textContent||el.placeholder).trim().slice(0,24)+"» lo tapa "+(h&&h.className));});
          /* nada se sale por los lados */
          const vw=app.doc.documentElement.clientWidth;
          app.$$("#bienvenida *").forEach(e=>{const r=e.getBoundingClientRect();
            if(r.width&&(r.left<-1||r.right>vw+1))malos.push(px+" px al "+pct+" %: se sale "+e.tagName.toLowerCase()+"."+e.className);});}}
      finally{deVuelta(app);}
      expect(malos).toEqual([]);});

    test("«Restaurar una copia» abre el selector, y la copia que entra deja de preguntar",async app=>{
      await app.arrancar(F.vacio);
      const input=app.$("#bvFile");let abierto=0;input.click=()=>{abierto++;};
      toca(app,boton(app,"#bienvenida","Restaurar una copia de seguridad"));
      expect(abierto).toBe(1);
      /* una copia de v35 (sin rp_schema ni material): la de casa */
      const store={};Object.entries(F.madre()).forEach(([k,v])=>{store[k]=JSON.stringify(v);});
      const recarga=app.cargo();importarPor(app,input,JSON.stringify({_app:"rutina-postura",store:store}));
      await recarga;await app.listo();
      expect(puesta(app)).toBe(false);
      const f=app.foto();
      Object.keys(store).forEach(k=>expect({[k]:f[k]}).toEqual({[k]:store[k]}));
      expect(app.leer("rp_schema")).toBe(app.ev("SCHEMA"));
      expect(app.w.goalPref()).toBe("salud");
      app.reiniciarMemoria();});

    test("«Borrar todos mis datos» deja el teléfono como nuevo: Inicio vuelve a preguntar",async app=>{
      await app.arrancar(F.dueno);
      expect(puesta(app)).toBe(false);
      tab(app,"settings");app.w.__respuestaConfirm=true;app.w.wipe();
      /* en Ajustes no tapa nada: solo Inicio */
      expect(app.activa()).toBe("settings");
      expect(puesta(app)).toBe(false);
      tab(app,"home");
      expect(puesta(app)).toBe(true);
      app.w.__respuestaConfirm=false;app.reiniciarMemoria();});
  });

  /* los telefonos que ya tienen algo de la app no la ven, y su objetivo se
     queda como estaba: sin goal sigue en masa, como hasta v36. Ninguna clave
     nueva salvo las que ya ponia el arranque de v36 */
  escenario("Primera vez · teléfonos con datos de v35",F.vacio,()=>{
    [["gimnasio, masa (Fixtures.dueno)",F.dueno],["casa, salud (Fixtures.madre)",F.madre],["sesión de ayer sin cerrar, sin rp_prefs",F.sinCerrar],
     ["cambios de hora",F.cambioHora],["solo eligió el tema",()=>({rp_theme:"dark"})],
     ["ajustes sin objetivo",()=>({rp_prefs:{keepAwake:true}})],
     ["claves dañadas",()=>({__crudo:{rp_prefs:"{roto",rp_history:"{}"}})]].forEach(([nombre,juego])=>{
      test(nombre+": no ve la pantalla y se queda como estaba",async app=>{
        const v35=juego(),crudo=v35.__crudo||{},
          dato=k=>k in crudo?crudo[k]:(k in v35?JSON.stringify(v35[k]):null);
        await app.arrancar(v35);
        expect(puesta(app)).toBe(false);
        expect(app.$(".app").inert).toBe(false);
        expect(app.claves().filter(k=>dato(k)==null&&k!=="rp_schema"&&k!=="rp_weekgoal")).toEqual([]);
        expect(localStorage.getItem("rp_prefs")).toBe(dato("rp_prefs"));
        const p=v35.rp_prefs||{};
        expect(app.w.goalPref()).toBe(p.goal==="salud"?"salud":"masa");
        /* sin material, Inicio propone lo de siempre */
        expect(app.w.suggestion()).toBe("postura_movilidad");
        app.reiniciarMemoria();});});
  });

  /* lo elegido manda: metas (series por musculo), textos (Inicio, Peso
     corporal) y veredictos, tambien el del indice de fuerza */
  escenario("Primera vez · el objetivo elegido en metas, textos y veredictos",F.vacio,()=>{
    const V=(app,n,p,kgw,o)=>app.w.veredictoFuerza({idx:n},p==null?null:{idx:p},kgw==null?null:{kgw:kgw},o);
    test("veredicto del índice de fuerza: con masa, lo de siempre; con salud, ni masa ni comida",app=>{
      expect(V(app,110,100,0.2,"masa")).toBe("Fuerza y peso suben a la vez: estás ganando masa.");
      expect(V(app,110,100,0,"masa")).toBe("Levantas más pero no pesas más: sube un poco la comida.");
      expect(V(app,110,100,null,"masa")).toBe("Tu fuerza sube. Registra tu peso para saber si es masa.");
      expect(V(app,100,100,-0.2,"masa")).toBe("Estás perdiendo peso: en fase de masa eso frena la ganancia.");
      expect(V(app,100,100,0,"masa")).toBe("Fuerza estable. Mira abajo qué músculo lleva más semanas sin récord.");
      expect(V(app,110,null,0,"masa")).toBe("Aún faltan datos para comparar. Sigue registrando.");
      expect(V(app,110,100,0,"salud")).toBe("Tu fuerza sube con el peso estable: justo lo que buscas.");
      expect(V(app,110,100,0.2,"salud")).toBe("Tu fuerza sube: vas por buen camino.");
      expect(V(app,110,100,-0.2,"salud")).toBe("Tu fuerza sube: vas por buen camino.");
      expect(V(app,110,100,null,"salud")).toBe("Tu fuerza sube: vas por buen camino.");
      expect(V(app,100,100,-0.2,"salud")).toBe("Fuerza estable: lo importante es la constancia.");
      expect(V(app,100,100,0,"salud")).toBe("Fuerza estable: lo importante es la constancia.");
      expect(V(app,110,null,0,"salud")).toBe("Aún faltan datos para comparar. Sigue registrando.");
      [[110,100,0],[110,100,0.2],[110,100,-0.2],[110,100,null],[100,100,-0.2],[100,100,0.2],[100,100,null],[90,100,0],[110,null,0]]
        .forEach(([n,p,k])=>expect(V(app,n,p,k,"salud")).not.toMatch(/masa|comida|grasa/i));
      /* sin decir el objetivo, el elegido */
      app.sembrar({rp_prefs:{goal:"salud"}});expect(V(app,110,100,0)).toBe("Tu fuerza sube con el peso estable: justo lo que buscas.");
      app.sembrar({rp_prefs:{goal:"masa"}});expect(V(app,110,100,0)).toBe("Levantas más pero no pesas más: sube un poco la comida.");
      app.sembrar({});expect(V(app,110,100,0)).toBe("Levantas más pero no pesas más: sube un poco la comida.");});

    /* el caso de la auditoria: fuerza que sube con el peso estable. Seis
       semanas del gimnasio con el peso plano, y lo elegido en la pantalla */
    function historial(app){const D=F.dueno();D.rp_bw=D.rp_bw.map(x=>({date:x.date,kg:72}));
      ["rp_prefs","rp_plan"].forEach(k=>delete D[k]);
      Object.keys(D).forEach(k=>localStorage.setItem(k,JSON.stringify(D[k])));}
    const noOk=app=>app.$$("#progBody .mfill").filter(i=>!i.classList.contains("ok")).length;
    test("salud elegida al empezar: Progreso mide con las metas de salud y no habla de masa; cambiada a masa en Ajustes, al revés",async app=>{
      await app.arrancar(F.vacio);
      toca(app,opcion(app,"goal","salud"));toca(app,opcion(app,"material","gimnasio"));toca(app,app.$("#bvGo"));
      historial(app);
      const now=app.w.strengthIdx(null),prev=app.w.strengthIdx(app.w.dOffset(28));
      /* lo que la prueba necesita de los datos: la fuerza sube y el peso no */
      expect(!!prev&&now.idx>prev.idx+1).toBe(true);
      expect(Math.abs(app.w.bwRate(app.w.loadBW()).kgw)<=0.05).toBe(true);
      tab(app,"progress");
      expect(app.texto("#progBody .hverd")).toBe("Tu fuerza sube con el peso estable: justo lo que buscas.");
      expect(app.texto("#progBody")).not.toMatch(/masa|comida/i);
      expect(app.texto("#progBody")).toContain("Peso estable: justo lo que busca el mantenimiento.");
      expect(app.w.muscGoal()).toEqual(app.ev("MUSCGOAL_SALUD"));
      const conSalud=noOk(app);
      tab(app,"home");expect(app.$("#stPost").hidden).toBe(false);
      /* cambiar despues en Ajustes */
      tab(app,"settings");toca(app,boton(app,"#setBody","Ganar músculo"));
      expect(app.leer("rp_prefs")).toEqual({goal:"masa",material:"gimnasio"});
      tab(app,"progress");
      expect(app.texto("#progBody .hverd")).toBe("Levantas más pero no pesas más: sube un poco la comida.");
      expect(app.w.muscGoal()).toEqual(app.ev("MUSCGOAL"));
      /* las metas de masa piden mas: con las mismas series, mas barras sin llegar */
      expect(noOk(app)).toBeGreaterThan(conSalud);
      tab(app,"home");expect(app.$("#stPost").hidden).toBe(true);});

    test("Inicio a la medida del material: la siguiente rutina del grupo que falta esta semana, y después la movilidad",async app=>{
      const hecha=(k,n)=>{const h=app.leer("rp_history")||[];
        h.unshift({key:k,name:app.ev("ROUTINES")[k].name,iso:F.momento(n,12,0).toISOString(),date:"",time:"12:00"});
        localStorage.setItem("rp_history",JSON.stringify(h));};
      for(const [m,ks] of [["gimnasio",["gym_empuje","gym_tiron","gym_pierna"]],["casa",["salud_fuerza_a","salud_fuerza_b","salud_equilibrio"]]]){
        app.sembrar({rp_prefs:{goal:"masa",material:m}});
        expect(app.w.suggestion()).toBe(ks[0]);
        /* una de la semana pasada no cuenta */
        hecha(ks[0],8);expect(app.w.suggestion()).toBe(ks[0]);
        ks.forEach((k,i)=>{hecha(k,0);expect(app.w.suggestion()).toBe(i<ks.length-1?ks[i+1]:"postura_movilidad");});
        /* y la tarjeta de hoy, sin plan, propone lo mismo */
        app.sembrar({rp_prefs:{goal:"masa",material:m}});app.w.renderHome();
        expect(app.texto("#todayCard .tt")).toBe(app.ev("ROUTINES")[ks[0]].name);
        toca(app,app.$("#todayCard .today-go"));
        expect([app.activa(),app.ev("curRoutine")]).toEqual(["routine",ks[0]]);
        app.w.history.back();await app.hasta(()=>app.activa()==="home",3000,"Inicio");}
      /* un dia de descanso, "algo suave" es la movilidad aunque haya material */
      app.sembrar({rp_prefs:{goal:"masa",material:"gimnasio"},rp_plan:["rest","rest","rest","rest","rest","rest","rest"]});
      app.w.renderTodayCard();
      expect(app.$("#todayCard .today-go").getAttribute("onclick")).toContain("'postura_movilidad'");
      app.sembrar({});app.reiniciarMemoria();});
  });

  escenario("Primera vez · copia de seguridad",F.vacio,()=>{
    test("lo elegido viaja en la copia: exportar → importar en un teléfono nuevo lo devuelve igual y no pregunta",async app=>{
      await app.arrancar(F.vacio);
      toca(app,opcion(app,"goal","salud"));toca(app,opcion(app,"material","casa"));
      app.$("#bvPesos").value="1 2 3";toca(app,app.$("#bvGo"));
      /* y cambiado despues en Ajustes */
      tab(app,"settings");toca(app,boton(app,"#setBody","Gimnasio"));
      const elegido={goal:"salud",material:"gimnasio",pesosDB:[1,2,3]};
      expect(app.leer("rp_prefs")).toEqual(elegido);
      const texto=await exportar(app),data=JSON.parse(texto);
      expect(JSON.parse(data.store.rp_prefs)).toEqual(elegido);
      /* telefono nuevo: pregunta, y desde ahi mismo se restaura la copia */
      await app.arrancar({});
      expect(puesta(app)).toBe(true);
      const recarga=app.cargo();importarPor(app,app.$("#bvFile"),texto);
      await recarga;await app.listo();
      expect(puesta(app)).toBe(false);
      expect(app.foto()).toEqual(data.store);
      expect(app.leer("rp_prefs")).toEqual(elegido);
      tab(app,"settings");
      expect(boton(app,"#setBody","Salud y mantenimiento").getAttribute("aria-pressed")).toBe("true");
      expect(boton(app,"#setBody","Gimnasio").getAttribute("aria-pressed")).toBe("true");
      expect(app.$("#pesosDB").value).toBe("1 2 3");
      tab(app,"home");
      expect(app.texto("#todayCard .tt")).toBe(app.ev("ROUTINES.gym_empuje.name"));
      /* y la copia de la copia sale igual */
      expect(JSON.parse(await exportar(app)).store.rp_prefs).toBe(data.store.rp_prefs);
      app.reiniciarMemoria();});
  });
})();
