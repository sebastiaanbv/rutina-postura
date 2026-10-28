/* Mini marco de pruebas de Mi Rutina. Sin dependencias.

   escenario(nombre, semilla, () => { test(...); ... })
     semilla: objeto {clave rp_*: valor} o funcion que lo devuelve. Antes de
     las pruebas del escenario se vacia localStorage, se siembra y se carga la
     app de cero en un iframe del mismo origen.
   test(nombre, async app => { ... })      prueba normal (async permitido)
   test.skip(nombre, motivo, fn)           conocida: se reporta, no corre
   test.omitir(motivo)                     dentro de una prueba: este entorno no
     puede medir lo que mide (el reloj virtual de run.py); sale omitida con su motivo
   expect(x).toBe / toEqual / toBeCloseTo / toBeTruthy / toBeFalsy / toContain /
     toBeGreaterThan / toBeLessThan / toMatch / toHaveLength, y .not delante.

   Toda prueba falla tambien si la app registro un error (excepcion, promesa
   rechazada sin capturar, console.error, recurso que no carga) mientras corria. */
(function(G){
  "use strict";
  const escenarios=[];let actual=null;
  function escenario(nombre,semilla,cuerpo){const e={nombre:nombre,semilla:semilla,pruebas:[]};
    escenarios.push(e);const prev=actual;actual=e;try{cuerpo();}finally{actual=prev;}}
  function test(nombre,fn){if(!actual)throw new Error("test() fuera de un escenario: "+nombre);
    actual.pruebas.push({nombre:nombre,fn:fn});}
  test.skip=function(nombre,motivo,fn){if(!actual)throw new Error("test.skip() fuera de un escenario: "+nombre);
    actual.pruebas.push({nombre:nombre,fn:fn,omitida:motivo||"sin motivo"});};
  test.omitir=function(motivo){const e=new Error(motivo||"sin motivo");e.omitir=true;throw e;};

  /* ---- aserciones ---- */
  /* comparacion estructural que no depende del "realm": los objetos que vienen
     del iframe no son instanceof Array/Object del arnes */
  function canon(v){
    if(Array.isArray(v))return v.map(canon);
    if(v&&typeof v==="object"){const o={};Object.keys(v).sort().forEach(k=>{if(v[k]!==undefined)o[k]=canon(v[k]);});return o;}
    return v;}
  function fmt(v){if(v===undefined)return "undefined";if(typeof v==="number"&&!isFinite(v))return String(v);
    try{const s=JSON.stringify(canon(v));return s.length>400?s.slice(0,400)+"…":s;}catch(e){return String(v);}}
  function expect(real){
    const api=neg=>{const ok=(cond,msg)=>{if(!!cond===neg)throw new Error((neg?"[not] ":"")+msg);};
      return {
        toBe:esp=>ok(Object.is(real,esp),"esperaba "+fmt(esp)+", llego "+fmt(real)),
        toEqual:esp=>ok(JSON.stringify(canon(real))===JSON.stringify(canon(esp)),"esperaba "+fmt(esp)+"\n          llego    "+fmt(real)),
        toBeCloseTo:(esp,dec)=>{const d=dec==null?2:dec;ok(typeof real==="number"&&Math.abs(real-esp)<Math.pow(10,-d)/2,
          "esperaba ~"+esp+" ("+d+" decimales), llego "+fmt(real));},
        toBeTruthy:()=>ok(!!real,"esperaba algo verdadero, llego "+fmt(real)),
        toBeFalsy:()=>ok(!real,"esperaba algo falso, llego "+fmt(real)),
        toContain:x=>ok(real!=null&&real.indexOf(x)>=0,fmt(real)+" no contiene "+fmt(x)),
        toBeGreaterThan:x=>ok(real>x,"esperaba > "+x+", llego "+fmt(real)),
        toBeLessThan:x=>ok(real<x,"esperaba < "+x+", llego "+fmt(real)),
        toMatch:re=>ok(re.test(String(real)),fmt(real)+" no casa con "+re),
        toHaveLength:n=>ok(real!=null&&real.length===n,"esperaba largo "+n+", llego "+(real==null?real:real.length)+": "+fmt(real))};};
    const o=api(false);o.not=api(true);return o;}

  /* ---- utilidades de tiempo ---- */
  const espera=ms=>new Promise(r=>setTimeout(r,ms||0));
  async function hasta(cond,ms,que){const fin=Date.now()+(ms||5000);
    for(;;){let v;try{v=cond();}catch(e){v=false;}if(v)return v;
      if(Date.now()>fin)throw new Error("tiempo agotado esperando "+(que||"una condicion"));await espera(25);}}
  function conTope(p,ms,que){let t;return Promise.race([p,new Promise((_,no)=>{t=setTimeout(()=>no(new Error("tiempo agotado ("+ms+" ms): "+que)),ms);})])
    .finally(()=>clearTimeout(t));}

  /* ---- la app en su iframe ---- */
  G.__erroresApp=[];
  const SRC="../index.html?__pruebas=1";
  const app={
    frame:null,marca:0,
    get w(){return this.frame&&this.frame.contentWindow;},
    get doc(){return this.frame&&this.frame.contentDocument;},
    /* const/let de la app no cuelgan de window: se leen y escriben con eval
       dentro del iframe (curRoutine, EX, ROUTINES, SECDOSE, VERSION...) */
    ev(expr){return this.w.eval(expr);},
    $(sel){return this.doc.querySelector(sel);},
    $$(sel){return Array.from(this.doc.querySelectorAll(sel));},
    texto(sel){const el=this.$(sel);return el?el.textContent.replace(/\s+/g," ").trim():"";},
    activa(){const v=this.$(".view.active");return v?v.id:null;},
    /* claves rp_* de este origen: el arnes y la app comparten localStorage */
    claves(){return Object.keys(localStorage).filter(k=>k.indexOf("rp_")===0).sort();},
    foto(){const o={};this.claves().forEach(k=>{o[k]=localStorage.getItem(k);});return o;},
    leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return undefined;}},
    /* __crudo: {clave:"texto tal cual"} para sembrar valores que no son JSON */
    sembrar(datos){localStorage.clear();const d=typeof datos==="function"?datos():(datos||{});
      Object.keys(d).forEach(k=>{if(k==="__crudo")Object.keys(d[k]).forEach(c=>localStorage.setItem(c,d[k][c]));
        else localStorage.setItem(k,JSON.stringify(d[k]));});},
    /* deja la memoria de la app como recien arrancada sin recargar */
    reiniciarMemoria(){this.ev("sessionLog={};sessionLogKey=null;curRoutine=null;sessCommitted=0;curRir=null;clearTimer()");},
    cargo(){const f=this.frame;return new Promise(r=>f.addEventListener("load",r,{once:true}));},
    async arrancar(semilla){this.destruir();this.sembrar(semilla);
      const f=document.createElement("iframe");f.id="app";f.title="Mi Rutina";
      f.style.cssText="width:400px;height:800px;border:1px solid #ccc";
      this.frame=f;const c=this.cargo();f.src=SRC;document.getElementById("zona").appendChild(f);
      await conTope(c,30000,"carga de index.html");await this.listo();},
    async recargar(){const c=this.cargo();this.w.location.reload();await conTope(c,30000,"recarga");await this.listo();},
    async listo(){if(!this.w.__errores)throw new Error("la app cargo sin tests/prelude.js: corre las pruebas con python tests/run.py");
      await hasta(()=>this.doc.readyState==="complete"&&typeof this.w.renderHome==="function",10000,"que la app arranque");
      await espera(50);},
    destruir(){if(this.frame){try{this.ev("clearTimer()");}catch(e){}this.frame.remove();this.frame=null;}},
    marcarErrores(){this.marca=G.__erroresApp.length;},
    /* los que se entregan quedan vistos; los que caen entre pruebas (al
       destruir un iframe, un temporizador tardio) salen al final como sueltos */
    erroresNuevos(){const n=G.__erroresApp.slice(this.marca);n.forEach(e=>{e.visto=true;});return n;},
    espera:espera,hasta:hasta};

  /* ---- ejecucion y publicacion ---- */
  const res={terminado:false,inicio:new Date().toISOString(),agente:navigator.userAgent,pruebas:[],errores_arnes:[]};
  G.addEventListener("error",e=>{res.errores_arnes.push(String(e.message)+" @ "+(e.filename||"").split("/").pop()+":"+e.lineno);publicar();});
  G.addEventListener("unhandledrejection",e=>{const r=e.reason;res.errores_arnes.push("promesa: "+(r&&r.message||r));publicar();});
  function publicar(){let el=document.getElementById("results");
    if(!el){el=document.createElement("script");el.type="application/json";el.id="results";document.body.appendChild(el);}
    el.textContent=JSON.stringify(res).replace(/</g,"\\u003c");
    const ul=document.getElementById("lista");if(!ul)return;
    ul.innerHTML=res.pruebas.map(p=>`<li class="${p.estado}"><b>${p.estado}</b> ${esc(p.escenario)} › ${esc(p.nombre)}`
      +(p.error?`<pre>${esc(p.error)}</pre>`:"")+(p.motivo?`<pre>${esc(p.motivo)}</pre>`:"")+`</li>`).join("");
    const st=document.getElementById("estado");
    if(st){const f=res.pruebas.filter(p=>p.estado==="falla").length;
      st.textContent=(res.terminado?"Terminado":"Corriendo…")+" · "+res.pruebas.length+" pruebas · "+f+" fallan";}}
  function esc(s){return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
  function describeErr(errs){return errs.map(e=>e.tipo+": "+e.msg.split("\n").slice(0,4).join("\n    ")).join("\n");}

  async function correr(){const t0=performance.now();
    const filtro=(new URLSearchParams(location.search).get("filtro")||"").toLowerCase();
    publicar();
    for(const e of escenarios){
      const sel=e.pruebas.filter(p=>!filtro||(e.nombre+" › "+p.nombre).toLowerCase().indexOf(filtro)>=0);
      if(!sel.length)continue;
      let fallo=null;app.marcarErrores();const ta=performance.now();
      try{await app.arrancar(e.semilla);await espera(150);}catch(err){fallo=err;}
      const errs=app.erroresNuevos();
      if(fallo||errs.length)res.pruebas.push({escenario:e.nombre,nombre:"(arranque de la app)",estado:"falla",
        ms:Math.round(performance.now()-ta),error:(fallo?String(fallo.stack||fallo):"")+(errs.length?"\nerrores en la app:\n"+describeErr(errs):"")});
      for(const p of sel){
        const r={escenario:e.nombre,nombre:p.nombre,estado:"ok",ms:0};
        /* una conocida se corre igual, sin contar: su fallo queda como evidencia
           del bug, y si un dia pasa es que se arreglo y toca quitarle el skip */
        if(p.omitida){r.estado="omitida";r.motivo=p.omitida;
          if(!fallo&&p.fn){app.marcarErrores();
            try{await conTope(Promise.resolve().then(()=>p.fn(app)),20000,p.nombre);await espera(30);
              const ne=app.erroresNuevos();r.evidencia=ne.length?"errores en la app:\n"+describeErr(ne):"YA PASA: quita test.skip";}
            catch(err){const ne=app.erroresNuevos();
              r.evidencia=String(err&&err.message||err)+(ne.length?"\nerrores en la app:\n"+describeErr(ne):"");}}
          res.pruebas.push(r);publicar();continue;}
        if(fallo){r.estado="falla";r.error="la app no arranco en este escenario";res.pruebas.push(r);publicar();continue;}
        app.marcarErrores();const t=performance.now();
        try{await conTope(Promise.resolve().then(()=>p.fn(app)),20000,p.nombre);await espera(30);}
        catch(err){if(err&&err.omitir){r.estado="omitida";r.motivo=err.message;}
          else{r.estado="falla";r.error=String(err&&err.stack?err.message+"\n"+err.stack.split("\n").filter(l=>/^\s+at /.test(l)).slice(1,4).join("\n"):err);}}
        const ne=app.erroresNuevos();
        if(ne.length){r.estado="falla";r.error=(r.error?r.error+"\n":"")+"errores en la app:\n"+describeErr(ne);}
        r.ms=Math.round(performance.now()-t);res.pruebas.push(r);publicar();}
      app.destruir();}
    await espera(100);
    res.errores_sueltos=G.__erroresApp.filter(e=>!e.visto).map(e=>e.tipo+": "+e.msg.split("\n")[0]);
    res.terminado=true;res.duracion_ms=Math.round(performance.now()-t0);publicar();}

  G.Pruebas={escenario:escenario,test:test,expect:expect,app:app,correr:correr,espera:espera,hasta:hasta};
  G.escenario=escenario;G.test=test;G.expect=expect;
})(window);
