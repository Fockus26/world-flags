# Prompts de los workers — tanda del 2026-09-23

> Para el orquestador. Cada bloque `W#` es el prompt **literal** que se le pasa al
> `Agent` con `subagent_type: "feature-worker"` (Opus 5.5, effort medium, definido en
> `.claude/agents/feature-worker.md`), `run_in_background: true` y, salvo W5,
> `isolation: "worktree"`. Brief común: `orquestacion-2026-09-23.md` (misma carpeta).
>
> **Ola 1:** W1–W5 en paralelo. **Ola 2:** W6 y W7, desde `main` después de que se
> mergeen W1 y W3.
>
> Decisiones del dueño ya tomadas (2026-09-23): cada worker puede levantar su propio
> `bun run dev` en su puerto; W1 aplica las columnas de avatar vía MCP; castigo del
> competitivo = **10 s por fallo, 20 s por saltar**; el ranking actual **se limpia**,
> "sin segunda temporada ni nada por el estilo" (claves de scope internas nuevas =
> invisibles para el jugador; el borrado de filas viejas lo corre el orquestador tras
> el despliegue).

---

## W1 — `feat/ranking-nueva-regla`

Eres el worker **W1**. Rama: `feat/ranking-nueva-regla`. Puerto dev: **4331**. Decisiones: archivo `context/decisions/18-ranking-nueva-regla.md`, rango **D075–D079**. Filas de CONTENT_CHECKLIST: **26–27** (anótalas en tu PHASE_LOG, no en el checklist).

