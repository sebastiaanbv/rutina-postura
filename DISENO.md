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

36 iconos propios. **Cero emojis en la interfaz.**

- Rejilla `viewBox="0 0 24 24"`, sin relleno, `stroke:currentColor`, grosor 2, remates redondos.
- Tamaños: `.ic` 20 · `.ic.xs` 15 · `.ic.sm` 17 · `.ic.lg` 26 · `.ic.hero` 34. `.ic.solid` rellena en vez de perfilar, para el triángulo de reproducir, que a tamaño pequeño se lee mejor macizo.
- Heredan el color del texto, así que se tiñen solos en cada contexto y en los dos temas.
- Se declaran en `ICON` y se pintan con `ic(nombre, clases)`. Uno nuevo se añade al mapa, no se escribe suelto en una plantilla.
- El icono de cada rutina sale de `RICON`, no de los datos de `ROUTINES`.
- Siete de los 36 son **glifos de equipamiento** (`dumbbell barbell machine cable band
  pullbar bench wall`): los usa el mapa corporal de §15 para decir con qué se hace el
  ejercicio. Son iconos normales del mapa `ICON`, no un set aparte.

**Por qué importa:** los emojis se dibujan distinto en cada teléfono, no comparten grosor ni rejilla y no se pueden colorear. Era lo que más delataba que la app estaba hecha en casa.

---

## 6. Componentes

**Tarjeta** (`.rcard .stat .hitem .field .cal .chartcard .ex .day .stepper .daydet .ovcard`) — fondo `--card`, radio `--r-lg`, sombra `--sh-card`. Es un contenedor de bloque.

**Caja hundida** (`.exprog .finempty .finsum .fs .setline .planopt .timepill`) — fondo `--sunk` con borde. Va **dentro** de una tarjeta. Nunca al revés.

**Nota de color** (`.last .qwhy .coachtip .optbox .caveatbox .callout`) — mismo formato, distinto significado según el color. Todas comparten radio, padding y tamaño de texto: lo único que cambia es el par tinte/tinta. `.coachtip` estuvo documentado aquí durante seis versiones **sin existir en el CSS**: no se notó porque el campo que debía llenarla, `EX[id].coach`, tampoco se mostraba. Las dos cosas se cerraron en v32.

**Botones.** Como máximo **uno primario por pantalla**. El resto son secundarios (`.sec`, fondo de tarjeta con borde) o apagados (`.gbtn.fin`, `.skip`). Todas las clases de botón comparten base; las variantes solo cambian color y altura.

**Listas.** Filas dentro de una tarjeta, separadas por `border-top:1px solid var(--line)`, sin separador en la primera. Nunca N tarjetas seguidas.

**Anillo de avance** (`ringSVG`) — el motivo geométrico de la app. Se usa en el temporizador, en la cabecera de la rutina y podrá usarse en Progreso. Transición de 0,45 s sobre `stroke-dashoffset`.

**Pastillas** (`.badge .chip .mchip .delta`) — `--r-pill`, texto de 10 px en 800, tinte + tinta de su familia.

---

## 7. Movimiento

Regla: **toda animación es declarativa** —CSS—, nunca un contador
en JS. El navegador lleva el tiempo, y apagarlas sigue siendo una decisión en un sitio.

| Qué | Duración |
|---|---|
| Cambio de pantalla | 220 ms |
| Estado de un control | 150 ms |
| Anillo de avance | 450 ms |
| Barra de progreso | 350 ms |

`prefers-reduced-motion` neutraliza transiciones **y** animaciones. Sin lo segundo, las celebraciones se colarían aunque el teléfono pida menos movimiento.

Nada dura más de medio segundo. Una celebración que se disfruta la primera vez estorba la trigésima.

**Una confirmación no abre una ventana.** «Registrar serie» se queda 300 ms como visto antes del
descanso; mientras tanto el botón está deshabilitado y sin `pointer-events`, y `logSet` no admite
otra serie del mismo paso ni dos a menos de 300 ms (`SERIE_MS`). Con `prefers-reduced-motion` no
hay confirmación y la pantalla siguiente se pinta en el acto, bajo el mismo dedo: por eso la
guardia no depende de la animación.

---

## 8. Pantallas

### Inicio
Manda la **tarjeta de hoy**: superficie oscura, título a 30 px, icono de la familia y una sola acción a ancho completo. Debajo, en tono descendente: la racha en **una línea** con la llama en ámbar y el anillo de la semana, la semana como **riel continuo** con hoy resaltado, y las rutinas en **una tarjeta por familia** con filas, azulejo de color y duración a la derecha.

Con objetivo salud la tarjeta de la racha lleva una segunda fila, separada por línea fina: «Postura: N de 7 días esta semana», los días desde el lunes con alguna rutina que no está en `GYMKEYS`. La postura no cuenta para la meta de fuerza, y en ella lo que importa es la frecuencia, no la carga.

Estados de la tarjeta de hoy: hoy toca · en curso (manda sobre todo) · ya entrenaste · día de descanso.

### Detalle de rutina
Cabecera con título a 30 px y **anillo de avance**. Los ejercicios en **una tarjeta por bloque** (calentamiento · entrenamiento · bloque secundario · opcionales), cada uno una fila.

La fila **no despliega nada**: tocarla entra al ejercicio. Hasta v26 abría un panel acordeón con los pasos, la figura, el vídeo, la curva y los ajustes — una vista previa que obligaba a mirar el ejercicio antes de hacerlo y partía cada dato en dos sitios. Ahora todo eso vive dentro, y la lista vuelve a ser lo que dice ser: una lista.

Un opcional que agregas con el `+` **sube al bloque de entrenamiento** y pasa a ser una fila normal, con su botón de empezar y contando en el anillo; abajo solo quedan los que aún no has agregado. Para que el orden que se ve y el que se ejecuta no puedan divergir, los dos salen de `routineBuckets(k)`.

Estados de la fila: pendiente · **siguiente** (filo verde y su botón de empezar en verde sólido; es lo único que destaca) · hecha (encoge: se ocultan meta y etiquetas, el mapa se atenúa, de 108 a 71 px).

**Otra rutina a medias no se cierra sola.** Con una sesión de hoy a medias en otra rutina, tocar una fila, su figura, su play, su visto o «Empezar» no cambia nada: sale la hoja «Tienes Empuje a medias», con lo hecho («Empuje · 3 de 14 hechos · 3 series»), y dos botones con nombre. «Volver a Empuje» es el primario, porque lo normal es que solo se quería mirar, y abre su detalle tal cual. «Guardar Empuje y empezar Tirón» la guarda y repite el toque que abrió la hoja: dos toques en total. Ninguno borra; descartar sigue en la hoja de finalizar de esa rutina. Cerrar la hoja con ×, con atrás o recargando tampoco cambia nada.

Abajo, barra fija con dos acciones: continuar y finalizar.

### Modo guiado
Manda **la serie**: pastilla con "Serie 2 de 4", nombre del ejercicio, y los controles de peso y reps inmediatamente debajo. Bajo la acción, el **único ajuste de la sesión que se edita a mano**: cuántas series. Arranca en la del programa, con "Sugeridas: N" debajo, y si la cambias ese texto se convierte en el botón para volver. La ficha de cómo se hace —mapa corporal, consejo, avisos, pasos y vídeo— va **después**, plegada, y viene cerrada si ya has hecho ese ejercicio tres veces o más.

Bajo el peso, el chip **Salto**: de cuánto en cuánto sube esa máquina (1 · 2 · 2,5 · 4,5 · 5 · 7 · 10 kg). No es un ajuste de la sesión sino un dato de la máquina: se dice una vez por ejercicio, queda en `rp_inc`, y desde entonces la propuesta, los −/+ y la aproximación solo dan múltiplos de ese salto. Sin decirlo, el chip invita («¿De cuánto sube?», con borde discontinuo) y todo sigue como antes; las opciones se despliegan debajo de los dos controles y tocar la marcada la quita. Cambiarlo rehace la propuesta que nadie tocó, no lo movido con −/+ ni lo tecleado. No sale en ejercicios sin carga ni en mancuernas con lista en Ajustes: ahí la lista ya dice qué pesos existen. Tampoco en casa con esa lista en lo que allí se hace con mancuernas (los gemelos, que en el gimnasio son de máquina): el salto guardado en el gimnasio no cuenta en casa. **Lo que se teclea en el peso no se redondea nunca**: si la máquina lleva una placa suelta de 2,5, se escribe a mano.

El peso del control es **solo el número**, y es el mismo al entrar en la serie, al tocar − o +, al escribirlo a mano y al cambiar las series: los cuatro caminos pintan con `fmtW(curW)` (`pintaW()` los que no rehacen la serie). Con la unidad, «102.5 kg» parte la fila en dos líneas en un móvil de 390 px; la unidad sigue en la línea de cada serie registrada.

