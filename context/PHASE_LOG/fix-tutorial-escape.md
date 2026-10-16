# fix/tutorial-escape — P45 (W7, tanda 2026-10-12) · PR #75

- Causa: el Escape de React Aria escucha keydown en el diálogo; con el foco en <body> no llega. El foco cae a <body> al responder una tarjeta en la partida de ejemplo (AnswerForm deshabilita el input) y a veces tras un clic en el fondo.
- Arreglo: listener en document dentro de Tutorial + `isLostFocusEscape` (pura, testeada). D193. Changeset patch.
- Verificado con Playwright sobre el build (servidor estático propio: astro dev/preview no arrancaron en wt4).
- Hallazgo aparte: en toda partida, responder deja el foco en <body> (AnswerForm). WCAG 2.4.3; no se toca aquí.