Primero lee el brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-23.md`. Luego `CLAUDE.md` y los docs que pide. Decisiones relevantes para ti: D033 (un scope por juego), D050/D052 (ranking sin red), D060 (versionado), D061 (registro de juegos), y la auditoría `context/plans/auditoria-paises.md` §7 (en la carpeta principal), que ya advertía: **borrar filas del ranking no sirve, `GameEffects` las vuelve a subir en cada carga**.

### Qué pide el dueño (5 cosas, una sola unidad porque todas giran alrededor del ranking)

#### 1. Castigo nuevo en competitivo
Hoy en `src/components/game/session/Session.tsx` (arriba): `RUSH_WRONG_PENALTY_MS = 2000`, `RUSH_SKIP_PENALTY_MS = 5000`. Pasan a **10 000 ms por respuesta incorrecta y 20 000 ms por saltar** (decisión del dueño). Revisa también `countries/CountriesRush.tsx`: si el rush de Países tiene algún castigo, aplícale la misma regla; si no tiene ninguno (solo "Rendirme"), no inventes uno y dilo en el PR. Busca cualquier texto o indicador visual que cite los segundos del castigo (ayuda de `GameTab.tsx` "fallar penaliza", `tutorial/tutorial-script.tsx` línea ~101, `Header`/`Timer`) y, si ayuda al jugador, hazlo explícito ("+10 s por fallo, +20 s por saltar") como copy provisional (fila 26). Revisa `src/utils/achievements.ts` por si algún logro depende de umbrales de tiempo del rush.

#### 2. Ranking limpio con la regla nueva — "sin segunda temporada ni nada por el estilo" (dueño)
Los tiempos actuales se hicieron con +2 s/+5 s y ya no son comparables. El dueño quiere que el ranking arranque vacío, sin que el jugador vea "temporadas". Tres trampas que tu diseño tiene que cerrar:
- **Clientes viejos cacheados por el SW** (`public/sw.js` cachea agresivo) seguirán subiendo su mejor tiempo viejo en cada carga (`GameEffects.tsx` ~línea 570: sube `regionBestTimes.world` cada vez que cambia respecto a `pushedWorldBestRef`, que se reinicia en cada carga). Solución recomendada: **claves de scope internas nuevas** en `LEADERBOARD_SCOPES` (`src/types/country.ts:115`, hoy `"countries:world"`, `"world"`, `"capitals:world"`), p. ej. con sufijo de regla. Es invisible para el jugador (no es una temporada: nadie ve el nombre del scope) y los clientes viejos escriben en claves que ya nadie lee.
- **El mejor tiempo guardado del propio usuario** (`regionBestTimes.world` de cada juego, en local y en la nube) se hizo con la regla vieja: si el cliente nuevo lo sube a la clave nueva, el ranking "limpio" nace con tiempos viejos. Hay que invalidarlo, y de forma que el **merge** (`mergeRegionBestTimes` en `src/utils/learning-storage.ts` ~1178 se queda con el **menor**) no lo resucite desde otro dispositivo, la copia de la nube o un invitado (D056). Una marca de versión de regla en los datos del juego, que la migración y el merge respeten, es el camino esperado; mira cómo persiste cada juego (`SUB_GAME_KEYS`, `SUB_GAME_COLUMNS` en `cloud-storage.ts`, D061) antes de decidir dónde vive la marca. Si hace falta una columna nueva, es aditiva y puedes aplicarla (ver punto 4). Cubre el merge con tests en `tests/unit/` (la capa pura de sync/merge ya tiene tests: síguelos), incluida la idempotencia.
- **Alcance del reseteo:** invalida solo lo que alimenta el ranking (el mejor tiempo de "Todo el mundo") de los juegos cuya regla cambió. Los mejores tiempos por continente, consérvalos; deja en el PR la alternativa (resetearlos también) en 2 líneas. Si el rush de Países no cambió de regla, su ranking y sus tiempos no se tocan (y dilo en el PR).
- **Las filas viejas de `leaderboard_entries`**: NO las borres tú. Escribe el SQL de limpieza (borrar las filas de los scopes viejos) en `supabase/leaderboard-limpieza-regla-2.sql` de la **carpeta principal** (local, gitignored) y márcalo en el PR y en tu PHASE_LOG como acción posterior al despliegue; lo ejecutará el orquestador cuando el dueño confirme que el cliente nuevo está desplegado.

Versión: según D060, descartar un mejor tiempo guardado es "romper progreso guardado" → probablemente **MAJOR (2.0.0)**. Decide con D060 delante y explícalo en el PR. La entrada del CHANGELOG le cuenta al jugador, sin tecnicismos, el castigo nuevo y que el ranking empieza de cero (y por qué).

#### 3. Top 20
`LeaderboardModal.tsx`: `TOP_COUNT` 5 → **20**. Se mantiene la fila propia debajo del separador cuando estás fuera del top. Con 20 filas el modal crece: `ui/Modal` ya hace scroll propio (90dvh); comprueba que la cabecera y el selector de juego siguen usables y que a 320 px no hay scroll horizontal. Puedes ensanchar el modal si las filas con avatar lo piden (hoy `w-[min(28rem,92vw)]`).

#### 4. Avatares en el ranking
El avatar es `getAvatarUrl(profile.avatarStyle, profile.avatarSeed)` (`src/utils/avatar.ts`, dicebear, CDN externo). Hoy `leaderboard_entries` solo guarda `display_name` y `best_time_ms` (esquema en `supabase/leaderboard.sql` de la carpeta principal, local).
- **Migración (autorizada por el dueño, vía MCP de Supabase):** añade `avatar_style text` y `avatar_seed text` **nullable** a `public.leaderboard_entries`. Carga las herramientas con ToolSearch (`select:mcp__da5a8f40-e8e2-4c2f-9326-42b91c081f61__list_projects,mcp__da5a8f40-e8e2-4c2f-9326-42b91c081f61__list_tables,mcp__da5a8f40-e8e2-4c2f-9326-42b91c081f61__apply_migration`), localiza el proyecto (el de la URL de `.env`), inspecciona la tabla y aplica con `apply_migration` solo ese `alter table ... add column if not exists`. Nada más en la base: ni borrar, ni tocar políticas RLS (las de insert/update propias ya cubren columnas nuevas; compruébalo). Guarda el mismo SQL en `supabase/leaderboard-avatares.sql` (carpeta principal, local).
- Cliente: `fetchLeaderboard` selecciona las columnas nuevas; `upsertLeaderboardEntry` las envía; `LeaderboardEntry` las lleva. Filas sin avatar (null) → la inicial del nombre, igual que el fallback de `AvatarImage` en `UserSummary.tsx`. Si extraes ese avatar-con-fallback a un componente compartido, `UserSummary` conserva su API y su aspecto. Avatares pequeños, `loading="lazy"`, decorativos (`alt=""`: el nombre ya está en la fila). Sin conexión, la inicial (D052).
- **Nombre y avatar desactualizados:** hoy la fila solo se reescribe al batir la marca, así que si el usuario cambia de nombre o avatar el ranking sigue con los viejos. Haz que un cambio de perfil actualice nombre y avatar de las filas del usuario (mejor esfuerzo, como el resto del ranking), sin tocar el tiempo.

#### 5. Skeleton en lugar de "Cargando…"
En `LeaderboardModal.tsx` hoy hay `<p>Cargando…</p>`. Sustitúyelo por filas skeleton con la forma de las filas reales (avatar redondo, nombre, tiempo), con `ui/Skeleton` (ya trae el umbral de 300 ms y el texto de referencia invisible, D042) y un anuncio para lectores de pantalla (mira `ui/LoadingAnnouncer` o un `role="status"`; la lista va con `aria-busy` mientras carga). Sin salto de layout al llegar los datos.

### Cómo verificar
- Unit tests del merge/migración nuevos + los existentes, `astro check`, biome, build.
- Navegador (puerto 4331, tu propia pestaña). **Ojo: el `.env` apunta a la base de producción.** No crees cuentas, no inicies sesión y no subas tiempos a producción. El ranking público se lee sin sesión: verifica con él. Para ver 20 filas, avatares, la fila propia fuera del top y el skeleton (latencia), intercepta la respuesta de la API REST de `leaderboard_entries` desde la página con `javascript_tool` (p. ej. envolver `window.fetch` antes de abrir el modal) — solo para depurar, nada de eso se commitea.
- Juega un rush corto de Banderas como invitado (continente pequeño) y comprueba que fallar suma 10 s y saltar 20 s (lee el cronómetro en el DOM).
- a11y: axe claro/oscuro sobre el modal (cargando, cargado, vacío, sin red), 320 px, teclado.

### Cierre
PR contra `main` según el brief. En el PR, sección "Acciones manuales / orden de despliegue": (1) columnas de avatar ya aplicadas (di cuándo), (2) SQL de limpieza de filas viejas a correr **después** de desplegar, (3) cualquier otra. Tu informe final: URL del PR, versión, verificación hecha/no hecha, decisiones abiertas.

---

## W2 — `feat/sonidos`

Eres el worker **W2**. Rama: `feat/sonidos`. Puerto dev: **4332**. Decisiones: `context/decisions/19-sonidos.md`, rango **D080–D084**. Filas de CONTENT_CHECKLIST: **28–29** (en tu PHASE_LOG).

Primero lee el brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-23.md`. Luego `CLAUDE.md` y los docs que pide. Relevantes: D071 (preferencia por dispositivo vía `learning-storage.ts`), D072 (la partida del tutorial no pasa por `useGame`; hay un test que vigila sus imports), `context/decisions/05-logros.md` y `06-ajustes-logros.md` (toasts de logros).

