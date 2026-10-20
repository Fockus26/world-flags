# D207 · A11y / Alto contraste · Opción elegida de `OptionTile` y borde de `Button` en forced-colors · Implementado

**Resumen:** con `forced-colors: active` (alto contraste de Windows) el sistema borra los fondos, y eso dejaba dos fallos (design-qa del 2026-10-20):
- **Segmentados:** en `OptionTile` lo único que distingue la opción elegida es el relleno `--accent`, así que la elegida y las demás salían iguales (Configuración › Juego: Modo, Sonidos, Notificaciones, Tema; modal de lotes: Orden, Países por lote). Ahora, solo en forced-colors, la opción con el radio marcado sale del ajuste forzado (`forced-color-adjust: none`) y se pinta con `Highlight` (fondo y borde) y `HighlightText` (texto), igual que la píldora de `GameTypeToggle`. Su anillo de foco pasa a `CanvasText`, porque fuera del ajuste `--focus` no seguiría la paleta del sistema.
- **Botones con relleno:** sin borde, `contained`/`soft`/`text` quedaban como texto suelto. `Button` lleva `forced-colors:border` (1 px; el sistema le da `ButtonText`). El borde solo existe en ese modo, así que fuera de él ninguna medida cambia. `outline` ya traía su borde inline, que manda.

Se arregla en los primitivos (`src/components/ui/OptionTile.tsx`, `src/components/ui/Button.tsx`): lo heredan todos sus consumidores. Los colores de sistema (`Highlight`, `HighlightText`, `CanvasText`) no son tokens de marca: son la paleta que impone el usuario y solo se usan bajo `forced-colors:`.

**Fuera de forced-colors no cambia nada.** La elegida ya se distingue sin depender del matiz: relleno pleno frente a gris, con contraste de luminancia (en escala de grises se ve, `config-notificaciones-cvd-achromatopsia.png` del mismo QA).

**Alternativas descartadas:** icono de check en la elegida (cambia el aspecto fuera de forced-colors y quita ancho en las opciones estrechas de 3 columnas); borde grueso solo en forced-colors (añade px y mueve el texto al elegir); `border: 1px solid transparent` siempre en `Button` (suma 2 px a los botones que no ocupan todo el ancho y obliga a compensar).
**Rama:** `fix/forced-colors`
