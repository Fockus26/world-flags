# Agent context — world-flags

**Empieza por `CLAUDE.md` en la raíz** y luego `context/` (empezando por
`context/PROJECT_CONTEXT.md` y, si existe en local, `context/CURRENT_PHASE.md`). Ahí está todo el
onboarding real; este archivo solo redirige.

## Recordatorio rápido

- **Todo cambio va por Pull Request** desde una rama `tipo/descripcion`. Nunca push a `main`, nunca mergear PRs (lo hace el dueño). Detalle en `CLAUDE.md` → "Cómo se trabaja aquí".
- El `context/` volátil es local y gitignored: no lo agregues.
- Astro 7 + React 19 (una isla `client:load`) + **HeroUI v3** sobre **Tailwind v4** + Redux Toolkit + Postgres (Drizzle y Better Auth).
- **Bun** para todo. Nunca npm/yarn/pnpm.
- Persistencia solo por `src/utils/learning-storage.ts`. Redux solo por los hooks de `src/hooks/`.
- Nada de valores mágicos de color/espaciado/radio: tokens (`context/COLORS.md`, `context/DESIGN_TOKENS.md`).
- `framer-motion` no ejecuta aquí — animaciones nuevas con `tw-animate-css` (`animate-in …`). Ver D006 y D177.
- El servidor de dev lo levanta el dueño, no un agente. El SW (`public/sw.js`) cachea agresivo: desregistrar + limpiar `caches` al verificar en dev.
- Docs de librerías: **Context7** antes de usar cualquier API.
