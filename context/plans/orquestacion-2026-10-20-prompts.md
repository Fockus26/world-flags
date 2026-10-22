# Tanda 2026-10-20 — arreglos del design-qa · prompts

Base: `origin/main` @ 53284e7. Informe origen: `context/plans/qa-design-2026-10-20.md` (carpeta principal
`C:\Users\Cesar\Documents\Work\world-flags`; léelo solo en la sección de tu hallazgo). Capturas en
`context/plans/shots-design-2026-10-20/`.

Reglas comunes:
- Lee `CLAUDE.md` del slot. Tokens siempre (`context/COLORS.md`, `DESIGN_TOKENS.md`, `TYPOGRAPHY.md`); nada de valores mágicos.
- Puedes levantar tu propio dev server **solo en tu puerto**. No uses el puerto 4302 ni toques Docker/Supabase local (lo usa otra QA). Verifica como invitado contra build/dev; Playwright con `node`.
- Desregistra el SW y borra caches antes de medir.
- Skill `a11y` antes de abrir el PR. `bunx astro check`, `bunx biome check ./src`, `bun run test`, `bun run build` en verde.
- Changeset `patch` con texto de jugador (formato en `.changeset/README.md`).
- No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`; tu resumen va en el informe final (y en `PHASE_LOG/<rama>.md` de la carpeta principal si puedes escribir allí).
- Commit Conventional Commits, push, `gh pr create` con la plantilla. Nunca merge.
- Si encuentras otro fallo en lo que tocas, arréglalo y dilo en el PR; si es de otra zona, solo repórtalo.

## W1 — forced-colors en segmentados y botones · `fix/forced-colors` · D207 · patch

Pedido: "Soluciona cada hallazgo" del design-qa.
- **[Alto]** En `@media (forced-colors: active)` no se ve la opción elegida de los segmentados: Configuración › Juego (`src/components/game/configuration/configurationModal/GameTab.tsx`: Modo, Sonidos, Notificaciones, Tema) y modal de lotes (`LearningPathModal.tsx`: Orden, Países por lote). Arréglalo en el **primitivo común** (busca el componente/hoja que pintan esas opciones; `OptionTile`/`GameTypeToggle`/wrappers en `src/components/ui/`), no por pantalla. Propuesta: opción `[data-selected=true]` con `forced-color-adjust: none` + `Highlight`/`HighlightText`, o borde grueso/icono de check. No debe depender solo del color fuera de forced-colors tampoco.
- **[Bajo]** En forced-colors los botones con relleno pierden forma (Resultados, modal de lotes, aviso de racha). Propuesta: `border: 1px solid transparent` en la base de `Button` (wrapper en `src/components/ui/`, conserva su API) o regla en su hoja de `global.css`, sin cambiar medidas fuera de forced-colors (compénsalo si el borde añade px).
- Verifica con Playwright `forcedColors: 'active'` (claro y oscuro) las pantallas citadas + pantalla de error y Resultados del rush rendido; y sin forced-colors, que nada cambia visualmente (captura antes/después).
- Decisión D207 en `context/decisions/D207-forced-colors-seleccion-y-botones.md`.

## W2 — pantalla de error y 404: foco y ancho · `fix/pantalla-error-foco` · D208 · patch

- **[Medio]** `src/components/app/ErrorBoundary.tsx`: el h1 `#error-boundary-title` no recibe foco. `tabIndex={-1}` y enfocarlo cuando `hasError` pasa a true (mismo patrón que Resultados; busca `focusWhenVisible` / `src/utils/focus.ts`).
- **[Bajo]** `w-[min(100%,32rem)]` en `src/pages/404.astro:19` y `ErrorBoundary.tsx:47`, frente a `w-[min(100%,38rem)]` en `Results.tsx:228`. Crea un token de ancho de tarjeta en el CSS de tokens (y documéntalo en `context/DESIGN_TOKENS.md`) y úsalo en los tres; decide si 404/error van a 32 o 38 rem y explícalo (conservador: mantener cada ancho actual con dos tokens o uno común si visualmente no empeora).
- Verifica: provoca el error (ej. lanzando desde consola/flag de dev temporal, sin commitearlo), foco en el h1 con lector/`document.activeElement`; 404 en 320–3840 sin scroll horizontal; zoom 200 % a 1280 y texto 200 %.
- Decisión D208.

## W3 — sesión y lotes: tamaños y copy · `fix/sesion-tamanos-copy-lotes` · D209 · patch

- **[Medio]** `#answer-input` (`session/AnswerForm.tsx` → `ui/Input`) mide 42 px de alto en 320–430: llévalo a ≥44 px (`min-h-11` o token equivalente). El desplegable "Qué practicar" también mide 42 px: si el cambio va en `ui/Input`/Select de forma global sin romper consumidores, hazlo; si no, solo el de la sesión y repórtalo.
- **[Bajo]** "LOTE N DE M" de la cabecera de sesión (`session/Header.tsx`, `text-micro … uppercase text-primary`) mide 10 px: pásalo a `text-tiny` al menos en móvil, sin romper la cabecera a 320.
- **[Medio · copy aprobado por el dueño]** `src/components/game/configuration/LearningPathModal.tsx:86`: "Aprende de a pocos {noun}." → **"Aprende poco a poco las {noun}."** — revisa que `{noun}` sea plural con artículo correcto para banderas, capitales y países ("los países"): ajusta el artículo por juego. Copy aprobado 2026-10-20.
- Verifica a 320/360/390/430 en claro y oscuro, zoom 200 % a 1280 y texto 200 %; axe limpio.
- Decisión D209 solo si cambias el primitivo; si no, sin decisión.
