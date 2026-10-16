# Prompts por unidad: tanda 2026-09-24

Cada worker: lee primero el brief común `context/plans/orquestacion-2026-09-24.md` y, en
`context/plans/pendientes.md` (carpeta principal), **la sección literal de tus pendientes**:
es lo que pidió el dueño. Aquí va lo que se añade: dónde está el código, qué condiciona y el
enfoque ya decidido.

---

## W1 — `feat/actualizacion-obligatoria` (P1) · puerto 4341 · D107–D111 · filas 34–35 · MINOR

**Pedido:** pendientes.md › P1 (entero, incluido el aviso 3).

**Código:**
- `public/sw.js:1-9`: `CACHE_NAME = "banderas-cache-v4"` (no cambia, D054) y el comentario
  manual "1.2.0 …" que hoy es lo único que cambia sus bytes.
- `src/hooks/useServiceWorkerUpdate.ts` (`applyUpdate`, SW en espera) y
  `src/components/app/UpdateAvailableSnackbar.tsx`: el aviso "Actualizar" actual.
- `APP_VERSION` sale de `src/data/changelog` (lo usan `ReleaseNotesModal`, `ConfigurationModal`).
- Decisiones: `decisions/13-sw-recarga-primera-visita.md`, `14-modo-offline.md`,
  `15-changelog-y-versionado.md`.

**Enfoque decidido:**
1. Versión en `sw.js` en cada build sin intervención manual. Opciones: generar `sw.js` desde
   una plantilla en el build (integración de Astro/plugin de Vite que reemplace un
   `__APP_VERSION__`), o mantener `sw.js` en `public/` con una constante
   `const APP_VERSION = "x.y.z";` y un **test en `tests/unit`** que falle si no coincide con
   `package.json` (más simple; `bun run test` ya vigila el CHANGELOG igual). Elige la que
   no rompa `bun run dev` ni el registro del SW; la del test es la preferida si la otra
   complica el dev. `CACHE_NAME` no cambia.
2. **Versión mínima en Supabase:** tabla `public.app_config` (clave/valor o una fila con
   `min_version text`), RLS con `select` público para `anon` y `authenticated`, sin
   políticas de escritura (se cambia desde el dashboard). Valor inicial **`2.0.0`**. Escribe
   el SQL en `supabase/app-config.sql` (no lo apliques; ver brief). Lectura en un archivo
   nuevo `src/utils/app-config.ts` (no en `cloud-storage.ts`).
3. El cliente consulta al cargar y al volver a primer plano (`visibilitychange`). Si
   `APP_VERSION < min_version` (comparación semver propia, con tests) → pantalla que bloquea
   el juego con **un** botón "Actualizar": activa el SW en espera (reutiliza
   `useServiceWorkerUpdate`) y recarga; si no hay SW en espera, fuerza
   `registration.update()` y recarga. Sin red, error, tabla inexistente (SQL aún no
   aplicado) o valor inválido → **no bloquear**. Diálogo accesible (HeroUI `Modal` vía
   `src/components/ui/`, no descartable, foco en el botón, `role`/título correctos).
4. Copy provisional (fila 34), entrada CHANGELOG (fila 35).

**Verificar:** test de semver y de versión de `sw.js`; en el navegador, forzar la mínima
interceptando la respuesta (`fetch` de Supabase) y comprobar bloqueo + botón; sin
interceptar (tabla no existe) no bloquea; offline no bloquea.

---

## W2 — `fix/ranking-validacion-servidor` (P5) · puerto 4342 · D112–D114 · fila 36

**Pedido:** pendientes.md › P5 y el aviso 3 de P1. El dueño eligió: **trigger con mínimos
verosímiles por scope**.

**Código:**
- Esquema: `supabase/leaderboard.sql`, `supabase/leaderboard-avatares.sql`,
  `supabase/leaderboard-limpieza-regla-2.sql` (carpeta principal, locales). RLS actual:
  `with check (auth.uid() = user_id)`.
