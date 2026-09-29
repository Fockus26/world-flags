# D159 · Accesibilidad · Etiqueta del selector de juego sin transición de `color` (queda `background-color, box-shadow, translate, scale`) · Implementado

**Resumen:** Etiqueta del selector de juego sin transición de `color` (queda `background-color, box-shadow, translate, scale`). Causa del 2,44:1 (P25): el cambio de color al terminar la carga arrancaba una transición que, sin fotogramas (pestaña o panel no visible), se queda en `currentTime` 0 con el color de partida; no era un fallo de recálculo de Chrome. Ahora 6,63:1 en oscuro y 4,66:1 en claro desde el primer fotograma

**Decisión:** La etiqueta del selector de juego (`GameTypeToggle`, forma segmentada) ya no anima `color`: su lista de transición pasa a `background-color, box-shadow, translate, scale`. El texto de la opción marcada sigue en `--btn-contained-fg` y sale del estado de React, como antes
**Por qué:** Causa medida del 2,44:1 (P25): al terminar la carga (D042) la opción guardada pasa a marcada y la etiqueta cambia de color; con `color` en la transición, ese cambio arrancaba una transición de 150 ms que solo avanza mientras la página pinta fotogramas. En una pestaña o panel que no se muestra se queda en `currentTime` 0 sin fin (`getAnimations()` lo enseña: `color`, `running`, 0), con el color de partida `--default-foreground`, y así lo leían axe y cualquier medición: #f1eefc sobre #9b8bff = 2,44:1 en oscuro, 3,62:1 en claro. No era un fallo de recálculo de estilo de Chrome (lo que decía el comentario): la regla sí se aplicaba, por debajo de la transición. Sin animar `color` el texto correcto está en el mismo fotograma, al cargar, al elegir y al cambiar de tema en caliente. Alternativa: dejar el fundido y forzar su fin tras la carga (más código para un efecto que nadie pidió)

**Rama:** `fix/contraste-foco-configuracion`

## Contexto común de la unidad (antes `41-contraste-foco-configuracion.md`)

> Arreglo, rama `fix/contraste-foco-configuracion` (pendientes P25 y P27; tanda
> 2026-09-26 b). Toca `GameTypeToggle.tsx`, `ui/AutoHeight.tsx` y el comentario de
> `ui/OptionTile.tsx` (sin cambiar su API). Siguen valiendo D101–D106 (foco y
> `--btn-contained-fg`), D129 (sin `outline-color` en las transiciones) y D157–D158.

### Verificado en el navegador (dev, puerto 4301, como invitado)

- P25, recién cargada la página, sin fotogramas (panel del navegador oculto, el caso en
  que antes fallaba): opción marcada del segmentado a 6,63:1 en oscuro (tema
  "system" con el sistema en oscuro y tema "dark") y 4,66:1 en claro ("system" en
  claro y "light"). La etiqueta no tiene animaciones activas. Al cambiar `data-theme`
  en caliente y al elegir otra opción: mismos valores al instante.
- axe-core 4.10.2 sobre la página: 0 incidencias en "system" oscuro y "system" claro,
  sin forzar el fin de ninguna animación. Con el modal de configuración abierto: 0 en
  claro y oscuro.
- P27: anillo de foco (caja de la opción + 4 px) dentro de todos los ancestros que
  recortan, para las 16 opciones del modal (modo práctica con temporizador), a
  1024 px y a 320 px. Foco con teclado (flechas en "5 s / 10 s / 15 s"):
  `:focus-visible` y contorno entero. Sin scroll horizontal a 320 px (modal y página,
  también con el panel de racha abierto, el otro `AutoHeight` de la pantalla).
- El navegador integrado congela las animaciones y transiciones cuando su panel no se
  muestra; para medir los recortes del modal se forzó su fin con `finish()`.
