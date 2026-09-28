# Decisiones — Nombres largos en el selector de países

> Arreglo, rama `fix/nombres-paises-largos` (pendiente P29, tanda 2026-09-26 c).
> Todo en `CountryPickerModal.tsx`. Sigue a `decisions/42-modales-ancho-320.md` (D162).

| ID | Decisión | Razón | Estado |
|---|---|---|---|
| D169 | En `CountryPickerModal`, el nombre de cada país va en **dos líneas como máximo** (`line-clamp-2`, `min-w-0`, `wrap-break-word`) en vez de `truncate`. La etiqueta pasa a `items-start` con `leading-snug` (línea de 18 px) y la casilla de 16 px baja 1 px (`mt-px`), así queda centrada con la primera línea. En una fila de la rejilla donde un nombre ocupa dos líneas, las casillas de esa fila siguen a la misma altura (arriba) y solo crece esa fila. Con tres o más líneas, "…" al final de la segunda | Con `truncate`, "San Vicente y las Granadinas", "República Dominicana"… se cortaban a 320 px y a 34 rem sin forma de leerlos enteros (el lector de pantalla sí los leía). Alternativa: `title`/tooltip sobre el nombre truncado, pero no llega en táctil ni con teclado y obliga a pasar por encima de cada casilla | Implementado (`fix/nombres-paises-largos`) |