- Escritura del cliente: `src/utils/cloud-storage.ts:498` (`upsert` en `leaderboard_entries`),
  lecturas en `:385`, `:431`, `:459`. Scopes: `src/types/country.ts:117-160`
  (`flags:world@2`, `capitals:world@2`, continentes; D076).
- Decisiones: `decisions/18-ranking-nueva-regla.md`, `12-sync-fallida.md`.

**Enfoque decidido:**
1. `supabase/leaderboard-validacion.sql`: función + trigger `before insert or update` en
   `leaderboard_entries` que rechace (`raise exception` con un código/mensaje reconocible)
   un `best_time_ms` por debajo del mínimo del scope. Mínimo = nº de países del scope ×
   un tiempo mínimo por respuesta que un humano rápido no baje (justifícalo; sé
   **generoso** para no rechazar a jugadores reales: mejor dejar pasar un tramposo que
   bloquear a alguien honesto). El nº de países por scope sale del catálogo del repo: o
   una tabla auxiliar pequeña que el SQL rellena, o un `case` en la función; incluye un
   script/test que genere o compruebe esos números desde el catálogo para que no se
   desalineen. Scope desconocido → rechazar o dejar pasar: decide y explícalo.
   También rechaza `best_time_ms <= 0` o nulo. Incluye el SQL de rollback.
   **No lo apliques.** Compruébalo en seco leyendo el esquema con el MCP de Supabase
   (solo lectura: `list_tables`, `execute_sql` con `select`) y lista las filas actuales
   que el trigger habría rechazado (ninguna fila se borra).
2. Cliente: revisa qué pasa en `cloud-storage.ts` si el upsert falla por el trigger. Debe
   tratarse como rechazo definitivo (no reintentar en bucle, no marcar la sync entera como
   fallida, no romper el progreso local). Si hace falta código → PR PATCH con test. Si no
   hace falta nada → sin PR; lo explicas en el informe.

---

## W3 — `feat/ranking-skeleton-demo` (P7, P8) · puerto 4343 · D115–D117 · fila 37 · PATCH

**Pedido:** pendientes.md › P7 y P8. El dueño eligió: P8 = **mock solo en cliente en dev**;
P7 = **animar la altura** (anulada con `prefers-reduced-motion`).

**Código:**
- `src/components/game/configuration/LeaderboardModal.tsx` (top 20, fila propia, 5 filas
  skeleton, `aria-busy`, `LoadingAnnouncer`; D077).
- `src/components/ui/Skeleton.tsx:41-78`: `SKELETON_DELAY_MS` (300 ms, D042).
  Añade una prop opcional (p. ej. `immediate`) que quite el retardo **solo** para quien la
  pase; los demás consumidores no cambian.
- `configuration/UserAvatar.tsx` (avatar con respaldo; D078), avatares `avatar_style`/`avatar_seed`.
- Decisiones: `11-skeleton-carga.md`, `18-ranking-nueva-regla.md`.

**Enfoque decidido:**
1. Skeleton visible desde el primer frame en el ranking.
2. Altura del contenedor animada al pasar de skeleton a datos (medir y transicionar
   `height`, o `grid-template-rows`; nada de framer, `03-animaciones.md`). Con movimiento
   reducido, sin transición. Sin saltos del foco ni del lector de pantalla.
3. Mock: archivo nuevo (p. ej. `configuration/leaderboard-demo.ts`) que genera 30 entradas
   con nombres, tiempos y avatares variados y verosímiles, con semilla fija. Activo solo si
   `import.meta.env.DEV` **y** `?demo-ranking` en la URL; en build de producción debe
   quedar eliminado (comprueba que no aparece en `dist/`). No toques `cloud-storage.ts`
   (es de W2): engancha el mock en el modal o en el hook que lo alimenta. Incluye también
   un retardo simulado opcional (p. ej. `?demo-ranking=lento`) para ver el skeleton.
4. Nada en la base de datos.

**Verificar:** con `?demo-ranking` (30 filas + fila propia fuera del top), con 1 fila
(intercepta), con red lenta (skeleton inmediato y altura animada), y movimiento reducido.

