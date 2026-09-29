# D167 · UX · La práctica de Países mide con `performance.now()` (inicio, pausa del modal de abandonar y `elapsedMs`), como D132/D165 · Implementado

**Resumen:** La práctica de Países mide con `performance.now()` (inicio, pausa del modal de abandonar y `elapsedMs`), como D132/D165; `finishedAt` sigue siendo fecha real

**Decisión:** La práctica de Países mide con `performance.now()`: el inicio (al montar), la pausa del modal de abandonar y `elapsedMs` al terminar. `finishedAt` sigue siendo fecha real (`new Date()`)
**Por qué:** Como `Session` (D132) y `DailyPractice` (D165): `performance.now()` es monótono y un cambio de hora del sistema a mitad de la práctica ya no da un tiempo negativo o de horas. Las tres lecturas usan el mismo reloj, así que las restas siguen cuadrando; en condiciones normales el tiempo final es el mismo. Alternativa: `useRef(performance.now())` como D165; se dejó el `useEffect` con `null` inicial para tocar solo el reloj

**Rama:** `fix/tema-y-reloj`

_Contexto común de la unidad (antes `44-tema-y-reloj.md`): en D166._
