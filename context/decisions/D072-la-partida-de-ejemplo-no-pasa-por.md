# D072 · Arquitectura · La partida de ejemplo **no pasa por `useGame`** · Implementado

**Resumen:** La partida de ejemplo **no pasa por `useGame`**: `SessionRuntime` (`session/session-runtime.ts`) es prop **obligatoria** de `CountriesPractice`; `FlagGame` inyecta `useGame()` (lo cumple por estructura) y el tutorial un sandbox en memoria sin salida a `learning-storage`. Tests: escrituras a `localStorage` contadas (0) + guardia estructural sobre los imports del tutorial

**El problema.** Todo el flujo normal de partida persiste en cada paso:
`saveReviewResult`/`registerCountryAttempt` (historial SRS),
`registerCountryPracticed` (candado "practicado hoy"), `registerRegionGame`
(nota del continente), `registerRegionBestTime` (mejor marca y, en mundo, el
**ranking público** vía `upsertLeaderboardEntry`), `registerSessionOutcome` +
`createSessionRecord` (stats e historial), `touchActiveDay` (la racha) y la
evaluación de logros. Encima, `GameEffects` sube `learningData` a Supabase con
cada cambio. Casi todas esas funciones llaman a `saveLearningData` por dentro:
no basta con no despachar a Redux.

**Lo que NO se hizo:** un flag "si es el tutorial, no guardes" dentro de
`useGame`. Se olvidaría en el siguiente cambio y nada lo avisaría: el progreso
se movería en silencio.

**Lo que se hizo.** `components/game/session/session-runtime.ts` define
`SessionRuntime`: exactamente lo que una pantalla de sesión necesita del exterior
(`activeGame`, `learningData` de solo lectura, `exitGame`, `finishGame`,
`gradeCountryReview`). `CountriesPractice` lo recibe como **prop obligatoria**,
sin valor por defecto, y ya no llama a `useGame`.

- `FlagGame` inyecta el `useGame()` real, que cumple el contrato **tal cual, por
  estructura**, sin adaptador.
- El tutorial inyecta `useSandboxRuntime()`: estado en memoria
  (`utils/tutorial-sandbox.ts`, puro y sin React) que no tiene forma de escribir
  en ningún sitio. `finishGame` guarda el resultado para el paso de cierre;
  `gradeCountryReview` solo cuenta tarjetas.
- El sandbox juega sobre un `createDefaultLearningData()` propio, **nunca el del
  usuario**: la sesión no puede ni leer datos reales, y las tres tarjetas se
  comportan igual para todo el mundo (sin historial SRS previo que cambie cuántas
  veces se repite una tarjeta).
- `preparedCountries` se calcula **al empezar**, no por render: con
  `order: "random"` (que el recorrido deja elegir), `prepareCountries` baraja con
  `Math.random` y recalcularlo reordenaría las tarjetas a mitad de partida.

**Las aserciones** (`tests/unit/tutorial-sandbox.test.ts`), que son la parte que
impide que esto se rompa en silencio:

1. **Comportamiento:** se siembra progreso real con las funciones reales (que
   persisten), se juega la partida guiada entera sobre un `localStorage` que
   **cuenta escrituras**, y se comprueba que el contador no sube y que lo
   guardado queda byte a byte igual.
2. **Estructura:** ningún archivo del tutorial ni `CountriesPractice` importa
   nada capaz de escribir progreso (lista explícita: `useGame`,
   `setLearningData` y las funciones de `learning-storage` que guardan). Se miran
   los **imports**, no el cuerpo: es donde ESM obliga a declarar todo lo que
   entra, y así los comentarios que nombran `useGame` para explicar por qué NO
   está no dan falsos positivos. Es lo que atrapa la regresión del futuro.
3. `runtime` está declarada sin `?` y sin valor por defecto.

`Session.tsx` (Banderas/Capitales) y `CountriesRush.tsx` **siguen llamando a
`useGame`**: el tutorial no los monta, y meterlos en el contrato sin necesidad
habría tocado tres archivos más de una unidad que no los necesita. Si un paso
futuro del recorrido los usa, se extienden entonces.

**Lo único que el tutorial sí escribe** es su propia marca de "visto", al
cerrarse (D071). No toca `learningData`.

**Rama:** `feat/tutorial-inicial`

_Contexto común de la unidad (antes `17-tutorial-inicial.md`): en D071._
