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
  /* HU-63: la hoja de conflicto vive en #planov */
  const hoja=app=>app.$("#planov").classList.contains("show");
  const boton=(app,txt)=>app.$$("#planBody button").find(b=>b.textContent.indexOf(txt)>=0);

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
  const CLAVES=["rp_bw","rp_checks","rp_custom","rp_doses","rp_extras","rp_history","rp_inc","rp_lastexport","rp_logged","rp_logs",
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
        rp_swaps:"[]",rp_doses:"[]",rp_checks:"[]",rp_logged:"[]",rp_pain:"[]",rp_notes:"[]",rp_inc:"[]",rp_prefs:"[]",
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

  /* rp_inc (v36): el salto de placa de cada maquina viaja en la copia */
  const SALTOS_GIMNASIO={jalon_pecho:5,extension_triceps_polea:4.5,pec_deck:7,remo_maquina:2.5};
  escenario("Copia de seguridad con saltos de máquina (rp_inc)",()=>Object.assign(F.dueno(),{rp_inc:SALTOS_GIMNASIO}),()=>{
    test("exportar → importar conserva rp_inc con sus valores",async app=>{
      const antes=app.foto();
      expect(app.leer("rp_inc")).toEqual(SALTOS_GIMNASIO);
      const d=await exportar(app),data=JSON.parse(d.texto);
      expect(JSON.parse(data.store.rp_inc)).toEqual(SALTOS_GIMNASIO);
      localStorage.clear();
      const recarga=app.cargo();importar(app,d.texto);await recarga;await app.listo();
      expect(app.foto()).toEqual(antes);
      expect(app.leer("rp_inc")).toEqual(SALTOS_GIMNASIO);
      /* y la app los usa al volver */
      expect(["jalon_pecho","extension_triceps_polea","pec_deck","remo_maquina"].map(id=>app.w.stepFor(id,40))).toEqual([5,4.5,7,2.5]);});
    test("una copia con rp_inc que no es un objeto se rechaza entera, antes de preguntar",async app=>{
      const antes=app.foto(),n=app.w.__dialogos.length;
      for(const t of ['{"store":{"rp_inc":"[5]"}}','{"store":{"rp_inc":"5"}}']){sinAviso(app);importar(app,t);
        await app.hasta(()=>app.texto("#toast").indexOf("no es una copia válida")>=0,3000,"el rechazo de "+t);
        expect(app.foto()).toEqual(antes);}
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

  /* HU-11: en pantalla solo queda la racha de semanas (weekStats), pero
     rp_streak se sigue escribiendo igual: su total es «N sesiones en total» */
  escenario("Racha diaria guardada (rp_streak)",F.dueno,()=>{
    test("terminar una sesión escribe rp_streak como siempre (completeDay)",app=>{
      const s0=app.leer("rp_streak"),hoy=app.w.today();
      expect(s0.last).not.toBe(hoy);
      app.w.markCheck("gym_empuje","caminadora",true);
      const res=app.w.finishSession("gym_empuje","sheet");
      expect(!!res&&!res.lleno).toBe(true);
      const cuenta=s0.last===app.w.yesterday()?s0.count+1:1;
      expect(app.leer("rp_streak")).toEqual({count:cuenta,best:Math.max(s0.best,cuenta),last:hoy,total:s0.total+1});
      expect(res.streak).toEqual(app.leer("rp_streak"));
      /* una segunda sesion el mismo dia suma al total y no a la cuenta */
      app.w.markCheck("gym_tiron","caminadora",true);
      expect(!!app.w.finishSession("gym_tiron","sheet")).toBe(true);
      expect(app.leer("rp_streak")).toEqual({count:cuenta,best:Math.max(s0.best,cuenta),last:hoy,total:s0.total+1});
      app.reiniciarMemoria();});
    test("recalcStreak recuenta los días seguidos desde el historial sin bajar el total",app=>{
      const h=app.leer("rp_history"),dias=new Set(h.map(x=>F.ds(new Date(x.iso)))),s0=app.leer("rp_streak");
      let d=new Date(),n=0;if(!dias.has(F.ds(d)))d.setDate(d.getDate()-1);
      while(dias.has(F.ds(d))){n++;d.setDate(d.getDate()-1);}
      const s=app.w.recalcStreak();
      expect(Object.keys(s).sort()).toEqual(["best","count","last","total"]);
      expect([s.count,s.last,s.total]).toEqual([n,[...dias].sort().pop(),Math.max(s0.total,h.length)]);
      expect(s.best).not.toBeLessThan(s0.best);
      expect(app.leer("rp_streak")).toEqual(s);});
    test("exportar → importar conserva rp_streak intacto y la racha semanal sale igual",async app=>{
      const antes=localStorage.getItem("rp_streak"),w=app.w.weekStats(),d=await exportar(app);
      expect(JSON.parse(d.texto).store.rp_streak).toBe(antes);
      localStorage.clear();
      const recarga=app.cargo();importar(app,d.texto);await recarga;await app.listo();
      expect(localStorage.getItem("rp_streak")).toBe(antes);
      expect(app.w.weekStats()).toEqual(w);
      expect(app.texto("#stCount")).toBe(String(w.racha));});
  });

  /* v35 congelaba en rp_weekgoal solo la meta de la semana viva: las semanas
     anteriores no tienen foto y se miden con la meta actual. Con todas las
     sesiones del juego de gimnasio completas, cada semana entera lleva 3 de fuerza. */
  function semanasV35(){const D=F.dueno();D.rp_history.forEach(h=>{h.exTotal=h.exDone;});delete D.rp_weekgoal;return D;}
  escenario("Racha semanal con datos de v35 (sin rp_weekgoal de semanas viejas)",semanasV35,()=>{
    const lun=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return F.ds(x);};
    const haceSemanas=i=>{const x=new Date();x.setDate(x.getDate()-7*i);return lun(x);};
    /* cuenta aparte: semanas seguidas hacia atras desde la pasada con al
       menos su meta de sesiones de fuerza (60 % hecho), y la actual si ya
       la cumplio */
    function esperada(app,meta,fotos){const G=app.ev("GYMKEYS"),m={};
      app.leer("rp_history").forEach(h=>{if(G.indexOf(h.key)<0||(h.exTotal&&h.exDone/h.exTotal<0.6))return;
        const k=lun(new Date(h.iso));m[k]=(m[k]||0)+1;});
      const metaDe=k=>fotos&&fotos[k]!=null?fotos[k]:meta;let r=0;
      for(let i=1;i<300;i++){const k=haceSemanas(i);if((m[k]||0)>=metaDe(k))r++;else break;}
      return r+((m[lun(new Date())]||0)>=meta?1:0);}
    const plan4=["gym_empuje","gym_tiron","gym_pierna","gym_empuje",null,null,"rest"];
    test("la racha se mide con la meta actual y solo se congela la semana en curso",app=>{
      const w=app.w.weekStats();
      expect(w.goal).toBe(3);
      expect(w.racha).toBe(esperada(app,3));
      expect(w.racha).toBeGreaterThan(3);
      expect(w.mejor).not.toBeLessThan(w.racha);
      expect(app.leer("rp_weekgoal")).toEqual({[lun(new Date())]:3});
      expect(app.texto("#stCount")).toBe(String(w.racha));});
    test("con la meta subida a 4 las semanas sin foto se miden con 4; las congeladas guardan la suya",app=>{
      /* semanas cerradas cumplidas con 3: la actual no puede llegar a 4 (el
         juego de gimnasio entrena lunes, miercoles y viernes, y hoy aun no) */
      const plan=localStorage.getItem("rp_plan"),w3=app.w.weekStats(),cerradas=w3.racha-(w3.semanaOK?1:0);
      try{localStorage.setItem("rp_plan",JSON.stringify(plan4));
        expect(app.w.weekStats().goal).toBe(4);
        expect(app.w.weekStats().racha).toBe(esperada(app,4));
        expect(app.w.weekStats().racha).toBe(0);
        /* como si v36 hubiera congelado las semanas viejas con 3 */
        const fotos={};for(let i=1;i<=8;i++)fotos[haceSemanas(i)]=3;
        localStorage.setItem("rp_weekgoal",JSON.stringify(fotos));
        const w=app.w.weekStats();
        expect(w.racha).toBe(esperada(app,4,fotos));
        expect(w.racha).toBe(cerradas);
        expect(w.racha).toBeGreaterThan(3);
        /* y nada se rompe: las pantallas pintan la misma cifra */
        ["progress","settings","history","home"].forEach(v=>{app.$('.nav .tab[data-v="'+v+'"]').click();expect(app.activa()).toBe(v);});
        expect(app.texto("#stCount")).toBe(String(w.racha));
        expect(app.texto("#stWeek")).toContain(" de 4 esta semana");
      }finally{localStorage.setItem("rp_plan",plan);localStorage.setItem("rp_weekgoal",JSON.stringify({}));app.w.weekStats();}});
  });

  /* la mejor racha de semanas no se parte en un cambio de hora. Se contaba
     restando milisegundos entre dos lunes, y con un cambio en medio salian
     7 dias +-1 h. CI corre en UTC, donde no pasa nunca: cada zona se emula
     con app.enZona y el reloj en el miercoles 4 de noviembre de 2026. Las
     cifras esperadas estan contadas a mano (Fixtures.cambioHora). */
  escenario("Racha semanal que cruza cambios de hora",F.cambioHora,()=>{
    test("en la zona del equipo la mejor racha son las 8 semanas de marzo y abril",app=>{
      expect(app.w.weekStats().mejor).toBe(8);});
    /* zona, dos lunes seguidos con su cambio de hora en medio y las horas
       que hay entre ellos (UTC no cambia nunca: es el control) */
    [["UTC","2026-03-23","2026-03-30",168],["Europe/Madrid","2026-03-23","2026-03-30",167],
     ["America/New_York","2026-03-02","2026-03-09",167],["America/Santiago","2026-03-30","2026-04-06",169],
     ["Australia/Sydney","2026-03-30","2026-04-06",169]].forEach(([zona,l1,l2,horas])=>{
      test("en "+zona+": racha 3 (las de octubre) y mejor 8 (marzo y abril)",async app=>{
        await app.enZona(zona,()=>{const D=app.w.Date;
          /* la zona emulada de verdad cambia de hora entre esos dos lunes */
          expect((new D(l2+"T00:00:00")-new D(l1+"T00:00:00"))/36e5).toBe(horas);
          expect(app.w.today()).toBe("2026-11-04");
          const w=app.w.weekStats();
          expect({goal:w.goal,hechas:w.hechas,racha:w.racha,mejor:w.mejor,semanaOK:w.semanaOK})
            .toEqual({goal:3,hechas:2,racha:3,mejor:8,semanaOK:false});
        },"2026-11-04T12:30:00Z");});
    });
  });

  /* v36: los saltados y el repaso de pendientes viven en rp_session. La copia
     los lleva, y al volver el guiado sigue donde estaba y en el mismo orden. */
  escenario("Copia de seguridad · sesión repasando pendientes (dueño)",F.dueno,()=>{
    test("exportar → importar conserva saltados y repaso, y el guiado retoma en el mismo paso",async app=>{
      const R="gym_empuje",l=app.w.effList(R),id=()=>app.ev("steps[stepi].id");
      const avanzarHasta=x=>{for(let n=0;n<300&&id()!==x;n++)app.w.advance();expect(id()).toBe(x);};
      const hastaElFinal=()=>{const v=[];for(let n=0;n<300&&!app.$("#guided .done");n++){
        if(v[v.length-1]!==id())v.push(id());app.w.advance();}return v;};
      /* empieza por el 4.º, salta el press de pecho, llega al aviso y hace el 1.º pendiente */
      app.w.openRoutine(R);app.w.startRoutine(l[3]);
      avanzarHasta("press_banca_db");app.w.guidedSkipExercise();
      hastaElFinal();app.w.hacerPendientes();avanzarHasta(l[1]);
      const paso=app.ev("stepi"),s=app.leer("rp_session");
      expect([s.stepi,s.saltados,s.repaso]).toEqual([paso,["press_banca_db"],l.slice(0,3)]);
      const antes=app.foto(),d=await exportar(app);
      expect(JSON.parse(JSON.parse(d.texto).store.rp_session)).toEqual(s);
      localStorage.clear();
      const recarga=app.cargo();importar(app,d.texto);await recarga;await app.listo();
      expect(app.foto()).toEqual(antes);
      /* la recarga vuelve al guiado (resumeGuided) en el mismo paso... */
      expect(app.activa()).toBe("guided");
      expect([app.ev("stepi"),id()]).toEqual([paso,l[1]]);
      /* ...y salir y "Continuar" (startRoutine) tambien */
      app.w.guidedExit();await app.hasta(()=>app.activa()==="routine",3000,"la rutina");
      app.$("#routCta .btn:not(.sec)").click();
      expect([app.activa(),app.ev("stepi"),id()]).toEqual(["guided",paso,l[1]]);
      /* el repaso sigue: del 2.º al 3.º pendiente y al final, sin pasar por los
         hechos; el saltado no sale como pendiente ni cuenta como hecho */
      expect(hastaElFinal()).toEqual([l[1],l[2]]);
      expect(app.$("#guided .finlist")).toBe(null);
      expect(app.texto("#guided .done .mut")).toMatch(/^Completada/);
      const h=app.leer("rp_history")[0];
      expect([h.exDone,h.exTotal]).toEqual([13,14]);
      app.reiniciarMemoria();});
  });

  /* HU-10: los records guardan el numero de la serie (i) y que se supero
     (kind). La copia va por prefijo y como texto, asi que viajan solos; la
     prueba lo fija. */
  escenario("Récords en la copia de seguridad",F.dueno,()=>{
    test("exportar → importar conserva i y kind en rp_history[].pr",async app=>{
      app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");
      app.ev("curW=60;curReps=8");app.w.logSet();await app.espera(400);
      expect(app.w.finishSession("gym_empuje","guided").summary.sets).toBe(1);
      const pr=app.leer("rp_history")[0].pr;
      expect(pr.map(p=>[p.id,p.w,p.reps,p.i,p.kind])).toEqual([["press_banca_db",60,8,0,"Peso máximo"]]);
      const antes=app.foto(),d=await exportar(app);
      expect(JSON.parse(JSON.parse(d.texto).store.rp_history)[0].pr).toEqual(pr);
      localStorage.clear();
      const recarga=app.cargo();importar(app,d.texto);await recarga;await app.listo();
      expect(app.foto()).toEqual(antes);
      expect(app.leer("rp_history")[0].pr).toEqual(pr);
      app.reiniciarMemoria();});
  });

  /* datos de v35: sus pr son {id,w,reps,lvl}, sin i ni kind. El ultimo
     entrenamiento de F.dueno trae uno, y la sesion de hoy otro a medias. */
  function prV35(){const D=F.dueno(),t=Math.max(F.momento(0,0,1).getTime(),Date.now()-20*60000);
    D.rp_history[0].pr=[{id:"hack_squat",w:70,reps:9,lvl:2}];
    D.rp_session={v:1,key:"gym_empuje",date:F.fecha(0),startedAt:t,lastAt:t+60000,stepi:0,src:"guided",
      log:{press_banca_db:[{w:40,reps:8,t:t+30000},{w:40,reps:8,t:t+40000}]},pr:[{id:"press_banca_db",w:40,reps:8,lvl:2}]};
    return D;}
  const TIPOS=/Peso máximo|Mejor 1RM|Más reps/;
  escenario("Récords de v35 (sin i ni kind)",prV35,()=>{
    test("el guiado y la pantalla de fin se pintan sin errores y sin etiqueta de tipo",app=>{
      app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");
      expect(app.$$("#guided .setline").length).toBe(2);
      expect(app.$$("#guided .setline.pr, #guided .prtag").length).toBe(0);
      app.w.finish();
      /* con HU-09 terminar con ejercicios sin hacer guarda lo hecho y dice
         "Guardada · X de Y", nunca "Completada": aqui solo se hizo el pecho */
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 1 de 14 ejercicios");
      expect(app.$$("#guided .doneprs .r").length).toBe(1);
      expect(app.texto("#guided .doneprs .r")).toContain("40 kg × 8");
      expect(app.$$("#guided .doneprs .k").length).toBe(0);
      expect(app.texto("#guided")).not.toMatch(TIPOS);
      /* el historial lo guarda tal cual vino: sin inventarle i ni kind */
      expect(app.leer("rp_history")[0].pr).toEqual([{id:"press_banca_db",w:40,reps:8,lvl:2}]);
      app.reiniciarMemoria();});
    test("el calendario pinta los días con records de v35 sin errores y sin etiqueta de tipo",app=>{
      app.$('.nav .tab[data-v="history"]').click();expect(app.activa()).toBe("history");
      const dias=app.leer("rp_history").filter(h=>h.pr).map(h=>app.w.ds(new Date(h.iso)));
      expect(dias.length).toBeGreaterThan(0);
      dias.forEach(d=>{app.w.calPick(d);
        expect(app.$$("#histBody .dayblock").length).toBeGreaterThan(0);
        expect(app.texto("#histBody")).not.toMatch(TIPOS);});});
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
      /* guardada al reintentar. Quedan 13 sin hacer: desde v36 dice "Guardada", nunca "Completada" */
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 1 de 14 ejercicios");
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
      /* HU-63: entrar no crea la sesion; el primer visto si, y queda en disco
         sin la serie que viene */
      expect(app.leer("rp_session")).toBe(null);
      app.w.markCheck("gym_empuje","caminadora",true);
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
      /* hechos: la caminadora (el visto que crea la sesion, HU-63) y el press
         con su serie. Quedan 12 sin hacer: "Guardada", nunca "Completada" */
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 2 de 14 ejercicios");
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
        /* HU-63: ya no la cierra sola; pregunta, y guardarla no cabe */
        expect(hoja(app)).toBe(true);
        expect(app.texto("#toast")).toBe("");
        boton(app,"Guardar Casa — Fuerza B y empezar Casa — Fuerza A").click();
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
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 1 de 12 ejercicios");
      const l=app.leer("rp_logs").sentadilla_silla.slice(-1)[0];
      expect(l.date).toBe(app.w.today());expect(l.sets.length).toBe(1);
      expect(app.foto().rp_session).toBe(sesion);
      app.reiniciarMemoria();});
  });

  /* HU-63: mirar otra rutina no cierra la que esta a medias. Tocar una fila,
     su play o su visto en Tirón cerraba Empuje sola (finishSession "auto") y
     la guardaba como terminada. Ahora sale una hoja y nada cambia hasta elegir. */
  const fila=(app,id)=>app.$('#routine .ex[data-ex="'+id+'"]');
  async function cerrarHoja(app){app.w.history.back();await app.hasta(()=>!hoja(app),3000,"que se cierre la hoja");}
  escenario("Otra rutina con Empuje a medias",F.aMedias,()=>{
    test("de partida: Empuje a medias, 3 de 14, y en curso en Inicio",app=>{
      expect(app.leer("rp_session").key).toBe("gym_empuje");
      const st=app.w.sessStats("gym_empuje");
      expect([st.exDone,st.exTotal,st.sets]).toEqual([3,14,3]);
      expect(app.texto("#todayCard")).toContain("En curso");
      expect(app.texto("#todayCard")).toContain("Empuje");});
    test("tocar una fila, su figura, su play, su visto o Empezar en Tirón abre la hoja en 1 toque y no cambia nada",async app=>{
      const antes=app.foto(),h0=app.leer("rp_history").length;
      app.w.openRoutine("gym_tiron");
      const toques=[["la fila",()=>fila(app,"jalon_pecho").querySelector(".nm")],
        ["la figura",()=>fila(app,"jalon_pecho").querySelector(".diag")],
        ["el play",()=>fila(app,"jalon_pecho").querySelector(".exstart")],
        ["el visto",()=>fila(app,"jalon_pecho").querySelector(".exck")],
        ["Empezar",()=>app.$("#routCta .btn:not(.sec)")]];
      for(const [que,el] of toques){
        el().click();
        expect(que+": "+hoja(app)).toBe(que+": true");
        expect(app.activa()).toBe("routine");
        expect(app.texto("#planTitle")).toBe("Tienes Empuje a medias");
        expect(app.texto("#planBody")).toContain("Empuje · 3 de 14 hechos · 3 series");
        expect(app.leer("rp_session").key).toBe("gym_empuje");
        expect(app.leer("rp_history").length).toBe(h0);
        expect(app.foto()).toEqual(antes);
        await cerrarHoja(app);
        expect(app.foto()).toEqual(antes);}
      /* el visto no quedo marcado ni en pantalla */
      expect(fila(app,"jalon_pecho").classList.contains("checked")).toBe(false);
      expect(fila(app,"jalon_pecho").querySelector(".exck").getAttribute("aria-checked")).toBe("false");});
    test("la hoja no tiene opción destructiva: dos botones con nombre, sin borrar ni descartar",async app=>{
      const n=app.w.__dialogos.length;
      app.w.openRoutine("gym_tiron");app.w.startRoutine("jalon_pecho");
      expect(app.$$("#planBody button").map(b=>b.textContent.replace(/\s+/g," ").trim()))
        .toEqual(["Volver a Empuje","Guardar Empuje y empezar Tirón"]);
      expect(app.$$("#planBody .danger,#planBody .fin").length).toBe(0);
      expect(/descart|borr|elimin/i.test(app.texto("#planov"))).toBe(false);
      expect(pregunto(app,n)).toBe(0);
      await cerrarHoja(app);});
    test("«Volver a Empuje» abre su detalle con los 3 hechos intactos",async app=>{
      await app.arrancar(F.aMedias);const antes=app.foto();
      app.w.openRoutine("gym_tiron");fila(app,"jalon_pecho").querySelector(".exstart").click();
      boton(app,"Volver a Empuje").click();
      expect(hoja(app)).toBe(false);
      expect(app.activa()).toBe("routine");
      expect(app.ev("curRoutine")).toBe("gym_empuje");
      expect(app.$$("#routine .ex.checked").map(e=>e.dataset.ex).sort()).toEqual(["caminadora","circulos_brazos","press_banca_db"]);
      expect(app.texto("#routProg")).toBe("3/14");
      expect(app.texto("#routCta")).toContain("Continuar");
      expect(app.foto()).toEqual(antes);
      /* atras vuelve a Tirón, y tampoco toca nada */
      app.w.history.back();
      await app.hasta(()=>app.ev("curRoutine")==="gym_tiron"&&app.activa()==="routine",3000,"el detalle de Tirón");
      expect(app.foto()).toEqual(antes);
      app.reiniciarMemoria();});
    test("«Guardar Empuje y empezar Tirón» guarda Empuje (1 entrada) y abre Tirón: 2 toques",async app=>{
      await app.arrancar(F.aMedias);const h0=app.leer("rp_history").length;
      app.w.openRoutine("gym_tiron");
      fila(app,"jalon_pecho").querySelector(".exstart").click();     /* toque 1 */
      boton(app,"Guardar Empuje y empezar Tirón").click();           /* toque 2 */
      expect(hoja(app)).toBe(false);
      expect(app.activa()).toBe("guided");
      expect(app.ev("curRoutine")).toBe("gym_tiron");
      expect(app.ev("steps[stepi].id")).toBe("jalon_pecho");
      const h=app.leer("rp_history");
      expect(h.length).toBe(h0+1);
      expect([h[0].key,h[0].exDone,h[0].exTotal,h[0].sets]).toEqual(["gym_empuje",3,14,3]);
      expect(app.leer("rp_logs").press_banca_db.slice(-1)[0].date).toBe(app.w.today());
      /* la de Tirón nace con lo primero que se registra */
      expect(app.leer("rp_session")).toBe(null);
      app.w.logSet();
      expect(app.leer("rp_session").key).toBe("gym_tiron");
      expect(app.leer("rp_history").length).toBe(h0+1);
      await app.espera(400);
      /* atras: el detalle de Tirón, no la hoja */
      app.w.guidedExit();await app.hasta(()=>app.activa()==="routine",3000,"la rutina");
      expect(app.ev("curRoutine")).toBe("gym_tiron");
      expect(hoja(app)).toBe(false);
      app.reiniciarMemoria();});
    test("el visto de Tirón con Empuje a medias: guardar Empuje y queda marcado, en 2 toques",async app=>{
      await app.arrancar(F.aMedias);const h0=app.leer("rp_history").length;
      app.w.openRoutine("gym_tiron");
      fila(app,"jalon_pecho").querySelector(".exck").click();        /* toque 1 */
      boton(app,"Guardar Empuje y empezar Tirón").click();           /* toque 2 */
      await app.hasta(()=>!hoja(app),3000,"que se cierre la hoja");
      expect(app.activa()).toBe("routine");
      expect(app.ev("curRoutine")).toBe("gym_tiron");
      expect(fila(app,"jalon_pecho").classList.contains("checked")).toBe(true);
      expect(app.w.checksOn(app.w.today(),"gym_tiron")).toEqual({jalon_pecho:true});
      expect(app.leer("rp_session").key).toBe("gym_tiron");
      expect(app.leer("rp_history").length).toBe(h0+1);
      expect(app.leer("rp_history")[0].key).toBe("gym_empuje");
      app.reiniciarMemoria();});
    test("teléfono lleno al guardar: el aviso de siempre y las dos sesiones intactas",async app=>{
      await app.arrancar(F.aMedias);
      app.w.openRoutine("gym_tiron");fila(app,"jalon_pecho").querySelector(".exstart").click();
      const antes=app.foto(),h0=app.leer("rp_history").length;sinAviso(app);const libera=lleno(app,{margen:0});
      try{boton(app,"Guardar Empuje y empezar Tirón").click();
        expect(app.texto("#toast")).toBe("No cupo en el teléfono: la sesión de Empuje sigue abierta sin guardar. Libera espacio y finalízala.");
        expect(app.foto()).toEqual(antes);
        expect(app.leer("rp_session").key).toBe("gym_empuje");
        expect(app.w.sessStats("gym_empuje").exDone).toBe(3);
        /* Empuje esta entera en disco: se sigue a Tirón solo en memoria, como
           antes, y no se vuelve a preguntar mientras tenga series */
        expect(app.activa()).toBe("guided");
        expect(app.ev("steps[stepi].id")).toBe("jalon_pecho");
        sinAviso(app);app.w.logSet();
        expect(app.texto("#toast")).toContain("Empuje sigue abierta");
        expect(app.foto()).toEqual(antes);
        await app.espera(400);
        await salirDelGuiado(app);
        fila(app,"jalon_pecho").querySelector(".exstart").click();
        expect(hoja(app)).toBe(false);
        expect(app.activa()).toBe("guided");
        expect(app.ev("steps[stepi].id")).toBe("jalon_pecho");
        expect(app.ev("sessionLog").jalon_pecho.length).toBe(1);
        expect(app.foto()).toEqual(antes);
      }finally{libera();}
      /* con espacio, la siguiente serie guarda Empuje, que ya se eligió
         guardar, y Tirón pasa a tener su sesion con las dos series */
      app.w.logSet();
      const h=app.leer("rp_history");
      expect(h.length).toBe(h0+1);
      expect([h[0].key,h[0].exDone]).toEqual(["gym_empuje",3]);
      const s=app.leer("rp_session");
      expect([s.key,s.log.jalon_pecho.length]).toEqual(["gym_tiron",2]);
      await app.espera(400);app.ev("clearTimer()");
      app.reiniciarMemoria();});
    test("teléfono lleno con series de Empuje solo en pantalla: la hoja se queda y no se pierde ninguna",async app=>{
      await app.arrancar(F.aMedias);
      app.w.openRoutine("gym_empuje");app.w.startRoutine("fondos_paralelas");
      sinAviso(app);const libera=lleno(app,{margen:0});
      try{app.w.logSet();
        expect(app.texto("#toast")).toContain("No cupo en el teléfono");
        await app.espera(400);
        await salirDelGuiado(app);
        const antes=app.foto();
        app.w.openRoutine("gym_tiron");fila(app,"jalon_pecho").querySelector(".exstart").click();
        expect(hoja(app)).toBe(true);
        expect(app.texto("#planBody")).toContain("Empuje · 4 de 14 hechos · 4 series");
        sinAviso(app);boton(app,"Guardar Empuje y empezar Tirón").click();
        expect(app.texto("#toast")).toContain("la sesión de Empuje sigue abierta sin guardar");
        expect(hoja(app)).toBe(true);
        expect(app.activa()).toBe("routine");
        expect(app.ev("sessionLogKey")).toBe("gym_empuje");
        expect(app.ev("sessionLog").fondos_paralelas.length).toBe(1);
        expect(app.foto()).toEqual(antes);
        boton(app,"Volver a Empuje").click();
        expect(app.ev("curRoutine")).toBe("gym_empuje");
        expect(app.ev("sessionLog").fondos_paralelas.length).toBe(1);
        expect(app.foto()).toEqual(antes);
      }finally{libera();}
      /* con espacio, finalizar Empuje guarda tambien la serie que no cupo */
      const res=app.w.finishSession("gym_empuje","sheet");
      expect(!!res&&!res.lleno).toBe(true);
      expect(res.summary.exDone).toBe(4);
      expect(app.leer("rp_logs").fondos_paralelas.slice(-1)[0].sets.length).toBe(1);
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
    test("recarga en mitad del conflicto: nada cambia y Empuje sigue en curso",async app=>{
      await app.arrancar(F.aMedias);
      app.w.openRoutine("gym_tiron");fila(app,"jalon_pecho").querySelector(".exck").click();
      expect(hoja(app)).toBe(true);
      const antes=app.foto();
      await app.recargar();
      expect(hoja(app)).toBe(false);
      expect(app.foto()).toEqual(antes);
      expect(app.activa()).toBe("home");
      expect(app.texto("#todayCard")).toContain("En curso");
      expect(app.texto("#todayCard")).toContain("Empuje");
      /* y la hoja vuelve a salir si se insiste */
      app.w.openRoutine("gym_tiron");fila(app,"jalon_pecho").querySelector(".exck").click();
      expect(hoja(app)).toBe(true);
      await cerrarHoja(app);
      expect(app.foto()).toEqual(antes);});
  });

  /* HU-63: entrar al guiado solo para mirar no deja rastro; la sesion nace
     con lo primero que se registra */
  escenario("Mirar el guiado sin registrar",F.dueno,()=>{
    test("abrir el guiado y salir sin registrar nada no crea rp_session ni pone la tarjeta «En curso»",async app=>{
      const antes=app.foto(),tarjeta=app.texto("#todayCard");
      expect(app.leer("rp_session")).toBe(null);
      app.w.openRoutine("gym_tiron");app.w.startRoutine("jalon_pecho");
      expect(app.activa()).toBe("guided");
      app.w.guidedSkipExercise();app.w.guidedBack();
      await salirDelGuiado(app);
      app.$("#routCta .btn:not(.sec)").click();
      expect(app.activa()).toBe("guided");
      await salirDelGuiado(app);
      expect(app.leer("rp_session")).toBe(null);
      expect(app.foto()).toEqual(antes);
      app.$('.nav .tab[data-v="home"]').click();
      expect(app.activa()).toBe("home");
      expect(app.texto("#todayCard")).toBe(tarjeta);
      expect(app.texto("#todayCard")).not.toContain("En curso");
      app.reiniciarMemoria();});
    test("lo primero que se registra sí la crea: una serie, un visto o el temporizador",async app=>{
      const sesion=()=>app.leer("rp_session");
      app.sembrar(F.dueno);app.reiniciarMemoria();
      app.w.openRoutine("gym_tiron");app.w.startRoutine("jalon_pecho");
      expect(sesion()).toBe(null);
      app.w.logSet();
      expect([sesion().key,sesion().src,sesion().log.jalon_pecho.length]).toEqual(["gym_tiron","guided",1]);
      await app.espera(400);app.ev("clearTimer()");
      app.sembrar(F.dueno);app.reiniciarMemoria();
      app.w.openRoutine("gym_tiron");
      expect(sesion()).toBe(null);
      fila(app,"jalon_pecho").querySelector(".exck").click();
      expect([sesion().key,sesion().src]).toEqual(["gym_tiron","check"]);
      app.sembrar(F.dueno);app.reiniciarMemoria();
      app.w.openRoutine("gym_tiron");app.w.startRoutine("caminadora");
      expect(app.ev("steps[stepi].kind")).toBe("timer");
      expect(sesion()).toBe(null);
      app.w.startTimer();
      expect([sesion().key,sesion().src]).toEqual(["gym_tiron","guided"]);
      app.ev("clearTimer()");app.reiniciarMemoria();});
  });

  /* criterio 5 de HU-63: las de otros dias siguen su camino de siempre */
  escenario("Sesión de ayer sin cerrar · otra rutina hoy",F.sinCerrar,()=>{
    test("se sigue rescatando al abrir; «Ahora no» la deja y vuelve a salir al recargar",async app=>{
      const antes=app.foto();
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      expect(app.texto("#finTitle")).toBe("Entrenamiento sin cerrar");
      app.$$("#finBody button").find(b=>b.textContent.indexOf("Ahora no")>=0).click();
      await app.hasta(()=>!app.$("#finov").classList.contains("show"),3000,"que se cierre el rescate");
      expect(app.foto()).toEqual(antes);
      await app.recargar();
      expect(app.$("#finov").classList.contains("show")).toBe(true);
      expect(app.texto("#finTitle")).toBe("Entrenamiento sin cerrar");});
    test("no es «a medias»: no abre la hoja de conflicto y, como antes, se guarda con su fecha al entrar",app=>{
      app.ev("$('finov').classList.remove('show')");
      app.w.openRoutine("gym_tiron");
      expect(app.w.sessConflict("gym_tiron")).toBe(null);
      app.w.startRoutine("jalon_pecho");
      expect(hoja(app)).toBe(false);
      expect(app.activa()).toBe("guided");
      const h=app.leer("rp_history");
      expect(h.length).toBe(1);
      expect([h[0].key,h[0].sets]).toEqual(["gym_empuje",2]);
      expect(app.w.ds(new Date(h[0].iso))).toBe(F.fecha(1));
      expect(app.leer("rp_session")).toBe(null);
      app.reiniciarMemoria();});
  });

  /* Borrar una serie del guiado era un toque sin vuelta atras. Ahora sale
     «Serie borrada · Deshacer» unos segundos: deshacer deja la sesion
     identica, y dejarlo pasar la deja sin la serie. */
  function conSerie(){const ini=Date.now()-20*60000;
    return {rp_session:{v:1,key:"gym_empuje",date:F.fecha(0),startedAt:ini,lastAt:ini,stepi:0,src:"guided",
      log:{press_banca_db:[{w:20,reps:10,t:ini+60000,rir:2},{w:22.5,reps:8,t:ini+240000},{w:22.5,reps:7,t:ini+420000,rir:0}]}}};}
  /* la sesion menos lastAt, que es el sello de la ultima escritura; en
     crudo, para que tambien cuente el orden de los ejercicios */
  const sinSello=app=>{const s=app.leer("rp_session");if(s)delete s.lastAt;return s;};
  const crudo=()=>String(localStorage.getItem("rp_session")).replace(/"lastAt":\d+,?/,"");
  const copia=x=>JSON.parse(JSON.stringify(x));
  const filas=app=>app.$$("#guided .sets .setline").map(l=>Array.from(l.children)
    .map(c=>c.textContent.replace(/\s+/g," ").trim()).filter(Boolean).join(" | "));
  /* cada prueba arranca con la sesion sembrada y el guiado en el press */
  function abrir(app,semilla){app.w.toastFuera();app.reiniciarMemoria();app.sembrar(semilla||conSerie);
    app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");sinAviso(app);
    expect(app.activa()).toBe("guided");
    return {log:copia(app.ev("sessionLog")),ses:sinSello(app),crudo:crudo(),filas:filas(app)};}
  const borrar=(app,i)=>app.$("#sl_press_banca_db_"+i+" .del").click();
  const deshacer=app=>app.$("#toast .tact").click();
  escenario("Borrar una serie en el guiado",conSerie,()=>{
    test("borrar y deshacer deja la sesión idéntica",app=>{
      const antes=abrir(app);
      expect(antes.filas).toHaveLength(3);
      borrar(app,1);
      expect(app.ev("sessionLog").press_banca_db.map(x=>x.reps)).toEqual([10,7]);
      expect(app.leer("rp_session").log.press_banca_db.map(x=>x.reps)).toEqual([10,7]);
      expect(filas(app)).toHaveLength(2);
      expect(app.texto("#toast")).toContain("Serie borrada");
      expect(app.$("#toast").classList.contains("show")).toBe(true);
      deshacer(app);
      expect(copia(app.ev("sessionLog"))).toEqual(antes.log);
      expect(sinSello(app)).toEqual(antes.ses);
      expect(crudo()).toBe(antes.crudo);
      expect(filas(app)).toEqual(antes.filas);
      expect(app.texto("#toast")).toContain("Serie recuperada");
      expect(app.$("#toast .tact")).toBeFalsy();
      /* y lo que se guarda al cerrar es lo de antes de borrar */
      const res=app.w.finishSession("gym_empuje","guided");
      expect(res.summary.sets).toBe(3);
      expect(app.leer("rp_logs").press_banca_db[0].sets).toEqual(antes.log.press_banca_db);
      app.reiniciarMemoria();});
    test("borrar y no deshacer la deja sin la serie",async app=>{
      const antes=abrir(app),ms=app.ev("DESHACER_MS");
      expect(ms).toBeGreaterThan(3999);
      /* con teclado, para ver tambien adonde va el foco cuando el aviso caduca */
      const x=app.$("#sl_press_banca_db_0 .del");x.focus();
      x.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
      expect(app.doc.activeElement).toBe(app.$("#toast .tact"));
      await app.espera(ms+300);
      expect(app.$("#toast").classList.contains("show")).toBe(false);
      /* el boton escondido no se enfoca ni se pulsa, y el foco no se pierde */
      expect(app.w.getComputedStyle(app.$("#toast .tact")).visibility).toBe("hidden");
      expect(app.doc.activeElement).toBe(app.$("#guided .gbtn.go"));
      app.w.deshacerSerie();
      const queda=antes.log.press_banca_db.slice(1);
      expect(copia(app.ev("sessionLog"))).toEqual({press_banca_db:queda});
      expect(app.leer("rp_session").log).toEqual({press_banca_db:queda});
      expect(filas(app)).toEqual(["Serie 1 | 22.5 kg × 8","Serie 2 | 22.5 kg × 7 · reserva 0"]);
      const res=app.w.finishSession("gym_empuje","guided");
      expect(res.summary.sets).toBe(2);
      expect(app.leer("rp_logs").press_banca_db[0].sets).toEqual(queda);
      app.reiniciarMemoria();});
    test("dos toques seguidos en la X: Deshacer devuelve las dos, cada una a su sitio",app=>{
      const antes=abrir(app);
      /* la de abajo sube al sitio de la borrada: el segundo toque se la lleva */
      borrar(app,1);borrar(app,1);
      expect(app.ev("sessionLog").press_banca_db.map(x=>x.reps)).toEqual([10]);
      expect(app.texto("#toast")).toContain("2 series borradas");
      deshacer(app);
      expect(copia(app.ev("sessionLog"))).toEqual(antes.log);
      expect(crudo()).toBe(antes.crudo);
      expect(filas(app)).toEqual(antes.filas);
      expect(app.texto("#toast")).toContain("2 series recuperadas");
      app.reiniciarMemoria();});
    test("borrar la única serie de un ejercicio y deshacer: vuelve a su puesto en la sesión",app=>{
      const s=conSerie(),log=s.rp_session.log;
      log.press_banca_db=log.press_banca_db.slice(0,1);
      log.press_hombro_db=[{w:12,reps:10,t:s.rp_session.startedAt+600000}];
      const antes=abrir(app,s);
      expect(Object.keys(antes.ses.log)).toEqual(["press_banca_db","press_hombro_db"]);
      borrar(app,0);
      expect(Object.keys(app.leer("rp_session").log)).toEqual(["press_hombro_db"]);
      expect(filas(app)).toHaveLength(0);
      deshacer(app);
      expect(crudo()).toBe(antes.crudo);
      expect(Object.keys(app.ev("sessionLog"))).toEqual(["press_banca_db","press_hombro_db"]);
      expect(filas(app)).toEqual(antes.filas);
      app.reiniciarMemoria();});
    test("borrar, anotar otra y deshacer en el descanso: no se pierde ninguna",async app=>{
      const antes=abrir(app);
      borrar(app,1);
      app.w.logSet();
      await app.hasta(()=>app.$("#guided .isrest"),3000,"el descanso");
      deshacer(app);
      /* la borrada vuelve a su indice y la nueva se queda al final */
      const log=copia(app.ev("sessionLog")).press_banca_db;
      expect(log.slice(0,3)).toEqual(antes.log.press_banca_db);
      expect(log).toHaveLength(4);
      expect(app.leer("rp_session").log.press_banca_db).toEqual(log);
      /* deshacer no saca del descanso */
      expect(app.$("#guided .isrest")).toBeTruthy();
      app.w.skipRest();
      app.reiniciarMemoria();});
    test("salir del guiado o finalizar retira el Deshacer y no toca nada",async app=>{
      abrir(app);
      borrar(app,0);
      app.w.guidedExit();
      await app.hasta(()=>app.activa()==="routine",3000,"la pantalla de la rutina");
      expect(app.$("#toast").classList.contains("show")).toBe(false);
      const fuera=app.foto();
      app.w.deshacerSerie();
      expect(app.foto()).toEqual(fuera);
      /* finalizar con el aviso a la vista: la sesion cerrada no se reabre */
      abrir(app);
      borrar(app,0);
      app.w.finish();
      /* con HU-09 terminar con ejercicios sin hacer guarda lo hecho y dice
         "Guardada · X de Y", nunca "Completada": aqui solo se hizo el pecho */
      expect(app.texto("#guided .done .mut")).toBe("Guardada · 1 de 14 ejercicios");
      expect(app.$("#toast").classList.contains("show")).toBe(false);
      app.w.deshacerSerie();
      expect(app.leer("rp_session")).toBe(null);
      expect(app.leer("rp_logs").press_banca_db.slice(-1)[0].sets).toHaveLength(2);
      app.reiniciarMemoria();});
    test("teléfono lleno: Deshacer devuelve la serie a la memoria y avisa que no cupo",app=>{
      const antes=abrir(app);
      borrar(app,2);
      const libera=lleno(app,{margen:0});
      try{deshacer(app);
        expect(copia(app.ev("sessionLog"))).toEqual(antes.log);
        expect(app.texto("#toast")).toContain("No cupo en el teléfono");}
      finally{libera();}
      app.w.touchSess();
      expect(sinSello(app)).toEqual(antes.ses);
      app.reiniciarMemoria();});
    test("una serie ya guardada en rp_logs: borrar y deshacer deja rp_logs idéntico",app=>{
      const t=Date.now()-3600000,logs={press_banca_db:[
        {date:F.fecha(7),sets:[{w:20,reps:10,t:t-7*864e5}],k:"gym_empuje",t:t-7*864e5},
        {date:F.fecha(0),sets:[{w:22.5,reps:8,t:t}],k:"gym_empuje",t:t}]};
      abrir(app,Object.assign(conSerie(),{rp_logs:logs}));
      const antes=localStorage.getItem("rp_logs");
      /* la unica serie del registro: se va el registro entero */
      app.w.delSet("press_banca_db","l",1,0,-1);
      expect(app.leer("rp_logs").press_banca_db).toHaveLength(1);
      expect(app.texto("#toast")).toContain("Serie borrada");
      deshacer(app);
      expect(localStorage.getItem("rp_logs")).toBe(antes);
      app.reiniciarMemoria();});
    /* HU-10 marca el record en su serie y lo rehace al borrar: deshacer lo
       devuelve con la serie, y la sesion queda identica, records en su orden */
    test("borrar una serie récord y deshacer: vuelve su récord, y los de la sesión en su orden",app=>{
      const s=conSerie(),ini=s.rp_session.startedAt,t=ini-3*864e5;
      /* hace 3 dias: 20 x 8 en el press de pecho y 10 x 8 en el de hombro */
      s.rp_logs={press_banca_db:[{date:F.fecha(3),sets:[{w:20,reps:8,t:t}],k:"gym_empuje",t:t}],
        press_hombro_db:[{date:F.fecha(3),sets:[{w:10,reps:8,t:t}],k:"gym_empuje",t:t}]};
      s.rp_session.log.press_hombro_db=[{w:12,reps:10,t:ini+600000}];
      abrir(app,s);
      /* los records como los deja el guiado: los del pecho y despues el del hombro */
      app.w.prRecalc("press_banca_db");app.w.prRecalc("press_hombro_db");app.w.renderStep();
      const prs=()=>(app.leer("rp_session").pr||[]).map(p=>[p.id,p.i]);
      expect(prs()).toEqual([["press_banca_db",0],["press_banca_db",1],["press_hombro_db",0]]);
      const antes={crudo:crudo(),filas:filas(app),log:copia(app.ev("sessionLog"))};
      const marcadas=()=>app.$$("#guided .sets .setline.pr").map(l=>l.id.replace("sl_press_banca_db_",""));
      expect(marcadas()).toEqual(["0","1"]);
      /* la primera se va: la de 22.5 x 8 pasa a ser la serie 1, y record */
      borrar(app,0);
      expect(prs()).toEqual([["press_hombro_db",0],["press_banca_db",0]]);
      expect(marcadas()).toEqual(["0"]);
      deshacer(app);
      expect(copia(app.ev("sessionLog"))).toEqual(antes.log);
      expect(crudo()).toBe(antes.crudo);
      expect(filas(app)).toEqual(antes.filas);
      expect(marcadas()).toEqual(["0","1"]);
      app.reiniciarMemoria();});
  });
})();
