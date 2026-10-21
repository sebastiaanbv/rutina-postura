# Asistente con IA en Mi Rutina: factibilidad con la API de Claude

HU-06 · Estudio de factibilidad · octubre de 2026

Este documento responde a una pregunta: ¿puede Mi Rutina usar la API de Claude, con los
créditos de $100 al mes del dueño, sin romper nada de lo que ya funciona? Las secciones 1 a 6
están escritas para leerse sin saber programar. De la 7 en adelante es el detalle técnico para
implementarlo.

---

## 1. Veredicto

**Sí es factible:** la app puede llamar a Claude directamente desde cada teléfono, sin servidor y
sin build, por unos **$3 al mes para las dos personas con Opus 5.5** (menos de $10 incluso en el
peor caso), y el modo sin conexión queda intacto porque el asistente es opcional y se oculta cuando
no hay red.

**Recomendación.** Hacerlo por fases y con el dinero acotado desde el primer día:

1. Primero la **base segura**: una clave de API por teléfono, guardada solo en ese teléfono, cada
   una en su propio espacio de trabajo de la Consola de Anthropic con límite de gasto, más un
   contador mensual y un tope dentro de la app. Consentimiento explícito antes de enviar nada.
2. Después, el **comentario al terminar la sesión** (para las dos personas): es la función más
   barata, no cambia ningún dato y sirve para comprobar que todo funciona.
3. Luego, para el dueño, la **revisión semanal de series por músculo** (estilo RP Hypertrophy) y,
   para los dos, **adaptar la sesión de hoy** cuando hay un imprevisto.
4. Las **preguntas de técnica** al final, si las anteriores se usan.
5. **Opus 5.5 por defecto.** Con este uso, el precio no es lo que limita: la diferencia entre
   modelos es de céntimos a pocos dólares al mes. En Ajustes queda un selector para cambiar a
   Sonnet 5.5 o Haiku 5.5 si el dueño lo prefiere (por ejemplo, para respuestas más rápidas).

Tres reglas que no se negocian en ninguna fase:

- **La IA propone y la persona confirma.** El asistente nunca escribe datos por su cuenta.
- **Solo ejercicios del catálogo y del perfil.** La app comprueba en su propio código que cada
  ejercicio propuesto existe y está permitido para esa persona; no basta con pedírselo al modelo.
- **La app no depende de la IA.** Registrar, guardar, ver el progreso y entrenar sin conexión
  funcionan exactamente igual con el asistente apagado.

---

## 2. Qué haría el asistente

| Función | Para quién | Qué resuelve | ¿Cambia datos? | Veredicto |
|---|---|---|---|---|
| **Comentario al terminar la sesión** | Los dos | Un resumen en palabras de lo que hiciste y qué mirar la próxima vez | No | Sí, primera |
| **Revisión semanal de series por músculo** | Dueño | Propone subir o bajar una serie en ejercicios concretos según el volumen de la semana, el estancamiento, las molestias y las repeticiones en reserva | Solo si aceptas cada propuesta | Sí |
| **Adaptar la sesión de hoy** | Los dos | "Tengo 30 minutos", "hoy me molesta la rodilla", "no está libre la polea": la sesión ajustada solo con ejercicios tuyos | Solo para hoy, y si aceptas | Sí |
| **Preguntas de técnica** | Los dos (sobre todo la madre) | Dudas sobre un ejercicio, con sus pasos y su consejo como contexto | No | Sí, al final |
| Mensajes de motivación sueltos | Madre | — | — | **Descartada** |
| Que la IA decida los pesos | — | — | — | **Descartada** |
| Que la IA cree rutinas nuevas | — | — | — | **Descartada** |
| Analizar fotos o vídeos de la técnica | — | — | — | **Descartada** |

**Por qué se descartan las cuatro últimas:**

- **Motivación suelta:** sin datos reales detrás, los mensajes se vuelven genéricos en una semana.
  Lo que sí motiva —"completaste las 4 series: toca subir"— ya lo dice la app (DISENO §11) y el
  comentario de fin de sesión lo amplía con lo que hiciste de verdad. Las explicaciones sencillas
  para la madre no son una función aparte: son el **tono** de las otras cuatro cuando su objetivo
  es "salud y mantenimiento".
- **Pesos:** la app ya los calcula con una regla probada (progresión doble, tope del 10 %,
  mancuernas reales de casa, congelar si hubo molestia). Un modelo de lenguaje lo haría peor y de
  forma no repetible. El asistente tiene prohibido proponer pesos.
- **Rutinas nuevas:** el programa actual está pensado ejercicio a ejercicio y respeta las
  restricciones del perfil. Rehacerlo con IA es un cambio demasiado grande para validarlo en
  código, y entraría en conflicto con decisiones ya cerradas (sin superseries, sin figuras propias).
- **Fotos y vídeos:** cámara, datos muy personales, más caro, y la app ya tiene un vídeo y una
  ilustración por ejercicio.

Para ser honestos con la revisión semanal: buena parte se podría hacer con reglas fijas y sin IA.
Lo que aporta el modelo es **combinar señales** (volumen, estancamiento, molestias, reservas,
tiempo de sesión) y **explicar el porqué** de cada propuesta. Por eso sus propuestas pasan por
límites en código (sección 9) que impiden cualquier cambio brusco.

---

## 3. Cuánto cuesta (resumen)

Uso previsto al mes, sumando las dos personas: 29 comentarios de fin de sesión, 9 revisiones
semanales, 10 adaptaciones de sesión y 10 conversaciones de técnica.

| Modelo | Costo al mes (uso previsto) | Peor caso (todas las respuestas al máximo) | % de los $100 |
|---|---:|---:|---:|
| **Opus 5.5** (por defecto) | **$3,19** | ≈ $9,50 | 3,2 % |
| Sonnet 5.5 | $1,60 | ≈ $4,75 | 1,6 % |
| Haiku 5.5 | $0,08 | $0,24 | 0,1 % |

Para gastar los $100 con Opus 5.5 habría que usar el asistente unas **31 veces más** de lo previsto.
Aun así, el gasto se limita por tres lados: un tope por llamada (tamaño máximo de respuesta), un
tope mensual en la app de cada teléfono y un límite de gasto en la Consola de Anthropic. Las cuentas
completas están en la sección 10.

---

## 4. Dónde vive la clave

Una **clave de API** es como la contraseña de la cuenta de créditos: quien la tenga puede gastar
dinero. Por eso:

- **Nunca** va en el repositorio (es público) ni dentro de la app publicada.
- Una prueba automática falla si algún archivo del repositorio contiene algo con forma de clave:
  el prefijo de las claves de Anthropic seguido de 20 caracteres o más (expresión
  `sk-ant-[A-Za-z0-9_-]{20,}`, que este documento no cumple).

### 4.1 Las dos opciones

**(a) Clave propia guardada solo en el teléfono (recomendada).**
Cada teléfono guarda su clave en el almacenamiento local del navegador, con un nombre que
**no** empieza por `rp_`. Así la copia de seguridad (`exportData()`, que exporta todo lo que empieza
por `rp_`) no la incluye nunca, e importar una copia no la toca. La app llama a Claude directamente
con el SDK oficial de Anthropic en modo navegador.

**(b) Un intermediario mínimo sin servidor propio** (por ejemplo, un Cloudflare Worker).
La clave real vive como secreto en el Worker; los teléfonos llaman al Worker con un código propio
de cada teléfono, y el Worker reenvía a Anthropic.

