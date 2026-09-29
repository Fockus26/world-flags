# D028 · Persistencia · Modo Países: `countriesGame: GameProgress` como sub-objeto de `UserLearningData` · Implementado

**Resumen:** Modo Países: `countriesGame: GameProgress` como sub-objeto de `UserLearningData`; los campos de primer nivel siguen siendo los de Banderas. Columna nueva `countries_game` en Supabase

Se añadió `countriesGame: GameProgress` (`src/types/progress.ts`), con
`GameProgress = { countryHistory, regionGameScores, regionBestTimes,
lastPracticeByCountry }`. Los campos de primer nivel de `UserLearningData`
**siguen siendo los de Banderas** — no se renombraron.

Alternativa descartada: renombrar los campos de primer nivel a algo neutro
(`flagsGame`/`countriesGame` simétricos) y migrar. Se descartó porque una
migración de columnas de Supabase en filas ya en producción es más riesgosa
que añadir una columna nueva, y porque un cliente viejo con el service worker
cacheado (ver `CLAUDE.md`) seguiría escribiendo en los nombres viejos — igual
que ya se decidió para los ids de logro en D021.

Lo compartido entre juegos no se duplicó: `profile`, `lastConfiguration`,
`achievements`, `stats`, `sessionHistory` siguen siendo los mismos objetos
para los dos juegos. En Supabase: una columna nueva, `countries_game jsonb not
null default '{}'::jsonb` (`supabase/countries-game.sql`). Mismo riesgo de
despliegue que `achievements.sql` (D acción manual en `CURRENT_PHASE.md`): si
el cliente pide la columna antes de que exista, `fetchRemoteLearningData`
falla y el usuario autenticado cae al fallback de `localStorage`.

**Un cliente viejo (SW cacheado) que no conoce `countriesGame` es seguro**:
`pushLearningData` hace un `upsert` enumerando columnas explícitas — un
cliente que no manda `countries_game` en el objeto simplemente no la incluye
en el `upsert`, así que Postgres conserva el valor que ya tenía la fila. No
hay forma de que un cliente viejo borre el progreso de Países de otro
dispositivo.

## Contexto común de la unidad (antes `07-modo-paises.md`)

> Rama experimental `feat/modo-paises`. Cubre D028–D038 (ver
> `context/plans/modo-paises.md` para el plan completo con las 7 fases, todas
> cerradas). Verificado en el navegador real (`bun run dev`, con permiso
> explícito del dueño) además de con `bunx astro check`/`bun run build`/
> `bunx biome check`/aserciones puras — ver el detalle de cada decisión.

### Por qué

`PROJECT_CONTEXT.md` dice que aprender las banderas es más fácil si primero se
sabe qué países hay en cada continente. Hasta ahora solo existía el juego de
banderas. Este modo reutiliza casi todo el flujo existente (alcance,
práctica/competitivo, práctica diaria, SRS, logros, ranking) y solo cambia la
tarjeta: un tablero de países en vez de una bandera.
