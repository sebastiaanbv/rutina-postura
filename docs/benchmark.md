# Benchmark: Hevy, RP Hypertrophy y Fitbod aplicados a Mi Rutina

*Ingeniería inversa de tres apps líderes de entrenamiento y lo que conviene traer a Mi Rutina.
Base de comparación: Mi Rutina v35. Octubre de 2026.*

> **Cómo leer este informe.** Las afirmaciones sobre otras apps llevan su fuente entre paréntesis
> (*ayuda oficial*, *blog oficial*, *quejas de usuarios*). Lo que la investigación no pudo comprobar
> se marca como **no verificado**. Las afirmaciones sobre Mi Rutina se comprobaron en el código.
> Este repositorio es público: el informe habla de «vetos del perfil» o «restricciones del perfil»
> y nunca de motivos de salud ni de datos personales.

## Índice

1. [Resumen](#1-resumen)
2. [Método y alcance](#2-método-y-alcance)
3. [Las tres apps](#3-las-tres-apps)
4. [Lo que Mi Rutina ya hace mejor](#4-lo-que-mi-rutina-ya-hace-mejor)
5. [Cómo leer las recomendaciones](#5-cómo-leer-las-recomendaciones)
6. [Plan por sprints](#6-plan-por-sprints)
7. [Recomendaciones por sprint](#7-recomendaciones-por-sprint)
8. [Descartes](#8-descartes)
9. [Glosario](#9-glosario)
10. [Correcciones aplicadas tras la revisión crítica](#10-correcciones-aplicadas-tras-la-revisión-crítica)

---

## 1. Resumen

Comparé Hevy, RP Hypertrophy y Fitbod con Mi Rutina v35. **Hevy** destaca por la rapidez para
registrar; **RP** por organizar el entrenamiento en bloques de varias semanas y ajustar las series de
cada músculo; **Fitbod** por generar cada sesión según el material, el tiempo y la recuperación.

Lo más urgente no es copiar funciones, sino arreglar dos defectos que salieron al comparar:

1. **Cualquier ejercicio con carga por debajo de 25 kg, sin lista de mancuernas declarada, no sube
   nunca de peso por sí solo.** Pide repeticiones extra sesión tras sesión y jamás propone subir.
2. **La sesión se guarda como «Completada» aunque queden ejercicios sin hacer.**

Después, lo que más valor aporta es un motor de progresión que lea las repeticiones en reserva
(RIR), baje la carga tras fallos o parones y distinga ganar masa de mantener la salud. Le siguen
poder cambiar y excluir ejercicios en plena sesión, con los vetos del perfil guardados como datos, y
un Progreso navegable por ejercicio y por semana.

Quedan **46 recomendaciones** repartidas en **12 sprints** (v36 a v45, más dos sprints del
asistente con IA) y un **backlog** sin fecha de 4 recomendaciones más una historia del asistente.
El orden sigue el impacto: primero los datos honestos, después la progresión, el cambio de
ejercicios y el gimnasio real.

**Sobre los datos.** Ninguna recomendación necesita backend ni una migración que borre datos. Todas,
salvo las fotos de progreso, se guardan en claves `rp_` que la copia exporta sola. Las fotos quedan
en el backlog y solo entrarán si la copia las incluye. Las que tocan el registro de series solo
añaden campos opcionales.

**Se descartan**, entre otras, el ajuste de series por bombeo y agujetas de RP, los rangos MEV/MRV,
los bloques fijos de semanas, el ciclo de fases de Fitbod, el descanso editable por ejercicio, las
series descendentes y las rutinas duplicadas, por falta de evidencia o porque cuestan más de lo que
aportan (sección 8).

---

## 2. Método y alcance

| App | Versión revisada | Funciones inventariadas |
|---|---|---:|
| Hevy (Hevy Studios S.L.) | iOS 3.2.1, octubre de 2026 | 30 |
| RP Hypertrophy (Renaissance Periodization) | octubre de 2026 | 30 |
| Fitbod | octubre de 2026 | 33 |

- Se inventariaron las funciones de cada app a partir de su centro de ayuda, su blog, sus notas de
  versión y opiniones de usuarios, y se cruzaron con las 51 funciones de Mi Rutina.
- De 55 propuestas iniciales quedaron 46 tras una pasada de verificación y la fusión de duplicados.
- Una revisión crítica comprobó en `index.html` y `sw.js` las afirmaciones clave sobre Mi Rutina y
  pidió 14 correcciones, todas aplicadas aquí (sección 10).
- Las dos personas que usan la app, cada una en su teléfono y sin cuentas:
  - **El dueño**: gimnasio con máquinas, objetivo ganar masa, con vetos del perfil sobre algunos
    ejercicios.
  - **La madre**: casa, objetivo salud, mancuernas ligeras y bandas.
- Restricciones duras que filtran todo lo que sigue: no perder datos nunca (todo dato nuevo en
  claves `rp_*` que exporta la copia, con migración si cambia el esquema); funciona sin conexión;
  sin superseries; sin motor propio de figuras; nada social.

---

## 3. Las tres apps

### Hevy

**Qué la hace buena.** Es la que registra más rápido. Junto a cada serie muestra lo que hiciste en
esa misma serie la vez anterior, y se copia con un toque. Al marcar la serie arranca el descanso y
se comprueba en el momento si has batido un récord. El plan gratis es generoso y está en todas las
plataformas.

**Lógica central.** Es sobre todo un cuaderno de entrenamiento muy ágil.

- En cada serie ves el peso y las repeticiones de esa misma serie la última vez; un ajuste decide si
  esa «última vez» sale de cualquier entreno o solo de la misma rutina (*ayuda oficial*).
- Al marcar la serie empieza el descanso y la app mira si superaste alguno de sus cuatro récords:
  peso máximo, mejor 1RM estimado, mejor serie y mejor sesión.
- Al guardar, por defecto reescribe la rutina con lo que acabas de hacer.
- La progresión automática solo existe en **Hevy Trainer**, de pago: sube el peso cuando haces el
  tope del rango en todas las series (doble progresión) y no tiene en cuenta sueño ni sensaciones.
- La racha cuenta semanas con al menos un entreno, y se puede mantener registrando otra actividad,
  como un paseo (*ayuda oficial*).

> La valoración en tiendas que circulaba en borradores anteriores (4,9/5) **no aparece en la
> investigación** y se retiró.

### RP Hypertrophy

**Qué la hace buena.** Quita el trabajo de planificar: cada semana dice qué peso y cuántas
repeticiones hacer y monta solo el bloque de entrenamiento. Su punto fuerte es ajustar las series
de cada músculo según cómo responde el usuario. Se apoya en la base científica de Renaissance
Periodization y tiene más de 250 vídeos de técnica.

**Lógica central** (todo lo siguiente está documentado en su *ayuda oficial*):

- Organiza el entrenamiento en **mesociclos** de 4 a 8 semanas.
- La primera semana dejas unas 3 repeticiones en reserva; cada semana te acercas un poco más al
  fallo hasta llegar a 0, y **la última semana es siempre una descarga** más ligera.
- El peso de la primera semana lo eliges tú; después la app lo sube unos pocos puntos porcentuales
  por semana. **Si el siguiente salto de mancuerna es demasiado grande, mantiene el peso y suma una
  repetición.**
- Tras trabajar cada músculo pregunta por el bombeo, las agujetas, lo dura que fue la carga y el
  dolor articular, y con eso sube, mantiene o baja las series de ese músculo la semana siguiente.
  Según su blog (diciembre de 2025), el dolor reduce el volumen o la carga de la sesión siguiente.
- Cada músculo puede tener prioridad alta, media o de mantenimiento, ligada a unos volúmenes de
  referencia (MV, MEV, MRV).
- Cuesta 34,99 USD al mes, no funciona sin conexión y no tiene temporizador de descanso.

### Fitbod

**Qué la hace buena.** Abres la app y la sesión ya está hecha, adaptada al material que tienes, al
tiempo disponible y a lo que entrenaste los días anteriores. Gestiona bien el equipo (varios
perfiles de gimnasio y redondeo a pesos posibles), pregunta el RIR tras cada serie y añade
calentamiento al primer ejercicio de cada músculo.

**Lógica central.** No tiene un programa fijo: genera cada sesión desde cero.

- Calcula cuánto se ha recuperado cada músculo, de 0 a 100 %, y elige ejercicios para los más
  recuperados con el material del gimnasio activo.
- La duración elegida decide cuántos ejercicios entran, unos 7 por hora (*ayuda oficial*).
- Para el peso estima tu 1RM en cada ejercicio y lo corrige con lo que registras: si te sobran
  repeticiones, sube; si te cuesta, baja; si llevas tiempo sin hacer el ejercicio, baja.
- A veces programa series hasta no poder más (AMRAP) para recalibrar esa estimación.
- Los **Focus Exercises** llevan un multiarticular por día a través de un ciclo de 4 fases (técnica,
  más peso, cerca del límite, máximo esfuerzo) que se renueva.
- Cualquier cambio de material, duración u objetivo vuelve a generar la sesión.
- Cuesta 15,99 USD al mes.

### Las tres de un vistazo

| | Hevy | RP Hypertrophy | Fitbod | Mi Rutina |
|---|---|---|---|---|
| Modelo | Cuaderno rápido | Bloques planificados | Sesión generada | Rutinas fijas curadas |
| Progresión automática | Solo Trainer (pago) | Sí, por semana | Sí, por estimación de 1RM | Sí, doble progresión explicada |
| Usa el RIR | No (registra RPE) | RIR objetivo por semana | Sí, tras cada serie | Lo registra; aún no lo usa |
| Sin conexión | Parcial | No | Parcial | Sí, completo |
| Precio | Gratis / pago | 34,99 USD/mes | 15,99 USD/mes | Gratis |

---

## 4. Lo que Mi Rutina ya hace mejor

Solo se incluyen comparaciones con respaldo en la investigación. Donde no lo hay, se dice.

- **La sesión en curso no se pierde.** Cada serie se guarda al momento. Al recargar se retoma en el
  mismo paso, y una sesión de otro día se puede guardar con su fecha o descartar. Hevy guarda en el
  dispositivo solo el entreno en curso y el resto depende de su servidor; Fitbod guarda solo el
  entreno tras 3 h en pausa; RP no funciona sin conexión.
- **El descanso avanza solo y anuncia lo que viene.** Cuenta con reloj real (también con el teléfono
  bloqueado), suena, vibra y pasa solo al paso siguiente mostrando «Sigue: Serie 3 de 4» o el
  ejercicio siguiente. RP no tiene temporizador de descanso.
- **Sugerencia de peso y repeticiones con su porqué, gratis.** La doble progresión se explica en la
  propia serie («Llenaste el rango entero: sube a 42,5 kg y vuelve a 8»). En Hevy eso solo existe en
  Trainer, de pago. Fitbod anunció que explica sus recomendaciones, pero no se encontró documentado
  (**no verificado**).
- **Progresión sobre las mancuernas que existen.** Con la lista de mancuernas declarada, las subidas
  usan solo pesos reales y piden ampliar el rango cuando el salto es grande. RP resuelve el mismo
  problema manteniendo el peso y sumando repeticiones (*ayuda oficial*); Fitbod redondea a cargas
  posibles, aunque recibe quejas por pesos imposibles en poleas. Mi Rutina lo hace sobre el material
  concreto de cada teléfono, incluidas mancuernas ligeras de 1 a 3 kg.
- **La molestia articular cambia la sugerencia.** Anotar una molestia congela peso y repeticiones, lo
  explica, y con 2 molestias en 28 días sugiere cambiar el ejercicio. RP dice que reduce volumen o
  carga tras el dolor, sin decir cuánto ni proponer otro ejercicio (*blog oficial*). Hevy no tiene
  nada parecido. Fitbod lo resuelve mejor con su exclusión por zona, que se recoge como
  recomendación (3.1 y 3.3).
- **Récords que no premian el ruido.** La fuerza estimada no cuenta series por debajo del rango, el
  récord exige mejorar sin empeorar en nada (dominancia de Pareto) y el listado de récords excluye
  calentamientos y la primera sesión. Evita los récords falsos que la propia ayuda de Hevy reconoce
  en ejercicios asistidos. *Pendiente:* el aviso de récord en la sesión aún cuenta los
  calentamientos; se corrige en el Sprint 1 (1.4).
- **Radar de estancamiento e índice de sobrecarga con criterio explícito.** Un ejercicio se marca
  estancado tras 3 sesiones sin superar su mejor marca de 8 semanas, y el índice muestra en qué
  parte de los ejercicios subió la fuerza estimada, con una franja esperable del 40-60 %. RP no
  ofrece estadísticas de fuerza y en Hevy el aviso de estancamiento solo está en Trainer.
- **Series por músculo más finas.** Cuenta 1 serie para el músculo principal y 0,5 para los
  secundarios, separa el deltoides en tres cabezas e incluye cuello, trapecio, lumbar y aductores.
  Usuarios de RP se quejan de que dorsal y espalda media van juntos y de que el hombro no se divide;
  la ayuda de Fitbod se contradice sobre si cuenta los secundarios.
- **Objetivo de salud y peso corporal bien leídos.** La media de 7 días y el ritmo semanal, con
  umbrales según el objetivo, hacen que «estable» cuente como éxito en el teléfono con objetivo
  salud. RP permite poner músculos en mantenimiento, pero no tiene un objetivo global de salud.
- **Fuerza cruzada con el peso corporal.** El resumen de Progreso combina el índice de fuerza con el
  ritmo de peso y da un veredicto accionable («Levantas más pero no pesas más: sube un poco la
  comida»). No se encontró nada equivalente en las tres apps.
- **Programa curado y distinto para cada persona.** Las rutinas de gimnasio se auditaron en v30
  (relación pecho:remo, gemelos, alternativas a los vetos del perfil). El grupo Casa tiene su propio
  peso inicial para no empezar en 10 kg. Fitbod regenera la sesión y pierde las ediciones (*quejas de
  usuarios*).
- **Ejercicios propios que progresan como los del catálogo.** Tienen sugerencia, récords, series por
  músculo y curva, y se pueden editar. Fitbod no los recomienda ni los progresa; Hevy gratis limita
  su número.
- **La dosis y el historial siguen al ejercicio que haces.** Si cambias un ejercicio, su historial y
  su dosis van con el ejercicio realmente hecho, y el mismo ejercicio puede tener dosis distintas
  según la rutina. En RP, un hueco cambiado empieza sin datos.
- **Series ajustables en vivo e historial corregible.** El número de series cambia sin perder el
  sitio; en Historial se corrigen kilos y repeticiones, se borran sesiones y se registran a mano
  rutinas pasadas.
- **Meta semanal congelada y resumen del mes justo.** La meta de cada semana se congela, solo cuentan
  las sesiones con al menos el 60 % de los ejercicios, y el mes se compara con los mismos días del
  mes anterior.
- **Todo en el teléfono, sin conexión, gratis y con copia propia.** La app funciona sin conexión; la
  copia exporta todas las claves `rp_*`, la importación valida y deshace si no hay espacio, y hay
  aviso de copia a los 14 días. RP no funciona sin conexión y cuesta 34,99 USD al mes; Fitbod cuesta
  15,99 USD al mes; Hevy limita las gráficas gratis a 3 meses.
- **Todo lo de la serie en una sola pantalla.** Ilustración, mapa corporal, consejo, vídeo y curva
  están dentro del guiado; el RIR es opcional, con un toque, y la pantalla encendida viene activada.
  Fitbod también junta vídeo, instrucciones y series en su pantalla de detalle; Mi Rutina añade el
  mapa corporal y la curva. En Hevy, instrucciones y gráficas viven en la ficha del ejercicio.
- **Calentamiento por rutina y duración estimada con una cuenta clara.** Cada rutina tiene su
  calentamiento específico más las series de aproximación, y la duración sale de la dosis real.
  Fitbod da horquillas amplias (27-51 min para 4 ejercicios) y RP se queda en una pauta de texto.
- **La postura cuenta como hábito propio.** El bloque «Postura y cuello: N de 28 días» y el mapa de
  calor de dos colores separan la movilidad diaria de la fuerza. No se encontró nada equivalente en
  las tres apps.

---

## 5. Cómo leer las recomendaciones

Cada recomendación tiene el mismo formato:

- **Qué verás**: una o dos frases llanas, con ejemplo, de lo que cambia en pantalla.
- **Por qué importa** y **de dónde viene** (qué app lo hace y cómo).
- Una línea de datos:
  - **Para**: el dueño, la madre o los dos.
  - **Esfuerzo**: **S** (un cambio acotado en una función o pantalla), **M** (varias funciones, o una
    clave nueva) o **L** (toca muchos lectores o una tecnología nueva).
  - **Impacto**: alto, medio o bajo.
  - **Depende de**: *obligatoria* si sin ella no funciona; *mejora si existe* si funciona sola pero
    gana con la otra.
- Una **Nota técnica** plegable con funciones, claves y riesgos sobre los datos.

Los niveles «ahora / después / quizás» de borradores anteriores se sustituyen por sprints: los
sprints 1 a 4 equivalen a «ahora», los sprints 5 a 12 a «después» y el backlog a «quizás».

---

## 6. Plan por sprints

| Sprint | Tema | Versión | Recomendaciones |
|---:|---|---|---|
| 1 | Datos honestos | v36 | progresion-desbloquear-subida, salto-real-maquina, sesion-aviso-pendientes, progreso-records-en-la-serie, progreso-racha-unica, sesion-notificacion-abre-app |
| 2 | Progresión inteligente | v37 | progresion-rir-en-la-regla, progresion-bajar-tras-fallos, progresion-vuelta-tras-paron, progresion-objetivo-cambia-regla, progresion-metrica-sin-peso |
| 3 | Cambiar y excluir ejercicios | v38 | planificacion-excluir, cambiar-ejercicio, progresion-molestia-ampliada, planificacion-rutinas-visibles |
| 4 | El gimnasio real | v39 | sesion-dejar-para-despues, sesion-aproximacion-por-musculo, sesion-previo-por-serie, sesion-boton-al-pulgar, progreso-actividad-libre |
| 5 | Asistente con IA | — | HU-06a, HU-06b, HU-06c, HU-06g |
| 6 | Plan y lectura semanal | v40 | planificacion-rotacion-dias, progreso-recordatorios-plan, progreso-resumen-semanal, progreso-ficha-ejercicio |
| 7 | Día a día | v41 | sesion-sonido-ajustable, progreso-compartir-resumen, sesion-nota-de-hoy, sesion-duracion-real |
| 8 | Asistente: revisión y adaptar | — | HU-06d, HU-06e, HU-06f |
| 9 | Lecturas que deciden | v42 | planificacion-porque-en-rutina, planificacion-punto-debil-accion, planificacion-perfil-equipo, planificacion-catalogo-filtros, progreso-fuerza-por-grupo |
| 10 | Casa y material ligero | v43 | progresion-techo-sin-carga, sostenes-registro-y-progresion, sesion-peso-por-mancuerna, planificacion-propios-completos |
| 11 | Estancamiento | v44 | progresion-descarga-bajo-demanda, progresion-radar-accionable, progreso-musculo-historico |
| 12 | Pulido | v45 | planificacion-duracion-objetivo, progreso-rango-grafica y los hallazgos de las auditorías de calidad |
| — | Backlog (sin fecha) | — | sesion-notificacion-viva, progreso-exportar-csv, progreso-peso-corporal-en-volumen, progreso-fotos (solo si la copia incluye las fotos), HU-06h |

Cambios respecto al borrador anterior, por la revisión crítica:

- **El salto real de cada máquina sube de v39 a v36**, junto al arreglo de la subida. Así ninguna
  versión propone pesos que no existen, y las reglas de v37 ya pueden redondear al salto real.
- **La actividad libre sube de v41 a v39**: es de impacto alto y la única medida de salud nueva para
  la madre.
- **Las fotos de progreso pasan al backlog** con un requisito previo: que la copia las incluya.
- **La lista «No proponer» del asistente (HU-06b) se unifica con la lista de excluidos** del
  Sprint 3: una sola lista por teléfono.

---

## 7. Recomendaciones por sprint

### Sprint 1 · Datos honestos (v36)

Arreglos baratos de cosas que hoy dan información falsa o no cumplen lo que el diseño promete. Solo
`salto-real-maquina` añade una clave nueva; el resto son campos opcionales o ninguno.

#### 1.1 · Que los ejercicios con poco peso vuelvan a subir de carga
`progresion-desbloquear-subida`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** alto · **Viene de:** RP, Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** Cuando completes el rango ampliado en todas las series, la app propondrá subir el
peso. Ejemplo: elevaciones laterales a 8 kg con rango 12-20. Hoy piden «estira a 22» sesión tras
sesión; con el arreglo, cuando todas las series llegan a 22, proponen el siguiente peso y volver
a 12.

**Por qué importa.** Hoy cualquier ejercicio con carga por debajo de 25 kg sin lista de mancuernas
declarada pide más repeticiones para siempre y nunca sube. Afecta a curls, extensiones de tríceps,
elevaciones o pec deck del dueño, y también a la madre si no declaró sus mancuernas (con menos de
10 kg, subir 1 kg siempre supera el 10 %). En su teléfono basta con declarar las mancuernas en
Ajustes para evitarlo, pero el arreglo la protege igualmente.

**Cómo lo hacen.** RP mantiene el peso y suma una repetición cuando el siguiente salto es demasiado
grande (*ayuda oficial*). Fitbod redondea a las cargas que existen con el equipo declarado, aunque
en poleas recibe quejas por pesos imposibles.

<details>
<summary>Nota técnica</summary>

- Causa: `loadStep(w)` anula el salto si supera el 10 % del peso; por debajo de 25 kg siempre lo
  supera, así que las ramas de 1 y 2 kg no se usan nunca y `todayTarget` repite «estira a tope+2».
- Cambio en `todayTarget`, sin pantalla nueva: el salto pasa a ser el mínimo de siempre (1, 2 o
  2,5 kg), o `stepFor(id)` desde 1.2, sin el corte del 10 %. Con el rango lleno, si salto/peso ≤ 10 %
  sube ya; si es mayor, pide tope+2 y, cuando todas las series llegan a tope+2, sube y vuelve al
  mínimo del rango. Es la lógica que ya usa la rama de mancuernas con `pesosDB`.
- Datos: no toca `rp_logs` ni añade claves; solo cambia el comportamiento en el caso bloqueado.
- Entra en la misma versión que 1.2 para que el peso propuesto exista en cada máquina.

</details>

#### 1.2 · Salto real de cada máquina
`salto-real-maquina`

**Para:** el dueño · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** Hevy, Fitbod, RP ·
**Depende de:** progresion-desbloquear-subida (obligatoria, misma versión)

**Qué verás.** Bajo el peso aparece un chip «Salto: 2,5 kg». Lo tocas una vez por máquina, eliges,
por ejemplo, 5 kg, y desde entonces la app solo propone pesos que existen en esa máquina y los
botones −/+ saltan de 5 en 5.

**Por qué importa.** Hoy los botones suman 2,5 kg fijos y la app puede proponer 42,5 kg en una polea
que va de 5 en 5. Era el punto 1 que seguía abierto en la lista de pendientes del documento de
diseño. Adelantarlo a v36 evita tres versiones proponiendo pesos inexistentes y deja listo el
redondeo que usan las reglas del Sprint 2.

**Cómo lo hacen.** Hevy redondea el calentamiento con los incrementos de discos y mancuernas que
declaras. Fitbod guarda por ubicación los incrementos del material, aunque su queja más citada es
sugerir 17,5 en una polea que va de 5 en 5. Ninguna lo hace por máquina concreta.

<details>
<summary>Nota técnica</summary>

- Clave nueva `rp_inc {exId: kg}` (se descarta el nombre alternativo `rp_steps`).
- Una sola función `stepFor(id)`: devuelve el peso de `pesosDB`, `rp_inc[id]` o el salto por
  defecto. La usan `todayTarget`, `adjW` y `warmupHTML`.
- El chip solo aparece en ejercicios con carga sin `pesosDB`; opciones 1 · 2 · 2,5 · 4,5 · 5 · 7 ·
  10 kg. Lo tecleado con `editNum` no se redondea, para poder anotar placas intermedias.
- Datos: clave opcional que la copia exporta por el prefijo `rp_`; sin ella, todo funciona como
  tras 1.1. No toca `rp_logs`. No es la calculadora de discos descartada: solo un salto por
  ejercicio.
- La madre no lo necesita: sus mancuernas ya van por `pesosDB`.

</details>

#### 1.3 · No dar por completada una sesión con ejercicios pendientes
`sesion-aviso-pendientes`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** alto · **Viene de:** RP, Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** Si llegas al final del guiado con ejercicios sin hacer, aparece «Te quedan 2: Jalón al
pecho, Curl» con dos botones: «Hacerlos ahora» y «Terminar así». Si terminas así, la pantalla de fin
dice «Guardada · 5 de 7 ejercicios» en lugar de «Completada».

**Por qué importa.** Hoy basta con empezar desde un ejercicio concreto o saltar uno para que la
sesión se cierre sola como «Completada».

**Cómo lo hacen.** En Hevy, un ejercicio sin marcar sigue en la lista hasta que guardas. RP deja
hacer los ejercicios en otro orden (*ayuda oficial*); que Fitbod deje arrastrar para reordenar es
**no verificado**.

**Decisión pendiente.** Si un ejercicio saltado a propósito cuenta como pendiente. Propuesta:
«Saltar ejercicio» pasa a significar «no lo hago hoy» y no vuelve a aparecer.

<details>
<summary>Nota técnica</summary>

- Antes de llamar a `finish()` al terminar `steps`, se calculan los ejercicios de `effList` sin
  series ni visto. «Hacerlos ahora» recoloca esos pasos y sigue; «Terminar así» llama a `finish()`.
- Datos: sin clave nueva; `rp_logs` y `rp_history` no cambian.

</details>

#### 1.4 · Ver el récord en la propia serie y qué tipo de récord es
`progreso-records-en-la-serie`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** La serie que supera una marca se resalta en ámbar con la etiqueta «récord», y la
pantalla de fin dice qué se superó: «Peso máximo», «Mejor 1RM est.» o «Más reps con 40 kg». Los
calentamientos dejan de contar como récord.

**Por qué importa.** Cumple lo que el diseño ya promete: la recompensa llega en la serie y no solo
al final, y queda claro qué se superó.

**Cómo lo hacen.** Hevy evalúa los récords al marcar cada serie, pone una medalla en la serie y
documenta varios tipos (*ayuda oficial*). Fitbod guarda récords de varios tipos.

<details>
<summary>Nota técnica</summary>

- En `renderStep`, la serie récord lleva la clase `pr` (el estilo `.setline.pr` ya existe) y la
  etiqueta, sin aviso flotante. Se identifica por número de serie: campo opcional `i` al hacer
  `markPR`, para que dos series iguales no se marquen las dos.
- `prKind` devuelve el tipo y se guarda como `kind` opcional en `pr`.
- `isPR` excluye los calentamientos, igual que `prFeed`.
- Datos: campos opcionales `i` y `kind` en el objeto `pr` de `rp_session` y `rp_history`; `prFeed`
  recalcula desde `rp_logs` y no depende de ellos.

</details>

#### 1.5 · Una sola racha, la semanal
`progreso-racha-unica`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** Desaparecen los «días seguidos». La pantalla de fin dice «Esta semana: 2 de 3» con el
anillo y, si se cumple la meta, «Semana cumplida · 6 seguidas». En el teléfono de la madre, una
línea extra: «Postura: N de 7 días esta semana».

**Por qué importa.** Hoy Inicio cuenta semanas cumplidas y otras pantallas cuentan días seguidos,
que se rompen en los descansos que el propio programa pide.

**Cómo lo hacen.** Hevy cuenta semanas seguidas con al menos un entreno (*ayuda oficial*); en Fitbod
la racha va ligada al objetivo semanal.

<details>
<summary>Nota técnica</summary>

- Cambia el texto de la pantalla de fin, «Listo por hoy» y «Tu historial».
- Datos: `rp_streak` se sigue escribiendo (guarda el total de sesiones) pero no se muestra como
  racha. Nada se borra.

</details>

#### 1.6 · Que tocar una notificación te devuelva a la app
`sesion-notificacion-abre-app`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** Tocar el aviso de fin de descanso o un recordatorio abre Mi Rutina en el paso del
guiado donde te quedaste.

**Por qué importa.** Hoy esas notificaciones no llevan a ninguna parte.

**Cómo lo hacen.** Hevy (Live Activity y notificación persistente) y Fitbod (pantalla de bloqueo)
devuelven a la sesión con un toque. Una PWA no puede hacer Live Activity, pero sí esto.

<details>
<summary>Nota técnica</summary>

- `sw.js` gana un manejador `notificationclick` que cierra la notificación y enfoca la app abierta o
  hace `clients.openWindow('./')`; `resumeGuided` ya devuelve al paso.
- En el mismo cambio, el `install` se salta `figuras.js` si ya está en la caché (`c.match` antes de
  `c.add`): cualquier cambio en `sw.js` reinstala el service worker y hoy volvería a descargar 2 MB.
- Datos: sin datos nuevos.

</details>

---

### Sprint 2 · Progresión inteligente (v37)

Las cinco reglas viven en `todayTarget` y se escriben juntas, con un único bloque para el objetivo
salud. No cambian el esquema: solo leen `rp_logs` y el RIR que ya se guarda. Redondean con
`stepFor` (Sprint 1).

#### 2.1 · Que las repeticiones en reserva cambien la sugerencia
`progresion-rir-en-la-regla`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** alto · **Viene de:** Fitbod, RP ·
**Depende de:** progresion-desbloquear-subida (obligatoria)

**Qué verás.** Lo que marcas en «¿Cuántas más podías?» empieza a contar. Si en la primera serie te
sobraron 3 o más, la app pide +2 repeticiones en lugar de +1. Con objetivo salud, si llegaste al
límite, mantiene: «Mismo peso: busca dejar 1 en reserva».

**Por qué importa.** Acelera cuando sobra margen y evita que el teléfono con objetivo salud apriete
de más. Cierra el pendiente «usar las reps en reserva en la progresión» de la lista de pendientes
del documento de diseño. Se aparta de la idea anotada allí (no subir con RIR 0) porque llenar el
rango cerca del fallo es lo normal en hipertrofia.

**Cómo lo hacen.** Fitbod pregunta el RIR tras cada serie y lo usa para ajustar las siguientes
(*ayuda oficial*). RP fija un RIR objetivo que baja de 3 a 0 a lo largo del mesociclo (*ayuda
oficial*). Hevy registra el RPE pero no lo usa.

<details>
<summary>Nota técnica</summary>

Solo en `todayTarget`, y solo si la última sesión trae RIR en alguna serie (las series sin RIR se
ignoran):

- **(a) Masa:** si llenaste el rango llegando al fallo (RIR 0) en todas las series, sube el peso
  aunque el salto sea mayor del 10 %, y el porqué lo dice. **Salud:** mismo peso y «busca dejar 1 en
  reserva».
- **(b)** Rango sin llenar y primera serie con RIR 3+ → reps +2 en lugar de +1, sin salirse del
  rango.
- **(c) Salud:** si alguna serie tuvo RIR 0-1, no se suma repetición.
- `rirHTML` se muestra también en los ejercicios de repeticiones sin carga (bandas, flexiones en
  pared).
- Datos: solo lee un campo que ya existe.

</details>

#### 2.2 · Bajar el peso tras dos sesiones por debajo del rango
`progresion-bajar-tras-fallos`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, RP ·
**Depende de:** salto-real-maquina (obligatoria; resuelta en el Sprint 1)

**Qué verás.** Si dos veces seguidas no llegas al mínimo de repeticiones con el mismo peso, la app
propone bajar: «Dos veces por debajo de 8: baja a 37,5 kg y reconstruye».

**Por qué importa.** Hoy la app nunca baja el peso: solo repite y pide una repetición más. Evita
quedarse semanas pegado a un peso que no sale y forzar la técnica.

**Cómo lo hacen.** Fitbod suaviza la recomendación tras un rendimiento flojo (*blog oficial*). RP
reajusta el peso si caes fuera del rango de forma repetida; la mecánica exacta es **no verificada**.

<details>
<summary>Nota técnica</summary>

- Nueva regla en `todayTarget`, antes de la de mantener: si en las dos últimas sesiones (sin
  molestia ni descarga) la primera serie quedó por debajo del mínimo con el mismo peso, propone peso
  − un salto (`stepFor`) con reps = mínimo + 1.
- Con mancuernas de `pesosDB`, si bajar supone más de un 25 %, mantiene la mancuerna y pide el
  mínimo del rango. Mismo criterio de dos sesiones para masa y salud.
- Datos: solo lee `rp_logs`.

</details>

#### 2.3 · Bajar la sugerencia al volver de un parón
`progresion-vuelta-tras-paron`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, RP ·
**Depende de:** salto-real-maquina (obligatoria; resuelta en el Sprint 1)

**Qué verás.** «Llevas 5 semanas sin hacerlo: empieza en 36 kg y recupera en 2-3 sesiones», con un
aviso breve: «Si estuviste enfermo/a, empieza suave».

**Por qué importa.** Hoy la app toma la última sesión sin mirar su fecha, así que tras un mes sin
entrenar puede proponer subir. Evita la mala experiencia de volver y fallar.

**Cómo lo hacen.** Fitbod reduce automáticamente las sugerencias tras un tiempo sin registrar
(*ayuda oficial*, sin umbral publicado). RP explica cómo entrenar después de estar enfermo.

<details>
<summary>Nota técnica</summary>

- En `todayTarget`: días = hoy − fecha de la última sesión. Más de 21 días → peso × 0,9; más de 42 →
  × 0,8, redondeado hacia abajo con `stepFor`, reps al mínimo del rango y sin subida ese día. Con
  objetivo salud, el umbral es de 14 días.
- Con `pesosDB`, si el redondeo baja más de un 20 %, se mantiene la mancuerna y solo bajan las reps
  (sin esto, una mancuerna de 2 kg pasaría a 1 kg, un −50 %).
- Datos: solo lee `rp_logs`.

</details>

#### 2.4 · Que el objetivo salud cambie también el ritmo de progresión
`progresion-objetivo-cambia-regla`

**Para:** la madre · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, RP ·
**Depende de:** se escribe junto con 2.1, 2.2 y 2.3

**Qué verás.** En el teléfono con objetivo salud la app sube más despacio y celebra mantenerse:
«Mantienes 2 kg × 12 con margen: bien, sigue así». El radar deja de marcar como estancado lo que se
mantiene en el tope del rango.

**Por qué importa.** Hoy la regla de progresión es idéntica para las dos personas. No impide
progresar, solo lo hace más despacio; la ACSM recomienda sobrecarga progresiva también con objetivo
de salud.

**Cómo lo hacen.** Fitbod dice ajustar rangos e intensidad según el objetivo (marketing, **no
verificado** en detalle). RP permite poner músculos en mantenimiento, pero dentro de un bloque de
hipertrofia.

<details>
<summary>Nota técnica</summary>

- Un único bloque `goal==='salud'` en `todayTarget` con los umbrales de salud: subir carga solo tras
  llenar el rango 2 sesiones seguidas (en masa, 1); no sumar repeticiones si la última sesión tuvo
  RIR ≤ 1; parón a partir de 14 días.
- Datos: sin claves nuevas; `rp_prefs.goal` ya existe.

</details>

#### 2.5 · Contar el progreso en repeticiones en los ejercicios sin peso
`progresion-metrica-sin-peso`

**Para:** la madre · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** Los ejercicios con bandas o con el propio cuerpo empiezan a contar en «Progresaste en
X de Y» y en el radar de estancamiento, medidos por repeticiones máximas; el radar muestra «reps».

**Por qué importa.** Incluye en el índice sus ejercicios con banda y peso corporal, hoy excluidos
(16-17 ejercicios sin carga en sus rutinas). Así ve su progreso real.

**Cómo lo hacen.** En peso corporal, Hevy usa como récord las repeticiones máximas por serie y por
sesión (*ayuda oficial*). Fitbod usa una métrica de fuerza propia para estos ejercicios.

<details>
<summary>Nota técnica</summary>

- Función nueva `perfE(id, rec)`: devuelve `bestE1` si hay carga y, si no, las repeticiones máximas
  de una serie con reps ≥ mínimo del rango. `overloadIndex` y `stalled` usan `perfE`.
- `prLevel` sigue con `bestE1` para no cambiar los avisos de récord: no tocarlo por accidente.
- En salud, `stalled` no marca los ejercicios que están en el tope del rango o por encima.
- Datos: solo calcula sobre `rp_logs`.

</details>

---

### Sprint 3 · Cambiar y excluir ejercicios (v38)

Primero la lista de excluidos, para que ningún candidato automático proponga un veto del perfil.
Después el cambio en vivo y la molestia con botón, que usan esa misma lista.

#### 3.1 · «No volver a proponer»: ejercicios que no haces
`planificacion-excluir`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** Fitbod (RP, **no
verificado**) · **Depende de:** —

**Qué verás.** En la ficha de un ejercicio, «No volver a proponer». Desaparece del catálogo y de las
alternativas; si estaba en una rutina, se sustituye y la fila dice «Excluido · ahora: Remo en
polea». En Ajustes, «Ejercicios que no haces» lo deshace. En el teléfono del dueño, la lista llega
ya rellena con los vetos del perfil, editable.

**Por qué importa.** Hoy los vetos del perfil aparecen en «Agregar ejercicio» y en las rutinas Casa —
Fuerza B, Cuello y rostro y Postura completa. Con esto las restricciones pasan a ser datos y no
dependen de la memoria. Es además la lista «No proponer» del asistente (HU-06b): una sola lista por
teléfono.

**Cómo lo hacen.** Fitbod tiene «Recomendar más», «Recomendar menos» y «Excluir» por ejercicio, y una
sección de lesiones que sugiere qué excluir y permite marcar la zona como recuperada (*ayuda y blog
oficiales*).

<details>
<summary>Nota técnica</summary>

- Clave nueva `rp_excluidos {exId: {date, motivo}}`, por teléfono. `motivo` es genérico
  (`gusto`, `material`, `molestia`).
- **Siembra inicial en el teléfono del dueño:** una tarjeta única en v38 propone los vetos del perfil
  ya marcados (`remo_db`, `remo_inclinado`, `peso_muerto_rumano_db`, `encogimientos_db`); al
  confirmar se escriben en `rp_excluidos`. `remo_inclinado` («Remo inclinado con mancuernas», de
  Postura completa) se trata como vetado por defecto, con criterio conservador, y se puede quitar de
  la lista. Press inclinado y sentadilla con barra no existen en el catálogo. El teléfono de la madre
  empieza vacío.
- Se marca desde la ficha, la hoja de cambio y el aviso de molestia repetida.
- Efectos: sale de `addExList`, de los candidatos de cambio y de los opcionales. En una rutina,
  `routineBuckets` lo sustituye por la primera alternativa válida; sin alternativa, se oculta con
  «Ocultos en esta rutina: 1 · ver», «Volver a incluir» y un aviso del tipo «Isquios: −3
  series/semana con este cambio» (calculado con `MUSC` y `dose`).
- `estMinutes`, `effList` y la regla del 60 % usan la lista ya filtrada, para que un ejercicio
  oculto no cuente como no hecho.
- HU-06b: `permitidos()` lee `rp_excluidos` en lugar de `rp_prefs.evitar`.
- Datos: clave `rp_` que la copia exporta sola. No borra nada de `rp_logs`; el historial de un
  excluido sigue en Progreso.

</details>

#### 3.2 · Cambiar un ejercicio desde el guiado, solo hoy o para siempre
`cambiar-ejercicio`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** Hevy, Fitbod, RP ·
**Depende de:** planificacion-excluir (obligatoria)

**Qué verás.** En la serie, un botón «Cambiar ejercicio». Eliges una alternativa y «Solo hoy» o
«Siempre en esta rutina»; cada candidato dice «Última vez 40×10» o «Nuevo para ti». Ejemplo: con la
prensa ocupada, «Solo hoy → Hack squat». En casa, sin la banda a mano, «Solo hoy → Remo inclinado
con mancuernas» (en ese teléfono no hay vetos).

**Por qué importa.** Hoy solo se cambia desde la lista de la rutina, entre alternativas escritas a
mano, y siempre de forma permanente. Resuelve la máquina ocupada sin salir del guiado y da una
salida real al radar y al aviso de molestia.

**Cómo lo hacen.** En Hevy el ejercicio de reemplazo hereda las series y el temporizador (notas de
versión 1.29.20/21), y en julio de 2026 anunció para Trainer «solo esta sesión» o «todas las
futuras». Fitbod ofrece «Replace» con alternativas filtradas por equipo. RP permite reemplazar desde
el menú del ejercicio (**no verificado**).

<details>
<summary>Nota técnica</summary>

- En `frame()` del guiado y en la ficha, «Cambiar ejercicio» abre la hoja de `openSwap` con dos
  botones por alternativa. «Solo hoy» escribe `rp_session.swapHoy[origen]=alt`; «Siempre» llama a
  `setSwap` (`rp_swaps`). Después `reanclar()` deja en la serie 1 del sustituto.
- `effList(k)` aplica `swapHoy` solo con una sesión viva de esa rutina y de hoy (también se usa en
  la lista, `estMinutes` y `sessStats`). Revisar `persistSession`, `resumeSessionCheck`,
  `finishSession` y `reanclar`.
- Candidatos: primero `ROUTINES[k].swaps`; después, como máximo 5, ejercicios con el mismo
  `ZONAS.p[0]`, el mismo tipo de conteo y el mismo `load`.
- Filtro de vetos: los candidatos excluyen `rp_excluidos`. Mientras la lista esté vacía o sin
  confirmar, un filtro manual en las rutinas de Gimnasio quita `remo_db`, `remo_inclinado`,
  `peso_muerto_rumano_db` y `encogimientos_db`, y cualquier ejercicio de aparato `mancuerna` con
  espalda como músculo principal.
- Se corrige el texto del radar, que hoy remite a una opción de la ficha que no existe.
- Datos: `swapHoy` opcional y temporal en `rp_session`, sin migración. Las series hechas con el
  original se quedan en su `exId`, y hay que avisarlo.

</details>

#### 3.3 · Molestia también en bandas y peso corporal, con botón para cambiar
`progresion-molestia-ampliada`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, RP ·
**Depende de:** cambiar-ejercicio y planificacion-excluir (mejora si existen)

**Qué verás.** Puedes anotar una molestia en cualquier ejercicio de repeticiones. La siguiente vez
hace una serie menos; si se repite (2 en 28 días), aparecen «Cambiar por <alternativa>» y «No volver
a proponer».

**Por qué importa.** Hoy solo se anota en ejercicios con carga y, tras dos molestias, la app dice
«plantéate cambiarlo» sin ofrecer nada. Convierte una anotación pasiva en una acción.

**Cómo lo hacen.** Fitbod deja elegir la zona, sugiere qué excluir y qué alternativas usar, y permite
marcarla como recuperada (*ayuda oficial*). RP pregunta por el dolor articular y reduce el volumen
o la carga de la sesión siguiente (*blog oficial*).

<details>
<summary>Nota técnica</summary>

- `painHTML` aparece también en ejercicios de repeticiones sin carga.
- Primera molestia: todo como hoy más una serie menos solo en la sesión siguiente (temporal, sin
  escribir en `rp_doses`).
- Dos o más en 28 días: botón que abre `openSwap` con las alternativas, nunca con vetos.
- Datos: `rp_pain` mantiene su formato. Sin chips de zona ni clave nueva.

</details>

#### 3.4 · Ver solo tus rutinas en este teléfono
`planificacion-rutinas-visibles`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** En Ajustes, «Rutinas que usas», con un interruptor por grupo. La madre oculta las de
gimnasio e Inicio le muestra solo las suyas, más un enlace «Ver todas las rutinas».

**Por qué importa.** Hoy los dos teléfonos muestran las 9 rutinas. Un Inicio más corto y claro.

**Cómo lo hacen.** Hevy y Fitbod solo muestran las rutinas o el plan del usuario, porque él las crea.

<details>
<summary>Nota técnica</summary>

- `rp_prefs.grupos`: lista de grupos visibles o `null` para todos (por defecto). Lo leen Inicio y
  `openPlan`.
- La tarjeta de hoy, el calendario y Progreso siguen mostrando cualquier rutina con historial o con
  sesión en curso.
- No protege de los vetos dentro de un grupo visible: eso lo hace 3.1.
- Datos: no oculta historial ni datos.

</details>

---

### Sprint 4 · El gimnasio real (v39)

#### 4.1 · Dejar un ejercicio para el final cuando la máquina está ocupada
`sesion-dejar-para-despues`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** RP, Fitbod, Hevy ·
**Depende de:** sesion-aviso-pendientes (obligatoria)

**Qué verás.** Junto a «Saltar ejercicio», un enlace «Dejar para después». Si la prensa está
ocupada, la mandas al final y la app te la vuelve a poner sin que la busques.

**Por qué importa.** Resuelve con un toque la interrupción más habitual del gimnasio sin tocar el
programa. No es una superserie: no alterna ejercicios.

**Cómo lo hacen.** RP deja reordenar ejercicios dentro de la sesión. Fitbod deja arrastrarlos antes y
durante la sesión. En Hevy, lo que no marcas sigue en la lista.

<details>
<summary>Nota técnica</summary>

- Lleva todos los pasos de ese ejercicio al final de `steps`. El orden se guarda en
  `rp_session.order` (lista de `exId`, solo para hoy).
- `buildSteps(k)` usa `s.order` si existe y, si no, `effList(k)`. `startRoutine`, `resumeGuided` y
  `reanclar()` deben leer el mismo `order` antes de aplicar `s.stepi`; si no, `s.stepi` apuntaría a
  otro paso.
- Reordenar de forma permanente queda fuera (sección 8).
- Datos: campo opcional en `rp_session`; las sesiones antiguas usan `effList`, sin migración.

</details>

#### 4.2 · Series de aproximación cuando entra un músculo nuevo
`sesion-aproximacion-por-musculo`

**Para:** el dueño · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, Hevy ·
**Depende de:** salto-real-maquina (mejora si existe; resuelta en el Sprint 1)

**Qué verás.** Las series ligeras de calentamiento aparecen también en el primer ejercicio de cada
músculo que aún no ha trabajado hoy, como el curl femoral en Pierna. Ya no se repiten dos series con
el mismo peso.

**Por qué importa.** Prepara cada articulación nueva del día sin añadir series inútiles en músculos
que ya trabajaron como secundarios (tríceps tras el press, bíceps tras el jalón).

**Cómo lo hacen.** Fitbod añade calentamiento solo al primer ejercicio con peso de cada grupo
muscular (*ayuda oficial*). Hevy calcula el calentamiento por porcentajes y lo redondea con el equipo
disponible.

<details>
<summary>Nota técnica</summary>

- Regla en `warmupHTML`: se muestra si ni el músculo principal ni los secundarios han aparecido hoy
  (como `p` o `s` en `ZONAS`) en un ejercicio con series con carga, y si el peso es de al menos 8 kg.
- Primer ejercicio de la rutina: 50 %×10 y 70 %×5; los demás, una sola serie al 60 %×6. Se omite la
  serie que, redondeada con `stepFor`, repite la anterior o queda a un salto o menos del peso de
  trabajo.
- Datos: no se registra nada. La madre no la ve (sus pesos son menores de 8 kg).

</details>

#### 4.3 · Ver lo que hiciste en esta misma serie la última vez y copiarlo
`sesion-previo-por-serie`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy ·
**Depende de:** —

**Qué verás.** Bajo los botones de peso y repeticiones: «Serie 3 la última vez: 37,5 × 8 · usar». Un
toque copia esos valores.

**Por qué importa.** Tienes delante la marca exacta que hay que superar, serie a serie, sin hacer
cuentas de memoria.

**Cómo lo hacen.** La columna PREVIOUS de Hevy muestra la misma serie la última vez y se copia al
tocarla; un ajuste elige si sale de cualquier entreno o de la misma rutina (*ayuda oficial*).

<details>
<summary>Nota técnica</summary>

- En `renderStep`, la línea «La última vez» marca en negrita la serie en curso, y una pastilla toma
  el último registro de `rp_logs[id]` de la misma rutina (`r.k === curRoutine`). Si no hay, usa
  `lastLog` y añade «(en <rutina>)». «usar» copia a `curW` y `curReps`; la sugerencia de
  `suggestLoad` sigue siendo el valor por defecto.
- Se toma la misma rutina porque algunos ejercicios aparecen en varias con dosis más suaves en el
  bloque secundario (`SECDOSE`).
- Datos: solo lee `rp_logs`.

</details>

#### 4.4 · Botón «Registrar serie» fijo abajo y botones −/+ más grandes
`sesion-boton-al-pulgar`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** El botón principal se queda siempre en el mismo sitio, al alcance del pulgar. Los −/+
crecen y repiten si los mantienes pulsados.

**Por qué importa.** Hoy cada serie registrada empuja el botón hacia abajo, y los −/+ miden 42 px,
por debajo de los 44 px que fija la sección de Accesibilidad del documento de diseño.

**Cómo lo hacen.** En Hevy se registra con el check de la propia fila. Que Fitbod registre con un
toque es **no verificado**. El argumento, que la acción principal no se mueva, vale por sí mismo.

<details>
<summary>Nota técnica</summary>

- En los pasos de repeticiones, `.gbtn.go` pasa a `position:sticky` con
  `bottom:calc(env(safe-area-inset-bottom) + 8px)` dentro de `.stage`, con fondo opaco.
- `.sq` sube a 48 px con `user-select:none`, `-webkit-touch-callout:none` y
  `touch-action:manipulation`. Mantener pulsado repite tras 400 ms, cada 120 ms; se detiene con
  `pointerup`, `pointerleave` o `pointercancel`. Respeta `prefers-reduced-motion`.
- Comprobar contraste en los dos temas, que no tape «Saltar ejercicio» y, en un móvil de 667 px, que
  no tape la fila de RIR con el teclado abierto.
- Datos: ninguno.

</details>

#### 4.5 · Registrar caminatas y otras actividades fuera de la app
`progreso-actividad-libre`

**Para:** la madre · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** En el calendario, «Registrar actividad»: eliges tipo (Caminar, Bici, Nadar, Baile,
Yoga/estiramientos, Otra) y minutos. Constancia muestra «Actividad: 135 de 150 min esta semana».

**Por qué importa.** Da al teléfono con objetivo salud una medida que hoy no existe y reconoce la
actividad hecha fuera de la app, sin backend ni relojes. Sube de v41 a v39 por su impacto.

**Cómo lo hacen.** Hevy permite registrar otra actividad, como un paseo, para mantener la racha
(*ayuda oficial*). Fitbod importa cardio de Strava y Apple Health para la recuperación.

<details>
<summary>Nota técnica</summary>

- Clave nueva `rp_act [{date, tipo, min, int?, t}]`, minutos de 5 a 300, intensidad opcional, con un
  tope como el de `HISTMAX`. Va aparte de `rp_history` para no romper nada que espere rutinas.
- Referencia de la OMS: 150 min moderados por semana; la actividad intensa cuenta doble.
- Solo aparece si hay registros o con objetivo salud. No cuenta para la meta de fuerza ni para las
  series por músculo.
- Datos: comprobar que `exportData`, `importData` y el borrado total la incluyen por el prefijo
  `rp_`. Entrada manual porque una PWA no puede leer Salud ni Health Connect.

</details>

---

### Sprint 5 · Asistente con IA

Las historias están detalladas en [`docs/ia-claude.md`](ia-claude.md), sección 12. Aquí solo su
encaje en el plan.

| Historia | Qué verás | Para | Esfuerzo | Depende de |
|---|---|---|---:|---|
| **HU-06a** · Base del asistente | En Ajustes, «Asistente»: clave enmascarada, consentimiento, modelo y gasto del mes. Sin clave o sin conexión no aparece ningún botón. | Los dos | 17,5 h | — |
| **HU-06b** · Ejercicios permitidos y validadores | El asistente solo propone ejercicios de tus rutinas que no estén excluidos ni con molestias recientes. | Los dos | 9 h | HU-06a; planificacion-excluir (obligatoria) |
| **HU-06c** · Comentario al terminar | En la pantalla de fin, un comentario breve sobre la sesión y qué mirar la próxima vez. | Los dos | 10 h | HU-06a, HU-06b |
| **HU-06g** · Consola y teléfono de la madre | El asistente funciona en el teléfono de la madre con su propio límite de gasto. | La madre | 2 h | HU-06a |

**Lista única.** La lista «No proponer» de HU-06b se unifica con la de `planificacion-excluir`:
`permitidos()` lee `rp_excluidos`, que entra en la copia y nunca se envía a la API. Las claves
`ia_*` (la clave de la API y el gasto) quedan fuera de la copia a propósito, como explica ese
documento.

---

### Sprint 6 · Plan y lectura semanal (v40)

#### 6.1 · Plan semanal con «Siguiente de Gimnasio»
`planificacion-rotacion-dias`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** RP, Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** En el plan, en lugar de fijar «lunes Empuje, miércoles Tirón», eliges «Siguiente de
Gimnasio» y la app pone la rutina que toca según lo último que hiciste. Si fallas un día, la sesión
se aplaza en lugar de perderse.

**Por qué importa.** Hoy, si el lunes no hiciste Empuje, el martes la app propone Tirón igualmente.
Convierte en código la regla del 4.º día rotativo, que hoy solo está escrita en el diseño. Con 3
días por semana, perder uno sigue dejando la semana en 2 de 3: lo que se gana es que la sesión se
aplaza.

**Cómo lo hacen.** RP permite etiquetar los días como Day 1..N y hacerlos en orden (**no
verificado**). Hevy asigna rutinas a días fijos, como Mi Rutina hoy. Fitbod genera la sesión cada
día.

<details>
<summary>Nota técnica</summary>

- Nuevo valor `next:<grupo>` en `rp_plan`, ofrecido al principio de `openPlan` como «Siguiente de
  Gimnasio» y «Siguiente de Casa».
- Se resuelve con la última sesión de ese grupo en `rp_history` que cumpla la regla del 60 %, y se
  toma la siguiente de forma circular (Empuje→Tirón→Pierna, Casa A→B→Equilibrio). Sin historial, la
  primera. Un día ya entrenado muestra lo que se hizo.
- Actualizar a la vez `planShort`, `renderWeek`, `renderTodayCard`, `weekGoal` y `adherence`.
- Datos: `rp_plan` sigue siendo un array de 7 que admite un texto nuevo. Importado en una versión
  anterior, esos días salen como «+» sin romper nada.

</details>

#### 6.2 · Recordatorios solo los días de entreno y con la rutina que toca
`progreso-recordatorios-plan`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, Hevy ·
**Depende de:** planificacion-rotacion-dias (mejora si existe)

**Qué verás.** El aviso solo suena si hoy toca entrenar y aún no lo has hecho, y dice qué toca: «Hoy
toca Empuje · ~65 min». Con una sesión a medias: «Te quedan 3 ejercicios de Tirón». Los días de
descanso no suena.

**Por qué importa.** Hoy suena todos los días, también los de descanso y aunque ya hayas entrenado,
con un texto fijo que incumple la regla de cero emojis de la sección de Iconografía del documento de
diseño.

**Cómo lo hacen.** En Fitbod, con días concretos, el aviso con la vista previa del entreno llega solo
esos días (*ayuda oficial*). El widget de Hevy es **no verificado**.

<details>
<summary>Nota técnica</summary>

- `rp_rem` gana `mode`: `diario` por defecto en los datos existentes y `plan` por defecto al volver
  a activarlos. En `plan`, el aviso sale si `rp_plan[hoy]` es una rutina (resolviendo `next:*` si
  existe) y no hay sesión de hoy en `rp_history`.
- Tras `finishSession` se vuelve a llamar a `scheduleRem()` y se cancela la notificación de hoy por
  su `tag`.
- En segundo plano sigue dependiendo de `TimestampTrigger`, que es experimental: Ajustes debe decir
  que funciona mejor con la app instalada y abierta hace poco.
- Datos: campo nuevo con un valor por defecto que conserva el comportamiento actual.

</details>

#### 6.3 · Resumen de la semana anterior al abrir la app el lunes
`progreso-resumen-semanal`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** alto · **Viene de:** Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** La primera vez que abres la app cada semana, una tarjeta en Inicio con cómo fue la
anterior: entrenos frente a la meta, series, récords, el músculo que quedó corto, días de postura y
cambio de peso. Se cierra con una X.

**Por qué importa.** La semana es la unidad real de la meta y de la racha, y hoy nada la cierra.

**Cómo lo hacen.** Fitbod envía un informe semanal y mensual con entrenos, peso, duración y músculos
(*ayuda oficial*); que llegue los lunes es **no verificado**.

<details>
<summary>Nota técnica</summary>

- Sesiones frente a la meta congelada (`rp_weekgoal`), series y récords frente a la semana previa,
  músculo con más déficit (`muscleSets`), días de postura y cuello, cambio de la media de 7 días.
- Kilos levantados solo con objetivo masa; con objetivo salud, minutos entrenados. Frase final con
  las reglas del veredicto de Progreso. Sin emojis.
- Datos: un campo `rp_prefs.weekRecap` para marcarla como vista. Sin notificación del lunes
  (dependería de `TimestampTrigger`).

</details>

#### 6.4 · Ficha de progreso por ejercicio
`progreso-ficha-ejercicio`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** alto · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** En Progreso, «Tus ejercicios». Al tocar uno ves su curva, sus récords, tu mejor peso
para cada número de repeticiones y tus últimas sesiones, sin empezar una rutina. El radar y los
récords recientes enlazan a esta ficha.

**Por qué importa.** Responde a «¿cómo voy en X?» sin abrir una sesión. Hoy la curva solo se ve desde
el guiado.

**Cómo lo hacen.** En Hevy cada ejercicio tiene su página con gráfica, récords, tabla del mejor peso
por repeticiones e historial (*ayuda oficial*). El historial por ejercicio de Fitbod es **no
verificado**.

<details>
<summary>Nota técnica</summary>

- Lista ordenada por última fecha, con última marca, `spark` y cambio en 8 semanas. La hoja usa
  `exChart(id)`, `bestE1`, tabla por repeticiones (solo con carga), 10 últimas sesiones, nota fija y
  molestias de 28 días.
- Enlaces con `role=button` (sección de Accesibilidad del diseño). Los ejercicios solo marcados con
  visto salen como «N veces», sin curva. Los propios borrados aparecen si tienen historial.
- Datos: solo lee `rp_logs`, `rp_notes` y `rp_pain`.

</details>

---

### Sprint 7 · Día a día (v41)

#### 7.1 · Sonido y vibración ajustables, cuenta 3-2-1 y aviso de cambio de lado
`sesion-sonido-ajustable`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** En Ajustes eliges «sonido y vibración», «solo vibración» o «nada». Antes de que acabe
un descanso o un sostén suena 3-2-1, y al pasar de un lado al otro suena un tono distinto con
«Cambia de lado» en el anillo.

**Por qué importa.** La señal llega sin mirar la pantalla, tumbada en el tapete o con las manos
ocupadas, y se puede apagar donde molesta. Hoy el cambio de lado suena igual que el final.

**Cómo lo hacen.** Que Hevy y Fitbod tengan ajustes de sonido del temporizador es **no verificado**.
La idea se sostiene sola.

<details>
<summary>Nota técnica</summary>

- `rp_prefs.sound`; `beep()` y la vibración de `logSet()` lo consultan.
- Tic a los 3, 2 y 1 s; `upd()` lo emite una vez por segundo (el intervalo es de 250 ms).
- En `hold_side`, tono ascendente al cambiar de lado.
- Datos: campo nuevo; si no existe, todo suena como hoy.

</details>

#### 7.2 · Compartir el resumen de la sesión o de la semana como texto
`progreso-compartir-resumen`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy ·
**Depende de:** progreso-resumen-semanal (parcial: solo la parte semanal)

**Qué verás.** Un botón «Compartir» en la pantalla de fin y en el resumen semanal que envía un texto
sencillo por WhatsApp o cualquier otra app: «Casa — Fuerza A · 28 min · 6 ejercicios · 14 series» y
una línea por ejercicio.

**Por qué importa.** Seguimiento entre las dos personas sin backend ni cuentas, y una salida útil
para pegar en un asistente de IA. No es una función social: no hay feed ni perfil, y es el usuario
quien decide compartir.

**Cómo lo hacen.** Lo que Hevy comparte es social; su envío a asistentes de IA solo aparece en un
listado de terceros (**no verificado**).

<details>
<summary>Nota técnica</summary>

- `navigator.share({text})`, o copia al portapapeles si no está disponible. Texto plano, sin emojis.
- La parte de la sesión funciona sola.
- Datos: solo lectura.

</details>

#### 7.3 · Nota de hoy por ejercicio, que reaparece la próxima vez
`sesion-nota-de-hoy`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy ·
**Depende de:** —

**Qué verás.** Bajo las series de hoy, «Nota de hoy» abre un campo corto («asiento en 4», «hoy con la
banda verde»). La próxima vez aparece junto a «La última vez: 40×10, 40×9 · «asiento en 4»».

**Por qué importa.** Deja el contexto de una sesión sin convertirlo en norma. Hoy solo hay una nota
fija por ejercicio. Cierra la parte de notas del pendiente «RPE y notas por serie» de la lista de
pendientes del documento de diseño.

**Cómo lo hacen.** Hevy distingue las notas fijas de las notas del entreno, guardadas con esa sesión
(*ayuda oficial*).

<details>
<summary>Nota técnica</summary>

- Campo de 120 caracteres en `rp_session.notes[id]`; `persistSession` lo copia al registro de
  `rp_logs` como `note`. Se edita o borra en Historial > Corregir.
- `saveSetEdit` no debe perder `note`. El texto se escapa con `esc` al pintarlo.
- Datos: campo opcional en `rp_logs`; los registros antiguos no lo tienen y la copia lo exporta.

</details>

#### 7.4 · Duración real de la sesión, sin inflarse por cerrar tarde
`sesion-duracion-real`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** Si entrenas de 18:00 a 19:05 y cierras a las 21:30, se guardan 67 minutos y no 210.
Una sesión sin cerrar durante horas muestra «Sin cerrar desde las 18:40 · Guardar».

**Por qué importa.** Minutos fiables en el historial, en la pantalla de fin y en la estimación de
duración. Hoy una sesión rescatada guarda 0.

**Cómo lo hacen.** Fitbod permite pausar hasta 3 h y después guarda el entreno solo (*ayuda
oficial*). Que Hevy deje editar la duración es conocido pero **no reverificado**.

<details>
<summary>Nota técnica</summary>

- En `durSince`/`persistSession`: el fin es la serie más tardía de `sessionLog` (o `lastAt`) más
  2 min; si ahora − fin ≤ 30 min, se usa ahora. `dur = fin − startedAt`, tope 240. Los rescates usan
  el mismo cálculo.
- Con más de 3 h sin actividad, la hoja «Entrenamiento sin cerrar» (`openFinish`) solo se abre al
  tocar la tarjeta. Opcional: editar la duración en `renderFinish` (1-240).
- Datos: solo cambia el cálculo de `rp_history.dur` en sesiones nuevas.

</details>

---

### Sprint 8 · Asistente: revisión y adaptar

Detalle en [`docs/ia-claude.md`](ia-claude.md), sección 12.

| Historia | Qué verás | Para | Esfuerzo | Depende de |
|---|---|---|---:|---|
| **HU-06d** · Revisión semanal de series | En Progreso, una vez por semana, hasta 4 propuestas de ±1 serie con su porqué; cada una se aplica o se descarta por separado. | El dueño | 15 h | HU-06a, HU-06b |
| **HU-06e** · Adaptar la sesión de hoy | Cuentas el imprevisto con tus palabras («no está libre la polea») y recibes la sesión ajustada solo para hoy. | Los dos | 22 h | HU-06a, HU-06b; cambiar-ejercicio (mejora si existe) |
| **HU-06f** · Preguntas de técnica | En la ficha del ejercicio, hasta 3 preguntas al día con respuesta basada en sus pasos. | Los dos | 8,5 h | HU-06a |

---

### Sprint 9 · Lecturas que deciden (v42)

#### 9.1 · «Por qué está en tu rutina»: una frase por ejercicio
`planificacion-porque-en-rutina`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** RP, Fitbod ·
**Depende de:** —

**Qué verás.** En la ficha del guiado, bajo el consejo: «Por qué en tu Empuje: …». En el catálogo,
«Está en: Empuje, Tirón», y en un ejercicio cambiado, «Sustituye a X».

**Por qué importa.** Da confianza y constancia: cada uno sabe para qué sirve cada ejercicio y cuesta
menos cambiarlo sin motivo. Hoy ese razonamiento solo existe en comentarios del código.

**Cómo lo hacen.** RP publica guías de selección de ejercicios por músculo. Que Fitbod explique cada
ejercicio es **no verificado**.

<details>
<summary>Nota técnica</summary>

- Campo estático `ROUTINES[k].why = {exId: 'una frase'}`, unas 40 frases. Las de casa se escriben
  desde cero.
- Contenido: funcional para el teléfono con objetivo salud («fuerza para el día a día») y ligado a las restricciones
  del perfil para el dueño, sin detallar motivos de salud.
- Datos: vive en el código.

</details>

#### 9.2 · Del «punto débil» a sumar una serie con un toque
`planificacion-punto-debil-accion`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** RP, Fitbod ·
**Depende de:** —

**Qué verás.** Cuando Progreso dice que un músculo va corto, ofrece «Sumar 1 serie a <ejercicio> en
<rutina>», pero solo si el problema es el programa. Si el programa ya lo cubre, dice «Tu programa ya
cubre X; el déficit viene de sesiones no hechas».

**Por qué importa.** Cierra el paso de la medición al programa sin sumar series a quien en realidad
faltó a sesiones.

**Cómo lo hacen.** RP prioriza músculos al construir el mesociclo y Fitbod tiene objetivos semanales
de series por músculo; ninguno se verificó en esta pasada.

<details>
<summary>Nota técnica</summary>

- Series planificadas = `dose × MUSC` en las rutinas del plan. Si no llega al objetivo, se elige un
  ejercicio con ese músculo como principal y con carga, preferiblemente del bloque de entrenamiento.
- El botón llama a `setDose`; se deshace con «Volver a las sugeridas». Tope de +2 series por
  ejercicio. En salud solo se ofrece agregar un opcional (`rp_extras`).
- Datos: reutiliza `rp_doses` y `rp_extras`.

</details>

#### 9.3 · Tu material: filtrar el catálogo y las alternativas
`planificacion-perfil-equipo`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** En Ajustes, «Tu material», con atajos Gimnasio y Casa. El catálogo y las alternativas
solo ofrecen lo que puedes hacer; un interruptor «Ver todos» lo desactiva.

**Por qué importa.** Hoy la madre ve hack squat y poleas en «Agregar ejercicio». El dato de aparato,
hoy decorativo, pasa a decidir qué se propone.

**Cómo lo hacen.** Fitbod tiene perfiles de gimnasio con su equipo (*ayuda y blog oficiales*). Hevy
filtra su biblioteca por equipo.

<details>
<summary>Nota técnica</summary>

- Un único `rp_prefs.equipo`: lista de claves de `EQ` o `null` para todo (por defecto). Se aplica en
  `addExList` y en los candidatos automáticos de cambio. Un ejercicio sin aparato siempre es apto.
- Añadir «tapete» a `EQ` es opcional y obliga a revisar los ejercicios de suelo.
- Datos: con `null` todo funciona como hoy.

</details>

#### 9.4 · Ver la ficha antes de agregar un ejercicio y filtrar por aparato
`planificacion-catalogo-filtros`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Hevy, Fitbod, RP ·
**Depende de:** planificacion-perfil-equipo y planificacion-excluir (mejora si existen)

**Qué verás.** En «Agregar ejercicio», chips de aparato y un botón «Ver» en cada fila que abre la
ficha (figura, mapa, consejo y vídeo) con «Agregar a esta rutina».

**Por qué importa.** Ver cómo se hace un ejercicio antes de comprometerse. Hoy, al tocar una fila, se
agrega sin ver nada.

**Cómo lo hacen.** Hevy y Fitbod tienen catálogos filtrables por músculo y equipo, con ficha; RP
elige por grupo muscular en cada hueco.

<details>
<summary>Nota técnica</summary>

- Chips con las claves de `EQ` más «Sin material» y, si existe 9.3, «Solo mi material». La ficha
  reutiliza `panelZona`, `vidInfo` y el vídeo; con 3.1, añade «No volver a proponer».
- Datos: solo lectura; agrega con `rp_extras`.

</details>

#### 9.5 · Índice de fuerza desglosado en empuje, tirón y pierna
`progreso-fuerza-por-grupo`

**Para:** el dueño · **Esfuerzo:** S · **Impacto:** medio · **Viene de:** Fitbod ·
**Depende de:** —

**Qué verás.** Bajo el número grande de fuerza, tres cifras pequeñas: «Empuje 112 · Tirón 104 ·
Pierna 97». Si una zona va por detrás de forma sostenida, el veredicto lo dice.

**Por qué importa.** Localiza el estancamiento por zona en lugar de diluirlo en una media, y encaja
con los días de empuje, tirón y pierna.

**Cómo lo hacen.** Fitbod calcula una puntuación de fuerza por músculo, la agrupa en Push, Pull y Legs
y saca una media (*ayuda oficial*).

<details>
<summary>Nota técnica</summary>

- `strengthIdx` filtrado por músculo principal: pecho, tríceps y deltoides anterior y lateral en
  empuje; espalda, bíceps y deltoides posterior en tirón; cuádriceps, isquios, glúteo y gemelo en
  pierna. Mínimo 2 ejercicios válidos por grupo o «—». Las elevaciones laterales cuentan en empuje, y
  se dice.
- Aviso si un grupo está 8 puntos o más por debajo de la media y se mantiene 28 días.
- A la madre casi no le aparecerá (el índice solo cuenta series con peso de 12 reps o menos).
- Datos: solo lee `rp_logs`.

</details>

---

### Sprint 10 · Casa y material ligero (v43)

#### 10.1 · Qué hacer cuando ya no se puede subir
`progresion-techo-sin-carga`

**Para:** la madre · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** RP, Hevy ·
**Depende de:** progresion-objetivo-cambia-regla (obligatoria)

**Qué verás.** Cuando llegas al tope en un ejercicio sin peso o con tu mancuerna más pesada, la app
propone el siguiente paso: una variante más difícil con un botón («Pasar a flexiones»), «Usa una
banda más dura» con «Cambié de banda», o, con objetivo salud, «Estás en tu techo con este material:
mantenerlo ya es el objetivo».

**Por qué importa.** Hoy esa progresión se acaba en 12 repeticiones sin decir qué sigue.

**Cómo lo hacen.** RP recomienda cambiar de variante cuando un ejercicio deja de progresar. Su regla
de «+1 rep dentro de 5-30» y el cambio de Hevy para ejercicios solo de repeticiones son **no
verificados**.

<details>
<summary>Nota técnica</summary>

- Rama «techo» en `todayTarget`: sin carga con todas las series en el tope en las 2 últimas
  sesiones, o mancuerna más pesada con tope+2 alcanzado 2 veces.
- Escalera: (1) `harder[id]` declarado en la rutina (para empezar `flexiones_pared→flexiones`,
  `sentadilla_silla→sentadilla_goblet`, `remo_banda→remo_inclinado`), botón que llama a `setSwap`;
  (2) en bandas, `rp_prefs.banda[id]` guarda la fecha y devuelve la sugerencia al mínimo; (3) en
  salud, mensaje de logro. En masa, +1 serie opcional.
- Datos: campo opcional en `rp_prefs`; reutiliza `rp_swaps` y `rp_doses`.

</details>

#### 10.2 · Registrar los sostenes («Paré antes») y progresar el equilibrio
`sostenes-registro-y-progresion`

**Para:** la madre · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** Durante un ejercicio cronometrado aparece «Paré antes». La próxima vez ves «La última
vez: 30 s · 30 s · 22 s». En el equilibrio a una pierna, si aguantas todo 2 sesiones, el tiempo sube
5 s.

**Por qué importa.** Hoy los 12 ejercicios cronometrados no dejan ningún dato y no hay forma de decir
que no aguantaste. El equilibrio deja de ser estático.

**Cómo lo hacen.** Hevy tiene ejercicios por duración con récord de mejor tiempo, solo como registro.
En Fitbod no se verificó.

<details>
<summary>Nota técnica</summary>

- Clave aparte `rp_holds {exId: [{date, sec, ok}]}`, máximo 60 entradas por ejercicio, para no meter
  en `rp_logs` series sin repeticiones ni tocar sus lectores.
- Los sostenes no cuentan como series en la pantalla de fin, el resumen del mes ni `rp_history`; se
  muestran aparte («3 sostenes · 2 completos»).
- Progresión solo en la lista blanca `EX[id].progTime` (de entrada, `equilibrio_unipodal`): +5 s en
  `rp_doses[k][id].holdSec` hasta un techo (por ejemplo, 45 s), y después el siguiente escalón del
  consejo («ojos cerrados», que vuelve a 20 s). El tiempo no se edita a mano (regla v27).
- No se alarga el tiempo de estiramientos, respiración, piernas en la pared, cuello ni cardio. La
  caminata del granjero queda fuera: su progreso es la carga, pero no tiene `load:true` y su peso no
  se puede anotar; hay que revisarlo aparte.

</details>

#### 10.3 · Peso por mancuerna y repeticiones por lado
`sesion-peso-por-mancuerna`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** bajo · **Viene de:** RP, Fitbod ·
**Depende de:** —

**Qué verás.** En los ejercicios con mancuernas la etiqueta dice «Peso · por mancuerna» y la serie
«2 kg c/u × 12». En los ejercicios por lado, la etiqueta dice «reps por lado».

**Por qué importa.** Evita el error de anotación más fácil con mancuernas ligeras (un día el par,
otro una sola), que duplicaría o partiría por la mitad la curva. Lo mismo con las repeticiones por
lado.

**Cómo lo hacen.** RP tiene una convención para ejercicios por lado: empezar por el lado débil y
anotar las repeticiones de un lado. Para el peso por mancuerna no se encontró documentación pública
de RP ni de Fitbod; StrengthLog documenta que varía según el ejercicio, lo que confirma la
ambigüedad.

<details>
<summary>Nota técnica</summary>

- Si `ZONAS[id].eq` es `mancuerna` (también en ejercicios propios), etiqueta «por mancuerna». En
  `reps_side`, etiqueta «reps por lado».
- La fórmula de kilos movidos no cambia, para no romper la comparación con meses anteriores.
- Datos: solo cambia el texto.

</details>

#### 10.4 · Ejercicios propios con secundarios, vídeo y peso inicial
`planificacion-propios-completos`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** bajo · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** Al crear un ejercicio propio puedes indicar qué otros músculos trabaja, un enlace de
vídeo y con qué peso empezar, para que no arranque en 10 kg.

**Por qué importa.** Los propios quedan al nivel del catálogo en series por músculo, instrucciones y
primera sugerencia.

**Cómo lo hacen.** Hevy y Fitbod admiten músculos secundarios en los propios, y Hevy una imagen o un
vídeo (**no verificado** en esta sesión).

<details>
<summary>Nota técnica</summary>

- Tres campos opcionales en `rp_custom`: `zonasS` (cuentan 0,5), `video` (URL de YouTube validada
  con el parser de `VID`, mostrada con youtube-nocookie) y `startKg`. Sin `startKg`, la mancuerna
  más ligera de `pesosDB` o el `startKg` de una rutina de casa.
- Datos: entradas antiguas funcionan sin migración. No se suben fotos.

</details>

---

### Sprint 11 · Estancamiento (v44)

#### 11.1 · Semana de descarga cuando la pidas
`progresion-descarga-bajo-demanda`

**Para:** el dueño · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** RP, Hevy ·
**Depende de:** salto-real-maquina (obligatoria; resuelta en el Sprint 1)

**Qué verás.** Un botón «Semana de descarga» en el radar y en Ajustes. Durante esa semana, la tarjeta
de hoy dice «Semana de descarga: la mitad de series, un 10 % menos». No se ofrece con objetivo
salud.

**Por qué importa.** Da una salida concreta al estancamiento, la fatiga o la vuelta de un viaje. Era
el punto 5 de la comparación con apps líderes en la lista de pendientes del diseño.

**Cómo lo hacen.** RP termina siempre el mesociclo con una descarga y baja el RIR objetivo cada
semana (*ayuda oficial*). Lo de los bloques de Hevy Trainer es **no verificado**. Aquí se propone
bajo demanda porque Coleman et al. 2024 no encontraron más hipertrofia con una descarga programada,
y sí algo menos de fuerza en el tren inferior.

<details>
<summary>Nota técnica</summary>

- Clave nueva `rp_deload {from, to, hist:[…]}`. En el intervalo, `dose()` devuelve la mitad de las
  series (hacia arriba) y `todayTarget` propone peso × 0,9 redondeado hacia abajo con `stepFor`,
  reps al mínimo.
- `lastLog`, `bestE1`, `stalled`, `overloadIndex`, `strengthIdx` e `isPR` ignoran los registros con
  fecha dentro de `rp_deload.hist`. Si se olvida uno, la semana ligera hundiría la curva o serviría
  de base a la siguiente sugerencia.
- Datos: `rp_logs` no necesita ningún campo nuevo.

</details>

#### 11.2 · Aplicar con un toque las salidas del radar de estancamiento
`progresion-radar-accionable`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** Fitbod, RP, Hevy ·
**Depende de:** progresion-bajar-tras-fallos y cambiar-ejercicio (obligatorias);
progresion-descarga-bajo-demanda (mejora si existe)

**Qué verás.** Cada ejercicio estancado gana botones: «Bajar 10 %», «Una serie más (3 semanas)»,
«Cambiar» y «Semana de descarga». La fila recuerda lo elegido («Bajaste el 14/10») y avisa si 4
semanas después sigue estancado.

**Por qué importa.** Cierra el bucle de detectar y actuar sin quitarte la decisión. Hoy el radar es
solo texto.

**Cómo lo hacen.** Fitbod y RP lo deciden solas: bajan la carga, cambian el ejercicio o cierran el
bloque con una descarga. Aquí eliges tú, con un toque.

**Decisión pendiente: el descanso.** Opción A: excepción a la regla v27 con «Probar 180 s» solo en
multiarticulares estancados. Opción B: mantener la regla y quitar «Subir el descanso a 180 s» del
texto del radar. Schoenfeld 2016 encontró beneficio con 3 min de descanso en multiarticulares; en
aislamientos la evidencia es menor, y 180 s alargarían sesiones que ya duran 62-68 min.

<details>
<summary>Nota técnica</summary>

- «Bajar 10 %» guarda `rp_reset {exId:{w,date}}`, que `todayTarget` usa una vez si es más reciente
  que la última sesión (misma rama que 2.2).
- «Una serie más» guarda `rp_doses[k][id] = {sets+1, until}`; `dose()` ignora el ajuste vencido.
- «Cambiar» abre 3.2 en modo «siempre».
- Opción A: `rp_doses[k][id].rest=180` y en el guiado «por el radar · volver al del programa».
- Datos: clave nueva `rp_reset` y campo opcional `until`; los ajustes vencidos se limpian al leerlos.

</details>

#### 11.3 · Series por músculo de semanas pasadas, con tendencia
`progreso-musculo-historico`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** Flechas ‹ › en «Series por músculo · semana del 6 oct» para ir hasta 11 semanas atrás.
Al tocar una barra, una minicurva de 12 semanas: «Media 8,5 · objetivo 10 · 3 de 12 semanas
cumplidas». En el resumen del mes, «Bajo objetivo este mes: Isquios (6/sem)».

**Por qué importa.** Distingue un punto débil real de una semana mala. Era el desglose por músculo
que faltaba en el resumen mensual, según la lista de pendientes del diseño.

**Cómo lo hacen.** Hevy muestra las series por músculo de cada semana, con flechas, y un gráfico por
grupo (*web oficial*). Fitbod tiene objetivos semanales por músculo.

<details>
<summary>Nota técnica</summary>

- Para hacerlo en pequeño, primero las flechas y el resumen del mes; la minicurva exige ampliar
  `chart()` con la línea de objetivo.
- Datos: lee `rp_logs`; `muscleSets` ya admite rangos de fechas.

</details>

---

### Sprint 12 · Pulido (v45)

#### 12.1 · «Tengo 30 minutos»: versión recortada de la rutina para hoy
`planificacion-duracion-objetivo`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** Fitbod, Hevy ·
**Depende de:** —

**Qué verás.** Un chip «¿Menos tiempo?» en la cabecera con 45, 30 o 20 minutos. La app recorta la
rutina empezando por lo accesorio; la fila dice «Recortado hoy» y el fin «Versión de 45 min».

**Por qué importa.** Un día con poco tiempo deja de ser un día perdido. Es la alternativa sensata a
las superseries descartadas.

**Cómo lo hacen.** En Fitbod la duración (15 a 90 min) decide cuántos ejercicios entran y se puede
cambiar solo para el día (*ayuda oficial*). Lo de Hevy Trainer es **no verificado**.

<details>
<summary>Nota técnica</summary>

- Orden de recorte hasta que `estMinutes` quede por debajo: (1) bloque secundario; (2) cardio de
  calentamiento a 3 min; (3) desde el tercer ejercicio, una serie menos (mínimo 2), desde el final;
  (4) último aislamiento. En casa nunca se quitan `equilibrio_unipodal` ni `caminata_granjero`.
- `rp_session.recorte`, leído por `effList` y `dose`; `rp_history` guarda `recorte:min` y `exTotal`
  se calcula con la lista recortada (si no, la regla del 60 % castigaría una sesión corta completa).
- Si se usa a menudo, el volumen semanal baja: conviene mostrarlo en el fin o en Progreso.

</details>

#### 12.2 · Elegir el periodo de las curvas
`progreso-rango-grafica`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** bajo · **Viene de:** Hevy ·
**Depende de:** —

**Qué verás.** Botones «3 m · 1 año · Todo» encima de cada curva y de la de peso corporal.

**Por qué importa.** Las curvas siguen legibles a medida que crece el historial, y un año de peso
estable se ve como el éxito que es. Hoy aporta poco y gana valor con el tiempo.

**Cómo lo hacen.** Las gráficas de Hevy se ven en 3 meses, un año o todo; las dos últimas son de pago
(*web oficial*).

<details>
<summary>Nota técnica</summary>

- `rp_prefs.chartRange` (`3m` por defecto) en `exChart` y la tarjeta de peso. Con más de 60 puntos,
  se agrupa por semana (máximo de cada una).
- Datos: solo una preferencia nueva.

</details>

#### 12.3 · Hallazgos de las auditorías de calidad

El resto del sprint se reserva para los hallazgos de las auditorías de calidad de código y diseño
que se hagan durante los sprints anteriores.

---

### Backlog (sin fecha)

#### B.1 · Notificación de sesión con la siguiente serie y «Saltar descanso»
`sesion-notificacion-viva`

**Para:** los dos · **Esfuerzo:** M · **Impacto:** medio · **Viene de:** Hevy, Fitbod ·
**Depende de:** sesion-notificacion-abre-app (obligatoria)

**Qué verás.** Con la app en segundo plano: «Descanso hasta 18:42 · Sigue: Serie 3 de 4 · Prensa
80 kg × 10». En Android, un botón «Saltar descanso».

**Por qué importa.** Es lo más parecido a una Live Activity que permite una PWA. En iOS solo abriría
la app.

<details>
<summary>Nota técnica</summary>

- Notificación `rp-live` al ocultar la app con `restNotify` activo; la acción se envía con
  `postMessage` para que la app ejecute `skipRest()`. Se cierra al volver. Nunca se registran series
  desde la notificación.
- Datos: ninguno.

</details>

#### B.2 · Exportar series, pesajes y medidas a hoja de cálculo
`progreso-exportar-csv`

**Para:** los dos · **Esfuerzo:** S · **Impacto:** bajo · **Viene de:** Hevy, Fitbod ·
**Depende de:** —

**Qué verás.** En Ajustes, «Exportar para hoja de cálculo»: un archivo de series y otro de peso y
medidas que se abren en Excel.

**Por qué importa.** Los datos se pueden llevar a cualquier sitio. El resumen compartido (7.2) cubre
buena parte de la necesidad, por eso queda en el backlog.

<details>
<summary>Nota técnica</summary>

- CSV de series desde `rp_logs` y de cuerpo uniendo `rp_bw` y `rp_medidas`, con `;`, coma decimal y
  BOM UTF-8. No toca `rp_lastexport`. Hay que decir que no sirve para restaurar.

</details>

#### B.3 · Contar el peso corporal en los fondos con lastre
`progreso-peso-corporal-en-volumen`

**Para:** el dueño · **Esfuerzo:** S · **Impacto:** bajo · **Viene de:** Hevy ·
**Depende de:** —

**Qué verás.** En los fondos en paralelas, la fuerza y la curva cuentan tu peso corporal más el
lastre. En pantalla se sigue viendo «+5 kg».

**Por qué importa.** Hoy los fondos sin lastre cuentan como 0 y al pasar a 5 kg la fuerza aparece de
golpe. Que la medida los premie no debe empujar a meter lastre: la progresión de carga sigue sobre
el lastre.

<details>
<summary>Nota técnica</summary>

- Marca `bw:true` en `fondos_paralelas` (y opción en los propios). En `exSeries`, `bestE1`,
  `strengthIdx`, `isPR`/`prLevel` y `stalled`, carga = lastre + pesaje de `rp_bw` más cercano
  anterior; sin pesaje, como hoy. `monthSummary` no cambia.

</details>

#### B.4 · Fotos de progreso con comparación
`progreso-fotos`

**Para:** los dos · **Esfuerzo:** L · **Impacto:** medio · **Viene de:** Hevy ·
**Depende de:** requisito previo: que la copia incluya las fotos

**Qué verás.** En Progreso, bajo Medidas, «Añadir foto» (frente, perfil o espalda) y una comparación
de dos fechas con un deslizador.

**Por qué importa.** La báscula y la cinta no lo dicen todo. Pero hoy rompería la garantía de que la
copia lo lleva todo: por eso **solo entra si `exportData` incluye las fotos**.

**Requisitos para sacarla del backlog** (no son avisos, son condiciones):

- `exportData` incluye las fotos (en base64 dentro del JSON o en un archivo adjunto) e `importData`
  las restaura.
- El borrado total las elimina.
- La función es opcional y discreta.

<details>
<summary>Nota técnica</summary>

- Imagen reducida a 1080 px en JPEG (150-250 KB) en IndexedDB, con índice `rp_fotos [{date, pose}]`.
- Superposición en directo con la cámara (`getUserMedia`) como fase 2 opcional; tiene restricciones
  en las PWA de iOS.

</details>

#### B.5 · Intermediario sin servidor propio (HU-06h)

Opcional, 7 h, solo si se cumple alguno de los motivos de la sección 4.1 de
[`docs/ia-claude.md`](ia-claude.md): un Cloudflare Worker guarda la clave y cada teléfono usa un
código revocable.

---

## 8. Descartes

### Sin evidencia suficiente

- **Preguntas de bombeo, carga y agujetas que ajustan las series** (RP). El bombeo y las agujetas no
  son buenos indicadores del estímulo ni están validados para dosificar volumen. Con un músculo por
  semana, la pregunta de agujetas aporta poco, y añadiría series a sesiones de 62-68 min a cambio de
  dos preguntas por músculo y un esfuerzo L.
- **Rangos MEV–MRV por músculo y prioridades** (RP, Fitbod). Las cifras son heurísticas, no valores
  medidos; los metaanálisis muestran rendimientos decrecientes, no un techo claro. Priorizar un
  músculo ya se puede con «Tu punto débil» y el control de series.
- **Mesociclos fijos con descarga obligatoria y RIR que baja cada semana** (RP). Coleman et al. 2024
  no encontraron más hipertrofia con una descarga programada. Marcar cada registro como descarga
  obligaba a tocar cinco lectores. Queda la versión bajo demanda (11.1).

### No sensato para estas dos personas

- **Ciclo de 4 fases para un básico por día** (Focus Exercises de Fitbod). La doble progresión ya
  hace subir a los multiarticulares; un ciclo con máximo esfuerzo final choca con las restricciones
  del perfil del dueño y no aplica al objetivo salud. Pausar los AMRAP ya está descartado.
- **Descanso editable por ejercicio** (Hevy, de 5 s a 5 min; Fitbod, antes de la sesión). El programa
  fija el descanso de cada ejercicio (regla v27) para que la duración estimada y la progresión sean
  comparables. La única excepción a valorar es la opción A del radar (11.2).
- **Días de máximo esfuerzo con series AMRAP automáticas** (Fitbod). Mi Rutina no prescribe por
  porcentaje del 1RM, así que no hay estimación que recalibrar. Un AMRAP sorpresa choca con las
  restricciones del perfil y con el objetivo salud. El RIR 0 ya registra el esfuerzo máximo cuando
  ocurre.
- **Serie descendente etiquetada** (Hevy, RP). Las revisiones de 2022-2023 indican la misma
  hipertrofia que con series normales a igual volumen: solo ahorra tiempo. Exigiría filtrar un campo
  nuevo en el núcleo de la progresión; el esfuerzo real es L.
- **Reordenar ejercicios de forma permanente y duplicar rutinas** (Hevy, RP, Fitbod). Impacto bajo y
  esfuerzo L. El orden actual pone los multiarticulares primero; «Dejar para después» cubre el
  desorden puntual. Las rutinas propias harían dinámica la lista de gimnasio y obligarían a tocar
  meta semanal, constancia, mapa de calor y conteo, con riesgo al importar copias antiguas.
- **Registrar y graficar el tiempo de los sostenes** (Hevy, Fitbod). El temporizador cuenta una dosis
  fija que no se alarga: la curva sería una línea plana. La parte útil, «Paré antes», entra en 10.2.
- **Récord de mayor volumen de sesión** (Hevy). Se consigue sumando series y premia el volumen
  basura.
- **Zonas de molestia y tarjeta por articulación** (Fitbod). Aporta poco a dos personas con pocos
  ejercicios. Lo valioso, la molestia en ejercicios sin carga y el botón de cambio, entra en 3.3.
- **Varios perfiles de material y selector «¿dónde entrenas hoy?»** (Fitbod). Caso raro, que ya
  cubren el cambio de ejercicio y las rutinas visibles. Queda un único filtro de material (9.3).
- **Periodización ondulante** (Fitbod). Con cada músculo una vez por semana, repartiría el estímulo
  entre semanas y rompería la lectura simple de la doble progresión.
- **Myoreps y myorep match** (RP). Técnica avanzada que aporta poco a un PPL de 3 días con máquinas y
  a una rutina de salud.

### Ya lo tienes

- **Revisión de qué ejercicios rotar al cerrar cada bloque** (RP, Hevy, Fitbod). Sus dos criterios,
  no progresar y doler, ya los cubren el radar y la regla de molestia.
- **«Update Routine Values» de Hevy** (reescribir la rutina con lo hecho). Mi Rutina ya calcula el
  objetivo de hoy desde el historial, con el porqué; copiar valores a la rutina sería un retroceso.
- **Estiramientos y cardio de cierre** (Fitbod). La vuelta a la calma ya la cubren las rutinas de
  Postura.
- **Registrar las series de calentamiento** (Hevy). Las aproximaciones no se registran a propósito,
  para no ensuciar récords ni series por músculo.

### No aplica

- **Calculadora de discos** (Hevy). Descartada en la lista de pendientes del diseño porque ninguno de
  los dos usa barra. La parte útil va en 1.2.
- **Mapa de recuperación muscular de 0 a 100 %** (Fitbod). Con PPL de 3 días cada músculo descansa
  una semana entera.
- **Generación automática de la sesión, Hevy Trainer, Meso Builder y plantillas genéricas.** Mi
  Rutina trabaja con rutinas fijas auditadas; regenerar rompe la progresión medible y es una de las
  quejas sobre Fitbod.
- **Aprendizaje pasivo («recomendar más o menos») y deslizador de variedad** (Fitbod). Solo tiene
  sentido con un generador. La señal útil es la exclusión explícita (3.1).
- **Importar el historial de Strong o Hevy en CSV.** Nada indica que ninguno de los dos traiga
  historial de otra app.

### Fuera por restricción

- **Superseries, giant sets, desplazamiento automático entre ejercicios y normalización de pesos**
  (Hevy, Fitbod). Descartadas por el usuario el 2026-09-23.
- **Live Activity, Dynamic Island, widgets y apps de reloj** (Hevy, Fitbod). Una PWA no tiene esas
  API. La alternativa está en 1.6 y B.1.
- **Integración con Apple Health, Health Connect, Strava o Fitbit, y autoajuste con sueño o VFC.**
  Una PWA sin backend no puede leer esos datos. La alternativa manual es 4.5.
- **Capa social**: feed, seguir a otros, compartir récords en redes, rutinas o ubicaciones. Compartir
  un texto por decisión propia sí entra (7.2).
- **Suscripción, coach humano, asistentes de IA de terceros y generar programas con IA o desde una
  foto.** Exigen cuentas, backend o servicios externos. El asistente propio va por su propio
  documento (sprints 5 y 8).
- **Sincronización en la nube entre teléfonos.** Sin backend ni cuentas; la copia y el texto
  compartido cubren el traspaso y el seguimiento.
- **Percentiles de fuerza frente a otros usuarios** (Fitbod). Es comparación con otras personas,
  fuera de alcance según el diseño; además necesita datos de población y la propia Fitbod advierte
  de que la muestra está sesgada.
- **Insignias, logros y medallas por récord.** Decisión cerrada y gamificación fuera de alcance.
- **Catálogo de cientos de ejercicios con vídeo grabado** (Hevy, Fitbod). Las ilustraciones y los
  vídeos propios son decisiones cerradas (secciones «Fuera de alcance» y «La figura» del diseño). Lo
  que falte se cubre con ejercicios propios con enlace de vídeo.

---

## 9. Glosario

| Término | Definición |
|---|---|
| **1RM** | El peso máximo que puedes levantar una sola vez en un ejercicio. |
| **1RM estimado (e1RM)** | Cálculo del 1RM a partir de una serie con más repeticiones, sin probar el máximo. Mi Rutina usa peso × (1 + reps/30); Fitbod publica la fórmula de Brzycki. |
| **AMRAP** | «As many reps as possible»: tantas repeticiones como puedas con un peso dado. |
| **Bloque secundario** | La parte final de algunas rutinas, con ejercicios que se repiten varios días (como elevaciones laterales o gemelos) a una dosis más suave que la del bloque principal. |
| **Ciclo de fases (Focus Exercises)** | Función de Fitbod: un multiarticular por día pasa por 4 fases (técnica, más peso, cerca del límite, máximo esfuerzo) y se renueva. Descartada. |
| **Copia (exportar e importar)** | El archivo JSON con todas las claves `rp_*` del teléfono. Sirve para restaurar o cambiar de teléfono. |
| **Descarga (deload)** | Semana más ligera, con menos series y menos peso, para reducir la fatiga acumulada. |
| **Dominancia de Pareto (récord)** | Regla de récord de Mi Rutina: solo cuenta si mejoras en peso o en repeticiones sin empeorar en lo otro. |
| **Doble progresión** | Primero subes repeticiones con el mismo peso dentro de un rango (por ejemplo, 8-12); cuando llegas al tope en todas las series, subes el peso y vuelves al mínimo. |
| **Estancamiento** | Cuando un ejercicio deja de mejorar. En Mi Rutina, 3 sesiones seguidas sin superar el mejor 1RM estimado de las últimas 8 semanas. |
| **Índice de sobrecarga** | Parte de los ejercicios en los que subió la fuerza estimada respecto a la sesión anterior; lo esperable ronda el 40-60 %. |
| **IndexedDB** | Otro almacenamiento del navegador, apto para archivos grandes como fotos; hoy queda fuera de la copia. |
| **Lista de excluidos** | Los ejercicios que una persona marcó con «No volver a proponer» (`rp_excluidos`). Incluye los vetos del perfil. Es también la lista «No proponer» del asistente. |
| **Lista de pendientes del diseño** | La sección «Qué falta» de `DISENO.md`, donde se anotan las mejoras pendientes y las cerradas en cada versión. |
| **Live Activity** | Función de iOS que muestra información en vivo en la pantalla bloqueada; una PWA no puede usarla. |
| **localStorage y claves `rp_*`** | Almacenamiento del navegador donde Mi Rutina guarda todo, en claves que empiezan por `rp_`; la copia exporta todas las que tienen ese prefijo. |
| **Mapa de recuperación (Fitbod)** | Estimación de cuánto se ha recuperado cada músculo, de 0 a 100 %, que Fitbod usa para elegir qué entrenar. |
| **Media de 7 días** | Promedio del peso de los últimos 7 días, que suaviza las subidas y bajadas diarias. |
| **Mesociclo** | Bloque de varias semanas (de 4 a 8 en RP) con una progresión planificada que termina en una semana de descarga. |
| **Modo guiado** | La pantalla que lleva la sesión paso a paso: serie, descanso, siguiente serie. |
| **Multiarticular y aislamiento** | Un multiarticular mueve varias articulaciones y músculos (prensa, jalón, press); uno de aislamiento trabaja sobre todo uno (curl, elevaciones laterales). |
| **Músculo secundario (sinergista)** | Músculo que ayuda sin ser el principal, como el tríceps en el press. Mi Rutina le cuenta media serie. |
| **MV, MEV y MRV** | Volúmenes de referencia de RP en series por músculo y semana: mínimo para mantener (MV), mínimo que hace crecer (MEV) y máximo recuperable (MRV). Son heurísticas, no valores medidos. |
| **Myoreps** | Técnica de RP: una serie larga seguida de miniseries con descansos de pocos segundos. |
| **Periodización ondulante** | Alternar sesiones pesadas con pocas repeticiones y ligeras con muchas, en lugar de progresar de forma lineal. |
| **PPL (empuje, tirón, pierna)** | Reparto en días de empuje (pecho, hombro, tríceps), tirón (espalda, bíceps) y pierna. |
| **PWA** | Aplicación web que se instala como una app y funciona sin conexión, sin acceso a funciones nativas como Salud, widgets o reloj. |
| **Rango de repeticiones y tope** | El mínimo y el máximo de repeticiones buscados en un ejercicio; el tope es el número más alto. |
| **Rango estirado (tope+2)** | Cuando el siguiente salto de peso es grande respecto al peso actual (más del 10 %), la app pide primero 2 repeticiones por encima del tope en todas las series antes de subir, para que el salto no sea brusco. |
| **Regla del 60 %** | Una sesión cuenta para la meta semanal y la constancia solo si se hizo al menos el 60 % de sus ejercicios. |
| **Regla v27 (el descanso no se edita)** | Desde v27 el tiempo de descanso y de los sostenes lo fija el programa y no se edita a mano, para que la duración estimada y la progresión sean comparables. |
| **RIR (repeticiones en reserva)** | Cuántas repeticiones más podrías haber hecho al terminar la serie; RIR 0 es llegar al fallo. En Mi Rutina es el «¿Cuántas más podías?» (0/1/2/3+). |
| **RPE** | Escala de esfuerzo percibido de 1 a 10 que usa Hevy; RPE 10 equivale aproximadamente a RIR 0. |
| **Salto** | El incremento entre una carga y la siguiente posible: 1, 2, 2,5 o 5 kg según la mancuerna o la máquina. Lo da la lista de mancuernas declarada o, desde 1.2, el salto guardado de cada máquina. |
| **Serie de aproximación** | Serie ligera de calentamiento antes del peso de trabajo (por ejemplo, 50 % × 10 y 70 % × 5). En Mi Rutina no se registra. |
| **Serie descendente (drop set)** | Al terminar una serie, bajar el peso sin descansar y seguir hasta casi el fallo. |
| **Service worker** | Pequeño programa del navegador (`sw.js`) que guarda la app para usarla sin conexión y gestiona las notificaciones. |
| **Sobrecarga progresiva** | Aumentar poco a poco la exigencia (peso, repeticiones o series) para que el cuerpo siga adaptándose. |
| **Sostén (hold, hold_side)** | Ejercicio que se mantiene un tiempo en lugar de contarse en repeticiones; `hold_side` se hace por cada lado. |
| **Sprint** | Bloque de trabajo de este plan; los que cambian la app publican una versión (v36 a v45). |
| **Superserie** | Dos ejercicios seguidos sin descanso entre ellos. Descartada por el usuario. |
| **Swap (cambio declarado)** | Alternativa escrita para un ejercicio de una rutina; al elegirla se guarda en `rp_swaps`. |
| **Vetos del perfil** | Ejercicios que una persona no hace por restricciones del perfil. Desde 3.1 viven como datos en la lista de excluidos. |
| **VFC (HRV)** | Variabilidad de la frecuencia cardíaca, un indicador de recuperación que miden algunos relojes. |
| **Visto** | La marca de ejercicio hecho sin series registradas (por ejemplo, un estiramiento). Cuenta como hecho, pero no aporta pesos ni curva. |
| **Volumen** | Cantidad de trabajo, normalmente series por músculo y semana; a veces kg × repeticiones. |
| **Volumen basura** | Series que suman números sin aportar estímulo útil: hechas lejos del fallo o solo para inflar el total. Por eso no se premia el récord de volumen de sesión. |
| **Wake Lock** | Permiso del navegador para mantener la pantalla encendida durante la sesión. |

---

## 10. Correcciones aplicadas tras la revisión crítica

| # | Problema | Cómo se aplicó |
|---:|---|---|
| 1 | Las fotos de progreso rompían la garantía de copia completa. | Pasan al backlog con requisito previo: la copia las exporta e importa y el borrado total las elimina. Resumen corregido. |
| 2 | El filtro de vetos olvidaba «Remo inclinado con mancuernas». | Vetado por defecto (criterio conservador) y editable; en el filtro manual, en la siembra de la lista de excluidos y citado en Postura completa. Filtro extra para mancuerna + espalda en Gimnasio. |
| 3 | Tres versiones proponiendo pesos inexistentes. | El salto real sube a v36. Bajar tras fallos, vuelta tras parón y descarga dependen de él. |
| 4 | El arreglo de la subida era «solo dueño» y «de gimnasio». | Para los dos; redactado como «carga por debajo de 25 kg sin lista de mancuernas declarada», con la solución para el teléfono de la madre. |
| 5 | Contradicciones sobre RP. | Descarga final, RIR de 3 a 0 y la regla de saltos grandes, como hechos de la ayuda oficial. El dolor: RP reduce volumen o carga, sin cuánto ni alternativa. |
| 6 | Comparaciones sin respaldo. | Retirada la valoración de tienda de Hevy; «una sola pantalla» reformulada; quitadas las de «volver a la lista» y «cualquier entreno vacío»; la de desinstalar, sustituida. |
| 7 | Cifras y citas que excedían su apoyo. | Índice de la madre sin cifras inventadas; Schoenfeld 2016 citado con su alcance real. |
| 8 | Faltaban los Focus Exercises de Fitbod. | Añadidos a la lógica de Fitbod y a descartes. |
| 9 | Faltaba la decisión sobre el descanso editable. | Descarte explícito con la regla v27 y la opción A del radar como única excepción. |
| 10 | Funciones menores sin decisión. | Reps por lado en 10.3; aviso de enfermedad en 2.3; cierre y calentamientos registrados, en descartes. |
| 11 | Dependencias incompletas. | Rellenadas y marcadas como obligatoria o «mejora si existe». |
| 12 | «Ahora» repartido en siete versiones. | Sustituido por sprints ordenados por impacto; actividad libre sube a v39. |
| 13 | Textos ilegibles para quien no programa. | Cada recomendación separa «Qué verás» de una nota técnica plegable. |
| 14 | Glosario incompleto y referencias crudas a secciones. | Añadidos salto, rango estirado, bloque secundario, visto, volumen basura, regla del 60 %, regla v27 y más; secciones del diseño citadas por nombre; regla (a) del RIR reescrita. |
