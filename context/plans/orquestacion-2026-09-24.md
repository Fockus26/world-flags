# Orquestación de la tanda del 2026-09-24 (pendientes P1–P13): brief común para los workers

> Lo lee **cada worker** antes de empezar. Su prompt (en `orquestacion-2026-09-24-prompts.md`)
> trae solo lo específico de su unidad. Origen: `context/plans/pendientes.md`.
> Carpeta principal del repo: `C:\Users\Admin\Documents\Work\world-flags\` (aquí viven los
> archivos locales/gitignored: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `supabase/`, `.env`).

> **⚠️ Actualizado el 2026-09-26 (D135–D136) para lo que queda (W8).** Si `chore/changesets`
> ya está en `main`, mandan estas reglas sobre las de abajo:
> - **Slot, no worktree nuevo:** trabajas SOLO en la ruta de tu slot del pool
>   (`..\world-flags-wt\wtN`), que ya trae tu rama creada desde `origin/main`,
>   `node_modules` y los `.env*`. No crees ni borres worktrees, no corras `wt`, no cambies
>   de rama. Tu puerto es el del slot (4300 + N), no el de la tabla. Al terminar, `git status`
>   vacío (todo commiteado y empujado).
> - **Regla 5 → changeset:** no toques `version`, `CHANGELOG.md` ni `APP_VERSION` de `sw.js`.
>   Si quien juega nota el cambio, agrega `.changeset/<desc>.md` con el salto que dice tu
>   prompt y el trozo del CHANGELOG (formato en `.changeset/README.md`).
> - **Informe:** URL del PR, slot, changeset (salto) en vez de versión.
> Si `chore/changesets` aún no está en `main`, sigue el flujo viejo de abajo.

## Decisiones del dueño para esta tanda (2026-09-24)

- **Supabase:** nadie aplica cambios en la base. El SQL (tabla `app_config`, trigger del
  ranking) se **escribe** y se entrega en el informe; el dueño lo aplica antes de mergear.
  El cliente debe funcionar igual si ese SQL todavía no está aplicado.
- **P5:** trigger con tiempos mínimos verosímiles por scope (no edge function).
- **P8:** mock solo en el cliente en dev (`import.meta.env.DEV` + query param). Nada en la base.
- **P7:** skeleton desde el primer frame + **animar la altura** del modal (anulada con
  movimiento reducido).

## Las unidades y el orden

| # | Rama | Pendientes | Qué | Ola | Puerto dev | Versión |
|---|---|---|---|---|---|---|
| W1 | `feat/actualizacion-obligatoria` | P1 | `sw.js` cambia en cada versión + versión mínima que bloquea | 1 | 4341 | MINOR |
| W2 | `fix/ranking-validacion-servidor` | P5 | Trigger SQL con mínimos por scope + el cliente tolera el rechazo | 1 | 4342 | PATCH (solo si cambia el cliente) |
| W3 | `feat/ranking-skeleton-demo` | P7, P8 | Skeleton inmediato, altura animada, ranking de prueba de 30 en dev | 1 | 4343 | PATCH |
| W4 | `fix/racha-calendario-ancho` | P2 | Calendario de la racha a todo el ancho en escritorio | 1 | 4344 | PATCH |
| W5 | `feat/tutorial-modo-de-juego` | P9 | Partida del tutorial limpia + modo de juego elegible | 1 | 4345 | MINOR |
| W6 | `fix/avisos-sonido-notificaciones` | P11, P12, P13 | Sonido de fallo, parpadeo de logros, permiso de notificaciones | 1 | 4346 | PATCH |
| W7 | `fix/foco-transicion-y-pulsado` | P3, P4, P6 | Anillo sin transición de color, pulsado en HeroUI, skip link en landmark | 1 | 4347 | PATCH |
| W8 | `feat/castigo-animado` | P10 | "+10"/"+20" animado junto al cronómetro | 2 | 4348 | PATCH |

La ola 2 (W8) sale de `main` **después** de que se mergee W5 (los dos tocan `Session.tsx`).

**Archivos que cada uno evita** (para no chocar en la ola 1):
- `src/styles/global.css` es de **W7**. Si otra unidad necesita CSS, lo pone en su componente
  (clases de Tailwind / `tw-animate-css`).
- `src/utils/cloud-storage.ts` es de **W2** (y de W1 si lee `app_config`: W1 usa un
  archivo nuevo, p. ej. `src/utils/app-config.ts`). W3 pone su mock fuera de `cloud-storage.ts`.
- `Session.tsx` es de **W5** en la ola 1.

## Números reservados

| Unidad | Archivo de decisiones | Rango | Filas de `CONTENT_CHECKLIST` |
|---|---|---|---|
| W1 | `context/decisions/25-actualizacion-obligatoria.md` | D107–D111 | 34–35 |
| W2 | `context/decisions/26-ranking-validacion.md` | D112–D114 | 36 |
| W3 | `context/decisions/27-ranking-skeleton-demo.md` | D115–D117 | 37 |
| W4 | `context/decisions/28-racha-calendario.md` | D118–D119 | 38 |
| W5 | `context/decisions/29-tutorial-modo-de-juego.md` | D120–D124 | 39–40 |
| W6 | `context/decisions/30-avisos-sonido-notificaciones.md` | D125–D128 | 41 |
| W7 | `context/decisions/31-foco-transicion-pulsado.md` | D129–D131 | 42 |
| W8 | `context/decisions/32-castigo-animado.md` | D132–D134 | 43 |

No uses números fuera de tu rango. Si no necesitas todos, deja los sobrantes sin usar.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Primero lee**, en este orden: `CLAUDE.md`, `context/PROJECT_CONTEXT.md`,
   `context/DESIGN_RULES.md`, `context/DECISIONS_INDEX.md`, `CONTRIBUTING.md`, y los
   archivos de `context/decisions/` que tu prompt nombre. `CURRENT_PHASE.md` léelo de la
   carpeta principal (no existe en tu worktree), pero **no lo edites**.
2. **Rama:** tu worktree nace de `main` con un nombre automático. Lo primero:
   `git switch -c <tu-rama>`. Comprueba que partes del `main` actual
   (`git fetch origin && git log origin/main -1`); si no, `git merge origin/main`.
3. **Archivos locales compartidos:** no toques `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`.
   Intenta escribir tu `context/PHASE_LOG/<tu-rama-con-guiones>.md` en la carpeta principal;
   si el sandbox no te deja, **pon su contenido completo en tu informe final** (el
   orquestador lo copia). Igual con el SQL: va a `supabase/<nombre>.sql` en la carpeta
   principal o, si no puedes, completo en el informe. `supabase/` salvo su README **nunca** va a git.
4. **Decisiones:** tu archivo de decisiones sí va en git (en tu rama), y añades tus filas
   al final de `context/DECISIONS_INDEX.md`. En conflicto, conserva las filas de los dos
   lados, en orden de número.
5. **Versión y changelog (D057–D060):** si quien juega nota el cambio, sube `version` en
   `package.json` y añade tu entrada arriba de `CHANGELOG.md` (español, lenguaje de
   jugador, texto plano, solo lo que de verdad cambia). Parte de **2.2.0** (MINOR → 2.3.0,
   PATCH → 2.2.1). Otras unidades harán lo mismo en paralelo: si al sincronizar con `main`
   otra ya tomó tu número, sube el tuyo por encima del de `main` y deja tu entrada la
   primera. `bun run test` exige que la primera entrada sea la versión de `package.json`.
   Ojo W1: su mecanismo hace que `sw.js` cambie con la versión; los demás no tocan `sw.js`.
6. **Servidor de desarrollo, autorizado por el dueño para esta tanda:**
   `bun run dev -- --port <tu puerto>` **en tu worktree** (en segundo plano). Antes:
   `bun install` y copia el `.env` de la carpeta principal (gitignored; nunca lo commitees).
   Apágalo al terminar. No uses el puerto de otro.
7. **Navegador:** navegador integrado (`mcp__Claude_Browser__*`). Otros workers lo usan a la
   vez: **crea tu propia pestaña** con `tabs_create` y pasa su `tabId` en **cada** llamada;
   nunca actúes sobre pestañas ajenas y ciérrala al terminar. Las capturas fallan a ratos y
   `innerHeight` puede dar 0: verifica leyendo el DOM (`read_page`, `getBoundingClientRect`,
   estilos computados). Tras cada cambio: desregistra el SW, limpia cachés y recarga.
   Verifica como **invitado**: no crees cuentas ni escribas datos reales en producción. Para
   estados que dependen de datos, intercepta respuestas en el navegador solo para depurar.
8. **Verificación mínima antes del PR:** `bunx astro check` (0 errores),
   `bunx biome check ./src` (sin errores nuevos en lo que tocaste), `bun run test`,
   `bun run build`. Si tocaste UI: skill `a11y` (axe-core 4.10 desde cdnjs, claro **y**
   oscuro, 320 px sin scroll horizontal, foco visible, teclado). Playwright, si lo usas,
   con node (no bun). Mide, no supongas.
9. **Decisiones de UX que te falten:** no puedes preguntar al dueño. Elige la opción más
   conservadora y coherente con las decisiones existentes, impleméntala y **deja en el PR**
   la alternativa en 2 líneas ("Decisión tomada / alternativa").
10. **Copy:** todo texto nuevo es provisional: márcalo `⚠️ Copy provisional
    (CONTENT_CHECKLIST.md #NN)` y apunta la fila (con tu número reservado) en tu PHASE_LOG.
11. **Cierre:** commits Conventional Commits en tu rama (solo los archivos de tu unidad,
    nunca `git add -A`), `git push -u origin <rama>`, `gh pr create` con la plantilla del
    repo (`.github/`): qué cambia, cómo se verificó (y qué no), decisiones con su
    alternativa, acciones manuales (SQL a aplicar). Cuerpo terminado en
    `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, cada commit con
    `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
    **Nunca** `gh pr merge`, nunca push a `main`, nunca force-push ni amend de lo empujado.
12. **Informe final** (tu último mensaje): URL del PR, versión, verificación hecha y no
    hecha, decisiones abiertas, acciones manuales (SQL completo si no pudiste escribirlo),
    contenido del PHASE_LOG si no pudiste escribirlo, y bugs vistos de paso (reportados, no
    arreglados).
13. **Si el orquestador te retoma:** nuevos commits en la misma rama + push. Si `main`
    avanzó: `git fetch origin && git merge origin/main`, resuelve conflictos (regla 5),
    repite la verificación mínima y push.
