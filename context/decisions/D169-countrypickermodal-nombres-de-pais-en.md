# D169 · UX · `CountryPickerModal`: nombres de país en dos líneas como máximo (`line-clamp-2`) en vez de `truncate` · Implementado

**Resumen:** `CountryPickerModal`: nombres de país en dos líneas como máximo (`line-clamp-2`) en vez de `truncate`; casilla alineada con la primera línea (`items-start`, `leading-snug`, `mt-px`), "…" en la segunda si no caben

**Decisión:** En `CountryPickerModal`, el nombre de cada país va en **dos líneas como máximo** (`line-clamp-2`, `min-w-0`, `wrap-break-word`) en vez de `truncate`. La etiqueta pasa a `items-start` con `leading-snug` (línea de 18 px) y la casilla de 16 px baja 1 px (`mt-px`), así queda centrada con la primera línea. En una fila de la rejilla donde un nombre ocupa dos líneas, las casillas de esa fila siguen a la misma altura (arriba) y solo crece esa fila. Con tres o más líneas, "…" al final de la segunda
**Por qué:** Con `truncate`, "San Vicente y las Granadinas", "República Dominicana"… se cortaban a 320 px y a 34 rem sin forma de leerlos enteros (el lector de pantalla sí los leía). Alternativa: `title`/tooltip sobre el nombre truncado, pero no llega en táctil ni con teclado y obliga a pasar por encima de cada casilla

**Rama:** `fix/nombres-paises-largos`

## Contexto común de la unidad (antes `45-nombres-paises-largos.md`)

> Arreglo, rama `fix/nombres-paises-largos` (pendiente P29, tanda 2026-09-26 c).
> Todo en `CountryPickerModal.tsx`. Sigue a D162–D164 (D162).
