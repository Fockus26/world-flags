# D240 · Juego · Mapa: cuarto juego, de momento solo práctica · Implementado

**Resumen:** `gameType: "map"`, progreso en `mapGame` (columna `map_game`, migración `drizzle/0002_juego_mapa.sql`). Sale un país con su nombre y su bandera y se toca en el mapa (`session/map/MapPractice.tsx` sobre `WorldMap`, D239). Competitivo, ranking, práctica diaria y partida de ejemplo del recorrido no existen todavía para Mapa: `COMPETITIVE_GAME_TYPES` es la lista de los juegos que sí los tienen.

**Acción del dueño, antes de desplegar:** aplicar la migración (`bun run db:migrate`, ver `drizzle/README.md`). Si la API pide `map_game` y la columna no existe, falla y toda cuenta se queda en `local` sin sincronizar (D044/D050).

### La partida (decisiones del dueño, 2026-11-23)

- **Pregunta:** «¿Dónde está Bolivia?» con la bandera al lado (decorativa: el nombre ya está escrito).
- **Toque equivocado:** el país tocado se marca en rojo y un aviso dice «Eso es Perú. Prueba otra vez.». Ya no cuenta como acierto a la primera. Al tercer fallo (`MAX_WRONG_TAPS`, **el tope es propuesta del agente, sin confirmar**) el mapa enseña dónde está.
- **«No lo sé»:** enseña el país y se califica solo como «otra vez», igual que «Saltar» en las otras prácticas.
- **Al acertar o revelar:** el mapa vuela al país, su bandera aparece recortada en la silueta 0,7 s y se funde en otros 0,7 s, dejando el color de su continente (D238). Con movimiento reducido el fundido es instantáneo.
- **Encuadre:** mientras se busca, los continentes de la partida (el mundo entero si son los ocho). Los países ya ubicados en la partida quedan pintados y dejan de poder tocarse.
- **Calificación:** los mismos cuatro botones, las teclas 1–4, la cola con reencolado y SM2 de las otras prácticas (`usePracticeQueue`). El temporizador por tarjeta de la práctica también vale.
- **Teclado:** cada pregunta deja el foco en el mapa (`autoFocusKey`).
- **Lector de pantalla (D239):** un texto solo para lector avisa, en la configuración y al entrar a la partida, de que el juego necesita ver el mapa y ofrece los otros tres.

### Un juego sin competitivo

- `resolveGameMode(gameType, mode)`: Mapa se juega siempre en práctica. `startGame` lo aplica y **no** pisa el modo guardado: al volver a Banderas sigue en el que estaba.
- En Ajustes › Juego, con Mapa elegido solo sale «Práctica», con una línea que lo explica.
- El ranking no ofrece Mapa (`GameTypeToggle` gana `gameTypes`); `getLeaderboardMinimums` y `collectLeaderboardMarks` recorren `COMPETITIVE_GAME_TYPES`, así el servidor sigue aceptando los 27 scopes de siempre.
- «Práctica diaria» no sale con Mapa elegido. «Aprender por lotes» sí: usa la práctica normal.
- El logro de «los tres juegos» sigue siendo de Países, Banderas y Capitales.
- El recorrido inicial no ofrece Mapa como partida de ejemplo.

### Clientes viejos

Un cliente con el SW en caché que reciba `gameType: "map"` por la nube cae a Países al leerlo y no toca lo guardado (D062). No conoce `map_game` y no la manda: Postgres conserva lo que hubiera (D028).

### El laboratorio

`/mapa-lab` y `src/lab/` (D239) se quitan: el mapa ya se prueba en la app.

### Si el mapa no llega, y sin red (QA funcional, 2026-11-23)

- `world-map.json` se pide con `fetch` a su URL (`utils/world-map-loader.ts`), no con `import()`: un fallo no queda recordado y la siguiente llamada lo reintenta. Mientras falla, `WorldMap` lo dice («No se pudo cargar el mapa. Revisa tu conexión.») y ofrece «Reintentar».
- `FlagPrecacheEffects` pide el mapa junto con las banderas (mismas condiciones: con service worker al mando, con red, sin ahorro de datos ni 2G). El service worker guarda todo GET propio, así que `public/sw.js` no cambia. Con eso Mapa se juega sin red aunque nunca se haya abierto.
- Volver a tocar el país que ya está en rojo no gasta otro de los tres intentos (un doble toque gastaba dos).

### Verificación (2026-11-23)

- QA funcional con cuenta y base local (`.qa/functional-qa-mapa.md`): migración, API, sincronización entre dispositivos, modos, temporizador y «Aprender por lotes», sin hallazgos. Sus dos hallazgos (mapa en blanco, doble toque) están arreglados: los dos repros de `.qa/repro/functional/` pasan sobre el build, y el mapa queda en la caché del service worker sin abrir el juego.

- Sobre el build, servido en estático y como invitado: partida completa de Sudamérica a 375 px (toque equivocado, acierto al segundo intento, «No lo sé», tres fallos, resultados 9 de 12). En `localStorage`, el progreso quedó solo en `mapGame` y el modo guardado no cambió.
- `.qa/mapa-partida-axe.mjs`: 0 violaciones y sin scroll horizontal en configuración, pregunta, tras un toque y revelado, a 320 y 1280 px, claro y oscuro.
- `tests/unit/map-game.test.ts`.
- **Sin probar:** con cuenta y base (la sincronización de `map_game`), la migración contra Postgres, un móvil real, el temporizador por tarjeta, «Aprender por lotes» con Mapa.
