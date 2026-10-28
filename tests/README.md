# Pruebas de Mi Rutina

Un solo comando, desde la raíz del repo:

```
python tests/run.py
```

Sale con código 0 si todo pasa y 1 si algo falla. Tarda unos 5-10 s. No hace falta instalar nada: usa Python 3 y Edge (o Chrome si Edge no responde) en modo sin interfaz.

Otras opciones:

- `python tests/run.py --filtro suggestLoad` corre solo las pruebas cuyo `escenario › nombre` contiene ese texto.
- `python tests/run.py --servir` deja el servidor arriba e imprime la URL del arnés, para abrirlo en un navegador y depurar con las herramientas de desarrollo.
- `python tests/run.py --navegador "C:/ruta/chrome.exe"` fuerza un navegador.
- `python tests/run.py --json salida.json` guarda los resultados crudos.

## Cómo funciona

- `run.py` sirve la raíz del repo con `http.server` en un puerto libre y abre `tests/harness.html` con `--headless=new --dump-dom` y un perfil temporal nuevo en cada corrida, así que no quedan service worker ni localStorage de corridas anteriores. Lee el resultado del DOM volcado (`<script type="application/json" id="results">`).
- Cuando el arnés pide `index.html?__pruebas`, el servidor inyecta `tests/prelude.js` como primer script. El archivo en disco no cambia. El preludio captura los errores de la app (excepciones, promesas rechazadas sin capturar, `console.error` y recursos que no cargan), responde los `confirm`/`prompt` sin bloquear, convierte las descargas en texto legible y desactiva el service worker.
- `run.py` corre el navegador con `--virtual-time-budget`: el reloj de la página es virtual y salta al siguiente temporizador en cuanto no hay nada pendiente. Chrome solo cuenta como pendiente una petición de red; una lectura de `FileReader` no lo es, así que sin ayuda un `hasta(..., 3000)` o el tope de 20 s vencían antes de que la copia terminara de leerse (fallos intermitentes al importar). Por eso el preludio abre, mientras dura cada lectura, una petición a `/__retener` (el servidor no la contesta) y la cancela al terminar: el reloj espera a la lectura. Si una prueba nueva espera otro trabajo asíncrono que no pasa por la red, necesita lo mismo.
- `harness.html` carga la app en un iframe del mismo origen. Antes de cada escenario vacía localStorage, lo siembra y recrea el iframe. Las pruebas llaman a las funciones reales de la app (`app.w.suggestLoad(...)`); las `const`/`let` se leen con `app.ev("EX")`.
- Una prueba falla si una aserción falla, si pasa de 20 s o si la app registró cualquier error mientras corría.
- **Con el reloj virtual de `run.py` no se mide en ms.** Como el reloj solo avanza cuando el navegador está ocioso (`--virtual-time-budget`, más arriba), los `setTimeout` pasan al instante pero, dentro de JS síncrono, `performance.now()` y `Date.now()` no se mueven y cualquier medida en ms da 0. Una prueba de rendimiento comprueba algo que no dependa del reloj (lecturas, parseos, KB), que es lo que vale en la CI, y deja la medida en ms para cuando el reloj es real: el arnés servido con `--servir` y abierto en un navegador, o en Playwright. Si el reloj no avanzó, la prueba llama a `test.omitir(motivo)` y sale omitida con su motivo, no en verde ni en rojo.

## Archivos

