# D157 · UX · Tarjetas de configuración: continente sube 2 px + `shadow-md` · Implementado

**Resumen:** Tarjetas de configuración: continente sube 2 px + `shadow-md` (anillo a `ring-2` para sumarla), opciones no elegidas del selector de juego suben 2 px + `shadow-sm`, `OptionTile` solo `shadow-sm` (sin subir: vive pegada a `overflow-hidden`); todas escalan a 0,98 al pulsar. `motion-safe:`, 150/200 ms, sin `outline-color` (D129), hover de D103

**Decisión:** Elevación y pulsado. Tarjeta de continente (`RegionOption`): al pasar (y al enfocar con teclado, como ya hacía) sube 2 px (`-translate-y-0.5`) con `shadow-md`; al pulsar vuelve a 0 y escala a 0,98 (`scale-98`). El anillo de 2 px del color de la nota pasa de `shadow-[0_0_0_2px_…]` a `ring-2 ring-(--app-score-color)` para poder sumarle la sombra (Tailwind compone `--tw-ring-shadow` + `--tw-shadow`). Selector de juego (`GameTypeToggle`, segmentado desde 30 rem): las opciones **no elegidas** suben 2 px con `shadow-sm` y el fondo `--default-hover`; todas escalan a 0,98 al pulsar. `OptionTile`: `shadow-sm` al pasar y 0,98 al pulsar, **sin subir**. Subir y encoger van con `motion-safe:` (la variante de HeroUI: `prefers-reduced-motion` o `data-reduce-motion`); con movimiento reducido quedan la sombra y el color. Transiciones de 150 ms (segmentado, `OptionTile`) y 200 ms (continente), las que ya tenía cada uno; las listas de propiedades no incluyen `outline-color` (D129). Hover por la variante de D103: ratón, o mientras dura el toque, sin hover pegado
**Por qué:** Es el pedido de P19 con tokens que ya existían (`shadow-sm`/`shadow-md` de Tailwind, 150/200 ms), sin valores nuevos. La opción elegida del segmentado no sube porque va sobre la píldora, que no sube con ella: el texto se despegaría del relleno. `OptionTile` no sube porque casi todos sus consumidores la ponen pegada al borde de un `overflow-hidden` (medido en el modal: "5 s" a 0 px del borde superior de su `AutoHeight`, la columna derecha a 0 px del borde derecho del panel): los 2 px le cortaban el borde de arriba. Alternativa: dar margen interior a `AutoHeight` y a los paneles del modal para que `OptionTile` también suba (toca piezas compartidas, otra unidad)

**Rama:** `style/animaciones-configuracion`

## Contexto común de la unidad (antes `40-animaciones-configuracion.md`)

> Estilo, rama `style/animaciones-configuracion` (pendiente P19, solo la ★ de
> Configuración; tanda 2026-09-26). Toca `RegionOption.tsx`, `GameTypeToggle.tsx` y
> `ui/OptionTile.tsx` (sin cambiar su API). CSS con `tw-animate-css` y transiciones,
> nunca framer (D006). D103/D129/D130 siguen valiendo.

### Verificado en el navegador (dev, puerto 4303, como invitado)

- Al cargar y al recargar con Norteamérica y Banderas guardados: ninguna tarjeta ni la
  píldora llevan la clase del pop, ni se dispara `animationstart` de `enter`.
- Al marcar un continente con clic real: `animationName: enter`, `transform` a 0,95 en
  el primer fotograma; al terminar, la clase se quita. Igual en la píldora (que además
  se desliza a su sitio) y en una `OptionTile` del modal ("Práctica").
- Hover real sobre una tarjeta: `translate: 0 -2px` y `box-shadow` = anillo de 2 px +
  `shadow-md`. Sobre una opción no elegida del segmentado: `translate: 0 -2px`, fondo
  de hover.
- Foco con teclado en las 9 tarjetas a 320 px: el anillo (contorno + desplazamiento)
  queda a 12 px de los bordes del contenedor con scroll; sin scroll horizontal
  (`scrollWidth` 320).
- Con `data-reduce-motion="true"`: clic en una tarjeta → sin animación, sin `translate`.
- axe-core 4.10.2 (WCAG 2 A/AA, 2.1 AA): 0 incidencias en claro y en oscuro, con el
  modal de configuración abierto.
- El navegador integrado congela la línea de tiempo de las animaciones cuando la
  pestaña no está al frente: ahí `animationend` no llega hasta traerla al frente.