| | (a) Clave en el teléfono | (b) Worker intermediario |
|---|---|---|
| Infraestructura | Ninguna | Una cuenta más, un despliegue y su mantenimiento |
| ¿Sigue siendo una app sin backend? | Sí | No del todo: el Worker es un backend pequeño |
| ¿Qué secreto queda en el teléfono? | La clave de API | Un código del teléfono (también hay que protegerlo) |
| Si roban ese secreto | Pueden gastar hasta el límite de su espacio de trabajo, hasta que se revoque | Pueden gastar hasta los topes del Worker, hasta que se revoque ese código |
| Límites de gasto | Consola (por espacio de trabajo) + tope en la app | Consola + topes en el Worker (modelo, tamaño, presupuesto) |
| Cambiar la clave real | Hay que pegar la nueva en cada teléfono | Solo en el Worker |
| Costo de construirlo | Incluido en HU-06a | ≈ 7 h más (HU-06h) |

**Por qué (a):** con dos personas, la opción (b) traslada el riesgo en vez de quitarlo —el código del
teléfono también es un secreto— y añade un servidor que mantener en una app que existe sin él. Con
(a), el daño máximo de una clave robada lo fija el límite de gasto de su espacio de trabajo.

**Cuándo pasar a (b):** si entran más personas, si alguno de los teléfonos lo usan otras personas a
menudo, si se publica en el mismo dominio `github.io` otra página con código de terceros (ver 4.2),
o si una clave se filtra una vez. El cliente se escribe de forma que pasar a (b) sea cambiar dos
valores (`baseURL` y la clave del teléfono), no reescribirlo (sección 8.4).

### 4.2 Riesgos de la opción (a) y cómo se acotan

| Riesgo | Cómo se acota |
|---|---|
| **Se pierde o roban el teléfono** | Ver 4.3. La clave se revoca en la Consola en un minuto; mientras tanto, el límite del espacio de trabajo fija el máximo. |
| **Otra página en el mismo origen.** GitHub Pages publica todos los proyectos de un usuario bajo el mismo origen (`usuario.github.io`), y el almacenamiento local es por origen: cualquier otra página publicada ahí podría leerlo (hoy ya podría leer los datos `rp_`). | No publicar en ese usuario otras páginas con código de terceros, o dar a Mi Rutina un subdominio propio. Si no se puede garantizar, pasar a (b). |
| **Texto malicioso que se ejecute en la app** (por ejemplo, una respuesta de la IA pintada como HTML) | Todo texto de la IA se muestra con `esc()`, como ya se hace con lo que escribe la persona. Nunca `innerHTML` con texto del modelo. |
| **El SDK guardado en el repo estuviera manipulado** | Se guarda una versión concreta, se anota su huella SHA-256 y solo se cambia a propósito (sección 8.2). Nunca se carga desde un CDN en cada uso. |
| **Que alguien lea la clave en la pantalla** | Tras guardarla solo se muestran sus 4 últimos caracteres. |

### 4.3 Si el teléfono se pierde

1. En la Consola de Anthropic, en las claves de API, **revocar** la clave de ese teléfono. Deja de
   funcionar al momento.
2. En el teléfono nuevo, importar la copia de seguridad: trae todo el progreso, pero **no** la clave
   (a propósito).
3. Crear una clave nueva en el mismo espacio de trabajo y pegarla en Ajustes del teléfono nuevo.

No se pierde nada que importe: la clave no tiene valor más allá de poder gastar, y se reemplaza.

### 4.4 Límites de gasto

- **En la Consola de Anthropic**, un espacio de trabajo por persona, cada uno con su límite mensual.
  Propuesta: "Mi Rutina · dueño" con $20 y "Mi Rutina · mamá" con $10. Los dos juntos dejan como
  mínimo $70 de los créditos para otros usos, y cada persona ve su consumo por separado.
- **En la app**, un contador del mes con lo gastado (calculado con lo que devuelve cada llamada) y
  un tope que la persona fija en Ajustes (por defecto $10; $5 sugerido para la madre). Al llegar al
  tope, el asistente se desactiva hasta el mes siguiente o hasta que se suba el tope.
- **En cada llamada**, un tamaño máximo de respuesta, que pone techo al costo de una sola llamada
  (como mucho $0,26 con Opus 5.5).

El contador de la app es orientativo; la cifra que vale es la de la Consola.

### 4.5 Cómo se configura el teléfono de la madre

Lo hace el dueño, en persona, una sola vez (HU-06g):

1. En la Consola: crear el espacio de trabajo "Mi Rutina · mamá" con su límite mensual y, dentro,
   una clave llamada "teléfono mamá".
2. Pasar la clave al teléfono de ella por un canal que luego se borre (por ejemplo, un mensaje que
   se elimina para los dos en cuanto se pega). Nunca por correo, ni dejarla escrita en una nota.
3. En su teléfono: Ajustes → Asistente → pegar la clave → "Probar clave" (no gasta nada).
4. Elegir el modelo (Opus 5.5 por defecto) y poner el tope del mes ($5).
5. **Ella** lee la lista de qué datos se envían y pulsa "Acepto". El consentimiento es suyo: los
   datos son suyos.
6. Enseñarle dónde se apaga el asistente.

---

## 5. Privacidad

### 5.1 Qué sale del teléfono

Solo sale lo necesario para cada función, y solo hacia la API de Anthropic. Nunca se envía: la
clave a nadie más, el peso corporal, las medidas, las notas fijas de los ejercicios, el historial
completo, fechas exactas ni la lista de restricciones del perfil (se envía únicamente la lista de
ejercicios **permitidos**, de modo que las restricciones nunca salen en claro).

| Función | Datos que se envían |
|---|---|
| Comentario de fin de sesión | Nombre de la rutina; por ejercicio hecho hoy: nombre, series (peso × repeticiones y reserva), primera serie de la vez anterior, si hubo récord y si se anotó molestia hoy (sí/no); objetivo (masa o salud). |
| Revisión semanal | Objetivo; series por músculo de la última semana y media de 4 semanas frente a la meta; por ejercicio de tus rutinas: series programadas, sesiones hechas, tendencia de fuerza (sube, igual, baja), si está estancado, número de molestias en 28 días y reserva media; sesiones por semana frente a la meta. |
| Adaptar la sesión | Lista de ejercicios permitidos (nombre, equipo, músculo principal); la rutina de hoy con sus series; los cambios ya previstos en esa rutina; tu texto; ejercicios con molestia reciente. |
| Preguntas de técnica | El ejercicio (nombre, pasos, consejo, músculos, equipo), tu última serie y tu pregunta. |

### 5.2 Consentimiento explícito

- El asistente viene **apagado**. Para encenderlo hay que pegar una clave **y** aceptar en Ajustes
  una pantalla que lista, en lenguaje llano, la tabla de arriba y a quién se envía.
- El consentimiento se guarda con un número de versión. Si cambia lo que se envía, la app vuelve a
  pedirlo antes de la siguiente llamada.
- Se puede retirar en cualquier momento (apagar el asistente o quitar la clave).
- Es por teléfono: no viaja en la copia de seguridad, para que restaurar la copia de una persona
  en otro teléfono no dé por aceptado nada en nombre de nadie.

### 5.3 Sin datos de salud en registros

- Ni las peticiones ni las respuestas se escriben en la consola del navegador ni en ningún registro.
  Los errores se anotan solo por tipo ("rechazo", "sin conexión"), nunca con su contenido.
- Las respuestas del asistente no se guardan. Solo se guarda lo que la persona **acepta** aplicar, y
  por los mismos caminos que ya usa la app (por ejemplo, el ajuste de series de cada rutina).
- El contador de gasto guarda importes y número de llamadas, nada más.
- En el repositorio, que es público, las pruebas usan datos inventados.
- Lo que llega a Anthropic se rige por su política de datos para la API; conviene revisar la vigente
  en la Consola antes de activar el asistente y mencionarlo en la pantalla de consentimiento.

---

## 6. Seguridad y salud

- **El asistente no sustituye a un profesional.** Lo dice la pantalla de consentimiento y lo
  respeta el comportamiento: no diagnostica, no interpreta síntomas y no promete resultados.
