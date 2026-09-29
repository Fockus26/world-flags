# D079 · Persistencia · Un cambio de nombre o avatar (y cada carga) pone al día las filas del usuario en el ranking sin tocar el tiempo · Implementado

**Resumen:** Un cambio de nombre o avatar (y cada carga) pone al día las filas del usuario en el ranking sin tocar el tiempo (`syncLeaderboardProfile`: lee y actualiza solo si difiere). Mejor esfuerzo, reintento tras la siguiente sync buena

Antes la fila solo se reescribía al batir la marca. Ahora `GameEffects`, una vez
por carga y con cada cambio de nombre o avatar, llama a `syncLeaderboardProfile`:
lee las filas del usuario y, si alguna difiere, actualiza `display_name`,
`avatar_style` y `avatar_seed` de todas (sin tocar `best_time_ms`). Una vez por
carga para que también se pongan al día las filas subidas sin avatar, y un
cambio hecho sin red en una sesión anterior. Mejor esfuerzo: si falla, se
reintenta tras la siguiente sincronización buena, como la marca (D050).

**Rama:** `feat/ranking-nueva-regla`

_Contexto común de la unidad (antes `18-ranking-nueva-regla.md`): en D075._
