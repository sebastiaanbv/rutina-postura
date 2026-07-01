const CACHE = "rutina-postura-v1";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

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
  const url = new URL(e.request.url);
  // Solo el "shell" de la app se sirve desde caché; los videos de YouTube van a la red.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
