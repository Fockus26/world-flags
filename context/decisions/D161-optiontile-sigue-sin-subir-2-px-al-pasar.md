# D161 · UX · `OptionTile` sigue sin subir 2 px al pasar (D157) · Implementado

**Resumen:** `OptionTile` sigue sin subir 2 px al pasar (D157): 4 px de hueco no alcanzan para anillo + subida y no todos sus consumidores pasan por `AutoHeight`

**Decisión:** `OptionTile` sigue sin subir 2 px al pasar (D157 no cambia)
**Por qué:** 4 px de hueco alcanzan para el anillo, no para el anillo más 2 px de subida (6 px), y no todos sus consumidores pasan por `AutoHeight`. Es lo conservador: no cambia el aspecto de ningún ajuste. Alternativa: `p-1.5`/`-m-1.5` en `AutoHeight` y activar la subida (toca la sensación de todos los selectores del kit)

**Rama:** `fix/contraste-foco-configuracion`

_Contexto común de la unidad (antes `41-contraste-foco-configuracion.md`): en D159._
