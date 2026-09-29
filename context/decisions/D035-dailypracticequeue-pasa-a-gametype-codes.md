# D035 · Persistencia · `dailyPracticeQueue` pasa a `{ gameType, codes } \| null`: la práctica diaria es por juego · Implementado

`dailyPracticeQueue` pasa de `string[] | null` a `{ gameType, codes } |
null` (`gameSlice.ts`). El botón "Práctica diaria (N)" cuenta los vencidos
del juego seleccionado (`toGameView` sobre `getDueCountries`), y
`finishDailyPractice` guarda `gameType` en el `SessionRecord` leyendo el de
la cola en curso — no el de la configuración actual, que pudo cambiar
mientras la cola seguía abierta.

Para Países, `DailyPractice.tsx` reemplaza `FlagDisplay` por
`CountryClozeCard` (D034) en estado `"target"`/`"revealed"`; el nombre
revelado ya se ve en el tablero, así que no se repite como texto aparte.
Resto del flujo (revelar con Espacio/tocar, calificar con 1-4 o los
botones) idéntico a Banderas.

Verificado de punta a punta en el navegador (Fase 6): países vencidos
inyectados a mano en `localStorage`, la cola mostró la tarjeta cloze
correcta para cada uno, reveló y calificó bien, y cerró la sesión.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
