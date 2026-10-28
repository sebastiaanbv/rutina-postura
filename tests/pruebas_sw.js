/* El service worker y la senal mala. El preludio lo desactiva en la app (para
   que ninguna cache se meta entre corridas), asi que aqui sw.js se evalua tal
   cual en una caja: self, caches, fetch y el reloj son de mentira y los maneja
   la prueba; Request/Response/ReadableStream son los del navegador. Se le
   lanzan peticiones como las de abrir la app con red buena, lenta y caida, en
   milisegundos y sin depender de la red de verdad.
   Ojo con el tiempo virtual de run.py (--virtual-time-budget, el de la CI):
   - mientras se lee el cuerpo de un ReadableStream que sigue abierto, Chrome
     congela los temporizadores y los mensajes. Si la prueba espera uno, el
     arnes no termina y la CI no devuelve nada. Por eso asentar() solo deja
     correr microtareas, y el cuerpo atascado se cierra en un finally.
   - lo que habla con el proceso del navegador (CacheStorage, los registros
     del service worker) tarda tiempo real, y mientras tanto el reloj virtual
     salta al siguiente temporizador: el tope de 20 s de la prueba. En la app
     se usan dobles. */
(function(){
  const F=Fixtures;
  const ORIGEN="https://app.prueba",SW=ORIGEN+"/rutina/sw.js";
  const dir=r=>typeof r==="string"?new URL(r,SW).href:r.url;
  /* la red, la cache y el reloj de mentira responden en microtareas: con 200
     vueltas sobra (la copia tras el plazo llega en menos de 10) */
  const asentar=async()=>{for(let i=0;i<200;i++)await null;};
  let fuente=null;

  /* reloj: setTimeout no corre solo, lo adelanta la prueba */
  function reloj(){let ahora=0,sig=1;const pend=new Map();
    return {setTimeout:(f,ms)=>{pend.set(sig,{f:f,en:ahora+(ms||0)});return sig++;},
      clearTimeout:id=>{pend.delete(id);},
      plazos:()=>Array.from(pend.values()).map(t=>t.en-ahora),
      async avanzar(ms){ahora+=ms;Array.from(pend).filter(x=>x[1].en<=ahora).sort((a,b)=>a[1].en-b[1].en)
        .forEach(x=>{pend.delete(x[0]);x[1].f();});await asentar();}};}

  /* red: cada fetch queda pendiente hasta que la prueba lo resuelve o lo
     tumba; con modo, se responde solo */
  function red(){const n={pedidas:[],modo:null};
    n.fetch=req=>new Promise((ok,no)=>{const d={url:dir(req),ok:ok,no:no};n.pedidas.push(d);if(n.modo)n.modo(d);});
    n.ultima=()=>n.pedidas[n.pedidas.length-1];
    return n;}

  /* CacheStorage en memoria. put lee el cuerpo, como la de verdad: no guarda
     una respuesta ya leida, y la que guarda ya no se puede entregar */
  function almacen(net){const cajas=new Map();
    function caja(){const m=new Map();const c={
      async put(req,res){if(res.bodyUsed)throw new TypeError("put: respuesta ya leida");
        m.set(dir(req),{cuerpo:await res.text(),status:res.status});},
      async match(req){const g=m.get(dir(req));return g?new Response(g.cuerpo,{status:g.status}):undefined;},
      async add(u){const r=await net.fetch(u);if(!r.ok)throw new TypeError("add: "+r.status);await c.put(u,r);},
      async addAll(us){const rs=await Promise.all(us.map(u=>net.fetch(u)));
        if(rs.some(r=>!r.ok))throw new TypeError("addAll: alguna fallo");await Promise.all(rs.map((r,i)=>c.put(us[i],r)));}};
      return c;}
    return {async open(n){if(!cajas.has(n))cajas.set(n,caja());return cajas.get(n);},
      async match(req){for(const c of cajas.values()){const r=await c.match(req);if(r)return r;}},
      async keys(){return Array.from(cajas.keys());},
      async delete(n){return cajas.delete(n);},
      /* para mirar desde la prueba */
      async lee(ruta){const r=await this.match(ruta);return r?r.text():null;}};}

  /* sw.js cargado en la caja e instalado con la red respondiendo "v35 <ruta>":
     un telefono que ya tiene la app guardada. {sinCopia:true} lo deja con la
     cache vacia, como justo despues de "Buscar actualizacion" */
  async function montar(o){o=o||{};
    if(fuente==null)fuente=await fetch("../sw.js",{cache:"no-store"}).then(r=>r.text());
    const h={},rel=reloj(),net=red(),cs=almacen(net);
    const self={addEventListener:(t,f)=>{h[t]=f;},skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve()}};
    new Function("self","caches","fetch","location","setTimeout","clearTimeout",fuente)
      (self,cs,net.fetch,{origin:ORIGEN,href:SW},rel.setTimeout,rel.clearTimeout);
    net.modo=d=>d.ok(new Response("v35 "+new URL(d.url).pathname));
    const esp=[];h.install({waitUntil:p=>{esp.push(p);}});await Promise.all(esp);
    net.modo=null;net.pedidas.length=0;
    if(o.sinCopia)for(const k of await cs.keys())await cs.delete(k);
    /* una peticion como la del navegador; respondWith y waitUntil solo valen
       durante el despacho, como en el de verdad */
    function pedir(ruta,modo){let vivo=true;
      const ev={request:{url:dir(ruta),mode:modo||"navigate"},esperas:[],respondio:false,listo:false,r:null,err:null};
      const fuera=q=>new DOMException(q+" fuera del despacho","InvalidStateError");
      ev.respondWith=p=>{if(!vivo)throw fuera("respondWith");ev.respondio=true;
        Promise.resolve(p).then(r=>{ev.r=r;ev.listo=true;},e=>{ev.err=e;ev.listo=true;});};
      ev.waitUntil=p=>{if(!vivo)throw fuera("waitUntil");ev.esperas.push(Promise.resolve(p));};
      h.fetch(ev);vivo=false;return ev;}
    return {rel:rel,net:net,cs:cs,pedir:pedir};}
  /* lo que recibe el navegador; para lo que NO debe haber llegado se mira ev.listo */
  const llega=ev=>Pruebas.hasta(()=>ev.listo,2000,"la respuesta del service worker");
  const texto=async ev=>{await llega(ev);return ev.r?ev.r.text():null;};
  const fin=ev=>Promise.all(ev.esperas);

  escenario("Service worker · abrir con señal mala",F.vacio,()=>{

    test("red buena: llega la versión nueva aunque haya copia, y se guarda para la próxima",async()=>{
      const s=await montar();s.net.modo=d=>d.ok(new Response("v36"));
      const ev=s.pedir("./");
      expect(await texto(ev)).toBe("v36");
      await fin(ev);expect(await s.cs.lee("./")).toBe("v36");
      /* entrar por index.html o con algo detras (?go=...) va igual a la red */
      const ev2=s.pedir("index.html?go=1");
      expect(await texto(ev2)).toBe("v36");});

    test("red buena pero sin prisa: dentro del plazo se espera a la red, no a la copia",async()=>{
      const s=await montar(),ev=s.pedir("./"),plazo=s.rel.plazos()[0];
      await s.rel.avanzar(plazo-100);
      expect(ev.listo).toBe(false);
      s.net.ultima().ok(new Response("v36"));
      expect(await texto(ev)).toBe("v36");});

    test("red lenta: a los ~3 s sale la copia y la descarga sigue detrás",async()=>{
      const s=await montar(),ev=s.pedir("./");
      /* "unos 3 s": ni tan corto que corte una red normal ni tan largo que se vea en blanco */
      expect(s.rel.plazos()).toHaveLength(1);
      const plazo=s.rel.plazos()[0];
      expect(plazo).toBeGreaterThan(1999);expect(plazo).toBeLessThan(4001);
      await s.rel.avanzar(plazo-1);
      expect(ev.listo).toBe(false);
      await s.rel.avanzar(1);
      expect(await texto(ev)).toBe("v35 /rutina/");
      /* la red termina tarde: no cambia lo que ya se ve, pero queda guardada */
      s.net.ultima().ok(new Response("v36"));await fin(ev);
      expect(await s.cs.lee("./")).toBe("v36");
      /* y la siguiente apertura, aun sin red, ya abre la nueva */
      const ev2=s.pedir("./");s.net.ultima().no(new TypeError("Failed to fetch"));
      expect(await texto(ev2)).toBe("v36");});

    test("red lenta: si llegan las cabeceras pero el cuerpo se atasca, también sale la copia",async()=>{
      const s=await montar(),ev=s.pedir("./"),plazo=s.rel.plazos()[0],enc=new TextEncoder();
      let ctl;const cuerpo=new ReadableStream({start(c){ctl=c;}});
      ctl.enqueue(enc.encode("v36 "));
      /* hasta cerrar el cuerpo nada de temporizadores (ni texto(), que espera
         con uno): con el tiempo virtual de la CI no saltarian nunca. Si algo
         falla antes, el finally lo cierra y la prueba falla en vez de colgarse */
      try{
        s.net.ultima().ok(new Response(cuerpo,{status:200}));
        await asentar();
        expect(ev.listo).toBe(false);
        await s.rel.avanzar(plazo);
        expect(ev.listo).toBe(true);
        expect(await ev.r.text()).toBe("v35 /rutina/");
      }finally{ctl.enqueue(enc.encode("entera"));ctl.close();}
      await fin(ev);
      expect(await s.cs.lee("./")).toBe("v36 entera");});

    test("red caída: la copia sale en el acto, sin esperar el plazo",async()=>{
      /* el reloj de mentira no avanza: si llega, no vino del plazo */
      const s=await montar(),ev=s.pedir("./");
      s.net.ultima().no(new TypeError("Failed to fetch"));
      expect(await texto(ev)).toBe("v35 /rutina/");
      /* una direccion que no esta guardada tal cual (?go=...) cae a la de "./" */
      const ev2=s.pedir("index.html?go=1");s.net.ultima().no(new TypeError("Failed to fetch"));
      expect(await texto(ev2)).toBe("v35 /rutina/");
      /* y lo guardado sigue sano */
      expect(await s.cs.lee("./")).toBe("v35 /rutina/");});

    test("una dirección sin copia propia (?go=…) recibe la copia más nueva, la de ./, no la de la instalación",async()=>{
      /* "./" se renueva en cada apertura con buena red; "index.html" se quedo
         en la de la instalacion */
      const s=await montar();s.net.modo=d=>d.ok(new Response("v36"));
      const ev=s.pedir("./");await fin(ev);
      expect(await s.cs.lee("./")).toBe("v36");
      expect(await s.cs.lee("index.html")).toBe("v35 /rutina/index.html");
      s.net.modo=null;
      /* con red lenta, al vencer el plazo */
      const ev2=s.pedir("index.html?go=1"),plazo=s.rel.plazos()[0];
      await s.rel.avanzar(plazo);
      expect(await texto(ev2)).toBe("v36");
      /* con la red caida */
      const ev3=s.pedir("./?go=2");s.net.ultima().no(new TypeError("Failed to fetch"));
      expect(await texto(ev3)).toBe("v36");
      /* sin "./" (otra cache a medias) queda index.html como ultimo recurso */
      const t=await montar({sinCopia:true});
      await (await t.cs.open("otra")).put("index.html",new Response("v35 /rutina/index.html"));
      const ev4=t.pedir("index.html?go=3");t.net.ultima().no(new TypeError("Failed to fetch"));
      expect(await texto(ev4)).toBe("v35 /rutina/index.html");});

    test("un 404 o 500 se entrega como antes y no pisa la copia",async()=>{
      const s=await montar(),ev=s.pedir("./");
      s.net.ultima().ok(new Response("caido",{status:503}));
      expect(await texto(ev)).toBe("caido");expect(ev.r.status).toBe(503);
      await fin(ev);expect(await s.cs.lee("./")).toBe("v35 /rutina/");});

    test("sin copia (primera visita o tras «Buscar actualización»): se espera a la red aunque pase el plazo",async()=>{
      const s=await montar({sinCopia:true}),ev=s.pedir("./");
      await s.rel.avanzar(60000);
      expect(ev.listo).toBe(false);
      s.net.ultima().ok(new Response("v36"));
      expect(await texto(ev)).toBe("v36");
      await fin(ev);expect(await s.cs.lee("./")).toBe("v36");});

    test("sin copia y sin red: no se inventa una respuesta, el navegador da su error de red",async()=>{
      const s=await montar({sinCopia:true}),ev=s.pedir("./");
      s.net.ultima().no(new TypeError("Failed to fetch"));
      await llega(ev);
      expect(ev.r).toBeFalsy();});

    test("el manifest: con red lenta sale su copia; si no la hay, no se le sirve index.html",async()=>{
      const s=await montar(),ev=s.pedir("manifest.webmanifest","cors"),plazo=s.rel.plazos()[0];
      await s.rel.avanzar(plazo);
      expect(await texto(ev)).toBe("v35 /rutina/manifest.webmanifest");
      const t=await montar({sinCopia:true});
      await (await t.cs.open("otra")).put("index.html",new Response("v35 /rutina/index.html"));
      const ev2=t.pedir("manifest.webmanifest","cors");
      await t.rel.avanzar(plazo);
      expect(ev2.listo).toBe(false);
      t.net.ultima().ok(new Response("{}"));
      expect(await texto(ev2)).toBe("{}");});

    test("figuras e iconos siguen saliendo de la caché sin tocar la red, y lo de fuera no se toca",async()=>{
      const s=await montar(),ev=s.pedir("figuras.js","no-cors"),ev2=s.pedir("icon-192-v25.png","no-cors");
      expect(await texto(ev)).toBe("v35 /rutina/figuras.js");
      expect(await texto(ev2)).toBe("v35 /rutina/icon-192-v25.png");
      expect(s.net.pedidas).toHaveLength(0);
      expect(s.rel.plazos()).toHaveLength(0);
      expect(s.pedir("https://www.youtube.com/embed/x","navigate").respondio).toBe(false);});

    test("«Buscar actualización» vacía la caché y recarga la app",async app=>{
      /* CacheStorage y los registros son dobles dentro de la app (ver arriba
         el tiempo virtual); se van solos con la recarga */
      const w=app.w,cajas=new Set(["mi-rutina-v33","mi-rutina-vieja"]),buscadas=[];
      w.caches.keys=()=>Promise.resolve(Array.from(cajas));
      w.caches.delete=k=>Promise.resolve(cajas.delete(k));
      w.navigator.serviceWorker.getRegistrations=()=>Promise.resolve([{update:()=>{buscadas.push(1);return Promise.resolve();}}]);
      app.$('.nav .tab[data-v="settings"]').click();
      const b=app.$$("#settings button").find(x=>x.textContent.indexOf("Buscar actualización")>=0);
      expect(b).toBeTruthy();
      w.__antes=true;const recarga=app.cargo();b.click();
      await recarga;await app.listo();
      expect(Array.from(cajas)).toEqual([]);
      /* tambien pidio al navegador que mire si hay un sw.js nuevo */
      expect(buscadas).toHaveLength(1);
      /* ventana nueva: la app se volvio a pedir, y sin copia el service worker va a la red */
      expect(app.w.__antes).toBe(undefined);});
  });
})();
