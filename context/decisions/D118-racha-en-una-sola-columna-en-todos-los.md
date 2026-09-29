# D118 · UX · Racha en una sola columna en todos los anchos (sustituye a D100) · Implementado

**Resumen:** Racha en una sola columna en todos los anchos (sustituye a D100): racha y mejor racha en una fila arriba y calendario a todo el ancho de la tarjeta debajo; fuera el `sm:flex-row` y los topes `max-w-sm`/`max-w-xs` del calendario

Pedido del dueño: en escritorio el panel de la racha no se divide en columnas. Racha
actual y mejor racha arriba, en una fila, y **el calendario ocupa todo el ancho** de la
tarjeta debajo.

- `StreakPanel.tsx` pierde el `sm:flex-row` y el tope de ancho del calendario
  (`max-w-sm` en móvil, `max-w-xs` desde `sm`, los dos de D100). El panel es siempre
  una columna: fila de racha (actual a la izquierda, mejor a la derecha, como ya se
  veía en móvil) y calendario con `w-full`.
- La fila de arriba es la que ya había por debajo de `sm`; no se inventa otra forma
  para escritorio.

Alternativa descartada: conservar la fila de D100 solo a partir de `lg`. Es justo lo
que el dueño pidió quitar.

**Rama:** `fix/racha-calendario-ancho`

## Contexto común de la unidad (antes `28-racha-calendario.md`)

> Unidad `fix/racha-calendario-ancho` (tanda del 2026-09-24, W4, pendiente P2).
> Cubre D118–D119. **Sustituye a D100** (D096–D100).
