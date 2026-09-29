# D018 · Logros · La racha se **deriva** de `stats.activeDays`, no se guarda como contador (un contador no es fusionable) · Implementado

**Resumen:** La racha se **deriva** de `stats.activeDays`, no se guarda como contador (un contador no es fusionable). El día activo se marca al calificar, no al terminar la sesión

`stats.activeDays` es un array de fechas locales (`YYYY-MM-DD`);
`getCurrentStreak` y `getLongestStreak` son funciones puras.

Un contador `currentStreak` **no es fusionable**: un "3" en el móvil y un "3" en
el escritorio pueden ser los mismos tres días o seis distintos, y ni `max` ni la
suma serían correctos. Un conjunto de fechas se une exacto. Además, un
`currentStreak: 5` guardado miente si el último día activo fue hace cuatro días.

**El día activo se marca al calificar/responder** (dentro de `attemptCountry` y
`gradeCountryReview`), no al terminar la sesión: quien responde veinte banderas y
abandona practicó ese día igual, y así la racha funciona también en la práctica
diaria, que no pasa por `finishGame`.

_Contexto común de la unidad (antes `05-logros.md`): en D016._
