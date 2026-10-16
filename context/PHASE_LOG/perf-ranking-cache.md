# perf/ranking-cache — W3 tanda 2026-10-12 · PR #70

- `src/utils/leaderboard-cache.ts` (nuevo): caché en memoria por scope, TTL 60 s, promesa en vuelo compartida, errores no cacheados; respuesta tras invalidar no se guarda.
- `LeaderboardModal`: acierto de caché → sin skeleton ni LoadingAnnouncer; anuncio D141 se mantiene; demo `?demo-ranking` fuera de la caché.
- Invalidación: `upsertLeaderboardEntry` ok → scope; `syncLeaderboardProfile` con escritura → todo; `AuthEffects` cambio de `user.id` → todo.
- Sin conexión: igual que D052 (no se muestra la caché). D188.
- Verificado: Playwright contra dev 4303 → abrir/Europa/mundo/Europa/reabrir = 1 petición por scope.