---

## W4 — `fix/racha-calendario-ancho` (P2) · puerto 4344 · D118–D119 · fila 38 · PATCH

**Pedido:** pendientes.md › P2 (sustituye la parte de D100).

**Código:** `src/components/game/configuration/StreakPanel.tsx:90-118` (`sm:flex-row …` en
`:97`, calendario `max-w-sm sm:max-w-xs` en `:118`). Decisión previa: `decisions/22-menu-movil.md`
(D100). Nueva decisión en tu archivo que diga que sustituye a D100 (y marca D100 en el índice
como "Sustituida por D118").

**Enfoque:** en todos los anchos, racha y mejor racha en una fila arriba y calendario a todo
el ancho de la tarjeta debajo. Celdas con `aspect-ratio` y un alto máximo (token o
`max-h` razonable) para que en escritorio ancho no crezcan sin control; si el tope deja
hueco, centra la rejilla. Comprueba a 320 px, 740×360 (último continente y botones
alcanzables; compara la altura del panel con los 247 px de D100) y 1440 px.

---

## W5 — `feat/tutorial-modo-de-juego` (P9) · puerto 4345 · D120–D124 · filas 39–40 · MINOR

**Pedido:** pendientes.md › P9 (los dos puntos).

**Código:**
- `src/components/game/tutorial/Tutorial.tsx` (botón "Saltar tutorial" `:220`, comentario
  `:53`, `:169`, `:263`), `tutorial-script.tsx` (`skip` `:155`, aviso "Partida de ejemplo…"
  `:167`), `TutorialSettings.tsx:143-180` (props `mode`/`onChange`, `AutoHeight`).
- Sandbox: `session/session-runtime.ts` (`SessionRuntime`), `CountriesPractice.tsx` (prop
  obligatoria), `tests/unit/tutorial-sandbox.test.ts` (guardia de imports + 0 escrituras).
- Banderas/Capitales: `src/components/game/session/Session.tsx` y `src/hooks/useGame.ts`.
- Decisiones: `17-tutorial-inicial.md` (D071–D074, sobre todo D072 y D074),
  `21-tutorial-pulido.md` (D090–D092), `16-modo-capitales.md`, `07-modo-paises.md`.

**Enfoque decidido:**
1. Mientras se juega el ejemplo: sin "Saltar tutorial" ni el aviso "Partida de ejemplo…".
   La información "no cuenta" pasa al paso anterior ("Practica Norteamérica") y al texto de
   abandonar; se sale con Escape y con el botón de abandonar existente. Actualiza D092 con
   una decisión nueva que la sustituya.
2. Selector del juego (Banderas / Países / Capitales) en `TutorialSettings.tsx`, con el mismo
   patrón que el resto de ajustes, y la partida de ejemplo usa el elegido con los tres
   países de Norteamérica (D074). Por defecto: Países (lo de hoy).
3. `Session.tsx` recibe un `SessionRuntime` igual que `CountriesPractice` (prop obligatoria;
   `FlagGame` inyecta `useGame()`, el tutorial el sandbox). **Cero escrituras** a
   `localStorage`: amplía `tutorial-sandbox.test.ts` para cubrir Banderas y Capitales.
   Sin tocar el comportamiento de las partidas reales.
4. Copy provisional (fila 39), CHANGELOG (fila 40).

---

## W6 — `fix/avisos-sonido-notificaciones` (P11, P12, P13) · puerto 4346 · D125–D128 · fila 41 · PATCH

**Pedido:** pendientes.md › P11, P12 y P13. Tres arreglos, un commit por cada uno.

**Código:**
- P11: `src/utils/sound.ts:20` y `:113` (`incorrect`, dos notas graves). `decisions/19-sonidos.md`.
  Iguala el volumen percibido al de `correct` (sube ganancia y/o frecuencias, timbre que se
  oiga en altavoces de móvil), sin volverlo estridente. Justifica los números.
