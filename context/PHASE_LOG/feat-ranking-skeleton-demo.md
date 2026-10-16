# feat/ranking-skeleton-demo (W3, tanda 2026-09-24) — P7 + P8

PR: https://github.com/Fockus26/World-Flags/pull/30 · versión 2.2.1 (PATCH) · D115–D117

## Hecho
- `ui/Skeleton`: prop opcional `immediate` (sin espera de 300 ms ni fundido). Solo la usa `LeaderboardModal`.
- `ui/AnimatedHeight` (nuevo): mide con `ResizeObserver` y anima `height` 300 ms; `transition-none` con movimiento reducido; `shrink-0` para no encoger dentro del diálogo flex.
- `configuration/leaderboard-demo.ts`: 30 personas falsas, solo con `import.meta.env.DEV` + `?demo-ranking` (opciones `lento`, `top`, `sin-mi`, número). Comprobado que no llega a `dist/`.
- Decisiones: `context/decisions/27-ranking-skeleton-demo.md` + índice.

## CONTENT_CHECKLIST
- Fila #37 reservada sin usar (sin copy nuevo en producción).

## No verificado
- Con sesión real y Supabase real (sin `.env`: dev con Supabase ficticio, como invitado).
- Preferencia de movimiento reducido del SO (probado con `data-reduce-motion="true"`).