- **Ante dolor, recomendar consultar.** Si la persona escribe que algo le duele o le molesta, o si
  hay una molestia anotada en el ejercicio, la app añade **siempre** una línea fija, escrita en el
  código y no por el modelo: "Si el dolor sigue o va a más, consulta con un profesional de la salud".
  Además, ninguna propuesta puede subir series en un ejercicio con molestia reciente.
- **Nada de pesos ni superseries.** El modelo no puede proponer pesos (los calcula la app) ni
  emparejar ejercicios: el formato de respuesta ni siquiera tiene forma de expresarlo.
- **Voz de la app (DISENO §11).** Mayúscula solo al principio; sin signos de exclamación salvo en el
  momento de terminar la rutina; plurales correctos; el número primero y la unidad después
  ("22,5 kg × 8"); explicar el porqué de cada propuesta. Para el objetivo "salud y mantenimiento":
  frases cortas y sin jerga ("reserva", "volumen" o "hipertrofia" no aparecen).
- **Cómo se ve.** Lo que dice el asistente va marcado como "Sugerencia del asistente" y en azul, el
  color de la información (DISENO §2). No se crea un color nuevo.

---

## 7. Arquitectura técnica (resumen)

```
Teléfono (PWA en GitHub Pages)
 ├─ index.html  ── funciones de IA ([S-IA]) ── validadores en código
 │                    │  import() solo al usarlo
 │                    ▼
 ├─ vendor/anthropic-sdk-X.Y.Z.js   (SDK oficial, ESM, versión fijada, en el repo)
 │                    │  HTTPS, clave en cabecera
 │                    ▼
 └─ localStorage: rp_*  (datos, exportables)
                  ia_clave, ia_ajustes, ia_gasto  (fuera de la copia)
                                  │
                                  ▼
                       api.anthropic.com  (/v1/messages)
```

Claves de almacenamiento nuevas:

| Clave | Contenido | ¿En la copia de seguridad? |
|---|---|---|
| `ia_clave` | La clave de API de este teléfono | No, nunca |
| `ia_ajustes` | `{modelo, tope_usd, consentimiento:{v, fecha}, activo}` | No (es por teléfono) |
| `ia_gasto` | `{mes:"2026-10", usd, llamadas, por_funcion:{…}}` | No |
| `rp_prefs.evitar` | Ids de ejercicios que la persona no quiere que se le propongan | Sí (es parte del perfil) |
| `rp_session.adapt` | Cambios aceptados para la sesión de hoy (HU-06e) | Sí, y se borra al cerrar la sesión |

`exportData()` e `importData()` ya filtran por el prefijo `rp_`, así que las claves `ia_*` quedan
fuera sin tocar ese código. Hay que fijarlo con pruebas para que un cambio futuro no lo rompa.
`wipe()` ("Borrar todos mis datos") hoy borra solo `rp_*`: debe borrar también `ia_*` y decirlo en
su confirmación, porque quien deja el teléfono en blanco espera que la clave se vaya con todo.

---

## 8. Cargar el SDK sin build y sin romper el modo sin conexión

### 8.1 Opciones

| Opción | Ventajas | Problemas | Veredicto |
|---|---|---|---|
| **Módulo ESM empaquetado y guardado en el repo**, cargado con `import()` al usar la IA | Sin CDN, versión fijada y revisable, solo se descarga si se usa, se cachea | Hay que empaquetarlo una vez fuera del repo y ocupa espacio en el repo | **Elegida** |
| Importar desde un CDN en cada uso (esm.sh, jsDelivr) | Nada que guardar | Código de terceros ejecutándose con acceso a la clave; sin forma fiable de fijar su huella en un `import()`; depende de otro servicio | Descartada |
| `fetch` a mano contra la API | Sin dependencias | La referencia de la API pide usar el SDK oficial en proyectos JS; se pierden errores tipados, reintentos y cabeceras beta | Descartada (solo como plan B si el SDK no pudiera empaquetarse) |

### 8.2 Cómo se empaqueta (una vez, fuera del repo)

No es un build de la app: es lo mismo que descargar una librería, solo que en un único archivo.
En una carpeta temporal fuera del repositorio:

```bash
npm init -y && npm install @anthropic-ai/sdk@X.Y.Z esbuild
echo 'export { default } from "@anthropic-ai/sdk";' > entrada.js
npx esbuild entrada.js --bundle --format=esm --platform=browser --target=es2020 \
  --minify --legal-comments=inline --outfile=anthropic-sdk-X.Y.Z.js
sha256sum anthropic-sdk-X.Y.Z.js
```

- Se copia a `vendor/anthropic-sdk-X.Y.Z.js` (extensión `.js`, que GitHub Pages sirve como
  JavaScript; un módulo con tipo MIME equivocado no carga).
- El comentario de licencia (MIT) queda dentro del archivo.
- La versión, la huella SHA-256 y el tamaño se anotan en este documento al implementarlo
  (HU-06a). Actualizar es crear un archivo con la versión nueva en el nombre y borrar el viejo.
- Se revisa una vez por trimestre si hay versión nueva con correcciones de seguridad.

### 8.3 Sin conexión

- El archivo del SDK **no** entra en `ASSETS` de `sw.js`: `addAll` es atómico y, si su descarga
  fallara, el service worker no se instalaría y la app perdería el modo sin conexión (la misma
  trampa que DISENO §13 describe para la tipografía). Además, quien no usa el asistente no tiene por
  qué descargarlo.
- En su lugar, `sw.js` lo guarda en la caché **la primera vez que se descarga bien**, igual que ya
  hace con `figuras.js`. Como el nombre lleva la versión, no hace falta subir `CACHE`.
- Las llamadas a `api.anthropic.com` son de otro origen y `sw.js` ya las deja pasar sin cachear.
- Los botones del asistente solo aparecen si hay clave, consentimiento vigente, tope disponible y
  `navigator.onLine`. La app escucha `online` y `offline` para mostrarlos u ocultarlos.