### Qué pide el dueño
"Agregar sonidos al responder correcta e incorrectamente, también en los logros."

### Enfoque decidido por el orquestador (sigue esto salvo que encuentres un bloqueo real)
- **Sonidos sintetizados con Web Audio API**, sin archivos: 0 KB de assets, sin licencias que aprobar, funcionan sin red (la app es PWA offline). Tres sonidos: **acierto** (breve, dos notas ascendentes), **fallo** (breve, grave, sin ser estridente), **logro** (arpegio corto, algo más festivo). Menos de ~400 ms cada uno, volumen suave (ganancia baja), envolvente de ataque/caída para que no hagan "clic". Déjalos bonitos: son lo que el jugador oye cientos de veces.
- Módulo `src/utils/sound.ts` (o similar): un único `AudioContext` perezoso, creado/reanudado dentro de un gesto del usuario (política de autoplay); no suena con `document.hidden`; si Web Audio no existe o falla, no pasa nada (nunca rompe el juego).
- **Interruptor "Sonidos"** en la pestaña Juego del modal de configuración (`configurationModal/GameTab.tsx`), activado por defecto. Preferencia **por dispositivo** (como D071 `world-flags-tutorial-seen`): clave nueva en `localStorage` **solo a través de `src/utils/learning-storage.ts`**, no en `UserLearningData` (sin columna nueva ni SQL). Usa un componente de HeroUI (Switch u OptionTile, lo que encaje con el resto de ajustes; consulta Context7 para la API de HeroUI v3). Un hook en `src/hooks/` para leerla/escribirla desde componentes; si varios componentes necesitan reaccionar en vivo al cambio, que no haga falta recargar.
- El sonido **nunca es la única señal** (ya hay aviso visual con icono y texto): es un refuerzo. Déjalo dicho en la decisión.

### Dónde suena
- Banderas/Capitales: `src/components/game/session/Session.tsx` (práctica: al comprobar; competitivo: acierto y fallo; saltar = sonido de fallo en competitivo porque penaliza; en práctica, decide y documenta).
- Práctica diaria: `session/DailyPractice.tsx`.
- Países: `session/countries/CountriesPractice.tsx` y `CountriesRush.tsx`. En el rush de Países los aciertos pueden llegar muy seguidos al escribir rápido: que no se amontonen ni saturen (sonido más corto/suave o limitar la frecuencia).
- Logros: cuando aparece el toast de un logro nuevo (`src/components/game/AchievementToasts.tsx`, `hooks/useAchievementToasts.ts`, `components/app/AchievementsEffects.tsx`). **Una vez por tanda**, no uno por logro si salen varios juntos, y **nunca** por la siembra retroactiva de la primera carga ni por logros que llegan por sincronización.
- El tutorial usa `CountriesPractice` con un sandbox: que suene ahí también está bien, **pero** `tests/unit/tutorial-sandbox.test.ts` vigila que el árbol del tutorial no importe funciones que escriben en `localStorage`. Leer la preferencia está bien; escribirla no puede quedar al alcance de ese árbol. Corre ese test.
- Ojo: el castigo del competitivo lo está cambiando otra unidad en paralelo (W1, constantes al principio de `Session.tsx`). No toques esas constantes; si al sincronizar con `main` hay conflicto ahí, conserva los valores de `main`.

