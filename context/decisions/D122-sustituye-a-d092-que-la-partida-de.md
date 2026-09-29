# D122 · Contenido · Sustituye a D092: que la partida de ejemplo no cuenta se dice en el texto del paso de la partida · Implementado

**Resumen:** Sustituye a D092: que la partida de ejemplo no cuenta se dice en el texto del paso de la partida (antes de empezar y al volver a jugarla, con cómo se sale) y en el aviso de abandonar. Instrucciones del paso por juego (`Record<GameType, …>`)

D092 lo decía una sola vez, en el aviso visible mientras se juega. Sin ese aviso
(D120), la información pasa a:

- **El texto del paso de la partida**, justo encima de "Empezar la partida":
  "Es una partida de ejemplo: no cuenta para tu progreso, tu racha ni el
  ranking, así que puedes fallar sin miedo. Para dejarla a medias, pulsa
  «Abandonar»; con Escape cierras el recorrido."
- **El aviso de abandonar** de la partida de ejemplo: "Es la partida de
  ejemplo: no se guarda nada. Vuelves al recorrido y puedes empezarla otra vez
  cuando quieras."

El resto de D092 se mantiene (bienvenida, ajustes, aviso del competitivo,
botones y fin no lo repiten). Copy provisional: `CONTENT_CHECKLIST.md` #39.

**Alternativa descartada:** decirlo solo en el paso anterior ("Juego y
ajustes"). Queda a un clic de distancia de la partida y quien vuelve a jugarla
("Jugar otra vez") no lo vería.

**Rama:** `feat/tutorial-modo-de-juego`

_Contexto común de la unidad (antes `29-tutorial-modo-de-juego.md`): en D120._
