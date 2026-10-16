# fix/contraste-secondary-danger (F3) · PR #81

- Button contained secondary/danger: relleno = token `-hover`; hover/pulsado = `color-mix(in oklab, <-hover> 86%, black)` (D195). Claro: Práctica diaria 4,34 → 5,69 (hover 7,73); Sí, abandonar 4,09 → 5,55 (hover 7,59). Oscuro ≥6,2 en todos los estados.
- getScoreColor oscuro: L 68 % salvo tono <4,8:1 → se aclara (solo nota 1, L 70 %, 4,57 → 4,88) (D196). Claro sin cambios.
- Test `tests/unit/score-contrast.test.ts`. COLORS.md actualizado. Changeset patch `contraste-botones-y-nota.md`.
- axe limpio claro/oscuro en modal abandonar, Resultados nota 1, Configuración con Práctica diaria. Capturas en `context/plans/shots-F3/`.
- PENDIENTE escalado: en claro la nota como texto falla de la 3 a la 10 (2,1–3,8:1) en Resultados; opciones en D196. Coordinar con F4 (toca Results.tsx).
