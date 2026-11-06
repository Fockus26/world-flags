# D233 · UI · «Elegir países»: Shift+clic (y Shift+Espacio) marca o desmarca un rango · Implementado

- **Qué hace:** con Shift, al pulsar una casilla en `CountryPickerModal` también cambian todas las que hay entre ella y la última pulsada (el ancla), ambas incluidas.
- **Qué estado toman:** el nuevo de la casilla pulsada, es decir, el contrario del que tenía, como al pulsarla sola (como en Gmail). En el uso normal coincide con el estado del ancla, que es lo que pedía el plan. Solo se separan si se pulsa con Shift una casilla que ya tiene el estado del ancla, y entonces gana lo que hace el clic: la casilla cambia.
- **Orden:** el visible. Cuentan los continentes desplegados, uno tras otro (orden de `REGIONS`), y dentro de cada uno el orden de su rejilla. Los plegados no cuentan, porque no se ve lo que se marcaría. Si el ancla quedó en un continente plegado, el Shift+clic es un clic normal.
- **«hoy»:** las casillas deshabilitadas se saltan y no cambian.
- **Teclado:** Shift+Espacio hace lo mismo. React avisa del cambio de una casilla desde su `click`, que trae `shiftKey` también cuando se activa con teclado (`onChange` lee `nativeEvent.shiftKey`).
- **Móvil:** no cambia nada, porque no hay Shift.
- **Ancla:** cualquier casilla pulsada pasa a ser el ancla, con o sin Shift. Se borra al abrir el diálogo.
- **Código:** lógica pura en `utils/country-range.ts` (`getVisibleCountryOrder`, `applyRangeSelection`).

**Por qué:** pedido del dueño. Elegir muchos países seguidos casilla a casilla era lento.

**Alternativa descartada:** aplicar siempre el estado del ancla. Si la casilla pulsada ya lo tenía, el clic no la cambiaría.

**Verificación:** `tests/unit/country-range.test.ts` (rango hacia delante y hacia atrás, entre continentes, desmarcar, saltar «hoy», sin ancla). `.qa/shift-rango-probe.mjs` sobre el build local: Shift+clic, desmarcar, Shift+Espacio con teclado, cruce entre continentes y ancla plegada.
