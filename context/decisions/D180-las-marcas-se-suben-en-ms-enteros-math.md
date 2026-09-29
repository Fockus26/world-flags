# D180 · Ranking · Las marcas se suben en ms enteros: `Math.round` en `collectLeaderboardMarks` · Implementado

**Resumen:** Las marcas se suben en ms enteros: `Math.round` en `collectLeaderboardMarks`. `performance.now()` (D132) daba fracciones y `best_time_ms` es `integer` → 22P02, ninguna marca nueva subía desde el 2026-09-26 (P37)

En prod: `POST …/leaderboard_entries 400`, `invalid input syntax for type integer:
"671768.1999999881"` (22P02). Desde D132/D167 (2026-09-26) el rush mide con
`performance.now()`, que da fracciones de ms, y `best_time_ms` es `integer`. Ninguna marca
batida desde entonces llegaba al ranking: la cola (D140) reintentaba y volvía a fallar.

- Se redondea en `collectLeaderboardMarks` (`src/utils/leaderboard-upload.ts`), no al
  guardar: así también suben las marcas que ya están guardadas con decimales en
  `regionBestTimes`, y la cola compara con lo mismo que subió. Es la única vía de subida.
- La marca local sigue con decimales (el cronómetro muestra centésimas; ±0,5 ms no cambia
  nada visible).
- Test en `tests/unit/leaderboard-continentes.test.ts`.

**Rama:** `fix/ranking-tiempo-entero`

## Contexto común de la unidad (antes `53-ranking-ms-enteros.md`)

> Unidad `fix/ranking-tiempo-entero` (2026-09-28). Pendiente P37. Cubre D180.