**El tiempo no se edita.** Descansos y sostenes los fija el programa: el criterio para ponerlos ya está tomado y ofrecer un stepper solo invita a deshacerlo sin datos. Cambiar las series, en cambio, responde a algo que solo sabes tú — cómo te sientes hoy y cuánto tiempo tienes.

**Un descanso de 0 s es 0 s.** Lo traen los calentamientos encadenados y lo puede elegir la persona al crear un ejercicio propio: la serie siguiente entra directa, sin pantalla de descanso, y la duración estimada de la rutina no le suma nada. `dose()` ya pone el descanso por defecto cuando nadie lo declara, así que `buildSteps` y `estMinutes` lo usan tal cual, nunca con `||`.

Subir o bajar series rehace la lista de pasos entera, así que `reanclar()` te devuelve a la misma serie del mismo ejercicio (o a la última que quede, si la recortaste) y conserva el peso y las reps que ya tenías marcados. No se puede bajar por debajo de lo ya registrado hoy ni por debajo de la serie en curso.

El descanso es pantalla propia: contador y saltar. No hereda la ficha del ejercicio, y ya no lleva ±30 s — por lo mismo que el resto del tiempo no se edita; para adelantarlo está saltar.

**Entrar no crea la sesión.** `rp_session` nace con lo primero que se registra —una serie, un visto o un temporizador—, así que abrir un ejercicio para mirarlo y salir no deja rastro ni pone la tarjeta de hoy «En curso».

**El final avisa de lo que falta.** Si al acabar el último paso queda algún ejercicio **sin series ni visto** —por haber empezado a mitad de la lista, por ejemplo—, el guiado no cierra: sale «Te faltan N ejercicios», la lista de cuáles con su dosis y dos botones. **Hacerlos ahora** (el primario) va al primer paso del primero que falta y, al acabar cada uno, salta al siguiente que falte sin volver a pasar por lo hecho. **Terminar así** guarda igual que siempre y la pantalla final dice «Guardada · X de Y ejercicios», con el anillo parado en lo hecho. «Completada» queda para cuando no falta nada; sin pendientes, el final es el de siempre. Salir del aviso sin elegir deja la sesión abierta, y «Continuar» lleva a lo que falta, no al último paso, que ya está hecho.

**Saltar ejercicio es «hoy no lo hago».** El saltado no sale como pendiente en el aviso, pero tampoco cuenta como hecho en el «X de Y». Si ya tenía series, esas series se guardan y sí cuenta.

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
| Otra rutina a medias | Registrar en otra rutina abre la hoja «Tienes X a medias»: volver a ella o guardarla y empezar. Nada se cierra solo |
| Récord | Aviso flotante en ámbar al conseguirlo, y listado en la pantalla de fin |
| Vacío | Explica qué hacer para llenarlo, nunca "sin datos" a secas |

---

## 10. Accesibilidad

- **Contraste mínimo 4,5:1** para texto normal y 3:1 para texto grande, verificado **elemento a elemento** en las cinco pantallas y los dos temas. La verificación se repite en cada cambio visual y ninguno puede empeorarla.
- **Áreas táctiles de 44 px.** Los controles pequeños conservan su tamaño visual y amplían la zona
  pulsable con un pseudo-elemento. Cubre **19 familias de control**: hasta v32 cubría cinco, y la
  mitad de los botones se quedaba fuera —los `+`/`−` del guiado medían 42 px, los interruptores 28
  y el de confirmar una serie 30—. Solo se amplían controles **hoja**: el pseudo-elemento se pinta
  por encima y se tragaría el clic de un hijo pulsable.
- **Teclado**: todo lo que se comporta como botón es enfocable y responde a Enter y Espacio. Las
  pestañas son botones reales con `aria-current`. En v32 había **22 controles que eran `<div>` con
  `onclick` y ni `role` ni `tabindex`** —entre ellos la lista entera de rutinas de Inicio, el
  planificador semanal y todas las celdas del calendario—, y el manejador global solo atendía a lo
  que llevara `role`. Se cerró: hoy solo queda fuera la figura de la fila de ejercicio, **a
  propósito**, porque sería un segundo tabulador para la misma acción que ya hace el cuerpo de la
  fila.
- **Lector de pantalla**: el visto es `role="checkbox"` con `aria-checked`; los tres interruptores
  son `role="switch"` con `aria-checked`; el selector de métrica y las opciones del salto llevan
  `aria-pressed`, y el chip que las abre, `aria-expanded`; las tres
  hojas superpuestas son `role="dialog"` con `aria-modal` y `aria-labelledby`; el progreso de la
  rutina y el descanso son `aria-live`; los iconos decorativos van con `aria-hidden`.
- **Avisos**: los mensajes no destructivos salen por el `toast()` propio, no por `alert()`. Los
  cinco `confirm()` que quedan son todos destructivos —reemplazar datos al importar, descartar la
  sesión, quitar una rutina del calendario y las dos de borrarlo todo— y ahí el diálogo del
  sistema es una ventaja: cuesta más pulsarlo por accidente.
- **Movimiento**: `prefers-reduced-motion` respetado.
- **Zonas seguras**: `env(safe-area-inset-top)` en las tres cabeceras y `inset-bottom` en la barra inferior y las hojas.

---

## 11. Voz y texto

- **Mayúscula solo al principio.** "Finalizar rutina", no "Finalizar Rutina".
- **Sin signos de exclamación** en texto de sistema. Se reservan para el momento de terminar una rutina.
- **Plurales siempre correctos**: "1 semana cumplida", no "1 semanas cumplidas". Hay un helper `plural()`; usarlo.
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
| Terminas la rutina | Ilustración que se dibuja sola, tres cifras, los récords conseguidos y la semana: el anillo de Inicio con «Esta semana: N de M» y, si esa sesión la cumple, «Semana cumplida · R seguidas» en ámbar. Solo esa: las que vienen después la misma semana ya no lo repiten |
| Terminas con ejercicios sin hacer | Antes, el aviso con lo que falta. Si terminas así, el anillo se dibuja solo hasta lo hecho y dice «Guardada · X de Y ejercicios»: nunca «Completada» |

Un récord es una serie que **ninguna anterior domina en peso y repeticiones a la vez**. Es la misma regla del panel de progreso, así que las dos cuentan lo mismo.

**Una sola racha: semanas cumplidas.** Toda la app —Inicio, pantalla de fin, «Listo por hoy», Progreso y Ajustes— cuenta la misma cifra, la de `weekStats()`: semanas seguidas con la meta de sesiones de fuerza cumplida. Una racha de días castigaba justo los descansos que pide un programa de tres días. La semana en curso nunca resta y **suma en cuanto se cumple**: si solo contaran las cerradas, la pantalla de fin diría «Semana cumplida · 6 seguidas» e Inicio seguiría en 5 hasta el lunes. El avance de la semana va en primario, como todo progreso; solo «Semana cumplida» va en ámbar, porque eso sí es un logro, y sale una vez por semana: celebrarlo en cada sesión que sobra lo gastaría (§7). La mejor racha cuenta las semanas seguidas **por fecha**, como la racha: restar milisegundos entre dos lunes da 7 días ± 1 h si entre ellos hay cambio de hora, y la partía en dos. «Mejor M» solo sale cuando hay alguna semana cumplida: en la primera sesión, «mejor 0» al lado de «0 semanas cumplidas» no dice nada, y la pantalla de fin se queda con «1 sesión en total» (§11: los estados vacíos invitan). `rp_streak` se sigue guardando igual, pero de él solo se muestra el total de sesiones.

## 13. Qué falta

- **RPE y notas por serie.** Convertiría el registro en algo que se puede releer.
- **Tipografía incrustada.** El motivo ya no es estético: `--w-bold` es 800 y buena parte de
  los Roboto instalados en Android no tienen ese peso, así que el navegador lo aproxima a 700
  y la pareja 700/800 que sostiene toda la jerarquía de §3 puede desaparecer en ese teléfono.
  Los dos argumentos que lo dejaban fuera ya no se sostienen: el modo sin conexión está resuelto
  porque el service worker precachea en install, y el peso dejó de ser excusa en v32 — retirar
  three.js liberó 226 KB comprimidos, y un `.woff2` con los dos pesos cabe en unos 30. Queda
  pendiente por falta del archivo, no de criterio.
  **Trampa al implementarlo:** `caches.addAll` es atómico, así que el `.woff2` tiene que ir en
  un `cache.add()` aparte con `catch`. Si entra en `ASSETS` y su descarga falla, el service
  worker no se instala y la app pierde el offline por completo.
