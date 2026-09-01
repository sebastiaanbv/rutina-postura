# mannequin.js 5.2.3 — copia local y sus parches

Origen: <https://github.com/boytchev/mannequin.js> · Pavel Boytchev · **GPL-3.0**
(la licencia completa, en `LICENSE`, junto a este archivo).

Está vendorizada y no traída de un CDN porque la app es *offline-first*: el service
worker tiene que poder guardarla, y no puede depender de que jsdelivr responda.

Se copió `src/` entero **menos `font.js`** (44 KB) y menos `src/editor/`. Dos parches
locales, los dos anotados dentro del propio archivo:

## 1 · `organs/Joint.js` — sin la fuente 3D

Se retiran los `import` de `TextGeometry` y de `font.js`, el bloque `fontStyle`/`fontParams`
y el método `Joint.label()`. Era lo único que usaba la fuente: 44 KB para poder rotular las
articulaciones con texto 3D, algo que la app no hace. 5 336 → 4 667 bytes, y nos ahorra el
archivo de fuente entero.

## 2 · `scene.js` — sin escenario propio

El original, **con solo importarlo**, crea un `WebGLRenderer` a pantalla completa pegado a
`document.body`, añade un favicon y un `<meta name="viewport">`, y arranca su propio bucle de
render con `OrbitControls`. Para incrustar el maniquí dentro de la app eso sobra entero:
la cámara ortográfica, el lienzo y el bucle los pone `figura3d.js`.

Se sustituye por una versión sin DOM que exporta **los mismos nombres**, así que el resto de
la librería no se entera. `bodies/Mannequin.js` solo necesita `scene` para hacer
`scene.add(this)` en su constructor; nosotros reparentamos la figura justo después.

**Efecto secundario buscado:** `Joint.point()` hace `(window.scene ?? localScene).worldToLocal(…)`.
Como la app no define `window.scene`, usa una escena vacía con matriz identidad y `point()`
devuelve **coordenadas de mundo**. Es exactamente lo que necesita el validador para medir
apoyos y choques.

## Dependencias que sí hacen falta

`shapes/ParametricShape.js` usa `ParametricGeometry` y `BufferGeometryUtils` de los *addons*
de three.js. Están vendorizados en `../three-addons/` y el *import map* resuelve
`three/addons/` hacia ahí.

## Al actualizar la librería

Rehacer los dos parches. Si `Joint.js` o `scene.js` cambian de forma, este archivo es el
sitio donde mirar qué se tocó y por qué.
