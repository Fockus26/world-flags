# D132 · UX · Sustituye la línea de castigo de D075: el "+10 s"/"+20 s" sale del aviso de fallo y sube junto al cronómetro del rush · Implementado

**Resumen:** Sustituye la línea de castigo de D075: el "+10 s"/"+20 s" sale del aviso de fallo y sube junto al cronómetro del rush (`PenaltyBadge`, `text-danger-hover`, `tw-animate-css`); el cronómetro salta (`zoom-in-125`, `key` por castigo) y `applyPenalty` lo repinta al momento aunque el intervalo esté en pausa. Reloj de `Session` con `performance.now()` (P15). La partida guiada es de práctica: sin castigo

Sustituye la parte de D075 que decía el castigo dentro del aviso de fallo
(`AnswerForm.penaltyLabel`, que desaparece). La regla (+10 s fallo, +20 s
salto, constantes en `types/country.ts`) no cambia.

- **Dónde.** `Header` envuelve el cronómetro del rush en un `relative` y pinta a
  su izquierda (`absolute right-full`) un `PenaltyBadge` por castigo:
  `formatPenalty` ("+10 s"), `text-danger-hover` (el tono de texto de danger que
  pasa AA en claro y oscuro, `COLORS.md`), `font-extrabold tabular-nums`. Queda
  en el hueco entre el contador y el cronómetro, fuera del flujo: no empuja nada
  ni cambia el alto de la cabecera.
- **Texto.** "+10 s" y no "+10" a secas: el cronómetro también lleva la "s" por
  debajo del minuto, y sin unidad se podía leer como diez puntos o diez
  tarjetas. Alternativa: "+10", tal cual lo escribió el dueño.
- **Animación** (`tw-animate-css`): el badge entra subiendo
  (`fade-in-0 slide-in-from-bottom-3`, 200 ms), se queda y sale hacia arriba
  desvaneciéndose (`fade-out-0 slide-out-to-top-3 fill-mode-forwards`, 300 ms).
  El cronómetro "salta": su `span` lleva `key` = id del último castigo y
  `zoom-in-125` (de 125 % a 100 % en 300 ms), así que cada castigo lo remonta y
  rearranca la animación.
- **El número salta junto al "+10 s", no 900 ms después.** El intervalo del
  cronómetro está congelado durante la pausa entre tarjetas (`pauseThenAdvance`),
  así que antes el castigo solo se veía al avanzar. `applyPenalty` en `Session`
  resta el castigo al `startTimeRef` **y** hace `setElapsedMs` al momento. El
  tiempo final es el mismo: la pausa se sigue descontando al reanudar.
- **Reloj monótono (de P15).** Todo el reloj de `Session` (inicio, cronómetro,
  castigos, pausa entre tarjetas y la del modal de abandonar) mide con
  `performance.now()` en vez de `Date.now()`: si la hora del sistema cambia a
  mitad del rush (ajuste manual, sincronización NTP), el tiempo ya no salta ni
  sale negativo. Solo se usan diferencias, así que el tiempo final es el mismo.
  `finishedAt` sigue siendo `new Date()` (es una fecha, no una duración).
- **Tutorial.** La partida guiada monta el mismo `Session`, pero siempre en
  práctica (`TUTORIAL_CONFIGURATION.mode = "practice"`; elegir "Competitivo" en
  el paso de modo solo explica qué implica): allí no hay cronómetro ni castigo,
  así que el "+10 s" no aparece. Verificado en el navegador. Si algún día la
  partida guiada se juega en competitivo, lo hereda sin código aparte.

**Rama:** `feat/castigo-animado`

## Contexto común de la unidad (antes `32-castigo-animado.md`)

> Unidad `feat/castigo-animado` (P10 de `plans/pendientes.md`). Del dueño: que el
> "+10 s al cronómetro" salga del aviso de fallo y aparezca un "+10" / "+20" al
> lado del cronómetro con una animación de suma, con CSS (no framer, D006),
> respetando `prefers-reduced-motion` y anunciado en `aria-live`. El resto,
> decisiones del agente justificadas aquí.
