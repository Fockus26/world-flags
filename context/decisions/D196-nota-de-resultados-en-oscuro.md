# D196 · Accesibilidad · Nota de Resultados en oscuro: ≥4,5:1 para las 10 notas, aclarando solo el tono que no llega · Implementado (oscuro) · Pendiente (claro)

**Resumen:** en oscuro, el color de la nota (`getScoreColor`, L 68 %) sobre su fondo (`getScoreBackgroundColor`, L 22 %) daba 4,57:1 en la nota 1 (rojo) — al filo; QA lo midió en 4,39:1 durante la entrada animada. Ahora la luminosidad en oscuro es 68 % salvo en el tono que no llega a 4,8:1 contra su fondo, que se aclara de 1 en 1 hasta llegar. Decisión del dueño 2026-10-12: P52.2 (a).

**Decisión:**
- `src/utils/score.ts`: `darkScoreLightness(hue)` calcula el contraste WCAG del `hsl()` y sube L desde 68 % hasta `DARK_SCORE_MIN_CONTRAST` (4,8:1: 4,5 + margen). Hoy solo cambia la nota 1 (L 70 %, 4,88:1); las notas 2–10 siguen en L 68 % (4,96–6,15:1) y los fondos no cambian.
- En claro no cambia nada. `getScoreMessage` y `Results.tsx` no se tocan (F4, ola B).
- `RegionOption` usa la misma función para borde, anillo y casilla (no texto): la nota 1 en oscuro se ve un punto más clara allí también.
- Test `tests/unit/score-contrast.test.ts`: recorre 1–10 en oscuro (≥4,5:1, calculado aparte de `score.ts`) y comprueba que claro sigue igual.

**Medido en el navegador (nota 1, Resultados):** oscuro `rgb(234,123,123)` sobre `rgb(83,29,29)` = 4,88:1 (antes `rgb(232,115,115)` = 4,57:1); claro 5,38:1 sin cambios. axe limpio en los dos temas.

**Pendiente escalado (claro, fuera de la decisión del dueño):** en claro el color de la nota (L 42 %) sobre su fondo (L 94 %) **falla como texto** de la nota 3 en adelante: 3 → 3,81; 4 → 2,98; 5 → 2,30; 6 → 2,09; 7 → 2,22; 8 → 2,32; 9 → 2,39; 10 → 2,42:1. El número (1,8 rem, texto grande) necesita 3:1 y falla de la 4 a la 10; "/10" (`text-body-sm`) necesita 4,5:1 y falla de la 3 a la 10. Contradice la nota de `COLORS.md` ("NUNCA para el texto"), que se escribió para `RegionOption`. Opciones para el dueño:
1. Bajar la L del texto en claro por tono (mismo cálculo que en oscuro, hacia abajo). Pro: arreglo de una función. Contra: también oscurece borde/anillo de `RegionOption` en notas medias/altas, salvo que se separe una función solo para texto.
2. El número y "/10" en `text-surface-soft` y el color de la nota solo en el borde y el fondo del círculo. Pro: como `RegionOption`; contraste de sobra. Contra: se pierde el número coloreado; toca `Results.tsx` (coordinar con F4).
3. Texto del círculo con `color-mix(in oklab, <nota> 62%, var(--foreground))` (el `readableFg` de `Button`). Pro: conserva el tono. Contra: hay que medir las 10 notas; toca `Results.tsx`.

**Alternativas descartadas (oscuro):**
- Subir L para todas las notas: cambia el aspecto de las que ya pasan de sobra (pedido explícito de no hacerlo).
- Objetivo exacto 4,5:1: con L 68 % la nota 1 ya daba 4,57 en reposo y el fallo medido era de la entrada animada; sin margen no habría cambio visible.

**Rama:** `fix/contraste-secondary-danger`
