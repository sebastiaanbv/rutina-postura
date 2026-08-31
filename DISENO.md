# Mi Rutina — sistema de diseño

Este documento es la fuente de verdad del diseño de la app. Sirve para dos cosas: decidir sin discutir cada vez, y que cualquier pantalla nueva salga pareciéndose a las que ya existen.

Todo lo que dice está implementado. Lo que falta va al final, separado y con su motivo.

---

## 1. Principios

Cinco decisiones que resuelven la mayoría de las dudas futuras.

**1 · Una superficie por bloque, no una por elemento.**
Antes cada rutina, cada ejercicio y cada estadística era su propia tarjeta con su propia sombra. Doce seguidas y ninguna destaca. Ahora una tarjeta agrupa un bloque entero y sus elementos son filas separadas por línea fina. La tarjeta es un contenedor, no una decoración.

**2 · Una sola cosa manda en cada pantalla.**
En Inicio manda la tarjeta de hoy. En una rutina, el siguiente ejercicio sin hacer. Durante la serie, los controles de peso y reps. Todo lo demás baja de tono deliberadamente. Si dos cosas destacan, ninguna destaca.

**3 · El color significa algo o no se usa.**
Verde es acción y progreso confirmado. Ámbar es logro y energía. Azul es información. Naranja es descanso. Morado es carga. Rojo es destructivo. Un color que aparece "porque queda bien" rompe el sistema entero: en cuanto el ámbar sale en cinco sitios, deja de querer decir "récord".

**4 · La densidad es una función, no un defecto.**
En el gimnasio hace falta ver muchos ejercicios sin desplazar. La respuesta a "está muy cargado" es agrupar y jerarquizar, no añadir aire. Lo que sí se puede hacer es que lo terminado ocupe menos.

**5 · El avance se ve sin leer.**
Un anillo que se rellena, una fila que encoge, un carril que se pone verde. Si para saber cómo vas hay que leer un número, el diseño no está haciendo su trabajo.

---

## 2. Color

### Regla de los dos tonos

Cada color con significado tiene **dos tonos que no son intercambiables**:

- `--x` es el **relleno**: lleva texto claro encima.
- `--x-ink` es el **texto**: va sobre fondo claro o sobre `--x-tint`.

Con un solo tono siempre falla uno de los dos lados. El verde de marca sobre blanco da 3,4:1 (insuficiente); oscurecerlo hasta que el texto pase deja el botón demasiado apagado. Por eso son dos.

| Rol | Relleno | Texto | Tinte | Significado |
|---|---|---|---|---|
| Primario | `--primary` #2563eb | `--primary-ink` #1e40af | `--primary-tint` | Acción, hecho, progreso, información |
| Energía | `--energy` #e07b1a | `--energy-ink` #8a4b06 | `--energy-tint` | Racha, récord, subir peso, descanso |
| Carga | `--load` #6d5bc9 | `--load-ink` #3a2f6b | `--load-tint` | Gimnasio, peso |
| Destructivo | `--danger` #c4443f | `--danger-ink` #a3322e | `--danger-tint` | Borrar |

**Cuatro familias, no seis.** En v25 se fusionaron dos pares que estaban declarados
por separado pero no se distinguían. `--rest` y `--energy` eran el mismo naranja: 1,13:1
de diferencia en claro y 1,29:1 en oscuro, así que ni «descanso» ni «logro» se podían
aprender como código. Y el azul de «información» hacía el mismo papel que el primario en
otro tono; ahora es la misma familia con los dos roles que la regla de arriba ya define
—relleno para botones, tinte+tinta para notas—. Los tokens `--accent*` y `--rest*` siguen
existiendo como alias para no tocar cincuenta consumidores, pero apuntan a su familia.

### Dos casos que la regla de los dos tonos no cubría

`--x` relleno y `--x-ink` texto no bastan siempre, y v25 añadió el tercer caso de cada uno:

- **`--energy-strong` / `--energy-on`.** Un relleno cálido **no puede llevar texto blanco**:
  el naranja daba 3,4:1 y el ámbar del tema oscuro 2,2:1, y ese es el botón de saltar
  descanso, que sale en cada descanso de cada serie. El relleno usa el tono oscuro de la
  familia y el texto sale del token, que en claro es blanco y en oscuro es tinta.
- **`--ctl-line`.** El borde de un control es la **única** señal de que ahí hay algo pulsable
  —el círculo hueco del ejercicio pendiente— y necesita 3:1, no el 1,5:1 que daba `--line2`.
  Va aparte porque un separador no necesita ese contraste y engrosarlo ensuciaría la lista.

Y `--hairline`, el filo de 1 px de las tarjetas: en claro el fondo contra la tarjeta solo da
1,13:1 y en exterior con sol la sombra se lava, así que el filo es lo que de verdad sostiene
la estructura de bloques.

### Superficies

`--bg` página · `--card` tarjeta · `--card2` tarjeta destacada · `--sunk` caja hundida (dentro de una tarjeta) · `--line` separador · `--line2` separador fuerte.

`--hero` es la superficie oscura invertida, la misma en los dos temas. Se usa **una vez por pantalla como máximo**: la tarjeta de hoy en Inicio, el índice de fuerza en Progreso. Su acento es `--hero-accent`, un verde claro que solo existe para ir sobre ella.

### Familias de rutina

Cada rutina tiene `cls` (`p` postura · `n` cuello · `g` fuerza) y de ahí sale su color, en el azulejo del icono de Inicio, el calendario y la hoja del plan. **El color de familia nunca tiñe la pantalla entera**: es una marca de identidad, no un tema.

