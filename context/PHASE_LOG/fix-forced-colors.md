# fix/forced-colors · D207 · PR #108

- `OptionTile`: en forced-colors la opción marcada → `forced-color-adjust: none` + Highlight/HighlightText, foco CanvasText.
- `Button`: `forced-colors:border` (1 px ButtonText solo en ese modo).
- Verificado con Playwright `forcedColors` claro/oscuro (Configuración › Juego, lotes, rendirse, Resultados del rush rendido, error). Sin forced: estilos computados idénticos antes/después.
- axe: `color-contrast` en Cancelar/Empezar con forced oscuro es preexistente y falso positivo (color computado #fff sobre #000).
- Pendiente fuera de la unidad: botones de `ErrorBoundary.tsx` sin borde en forced-colors (para W2).
