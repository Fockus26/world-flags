# Prompts por unidad — tanda 2026-09-26

> Brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-26.md`
> (léelo antes que tu sección). El pedido completo de cada P está en
> `C:\Users\Admin\Documents\Work\world-flags\context\plans\pendientes.md`: **lee entera la
> sección de tus P** — es la cita del dueño y trae rutas, decisiones y trampas. Aquí va solo lo
> que la complementa o la corrige.

---

## W1 — `feat/castigo-animado`

Eres el worker **W1**. Rama: `feat/castigo-animado` (ya existe en origin con un commit
`wip(castigo): +10/+20 animado junto al cronómetro (sin verificar)`; tu slot la retoma).
Decisiones: `context/decisions/32-castigo-animado.md`, rango **D132–D134** (ya redactadas en
el wip). Fila de CONTENT_CHECKLIST: **43**.

Condicionan: D075 (aviso "+10 s" en el fallo), D076 (claves versionadas `world@2`),
`decisions/03-animaciones.md` (sin framer), D129 (transition-colors sin outline).

### Qué pide el dueño
P10 de `pendientes.md` (léelo). Además, de P15: **medir el rush con `performance.now()`** en
`Session.tsx` en vez de `Date.now()` (hoy l. 155, 181, 192, 278; la pausa del modal de salir,
l. 366/373, también), para que un salto del reloj del sistema no dé un tiempo absurdo. La
validación del tiempo antes de guardarlo como mejor marca la hace W2, no tú.

### Dónde está
- El wip ya trae: `session/PenaltyBadge.tsx` (nuevo), `Header.tsx`, `Session.tsx`
  (`applyPenalty`, lista `penalties`), `AnswerForm.tsx` (fuera `penaltyLabel`),
  `utils/rush-penalty.ts` (`formatPenalty`, `formatPenaltyAnnouncement`), decisiones 32 y
  retoque de 18.
- El wip **también** tocó `package.json`, `CHANGELOG.md` y `public/sw.js` (flujo viejo):
  **devuélvelos a como están en `origin/main`** y crea en su lugar el changeset.

### Enfoque decidido
1. `git merge origin/main` (entró #33, changesets). Resuelve conflictos en esos tres archivos
   quedándote con `main`.
2. Revisa el wip contra D132–D134 y **verifícalo en el navegador** (nunca se verificó):
   Banderas y Capitales en competitivo, fallar y saltar; el badge aparece, el cronómetro salta
   en el mismo instante, dos castigos seguidos no se pisan, movimiento reducido (aparece y se
   va sin moverse), el `aria-live` anuncia cada castigo, el aviso de fallo ya no dice
   "+10 s". También en la partida del tutorial (usa el mismo `Session`).
3. `performance.now()` en `Session.tsx` (arriba). Anótalo como un punto más en D132 o D133
   (no hace falta número nuevo). El tiempo final del rush debe salir igual.
4. Deja los 3 números D132–D134 tal cual si siguen valiendo; corrige lo que la verificación
   desmienta.

### Trampas conocidas
- El React Compiler pliega copias locales de variables de módulo (ver `CURRENT_PHASE.md`,
  hallazgo del tutorial): si algo "no hace nada", sospecha de eso.
- Los temporizadores del badge leen `onDone` de un ref (D133): el padre renderiza cada 100 ms.
- `tests/unit/tutorial-sandbox.test.ts` vigila los imports del árbol del tutorial: córrelo.
- W4 (ola 2) añadirá el sonido `penalty` sincronizado con tu badge: deja un único punto donde
  se aplica el castigo (`applyPenalty`) para que lo enganche ahí.

### Cómo verificar
Ver arriba + 320 px (el badge a la izquierda del cronómetro no debe desbordar ni tapar el
contador), claro y oscuro, axe.

### Cierre
Changeset: **patch** — "El castigo del competitivo ahora aparece como +10 s / +20 s junto al
cronómetro, que salta en el acto; el aviso de fallo ya no lo repite." PR con
"Decisión tomada / alternativa" para "+10 s" vs "+10". Sin acciones manuales.

---

## W2 — `feat/ranking-continentes`

Eres el worker **W2**. Rama: `feat/ranking-continentes`. Decisiones:
`context/decisions/34-ranking-continentes.md`, rango **D137–D141**. Filas de
CONTENT_CHECKLIST: **44–45**.

Condicionan: D033 (scopes del ranking), D061 (registro de juegos), D075–D076 (regla 2 y
`world@2`), D112–D114 (validación en servidor, mínimos, rechazo definitivo; `decisions/26-ranking-validacion.md`),
D115–D117 (skeleton/altura/demo), `decisions/12-sync-fallida.md`.

### Qué pide el dueño
P20, P14 y P15 de `pendientes.md` (léelos enteros; P20 trae el diseño paso a paso).

### Dónde está
- `src/components/app/GameEffects.tsx:578-635` — efecto de subida al ranking (solo world).
- `src/types/country.ts:120-165` — `WorldBestTimeKey`, `WORLD_BEST_TIME_KEYS`, `LEADERBOARD_SCOPES`.
- `src/utils/learning-storage.ts:838` `getWorldBestTime`, `:869` actualización de la mejor
  marca (`previousBest`); `getBestTimeKey` (`hooks/useGame.ts:259` lo usa); merge de
  `regionBestTimes` (clave a clave por el menor).
- `src/utils/leaderboard-validation.ts` — mínimos por scope, `shouldRetryLeaderboardUpload`.
- `src/utils/cloud-storage.ts` — `upsertLeaderboardEntry` (P15: hoy sustituye sin comprobar
  que la nueva sea mejor).
- `src/components/game/configuration/LeaderboardModal.tsx` — selector de continente (P20.6).
  `leaderboard-demo.ts` — rangos por scope (l. 93).
- `src/components/game/session/countries/CountriesRush.tsx` — `Date.now()` → `performance.now()`
  (P15; `Session.tsx` lo hace W1, no lo toques).
- SQL de la validación actual: `supabase/leaderboard-validacion.sql` (carpeta principal).

### Enfoque decidido
- P20 tal como está escrito: claves `"<region>@2"` para flags/capitals, `"<region>"` para
  países; scopes `countries:<region>`, `flags:<region>@2`, `capitals:<region>@2`;
  `getLeaderboardScope(gameType, region | "world")`; "world" no cambia.
- Subida: en serie/limitada, ref de "última subida" por scope, reintento con **backoff**
  (P14) en vez de con cada cambio de `learningData`; los rechazos del servidor siguen siendo
  definitivos (D113).
- P15: el cliente no guarda como mejor marca un tiempo por debajo del mínimo del scope
  (misma fórmula que `leaderboard-validation.ts`); y `upsertLeaderboardEntry` no sustituye
  una marca pública mejor (o lo hace el SQL con `least(...)`; elige y explícalo).
- SQL nuevo `supabase/leaderboard-continentes.sql` (lo aplica el dueño): mínimos de los 24
  scopes nuevos = nº de países del continente × 300 ms; lo que haga falta para P15 en servidor.
  El cliente debe funcionar sin él (las subidas de continente simplemente no se validarán en
  servidor hasta aplicarlo; dilo en el PR).
- UI: HeroUI `Select` con "Todo el mundo" + los 8 continentes (nombres de `RegionSelector`)
  encima de la lista; por defecto "Todo el mundo", o el continente recién jugado si se abre
  desde Resultados; `aria-live` al cambiar; skeleton/altura animada al cambiar.
- **No** hagas el podio ni la columna del puesto (P21): es W5 en la ola 2. Toca de
  `LeaderboardModal` solo lo necesario para el selector.

### Trampas conocidas
- Un cliente viejo cacheado sigue escribiendo en `"europe"`, etc.: por eso las claves `@2`.
  Las claves desconocidas se conservan al normalizar y al fusionar: añade test.
- Primera carga tras el deploy: subirá marcas de continente de Países ya guardadas: nada de
  24 peticiones de golpe.
- `getLeaderboardMinimums()` y su test deben cubrir los 27 scopes (D114: los desconocidos
  no tienen mínimo; los de continente sí desde el primer día).
- Tests de la capa pura: claves versionadas, merge, scopes, mínimos, backoff, validación local.

### Cómo verificar
`?demo-ranking` y `?demo-ranking=top` con el selector en varios continentes; 320 px (el
Select cabe), claro/oscuro, teclado en el Select, axe. Como invitado no se sube nada: la
subida se prueba por tests.

### Cierre
Changeset: **minor** — "El ranking ahora también tiene clasificación por continente: elige
el continente arriba de la lista. Cuenta un rush de un continente completo." (+ patch interno
de P14/P15 si quien juega lo nota). PR con "Decisión tomada / alternativa" para: default del
selector, P15 en cliente vs SQL. Acción manual: aplicar `supabase/leaderboard-continentes.sql`
**antes o a la vez** que el deploy.

---

## W3 — `fix/skip-link-contraste-aviso-vapid`

Eres el worker **W3**. Rama: `fix/skip-link-contraste-aviso-vapid`. Decisiones:
`context/decisions/35-skip-link-contraste.md`, rango **D142**. Fila de CONTENT_CHECKLIST: **46**
(probablemente no la uses).

Condicionan: D101 (foco), D106 (blanco sobre primary 4,66:1), D131 (skip link en `nav`),
D126 (notificaciones).

### Qué pide el dueño
P16 y P17 punto 3 de `pendientes.md`.

### Dónde está
- `src/layouts/Layout.astro:140` — `focus:text-primary-soft` sobre `focus:bg-primary` (3,96:1).
- `src/utils/push-notifications.ts:122-125` — aviso de `PUBLIC_VAPID_PUBLIC_KEY` que sale ×4.

### Enfoque decidido
- Texto `primary-foreground` (o el token de blanco que use D106), en claro y oscuro con ≥ 4,5:1
  medido. El anillo de foco sigue visible sobre el fondo de la página.
- El aviso VAPID se emite **una vez por carga** (flag a nivel de módulo); no se quita.
  Cuidado con el React Compiler y las variables de módulo (ver W1, trampa 1).

### Cómo verificar
axe `color-contrast` limpio con el skip link enfocado (Tab al cargar), claro y oscuro. Consola:
un solo aviso VAPID (el `.env` local no tiene la clave, así que debe salir exactamente una vez).

### Cierre
Changeset: **patch** — "El enlace 'Saltar al contenido' se lee mejor en el tema claro."
(El aviso de consola no lo nota quien juega.) Sin acciones manuales.

---

## W4 — `feat/mas-sonidos` (ola 2: tras merge de W1 y W2)

Eres el worker **W4**. Rama: `feat/mas-sonidos`. Decisiones:
`context/decisions/36-mas-sonidos.md`, rango **D143–D146**. Fila de CONTENT_CHECKLIST: **47**.

Condicionan: D080–D082 (`decisions/` de sonidos: Web Audio sintetizado, refuerzo nunca única
señal, respeta `getSoundEnabled`, falla en silencio), D125 (sonido de fallo audible),
D072 (sandbox del tutorial), D132–D134 (castigo animado).

### Qué pide el dueño
P18 de `pendientes.md`, **solo**: `select`, `start`, `penalty`, `record` y `skip` (nota
neutra propia; hoy saltar suena `incorrect`). Sin hover, sin interruptor nuevo, sin
`finish`/`streak`/`grade`/`page`/cuenta atrás.

### Dónde está
- `src/utils/sound.ts:17` `SoundName`, `:113` `SOUNDS`, `:304` `playSound`.
- `select`: `configuration/GameTypeToggle.tsx`, `RegionOption.tsx`/`RegionSelector.tsx`,
  toggle competitivo/práctica, `ui/OptionTile.tsx`. Un hook en `src/hooks/` (p. ej.
  `useSelectSound`) y los wrappers de `ui/` **sin cambiar su API**.
- `start`: donde empieza la partida (busca el handler de "Empezar").
- `skip`: `session/Session.tsx` (hoy `playSound("incorrect")` ~l. 410) y el rush de Países si
  tiene saltar.
- `penalty`: en `applyPenalty` de `Session.tsx` (W1), sincronizado con el badge.
- `record`: al batir la mejor marca de un rush (mira qué sabe `Results.tsx`/`useGame` de
  `previousBest`, `learning-storage.ts` ~l. 869). Más larga que `achievement`.

### Trampas conocidas
- `select` muy bajo y corto: se oye muchas veces. No suena al cambiar por teclado con flechas
  dentro de un grupo si eso lo vuelve molesto: decide y explícalo.
- `penalty` y `incorrect` suenan juntos al fallar en competitivo: que no se tapen (o que
  `penalty` sustituya a `incorrect` en competitivo; decide y explícalo).
- `sound.ts` solo lee de `learning-storage` (el test del sandbox vigila imports).

### Cómo verificar
No se puede oír: comprueba con un espía sobre `playSound` en el navegador que cada evento
dispara el sonido correcto una sola vez y ninguno con el sonido apagado. Tests unitarios de
la tabla de sonidos si hay capa pura.

### Cierre
Changeset: **minor** — "Nuevos sonidos: al elegir opciones, al empezar, al saltar, en el
castigo del competitivo y al batir tu récord." Sin acciones manuales.

---

## W5 — `style/ranking-podio` (ola 2: tras merge de W2)

Eres el worker **W5**. Rama: `style/ranking-podio`. Decisiones:
`context/decisions/37-ranking-podio.md`, rango **D147–D150**. Fila de CONTENT_CHECKLIST: **48**.

Condicionan: D115–D117 (skeleton/altura/demo), W2 (D137–D141, selector por continente),
D103/D130 (hover al tocar), `context/COLORS.md` (no hay oro/plata/bronce).

### Qué pide el dueño
P21 de `pendientes.md`. **Hover solo visual** (decidido): fila no enfocable, sin tooltip.

### Dónde está
`src/components/game/configuration/LeaderboardModal.tsx` (`ROW_CLASS` ~l. 43,
`LeaderboardRow` ~l. 87, columna `w-7` ~l. 109/147, ancho del modal `w-[min(30rem,92vw)]`
~l. 235) — las líneas se habrán movido con W2. Tokens en `src/styles/global.css` y
`context/COLORS.md`.

### Enfoque decidido
Lo de P21 tal cual: tokens `--medal-gold/-silver/-bronze` (+ soft) en claro y oscuro con
contraste medido; medalla de `iconoir-react` `aria-hidden` + número real; tu fila en el podio
= fondo de tu fila + medalla y borde del color del puesto; columna del puesto por dígitos del
puesto más alto (`ch`) compartida con la fila propia; `gap-3`/`gap-4`; modal a ~34–36 rem sin
romper 320 px (token o decisión).

### Cómo verificar
`?demo-ranking`, `?demo-ranking=top`, 30 filas; forzar un puesto de 3 cifras (amplía la demo
si hace falta, solo dev). 320 px, claro/oscuro, axe, hover y toque (sin hover pegado).

### Cierre
Changeset: **patch** — "Ranking: el podio se destaca con oro, plata y bronce, y las filas se
leen mejor." Sin acciones manuales.

---

## W6 — `style/animaciones-partida` (ola 3: tras merge de W4)

Eres el worker **W6**. Rama: `style/animaciones-partida`. Decisiones:
`context/decisions/38-animaciones-partida.md`, rango **D151–D153**. Fila: **49**.

Condicionan: `decisions/03-animaciones.md`, D132–D134 (castigo animado junto al cronómetro:
no lo pises), sonidos de W4.

### Qué pide el dueño
De P19, **solo** las ★ de "Partida": (1) acierto: anillo verde que se expande y se desvanece
en `StimulusFrame`; fallo: sacudida horizontal corta (±4 px, 200 ms) + borde rojo (el
icono/texto de `FeedbackMessage` ya es la señal no cromática); (2) cambio de pregunta: la
bandera nueva entra con `fade-in slide-in-from-right-4`.

### Dónde está
`src/components/game/session/StimulusFrame.tsx`, `ui/FeedbackMessage.tsx`, `Session.tsx`
(dónde se sabe acierto/fallo y cambia la tarjeta), rush de Países y práctica de Países si usan
`StimulusFrame`. `@keyframes` nuevos al final de `global.css` (W7 también añade: conserva los
dos al integrar).

### Cómo verificar
Banderas y Capitales, práctica y competitivo, tutorial; movimiento reducido (sin sacudida ni
anillo moviéndose; el borde rojo sí vale); 320 px sin scroll horizontal durante la sacudida.

### Cierre
Changeset: **patch** — "La partida responde con una animación al acertar o fallar, y cada
bandera nueva entra deslizándose."

---

## W7 — `style/animaciones-resultados` (ola 3: tras merge de W4)

Eres el worker **W7**. Rama: `style/animaciones-resultados`. Decisiones:
`context/decisions/39-animaciones-resultados.md`, rango **D154–D156**. Fila: **50**.

Condicionan: `decisions/03-animaciones.md`, sonido `record` de W4 (D143–D146).

### Qué pide el dueño
De P19, **solo** las ★ de "Resultados": (1) números que cuentan hacia arriba (~600 ms); con
movimiento reducido, valor final directo; `aria-live` solo con el valor final; (2) nuevo
récord: confeti CSS (~20 partículas, `@keyframes`, sin librería) + insignia "¡Nuevo récord!"
con zoom-in, sincronizado con el sonido `record`.

### Dónde está
`src/components/game/Results.tsx`; cómo se sabe que hubo récord: donde W4 dispara `record`.
`@keyframes` al final de `global.css` (W6 también añade).

### Trampas conocidas
- El contador con `requestAnimationFrame` no corre con la pestaña en segundo plano (visto en
  el tutorial): que el valor final quede puesto igualmente.
- El confeti no debe provocar scroll horizontal a 320 px (`overflow-hidden` en su capa,
  `pointer-events-none`, `aria-hidden`).

### Cierre
Changeset: **patch** — "Resultados más vivos: los números cuentan hacia arriba y batir tu
récord se celebra con confeti."

---

## W8 — `style/animaciones-configuracion` (ola 3: tras merge de W4)

Eres el worker **W8**. Rama: `style/animaciones-configuracion`. Decisiones:
`context/decisions/40-animaciones-configuracion.md`, rango **D157–D158**. Fila: **51**.

Condicionan: `decisions/03-animaciones.md`, D103/D130 (hover al tocar, pulsado), D129,
sonido `select` de W4 (no lo toques).

### Qué pide el dueño
De P19, **solo** la ★ de "Configuración": tarjetas de continente / tipo de juego: al pasar,
sube 2 px + sombra; al pulsar, escala 0,98; la elegida hace un "pop" (zoom-in-95 → 100).

### Dónde está
`configuration/RegionOption.tsx`, `GameTypeToggle.tsx`, `ui/OptionTile.tsx` (wrapper: no
cambies su API). Sombras y duraciones de `DESIGN_TOKENS.md`.

### Trampas conocidas
- El "pop" solo al elegir, no al montar la vista ni al restaurar la selección guardada.
- El translate de hover no debe mover el foco visible ni recortar el anillo
  (`overflow` del contenedor).
- Sin hover pegado en táctil (patrón D103/D130).

### Cierre
Changeset: **patch** — "Las tarjetas de continente y de tipo de juego responden al pasar y
al pulsar."
