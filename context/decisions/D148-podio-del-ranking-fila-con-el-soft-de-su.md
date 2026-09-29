# D148 · UX · Podio del ranking: fila con el `-soft` de su medalla, número en el tono de la medalla y medalla `iconoir` · Implementado

**Resumen:** Podio del ranking: fila con el `-soft` de su medalla, número en el tono de la medalla y medalla `iconoir` (`aria-hidden`) en la esquina del avatar; tu fila en el podio = `primary-soft` + borde interior del puesto. Texto de tu fila `primary-hover` (antes `primary`, 3,97:1 en claro)

**Decisión:** Podio: la fila de otra persona en 1.º/2.º/3.º lleva el `-soft` de su medalla y el número (`#1`) en el tono de la medalla; el avatar lleva una medalla de `iconoir-react` (`Medal`) en la esquina, sobre un círculo `bg-overlay` con borde del color del puesto, `aria-hidden`. Tu fila en el podio conserva `bg-primary-soft` y suma un borde interior de 2 px (`ring-inset`) del color del puesto, más el número y la medalla. El texto de tu fila pasa de `text-primary` a `text-primary-hover`
**Por qué:** Nunca solo por color: el puesto sigue siendo texto real ("#1") y la lista es un `<ol>`; la medalla es decoración. La medalla va sobre el avatar y no en la columna del puesto para no quitarle ancho al nombre a 320 px. `primary` sobre `primary-soft` daba 3,97:1 en claro (el "(tú)" y el nombre); `primary-hover` da 5,15:1 (6,54:1 en oscuro). Alternativa: medalla sustituyendo al "#" dentro de la columna (más limpia, pero +1,25 em en todas las filas)

**Rama:** `style/ranking-podio`

_Contexto común de la unidad (antes `37-ranking-podio.md`): en D147._
