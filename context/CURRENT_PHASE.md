# Current Phase — World Flags

> Liviano a propósito. La narrativa de lo cerrado vive en `PHASE_LOG/`.

**Ola:** no se usan olas ahora (tandas sueltas). La próxima tanda cierra con `wave-qa` (kit 3.4.0).

## Estado actual

**Tanda de cierre 2026-10-13** (`plans/tanda-2026-10-13-cierre.md`): C1–C4 hechas el 2026-10-19 en una sola sesión, sin workers (PC nueva: el kit no está instalado), ninguna verificada en navegador.

| PR | Rama | Qué | Changeset | Decisión |
|---|---|---|---|---|
| #86 | `fix/foco-perdido` | C1 · foco recogido: lotes, Resultados, respuesta (readOnly), Todos/Ninguno; `--radius-xs` (P50, P51, P53, P54) | patch | D201–D202 |
| #87 | `chore/marca-titulo` | C4 · `<title>` «Banderas del Mundo — Aprende con repetición espaciada»; alt og aprobada (P57) | patch | — |
| #88 | `feat/pantallas-de-estado` | C3 · 404 propia, ErrorBoundary, `::selection` (P39–P41); copy 404/error provisional (filas 48–49) | minor | D203 |
| #89 | `fix/copy-lotes-y-nota` | C2 · "Lote N de M", "Cancelar", "Lote en marcha", nota en claro al 58 % (P49, P52.3, P52.4, P58) | patch | D204 |