- Si la conexión cae a mitad de una llamada: mensaje claro ("El asistente necesita internet. Tu
  entrenamiento está guardado") y nada más. **Ningún guardado espera nunca a la IA.**

### 8.4 El cliente

Una sola función hace todas las llamadas. Así los detalles de la API (modelo, esfuerzo, respaldo,
`stop_reason`, gasto) viven en un sitio, y pasar a la opción (b) es cambiar `baseURL` y la clave.

```js
/* ==== [S-IA] ASISTENTE ==================================================== */
const IA_SDK = "vendor/anthropic-sdk-X.Y.Z.js";
/* precios en $ por millón de tokens (referencia oficial, octubre de 2026) */
const IA_MODELOS = {
  "claude-opus-5-5":   {nombre:"Opus 5.5",   in:4,    out:20,   lee:0.20, escribe:5,     respaldo:true},
  "claude-sonnet-5-5": {nombre:"Sonnet 5.5", in:2,    out:10,   lee:0.20, escribe:2.5,   respaldo:true},
  "claude-haiku-5-5":  {nombre:"Haiku 5.5",  in:0.10, out:0.50, lee:0.01, escribe:0.125, respaldo:false}
};
const IA_DEFECTO = "claude-opus-5-5";

let iaSDK = null;
async function iaCliente(){
  if (window.__iaFalsa) return window.__iaFalsa;            // arnés de pruebas: nunca red
  iaSDK = iaSDK || import("./" + IA_SDK);                     // solo la primera vez que se usa
  const Anthropic = (await iaSDK).default;
  return {Anthropic, cliente: new Anthropic({
    apiKey: iaClave(), dangerouslyAllowBrowser: true,         // la clave es de quien usa el teléfono
    maxRetries: 2, timeout: 90000 })};
}

async function iaPedir(fn, {sistema, estable, variable, esquema, esfuerzo, maxTokens, cache, senal}){
  const aj = iaAjustes(), modelo = IA_MODELOS[aj.modelo] ? aj.modelo : IA_DEFECTO, M = IA_MODELOS[modelo];
  if (!iaCabeEnTope(modelo, sistema + (estable||"") + variable, maxTokens)) throw new IaError("tope");
  const contenido = [];
  if (estable) contenido.push({type:"text", text: estable, ...(cache ? {cache_control:{type:"ephemeral"}} : {})});
  contenido.push({type:"text", text: variable});              // lo que cambia, siempre al final
  const cuerpo = {
    model: modelo,
    max_tokens: maxTokens,                                     // incluye el razonamiento
    system: [{type:"text", text: sistema}],                    // fijo: sin fechas ni datos de nadie
    messages: [{role:"user", content: contenido}],
    output_config: {effort: esfuerzo, format: {type:"json_schema", schema: esquema}}
  };
  const {cliente} = await iaCliente();
  const r = M.respaldo
    ? await cliente.beta.messages.create(
        {...cuerpo, betas:["server-side-fallback-2026-07-01"], fallbacks:"default"}, {signal: senal})
    : await cliente.messages.create(cuerpo, {signal: senal});  // Haiku 5.5: sin respaldo del servidor
  iaSumarGasto(fn, modelo, r.usage);                           // se cobra aunque luego se descarte
  if (r.stop_reason === "refusal")    throw new IaError("rechazo");
  if (r.stop_reason === "max_tokens") throw new IaError("cortada");   // el JSON vendría incompleto
  const t = r.content.find(b => b.type === "text");            // por tipo: puede haber bloques
  if (!t) throw new IaError("vacia");                          // de razonamiento o de respaldo antes
  try { return JSON.parse(t.text); } catch (e) { throw new IaError("json"); }
  /* lo devuelto todavía NO es de fiar: cada función lo pasa por sus validadores */
}
```

Notas de la API que el código respeta (datos de la referencia oficial, ver apéndice):

- **Razonamiento.** En Opus 5.5 no se puede apagar; se controla con `output_config.effort`, que
  siempre se manda explícito (el valor por defecto de Opus 5.5 es `medium`, el de Sonnet 5.5 es
  `high`). No se envía el campo `thinking`. Los bloques de razonamiento llegan vacíos y se ignoran.
- **Salidas estructuradas.** `output_config.format` con `json_schema` garantiza JSON con la forma
  pedida. No admite `minimum`, `maximum`, `minLength` ni `maxLength`: esos límites se comprueban en
  código. Todos los objetos llevan `additionalProperties: false`.
- **`stop_reason` antes que el contenido.** `refusal` puede ocurrir; en temas de entrenamiento es
  improbable, pero se trata. Con Opus 5.5 y Sonnet 5.5 se activa el respaldo del servidor
  (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). Con Haiku 5.5 no existe y no se
  envía.
- **Explicaciones, no razonamiento.** Los esquemas piden un "motivo" breve por propuesta, que está
  permitido; nunca se pide al modelo que vuelque su razonamiento en la respuesta (eso puede acabar
  en un rechazo de tipo `reasoning_extraction`).
- **Errores.** Se distinguen con las clases del SDK, de la más concreta a la más general:
  `AuthenticationError` (clave inválida o revocada), `RateLimitError` (esperar un minuto),
  `APIConnectionError` (sin red; en el SDK de JS es subclase de `APIError`, así que va antes),
  `APIUserAbortError` (la persona canceló) y `APIError` con `status` 402 (sin créditos o límite de
  la Consola alcanzado). Cada uno tiene su mensaje y ninguno escribe datos.
- **Cancelar.** Mientras el modelo piensa (con Opus 5.5 a `medium`, de 20 a 60 s) se muestra
  "Pensando…" con un botón para cancelar (`AbortController`).
- **Probar la clave** usa `cliente.models.list()`, que no consume tokens.
- **CORS.** Con `dangerouslyAllowBrowser`, el SDK añade la cabecera que la API exige para aceptar
  llamadas desde un navegador. El nombre de la opción avisa de que la clave queda en el navegador:
  aquí es lo buscado, porque la clave es de la misma persona que usa el teléfono.

### 8.5 Gasto

```js
function iaCostoUSD(modelo, u){ const M = IA_MODELOS[modelo];
  return ((u.input_tokens||0)*M.in + (u.output_tokens||0)*M.out
        + (u.cache_creation_input_tokens||0)*M.escribe
        + (u.cache_read_input_tokens||0)*M.lee) / 1e6; }
```

- `iaSumarGasto` acumula en `ia_gasto` del mes en curso; al cambiar de mes empieza de cero.
- `iaCabeEnTope` estima el peor caso de la llamada (entrada aproximada por caracteres / 3 al precio
  de entrada, más `maxTokens` al precio de salida) y la bloquea si sumada a lo gastado pasaría el
  tope.
- Si actúa el respaldo del servidor, la llamada se cobra a la tarifa del modelo de respaldo; el
  contador lo aproxima con la del modelo elegido. La cifra exacta está en la Consola.

### 8.6 Caché de prompts

- **Orden:** sistema (fijo) → bloque estable por teléfono (catálogo permitido) → lo variable (la
  sesión de hoy, el texto de la persona). Nada de fechas, horas ni identificadores en el sistema.
- La caché dura 5 minutos y escribir en ella cuesta 1,25 veces la entrada, así que solo compensa
  cuando hay una segunda llamada con el mismo prefijo en ese plazo. Se marca `cache_control` solo en
  **adaptar la sesión** (la segunda opción reutiliza sistema + catálogo) y en **preguntas de
  técnica** (la conversación crece). En las funciones de una sola llamada no se marca: pagaría la
  escritura sin lectura.
- El mínimo cacheable en los tres modelos es de 512 tokens; el prefijo de "adaptar" ronda 3.500.
- El ahorro es pequeño en dinero (céntimos al mes); lo que importa es no romper el orden, porque el
  día que el uso crezca la caché trabaja sola.

---

## 9. Funciones en detalle

### 9.0 Piezas comunes

**Lista de ejercicios permitidos (`permitidos()`).** Hoy las restricciones del perfil no son un
dato: están **dentro del diseño de las rutinas** (qué ejercicios hay en cada una y qué cambios
admite), y las molestias se anotan por ejercicio en `rp_pain`. La lista permitida se construye así:

1. Rutinas de este teléfono: las que aparecen en `rp_plan` o tienen sesiones en `rp_history` en las
   últimas 8 semanas. Si no hay ninguna, las del objetivo (`rp_prefs.goal`): "masa" → gimnasio,
   postura y cuello; "salud" → casa.
2. De cada una: `effList(k)` (ya con cambios aplicados), los cambios declarados en
   `ROUTINES[k].swaps`, sus `extras` y lo agregado por la persona (`rp_extras`, incluidos los
   ejercicios propios no borrados de `rp_custom`).
3. Menos los de `rp_prefs.evitar` (lista "No proponer" en Ajustes, nueva).
4. Menos los que tienen 2 o más molestias anotadas en los últimos 28 días (la misma regla que ya usa
   `todayTarget` para decir "plantéate cambiarlo por otro").

Todo id que devuelva el modelo pasa por: existe en `EX` · está en `permitidos()` · no está en
`evitar`. Además, en los esquemas la lista va como `enum`, de modo que el propio formato de salida
impide inventar ids; la comprobación en código es la segunda barrera, no la única.

**Sistema común (fijo, resumido).** Eres el asistente de entrenamiento de la app Mi Rutina. Solo
puedes nombrar ejercicios por su id, y solo de la lista que se te da. No propongas pesos: los decide
la app. No propongas superseries ni emparejar ejercicios. No eres profesional de la salud: no
diagnostiques; ante dolor o molestia, recomienda parar ese ejercicio y consultar, y marca
`consultar_profesional`. Escribe en español: mayúscula solo al principio, sin signos de
exclamación, número primero y unidad después, explica el porqué. Si el objetivo es salud, frases
cortas y sin jerga.

**Confirmación.** Nada de lo que devuelve el modelo se guarda sin un toque de la persona. Las
funciones que cambian algo muestran cada cambio con "Aplicar" y "Ahora no".

### 9.1 Comentario al terminar la sesión (HU-06c)

- **Qué resuelve:** convertir los números del resumen en dos o tres frases útiles: qué salió bien,
  qué vigilar, qué toca la próxima vez.
- **Para quién:** los dos. Para la madre, en lenguaje sencillo.
- **Cuándo:** botón "Comentario del asistente" en la pantalla de fin, **después** de "Finalizar y
  guardar". El guardado (`finishSession`) no cambia ni espera.
- **Entradas:** ver 5.1. Unos 1.000 tokens de datos.
- **Esfuerzo y tamaño:** `effort: "low"`, `max_tokens: 4000`. Sin caché.
- **Salida:**

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["titular", "puntos", "consultar_profesional"],
  "properties": {
    "titular": {"type": "string"},
    "puntos": {"type": "array", "items": {
      "type": "object", "additionalProperties": false,
      "required": ["tipo", "texto", "ejercicio_id"],
      "properties": {
        "tipo": {"type": "string", "enum": ["logro", "atencion", "proxima_vez"]},
        "texto": {"type": "string"},
        "ejercicio_id": {"anyOf": [{"type": "string", "enum": ["<ids de la sesión de hoy>"]}, {"type": "null"}]}
      }}},
    "consultar_profesional": {"type": "boolean"}
  }
}
```

- **Validación en código:** titular de 90 caracteres como mucho; se muestran 3 puntos como mucho, de
  160 caracteres cada uno; `ejercicio_id` debe estar entre los de la sesión; si un texto cita un
  peso ("N kg"), ese peso tiene que aparecer en la sesión de hoy o en la anterior, o el punto se
  descarta; como mucho un signo de exclamación y solo en el titular (es el momento de terminar la
  rutina, DISENO §11); si `consultar_profesional` es verdadero o hubo molestia anotada hoy, se
  añade la línea fija de consulta.
- **Escribe datos:** no.

### 9.2 Revisión semanal de series por músculo (HU-06d)

- **Qué resuelve:** lo que hace RP Hypertrophy cada semana: mirar el volumen por músculo frente a
  la meta y proponer ajustes pequeños, con su motivo.
- **Para quién:** el dueño (objetivo masa). Con objetivo salud viene apagada; si se enciende, usa las
  metas de `MUSCGOAL_SALUD` y solo propone para que cada grupo grande llegue a su mínimo.
- **Cuándo:** tarjeta en Progreso, una vez por semana, con al menos 2 semanas de registros.
- **Entradas:** `muscleSets()` de los últimos 7 y 28 días frente a `muscGoal()`; por ejercicio de
  las rutinas del teléfono: `dose(k,id).sets`, sesiones en 4 semanas, tendencia de `bestE1`,
  pertenencia a `stalled()`, molestias en 28 días (`rp_pain`), reserva media (`s.rir`); y
  `weekStats()`. Unos 3.500 tokens de datos.
- **Esfuerzo y tamaño:** `effort: "medium"`, `max_tokens: 12000`. Sin caché.
- **Salida:**

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["resumen", "propuestas"],
  "properties": {
    "resumen": {"type": "string"},
    "propuestas": {"type": "array", "items": {
      "type": "object", "additionalProperties": false,
      "required": ["rutina", "ejercicio_id", "series_actuales", "series_nuevas", "motivo"],
      "properties": {
        "rutina": {"type": "string", "enum": ["<rutinas del teléfono>"]},
        "ejercicio_id": {"type": "string", "enum": ["<permitidos()>"]},
        "series_actuales": {"type": "integer"},
        "series_nuevas": {"type": "integer"},
        "motivo": {"type": "string"}
      }}}
  }
}
```

