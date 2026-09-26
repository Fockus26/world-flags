# Decisiones — Reloj de la práctica diaria y limpieza de `flagEnter`

> Arreglo, rama `fix/practica-diaria-reloj` (P22 y P26, tanda 2026-09-26 b). P22: la
> práctica diaria medía con `Date.now()`, a diferencia de `Session` (D132). P26: el dueño
> decidió **borrar** `motionVariants.flagEnter`, sin uso desde D153.

| ID | Decisión | Razón | Estado |
|---|---|---|---|
| D165 | `DailyPractice` mide con `performance.now()`: el ref de inicio se toma al montar (`useRef(performance.now())`) y `elapsedMs` es `performance.now() - inicio` al terminar la cola. `finishedAt` no existe en este resumen; donde exista sigue siendo fecha real (`new Date()`). Se borra `motionVariants.flagEnter` de `src/styles/animations.ts` (comprobado con `grep`: ningún consumidor en `src/` ni `tests/`); el resto de variantes se conserva | `performance.now()` es monótono: un cambio de hora del sistema (manual o por sincronización) a mitad de la práctica ya no da un tiempo negativo o de horas. Mismo tiempo final en condiciones normales. `flagEnter` era legado de framer sin uso (D153 lo señaló). Alternativa: guardar el inicio en un `useEffect` como `Session` (con `null` inicial); se descartó porque aquí no hay pausas ni cronómetro visible y el valor del primer render ya es el del montaje | Implementado (`fix/practica-diaria-reloj`) |