**2026-10-19:** #86, #87, #88 mergeados. `main` traído a #89 con un merge (64a29e0); conflicto del titular resuelto conservando las dos cosas (foco de C1 + "Lote en marcha" de C2). Checks en verde. #89 mergeado (main db1a434). Ramas borradas. Abierto solo #90 (release, del dueño). Sigue: QA final.
**2026-10-19 QA final hecha** (#91 mergeado, main b766a29; wave-qa con base local y sesión): 0 críticos · 1 alto · 2 medios · 1 bajo, informe `plans/qa-tanda-cierre-2026-10-19.md`. **Sigue:** unidad de arreglo del Alto (foco de "Todos"/"Ninguno" del picker cae en "Cerrar": `focusIfLost` sale en `focus.ts:40` porque el botón pulsado aún tiene el foco, y React Aria lo manda a "Cerrar", no a `<body>`). Los medios (doble clic en modales de lotes; foco en `<body>` al abandonar partida) y el bajo (`profile.name` no texto) los decide el dueño. Con el Alto mergeado, la tanda se cierra.

**2026-10-19 tanda de cierre cerrada:** #94–#97 mergeados (foco Todos/Ninguno y abandonar, doble clic en modales, perfil validado, campo de respuesta de texto libre en móvil). QA de arreglos con 0 críticos y 0 altos (`plans/qa-arreglos-2026-10-19.md`, capturas en `plans/shots-arreglos/`). **Sigue:** mergear #100 (doble clic con movimiento reducido, seguimiento de #95); probar el campo de respuesta en un Android y un iPhone reales (sugerencias y autorrelleno de pago); decidir dos hallazgos de a11y que ya estaban antes: contraste 3,96:1 de "encontrados" en Resultados del rush en claro (Medio) y `label-content-name-mismatch` en las filas de continente (Bajo).
**2026-10-19, petición suelta:** interruptor "Notificaciones" en Configuración › Juego (D205), rama `feat/interruptor-notificaciones`, changeset minor. Sin verificar en navegador (axe no corrido: server del dueño).
**Esta PC (Cesar), 2026-10-19:** Bun 1.4.3, gh, Supabase CLI 2.121.0, Docker Desktop estable (ya sin pantallazo), `.env.local` y `.env.test.local` presentes. Kit 3.9.0 instalado en `~/.claude` desde el clon `..\web-agent-kit` (agentes `feature-worker`, `wave-qa`, `design-qa`, `functional-qa`). Pool `..\world-flags-wt\wt1–wt4` creado (puertos 4301–4304).

**Ola de arreglos 2026-10-12 — ola A mergeada (#78–#81), slots libres** (brief `plans/orquestacion-2026-10-12-arreglos.md`, prompts `-prompts.md`, plan `plans/tanda-2026-10-12-arreglos.md`). Base main 27df232 (#73–#77 mergeados).

| PR | Rama | Qué | Changeset | Decisión | Slot |
|---|---|---|---|---|---|
| #79 | `fix/sesion-colgada-reencolado` | F1 · P55 crítico: cola por turnos; también el temporizador de Banderas/Capitales en la repetida | patch | D194 | wt1 |
| #81 | `fix/contraste-secondary-danger` | F3 · contained secondary/danger en `-hover` (hover oscurece), nota 1 oscuro 4,88:1; escala P58 | patch | D195–D196 | wt2 |
| #78 | `fix/seo-metadata` | F5 · P46 (h1 existía vacío: sr-only en el skeleton), P47.5–8, og 169 KB | patch | D197 | wt3 |
| #80 | `fix/ranking-cache-bordes` | F6 · P56: reset al abrir en render (1 petición), `subscribe` de la caché (también avisa en `clear`) | patch | D198 | wt4 |

Ola A: 4/4 PRs abiertos (#78–#81). Sigue: ola B (F2, F4 + P58) en otra sesión tras mergear la A + wave-qa.

**Tanda 2026-10-12** (`plans/orquestacion-2026-10-12.md`, prompts `-prompts.md`). Ola 1, PRs abiertos:

| PR | Rama | Qué | Changeset | Decisión | Slot |
|---|---|---|---|---|---|
| #69 | `fix/lotes-ya-sabido-nota-10` | "Ya sabido" = continente 10/10 + SM2 ≥2; recorridos viejos se recalculan | patch | D189 | wt1 |
| #70 | `perf/ranking-cache` | Caché del ranking en memoria 60 s, invalidación al subir/perfil/cuenta | patch | D188 | wt3 |
| #71 | `fix/selector-paises-area-clic` | Fila de continente y opciones de país clicables en toda su área (+ contraste de "Todos/Ninguno") | patch | D187 | wt2 |

#69–#71 mergeados. Ola 2 abierta: #73 (W6, P44, D192) · #74 (W4 dado avatares, minor, D190) · #75 (W7, P45, D193) · #76 (W5 Todos/Ninguno, D191).
QA: `plans/qa-tanda-` (Q1), `qa-design-`, `qa-a11y-`, `qa-seo-2026-10-12.md`. Ola de arreglos planificada en `plans/tanda-2026-10-12-arreglos.md` (F1–F6, empieza por P55 crítico), en otra sesión. Decisiones P47/P48/P49/P52 tomadas (en `pendientes.md`).
**Bloquea (dueño):** `supabase/` local con config+migraciones (P42), `.env.test.local` con EMAIL_TEST/PASSWORD_TEST, Docker abierto — sin eso no hay QA con sesión. Decisiones: P48, P52, copy P49 y los textos SEO de P47.
Copy fila 50 ampliada con la frase de D189 (pendiente de aprobar). Pendientes nuevos P44–P45.

**2026-10-02 — `feat/recorrido-por-lotes`** (minor, D185): "Aprender por lotes", lotes de 3/5/10
de un alcance que se abren al consolidar el anterior (acierto a la primera en 2 días distintos).
Columna nueva `learning_paths`: **el dueño corre `supabase/learning-paths.sql` antes de mergear**
(si no, la sync de cuentas falla, D044/D050). Verificado en navegador como invitado (crear,
jugar, día 2 simulado → lote 2, resultados, abandonar; axe limpio claro/oscuro, 320 px).
Copy pendiente de aprobar (fila 50). Hallazgo sin arreglar: los reencolados de una misma sesión
recalifican el SM2 (2× "Bien" el mismo día = 2 repeticiones, intervalo de 6 días).

**2026-10-02 — `chore/kit-3.5.0` → PR #64** (kit 3.2.0 → 3.5.0, sin changeset): `.kit-version`,
`KIT_FEEDBACK.md`, `scripts/qa-local.ts` + `qa:local`, D184 (`supabase/` privado, se copia al
slot), secciones nuevas en `PROJECT_CONTEXT`. Pendientes nuevos P39–P43. El `feature-worker.md`
local (antiguo) se renombró a `.claude/agents/feature-worker.md.bak` para que mande el global del kit.
Ojo: D093–D095 no existen en `decisions/` (D095 solo en `PHASE_LOG/email-confirmacion.md`) ni la fila 32
del checklist: sin arreglar, a revisar.

`main` en **2.6.1** (#44 mergeado). Tandas 2026-09-26, b y c cerradas: #45–#51 mergeados. P1–P35 de `plans/pendientes.md` resueltos.

**Sesión 2026-09-28 (sin orquestar, un PR por unidad, ninguno verificado en navegador):**

| PR | Rama | Qué | Changeset | Decisión |
|---|---|---|---|---|
| #52 | `chore/dominio-produccion` | `SITE_URL` = https://world-flags-hazel.vercel.app, robots, `og-image.png` (filas 1–3) | patch | — |
| #53 | `perf/sync-columnas-cambiadas` | La sync sube solo las columnas cambiadas (hallazgo QA 1) | — | D173 |
| #54 | `fix/borde-campos-contraste` | `--field-border` claro #817bab, 3:1 (hallazgo QA 4) | patch | D174 |
| #55 | `perf/fuente-autohospedada` | Plus Jakarta Sans por `@fontsource-variable` (fila 4) | patch | D175 |
| #56 | `perf/css-heroui-granular` | HeroUI por partes, 49→25 KB gzip (fila 5) | — | D176 |
| #57 | `refactor/quitar-framer-motion` | Fuera framer-motion y `animations.ts` (fila 6), JS 337→296 KB gzip | patch | D177 |
| #58 | `refactor/escala-tipografica` | Escala `--text-*` (pendiente general) | — | D178 |
| #61 | `fix/hidratacion-calendario-racha` | P36: calendario de racha tras montar (`useIsClient`), fuera el #418 | patch | D179 |
| #62 | `fix/ranking-tiempo-entero` | P37: marcas en ms enteros al subir al ranking (22P02) | patch | D180 |

**2026-09-28:** #52–#62 mergeados; el dueño da por resuelto todo lo demás (DELETE del ranking viejo, comprobaciones de Supabase). #59 (release) abierto.

**`chore/decisiones-y-ci`** (alineación con el web-agent-kit nuevo, sin changeset): `DECISIONS_INDEX.md` y los 53 `NN-<tema>.md` pasan a un archivo por decisión, `context/decisions/D0NN-<tema>.md` (cabecera `# D0NN · Categoría · Resumen · Estado`; índice = `grep -rh "^# D" context/decisions/ | sort`). 171 IDs del índice + **D181–D183**: las D008/D009/D010 de `03-animaciones.md` (giro de `PageFlip`, `AutoHeight`, fundido de Tabs) chocaban con las D008–D010 del índice y se renumeraron (elegido por el dueño). Filas sin ID y prosa suelta, al cuerpo de la decisión afín. CI: `workflow_dispatch` en `ci.yml` y `release.yml` lanza el CI sobre `changeset-release/main`, así el PR de versión recibe el check `ci` sin saltarse la protección. Los `plans/` y `PHASE_LOG/` cerrados siguen citando los archivos viejos: el ID se busca igual.
Hallazgo QA 2 (`pickMoreRecentReview` sin uso) ya estaba resuelto (`c6a66b1`, D048). Pool wt1–wt4 libre.

**Tanda 2026-09-26b** (P22–P27, `plans/orquestacion-2026-09-26b.md`): X3 `fix/practica-diaria-reloj` (P22, P26) wt3 → PR #45 (patch, D165). X2 `fix/modales-ancho-320` → PR #46 (patch, D162–D164). X1 `fix/contraste-foco-configuracion` → PR #47 (patch, D159–D161). Tanda b mergeada (#45–#47).

**Tanda 2026-09-26c** (`plans/orquestacion-2026-09-26c.md`): Y1 `fix/tema-y-reloj` (P28, P30–P32) wt1 · Y2 `fix/nombres-paises-largos` (P29) wt2 · Y3 `docs/copy-aprobado` wt3 → PR #48 (sin changeset). Y2 `fix/nombres-paises-largos` → PR #49 (patch, D169), SIN verificar en navegador (dev server no arrancó en el slot). Y1 `fix/tema-y-reloj` → PR #50 (patch, D166–D168). Tanda c: #48, #49 mergeados; #50 esperando merge. #51 `fix/tema-transiciones-y-almacenamiento` (P33–P35, fila #8, D170–D172) en wt2, sin verificar en navegador (dev server del dueño con 504 Outdated Optimize Dep). Acciones del dueño (SQL, VAPID, Google) aplicadas; copy de CONTENT_CHECKLIST aprobado 2026-09-26.

**Tanda 2026-09-26** (P10, P14–P21): brief `plans/orquestacion-2026-09-26.md`, prompts
`plans/orquestacion-2026-09-26-prompts.md`. Pool inicializado (wt1–wt4).

| Unidad | Rama | Slot | Estado |
|---|---|---|---|
| W1 | `feat/castigo-animado` (P10) | — | #35 mergeado |
| W2 | `feat/ranking-continentes` (P20, P14, P15) | — | #36 mergeado (SQL `leaderboard-continentes.sql` a aplicar por el dueño) |
| W3 | `fix/skip-link-contraste-aviso-vapid` (P16, P17.3) | — | #34 mergeado |
| W4 | `feat/mas-sonidos` (P18 ★) | — | #39 mergeado |
| W5 | `style/ranking-podio` (P21) | — | #38 mergeado |
| W6 | `style/animaciones-partida` (P19 ★) | — | #42 mergeado |
| W7 | `style/animaciones-resultados` (P19 ★) | — | #41 mergeado (sin verificar en navegador) |
| W8 | `style/animaciones-configuracion` (P19 ★) | — | #43 mergeado. Tanda cerrada |


**(Mergeado como #33) `chore/changesets`** (2026-09-26, D135–D136).
Alinea el proyecto con el web-agent-kit nuevo:

- **Versión con Changesets:** ningún PR toca `version`, `CHANGELOG.md` ni `APP_VERSION`.
  Cambio visible → `.changeset/<desc>.md` (cuerpo = trozo del CHANGELOG). La Action
  `release.yml` mantiene el PR `chore(release): versión` (`scripts/release.ts` escribe la
  entrada y `sw.js`); lo mergea el dueño. Sin orden de merge por versión.
- **Pool de worktrees** (`orchestrate`): slots `..\world-flags-wt\wtN`, puerto 4300+N; `wt
  init` en la primera tanda. Ya no hay puertos reservados por unidad ni `isolation: worktree`.
- Acciones manuales del dueño: GitHub › Settings › Actions › General › "Allow GitHub Actions
  to create and approve pull requests"; Settings › General › "Automatically delete head
  branches". Recomendado: excluir de Defender la carpeta del repo, `..\world-flags-wt` y
  `%USERPROFILE%\.bun\install\cache`.

**Abierto también: PR #23 (`fix/primer-logro-sin-aviso`, 1.2.1)** — https://github.com/Fockus26/World-Flags/pull/23.
El primer logro de un perfil nuevo se sellaba sin toast (el silencio de la primera pasada solo se
gastaba si esa pasada encontraba algo). Ahora lo decide `src/utils/achievement-announcements.ts`, con
prueba unitaria. Choca en `AchievementsEffects.tsx` con #20 (sonidos): el `playSound` va tras
`enqueueAchievementToasts(toAnnounce)`. Borde conocido sin tocar: un logro derivado de progreso que trae
una sync en segundo plano (ya en `ready`) se anuncia como en vivo.

**En curso: tutorial de la primera vez — PR #16 abierto (`feat/tutorial-inicial`, 1.2.0).**
https://github.com/Fockus26/World-Flags/pull/16 — esperando revisión y merge del dueño.
Worktree `.claude/worktrees/festive-robinson-02378f`, rama desde `main` @ `6d79159`
(con el PR #15 de Capitales ya mergeado — la dependencia del brief está resuelta).
Decisiones D071–D074 en D071–D074.

- **Forma:** seis pasos en un diálogo de HeroUI, con una partida de ejemplo real de
  **Norteamérica** (Canadá, Estados Unidos, México — el continente más pequeño del
  catálogo, D074), en Países y modo Práctica.
- **El requisito difícil, resuelto (D072):** la partida de ejemplo **no pasa por
  `useGame`**. `SessionRuntime` es prop obligatoria de `CountriesPractice`;
  `FlagGame` inyecta `useGame()` (lo cumple por estructura, sin adaptador) y el
  tutorial un sandbox en memoria (`utils/tutorial-sandbox.ts`, puro) que no tiene
  salida a `learning-storage`. Las aserciones son dos:
  `tests/unit/tutorial-sandbox.test.ts` cuenta las escrituras a `localStorage`
  (0 tras jugar la partida entera, y lo guardado byte a byte igual) y además
  **vigila los imports** de todo el árbol del tutorial + `CountriesPractice` contra
  una lista de funciones que escriben. Esa segunda es la que atrapa un `useGame()`
  que vuelva en el futuro.
- **Ajustes (D073):** se enseñan funcionando dentro del recorrido, no resaltando la
  UI real — `PageFlip` deja la vista anterior montada en su ranura oculta y
  transforma en 3D, así que medir posiciones o buscar por selector es frágil (bug
  pre-existente ya reportado; **no se tocó**). El modo es vista previa: el ejemplo
  siempre es Práctica, y se repite el aviso de `GameTab` de que el competitivo
  fuerza aleatorio + difícil.
- **Persistencia (D071):** marca "ya se ofreció" **por dispositivo**
  (`world-flags-tutorial-seen`, vía `learning-storage.ts`), no en
  `UserLearningData` — sin columna nueva ni SQL a mano, así que **esta unidad no
  trae acción manual en Supabase**. La puerta real es `hasLearningProgress` +
  `hydrationStatus === "ready"`.
- **Reapertura:** "Cómo se juega" en el pie de `ConfigurationModal`, junto a
  "Novedades" (se reutiliza el sitio de D059; la fila de iconos a 320 px no se
  toca). Ese modal **no se cierra** al abrir el recorrido, para que el foco vuelva
  a su botón al cerrarlo.
- **Verde:** `astro check` 0 errores, `biome check ./src` limpio, `bun run test`
  109/109, `bun run build` OK (con env de relleno: el worktree no tiene `.env`).
- **Verificado en el navegador** (el dueño autorizó levantar `bun run dev` al agente,
  2026-09-23): ver la sección de abajo. Se copió el `.env` de la carpeta principal al
  worktree (gitignored) para que el servidor arrancara.
- `CONTENT_CHECKLIST.md` #24 y #25: **todo el copy del tutorial es provisional**,
  pendiente de aprobación del guion.

### Verificado en el navegador (`feat/tutorial-inicial`, 2026-09-23)

Con `bun run dev` en el worktree (puerto 4321), navegador embebido. Los cuatro
puntos de riesgo que quedaban abiertos, comprobados:

1. **Los tres modales apilados** (config → tutorial → aviso de abandonar): bien.
   El clic fuera del tutorial no lo cierra (`isDismissable={false}`), `Escape`
   cierra solo el de arriba, y el modal de configuración sigue abierto debajo.
2. **Alto de la partida dentro del diálogo a 320×568**: cabe. Diálogo 316×537
   (y=16 a y=552), la sesión 358 px **sin desbordar por dentro**; el input y
   "Comprobar" visibles sin scroll (bottom 528 ≤ 568). Sin scroll horizontal en
   ningún paso (todos ≤ 316 px de ancho).
3. **Pie de `ConfigurationModal` a 320 px**: **fallaba** — los dos botones
   sumaban 285 px en 259 px de pie. Arreglado (`flex-wrap` también en la fila
   interna); ahora se apilan alineados a la derecha, sin desborde.
4. **axe-core 4.10.2: 0 violaciones** en los seis pasos, en la partida de
   ejemplo y en el aviso de abandonar, **en claro y en oscuro**.

Lo que además se comprobó:

- **Foco:** al cambiar de paso cae en el `<h2>` (que lleva "Paso N de M"
  dentro, así se anuncia de una vez); jugando, en el input de la respuesta. El
  focus-trap contiene (intentar enfocar el skip-link de fuera rebota). El fondo
  queda `inert`.
- **"Ese progreso no cuenta", medido:** con progreso real sembrado jugando una
  partida de verdad (3/197, racha de 1 día, 1 logro, candado diario y nota de
  Norteamérica), se jugó el ejemplo completo — incluida una recalificación con
  "Otra vez", que repitió una tarjeta — y `localStorage` quedó **byte a byte
  igual**. Lo único que cambió en toda la sesión fue
  `world-flags-tutorial-seen`. Racha, sesiones, logros, historial SRS, candado
  diario, notas y mejores tiempos: idénticos.
- **Las tres puertas:** invitado nuevo → sale (tarda ~9 s, lo que espera a que
  la hidratación pase a `ready`); tras verlo/saltarlo → no reaparece al
  recargar; **con progreso previo y sin la marca de visto → no sale**.
- **Reapertura** desde "Cómo se juega" con progreso: sale siempre, y al cerrar
  el foco vuelve a ese botón.
- **El juego real sigue bien** tras el refactor de `CountriesPractice`: partida
  de práctica de Norteamérica completa, progreso guardado, racha y logro.
- **El aviso de abandonar** usa el texto del tutorial ("no se guarda nada, así
  que no pierdes nada"), no el de siempre.

**Dos fallos encontrados y arreglados aquí** (commit `5e2d7eb`): el foco no
volvía al botón que abrió el recorrido (React Aria no captura el origen si el
diálogo se monta ya abierto; y `requestAnimationFrame` no corre con la pestaña
en segundo plano, así que el primer intento de arreglo tampoco restauraba), y el
pie de configuración a 320 px.

**Hallazgo para tener en cuenta en este repo (React Compiler):** una variable
mutable a nivel de módulo con una copia local se pliega de vuelta a la variable,
así que `const opener = x; x = null; if (!opener) return;` acaba siendo
`x = null; if (!x) return;` y no hace nada. Silencioso. Detalle en el commit.

**No verificado todavía:** cuenta real (registro/login) — el escenario
"invitado que hace el tutorial y luego crea cuenta" se razonó y está cubierto por
tests, pero no se probó con Supabase real. Y las capturas: el navegador embebido
de este equipo falla al hacer screenshot (se verificó todo leyendo el DOM y
midiendo con `getBoundingClientRect`).

**(Histórico, mergeado como PR #15) Modo Capitales.** Plan aprobado (`context/plans/modo-capitales.md`, respuestas en §7.1).

- **PR A mergeado: #13 `refactor/progreso-por-juego`** (Fase 1, D061), 2026-09-22.
- **PR #14 mergeado: `fix/sesion-calificacion-doble`** (1.0.1, `024619e`): Enter ×2 en el rush y 1-4 ×2 al calificar ya no cuentan dos veces (práctica, rush y práctica diaria). Probado en el navegador (rush y práctica; la diaria, solo en código). Esperando revisión/merge del dueño.
- **PR #15 abierto: `feat/modo-capitales`** (sobre `main` con #14 ya mergeado): Fases 2 (D062), 3 (D063-D065) y 4 (D066) en commit. Fase 5 en commit (`8a85134`, D067-D068). Fase 6 en commit (`1eef4b7`, D069). **Fase 7 hecha** (D070, 1.1.0, QA de diseño y funcional; ver D062 corregido y el PR). **Decisión del dueño (2026-09-23): mergear todo de una vez, asumiendo el riesgo de** un cliente viejo con `gameType: "capitals"` por la nube se queda en blanco (hallazgo A1 de QA funcional): `Session` generalizado con `SESSION_CARDS`, `CapitalCard` (solo el nombre del país), `AnswerForm.answerNote` (alias + nota dentro del aviso), fuera el marcador "en construcción", "capitales a la primera" en resultados y "cada respuesta" en la ayuda. Verificado en el navegador (detalle en D068). **Cuando se mergee #14 (squash):** `git rebase --onto main 024619e feat/modo-capitales` para soltar el commit del fix. No quedan fases (logros, 1.1.0, cierre y PR).

### Acción manual pendiente del dueño (bloqueará el despliegue de `feat/modo-capitales`)

**Hecho (2026-09-23, por el agente con permiso del dueño):** columna `capitals_game` aplicada en Supabase. (Antes: correr `supabase/capitals-game.sql` antes de desplegar.) Añade `capitals_game jsonb not null default '{}'`. Sin la columna, el `select` de `fetchRemoteLearningData` falla y toda cuenta autenticada se queda en `local` con "No se pudo sincronizar". No aplica al PR #13.

**(Fase 1, ya en el PR #13)**
Registro de juegos (D061–D070): sin cambio visible. 33.000 comparaciones con la versión anterior, 0 diferencias; 60 tests; `astro check`/biome/build verdes (build con env de relleno: el worktree no tiene `.env`). Sin navegador: no hay nada visible que comprobar. Siguiente: commit + PR A; tras su merge, `feat/modo-capitales` desde `main`.

**(Antes) Planificación: `feat/modo-capitales`**
(worktree `.claude/worktrees/cranky-cohen-e9f64d`, 2026-09-22; rama creada desde
`main` @ `c7c56dd`, sin commits). Tercer tipo de juego: se muestra el país y se
escribe la capital. PR #11 y #12 ya están en `main`.

- **Plan:** `context/plans/modo-capitales.md` (7 fases, D061-D070 propuestas, 10
  preguntas con la fase que bloquea cada una). **Anexo:** `plans/modo-capitales-capitales.md`
  (+ `.json`) con las **197** capitales verificadas en tres fuentes: UE, Libro de estilo
  interinstitucional, Anexo A5 (act. 16-09-2026, consultado con la RAE), Wikidata P36 y
  Wikipedia (en). La RAE da 403 (no se forzó); el CIA World Factbook ya no existe.
- **Hallazgos del plan:** Guinea Ecuatorial cambió de capital el 03-01-2026 (Malabo →
  Ciudad de la Paz); Burundi es Guitega desde 2019. Israel y Palestina: decisión del
  dueño (la UE deja la casilla de Israel vacía y no lista Palestina).
- **Propuesta de entrega:** dos PR (refactor invisible `refactor/progreso-por-juego`
  primero, luego la feature), o uno con 7 commits: lo elige el dueño.
- **Acción manual que traerá (bloqueará el despliegue):** `supabase/capitals-game.sql`
  (columna `capitals_game`). Todavía no existe: se escribe en la Fase 2.
- **Visto de paso, no tocado:** "Acertaste X de Y banderas a la primera" también sale en
  la práctica de Países (`Results.tsx:121`); los logros compartidos dicen "banderas"
  aunque cuentan todos los juegos; sospecha de que la píldora de `GameTypeToggle` en
  "Banderas" sale 0,5 rem desplazada (sin medir: el navegador integrado no ejecuta
  scripts en archivos locales).

**(Histórico, mergeado como PR #12): `feat/changelog`**
(worktree `.claude/worktrees/festive-robinson-02378f`, 2026-09-21). Versión,
changelog y "Novedades". Detalle en D057–D060
(D057–D060). PR #11 (`feat/modo-offline`) ya está en `main`.

- **Decisiones del dueño:** enfoque (`CHANGELOG.md` + modal + semver, a mano) y
  arranque en **1.0.0**.
- **D057:** `CHANGELOG.md` es la única fuente (`?raw` + `utils/changelog.ts`);
  versión = `import { version } from "package.json"`. `tests/unit/changelog.test.ts`
  exige formato y primera entrada = versión de `package.json` (55/55 tests).
- **D058:** aviso `ReleaseNotesSnackbar` tras actualizar (no modal automático);
  "visto" por dispositivo (`world-flags-seen-release`); primera carga sella sin
  avisar → el primer aviso real saldrá con la 1.1.0. El foco vuelve a donde estaba
  antes del aviso (`Button` gana `onFocus`).
- **D059:** entrada en el pie de `ConfigurationModal` (no cuarto icono); modal anidado.
- **D060:** cada PR con cambio visible sube versión + entrada; sin "Sin publicar".
  Supuesto: Vercel despliega cada merge a `main` (preguntado en el PR).
- Verificado sobre el build de producción (`bun run preview`, autorizado por el
  dueño) en el navegador embebido: casos de D058, foco con teclado, anidado,
  axe-core 4.10 claro/oscuro (0 nuevas), 320 px. Capturas intermitentes (entorno).
- **Visto de paso, no tocado:** `OptionTile` marcado en la pestaña Juego falla
  `color-contrast` en claro (axe), además del ya conocido de `GameTypeToggle`.
- `CONTENT_CHECKLIST.md` #20: copy de Novedades + redacción de la entrada 1.0.0.
- **A partir de ahora** cada PR con cambio visible añade su entrada y sube la
  versión (ver `CONTRIBUTING.md` › *Changelog and versioning*).

**(Histórico, mergeado como PR #11): `feat/modo-offline`**
(worktree `.claude/worktrees/vigorous-jackson-6075f4`, 2026-09-21/22). Modo
offline sin pérdidas. Detalle en D048–D056
(D048–D053). PR #8, #9 y #10 ya estaban en `main`.

- **Hallazgo pre-existente 2, resuelto (D048):** `countryHistory` se fusiona
  por la revisión más reciente de cada país, en los dos juegos y siempre
  (también en el login de invitado; alternativa en dos líneas en el PR).
  Sustituye a D046 (`applyReviewsSince` eliminada).
- **D049 base de sincronización** (clave propia en `localStorage`, por cuenta):
  perfil, configuración y notas por continente ganan en local solo si
  difieren de la base. Datos + base = la cola persistida; sobrevive a recargas.
- **Hallazgo pre-existente 1, abordado (D051):** cada subida es una
  sincronización (GET → merge → POST si aporta), agrupada (5 s sin cambios,
  tope 60 s, al ocultar la app / volver la red). Medido: 11 calificaciones +
  final = 2 sincronizaciones en vez de 12 upserts.
- D050 estado de red (`navigator.onLine` + fallo real, slice `sync`,
  `useSyncStatus`); `sw.js` ya no responde con HTML a los GET cross-origin
  (`CACHE_NAME` sigue en `v4`). D052 `ConnectivitySnackbar` + degradación de
  ranking/login/avatares. D053 aviso al cerrar sesión con cambios pendientes.
- `bun run test` nuevo (24 aserciones, `tests/unit/`), añadido a CI.
- Verificado en el navegador embebido con el build de producción + mock local
  de Supabase (scratchpad, fuera del repo). **No verificado:** la página
  servida por el SW sin red — el navegador embebido no registró ningún SW en
  esta sesión; `sw.js` probado en un arnés aislado.
- **D054 precarga de las 197 banderas** (elegida por el dueño): la app manda
  la lista al SW 5 s tras cargar y con `online`; el SW baja solo las que
  faltan; nunca con ahorro de datos ni en 2G. Tests: 30/30.
- **Visto de paso, no tocado:** `GameTypeToggle`, opción marcada en **oscuro**
  a 2,44:1 (en claro 4,34:1, ya reportado); el botón de cerrar de
  `AchievementToasts` solo marca el foco con color (en `ConnectivitySnackbar`
  se añadió contorno).
- `CONTENT_CHECKLIST.md` #17–#19: copy de avisos de conexión, degradación y
  cierre de sesión.
- **D055 fecha por campo** (pedida por el dueño): perfil, configuración y notas
  por continente guardan la fecha de su último cambio; gana la más reciente.
- **D056 invitado** (decisión del dueño): su progreso pasa a la cuenta solo si
  ésta no tiene progreso; si lo tiene, se descarta entero (`planSync`). Se
  retiró la base provisional. Tests: 39/39.

### Acción manual pendiente del dueño (bloquea el despliegue de este PR)

**Correr `supabase/field-updated-at.sql`** en el SQL Editor de Supabase
**antes** de desplegar. Añade `field_updated_at jsonb not null default '{}'`.
Sin la columna, el `select` de `fetchRemoteLearningData` falla y las cuentas se
quedan en `local` con "No se pudo sincronizar".

**(Histórico) En revisión (PR #8 abierto, pendiente de merge del dueño): `feat/skeleton-carga`**
(worktree `.claude/worktrees/modest-pike-c40bb5`, 2026-09-21). Skeleton de
carga en la pantalla de inicio. Detalle en D042–D043
(D042/D043).

- `useHydration()` → `isInitialLoad` (de `game.hasHydratedOnce`, pegajoso):
  skeleton **solo en la carga inicial**; login / sync posterior reemplazan en
  el sitio. El fallback de 2,5 s marca `hydrationStatus = "local"` (nuevo) para
  no dejar el skeleton colgado; push/logros/recordatorio siguen solo en `ready`.
- `ui/Skeleton` (wrapper HeroUI, umbral 300 ms, texto de referencia invisible)
  y `ui/LoadingAnnouncer`. Tarjeta `inert` + `aria-busy`. `--surface-tertiary`
  → borde de tarjeta (D043).
- **Decisión abierta para el dueño (en el PR):** en carga se reserva el layout
  de práctica + "Práctica diaria". Usuario práctica con pendientes: 0 px de
  salto (19/19 y 18/18 rectángulos iguales a 1280×800 / 360×640). Usuario
  competitivo o sin pendientes: la tarjeta se acorta una vez (725,7 → 622,8 px
  a 1280×800). Alternativa en dos líneas si lo prefiere al revés.
- Verificado en navegador (dev server autorizado por el dueño, puerto 4323) con
  un mock local de Supabase (scratchpad de la sesión, fuera del repo) y un SW
  vacío temporal: en el navegador embebido el `sw.js` del sitio no deja pasar
  `fetch` a loopback cross-origin y devuelve la página offline. axe-core 4.10
  sin violaciones nuevas en carga/cargado, claro/oscuro; 320 px sin scroll.
  La API `layout-shift` no registra saltos en este entorno: no sirve como prueba.
- **Hallazgos previos reportados en el PR, no tocados:** (1) `GameTypeToggle`
  en claro, opción marcada a 4,34:1 (falla AA); (2) skip-link fuera de landmark
  (`region`, best-practice); (3) primera visita: el SW hace `clients.claim()` y
  `useServiceWorkerUpdate` recarga la página; (4) si `syncOnLogin` falla,
  `GameEffects` marca `ready` y hace upsert de `localStorage` a la nube (puede
  pisar el progreso de la cuenta); (5) `syncOnLogin` sin timeout.
- `CONTENT_CHECKLIST.md` #16: copy del anuncio para lectores de pantalla.

**Mergeados a `main` el 2026-09-21** (las entradas de abajo quedan como
historia): PR #4 `fix/responsive-racha`, PR #5 `fix/puntuacion-todo-el-mundo`,
PR #6 `fix/codigos-fuera-de-catalogo` y PR #7 `feat/taiwan-197` (catálogo a 197,
D040/D041) — la decisión del catálogo ya está tomada.

**(Histórico) Decisión pendiente del dueño: catálogo de países (¿seguir en 196, subir a 197 o bajar a 195?).**
Auditoría cerrada el 2026-09-21, **sin cambios de código** (worktree
`.claude/worktrees/unruffled-lamport-f20993`, sin rama de producto ni PR).
Informe completo: `context/plans/auditoria-paises.md`.

- **Criterio actual verificado** contra la lista oficial de la ONU: 193 miembros +
  Vaticano + Palestina + Kosovo; no falta ningún miembro. Continentes = esquema M49
  de la ONU salvo México (M49 lo pone en Centroamérica). Nombres sin erratas.
- **Recomendación: opción A (añadir Taiwán → 197) en dos PR:**
  1) `fix/codigos-fuera-de-catalogo`, defensivo e invisible (filtrar códigos fuera
  del catálogo en conteos, práctica diaria y alcance; salida digna en
  `Session`/`DailyPractice` en vez de `return null`; `196` → `countries.length`;
  subir `CACHE_NAME`); 2) contenido (`tw`, assert, SEO, registrar D040).
- **Ranking:** decidir con la consulta SQL de §7 del informe (versionar la clave
  `world@197` o aceptar y avisar). Borrar filas no sirve: `GameEffects` las vuelve
  a subir en cada carga.
- **Bug latente reportado, no arreglado:** pantalla en blanco sin salida si la cola
  contiene un código fuera del catálogo (`DailyPractice.tsx:101`, `Session.tsx:213`).
  Inalcanzable hoy; es precondición de cualquier cambio de catálogo. Hay tarea
  sugerida aparte (chip en la sesión de la auditoría).
- **Visto de paso:** `CLAUDE.md` dice que biome no bloquea en CI, pero ya bloquea
  desde `d90d2a4`.

**En revisión (PR abierto, pendiente de merge del dueño): `fix/puntuacion-todo-el-mundo`**
(worktree `.claude/worktrees/eloquent-lederberg-4b6b54`, PR #5). La tarjeta
"Todo el mundo" del selector de continentes no mostraba puntuación en modo
práctica (los demás continentes sí) porque no existe nota de mundo
persistida: `useGame` reparte cada sesión de mundo entre las notas de sus
continentes (`regionBreakdown`).

- **Fix (D039):** nota **derivada**, no persistida — `calculateWorldAverage`
  (nuevo, en `learning-storage.ts`) pondera la nota de cada continente por su
  número de países, y solo devuelve valor con los 8 continentes practicados
  (evita una media parcial engañosa). Se descartó persistir una nota de mundo
  real porque duplicaría el dato y rompería el invariante de `perfectSessions`
  (D017/D019: cuenta los `10` guardados en `regionGameScores`; una entrada
  `world` lo inflaría tanto en vivo como en la siembra retroactiva de
  `seedStats`).
- `RegionOption` gana `scoreTooltipLabel` opcional: el tooltip de continente
  ("Promedio de tus últimas 3 partidas") no aplica a una nota derivada de
  continentes, no de partidas propias.
- Verificado con `astro check`/`biome check`/`build` verdes y aserciones
  puras sobre `calculateWorldAverage` (script temporal, no committeado). Sin
  navegador (no se pidió el dev server para este fix acotado) — revisión a11y
  manual: reutiliza el patrón ya verificado de `RegionOption` (D013/D038), sin
  widgets nuevos.
- Detalle completo en D039.

**En revisión (PR abierto, pendiente de merge del dueño): `fix/responsive-racha`**
(worktree `.claude/worktrees/strange-easley-3bcf2f`). Menú principal: con el
panel de racha abierto no se llegaba al final de la tarjeta en pantallas bajas.

- **Causa real:** el "único scroll" del grid de continentes (`flex-1 min-h-0`
  en el fieldset + `overflow-y-auto` en el grid) **nunca funcionó en
  Chromium**: el contenido de un `<fieldset>` vive en una caja anónima que no
  hereda el alto flexible del fieldset. El fieldset se encogía y el grid seguía
  a 380px, desbordándose por debajo de los botones. Pasaba **incluso con la
  racha cerrada** (a 360×640, ~110px del grid tapados; en horizontal 740×360 la
  tarjeta ya no cabía). Probado en vivo: solo `flex-basis: 0px` hace que el
  fieldset acote su contenido, pero entonces la tarjeta se encoge al mínimo en
  pantallas altas — descartado.
- **Fix:** la sección de `Configuration` es el único contenedor con scroll
  (`overflow-x-hidden overflow-y-auto`); form/fieldset/grid a alto natural. Si
  cabe, no aparece barra (1280×1000 racha cerrada: tarjeta = contenido).
  Contrapartida: los CTA ya no van "fijos" abajo en pantallas bajas (tampoco lo
  estaban de verdad: el grid se metía debajo).
- `StreakPanel` con `max-w-sm` (opción elegida por el dueño): el calendario
  escalaba con la tarjeta (celdas de ~91px a 740px, panel de ~510px); ahora
  384px máx., alineado a la izquierda (~329px de alto en horizontal).
- `RegionOption`: el checkbox oculto cubre la tarjeta (`inset-0 size-full
  scroll-m-2`) en vez de 1px en el centro — con Shift+Tab en la sección con
  scroll, la tarjeta y su anillo de foco quedaban medio cortados (51px).
- Verificado en navegador (dev server autorizado por el dueño): 320×568,
  360×640, 375×667, 414×896, 740×360, 1280×1000, racha abierta y cerrada —
  último continente y ambos botones alcanzables, sin solapes, sin scroll
  horizontal. axe-core 4.10 = 0 violaciones claro/oscuro (740×360 y 320×568).
  `astro check` 0 errores, `bun run build` verde, biome sin errores de lint (los
  avisos de formato locales son CRLF del checkout Windows; en LF pasan).
- **Pendiente/visto de paso, no tocado:** `GameTypeToggle`, `OptionTile` y
  `CountryPickerModal` usan el mismo input oculto `size-px`; en un contenedor
  con scroll podrían tener el mismo recorte de foco (el toggle vive en la misma
  sección, pero es una sola fila y casi nunca queda a medias).

**Cerrado y mergeado a `main` (sin push): `fix/pulido-modo-paises`** (base `main`, trabajada en el
worktree `.claude/worktrees/fix-pulido-modo-paises` porque otra sesión usaba
la carpeta principal en `feat/racha-tab-usuario`). Ronda de pulido de feedback
del dueño:

- **Bug de práctica diaria ("Fácil" no avanza):** el intervalo SRS crecía sin
  tope. Tras ~11 "Fácil" la fecha pasaba del año 9999 (`"+016849-03"`, que
  como string es menor que hoy → el país salía como vencido) y hacia el 13.º
  `toISOString` lanzaba `RangeError` dentro del timeout de `GradeButtons`.
  Fix: tope de 36.500 días en `calculateNextReview` + `isDue` trata esas fechas
  de año extendido como no vencidas (sana datos ya guardados).
- Tablero: padding para que el `ring-2` del objetivo no se recorte y aire al
  final del scroll; el hueco se pinta de verde al aterrizar el vuelo (práctica
  y rush), con transición de color; letras de pista con fade-in.
- Tarjeta cloze (práctica y práctica diaria): el contador del continente
  acumula los países ya completados (y éstos se ven en verde) en vez de saltar
  0/12 → 1/12 → 0/12.
- Botón "Pista" con margen inferior. Tooltips acotados al viewport.
  Mobile: la cabecera muestra solo el nombre (máx. 15 caracteres + "…"), sin
  el correo.
- **Abierto:** el modal "a 100% de ancho" en mobile no se reprodujo (a 360 y
  375px deja ~14-15px por lado) — pendiente de captura/dispositivo del dueño.

**Cerrado (pendiente de decisión del dueño sobre merge): modo de juego "Países"
(rama experimental `feat/modo-paises`).** Implementa `context/plans/modo-paises.md`
completo — un segundo tipo de juego (aprender qué país pertenece a cada
continente, con tablero de países y animación de "vuelo") que reutiliza el flujo
existente (alcance, práctica/competitivo, práctica diaria, SRS, logros, ranking).
Las 7 fases del plan están hechas, cada una con su commit y su pausa de
aprobación. Detalle de cada decisión en D028–D038
(D028–D038).

**De paso se cerró una unidad aparte, ya mergeada a `main`:**
`perf/batch-country-attempts` — `registerCountryAttempts`/`saveReviewResults`
en `learning-storage.ts` registran varios países con un solo guardado en
`localStorage` en vez de uno por país (hacía falta para "Rendirme" en un rush
de "Todo el mundo", hasta ~150 de golpe). 100% aditivo, sin cambiar el
comportamiento existente. Benchmark: ~27ms/150 guardados → ~4ms/1 guardado.

Verificado en el navegador real (`bun run dev`, con permiso explícito del
dueño), no solo revisión de código: rush completo (auto-aceptación, prefijos
ambiguos, "Rendirme", ranking), práctica con tarjeta cloze y pistas, práctica
diaria de países de punta a punta (vencidos inyectados a mano), candado
"practicado hoy" independiente entre los dos juegos, 320px sin scroll
horizontal, claro/oscuro, y una pasada de axe-core sobre selector/tablero/
modales/ranking/logros (encontró y se corrigió un hallazgo real: el tablero
no era alcanzable por teclado — ver D038). `bunx astro check`/`bun run build`/
`bunx biome check ./src` en verde en cada fase.

**`bun run test:e2e` corrido contra el server real:** expuso que D030 (usuario
nuevo arranca en Países) rompía el helper de hidratación de las 14 pruebas
existentes (asumían "Aprende las banderas del mundo" desde el arranque) — se
ajustó el helper, no el comportamiento del producto. De paso salió a la luz un
bug **preexistente**, no de esta unidad (ya en `main` desde `feat/transiciones-ui`):
`PageFlip.tsx` monta el mismo contenido en sus dos ranuras desde el arranque,
duplicando nodos de texto en el DOM — se reportó y se dejó una tarea aparte
para decidir si se arregla, sin tocar `PageFlip.tsx` acá. Con eso, T7/T2/T4
pasan de forma aislada; T1 y probablemente otras que completan una sesión
entera se cuelgan de forma intermitente con "element was detached from the
DOM" — coincide con la inestabilidad de Playwright/Chromium en este Windows ya
documentada arriba, no con un cambio de esta unidad.

Subagentes `design-qa`/`functional-qa` no se lanzaron: la verificación manual +
axe-core en el navegador real de esta unidad ya cubre lo que esos subagentes
habrían visto (y en este equipo Playwright es intermitente, ver nota de
entorno). Si el dueño quiere igual una pasada con esos subagentes antes de
decidir el merge, que lo pida.

### Acción manual pendiente del dueño (bloquea el despliegue)

**Correr `supabase/countries-game.sql`** en el SQL Editor de Supabase **antes**
de desplegar el cliente de esta rama. Mismo riesgo que ya describe
`achievements.sql`: si el cliente pide la columna `countries_game` y todavía no
existe, el `select` de `fetchRemoteLearningData` falla, `syncOnLogin` lanza, y el
usuario autenticado cae al fallback de `localStorage` en vez de ver su progreso
de la nube. No aplica mientras la rama no se despliegue.

### Fuera de alcance de esta unidad (ver `context/plans/modo-paises.md` › 5)

Alias de nombres de país (EE. UU., Congo, Birmania…), mapa/silueta como
tarjeta alternativa de práctica, aviso cruzado "aprende primero los países" en
Banderas, rankings por continente (el esquema ya lo soporta), extraer
`useCardCountdown` para que `Session.tsx` también lo use, logros de Países por
continente. La duplicación de nodos de `PageFlip.tsx` (ver arriba) también
queda fuera — tarea aparte ya señalada.

Anterior: **Tanda de 6 fixes de feedback post-logros** (timer, continentes, práctica diaria,
logros, banderas) — **aprobada, mergeada a `main` y ya con push a `origin/main`**
(commit `524e9c8`). Detalle de cada unidad en `GIT_STATE.md` › Bloques cerrados.
Todas las ramas de trabajo de esta tanda ya se borraron (mergeadas).

Verificado en vivo con `bun run dev` (autorizado puntualmente por el dueño):
- Timer de práctica cronometrada: cuenta normal desde la primera bandera y
  cada expiración avanza una sola vez (antes se congelaba o saltaba dos) —
  confirmado con logs de timestamp en consola, ~15 ciclos sin fallos.
- `RegionOption`: 0px de diferencia de altura al seleccionar (antes 2px).
- Práctica diaria: `lastPracticeByCountry` queda vacío tras calificar ahí,
  el continente no se marca "practicado hoy" por eso.
- Al terminar una sesión de práctica que completa un continente, éste se
  deselecciona solo en la config (probado con Norteamérica, 3 países).
- Logros: badge "Nuevo" + anillo se ven en el modal; `seenAt` se marca recién
  al cerrar el modal, no al abrir.
- `FlagDisplay` sirve `/flags/{code}.svg` (origen propio), no `flagcdn.com`.
- `bun run test:e2e`: 13/14 verdes. El que falla (T14, tema oscuro) es un
  timeout esperando el tab "Juego" del modal de perfil — no lo tocó ninguna
  unidad de esta tanda; probable relación con la animación de alto del modal
  ya registrada como pendiente más abajo. Revisado a mano: el toggle de tema
  funciona bien clickeado con normalidad: el fallo del test parece un
  problema de selector/timing del propio test, no del producto.

Anterior: **Sistema de logros** (con una ronda de ajustes de feedback: verde para
desbloqueado, snackbars en vez de `Results`, scrollbar temática, select de
avatar) — aprobado, commiteado y mergeado a `main` (commit `da042ab`, merge
`414d137`, `--no-ff`). Rama `feat/achievements` no borrada.

Anterior a eso: **Migración a HeroUI v3 + fix de persistencia + pasada de
diseño/a11y**, cerrada y mergeada a `main` (merge `a4c2e65`, `--no-ff`).

### Acción manual pendiente del dueño (bloquea el despliegue)

**Correr `supabase/achievements.sql`** en el SQL Editor de Supabase **antes** de
desplegar el cliente. Si el cliente pide las columnas nuevas y no existen, el
`select` de `fetchRemoteLearningData` falla, `syncOnLogin` lanza y el usuario
autenticado cae al fallback de `localStorage` en vez de ver su progreso de la
nube. Es una regresión, no una degradación elegante.

## Track

No aplica el track de fases del kit — el proyecto ya estaba en producción. Ver
`PROJECT_CONTEXT.md` › Track de fases.

## Lo que quedó verificado

- `bunx astro check` limpio, `bun run build` verde.
- axe-core (WCAG 2.1 A/AA) sin violaciones en config, modal de config (ambas tabs),
  listbox del Select, sesión, estado de calificación y diálogo de abandono — claro y oscuro.
- Fix de persistencia probado a mano: invitado practica un continente → hard reload
  → sigue "Practicado hoy" y bloqueado. Columnas Supabase aplicadas
  (`supabase/practice-sync.sql`).

## Lo verificado en la unidad de logros

- `bunx astro check` 0 errores · `bun run build` verde · biome sin hallazgos de
  lint en los archivos tocados.
- 47 aserciones sobre la capa pura (migración, siembra retroactiva, rachas,
  punto fijo del catálogo, merge) en verde, incluida la **idempotencia del
  merge** (`merge(merge(r,l),l) === merge(r,l)`), que es lo que garantiza que los
  contadores no se inflen en cada recarga.
- Contraste calculado a mano sobre los tokens reales, claro y oscuro — incluida
  la segunda ronda (verde, `field-background` del select de avatar).

## Lo que NO se pudo verificar

- **Barrido responsive / zoom / daltonismo / forced-colors completo:** los subagentes
  `design-qa` y `functional-qa` no pudieron correr Playwright en este Windows
  (Chromium cuelga). Sus reportes son revisión de código. Queda `e2e/game-flows.spec.ts`
  (14 tests) con selectores que necesitan alinearse con la UI migrada antes de pasar todos.
- Flujo autenticado end-to-end (registro/login real, sync entre dispositivos, IDOR):
  necesita una cuenta de prueba en Supabase.
- **Toda la UI de logros en navegador**: ningún agente levanta `bun run dev` aquí.
  Falta comprobar con el sitio corriendo: axe-core sobre el modal (claro y
  oscuro), y sobre todo **la fila de iconos a 320 px** — ahora son tres botones
  (🏅 🏆 📍) junto a `UserSummary`; el margen es de pocos píxeles y el contador de
  progreso de `UserSummary` lleva `whitespace-nowrap` + `shrink-0`, que es justo
  lo que provocaría scroll horizontal si no cabe.
- **Los snackbars en 320 px y con varios apilados a la vez.** `AchievementToasts`
  usa `inset-x-3` (ancho completo con márgenes) en móvil y una columna fija a la
  derecha desde `sm:`; falta comprobar en pantalla real que 3-4 apilados no
  tapen controles importantes (el botón "Salir" de `Header` en sesión, por
  ejemplo) y que el auto-descarte a 6 s da tiempo a leerlos.
- **El scrollbar temática en Windows/Chrome real** — las reglas
  `::-webkit-scrollbar-*` no tienen equivalente exacto en todos los navegadores
  (Chromium sí, Firefox usa `scrollbar-color` con un resultado visualmente
  distinto — más plano, sin el "padding" del `border` transparente).

## Pendientes generales

- Ver `CONTENT_CHECKLIST.md` (SITE_URL, imagen OG, iconos PWA, fuente, peso CSS, `animations.ts`).
- ~~Consolidar la escala tipográfica en tokens~~ → #58 (D178).
- Animación del alto del modal al cambiar de tab/modo — **no hecha** (CSS
  `interpolate-size` no anima el cambio por contenido en este motor; framer `layout`
  no es fiable). Alternativa: medir con `ResizeObserver` como el `Modal` viejo.
- Transiciones de animación (unidad en curso en `feat/transiciones-ui`, pendiente de
  revisión del dueño): tabs del modal de configuración (fundido simple, sin slide —
  el slide direccional causaba una superposición visual entre paneles y se quitó),
  giro 3D de página entre Configuración/Sesión/Práctica diaria/Resultados
  (`PageFlip.tsx`, D008), y `AutoHeight.tsx` (D009) para animar el alto cuando
  aparece/desaparece contenido dentro de una vista ya montada (repetir contraseña en
  registro, ajustes de práctica al cambiar de modo, fila de duración del temporizador).
  El alto del *modal completo* al cambiar de tab (Usuario/Juego) sigue sin animarse —
  ver la fila de abajo, no es parte de esta unidad.
- ~~framer-motion: recuperar o quitar~~ → quitado en #57 (D177).

## Hallazgos pre-existentes de QA (no de esta unidad — el dueño decide por separado)

En `PHASE_LOG/heroui-migracion.md` › "Hallazgos pre-existentes". Los principales:
doble-submit en modo competitivo, spam de teclas 1–4 en calificación, `isDue` en
UTC vs. candado en hora local, `createClient` sin guard si faltan envs.

Encontrados durante la unidad de logros (se reportan, no se arreglan aquí):

1. *(→ #53, D173)* **`pushLearningData` sube la fila entera en cada cambio debounced.** Una
   práctica de Europa son ~60 calificaciones espaciadas 2–4 s, así que el
   debounce de 800 ms no las agrupa: ~60 upserts de la fila completa. A ~33 KB
   son ~2 MB por sesión, y con los campos de logros (~51 KB) unos 3 MB. En datos
   móviles es real. Arreglo posible: `update` parcial de columnas en vez de
   `upsert` completo, o subir los campos pesados solo al terminar la sesión.
   *(Los campos nuevos no empeoran la frecuencia: `stats` y `sessionHistory`
   cambian una vez por sesión, no por calificación. Lo que crece es el tamaño de
   cada push.)*
2. *(ya resuelto en `c6a66b1`, D048)* **`pickMoreRecentReview` (`src/utils/spaced-repetition.ts:77`) existe y no lo
   usa nadie.** En `syncOnLogin` lo remoto gana `countryHistory` entero, así que
   una sesión practicada sin conexión se pierde al volver a entrar. El helper
   para arreglarlo ya está escrito; no se aplicó aquí por no meter un cambio de
   comportamiento del SRS dentro de la unidad de logros.
3. *(→ #51, D172)* **Badge contador con contraste insuficiente** (3.97:1 en claro), tanto el
   nuevo de 🏅 como el pre-existente de 📍 — fila #8 de `CONTENT_CHECKLIST.md`.
4. *(→ #54, D174)* **`--field-border` (`#9c96c4`) da 2.77:1 contra blanco puro**, por debajo del
   `≥3:1` que su propio comentario en `heroui-theme.css` reclama — es decir, ya
   fallaba antes de esta unidad. Se notó al ajustar `--field-background`
   (D027) pero no se tocó: no era lo pedido, y mezclar un fix de borde con un
   cambio de fondo en el mismo commit lo hace más difícil de revisar.

## Bloqueos

- ~~Despliegue / dominio~~ → https://world-flags-hazel.vercel.app (#52).
- Cuenta de prueba Supabase → bloquea QA de auth.
