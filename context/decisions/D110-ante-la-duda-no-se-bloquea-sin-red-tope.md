# D110 · UX · Ante la duda no se bloquea: sin red, tope de 5 s, error, tabla inexistente o valor que no es `MAJOR.MINOR.PATCH` → sin mínima · Implementado

**Resumen:** Ante la duda no se bloquea: sin red, tope de 5 s, error, tabla inexistente o valor que no es `MAJOR.MINOR.PATCH` → sin mínima. Solo una respuesta válida cambia el estado (perder la red no desbloquea)

Sin red, tope de 5 s agotado, error del servidor, tabla inexistente (SQL sin
aplicar), fila ausente o valor que no es exactamente `MAJOR.MINOR.PATCH` →
`null` → no se bloquea. Solo una respuesta válida cambia el estado: al arrancar
eso es "no bloquear"; si ya estaba bloqueado, perder la red no lo desbloquea
(volver a primer plano sin red no abre la puerta a seguir jugando). Si la
mínima baja, la siguiente consulta sí lo quita. Un error al escribir la mínima
en el dashboard nunca deja a todo el mundo sin jugar.

**Rama:** `feat/actualizacion-obligatoria`

_Contexto común de la unidad (antes `25-actualizacion-obligatoria.md`): en D107._