- **Superseries antagonistas.** Es la palanca con respaldo para recortar el tiempo de sesión
  sin tocar descansos: los tres días quedaron en 62-68 min tras la revisión de programa de v30. Necesita un flag de «par» entre dos
  ejercicios que alterne series y cuente el descanso solo al cerrar el par. El especialista que
  revisó las rutinas en v27 la señaló otra vez, y para el bloque secundario en concreto.
- ~~Superseries~~: **descartadas por el usuario** (2026-09-23). No volver a proponerlas.
- **Usar las reps en reserva en la progresión.** v35 ya las registra (`s.rir`); falta que
  `todayTarget` las lea (p. ej. reserva 0 en todas las series → no subir aunque se llene el rango).

**De la comparación con apps líderes (2026-09-23)** — Strong, Hevy, Alpha Progression, RP
Hypertrophy, Boostcamp, JEFIT. Ordenado por valor para estos dos usuarios:
1. ~~Pesos disponibles~~ → cerrado en v35 para mancuernas y en v36 para máquinas (salto de
   placa de cada una, chip «Salto» del guiado).
2. ~~Aviso de molestia articular~~ → cerrado en v35.
3. ~~Series de aproximación~~ → cerrado en v35.
4. ~~Medidas corporales~~ → cerrado en v35, con curva de la medida principal (cintura en salud,
   brazo en masa) desde 3 medidas.
5. **Descarga de una semana** (Alpha Progression, RP, Boostcamp): salida al radar de estancamiento. M.
6. ~~Resumen mensual~~ → cerrado en v35 (sin desglose por músculo todavía).
7. **Fotos de progreso** (Hevy, JEFIT). M: van en IndexedDB, no en localStorage ni en el JSON.

Descartado tras la comparación: calculadora de discos (no usan barra), mapa de recuperación de
Fitbod (aporta poco con PPL 3×), insignias y logros.

### Cerrado en v36

Red de seguridad de los datos. La prioridad del dueño es no perder datos nunca, y hasta v35 eso
dependía de que el teléfono tuviera espacio y de que nadie cambiara la forma de una clave.

- **Versión de esquema** (`rp_schema`). Los datos no decían en qué forma estaban guardados, así
  que cambiar una clave obligaba a adivinar al leerla. Ahora un bloque en `<head>` corre antes que
  cualquier lectura —incluida la del tema— y aplica en orden las migraciones de `MIGRACIONES` que
  falten; `SCHEMA` es su largo. Es idempotente: con los datos al día no escribe nada. La
  migración 1 solo declara el esquema que ya existía. Datos de una versión más nueva (una vuelta
  atrás de la caché) no se tocan, y una migración que falla deja `rp_schema` en la última que
  terminó y se reintenta en el siguiente arranque. Las reglas para escribir la siguiente están en
  el comentario del bloque.
- **Importar migra las copias viejas.** Una copia sin `rp_schema` (de v35 o anterior) vuelve el
  esquema a 0 y se migra en el acto, dentro de la misma vuelta atrás. Una copia de una versión más
  nueva no entra: lo dice y pide actualizar desde Ajustes. Exportar no cambia: va por prefijo, así
  que `rp_schema` viaja en la copia.
- **Importar valida la forma, no solo que sea JSON**, y lo hace antes de preguntar, no después de
  aceptar. Una copia con `rp_history` como objeto pasaba el filtro y al recargar Inicio la app
  quedaba en blanco hasta borrar los datos. Por si algo así ya está guardado, `jget` devuelve el
  valor por defecto cuando lo guardado no tiene su forma (lista, objeto o texto). Lo guardado no se
  toca: la copia lo exporta tal cual.
- **Teléfono lleno sin perder nada.** `jset` ya devolvía `false`, pero nadie lo miraba:
  - Anotar una serie o marcar un visto sin espacio avisa: «No cupo en el teléfono: lo de esta
    sesión sigue en pantalla, pero no quedó guardado». La serie sigue en memoria.
  - Salir del guiado y volver a entrar (la rutina, «Continuar», adelante en el historial) junta
    lo guardado con la memoria, y la memoria manda. Antes tomaba la copia de `rp_session`, o nada
    si la sesión no había llegado a guardarse, y la serie que no cupo se perdía sin aviso.
  - **Finalizar es todo o nada**: series, vistos volcados, racha e historial entran juntos, y si
    uno no cabe se deshace lo escrito. Antes `rp_session` se borraba igual y las series se perdían
    sin aviso. En el guiado sale «No cupo en el teléfono» con «Intentar de nuevo» en vez de
    «Completada»; la hoja de finalizar se queda abierta.
  - Empezar otra rutina cerraba sola la anterior y la borraba aunque no hubiera cabido. Ahora la
    deja abierta y avisa.
  - Importar ya volvía atrás entero; ahora distingue «No cupo» de cualquier otro fallo.
- **Borrar todo deja el teléfono en el esquema actual**: lo que se anote antes de recargar no
  pasa por las migraciones como si fuera de v35.
- **Lo que la auditoría dejó abierto**, todo de riesgo bajo: ajustes, plan, notas, pesajes y
  correcciones del historial siguen sin aviso si no caben (las correcciones encogen y caben);
  `rp_checks` y `rp_weekgoal` crecen sin tope, unos bytes por día y por semana; importar mezcla, y
  las claves que no vienen en el archivo se quedan; con dos pestañas abiertas gana la última
  escritura.
- **Pruebas** en `tests/pruebas_datos.js`: migración idempotente y en orden, copia vieja que se
  migra al importar, copia más nueva rechazada, forma cambiada, ida y vuelta con la sesión en
  curso, y teléfono lleno simulado (`setItem` que lanza `QuotaExceededError`) al anotar, al
  finalizar, al empezar otra rutina y al importar.

Dos fallos que encontró el arnés de pruebas y que estaban anotados como `test.skip`:

- **Un descanso de 0 s ya no se convierte en 15.** `buildSteps` rellenaba con `d.rest||15` en
  los aguantes y `d.rest||10` en los de por lado, y `estMinutes` con `d.rest||30` en todo, así que
  un `rest:0` —ajustado en `rp_doses` o puesto al crear un ejercicio propio— metía un descanso que
  nadie había pedido y alargaba la duración estimada. `dose()` ya avisaba de lo contrario. Las
  nueve rutinas, con sus opcionales, no cambian ni en pasos ni en minutos: sus aguantes con
  `rest:0` van a una serie. Solo cambian los dos estiramientos por lado del programa con `rest:0`
  y dos series (pectoral en la puerta, trapecio superior) cuando se agregan a otra rutina o se les
  suben las series: las series van seguidas, como dice su dosis, en vez de con 10 s entre medias.
- **El peso del guiado se ve siempre igual.** Al entrar en la serie y al escribirlo salía «30»,
  pero tocar − o + y cambiar las series lo reescribían como «30 kg». Queda solo el número en los
  cuatro caminos (`pintaW()`), y sale la regla CSS de la unidad, que solo usaban esos dos.
- **Pruebas**: las dos que estaban omitidas pasan a ser normales (la del peso corre ahora en los
  tres juegos de datos, no solo en el del gimnasio), y se añaden el descanso 0 en aguantes por lado
  y en ejercicios propios, el descanso del programa sin cambios, los minutos estimados con
  descanso 0, la serie siguiente sin pantalla de descanso en el guiado, y el formato del peso al
  pintar, con − y +, al escribirlo y al cambiar las series.

Los ejercicios ligeros vuelven a subir de peso. Por debajo de 25 kg la progresión sin lista de
mancuernas se quedaba pidiendo más repeticiones para siempre.

- **El 10 % decide cuándo se sube, no si se sube.** `loadStep` devolvía 0 cuando el salto pasaba
  del 10 % del peso de trabajo, y por debajo de 25 kg siempre pasa (1 kg sobre 8 es un 12,5 %;
  2,5 sobre 22, un 11 %). `todayTarget` estiraba el rango a tope+2 y, al llenarlo, lo volvía a
  estirar. Ahora `loadStep` es el salto sin corte (la tabla de `progStep`: 1, 2 o 2,5 kg) y la
  regla, con el rango lleno y todas las series hechas, es:
  - salto de hasta el 10 % (25 kg o más): se sube y se vuelve al mínimo, como antes;
  - salto mayor: primero se estira a tope+2 («estira el rango a 22 reps») y, cuando **todas**
    las series llegan a tope+2, se sube y se vuelve al mínimo: «Llegaste a 22 reps: sube a 9 kg
    y vuelve a 12».

  Es la regla que ya seguía la lista de mancuernas de v35, que no cambia.
