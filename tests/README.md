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
- `harness.html` carga la app en un iframe del mismo origen. Antes de cada escenario vacía localStorage, lo siembra y recrea el iframe. Las pruebas llaman a las funciones reales de la app (`app.w.suggestLoad(...)`); las `const`/`let` se leen con `app.ev("EX")`.
- Una prueba falla si una aserción falla, si pasa de 20 s o si la app registró cualquier error mientras corría.

## Archivos

| Archivo | Qué hay |
|---|---|
| `run.py` | servidor, navegador y resumen |
| `prelude.js` | se inyecta en la app: errores, diálogos, descargas, service worker |
| `lib.js` | mini marco: `escenario`, `test`, `test.skip`, `expect`, el objeto `app` (con `app.enZona`) y el ejecutor |
| `fixtures.js` | datos con la forma exacta de las claves `rp_*`: `vacio`, `dueno`, `madre`, `sinCerrar`, y `cambioHora` (fechas fijas que cruzan cambios de hora) |
| `pruebas_logica.js` | suggestLoad, isPR, dose/SECDOSE, effList, buildSteps, estMinutes, strengthIdx, fechas |
| `pruebas_datos.js` | copia de seguridad de ida y vuelta, importaciones que no deben tocar nada, sesión sin cerrar, datos dañados o con otra forma, esquema `rp_schema` y migraciones, teléfono lleno (`lleno(app,{margen:0})` simula `QuotaExceededError`), `rp_streak`, racha semanal con datos de v35 y racha que cruza cambios de hora en cinco zonas |
| `pruebas_pantallas.js` | recorrido de humo por Inicio, rutina, guiado, Calendario, Progreso y Ajustes con cada juego de datos, y una sola racha (semanas cumplidas) en Inicio, pantalla de fin, Progreso y Ajustes, también con zona horaria emulada |

## Añadir una prueba

Dentro de un `escenario(...)` existente:

```js
test("isPR: una serie igual a la mejor no es récord", app => {
  app.sembrar({rp_logs: {press_banca_db: [{date: Fixtures.fecha(3), sets: [{w: 30, reps: 8}], k: "gym_empuje", t: 1}]}});
  expect(app.w.isPR("press_banca_db", 30, 8)).toBe(false);
});
```

- `app.sembrar(datos)` reemplaza localStorage sin recargar. La app lee el almacenamiento en cada llamada, así que basta para probar lógica. Si una prueba toca la memoria de la app (`curRoutine`, la sesión en curso), al final llama a `app.reiniciarMemoria()`.
- `async` está permitido: `await app.hasta(() => condición, ms)` y `await app.espera(ms)`.
- El navegador corre en la zona horaria del equipo (UTC en CI, sin cambios de hora). Para lo que dependa de fechas, `await app.enZona("Europe/Madrid", () => {...}, "2026-11-04T12:30:00Z")` corre la función con la app en esa zona IANA y, si se da el tercer argumento, con el reloj parado en ese instante. Las cuentas locales de `Date` (`getDate`, `setHours`, `new Date(a, m, d)`, `"AAAA-MM-DDTHH:MM"`) se hacen en esa zona con `Intl`; el instante (`getTime`, `toISOString`) es el de siempre. Al terminar vuelve el `Date` normal.
- Aserciones: `toBe`, `toEqual` (estructural), `toBeCloseTo(n, decimales)`, `toBeTruthy`, `toBeFalsy`, `toContain`, `toBeGreaterThan`, `toBeLessThan`, `toMatch`, `toHaveLength`, y `.not` delante.
- Las aserciones fijan el comportamiento actual. Si algo es un bug, no se arregla en la prueba: se escribe lo correcto con `test.skip(nombre, "BUG: motivo", fn)`. Esa prueba se ejecuta igual pero no cuenta para el resultado. El resumen muestra cómo falla hoy, y cuando el bug se arregle avisará con «YA PASA: quita test.skip».

## Añadir un escenario

1. Si hace falta, crea los datos en `fixtures.js`: una función que devuelve `{clave rp_*: valor}`, con fechas calculadas desde hoy (`fecha(n)`, `momento(n, h, m)`). Para valores que no son JSON usa `{__crudo: {clave: "texto"}}`.
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
