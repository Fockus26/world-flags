# style/animaciones-resultados (W7, tanda 2026-09-26)

P19 ★ Resultados. Decisiones D154–D156 (`decisions/39-animaciones-resultados.md`).

- `src/hooks/useCountUp.ts` (nuevo): cuenta 0 → valor en 600 ms (token
  `COUNT_UP_DURATION_MS`), `setTimeout` de respaldo, movimiento reducido = final.
- `src/components/game/RecordConfetti.tsx` (nuevo): 20 partículas CSS.
- `src/components/game/Results.tsx`: `CountUpNumber` en los tres círculos; insignia
  oro "¡Nuevo récord!" (sustituye la línea de D146) + confeti; `section` `relative`.
- `src/styles/global.css`: `@keyframes confetti-fall` + `.record-confetti-piece` al final.
- Copy: ninguno nuevo ("¡Nuevo récord!" ya es la fila #47). La fila #50 reservada
  queda sin usar.
- Verificado: astro check 0 errores, biome limpio en lo tocado, 196 tests, build.
- NO verificado en navegador: el clasificador de permisos denegó levantar
  `bun run dev -- --port 4302`. Pendiente: axe claro/oscuro, 320 px, movimiento
  reducido, ver el confeti y la insignia con un rush que bata la marca.