- **Con `pesosDB` declarado manda la lista, también en lo que no es «de mancuerna».** En las
  rutinas de casa todo lo que lleva carga se hace con esas mancuernas: sentarse con una al pecho
  (`eq` silla), la zancada (sin aparato) y los gemelos (máquina en el gimnasio). Con la regla de
  arriba a secas caían en el salto teórico y, de 3 kg con una lista 1-2-3, proponían 4 (en v35
  solo estiraban). Ahora
  `availDB(id,k)` les da la lista cuando `k` es de casa, y el salto es a la siguiente que existe:
  de 1 a 2 tras tope+2, y con la de 3, la más pesada, se estira («Ya usas tu mancuerna más
  pesada»). Sin peso todavía, al llenar el rango se coge la más ligera de la lista. Fuera de casa
  los gemelos siguen siendo de máquina y siguen el salto teórico; los botones −/+ del guiado y la
  aproximación llaman a `availDB` sin rutina y no cambian.
- **Un peso guardado como texto ya no se concatena.** Importar comprueba que `rp_logs` sea un
  objeto, no el tipo de cada `w`, así que una copia editada a mano puede traer `"8"`: sumaba
  `"8"+1` = 81 kg, y con la lista proponía bajar a la de 6. `todayTarget` lo pasa a número.
- **Lo que no cambia:** la primera vez, la molestia anotada (congela aunque tope+2 esté lleno),
  el ejercicio que aún va sin peso (de 0 kg sube a 1, como antes; con lista, a la más ligera) y
  las series de menos (no sube). Sin claves nuevas ni cambios en la forma de `rp_logs`.
- **Riesgo conocido:** sin lista, el salto es teórico y una máquina puede no tener ese peso en
  su placa. Se corrige a mano en el guiado; el salto real de cada máquina (punto 1 de la
  comparación con apps líderes) lo cierra el chip «Salto», justo debajo.
- **Pruebas** en `tests/pruebas_logica.js`: 8 kg en el tope y en tope+2, 22 kg que sube a 24,5,
  40 kg y el borde de 25 kg que suben directo, la rama de `pesosDB` contra lo que devolvía v35,
  primera vez y molestia idénticas, una mancuerna de 3 kg sin lista (sube a 4) y con lista
  (manda la lista), sentarse, zancada y gemelos en casa con la lista (de 3 kg no proponen 4;
  todo ejercicio con carga de casa, de 0 a 3 kg, solo propone pesos de la lista), los gemelos
  del gimnasio con salto teórico, pesos guardados como texto, el guiado mostrando «sube a
  9 kg», y los juegos de datos de v35 sin escrituras ni claves nuevas.

Pesos que existen en cada máquina:

- **Salto de placa por máquina** (chip «Salto» del guiado, `rp_inc`). La propuesta sumaba 2,5 kg
  (1 o 2 por debajo de 20) aunque la polea fuera de 5 en 5: decía 42,5 donde solo hay 40 y 45, y
  había que corregirlo a mano cada vez. Ahora el salto se dice una vez por ejercicio y los
  pesos que existen son sus múltiplos:
  - `todayTarget` aplica sobre esos múltiplos la regla de las mancuernas: salto suave (≤10 %) se
    sube al llenar el rango; salto grande, primero el rango estirado (+2 reps) y después el peso.
    Con 40 kg en saltos de 5 (12,5 %): 40 × 14 y luego 45. Nunca 42,5.
  - Los −/+ van al múltiplo siguiente o anterior; un 42,5 tecleado sube a 45 y baja a 40.
  - La aproximación redondea **hacia abajo** a un múltiplo (60 kg en saltos de 5: 30 y 40), nunca
    por debajo de una placa. La primera vez, el peso de arranque también; `startKg:0` sigue sin peso.
  - Lo tecleado no se redondea, ni al cambiar el salto después.
  - Un solo sitio dice el salto: `stepFor(id,w)`, el declarado o el de siempre; `roundDownTo(id,w)`
    da el peso real de abajo. Con mancuernas en Ajustes manda la lista y el chip no sale.
  - Con los ligeros que vuelven a subir (arriba): en casa con la lista, lo que lleva carga se hace
    con mancuernas y manda la lista aunque el ejercicio tenga salto de máquina guardado. Los
    gemelos son de máquina en el gimnasio (allí su salto manda) y de mancuerna en casa (allí ni
    chip ni salto: la propuesta, la primera vez, los −/+ y la aproximación quedan como sin
    `rp_inc`). Por eso `incFor`, `stepFor`, `roundDownTo` y `nextW` aceptan la rutina, igual que
    `availDB(id,k)`.
  - Sin `rp_inc` (datos de v35) todo sigue igual. Clave nueva y sin migración: si falta es `{}`.
    Viaja en la copia por prefijo, e importar exige que sea un objeto.
  - **Pruebas** en `tests/pruebas_logica.js` (propuesta, −/+, aproximación, primera vez, datos de
    v35; en casa con la lista, un salto guardado en cada ejercicio con carga no cambia nada, y los
    gemelos siguen su salto en el gimnasio), `pruebas_pantallas.js` (dónde sale el chip, elegir y
    quitar, lo tecleado se guarda tal cual, gemelos en el gimnasio y en casa) y
    `pruebas_datos.js` (ida y vuelta de la copia con `rp_inc`, copia con otra forma).

Una sola racha en toda la app:

- **Una sola racha: semanas cumplidas** (HU-11). Inicio contaba semanas cumplidas, pero la
  pantalla de fin y «Listo por hoy» enseñaban la llama con «N días seguidos» y Progreso decía
  «Racha de N días»: dos rachas que se contradecían en la misma sesión. Ahora todas salen de
  `weekStats()` (§12): la pantalla de fin cambia la llama por el anillo de Inicio con «Esta semana:
  N de M» y, en la sesión que cumple la meta (solo en esa), «Semana cumplida · R seguidas»;
  «Listo por hoy» y «Tu historial» dicen «R semanas cumplidas · mejor M», y Ajustes «racha R
  semanas». La semana en curso suma en cuanto se cumple. Con objetivo salud, Inicio añade
  «Postura: N de 7 días esta semana» (§8). `rp_streak` se sigue escribiendo igual
  (`completeDay`, `recalcStreak`) y su total es el de «N sesiones en total»: sin claves nuevas ni
  migración.
  - **La mejor racha se partía en los cambios de hora.** `weekStats()` ya calculaba `mejor`, pero
    no se veía; al enseñarlo salió que juntaba semanas restando milisegundos entre lunes, y con un
    cambio de hora en medio daba 7 días ± 1 h: seis semanas seguidas de marzo y abril salían como
    «mejor 3» en Madrid. Ahora compara fechas, como la racha. En CI no se veía porque el navegador
    corre en UTC: `app.enZona(zona, fn, ahora)` emula una zona IANA y fija el reloj.
  - Con la letra grande a 320 px, «N de M» baja entera a la línea de abajo en vez de partirse.
    La prueba vuelve a poner delante la pantalla de fin antes de medir: escondida mide 0 y
    pasaba también con el CSS de antes.
  - **Sin «mejor 0» ni «1 sesiones».** Sin ninguna semana cumplida —la primera sesión, o
    quien aún no llega a la meta— la pantalla de fin decía «Mejor racha: 0 semanas» y «Listo por
    hoy» y «Tu historial» «· mejor 0». Ahora «mejor» sale solo cuando hay alguna (§12). Ajustes y
    «Tu historial» usan `plural()` en las sesiones y las series: «Guardado: 1 sesión», «1 serie
    registrada».
  - Pruebas en `pruebas_pantallas.js` (los dos juegos de datos, la sesión que cumple la semana,
    las que vienen después, la primera sesión con `Fixtures.vacio`, la línea de postura, la
    pantalla de fin a 320 px y la mejor racha en pantalla en Madrid y Santiago con cifras
    contadas a mano) y `pruebas_datos.js` (`rp_streak`,
    copia de ida y vuelta, datos de v35 sin meta congelada en las semanas viejas, y la racha que
    cruza los cambios de hora de Europa, EE. UU., Chile y Australia, con `Fixtures.cambioHora`).

Un toque, una serie:

- **Un doble toque no duplica la serie.** «Registrar serie» se convierte en visto 300 ms antes
  del descanso, pero seguía aceptando toques: uno de más en esa ventana, frecuente con prisa o
  con guantes, metía otra serie igual en la sesión —y al finalizar, en `rp_logs`, con su volumen
  y su recuento— y lanzaba `afterAction` dos veces: en la última serie de un ejercicio, eso se
  saltaba la primera del siguiente. El récord ya salía una sola vez, porque la copia no supera a
  la original. Ahora el botón queda deshabilitado y sin `pointer-events` mientras confirma, y
  `logSet` admite una serie por paso pintado (`renderStep` abre el candado) y nunca dos a menos
  de 300 ms, con reloj monótono. Esto último es para «reducir movimiento»: sin confirmación y sin
  descanso detrás, el ejercicio siguiente se pinta en el acto y el segundo toque caía en su botón.
  Sin claves nuevas ni cambio de forma: la copia va y vuelve igual. Pruebas en
  `tests/pruebas_datos.js` («Doble toque en «Registrar serie»»), con y sin reducir movimiento.
  Queda abierto «Serie completada», el botón de los ejercicios que no se registran: no anota
  nada, pero un doble toque sin descanso detrás todavía puede saltarse un paso.