### Cómo verificar
- No puedes oír: instrumenta. Con `javascript_tool`, envuelve `AudioContext.prototype.createOscillator` (o lo que uses) para contar llamadas, y juega como **invitado** (no inicies sesión: el `.env` apunta a producción) una práctica corta de Banderas, una de Países, un rush corto y una práctica diaria si hay pendientes; comprueba que suena lo que toca, una vez, y que con el interruptor apagado no suena nada (también tras recargar). Provoca un logro fácil (p. ej. el de primera partida en un perfil de invitado limpio) y comprueba que suena una vez.
- a11y del interruptor (nombre accesible, estado, teclado, foco visible), axe claro/oscuro, 320 px.
- Unit test de la preferencia (lectura/escritura/valor por defecto) si la capa lo permite.

### Cierre
Versión MINOR. Entrada del CHANGELOG en lenguaje de jugador (y cómo apagarlos). PR según el brief; en el PR, "Decisión tomada / alternativa" para: sintetizados vs. archivos de audio, activado por defecto vs. apagado, qué suena al saltar en práctica. Informe final para el orquestador.

---

## W3 — `feat/modales-logros-novedades`

Eres el worker **W3**. Rama: `feat/modales-logros-novedades`. Puerto dev: **4333**. Decisiones: `context/decisions/20-modales-logros-novedades.md`, rango **D085–D089**. Fila de CONTENT_CHECKLIST: **30** (en tu PHASE_LOG).

Primero lee el brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-23.md`. Luego `CLAUDE.md` y los docs que pide. Relevantes: D012 (esqueleto de modal: título + "Cerrar" arriba, scroll propio de `ui/Modal`), `context/decisions/05-logros.md` y `06-ajustes-logros.md`, D057–D059 (Novedades), `context/decisions/03-animaciones.md` (nada de framer-motion para cosas nuevas).

### Qué pide el dueño (2 cosas)

#### 1. Modal de logros más amplio, con varias tarjetas por fila
"El modal de logros más amplio, que en lugar de una tarjeta por categoría puedan haber más." Hoy `src/components/game/configuration/AchievementsModal.tsx` mide `w-[min(32rem,92vw)]` y cada categoría es una lista de una columna (`AchievementRow`, una tarjeta por línea). Quiere un modal más ancho y, dentro de cada categoría, **una rejilla de tarjetas** con varias por fila.
- Ancho del orden de la partida guiada (`w-[min(58rem,94vw)]`) o el que mejor encaje; columnas responsivas: 1 a 320 px, 2 desde `min-[30rem]`, 3 desde `min-[44rem]` (usa solo breakpoints existentes, `DESIGN_RULES.md`). Tarjetas de alto igual dentro de una fila.
- Rediseña `AchievementRow` como tarjeta si hace falta (icono, nombre, descripción, progreso, estado desbloqueado/bloqueado/"Nuevo"), conservando **todo** lo que ya hace: el estado nunca solo por color (icono/texto), el anillo y la insignia "Nuevo", el scroll automático a la primera nueva (`rowNodesRef`, `scrollIntoView` con `prefers-reduced-motion`), y la semántica `ul`/`li` (la rejilla va en el `ul`).
- **No cambies el botón "Cerrar"** de la cabecera: otra unidad (ola 2) lo convertirá en icono en móvil.

#### 2. Novedades en acordeón
"En novedades mostrar las anteriores versiones colapsadas y que solo se pueda abrir una versión a la vez." `src/components/app/ReleaseNotesModal.tsx` pinta hoy todas las versiones de `CHANGELOG` desplegadas.
- Usa el **Accordion de HeroUI v3** (consulta Context7 la API exacta de v3 antes de escribir: subcomponentes, expansión única, `defaultExpandedKeys`), no uno casero. Expansión **única**; la versión actual (la primera, `APP_VERSION`) **abierta por defecto**; las anteriores cerradas. Volver a pulsar la abierta la puede cerrar.
- En el disparador: "Versión X" y la fecha. El panel: las secciones y viñetas de hoy. Conserva los `id`/`aria-labelledby` que tengan sentido, los encabezados en orden (h2 del modal → h3 por versión) y el formato de fecha en UTC (`formatReleaseDate`).
- Animación de apertura/cierre: la que traiga HeroUI si funciona en este stack; si no, `tw-animate-css`/CSS. Respeta `prefers-reduced-motion`.
- El aviso `ReleaseNotesSnackbar` ("Ver novedades") abre este modal: comprueba que sigue funcionando y que la versión nueva sale abierta.

### Cómo verificar
Navegador (4333, tu pestaña). Logros: como invitado (no inicies sesión: el `.env` apunta a producción) con algún logro desbloqueado y uno "nuevo" (juega una partida corta), a 320, 390, 768, 1024, 1440 px: columnas correctas, sin scroll horizontal, tarjetas iguales, scroll a la nueva. Novedades: teclado (Tab/Enter/Espacio sobre los disparadores), solo una abierta, foco visible, lector de pantalla (`aria-expanded`). axe claro/oscuro en los dos modales. Mide con `getBoundingClientRect`.

### Cierre
Versión MINOR (o PATCH si lo justificas con D060). Entrada del CHANGELOG en lenguaje de jugador. PR según el brief; informe final para el orquestador.

---

## W4 — `fix/tutorial-pulido`

Eres el worker **W4**. Rama: `fix/tutorial-pulido`. Puerto dev: **4334**. Decisiones: `context/decisions/21-tutorial-pulido.md`, rango **D090–D094**. Fila de CONTENT_CHECKLIST: **31** (en tu PHASE_LOG).

Primero lee el brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-23.md`. Luego `CLAUDE.md` y los docs que pide. **Imprescindible:** `context/decisions/17-tutorial-inicial.md` (D071–D074) y la sección del tutorial en `context/CURRENT_PHASE.md` de la carpeta principal (qué se verificó, el hallazgo del React Compiler con variables de módulo, el foco que vuelve al botón "Cómo se juega").

