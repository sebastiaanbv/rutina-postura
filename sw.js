const CACHE = "mi-rutina-v33";
/* La app es index.html y nada mas, salvo figuras.js: los 201 fotogramas de las
   ilustraciones. Va aparte a proposito. index.html es codigo y cambia en cada
   version, asi que va network-first; figuras.js son datos que no cambian nunca,
   asi que va cache-first y se descarga UNA vez (1,96 MB, 0,62 comprimido).
   Si algun dia se tocan las figuras hay que CAMBIARLES EL NOMBRE (figuras-2.js,
   aqui y en index.html): subir CACHE ya no basta, porque install reutiliza el
   figuras.js que haya en cualquier cache. */
const ASSETS = ["./", "index.html",
  "manifest.webmanifest", "icon-192-v25.png", "icon-512-v25.png",
  "icon-maskable-512-v25.png", "icon-mono-512-v25.png",
  "apple-touch-icon-v25.png", "favicon.ico"];

/* figuras.js va APARTE de ASSETS y con su propio catch, no por capricho:
   `addAll` es atomico, asi que si la descarga de sus 2 MB falla --una red mala
   basta-- se rechaza la promesa entera, el service worker no se instala y la
   app pierde el modo sin conexion completo. Asi, en el peor caso solo se queda
   sin figuras hasta la siguiente visita.
   Y si ya esta en alguna cache (la de la version anterior, o esta misma si
   CACHE no cambio), se copia en vez de pedirla otra vez: un sw.js nuevo no
   vuelve a mover 2 MB por la red del telefono. */
function figuras(c) {
  return caches.match("figuras.js")
    .then(r => r ? c.put("figuras.js", r) : c.add("figuras.js"))
    .catch(() => {});
}
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).then(() => figuras(c)))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // videos de YouTube -> red normal
  // La app (index.html) va network-first: así las actualizaciones se ven al instante.
  /* el manifest tambien va por red primero: es donde vive el set de iconos,
     y con cache-first un cambio ahi tardaria en verse o no se veria */
  if (req.mode === "navigate" || url.pathname.endsWith("/") ||
      url.pathname.endsWith("index.html") || url.pathname.endsWith(".webmanifest")) {
    e.respondWith(
      /* solo se guarda una respuesta buena: un 404 o 500 de GitHub Pages no
         puede pisar la copia sana que sostiene el modo sin conexion */
      fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
        .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
  } else {
    /* si figuras.js fallo en install, se guarda en la primera descarga buena;
       antes se bajaban 2 MB en cada visita hasta la siguiente version */
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && url.pathname.endsWith("figuras.js")) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return res;
    })));
  }
});
/* Tocar un aviso devuelve a la app: si ya hay una ventana abierta se enfoca
   (conserva la serie y el descanso tal como estaban); si no, se abre una. La
   del fin de descanso (tag rp-rest) abre con #retomar y el arranque vuelve al
   guiado en el paso guardado; el recordatorio abre Inicio. Va en el fragmento
   y no en ?retomar=1 a proposito: la cache casa las URL sin fragmento, asi que
   sin red sale la misma copia de la app que al abrirla a mano; con ?, el
   network-first guardaria otra copia aparte que, sin red, podria ser de una
   version vieja. Solo cuentan las ventanas de este scope: en github.io el
   origen lo comparten otros repos. */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.tag === "rp-rest" ? "./#retomar" : "./";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
      const w = cs.find(c => c.url.indexOf(self.registration.scope) === 0);
      return w ? w.focus() : self.clients.openWindow(url);
    }).catch(() => {})
  );
});