Mirar otra rutina no cierra la que está a medias. Con Empuje a medias, tocar una fila, su play o
su visto en Tirón cerraba Empuje sola (`startSess` → `finishSession` «auto») y la guardaba como
terminada sin preguntar; y entrar al guiado solo para mirar ya creaba `rp_session`.

- **La sesión nace con lo primero que se registra** (`ensureSess`): la primera serie, el primer
  visto o el temporizador, no la entrada. `startRoutine` ya no llama a `startSess`, y `touchSess`
  sin series en memoria solo pone al día la que ya hubiera: salir del guiado, pasar de ejercicio o
  cambiar las series no la crean. `ensureSess` nunca cierra la de otra rutina a medias hoy.
- **Hoja de conflicto** en `#planov` (§8). `sessConflict(k)` solo lee: mira la `rp_session` de
  hoy de otra rutina con algo hecho y la que solo vive en memoria porque no cupo. La abren
  `startRoutine` (fila, figura, play, Empezar) y `toggleCheck` al marcar. «Guardar y empezar» es
  el único sitio que cierra una sesión a medias de hoy para empezar otra
  (`finishSession(o,"switch")`); la rama «auto» queda para las de otros días.
- **Teléfono lleno al guardar:** sale el aviso de siempre («…sigue abierta sin guardar. Libera
  espacio y finalízala») y las dos quedan como estaban. Si la otra está entera en `rp_session`, se
  sigue a la nueva solo en memoria, como hasta ahora, y mientras esta tenga series no se vuelve a
  preguntar: cada serie reintenta guardar la otra, que ya se eligió guardar. Si la otra tiene
  series que solo viven en memoria, la hoja se queda, porque cambiar de rutina las perdería.
- **Las de otros días no cambian:** no abren la hoja, se rescatan al abrir con «Entrenamiento sin
  cerrar» y, si se dejan para luego, se guardan con su fecha al entrar al guiado o al primer
  visto, como antes. Mezcladas con lo de hoy pasarían por de hoy.
- **Sin claves nuevas ni cambios de forma:** `rp_session` es la misma, solo nace más tarde. De
  paso, un récord se apunta solo en la sesión de su rutina (`markPR`) y al recargar en el guiado el
  paso guardado solo se usa si es de esa rutina: con dos sesiones vivas (la que no cupo y la nueva)
  se cruzaban. Y como un visto ya crea la sesión, la que nace en el mismo milisegundo en que se
  cerró otra lleva un `startedAt` posterior al de aquella: es lo que `finishSession` usa para no
  guardar dos veces la misma, y con el mismo daba la nueva por ya guardada.
- **Pruebas** en `tests/pruebas_datos.js` con el juego `aMedias` (Empuje 3 de 14): cada toque abre
  la hoja sin escribir nada, la hoja sin opción destructiva, volver, guardar y empezar en 2 toques
  (por el play y por el visto), teléfono lleno con la otra entera en disco y con series solo en
  memoria, recarga en mitad del conflicto, mirar el guiado sin registrar, qué crea la sesión, y la
  de ayer sin cerrar. Tres pruebas que daban por hecho que entrar creaba la sesión o que empezar
  otra la cerraba sola conservan sus aserciones y añaden el paso que ahora hace falta: salir del
  guiado y volver pasa por el primer visto; la otra sesión sin cerrar y el recorrido de pantallas
  con una rutina de casa a medias, por la hoja.

Los ejercicios que faltan, antes de cerrar:

- **Aviso de lo que falta antes de cerrar** (HU-09, idea de RP Hypertrophy, Fitbod y Hevy).
  Llegar al final del guiado cerraba la sesión como «Completada» aunque faltaran ejercicios:
  empezar por el cuarto dejaba los tres primeros sin hacer y sin aviso. Ahora el final
  (`advance` y `guidedSkipExercise` → `alFinal`) cuenta los pendientes —sin series hoy, sin
  visto y sin saltar a propósito— y, si hay alguno, pregunta: «Hacerlos ahora» o «Terminar así».
  Las reglas, en §8 Modo guiado y §12.
  - `rp_session` gana dos listas **opcionales**: `saltados` (lo que se saltó con «Saltar
    ejercicio») y `repaso` (los pendientes que se están haciendo tras el aviso). Sin ellas —una
    sesión de v35— son listas vacías, así que no hace falta migración, y sin usarlas la sesión se
    guarda igual que en v35. Siguen la regla de la memoria: viven junto a `sessionLog` y la
    memoria manda. Viajan en la copia de seguridad y el guiado retoma en el mismo paso y en el
    mismo orden. Con HU-63 saltar o llegar al aviso no crean la sesión, porque no registran
    nada: las dos listas viven en memoria y entran en `rp_session` cuando nace, con el primer
    visto o la primera serie. Si no se registró nada, no hay sesión que dejar abierta.
  - «Terminar así» llama a lo mismo que antes (`finishSession`): series, vistos, racha e
    historial se escriben igual. Lo único nuevo es el texto y el anillo de la pantalla final.
  - Con pendientes y nada hecho, «Terminar así» no guarda nada y lo dice («Nada nuevo que
    guardar»), en vez del «Completada» vacío de antes.
  - Pruebas en `tests/pruebas_logica.js` (aviso, repaso, terminar así, saltados y el final sin
    pendientes), `tests/pruebas_datos.js` (ida y vuelta con el repaso a medias) y
    `tests/pruebas_pantallas.js` (sesiones de v35 de los juegos `madre` y `sinCerrar`). Tres
    pruebas de teléfono lleno esperaban «Completada» al reintentar con casi todo sin hacer;
    ahora esperan «Guardada · X de Y» con lo hecho (1 de 14, 2 de 14 y 1 de 12), que es justo
    lo que esta historia cambia. La de 2 de 14 cuenta también el visto con el que HU-63 hace
    nacer la sesión.

### Cerrado en v35

- **Corregir series pasadas desde Historial.** Botón «Corregir» en cada ejercicio del día:
  cambiar kg y repeticiones, quitar una serie o borrar el registro entero. Se edita `rp_logs` en
  su sitio, así que récords, 1RM e índice de fuerza se recalculan solos.
- **Fechas `AAAA-MM-DD` a medianoche local** (`dlocal`). En UTC−5 el pesaje de hoy no entraba en
  la media de 7 días y las series del domingo se salían de su semana en «punto débil».
- **La meta de cada semana se congela** en `rp_weekgoal` mientras la semana está viva. Cambiar de
  3 a 4 días ya no vuelve incumplidas las semanas viejas.
- **Racha al cerrar una sesión de ayer:** se recalcula (`recalcStreak`) en vez de quedarse corta.
- **Descartar un rescate** lee la sesión antes de borrarla: ya no limpia los vistos de hoy.
- **Importar valida y deshace:** cada valor tiene que ser JSON válido, y si el teléfono se queda
  sin espacio a mitad, vuelve a los datos anteriores enteros.
- **Service worker:** no guarda respuestas de error encima de la copia buena, y `figuras.js` se
  guarda en la primera descarga buena si falló en la instalación. `CACHE` sigue en v33 a
  propósito: subirla obligaría a todos a bajar otra vez los 2 MB de figuras.
- **Exportar en el teléfono abre el menú de compartir** (Drive, chat, Archivos) si el navegador
  lo permite; en escritorio sigue la descarga. Cancelar no cuenta como copia hecha.
- **Aviso de copia de seguridad** en Inicio (≥5 sesiones y 14 días sin exportar) y «Última
  copia: hace N días» en Ajustes. `rp_lastexport`.
- **Objetivo por teléfono** en Ajustes: «Ganar músculo» (`MUSCGOAL`) o «Salud y mantenimiento»
  (`MUSCGOAL_SALUD`, ~⅓ del volumen). Resuelve las barras siempre bajas en el teléfono de la madre.
- **Nota fija por ejercicio** (`rp_notes`) en el guiado: ajuste de máquina, agarre. Reaparece
  cada vez que sale ese ejercicio.
