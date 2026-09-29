# D163 · UX · Ranking bajo `sm`: el tiempo va debajo del nombre en todas las filas (`text-sm`, `leading-tight`, fila de 48 a 56 px) · Implementado

**Resumen:** Ranking bajo `sm`: el tiempo va debajo del nombre en todas las filas (`text-sm`, `leading-tight`, fila de 48 a 56 px); desde `sm`, como antes. Con tu puesto de 3 cifras a 320 px el nombre pasa de ~19 a 107 px

**Decisión:** Filas del ranking bajo `sm`: puesto y avatar como antes y, a su lado, una columna con el nombre (y "(tú)") arriba y el tiempo debajo, en todas las filas para que el ritmo sea igual. El tiempo baja a `text-sm` y las dos líneas a `leading-tight` (`max-sm:`), así la fila crece de 48 a 56 px y no más. Desde `sm`, todo en una línea con el tiempo a la derecha, como antes. La fila ya no es "grupo + tiempo" con `justify-between`, sino puesto, avatar y cuerpo (`flex-1`); el hueco entre el puesto y el avatar sigue siendo de 12 px (D150)
**Por qué:** Con tu puesto de tres cifras bajo el separador, al nombre le quedaban ~19 px a 320 px. Medido con `?demo-ranking=lejos` a 320 px: el nombre de tu fila tiene ahora 107 px (unos 10–12 caracteres; "Tu nombre" entra entero) y el de las demás, 140 px. Alternativa más conservadora: dejar el tiempo a la derecha y solo ocultar "(tú)" o estrechar el puesto, pero no llegaba a 8 caracteres con "#123"

**Rama:** `fix/modales-ancho-320`

_Contexto común de la unidad (antes `42-modales-ancho-320.md`): en D162._
