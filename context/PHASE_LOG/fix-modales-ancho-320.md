# fix/modales-ancho-320 — P23 y P24 (tanda 2026-09-26 b, X2)

Slot `world-flags-wt/wt2`, puerto 4302. Changeset patch (`.changeset/modales-ancho-320.md`).
Decisiones D162–D164 en `context/decisions/42-modales-ancho-320.md`. Sin copy nuevo:
la fila 53 de `CONTENT_CHECKLIST.md` reservada queda sin usar.

## Qué se hizo

- P23: `CountryPickerModal` suma `max-w-none` (D162). 1280 px: diálogo 470 → 571 px,
  columnas 115 → 147 px, nombres truncados (Caribe + Europa abiertos) 9 → 6. 320 px sin cambios.
- P24: filas del ranking bajo `sm` con el tiempo debajo del nombre (D163); skeleton con las
  mismas cajas y el nombre de referencia truncado (D164). 320 px: fila 56 px (datos y
  skeleton), nombre de tu fila con puesto #123 = 107 px (antes ~19). Desde `sm` igual que antes.

## Verificado en navegador (dev 4302, invitado)

- `?demo-ranking`, `=top`, `=podio`, `=lejos` a 320 px: sin scroll horizontal, nombres sin
  truncar, un único alto de fila. 640 px: una línea, tiempo a la derecha.
- axe-core 4.10 sobre el ranking (320, claro y oscuro) y el selector de países (320, claro
  y oscuro; 1280 oscuro): 0 violaciones.

## Pendiente / visto fuera de la unidad

- A 320 px, en el selector de países, los nombres largos ("San Vicente y las Granadinas",
  "República Dominicana"…) se truncan con "…" sin forma de leerlos enteros (no hay `title`);
  ya pasaba antes. El lector de pantalla sí lee el nombre entero.
