# D235 · UX · Lotes: solo cuenta su sesión, hasta 3 sesiones al día, consolidación de 2 días o 3 aciertos el mismo día, y sus países fuera de la diaria · Implementado

**Sustituye partes de D185:**
- Que el acierto cuente venga de donde venga.
- El candado «practicado hoy» en la sesión del lote.
- La regla de consolidación, solo de dos días.
- Que los lotes en curso se repasen en la diaria.

**Decisiones del dueño (2026-11-05):**
- Solo cuenta la sesión del lote.
- Hasta 3 sesiones al día, opcionales.
- Los países del lote en curso y de los siguientes no salen en la diaria hasta consolidarse.
- Regla confirmada: 2 aciertos a la primera en días distintos, **o** 3 el mismo día separados al menos 4 h.
- El ajuste va en el panel: un botón «Hacer otra sesión hoy», sin interruptor en Configuración.

- **Qué cuenta:** solo el acierto a la primera (nota distinta de «Otra vez») en la sesión del lote (`activeGame.isLearningPath`). La práctica diaria y la práctica libre siguen calificando SM2, pero no suman al lote.
- **Aciertos con hora:** `progress[code].passes` guarda los instantes (ISO) de los aciertos que contaron, como mucho 6. Un acierto a menos de 4 h del anterior no suma. Se sigue escribiendo `passDays` para los clientes viejos.
- **Consolidar:** `meetsLearningPathConsolidation`. Basta con 2 días distintos, o con 3 aciertos del mismo día separados al menos 4 h.
- **Qué toca ahora (`todayCodes`):** los pendientes del lote sin acierto en las últimas 4 h. El candado «practicado hoy» de los otros modos ya no bloquea el lote, y `startGame` no lo aplica a la sesión del lote.
  - Un día de acierto de hoy sin hora (registro anterior) cuenta como reciente.
  - Un acierto «posterior» a la hora con la que se pinta también cuenta como reciente.
- **Sesiones al día:** `path.sessions` guarda las sesiones del lote terminadas (las 6 últimas); abandonar no cuenta.
  - **Repetir los fallados no gasta una de las tres** (decisión del dueño tras la QA). La primera del día siempre cuenta. Después, una sesión cuenta solo si trae algún país ya acertado hoy (`learningPathSessionCountsTowardLimit`, `activeGame.isLearningPathRetry`). Así, repetir en el acto lo fallado no cierra la vía de los tres aciertos el mismo día.
  - La primera del día es «Seguir aprendiendo».
  - Después, «Hacer otra sesión hoy (n)», hasta 3 al día, en el panel y en Resultados.
  - Si lo que falta se acertó hace menos de 4 h y hoy aún quedan sesiones (`status.canComeBackLater`, también de madrugada sin sesión hoy), el panel y Resultados dicen «Vuelve en unas horas para otra sesión, o mañana».
  - Tras la 3.ª, «Por hoy está listo».
- **Hora en el panel:** `useMinuteTick` da a `Configuration` la hora como estado, renovada cada minuto y al volver a la pestaña, y se pasa a `getLearningPathOverview(gameType, now)`. Así el botón aparece cuando pasan las 4 h sin tocar nada, y React Compiler no congela un `new Date()` dentro del render.
- **Diaria:** `getDueCountries(history, getLearningPathReservedCodes(path))` deja fuera los no consolidados del lote en curso y de los siguientes, tanto en «Práctica diaria (n)» como al empezarla. Las dos usan el recorrido recalculado (D189), así el número y la cola coinciden.
- **Reloj adelantado:** los aciertos y las sesiones con fecha más allá de `now` + 5 min se ignoran al leer, al registrar y al fusionar (`plausibleTimes`). Antes, un acierto con el reloj adelantado bloqueaba el lote hasta esa fecha en todos los dispositivos. Al abandonar el recorrido vuelven solos.
- **Fusión entre dispositivos:** se unen las horas de acierto y las sesiones de los dos lados. Si juntas cumplen la regla, se consolida con la última. Un lado sin `passes` (cliente viejo, que lo pierde al normalizar) no borra las del otro. `consolidatedAt` sigue mandando para los clientes viejos.
- **Datos:** todo va en el `jsonb` de `learning_paths`, sin migración.

**QA (`functional-qa`, 2026-11-05):** 0 críticos, 0 altos, 3 medios y 4 bajos. Corregidos: el reloj adelantado, la sesión extra inmediata (decisión del dueño), el número de la diaria con un ya sabido degradado, los textos de «mañana» y las sesiones del futuro. Queda fuera, porque ya existía antes: dos pestañas de invitado se pisan el estado. Repros en `.qa/repro/17…22`.

**Por qué:** antes, un acierto en la diaria o en la práctica libre consolidaba países del lote sin pasar por él, los países del lote salían también en la diaria, y quien quería avanzar más rápido tenía que esperar al día siguiente.

**Alternativa descartada:**
- Exigir siempre 3 aciertos (el dueño eligió mantener la vía de 2 días).
- Un interruptor en Configuración › Juego, difícil de encontrar.
- Un ajuste en `LearningPathModal`, que obliga a reabrirlo.

**Verificación:**
- `tests/unit/learning-path.test.ts` (40):
  - Consolidar en el mismo día y no sumar a menos de 4 h.
  - Registro viejo sin hora.
  - Sesiones al día y su límite.
  - Países reservados.
  - Fusión de horas y sesiones, también con un lado viejo.
  - Normalizar con y sin los campos nuevos.
- `.qa/lotes-probe.mjs`, con reloj simulado sobre el build local:
  - Tres sesiones el mismo día consolidan el lote.
  - Tras la 3.ª no hay más.
  - La diaria no trae los países del lote, y al abandonarlo vuelven.
  - La práctica libre no suma.
