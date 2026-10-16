# feat/ranking-continentes (W2, tanda 2026-09-26) — PR #36

Slot `wt2`, puerto 4302. Pendientes P20, P14, P15. Decisiones D137–D141
(`context/decisions/34-ranking-continentes.md`). Changeset minor.

## Hecho
- Claves `"<región>@2"` (Banderas/Capitales), scopes de continente con `getLeaderboardScope`, 27 mínimos.
- Cola de subida al ranking en serie con backoff 5/15/30/60 s (`src/utils/leaderboard-upload.ts`).
- P15: `isPlausibleRushTime` en `useGame` y en la cola; `performance.now()` en `CountriesRush`; `least(...)` en el trigger.
- Selector "Continente" en `LeaderboardModal` (default "Todo el mundo", prop `defaultRegion`).
- `RegionSelector` enseña las marcas de continente de la regla vigente (`getContinentBestTimes`).
- SQL: `supabase/leaderboard-continentes.sql` (sin aplicar; antes o a la vez que el deploy).

## Filas para CONTENT_CHECKLIST (las añade el orquestador)
- #44 — Ranking por continente: etiqueta "Continente" del selector, descripciones "…de Europa/del Caribe…" (`REGION_PHRASES` en `LeaderboardModal.tsx`) y aviso "completa una práctica competitiva de "<continente>"". Provisional.
- #45 — Anuncio para lectores de pantalla al cambiar de continente: "Mostrando el ranking de <continente>." Provisional.

## Verificación
- astro check 0 errores; biome limpio en lo tocado; 188 tests + 1 skip; build ok.
- Navegador (invitado, `?demo-ranking=top`): teclado en el Select, axe 0 en claro/oscuro, 320 px sin scroll.
- No verificado: subida real y SQL.

## Pendiente / fuera de alcance
- Tu puesto por continente en `RegionSelector` (opcional P20.6).
- Resultados no abre el ranking: `defaultRegion` queda preparado.
