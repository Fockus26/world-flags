# D033 · UX · Rush de países: termina completando o rindiéndose; el mejor tiempo solo se registra al 100 % (`completed`) · Implementado

`CompetitiveGameResult` ganó `completed: boolean` (Banderas siempre manda
`true`, no tiene botón "Rendirme"). Al rendirse (`CountriesRush.tsx`, con
`ConfirmationModal` reutilizado vía sus props opcionales de D034-adjacent):
se revelan los países que faltaban como `"missed"` (rojo + icono, D038), se
registra la sesión igual (cuenta para `stats`), y **`registerRegionBestTime`
solo se llama si `completed`** — un rush abandonado a medio camino no debe
mejorar ni crear una marca. `Results.tsx` muestra "Encontraste X de Y" en
vez de un tiempo cuando no se completó.

Ranking en `leaderboard_entries` con scope `"countries:world"` — la PK
`(user_id, scope)` ya lo soportaba sin migración. `LeaderboardModal` gana un
selector Países/Banderas (mismo `GameTypeToggle` que la Fase 2) que decide
el scope consultado.

**Hallazgo de rendimiento (Fase 4, resuelto en una rama aparte):** al
rendirse en un rush de "Todo el mundo" hay que registrar hasta ~150 países
no encontrados de golpe. Llamar a `attemptCountry` uno por uno habría
repetido el guardado completo en `localStorage` (`JSON.stringify` +
`setItem` de la fila entera) ~150 veces para un solo evento del usuario. Se
resolvió en `perf/batch-country-attempts` (mergeada a `main` antes de
continuar): `registerCountryAttempts`/`saveReviewResults` en
`learning-storage.ts` aplican el cálculo de varios países y persisten una
sola vez; `attemptCountries` (plural) en `useGame.ts` expone esto con
despacho único. Benchmark con un perfil realista (~33 KB, 150 países):
~27 ms/150 guardados antes → ~4 ms/1 guardado después.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
