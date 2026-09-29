# D152 · Tokens · Anillo de acierto 600 ms `ease-out` (nuevo en la escala de movimiento). Movimiento reducido: sin sacudida ni anillo · Implementado

**Resumen:** Anillo de acierto 600 ms `ease-out` (nuevo en la escala de movimiento). Movimiento reducido: sin sacudida ni anillo; borde rojo fijo al fallar y verde fijo al acertar

**Decisión:** El anillo dura **600 ms** (`ease-out`), fuera de la escala 150/180/200/300 ms de `DESIGN_TOKENS.md` (se añade allí). Con movimiento reducido (variante `motion-safe:`/`motion-reduce:` de HeroUI, que atiende tanto `prefers-reduced-motion` como `data-reduce-motion`): sin sacudida ni anillo que crece; el fallo conserva el borde rojo fijo y el acierto pasa a un borde verde fijo (`motion-reduce:ring-2 motion-reduce:ring-success`)
**Por qué:** Con 200 ms un anillo que se expande y se desvanece apenas se percibe; 600 ms cabe entero en los 900 ms que la tarjeta se queda antes de avanzar en competitivo (`RUSH_ADVANCE_MS`). Sin el borde verde, con movimiento reducido el acierto no dejaba ninguna marca en la bandera y el fallo sí: simétrico es más claro. El color nunca es la única señal: el aviso de `AnswerForm` lleva icono y texto. Alternativa: con movimiento reducido no mostrar nada en el acierto (más fiel al "se desvanece")

**Rama:** `style/animaciones-partida`

_Contexto común de la unidad (antes `38-animaciones-partida.md`): en D151._