- **Mancuernas que tienes** (Ajustes, `rp_prefs.pesosDB`). Con 1-2-3 kg cualquier salto pasa del
  10 % y `loadStep` no dejaba subir nunca: estiraba el rango para siempre. Con lista, solo se
  sugieren pesos reales: salto suave (≤10 %) se sube al llenar el rango; salto grande, al llenar
  el rango estirado (+2 reps); con la más pesada, se estira. Sin lista, nada cambia (gimnasio).
  Los botones −/+ del peso saltan a la mancuerna anterior/siguiente que existe.
- **Molestia articular** (`rp_pain`, idea de RP Hypertrophy): un toque en el guiado anota la
  fecha. Si la última sesión la tiene, `todayTarget` congela peso y reps; dos en 28 días →
  sugiere cambiar el ejercicio. Pensado para el manguito rotador.
- **Series de aproximación** en el primer ejercicio con carga de la rutina, antes de la primera
  serie: 1×10 al 50 % y 1×5 al 70 % del peso de hoy, redondeado a pesos reales. No se registran.
- **Repeticiones en reserva por serie**, opcional, en el guiado: «¿Cuántas más podías?» 0/1/2/3+.
  Se guarda como `rir` dentro de la serie y se ve en la línea de la serie. Aún no mueve la progresión.
- **Resumen del mes** arriba en Progreso: sesiones, series, kg levantados y récords, contra los
  MISMOS días del mes anterior (1-23 contra 1-23; un mes a medias contra uno entero siempre sale en rojo).
- **Borrar una sesión entera** desde Historial: la entrada y sus series de ese día (casadas por el
  sello de inicio `r.t`, o por rutina y fecha si no lo hay). Recalcula la racha.
- **Quitar pesajes** desde Progreso («Ver y corregir pesajes», los últimos 10): un 800 en vez de
  80 descuadraba la media de 7 días.
- **Medidas corporales** en Progreso (`rp_medidas`): cintura, brazo, pecho, muslo, cadera, con el
  cambio desde la primera. El texto de ayuda cambia con el objetivo.
- **El ritmo de peso respeta el objetivo:** con «Salud y mantenimiento», peso estable es el éxito;
  antes le decía a la madre «vas lento para ganar masa».
- La **nota fija y la molestia van fuera de «Cómo se hace»**: ese bloque se pliega tras tres
  sesiones y habría escondido la nota justo cuando más sirve.

### Cerrado en v34

- **Agregar ejercicios a cualquier rutina.** Botón «Agregar ejercicio» al pie de la rutina:
  buscador sobre el catálogo completo y «Crear ejercicio propio» (nombre, cómo se cuenta,
  series, repeticiones o segundos, descanso, si lleva peso, músculo principal, aparato y pasos).
  Los propios viven en `rp_custom` con id `u_…` y al arrancar se funden en `EX`, `ZONAS` y
  `MUSC`, así que dosis, registro de series, sugerencia de carga, series por músculo y mapa
  corporal los tratan como uno más. Entran por `rp_extras`, el mismo camino que un opcional
  agregado, con chips Quitar y Editar. Borrar es suave (`del:true`): el historial conserva el
  nombre. Etiqueta `propio` → «Tuyo».
- **La copia exporta por prefijo `rp_`**, igual que importar y borrar. La lista fija de 14
  claves habría dejado fuera `rp_custom` sin avisar.
- **Topes de historial**: `rp_history` de 200 a 2.000 sesiones (`HISTMAX`) y `rp_logs` de 150 a
  1.000 registros por ejercicio (`LOGMAX`). Con 200 se borraba sin avisar lo de hace ~5 meses.
- **`navigator.storage.persist()`** al arrancar, para que el navegador no vacíe los datos si
  el teléfono se queda sin espacio.

### Cerrado en v33

- ~~El fotograma del medio parpadeaba.~~ Venía **dibujado con más trazo** que sus dos hermanos
  —medido: hasta 4× en `push-up`— y el ciclo lo enseña dos veces por repetición, así que la figura
  daba un golpe de tinta en cada rep. Afectaba a **38 de 67**. Se corrigió adelgazando cada
  fotograma con un trazo del color del fondo, con el ancho sacado de una bisección contando
  píxeles. De hasta 4× de diferencia a **1,20 en el peor caso y 1,03 de mediana**.
- ~~Once no se podían igualar sin comerse el dibujo.~~ Esos se animan con **dos fotogramas**, el
  primero y el último, y se descarta el grueso del medio. Sus dos extremos son posturas buenas, así
  que la repetición se sigue entendiendo.
- ~~El panel enseñaba el gesto o el músculo, nunca los dos.~~ Ahora enseña los dos: figura
  animada y, más pequeño, el mapa con su etiqueta de lado. §15.
- ~~El busto de cuello y cara estaba mal.~~ La cabeza se comía el 48 % del dibujo y los hombros
  leían como una colina; el trapecio era una cúpula que tapaba el busto, y el elevador y el rostro
  se salían del cuerpo. Redibujado: cabeza al 42 %, hombros de borde a borde, y las cuatro regiones
  rehechas sobre rasgos reales del dibujo. Las nueve pintan a 46 px.
- ~~22 controles fuera del teclado y 14 familias de botón por debajo de 44 px.~~ §10.
- ~~Diez `alert()` del navegador.~~ Pasan al `toast()` propio.
- ~~«Sin horas aún.»~~ Incumplía §9, que prohíbe el «sin datos» a secas. Ahora dice qué hacer.
- ~~`DISENO` citaba `.qbox`, que no existe en el CSS, y `.exgroup` donde la regla usa `.ex`.~~ §6.

### Cerrado en v32

- ~~Dibujar a una persona haciendo el ejercicio.~~ Se intentó **tres veces** —SVG a mano, redibujo
  paramétrico 2D y maniquí articulado en three.js— y las tres fracasaron. En v32 se retiró la
  figura en pose y entró **el mapa corporal** (§15). El razonamiento está en §14, porque esto no
  es una tarea aplazada: es una decisión.
- ~~`EX[id].coach` llevaba versiones escrito y oculto.~~ 81 de los 91 ejercicios tenían una frase
  de entrenador —*"El peso no debe balancearse: es el core el que trabaja"*— y **no se mostraba en
  ninguna parte**. Ahora ocupa el sitio de la tira de fotogramas, en la `.coachtip` que §6
  documentaba desde hacía seis versiones sin que existiera en el CSS.
  Al empezar a mostrarla se descubrió que una de las 81 no le hablaba al usuario: la de
  `remo_inclinado` era una nota de dosificación para el desarrollador. Pasó a ser un comentario,
  que es donde vivía su información.
- ~~La etiqueta de zona solo salía en 55 de los 91.~~ `zonaTexto()` cae al nombre de la región
  primaria cuando `ZONA` no trae frase escrita a mano, así que ahora sale en los 91 sin inventar
  una palabra.
- ~~La app dependía de 875 KB de JavaScript externo.~~ No queda ninguno: todo vive en
  `index.html`, que ya iba *network-first*. **La clase de fallo que quemó seis rondas —el service
  worker sirviendo figuras congeladas— dejó de ser posible**, no por disciplina sino porque no hay
  archivo que congelar.
- ~~GPL-3.0 por contagio.~~ La licencia solo existía porque mannequin.js lo es. Sin él, `LICENSE`
  vuelve a ser MIT sobre código propio. Las ilustraciones sí son de otro y van con su crédito:
  CC BY-SA 4.0, en `LICENSE` y en Ajustes.
- ~~Las figuras no se movían.~~ 69 de los 91 muestran ahora una ilustración de tres fotogramas en
  corte seco, con el ritmo sacado del `type`. Los 22 restantes —los 12 de cuello y cara, y diez
  drills propios de esta rutina— no existen en ningún catálogo y se quedan con el mapa. Es el
  único punto donde la app enseña dos cosas distintas según el ejercicio, y se asume: la
  alternativa era volver a dibujar, que ya falló tres veces.

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
- **Volver a DIBUJAR nosotros una persona haciendo el ejercicio.** Tres intentos, tres fracasos, y
  el tercero con validador de diez comprobaciones y trece arquetipos. La salida no fue dibujar
  mejor: fue licenciar figuras ya dibujadas (§15). Un cuarto motor propio de figuras está fuera de
  alcance, sea 2D, 3D o paramétrico. Si a un ejercicio le falta ilustración, las opciones son
  buscarla en un catálogo abierto o dejar el mapa — **no dibujarla**.
- **Animar el mapa corporal.** El movimiento lo llevan las ilustraciones. El mapa es geometría
  estática y ahí se queda: su valor es justamente que no tiene nada que pueda salir mal.
- **Mecánicas de gamificación competitivas:** tablas de clasificación, comparación con otros,
  puntos canjeables e insignias por presentarse. Para un usuario único no tienen sentido, y los
  leaderboards son el elemento más asociado a efectos motivacionales negativos.

