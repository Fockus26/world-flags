# D144 · UX · Sonido `start` (Do5→Sol5) al arrancar una partida (`startGame` con éxito) y la práctica diaria · Implementado

**Resumen:** Sonido `start` (Do5→Sol5) al arrancar una partida (`startGame` con éxito) y la práctica diaria; `skip` (Re5 suelto, neutro) al saltar o agotar el temporizador en `Session` y `CountriesPractice`. Sustituye la línea de D083 que hacía sonar el salto como fallo (se sigue viendo como fallo)

**Decisión:** `start`: Do5 que se desliza a Sol5 (220 ms) con su octava, al arrancar una partida (`startGame` con éxito: "Comenzar" y "Repetir") y la práctica diaria. `skip`: Re5 suelto (150 ms, triángulo, sin octava) al saltar o al agotarse el temporizador de práctica, en `Session` y `CountriesPractice`. Sustituye la línea de D083 que hacía sonar el salto como un fallo
**Por qué:** `start` en `useGame` y no en cada botón: suena solo si la partida arranca de verdad (un alcance ya practicado hoy no suena). `skip` ni sube ni baja: saltar es "no lo sé"; queda entre el acierto y el fallo en altura y más suave que los dos. Se sigue viendo como fallo (aviso rojo), como pide D083

**Rama:** `feat/mas-sonidos`

_Contexto común de la unidad (antes `36-mas-sonidos.md`): en D143._
