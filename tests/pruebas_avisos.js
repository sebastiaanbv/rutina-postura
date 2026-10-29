/* Volver a la app desde una notificacion (HU-12), por los dos extremos:
   - sw.js con dobles: se evalua tal cual con self, caches, clients, location y
     fetch de mentira, y se le disparan install, activate y notificationclick
     como lo haria el navegador. No se registra nada de verdad: el preludio
     desactiva el service worker en las pruebas.
   - el arranque de index.html con #retomar, que es lo que abre el aviso de
     fin de descanso cuando no hay ninguna ventana de la app. */
(function(){
  const F=Fixtures;
  const BASE="https://app.example/rutina/";
  let fuente=null;
  async function codigoSW(){if(fuente==null){const r=await fetch("../sw.js",{cache:"no-store"});fuente=await r.text();}return fuente;}
  const abs=k=>new URL(typeof k==="string"?k:k.url,BASE).href;
  /* ruta relativa a la app: "./" queda como "" */
  const ruta=u=>u.slice(BASE.length);
  const rutas=l=>l.map(r=>ruta(abs(r)));

  /* o.caches: {nombre:{ruta:texto}} lo que ya habia guardado de antes
     o.sinRed: rutas cuya descarga falla (red caida); o.error404: rutas que dan 404
     o.ventanas: url de cada ventana abierta de este origen */
  async function sw(o){o=o||{};
    const d={pedidos:[],abiertas:[],enfocadas:[],saltos:0,matchAll:null};
    const oyentes={},almacen=new Map();
    const resp=(r,texto,status)=>({url:abs(r),ok:(status||200)<300,status:status||200,texto:texto,
      clone(){return Object.assign({},this);}});
    const red=req=>{const r=ruta(abs(req));d.pedidos.push(r);
      if((o.sinRed||[]).indexOf(r)>=0)return Promise.reject(new TypeError("Failed to fetch"));
      return Promise.resolve(resp(r,"red:"+r,(o.error404||[]).indexOf(r)>=0?404:200));};
    function cache(n){if(!almacen.has(n))almacen.set(n,new Map());const m=almacen.get(n);
      return {
        match:k=>Promise.resolve(m.get(abs(k))),
        put:(k,r)=>{m.set(abs(k),r);return Promise.resolve();},
        /* como el de verdad: una respuesta que no es ok rechaza */
        add:k=>red(k).then(r=>{if(!r.ok)throw new TypeError("respuesta "+r.status);m.set(abs(k),r);}),
        /* atomico: si una falla no se guarda ninguna */
        addAll:ks=>Promise.all(ks.map(red)).then(rs=>{if(rs.some(r=>!r.ok))throw new TypeError("addAll");
          rs.forEach((r,i)=>m.set(abs(ks[i]),r));}),
        m:m};}
    Object.keys(o.caches||{}).forEach(n=>{const c=cache(n);
      Object.keys(o.caches[n]).forEach(r=>c.m.set(abs(r),resp(r,o.caches[n][r])));});
    const caches={
      open:n=>Promise.resolve(cache(n)),
      /* busca en todas, como caches.match del navegador */
      match:k=>{for(const m of almacen.values())if(m.has(abs(k)))return Promise.resolve(m.get(abs(k)));
        return Promise.resolve(undefined);},
      keys:()=>Promise.resolve([...almacen.keys()]),
      delete:n=>Promise.resolve(almacen.delete(n))};
    const clients={
      matchAll:op=>{d.matchAll=op;return Promise.resolve((o.ventanas||[]).map(u=>({url:u,
        focus(){d.enfocadas.push(u);return Promise.resolve(this);}})));},
      openWindow:u=>{d.abiertas.push(u);return Promise.resolve(null);},
      claim:()=>Promise.resolve()};
    const self={addEventListener:(t,f)=>{oyentes[t]=f;},skipWaiting:()=>{d.saltos++;return Promise.resolve();},
      clients:clients,registration:{scope:BASE}};
    d.expone=new Function("self","caches","clients","location","fetch",
      (await codigoSW())+"\n;return {CACHE:CACHE,ASSETS:ASSETS};")(self,caches,clients,new URL(BASE),red);
    /* lo guardado en una cache, como {ruta:texto} */
    d.en=n=>{const m=almacen.get(n),out={};if(m)m.forEach((v,k)=>{out[ruta(k)]=v.texto;});return out;};
    d.nombres=()=>[...almacen.keys()];
    /* dispara un evento y espera su waitUntil */
    d.disparar=async(tipo,extra)=>{let p=null;const ev=Object.assign({waitUntil(x){p=x;}},extra||{});
      oyentes[tipo](ev);if(p)await p;return ev;};
    /* tocar un aviso con ese tag */
    d.tocar=async tag=>{const n={tag:tag||"",cerrada:0,close(){this.cerrada++;}};
      await d.disparar("notificationclick",{notification:n});return n;};
    return d;}

  escenario("Service worker · install con dobles",F.vacio,()=>{
    test("figuras.js ya guardada por la version anterior: se copia y no se vuelve a descargar",async app=>{
      const s=await sw({caches:{"mi-rutina-v1":{"figuras.js":"figuras de antes"}}});
      const CACHE=s.expone.CACHE;
      expect(CACHE).not.toBe("mi-rutina-v1");
      await s.disparar("install");
      expect(s.pedidos).not.toContain("figuras.js");
      expect(s.pedidos.slice().sort()).toEqual(rutas(s.expone.ASSETS).sort());
      expect(s.en(CACHE)["figuras.js"]).toBe("figuras de antes");
      expect(s.saltos).toBe(1);
      /* activate borra la cache vieja y las figuras siguen en la nueva */
      await s.disparar("activate");
      expect(s.nombres()).toEqual([CACHE]);
      expect(s.en(CACHE)["figuras.js"]).toBe("figuras de antes");});
    test("reinstalar sin subir CACHE tampoco la descarga (un cambio en sw.js no cuesta 2 MB)",async app=>{
      const CACHE=(await sw()).expone.CACHE;
      const s=await sw({caches:{[CACHE]:{"figuras.js":"figuras ya guardadas"}}});
      await s.disparar("install");
      expect(s.pedidos).not.toContain("figuras.js");
      expect(s.en(CACHE)["figuras.js"]).toBe("figuras ya guardadas");});
    test("figuras.js en ninguna cache: se descarga aparte, despues de ASSETS",async app=>{
      const s=await sw();await s.disparar("install");
      const A=rutas(s.expone.ASSETS);
      expect(A).not.toContain("figuras.js");
      expect(s.pedidos.filter(r=>r==="figuras.js")).toHaveLength(1);
      expect(s.pedidos.slice(-1)[0]).toBe("figuras.js");
      expect(s.en(s.expone.CACHE)["figuras.js"]).toBe("red:figuras.js");
      A.forEach(r=>expect(s.en(s.expone.CACHE)[r]).toBe("red:"+r));
      expect(s.saltos).toBe(1);});
    test("instalacion nueva sin red para figuras.js: el service worker se instala igual",async app=>{
      for(const o of [{sinRed:["figuras.js"]},{error404:["figuras.js"]}]){
        const s=await sw(o);await s.disparar("install");
        expect(s.pedidos).toContain("figuras.js");
        expect(s.saltos).toBe(1);
        const g=s.en(s.expone.CACHE);
        expect(g["figuras.js"]).toBe(undefined);
        /* el resto entra entero: el modo sin conexion no se pierde */
        rutas(s.expone.ASSETS).forEach(r=>expect(g[r]).toBe("red:"+r));}});
    test("el catch es solo de figuras.js: si falta index.html la instalacion falla",async app=>{
      const s=await sw({sinRed:["index.html"]});let fallo=null;
      try{await s.disparar("install");}catch(e){fallo=e;}
      expect(!!fallo).toBe(true);
      expect(s.saltos).toBe(0);
      expect(s.en(s.expone.CACHE)).toEqual({});});
  });

  escenario("Service worker · tocar un aviso",F.vacio,()=>{
    test("aviso de descanso sin ventana abierta: lo cierra y abre la app con #retomar",async app=>{
      const s=await sw(),n=await s.tocar("rp-rest");
      expect(n.cerrada).toBe(1);
      expect(s.matchAll).toEqual({type:"window",includeUncontrolled:true});
      expect(s.abiertas).toEqual(["./#retomar"]);
      expect(s.enfocadas).toEqual([]);
      /* openWindow resuelve contra la URL de sw.js: cae dentro de la app */
      expect(new URL(s.abiertas[0],BASE+"sw.js").href).toBe(BASE+"#retomar");});
    test("con la app ya abierta: enfoca esa ventana y no abre otra",async app=>{
      for(const tag of ["rp-rest","rp-07:00",""]){
        const s=await sw({ventanas:[BASE+"index.html"]}),n=await s.tocar(tag);
        expect(n.cerrada).toBe(1);
        expect(s.enfocadas).toEqual([BASE+"index.html"]);
        expect(s.abiertas).toEqual([]);}});
    test("recordatorio sin ventana abierta: abre Inicio, sin retomar",async app=>{
      for(const tag of ["rp-07:00",""]){
        const s=await sw(),n=await s.tocar(tag);
        expect(n.cerrada).toBe(1);
        expect(s.abiertas).toEqual(["./"]);}});
    test("una ventana de otra app del mismo origen no cuenta: se abre la nuestra",async app=>{
      const s=await sw({ventanas:["https://app.example/otra/"]});await s.tocar("rp-rest");
      expect(s.enfocadas).toEqual([]);
      expect(s.abiertas).toEqual(["./#retomar"]);});
    /* por que #retomar y no ?retomar=1: con la cache de verdad del navegador.
       Tarda tiempo real: con el reloj virtual de la CI va en tiempoReal */
    test("la cache casa ./#retomar con la copia de la app; ?retomar=1 seria otra entrada",async app=>{
      const n="prueba-retomar-"+Date.now(),base=new URL("../",location.href).href;
      await Pruebas.tiempoReal(async()=>{
        const c=await caches.open(n);
        try{await c.put(base,new Response("la app de hoy"));
          const r=await caches.match(base+"#retomar",{cacheName:n});
          expect(r?await r.text():null).toBe("la app de hoy");
          expect(await caches.match(base+"?retomar=1",{cacheName:n})).toBe(undefined);}
        finally{await caches.delete(n);}});});
  });

  /* ---- el otro extremo: index.html abierto con #retomar ---- */
  escenario("Volver desde el aviso · sesión de hoy a medias",F.madre,()=>{
    test("abre el guiado en el paso guardado (rp_session.stepi) sin escribir nada",async app=>{
      const antes=app.foto(),s=app.leer("rp_session");
      expect(app.activa()).toBe("home");
      expect(s.date).toBe(app.w.today());
      expect(s.stepi).toBe(6);
      expect(app.w.buildSteps(s.key).length).toBeGreaterThan(s.stepi);
      await app.arrancar({__crudo:antes},"#retomar");
      expect(app.activa()).toBe("guided");
      expect(app.ev("curRoutine")).toBe(s.key);
      expect(app.ev("stepi")).toBe(s.stepi);
      expect(app.texto("#guided .setlab")).toBe(app.ev("steps[stepi].label"));
      expect(app.texto("#guided .exname")).toBe(app.ev("steps[stepi].name"));
      /* lo anotado antes de cerrar la app sigue en la sesion */
      expect(app.ev("sessionLog").remo_db.length).toBe(1);
      expect(app.foto()).toEqual(antes);
      /* la marca se va de la URL; la consulta se queda */
      expect(app.w.location.hash).toBe("");
      expect(app.w.location.search).toBe("?__pruebas=1");
      expect(app.w.history.state).toEqual({v:"guided",k:s.key});
      app.reiniciarMemoria();});
    test("salir lleva a la rutina y despues a Inicio, sin salir de la app",async app=>{
      const s=app.leer("rp_session");
      await app.arrancar({__crudo:app.foto()},"#retomar");
      expect(app.activa()).toBe("guided");
      app.w.guidedExit();
      await app.hasta(()=>app.activa()==="routine",3000,"la pantalla de la rutina");
      expect(app.ev("curRoutine")).toBe(s.key);
      app.w.history.back();
      await app.hasta(()=>app.activa()==="home",3000,"Inicio");
      expect(app.texto("#todayCard")).toContain("En curso");
      app.reiniciarMemoria();});
    test("recargar despues de volver sigue en el mismo paso",async app=>{
      const s=app.leer("rp_session");
      await app.arrancar({__crudo:app.foto()},"#retomar");
      await app.recargar();
      expect(app.activa()).toBe("guided");
      expect(app.ev("stepi")).toBe(s.stepi);
      expect(app.w.location.hash).toBe("");
      app.reiniciarMemoria();});
  });

  /* el aviso suena durante o al final de un descanso: la serie ya esta
     registrada y el paso guardado tiene que ser el que viene. Antes volvia a
     «Serie 1 de 4» con la serie 1 anotada debajo */
  escenario("Volver desde el aviso · desde un descanso de verdad",F.vacio,()=>{
    async function aLDescanso(app){await app.arrancar(F.dueno);
      app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");
      expect(app.ev("steps[stepi].setNo")).toBe(1);const i0=app.ev("stepi");
      app.ev("curW=30;curReps=8");app.w.logSet();
      await app.hasta(()=>app.$("#guided .gbtn.rest"),3000,"el descanso");
      return i0;}
    async function retoma(app,i0){await app.arrancar({__crudo:app.foto()},"#retomar");
      expect(app.activa()).toBe("guided");
      expect(app.ev("stepi")).toBe(i0+1);
      expect(app.ev("steps[stepi].id")).toBe("press_banca_db");
      expect(app.ev("steps[stepi].setNo")).toBe(2);
      expect(app.texto("#guided .setlab")).toBe(app.ev("steps[stepi].label"));
      expect(app.ev("sessionLog").press_banca_db.map(x=>x.w+"x"+x.reps)).toEqual(["30x8"]);
      app.reiniciarMemoria();}
    test("con la app cerrada en pleno descanso, vuelve a la serie 2",async app=>{
      const i0=await aLDescanso(app);
      expect(app.leer("rp_session").stepi).toBe(i0+1);
      await retoma(app,i0);});
    test("saliendo del guiado durante el descanso, también",async app=>{
      const i0=await aLDescanso(app);
      app.w.guidedExit();
      await app.hasta(()=>app.activa()==="routine",3000,"la rutina");
      expect(app.leer("rp_session").stepi).toBe(i0+1);
      await retoma(app,i0);});
  });

  escenario("Volver desde el aviso · sin sesión viva",F.vacio,()=>{
    test("sin sesion: Inicio, sin errores y sin datos nuevos",async app=>{
      const antes=app.foto();
      await app.arrancar({__crudo:antes},"#retomar");
      expect(app.activa()).toBe("home");
      expect(app.foto()).toEqual(antes);
      expect(app.w.location.hash).toBe("");
      expect(app.w.history.state).toEqual({v:"home"});});
    test("sesion guardada de una rutina que ya no existe: Inicio y no se toca",async app=>{
      const sesion={v:1,key:"no_existe",date:F.fecha(0),startedAt:Date.now()-60000,lastAt:Date.now(),stepi:3,src:"guided",log:{}};
      await app.arrancar({__crudo:Object.assign(app.foto(),{rp_session:JSON.stringify(sesion)})},"#retomar");
      expect(app.activa()).toBe("home");
      expect(app.leer("rp_session")).toEqual(sesion);});
  });

  escenario("Volver desde el aviso · sesión de ayer sin cerrar",F.sinCerrar,()=>{
    test("no abre el guiado de ayer: Inicio con la oferta de cerrarla, como siempre",async app=>{
      const antes=app.foto();
      await app.arrancar({__crudo:antes},"#retomar");
      expect(app.activa()).toBe("home");
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      expect(app.texto("#finTitle")).toBe("Entrenamiento sin cerrar");
      expect(app.foto()).toEqual(antes);});
  });

  escenario("Volver desde el aviso · datos de v35",F.vacio,()=>{
    test("con y sin #retomar: Inicio igual, sin errores y sin claves nuevas",async app=>{
      /* F.dueno no trae rp_schema, como un telefono de v35 */
      await app.arrancar(F.dueno,"#retomar");
      expect(app.activa()).toBe("home");
      const con=app.foto();
      await app.arrancar(F.dueno);
      expect(app.activa()).toBe("home");
      expect(app.foto()).toEqual(con);
      /* la unica clave que aparece es la del esquema, que pone el arranque de v36 */
      const v35=Object.keys(F.dueno());
      expect(Object.keys(con).filter(k=>v35.indexOf(k)<0)).toEqual(["rp_schema"]);});
  });
})();
