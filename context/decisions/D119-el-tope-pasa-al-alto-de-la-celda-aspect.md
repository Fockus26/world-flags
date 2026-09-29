# D119 · UX · El tope pasa al alto de la celda: `aspect-square w-full max-h-7` · Implementado

**Resumen:** El tope pasa al alto de la celda: `aspect-square w-full max-h-7` (`CELL_CLASS`), cuadrada mientras es pequeña y como mucho 28 px de alto; más ancha que alta en pantallas anchas, sin alargar el panel (250 px de alto a 320, 740×360 y 1440). Sin `w-full` el `max-height` se traslada al ancho

Con el calendario a todo el ancho, cada columna es 1/7 del panel: una celda cuadrada
llegaría a ~120 px en escritorio (el problema que motivó el `max-w-sm` de
`fix/responsive-racha` y el tope de D100).

- Cada celda es `aspect-square w-full max-h-7` (`CELL_CLASS`): cuadrada mientras es
  pequeña y, cuando su alto llegaría a 28 px (token de espaciado `7`), deja de crecer
  hacia abajo y solo se ensancha. El panel no se alarga con el ancho y la rejilla
  ocupa todo el ancho sin hueco a los lados.
- **`w-full` es necesario.** Sin él, con el ancho automático del item de grid, el
  navegador traslada el `max-height` al ancho a través del `aspect-ratio` (medido: celdas
  de 28 × 28 px pegadas a la izquierda de columnas de 120 px).
- Medidas (invitado, septiembre de 2026: 4 filas de semanas):

  | Viewport | Panel | Celda | Con D100 |
  |---|---|---|---|
  | 1440 × 900 | 894 × 250 px | 120,6 × 28 px | 894 × 247 px (a 1280) |
  | 740 × 360 | 690 × 250 px | 91,5 × 28 px | 247 px de alto |
  | 320 × 568 | 282 × 250 px | 33,1 × 28 px | 282 × 271 px |

  A 740 × 360 "África" y "Comenzar práctica" se alcanzan con el scroll de la tarjeta
  (el botón acaba a 335 px con el contenedor terminando en 352 px). A 320 px no hay
  scroll horizontal (`scrollWidth` = 320, ningún elemento sobresale).
- Un mes de 6 filas (31 días que empiezan en sábado o domingo, a final de mes) suma dos
  filas de 28 + 4 px: ~314 px. Con D100 el mismo mes también crecía, con celdas de
  ~42 px desde `sm`.

Alternativa: celdas cuadradas de tamaño fijo y la rejilla centrada con hueco a los
lados. Mantiene los cuadrados, pero el calendario deja de ocupar todo el ancho, que es
lo que pidió el dueño.

**Rama:** `fix/racha-calendario-ancho`

_Contexto común de la unidad (antes `28-racha-calendario.md`): en D118._