| Archivo | Qué hay |
|---|---|
| `run.py` | servidor, navegador y resumen |
| `prelude.js` | se inyecta en la app: errores, diálogos, descargas, service worker |
| `lib.js` | mini marco: `escenario`, `test`, `test.skip`, `test.omitir`, `expect`, el objeto `app` (con `app.enZona`), `Pruebas.tiempoReal` y el ejecutor |
| `fixtures.js` | datos con la forma exacta de las claves `rp_*`: `vacio`, `dueno`, `madre`, `sinCerrar`, `cambioHora` (fechas fijas que cruzan cambios de hora), `aMedias` (Empuje a medias hoy, 3 de 14) y `dosAnos` (104 semanas de gimnasio, para medir con un historial largo; con una sesión cada día 1 para que el resumen del mes salga cualquier día) |
| `pruebas_logica.js` | suggestLoad y todayTarget (también con los juegos de datos de v35), salto de cada máquina (`rp_inc`), isPR/prKind (y su coherencia con prFeed), dose/SECDOSE, effList, buildSteps, estMinutes, strengthIdx, fechas, pendientes al final del guiado, y el récord en la propia serie del guiado (borrar, corregir, aviso) |
| `pruebas_datos.js` | copia de seguridad de ida y vuelta, importaciones que no deben tocar nada, sesión sin cerrar, datos dañados o con otra forma, esquema `rp_schema` y migraciones, récords con y sin `i`/`kind`, teléfono lleno (`lleno(app,{margen:0})` simula `QuotaExceededError`), `rp_streak`, racha semanal con datos de v35, racha que cruza cambios de hora en cinco zonas, otra rutina con una a medias (hoja de conflicto), mirar el guiado sin registrar, y borrar una serie del guiado y deshacerlo |
| `pruebas_pantallas.js` | recorrido de humo por Inicio, rutina, guiado, Calendario, Progreso y Ajustes con cada juego de datos, el guiado con un descanso de 0 s ajustado y el chip «Salto» del guiado, y una sola racha (semanas cumplidas) en Inicio, pantalla de fin, Progreso y Ajustes, también con zona horaria emulada; aviso de pendientes con las sesiones de v35; zonas de toque de la fila de serie (medidas con `elementFromPoint`) y el aviso de serie borrada |
| `pruebas_sw.js` | el service worker: `sw.js` tal cual en una caja con red, caché y reloj de mentira (red buena, lenta, caída, sin copia) y «Buscar actualización» en la app |
| `pruebas_avisos.js` | volver a la app al tocar un aviso: `sw.js` tal cual con dobles de `self`, `caches`, `clients` y `fetch` (install y `notificationclick`), y el arranque con `#retomar` |
| `pruebas_progreso.js` | Progreso lee `rp_logs` una sola vez por pintado y pinta lo mismo que antes; con `dosAnos`, 1 parseo del historial frente a más de 20 y, con reloj real, menos del 60 % del tiempo |

## Añadir una prueba

Dentro de un `escenario(...)` existente:

```js
test("isPR: una serie igual a la mejor no es récord", app => {
  app.sembrar({rp_logs: {press_banca_db: [{date: Fixtures.fecha(3), sets: [{w: 30, reps: 8}], k: "gym_empuje", t: 1}]}});
  expect(app.w.isPR("press_banca_db", 30, 8)).toBe(false);
});
```