- P12: `src/components/game/AchievementToasts.tsx`, `src/hooks/useAchievementToasts.ts`,
  `src/components/app/AchievementsEffects.tsx`. Reproduce primero (invitado limpio que
  desbloquee 2+ logros a la vez; puedes forzarlo en dev) y documenta la causa antes de
  arreglar. Animaciones con `tw-animate-css`, no framer.
- P13: `src/utils/push-notifications.ts:32-40` (`subscribeToDailyReminder` hace
  `Notification.requestPermission()` dentro de un `try` async) y
  `src/components/app/DailyReminderSnackbar.tsx`. Revisa todo lo que dice P13: que la
  llamada ocurra en el gesto (nada `await` antes), `Notification.permission` previo,
  contexto seguro, soporte (iOS solo en PWA instalada), y que ante `denied` la app lo diga
  y explique cómo reactivarlo. Si el origen del fallo no está en el cliente (edge function,
  VAPID), dilo en el informe.
- No toques `src/styles/global.css` (de W7).

---

## W7 — `fix/foco-transicion-y-pulsado` (P3, P4, P6) · puerto 4347 · D129–D131 · fila 42 · PATCH

**Pedido:** pendientes.md › P3, P4 y P6.

**Código:**
- `src/styles/global.css` (tuyo en esta ola): `@custom-variant hover` de D103.
- P3: `transition-colors` se usa en 10 archivos (`ConnectivitySnackbar`, `AchievementToasts`,
  `AccountTab`, `AuthSection`, `CountryPickerModal`, `GameTypeToggle`, `RegionOption`,
  `UserSummary`, `Timer`, `ui/OptionTile`). Preferido: arreglo **global** en `global.css`
  (redefinir la utilidad `transition-colors` / `--tw-transition-property` sin
  `outline-color`) para no tocar esos archivos (W6 y W8 tocan algunos). Comprueba también
  los primitivos de HeroUI.
- P4: el hover de `Tabs`, `Select` y `Accordion` de HeroUI viene de su CSS con
  `@media (hover: hover)`. Añade su estado pulsado (`[data-pressed]` / `:active`) con el
  mismo aspecto que su hover, en `global.css`, sin hovers pegados en táctil.
- P6: `src/layouts/Layout.astro:129-136`: skip link dentro de un landmark sin dejar de ser
  lo primero al tabular. axe `region` limpio.
- Decisiones: `23-foco-y-toque.md` (D101–D104).

**Verificar:** estilo computado de `transition-property` en los elementos afectados; anillo sin
animación de color; emulación móvil tocando pestañas/Select/acordeón; axe sin `region`.

---

## W8 — `feat/castigo-animado` (P10) · puerto 4348 · D132–D134 · fila 43 · PATCH o MINOR · **OLA 2**

**Arranca solo cuando W5 (`feat/tutorial-modo-de-juego`) esté mergeado en `main`.**

**Pedido:** pendientes.md › P10.

**Código:** `src/components/game/session/Session.tsx:35-41`, `:328-329`, `:396-397`
(`setPenaltyMs`), aviso de fallo con "+10 s al cronómetro" (D075), `Timer.tsx`, `Header`.
Constantes `RUSH_WRONG_PENALTY_MS`/`RUSH_SKIP_PENALTY_MS` en `src/types/country.ts:117-118`.
Tras W5, `Session.tsx` recibe un `SessionRuntime` (el tutorial también lo usa: que el
"+10" se vea igual allí). Decisiones: `18-ranking-nueva-regla.md`, `03-animaciones.md`.

**Enfoque:** quitar "+10 s al cronómetro" del mensaje de fallo; "+10"/"+20" junto al
cronómetro que entra y se desvanece con `tw-animate-css`, y el cronómetro "salta" (escala
breve). Con `prefers-reduced-motion`: aparece y desaparece sin movimiento. Un `aria-live`
discreto anuncia "10 segundos de castigo" / "20 segundos de castigo" (copy fila 43). Varios
castigos seguidos no se pisan (key por evento). Banderas y Capitales.
