# D066 · UX · Selector de tres juegos: desplegable (`ui/Select`, que gana `placeholder`) por debajo de `min-[30rem]`, segmentado · Implementado

**Resumen:** Selector de tres juegos: desplegable (`ui/Select`, que gana `placeholder`) por debajo de `min-[30rem]`, segmentado con tres pastillas a partir de ahí; se pintan los dos y CSS oculta uno. Píldora con ancho y desplazamiento por número de juegos (la fórmula anterior se iba 8 px). El color de la opción marcada sale del estado de React, no de `has-checked:` (Chrome no lo recalcula al marcar React), con `--btn-contained-fg`: 4,66:1 y 6,64:1

Elegido por el dueño sobre un canvas de Claude Design con las tres opciones
(icono encima del texto, solo iconos, desplegable), vistas a 320 px.

- **Por qué no caben tres pastillas a 320 px:** quedan ~271 px para el
  segmentado, unos 90 por opción, y "Capitales" con su icono ya los ocupa
  casi enteros. Con el espaciado de texto de WCAG 1.4.12 se sale.
- **Cómo:** por debajo de `min-[30rem]` se pinta el `Select` de HeroUI
  (`ui/Select`, con teclado y `role="listbox"` de React Aria); desde ahí, el
  segmentado de siempre con tres opciones. Se pintan los dos y CSS oculta el
  que no toca: `display: none` también lo saca del orden de tabulación y del
  árbol de accesibilidad, y en un sitio estático decidirlo en JS con
  `matchMedia` desajustaría la hidratación.
- **La píldora ya no está atada a dos opciones:** su ancho es
  `calc((100% - 0.5rem) / n)` (el hueco real entre los `p-1` del grupo) y se
  desplaza en múltiplos de su propio ancho. La fórmula anterior sumaba además
  `0.5rem`, así que en "Banderas" se salía 8 px a la derecha. Medido: 0 px de
  desfase en las tres opciones.
- **`ui/Select` gana una prop opcional `placeholder`** (cambio aditivo, el
  contrato de los wrappers se mantiene). Sin ella, durante la carga inicial
  —cuando todavía no hay juego elegido (D042)— el desplegable mostraba
  "Select an item", el texto por defecto de HeroUI, en inglés.
- **El título ya no se recorta:** "Aprende las capitales del mundo" se pasaba
  por 2 px del ancho disponible a 320 px y salía con "…". Se le quitó el
  `whitespace-nowrap`; los otros dos títulos siguen cabiendo en una línea.

### El contraste de la opción marcada (hallazgo reportado dos veces, resuelto)

El texto de la opción marcada nunca llegaba a tomar su color: dependía de
`has-checked:` (`:has(:checked)`) y **Chrome no recalcula ese estilo cuando es
React quien marca el radio al cargar la página** — medido en el navegador:
tras recargar sigue con el color normal al menos 4,5 s, hasta que algo fuerza
un recálculo (un clic, un cambio de tamaño). Por eso se veía el texto normal
sobre el morado: 3,62:1 en claro y 2,44:1 en oscuro, por debajo de AA.

Ahora el color sale del estado de React (`checked ? … : …`), sin depender de
`:has()`, y usa `--btn-contained-fg`, el token del texto de los botones
rellenos: **4,66:1 en claro y 6,64:1 en oscuro**.

**Visto de paso, no tocado:** `OptionTile` (tema, dificultad, modo) y
`RegionOption` (continentes) usan el mismo patrón `has-checked:` con radios
controlados por React, así que pueden tener el mismo problema al cargar. No
entra en esta unidad; queda reportado.

### Verificación (navegador real, con el servidor del dueño)

- 320 px: desplegable, pastillas ocultas, sin scroll horizontal, y lo mismo
  con el espaciado de texto de WCAG 1.4.12. 900 px: las tres pastillas, con la
  píldora exactamente sobre la marcada.
- axe-core 4.10.2 sin violaciones en claro y en oscuro, en la configuración y
  en el modal de ranking (que usa el mismo selector: desplegable a 320 px,
  pastillas a 900 px).
- Elegir un juego con el ratón cambia selector, título y progreso mostrado.
  El foco queda en el control y su anillo se ve.
- **No verificado:** la navegación con flechas dentro del grupo de radios. El
  panel del navegador no entrega esas teclas (un grupo de radios nativo de
  prueba, creado al margen de la app, se comporta igual), así que no se puede
  distinguir el componente del entorno. Tab y el clic sí funcionan.
- **Ojo con el método:** con el panel oculto o la ventana detrás, la página
  deja de repintarse y `getComputedStyle` devuelve valores congelados (hasta
  un `color: red` en línea deja de verse). Toda medición de estilos de aquí en
  adelante se hace con la página pintando, comprobándolo con una captura.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
