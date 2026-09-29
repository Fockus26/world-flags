# D182 · Animación · Bloque que aparece o se va dentro de una vista: `AutoHeight` con `grid-template-rows` 0fr → 1fr · Implementado

> Antes D009 en `03-animaciones.md`: ese ID ya era otra decisión en el índice, así que se renumeró al pasar a un archivo por decisión.

**Decisión:** Cambios de alto por contenido condicional (aparece/desaparece un bloque dentro de una vista ya montada — ej. confirmar contraseña en registro, los ajustes de práctica al cambiar de modo, la fila de duración del temporizador) → `src/components/ui/AutoHeight.tsx`, truco `grid-template-rows: 0fr → 1fr`. Distinto de D181: esto no es cambiar de vista, es un bloque que crece/encoge dentro de la misma. El contenido queda siempre montado (colapsado con `overflow-hidden`) y se marca `inert` mientras está colapsado. Nota: al quedar siempre montado, el `gap` del contenedor flex/grid que lo envuelve sigue contando ese hueco aunque esté colapsado a 0 — deja un margen residual pequeño (el valor del `gap`) en el lado colapsado. Se aceptó a cambio de no tener que medir con `ResizeObserver`; si algún día molesta visualmente, la solución es mover ese espaciado adentro del propio `AutoHeight` en vez de depender del `gap` del padre.

_Contexto común de la unidad (antes `03-animaciones.md`): en D006._
