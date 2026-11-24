# D238 · Color · Paleta de continentes del modo Mapa: ocho tonos vivos, uno por continente · Implementado

**Resumen:** tokens `--app-color-region-<continente>` (claro y oscuro), expuestos como `fill-region-*`. Es el relleno de un país acertado en el mapa. Elegida por el dueño el 2026-11-23 entre tres propuestas («A · Vivos», frente a una gama fría de marca y una de atlas apagada).

| Continente | Claro | Oscuro |
|---|---|---|
| Norteamérica | `#c2570c` | `#fb923c` |
| Centroamérica | `#a21caf` | `#e879f9` |
| Caribe | `#0e7490` | `#2dd4bf` |
| Sudamérica | `#15803d` | `#4ade80` |
| Europa | `#6d5ef0` (= `primary`) | `#9b8bff` (= `primary`) |
| África | `#7c7a0a` | `#facc15` |
| Asia | `#2563eb` | `#60a5fa` |
| Oceanía | `#db2777` | `#fb7185` |

- **Contraste (medido):** cada tono da ≥ 3:1 contra la tierra sin acertar (`surface-border`: mínimo 3,44:1 en claro y 4,52:1 en oscuro) y contra el mar (`--background`). Un país acertado se distingue del que falta por luminosidad, no solo por el tono: cumple "ningún estado solo por color".
- **No valen como texto** ni como fondo de texto: no se midieron para eso.
- **Entre continentes vecinos no hay 3:1** (no es posible con ocho tonos de luminosidad parecida, ni hace falta): los separa el borde de cada país.
- Sin rojo ni verde de estado puros: `danger` y `success` siguen significando fallo y acierto.

**Sin verificar:** con filtros de daltonismo (va en el `design-qa` de la versión).
