const CACHE = "mi-rutina-v32";
/* La app es index.html y nada mas, salvo figuras.js: los 201 fotogramas de las
   ilustraciones. Va aparte a proposito. index.html es codigo y cambia en cada
   version, asi que va network-first; figuras.js son datos que no cambian nunca,
   asi que va cache-first y se descarga UNA vez (1,96 MB, 0,62 comprimido).
   Si algun dia se tocan las figuras hay que subir CACHE, o los telefonos que ya
   la tengan instalada se quedaran con las viejas para siempre. */
const ASSETS = ["./", "index.html",
  "manifest.webmanifest", "icon-192-v25.png", "icon-512-v25.png",
  "icon-maskable-512-v25.png", "icon-mono-512-v25.png",
  "apple-touch-icon-v25.png", "favicon.ico"];

/* figuras.js va APARTE de ASSETS y con su propio catch, no por capricho:
   `addAll` es atomico, asi que si la descarga de sus 2 MB falla --una red mala
   basta-- se rechaza la promesa entera, el service worker no se instala y la
   app pierde el modo sin conexion completo. Asi, en el peor caso solo se queda
   sin figuras hasta la siguiente visita. */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).then(() => c.add("figuras.js").catch(() => {})))
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
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
