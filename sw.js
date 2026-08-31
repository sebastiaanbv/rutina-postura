const CACHE = "mi-rutina-v29";
const ASSETS = ["./", "index.html", "figuras.js", "manifest.webmanifest", "icon-192-v25.png", "icon-512-v25.png",
  "icon-maskable-512-v25.png", "icon-mono-512-v25.png",
  "apple-touch-icon-v25.png", "favicon.ico"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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
