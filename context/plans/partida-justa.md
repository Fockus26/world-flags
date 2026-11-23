# Partida justa: banderas, inactividad, límite y cronómetro

Pedido del dueño (2026-11-05). Decisiones ya tomadas por el dueño: no volver a preguntarlas.
Antes de implementar: kit al día (3.17.0) y `main` actualizado. Son cuatro unidades, una rama y un PR por cada una.

## Diagnóstico verificado

Sonda: `.qa/flag-cache-probe.mjs` (Chromium real contra producción, 2026-11-05).

| Caso | Resultado |
|---|---|
| Buena red | 197/197 en ~60 s; sin red cargan en 4–400 ms: la caché funciona cuando termina |
| Red colgada desde la 10.ª bandera | Se queda en 10/197; una bandera no guardada sigue colgada a los 12 s, sin error |
| La red vuelve sin evento `online` | Sigue en 10/197: no se reanuda |
| Un solo fallo puntual | Se queda en 9/197 hasta la próxima carga de la página |

Causas en el código:

- `public/sw.js` `precacheFlags`: en serie, sin timeout, y con `return` en el primer fallo.
- `FlagPrecacheEffects`: solo pide la precarga al cargar y con el evento `online`, que no salta si la conexión es intermitente pero el navegador se cree conectado.
- `FlagDisplay`: `<img>` sin `onLoad`/`onError`; `Session` no sabe si la bandera se ve.
- `Session`: el reloj arranca al montar y corre aunque no haya imagen ni interacción. Con `timerEnabled`, la cuenta atrás de práctica agota la bandera y la salta sola.

## Unidad 1 · Precarga robusta

**Hecha (D229)**, rama `fix/precarga-banderas-robusta`. La bandera colgada en pantalla (sonda B, `zw` a los 12 s) sigue: es la unidad 2.

- `precacheFlags`: varias descargas a la vez (4–6), timeout por petición con `AbortController` (~8 s), un fallo no detiene el resto, y otra pasada al final.
- Volver a pedirla al empezar partida y con `visibilitychange`, además de la carga y `online`.
- Precargar las 2–3 banderas siguientes de la partida en curso.
- Valorar `navigator.storage.persist()` (Safari borra cachés tras días sin uso).
- No tocar `CACHE_NAME` (borraría lo ya descargado, D054) ni `APP_VERSION`.
- Test: el arnés de `sw.js` y la sonda deben dar 197/197 en los casos colgada y fallo puntual.

## Unidad 2 · Sin bandera no corre el tiempo

**Hecha (D230)**, rama `fix/sin-bandera-sin-reloj` (sale de la de la unidad 1). `CountriesPractice` no muestra banderas: no se toca. Sin probar la cuenta atrás de práctica con temporizador en navegador (solo por código) ni en móvil real.

Decisión del dueño: **esperar o cambiarla gratis**.

- `FlagDisplay` informa cargada / fallida. La imagen se reintenta sola con espera creciente.
- Reloj en pausa mientras no se ve: cronómetro del rush y cuenta atrás de práctica (`Session`). El tiempo pausado se descuenta como en `handleCancelExit`. `DailyPractice` también usa `FlagDisplay`: su tiempo cuenta para las estadísticas. Comprobar si `CountriesPractice` (`useCardCountdown`) muestra bandera antes de tocarlo.
- Responder y saltar bloqueados mientras no se ve, para no cobrar castigos a ciegas.
- A los 10 s aparece "Probar otra": cambia esa bandera por otra sin castigo, y la cambiada se queda en la cola (al final de la partida).
- El estado se anuncia también por texto y `aria-live`, no solo visualmente. Capitales no tiene imagen: no le aplica.

## Unidad 3 · Inactividad y límite

**Hecha (D231)**, PR #143. Estadísticas: `idleMs` opcional en `SessionRecord` (`getPlayedMs`). Rendirse en el rush de Países ahora congela el tiempo final en «Rendirme».

Decisión del dueño: **detalle, aviso y salida**; **1 h de tiempo real**.

- Actividad: teclado, puntero y toque. Modos: Banderas, Capitales, Países y Repaso diario.
- 45 s: detalle sin bloqueo, una bandera que se duerme con Zzz. `motion-reduce`: versión estática.
- 90 s: modal "¿Sigues ahí?" con la bandera tapada y el reloj en pausa. Los primeros 90 s sí cuentan, para que no sea una pausa gratis en el ranking.
- 5 min: sale de la partida. Conserva lo aprendido y no guarda marca.
- Volver de una pestaña oculta o de un equipo suspendido: calcular con el tiempo transcurrido, porque los temporizadores se ralentizan en segundo plano.
- Límite: 1 h de tiempo real, sin castigos ni pausas. Hay que llevarlo aparte: los castigos adelantan `startTimeRef`. Rush: la partida termina sin marca y conserva lo aprendido. Práctica: avisa y deja seguir o terminar.
- El tiempo inactivo no suma a `stats.totalTimePlayedMs`.
- Copy final: placeholder marcado y fila en `CONTENT_CHECKLIST.md`.
- Lleva changeset. Pasar `functional-qa` (flujo de riesgo: ranking y tiempos).

