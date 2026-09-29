# D096 · UX · Menú ⋮ en móvil (por debajo de `sm`, el corte de `UserSummary`) · Implementado

**Resumen:** Menú ⋮ en móvil (por debajo de `sm`, el corte de `UserSummary`): `configuration/ConfigurationMenu.tsx` sobre el `Dropdown` de HeroUI sustituye a los iconos 🏅 🏆 📍; se pintan las dos formas y CSS oculta una (como D066). Opciones de 44 px con emoji y texto; el foco vuelve al ⋮ al cerrar el modal sin código propio

Pedido del dueño: en móvil, en lugar de `UserSummary` con los tres botones al lado
(🏅 Logros, 🏆 Ranking, 📍 Elegir países), un icono de menú vertical que al pulsarlo
muestre esas tres opciones con su texto y su icono.

- **Corte: `sm` (640 px).** Es el breakpoint en el que `UserSummary` ya cambia de
  forma (avatar, nombre largo, etiqueta de cuenta), así que no se inventa uno nuevo.
  Medido: a 360 px, `UserSummary` pasa de 165 px (con los tres iconos) a 269 px (con
  el ⋮); con el menú mide 230 px a 320 px, 300 px a 390 px y 340 px a 430 px. A 640 px, con los tres iconos,
  le quedan 422 px: sobra sitio.
- **Componente:** `configuration/ConfigurationMenu.tsx`, sobre el `Dropdown` de HeroUI
  v3 (patrón de menú WAI-ARIA de React Aria: flechas, Escape, inicial, cierre al pulsar
  fuera). El ⋮ es `IconButton` con `MoreVert` de iconoir, hijo directo de `Dropdown`
  (así lo documenta HeroUI; `Dropdown.Trigger` sería un botón dentro de otro).
- **Se pintan las dos formas y CSS oculta una** (`sm:hidden` / `hidden sm:flex`), igual
  que el selector de juego (D066): `display: none` saca la oculta del orden de
  tabulación y del árbol de accesibilidad, y decidirlo en JS con `matchMedia`
  desajustaría la hidratación.
- Opciones de 44 px de alto (`min-h-11`, objetivo táctil del kit), emoji en una caja de
  ancho fijo para que los textos queden alineados. El popover de HeroUI viene limitado
  a `48svw` (≈150 px a 320 px): se quita el tope y se le da `min-w-56`.
- **Foco al cerrar un modal abierto desde el menú:** vuelve al ⋮ sin código propio
  (el menú devuelve el foco a su botón al cerrarse y el modal lo toma como origen).
  Comprobado con teclado (Enter / flechas / Enter / Escape) y con puntero (clic en la
  opción y clic en la X, y confirmando en "Elegir países").
- Nombre accesible del ⋮ provisional: "Más opciones" (`CONTENT_CHECKLIST.md` #33).

Alternativa descartada: un `Popover` propio con tres `Button`. Habría que rehacer el
patrón de menú (roving focus, Escape, cierre) que HeroUI ya trae resuelto.

**Rama:** `feat/menu-movil`

## Contexto común de la unidad (antes `22-menu-movil.md`)

> Unidad `feat/menu-movil` (tanda del 2026-09-23, W6). Cubre D096–D100.
