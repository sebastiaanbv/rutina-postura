# Mi Rutina — sistema de diseño

Este documento es la fuente de verdad del diseño de la app. Sirve para dos cosas: decidir sin discutir cada vez, y que cualquier pantalla nueva salga pareciéndose a las que ya existen.

Todo lo que dice está implementado o marcado explícitamente como pendiente. No es una lista de deseos.

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
| Primario | `--primary` #0c8163 | `--primary-ink` #0a7458 | `--primary-tint` | Acción, hecho, progreso |
| Energía | `--energy` #e07b1a | `--energy-ink` #8a4b06 | `--energy-tint` | Racha, récord, subir peso |
| Información | `--accent` #3f76e0 | `--accent-ink` #1f4fa8 | `--accent-tint` | Consejos, cuello |
| Descanso | `--rest` #c9781f | `--rest-ink` #8a5312 | `--rest-tint` | Temporizador, avisos |
| Carga | `--load` #6d5bc9 | `--load-ink` #3a2f6b | `--load-tint` | Gimnasio, peso |
| Destructivo | `--danger` #c4443f | `--danger-ink` #a3322e | `--danger-tint` | Borrar |

### Superficies

`--bg` página · `--card` tarjeta · `--card2` tarjeta destacada · `--sunk` caja hundida (dentro de una tarjeta) · `--line` separador · `--line2` separador fuerte.

`--hero` es la superficie oscura invertida, la misma en los dos temas. Se usa **una vez por pantalla como máximo**: la tarjeta de hoy en Inicio, el índice de fuerza en Progreso. Su acento es `--hero-accent`, un verde claro que solo existe para ir sobre ella.

### Familias de rutina

Cada rutina tiene `cls` (`p` postura · `n` cuello · `g` gimnasio) y de ahí sale su color, en el azulejo del icono de Inicio, el calendario y la hoja del plan. **El color de familia nunca tiñe la pantalla entera**: es una marca de identidad, no un tema.

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

Regla: **toda animación es CSS**, nunca un contador por `setInterval`. Así una sola regla las apaga todas.

| Qué | Duración |
|---|---|
| Cambio de pantalla | 220 ms |
| Estado de un control | 150 ms |
| Anillo de avance | 450 ms |
| Barra de progreso | 350 ms |

`prefers-reduced-motion` está respetado y **debe ampliarse a `animation-duration`** antes de añadir la primera animación de celebración; hoy solo neutraliza transiciones.

Nada dura más de medio segundo. Una celebración que se disfruta la primera vez estorba la trigésima.

---

## 8. Pantallas

### Inicio
Manda la **tarjeta de hoy**: superficie oscura, título a 30 px, icono de la familia y una sola acción a ancho completo. Debajo, en tono descendente: la racha en **una línea** con la llama en ámbar, la semana como **riel continuo** con hoy resaltado, y las rutinas en **una tarjeta por familia** con filas, azulejo de color y duración a la derecha.

Estados de la tarjeta de hoy: hoy toca · en curso (manda sobre todo) · ya entrenaste · día de descanso.

### Detalle de rutina
Cabecera con título a 30 px y **anillo de avance**. Los ejercicios en **una tarjeta por bloque** (calentamiento · entrenamiento · opcionales), cada uno una fila.

Estados de la fila: pendiente · **siguiente** (filo verde y su botón de empezar en verde sólido; es lo único que destaca) · hecha (encoge: se ocultan meta y etiquetas, la figura se atenúa, de 108 a 71 px).

Abajo, barra fija con dos acciones: continuar y finalizar.

### Modo guiado — *pendiente*
Hoy los controles de peso y reps quedan **debajo** de la figura, los pasos y el vídeo: hay que desplazar para registrar una serie con la mancuerna en la mano. Debe invertirse: serie y controles arriba, la ficha de cómo se hace en un desplegable debajo, cerrado por defecto cuando ya has hecho el ejercicio tres veces o más. El descanso debe dejar de heredar la ficha del ejercicio.

### Calendario
Cada sesión con icono y color de familia. El detalle del día se despliega dentro de la sesión — *pendiente: hoy queda como bloque hermano y se separa visualmente al abrirse*.

### Progreso
Un dato hero (índice de fuerza) y siete bloques con el mismo ritmo. *Pendiente: los récords deberían subir justo después del hero, porque son la recompensa, y bajar el peso corporal, que es entrada de datos.*

### Ajustes — *pendiente*
Siete bloques planos del mismo peso. Deben agruparse en cuatro secciones: durante el entreno · recordatorios · apariencia · datos.

---

## 9. Estados

| Estado | Cómo se ve |
|---|---|
| Pendiente | Círculo hueco con borde `--line2` |
| Siguiente | Filo verde en la fila + botón de empezar en verde sólido |
| Hecho | Círculo relleno verde con visto blanco; la fila encoge |
| Sesión en curso | Manda en la tarjeta de hoy; el CTA de la rutina dice "Continuar" |
| Récord | *Pendiente: pastilla ámbar donde ocurre* |
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

## 12. Qué falta

Por orden de impacto:

1. **Modo guiado** — subir la acción por encima de la ficha; ficha en desplegable; descanso limpio. Es donde más se nota el diseño porque es donde más tiempo pasas mirando la pantalla.
2. **Momentos de celebración** — serie registrada, ejercicio completado, récord personal. Requiere ampliar la regla de `prefers-reduced-motion` primero.
3. **Pantalla de fin de rutina** — hoy es un emoji grande y tres líneas. Debe ser el resumen de lo que hiciste, con los récords conseguidos.
4. **Récord personal visible donde ocurre** — la lógica ya existe (`prFeed`), pero solo se ve en la pestaña de progreso.
5. **Calendario y Ajustes** — agrupación y orden.
6. **Aplanar la cola de parches de ejercicios y rutinas** — deuda estructural, no visual: cambia el contenido de los entrenamientos y necesita revisión aparte.

---

## 13. Fuera de alcance

- Redibujar las 61 figuras de los ejercicios. Se usan más pequeñas y atenuadas en las listas, completas dentro del ejercicio y en el guiado.
- Tipografía incrustada: en Android no hay redondeada de sistema y una fuente web cuesta 40-100 KB, parpadeo en cada arranque y gestión sin conexión. El carácter lo ponen el color, la forma y el peso.
- Que el color primario cambie según la rutina abierta: obligaría a re-verificar el contraste de todos los componentes en tres variantes por dos temas, y el azulejo de familia ya consigue la misma lectura.
