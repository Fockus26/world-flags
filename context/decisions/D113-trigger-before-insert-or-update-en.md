# D113 · Seguridad · Trigger `before insert or update` en `leaderboard_entries` (`supabase/leaderboard-validacion.sql`) · Implementado

**Resumen:** Trigger `before insert or update` en `leaderboard_entries` (`supabase/leaderboard-validacion.sql`): rechaza tiempo nulo/≤ 0 o bajo el mínimo con SQLSTATE `PT422` (HTTP 422); en update solo si cambia tiempo o scope (no rompe D079). El cliente trata `PT422` como rechazo definitivo (`rejected`, sin reintento); `failed` sigue reintentándose (D050)

**Decisión:** Trigger `before insert or update` en `leaderboard_entries` (`supabase/leaderboard-validacion.sql`, local). Rechaza `best_time_ms` nulo o ≤ 0 y el que queda bajo el mínimo, con SQLSTATE `PT422` (PostgREST: HTTP 422, `code: "PT422"`). En un update solo valida si cambia el tiempo o el scope. El cliente trata `PT422` como rechazo **definitivo**: `upsertLeaderboardEntry` devuelve `rejected` y `GameEffects` no la reintenta (sí sigue reintentando `failed`, D050)
**Por qué:** El `update` de nombre y avatar (D079) toca todas las filas del usuario y no debe fallar por una fila antigua. Antes, una subida fallida se reintentaba con cada cambio de `learningData` (cada respuesta de la partida): con un rechazo que siempre se repite eso era un bucle de peticiones. El rechazo no es fallo de sincronización: no toca `hydrationStatus` ni el progreso local

**Rama:** `fix/ranking-validacion-servidor`
**Nota de estado:** SQL sin aplicar

_Contexto común de la unidad (antes `26-ranking-validacion.md`): en D112._