Hay **cuatro grupos en `GROUPS` pero tres colores**, y es a propósito. En v26 entró un cuarto grupo —«Casa (3 días · 30 min)», tres sesiones de treinta minutos con mancuernas, banda y tapete— y reutiliza `cls:"g"`: lo que marca el morado `--load` es **que la sesión lleva carga**, no el edificio donde se hace. Por eso el mismo v26 renombró las siete cadenas que decían «gimnasio» en el calendario, el resumen del mes, el mapa de calor y Ajustes: ahora dicen «fuerza». Inventar un cuarto color habría costado tres tokens por dos temas, seis reglas CSS, un cuarto ítem en una leyenda que ya va a 11 px, y volver a verificar contraste (§10) sobre el único hueco libre del palette, que es `--energy` y está reservado a racha y récord.

### Tema oscuro

Un solo bloque `[data-theme="dark"]`. Cero media queries: el script de la cabecera resuelve "auto" antes de pintar y siempre escribe `data-theme`. Si tocas un color, lo tocas en dos sitios: claro y oscuro. No hay un tercero.

---

## 3. Tipografía

Once pasos, todos tokens. Ningún tamaño escrito a mano.

| Token | px | Uso |
|---|---|---|
| `--t-mega` | 50 | Temporizador, racha final, índice de fuerza |
| `--t-display` | 30 | Título de pantalla, título de la tarjeta de hoy |
| `--t-xl` | 26 | Nombre del ejercicio en el guiado, cifra del stepper |
| `--t-title` | 22 | Cifras destacadas |
| `--t-lg` | 20 | Iconos grandes, cifras de estadística |
| `--t-md` | 16 | Botones, campos de texto |
| `--t-lead` | 15 | Nombre de rutina y de ejercicio en listas |
| `--t-base` | 14 | Texto normal |
| `--t-sm` | 12,5 | Metadatos, descripciones |
| `--t-xs` | 11 | Etiquetas |
| `--t-2xs` | 10 | Etiquetas en mayúsculas |

**Pesos:** `400` texto normal · `600` etiquetas · `700` nombres · `800` cifras y títulos. El error a evitar es el de antes: todo en 700-800, que deja la pantalla sin jerarquía y gritando.

**Cifras:** todo número que cambie lleva `font-variant-numeric:tabular-nums`. Un contador que baila mientras cuenta se lee mal y se ve barato.

**Tracking:** negativo y creciente con el tamaño. `--t-display` va a `-1px`; el texto normal a `-0.01em`.

---

## 4. Espacio y forma

