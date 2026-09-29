# D036 · Logros · Los logros existentes siguen siendo de Banderas · Implementado

**Resumen:** Los logros existentes siguen siendo de Banderas; `rush_impecable`/`sin_frenos` filtran además `(session.gameType ?? "flags") === "flags"`. 4 logros nuevos de Países

Los logros existentes en `src/utils/achievements.ts` siguen siendo de
Banderas (leen `data.countryHistory`/`data.regionBestTimes` de primer nivel,
que es Banderas — no se tocaron). De los que recorren `sessionHistory`
filtrando `mode === "competitive"`, dos necesitaban filtro adicional porque
ahora el rush también puede ser de Países: `rush_impecable` y `sin_frenos`
ahora exigen además `(session.gameType ?? "flags") === "flags"`.
`a_contrarreloj` no se tocó: lee `regionBestTimes` de primer nivel, que sigue
siendo exclusivamente de Banderas.

`SessionRecord` ganó `gameType?: GameType`, **opcional** y no
`AchievementId`-como-estrecho: un registro sin este campo (guardado antes de
esta versión) se trata como `"flags"` en todo el código que lo lee — nunca se
debe desestructurar `session.gameType` sin el `?? "flags"`. Mismo espíritu
que D021 (ids de logro como `string`, no como el tipo estrecho): un dato que
puede faltar en registros viejos no se puede tratar como si siempre estuviera.

Los 4 logros nuevos de Países (Fase 7): `mapa_mental_europa` (continentes,
sobre `countriesGame`), `primer_tablero` (completar cualquier rush de
países), `mundo_de_memoria` (completar el rush de "Todo el mundo" en
Países) y `primero_los_paises` (un continente aprendido en los dos juegos a
la vez — meta). Todos verificados con aserciones puras y, `primer_tablero` y
`mapa_mental_europa`, también viéndolos desbloquearse en vivo en el
navegador durante la Fase 7.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
