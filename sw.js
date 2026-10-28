const CACHE = "mi-rutina-v33";
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
/* Red primero, pero con tiempo limite. Con senal mala la peticion ni responde
   ni falla: se queda colgada medio minuto o mas y la pantalla en blanco. A los
   ESPERA_RED ms se sirve la copia guardada y la descarga sigue detras; si
   termina, se guarda y la version nueva sale en la siguiente apertura. Sin
   copia (la primera visita, o justo despues de "Buscar actualizacion", que
   vacia la cache) no hay nada mejor que ofrecer y se espera a la red, como
   antes. Con la red caida del todo no se espera: la copia sale en el acto. */
const ESPERA_RED = 3000;
function redPrimero(e, req) {
  /* cuenta como llegada cuando llega ENTERA, no al llegar las cabeceras: con
     senal mala tambien se atasca el cuerpo, y la app es un solo archivo que
     no pinta nada util hasta tenerlo completo */
  const red = fetch(req).then(r => r.ok ? r.clone().arrayBuffer().then(() => r) : r);
  /* solo se guarda una respuesta buena: un 404 o 500 de GitHub Pages no
     puede pisar la copia sana que sostiene el modo sin conexion */
  e.waitUntil(red.then(r => { if (r.ok) { const cp = r.clone(); return caches.open(CACHE).then(c => c.put(req, cp)); } })
    .catch(() => {}));
  /* el manifest no cae a index.html: servir HTML como manifest no arregla nada */
  const copia = () => caches.match(req)
    .then(r => r || (req.mode === "navigate" ? caches.match("index.html") : r)).catch(() => undefined);
  /* gana lo primero que llegue: la red entera, o la copia al vencer el plazo.
     Si la red falla, la copia; sin copia, el error de siempre */
  return new Promise((sirve, falla) => {
    let hecho = false;
    const fin = (f, x) => { if (!hecho) { hecho = true; clearTimeout(t); f(x); } };
    const t = setTimeout(() => copia().then(r => r && fin(sirve, r)), ESPERA_RED);
    red.then(r => fin(sirve, r), err => copia().then(r => r ? fin(sirve, r) : fin(falla, err)));
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // videos de YouTube -> red normal
  // La app (index.html) va network-first: así las actualizaciones se ven al instante.
  /* el manifest tambien va por red primero: es donde vive el set de iconos,
     y con cache-first un cambio ahi tardaria en verse o no se veria */
  if (req.mode === "navigate" || url.pathname.endsWith("/") ||
      url.pathname.endsWith("index.html") || url.pathname.endsWith(".webmanifest")) {
    e.respondWith(redPrimero(e, req));
  } else {
    /* si figuras.js fallo en install, se guarda en la primera descarga buena;
       antes se bajaban 2 MB en cada visita hasta la siguiente version */
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && url.pathname.endsWith("figuras.js")) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return res;
    })));
  }
});
