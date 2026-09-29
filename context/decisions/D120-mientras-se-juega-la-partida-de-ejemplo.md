# D120 · UX · Mientras se juega la partida de ejemplo, la cabecera del recorrido entera en `sr-only` · Implementado

**Resumen:** Mientras se juega la partida de ejemplo, la cabecera del recorrido entera en `sr-only`: sin aviso "Partida de ejemplo" ni "Saltar tutorial". Sale del `flex` (sin alto ni `gap`), así que la partida mide lo mismo que una normal también de alto. Se sale con "Abandonar" o con Escape (cierra el recorrido); "Saltar tutorial" sigue fuera de la partida

**Qué se hizo.** Con la partida de ejemplo en marcha, la cabecera del recorrido
queda entera en `sr-only`: ni aviso de "partida de ejemplo" ni "Saltar
tutorial". El `<h2>` del paso sigue ahí para el lector (nombra el diálogo) y la
región viva sigue anunciando el paso, como en D090.

`sr-only` en la cabecera y no solo en el `<h2>`: es `position: absolute`, así que
sale del `flex` en columna del diálogo y no se come ni su alto (`min-h-10`) ni el
`gap`. Resultado: la partida de ejemplo mide lo mismo que una normal **también
de alto** en pantallas bajas, que era lo que D090 dejaba pendiente ("pierde la
fila de cabecera", 48–73 px) y su alternativa descartada.

**Cómo se sale.** Con el "Abandonar" de la propia partida (vuelve al paso, con
su aviso de confirmación) o con Escape, que sigue cerrando el recorrido entero
(`isKeyboardDismissDisabled` no se toca, D073). Fuera de la partida —antes de
empezarla, tras terminarla y en los demás pasos salvo el último (D091)—
"Saltar tutorial" sigue donde estaba.

**Alternativa descartada:** dejar "Saltar tutorial" visible como botón pequeño
dentro de la cabecera de la partida. Obligaba a meter UI del recorrido dentro
de `CountriesPractice`/`Session` y era justo lo que el dueño pidió quitar.

**Rama:** `feat/tutorial-modo-de-juego`

## Contexto común de la unidad (antes `29-tutorial-modo-de-juego.md`)

> Unidad `feat/tutorial-modo-de-juego` (2.3.0), pendiente P9. Sobre
> D071–D074 (D071–D074) y D090–D092 (D090–D092).
> Pedido del dueño: quitar "Saltar tutorial" y el aviso "Partida de ejemplo…"
> **mientras se juega**, y dejar elegir el juego de la partida de ejemplo
> (hoy solo Países).
