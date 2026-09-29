# D121 · Arquitectura · El juego de la partida de ejemplo se elige en `TutorialSettings` (Países por defecto, `GAME_TYPES`/`GAME_TYPE_LABELS`) · Implementado

**Resumen:** El juego de la partida de ejemplo se elige en `TutorialSettings` (Países por defecto, `GAME_TYPES`/`GAME_TYPE_LABELS`). `Session.tsx` recibe `runtime: SessionRuntime` **obligatoria** como `CountriesPractice` (`FlagGame` inyecta `useGame()`, el tutorial el sandbox); `SessionRuntime` gana `attemptCountry` (sandbox: solo cuenta). Tests: 0 escrituras con los tres juegos + guardias de imports y de prop obligatoria sobre `Session`

**Selector.** `TutorialSettings` gana un `Fieldset` "Juego" arriba de Orden,
Dificultad y Temporizador, con el mismo patrón (`OptionTile`, `name` propio
`tutorial-game-type`) y las mismas constantes que el selector de la
configuración (`GAME_TYPES`, `GAME_TYPE_LABELS`): Países, Banderas, Capitales,
en ese orden (D030/D066). Entra en la configuración del sandbox
(`configuration.gameType`); por defecto, Países, como hasta ahora. El paso pasa a
llamarse "Juego y ajustes". Los tres países siguen siendo Norteamérica (D074) y
el modo sigue siendo Práctica (D073).

**Banderas y Capitales por el sandbox.** Hasta ahora `Session.tsx` llamaba a
`useGame()` por dentro (D072 lo dejaba así porque el tutorial no la montaba).
Ahora recibe `runtime: SessionRuntime` como **prop obligatoria**, igual que
`CountriesPractice`, y `exitDescription?` para el aviso de abandonar:

- `FlagGame` inyecta el mismo `useGame()` que ya pasaba a `CountriesPractice`.
  El juego real no cambia: es el mismo objeto con las mismas funciones.
- `SessionRuntime` gana `attemptCountry`, que `Session` usa en su competitivo.
  `useGame()` ya lo tenía (lo cumple por estructura); el sandbox lo implementa
  con `recordSandboxAttempts`, que solo cuenta. La partida guiada nunca es
  competitiva, pero el contrato no deja huecos.
- El tutorial monta `CountriesPractice` si el juego es Países y `Session` si no,
  como hace `FlagGame` en Práctica.
- Las instrucciones del paso de la partida dependen del juego
  (`DEMO_INSTRUCTIONS: Record<GameType, …>`, D061): `TutorialStep.body` admite
  una función del juego.

**Tests** (`tests/unit/tutorial-sandbox.test.ts`): la partida entera a cada uno
de los tres juegos (con intentos y calificaciones) deja `localStorage` sin una
escritura y byte a byte igual; el ejemplo por defecto es Países; la guardia de
imports cubre ahora `Session.tsx`, `session-cards.tsx` y `usePracticeQueue.ts`;
y la de "prop obligatoria" se aplica a `CountriesPractice` y a `Session`.

**Alternativa descartada:** un `SessionRuntime` ampliado solo para `Session`
(`CardSessionRuntime`). Dos contratos para lo mismo; `attemptCountry` no escribe
nada en el sandbox, así que no hay riesgo en tenerlo en el común.

**Rama:** `feat/tutorial-modo-de-juego`

_Contexto común de la unidad (antes `29-tutorial-modo-de-juego.md`): en D120._
