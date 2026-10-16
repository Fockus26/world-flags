# fix/ranking-cache-bordes — F6 (P56) · PR #80 · D198 · changeset patch

- (a) Reinicio de juego/continente al abrir `LeaderboardModal` movido al render (`openKey`/`lastOpenKey`); la ref del anuncio se limpia en un efecto con dep `openKey`. Reabrir con caché vencida: 1 petición (main: 2, medido).
- (b) `leaderboardCache.subscribe(listener)` (scope en `invalidate`, `null` en `clear`). El modal abierto recarga su scope sin skeleton ni anuncio; solo vale la última petición; si falla con filas a la vista, se quedan.
- Tests +6 en `tests/unit/leaderboard-cache.test.ts`. Puertas: astro check 0 errores, biome limpio en lo tocado, 269 pass/1 skip, build ok. axe 0 en el diálogo.
- Abierto: ¿`clear()` debe avisar? Se eligió que sí (cambio de nombre/avatar con el modal abierto).