**Espaciado:** `--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 22 · `--s6` 30. Nada fuera de la escala.

**Margen lateral:** `--gut` 16 px, **uno solo para toda la app**. Cualquier bloque de primer nivel mide 343 px en un móvil de 375. Si una pantalla mide distinto, es un error, no una variante.

**Radios:** `--r-sm` 12 · `--r-md` 16 · `--r-lg` 20 · `--r-xl` 24 · `--r-pill` 999. Las tarjetas van a `--r-lg`, las cajas internas a `--r-sm`, las superficies protagonistas a `--r-xl`.

**Elevación:** una sola sombra, `--sh-card`. Los botones primarios llevan `--sh-raised`, que es verde y solo ellos. En tema oscuro las tarjetas cambian la sombra por un borde de 1 px, porque una sombra sobre fondo oscuro no se ve.

---

## 5. Iconografía

29 iconos propios. **Cero emojis en la interfaz.**

- Rejilla `viewBox="0 0 24 24"`, sin relleno, `stroke:currentColor`, grosor 2, remates redondos.
- Tamaños: `.ic` 20 · `.ic.xs` 15 · `.ic.sm` 17 · `.ic.lg` 26 · `.ic.hero` 34. `.ic.solid` rellena en vez de perfilar, para el triángulo de reproducir, que a tamaño pequeño se lee mejor macizo.
- Heredan el color del texto, así que se tiñen solos en cada contexto y en los dos temas.
- Se declaran en `ICON` y se pintan con `ic(nombre, clases)`. Uno nuevo se añade al mapa, no se escribe suelto en una plantilla.
- El icono de cada rutina sale de `RICON`, no de los datos de `ROUTINES`.

**Por qué importa:** los emojis se dibujan distinto en cada teléfono, no comparten grosor ni rejilla y no se pueden colorear. Era lo que más delataba que la app estaba hecha en casa.

---

## 6. Componentes

**Tarjeta** (`.rcard .stat .hitem .field .cal .chartcard .exgroup .day .stepper .daydet .ovcard`) — fondo `--card`, radio `--r-lg`, sombra `--sh-card`. Es un contenedor de bloque.

**Caja hundida** (`.qbox .exprog .finempty .frame .setline .planopt .timepill`) — fondo `--sunk` con borde. Va **dentro** de una tarjeta. Nunca al revés.

**Nota de color** (`.last .qwhy .coachtip .optbox .caveatbox .callout`) — mismo formato, distinto significado según el color. Todas comparten radio, padding y tamaño de texto: lo único que cambia es el par tinte/tinta.

**Botones.** Como máximo **uno primario por pantalla**. El resto son secundarios (`.sec`, fondo de tarjeta con borde) o apagados (`.gbtn.fin`, `.skip`). Todas las clases de botón comparten base; las variantes solo cambian color y altura.

**Listas.** Filas dentro de una tarjeta, separadas por `border-top:1px solid var(--line)`, sin separador en la primera. Nunca N tarjetas seguidas.

**Anillo de avance** (`ringSVG`) — el motivo geométrico de la app. Se usa en el temporizador, en la cabecera de la rutina y podrá usarse en Progreso. Transición de 0,45 s sobre `stroke-dashoffset`.

**Pastillas** (`.badge .chip .mchip .delta`) — `--r-pill`, texto de 10 px en 800, tinte + tinta de su familia.

---

## 7. Movimiento

Regla: **toda animación es declarativa** —CSS, o SMIL en las figuras (§15)—, nunca un contador
en JS. El navegador lleva el tiempo, y apagarlas sigue siendo una decisión en un sitio.

| Qué | Duración |
|---|---|
| Cambio de pantalla | 220 ms |
| Estado de un control | 150 ms |
| Anillo de avance | 450 ms |
| Barra de progreso | 350 ms |

`prefers-reduced-motion` neutraliza transiciones **y** animaciones. Sin lo segundo, las celebraciones se colarían aunque el teléfono pida menos movimiento.

Nada dura más de medio segundo. Una celebración que se disfruta la primera vez estorba la trigésima.

---

## 8. Pantallas

### Inicio
Manda la **tarjeta de hoy**: superficie oscura, título a 30 px, icono de la familia y una sola acción a ancho completo. Debajo, en tono descendente: la racha en **una línea** con la llama en ámbar, la semana como **riel continuo** con hoy resaltado, y las rutinas en **una tarjeta por familia** con filas, azulejo de color y duración a la derecha.

Estados de la tarjeta de hoy: hoy toca · en curso (manda sobre todo) · ya entrenaste · día de descanso.

### Detalle de rutina
Cabecera con título a 30 px y **anillo de avance**. Los ejercicios en **una tarjeta por bloque** (calentamiento · entrenamiento · bloque secundario · opcionales), cada uno una fila.

La fila **no despliega nada**: tocarla entra al ejercicio. Hasta v26 abría un panel acordeón con los pasos, la figura, el vídeo, la curva y los ajustes — una vista previa que obligaba a mirar el ejercicio antes de hacerlo y partía cada dato en dos sitios. Ahora todo eso vive dentro, y la lista vuelve a ser lo que dice ser: una lista.

Un opcional que agregas con el `+` **sube al bloque de entrenamiento** y pasa a ser una fila normal, con su botón de empezar y contando en el anillo; abajo solo quedan los que aún no has agregado. Para que el orden que se ve y el que se ejecuta no puedan divergir, los dos salen de `routineBuckets(k)`.

Estados de la fila: pendiente · **siguiente** (filo verde y su botón de empezar en verde sólido; es lo único que destaca) · hecha (encoge: se ocultan meta y etiquetas, la figura se atenúa, de 108 a 71 px).

Abajo, barra fija con dos acciones: continuar y finalizar.

### Modo guiado
Manda **la serie**: pastilla con "Serie 2 de 4", nombre del ejercicio, y los controles de peso y reps inmediatamente debajo. Bajo la acción, el **único ajuste que se edita a mano**: cuántas series. Arranca en la del programa, con "Sugeridas: N" debajo, y si la cambias ese texto se convierte en el botón para volver. La ficha de cómo se hace —figura, avisos, pasos y vídeo— va **después**, plegada, y viene cerrada si ya has hecho ese ejercicio tres veces o más.

**El tiempo no se edita.** Descansos y sostenes los fija el programa: el criterio para ponerlos ya está tomado y ofrecer un stepper solo invita a deshacerlo sin datos. Cambiar las series, en cambio, responde a algo que solo sabes tú — cómo te sientes hoy y cuánto tiempo tienes.

Subir o bajar series rehace la lista de pasos entera, así que `reanclar()` te devuelve a la misma serie del mismo ejercicio (o a la última que quede, si la recortaste) y conserva el peso y las reps que ya tenías marcados. No se puede bajar por debajo de lo ya registrado hoy ni por debajo de la serie en curso.

El descanso es pantalla propia: contador y saltar. No hereda la ficha del ejercicio, y ya no lleva ±30 s — por lo mismo que el resto del tiempo no se edita; para adelantarlo está saltar.

### Calendario
Resumen del mes arriba, calendario, y las sesiones del día seleccionado con icono y color de familia. El detalle se despliega **dentro** de la tarjeta de su sesión.
La cabecera del día lleva **Registrar rutina**: elige el día y añade a mano una sesión que hiciste y nunca quedó anotada. Solo aparece en días pasados o en hoy. Lo añadido a mano se marca como tal y se puede quitar; la racha se recuenta desde el historial, que es la única fuente de qué días hubo.

### Progreso
Un dato hero (índice de fuerza) y seis bloques con el mismo ritmo. Los récords van justo detrás del hero, porque son la recompensa, y en ámbar.

### Ajustes
Cuatro secciones con título: apariencia · durante el entreno · recordatorios · datos.

---

## 9. Estados

| Estado | Cómo se ve |
|---|---|
| Pendiente | Círculo hueco con borde `--line2` |
| Siguiente | Filo verde en la fila + botón de empezar en verde sólido |
| Hecho | Círculo relleno verde con visto blanco; la fila encoge |
| Sesión en curso | Manda en la tarjeta de hoy; el CTA de la rutina dice "Continuar" |
| Récord | Aviso flotante en ámbar al conseguirlo, y listado en la pantalla de fin |
| Vacío | Explica qué hacer para llenarlo, nunca "sin datos" a secas |

---

## 10. Accesibilidad

- **Contraste mínimo 4,5:1** para texto normal y 3:1 para texto grande, verificado **elemento a elemento** en las cinco pantallas y los dos temas. La verificación se repite en cada cambio visual y ninguno puede empeorarla.
- **Áreas táctiles de 44 px.** Los controles pequeños conservan su tamaño visual y amplían la zona pulsable con un pseudo-elemento.
- **Teclado**: todo lo que se comporta como botón es enfocable y responde a Enter y Espacio. Las pestañas son botones reales con `aria-current`.
- **Lector de pantalla**: el visto es `role="checkbox"` con `aria-checked`; el progreso de la rutina y el descanso son `aria-live`; los iconos decorativos van con `aria-hidden`.
- **Movimiento**: `prefers-reduced-motion` respetado.
- **Zonas seguras**: `env(safe-area-inset-top)` en las tres cabeceras y `inset-bottom` en la barra inferior y las hojas.

---

## 11. Voz y texto

- **Mayúscula solo al principio.** "Finalizar rutina", no "Finalizar Rutina".
- **Sin signos de exclamación** en texto de sistema. Se reservan para el momento de terminar una rutina.
- **Plurales siempre correctos**: "1 día seguido", no "1 días seguidos". Hay un helper `plural()`; usarlo.
- **El número primero, la unidad después**: "22,5 kg × 8", "3 de 10".
- **Los estados vacíos invitan**, no se disculpan: "Registra tus series y aquí verás cómo evolucionas".
- **Explicar el porqué cuando se propone algo**: "Completaste las 4 series: toca subir a 12 kg" en vez de solo el número.

---

## 12. Momentos

Lo que se celebra, y cuánto dura. Nada pasa de medio segundo.

| Cuándo | Qué se ve |
|---|---|
| Registras una serie | La línea entra con un gesto de 240 ms y avanza el contador |
| Completas un ejercicio | El visto rebota, la fila destella medio segundo, encoge, y el anillo avanza |
| Bates un récord | Aviso flotante en ámbar con el ejercicio y la marca |
| Terminas la rutina | Ilustración que se dibuja sola, tres cifras, los récords conseguidos y la racha |

Un récord es una serie que **ninguna anterior domina en peso y repeticiones a la vez**. Es la misma regla del panel de progreso, así que las dos cuentan lo mismo.

## 13. Qué falta

- **RPE y notas por serie.** Convertiría el registro en algo que se puede releer.
- **Tipografía incrustada.** El motivo ya no es estético: `--w-bold` es 800 y buena parte de
  los Roboto instalados en Android no tienen ese peso, así que el navegador lo aproxima a 700
  y la pareja 700/800 que sostiene toda la jerarquía de §3 puede desaparecer en ese teléfono.
  Los dos argumentos que lo dejaban fuera ya no se sostienen: el modo sin conexión está resuelto
  porque el service worker precachea en install, y el peso deja de ser excusa en cuanto termine la
  migración de §15 — `figuras.js` son 465 KB y el sistema paramétrico que lo sustituye cabe en
  unos 120. Queda pendiente por falta del archivo, no de criterio.
  **Trampa al implementarlo:** `caches.addAll` es atómico, así que el `.woff2` tiene que ir en
  un `cache.add()` aparte con `catch`. Si entra en `ASSETS` y su descarga falla, el service
  worker no se instala y la app pierde el offline por completo.
- **Migrar las 84 figuras que faltan.** §15 ya está en pie y seis ejercicios lo usan, uno por
  arquetipo: `sentadilla_aire` (frontal, suelo), `press_banca_db` (banco y mancuernas),
  `jalon_pecho` (máquina y polea), `chin_tuck` (silla, movimiento de cabeza), `flexor_cadera`
  (sostén con profundidad) y `remo_banda` (banda). El resto sigue con los dos fotogramas fundidos,
  y la app resuelve en dos capas para que no quede a medias. Va por lotes de unos diez, agrupados
  por arquetipo, y ningún lote entra sin pasar por `_forja/comparar.html`, que pinta vieja contra
  nueva en los dos temas. El criterio por figura: la postura es la del ejercicio, ningún miembro
  cambia de longitud durante el ciclo, ninguna articulación se abre, el aparato no atraviesa el
  cuerpo.
- **Superseries antagonistas.** Es la palanca con respaldo para recortar el tiempo de sesión
  sin tocar descansos: los tres días quedaron en 62-68 min tras la revisión de programa de v30. Necesita un flag de «par» entre dos
  ejercicios que alterne series y cuente el descanso solo al cerrar el par. El especialista que
  revisó las rutinas en v27 la señaló otra vez, y para el bloque secundario en concreto.

### Cerrado en v30

- ~~Las figuras no se movían: se fundían.~~ `framesLoop` apilaba los dos fotogramas y cruzaba
  opacidades, así que a mitad del ciclo se veían **dos cuerpos fantasma superpuestos**. Ahora la
  pose es un esqueleto de 18 articulaciones y el movimiento se **interpola por cinemática
  directa** — ángulo por el arco corto y longitud, reconstruyendo la cadena desde la pelvis —, con
  el ritmo real del ejercicio (concéntrica rápida, excéntrica lenta, pausa en los dos extremos)
  sacado del `type` que ya estaba en `EX`. Todo el sistema, en §15.
- ~~La figura saltaba de escala a mitad del fundido.~~ 36 de 90 traían un `viewBox` distinto en
  cada fotograma y cada `<i>` escalaba el suyo por separado, así que hasta la raya del suelo se
  desplazaba. El encuadre se calcula ahora del *bounding box* de todas las poses juntas: uno solo
  por ejercicio.
- ~~No había escala de proporciones.~~ 31 grosores distintos entre 3 y 40 y cabezas de radio 12 a
  18, en una app que tiene escala para la tipografía, el espacio y los radios. La tabla de §15 la
  fija, y al ser paramétrica no se puede incumplir.
- ~~En vista lateral los dos brazos se fundían en un bulto.~~ El miembro lejano va en
  `--diagram-ink-far`, token nuevo en los dos temas, y pintado detrás.
- ~~La muesca del codo.~~ Los remates redondos solo aguantaban hasta unos 90°. Cada hueso empieza
  con el radio con el que acaba el anterior, así que la unión sale lisa a cualquier ángulo.
- ~~La flecha se teletransportaba.~~ Ahora se traza sobre la trayectoria real de la articulación y
  solo está encendida mientras el cuerpo recorre ese tramo.
- ~~Todos flotaban sobre la misma raya de suelo, incluso tumbados.~~ La sombra de contacto se
  calcula del esqueleto, articulación por articulación.
- ~~La miniatura de 46 px era ilegible.~~ Sale del mismo esqueleto, reducida a lo esencial y
  recortada al cuerpo. Sale gratis de ser paramétrica.
- ~~Las 29 figuras sin `captions` dejaban divs vacíos~~ en la tira numerada del guiado. Los datos
  nuevos las traen siempre.
- **El parche de `prefers-reduced-motion` desaparece con la migración.** Hoy sigue ahí porque las
  84 figuras sin migrar aún lo necesitan: la regla global habría congelado el fundido a media
  opacidad con los dos fotogramas encima. En el sistema nuevo basta con no emitir los `<animate>`.

Y una segunda auditoría de las rutinas de gimnasio, esta vez del programa y no del código:

- ~~El pecho iba 3:1 contra el remo horizontal.~~ 15 series semanales de pecho contra 5 de remo,
  en una app que existe por la postura. El pectoral y el deltoides anterior son justo los que
  llevan el hombro a protracción, y el remo es lo que lo compensa. Se arregló sin añadir tiempo:
  el bloque secundario del día de empuje pasa de **jalón a remo** —el tirón vertical ya iba
  sobrado con 7 series y el horizontal se quedaba en 5— y el **pec deck sale del empuje**, donde
  era la cuarta variante de pecho del mismo día. El pecho conserva frecuencia 2× con el pec deck
  del día de tirón. Queda en **1,6:1**, que sí es compatible con priorizar pecho.
- ~~Los gemelos vivían en 4 series de un solo día.~~ Es el músculo que mejor responde a frecuencia
  alta y el más barato en tiempo (45 s de descanso). Entran como secundario en empuje y tirón, 2
  series en cada uno: **8 semanales repartidas en los tres días**.
- ~~El hueco del peso muerto rumano nunca se tapó del todo.~~ v27 devolvió el volumen de isquios
  a 7 series con los dos curl femorales, pero **las 7 eran flexión de rodilla**. Faltaba extensión
  de cadera con el isquio alargado, que la máquina de glúteo no cubre porque lleva la rodilla
  flexionada. Entra la **hiperextensión en banco romano** al día de pierna (sube de `extras` del
  tirón y pasa de `opcional` a `carga`): es esa función, y no es un rumano.
- ~~El cruce de poleas se rompía cuando no había dos poleas libres,~~ que en su gimnasio es lo
  normal. La ficha explica ahora la variante **a un brazo en una sola polea** —misma curva y más
  rango— y hay swap a aperturas con mancuernas.
- ~~Sobraba calentamiento general y faltaba el específico.~~ La caminadora baja de 8 a **5 min**
  (y la ficha avisa de que se salta si vienes de una rutina de postura, que ya la sustituye), y
  los cuatro compuestos pesados piden **series de aproximación** en el `coach`: 1×10 con la mitad
  y 1×5 con el 70%. Antes, la primera serie de trabajo del hack squat era la primera vez que se
  tocaba peso ese día.
- ~~Los fondos no tenían ruta de progresión:~~ `load:false` impedía registrar lastre, así que la
  única salida eran más repeticiones. Ahora se puede anotar el cinturón.
- **Los descansos se recortaron solo en aislamientos.** En compuestos con carga alta, descansar
  poco baja las repeticiones de las series siguientes y con ellas el volumen efectivo, así que el
  **hack squat conserva sus 180 s**. Los 90 y 75 s de aislamientos bajan a 60-75.
- **El 4º día es rotativo, no una rutina nueva.** Se va 3 o 4 días según la semana, así que las
  tres rutinas tienen que seguir siendo una semana completa por sí solas; cuando hay cuarto día se
  hace el siguiente de la lista. Se evaluó un día fijo de torso y se descartó: dejaba el bíceps en
  15 series semanales —techo alto para un músculo pequeño con otras tantas indirectas— y abandonaba
  la pierna en 1×/semana. Con el rotativo todo escala ×1,33, pierna incluida.
- **Los tres curls se quedan juntos en el día de tirón.** Se evaluó mover el martillo al empuje
  para sacar al bíceps de la prefatiga, y se descartó: el efecto del orden sobre un músculo pequeño
  aislado es modesto, y no compensa perder los tres seguidos en el día que él prefiere.

### Cerrado en v29

- ~~Los vídeos eran rutinas enteras, no el ejercicio.~~ De los 91, **51 pasaban del minuto** y la
  mediana era de 1:44; el peor duraba 13:39 y en `caminadora` ni siquiera había demostración, era
  una charla sobre si conviene la cinta o la movilidad. Consultar la técnica a mitad de una serie
  no funciona así. Ahora los 91 duran **75 s o menos**: 41 no llegan a 30 s, 48 se quedan entre 31
  y 60, y solo dos pasan de un minuto (74 s y 61 s). Se cambiaron 52 y se conservaron 39.
- **El criterio de v27 era insuficiente.** Comprobar el identificador contra el oembed sólo prueba
  que el vídeo existe, no que muestre el ejercicio: por eso entraron rutinas de diez minutos. El
  criterio ahora tiene cuatro filtros, y los cuatro se comprueban leyendo la página del vídeo:
  dura entre 8 y 75 s, es incrustable (`playableInEmbed`), el título no lleva marcas de rutina o
  recopilación (`rutina`, `workout`, `top 5`, «N minutos», «día N»…), y **casa con los términos
  obligatorios de ese ejercicio en español y en inglés**. Esos términos separan los pares que se
  confunden solos: el remo con mancuerna del remo en polea, el femoral acostado del sentado, el
  abductor del aductor. No es un adorno — el vídeo de `curl_femoral` llevaba desde v27 mostrando
  el femoral **sentado** en la clave del **acostado**, y este filtro fue lo que lo cazó.
- ~~El mismo vídeo en dos ejercicios distintos.~~ `balanceo_pierna_frontal` y
  `balanceo_pierna_lateral` compartían uno de 5:51. La auditoría ahora falla si un identificador
  aparece en dos claves.
- **`VID` admite recorte y orientación.** Cada valor puede ser `"id"`, `"id|v"` o
  `"id|h|inicio|fin"`, y `vidInfo()` normaliza las tres formas para que el resto del código no
  tenga que saber cuál es. El recorte no hizo falta esta vez —los 91 encontraron clip propio—
  pero queda como salida para el ejercicio que algún día no tenga uno: mejor treinta segundos
  recortados de un vídeo largo que soltar los ocho minutos enteros. Cuando hay recorte, el enlace
  «Abrir en YouTube» lleva `&t=` para caer en el mismo punto.
- ~~Un Short vertical se veía como un sello.~~ Casi todos los clips de un solo ejercicio son 9:16,
  y la caja estaba fija en 16:9. Con `.videobox.vert` la caja se estrecha y se centra en vez de
  deformar el vídeo: en un teléfono de 375×812 el reproductor pasa de 109×193 a 276×491. De los
  91 vídeos, 52 son verticales.
- ~~El primer toque de «Ver video» no hacía nada.~~ `gVidOn` es global y no se reiniciaba al
  cambiar de ejercicio, así que si dejabas un vídeo abierto y avanzabas, el toque siguiente sólo
  servía para apagar una bandera que ya no correspondía a nada en pantalla.

### Cerrado en v28

- ~~No había forma de anotar una rutina que ya te sabes de memoria y hiciste sin abrir la app.~~
  El calendario deja registrarla en su día desde la cabecera del día seleccionado. La sesión se
  inserta en su sitio dentro de `rp_history` (que va de más nueva a más vieja y se recorta a 200),
  se marca `manual` con un `mid` propio para poder quitarla, y `recalcStreak()` vuelve a contar la
  racha y el total desde el historial en vez de fiarse de lo guardado.
- ~~El día de hoy salía con un borrón negro en el calendario.~~ La celda usaba la clase `today`,
  que es la de la tarjeta oscura de la portada: heredaba su fondo `--hero` y su margen de 16 px.
  Ahora se llama `istoday` y hoy se marca solo con la circunferencia azul.

### Cerrado en v27

- ~~La vista previa del ejercicio.~~ Tocar una fila desplegaba un panel con los pasos, la figura,
  el editor de dosificación, el registro rápido, la curva y el vídeo. Todo eso ya existía dentro
  del ejercicio, así que era una segunda copia de la misma pantalla con menos sitio. Se fue el
  panel, y con él `toggleEx`, `doseBox`, la familia `quickBox` y el overlay `#ov` del vídeo. Se
  pierde el registro de series desde la lista; es el precio de que tocar signifique entrar.
