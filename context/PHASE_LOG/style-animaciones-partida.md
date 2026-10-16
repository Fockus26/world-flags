# style/animaciones-partida (W6, tanda 2026-09-26) — PR #42

- P19 ★ Partida: `StimulusFrame` recibe `feedback`. Acierto = anillo verde (`stimulus-ring`, 600 ms). Fallo o salto = `ring-2 ring-danger` + sacudida ±4 px en 200 ms (`stimulus-shake`). Bandera nueva = `fade-in-0 slide-in-from-right-4`.
- Archivos: `StimulusFrame.tsx`, `FlagDisplay.tsx`, `capitals/CapitalCard.tsx`, `session-cards.tsx`, `Session.tsx` (una línea) y `global.css` (un `@theme` al final).
- Decisiones: D151–D153 en `decisions/38-animaciones-partida.md`. D152 añade el token de 600 ms a `DESIGN_TOKENS.md`.
- Changeset patch: `.changeset/animaciones-partida.md`.
- Copy: nada nuevo; la fila 49 de `CONTENT_CHECKLIST` queda sin usar.
- Señalado: `motionVariants.flagEnter` (`src/styles/animations.ts`) queda sin uso. No se borra.
- Verificado en el navegador, midiendo el DOM: sacudida, anillo, entrada, movimiento reducido, 320 px y axe en claro y oscuro. Sin capturas.