---

## 15. La figura

Son **dos sistemas, y cada uno hace el trabajo de su tamaño**:

| Dónde | Qué se ve | Cómo |
|---|---|---|
| **46 px**, filas de la lista | La ilustración, **quieta** | El mapa solo aparece en los 21 que no tienen ilustración |
| **76 px**, fila «siguiente» | La ilustración, **animada** | Es la única fila que destaca en toda la pantalla, y la única que se mueve |
| **196 px**, «Cómo se hace» | La ilustración animada **y** el mapa, más pequeño, con su etiqueta de lado | Por fuera y por dentro a la vez |

En la lista la figura va **engordada 0,7 px**. A 46 px la caja útil son 36, y una figura vertical
—extensión de tríceps en polea, encogimientos— se queda en **13 px de ancho**: no es que sea
pequeña de más, es que a ese tamaño el trazo fino se desvanece y queda un garabato pálido. Se
puede engordar precisamente porque una figura quieta no lleva el adelgazado, y el trazo no escala
con el `viewBox`, así que 0,7 son 0,7 píxeles de pantalla en todos los ejercicios. Medido contra
1,2, que ya rellena el dibujo por dentro.

En la lista se mueve **una sola figura**, la de la fila siguiente. No es tacañería de
rendimiento —se midió: catorce figuras se pintan en 34 ms— sino que catorce muñecos moviéndose a
la vez es justo el ruido que la app lleva evitando desde v26, cuando la fila dejó de desplegar
nada. Y una figura quieta **no lleva el adelgazado**: ese existe solo para igualar los fotogramas
de una animación, así que a 46 px la ilustración recupera su tinta entera, que es lo que la hace
visible a ese tamaño.

El mapa vive en la constante `MAPA` dentro de `index.html`, y lo montan `zonaSVG(id,tam)` y
`panelZona(id)`; las ilustraciones, en `figuras.js`, y las monta `figuraAnim(id,parada)`. En la
lista decide `figuraFila(id,esSiguiente)`: manda el muñeco y el mapa solo entra donde no hay
ilustración.

### Por qué las figuras no las dibujamos nosotros

Se intentó tres veces: SVG a mano con dos fotogramas fundidos (477 KB), redibujo paramétrico 2D, y
un maniquí articulado sobre three.js con validador de diez comprobaciones y trece arquetipos. Las
tres se retiraron, y la tercera después de que el usuario mirara el resultado y dijera que no
funcionaba.

