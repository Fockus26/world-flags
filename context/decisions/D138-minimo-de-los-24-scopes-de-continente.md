# D138 · Seguridad · Mínimo de los 24 scopes de continente = países × 300 ms desde el primer día (`getLeaderboardMinimums`, 27 scopes) · Implementado

**Resumen:** Mínimo de los 24 scopes de continente = países × 300 ms desde el primer día (`getLeaderboardMinimums`, 27 scopes). Umbral "inhumano" del test: 22 teclas/s (Países de Sudamérica, 23,1)

**Decisión:** Mínimo de los 24 scopes de continente = nº de países del continente × 300 ms (D112), desde el primer día (`getLeaderboardMinimums`, 27 scopes; `getRushMinTimeMs`). El SQL redefine la función del trigger con los 27 `case`
**Por qué:** Un scope nuevo sin mínimo (D114) dejaría pasar cualquier tiempo en rankings que sí se leen. El más justo es Países de Sudamérica (23,1 teclas/s) y Capitales de Asia (24,8): el test baja su umbral de "inhumano" de 25 a 22, aún por encima del récord (≈ 17–20)

**Rama:** `supabase/leaderboard-continentes.sql`
**Nota de estado:** SQL sin aplicar (`supabase/leaderboard-continentes.sql`)

_Contexto común de la unidad (antes `34-ranking-continentes.md`): en D137._
