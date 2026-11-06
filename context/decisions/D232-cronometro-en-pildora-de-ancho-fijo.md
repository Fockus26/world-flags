# D232 · UI · Cronómetro del rush en píldora de ancho fijo, con icono de reloj y formato único `m:ss` · Implementado

**Decisión del dueño:** opción A, píldora de ancho fijo.

- **Forma:** `Header` muestra el cronómetro del rush (Banderas, Capitales y Países) como píldora: `rounded-full`, `bg-primary-soft`, `border-primary-border`, icono `Clock` de iconoir (`aria-hidden`) y las cifras.
- **Formato:** uno solo, `m:ss`. Ejemplos: `0:08`, `59:59`, `105:30` (los castigos pueden pasar de 60 min aunque la partida dure como mucho 1 h real, D231). Desaparecen las décimas que salían por debajo del minuto (`8.3s`). `formatStopwatch` sale a `utils/stopwatch.ts` y nunca da negativos.
- **Ancho fijo:** las cifras van en `w-stopwatch` (token `--container-stopwatch: 6ch`, que crece con la letra), centradas y con `tabular-nums`. La píldora no cambia de ancho de `0:00` a `105:30`: se midieron 123,6 px en todos los casos a 1280 y a 320.
- **Contraste:** texto `primary-hover` sobre `primary-soft`. Da 5,15:1 en claro y 6,54:1 en oscuro; `primary` daba 3,97:1 en claro.
- **320 px con el texto al 200 %:** el grupo del cronómetro y «Abandonar» puede partirse en dos líneas. Con la píldora, «Abandonar» quedaba fuera de la sesión, recortado por el `overflow-hidden`.
- **Se mantiene:** el salto con `zoom-in` y el «+10 s» que sube a su lado (D132), `role="timer"` con `aria-live="off"` y el anuncio de castigos aparte (D134).
- **Fuera:** la cuenta atrás de la práctica con temporizador (`Timer`) no cambia.

**Por qué:** el cronómetro era texto sin fondo que cambiaba de ancho y de formato al pasar del minuto, y movía «Abandonar».

**Por confirmar al revisar el PR:** el dueño lo llamó «chip» y se interpretó que era esta pieza. Si se refería a otra, que lo aclare.

**Verificación:** `tests/unit/stopwatch.test.ts`. Sonda `.qa/cronometro-shots.mjs`: claro a 1280, oscuro a 320 y claro a 320 con el texto al 200 %. Comprueba el ancho estable de `0:01` a `105:30`, que las cifras no desbordan, que no hay scroll horizontal y que «Abandonar» queda dentro de la sesión.
