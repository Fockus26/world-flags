# D030 · UX · Orden Países→Banderas en el selector; usuario nuevo arranca en Países, config vieja sin `gameType` migra a Banderas · Implementado

En la UI (Fase 2), Países aparece **primero**: `GAME_TYPES = ["countries",
"flags"]`. Un usuario nuevo (sin `lastConfiguration` nunca guardada) arranca
en Países: `DEFAULT_GAME_TYPE = "countries"`.

Una configuración guardada **antes** de que existiera el modo Países no trae
`gameType`: `migrateConfiguration` la migra a `"flags"`, no al default de
usuario nuevo — quien ya jugaba Banderas no debe verse cambiado de juego de
golpe en su próxima visita. `updateLastConfiguration` (que arma la config
completa cuando no hay ninguna previa) sí usa `DEFAULT_GAME_TYPE`, porque ese
caso — literalmente no hay config guardada — es el de un usuario nuevo.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
