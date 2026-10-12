# D187 · UX · `CountryPickerModal`: la fila de cada continente y cada opción de país son clicables en toda su área · Implementado

**Resumen:** sin padding ni `gap` muertos en el selector de países: el botón de desplegar ocupa la fila del continente entera, "Ninguno"/"Todos" llegan de arriba abajo, y cada casilla de país llena su celda de la rejilla. 44 px de alto en móvil (por debajo de `sm`).

**Decisión:**
- **Cabecera de continente:** la fila (`div`) ya no tiene padding (`items-stretch`); el botón de desplegar lleva el padding (`pl-2.5 pr-2 py-2`) y ocupa desde el borde izquierdo hasta "Ninguno"/"Todos", con `min-h-11` (44 px) en móvil y `sm:min-h-9` (36 px, lo que medía antes) desde `sm`. "Ninguno"/"Todos" son `flex` de alto completo con `px-2.5` (53 × 44 px en móvil). Hover en todo el botón: `bg-surface`.
- **Opciones de país:** la rejilla pierde `gap-x-3 gap-y-0.5` y su `px-2.5 py-2` pasa a `p-1`; cada `label` lleva `px-1.5` (4 + 6 = 10 px, igual que antes y alineado con la flecha de la cabecera; entre columnas quedan 12 px de texto a texto, como el `gap-x-3`) y hover `bg-surface-hover`. Las deshabilitadas, sin hover.
- **Móvil (< `sm`):** cada opción mide 44 px y centra casilla y nombre (`items-center`); todas las celdas de una fila miden lo mismo, así que las casillas siguen alineadas aunque un nombre ocupe dos líneas. Desde `sm`, `py-1` (27 px una línea) y la alineación de arriba de D169 (`sm:items-start`, `sm:mt-px`).
- **Foco:** el anillo de los botones de la cabecera va por dentro (`-outline-offset-2`), porque la sección (`overflow-hidden`, `rounded-md`) recorta lo que sale de su borde. El de la casilla (`peer-focus-visible`) no cambia.
- **Contraste (de paso, mismo elemento):** "Ninguno"/"Todos" y "Limpiar todo" pasan de `text-secondary` a `text-secondary-hover`. `secondary` (`#b34bd1`) daba 3,80:1 sobre `surface-hover` y 4,34:1 sobre el blanco del modal (axe lo marcaba); `secondary-hover` da 5,00:1 y 5,69:1 en claro y más de 9:1 en oscuro. Como el texto ya está en su tono hover, "Limpiar todo" marca el hover con subrayado y los botones de la cabecera con el fondo.

**Por qué:** el dueño (2026-10-12): "todo el select fuera clickable ya que tiene un padding que no es clickable, del mismo modo con sus options". Medido antes: el botón de la cabecera medía 20 px de alto dentro de una fila de 37 (10 px muertos a la izquierda y 8 arriba/abajo), "Todos" 37 × 21 px, y los huecos entre opciones y el borde de la rejilla no respondían.

**Alternativas descartadas:**
- Hover de la cabecera oscureciendo (`surface-border`, o `color-mix` del 6 % con el texto como D149): el contador (`text-placeholder`) bajaba a 4,10–4,14:1 y "Todos" a 4,35–4,39:1 en claro. `bg-surface` aclara en claro y oscurece en oscuro; con los dos todo el texto pasa AA.
- 44 px también en escritorio para las opciones: en la rejilla de `max-h-56` solo cabrían 5 filas; en escritorio el puntero no lo necesita y se queda en 27 px (≥ 24 px).
- Quitar también el `p-1` de la rejilla: el hover de la opción tocaría el borde de la sección y el anillo de foco de la casilla quedaría a ras del recorte del `overflow-y-auto`.

**Rama:** `fix/selector-paises-area-clic`
