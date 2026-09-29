# D020 · Persistencia · `mergeLearningData` (objeto entero) sustituye a `mergePracticeState`; `syncOnLogin` compara entero · Implementado

**Resumen:** `mergeLearningData` (objeto entero) sustituye a `mergePracticeState`; `syncOnLogin` compara entero. Contadores por `max`, **nunca suma** (duplicaría en cada recarga)

Antes se fusionaban dos campos sueltos y `syncOnLogin` los comparaba **uno a uno**
con `JSON.stringify` para decidir si re-subir. Añadir un campo obligaba a tocar
tres sitios, y **olvidar el tercero fallaba en silencio**: el merge se quedaba en
el dispositivo y se perdía en el siguiente.

Ahora se fusiona el objeto entero y se compara entero. El orden de claves de
`mergeLearningData` replica el de `normalizeLearningData` a propósito, para que
la comparación no dé siempre distinto.

| Campo | Regla |
|---|---|
| `profile`, `countryHistory`, `regionGameScores`, `lastConfiguration` | gana lo remoto (sin cambios) — **actualizado en D048/D049/D055** (D048–D056): `countryHistory` por la revisión más reciente; los otros tres por la fecha de su último cambio (o, sin fecha, contra la base de sincronización). Y el invitado que entra en una cuenta con progreso ya no se fusiona en nada: se descarta (D056) |
| `regionBestTimes` | menor tiempo |
| `lastPracticeByCountry` | fecha más reciente por país |
| `achievements` | unión por id; `unlockedAt` **el más antiguo**; `seenAt` gana el no-null |
| `stats.activeDays` | unión de conjuntos |
| `stats.*` contadores | `max(remoto, local, derivado del historial fusionado)` |
| `sessionHistory` | concat → dedup por id → orden desc → tope |

**Sumar contadores está prohibido.** `syncOnLogin` corre en cada hidratación
autenticada (o sea, en cada recarga) y `local` ya contiene lo que se subió la vez
anterior: sumar duplicaría sin techo. `max` es monótono e idempotente pero
sub-cuenta si dos dispositivos jugaron sin conexión a la vez; de ahí el tercer
candidato, derivado del historial ya fusionado, que recupera justo ese caso.
Hay prueba de idempotencia: `merge(merge(r,l),l) === merge(r,l)`.

`hasLearningProgress` también mira ahora logros e historial: si no, una cuenta
cuyo progreso fuera solo logros se consideraría vacía y `syncOnLogin` la pisaría.

_Contexto común de la unidad (antes `05-logros.md`): en D016._