**La cuarta no fue dibujar mejor: fue dejar de dibujar.** Las figuras son de
[workout-guide](https://github.com/bryllim/workout-guide) (Bryl Lim, derivadas de Everkinetic),
CC BY-SA 4.0, con crédito en Ajustes y en `LICENSE`. Cubren 69 de los 91: los 12 de cuello y cara
y diez drills propios de esta rutina no existen en ningún catálogo, y ahí el panel de 172 px cae
al mapa. Cuestan 650 KB comprimidos, y el apartado del peso lo dice sin adornos.

El mapa cubre los 91 sin excepción, porque es geometría plana: no tiene forma de quedar mal. Por
eso es el suplente en la lista y el acompañante en la ficha, y por eso los 21 sin ilustración no
se quedan nunca con un hueco.

### Cómo está construido el mapa

- **La silueta son primitivas sueltas** —elipses, rectángulos, dos rutas— que se funden solas al
  compartir relleno. Corregir la postura de un brazo es mover un rectángulo, no reescribir una
  ruta de 400 caracteres.
- **Las mismas primitivas forman el `<clipPath>`**, así que una región **no puede** desbordar el
  cuerpo por mucho que se equivoque su rectángulo. Es geométricamente imposible, no una
  precaución. Por eso las regiones se dibujan burdas: el recorte les da el borde exacto.
- **Solo se escribe el lado derecho**; `refleja()` genera el izquierdo. Ninguna región puede
  quedarse coja de un lado por descuido.
- **Dos pasadas para el contorno.** La primera dibuja las piezas con un trazo grueso del color del
  borde —eso da la unión dilatada—, la segunda las rellena encima y tapa el interior. Sin esto se
  veía la costura de cada primitiva y el cuerpo parecía un muñeco articulado de juguete.
- **El trazo no escala** (`vector-effect:non-scaling-stroke`). Así un mismo grosor sirve para el
  cuerpo (viewBox 46×100) y para el busto (50×64), y el reborde pesa proporcionalmente más a 46 px,
  que es justo donde hace falta.

**Dos trampas que costaron una tarde cada una, y que no se ven mirando:**

1. **`<clipPath>` ignora los `<g>` en silencio.** Solo admite formas, `<text>` y `<use>`. El espejo
   estaba envuelto en un grupo, así que el recorte se quedaba sin medio cuerpo y **todas** las
   regiones simétricas salían cojas de un lado. En el DOM se veía perfecto —los dos rectángulos
   ahí, azules, en su sitio— y solo lo cazó muestrear los píxeles del render. El espejo va forma a
   forma, componiendo el `transform`.
2. **Un `id` de recorte fijo colisiona.** Con catorce mapas en una lista, todos los `url(#…)`
   resolvían al primer `clipPath` del documento. Lleva contador.

### Las regiones

22 en el cuerpo y 9 en el busto. El vocabulario es **a propósito más grueso que el de `MUSC`**,
que separa las tres cabezas del deltoides: `MUSC` alimenta el gráfico de series por músculo y
cubre solo el trabajo con carga; `ZONAS` alimenta un dibujo de 46 px y cubre los 91. **Ninguno se
deriva del otro**, y si algún día se intenta fundirlos el que se corrompe es el gráfico. Viven a
1.500 líneas de distancia justamente por eso.

- *Frente:* `cuello trapecio_cuello delt_lateral delt_anterior pecho biceps antebrazo core
  flexor_cadera cuadriceps aductores gemelo`
- *Espalda:* `cuello trapecio_cuello delt_posterior espalda triceps antebrazo lumbar gluteo
  isquios gemelo`
- *Busto:* `cervical_post cervical_ant cervical_lat trapecio_sup elevador mandibula platisma
  lengua rostro`

Un mapa de zona no distingue «lo fortalece» de «lo estira», y no le hace falta: el `tag`
(`calent` / `carga` / `diario`) ya está en la fila y el `coach` lo dice con palabras.

### El busto, de perfil

Los 12 ejercicios de cuello y cara usan una segunda silueta: cabeza, cuello y hombros **de
perfil**. La primera versión estaba mal y se rehízo en v33: la cabeza se comía el 48 % del dibujo
y los hombros, de 45 unidades en un marco de 64, leían como una colina. Ahora la cabeza es el 42 %
y los hombros llegan de borde a borde, que es lo que los hace leer como hombros. Con ellos se
rehicieron cuatro regiones que estaban mal apoyadas: el trapecio era una cúpula que tapaba el
busto y pasó a ser una banda por el filo del hombro; el elevador bajaba por fuera y ahora va por
dentro; la mandíbula flotaba y ahora se apoya en el filo real de la cara; y el rostro desbordaba
el perfil. Las tres bandas del cuello se ensancharon a 7 unidades porque con 6 quedaban en
astillas de un píxel a 46 px. No es un capricho. Es la única vista donde se leen a la vez la nuca, la garganta, la
mandíbula y —para `mewing_lengua`— la lengua contra el paladar, que de frente sencillamente no
existe. Sin ojos: la mandíbula no inquieta, los ojos sí.

Esto resuelve además lo que el sistema anterior admitía por escrito como irresoluble («son gestos
DENTRO de la cara, que este maniquí no tiene»): un mapa **sí** puede señalar la zona de un gesto
que no puede representar.

### La tinta

Tres tonos y ni uno más, en cuatro reglas de CSS:

| | Color |
|---|---|
| Silueta | relleno `--diagram-line`, contorno `--diagram-ink-far` |
| Zona **primaria** | `--diagram-hi` |
| Zona **secundaria** | `--diagram-hi` al 45 % |

**Qué región se enciende lo decide el JS** —solo emite las encendidas—; el CSS solo pone color.
Por eso cambiar de tema no toca una línea de JavaScript.

### Los tres tamaños

| Sitio | Qué se pinta |
|---|---|
| **46 px**, filas | Una sola vista, sin secundarias: dos tonos en 36 px útiles no se distinguen |
| **76 px**, fila «siguiente» | Una sola vista, con secundarias |
| **172 px**, «Cómo se hace» | **Las dos vistas**, con la zona, las secundarias y el aparato a la izquierda |

Las dos vistas solo caben a 172 px: en una caja de 76 con su relleno, un viewBox de 102 de ancho
deja la figura en 32 px de alto. La vista se **deduce** del lado al que pertenece la región
primaria; `ZONAS[id].v` solo aparece donde hay que forzarla (gemelo y trapecio se leen mejor por
detrás).

### El panel de 196 px: por fuera y por dentro

**Tres piezas**: a la izquierda qué músculo, qué secundarios y con qué aparato; en el centro la
figura **haciendo** el ejercicio; a la derecha, más pequeño y con su etiqueta de lado, el mapa que
dice **dónde se nota**. Son dos dibujos con dos trabajos distintos, y por eso ninguno sustituye al
otro. Debajo van el consejo, los pasos y el vídeo.

El reparto está calculado y suma exacto sobre los 307 px útiles (343 menos el relleno):
`112 texto + 12 + 123 figura + 12 + 48 mapa`. El mapa de apoyo va de **una sola silueta**: con dos
haría falta una columna de 98 px y le comería el 41 % a la figura; metidas a la fuerza en 48, cada
cuerpo bajaría a 21 px, la mitad del sello que ya se retiró por ilegible. Lo que se pierde al
enseñar una vista —por qué lado estás mirando— lo dice la etiqueta, que cuesta 15 px de alto en
vez de 52 de ancho.

El panel subió de 172 a 196 px porque esos 60 px del mapa no podían salir solo del ancho: sacados
de ahí, `bird-dog` caía a 97 px de alto, **menos de los 109 que tenía sin mapa**. Y hay dos
excepciones, las dos decididas con datos que ya existían:

- **`gancha`** — las 17 cajas más anchas que altas (tumbados, cuadrupedia, prensa): el texto sube a
  su propia fila y la figura cobra el ancho entero. `glute-bridge` gana un 44 %. El corte en
  «más ancha que alta» no es redondo por gusto: es donde las dos maquetas empatan.
- **`solomapa`** — los 21 sin ilustración: el mapa **es** la figura, sale a dos vistas y se queda
  el hueco entero. Añadirle además un mapa chico sí sería decir dos veces lo mismo.

El precio asumido: diez ejercicios casi cuadrados pierden entre un 7 y un 16 % de alto de figura.
Es la forma que peor encaja en cualquiera de las dos maquetas. Repararlo costaría subir el panel a
216 px, y no compensa.

### El movimiento

**Corte seco entre tres fotogramas, nunca un fundido.** El fundido es exactamente lo que hundió el
sistema viejo: a mitad de ciclo se veían dos cuerpos fantasma superpuestos. `steps(1,end)` no
mezcla dos fotogramas jamás. Es CSS puro, sin temporizador en JS, como pide §7: tres `<path>`
apilados y tres `@keyframes` que se turnan la opacidad.

El ciclo va **1-2-3-2**, porque una repetición va y vuelve. El ritmo sale del `type` que cada
ejercicio ya tenía: 2,4 s en `reps`, 1,5 s en `cardio`, y **quieto en los `hold`** — un sostén no
se mueve, y fingir que sí sería mentir sobre el ejercicio.

**El trazo se normaliza, porque venía desigual.** El fotograma del medio está dibujado con más
tinta que sus hermanos —hasta 4× en `push-up`— y el ciclo lo enseña dos veces por repetición, así
que daba un golpe visible en cada rep. Pasaba en **38 de 67**. Se corrige adelgazando: un `stroke`
del color del fondo se pinta encima del relleno y le come la mitad de su ancho hacia dentro,
mientras la mitad de fuera cae sobre el fondo y no se ve. El ancho de cada fotograma sale de una
bisección contando píxeles hasta igualar al más fino, con tope de 4 unidades y una salvaguarda: si
adelgazar deja el dibujo por debajo del 70 % del objetivo es que se está comiendo detalle, y
entonces se deja como estaba. Resultado: de 4× a **1,20 en el peor caso, 1,03 de mediana**.

**Once se animan con dos fotogramas.** Son aquellos donde adelgazar no bastaba sin embarrar el
dibujo. Se descarta el grueso del medio y se alternan el primero y el último, que son las dos
posturas de la repetición. Ahí el fotograma de reposo pasa a ser el primero.

**Ojo:** el adelgazado solo es invisible sobre `--diagram-bg`. Es el fondo de `.gdiag`, y el trazo
usa ese mismo token; si algún día la figura se pinta sobre otro fondo, hay que revisarlo.

**Una sola caja de recorte para los tres fotogramas** (`window.CAJAS`, calculada del `getBBox` real
de cada ruta). El `viewBox` de 512 trae mucho aire y dejaba la figura pequeña; recortarlo la
agranda. Que la caja sea **la misma** para los tres es lo que impide que cambie de tamaño a mitad
de ciclo, que es el defecto que tenían 36 de las 90 figuras viejas.

**Y el fotograma del medio es el estado de reposo.** Lleva `opacity:1` en el estilo base, así que
cuando la regla global de `prefers-reduced-motion` mata la animación, la figura se queda en una
postura legible en vez de desaparecer. El sistema viejo se congelaba a media opacidad con los dos
cuerpos encima y necesitaba un parche dedicado en el CSS; este no necesita ninguno.

### El peso, medido — y esta vez sube

| | Bruto | Comprimido |
|---|---|---|
| v31 · `index.html` + three.js + mannequin.js + las cuatro `.js` | 1.115 KB | 300 KB |
| v32 · `index.html` (mapa, `ZONAS`, iconos) | 255 KB | 80 KB |
| v32 · `figuras.js` (201 fotogramas) | 2.063 KB | 651 KB |
| **v32 · total** | **2.318 KB** | **730 KB** |

**Es más pesado que la v31, no menos: 730 KB comprimidos frente a 300.** El motor 3D se fue y
liberó 300, pero las ilustraciones cuestan 651. No hay forma honesta de contarlo como un ahorro.

Lo que se compra con eso: 69 ejercicios con una figura dibujada a mano que se mueve de verdad, en
lugar de un maniquí que no llegó a leerse nunca. Se descarga **una sola vez** y lo guarda el
service worker; a partir de ahí la app abre sin red y sin volver a pedirlo.

Dos decisiones que hacen que ese peso no muerda:

- **`figuras.js` va aparte y cache-first.** Dentro de `index.html` —que va network-first— se
  re-descargaría en cada arranque. Fuera, se pide una vez. El precio es que si algún día se tocan
  las figuras hay que subir `CACHE`, o los teléfonos ya instalados se quedan con las viejas.
- **Fuera de `ASSETS`, con su propio `catch`.** `addAll` es atómico: si esos 2 MB fallan dentro de
  la lista, el service worker no se instala y la app pierde el modo sin conexión **entero**. Aparte,
  el peor caso es quedarse sin figuras hasta la siguiente visita.

Las coordenadas van redondeadas a entero: con `viewBox` de 512 pintado a 150 px, una unidad es
0,3 px. Ahorra el 44 % y no se distingue del original.

### La comprobación

No hay taller ni validador aparte: no hay posturas que validar, porque no las escribimos nosotros.
Lo que sí se comprueba, y se hizo:

1. **Cobertura del mapa**, por consola: que los 91 ids de `EX` tengan registro en `ZONAS`, que toda
   región citada exista, que toda región tenga nombre en `ZNAME`, que todo `eq` tenga icono, y que
   los 273 SVG (91 × tres tamaños) se generen sin lanzar. Salió 91/91.
2. **Que cada región pinte de verdad**, contando píxeles del render y comparando mitad izquierda
   con mitad derecha. Las 31 pintan; las 12 que van por pares salen simétricas al 100 %. Es la
   comprobación que cazó el fallo del `<clipPath>`, que ninguna inspección del DOM detectaba.
3. **Cobertura de las figuras**: que cada ejercicio dé **una** de las dos cosas y nunca las dos ni
   ninguna (69 ilustración + 22 mapa), que ninguna se quede con el `viewBox` sin recortar, y que
   el ritmo salga del `type` correcto. Salió 91/91, cero errores.
4. **Que la animación no solape dos fotogramas**: leyendo la opacidad calculada de los tres a lo
   largo del ciclo. Sale `1/0/0 → 0/1/0 → 0/0/1 → 0/0/1 → 0/1/0`, siempre uno visible. Y con la
   animación desactivada queda exactamente uno, que es la prueba de que el movimiento reducido no
   deja la caja vacía.

**Trampa que costó una tarde y que ninguna inspección del DOM detecta:** redondear las coordenadas
con una expresión regular de números **rompe los paths**. En notación compacta `.5.5` son dos
números y `2.5.5` es `2.5` y `0.5`; una regex los funde y el dibujo sale hecho trizas. Hace falta
tokenizar de verdad. Está escrito en la cabecera de `figuras.js` para que no se repita.
