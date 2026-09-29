# D151 · UX · Acierto/fallo en `StimulusFrame` (`feedback`): anillo verde que crece y se desvanece (`stimulus-ring`) · Implementado

**Resumen:** Acierto/fallo en `StimulusFrame` (`feedback`): anillo verde que crece y se desvanece (`stimulus-ring`); fallo y salto = `ring-2 ring-danger` + sacudida ±4 px 200 ms (`stimulus-shake`). Por `box-shadow`/`transform`, sin mover el layout; Banderas y Capitales, práctica, competitivo y tutorial

**Decisión:** La respuesta se pinta en el marco del estímulo (`StimulusFrame`), que recibe `feedback: AnswerStatus` (opcional, `"idle"` por defecto). `SessionCard.renderStimulus(country, feedback?)` lo pasa a `FlagDisplay` y `CapitalCard`; `Session` le da su `answerStatus`, así que vale para Banderas y Capitales, práctica y competitivo, y el tutorial (que monta `Session`). Acierto: `motion-safe:animate-stimulus-ring`, `box-shadow` de 0 a `3 × --spacing` con `--app-color-success` del 70 % al 0 %. Fallo (y salto, que se ve como fallo, D083): `ring-2 ring-danger` fijo mientras se ve el aviso + `motion-safe:animate-stimulus-shake`, `translateX` −4 → 4 → −2 → 2 px (`--spacing` = 4 px) en 200 ms. `@keyframes` y `--animate-*` en un `@theme` al final de `global.css`. La práctica diaria no pasa `feedback` (no hay acierto/fallo, solo revelar) y el rush/práctica de Países no usan `StimulusFrame`: quedan igual
**Por qué:** `box-shadow` y `transform` no mueven el layout: ni la cabecera ni el formulario saltan, y el `overflow-hidden` de la tarjeta de sesión contiene la sacudida (medido a 320 px: `scrollWidth` 320 con el marco a ±4 px y con el anillo a 12 px). El marco ya existía como pieza común de las dos tarjetas: una sola vez para los dos juegos. La sacudida amortiguada (dos vaivenes y quieta) no es un parpadeo. No toca el cronómetro ni el badge "+10 s" de D132–D134. Alternativa: sacudir solo la bandera (el `<img>`) y dejar el marco quieto; se descartó porque en Capitales no hay imagen y el borde rojo es del marco

**Rama:** `style/animaciones-partida`

## Contexto común de la unidad (antes `38-animaciones-partida.md`)

> Estilo, rama `style/animaciones-partida` (P19, solo las ★ de "Partida", tanda
> 2026-09-26). Pedido del dueño: anillo verde que se expande y se desvanece al
> acertar; sacudida horizontal corta (±4 px, 200 ms) y borde rojo al fallar; la
> bandera nueva entra con `fade-in slide-in-from-right-4`. CSS / `tw-animate-css`,
> nunca framer (D006). El resto, decisiones del agente justificadas aquí.
