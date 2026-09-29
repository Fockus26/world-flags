# D091 · UX · Sin "Saltar tutorial" en el último paso ("Empezar a jugar" ya cierra); Escape sigue cerrando · Implementado

**Resumen:** Sin "Saltar tutorial" en el último paso ("Empezar a jugar" ya cierra); Escape sigue cerrando; la cabecera lleva `min-h-10` para no encoger

En el último paso ya está "Empezar a jugar", que cierra igual: dos botones de
cierre sobraban. Escape sigue cerrando. La cabecera lleva `min-h-10` (el alto del
botón, 40 px), así que al desaparecer no encoge: medido, 44 px en los pasos 5 y 6
en escritorio.

**Rama:** `fix/tutorial-pulido`

_Contexto común de la unidad (antes `21-tutorial-pulido.md`): en D090._