- ~~El tiempo era editable y las series no estaban donde se necesitan.~~ Ahora el stepper de
  series vive dentro del ejercicio y el descanso lo fija el programa. Misma clave de siempre,
  `rp_doses`, así que el cambio se ve al instante en la meta de la tarjeta, en el anillo y en el
  `~N min` de la cabecera.
- ~~Agregar un opcional lo dejaba abajo.~~ El `+` lo sube al bloque de entrenamiento como un
  ejercicio más, con un chip «Quitar» para deshacer.
- ~~Treinta ejercicios sin vídeo.~~ Los 91 tienen uno, y **cada identificador se comprobó contra
  el oembed de YouTube antes de escribirlo**: once caracteres al azar apuntan a un vídeo real y
  arbitrario, que es exactamente la trampa que v26 dejó anotada.
- ~~Las figuras que faltaban.~~ De 91 ejercicios, **90 tienen figura propia**. Se dibujaron 29
  nuevas sobre la misma rejilla del resto — suelo a 150, cuerpo `#cfeede`, aparatos `#46596f`,
  flecha de movimiento `#5fe39a` —: las 16 que no tenían nada, y las 13 que salían del paso con
  la figura prestada de otro movimiento, que en casi todas engañaba (al pec deck inverso le tocaba
  una de mancuernas; a la sentadilla al aire, una con mancuerna). `FIGALIAS` se queda con un solo
  préstamo, el honesto: los vuelos posteriores ligeros **son** un reverse fly con menos peso.