- **Validación en código** (una propuesta que falla se descarta sola; el resto sigue):
  - `ejercicio_id` está en `effList(rutina)` y en `permitidos()`.
  - `series_actuales` coincide con `dose(rutina, id).sets`; si no, el modelo leyó mal y se descarta.
  - Cambio de exactamente ±1 serie; resultado entre 1 y 6 (o el valor actual, si ya era mayor).
  - No se sube en ejercicios con molestia en 28 días ni en los de `stalled()`.
  - No se sube un músculo cuya media de 4 semanas ya pasa de 1,25 veces su meta.
  - Como mucho +2 series netas por músculo y semana (sumando con las fracciones de `MUSC`).
  - Como mucho 4 propuestas; con cada una se muestra la duración estimada de la rutina antes y
    después (`estMinutes`), calculada por la app.
- **Escribe datos:** solo al pulsar "Aplicar" en una propuesta, con `setDose(rutina, id, {sets})`,
  la misma función que usa el selector de series del modo guiado. Deshacer es su botón "Volver a las
  sugeridas". Rechazar no escribe nada.

### 9.3 Adaptar la sesión de hoy (HU-06e)

- **Qué resuelve:** los imprevistos reales: poco tiempo, una molestia, una máquina ocupada o que no
  existe, en palabras de la persona.
- **Para quién:** los dos.
- **Cuándo:** en el detalle de rutina, antes de empezar o con la sesión en curso: "Adaptar la
  sesión de hoy" con un campo de texto (300 caracteres como mucho).
- **Entradas:** bloque estable (cacheado): `permitidos()` con nombre corto, equipo
  (`ZONAS[id].eq`) y músculo principal (`ZONAS[id].p`). Bloque variable: la rutina de hoy
  (`effList` con `dose`), sus cambios declarados, `estMinutes`, ejercicios con molestia reciente y
  el texto de la persona.
- **Esfuerzo y tamaño:** `effort: "medium"`, `max_tokens: 10000`; caché en el bloque estable. Si
  la espera pasa de 45 s en la práctica, probar `low`.
- **Salida:**

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["cambios", "equipo_no_disponible", "minutos_objetivo", "consultar_profesional", "nota"],
  "properties": {
    "cambios": {"type": "array", "items": {
      "type": "object", "additionalProperties": false,
      "required": ["accion", "ejercicio_id", "por_id", "series", "motivo"],
      "properties": {
        "accion": {"type": "string", "enum": ["quitar", "cambiar", "series"]},
        "ejercicio_id": {"type": "string", "enum": ["<ids de la rutina de hoy>"]},
        "por_id": {"anyOf": [{"type": "string", "enum": ["<permitidos()>"]}, {"type": "null"}]},
        "series": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
        "motivo": {"type": "string"}
      }}},
    "equipo_no_disponible": {"type": "array", "items": {"type": "string",
      "enum": ["maquina", "polea", "barra", "banco", "pullbar", "banda", "mancuerna", "silla", "wall"]}},
    "minutos_objetivo": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
    "consultar_profesional": {"type": "boolean"},
    "nota": {"type": "string"}
  }
}
```

- **Validación en código:**
  - `ejercicio_id` está en la rutina de hoy.
  - `cambiar`: `por_id` está en `permitidos()`, no está ya en la rutina de hoy, comparte músculo
    principal con el original **o** es un cambio declarado en `ROUTINES[k].swaps`, y su equipo no
    está en `equipo_no_disponible`.
  - `series`: entre 1 y las del programa menos una. Adaptar **solo baja**, nunca sube.
  - Queda al menos un ejercicio de calentamiento.
  - No hay acción para emparejar ejercicios: las superseries no se pueden expresar.
  - La app recalcula la duración con los cambios (`estMinutes`); si `minutos_objetivo` existe y no
    se alcanza, lo dice ("Así queda en 38 min, no en 30").
  - Si el texto de la persona menciona dolor (detección en código: "dolor", "duele", "molest",
    "lesión", "pinchazo"…) o el modelo marca `consultar_profesional`, aparece la línea fija de
    consulta.
- **Escribe datos:** al aceptar (todo o fila a fila), los cambios se guardan **solo para la sesión
  de hoy** en `rp_session.adapt`. `effList` y `dose` los leen mientras dura esa sesión, y
  `clearSess()` los borra al finalizar o descartar. No toca `rp_swaps`, `rp_doses` ni `rp_logs`.
  "Otra opción" se puede pedir una vez por sesión.
- **Riesgo:** es la única función que toca el motor de la sesión (`routineBuckets`, `effList`,
  `reanclar`). Va después de las otras y con más pruebas.

### 9.4 Preguntas de técnica (HU-06f)

- **Qué resuelve:** dudas concretas ("¿dónde debería notarlo?", "¿es normal que me tiemble?") con
  el contexto del ejercicio, en la ficha del modo guiado.
- **Para quién:** los dos; pensada sobre todo para la madre.
- **Entradas:** bloque estable: nombre, `steps`, `coach`, músculos (`ZONAS`), equipo. Variable: la
  última serie y la pregunta. Hasta 3 preguntas por ejercicio y día; la conversación vive solo en
  memoria.
- **Esfuerzo y tamaño:** `effort: "low"`, `max_tokens: 4000` por turno; caché en el bloque estable.
- **Salida:**

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["respuesta", "puntos_clave", "consultar_profesional"],
  "properties": {
    "respuesta": {"type": "string"},
    "puntos_clave": {"type": "array", "items": {"type": "string"}},
    "consultar_profesional": {"type": "boolean"}
  }
}
```

