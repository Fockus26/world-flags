# D143 · UX · Sonido `select` (tic en seno de 1318 Hz, 40 ms, muy bajo) al elegir juego, continente y cualquier `OptionTile` · Implementado

**Resumen:** Sonido `select` (tic en seno de 1318 Hz, 40 ms, muy bajo) al elegir juego, continente y cualquier `OptionTile`; hook `useSelectSound` que envuelve el `onChange` por dentro (la API de `ui/` no cambia). Suena tras el cambio y solo si cambia; con flechas también, dos tics a menos de 50 ms se quedan en uno

**Decisión:** `select`: un "tic" en seno de Mi6 (1318 Hz), 40 ms, pico 0,12, al elegir juego (`GameTypeToggle`, las dos formas), continente (`RegionOption`) y cualquier `OptionTile` (modo, orden, temporizador, dificultad, sonido, tema; también en la partida guiada). Por un hook, `useSelectSound`, que envuelve el `onChange` por dentro: ningún wrapper de `ui/` cambia su API. Suena **después** del cambio y solo si la opción cambia de verdad. Con flechas también suena; dos tics a menos de 50 ms se quedan en uno
**Por qué:** Es el sonido que más se repite: el más corto y bajo de la tabla, un roce y no una nota. Tras el cambio, para que activar "Sonidos" se confirme con el tic y desactivarlo no suene. Con flechas cada pulsación es una elección distinta (igual que un clic); lo que molestaría es la tecla mantenida, y eso lo corta el limitador

**Rama:** `feat/mas-sonidos`

## Contexto común de la unidad (antes `36-mas-sonidos.md`)

> Unidad `feat/mas-sonidos`. Pedido del dueño (P18 de `pendientes.md`), solo los
> recomendados: `select`, `start`, `penalty`, `record`, y `skip` con nota propia. Sin
> sonidos de hover, sin interruptor nuevo, sin `finish`/`streak`/`grade`/`page`/cuenta
> atrás. Siguen valiendo D080–D082 (Web Audio sintetizado, refuerzo y nunca única
> señal, respeta "Sonidos", falla en silencio), D125 (audible en el móvil) y D072
> (`sound.ts` solo lee).

### Por qué así

- **Castigo junto al fallo, no en su lugar.** La otra salida era que en competitivo el
  golpe sustituyera al fallo. Se descartó porque el fallo del competitivo sonaría
  distinto del de la práctica sin que se vea distinto, y porque el salto del
  competitivo tendría que elegir entre "no lo sé" y "castigo". Juntos, cada sonido dice
  lo suyo y están diseñados para no taparse (registro y duración distintos).
- **El tic también con flechas.** La alternativa era callarlo con teclado (detectar
  la tecla en el `keydown` del grupo). Se descartó: quien navega con teclado se
  quedaría sin el refuerzo que sí tiene quien usa el ratón, y lo que de verdad
  molesta (la tecla mantenida) ya lo corta el limitador de 50 ms.
- **Récord solo al batir.** La alternativa era sonar también en la primera marca de
  un alcance. Se descartó: "batir la mejor marca" pide una marca previa, y la primera
  vez de cada continente sonaría a récord sin serlo.
- **Selector del ranking.** `GameTypeToggle` también está en el ranking, así que allí
  cambiar de juego también hace tic. El selector de continente del ranking
  (`ui/Select`) no suena: es un filtro de consulta, no configuración de partida.

### Medido

Espía sobre `AudioContext.prototype.createOscillator` en el navegador (servidor de
desarrollo, invitado), contando las notas programadas por cada evento:

- Elegir juego, continente, modo, tema: un tic cada uno. Elegir la opción ya marcada:
  nada. Con "Sonidos" apagado: nada. Al activarlo: un tic. Flechas en un grupo: un tic
  por cambio.
- "Comenzar" y "Repetir práctica": `start` una vez.
- Fallo en competitivo: `incorrect` + `penalty`, los dos en el mismo instante, con el
  badge "+10 s". Saltar en competitivo: `skip` + `penalty` con "+20 s". Saltar en
  práctica: solo `skip`.
- Rush de Centroamérica que mejora la marca: `record` una vez, después del último
  acierto, con "¡Nuevo récord!" en pantalla. El rush que creó la marca no sonó.

Tests unitarios en `tests/unit/sound-table.test.ts` (duraciones relativas, `skip` de
una nota, programación sobre un `AudioContext` falso).
