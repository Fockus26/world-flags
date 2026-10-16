# Ola de arreglos 2026-10-12 — brief común

Plan: `tanda-2026-10-12-arreglos.md` (F1–F6). Decisiones del dueño: `pendientes.md` § "Decisiones del dueño 2026-10-12".
Prompts por unidad: `orquestacion-2026-10-12-arreglos-prompts.md`. Base: `main` @ 27df232 (#73–#77 mergeados).

## Ola A (esta sesión)

| ID | Rama | Qué | Archivos principales | Slot · puerto | Decisión | Checklist | Changeset |
|---|---|---|---|---|---|---|---|
| F1 | `fix/sesion-colgada-reencolado` | P55 crítico: la última tarjeta reencolada sobre sí misma cuelga Países | `CountriesPractice.tsx`, `usePracticeQueue.ts`, test | wt1 · 4301 | D194 | — | patch |
| F3 | `fix/contraste-secondary-danger` | P48 (a), P52.1 (a), P52.2 (a) | `ui/Button.tsx`, `utils/score.ts` (`getScoreColor`), `COLORS.md`, test | wt2 · 4302 | D195–D196 | — | patch |
| F5 | `fix/seo-metadata` | P46 h1 en HTML estático, P47.5–8, og-image ≤300 KB, JSON-LD, `optimizeDeps` | `Layout.astro`, `index.astro`, `astro.config.mjs`, `public/og-image.png`, `manifest.webmanifest` | wt3 · 4303 | D197 | 51–52 (las escribe el orquestador) | patch |
| F6 | `fix/ranking-cache-bordes` | P56 (a) petición de más al reabrir, (b) modal suscrito a la invalidación | `LeaderboardModal.tsx`, `leaderboard-cache.ts`, test | wt4 · 4304 | D198 | — | patch |

Archivos disjuntos. F3 **no** toca `Results.tsx` ni `getScoreMessage` (F4, ola B); F5 toca lo mínimo de
`Configuration.tsx` si hace falta para el h1 (F2/F4 van después sobre main actualizado).

## Ola B (otra sesión, tras mergear la A y su QA)

F2 `fix/foco-perdido`, F4 `fix/copy-lotes` — ver plan.

## Reglas de la ola

- Servidor de desarrollo: **autorizado**, cada worker en su puerto, como invitado (sin iniciar sesión, sin
  escribir datos reales). Si `astro dev` no arranca en el slot: `bun run build` + `bunx astro preview --port <p>`.
  Parar el servidor por PID al terminar.
- Sin cambios en la base.
- Workers no editan `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: escriben `context/PHASE_LOG/<rama>.md` en la
  carpeta principal (`C:\Users\Admin\Documents\Work\world-flags\`) o lo entregan en el informe.
- Nada de `version`, `CHANGELOG.md`, `APP_VERSION`. Changeset a mano (`.changeset/README.md`), texto de jugador.
- Decisión: un archivo `context/decisions/D19N-<tema>.md` (cabecera `# D19N · Categoría · Resumen · Estado`), en git.
- Puertas: `bunx astro check`, `bunx biome check ./src` (errores previos no bloquean; los tuyos sí),
  `bun run test`, `bun run build`. Skill `a11y` si tocas UI. PR con la plantilla; nunca merge.
- SW cachea agresivo: desregistrar + borrar caches al verificar. Playwright con `node`. axe desde cdnjs.
  Tutorial: `localStorage["world-flags-tutorial-seen"]="true"` o "Saltar tutorial".
  Astro 7 dev escucha en `localhost`/[::1]; primer request lento (timeouts 90 s), `waitUntil: "load"`.
- Capturas a `context/plans/shots-<ID>/` de la carpeta principal.
- Feedback para el kit: sección propia en el informe.