- ~~Las rutinas de gimnasio no eran las que se entrenan.~~ Fuera el remo con mancuerna, los
  encogimientos y el peso muerto rumano, que no se hacían. Quitarlos abría dos agujeros y los dos
  se taparon: los isquios caían a 3 series semanales contra 11 del cuádriceps (entra el curl
  femoral sentado, que trabaja el isquio con la cadera flexionada y no repite al acostado), y la
  semana quedaba en 11 series de tirón vertical contra 4 de horizontal (el remo sentado sube a 5
  y entra el pullover en polea). En empuje, el cruce de poleas sale de opcionales al bloque fijo
  como bajo-alto: cubre la porción clavicular sin el banco inclinado, que le molesta el manguito.

### Cerrado en v26

- ~~El enlace de vídeo roto en la ficha del guiado.~~ `fichaEjercicio` pintaba el botón «Ver
  video» y el enlace a YouTube sin comprobar que el ejercicio tuviera entrada en `VID`, así que
  doce ejercicios —`caminadora` entre ellos, el paso 1 de Empuje— servían un `watch?v=undefined`
  y un iframe vacío. La guarda existía desde antes en la tarjeta de la lista; a la ficha no había
  llegado. Con los trece ejercicios de casa serían veintinueve, y ninguno de ellos tiene vídeo:
  inventar identificadores de YouTube no es una opción, porque once caracteres al azar apuntan a
  un vídeo real y arbitrario.
