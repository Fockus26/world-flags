# D191 · UX · `CountryPickerModal`: "Todos"/"Ninguno" miden lo mismo, se ven más tenues y dicen de qué continente son · Implementado

**Resumen:** los dos botones de la cabecera de cada continente tienen el ancho de la palabra más larga ("Ninguno"), así al cambiar uno por otro la fila no salta; en reposo van en gris (`text-placeholder`) y `font-semibold`, y el acento vuelve al pasar el puntero. Nombres accesibles con el continente y contador del conmutador en palabras.

**Decisión:**
- **Mismo ancho:** componente local `RegionBulkButton`. El botón es un `grid` con las dos palabras en la misma celda (`col-start-1 row-start-1`); la que no toca va `invisible` y `aria-hidden`. Mide lo que "Ninguno" en los dos (65,38 px medido a 1280 y 320 px, claro y oscuro, en los tres estados: solo "Todos", solo "Ninguno" y los dos). Sin valores mágicos.
- **Más tenues:** de `font-bold` + `text-secondary-hover` a `font-semibold` + `text-text-placeholder`. Contraste en reposo sobre `surface-hover`: 4,71:1 en claro (`#6b6880` sobre `#f1eff9`) y 5,89:1 en oscuro (`#a29cc0` sobre `#262238`). Hover: `bg-surface` + `text-secondary-hover`, 5,69:1 en claro y 11,10:1 en oscuro; el hover cambia fondo y color, no solo color. Foco sin cambios (anillo `secondary-hover` por dentro, D187).
- **Nombres accesibles (auditoría a11y de la ola, WCAG 2.4.6):** "Todos: marcar los países de Europa" / "Ninguno: desmarcar los países de Europa". Empiezan por la palabra visible (2.5.3, etiqueta en el nombre). El texto visible no cambia.
- **Conmutador del continente:** se leía "Europa45". Lleva `aria-label` "Europa, 45 países" (o "Europa, 12 de 45 países elegidos" con selección); lo visible no cambia.

**Por qué:** el dueño (2026-10-12): "el texto ninguno y todos tengan el mismo ancho para que cuando cambie el texto no se vea ningún salto, además me gustaría un poco más tenue". Antes cada botón medía lo que su palabra; al marcar o desmarcar todo el continente uno sustituía al otro y la fila cambiaba de ancho.

**Alternativas descartadas:**
- Mantener el morado (`secondary-hover`) y bajar solo el peso: en claro ya está en 5,00:1 y no admite bajar el tono; en oscuro casi no se nota. Era el plan B si ningún token cumplía.
- `secondary-hover` con opacidad (`/90`): 4,23:1 en claro, falla AA.
- `text-neutral/85`: 4,57:1 en claro, al límite, y la opacidad sobre un token es un valor nuevo sin token.
- `dark:` para usar `text-secondary` solo en oscuro: el proyecto no usa la variante `dark:` (el tema va por `data-theme` y variables), así que no respetaría el tema elegido a mano.
- `sr-only` dentro del conmutador para el contador: Chromium mete un espacio antes de la coma ("Europa , 45 países") al ser `absolute`; el `aria-label` lo deja limpio.

**Rama:** `style/todos-ninguno-ancho`