- **Validación en código:** 700 caracteres como mucho en la respuesta y 3 puntos clave; sin
  exclamaciones; línea fija de consulta si la pregunta menciona dolor o el modelo lo marca.
- **Escribe datos:** no.

---

## 10. Costos: las cuentas

**Supuestos.**

- Tokens estimados a partir del tamaño de los datos (en español, del orden de 1 token cada 3 o 4
  caracteres), redondeados al alza. La salida **incluye el razonamiento**, que se cobra como
  salida aunque no se vea.
- Uso al mes: dueño, 16 sesiones (gimnasio y postura); madre, 13 (casa, 3 por semana).
- Los tres modelos se comparan con los mismos tokens. En la práctica cambian algo según el modelo y
  el esfuerzo; se medirán con el contador al implementar.
- Fórmula: costo = (tokens de entrada × precio de entrada + tokens de salida × precio de salida)
  ÷ 1.000.000. Precios por millón: Opus 5.5 $4 / $20 · Sonnet 5.5 $2 / $10 · Haiku 5.5 $0,10 / $0,50.

**Tokens por uso.**

| Función | Esfuerzo | Entrada por uso | Salida por uso (razonamiento + respuesta) | Usos al mes (dueño + madre) | Llamadas al mes |
|---|---|---:|---:|---:|---:|
| Comentario de fin de sesión | low | 2.200 (sistema 1.200 + datos 1.000) | 1.000 (600 + 400) | 16 + 13 = 29 | 29 |
| Revisión semanal | medium | 5.000 (1.500 + 3.500) | 3.800 (3.000 + 800) | 4,5 + 4,5 = 9 | 9 |
| Adaptar la sesión | medium | 4.400 por llamada (1.500 + catálogo 2.000 + rutina 800 + texto 100) | 3.100 por llamada (2.500 + 600) | 6 + 4 = 10 | 13 (un 30 % pide "otra opción") |
| Preguntas de técnica | low | 3.400 (dos turnos: 1.400 + 2.000) | 1.600 (dos turnos de 500 + 300) | 4 + 6 = 10 | 20 turnos |

**Tokens al mes.**

| Función | Entrada | Salida |
|---|---:|---:|
| Comentario | 29 × 2.200 = 63.800 | 29 × 1.000 = 29.000 |
| Revisión semanal | 9 × 5.000 = 45.000 | 9 × 3.800 = 34.200 |
| Adaptar | 13 × 4.400 = 57.200 | 13 × 3.100 = 40.300 |
| Técnica | 10 × 3.400 = 34.000 | 10 × 1.600 = 16.000 |
| **Total** | **200.000** | **119.500** |

**Costo al mes por función y modelo.**

| Función | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---:|---:|---:|
| Comentario | 63.800 × 4 / 10⁶ + 29.000 × 20 / 10⁶ = 0,255 + 0,580 = **$0,84** | $0,42 | $0,02 |
| Revisión semanal | 0,180 + 0,684 = **$0,86** | $0,43 | $0,02 |
| Adaptar | 0,229 + 0,806 = **$1,03** | $0,52 | $0,03 |
| Técnica | 0,136 + 0,320 = **$0,46** | $0,23 | $0,01 |
| **Total al mes** | 200.000 × 4 / 10⁶ + 119.500 × 20 / 10⁶ = 0,800 + 2,390 = **$3,19** | 0,400 + 1,195 = **$1,60** | 0,020 + 0,060 = **$0,08** |
| Frente a $100 | 3,2 % | 1,6 % | 0,1 % |

Por persona con Opus 5.5: dueño ≈ $1,70 al mes; madre ≈ $1,49.

**Costo de un uso con Opus 5.5:** comentario $0,03 · revisión semanal $0,10 · adaptar $0,08 por
llamada ($0,10 por uso con la segunda opción) · técnica $0,05 por conversación.

**Peor caso** (cada llamada agota su `max_tokens`) con Opus 5.5:

| Función | Peor caso por llamada | Al mes |
|---|---:|---:|
| Comentario (4.000 de salida) | 2.200 × 4 / 10⁶ + 4.000 × 20 / 10⁶ = $0,09 | 29 × 0,089 = $2,58 |
| Revisión (12.000) | 0,02 + 0,24 = $0,26 | 9 × 0,26 = $2,34 |
| Adaptar (10.000) | 0,018 + 0,20 = $0,22 | 13 × 0,218 = $2,83 |
| Técnica (4.000 por turno, 2 turnos) | $0,17 por conversación | 10 × 0,174 = $1,74 |
| **Total** | | **≈ $9,50** |

Con Sonnet 5.5 el peor caso es la mitad (≈ $4,75) y con Haiku 5.5, $0,24.

**Lo que esto significa para elegir modelo.** Con este uso, pasar de Opus 5.5 a Haiku 5.5 ahorra
unos $3 al mes. La decisión debería guiarse por la calidad de las propuestas y por la espera en el
gimnasio, no por el precio. Si Opus 5.5 resulta lento para "adaptar la sesión", hay dos palancas
antes de cambiar de modelo: bajar el esfuerzo de esa función a `low` o probar Sonnet 5.5.

**Caché.** En "adaptar", la segunda opción reutiliza unos 3.500 tokens: marcar la caché encarece
la primera llamada en 3.500 × ($5 − $4) / 10⁶ = $0,0035 y cada relectura ahorra
3.500 × ($4 − $0,20) / 10⁶ = $0,013. Son céntimos; no cambian las cuentas.

---

## 11. Pruebas

**Regla:** el arnés automático (`tests/run.py` con `tests/prelude.js`) **nunca** llama a la API
real. Cuesta dinero y en el repositorio no hay clave, ni debe haberla.

- **Simulación.** El preludio define `window.__iaFalsa` con la forma que devuelve `iaCliente()`:
  `{Anthropic, cliente}`, donde `cliente` imita al del SDK (`messages.create`,
  `beta.messages.create`, `models.list`) y `Anthropic` trae clases de error falsas con los mismos
  nombres. Devuelve respuestas de prueba según la función. `iaCliente()` la usa antes de intentar
  cargar el SDK.