Archivos: `src/components/game/tutorial/Tutorial.tsx`, `tutorial-script.tsx`, `TutorialSettings.tsx`; la partida es `session/countries/CountriesPractice.tsx` con un sandbox (`hooks/useSandboxRuntime.ts`, `utils/tutorial-sandbox.ts`). Tests: `tests/unit/tutorial-sandbox.test.ts` (no deben romperse).

### Qué pide el dueño (texto literal: "En cómo se juega el botón saltar tutorial no debería de aparecer en el último paso ya que es redundante, en muchas partes dice que es una partida ejemplo basta con decirlo una vez; en el ejemplo de juego aumentar el ancho y el alto al de una partida normal, no se tiene que limitar al del modal")

#### 1. Sin "Saltar tutorial" en el último paso
En el último paso (`LAST_STEP_INDEX`) ya está "Empezar a jugar": el botón de saltar sobra. Quítalo ahí (Escape sigue cerrando). Actualiza el comentario de la cabecera del componente que dice que está "visible en todos los pasos". Que la cabecera no salte de alto al desaparecer el botón.

#### 2. "Partida de ejemplo" una sola vez
Hoy se repite que es un ejemplo y que no cuenta: paso 1 ("Te lo enseño con una partida de ejemplo…", `tutorial-script.tsx` ~52), paso de ajustes (~114 "la partida de ejemplo empieza con lo que dejes aquí"), `TutorialSettings.tsx` ~184 ("El ejemplo de dentro de un momento se juega en Práctica"), `demoBanner`, `demoFinished` ("Recuerda: no ha contado para tu progreso"), el texto del aviso de abandonar. Déjalo dicho **una vez, en el paso de la partida** (lo natural es el aviso que se ve mientras se juega), y reescribe el resto para que no lo repitan, sin perder información útil. Todo el guion es copy provisional (#24/#25): lo que cambies va a tu fila 31. No reescribas lo que no tenga que ver con esta repetición.

#### 3. La partida del ejemplo a tamaño de partida normal
Hoy el diálogo mide `w-[min(58rem,94vw)]` y la partida vive en un contenedor fijo `h-[min(60dvh,30rem)]` (`TutorialPlayStep`). El dueño quiere que **mientras se juega** la partida tenga el ancho y el alto de una partida normal, sin quedar limitada por el modal.
- Mide primero la partida real: en la app, una práctica de Países (la vista de sesión dentro de la tarjeta principal, `FlagGame` → `CountriesPractice`) a 320×568, 390×844, 768×1024, 1280×800 y 1440×900. Anota ancho y alto del área de juego.
- Haz que, mientras `isPlaying`, el diálogo crezca para que el área de juego mida lo mismo (o lo más cercano posible) en esos tamaños. `ui/Modal` fija `![max-height:90dvh]`: si hace falta, amplía su API **sin romper la de los consumidores actuales** (p. ej. una variante de tamaño), o dale clases al diálogo desde `Tutorial`. Fuera de la partida, los pasos vuelven al tamaño de hoy. Transición de tamaño suave si es barata (CSS), respetando `prefers-reduced-motion`.
- A 320×568 ya se verificó que la partida cabe sin desbordar y con "Comprobar" visible: que siga así.

### Cómo verificar
Navegador (4334, tu pestaña), como invitado (no inicies sesión: el `.env` apunta a producción). Abre el recorrido desde Perfil y configuración → "Cómo se juega". Recorre los seis pasos, juega el ejemplo, sal a medias (aviso de abandonar), termina. Comprueba: el botón de saltar no está en el último paso; foco al título en cada paso y de vuelta a "Cómo se juega" al cerrar; tamaños medidos iguales a la partida normal; sin scroll horizontal a 320; axe claro/oscuro en cada paso y jugando; `localStorage` byte a byte igual tras jugar el ejemplo (la garantía de D072) y los tests del sandbox en verde.

### Cierre
Versión PATCH. Entrada del CHANGELOG en lenguaje de jugador. PR según el brief; informe final para el orquestador.

---

## W5 — plantilla del correo de confirmación (sin worktree, sin rama, sin PR)

Eres el worker **W5**. **Sin worktree, sin rama y sin PR**: trabajas en la carpeta principal `C:\Users\Admin\Documents\Work\world-flags\` y **solo** escribes en `supabase/templates/` y en `context/PHASE_LOG/email-confirmacion.md` (ambos locales, gitignored). No cambies de rama, no hagas `git add`/commit, no toques `src/` (otros workers trabajan en paralelo en sus worktrees; la carpeta principal está en `main` limpio y así debe quedar). Decisión reservada: **D095**; fila de CONTENT_CHECKLIST: **32** (ambas se anotan en tu PHASE_LOG, no en los archivos compartidos).

Lee el brief común (`context/plans/orquestacion-2026-09-23.md`) — las reglas de rama/PR/puerto no te aplican; las de copy, decisiones y "no tocar la configuración de Auth" sí — y `context/PROJECT_CONTEXT.md` (marca, tono, colores), `context/COLORS.md`, `context/TYPOGRAPHY.md`.

### Qué pide el dueño
"Enviar un email de confirmación al crear una cuenta, con una bonita plantilla."

### Contexto
- La confirmación por correo **ya existe**: el registro (`src/hooks/useAuth.ts`, `supabase.auth.signUp`) deja la cuenta pendiente y `configurationModal/EmailConfirmationPending.tsx` espera y ofrece "reenviar". El correo lo manda **Supabase Auth** con su plantilla por defecto (en inglés y sin marca). Lo que falta es **la plantilla bonita** de "Confirm signup".
- Esa plantilla se configura en el panel de Supabase (Authentication → Emails/Templates), no en el repo. **No la apliques tú** (ni por API ni por navegador): la dejas lista para que el dueño la pegue.

### Entregables
1. `supabase/templates/confirmar-registro.html`: el cuerpo del correo.
   - En español, tono de marca (educativo, motivador, con un punto lúdico, sin ser infantil). Copy provisional (fila 32).
   - HTML de correo "a prueba de clientes": maquetación con tablas, CSS en línea, ~600 px de ancho máximo y fluido en móvil, preheader oculto, botón grande (con enlace de texto plano como alternativa debajo), compatible con modo oscuro de Gmail/Apple Mail en lo razonable.
   - Marca: morado `#6d5ef0` y la paleta de `COLORS.md`; Plus Jakarta Sans con fuentes de sistema de respaldo. **Sin imágenes que haya que alojar** (la app aún no tiene dominio definitivo y Gmail no muestra SVG): cabecera con texto + emoji/banderas o formas CSS.
   - Variables de plantilla de Supabase: **verifícalas en la documentación actual** (herramienta `search_docs` del MCP de Supabase — cárgala con ToolSearch `select:mcp__da5a8f40-e8e2-4c2f-9326-42b91c081f61__search_docs` — o Context7), no de memoria: `{{ .ConfirmationURL }}` y las que uses.
   - Contraste AA medido: texto del botón sobre el morado ≥ 4,5:1 y texto normal ≥ 4,5:1.
2. `supabase/templates/confirmar-registro.asunto.txt`: el asunto (y una alternativa).
3. `supabase/templates/INSTRUCCIONES.md`: pasos exactos para que el dueño la aplique en el panel de Supabase, cómo probarla, y **lo que debe saber del envío**: comprueba en la documentación actual de Supabase las limitaciones del servicio de correo incluido (límite de envíos, a quién deja enviar) y, si aplica, recomienda un SMTP propio (p. ej. Resend) con los pasos a alto nivel. Menciona que "reenviar confirmación" usa la misma plantilla y que el enlace redirige a la Site URL/Redirect URLs de Auth (revisa si `signUp` en `useAuth.ts` pasa `emailRedirectTo`). Si crees que hace falta un cambio de código, **no lo hagas**: descríbelo en tu informe.

### Cómo verificar
Abre el HTML en el navegador integrado en **tu propia pestaña** (`tabs_create`, pasa el `tabId` en cada llamada), con las variables sustituidas por valores de ejemplo en una copia temporal fuera del entregable: a 320 px y 600+ px, claro y con `colorScheme: dark`. Mide contrastes con `javascript_tool`. Cierra tu pestaña al terminar.

### Cierre
Escribe `context/PHASE_LOG/email-confirmacion.md` (qué hiciste, D095 redactada, fila 32, lo verificado, lo pendiente del dueño). Informe final para el orquestador: rutas de los entregables, resumen del diseño, acciones del dueño y cualquier cambio de código recomendado.

---

## W6 — `feat/menu-movil` (ola 2: lanzar cuando W1 y W3 estén en `main`)

Eres el worker **W6**. Rama: `feat/menu-movil`. Puerto dev: **4336**. Decisiones: `context/decisions/22-menu-movil.md`, rango **D096–D100**. Filas de CONTENT_CHECKLIST: **33–34** (en tu PHASE_LOG).

Primero lee el brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-23.md`. Luego `CLAUDE.md` y los docs que pide. Relevantes: D042 (skeleton/contadores en carga), D059 (fila de iconos a 320 px), D066 (selector de juego: `ui/Select` por debajo de `min-[30rem]`), la decisión del `StreakPanel` con `max-w-sm` (en `fix/responsive-racha`, búscala en `DECISIONS_INDEX.md`), y `03-animaciones.md`.

### Qué pide el dueño (4 cosas de la pantalla principal y sus modales)

#### 1. Menú ⋮ en móvil
"En mobile, en lugar de donde está el UserSummary y al lado los 3 botones, va a haber un icono de menú vertical que al dar clic se abrirá mostrando estas 3 opciones con su texto e icono." En `src/components/game/configuration/Configuration.tsx` la fila de arriba es `UserSummary` + tres `IconButton` con tooltip: 🏅 Logros (con contador de "sin ver"), 🏆 Ranking, 📍 Elegir países (con contador de países elegidos).
- En móvil (elige el breakpoint existente donde la fila empieza a apretar — mídelo a 320/360/390/430; `sm` 640 px es el candidato natural), los tres botones se sustituyen por **un botón ⋮** (iconoir `MoreVert`) que abre un menú con las tres opciones, cada una con su icono (los mismos emojis) y su texto. En escritorio, todo igual que hoy.
- Usa el **Dropdown/Menu de HeroUI v3** (consulta Context7): patrón de menú WAI-ARIA, teclado y cierre ya resueltos. Nombre accesible del botón ("Más opciones" o similar, provisional).
- **Los contadores no se pierden:** el de logros sin ver y el de países elegidos se ven en la opción del menú y, al menos el de logros sin ver, se señala en el botón ⋮ (punto/badge), con el dato también en su nombre accesible (nunca solo por color). En carga inicial, sin contadores (D042).
- Al cerrar un modal abierto desde el menú, el foco vuelve a un sitio con sentido (el botón ⋮), no a `<body>`.

#### 2. "Cerrar" → icono X en móvil
En las cabeceras de los modales hay un `Button variant="text" color="danger"` con "Cerrar": `LeaderboardModal`, `AchievementsModal`, `ReleaseNotesModal`, `ConfigurationModal`, `CountryPickerModal` (búscalos: `grep -rn '>\s*Cerrar' src`). En móvil, que sea un botón de solo icono (iconoir `Xmark`) con `aria-label="Cerrar"`; en escritorio, el texto de hoy. Hazlo **una vez**, en un componente compartido en `src/components/ui/` (p. ej. `ModalCloseButton`), y úsalo en todos. No cambies "Saltar tutorial" ni "Cerrar sesión".

#### 3. La racha a todo el ancho en escritorio
"La racha no toma todo el ancho en desktop." `StreakPanel.tsx` tiene `max-w-sm` a propósito: las celdas del calendario son 1/7 del ancho y sin tope crecían a ~90 px. Es una decisión anterior del dueño que **ahora cambia**: regístralo como decisión nueva que sustituye a la vieja. Haz que el panel ocupe todo el ancho de la tarjeta sin que el calendario crezca sin control: p. ej. en escritorio, número de racha y mejor racha a un lado y el calendario (celdas con tamaño máximo) al otro, o el calendario con columnas de ancho máximo centradas. Que en móvil horizontal (740×360) y a 320 px siga cabiendo como hoy (se verificó en `fix/responsive-racha`: último continente y botones alcanzables con la racha abierta).

#### 4. Animación del select del modo de juego
"No hay animaciones en el select del modo de juego." Es el `ui/Select` (HeroUI) que se usa como selector de juego en móvil (`GameTypeToggle.tsx`, por debajo de `min-[30rem]`); el mismo wrapper se usa en otros sitios (p. ej. el estilo de avatar). El desplegable abre y cierra sin transición. Averigua por qué (¿HeroUI v3 trae animación de entrada/salida en el popover y algo la anula — `global.css`, `MotionConfig`, `prefers-reduced-motion`?) y dale una animación de apertura/cierre corta, con `tw-animate-css`/CSS o la propia de HeroUI si funciona, en el wrapper (así la ganan todos los selects). Respeta `prefers-reduced-motion`.

### Cómo verificar
Navegador (4336, tu pestaña), como invitado (no inicies sesión: el `.env` apunta a producción). A 320, 360, 390, 430, 640, 768, 1280, 1440 px: menú ⋮ solo donde toca, sin scroll horizontal, contadores; teclado en el menú (flechas, Escape, foco de vuelta); X con nombre accesible en cada modal; racha abierta y cerrada; select animado (comprueba la animación con estilos computados/`getAnimations()`), y sin animación con `prefers-reduced-motion`. axe claro/oscuro.

### Cierre
Versión MINOR. Entrada del CHANGELOG en lenguaje de jugador. PR según el brief; informe final para el orquestador.

---

## W7 — `style/foco-y-toque` (ola 2: lanzar cuando W1 y W3 estén en `main`)

Eres el worker **W7**. Rama: `style/foco-y-toque`. Puerto dev: **4337**. Decisiones: `context/decisions/23-foco-y-toque.md`, rango **D101–D105**. Fila de CONTENT_CHECKLIST: **35** (si hace falta; en tu PHASE_LOG).

Primero lee el brief común: `C:\Users\Admin\Documents\Work\world-flags\context\plans\orquestacion-2026-09-23.md`. Luego `CLAUDE.md` y los docs que pide. **Imprescindible:** `context/DESIGN_RULES.md` › Accesibilidad ("el foco de teclado replica el aspecto del hover", `HOVER_LIKE_FOCUS`), `context/decisions/02-tokens-y-tema.md` (puente de tokens propios ↔ HeroUI; entiéndelo antes de tocar `theme.css`/`heroui-theme.css`), `context/COLORS.md`.

### Qué pide el dueño (2 cosas de estados de interacción)

#### 1. Contorno de foco del color del elemento
"Al hacer focus con el tab del keyboard sale un outline de color morado; me gustaría que ese color de outline sea según el color del elemento." Hoy el anillo de foco es `--focus` (morado) en todo: el de HeroUI en `ui/Button.tsx` (colores `primary/secondary/danger/warning/success/neutral`) y las clases `focus-visible:outline-[var(--focus)]` / `has-focus-visible:outline-[var(--focus)]` repartidas (`grep -rn "var(--focus)" src`: `OptionTile`, `RegionOption`, `GameTypeToggle`, `UserSummary`, `CountryPickerModal`, `AuthSection`, `Avatar`, `GameTab`, `ConnectivitySnackbar`, `Tutorial`…).
- En `Button`: el anillo toma el color de marca del botón (en `colorVars` ya tienes `brand[color]`); p. ej. una variable `--focus` local al botón o la que use HeroUI para su anillo (compruébalo en `@heroui/styles` y con Context7).
- En el resto: el color del propio elemento (texto `secondary` → anillo `secondary`, etc.); los que no tienen un color propio (neutros) conservan el de hoy o `surface-soft`, decide y documenta.
- **Regla que gana (WCAG 2.1 AA, `DESIGN_RULES.md`): el anillo necesita ≥ 3:1 contra el fondo adyacente, en claro y en oscuro.** Mide cada color. Si uno no llega (el ámbar `warning` y quizá `success` sobre blanco son sospechosos), usa su variante más oscura/clara que sí llegue (p. ej. la mezcla `readableFg` que ya usa `Button`, o el `hover`), nunca uno que falle. Tabla de contrastes medidos en la decisión.
- Nada de colores sueltos: todo sale de tokens.

#### 2. En móvil, al tocar se ve el estilo del hover
"En mobile que al pulsar el elemento se muestre el estilo del hover." En Tailwind v4 `hover:` solo aplica con `@media (hover: hover)`, así que en pantallas táctiles tocar no enseña nada salvo donde alguien añadió `active:` a mano (p. ej. `UserSummary`). Los botones de HeroUI tienen su estado `data-pressed` (`--button-bg-pressed`): comprueba si ya se ve al tocar.
- Solución general preferida: que el estado activo/pulsado replique el hover en todo lo interactivo — p. ej. redefinir la variante `hover` en `src/styles/global.css` con `@custom-variant` para que incluya `:active` (consulta Context7 la sintaxis de Tailwind v4), en vez de sembrar `active:` componente a componente. Comprueba que no rompe los estilos de HeroUI ni deja hovers "pegados" tras tocar en móvil.
- Audita los elementos interactivos principales en emulación táctil (`resize_window` preset `mobile`): tarjetas de continente (`RegionOption`), `OptionTile`, selector de juego, `UserSummary`, iconos de la cabecera, botones de modales, tablero de Países, avatares del perfil. Lista en la decisión qué quedó cubierto.

### Cómo verificar
Navegador (4337, tu pestaña), como invitado. Foco: recorre con Tab la pantalla principal, el modal de configuración (las dos pestañas), el ranking, los logros, una sesión y los resultados; mide el color computado del anillo y su contraste contra el fondo real en claro y oscuro. Toque: en `mobile` emula `:active` (o dispara `pointerdown` y lee estilos computados) sobre cada elemento auditado. axe claro/oscuro. 320 px sin scroll horizontal.

### Cierre
Versión PATCH (o MINOR si lo justificas). Entrada del CHANGELOG en lenguaje de jugador. PR según el brief; informe final para el orquestador.
