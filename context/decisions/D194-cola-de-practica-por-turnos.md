# D194 · Juego · La tarjeta en pantalla se reinicia por turno de la cola, no por código · Implementado

**Resumen:** `usePracticeQueue` guarda la cola y un contador `turn` en un mismo estado (`PracticeQueueState`) y lo avanza con la función pura `advancePracticeQueue` (`src/utils/practice-queue.ts`), que sube el turno en cada calificación aunque la tarjeta siguiente sea la misma. El hook expone `turn`. Todo lo que se reinicia "al cambiar de tarjeta" depende del turno:

- `CountriesPractice`: el efecto que libera `isGradingRef` y borra pistas y su anuncio depende de `practiceQueue.turn`; el temporizador (`useCardCountdown`, prop renombrada `cardCode` → `cardKey`) recibe `código:turno`.
- `Session` (práctica de Banderas y Capitales): la clave del temporizador es `código:turno`.

**Causa (P55, reproducida en el navegador):** con un reencolado y nada detrás, `insertRequeuedCard([], code)` deja `[code]`; `currentCode` no cambia, el efecto con deps `[currentCode]` no corre y el guard de calificación de Países quedaba en `true`: ni los botones ni 1-4 respondían y la sesión no terminaba. Pasaba siempre en un lote de países nuevos acertados con "Bien" (la última bandera vuelve sola, D186).

**Banderas/Capitales y Práctica diaria:** no se colgaban (sus guardas, `cardStepRef` e `isAwaitingGradeRef`, se liberan dentro del propio manejador, y la respuesta y el estado se limpian al calificar). Lo que sí quedaba pegado era el temporizador de `Session`: la bandera repetida seguía con el tiempo que le quedaba y, si se había agotado (saltar → "Otra vez"), se volvía a saltar sola al instante. Se arregla con la misma clave por turno.

**Lo que no cambia:** la regla de reencolado (D186), el desplazamiento de `insertRequeuedCard` y el orden de la cola.

**Alternativas descartadas:**
- Liberar el guard dentro de `handleGrade` tras llamar a `grade`: arregla el cuelgue pero deja pistas, anuncio y temporizador sin reiniciar en la tarjeta repetida.
- Prohibir que una bandera vuelva inmediatamente (meterla detrás de otra o terminar): cambia la regla de D186 y en una cola de una sola bandera no hay detrás.
- Remontar la tarjeta con `key={turn}`: reinicia todo, pero también el tablero y el foco del campo, y rompe la animación de vuelo al hueco.

**Rama:** `fix/sesion-colgada-reencolado`
