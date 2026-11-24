# D242 · Rendimiento / UI · Mapa: la vista mueve una capa ya pintada, la bandera se coloca con su proporción y el rango con Shift no selecciona texto · Implementado

**Resumen:** tres arreglos pedidos por el dueño tras probar D241 (2026-11-24): el mapa seguía lento (sobre todo al volver al mundo entero), la bandera no cubría el país en Sudamérica y el Shift+clic de «Elegir países» no salía a la primera.

### El mapa: una capa que el navegador mueve sin repintar

- **Causa medida:** la vista era un `transform` en un `<g>` del SVG, y con cada cambio el navegador volvía a rasterizar todas las siluetas. En una traza de Chrome, ~17 ms de rasterizado por fotograma al arrastrar, usar la rueda o volar; el hilo principal casi no hacía nada. D241 (crear solo las siluetas cercanas) no tocaba eso.
- **Ahora:** `WorldMap` dibuja una zona del mapa (`MapRaster`: la vista más medio lienzo por lado, recortada al mundo, a los px por unidad de ese momento) en un `<svg>` dentro de un `<div>` con `will-change: transform`. Mover la vista solo cambia el `transform` de ese `<div>`: el navegador desplaza y escala la textura que ya tiene.
- **Cuándo se redibuja:** al acercarse la vista al borde de lo dibujado (arrastrar, alejar); con la vista quieta 160 ms y lo dibujado a otra escala (tras acercar se ve un instante ampliado y luego nítido); y sin esperar si la rueda o el pellizco pasan de 2× sobre lo dibujado.
- **Vuelos:** una animación (`element.animate`) del `transform` de la capa, de la vista que se ve a la nueva. Si lo dibujado cambia en el mismo render (al alejar hace falta más mapa), el punto de partida se traduce a la capa nueva (`getLayerPlacement` / `getViewFromPlacement`). Un vuelo interrumpido por otro parte de donde iba. Con `prefers-reduced-motion` no hay animación.
- **Nada del dibujo depende de la vista:** puntos de microestado, áreas de toque y contorno de foco salen de la escala dibujada (`MapDrawing`, con `memo`); son exactos cuando la vista se asienta.
- **Las siluetas vuelven a estar todas montadas** (se revierte esa parte de D241): fuera de la zona dibujada el navegador no las pinta, y crearlas de golpe al alejar era un tirón al empezar el vuelo.
- `role="application"`, el foco y los eventos pasan del `<svg>` a un `<div>` que lo envuelve; el `<svg>` queda `aria-hidden`. El teclado y el nombre accesible no cambian (D239).

**Medido** (Chrome sin pantalla, 1280 × 800, tiempo total de rasterizado en ~1 s de gesto, antes → después): volver al mundo con el botón 1152 → 153 ms; volar a un país 583 → 232 ms; arrastrar el mundo 1243 → 240 ms; rueda acercando 908 → 53 ms.

**Descartado:** simplificar las siluetas a poca ampliación (el mapa ya tiene solo 54.000 vértices: a 1280 px se ganaba un 15 %); `<canvas>` (rehacer el toque, el foco y los colores por token); una capa con el mundo entero a la escala de ahora (a 60× serían 76.000 px de ancho).

### La bandera: se coloca con su proporción

- **Causa:** `preserveAspectRatio="slice"` en el `<image>`. Con las banderas cuyo SVG trae `viewBox` (99 de 197) Chrome ajusta la bandera a lo ancho de la caja en vez de recortarla: en un país más alto que la bandera quedaban franjas sin cubrir arriba y abajo (Bolivia, Brasil, Venezuela, Uruguay, Guyana). En Norteamérica las cajas son más anchas que la bandera y no se notaba.
- **Ahora:** `coverBox` calcula el rectángulo con la proporción de la bandera que cubre cada caja de `getFlagBoxes`, y la imagen va ahí; da igual cómo la ajuste el navegador. Las proporciones están en `data/flag-ratios.ts` (solo las que no son 3:2).
- En un país alto con bandera de franjas verticales (Perú) se ve sobre todo la franja central: es el recorte de siempre, sin huecos.

### «Elegir países»: `select-none` en las casillas

Con Shift, el clic extiende la selección de texto desde el clic anterior: los nombres quedaban resaltados y el rango (D233) no se marcaba a la primera.

### Verificación (2026-11-24)

- `tests/unit/flag-ratios.test.ts`: cada proporción es la de su SVG. `map-paths.test.ts`: la bandera colocada cubre cada grupo de territorios de los 196 países. `map-viewport.test.ts`: colocación de la capa y su inversa.
- Sobre el build, con Chrome: capturas de la bandera en los 12 países de Sudamérica, antes y después; tres turnos de una partida de Mapa; Shift+clic dos veces seguidas sin texto seleccionado; mundo, rueda, arrastre largo y foco de teclado a 1280 y 375 px, sin errores de consola.
- **Sin probar:** pellizco con dos dedos y cualquier teléfono real; Safari y Firefox; axe sobre el mapa nuevo.
