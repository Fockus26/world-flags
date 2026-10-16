# fix/selector-paises-area-clic — W2 tanda 2026-10-12 · PR #71 · D187

- `CountryPickerModal`: fila de continente clicable entera (botón sin padding muerto, 44 px móvil / 36 px sm+), "Ninguno"/"Todos" de alto completo; opciones de país llenan su celda (sin gap), 44 px móvil / 27 px sm+, hover.
- De paso: "Ninguno"/"Todos"/"Limpiar todo" a `text-secondary-hover` (secondary daba 3,80 y 4,34:1).
- Verificado en build (astro preview 4302): clics en bordes/huecos, 320 px sin scroll, axe 0 claro/oscuro, foco por teclado.
- Capturas en `context/plans/shots-w2/`.
- Abierto: en móvil la rejilla (`max-h-56`) muestra ~5 opciones en vez de ~9.
