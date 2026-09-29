# D137 · Persistencia · Ranking por continente: claves `"<región>@2"` (Banderas/Capitales) y `"<región>"` · Implementado

**Resumen:** Ranking por continente: claves `"<región>@2"` (Banderas/Capitales) y `"<región>"` (Países) vía `BEST_TIME_RULE_SUFFIXES`/`getBestTimeKey`; scopes `countries:<región>`, `flags:<región>@2`, `capitals:<región>@2` (`getLeaderboardScope`); "Todo el mundo" no cambia. Solo un continente completo. Marcas viejas de continente se quedan sin leerse

**Decisión:** Ranking por continente. Claves de `regionBestTimes`: `"<región>@2"` en Banderas y Capitales, `"<región>"` en Países (`BEST_TIME_RULE_SUFFIXES`, `getBestTimeKey`, `getRegionBestTime`). Scopes `countries:<región>`, `flags:<región>@2`, `capitals:<región>@2` (`getLeaderboardScope(gameType, region)`); "Todo el mundo" no cambia (`LEADERBOARD_SCOPES`). Solo cuenta un rush de un continente completo (`getScopeRegionKey`). Las marcas viejas de continente de Banderas y Capitales se quedan en los datos, no se muestran ni se suben. Sin migración: PK `(user_id, scope)`
**Por qué:** Las claves `"europe"` mezclaban la regla vieja y la 2 (D075): solo "world" se había versionado (D076). Con la versión en la clave, un cliente viejo en caché sigue escribiendo en `"europe"` sin pisar nada, y merge/normalización ya conservan las claves desconocidas

**Rama:** `feat/ranking-continentes`

## Contexto común de la unidad (antes `34-ranking-continentes.md`)

> Feature, rama `feat/ranking-continentes` (pendientes P20, P14 y P15, tanda
> 2026-09-26). Enfoque de P20 decidido por el dueño en `plans/pendientes.md`.
> SQL local sin aplicar: `supabase/leaderboard-continentes.sql`.

### Lo que esto no cubre

- **Tu puesto por continente en `RegionSelector`** (opcional en P20.6): otra unidad.
- **Resultados no abre el ranking**: `defaultRegion` queda listo para cuando lo haga.
- Sin el SQL aplicado, las subidas de continente entran sin validar (D114) y una
  marca peor puede pisar una mejor. Orden: SQL antes o a la vez que el deploy.