- ~~Los 10 kg de la primera serie.~~ `suggestLoad` proponía 10 kg en el estreno de cualquier
  ejercicio cargado, que es más del triple de lo que hay en una casa con mancuernas de 1-3 kg.
  `dose(k,id)` gana un quinto campo, `startKg`, por la misma ruta que los otros cuatro: se declara
  en `EX` o se ajusta por rutina en `SECDOSE`, y si nadie lo declara el default sigue siendo 10.
  Así el mismo press de hombro arranca en 2 kg en casa y en 10 en el gimnasio, sin duplicar el
  ejercicio.
- ~~`SECDOSE` solo servía para el bloque secundario.~~ Su nombre y su comentario lo decían, pero
  `progDose` nunca comprobó nada contra `secondary`: siempre fue un override de dosis por rutina.
  Las tres sesiones de casa lo usan para bajar diecisiete ejercicios de la dosis de gimnasio que
  vive en `EX` a la suya, sin una sola entrada duplicada. El comentario ya dice la verdad.

### Cerrado en v25

- ~~Aplanar la cola de parches.~~ Los dieciséis `Object.assign` e IIFE del final del archivo
  desaparecieron: `VID`, `ZONA`, `EX`, `ROUTINES` y `GROUPS` se declaran una sola vez. Se hizo
  generando los literales desde el estado resuelto capturado ejecutando la app, no fusionando
  parches a mano, y se verificó con un diff vacío del JSON canónico más una segunda pasada sobre
  el comportamiento derivado: minutos estimados, número de pasos del guiado con sus descansos y
  la cadena de meta de las seis rutinas.
