# Orquestación de la tanda del 2026-09-26 (pendientes P10, P14–P21): brief común

> Lo lee **cada worker** antes de empezar. Su prompt (en `orquestacion-2026-09-26-prompts.md`)
> trae solo lo específico de su unidad. Origen: `context/plans/pendientes.md`.
> Carpeta principal del repo: `C:\Users\Admin\Documents\Work\world-flags\` (aquí viven los
> archivos locales/gitignored: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `supabase/`). Primera tanda con el pool de
> worktrees y Changesets (D135–D136, `context/decisions/33-changesets.md`).

## Decisiones del dueño para esta tanda (2026-09-26)

- **Servidor de desarrollo autorizado:** cada worker levanta `bun run dev -- --port <puerto
  del slot>` en su slot (en segundo plano) y lo apaga al terminar.
- **Supabase:** nadie aplica cambios en la base. El SQL se **escribe** (en
  `supabase/<nombre>.sql` de la carpeta principal o completo en el informe) y lo aplica el
  dueño. El cliente tiene que funcionar igual si ese SQL aún no está aplicado.
- **P18 sonidos:** solo los ★ (`select`, `start`, `penalty`, `record`) + `skip` con nota
  propia. **Sin** sonidos de hover y **sin** interruptor nuevo.
- **P19 animaciones:** solo las ★ (tarjetas de configuración, acierto/fallo en la bandera,
  entrada de la bandera nueva, números que cuentan en resultados, confeti + insignia de récord).
- **P21 hover por fila del ranking:** solo visual (la fila no es enfocable ni muestra nada nuevo).

## Las unidades y el orden

| # | Rama | Pendientes | Qué | Ola | Changeset |
|---|---|---|---|---|---|
| W1 | `feat/castigo-animado` (ya existe, commit wip) | P10 (+ `performance.now` de P15 en `Session.tsx`) | "+10 s"/"+20 s" animado junto al cronómetro | 1 | patch |
| W2 | `feat/ranking-continentes` | P20, P14, P15 | Ranking por continente, reintento con backoff, tiempos imposibles fuera | 1 | minor |
| W3 | `fix/skip-link-contraste-aviso-vapid` | P16, P17.3 | Contraste del skip link en claro + aviso VAPID una sola vez | 1 | patch |
| W4 | `feat/mas-sonidos` | P18 (★) | `select`, `start`, `skip`, `penalty`, `record` | 2 (tras W1 y W2) | minor |
| W5 | `style/ranking-podio` | P21 | Podio oro/plata/bronce, hover por fila, columna del puesto | 2 (tras W2) | patch |
| W6 | `style/animaciones-partida` | P19 ★ partida | Acierto/fallo en la bandera, entrada de la bandera nueva | 3 (tras W4) | patch |
| W7 | `style/animaciones-resultados` | P19 ★ resultados | Números que cuentan, confeti + insignia de récord | 3 (tras W4) | patch |
| W8 | `style/animaciones-configuracion` | P19 ★ configuración | Tarjetas de continente/tipo de juego: elevación, pulsado, "pop" | 3 (tras W4) | patch |

**Archivos que cada uno evita en la ola 1:**
- `Session.tsx`, `Header.tsx`, `AnswerForm.tsx` son de **W1**. W2 no los toca (el cambio a
  `performance.now()` en `Session.tsx` lo hace W1; W2 lo hace en `CountriesRush.tsx`).
- `GameEffects.tsx`, `types/country.ts`, `learning-storage.ts`, `LeaderboardModal.tsx`,
  `leaderboard-*.ts`, `cloud-storage.ts` son de **W2**.
- `Layout.astro`, `push-notifications.ts` son de **W3**.
- `src/styles/global.css`: en la ola 1 nadie lo necesita; si alguien sí, solo añade al final.
  En la ola 3, W6 y W7 pueden añadir `@keyframes` al final: al integrar `main`, conserva los
  bloques de los dos.

## Números reservados

| Unidad | Archivo de decisiones | Rango | Filas de `CONTENT_CHECKLIST` |
|---|---|---|---|
| W1 | `context/decisions/32-castigo-animado.md` (ya existe en la rama) | D132–D134 | 43 |
| W2 | `context/decisions/34-ranking-continentes.md` | D137–D141 | 44–45 |
| W3 | `context/decisions/35-skip-link-contraste.md` | D142 | 46 |
| W4 | `context/decisions/36-mas-sonidos.md` | D143–D146 | 47 |
| W5 | `context/decisions/37-ranking-podio.md` | D147–D150 | 48 |
| W6 | `context/decisions/38-animaciones-partida.md` | D151–D153 | 49 |
| W7 | `context/decisions/39-animaciones-resultados.md` | D154–D156 | 50 |
| W8 | `context/decisions/40-animaciones-configuracion.md` | D157–D158 | 51 |

No uses números fuera de tu rango. Si no necesitas todos, deja los sobrantes sin usar.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Primero lee**, en este orden: `CLAUDE.md`, `context/PROJECT_CONTEXT.md`,
   `context/DESIGN_RULES.md`, `CONTRIBUTING.md`, `.changeset/README.md`, y los archivos de
   `context/decisions/` que tu prompt nombre. En `DECISIONS_INDEX.md` busca con `grep`, no lo
   leas entero. `CURRENT_PHASE.md` y `plans/pendientes.md` léelos de la carpeta principal,
   pero **no los edites**.
2. **Slot:** trabajas SOLO en la ruta de tu slot (`..\world-flags-wt\wtN`), que ya trae tu
   rama creada desde `origin/main` (o retomada), `node_modules` y los `.env*`. No crees ni
   borres worktrees, no corras `wt`, no cambies de rama. Comprueba que partes del `main`
   actual (`git fetch origin && git log origin/main -1`); si no, `git merge origin/main`.
   Al terminar, `git status` vacío (todo commiteado y empujado).
3. **Archivos locales compartidos:** no toques `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`.
   Intenta escribir tu `context/PHASE_LOG/<tu-rama-con-guiones>.md` en la carpeta principal;
   si el sandbox no te deja, **pon su contenido completo en tu informe final**. Igual con el
   SQL: `supabase/<nombre>.sql` en la carpeta principal o completo en el informe.
   `supabase/` salvo su README **nunca** va a git.
4. **Decisiones:** tu archivo de decisiones va en git (en tu rama) y añades tus filas al
   final de `context/DECISIONS_INDEX.md`. En conflicto, conserva las filas de los dos lados,
   en orden de número.
5. **Versión (D135):** no toques `version`, `CHANGELOG.md` ni `APP_VERSION` de `sw.js`. Si
   quien juega nota el cambio, agrega `.changeset/<desc>.md` con el salto que dice tu prompt
   y el trozo del CHANGELOG (español, lenguaje de jugador, texto plano, solo lo que cambia de
   verdad; formato en `.changeset/README.md`). `bun run test` valida los changesets.
6. **Servidor de desarrollo:** `bun run dev -- --port <tu puerto>` en tu slot, en segundo
   plano. Apágalo al terminar. No uses el puerto de otro.
7. **Navegador:** navegador integrado (`mcp__Claude_Browser__*`). Otros workers lo usan a la
   vez: **crea tu propia pestaña** con `tabs_create` y pasa su `tabId` en **cada** llamada;
   nunca actúes sobre pestañas ajenas y ciérrala al terminar. Las capturas fallan a ratos y
   `innerHeight` puede dar 0: verifica leyendo el DOM (`read_page`, `getBoundingClientRect`,
   estilos computados). Tras cada cambio: desregistra el SW, limpia cachés y recarga.
   Verifica como **invitado**: no crees cuentas ni escribas datos reales en producción. Para
   estados que dependen de datos, usa `?demo-ranking` o intercepta respuestas solo para depurar.
8. **Verificación mínima antes del PR:** `bunx astro check` (0 errores),
   `bunx biome check ./src` (sin errores nuevos en lo que tocaste), `bun run test`,
   `bun run build`. Si tocaste UI: skill `a11y` (axe-core 4.10 desde cdnjs, claro **y**
   oscuro, 320 px sin scroll horizontal, foco visible, teclado, movimiento reducido).
   Playwright, si lo usas, con node (no bun). Mide, no supongas.
9. **Animaciones:** `tw-animate-css` o CSS, nunca framer (`decisions/03-animaciones.md`).
   `motion-safe:`/`motion-reduce:` o el bloque global de `prefers-reduced-motion`. Duraciones
   de `DESIGN_TOKENS.md`; si falta una, token nuevo + decisión. Nada que parpadee > 3 veces/s.
10. **Decisiones de UX que te falten:** no puedes preguntar al dueño. Elige la opción más
    conservadora y coherente con las decisiones existentes, impleméntala y **deja en el PR**
    la alternativa en 2 líneas ("Decisión tomada / alternativa").
11. **Copy:** todo texto nuevo es provisional: márcalo `⚠️ Copy provisional
    (CONTENT_CHECKLIST.md #NN)` y apunta la fila (con tu número reservado) en tu PHASE_LOG.
12. **Cierre:** commits Conventional Commits en tu rama (solo los archivos de tu unidad,
    nunca `git add -A`), `git push -u origin <rama>`, `gh pr create` con la plantilla del
    repo (`.github/`): qué cambia, cómo se verificó (y qué no), decisiones con su
    alternativa, acciones manuales (SQL a aplicar). Cuerpo terminado en
    `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, cada commit con
    `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
    **Nunca** `gh pr merge`, nunca push a `main`, nunca force-push ni amend de lo empujado.
13. **Informe final** (lo lee el orquestador): URL del PR, slot, changeset (salto), qué se
    verificó en navegador y qué no, decisiones tomadas, acciones manuales, y el contenido del
    PHASE_LOG/SQL si no pudiste escribirlos en la carpeta principal. Bugs que veas fuera de tu
    unidad: al informe, no los arregles.