- **Red bloqueada.** El preludio intercepta `fetch` y `XMLHttpRequest`: cualquier petición a
  `api.anthropic.com` o al archivo `vendor/anthropic-sdk-*.js` se anota como error y hace fallar la
  prueba.
- **Respuestas de prueba** (datos inventados): normal; `stop_reason: "refusal"` con `stop_details`;
  `max_tokens`; JSON roto; id inexistente en `EX`; id fuera de `permitidos()`; id en "No proponer";
  series fuera de rango; subida en un ejercicio con molestia; `series_actuales` que no cuadra; un
  bloque de respaldo (`fallback`) antes del texto; `usage` con caché para el contador.
- **Qué se comprueba** (además de los criterios de cada historia): sin clave, sin consentimiento,
  sin conexión (`navigator.onLine` simulado) o con el tope alcanzado no aparece ningún botón del
  asistente; `exportData()` no incluye `ia_*`; `importData()` no los toca, ni siquiera cuando
  restaura tras un error; `wipe()` sí los borra; ninguna respuesta se aplica sin confirmación;
  ningún texto del modelo se pinta sin `esc()`; el contador suma bien con y sin caché; ningún
  archivo del repositorio contiene una cadena con forma de clave (la expresión de la sección 4).
- **Fuera del arnés, a mano y por el dueño:** una prueba de humo con su clave real tras cada cambio
  del cliente (menos de 5 llamadas, menos de $0,50), y una revisión de calidad de los prompts con
  unos 10 casos inventados cuando cambie un prompt. Ni los casos con datos reales ni las respuestas
  se suben al repositorio.

---

## 12. Plan: historias de usuario

Orden de implementación: **06a → 06b → 06c → 06g → 06d → 06e → 06f**, y **06h** solo si se cumple
alguno de los motivos de 4.1. Total estimado sin 06h: unas 83 h.

### HU-06a · Base del asistente: clave, consentimiento, modelo y gasto

*Prioridad alta · para los dos · 17,5 h*

Como dueño de la app, quiero activar el asistente en un teléfono con una clave propia, elegir el
modelo y ver lo gastado, para usar mis créditos sin poner en riesgo los datos ni la clave.

Criterios de aceptación:

- Sin clave, sin consentimiento vigente, sin conexión o con el tope alcanzado, no aparece ningún
  botón del asistente; al volver la conexión, reaparecen solos.
- La clave se guarda solo en `ia_clave`; `exportData()` no la incluye; importar una copia no la
  borra ni la cambia; "Borrar todos mis datos" sí la borra y su confirmación lo dice.
- Tras guardarla, la clave solo se ve por sus 4 últimos caracteres; "Probar clave" no gasta tokens.
- El selector ofrece Opus 5.5 (por defecto), Sonnet 5.5 y Haiku 5.5 con su precio; la elección se
  guarda por teléfono.
- Cada llamada suma su costo al contador del mes; al llegar al tope, el asistente se bloquea hasta
  el mes siguiente o hasta subir el tope.
- `refusal`, `max_tokens`, JSON roto, 401, 402, 429, sin red y cancelación muestran un mensaje claro
  y no escriben nada.
- El arnés no hace ninguna llamada real y falla si algún archivo del repositorio contiene una cadena
  con forma de clave (sección 4).

Tareas:

| Tarea | h |
|---|---:|
| Empaquetar el SDK, guardarlo en `vendor/` y anotar versión, SHA-256 y tamaño | 1,5 |
| `sw.js`: cachear el SDK en su primera descarga buena, fuera de `ASSETS` | 1 |
| Ajustes → Asistente: clave enmascarada, probar, consentimiento versionado, modelo, tope, quitar clave | 4 |
| `iaCliente()` e `iaPedir()`: esfuerzo explícito, respaldo según modelo, `stop_reason`, errores, cancelar | 3 |
| Contador mensual `ia_gasto` y bloqueo por tope | 1,5 |
| Mostrar u ocultar los botones según clave, consentimiento, tope y conexión | 1 |
| `wipe()` borra `ia_*`; pruebas de que exportar e importar no los tocan | 1 |
| Arnés: `__iaFalsa`, bloqueo de red, respuestas de prueba y pruebas de lo anterior | 3 |
| DISENO.md: sección del asistente (voz, azul de información, estados) | 1 |
| Prueba de humo manual con clave real | 0,5 |

### HU-06b · Lista de ejercicios permitidos y validadores comunes

*Prioridad alta · para los dos · 9 h*

Como persona con restricciones del perfil, quiero que el asistente solo pueda proponerme
ejercicios de mi catálogo que ya puedo hacer, para no tener que vigilar lo que propone.

Criterios de aceptación:

- `permitidos()` devuelve solo ids de `EX` presentes en las rutinas de este teléfono (lista,
  cambios declarados, extras y agregados), sin los de "No proponer" y sin los que tienen 2 o más
  molestias en 28 días.
- Una respuesta simulada con un id fuera de `EX`, fuera de `permitidos()` o en "No proponer" se
  descarta (la fila o la respuesta entera) y la prueba ve el motivo.
- "No proponer" se edita en Ajustes, entra en la copia de seguridad (`rp_prefs.evitar`) y nunca se
  envía a la API.
- Los validadores comprueban rangos de series, mismo músculo principal o cambio declarado, y equipo
  no disponible.

Tareas:

| Tarea | h |
|---|---:|
| `rutinasDelTelefono()` y `permitidos()` | 2 |
| Lista "No proponer" en Ajustes (`rp_prefs.evitar`) | 2 |
| Validadores comunes: ids, músculo principal o cambio declarado, series, equipo | 3 |
| Pruebas con respuestas simuladas inválidas | 2 |

### HU-06c · Comentario al terminar la sesión

*Prioridad alta · para los dos · 10 h*

Como persona que acaba de entrenar, quiero un comentario breve sobre lo que hice y qué mirar la
próxima vez, para entender mi progreso sin tener que leer números.

Criterios de aceptación:

- El botón aparece en la pantalla de fin solo después de guardar la sesión; el guardado nunca
  espera a la IA.
- Se envía solo lo que lista el consentimiento: ni peso corporal, ni medidas, ni notas.
- Como mucho 3 puntos de 160 caracteres; solo cita ejercicios de la sesión y solo pesos que existen
  en la sesión de hoy o en la anterior.
- Con objetivo salud, lenguaje sencillo y sin jerga; siempre con la voz de DISENO §11.
- Si hubo molestia anotada hoy o el modelo marca `consultar_profesional`, aparece la línea fija de
  consulta.
- No escribe ningún dato.

Tareas:

| Tarea | h |
|---|---:|
| Contexto compacto de la sesión | 1,5 |
| Prompt de sistema y esquema | 2 |
| Validación: ids, longitudes, pesos citados, exclamaciones, línea de consulta | 1,5 |
| Interfaz en la pantalla de fin: botón, "Pensando…", cancelar, errores | 2 |
| Pruebas simuladas | 2 |
| Ajuste del prompt con 5 sesiones inventadas, a mano | 1 |

### HU-06g · Consola y teléfono de la madre

*Prioridad media · para la madre · 2 h*

Como dueño, quiero dejar el asistente funcionando en el teléfono de mi madre con su propio límite
de gasto, para que lo use sin depender de mí y sin poner en riesgo los créditos.

Criterios de aceptación:

- Hay dos espacios de trabajo en la Consola ("Mi Rutina · dueño" y "Mi Rutina · mamá"), cada uno
  con su límite mensual y su clave.
- La clave de la madre no queda guardada en ningún chat ni nota.
- Ella aceptó el consentimiento en su teléfono, con su tope del mes puesto ($5).
- Ella sabe dónde se apaga el asistente.

Tareas:

| Tarea | h |
|---|---:|
| Crear los dos espacios de trabajo con su límite y sus claves | 0,5 |
| Configurar el teléfono de ella en persona (sección 4.5) | 1 |
| Explicarle el consentimiento y cómo apagarlo | 0,5 |

