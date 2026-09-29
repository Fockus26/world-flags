# D068 · Componentes · `Session` sirve a Banderas y Capitales: `SESSION_CARDS` (`session-cards.tsx`) da estímulo, respuesta, comparación y textos · Implementado

**Resumen:** `Session` sirve a Banderas y Capitales: `SESSION_CARDS` (`session-cards.tsx`) da estímulo, respuesta, comparación y textos; el juego sale de la configuración. Banderas sigue con `isCorrectAnswer`. `AnswerForm.answerNote` va dentro del aviso para que se anuncie

`FlagGame` manda Países a sus componentes (sin cambios) y **todo lo demás** a
`Session`. Lo que cambia por juego lo da una tarjeta de sesión
(`session/session-cards.tsx`, `SESSION_CARDS: Record<CardGameType, …>`): qué se
muestra, qué respuesta se enseña, cómo se comprueba, la pregunta y el
placeholder, y una nota opcional para el aviso.

- `Session` lee el juego de `activeGame.configuration.gameType`; sus cinco
  `"flags"` fijos (calificar, intento de rush y los dos `finishGame`) pasan a
  ser ese valor, y la cola de repaso lee el historial de ese juego
  (`toGameView`), no siempre el de Banderas.
- **Banderas compara con `isCorrectAnswer` tal cual**, no con el comparador de
  Capitales: acepta exactamente lo mismo que antes. Mismos textos, misma
  `FlagDisplay`.
- `AnswerForm` gana `answerNote?` (aditivo; Banderas no la pasa). Va **dentro**
  del aviso de acierto o fallo, no al lado, para que el lector de pantalla lo
  anuncie con él (`role="alert"` / `"status"`). En Capitales: "También vale
  La Paz." (las demás respuestas que valen, unidas con "o") y la nota de la
  capital.
- Al acertar con un alias el aviso enseña igualmente la capital principal
  ("Correcto: Sucre · También vale La Paz."): enseña la que se muestra en el
  resto del juego.
- El rush de Capitales es el camino competitivo de `Session` con otra tarjeta:
  cada país una vez, penalizaciones de 2 s y 5 s, tildes obligatorias,
  `completed: true` siempre (D069 lo completa con el ranking en la Fase 6).
- Arreglos de copy de paso (aprobados, pregunta 8 del plan): "Acertaste X de Y
  **banderas** a la primera" usa el sustantivo del juego (también salía en
  Países) y la ayuda de modo de juego dice "calificas cada **respuesta**" en vez
  de "cada bandera".
- El doble envío y la doble calificación que Capitales habría heredado se
  arreglaron antes, en su propio PR (`fix/sesion-calificacion-doble`, #14).

### Verificación (navegador real, servidor levantado por el agente con permiso del dueño)

- Práctica de Capitales: Argentina en minúsculas en difícil (vale: difícil
  distingue tildes y signos, no mayúsculas, igual que Banderas); Bolivia con
  "La Paz" (acierto, con alias y nota); Brasil con "Brasília" en difícil (fallo);
  Chile saltado (revela Santiago, alias y nota); "quíto" en fácil (acierto).
  Pulsar "1" dos veces califica una sola vez.
- El progreso cae en `capitalsGame.countryHistory`; el de Banderas no se toca.
  Las sesiones se guardan con `gameType: "capitals"`.
- Temporizador de práctica de 5 s: al agotarse revela la capital.
- Rush de 3 países: "Recorriste 3 capitales en 5.51" (con una penalización).
  Práctica de 1 país: "Acertaste 1 de 1 capitales a la primera".
- Banderas intacta: bandera, pregunta y placeholder de siempre, "Peru" sin
  tilde sigue fallando en difícil y la nota va a `countryHistory`.
- 320 px (en claro) con el nombre más largo y la nota más larga (Israel): sin
  scroll horizontal. axe-core 4.10.2 sin violaciones en claro y en oscuro.
- **No verificado:** Enter y las flechas (el panel no entrega esas teclas; las
  respuestas se enviaron con el formulario); lector de pantalla real.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
