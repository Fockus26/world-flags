# D067 · UX · Tarjeta de Capitales = solo el nombre del país, grande, en el hueco de la bandera (dueño, opción B) · Implementado

**Resumen:** Tarjeta de Capitales = solo el nombre del país, grande, en el hueco de la bandera (dueño, opción B). La pregunta del input lleva el país. Entrada con `tw-animate-css`, sin framer

**Decisión del dueño (opción B de tres):** la tarjeta muestra solo el nombre
del país, grande, en el mismo hueco que ocupa la bandera en Banderas
(`session/capitals/CapitalCard.tsx`). Se descartaron el nombre con la bandera
(A) y la bandera al responder (C).

- La pregunta del input lleva el país ("¿Cuál es la capital de Perú?"): el
  lector de pantalla la oye entera al enfocar el input, sin depender de la
  tarjeta.
- Fondo `bg-surface-hover`, texto `text-surface-soft`, tamaños de la escala de
  Tailwind (`text-3xl` → `text-5xl`), sin valores arbitrarios nuevos. Los
  nombres largos parten en dos líneas (`text-balance`, `hyphens-auto` con
  `lang="es"`); "San Vicente y las Granadinas" cabe a 320 px sin scroll
  horizontal.
- Entrada con `tw-animate-css` (`fade-in` + `zoom-in-95`, 200 ms) y `key` por
  país para que se repita en cada tarjeta. Sin framer (D006); el
  `prefers-reduced-motion` global la deja en 0,01 ms.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
