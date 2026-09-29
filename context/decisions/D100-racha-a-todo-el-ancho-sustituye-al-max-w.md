# D100 · UX · Racha a todo el ancho (sustituye al `max-w-sm` de `fix/responsive-racha`) · Obsoleta → D118

**Resumen:** Racha a todo el ancho (sustituye al `max-w-sm` de `fix/responsive-racha`): el tope pasa al calendario (`max-w-sm` en móvil, `max-w-xs` desde `sm`) y desde `sm` racha y mejor racha a la izquierda, calendario a la derecha. En 740×360 el panel baja de ~329 a 247 px

> **Sustituida por D118–D119** (D118–D119): el panel vuelve a
> ser una columna en todos los anchos y el calendario ocupa todo el ancho.

El dueño había elegido en `fix/responsive-racha` limitar el panel entero a `max-w-sm`
porque las celdas del calendario (1/7 del ancho, cuadradas) crecían a ~90 px y el panel
no cabía en móvil horizontal. Ahora pide que la racha ocupe todo el ancho en escritorio.

- El panel ocupa todo el ancho; **el tope pasa al calendario**: `max-w-sm` por debajo de
  `sm` (lo de antes en móvil vertical) y `max-w-xs` desde `sm`.
- Desde `sm`, fila: racha actual y mejor racha repartidas a la izquierda
  (`justify-evenly`), calendario a la derecha. Por debajo, columna como antes.
- Medidas: 1280 × 900 → panel de 894 × 247 px, calendario de 320 px. 740 × 360 → panel
  de 247 px de alto (antes ~329 px); último continente y "Comenzar práctica" alcanzables
  con scroll de la tarjeta. 320 × 568 → panel de 282 × 271 px, sin scroll horizontal.

Alternativa: calendario centrado bajo la racha con columnas de ancho máximo. Deja el
panel más alto en móvil horizontal, que es justo el caso que motivó el tope.

_Contexto común de la unidad (antes `22-menu-movil.md`): en D096._
