# fix/practica-diaria-reloj (X3, tanda 2026-09-26 b) — PR #45

- P22: `DailyPractice.tsx` mide con `performance.now()` (inicio al montar, `elapsedMs` al terminar). D165.
- P26: borrado `motionVariants.flagEnter` de `src/styles/animations.ts` (sin consumidores). D165.
- Changeset patch `practica-diaria-reloj.md`. Sin copy nuevo: no se usó fila de CONTENT_CHECKLIST.
  La fila 6 de CONTENT_CHECKLIST (legado de framer) menciona flagEnter vía D153: ya no existe.
- Verificación: astro check 0 errores, biome limpio en lo tocado, test 196/1 skip/0 fail, build OK.
  Sin verificar en navegador (no hay forma de forzar tarjetas pendientes como invitado).
- Fuera de la unidad: `countries/CountriesPractice.tsx` sigue con `Date.now()` (mismo problema que P22).
