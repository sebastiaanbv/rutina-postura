const CACHE = "mi-rutina-v31";
const ASSETS = ["./", "index.html", "poses3d.js", "pose3d.js", "figura3d.js",
  "lib/three.module.min.js",
  "lib/three-addons/geometries/ParametricGeometry.js",
  "lib/three-addons/utils/BufferGeometryUtils.js",
  "lib/mannequin/mannequin.js", "lib/mannequin/globals.js", "lib/mannequin/scene.js",
  "lib/mannequin/bodies/Mannequin.js", "lib/mannequin/bodies/Male.js",
  "lib/mannequin/bodies/Female.js", "lib/mannequin/bodies/Child.js",
  "lib/mannequin/organs/Joint.js", "lib/mannequin/organs/Body.js",
  "lib/mannequin/organs/Pelvis.js", "lib/mannequin/organs/Torso.js",
  "lib/mannequin/organs/Neck.js", "lib/mannequin/organs/Head.js",
  "lib/mannequin/organs/Arm.js", "lib/mannequin/organs/Elbow.js",
  "lib/mannequin/organs/Wrist.js", "lib/mannequin/organs/Finger.js",
  "lib/mannequin/organs/Fingers.js", "lib/mannequin/organs/Nails.js",
  "lib/mannequin/organs/Phalange.js", "lib/mannequin/organs/Leg.js",
  "lib/mannequin/organs/Knee.js", "lib/mannequin/organs/Ankle.js",
  "lib/mannequin/shapes/ParametricShape.js", "lib/mannequin/shapes/LimbShape.js",
  "lib/mannequin/shapes/TorsoShape.js", "lib/mannequin/shapes/HeadShape.js",
  "lib/mannequin/shapes/PelvisShape.js", "lib/mannequin/shapes/ShoeShape.js",
  "manifest.webmanifest", "icon-192-v25.png", "icon-512-v25.png",
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
  /* figura3d.js, pose3d.js y poses3d.js son la app tanto como index.html:
     cambian en cada version. Estuvieron cache-first y el efecto fue que las
     figuras se quedaban congeladas en la version que hubiera cuando se instalo
     el service worker -- se podian cambiar cien veces y en el telefono no se
     movia ni una. La libreria de lib/ si va cache-first: son 730 KB, no cambia
     y es lo que hace que la app funcione sin red. */
  if (req.mode === "navigate" || url.pathname.endsWith("/") ||
      url.pathname.endsWith("index.html") || url.pathname.endsWith(".webmanifest") ||
      url.pathname.endsWith("figura3d.js") || url.pathname.endsWith("poses3d.js") ||
      url.pathname.endsWith("pose3d.js")) {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
