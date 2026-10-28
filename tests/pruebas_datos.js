/* No perder datos nunca: copia de seguridad de ida y vuelta, importaciones
   que no deben tocar nada, sesiones que se cierran y sesiones que se rescatan. */
(function(){
  const F=Fixtures;
  /* exporta con la funcion real y devuelve el texto del archivo que bajaria */
  async function exportar(app){const n=app.w.__descargas.length;app.w.exportData();
    await app.hasta(()=>app.w.__descargas.length>n&&app.w.__descargas[n].texto!=null,5000,"el archivo de la copia");
    return app.w.__descargas[n];}
  /* importa con la funcion real, como si el archivo viniera del selector */
  function importar(app,texto,acepta){app.w.__respuestaConfirm=acepta!==false;
    const f=new app.w.File([texto],"copia.json",{type:"application/json"}),input={files:[f],value:"copia.json"};
    app.w.importData(input);return input;}
  /* telefono lleno: parchea el Storage del iframe (el del arnes sigue normal).
     {margen:n} lanza QuotaExceededError si la escritura deja el total por
     encima de lo que habia + n caracteres; {solo:[claves]} solo para esas. */
  function lleno(app,o){const S=app.w.Storage.prototype,orig=S.setItem;
    const usado=ls=>{let t=0;for(let i=0;i<ls.length;i++){const k=ls.key(i);t+=k.length+ls.getItem(k).length;}return t;};
    const tope=o.margen!=null?usado(app.w.localStorage)+o.margen:Infinity;
    S.setItem=function(k,v){k=String(k);v=String(v);const prev=this.getItem(k);
      const total=usado(this)-(prev==null?0:k.length+prev.length)+k.length+v.length;
      if(o.solo?o.solo.indexOf(k)>=0:total>tope)throw new app.w.DOMException("sin espacio","QuotaExceededError");
      return orig.call(this,k,v);};
    return ()=>{S.setItem=orig;};}
  /* el aviso flotante conserva el texto al esconderse: se vacia antes de mirar */
  function sinAviso(app){app.$("#toast").innerHTML="";}
  const pregunto=(app,n)=>app.w.__dialogos.slice(n).filter(x=>x.tipo==="confirm").length;

  escenario("Copia de seguridad (datos del dueño)",F.dueno,()=>{
    test("exportData → importData real: todas las claves rp_* vuelven identicas",async app=>{
      const antes=app.foto();
      expect(Object.keys(antes).length).toBeGreaterThan(15);
      const d=await exportar(app),data=JSON.parse(d.texto);
      expect(d.nombre).toBe("rutina-postura-"+app.w.today()+".json");
      expect(data._app).toBe("rutina-postura");
      expect(data._v).toBe(app.ev("VERSION"));
      expect(Object.keys(data.store).sort()).toEqual(Object.keys(antes));
      expect(data.store).toEqual(antes);
      /* exportar deja constancia de la copia, despues de armar el archivo */
      expect(app.leer("rp_lastexport")).toBe(app.w.today());
      /* telefono nuevo: nada de la app, y una clave ajena que no se debe tocar */
      localStorage.clear();localStorage.setItem("otra_app","intacta");
      const recarga=app.cargo();importar(app,d.texto);
      /* la confirmacion llega cuando FileReader termina, no al llamar */
      await app.hasta(()=>app.w.__dialogos.some(x=>x.tipo==="confirm"),1000,"la confirmacion antes de reemplazar");
      await recarga;await app.listo();
      expect(app.foto()).toEqual(antes);
      expect(localStorage.getItem("otra_app")).toBe("intacta");
      localStorage.removeItem("otra_app");
      expect(app.activa()).toBe("home");
      expect(app.$$(".rcard").length).toBe(9);});
    test("la copia incluye cualquier clave rp_* nueva y nada ajeno",async app=>{
      localStorage.setItem("rp_futura",JSON.stringify({a:1}));localStorage.setItem("ajena","x");
      const data=JSON.parse((await exportar(app)).texto);
      expect(data.store.rp_futura).toBe('{"a":1}');
      expect(data.store.ajena).toBe(undefined);
      localStorage.removeItem("rp_futura");localStorage.removeItem("ajena");});
    test("importar un archivo que no es copia no toca nada",async app=>{
      const antes=app.foto();
      ["no es json","{}",'{"store":{"otra":"1"}}','{"store":{"rp_logs":"{roto"}}'].forEach(t=>importar(app,t));
      await app.espera(400);
      expect(app.foto()).toEqual(antes);
      expect(app.texto("#toast")).toContain("no es una copia válida");});
    test("importar y cancelar en la confirmacion no toca nada",async app=>{
      const antes=app.foto(),copia=JSON.stringify({store:{rp_logs:"{}",rp_history:"[]"}});
      importar(app,copia,false);await app.espera(400);
      expect(app.foto()).toEqual(antes);});
    test("una copia con un valor de texto suelto (no JSON) se rechaza entera",async app=>{
      const antes=app.foto();importar(app,JSON.stringify({store:{rp_bw:[],rp_theme:"dark"}}));await app.espera(400);
      expect(app.foto()).toEqual(antes);
      expect(app.texto("#toast")).toContain("no es una copia válida");});
    test("importar una copia con valores crudos (objetos, no texto) los guarda como JSON",async app=>{
      const antes=app.foto(),copia=JSON.stringify({store:{rp_bw:[{date:"2026-01-01",kg:70}],rp_rem:{enabled:false,times:["06:30"]}}});
      const recarga=app.cargo();importar(app,copia);await recarga;await app.listo();
      expect(app.leer("rp_bw")).toEqual([{date:"2026-01-01",kg:70}]);
      expect(app.leer("rp_rem")).toEqual({enabled:false,times:["06:30"]});
      /* el resto no estaba en el archivo y sigue igual */
      expect(localStorage.getItem("rp_logs")).toBe(antes.rp_logs);});
    test("borrar todo pide confirmacion y si se cancela no borra",app=>{
      const antes=app.foto();app.w.__respuestaConfirm=false;app.w.wipe();
      expect(app.foto()).toEqual(antes);
      expect(app.w.__dialogos.filter(x=>x.tipo==="confirm").length).toBeGreaterThan(0);});
  });

  escenario("Sesión de ayer sin cerrar",F.sinCerrar,()=>{
    test("al abrir, la app ofrece cerrar la sesion de ayer",app=>{
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      expect(app.texto("#finTitle")).toBe("Entrenamiento sin cerrar");
      expect(app.texto("#finBody")).toContain("Press de pecho");});
    test("cerrarla guarda las series con la fecha de AYER y limpia la sesion",async app=>{
      app.ev("confirmFinish()");await app.espera(100);
      const ayer=F.fecha(1),logs=app.leer("rp_logs"),h=app.leer("rp_history");
      expect(logs.press_banca_db.map(r=>[r.date,r.k,r.sets.map(s=>s.w+"x"+s.reps).join(" ")])).toEqual([[ayer,"gym_empuje","30x8 30x7"]]);
      expect(logs.caminadora[0].checked).toBe(true);
      expect(h.length).toBe(1);
      expect([h[0].key,h[0].sets,h[0].exDone]).toEqual(["gym_empuje",2,2]);
      expect(app.w.ds(new Date(h[0].iso))).toBe(ayer);
      expect(app.leer("rp_session")).toBe(null);
      expect(app.$("#finov").classList.contains("show")).toBe(false);});
  });

  escenario("Registrar en el modo guiado",F.vacio,()=>{
    test("registrar una serie la guarda en la sesion y cerrar la pasa a rp_logs",async app=>{
      app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");
      expect(app.activa()).toBe("guided");
      expect(app.texto("#lw")).toBe("10");
      app.w.adjW(2.5);app.w.adjR(-2);app.w.setRir(2);
      app.w.logSet();
      await app.hasta(()=>{const s=app.leer("rp_session");return s&&s.log.press_banca_db;},3000,"la serie en rp_session");
      const s=app.leer("rp_session");
      expect([s.key,s.date,s.src]).toEqual(["gym_empuje",app.w.today(),"guided"]);
      expect(s.log.press_banca_db.map(x=>[x.w,x.reps,x.rir])).toEqual([[12.5,6,2]]);
      const res=app.w.finishSession("gym_empuje","guided");
      expect(res.summary.sets).toBe(1);
      const l=app.leer("rp_logs").press_banca_db;
      expect(l.length).toBe(1);
      expect([l[0].date,l[0].k,l[0].sets[0].w,l[0].sets[0].reps,l[0].sets[0].rir]).toEqual([app.w.today(),"gym_empuje",12.5,6,2]);
      expect(app.leer("rp_history")[0].key).toBe("gym_empuje");
      expect(app.leer("rp_session")).toBe(null);
      /* cerrar dos veces la misma sesion no duplica */
      expect(app.w.finishSession("gym_empuje","guided")).toBe(null);
      expect(app.leer("rp_logs").press_banca_db.length).toBe(1);});
  });

  /* doble toque (v36): «Registrar serie» confirma 300 ms antes de pasar al
     descanso, y un segundo toque en esa ventana volvia a entrar en logSet:
     otra serie en la sesion (y al cerrar, en rp_logs) y otro afterAction,
     que en la ultima serie de un ejercicio saltaba dos pasos. */
  /* matchMedia se fija en cada prueba para no depender de como venga el
     navegador sin interfaz; el parche muere con el iframe */
  function movimiento(app,reducido){const w=app.w,orig=w.matchMedia;
    w.matchMedia=function(q){return /prefers-reduced-motion/.test(q)
      ?{matches:reducido,media:q,onchange:null,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}
      :orig.call(w,q);};}
  /* juego de datos de gimnasio, primera serie del press con una marca que es
     récord seguro. o.series:1 la deja como ultima serie, sin descanso detras */
  async function aLaSerie(app,o){await app.arrancar(F.dueno);movimiento(app,o.reducido);
    if(o.series)app.w.setDose("gym_empuje","press_banca_db",{sets:o.series});
    app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");
    expect(app.ev("steps[stepi].setNo")).toBe(1);
    app.ev("curW=60;curReps=8");
    expect(app.w.isPR("press_banca_db",60,8)).toBe(true);
    return app.ev("stepi");}
  const anotadas=(app,id)=>(app.ev("sessionLog")[id]||[]).map(x=>x.w+"x"+x.reps);
  const deHoy=(app,id)=>(app.leer("rp_logs")[id]||[]).filter(r=>r.date===app.w.today()).map(r=>r.sets.map(x=>x.w+"x"+x.reps));
  const descanso=app=>app.hasta(()=>app.$("#guided .gbtn.rest"),3000,"el descanso");
  /* cerrar la sesion deja una serie en rp_logs y un récord en el historial
     y en el panel de progreso */
  function cierraConUna(app){const res=app.w.finishSession("gym_empuje","guided");
    expect(res.summary.sets).toBe(1);
    expect(deHoy(app,"press_banca_db")).toEqual([["60x8"]]);
    const h=app.leer("rp_history")[0];
    expect([h.key,h.sets]).toEqual(["gym_empuje",1]);
    expect(h.pr.map(p=>p.id+" "+p.w+"x"+p.reps)).toEqual(["press_banca_db 60x8"]);
    expect(app.w.prFeed(1).filter(p=>p.id==="press_banca_db"&&p.date===app.w.today())).toHaveLength(1);
    app.reiniciarMemoria();}

  escenario("Doble toque en «Registrar serie»",F.vacio,()=>{
    test("mientras confirma, el botón está deshabilitado y sin pointer-events",async app=>{
      await aLaSerie(app,{reducido:false});
      const b=app.$("#guided .gbtn.go");b.scrollIntoView({block:"center"});
      const r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const bajoElDedo=()=>{const el=app.doc.elementFromPoint(x,y);return !!el&&(el===b||b.contains(el));};
      expect(bajoElDedo()).toBe(true);expect(b.disabled).toBe(false);
      b.click();
      expect(b.textContent).toContain("Serie registrada");
      expect(b.disabled).toBe(true);
      expect(app.w.getComputedStyle(b).pointerEvents).toBe("none");
      expect(bajoElDedo()).toBe(false);
      b.click();
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      await descanso(app);
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      cierraConUna(app);});
    test("dos logSet dentro de la confirmación: una serie y un récord",async app=>{
      const i0=await aLaSerie(app,{reducido:false});
      app.w.logSet();app.w.logSet();
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      const s=app.leer("rp_session");
      expect(s.log.press_banca_db).toHaveLength(1);
      expect(s.pr).toHaveLength(1);
      await descanso(app);await app.espera(350);
      expect(app.ev("stepi")).toBe(i0);
      /* ya en el descanso, la serie de ese paso tampoco entra otra vez */
      app.w.logSet();
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      cierraConUna(app);});
    test("el doble toque en la última serie avanza un solo paso",async app=>{
      const i0=await aLaSerie(app,{reducido:false,series:1}),sig=app.ev("steps["+(i0+1)+"].id");
      expect(sig).toBe("fondos_paralelas");
      app.w.logSet();app.w.logSet();
      await app.hasta(()=>app.ev("stepi")!==i0,3000,"el ejercicio siguiente");
      await app.espera(350);
      expect(app.ev("stepi")).toBe(i0+1);
      expect(app.ev("steps[stepi].setNo")).toBe(1);
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      expect(anotadas(app,sig)).toEqual([]);
      cierraConUna(app);});
    test("con reducir movimiento (sin confirmación) tampoco se duplica",async app=>{
      const i0=await aLaSerie(app,{reducido:true});
      app.w.logSet();
      /* sin la ventana de 300 ms el descanso entra en el acto */
      expect(app.$("#guided .gbtn.rest")).toBeTruthy();
      app.w.logSet();
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      expect(app.leer("rp_session").pr).toHaveLength(1);
      expect(app.ev("stepi")).toBe(i0);
      cierraConUna(app);});
    test("con reducir movimiento, el segundo toque no registra la serie del ejercicio siguiente",async app=>{
      const i0=await aLaSerie(app,{reducido:true,series:1}),sig=app.ev("steps["+(i0+1)+"].id");
      app.$("#guided .gbtn.go").click();
      /* sin confirmacion ni descanso, el ejercicio siguiente se pinta en el
         acto y el segundo toque cae en su «Registrar serie» */
      expect(app.ev("stepi")).toBe(i0+1);
      app.$("#guided .gbtn.go").click();
      expect(app.ev("stepi")).toBe(i0+1);
      expect(anotadas(app,sig)).toEqual([]);
      expect(anotadas(app,"press_banca_db")).toEqual(["60x8"]);
      /* pasado el doble toque, la serie siguiente entra con normalidad */
      await app.espera(350);
      app.$("#guided .gbtn.go").click();
      expect(anotadas(app,sig)).toHaveLength(1);
      expect(app.ev("stepi")).toBe(i0+1);
      const res=app.w.finishSession("gym_empuje","guided");
      expect(res.summary.sets).toBe(2);
      expect(deHoy(app,"press_banca_db")).toEqual([["60x8"]]);
      expect(deHoy(app,sig)).toHaveLength(1);
      app.reiniciarMemoria();});
    test("tras el doble toque no hay claves nuevas y la copia va y vuelve idéntica",async app=>{
      await aLaSerie(app,{reducido:false});
      app.w.logSet();app.w.logSet();await descanso(app);
      const base=Object.keys(F.dueno()).concat("rp_schema").sort();
      expect(app.claves()).toEqual(base.concat("rp_session").sort());
      const idaYVuelta=async()=>{const antes=app.foto(),d=await exportar(app);
        expect(JSON.parse(d.texto).store).toEqual(antes);
        localStorage.clear();
        const recarga=app.cargo();importar(app,d.texto);await recarga;await app.listo();
        expect(app.foto()).toEqual(antes);};
      /* a mitad de sesion: la serie y el récord viajan en rp_session */
      await idaYVuelta();
      const s=app.leer("rp_session");
      expect(s.log.press_banca_db).toHaveLength(1);
      expect(s.pr).toHaveLength(1);
      cierraConUna(app);
      expect(app.claves()).toEqual(base);
      await idaYVuelta();
      expect(deHoy(app,"press_banca_db")).toEqual([["60x8"]]);});
  });

  /* almacenamiento dañado: la app tiene que seguir abriendo */
  const CLAVES=["rp_bw","rp_checks","rp_custom","rp_doses","rp_extras","rp_history","rp_lastexport","rp_logged","rp_logs",
    "rp_medidas","rp_notes","rp_pain","rp_plan","rp_prefs","rp_rem","rp_session","rp_streak","rp_swaps","rp_theme","rp_weekgoal"];
  async function recorrer(app){["history","progress","settings","home"].forEach(v=>{
      app.$('.nav .tab[data-v="'+v+'"]').click();expect(app.activa()).toBe(v);});
    app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");expect(app.activa()).toBe("guided");}
  escenario("Datos dañados",F.vacio,()=>{
    test("JSON roto en todas las claves: arranca y recorre las pantallas",async app=>{
      const c={};CLAVES.forEach(k=>c[k]="{roto");await app.arrancar({__crudo:c});
      expect(app.$$("#routines .rcard").length).toBe(9);await recorrer(app);});
    test("null en todas las claves: arranca y recorre las pantallas",async app=>{
      const c={};CLAVES.forEach(k=>c[k]="null");await app.arrancar({__crudo:c});await recorrer(app);});
    /* antes de v36 una copia con rp_history:{} se importaba y al recargar
       Inicio lanzaba loadHist(...).forEach is not a function: app en blanco */
    test("una copia con la forma cambiada se rechaza entera, antes de preguntar",async app=>{
      await app.arrancar(F.dueno);const antes=app.foto(),n=app.w.__dialogos.length;
      /* de una en una: FileReader va a su ritmo y el aviso dice que esa ya se leyo */
      for(const t of ['{"store":{"rp_history":"{}"}}','{"store":{"rp_plan":{},"rp_bw":[]}}','{"store":{"rp_logs":[]}}',
        '{"store":{"rp_rem":[1]}}','{"store":{"rp_theme":5}}','{"store":{"rp_schema":"\\"1\\""}}',
        '{"store":{"rp_schema":-1}}']){sinAviso(app);importar(app,t);
        await app.hasta(()=>app.texto("#toast").indexOf("no es una copia válida")>=0,3000,"el rechazo de "+t);
        expect(app.foto()).toEqual(antes);}
      expect(pregunto(app,n)).toBe(0);});
    test("claves ya guardadas con otra forma: arranca y recorre las pantallas",async app=>{
      const c={rp_history:"{}",rp_plan:"{}",rp_bw:"{}",rp_medidas:"{}",rp_logs:"[]",rp_custom:"[]",rp_extras:"[]",
        rp_swaps:"[]",rp_doses:"[]",rp_checks:"[]",rp_logged:"[]",rp_pain:"[]",rp_notes:"[]",rp_prefs:"[]",
        rp_streak:"[]",rp_weekgoal:"[]",rp_rem:"[]",rp_session:"[]",rp_theme:"5",rp_lastexport:"[]",rp_schema:"[]"};
      await app.arrancar({__crudo:c});
      expect(app.$$("#routines .rcard").length).toBe(9);await recorrer(app);
      /* leer con otra forma no reescribe nada: la copia lo exportaria tal cual */
      expect(localStorage.getItem("rp_history")).toBe("{}");});
  });

  /* rp_schema (v36): las migraciones corren al arrancar, antes de cualquier
     lectura, en orden y una sola vez. La 1 solo declara el esquema. */
  escenario("Esquema de datos (rp_schema)",F.dueno,()=>{
    test("datos de v35 sin rp_schema: al arrancar quedan en el esquema actual",app=>{
      expect(app.ev("SCHEMA")).toBeGreaterThan(0);
      expect(app.ev("SCHEMA")).toBe(app.ev("MIGRACIONES.length"));
      expect(app.leer("rp_schema")).toBe(app.ev("SCHEMA"));});
    test("la migración 1 declara el esquema sin tocar ningún dato",app=>{
      localStorage.removeItem("rp_schema");const antes=app.foto();
      expect(app.w.migrarDatos()).toBe(app.ev("SCHEMA"));
      const despues=app.foto();expect(despues.rp_schema).toBe(String(app.ev("SCHEMA")));
      delete despues.rp_schema;expect(despues).toEqual(antes);});
    test("migrar dos veces deja el mismo estado, también tras recargar",async app=>{
      app.w.migrarDatos();const una=app.foto();
      app.w.migrarDatos();expect(app.foto()).toEqual(una);
      await app.recargar();expect(app.foto()).toEqual(una);});
    test("rp_schema dañado se rehace; uno de una versión más nueva no se toca",app=>{
      const S=app.ev("SCHEMA");
      ["{roto",'"1"',"-2","1.5","null"].forEach(v=>{localStorage.setItem("rp_schema",v);app.w.migrarDatos();
        expect(app.leer("rp_schema")).toBe(S);});
      localStorage.setItem("rp_schema","99");const antes=app.foto();
      expect(app.w.migrarDatos()).toBe(99);expect(app.foto()).toEqual(antes);
      localStorage.setItem("rp_schema",String(S));});
    test("las migraciones corren en orden, una sola vez, y la que falla no avanza el esquema",app=>{
      const M=app.w.MIGRACIONES,n=M.length,orden=()=>app.leer("rp_prueba_orden")||[];
      const anota=i=>{localStorage.setItem("rp_prueba_orden",JSON.stringify(orden().concat(i)));};
      let falla=true;
      M.push(()=>anota(n+1));M.push(()=>{if(falla)throw new Error("migración rota");anota(n+2);});
      try{let err=null;try{app.w.migrarDatos();}catch(e){err=e;}
        expect(err&&err.message).toBe("migración rota");
        expect(app.leer("rp_schema")).toBe(n+1);
        expect(orden()).toEqual([n+1]);
        falla=false;expect(app.w.migrarDatos()).toBe(n+2);
        expect(orden()).toEqual([n+1,n+2]);
        app.w.migrarDatos();expect(orden()).toEqual([n+1,n+2]);
      }finally{M.length=n;localStorage.removeItem("rp_prueba_orden");localStorage.setItem("rp_schema",String(n));}});
    test("una copia vieja sin rp_schema se importa y se migra en el acto",async app=>{
      const data=JSON.parse((await exportar(app)).texto),n=app.ev("SCHEMA");
      expect(data.store.rp_schema).toBe(String(n));
      delete data.store.rp_schema;
      /* una migracion de prueba demuestra que la copia pasa por la cadena,
         sin esperar a la recarga */
      app.w.MIGRACIONES.push(()=>{localStorage.setItem("rp_prueba_migrada","true");});
      localStorage.clear();sinAviso(app);
      const recarga=app.cargo();importar(app,JSON.stringify(data));
      await app.hasta(()=>app.texto("#toast").indexOf("Datos importados")>=0,3000,"el aviso de importado");
      expect(app.leer("rp_schema")).toBe(n+1);
      expect(app.leer("rp_prueba_migrada")).toBe(true);
      await recarga;await app.listo();
      /* tras recargar la app vuelve a su cadena real: un esquema mas nuevo no se toca */
      expect(app.leer("rp_schema")).toBe(n+1);
      const f=app.foto();delete f.rp_schema;delete f.rp_prueba_migrada;
      expect(f).toEqual(data.store);
      localStorage.removeItem("rp_prueba_migrada");localStorage.setItem("rp_schema",String(n));});
    test("una copia de una versión más nueva no se importa",async app=>{
      const antes=app.foto(),n=app.w.__dialogos.length;sinAviso(app);
      importar(app,JSON.stringify({store:{rp_schema:99,rp_history:[]}}));
      await app.hasta(()=>app.texto("#toast").indexOf("versión más nueva")>=0,3000,"el aviso de copia más nueva");
      expect(app.foto()).toEqual(antes);
      expect(pregunto(app,n)).toBe(0);});
  });

  escenario("Copia de seguridad (datos de la madre)",F.madre,()=>{
    test("ida y vuelta idéntica, con la sesión en curso y rp_schema",async app=>{
      const antes=app.foto();
      expect(antes.rp_schema).toBe(String(app.ev("SCHEMA")));
      expect(antes.rp_session).toBeTruthy();
      const d=await exportar(app),data=JSON.parse(d.texto);
      expect(data.store).toEqual(antes);
      localStorage.clear();
      const recarga=app.cargo();importar(app,d.texto);await recarga;await app.listo();
      expect(app.foto()).toEqual(antes);
      /* y la copia de la copia sale igual */
      expect(JSON.parse((await exportar(app)).texto).store).toEqual(data.store);});
  });

  /* almacenamiento lleno: jset devuelve false. Lo critico avisa y no pierde
     el dato: ni la serie en memoria ni la sesion guardada. */
  escenario("Almacenamiento lleno · anotar y terminar en el guiado",F.vacio,()=>{
    test("anotar una serie sin espacio avisa y la serie sigue; al haber espacio se guarda",async app=>{
      app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");sinAviso(app);
      const libera=lleno(app,{margen:0});
      try{app.w.logSet();
        expect(app.texto("#toast")).toContain("No cupo en el teléfono");
        expect(app.ev("sessionLog").press_banca_db.length).toBe(1);
        await app.espera(400);   /* deja pasar el paso al descanso */
        const antes=app.foto();
        app.w.finish();
        expect(app.texto("#guided")).toContain("No cupo en el teléfono");
        expect(app.texto("#guided")).not.toContain("Completada");
        expect(app.foto()).toEqual(antes);
        expect(app.ev("sessionLog").press_banca_db.length).toBe(1);
      }finally{libera();}
      app.$("#guided .gbtn.go").click();
      expect(app.texto("#guided")).toContain("Completada");
      const l=app.leer("rp_logs").press_banca_db;
      expect(l.length).toBe(1);expect(l[0].sets.length).toBe(1);
      expect(app.leer("rp_history")[0].key).toBe("gym_empuje");
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
  });

  escenario("Almacenamiento lleno · sesión guardada de la madre",F.madre,()=>{
    test("finalizar sin espacio no escribe a medias ni borra la sesión",app=>{
      const antes=app.foto();expect(antes.rp_session).toBeTruthy();
      let libera=lleno(app,{margen:0});
      try{expect(app.w.finishSession("salud_fuerza_b","sheet")).toEqual({lleno:true});}finally{libera();}
      expect(app.foto()).toEqual(antes);
      /* las series caben pero el historial no: tambien se deshacen las series */
      libera=lleno(app,{solo:["rp_history"]});
      try{expect(app.w.finishSession("salud_fuerza_b","sheet")).toEqual({lleno:true});}finally{libera();}
      expect(app.foto()).toEqual(antes);});
    test("empezar otra rutina sin espacio no borra la sesión que estaba abierta",app=>{
      const antes=app.foto();sinAviso(app);const libera=lleno(app,{margen:0});
      let s;try{s=app.w.startSess("salud_fuerza_a","check");}finally{libera();}
      expect(s).toBe(null);
      expect(app.foto()).toEqual(antes);
      expect(app.leer("rp_session").key).toBe("salud_fuerza_b");
      expect(app.texto("#toast")).toContain("sigue abierta");});
    /* la que no cupo sigue en rp_session: cerrar o descartar la otra rutina
       no puede borrarla de paso (antes clearSess era incondicional) */
    test("finalizar la otra rutina no borra la sesión que no cupo",app=>{
      sinAviso(app);const libera=lleno(app,{margen:0});
      try{expect(app.w.startSess("salud_fuerza_a","check")).toBe(null);}finally{libera();}
      const sesion=app.foto().rp_session;
      app.w.markCheck("salud_fuerza_a","marcha_sitio",true);
      const res=app.w.finishSession("salud_fuerza_a","sheet");
      expect(res).toBeTruthy();expect(res.lleno).toBeFalsy();
      expect(app.leer("rp_history")[0].key).toBe("salud_fuerza_a");
      expect(app.leer("rp_session").key).toBe("salud_fuerza_b");
      expect(app.foto().rp_session).toBe(sesion);
      app.reiniciarMemoria();});
    test("descartar la otra rutina no borra la sesión que no cupo",async app=>{
      app.w.openRoutine("salud_fuerza_a");
      sinAviso(app);const libera=lleno(app,{margen:0});
      try{expect(app.w.startSess("salud_fuerza_a","check")).toBe(null);}finally{libera();}
      const sesion=app.foto().rp_session;
      app.w.markCheck("salud_fuerza_a","gato_camello",true);
      /* con la hoja abierta, el history.back() de descartar solo la cierra */
      app.w.openFinish();
      const resp=app.w.__respuestaConfirm;app.w.__respuestaConfirm=true;
      try{app.w.discardSession();}finally{app.w.__respuestaConfirm=resp;}
      await app.espera(50);
      expect(app.$("#finov").classList.contains("show")).toBe(false);
      expect(app.w.checksOn(app.w.today(),"salud_fuerza_a")).toEqual({});
      expect(app.leer("rp_session").key).toBe("salud_fuerza_b");
      expect(app.foto().rp_session).toBe(sesion);
      app.reiniciarMemoria();});
    test("marcar un visto sin espacio avisa",app=>{
      sinAviso(app);const libera=lleno(app,{margen:0});
      try{app.w.markCheck("salud_fuerza_b","remo_banda",true);}finally{libera();}
      expect(app.texto("#toast")).toContain("No cupo en el teléfono");});
    test("importar sin espacio deja los datos como estaban y lo dice",async app=>{
      const antes=app.foto(),copia=JSON.stringify({store:{rp_notes:{remo_db:"x".repeat(5000)}}});
      sinAviso(app);const libera=lleno(app,{margen:1000});
      try{importar(app,copia);
        await app.hasta(()=>app.texto("#toast").indexOf("quedaron como estaban")>=0,3000,"el aviso");}
      finally{libera();}
      expect(app.foto()).toEqual(antes);
      expect(app.texto("#toast")).toContain("No cupo en el teléfono");});
    test("la hoja de finalizar avisa y se queda abierta; con espacio, guarda",async app=>{
      app.w.openRoutine("salud_fuerza_b");app.w.openFinish();
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      const antes=app.foto();sinAviso(app);const libera=lleno(app,{margen:0});
      try{app.w.confirmFinish();}finally{libera();}
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      expect(app.texto("#toast")).toContain("No cupo en el teléfono");
      expect(app.foto()).toEqual(antes);
      app.w.confirmFinish();await app.espera(50);
      expect(app.$("#finov").classList.contains("show")).toBe(false);
      expect(app.leer("rp_session")).toBe(null);
      expect(app.leer("rp_logs").remo_db.slice(-1)[0].date).toBe(app.w.today());
      app.reiniciarMemoria();});
  });

  /* salir del guiado y volver a entrar (la rutina, Continuar, adelante en el
     historial) tomaba la copia de rp_session, o {}: la serie que no cupo y
     solo vivia en memoria se perdia sin aviso */
  const activa=(app,v)=>app.$("#"+v).classList.contains("active");
  async function salirDelGuiado(app){app.w.guidedExit();
    await app.hasta(()=>activa(app,"routine"),3000,"la pantalla de la rutina");}
  escenario("Almacenamiento lleno · salir del guiado y volver",F.vacio,()=>{
    test("la serie que no cupo sobrevive a salir y volver a entrar; con espacio se guarda",async app=>{
      app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");
      expect(app.leer("rp_session").key).toBe("gym_empuje");
      sinAviso(app);const libera=lleno(app,{margen:0});
      try{app.w.logSet();
        expect(app.texto("#toast")).toContain("No cupo en el teléfono");
        expect(app.leer("rp_session").log).toEqual({});
        await app.espera(400);
        /* atras: el popstate pinta la rutina (openRoutine) */
        await salirDelGuiado(app);
        expect(app.ev("sessionLog").press_banca_db.length).toBe(1);
        /* adelante en el historial: resumeGuided */
        app.w.history.forward();
        await app.hasta(()=>activa(app,"guided"),3000,"el guiado");
        expect(app.ev("sessionLog").press_banca_db.length).toBe(1);
        /* otra vez fuera y Continuar: startRoutine */
        await salirDelGuiado(app);
        app.$("#routCta .btn:not(.sec)").click();
        expect(activa(app,"guided")).toBe(true);
        expect(app.ev("sessionLog").press_banca_db.length).toBe(1);
        expect(app.leer("rp_session").log).toEqual({});
      }finally{libera();}
      app.w.finish();
      expect(app.texto("#guided")).toContain("Completada");
      const l=app.leer("rp_logs").press_banca_db;
      expect(l.length).toBe(1);expect(l[0].sets.length).toBe(1);
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
  });

  /* startSess devuelve null porque la sesion de otra rutina no cupo: la nueva
     no tiene rp_session propia y startRoutine dejaba la memoria en {} */
  escenario("Almacenamiento lleno · otra sesión sin cerrar y salir del guiado",F.madre,()=>{
    test("la serie en memoria sobrevive a salir y Continuar; con espacio se guarda y la otra sigue",async app=>{
      const sesion=app.foto().rp_session;expect(app.leer("rp_session").key).toBe("salud_fuerza_b");
      sinAviso(app);const libera=lleno(app,{margen:0});
      try{app.w.openRoutine("salud_fuerza_a");app.w.startRoutine("sentadilla_silla");
        expect(app.texto("#toast")).toContain("sigue abierta");
        expect(app.ev("steps[stepi].id")).toBe("sentadilla_silla");
        app.w.logSet();
        expect(app.ev("sessionLog").sentadilla_silla.length).toBe(1);
        await app.espera(400);
        await salirDelGuiado(app);
        app.$("#routCta .btn:not(.sec)").click();
        expect(activa(app,"guided")).toBe(true);
        expect(app.ev("sessionLog").sentadilla_silla.length).toBe(1);
      }finally{libera();}
      expect(app.foto().rp_session).toBe(sesion);
      app.w.finish();
      expect(app.texto("#guided")).toContain("Completada");
      const l=app.leer("rp_logs").sentadilla_silla.slice(-1)[0];
      expect(l.date).toBe(app.w.today());expect(l.sets.length).toBe(1);
      expect(app.foto().rp_session).toBe(sesion);
      app.reiniciarMemoria();});
  });
})();
