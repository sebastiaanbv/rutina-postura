/* HU-55 · Zoom y letra del sistema. Quien necesita letra grande la sube en el
   telefono, y la app tiene que crecer con ella sin cortar ni pisar nada, de
   320 a 430 px de ancho, y dejarse ampliar con dos dedos.
   La letra del sistema se simula agrandando la raiz (<html>): es justo lo que
   hacen <meta name="text-scale"> en Android, -apple-system-body en iOS y el
   ajuste de letra del navegador. Toda la escala va en rem, asi que crece. */
(function(){
  const F=Fixtures;
  const tab=(app,v)=>{app.$('.nav .tab[data-v="'+v+'"]').click();};
  /* el telefono: px de ancho y la letra del sistema al pct %. Sin barras de
     scroll que ocupen sitio, como en el telefono (alli van superpuestas): el
     Chrome de tests/run.py y de la CI las pinta de 15 px, y la pagina de
     "412 px" mediria 397 y una hoja con scroll propio, 15 menos */
  async function telefono(app,px,pct){app.frame.style.width=px+"px";
    if(!app.doc.getElementById("sinbarras")){const st=app.doc.createElement("style");st.id="sinbarras";
      st.textContent="*{scrollbar-width:none}";app.doc.head.appendChild(st);}
    app.doc.documentElement.style.fontSize=pct===100?"":pct+"%";await app.espera(30);}
  function deVuelta(app){app.frame.style.width="400px";app.doc.documentElement.style.fontSize="";
    app.doc.documentElement.style.removeProperty("--fk");const st=app.doc.getElementById("sinbarras");if(st)st.remove();}
  const px=(app,el)=>parseFloat(app.w.getComputedStyle(el).fontSize);
  /* mide un token en px con un elemento de prueba */
  function token(app,t){const d=app.doc.createElement("div");d.style.fontSize="var("+t+")";
    app.doc.body.appendChild(d);const v=px(app,d);d.remove();return v;}

  /* Los once pasos de DISENO 3 con la letra de serie */
  const ESCALA={"--t-mega":50,"--t-display":30,"--t-xl":26,"--t-title":22,"--t-lg":20,"--t-md":16,
    "--t-lead":15,"--t-base":14,"--t-sm":12.5,"--t-xs":11,"--t-2xs":10};

  /* La cifra mas larga que puede tener el peso: la que la fila de steppers
     deja caber siempre, sea cual sea el peso de ahora, tambien en el campo */
  const LARGA="142.5";

  /* Recortes con "…" que el diseño decide: el riel de la semana (el nombre
     entero esta a un toque, en la hoja del plan) y el titulo de una hoja.
     Cualquier otro texto tiene que verse entero. */
  const RECORTE_ADREDE=".day .tag,.ovhead .t";

  /* Revisa el texto de una raiz y devuelve los problemas, legibles:
     - cortado: un texto que una caja con overflow oculto no deja ver entero;
     - se sale: un texto que pasa del borde de su tarjeta, boton o pastilla;
     - solape: dos textos que se pisan, o un texto encima de una caja ajena
       (una cifra montada sobre el boton +);
     - fuera de pantalla / desborda: una caja que pasa del ancho del telefono o
       de la caja que la contiene;
     - no cabe: el valor o el texto de ayuda de un campo, recortado. */
  function revisar(app,raiz){
    const doc=app.doc,w=app.w,vw=doc.documentElement.clientWidth,out=[];
    const nombre=el=>{let s=el.tagName.toLowerCase();if(el.id)s+="#"+el.id;
      if(el.classList&&el.classList.length)s+="."+[...el.classList].join(".");return s;};
    const plegado=el=>{const d=el.closest("details");return !!(d&&!d.open&&!el.closest("summary"))&&raiz.contains(d);};
    const capaDe=el=>{for(let a=el;a&&a!==doc.body;a=a.parentElement){const p=w.getComputedStyle(a).position;
      if(p==="fixed"||p==="sticky")return a;}return null;};
    const superficie=c=>(c.backgroundColor!=="rgba(0, 0, 0, 0)"&&c.backgroundColor!=="transparent")||c.backgroundImage!=="none"
      ||parseFloat(c.borderTopWidth)>0||parseFloat(c.borderLeftWidth)>0;
    const trozos=[];
    const tw=doc.createTreeWalker(raiz,w.NodeFilter.SHOW_TEXT);let n;
    while((n=tw.nextNode())){
      if(!n.nodeValue.trim())continue;
      const el=n.parentElement;if(!el||!el.getClientRects().length||plegado(el))continue;
      const cs=w.getComputedStyle(el);if(cs.visibility==="hidden")continue;
      const r=doc.createRange();r.selectNodeContents(n);
      const fs=parseFloat(cs.fontSize)||14,tolV=Math.max(2,fs*.25),capa=capaDe(el),txt=n.nodeValue.trim().slice(0,32);
      [...r.getClientRects()].filter(q=>q.width>.5&&q.height>.5).forEach(q0=>{
        let q={left:q0.left,right:q0.right,top:q0.top,bottom:q0.bottom},dicho=false;
        for(let a=el;a&&a!==doc.body&&a!==raiz.parentElement;a=a.parentElement){
          if(!(a instanceof w.HTMLElement))continue;
          const c=w.getComputedStyle(a),b=a.getBoundingClientRect();
          if(/auto|scroll/.test(c.overflowX+c.overflowY))break;
          const corta=/hidden|clip/.test(c.overflowX+c.overflowY);
          if(!corta&&!superficie(c))continue;
          const L=b.left+(parseFloat(c.borderLeftWidth)||0),R=b.right-(parseFloat(c.borderRightWidth)||0),
            T=b.top+(parseFloat(c.borderTopWidth)||0),B=b.bottom-(parseFloat(c.borderBottomWidth)||0);
          if(!dicho&&(q.left<L-2||q.right>R+2||q.top<T-tolV||q.bottom>B+tolV)){dicho=true;
            const adrede=corta&&c.textOverflow==="ellipsis"&&a.matches(RECORTE_ADREDE);
            if(!adrede)out.push((corta?"cortado":"se sale")+": «"+txt+"» ("+nombre(el)+") por "+nombre(a));}
          if(corta)q={left:Math.max(q.left,L),right:Math.min(q.right,R),top:Math.max(q.top,T),bottom:Math.min(q.bottom,B)};
        }
        if(q.right-q.left<=.5||q.bottom-q.top<=.5)return;
        if(q.left<-1||q.right>vw+1)out.push("fuera de pantalla: «"+txt+"» ("+nombre(el)+")");
        trozos.push({q:q,h:q0.bottom-q0.top,n:n,el:el,capa:capa,txt:txt});});
    }
    /* cajas visibles: ni fuera de la pantalla ni fuera de su contenedor */
    const cajas=[];
    raiz.querySelectorAll("*").forEach(a=>{
      if(!(a instanceof w.HTMLElement)||!a.getClientRects().length||plegado(a))return;
      const c=w.getComputedStyle(a);if(c.visibility==="hidden"||!superficie(c))return;
      const b=a.getBoundingClientRect();
      if(b.width>0&&(b.left<-1||b.right>vw+1))out.push("fuera de pantalla: "+nombre(a));
      const pa=a.parentElement;
      if(pa&&(c.position==="static"||c.position==="relative")&&c.float==="none"){
        const pc=w.getComputedStyle(pa),pb=pa.getBoundingClientRect();
        const L=pb.left+(parseFloat(pc.borderLeftWidth)||0)+(parseFloat(pc.paddingLeft)||0),
          R=pb.right-(parseFloat(pc.borderRightWidth)||0)-(parseFloat(pc.paddingRight)||0);
        if(pc.overflowX==="visible"&&(b.left<L-1.5||b.right>R+1.5))out.push("desborda: "+nombre(a)+" en "+nombre(pa));}
      if(c.position!=="fixed"||a===raiz)cajas.push({a:a,b:b,capa:capaDe(a)});});
    const pisa=(p,q)=>Math.min(p.right,q.right)-Math.max(p.left,q.left)>2&&Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top)>2;
    trozos.forEach(t=>cajas.forEach(k=>{if(k.capa===t.capa&&!k.a.contains(t.el)&&pisa(t.q,k.b))
      out.push("solape: «"+t.txt+"» ("+nombre(t.el)+") sobre "+nombre(k.a));}));
    for(let i=0;i<trozos.length;i++)for(let j=i+1;j<trozos.length;j++){const A=trozos[i],B=trozos[j];
      if(A.n===B.n||A.capa!==B.capa)continue;
      const ix=Math.min(A.q.right,B.q.right)-Math.max(A.q.left,B.q.left),iy=Math.min(A.q.bottom,B.q.bottom)-Math.max(A.q.top,B.q.top);
      if(ix>2&&iy>.35*Math.min(A.h,B.h))out.push("solape: «"+A.txt+"» ("+nombre(A.el)+") con «"+B.txt+"» ("+nombre(B.el)+")");}
    /* un campo: su valor, o el texto de ayuda si esta vacio, entero. De
       una lista, cualquiera de sus opciones y no solo la elegida: la persona
       puede elegir otra (con DejaVu Sans, «Repeticiones por lado» no cabia
       a 320 px y al 130 %, y la prueba solo veia «Repeticiones») */
    const cv=doc.createElement("canvas").getContext("2d");
    raiz.querySelectorAll("input,select").forEach(i=>{
      if(!i.getClientRects().length||plegado(i)||/checkbox|file|time/.test(i.type))return;
      const c=w.getComputedStyle(i),ts=i.tagName==="SELECT"?[...i.options].map(o=>o.text):[i.value||i.placeholder];
      /* con el espaciado del campo: la cifra del stepper va algo junta,
         dentro del campo igual que fuera */
      cv.font=c.fontWeight+" "+c.fontSize+" "+c.fontFamily;cv.letterSpacing=c.letterSpacing;
      const util=i.clientWidth-parseFloat(c.paddingLeft)-parseFloat(c.paddingRight)-(i.tagName==="SELECT"?20:0);
      ts.forEach(t=>{if(t&&cv.measureText(t).width>util+1)out.push("no cabe: «"+t+"» en "+nombre(i));});});
    return [...new Set(out)];}

  /* Recorre las pantallas principales como lo haria la persona y devuelve los
     problemas de cada una. Deja los datos y la memoria como estaban. */
  async function recorrido(app,o){
    const p=[],mira=async(que,sel)=>{await app.espera(40);const r=sel?app.$(sel):app.$(".view.active");
      if(!r)throw new Error("no se ve "+que);revisar(app,r).forEach(x=>p.push(que+" · "+x));};
    try{
      tab(app,"home");await mira("Inicio");await mira("Barra inferior","#nav");
      app.w.openRoutine(o.rutina);await mira("Rutina");
      app.w.startRoutine(o.cargado);expect(app.ev("steps[stepi].id")).toBe(o.cargado);await mira("Guiado");
      /* el campo ocupa el sitio de la cifra: la mas larga que puede tener
         el peso cabe entera; una mas larga se desplaza dentro (lo mira el
         stepper) */
      app.w.editNum("w");app.$("#numin").value=LARGA;
      await mira("Guiado, escribiendo el peso");app.w.renderStep();
      app.$("#guided .gbtn.go").click();
      await app.hasta(()=>app.$("#guided .ring.rest"),3000,"el descanso");await mira("Descanso");
      app.w.toast(app.w.ic("trophy","sm")+" Récord en Prensa inclinada: <b>142.5 kg × 12</b>");await mira("Aviso flotante","#toast");
      app.w.skipRest();await mira("Guiado, segunda serie");
      const v=app.$("#guided .setline .v");expect(!!v).toBe(true);v.click();
      expect(app.$$("#guided .setin").length).toBeGreaterThan(0);await mira("Guiado, corrigiendo una serie");
      app.w.openFinish();await mira("Hoja de finalizar","#finov .ovcard");app.$("#finov").classList.remove("show");
      app.w.finish();await mira("Fin de la rutina");
      tab(app,"history");
      const h=app.leer("rp_history");
      if(h&&h.length){const d=h[0].date.split("/");app.w.calPick(d[2]+"-"+d[1]+"-"+d[0]);
        const s=app.$("#histBody .dayblock .hitem");if(s)s.click();}
      await mira("Calendario");
      tab(app,"progress");const pes=app.$("#progBody details.bwlist");if(pes)pes.open=true;await mira("Progreso");
      tab(app,"settings");await mira("Ajustes");
      tab(app,"home");app.w.openPlan(0);await mira("Hoja del plan","#planov .ovcard");app.$("#planov").classList.remove("show");
      app.w.openRoutine(o.rutina);app.w.openAddEx(o.rutina);await mira("Hoja de agregar ejercicio","#swapov .ovcard");
      app.w.openCustomForm(o.rutina);await mira("Ejercicio propio","#swapov .ovcard");app.$("#swapov").classList.remove("show");
    }finally{app.sembrar(o.semilla);app.reiniciarMemoria();tab(app,"home");}
    return p;}

  /* el humo de HU-55: cada ancho con la letra de serie y al 130 % */
  function humoLetra(o){
    [320,375,430].forEach(ancho=>[100,130].forEach(pct=>{
      test("a "+ancho+" px con la letra al "+pct+" %: las pantallas principales sin cortes ni solapes",async app=>{
        await telefono(app,ancho,pct);
        try{expect(await recorrido(app,o)).toEqual([]);}finally{deVuelta(app);}});}));}

  escenario("Letra grande · sin datos",F.vacio,()=>{
    test("el viewport deja ampliar con pellizco: sin user-scalable=no ni maximum-scale",app=>{
      const m=app.$$('meta[name="viewport"]');
      expect(m).toHaveLength(1);
      const v=m[0].getAttribute("content");
      expect(v).toContain("width=device-width");
      expect(v).toContain("initial-scale=1");
      expect(v).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
      expect(v).not.toMatch(/maximum-scale/i);
      expect(v).not.toMatch(/minimum-scale/i);});
    test("pide la letra del sistema: meta text-scale y la raiz sin tamaño propio",async app=>{
      expect(app.$('meta[name="text-scale"]').getAttribute("content")).toBe("scale");
      /* si la app fijara el tamaño de <html>, 1rem dejaria de ser la letra
         del telefono y nada creceria: la raiz mide lo que diga el navegador */
      expect(px(app,app.doc.documentElement)).toBe(16);
      app.doc.documentElement.style.fontSize="20px";
      try{expect(px(app,app.doc.body)).toBe(17.5);}finally{deVuelta(app);}
      expect(px(app,app.doc.body)).toBe(14);});
    test("la escala de DISENO 3 sigue en sus px con la letra de serie y crece entera al 130 %",async app=>{
      const raiz=app.w.getComputedStyle(app.doc.documentElement);
      Object.keys(ESCALA).forEach(t=>{
        expect(raiz.getPropertyValue(t)).toContain("rem");
        expect(token(app,t)).toBeCloseTo(ESCALA[t],2);});
      await telefono(app,400,130);
      try{Object.keys(ESCALA).forEach(t=>expect(token(app,t)).toBeCloseTo(ESCALA[t]*1.3,2));}
      finally{deVuelta(app);}});
    test("ningun tamaño de letra fijo en px en el CSS",app=>{
      const malos=[],ver=rs=>[...rs].forEach(r=>{if(r.cssRules)ver(r.cssRules);
        if(!r.style)return;
        ["font-size","font"].forEach(p=>{const v=r.style.getPropertyValue(p);if(/\d(\.\d+)?px/.test(v))malos.push(r.selectorText+" {"+p+":"+v+"}");});
        /* la escala va en rem; el unico px es el suelo de 16 de --t-campo */
        [...r.style].filter(p=>/^--t-/.test(p)).forEach(p=>{const v=r.style.getPropertyValue(p);
          if(p==="--t-campo"?!/^\s*max\(16px,\s*var\(--t-md\)\)\s*$/.test(v):/px/.test(v))malos.push(r.selectorText+" {"+p+":"+v+"}");});});
      [...app.doc.styleSheets].forEach(s=>ver(s.cssRules));
      expect(malos).toEqual([]);});
    test("todo tamaño de letra del CSS es un paso de la escala, ni px ni rem sueltos",app=>{
      /* la prueba de arriba no ve un calc(1.5rem) escrito a mano: crece con
         la letra, pero queda fuera de los once pasos de DISENO 3 */
      const PASO=/^var\(--t-(mega|display|xl|title|lg|md|lead|base|sm|xs|2xs|campo)\)$/;
      const malos=[];let vistos=0;
      const ver=rs=>[...rs].forEach(r=>{if(r.cssRules)ver(r.cssRules);if(!r.style)return;
        const v=r.style.getPropertyValue("font-size").trim();if(!v)return;vistos++;
        if(v!=="inherit"&&!PASO.test(v))malos.push(r.selectorText+" {font-size:"+v+"}");});
      [...app.doc.styleSheets].forEach(s=>ver(s.cssRules));
      expect(vistos).toBeGreaterThan(100);
      expect(malos).toEqual([]);});
    test("los controles no amplian con doble toque y la pagina se sigue pudiendo pellizcar",async app=>{
      /* touch-action:manipulation quita solo el doble toque para ampliar: dos
         toques rapidos en − o + son dos toques. En la pagina, nada: el
         pellizco y el doble toque sobre el texto siguen */
      const ta=el=>app.w.getComputedStyle(el).touchAction,malos=[];let vistos=0;
      const mira=que=>app.$$('.view.active button,.view.active [role="button"],.view.active [role="checkbox"],.view.active [role="switch"],#nav button')
        .filter(e=>e.getClientRects().length).forEach(e=>{vistos++;
          if(ta(e)!=="manipulation")malos.push(que+" · "+e.tagName.toLowerCase()+"."+[...e.classList].join(".")+": "+ta(e));});
      try{tab(app,"home");mira("Inicio");
        app.w.openRoutine("gym_empuje");mira("Rutina");
        app.w.startRoutine("press_banca_db");mira("Guiado");
        expect(app.$$("#guided .sq").length).toBeGreaterThan(3);
        tab(app,"settings");mira("Ajustes");}
      finally{app.sembrar({});app.reiniciarMemoria();tab(app,"home");}
      expect(vistos).toBeGreaterThan(30);
      expect(malos).toEqual([]);
      [app.doc.documentElement,app.doc.body,app.$(".view.active"),app.$(".view.active h1")].forEach(e=>expect(ta(e)).toBe("auto"));});
    test("iOS: con su letra de serie (17 px) y --fk la escala mide lo mismo que en Android",async app=>{
      /* el bloque existe y solo aplica en iOS: Safari de escritorio no tiene
         -webkit-touch-callout y alli la fuente del sistema mide 13 px */
      const bloques=[];const ver=rs=>[...rs].forEach(r=>{if(r.conditionText!=null&&/apple-system-body/.test(r.conditionText))bloques.push(r);
        if(r.cssRules)ver(r.cssRules);});
      [...app.doc.styleSheets].forEach(s=>ver(s.cssRules));
      expect(bloques).toHaveLength(1);
      expect(bloques[0].conditionText).toContain("-webkit-touch-callout");
      expect(bloques[0].cssText).toContain("--fk: .9412");
      /* lo que hace ese bloque en un iPhone: raiz a 17 px y --fk de iOS */
      const h=app.doc.documentElement;h.style.fontSize="17px";h.style.setProperty("--fk",".9412");
      try{Object.keys(ESCALA).forEach(t=>expect(Math.abs(token(app,t)-ESCALA[t])).toBeLessThan(.05));
        /* y con la letra de iOS al maximo sin accesibilidad (23 px) crece un 35 % */
        h.style.fontSize="23px";expect(token(app,"--t-base")).toBeCloseTo(14*23/17,1);}
      finally{deVuelta(app);}});
    test("los campos de texto nunca bajan de 16 px: iOS no amplia la pantalla al enfocarlos",async app=>{
      /* con maximum-scale fuera, un campo de menos de 16 px vuelve a provocar
         el zoom al tocarlo; con la letra del sistema por debajo de la de
         serie tampoco deben bajar */
      await telefono(app,375,87.5);
      const vistos=[];
      try{
        const mide=que=>app.$$("input,select,textarea").filter(i=>i.getClientRects().length&&!/checkbox|file/.test(i.type))
          .forEach(i=>vistos.push([que+" "+(i.id||i.className||i.type),px(app,i)]));
        tab(app,"settings");mide("Ajustes");
        tab(app,"progress");mide("Progreso");
        app.w.openRoutine("gym_empuje");app.w.startRoutine("press_banca_db");app.w.editNum("w");mide("Guiado");app.w.renderStep();
        app.w.logSet();await app.espera(400);app.w.skipRest();app.$("#guided .setline .v").click();mide("Serie");
        app.w.openAddEx("gym_empuje");mide("Agregar");
        app.w.openCustomForm("gym_empuje");mide("Propio");app.$("#swapov").classList.remove("show");
      }finally{deVuelta(app);app.sembrar({});app.reiniciarMemoria();tab(app,"home");}
      expect(vistos.length).toBeGreaterThan(12);
      expect(vistos.filter(v=>v[1]<16)).toEqual([]);});
    humoLetra({semilla:F.vacio,rutina:"gym_empuje",cargado:"press_banca_db"});
  });

  escenario("Letra grande · gimnasio con seis semanas de historial",F.dueno,()=>{
    test("todo el texto de las seis pantallas crece con la letra del sistema, sin excepciones",async app=>{
      /* mismo render dos veces: con la letra de serie y al 130 %. Cada elemento
         con texto propio tiene que crecer un 30 %; uno escrito en px, o un
         boton con la letra del navegador (13,33 px), se quedaria igual */
      const pantallas=[["Inicio",()=>tab(app,"home")],["Rutina",()=>app.w.openRoutine("gym_pierna")],
        ["Guiado",()=>app.w.startRoutine("prensa_inclinada")],["Calendario",()=>tab(app,"history")],
        ["Progreso",()=>tab(app,"progress")],["Ajustes",()=>tab(app,"settings")]];
      const tamanos=()=>{const v=app.$(".view.active");return [...v.querySelectorAll("*"),...app.$$("#nav *")]
        .filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()))
        .map(e=>[e.tagName.toLowerCase()+"."+[...e.classList].join(".")+" «"+e.textContent.trim().slice(0,20)+"»",px(app,e)]);};
      const fallos=[];let total=0;
      try{for(const [nom,ir] of pantallas){
        await telefono(app,400,100);ir();const a=tamanos();
        await telefono(app,400,130);ir();const b=tamanos();
        expect(b.length).toBe(a.length);total+=a.length;
        a.forEach((x,i)=>{const k=b[i][1]/x[1];if(Math.abs(k-1.3)>.02)fallos.push(nom+" · "+x[0]+": "+x[1]+" → "+b[i][1]+" px");});}}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
      expect(total).toBeGreaterThan(300);
      expect(fallos).toEqual([]);});
    test("las etiquetas de las curvas (SVG) crecen con la letra y su margen tambien",async app=>{
      const curva=()=>{tab(app,"progress");const s=app.$("#progBody .chartcard svg");
        return {h:parseFloat(s.getAttribute("height")),f:[...s.querySelectorAll("text")].map(t=>parseFloat(t.getAttribute("font-size")))};};
      const a=curva();
      await telefono(app,400,130);
      let b;try{b=curva();}finally{deVuelta(app);tab(app,"home");}
      expect(a.f.length).toBeGreaterThan(1);
      a.f.forEach((f,i)=>expect(b.f[i]).toBeCloseTo(f*1.3,1));
      /* la curva gana el alto de las etiquetas mas grandes, no lo pierde */
      expect(b.h).toBeGreaterThan(a.h);});
    test("el riel de la semana: nombres con la letra de serie, iconos cuando ya no caben ni cuatro letras",async app=>{
      const riel=()=>app.$$("#weekCard .day .tag").map(t=>{const tx=t.querySelector(".tx"),i=t.querySelector(".ic");
        return (tx&&tx.getClientRects().length?"texto":"")+(i&&i.getClientRects().length?"icono":"");});
      try{await telefono(app,375,100);expect(riel()).toEqual(Array(7).fill("texto"));
        await telefono(app,320,100);expect(riel()).toEqual(Array(7).fill("texto"));
        await telefono(app,320,130);expect(riel()).toEqual(Array(7).fill("icono"));
        await telefono(app,430,130);expect(riel()).toEqual(Array(7).fill("texto"));}
      finally{deVuelta(app);}
      /* el nombre sigue ahi para quien lo necesite: la hoja del plan lo dice entero */
      expect(app.texto("#weekCard .day .tag .tx")).toBe("Empuje");});
    /* El stepper del guiado, la pieza que se toca en cada serie. En cada
       fila de steppers: los botones miden 42 px y van en la misma linea, y la
       cifra o esta encima de los dos o entre ellos con 4 px de aire a cada
       lado. Los steppers de una misma fila, igual los dos. Devuelve los
       problemas y si la cifra va encima. */
    function steppers(app,que){
      const out=[],encima=[];
      app.$$("#guided .logrow").forEach(fila=>{const aqui=[];
        fila.querySelectorAll(".stepper").forEach(st=>{
          const r=st.querySelector(".row"),sq=r.querySelectorAll(".sq"),c=r.querySelector("b,.numin");
          const nom=que+" · "+st.querySelector(".lab").textContent+" «"+(c.value||c.textContent)+"»";
          const a=sq[0].getBoundingClientRect(),b=sq[1].getBoundingClientRect(),s=st.getBoundingClientRect();
          let q=c.getBoundingClientRect();
          if(c.tagName==="B"){const rg=app.doc.createRange();rg.selectNodeContents(c);q=rg.getBoundingClientRect();}
          [a,b].forEach(x=>{
            if(Math.abs(x.width-42)>.5||Math.abs(x.height-42)>.5)out.push(nom+": boton de "+x.width.toFixed(1)+"×"+x.height.toFixed(1)+" px");
            if(x.left<s.left-.5||x.right>s.right+.5)out.push(nom+": boton fuera del stepper");});
          if(Math.abs(a.top-b.top)>1)out.push(nom+": − y + en lineas distintas");
          const arriba=q.bottom<=Math.min(a.top,b.top)+1;
          if(!arriba){const i=q.left-a.right,d=b.left-q.right;
            if(i<3.95||d<3.95)out.push(nom+": aire de "+i.toFixed(1)+" y "+d.toFixed(1)+" px junto a los botones");
            if(q.top>a.bottom||q.bottom<a.top)out.push(nom+": la cifra ni encima ni a la altura de los botones");}
          aqui.push(arriba);});
        if(new Set(aqui).size>1)out.push(que+": en la misma fila, un stepper con la cifra encima y otro no");
        encima.push(aqui[0]);});
      return {out:out,encima:encima[0]};}
    /* escribe el peso como la persona: toca la cifra, teclea y Enter */
    function escribePeso(app,v){app.w.editNum("w");const i=app.$("#numin");i.value=v;
      i.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));}
    /* la fila de steppers y lo que va debajo: cajas de la fila, de sus filas
       de botones, de cada boton, de cada cifra (o su campo) y de "Registrar
       serie" */
    function forma(app){const caja=e=>{const b=e.getBoundingClientRect();return [b.left,b.top,b.width,b.height];},f=app.$("#guided .logrow");
      return [caja(f),...[...f.querySelectorAll(".stepper .row,.sq,.row>b,.numin")].map(caja),caja(app.$("#guided .gbtn.go"))];}
    const misma=(a,b)=>a.length===b.length&&a.every((x,i)=>x.every((v,j)=>Math.abs(v-b[i][j])<.5));
    test("el stepper del peso: botones de 42 px y la cifra encima o con 4 px de aire, de 320 a 430 px y hasta el 130 %",async app=>{
      /* una cifra de cada largo: bajo 10 kg ("7.5"), de 10 a 100 ("57.5") y
         desde 100 ("142.5"); y tambien mientras se escribe el peso o las
         reps: el campo ocupa el sitio de la cifra (entre - y + o encima, como
         ella), la fila no cambia de forma ni se mueve nada de debajo, y la
         cifra de ese largo cabe en el campo sin desplazarse. Y la fila tiene
         la misma forma con las tres: lo decide el ancho y la letra */
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      const fallos=[];let vistas=0;
      try{for(const ancho of [320,360,375,390,412,430])for(const pct of [100,115,130]){
          await telefono(app,ancho,pct);let primera=null;
          for(const v of ["7.5","57.5","142.5"]){const que=ancho+" px al "+pct+" % con «"+v+"»";
            escribePeso(app,v);expect(app.texto("#lw")).toBe(v);
            const c=steppers(app,que);fallos.push(...c.out);vistas++;
            if(!primera)primera=forma(app);
            else if(!misma(forma(app),primera))fallos.push(que+": la fila no tiene la misma forma que con «7.5»");
            for(const k of ["w","r"]){const antes=forma(app),cual=que+", escribiendo "+(k==="w"?"el peso":"las reps");
              app.w.editNum(k);const i=app.$("#numin");if(k==="w")i.value=v;
              const e=steppers(app,cual);fallos.push(...e.out);
              if(!misma(forma(app),antes))fallos.push(cual+": la fila cambia de forma al abrir el campo");
              if(e.encima!==c.encima)fallos.push(cual+": el campo "+(e.encima?"sube encima de":"baja entre")+" los botones y la cifra no");
              const r=i.parentElement,sq=r.querySelectorAll(".sq"),ci=i.getBoundingClientRect();
              const ocupa=e.encima?Math.abs(ci.width-r.clientWidth)<1
                :Math.abs(ci.left-sq[0].getBoundingClientRect().right-4)<.5&&Math.abs(sq[1].getBoundingClientRect().left-ci.right-4)<.5;
              if(!ocupa)fallos.push(cual+": el campo no ocupa el sitio de la cifra");
              if(i.scrollWidth>i.clientWidth)fallos.push(cual+": «"+i.value+"» no cabe en el campo");
              i.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));
              if(!misma(forma(app),antes))fallos.push(cual+": la fila cambia de forma al cerrar el campo");}}}}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
      expect(vistas).toBe(54);
      expect(fallos).toEqual([]);});
    test("una cifra mas larga que «142.5» se desplaza dentro del campo, sin salirse del stepper ni cambiar la fila",async app=>{
      /* lo que se teclea no tiene largo previsto: una cifra mas larga que
         "142.5" no cabe en el sitio que la fila le reserva, y no por eso
         cambia la fila. Que cifra es "mas larga que el campo" depende de la
         letra (con Roboto "1002.5" cabia entre − y + a 412 px): se busca la
         primera de 1002.5, 10002.5… que no cabe en el campo, con su letra.
         Se mira entre − y + y apilada; con cualquier letra, a 430 px y la
         letra de serie la cifra va entre − y + (cabe "142.5" con su aire) */
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      const fallos=[],formas=[],cv=app.doc.createElement("canvas").getContext("2d");
      try{for(const [ancho,pct] of [[412,100],[430,100],[430,115],[375,100]]){
          await telefono(app,ancho,pct);escribePeso(app,"7.5");const que=ancho+" px al "+pct+" %",antes=forma(app);
          formas.push(ancho+"/"+pct+":"+(steppers(app,que).encima?"encima":"entre"));
          app.w.editNum("w");const i=app.$("#numin"),c=app.w.getComputedStyle(i);
          cv.font=c.fontWeight+" "+c.fontSize+" "+c.fontFamily;cv.letterSpacing=c.letterSpacing;
          let v="1002.5";while(cv.measureText(v).width<=i.clientWidth+2)v="1"+v;
          i.value=v;
          fallos.push(...steppers(app,que+", escribiendo «"+v+"»").out);
          if(!misma(forma(app),antes))fallos.push(que+": la fila cambia de forma al escribir «"+v+"»");
          if(!(i.scrollWidth>i.clientWidth))fallos.push(que+": «"+v+"» no se desplaza dentro del campo");
          i.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));
          expect(app.texto("#lw")).toBe(v);
          if(!misma(forma(app),antes))fallos.push(que+": la fila cambia de forma con «"+v+"»");}}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
      expect(formas).toContain("430/100:entre");
      expect(formas).toContain("375/100:encima");
      expect(fallos).toEqual([]);});
    /* Un toque de verdad en el centro de el, con los eventos en el orden en
       que los manda el navegador:
       - con el dedo: pointerdown y pointerup al tocar y soltar; despues,
         seguidos, mousedown (el campo abierto pierde el foco y se cierra),
         mouseup y click;
       - con el raton: pointerdown y mousedown al apretar (el campo se cierra)
         y, un rato despues, pointerup, mouseup y click al soltar.
       mousedown y mouseup van a lo que haya bajo ese punto en su momento, y
       el click al ancestro comun de los dos: si la pantalla se movio entre
       medias, el click cae en otro sitio y el toque se pierde. Cerrar el campo
       con Enter o con renderStep, como el resto de pruebas, no lo veria. */
    async function toca(app,el,modo){
      el.scrollIntoView({block:"center"});
      const b=el.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
      await tocaEn(app,x,y,modo);}
    /* el mismo toque en un punto de la pantalla, sin volver a buscar el
       control: dos toques seguidos caen donde estaba el dedo */
    async function tocaEn(app,x,y,modo){
      const w=app.w,doc=app.doc;
      const manda=(t,tipo)=>{const o={bubbles:true,cancelable:true,composed:true,view:w,clientX:x,clientY:y,button:0};
        t.dispatchEvent(/^pointer/.test(tipo)?new w.PointerEvent(tipo,Object.assign(o,{pointerId:1,isPrimary:true,pointerType:modo==="dedo"?"touch":"mouse"}))
          :new w.MouseEvent(tipo,o));};
      /* lo que hace el navegador en el mousedown: el campo pierde el foco */
      const desenfoca=()=>{const i=doc.getElementById("numin");if(!i)return;i.blur();
        if(i.isConnected)i.dispatchEvent(new w.FocusEvent("blur"));};
      const abajo=doc.elementFromPoint(x,y);
      manda(abajo,"pointerdown");if(modo==="dedo")manda(abajo,"pointerup");
      manda(abajo,"mousedown");desenfoca();
      if(modo==="raton")await app.espera(25);
      const arriba=doc.elementFromPoint(x,y);
      if(modo==="raton")manda(arriba,"pointerup");
      manda(arriba,"mouseup");
      let c=abajo;while(c&&!c.contains(arriba))c=c.parentElement;
      if(c)manda(c,"click");
      /* y lo que el toque deja para despues corre ya, como en el navegador,
         y no en mitad del toque siguiente */
      await app.espera(10);}
    function tocarEscribiendo(modo){
      test("escribir el peso o las reps y tocar «Registrar serie» o + "+(modo==="dedo"?"con el dedo":"con el raton")+": el toque llega y cuenta lo escrito, de 320 a 430 px y al 100 y al 130 %",async app=>{
        /* [lo que habia, lo que se escribe]: del mismo orden, y subiendo o
           bajando de orden, que es cuando la cifra cambia de largo y la fila
           podria cambiar de forma bajo el dedo (DISENO 10) */
        const CASOS=[["55","57.5"],["140","142.5"],["7.5","5"],["97.5","100"],["100","97.5"],["7.5","10"]];
        const empieza=()=>{app.sembrar(F.dueno);app.reiniciarMemoria();app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");};
        const series=()=>app.ev("sessionLog").prensa_inclinada||[];
        const mas=k=>app.$("#l"+k).parentElement.querySelectorAll(".sq")[1];
        /* sin la pausa de "Serie registrada": el descanso entra al momento y
           cada caso empieza de cero (la pausa la mira la prueba de abajo) */
        const mm=app.w.matchMedia;app.w.matchMedia=q=>/reduced-motion/.test(q)?{matches:true}:mm.call(app.w,q);
        const fallos=[];let toques=0;
        try{for(const ancho of [320,360,375,390,412,430])for(const pct of [100,130]){
            await telefono(app,ancho,pct);const que=ancho+" px al "+pct+" %";
            for(const [antes,v] of CASOS){
              empieza();escribePeso(app,antes);app.w.editNum("w");app.$("#numin").value=v;
              await toca(app,app.$("#guided .gbtn.go"),modo);toques++;
              const s=series(),u=s[s.length-1];
              if(s.length!==1||u.w!==+v)fallos.push(que+": de "+antes+" a "+v+" y «Registrar serie»: "+(s.length?"registro "+u.w+" kg":"no se registro"));}
            empieza();app.w.editNum("r");app.$("#numin").value="11";
            await toca(app,app.$("#guided .gbtn.go"),modo);toques++;
            const s=series();
            if(s.length!==1||s[0].reps!==11)fallos.push(que+": 11 reps y «Registrar serie»: "+(s.length?"registro "+s[0].reps+" reps":"no se registro"));
            empieza();escribePeso(app,"97.5");let b=mas("w");app.w.editNum("w");app.$("#numin").value="100";
            await toca(app,b,modo);toques++;
            if(app.ev("curW")!==102.5||app.texto("#lw")!=="102.5")fallos.push(que+": de 97.5 a 100 y +: queda en "+app.texto("#lw"));
            empieza();b=mas("r");app.w.editNum("r");app.$("#numin").value="11";
            await toca(app,b,modo);toques++;
            if(app.ev("curReps")!==12)fallos.push(que+": 11 reps y +: quedan "+app.texto("#lr"));}}
        finally{app.w.matchMedia=mm;deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
        expect(toques).toBe(108);
        expect(fallos).toEqual([]);});}
    tocarEscribiendo("dedo");
    tocarEscribiendo("raton");
    test("al registrar con el campo abierto un peso de otro orden, «Serie registrada» no salta antes del descanso",async app=>{
      /* la fila no cambia de forma con el peso nuevo: el boton ya dice "Serie
         registrada" y se queda quieto hasta que en 300 ms entra el descanso,
         que se pinta de cero */
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      try{await telefono(app,390,100);
        /* que acaben las animaciones de entrada (fade y stageIn, 220 ms) */
        await app.espera(300);
        escribePeso(app,"97.5");app.w.editNum("w");app.$("#numin").value="100";
        const go=app.$("#guided .gbtn.go");go.scrollIntoView({block:"center"});const antes=go.getBoundingClientRect().top;
        await toca(app,go,"dedo");expect(go.textContent).toContain("Serie registrada");
        /* scale(.985) de .done lo mueve menos de medio px; una fila que se
           apilara, 46 */
        await app.espera(60);expect(go.isConnected).toBe(true);expect(Math.abs(go.getBoundingClientRect().top-antes)).toBeLessThan(1);
        await app.hasta(()=>app.$("#guided .ring.rest"),3000,"el descanso");
        const s=app.ev("sessionLog").prensa_inclinada;expect(s[s.length-1].w).toBe(100);}
      finally{await app.espera(350);deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}});
    test("un peso de cinco caracteres (142.5 desde 140 con +) va encima de − y +, y el + no se mueve de un toque al siguiente",async app=>{
      /* el caso de la revision: con 2,5 de salto la cifra alterna "140",
         "142.5" y "145". Si la forma dependiera de la cifra de cada momento,
         el + subiria y bajaria bajo el dedo en cada toque */
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      const mas=()=>{const r=app.$("#lw").parentElement.querySelectorAll(".sq")[1].getBoundingClientRect();
        return [Math.round(r.left),Math.round(r.top)];};
      try{expect(app.texto("#lw")).toBe("140");
        for(const [ancho,pct] of [[375,100],[412,115],[430,130]]){
          await telefono(app,ancho,pct);const que=ancho+" px al "+pct+" %",antes=mas();
          app.w.adjW(2.5);expect(app.texto("#lw")).toBe("142.5");
          const r=steppers(app,que);expect(r.out).toEqual([]);expect(r.encima).toBe(true);
          expect(mas()).toEqual(antes);
          app.w.adjW(2.5);expect(app.texto("#lw")).toBe("145");expect(mas()).toEqual(antes);
          app.w.adjW(-2.5);app.w.adjW(-2.5);expect(app.texto("#lw")).toBe("140");expect(mas()).toEqual(antes);}}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}});
    test("la cifra va entre − y + donde cabe «142.5» con su aire y encima donde no, con la letra del telefono y sea cual sea el peso",async app=>{
      /* donde cabe un "142.5" con 4 px de aire a cada lado, la forma de
         siempre; donde no, apilada con cualquier peso, para que la fila no
         cambie de forma al cambiar el peso. Donde se pasa de una a otra
         depende de la letra: con la letra de serie, desde unos 409 px con
         Inter, 425 con DejaVu Sans y 395 con Roboto. Por eso no se fija un
         ancho: se mide "142.5" con la letra que pinta y el hueco que dejan
         − y + (con 1 px de holgura, la que deja la app). A 320 px no cabe con
         ninguna letra y a 430 con todas las que se prueban (README) */
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      const fallos=[],visto={};
      try{for(const ancho of [320,360,375,390,400,406,412,420,430])for(const pct of [100,115,130]){
          await telefono(app,ancho,pct);const que=ancho+" px al "+pct+" %";
          const formas=["0","7.5","57.5","142.5"].map(v=>{escribePeso(app,v);return steppers(app,que).encima;});
          if(new Set(formas).size>1)fallos.push(que+": la forma cambia con el peso "+JSON.stringify(formas));
          /* "142.5" puesto: su ancho con la letra de la cifra y el hueco
             entre − y + menos los 4 px de aire de cada lado */
          const b=app.$("#lw"),r=b.parentElement,sq=r.querySelectorAll(".sq"),rg=app.doc.createRange();rg.selectNodeContents(b);
          const cifra=rg.getBoundingClientRect().width,hueco=r.clientWidth-sq[0].offsetWidth-sq[1].offsetWidth-8;
          const encima=formas[3];
          if(encima&&hueco>=cifra+1.5)fallos.push(que+": apilada y «142.5» cabia ("+cifra.toFixed(1)+" en "+hueco.toFixed(1)+" px)");
          if(!encima&&hueco<cifra)fallos.push(que+": entre − y + y «142.5» no cabe ("+cifra.toFixed(1)+" en "+hueco.toFixed(1)+" px)");
          if(pct===100)visto[ancho]=encima;}}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
      expect([visto[320],visto[430]]).toEqual([true,false]);
      expect(fallos).toEqual([]);});
    test("la fila del guiado no cambia de forma con la cifra: de 0 a 142.5 kg, de 1 a 100 reps, con − y + y al escribir, de 320 a 430 px y hasta el 130 %",async app=>{
      /* tres revisiones encontraron variantes del mismo fallo: la fila de
         peso y reps cambiaba de forma o de tamaño segun la cifra, y un toque
         en el mismo sitio caia en otro control. Aqui se mide la fila entera
         (botones, cifras, campo y "Registrar serie") con cada cifra, al
         cruzar 97.5→100 y 9→10 reps con + y −, y con el campo abierto */
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      const fallos=[];let vistas=0;
      const reps=v=>{app.w.editNum("r");const i=app.$("#numin");i.value=v;i.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));};
      try{for(const ancho of [320,360,375,390,412,430])for(const pct of [100,115,130]){
          await telefono(app,ancho,pct);const que=ancho+" px al "+pct+" %";
          escribePeso(app,"0");reps("1");const base=forma(app);
          const mira=(como,esperado)=>{vistas++;
            if(esperado!=null&&app.texto(como[0]==="r"?"#lr":"#lw")!==esperado)fallos.push(que+", "+como+": la cifra es «"+app.texto(como[0]==="r"?"#lr":"#lw")+"» y no «"+esperado+"»");
            if(!misma(forma(app),base))fallos.push(que+", "+como+": la fila cambia de forma");};
          for(const v of ["0","5","7.5","10","57.5","97.5","100","142.5","999.5"]){escribePeso(app,v);mira("peso "+v,v);}
          for(const v of ["1","9","10","99","100"]){reps(v);mira("reps "+v,v);}
          escribePeso(app,"97.5");app.w.adjW(2.5);mira("peso de 97.5 a 100 con +","100");
          app.w.adjW(-2.5);mira("peso de 100 a 97.5 con −","97.5");
          escribePeso(app,"7.5");app.w.adjW(2.5);mira("peso de 7.5 a 10 con +","10");
          app.w.adjW(-2.5);mira("peso de 10 a 7.5 con −","7.5");
          reps("9");app.w.adjR(1);mira("reps de 9 a 10 con +","10");
          app.w.adjR(-1);mira("reps de 10 a 9 con −","9");
          reps("99");app.w.adjR(1);mira("reps de 99 a 100 con +","100");
          for(const [k,v] of [["w","142.5"],["w","5"],["r","100"],["r","7"]]){
            app.w.editNum(k);app.$("#numin").value=v;vistas++;
            if(!misma(forma(app),base))fallos.push(que+", escribiendo «"+v+"» en "+(k==="w"?"el peso":"las reps")+": la fila cambia de forma");
            app.$("#numin").dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));}}}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
      expect(vistas).toBe(18*25);
      expect(fallos).toEqual([]);});
    function dosToques(modo){
      test("dos toques seguidos en el mismo punto de + o − "+(modo==="dedo"?"con el dedo":"con el raton")+" cuentan los dos aunque la cifra cambie de largo, de 360 a 412 px y hasta el 130 %",async app=>{
        /* el caso de la tercera revision: de 97.5 a 100 con + la fila se
           apilaba y el segundo toque abria el campo; de 100 a 97.5 con − se
           desapilaba y el segundo caia en la fila de la reserva. El dedo no
           se mueve: el segundo toque va al mismo punto que el primero.
           Cada telefono pinta el paso una vez y da por acabada su entrada
           (fade y stageIn): la animacion tambien moveria el boton, y con el
           tiempo virtual de la CI no se sabe cuando acaba */
        const CASOS=[["w","97.5",1,"102.5"],["w","100",0,"95"],["w","7.5",1,"12.5"],["w","10",0,"5"],
          ["r","9",1,"11"],["r","10",0,"8"],["r","99",1,"101"]];
        const fallos=[];let toques=0;
        try{for(const ancho of [360,375,390,412])for(const pct of [100,115,130]){
            await telefono(app,ancho,pct);
            app.sembrar(F.dueno);app.reiniciarMemoria();app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
            app.doc.getAnimations().forEach(a=>a.finish());
            for(const [k,ini,cual,fin] of CASOS){const que=ancho+" px al "+pct+" %, "+(k==="w"?"peso":"reps")+" desde "+ini+" con "+(cual?"+":"−")+" "+(cual?"+":"−");
              app.w.editNum(k);const i=app.$("#numin");i.value=ini;i.dispatchEvent(new app.w.KeyboardEvent("keydown",{key:"Enter"}));
              const boton=()=>app.$("#l"+k).parentElement.querySelectorAll(".sq")[cual];
              boton().scrollIntoView({block:"center"});
              const b=boton().getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
              await tocaEn(app,x,y,modo);toques++;
              const d=boton().getBoundingClientRect();
              if(Math.abs(d.left-b.left)>.5||Math.abs(d.top-b.top)>.5)fallos.push(que+": el boton se mueve "+(d.left-b.left).toFixed(1)+", "+(d.top-b.top).toFixed(1)+" px tras el primer toque");
              await tocaEn(app,x,y,modo);toques++;
              if(app.$("#numin"))fallos.push(que+": el segundo toque abre el campo");
              if(app.texto("#l"+k)!==fin)fallos.push(que+": queda en «"+app.texto("#l"+k)+"» y no en «"+fin+"»");}}}
        finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}
        expect(toques).toBe(12*7*2);
        expect(fallos).toEqual([]);});}
    dosToques("dedo");
    dosToques("raton");
    /* El aviso usa el ancho que declara, el 86 % de la pantalla: si su texto
       cabe en una linea, va en una; si no, el aviso llega a ese 86 % antes de
       partirse, y se parte en las lineas que pide su largo. Que quepa o no
       depende de la letra (con DejaVu Sans, «Salto quitado: vuelven los de
       siempre» no cabe a 320 px), asi que se mide con la que pinta: el largo
       del texto en una sola linea y las lineas que ocupa. Devuelve los
       problemas */
    function usaElAncho(app,el){const w=app.w,s=el.querySelector(".tmsg"),out=[],txt="«"+el.textContent.trim()+"»";
      const cs=w.getComputedStyle(s),linea=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.45;
      const lineas=Math.round(s.getBoundingClientRect().height/linea),ancho=s.getBoundingClientRect().width;
      const rg=app.doc.createRange();s.style.whiteSpace="nowrap";rg.selectNodeContents(s);
      const entero=rg.getBoundingClientRect().width;s.style.whiteSpace="";
      const max=w.innerWidth*0.86,caja=el.getBoundingClientRect().width;
      if(caja>max+0.5)out.push(txt+": el aviso mide "+caja.toFixed(1)+" px, mas del 86 % ("+max.toFixed(1)+")");
      if(lineas>1&&caja<max-1)out.push(txt+": en "+lineas+" lineas con "+caja.toFixed(1)+" px de los "+max.toFixed(1)+" que tiene");
      if(lineas>Math.ceil(entero/ancho)+1)out.push(txt+": "+lineas+" lineas para "+entero.toFixed(0)+" px de texto en "+ancho.toFixed(0));
      return out;}
    test("el aviso flotante es un solo bloque de texto y usa el ancho de la pantalla",async app=>{
      /* con left:50% el aviso solo tenia media pantalla, y suelto cada <b> era
         otra columna: «Récord en / Jalón al / pecho:» al lado de «55 / kg ×» */
      await telefono(app,320,130);
      try{app.w.toast(app.w.ic("trophy","sm")+" Récord en Prensa inclinada: <b>142.5 kg × 12</b>");await app.espera(30);
        const t=app.$("#toast"),hijos=[...t.children].map(e=>e.tagName.toLowerCase());
        expect(hijos).toEqual(["svg","span"]);
        expect(app.texto("#toast")).toBe("Récord en Prensa inclinada: 142.5 kg × 12");
        /* las lineas que pide su largo con la letra que pinta, y no antes de
           usar el 86 %: «menos de 2,5 lineas» valia con Inter y no con
           DejaVu Sans, que pide tres */
        expect(usaElAncho(app,t)).toEqual([]);}
      finally{deVuelta(app);}});
    humoLetra({semilla:F.dueno,rutina:"gym_pierna",cargado:"prensa_inclinada"});
  });

  escenario("Letra grande · casa con una sesion a medias",F.madre,()=>{
    humoLetra({semilla:F.madre,rutina:"salud_fuerza_b",cargado:"remo_db"});
  });
})();
