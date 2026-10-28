/* Progreso con un historial largo: rp_logs se lee y se parsea una sola vez por
   pintado, lo que se ve no cambia ni en un numero, y el pintado baja de forma
   medible con dos años de registros (Fixtures.dosAnos).

   «Antes» se reproduce sin guardar una copia del codigo viejo. Los analisis de
   Progreso aceptan el rp_logs ya leido como ultimo argumento y, si no llega, lo
   leen ellos: es exactamente lo que hacian hasta v35. comoAntes() los envuelve
   para que descarten ese argumento, y cada lectura vuelve a su sitio (24 de las
   25: el resumen del mes ya no pide dos veces la misma lista de records). */
(function(){
  const F=Fixtures;
  const tab=(app,v)=>{app.$('.nav .tab[data-v="'+v+'"]').click();};
  /* [nombre, cuantos argumentos tenia hasta v35] */
  const ANALISIS=[["strengthIdx",1],["strengthSpark",0],["overloadIndex",1],["stalled",0],["prFeed",1],["muscleSets",2]];
  function comoAntes(app){const w=app.w,orig={};
    ANALISIS.forEach(([n,k])=>{const f=w[n];orig[n]=f;w[n]=function(){return f.apply(this,Array.prototype.slice.call(arguments,0,k));};});
    return ()=>{ANALISIS.forEach(([n])=>{w[n]=orig[n];});};}
  function conAntes(app,fn){const fin=comoAntes(app);try{return fn();}finally{fin();}}
  /* lecturas (getItem) y parseos (JSON.parse) de rp_logs mientras corre fn.
     Se parchea el Storage y el JSON del iframe: los del arnes siguen normales */
  function contar(app,fn){const w=app.w,S=w.Storage.prototype,og=S.getItem,J=w.JSON,op=J.parse,
      txt=w.localStorage.getItem("rp_logs"),n={lee:0,parsea:0,kb:0};
    S.getItem=function(k){if(String(k)==="rp_logs")n.lee++;return og.apply(this,arguments);};
    J.parse=function(t){if(txt!=null&&t===txt){n.parsea++;n.kb+=t.length/1024;}return op.apply(this,arguments);};
    try{fn();}finally{S.getItem=og;J.parse=op;}
    n.kb=Math.round(n.kb);return n;}
  const pintar=app=>{app.w.renderProgress();return app.$("#progBody").innerHTML;};
  /* dos pintados identicos; si no, dice donde empiezan a diferir */
  function igual(ahora,antes){if(ahora===antes)return;let i=0;while(i<ahora.length&&ahora[i]===antes[i])i++;
    throw new Error("difieren en el caracter "+i+":\n  ahora "+JSON.stringify(ahora.slice(Math.max(0,i-80),i+80))
      +"\n  antes "+JSON.stringify(antes.slice(Math.max(0,i-80),i+80)));}
  const mediana=a=>a.slice().sort((x,y)=>x-y)[a.length>>1];
  /* todo lo que calculan los analisis, no solo lo que llega a la pantalla */
  function calculos(app,logs){const w=app.w,L=logs===undefined?[]:[logs],hoy=w.today();
    return {idx:w.strengthIdx.apply(null,[null].concat(L)),idx28:w.strengthIdx.apply(null,[w.dOffset(28)].concat(L)),
      spark:w.strengthSpark.apply(null,L),ov:w.overloadIndex.apply(null,[9].concat(L)),st:w.stalled.apply(null,L),
      pr30:w.prFeed.apply(null,[30].concat(L)),pr70:w.prFeed.apply(null,[70].concat(L)),
      sem:[0,1,2,3].map(s=>w.muscleSets.apply(null,[w.weekStart(s),hoy].concat(L)))};}

  escenario("Progreso · dos años de historial",F.dosAnos,()=>{
    test("los datos de prueba son dos años y llenan todos los bloques",app=>{
      const logs=app.leer("rp_logs"),h=app.leer("rp_history");
      const fechas=[].concat.apply([],Object.keys(logs).map(id=>logs[id].map(r=>r.date))).sort();
      expect(fechas[0]<=F.fecha(720)).toBe(true);
      expect(h.length).toBeGreaterThan(400);
      expect(localStorage.getItem("rp_logs").length).toBeGreaterThan(300000);
      tab(app,"progress");
      expect(app.activa()).toBe("progress");
      const t=app.texto("#progBody");
      ["hasta hoy","Índice de fuerza","Sobrecarga de la semana","Estancado","Récords recientes","Peso corporal",
       "Series por músculo","Constancia","Postura y cuello","Tu historial"].forEach(x=>expect(t).toContain(x));
      expect(app.texto("#progBody .hbig")).toMatch(/^\d+$/);
      expect(app.$$("#progBody .prrow").length).toBeGreaterThan(3);});

    test("abrir Progreso lee y parsea rp_logs una sola vez",app=>{
      tab(app,"home");
      const n=contar(app,()=>tab(app,"progress"));
      expect(app.activa()).toBe("progress");
      expect(n.lee).toBe(1);
      expect(n.parsea).toBe(1);});

    test("redibujar Progreso (al guardar un pesaje o una medida) tambien lo lee una vez",app=>{
      const n=contar(app,()=>app.w.renderProgress());
      expect(n.lee).toBe(1);
      expect(n.parsea).toBe(1);});

    test("los analisis no modifican el rp_logs que reciben",app=>{
      const logs=app.w.loadLogs(),foto=JSON.stringify(logs);
      calculos(app,logs);app.w.monthSummary(app.w.histRows(),logs);
      expect(JSON.stringify(logs)).toBe(foto);
      expect(JSON.stringify(logs)).toBe(localStorage.getItem("rp_logs"));});

    test("cada analisis da lo mismo con el rp_logs compartido que leyendo el suyo",app=>{
      const logs=app.w.loadLogs(),antes=calculos(app),ahora=calculos(app,logs);
      expect(ahora).toEqual(antes);
      /* que la comparacion no sea entre vacios */
      expect(ahora.idx.n).toBeGreaterThan(5);expect(ahora.spark).toHaveLength(12);
      expect(ahora.ov.total).toBeGreaterThan(5);expect(ahora.st.length).toBeGreaterThan(0);
      expect(ahora.pr30.length).toBeGreaterThan(3);});

    test("los numeros de la pantalla son identicos a los de antes",app=>{
      tab(app,"progress");
      const ahora=pintar(app),antes=conAntes(app,()=>pintar(app));
      igual(ahora,antes);
      expect(pintar(app)).toBe(ahora);});

    test("con dos años el pintado baja de forma medible frente a como era",app=>{
      tab(app,"progress");
      const w=app.w,vez=()=>{const t=w.performance.now();w.renderProgress();return w.performance.now()-t;};
      /* «antes» leia y parseaba el historial entero en cada analisis */
      const nAntes=contar(app,()=>conAntes(app,vez)),nAhora=contar(app,vez);
      expect(nAntes.parsea).toBeGreaterThan(20);
      expect(nAhora.parsea).toBe(1);
      expect(nAhora.kb*20).toBeLessThan(nAntes.kb);
      /* en tiempo: mediana de 9 pintados de cada, alternados para repartir el
         ruido. En el arnes, con un escritorio, antes ~55 ms y ahora ~17 ms */
      const antes=[],ahora=[];
      for(let i=0;i<9;i++){ahora.push(vez());antes.push(conAntes(app,vez));}
      expect(mediana(ahora)).toBeLessThan(mediana(antes)*0.6);});
  });

  /* lo mismo con los juegos de datos de cada dia: el cambio no puede mover un numero */
  [["sin datos",F.vacio],["gimnasio, masa, seis semanas",F.dueno],["casa, salud, 1-3 kg, cinco semanas",F.madre]].forEach(([nombre,semilla])=>{
    escenario("Progreso · "+nombre,semilla,()=>{
      test("una sola lectura de rp_logs y los mismos numeros que antes",app=>{
        tab(app,"progress");
        expect(app.activa()).toBe("progress");
        const n=contar(app,()=>app.w.renderProgress());
        expect(n.lee).toBe(1);
        expect(n.parsea).toBe(localStorage.getItem("rp_logs")==null?0:1);
        igual(pintar(app),conAntes(app,()=>pintar(app)));
        expect(calculos(app,app.w.loadLogs())).toEqual(calculos(app));});
    });
  });
})();