## Unidad 4 · Cronómetro

**Hecha (D232)**, PR #145.

Decisión del dueño: **A, píldora de ancho fijo**.

- En `Header`, con icono de reloj de iconoir y formato único `m:ss`: `0:08`, `59:59`. Con el límite de 1 h real, los castigos aún pueden pasar de 60 min, así que debe caber `105:30` sin saltar de ancho.
- Comprobar 320 px con la etiqueta de región y "Abandonar". Contraste 4.5:1 en claro y oscuro.
- Se mantienen el salto y el "+10 s" de D132, y `role="timer"`.
- Solo tokens: si falta el ancho o el alto, se añade el token.
- Nota: en el código de `Header` el cronómetro de hoy es texto sin fondo. El dueño lo llama "chip"; si se refería a otra pieza, aclararlo al revisar el PR.

## Unidad 5 · Selección con Shift en "Elegir países"

**Hecha (D233)**, PR #146. El rango toma el estado nuevo de la casilla pulsada (Gmail).

Sin decisión pendiente. `CountryPickerModal`:

- Shift+clic marca o desmarca el rango desde la última casilla pulsada, y aplica el estado que tomó esa casilla.
- El orden es el visible: los continentes desplegados, uno tras otro. Los plegados no cuentan. Salta los deshabilitados ("hoy"), que no cambian.
- `onChange` no trae `shiftKey`: leerlo en el `onClick` del input. Shift+Espacio debe funcionar igual con teclado. En móvil no cambia nada.
- Lleva changeset y test del cálculo del rango.

## Unidad 6 · Dado de avatares

**Hecha (D234)**, PR #147.

Decisión del dueño: **junto al selector de estilo**, en la misma fila; se elimina la fila propia del dado.

- `AccountTab` tiene el `Select` y `Avatar` tiene el dado y la tanda: subir el estado o el botón sin perder lo de D190 (tanda local, elegido siempre visible, anuncio `role="status"`, una vuelta con `motion-safe`).
- Comprobar 320 px y texto al 200 %. Nueva decisión que ajusta D190.

## Unidad 7 · Lotes: varias sesiones al día y separados de la diaria

**Hecha (D235)**, PR #148. `functional-qa` lanzado.

Decisiones del dueño (sustituyen partes de D185): **solo cuenta la sesión del lote**; **hasta 3 sesiones al día, opcional**; **los países del lote en curso no salen en la diaria hasta consolidarse**.

Regla de consolidación, según la opción elegida ("3 aciertos separados 4 h"; "el mismo día se exige un acierto más"):

- 2 aciertos a la primera en días distintos: como hoy.
- O 3 aciertos a la primera el mismo día, separados al menos 4 h entre sí.

**Confirmar al revisar el PR:** esta lectura mantiene la vía de 2 días. La otra lectura sería exigir siempre 3 aciertos.

**Confirmado por el dueño (2026-11-05):** 2 días distintos, o 3 el mismo día separados 4 h. Ajuste de sesiones múltiples: botón «Hacer otra sesión hoy» en `LearningPathPanel` al terminar la de hoy, hasta la 3.ª (sin interruptor en Configuración).

Dónde está hoy:

- `useGame.gradeCountryReview` (líneas 452–458) registra el acierto venga de donde venga: limitarlo a `activeGame.isLearningPath`. `DailyPractice` (línea 79) y la práctica libre dejan de contar.
- `getLearningPathStatus.todayCodes` (líneas 254–257) excluye lo acertado hoy y lo practicado hoy: sustituir por "sin acierto en las últimas 4 h". El candado de otros modos ya no debe bloquear el lote, porque esos modos ya no cuentan.
- `registerLearningPathPass` y `passDays` deduplican por día: añadir marcas de hora por acierto. Compatibilidad: `normalizePath` debe aceptar filas viejas con solo `passDays`.
- `mergeCountryProgress` une días y corta con `.slice(0, 2)`: unir también las marcas de hora y aplicar la regla nueva. Es `jsonb`: no hace falta migración, pero sí tests de fusión entre dispositivos.
- `startDailyPractice` y `getDueCountries`: excluir los países sin consolidar del lote en curso y de los lotes futuros. Al abandonar el recorrido vuelven a la diaria.
- Límite de 3 sesiones al día y opción de activarlo: sin activar se mantiene una sesión diaria. Decidir dónde va el ajuste con el diseño de `LearningPathPanel`.
- Revisar textos de `LearningPathModal`, `LearningPathPanel`, Resultados y tutorial que hablen de "dos días" o de la diaria.

Riesgo alto: lleva decisión nueva, changeset, tests y `functional-qa`.
