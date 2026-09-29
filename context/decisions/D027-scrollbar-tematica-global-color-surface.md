# D027 · Tokens · Scrollbar temática global (`--color-surface-border`/`--color-primary-border`, sin tokens nuevos) · Implementado

**Resumen:** Scrollbar temática global (`--color-surface-border`/`--color-primary-border`, sin tokens nuevos). `--field-background` claro reutiliza `surface-border` para separarse más del modal; oscuro se queda igual a propósito (ya es más claro que el modal, correcto para un tema oscuro)

`--field-background` en claro pasa de `#f1eff8` a `#e2dff1` (el mismo tono que
`--app-color-surface-border`, reutilizado — no un gris nuevo). Antes daba
**1.14:1** contra el blanco del modal, casi imperceptible; ahora **1.31:1**.
Sigue siendo sutil a propósito: es la separación de un campo dentro de una
tarjeta, no la de la tarjeta misma.

**El oscuro se queda igual, y es intencional, no un olvido:** hoy
`--field-background` (`#2b2740`) ya es más CLARO que la superficie del modal
(`#1b1930`) — al revés de lo pedido. En un tema oscuro, "elevar" un control se
lee aclarándolo; oscurecerlo más lo hundiría contra un fondo que ya es casi
negro. Se documenta explícitamente en el CSS para que no parezca una
inconsistencia entre temas.

**No tocado, pre-existente:** `--field-border` (`#9c96c4`) da 2.77:1 contra
blanco puro, por debajo del 3:1 que su propio comentario reclama. No se
corrigió aquí — no es lo que se pidió y cambiarlo de paso mezclaría un fix de
borde con un cambio de fondo. Reportado en `CURRENT_PHASE.md`.

_Contexto común de la unidad (antes `06-ajustes-logros.md`): en D024._
