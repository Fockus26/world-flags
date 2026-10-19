# Pendientes para arreglar / agregar

> **Estado 2026-09-28:** P1–P35 resueltos y mergeados (tandas 2026-09-23/24/26/26b/26c, PRs
> #26–#51). Lo nuevo va debajo como P36 en adelante.

> El dueño decide en otra sesión cuándo se hace cada uno. Anotado el 2026-09-24 por el
> orquestador de la tanda 2026-09-23. Una unidad = una rama = un PR cuando se haga.

## P1 — Aviso "Actualizar" en cada versión + actualización obligatoria
**Qué:** hoy `public/sw.js` no cambia de bytes desde 1.2.0, así que las pestañas abiertas
no reciben el aviso "Actualizar" (ni 1.3.0, 2.0.0, 2.1.x, 2.2.0).
1. Que `sw.js` cambie en **cada** versión sin depender de acordarse: p. ej. inyectar la
   versión de `package.json` en el build (comentario/constante `APP_VERSION` en `sw.js`
   generada por Astro/Vite) y que un test falle si no coincide. `CACHE_NAME` no cambia (D054).
2. **Actualización obligatoria:** una "versión mínima" que el cliente consulta al cargar
   (y al volver a primer plano). Si su `APP_VERSION` < mínima → pantalla que bloquea el
   juego con un solo botón "Actualizar" (activa el SW en espera y recarga).
   - La mínima vive **fuera del bundle** para poder subirla sin desplegar: fila en Supabase
     (`app_config.min_version`, lectura pública) o un `/min-version.json` que el SW sirva
     siempre por red (network-only). Sin red → no bloquear (modo offline, D0xx).
   - **Versión mínima recomendada hoy: 2.0.0.** Motivo: es la de la regla nueva del ranking
     (10 s/20 s); por debajo, el cliente juega con la regla vieja y el merge por el menor
     de `regionBestTimes`. Todos los arreglos de progreso/sync (1.0.1, sesión calificada dos
     veces, sync fallida) quedan por debajo de 2.0.0. Subirla solo cuando un arreglo toque
     ranking, progreso guardado o logros (no por cosas visuales).
   - Versión: MINOR.
3. **Aviso importante:** esto frena a clientes viejos *honestos*, no a un tramposo. Las
   políticas RLS de `leaderboard_entries` dejan a cualquier usuario autenticado escribir
   el `best_time_ms` que quiera en su fila (`with check (auth.uid() = user_id)`), llamando
   directo a la API de Supabase. Protección real = validar en el servidor (ver P5).

## P2 — Racha en escritorio: el calendario a todo el ancho
Pedido del dueño (sustituye la parte de D096–D100 de `feat/menu-movil`): en escritorio el
panel no se divide en columnas; racha y mejor racha arriba (en una fila) y **el calendario
ocupa todo el ancho** de la tarjeta debajo. Cuidar que las celdas no crezcan sin control
(alto máximo por celda / `aspect-ratio` limitado) y que a 740×360 y 320 px siga cabiendo
(último continente y botones alcanzables). `StreakPanel.tsx` (hoy `sm:flex-row` +
calendario `max-w-sm sm:max-w-xs`). Registrar decisión nueva. PATCH.

## P3 — El anillo de foco arranca del color del texto (150 ms)
`transition-colors` también anima `outline-color`: en algunos elementos el anillo aparece
del color del texto y cambia al suyo. Arreglo: excluir `outline-color` de la transición
(p. ej. transición explícita de `color, background-color, border-color`) en los elementos
afectados o globalmente. Visto en `style/foco-y-toque` (D101–D104). PATCH.

## P4 — Pestañas, Select y acordeón de HeroUI sin "hover" al tocar en móvil
Su hover viene del CSS de HeroUI (`@media (hover: hover)`), no pasa por la variante
`hover` redefinida en `global.css` (D103). Añadir su estado pulsado (`data-pressed` /
`:active`) con el mismo aspecto que su hover, sin hovers pegados. PATCH.

## P5 — (Seguridad) Validar el ranking en el servidor
Hoy el cliente decide el tiempo. Opciones: `check` mínimo de `best_time_ms` por scope,
trigger que rechace tiempos imposibles, o subir el tiempo vía edge function que valide la
partida. Sin esto, la actualización obligatoria (P1) no impide trampas. Decidir alcance.

## P6 — Enlace "Saltar al contenido" fuera de un landmark (axe `region`, moderado)
`src/layouts/Layout.astro`: meter el skip link dentro de un landmark (p. ej. `<header>`
o `<nav aria-label>`) sin perder que sea lo primero al tabular. PATCH.

## P7 — Ranking: el skeleton aparece de inmediato
Hoy, al abrir el ranking, `ui/Skeleton` espera su umbral de 300 ms (D042): con red rápida el
modal crece a la altura del skeleton sin mostrarlo y, si solo hay 1 persona, vuelve a
encoger a 1 fila (salto de altura). El dueño quiere el skeleton **desde el primer frame**
en `LeaderboardModal.tsx` (sin umbral en este caso; puede ser una prop del Skeleton sin
cambiar el comportamiento de los demás consumidores). Revisar también el salto de altura
al llegar pocos datos (animar la altura o aceptarlo, decidir). Relacionado: D077. PATCH.

## P8 — Ranking de prueba con 30 entradas falsas (solo para visualizar)
El dueño quiere ver cómo luce el ranking con muchas personas: **30 entradas falsas** con
nombres y tiempos aleatorios verosímiles y avatares variados (`avatar_style`/`avatar_seed`).
⚠️ `leaderboard_entries` es la tabla de **producción** y pública: antes de insertar, confirmar
con el dueño el método — (a) filas reales en un scope de prueba que el cliente no lea salvo
con un flag de dev, (b) mock solo en cliente en dev (`import.meta.env.DEV` + query param),
o (c) insertarlas en los scopes reales y borrarlas después (se verían en público).
`user_id` probablemente tiene FK a `auth.users`: revisar el esquema. Dejar el SQL de
borrado listo. Sin versión si es solo dev.

## P9 — Tutorial: la partida de práctica limpia y el modo de juego elegible
En el paso de la partida del tutorial:
1. Quitar el botón "Saltar tutorial" y el aviso "Partida de ejemplo…" **mientras se juega**
   (revisa D090–D092: el aviso era el único sitio donde se decía que no cuenta; decidir
   dónde queda esa información — p. ej. en el paso anterior — y cómo se sale: Escape /
   botón de abandonar ya existente).
2. Hoy solo se practica Países. Añadir en los ajustes del tutorial (`TutorialSettings.tsx`),
   junto a Competitivo/Práctica, orden, dificultad y temporizador, el **modo de juego**
   (Banderas / Países / Capitales), y que la partida de ejemplo use el elegido — siempre
   con el sandbox (D072: `localStorage` byte a byte igual; `tests/unit/tutorial-sandbox.test.ts`
   vigila los imports). Banderas/Capitales hoy pasan por `Session.tsx`/`useGame`: habrá que
   darles la vía sandbox como a `CountriesPractice`. MINOR.

## P10 — Castigo del competitivo: "+10" / "+20" animado junto al cronómetro
Hoy el aviso de fallo dice "+10 s al cronómetro" (D075). El dueño quiere que ese texto salga
del mensaje y que aparezca un **"+10" / "+20" al lado del cronómetro** con una animación de
suma (p. ej. el número flota/entra y el cronómetro "salta"), con `tw-animate-css`/CSS (no
framer, D006 y D177) y respetando `prefers-reduced-motion`. Accesible: anuncio en
`aria-live` discreto ("10 segundos de castigo") — nunca solo visual. Banderas y Capitales
(`Session.tsx`, `Header`/`Timer`). PATCH o MINOR.

## P11 — El sonido de fallo se oye muy bajo
`src/utils/sound.ts` (D080): subir la ganancia/cambiar el timbre del sonido `incorrect` para
que se oiga al nivel del de acierto (hoy es grave y suave: las frecuencias graves se perciben
más bajas a igual ganancia). Sin volverlo estridente. PATCH.

## P12 — Parpadeo al entrar más de un logro a la vez
Cuando se desbloquean varios logros juntos hay un parpadeo raro en los toasts
(`AchievementToasts.tsx`, `hooks/useAchievementToasts.ts`, `components/app/AchievementsEffects.tsx`).
Reproducir (perfil de invitado limpio que desbloquee 2+ de golpe), encontrar la causa
(¿remontaje de la lista, animación de entrada repetida, keys?) y arreglarlo. PATCH.

## P13 — Notificaciones: el navegador no pide permiso
El dueño pulsa "aceptar" en el aviso de notificaciones de la app pero el navegador nunca
muestra su diálogo de permiso. Revisar: que `Notification.requestPermission()` se llame
**dentro del gesto** del clic (sin `await` previos que lo saquen del gesto), el estado actual
(`Notification.permission` puede estar ya en `denied`/`granted` y entonces no se pregunta),
contexto seguro (https/localhost), soporte en el navegador y la suscripción push del SW.
Si el permiso está `denied`, la app debe decirlo y explicar cómo reactivarlo. PATCH.

## P14 — Subida al ranking: reintento con cada cambio de `learningData`
Visto por W2 (tanda 2026-09-24, PR #26). En `GameEffects.tsx` una subida fallida (red/servidor)
se reintenta con **cada** cambio de `learningData` (cada respuesta), no tras la siguiente sync
buena como dice el comentario. #26 lo corta solo para rechazos del trigger. Reintentar con
backoff o solo tras sync buena. PATCH.

## P15 — Un tiempo local imposible queda como mejor marca para siempre
Visto por W2. Si el reloj salta hacia atrás a mitad de un rush sale un tiempo absurdo; ninguna
partida real lo mejora y nada vuelve a subir al ranking (el trigger de #26 lo rechaza). Validar
el tiempo en el cliente antes de guardarlo como mejor marca (mismo mínimo de
`leaderboard-validation.ts`) y usar `performance.now()` para medir. Además `upsertLeaderboardEntry`
sustituye la marca pública sin comprobar que la nueva sea mejor (ya en D044–D046). PATCH.

## P16 — Contraste del skip link enfocado en claro (3,96:1)
Visto por W7 (PR #32). En `src/layouts/Layout.astro`, el enlace "Saltar al contenido" enfocado en
tema claro pone `text-primary-soft` (#ecebfe) sobre `bg-primary` (#6d5ef0) = 3,96:1, por debajo
del 4,5:1 AA (axe `color-contrast`). Viene de D101. Arreglo de una línea: texto `primary-foreground`
/ blanco (4,66:1 como D106) o fondo `primary-hover`. PATCH.

---

> Anotado el 2026-09-25 (revisión de la consola en prod). Main en 2.4.3.
> `feat/castigo-animado` (P10) tiene trabajo **sin commitear** en su worktree
> (`.claude/worktrees/agent-a8eb6523041692bb8`: `Session.tsx`, `Header.tsx`, `AnswerForm.tsx`,
> `rush-penalty.ts`, `CHANGELOG`, `package.json`, `DECISIONS_INDEX`). Cerrarlo o descartarlo
> **antes** de P18/P19, que tocan los mismos archivos. Numerar las decisiones nuevas después de
> las que reserve ese worktree (en main el índice llega a D131).

## P17 — Errores de consola en prod (configuración, no código)
1. `GET …/rest/v1/app_config?select=value&key=eq.min_version` → **404**: la tabla `app_config`
   no existe en Supabase (el SQL de P1 no se ha aplicado). El cliente lo trata como "sin mínima"
   y no bloquea (D110), pero la actualización obligatoria **no funciona** hasta aplicarlo.
   Acción del dueño: SQL Editor → pegar `supabase/app-config.sql` (local). Se consulta al cargar
   y al volver a la pestaña; por eso sale repetido.
2. `Daily reminder: PUBLIC_VAPID_PUBLIC_KEY is not set, cannot subscribe.` (×4): el build de
   prod no tiene la variable (el `.env` local tampoco). Acción del dueño: generar el par VAPID
   (`bunx web-push generate-vapid-keys`); la **pública** como `PUBLIC_VAPID_PUBLIC_KEY` en las
   variables de entorno del hosting y en `.env`; la **privada** como secreto de las edge
   functions `subscribe-push` / `send-daily-reminders` (revisar qué nombre de secreto leen);
   redeploy (Astro la hornea en el build). Sin esto, P13 no se puede dar por cerrado en prod.
3. Opcional (código, PATCH): el aviso VAPID sale 4 veces por carga; avisar una sola vez
   (`push-notifications.ts:122`). No quitarlo: es la única pista del fallo.

## P18 — Más sonidos (Web Audio sintetizado, `src/utils/sound.ts`, D080–D082)
Siguen valiendo: el sonido es refuerzo, nunca la única señal; sin archivos; respeta
`getSoundEnabled`; falla en silencio. **Límite técnico del hover:** el `AudioContext` solo
arranca tras un gesto (clic/tecla/toque); pasar el ratón **no cuenta**, así que un sonido de
hover no suena hasta el primer clic de la visita. En táctil no hay hover.

Propuesta (★ = recomendado):
- **Al pulsar** (la base recomendada)
  - `select` ★: "tic" corto y agudo al elegir juego (`GameTypeToggle`), continente
    (`RegionOption`/`RegionSelector`), competitivo/práctica y `OptionTile`. Muy bajo.
  - `start` ★: al empezar partida, nota ascendente breve.
  - `skip`: al saltar (hoy suena `incorrect`); una sola nota neutra.
  - `penalty` ★: golpe grave corto sincronizado con el "+10"/"+20" de P10.
  - `record` ★: fanfarria al batir la mejor marca de un rush (más larga que `achievement`).
  - `finish`: al completar un rush sin récord (acorde corto).
  - `streak`: al sumar un día de racha / cumplir la práctica diaria.
  - `grade`: `GradeButtons` de la práctica diaria con tono por nota (hoy `again` → incorrect,
    el resto → correct).
  - `page`: cambio de vista de `PageFlip.tsx` (roce de papel con ruido filtrado).
- **Al pasar el ratón** (opcional, con cuidado)
  - Solo en tarjetas grandes (continentes, tipo de juego, "Empezar"), nunca en todo botón;
    solo `pointerType === "mouse"`; limitador (≥ 80 ms entre ticks); volumen ≈ 20 % del `select`.
  - Recomendación: detrás de un **segundo interruptor** "Sonidos de interfaz" (apagado por
    defecto) junto al de sonido actual, o no hacerlo.
- **Cuenta atrás**: si hay temporizador por pregunta, tic en los últimos 3 s.
- Implementación: nuevos `SoundName` en `sound.ts`; para `select`/hover un hook en `src/hooks/`
  que usen los wrappers de `src/components/ui/` sin cambiar su API; el interruptor nuevo por
  `learning-storage.ts`. El sandbox del tutorial (D072) sigue valiendo: `sound.ts` solo lee.
  MINOR. Registrar decisión.

## P19 — Más animaciones (tw-animate-css / CSS, nunca framer; D006 y D177)
Todas con `motion-safe:` o anuladas por el bloque global de `prefers-reduced-motion`;
duraciones de `DESIGN_TOKENS.md` (150/180/200 ms; si hace falta otra, token nuevo + decisión).
Nada que parpadee > 3 veces/s. Propuesta por pantalla (★ = más impacto):
- **Configuración**
  - ★ Tarjetas de continente / tipo de juego: al pasar, sube 2 px + sombra; al pulsar,
    escala 0,98; la elegida hace un "pop" (zoom-in-95 → 100).
  - Entrada escalonada de las tarjetas (`animate-in fade-in slide-in-from-bottom-2` con retraso
    creciente, tope ~8 elementos).
  - Racha (`StreakPanel`): la llama late una vez si la racha subió hoy; el día de hoy del
    calendario se rellena con zoom-in.
- **Partida**
  - ★ Acierto: anillo verde que se expande y se desvanece en `StimulusFrame`. Fallo: sacudida
    horizontal corta (±4 px, 200 ms) + borde rojo. El icono/texto de `FeedbackMessage` ya da
    la señal que no es de color.
  - ★ Cambio de pregunta: la bandera nueva entra con `fade-in slide-in-from-right-4`.
  - Rush de Países: el contador hace "bump" (1 → 1,15 → 1) en cada acierto; el país entra en la
    lista con fade.
  - Barra de progreso con transición de ancho.
- **Resultados** (`Results.tsx`)
  - ★ Números que cuentan hacia arriba (~600 ms); con movimiento reducido, valor final directo;
    `aria-live` solo con el valor final.
  - ★ Nuevo récord: confeti CSS (~20 partículas, `@keyframes`, sin librería) + insignia
    "¡Nuevo récord!" con zoom-in, sincronizado con el sonido `record` de P18.
  - Tarjetas de estadística con entrada escalonada.
- **Ranking** (`LeaderboardModal`): filas escalonadas al llegar los datos (tras el skeleton
  D115–D116); tu fila con un resplandor al aparecer; medallas del top 3 con zoom.
- **Logros**: la insignia recién desbloqueada en `AchievementsModal` con un brillo que la cruza una vez.
- Una unidad por pantalla: (1) partida, (2) resultados + récord, (3) configuración + ranking.
  PATCH/MINOR según lo visible. Verificar a 320 px y con movimiento reducido. Registrar decisiones.

## P20 — Ranking por continente (además de "Todo el mundo")
Hoy solo sube la marca de "Todo el mundo" (`GameEffects.tsx` ~l. 580; un scope por juego en
`LEADERBOARD_SCOPES`). Las marcas por continente **ya se guardan** en `regionBestTimes[region]`
(`getBestTimeKey`, `learning-storage.ts:826`) pero no suben.
1. **Qué cuenta:** solo un rush de **un continente completo** (scope `custom` con una sola región
   y sin países sueltos; ver `types/country.ts:213`). Combinaciones o selecciones a mano, no.
2. **Reglas mezcladas (importante):** en Banderas y Capitales las claves de continente
   (`"europe"`, …) **mezclan** tiempos de la regla vieja y de la de castigo 2 (+10/+20 s, D076):
   solo "world" se versionó (`"world@2"`). Hacer lo mismo por continente: `"<region>@2"` para
   flags/capitals (Países sigue con `"<region>"`); generalizar `getBestTimeKey` y el merge
   (clave a clave por el menor; las desconocidas se conservan). Las marcas viejas se quedan en
   los datos y no suben.
3. **Scopes nuevos:** `countries:<region>`, `flags:<region>@2`, `capitals:<region>@2`
   (8 regiones × 3 juegos = 24). Una `getLeaderboardScope(gameType, region | "world")` en vez del
   Record fijo; "world" no cambia para no vaciar el ranking actual. La PK `(user_id, scope)` ya lo
   admite: sin migración de tabla.
4. **Subida:** el efecto de `GameEffects` recorre juego × (world + 8 regiones) con el ref de
   "última subida" indexado por scope. En el primer arranque subirá las marcas de continente ya
   guardadas (Países): hacerlo en serie/limitado, no 24 peticiones de golpe. Buen momento para
   resolver P14 (reintento con backoff).
5. **Servidor (SQL que aplica el dueño):** `leaderboard-validacion.sql` con mínimo por scope =
   nº de países del continente × 300 ms (D112). Extender `getLeaderboardMinimums()` y su test a los
   27 scopes. Hoy los scopes desconocidos no tienen mínimo (D114): los de continente deben validarse
   desde el primer día. Orden: SQL antes o a la vez que el deploy.
6. **UI:** en `LeaderboardModal`, selector "Todo el mundo / Norteamérica / … / África" (HeroUI
   `Select`: 9 pestañas no caben a 320 px) encima de la lista; por defecto "Todo el mundo", o el
   continente recién jugado si se abre desde Resultados. El skeleton/altura animada (D115–D116)
   aplica al cambiar. Nombres = los de `RegionSelector`. Anunciar el cambio por `aria-live`.
   Opcional (otra unidad): tu puesto por continente en `RegionSelector`.
7. **Demo:** `leaderboard-demo.ts` genera por scope con semilla fija → debería servir para los
   scopes nuevos sin cambios (comprobarlo).
8. MINOR. Decisión nueva. Tests: claves versionadas, merge, scopes, mínimos.

## P21 — Ranking: podio destacado, hover por fila y más aire entre puesto y avatar
Pedido del dueño el 2026-09-25. Todo en `LeaderboardModal.tsx` (`LeaderboardRow`, ~l. 87, y
`ROW_CLASS`/`ROW_AVATAR_CLASS`, ~l. 40). Una sola unidad; hacerla junto a P20 o justo después
(P20 también toca este modal). PATCH.
1. **1.º, 2.º y 3.º destacados.**
   - Oro / plata / bronce, pero **nunca solo por color** (WCAG): icono de medalla/trofeo de
     `iconoir-react` con `aria-hidden` + el número, y el puesto legible por lector ("Primer
     puesto" o dejar "#1" como texto real). Opcional: avatar algo más grande o con anillo del color.
   - **Faltan tokens:** `COLORS.md` no tiene oro/plata/bronce (`warning` #d97a13 es "Difícil" y no
     da 4,5:1 como texto en claro). Crear tokens `--medal-gold/-silver/-bronze` (+ variantes soft
     para fondo) en claro y oscuro, comprobar el contraste del texto encima y registrar la decisión.
   - Decidir cómo se combina con tu fila (`isMe` = `bg-primary-soft text-primary`) cuando estás en
     el podio: p. ej. fondo de tu fila + medalla y borde del color del puesto.
   - Lo mismo en las filas del skeleton no hace falta; en la demo (`?demo-ranking=top`) se ve el caso
     "tú en el podio".
2. **Hover en cada participante.**
   - Hoy la fila es un `<li>` no interactivo. Hover **solo visual** (fondo `surface-hover` o similar
     + transición de color con el token de 150 ms), `cursor` normal para no parecer un enlace, y el
     mismo aspecto al tocar en móvil (patrón D103/D130, sin hover pegado).
   - Si el hover va a **mostrar algo** (tooltip con el tiempo completo, fecha de la marca…), la fila
     tiene que ser enfocable y funcionar con teclado y toque (HeroUI `Tooltip`/`ui/Tooltip`), y hoy
     `LeaderboardEntry` solo trae nombre, tiempo y avatar (la fecha exigiría columna nueva). Por
     defecto: solo visual. Preguntar al dueño si quiere más.
   - Opcional con P19: la fila sube 1 px al pasar; nada con movimiento en reduced-motion.
3. **Más separación entre el puesto y el avatar.**
   - Causa real: la columna del puesto es `w-7` fija (1,75 rem) con `text-right`; con "#100" o más el
     texto no cabe y se desborda **hacia el avatar**. Solo ensanchar el modal no lo arregla.
   - Arreglo: ancho de la columna según los dígitos del puesto más alto de la lista (en `ch`, igual para
     todas las filas y para la fila propia bajo el separador) o una rejilla con columna `auto`
     compartida; subir el `gap-2.5` del grupo (p. ej. `gap-3`/`gap-4`, del set de tokens).
   - **Ancho del modal:** hoy `w-[min(30rem,92vw)]` (~l. 235); subir a ~34–36 rem (el dueño lo aprobó),
     sin romper 320 px ni el `truncate` del nombre. Ese valor arbitrario ya existía: si se cambia,
     llevarlo a un token o anotar la decisión.
4. Verificar con `?demo-ranking`, `?demo-ranking=top` y con 30 filas (puestos de 2 cifras) — para
   ver 3 cifras hará falta que la demo acepte más de 30 o probar con un número forzado.

## P22 — La práctica diaria mide con `Date.now()`
Visto por W1 (tanda 2026-09-26, PR #35). `src/components/game/session/DailyPractice.tsx` (l. 48 y 79)
sigue midiendo con `Date.now()`: si cambia la hora del sistema a mitad de partida, el tiempo sale mal.
Pasar a `performance.now()` como `Session.tsx` (D132). PATCH.

## P23 — `CountryPickerModal` no aplica su ancho de 34 rem
Visto por W5 (tanda 2026-09-26, PR #38). `src/components/game/configuration/CountryPickerModal.tsx`:
`w-[min(34rem,92vw)]` no se aplica porque `modal__dialog--md` de HeroUI limita a 28 rem; le falta
`max-w-none` (lo mismo que se arregló en `LeaderboardModal`, D150). PATCH.

## P24 — Ranking a 320 px: nombre de tu fila casi sin espacio con puesto de 3 cifras
Visto por W5 (PR #38). Con tu puesto ≥ 100 bajo el separador, al nombre le quedan ~19 px a 320 px.
Salida propuesta: en pantallas estrechas poner el tiempo debajo del nombre. PATCH.

## P25 — Selector de juego en oscuro por sistema: opción elegida a 2,44:1
Visto por W4 (tanda 2026-09-26, PR #39). Con tema "system" y el sistema en oscuro, axe marca la opción
elegida de `GameTypeToggle` (forma segmentada): texto #f1eefc sobre #9b8bff = 2,44:1. `--btn-contained-fg`
vale #14121f, pero el color de la etiqueta no se recalcula al cargar (mismo fallo de recálculo de Chrome
que ya comenta el componente). Accesibilidad AA: PATCH, prioritario.

## P26 — `motionVariants.flagEnter` sin uso
Visto por W6 (tanda 2026-09-26, PR #42). `src/styles/animations.ts`: `motionVariants.flagEnter` quedó sin
consumidores (la bandera entra ahora con tw-animate-css, D151–D153). Decidir si se borra. Sin versión.

## P27 — Anillo de foco recortado en las `OptionTile` del modal de configuración
Visto por W8 (tanda 2026-09-26, PR #43). En `ConfigurationModal`, las `OptionTile` de la columna derecha
quedan a 0 px del borde derecho del panel (`overflow-hidden`) y su anillo de foco se recorta por ese lado
(ya pasaba antes). También impide que `OptionTile` suba 2 px al pasar (D157). Arreglo: margen interior en
`AutoHeight`/paneles del modal. Accesibilidad (foco visible): PATCH, prioritario.

## P28 — La práctica de Países mide con `Date.now()`
Visto por X3 (tanda 2026-09-26b, PR #45). `src/components/game/session/countries/CountriesPractice.tsx`
(~l. 125 y ~147) sigue con `Date.now()`: mismo riesgo que P22 si cambia la hora. `performance.now()`
como `Session.tsx` (D132) y `DailyPractice.tsx` (D165). PATCH.

## P29 — Selector de países: nombres largos cortados sin forma de verlos enteros
Visto por X2 (tanda 2026-09-26b, PR #46). En `CountryPickerModal.tsx`, "San Vicente y las Granadinas",
"República Dominicana"… se cortan con "…" a 320 px y a 34 rem, sin `title`/tooltip (el lector de pantalla
sí lo lee entero). Opciones: permitir 2 líneas (`line-clamp-2`) o tooltip. PATCH.

## P30 — D147–D150 da P23/P24 por abiertos
Visto por X2. Su sección "Lo que esto no cubre" quedó desactualizada tras #46 (D162–D164). Actualizarla
con un enlace a D162–D164. Sin versión.

## P31 — `OptionTile` anima `color` (mismo fallo que P25)
Visto por X1 (tanda 2026-09-26b, PR #47). `src/components/ui/OptionTile.tsx` incluye `color` en su
transición: tras cambiar de tema sin fotogramas (pestaña oculta), el texto se queda a medio camino y axe
podría marcarlo. Quitar `color` de la transición como en D159. PATCH.

## P32 — `heroui-theme.css` sin bloque para el tema del sistema sin `data-theme`
Visto por X1. `src/styles/heroui-theme.css` no tiene `@media (prefers-color-scheme: dark)` para
`:root:not([data-theme])` (`variables.css` sí). Si `localStorage` falla, hasta que `ThemeEffects` pone
`data-theme`, HeroUI va en claro y la app en oscuro. Añadir el bloque. PATCH.

## P33 — Umbrales de logros "🔸 a confirmar"
Visto por Y3 (tanda 2026-09-26c, PR #48). `src/utils/achievements.ts` tiene ocho `// 🔸 umbral a confirmar`
(umbrales numéricos, no copy). El dueño decide si los da por buenos (se borran los marcadores, sin
versión) o los cambia (PATCH).

## P34 — Transiciones de color que se congelan al cambiar de tema (global)
Visto por Y1 (tanda 2026-09-26c, PR #50, D166). Con la pestaña sin fotogramas, un cambio de tema deja a
medio camino cualquier transición de color: `GameTypeToggle` (conserva `background-color`, D159) cae a
1,14–1,25:1; las tarjetas de continente usan `transition` (anima colores). Arreglo global recomendado:
que `ThemeEffects` suprima las transiciones durante el cambio de tema (clase temporal en `<html>` con
`transition: none !important` un frame), y así `OptionTile` podría recuperar el fundido de fondo. PATCH, a11y.

## P35 — `ThemeEffects.tsx` escribe en `localStorage` directo y sin try/catch
Visto por Y1. Viola la regla de persistencia (solo por `learning-storage.ts`) y lanza si el almacenamiento
está bloqueado. Moverlo a `learning-storage.ts` con try/catch. Además, el comentario del script de tema de
`Layout.astro` debe nombrar también `heroui-theme.css` como respaldo sin `data-theme` (D168). PATCH.

## P36 — Error de hidratación de React #418 por el calendario de racha — PR #61 (D179)
Visto el 2026-09-28 en la consola de prod (`Minified React error #418 … args[]=text`). La isla
`<App client:load />` se **prerenderiza en el build** (no es cierto que "no haya SSR": Astro genera
su HTML) y `StreakPanel.tsx` (l. 93, `const today = new Date()`) pinta el mes y "0 de N días" con la
fecha del build (Vercel compila en UTC). Si el cliente abre la app otro día o en otra zona horaria
(el dueño está en UTC−4), el texto no coincide y React repinta la isla entera en el cliente
(error recuperable, pero ruido en consola y trabajo de más). Arreglo: lo que dependa de la fecha
o de `localStorage` (calendario, tema) solo tras montar — p. ej. un `useIsClient()` con
`useSyncExternalStore` (`getServerSnapshot` = false) y el skeleton del calendario en el servidor.
Revisar también el comentario de `themeSlice.ts` ("sin SSR"). PATCH.

## P37 — Las marcas nuevas no suben al ranking: tiempo con decimales (22P02) — PR #62 (D180)
Visto el 2026-09-28 en la consola de prod: `POST …/leaderboard_entries 400` →
`invalid input syntax for type integer: "671768.1999999881"`. Desde `e86b519` / `b73a024`
(2026-09-26, D132/D167) el rush mide con `performance.now()`, que da fracciones de ms;
`best_time_ms` es `integer` y `upsertLeaderboardEntry` (`src/utils/cloud-storage.ts`) manda el
número tal cual. Toda marca batida desde entonces se queda sin subir (reintenta con backoff y
vuelve a fallar). Arreglo: `Math.round` al subir (sirve también para las marcas ya guardadas con
decimales en `regionBestTimes`) y, opcional, redondear al guardar la marca. Test unitario. PATCH.

## P38 — 404 de `/_astro/App.<hash>.js` al cargar tras un deploy
Mismo día: `GET /_astro/App.DEimTYtg.js 404` (el build actual es otro hash) y justo después la
app carga. El SW sirve la navegación red-primero, así que es HTML de antes del deploy (pestaña
abierta, caché HTTP o CDN). Observar si se repite con la pestaña recién abierta; si sí, revisar
cabeceras de caché del HTML en Vercel. Sin código por ahora.

## Del kit 3.3.0 (2026-10-02, `chore/kit-3.5.0`) — pantallas de estado y selección

Guía: `reference/STATUS-SCREENS.md` del kit (escrita para Next; aquí se traduce a Astro +
isla React). Primero diseño (adenda para Claude Design), luego implementación. Cada una PATCH.

## P39 — Color de selección de texto (`::selection`) — PR #88 (D203)
Hoy sale el del navegador. Token `selection.bg` / `selection.text` en claro y oscuro (filas en
`COLORS.md`), contraste ≥ 4,5:1 del texto seleccionado, en `global.css`. Fase 02 del kit.

## P40 — Página 404 propia — PR #88 (D203)
Solo existe `src/pages/index.astro`: una ruta inexistente muestra la 404 genérica de Vercel.
`src/pages/404.astro` (Astro la sirve en Vercel) con el layout, tema claro/oscuro y una acción
"Volver a practicar" → `/`. Sin variante con/sin sesión (la sesión vive dentro de la isla).
Copy: `CONTENT_CHECKLIST.md` fila 48. Ojo con `sw.js`: no cachear la 404 como navegación.

## P41 — Pantalla de error (error boundary) — PR #88 (D203)
No hay `ErrorBoundary`: un fallo de render de React deja la pantalla en blanco. Un boundary
alrededor de `App` con "algo salió mal" + reintentar/recargar, que no pierda el progreso
(`learning-storage.ts` intacto). Copy: fila 49. Sin conexión ya está cubierto
(`ConnectivitySnackbar` + SW); mantenimiento no aplica (app estática).

## P42 — Esquema de Supabase como migraciones para la QA local (kit 3.4.0, D184)
`bun run qa:local` aborta hasta que exista `supabase/config.toml` + `supabase/migrations/`.
Acción del dueño (pide la contraseña de la base), en la carpeta principal, con Docker abierto:
`supabase init` (si no hay `config.toml`) → `supabase link --project-ref <ref>` →
`supabase db pull` → un `supabase/seed.sql` mínimo sin datos personales (p. ej. `app_config`).
Luego un agente: comprobar que la migración reproduce lo de los `.sql` sueltos (leaderboard,
achievements, notificaciones, cron…), llevar la plantilla de confirmar registro a
`config.toml` (`[auth.email.template.confirmation]`, ver P43) y verificar
`bun run qa:local -- --port 4399` (arranca y el sitio carga contra la base local).
Rellenar `.env.test.local` (`EMAIL_TEST` / `PASSWORD_TEST`, valores inventados). Todo sigue
gitignored. Sin changeset.

## P43 — Plantilla de "Confirmar cuenta" también en la base local (kit 3.5.0)
Va tras P42. El correo ya está diseñado (D095, `supabase/templates/confirmar-registro.html`) y
se pega a mano en el panel. Siguiendo `reference/EMAIL-TEMPLATES.md` del kit: enlazarlo en
`supabase/config.toml` (`[auth.email.template.confirmation]`, `subject` + `content_path`) para
que `qa:local` lo mande con el diseño real a Mailpit; versión de texto plano si falta. Dueño:
confirmar si ya está aplicado en el panel de producción. SMTP propio + dominio: sigue pendiente
(sin dominio propio). Todo local (`supabase/` privado, D184). Sin changeset.

## P44 — `text-secondary` como texto falla AA en claro

Visto en W2 (#71): `#b34bd1` da 4,34:1 sobre
blanco y 3,80:1 sobre `surface-hover`. Arreglado solo en `CountryPickerModal` (pasa a
`text-secondary-hover`). Buscar el resto de usos como texto (`grep -rn "text-secondary\b" src/`) y
anotarlo en `COLORS.md`. Patch.

## P45 — El tutorial no se cierra con Escape

Visto en W2: al cargar como invitado el modal del
tutorial tapa la página y Escape no lo cierra (solo "Saltar tutorial"). Comprobar si es a propósito;
si no, WCAG 2.1.2 / patrón de diálogo. Avisarlo en los briefs de QA y de workers.

## P46 — SEO: h1 en el HTML estático (Alto, Q4)

El HTML servido no trae ningún heading: el `<h1>` (`Configuration.tsx:340`) solo aparece al hidratar.
Prerenderizar el h1 del modo por defecto o `h1` estático en `index.astro`, sin duplicarlo (coordinar con a11y).
Informe: `plans/qa-seo-2026-10-12.md`. Va a la ola de arreglos.

## P47 — SEO: medios y bajos (Q4)

Description >160 y sin "Aprender por lotes" (dueño), marca inconsistente (World Flags / Banderas del Mundo /
Banderas), faltan `og:image:alt`/`twitter:image:alt` (dueño), `og-image.png` 588 KB → recomprimir,
`og:locale` es_ES (dueño), JSON-LD `operatingSystem` + `image`, `framer-motion` aún en `optimizeDeps`
(`astro.config.mjs:34`). Ver `plans/qa-seo-2026-10-12.md`.

## P48 — Botón `contained` secondary ("Práctica diaria") falla AA

**Decidido 2026-10-12: opción (a).** Visto en W6 (#73): texto blanco sobre `#b34bd1` = 4,34:1 (16 px, peso 500). Opciones (D192): (a) base
`secondary-hover` en el contained secondary; (b) texto oscuro; (c) oscurecer el token `secondary`. Decide el dueño.

## P49 — Título de la sesión de lote (Medio, Q2) — PR #89 (D204)

La sesión de un lote se titula "5 PAÍSES PERSONALIZADOS"; se confunde con una práctica a mano. Propuesta:
"Lote N de M". Copy del dueño. Ver `plans/qa-design-2026-10-12.md`.

## P50 — QA de diseño: resto (Q2) — bajo en PR #86 (D201); medio sin acción

Medio: el tutorial (backdrop) tapa el 🏆 ~1 s tras cargar (diseño, no fallo; e2e deben sembrar
`world-flags-tutorial-seen=true`). Bajo: `rounded-[0.25rem]` en `CountryPickerModal.tsx:73` → token.
Sin verificar en Q2: línea del lote en Resultados y modal de abandonar el lote; zoom, daltonismo, Tab.

## P51 — a11y: foco perdido en lotes y Resultados (Medio, Q3) — PR #86 (D202)

Foco cae en `<body>` al pulsar "Empezar" en LearningPathModal (`Configuration.tsx:423-450`), al confirmar
"Sí, abandonar" (`LearningPathPanel.tsx:52-56`), al terminar la sesión de lote y con "Volver al inicio".
Dos `<h1>` a la vez en Resultados (`Results.tsx:75/103/157`). Intermitente: cerrar picker/ranking a 1280 px
devuelve el foco a `body` 2 de 4 veces. Ver `plans/qa-a11y-2026-10-12.md`. Va a la ola de arreglos.

## P52 — a11y: contraste de tokens danger y nota baja (Medio, decide el dueño)

"Sí, abandonar": blanco sobre `#e0435f` = 4,08:1 (`ConfirmationModal.tsx:63`) → `danger-hover` de fondo o
texto oscuro. Resultados oscuro: "/10" nota baja `#e27071` sobre `#511d1d` = 4,39:1 (`Results.tsx:174`).
Copy (dueño): "Seguir aprendiendo" repetido en el modal de abandonar; "Conviene repetir esta región" en lotes.

## P53 — Al responder una tarjeta el foco cae a `<body>` (WCAG 2.4.3) — PR #86 (D202)

Visto en W7 (#75): `AnswerForm` deshabilita el input con foco y quita "Comprobar" en cualquier partida.
Afecta el teclado de todas las partidas; unidad propia. Relacionado con P51.

## P54 — "Todos"/"Ninguno" pierden el foco al pulsarlos con teclado (2.4.3) — PR #86 (D202)

Visto en W5 (#76): el botón se desmonta (Todos → Ninguno) y el foco va a "Cerrar" o `body`. Juntar con P51/P53.

## P55 — CRÍTICO: sesión de Países colgada si la última tarjeta se reencola sobre sí misma (Q1)

Lotes de 5 → acertar todo con "Bien" → la última (p. ej. Costa Rica) vuelve sola → tras "Correcto" ni
"Bien" ni 3/4 responden; la sesión no termina ni se guarda. Causa: `isGradingRef`
(`CountriesPractice.tsx:162-166, 246-248`) solo se libera al cambiar `currentCode`; `insertRequeuedCard`
(`practice-queue.ts:88`) deja `[cr]`→`[cr]`. Viene de antes (reencolado + D186); Banderas/Capitales no
tienen esa guarda. Primera unidad de la ola de arreglos. Ver `plans/qa-tanda-2026-10-12.md`.

## P56 — Ranking: bajos de Q1 (#70)

(a) Al reabrir con caché vencida sale una petición de más al último scope (efecto de carga antes del de
reinicio, `LeaderboardModal.tsx:375-382` vs `387-441`). (b) Si abres el ranking con el upsert en vuelo o en
reintentos (o en los 3 s antes de sincronizar perfil), sirve la marca vieja y no se refresca al invalidar
(`cloud-storage.ts:531`): suscribir el modal a la invalidación.

## Decisiones del dueño 2026-10-12 (P47, P49, P52)

- **P52.1** "Sí, abandonar": opción (a), fondo `danger-hover` como fondo normal del botón contained danger.
- **P52.2** "/10" nota baja en oscuro: opción (a), aclarar ese rojo solo en tema oscuro hasta ≥4,5:1.
- **P52.3** Botón de cancelar del modal de abandonar el lote: "Cancelar" (`Configuration.tsx:530`).
- **P52.4** Titular de Resultados tras una sesión de lote: "Lote en marcha" (las demás partidas igual; `score.ts:50`).
- **P49** Título de la sesión de lote: "Lote N de M" (opción a).
- **P47.5** Description: «Aprende las banderas de los 197 países con repetición espaciada: practica por continente o por lotes, compite a contrarreloj y sube al ranking.» (`Layout.astro:16`)
- **P47.6** `og:image:alt` y `twitter:image:alt`: «World Flags: tarjeta de una bandera con las opciones de respuesta» — verificar que describe lo que muestra `og-image.png`; si no, ajustar mínimo y avisar.
- **P47.7** Marca: "Banderas del Mundo" en todas partes (og:site_name, JSON-LD, title si aplica, manifest) y "Banderas" como nombre corto (opción b). Ojo: la alt de P47.6 dice "World Flags" → usar "Banderas del Mundo".
- **P47.8** `og:locale` = `es_419`.
- **P48** (a) ya anotado arriba.
Copy aprobado: añadir filas al CONTENT_CHECKLIST como "Aprobado 2026-10-12".

## P57 — Restos de marca tras F5 (#78) — decide/hace el dueño — title en PR #87; og-image y Edge Function siguen del dueño

- `<title>` quedó «Banderas del Mundo — Aprende las banderas del mundo» (repite): copy del dueño.
- `public/og-image.png` dice «World Flags» en grande: rehacerla si se quiere la marca nueva.
- Edge Function privada `supabase/functions/send-daily-reminders/index.ts:83` («…en World Flags.»): cambiar y desplegar a mano.
- Alt de la og-image ajustado por F5 (checklist fila 52): aprobar.

## P58 — Nota de Resultados en claro falla AA (escalado por F3, #81) — decide el dueño — PR #89 (D204)

En claro, `getScoreColor` como texto en `Results.tsx`: nota 3 → 3,81:1, 4 → 2,98:1, 5–10 → 2,1–2,4:1. El número
(texto grande, 3:1) falla 4–10; "/10" (4,5:1) falla 3–10. Opciones con pros/contras en D196 (#81). Toca
`Results.tsx` → va con F4 en la ola B. `COLORS.md` decía que ese color nunca es texto (era para `RegionOption`).