- ~~No se sabía cuántas series tiene un ejercicio.~~ Hay un accesor `dose(k,id)` con tres capas
  —programa, bloque secundario y ajuste del usuario— y los seis lectores pasan por él.

## 14. Fuera de alcance

- **Que el color primario cambie según la rutina abierta:** obligaría a re-verificar el contraste
  de todos los componentes en tres variantes por dos temas, y el azulejo de familia ya consigue
  la misma lectura.
- **Mecánicas de gamificación competitivas:** tablas de clasificación, comparación con otros,
  puntos canjeables e insignias por presentarse. Para un usuario único no tienen sentido, y los
  leaderboards son el elemento más asociado a efectos motivacionales negativos.

---

## 15. La figura

Las figuras dejaron de ser dibujos. Una pose es un **esqueleto de 18 articulaciones**, y un solo
renderizador (`figura.js`) saca de él la figura quieta, la miniatura y la animación. Esta sección
es a la figura lo que §3 es a la tipografía: si un número no está aquí, no se escribe a mano.

**Por qué.** El sistema anterior eran 183 SVG literales escritos uno a uno. No tenía escala de
proporciones —31 grosores distintos entre 3 y 40, cabezas de radio 12 a 18—, 36 de 90 figuras
cambiaban de `viewBox` entre sus dos fotogramas, así que la figura saltaba de escala a mitad del
fundido, y la «animación» era un cruce de opacidades: dos cuerpos fantasma superpuestos, no un
movimiento.

### Rejilla y proporción

Rejilla única `0 0 240 160`, suelo en **y=150**. El `viewBox` de cada ejercicio se calcula del
*bounding box* de **todas** sus poses juntas, más el aparato y la flecha: mismo encuadre en todos
los fotogramas, que es lo que mata el salto de escala de raíz.

De pie, la figura mide **137 unidades** con la cabeza en Ø22 — **6,2 cabezas**.

| Segmento | Largo | Ancho proximal → distal |
|---|---|---|
| Cabeza | Ø22 | — |
| Cuello (pecho→cuello→cabeza) | 14 + 20 | 16 → 13 |
| Torso (cadera→pecho) | 32 | 26 → 22 en la cintura → 26 |
| Clavícula (pecho→hombro) | 21 | 24 → 14 |
| Brazo · antebrazo | 24 · 22 | 14 → 12 · 12 → 10 |
| Mano | Ø11 | — |
| Cadera · muslo · pierna | 10 · 26 · 27 | 26 → 18 · 18 → 16 · 16 → 10 |
| Pie | 10–15 | 10 → 7 |

### Las cinco reglas del dibujo

**1 · Cada hueso es una cápsula cónica**, no una línea con remate redondo: dos círculos unidos por
sus tangentes exteriores.

**2 · No hay discos de articulación, y por eso no hay muesca.** El radio con el que acaba un hueso
es exactamente el que tiene el siguiente al empezar, así que la unión sale lisa **a cualquier
ángulo**. Los remates redondos del sistema viejo solo aguantaban hasta unos 90°; pasado eso
aparecía la muesca del codo, y no tenía arreglo.