### HU-06d · Revisión semanal de series por músculo

*Prioridad alta · para el dueño · 15 h*

Como persona que entrena para ganar músculo, quiero una revisión semanal que me proponga subir o
bajar una serie donde haga falta y me diga por qué, para ajustar el volumen como en RP Hypertrophy
sin hacer cuentas.

Criterios de aceptación:

- Aparece en Progreso una vez por semana, con al menos 2 semanas de registros.
- Propuestas de ±1 serie por ejercicio, 4 como mucho; nunca suben donde hubo molestia en 28 días o
  hay estancamiento; como mucho +2 series netas por músculo y semana; cada una muestra la duración
  estimada de la rutina antes y después.
- Cada propuesta se aplica por separado con `setDose`; se deshace con "Volver a las sugeridas";
  rechazar no escribe nada.
- Una propuesta cuyo `series_actuales` no coincide con `dose()` se descarta.

Tareas:

| Tarea | h |
|---|---:|
| Agregados semanales: series por músculo, dosis, estancados, molestias, reservas | 2 |
| Prompt y esquema | 2 |
| Validadores: ±1, rango, molestia, estancamiento, tope por músculo, duración | 3 |
| Tarjeta en Progreso con "Aplicar" y "Ahora no" por propuesta | 4 |
| Variante para objetivo salud (apagada por defecto) | 1 |
| Pruebas simuladas | 3 |

### HU-06e · Adaptar la sesión de hoy

*Prioridad media · para los dos · 21 h*

Como persona que va a entrenar con un imprevisto (poco tiempo, una molestia, una máquina ocupada),
quiero contarlo con mis palabras y recibir la sesión ajustada solo con mis ejercicios, para
entrenar igual sin improvisar.

Criterios de aceptación:

- Texto libre de 300 caracteres como mucho; la propuesta muestra qué se quita, qué se cambia y por
  qué, con la duración recalculada por la app.
- Solo cambia a ejercicios permitidos que comparten músculo principal o son un cambio declarado de
  la rutina, sin equipo marcado como no disponible; las series solo bajan; nunca empareja
  ejercicios.
- Aceptar aplica los cambios solo a la sesión de hoy; al finalizar o descartar, la rutina vuelve a
  ser la de siempre y `rp_swaps`, `rp_doses` y `rp_logs` no cambiaron.
- Si el texto menciona dolor, aparece la línea fija de consulta y no se proponen ejercicios con
  molestia anotada.
- "Otra opción" se puede pedir una vez por sesión.

Tareas:

| Tarea | h |
|---|---:|
| Capa de cambios solo para hoy en `rp_session.adapt`, leída por `effList` y `dose` | 5 |
| Contexto: rutina de hoy, catálogo permitido con equipo y músculo | 2 |
| Prompt y esquema, con caché del bloque estable | 2 |
| Validadores y recálculo de duración | 3 |
| Interfaz: texto, propuesta con diferencias, aceptar todo o por fila, otra opción | 4 |
| Detección de dolor en el texto y línea de consulta | 1 |
| Pruebas, incluida una sesión en curso que no pierde series al aplicar | 4 |

### HU-06f · Preguntas de técnica sobre un ejercicio

*Prioridad baja · para los dos · 8,5 h*

Como persona que duda de cómo hacer un ejercicio, quiero preguntarlo desde su ficha y recibir una
respuesta sencilla basada en sus pasos, para hacerlo bien sin buscar fuera de la app.

Criterios de aceptación:

- Disponible en la ficha del ejercicio del modo guiado; hasta 3 preguntas por ejercicio y día.
- La respuesta usa los pasos y el consejo del ejercicio; 700 caracteres como mucho; sin pesos.
- Si la pregunta menciona dolor, aparece la línea fija de consulta.
- No se guarda la conversación ni se escribe ningún dato.

Tareas:

| Tarea | h |
|---|---:|
| Contexto del ejercicio | 1 |
| Prompt y esquema, con caché | 1,5 |
| Interfaz en la ficha: pregunta, respuesta, hasta 3 turnos | 3 |
| Validación y línea de consulta | 1 |
| Pruebas simuladas | 2 |

### HU-06h · Intermediario sin servidor propio (opcional)

*Prioridad baja · para los dos · 7 h · solo si se cumple un motivo de 4.1*

Como dueño, quiero que la clave real no esté en ningún teléfono, para poder darle el asistente a
más personas o a teléfonos compartidos sin repartir la clave.

Criterios de aceptación:

- Un Cloudflare Worker guarda la clave como secreto y reenvía a `/v1/messages`.
- Cada teléfono tiene su propio código revocable; el Worker solo acepta los modelos de la lista, un
  `max_tokens` máximo y un presupuesto por código.
- La app usa el mismo SDK con `baseURL` apuntando al Worker; ningún otro código cambia.

Tareas:

| Tarea | h |
|---|---:|
| Worker: reenvío, códigos por teléfono, límites, CORS | 4 |
| `baseURL` y código del teléfono en el cliente | 1 |
| Despliegue y pruebas | 2 |

---

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| La clave sale del teléfono (pérdida, otra página en el mismo `github.io`, texto inyectado) | Un espacio de trabajo con límite por persona, revocación inmediata, `esc()` siempre, no publicar otras páginas en ese origen; si no se puede, HU-06h |
| Gasto descontrolado (un error que repite llamadas, uso excesivo) | `max_tokens` por función, tope mensual en la app, límite en la Consola |
| Un consejo inadecuado para la salud | Validación en código, línea fija de consulta, nada de pesos, la IA solo propone |
| Ejercicios fuera del catálogo o vetados por el perfil | `enum` en el esquema y validación en código contra `permitidos()` |
| Espera larga en el gimnasio (Opus 5.5 a `medium`: 20 a 60 s) | Cancelar, esfuerzo por función, selector de modelo |
| La API cambia (cabeceras beta, modelos) | Todo en `iaPedir()`; selector de modelo; anotar fecha de la referencia |
| El SDK guardado envejece o tiene un fallo de seguridad | Versión fijada, huella anotada, revisión trimestral |
| Datos de entrenamiento y molestias salen del teléfono | Consentimiento versionado, envío mínimo, restricciones nunca en claro |
| HU-06e rompe una sesión en curso | Capa solo para hoy, sin tocar `rp_logs`, pruebas específicas |
| Rechazos por error del clasificador | Respaldo del servidor en Opus y Sonnet; mensaje claro |

---

## Apéndice A · Datos de la API usados

Referencia oficial, octubre de 2026.

| Modelo | Id | Entrada / salida por millón | Notas |
|---|---|---|---|
| Claude Opus 5.5 | `claude-opus-5-5` | $4 / $20 | Lectura de caché $0,20; escritura de caché (5 min) $5. Razonamiento siempre activo, controlado con `output_config.effort` (`low`, `medium`, `high`, `xhigh`, `max`; por defecto `medium`). Respaldo del servidor recomendado. |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10 | Lectura de caché $0,20. Esfuerzo por defecto `high`. Respaldo del servidor disponible. |
| Claude Haiku 5.5 | `claude-haiku-5-5` | $0,10 / $0,50 | Con prompts de hasta 100.000 tokens. Lectura de caché 0,1 × entrada. Sin respaldo del servidor. |

- Los tres con 1 millón de tokens de contexto, salidas estructuradas (`output_config.format`) y un
  mínimo cacheable de 512 tokens.
- Respaldo del servidor: `fallbacks: "default"` con la cabecera beta
  `server-side-fallback-2026-07-01`.
- Revisar siempre `stop_reason` antes de leer el contenido; `refusal` existe.
- SDK oficial de JavaScript: `@anthropic-ai/sdk`, que funciona en el navegador con
  `dangerouslyAllowBrowser`.
