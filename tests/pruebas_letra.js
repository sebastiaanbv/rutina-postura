/* HU-55 · Zoom y letra del sistema. Quien necesita letra grande la sube en el
   telefono, y la app tiene que crecer con ella sin cortar ni pisar nada, de
   320 a 430 px de ancho, y dejarse ampliar con dos dedos.
   La letra del sistema se simula agrandando la raiz (<html>): es justo lo que
   hacen <meta name="text-scale"> en Android, -apple-system-body en iOS y el
   ajuste de letra del navegador. Toda la escala va en rem, asi que crece. */
(function(){
  const F=Fixtures;
  const tab=(app,v)=>{app.$('.nav .tab[data-v="'+v+'"]').click();};
  /* el telefono: px de ancho y la letra del sistema al pct % */
  async function telefono(app,px,pct){app.frame.style.width=px+"px";
    app.doc.documentElement.style.fontSize=pct===100?"":pct+"%";await app.espera(30);}
  function deVuelta(app){app.frame.style.width="400px";app.doc.documentElement.style.fontSize="";
    app.doc.documentElement.style.removeProperty("--fk");}
  const px=(app,el)=>parseFloat(app.w.getComputedStyle(el).fontSize);
  /* mide un token en px con un elemento de prueba */
  function token(app,t){const d=app.doc.createElement("div");d.style.fontSize="var("+t+")";
    app.doc.body.appendChild(d);const v=px(app,d);d.remove();return v;}

  /* Los once pasos de DISENO 3 con la letra de serie */
  const ESCALA={"--t-mega":50,"--t-display":30,"--t-xl":26,"--t-title":22,"--t-lg":20,"--t-md":16,
    "--t-lead":15,"--t-base":14,"--t-sm":12.5,"--t-xs":11,"--t-2xs":10};

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
    /* un campo: su valor, o el texto de ayuda si esta vacio, entero */
    const cv=doc.createElement("canvas").getContext("2d");
    raiz.querySelectorAll("input,select").forEach(i=>{
      if(!i.getClientRects().length||plegado(i)||/checkbox|file|time/.test(i.type))return;
      const c=w.getComputedStyle(i),t=i.tagName==="SELECT"?(i.selectedOptions[0]||{}).text:(i.value||i.placeholder);if(!t)return;
      cv.font=c.fontWeight+" "+c.fontSize+" "+c.fontFamily;
      const util=i.clientWidth-parseFloat(c.paddingLeft)-parseFloat(c.paddingRight)-(i.tagName==="SELECT"?20:0);
      if(cv.measureText(t).width>util+1)out.push("no cabe: «"+t+"» en "+nombre(i));});
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
      app.w.editNum("w");app.$("#numin").value="142.5";await mira("Guiado, escribiendo el peso");app.w.renderStep();
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
    test("el peso sube encima de los botones − y + cuando no cabe entre ellos",async app=>{
      const fila=()=>{const s=app.$("#guided .stepper"),b=s.querySelector(".row b").getBoundingClientRect(),
        m=s.querySelectorAll(".sq")[0].getBoundingClientRect(),M=s.querySelectorAll(".sq")[1].getBoundingClientRect();
        return {encima:b.bottom<=m.top+1,entre:b.left>=m.right-1&&b.right<=M.left+1};};
      app.w.openRoutine("gym_pierna");app.w.startRoutine("prensa_inclinada");
      try{await telefono(app,430,100);expect(fila()).toEqual({encima:false,entre:true});
        await telefono(app,375,100);expect(fila()).toEqual({encima:false,entre:true});
        await telefono(app,320,100);expect(fila().encima).toBe(true);
        await telefono(app,375,130);expect(fila().encima).toBe(true);
        /* a 430 px la cifra al 130 % todavia cabe entre los botones */
        await telefono(app,430,130);expect(fila()).toEqual({encima:false,entre:true});}
      finally{deVuelta(app);app.sembrar(F.dueno);app.reiniciarMemoria();tab(app,"home");}});
    test("el aviso flotante es un solo bloque de texto y usa el ancho de la pantalla",async app=>{
      /* con left:50% el aviso solo tenia media pantalla, y suelto cada <b> era
         otra columna: «Récord en / Jalón al / pecho:» al lado de «55 / kg ×» */
      await telefono(app,320,130);
      try{app.w.toast(app.w.ic("trophy","sm")+" Récord en Prensa inclinada: <b>142.5 kg × 12</b>");await app.espera(30);
        const t=app.$("#toast"),hijos=[...t.children].map(e=>e.tagName.toLowerCase());
        expect(hijos).toEqual(["svg","span"]);
        expect(app.texto("#toast")).toBe("Récord en Prensa inclinada: 142.5 kg × 12");
        const s=t.querySelector("span"),linea=parseFloat(app.w.getComputedStyle(s).lineHeight)||px(app,s)*1.45;
        expect(s.getBoundingClientRect().height/linea).toBeLessThan(2.5);
        expect(t.getBoundingClientRect().width).toBeGreaterThan(app.doc.documentElement.clientWidth*.6);}
      finally{deVuelta(app);}});
    humoLetra({semilla:F.dueno,rutina:"gym_pierna",cargado:"prensa_inclinada"});
  });

  escenario("Letra grande · casa con una sesion a medias",F.madre,()=>{
    humoLetra({semilla:F.madre,rutina:"salud_fuerza_b",cargado:"remo_db"});
  });
})();