**3 · Cada miembro lleva halo.** En una silueta plana un brazo pegado al torso se funde con él. El
halo es un trazo de 3 unidades del color del fondo, y va **por grupo entero** —el brazo, no el
hueso— para que el relleno del hueso siguiente tape el halo del anterior y no salga una costura en
el codo. Los huesos **interiores** (clavícula, cresta ilíaca) no lo llevan: están dentro de la masa
del tronco, y rodearlos dibujaría un contorno fantasma por dentro del torso.

**4 · Profundidad.** De lado, el miembro lejano va en `--diagram-ink-far` y pintado detrás. Sin
eso, los dos brazos en la misma tinta se funden en un bulto y no se sabe cuál es cuál. Contraste
verificado (§10): 3,35:1 contra el fondo del diagrama en claro y 4,39:1 en oscuro; 3,3:1 y 3,0:1
contra la tinta cercana. Se lee como cuerpo, no como sombra.

**5 · Orden de profundidad, y depende de la vista.**

| Vista | De atrás hacia delante |
|---|---|
| Lateral | pierna lejana · brazo lejano · pierna cercana · tronco · brazo cercano |
| Frontal | pierna lejana · pierna cercana · tronco · brazo lejano · brazo cercano |

La pierna cercana va **debajo** del tronco a propósito: el muslo nace dentro de la pelvis, y encima
su halo dibujaría el contorno del muslo por dentro del torso. Y **de frente no hay lado lejano**:
los dos brazos van encima y las dos piernas debajo, para que el recorte salga igual a izquierda y
derecha. Con el orden lateral, el brazo izquierdo salía mordido por el halo del torso y el derecho
no.

### Suelo, aparato y flecha

**Nadie flota.** Bajo cada articulación que apoya —a menos de 11 unidades del suelo— va una elipse
blanda en `--diagram-shadow`. Se calcula del esqueleto, así que el que está tumbado apoya en toda
la espalda y el que está colgado (`ground:"none"`) no apoya en nada.

**El aparato usa otro idioma a propósito:** remates planos, trazo más fino, `--diagram-line`.
Hombre y máquina no se confunden. Tres clases, y la diferencia importa:

- **Fijo** — banco, silla, poste, travesaño, torre de placas, colchoneta. No se mueve.
- **Sujeto** — mancuerna, barra. Declara la articulación y **viaja con ella** en cada fotograma
  interpolado. Antes la mancuerna estaba dibujada dos veces y saltaba; ahora sigue la mano.
- **Enlace** — cable, banda. Se recalcula entre sus dos extremos en cada muestra, y la banda pierde
  la comba al tensarse. Es la diferencia entre una polea dibujada y una polea que tira.

**La flecha** ya no es un palo que salta de sitio: se traza sobre la **trayectoria real** de la
articulación que se indica, y solo está encendida mientras el cuerpo recorre ese tramo. Fuera de
él se apaga, para que nunca señale en dirección contraria a lo que se está viendo.

### El movimiento

**Se interpola por cinemática directa.** Cada hueso interpola su **ángulo** por el arco corto y su
**longitud**, y la cadena se reconstruye desde la pelvis hacia fuera. Un *lerp* de coordenadas
acortaría el antebrazo un 29% a mitad de un giro de 90°: brazo de goma.

**El ritmo sale del `type` que el ejercicio ya declara en `EX`.** Un press no baja igual de rápido
que sube, y eso es la mitad de lo que hace que una animación se lea como profesional.

| `type` | Pausa · esfuerzo · pausa · vuelta | Ciclo |
|---|---|---|
| `reps`, `reps_side` | 0,35 · 0,9 · 0,25 · 1,4 s | 2,9 s |
| `cardio` | 0,12 · 0,5 · 0,1 · 0,55 s | 1,27 s |
| `hold`, `hold_side` | 0,5 · 1,1 · 2,4 · 0,9 s | 4,9 s |

`effort` dice cuál de los dos tramos es el esfuerzo y por tanto cuál va rápido: en una sentadilla
es el de vuelta, porque lo que cuesta es subir.

**Se reproduce con SMIL, no con un bucle en JS.** La interpolación se muestrea en 11 poses y a cada
`<path>` se le cuelga un `<animate attributeName="d">` con sus `keyTimes` y `keySplines`. El tiempo
lo lleva el navegador. Con `prefers-reduced-motion` no se emite ningún `<animate>` y se pinta la
primera pose — sin el parche que hacía falta antes para que el fundido no se congelara a media
opacidad con los dos fotogramas encima.

### Lo que sale gratis de ser paramétrico

La **miniatura de 46 px**: el mismo esqueleto sin ojo, sin aparato, sin flecha, sin distinción
cerca/lejos, con los grosores un 14% mayores y recortada al cuerpo en vez de a la rejilla. A esa
escala el dibujo completo era ilegible por aritmética —255 unidades en 36 px útiles, la cabeza a
4 px—; ahora se lee. En el sistema anterior habrían sido 90 dibujos más a mano.

### Datos y migración

`poses.js` son los datos, `figura.js` el renderizador, y `figuras.js` el sistema viejo, que sigue
ahí. Se resuelve en dos capas: si el ejercicio tiene esqueleto lo pinta el sistema nuevo, y si no,
sigue el camino de los dos fotogramas fundidos. **La app nunca queda a medias** y la migración va
por lotes. Una pose solo declara lo que cambia respecto de la anterior; lo demás se hereda, así que
en un press de banca las piernas se escriben una vez.

Peso: `figuras.js` son 465 KB. El sistema nuevo son 22 KB de renderizador más ~1 KB por ejercicio,
o sea unos 120 KB para los 90 cuando la migración termine. Eso es lo que deja sitio a la tipografía
incrustada que pide §13.
