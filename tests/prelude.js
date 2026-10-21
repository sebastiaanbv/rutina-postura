/* Preludio de pruebas. run.py lo inyecta como PRIMER script de index.html
   (solo cuando la URL lleva ?__pruebas; el archivo en disco no cambia), asi
   que corre antes que la app y deja bajo control lo que una prueba no puede
   atrapar desde fuera:
   - errores: window.onerror, promesas rechazadas sin capturar, console.error y
     recursos que no cargan. Van a window.__errores y al arnes (parent).
   - dialogos: alert/confirm/prompt no bloquean; responden lo que la prueba
     deje en __respuestaConfirm / __respuestaPrompt.
   - descargas: un <a download> no baja nada; su contenido queda en __descargas.
   - service worker: no se registra, para que ninguna cache se meta entre
     una corrida y la siguiente. */
(function(){
  var W=window,errores=W.__errores=[],avisos=W.__avisos=[];
  W.__dialogos=[];W.__descargas=[];W.__respuestaConfirm=false;W.__respuestaPrompt=null;
  function texto(a){return Array.prototype.map.call(a,function(x){
    if(x&&x.stack)return String(x.stack);try{return typeof x==="string"?x:JSON.stringify(x);}catch(e){return String(x);}}).join(" ");}
  function anota(tipo,msg){var r={tipo:tipo,msg:String(msg).slice(0,800),url:location.pathname};
    errores.push(r);try{if(W.parent!==W&&W.parent.__erroresApp)W.parent.__erroresApp.push(r);}catch(e){}}
  W.addEventListener("error",function(e){
    var t=e.target;
    if(t&&t!==W&&t.tagName){anota("recurso","no cargo "+t.tagName.toLowerCase()+" "+(t.src||t.href||""));return;}
    anota("error",(e.message||"error")+(e.filename?" @ "+e.filename.split("/").pop()+":"+e.lineno+":"+e.colno:"")
      +(e.error&&e.error.stack?"\n"+e.error.stack:""));},true);
  W.addEventListener("unhandledrejection",function(e){
    var r=e.reason;anota("promesa",r&&r.stack?r.stack:texto([r]));});
  var cerr=console.error,cwarn=console.warn;
  console.error=function(){anota("console.error",texto(arguments));return cerr.apply(console,arguments);};
  console.warn=function(){avisos.push(texto(arguments));return cwarn.apply(console,arguments);};
  W.alert=function(m){W.__dialogos.push({tipo:"alert",msg:String(m)});};
  W.confirm=function(m){W.__dialogos.push({tipo:"confirm",msg:String(m)});return !!W.__respuestaConfirm;};
  W.prompt=function(m,d){W.__dialogos.push({tipo:"prompt",msg:String(m),def:d});return W.__respuestaPrompt;};
  var clic=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    if(!this.hasAttribute("download"))return clic.apply(this,arguments);
    var d={nombre:this.download,href:this.href,texto:null};W.__descargas.push(d);
    /* la app revoca el blob a los 600 ms: se lee ya */
    fetch(this.href).then(function(r){return r.text();}).then(function(t){d.texto=t;})
      .catch(function(e){d.texto="";anota("descarga","no se pudo leer "+d.nombre+": "+e);});};
  try{if(navigator.serviceWorker)navigator.serviceWorker.register=function(){
    return Promise.reject(new Error("service worker desactivado en pruebas"));};}catch(e){}
})();