- `app.sembrar(datos)` reemplaza localStorage sin recargar. La app lee el almacenamiento en cada llamada, así que basta para probar lógica. Si una prueba toca la memoria de la app (`curRoutine`, la sesión en curso), al final llama a `app.reiniciarMemoria()`.
- `await app.arrancar(datos, "#retomar")` vuelve a cargar la app de cero con esos datos; el segundo argumento, opcional, se añade a la URL.
- `async` está permitido: `await app.hasta(() => condición, ms)` y `await app.espera(ms)`.
- El navegador corre en la zona horaria del equipo (UTC en CI, sin cambios de hora). Para lo que dependa de fechas, `await app.enZona("Europe/Madrid", () => {...}, "2026-11-04T12:30:00Z")` corre la función con la app en esa zona IANA y, si se da el tercer argumento, con el reloj parado en ese instante. Las cuentas locales de `Date` (`getDate`, `setHours`, `new Date(a, m, d)`, `"AAAA-MM-DDTHH:MM"`) se hacen en esa zona con `Intl`; el instante (`getTime`, `toISOString`) es el de siempre. Al terminar vuelve el `Date` normal.
- `run.py` corre con tiempo virtual (`--virtual-time-budget`): en cuanto la página no tiene nada
  que hacer, el reloj salta al siguiente temporizador. Lo que espera al proceso del navegador
  (CacheStorage, los registros del service worker) pierde contra el tope de 20 s de la prueba:
  usa dobles. Si la prueba necesita lo de verdad (la caché del navegador en
  `tests/pruebas_avisos.js`), envuélvelo en `await Pruebas.tiempoReal(async () => {...})`: un
  bucle de mensajes no deja la página ociosa y el reloj avanza sin saltos. Retenerlo con una
  petición pendiente, como `FileReader`, no sirve ahí: Chrome no entrega las respuestas de la
  caché mientras la red retiene el reloj. Y mientras se lee el cuerpo de un `ReadableStream` que
  sigue abierto, Chrome congela temporizadores y mensajes: hasta cerrarlo solo valen microtareas
  (`await null`), o la corrida no termina y la CI no devuelve nada. `tests/pruebas_sw.js` tiene
  los dos casos.
- Aserciones: `toBe`, `toEqual` (estructural), `toBeCloseTo(n, decimales)`, `toBeTruthy`, `toBeFalsy`, `toContain`, `toBeGreaterThan`, `toBeLessThan`, `toMatch`, `toHaveLength`, y `.not` delante.
- Las aserciones fijan el comportamiento actual. Si algo es un bug, no se arregla en la prueba: se escribe lo correcto con `test.skip(nombre, "BUG: motivo", fn)`. Esa prueba se ejecuta igual pero no cuenta para el resultado. El resumen muestra cómo falla hoy, y cuando el bug se arregle avisará con «YA PASA: quita test.skip».
- `test.omitir(motivo)`, dentro de una prueba, es otra cosa: no es un bug, es que este entorno no puede medir lo que la prueba mide (el reloj virtual de `run.py`). La prueba sale omitida con ese motivo.

## Añadir un escenario

1. Si hace falta, crea los datos en `fixtures.js`: una función que devuelve `{clave rp_*: valor}`, con fechas calculadas desde hoy (`fecha(n)`, `momento(n, h, m)`). Para valores que no son JSON usa `{__crudo: {clave: "texto"}}`.
   Ninguna aserción puede depender del día de la semana o del mes en que corra la CI. Si un bloque solo sale con datos en cierta ventana del calendario (el resumen del mes compara el 1-hoy de este mes con el del anterior, y el día 1 este mes aún está vacío), son los datos los que la garantizan, y una prueba lo comprueba con el reloj de la app movido (`dosAnos` y «el resumen del mes sale cualquier dia» en `pruebas_progreso.js`).
2. Decláralo en el archivo de pruebas que corresponda:

```js
escenario("Pantallas · usuario nuevo con plan", () => ({rp_plan: ["gym_empuje", null, null, null, null, null, "rest"]}), () => {
  test("la semana muestra Empuje el lunes", app => {
    expect(app.texto("#weekCard .day")).toContain("Empuje");
  });
});
```

La app arranca de cero con esos datos antes de su primera prueba. Si arranca con errores, el escenario falla en «(arranque de la app)».

3. Si creas un archivo nuevo de pruebas, añádelo con un `<script>` en `harness.html`, antes de `Pruebas.correr()`.

## Integración continua

Las mismas pruebas corren solas en GitHub (`.github/workflows/pruebas.yml`) en cada
pull request y en cada push a `desarrollo` o `main`, con Chrome sin interfaz en
Linux. `run.py` busca primero Edge y Chrome en las rutas de Windows y después
`google-chrome`, `chromium` o `microsoft-edge` en el PATH; en CI (variable `CI`
en Linux) añade `--no-sandbox`, porque los contenedores no traen el sandbox de
Chrome. Un PR con las pruebas en rojo no se integra.
