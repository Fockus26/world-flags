# D154 · UX · Números de Resultados que cuentan de 0 a su valor en 600 ms (`useCountUp`, token `COUNT_UP_DURATION_MS`) · Implementado

**Resumen:** Números de Resultados que cuentan de 0 a su valor en 600 ms (`useCountUp`, token `COUNT_UP_DURATION_MS`); animado `aria-hidden`, final en `aria-live` una sola vez; movimiento reducido = final directo; `setTimeout` de respaldo si no corre `requestAnimationFrame`

**Decisión:** El número grande de Resultados (tiempo del rush completo, "encontrados" del rush rendido, nota /10 de la práctica) cuenta de 0 a su valor en 600 ms con salida suave (`easeOutCubic`), por `useCountUp` (`src/hooks/`, `requestAnimationFrame`). Token nuevo `COUNT_UP_DURATION_MS` (600 ms). Lo que se ve va `aria-hidden`; el valor final va en una región `aria-live="polite"` oculta, vacía mientras cuenta y rellenada una sola vez al terminar. Con movimiento reducido, o valor 0, el final sale desde el primer render. Red de seguridad: un `setTimeout` (600 + 100 ms) pone el final aunque `requestAnimationFrame` no corra (pestaña en segundo plano). Detrás del número animado va el final invisible en la misma celda de la rejilla, para que el círculo no crezca mientras cuenta. Las frases de debajo ("Recorriste … en 1:23.45") no cuentan: son el resumen legible
**Por qué:** 150–200 ms no deja leer que el número sube; 600 ms es lo que pedía P19 y termina antes que la fanfarria (~1 s). Anunciar cada fotograma inundaría el lector de pantalla. Alternativa: contar también las frases (más movimiento, mismo dato repetido)

**Rama:** `style/animaciones-resultados`

## Contexto común de la unidad (antes `39-animaciones-resultados.md`)

> Unidad `style/animaciones-resultados` (tanda 2026-09-26, W7). Del dueño, solo las ★
> de "Resultados" de P19: números que cuentan hacia arriba y confeti + insignia de
> récord sincronizados con el sonido `record` (D146). CSS y `requestAnimationFrame`,
> nunca framer (D006).

### Lo que esto no cubre

- La tarjeta de Resultados entra desde abajo (300 ms) a la vez que cuentan los números
  y cae el confeti; se deja así (todo arranca en el mismo instante).
- No verificado en navegador en esta unidad (ver el PR).
