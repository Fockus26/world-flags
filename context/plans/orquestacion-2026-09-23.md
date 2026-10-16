# Orquestación de la tanda del 2026-09-23 — brief común para los workers

> Lo lee **cada worker** antes de empezar. Su prompt trae solo lo específico de su unidad.
> Carpeta principal del repo: `C:\Users\Admin\Documents\Work\world-flags\` (aquí viven los
> archivos locales/gitignored: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `supabase/`, `.env`).

## Las unidades y el orden

| # | Rama | Qué | Ola | Puerto dev |
|---|---|---|---|---|
| W1 | `feat/ranking-nueva-regla` | Castigo 10 s fallo / 20 s saltar, ranking limpio, top 20, avatares, skeleton | 1 | 4331 |
| W2 | `feat/sonidos` | Sonidos de acierto, fallo y logro + interruptor | 1 | 4332 |
| W3 | `feat/modales-logros-novedades` | Logros más ancho con varias tarjetas por fila; Novedades en acordeón | 1 | 4333 |
| W4 | `fix/tutorial-pulido` | Sin "Saltar tutorial" en el último paso, "ejemplo" una sola vez, partida a tamaño real | 1 | 4334 |
| W5 | (sin rama) | Plantilla bonita del correo de confirmación de Supabase | 1 | — |
| W6 | `feat/menu-movil` | Menú ⋮ en móvil, "Cerrar" → X en móvil, racha a todo el ancho, animación del Select | 2 | 4336 |
| W7 | `style/foco-y-toque` | Contorno de foco del color del elemento; al tocar en móvil se ve el estilo hover | 2 | 4337 |

La ola 2 sale de `main` **después** de que se mergeen W1 y W3 (tocan las cabeceras de los
modales que W6 cambia).

## Números reservados (para que las unidades en paralelo no choquen)

| Unidad | Archivo de decisiones | Rango de decisiones | Filas de `CONTENT_CHECKLIST` |
|---|---|---|---|
| W1 | `context/decisions/18-ranking-nueva-regla.md` | D075–D079 | 26–27 |
| W2 | `context/decisions/19-sonidos.md` | D080–D084 | 28–29 |
| W3 | `context/decisions/20-modales-logros-novedades.md` | D085–D089 | 30 |
| W4 | `context/decisions/21-tutorial-pulido.md` | D090–D094 | 31 |
| W5 | (sin archivo de decisiones en git) | D095 | 32 |
| W6 | `context/decisions/22-menu-movil.md` | D096–D100 | 33–34 |
| W7 | `context/decisions/23-foco-y-toque.md` | D101–D105 | 35 |

No uses números fuera de tu rango. Si no necesitas todos, deja los sobrantes sin usar.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Primero lee**, en este orden: `CLAUDE.md`, `context/PROJECT_CONTEXT.md`,
   `context/DESIGN_RULES.md`, `context/DECISIONS_INDEX.md`, `CONTRIBUTING.md`, y los
   archivos de `context/decisions/` que tu prompt nombre. `CURRENT_PHASE.md` léelo de la
   carpeta principal (no existe en tu worktree), pero **no lo edites**.
2. **Rama:** tu worktree nace de `main` con un nombre automático. Lo primero:
   `git switch -c <tu-rama>` (la de la tabla). Comprueba con `git log -1` que partes del
   `main` actual (`git fetch origin && git log origin/main -1`); si no, `git merge origin/main`.
3. **Archivos locales compartidos — no los edites a la vez que otros:** no toques
   `context/CURRENT_PHASE.md` ni `context/CONTENT_CHECKLIST.md`. En su lugar escribe
   **tu propio** `context/PHASE_LOG/<tu-rama-con-guiones>.md` en la carpeta principal
   (p. ej. `PHASE_LOG/feat-sonidos.md`) con: estado, qué verificaste y cómo, qué no, las
   filas de `CONTENT_CHECKLIST` que añadirías (con tus números reservados) y cualquier
   acción manual. El orquestador lo consolida.
4. **Decisiones:** tu archivo de decisiones sí va en git (en tu rama), y añades tus filas
   al final de `context/DECISIONS_INDEX.md`. Si al sincronizar con `main` hay conflicto en
   el índice, conserva las filas de los dos lados, en orden de número.
5. **Versión y changelog (D057–D060):** si quien juega nota el cambio, sube `version` en
   `package.json` y añade tu entrada arriba de `CHANGELOG.md` (español, lenguaje de
   jugador, texto plano, solo lo que de verdad cambia). Parte de `1.2.0`. Otras unidades
   harán lo mismo en paralelo: si al sincronizar con `main` otra ya tomó tu número, sube
   el tuyo por encima del de `main` y deja tu entrada la primera. `bun run test` exige que
   la primera entrada sea la versión de `package.json`.
6. **Servidor de desarrollo — autorizado por el dueño para esta tanda:** puedes levantar
   `bun run dev -- --port <tu puerto>` **en tu worktree** (en segundo plano) para
   verificar. Antes: `bun install` y copia el `.env` de la carpeta principal a tu worktree
   (es gitignored; nunca lo commitees). Apágalo al terminar. No uses el puerto de otro.
7. **Navegador:** usa el navegador integrado (`mcp__Claude_Browser__*`). Otros workers lo
   usan a la vez: **crea tu propia pestaña** con `tabs_create` y pasa su `tabId` en
   **cada** llamada; nunca actúes sobre pestañas que no creaste y ciérrala al terminar.
   En este equipo las capturas fallan a ratos y `innerHeight` puede dar 0: verifica
   leyendo el DOM (`read_page`, `getBoundingClientRect`, estilos computados con
   `javascript_tool`). Antes de cada comprobación tras un cambio, desregistra el SW y
   limpia cachés (`CLAUDE.md` › SW) y recarga.
8. **Verificación mínima antes del PR:** `bunx astro check` (0 errores),
   `bunx biome check ./src` (sin errores nuevos en lo que tocaste), `bun run test`,
   `bun run build`. Si tocaste UI: skill `a11y` (axe-core 4.10 desde cdnjs, claro **y**
   oscuro, 320 px sin scroll horizontal, foco visible, teclado). Mide, no supongas.
9. **Supabase:** solo W1 toca la base, y solo con cambios **aditivos** (columnas nuevas
   con default). Nadie borra filas ni tablas. Nadie toca la configuración de Auth.
10. **Decisiones de UX que te falten:** no puedes preguntar al dueño a mitad de tarea
    (trabajas en segundo plano). Elige la opción más conservadora y coherente con las
    decisiones existentes, impleméntala y **deja en el PR** la alternativa en 2 líneas
    ("Decisión tomada / alternativa"). No te quedes bloqueado.
11. **Copy:** todo texto nuevo es provisional: márcalo con `⚠️ Copy provisional
    (CONTENT_CHECKLIST.md #NN)` como hace el resto del código y apunta la fila en tu PHASE_LOG.
12. **Cierre:** commits Conventional Commits en tu rama (solo los archivos de tu unidad,
    nunca `git add -A`), `git push -u origin <rama>`, `gh pr create` rellenando la
    plantilla del repo (`.github/`), con: qué cambia, cómo se verificó (y qué no),
    decisiones tomadas con su alternativa, acciones manuales. Termina el cuerpo del PR con
    `🤖 Generated with [Claude Code](https://claude.com/claude-code)` y cada commit con
    `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
    **Nunca** `gh pr merge`, nunca push a `main`, nunca force-push ni amend de lo empujado.
13. **Informe final** (tu último mensaje, lo lee el orquestador): URL del PR, versión que
    tomaste, verificación hecha y no hecha, decisiones abiertas para el dueño, acciones
    manuales, y bugs vistos de paso (reportados, no arreglados).
14. **Si el orquestador te retoma** con cambios pedidos en el PR: nuevos commits en la
    misma rama + push. Si `main` avanzó: `git fetch origin && git merge origin/main`,
    resuelve conflictos (changelog/versión según la regla 5), vuelve a pasar la
    verificación mínima y push.
