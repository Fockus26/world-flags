# Decisiones — Contraste del selector de juego y anillo de foco en configuración

> Arreglo, rama `fix/contraste-foco-configuracion` (pendientes P25 y P27; tanda
> 2026-09-26 b). Toca `GameTypeToggle.tsx`, `ui/AutoHeight.tsx` y el comentario de
> `ui/OptionTile.tsx` (sin cambiar su API). Siguen valiendo D101–D106 (foco y
> `--btn-contained-fg`), D129 (sin `outline-color` en las transiciones) y D157–D158.

| ID | Decisión | Razón | Estado |
|---|---|---|---|
| D159 | La etiqueta del selector de juego (`GameTypeToggle`, forma segmentada) ya no anima `color`: su lista de transición pasa a `background-color, box-shadow, translate, scale`. El texto de la opción marcada sigue en `--btn-contained-fg` y sale del estado de React, como antes | Causa medida del 2,44:1 (P25): al terminar la carga (D042) la opción guardada pasa a marcada y la etiqueta cambia de color; con `color` en la transición, ese cambio arrancaba una transición de 150 ms que solo avanza mientras la página pinta fotogramas. En una pestaña o panel que no se muestra se queda en `currentTime` 0 sin fin (`getAnimations()` lo enseña: `color`, `running`, 0), con el color de partida `--default-foreground`, y así lo leían axe y cualquier medición: #f1eefc sobre #9b8bff = 2,44:1 en oscuro, 3,62:1 en claro. No era un fallo de recálculo de estilo de Chrome (lo que decía el comentario): la regla sí se aplicaba, por debajo de la transición. Sin animar `color` el texto correcto está en el mismo fotograma, al cargar, al elegir y al cambiar de tema en caliente. Alternativa: dejar el fundido y forzar su fin tras la carga (más código para un efecto que nadie pidió) | En curso (`fix/contraste-foco-configuracion`) |
| D160 | `AutoHeight` deja 4 px de hueco para el anillo de foco: abierto, su capa `overflow-hidden` lleva `p-1` y `-m-1` (el margen negativo devuelve el contenido a su sitio y la pista de la rejilla mide lo mismo); cerrado, ninguno de los dos | El anillo de `OptionTile` (outline 2 px + separación 2 px) salía 4 px por fuera y ese `overflow-hidden` lo cortaba en "Orden", "Temporizador", "5 s / 10 s / 15 s" y "Dificultad" del modal de configuración, por los lados, arriba o abajo (P27). Los paneles de pestañas del modal no recortaban: HeroUI les da 8 px de relleno. Cerrado sin relleno porque, con él, asomarían 4 px del contenido plegado. Medido: posiciones de todas las opciones y alto de cada `AutoHeight` idénticos con y sin el hueco. Alternativa: `overflow-clip-margin` (no lo soporta Safari y en cerrado dejaría asomar el contenido) | En curso (`fix/contraste-foco-configuracion`) |
| D161 | `OptionTile` sigue sin subir 2 px al pasar (D157 no cambia) | 4 px de hueco alcanzan para el anillo, no para el anillo más 2 px de subida (6 px), y no todos sus consumidores pasan por `AutoHeight`. Es lo conservador: no cambia el aspecto de ningún ajuste. Alternativa: `p-1.5`/`-m-1.5` en `AutoHeight` y activar la subida (toca la sensación de todos los selectores del kit) | En curso (`fix/contraste-foco-configuracion`) |

## Verificado en el navegador (dev, puerto 4301, como invitado)

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
