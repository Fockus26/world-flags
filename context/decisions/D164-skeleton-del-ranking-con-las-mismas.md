# D164 · UX · Skeleton del ranking con las mismas cajas que la fila real y el nombre de referencia con `truncate` (a 320 px partía en dos líneas) · Implementado

**Resumen:** Skeleton del ranking con las mismas cajas que la fila real y el nombre de referencia con `truncate` (a 320 px partía en dos líneas): skeleton y datos miden lo mismo

**Decisión:** La fila de skeleton usa las mismas cajas que la real (puesto, avatar, cuerpo con nombre y tiempo) y el nombre de referencia ("Jugador de ejemplo") va con `truncate`: a 320 px no cabía, partía en dos líneas y la fila medía 77 px. Medido: skeleton y datos, 56 px a 320 px en `?demo-ranking`, `=top`, `=podio` y `=lejos`
**Por qué:** D077/D116: al llegar los datos no se mueve nada de lo que ya estaba

**Rama:** `fix/modales-ancho-320`

_Contexto común de la unidad (antes `42-modales-ancho-320.md`): en D162._
