# D230 · Juego · Sin bandera a la vista no corre el tiempo ni se puede responder; a los 10 s, «Probar otra» sin castigo · Implementado

**Decisión del dueño:** esperar o cambiarla gratis.

- **`FlagDisplay` avisa** (`onReady`) cuando la bandera se ve. Hasta entonces no se muestra (sin icono de imagen rota) y se reintenta sola: cada intento se corta a los 8 s (una red colgada no da error) y, tras un fallo, espera 1, 2, 4 y luego 8 s.
- **La descarga va por `fetch` + `AbortController`** y el `<img>` pinta una URL `blob:` (se libera al cambiar). No vale remontar el `<img>`: Chrome cuelga el `<img>` nuevo con la misma URL de la petición que ya estaba colgada, así que el "reintento" no pedía nada (visto con Playwright: 1 petición en 10 s). Pasa por el service worker: una bandera precargada sale de la caché al momento.
- **Reloj en pausa** mientras no se ve: el cronómetro del rush, la cuenta atrás de la práctica con temporizador (no agota la bandera ni la salta) y el tiempo de práctica que va a las estadísticas (`Session` y `DailyPractice`). La espera de la primera bandera tampoco cuenta.
- **Pausas que coinciden:** `utils/session-clock.ts` lleva las razones (transición entre banderas, modal de abandonar, bandera que no se ve). El reloj vuelve a correr cuando no queda ninguna, y el tiempo parado se descuenta una sola vez. Sustituye el `isClockPausedRef` y la cuenta aparte del modal.
- **Bloqueo:** sin bandera, «Comprobar» y «Saltar» se apagan y la partida ignora Intro. En el Repaso diario no se puede revelar. Se puede ir escribiendo.
- **«Probar otra»** aparece a los 10 s sin bandera, si queda otra a la que cambiar. La bandera va al final de la cola y sale la siguiente, sin castigo, sin calificar y sin contar como salto. En práctica, el turno sube y la cuenta atrás arranca de cero. En el rush cambia el orden local (`rushOrder`): el conjunto de países y su número no cambian. Lo escrito se borra.
- **Aviso no visual:** `role="status"`, siempre montado, con «Cargando la bandera… El tiempo está en pausa.» a los 0,5 s (las de caché no parpadean) y otro texto a los 10 s. Icono girando solo con `motion-safe`. El copy es provisional (`CONTENT_CHECKLIST`).
- **Fuera:** Capitales no tiene imagen (`stimulusNeedsLoading`), y el tablero de Países no muestra banderas.

**Por qué:** una bandera sin guardar con la red colgada seguía sin cargar a los 12 s, sin error (sonda de D229), mientras el reloj del rush seguía y la cuenta atrás de la práctica la agotaba y la saltaba. Se pagaban castigos a ciegas.

**Alternativa descartada:** saltar la bandera automáticamente (decide por quien juega) o dejarla fuera de la partida (cambia el número de países del rush y su ranking).

**Verificación:** `tests/unit/session-clock.test.ts` (pausas que se solapan, espera inicial, `moveCardToEnd`, `deferCurrentCard`) y `.qa/sin-bandera-probe.mjs` (Playwright sobre el build local, banderas colgadas sin respuesta ni error): aviso en `role="status"`, «Comprobar» y «Saltar» apagados, Intro sin efecto, reintento real (2 peticiones en 10 s), «Probar otra» a los ~10 s que pide otra bandera y borra lo escrito, carga sola al volver la red aunque las colgadas sigan colgadas (también con el service worker al mando), y cronómetro del rush parado sin bandera y corriendo al verse.
