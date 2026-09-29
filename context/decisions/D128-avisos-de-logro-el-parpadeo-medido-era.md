# D128 · Animación · Avisos de logro: el parpadeo (medido) era al **salir** · Implementado

**Resumen:** Avisos de logro: el parpadeo (medido) era al **salir**: `tw-animate-css` usa `fill-mode: none` y la tarjeta volvía a opacidad 1 entre el fin de la animación (200 ms) y el `setTimeout` de 220 ms que la quitaba, todas a la vez si entraron juntas. Salida con `fill-mode-forwards` y se quita en `onAnimationEnd` (temporizador de 400 ms solo de red de seguridad). La entrada medida es limpia

**Reproducción (P12).** Invitado limpio en el servidor de desarrollo, Chrome sin
cabeza con Playwright. Se despacha un `setLearningData` que cruza tres umbrales a
la vez (5 sesiones perfectas, 500 aciertos, 90 % tras 500 respuestas), así que
entran tres avisos por la ruta real (`AchievementsEffects` → cola →
`AchievementToasts`). Se muestrea en cada fotograma la opacidad, la posición y la
animación de cada tarjeta, y la identidad del nodo (para ver remontajes).

**Qué se midió.**

- **Entrada:** limpia. Las tres tarjetas nacen en opacidad 0 con la animación
  `enter` y llegan a 1 en ~200 ms, sin remontajes ni saltos de posición. La cola
  no cambia de `key` ni de orden. Solo hay una tarea larga de ~130 ms (el propio
  despacho y el sellado) antes del primer fotograma.
- **Salida: el parpadeo.** A los 6 s las tres pasan a `exit` y bajan a
  opacidad 0,01 en 200 ms; en el fotograma siguiente **vuelven las tres a
  opacidad 1 y a su posición inicial** y un fotograma después desaparecen.

**Causa.** Las utilidades de `tw-animate-css` usan
`animation-fill-mode: none`: al terminar la animación de salida el elemento
vuelve a su estilo normal (visible). La tarjeta se quitaba con un
`setTimeout` de 220 ms, 20 ms más que la animación, y ese hueco (más lo que se
retrase el temporizador si el hilo principal va cargado) es el destello. Con un
solo aviso dura un fotograma; con varios, como todas entraron a la vez, salen y
destellan a la vez: un bloque entero que parpadea.

**Arreglo.**

1. La salida lleva `fill-mode-forwards`: se queda en su último fotograma
   (invisible) aunque la tarjeta tarde en quitarse.
2. La tarjeta se quita en `onAnimationEnd` de su propia animación de salida (se
   ignoran las que burbujean de dentro), no por un tiempo que tenga que coincidir
   con `duration-200`. Un temporizador de 400 ms queda solo como red de
   seguridad (pestaña oculta, animaciones apagadas); con movimiento reducido se
   quita al momento, como antes.

Medido después: las tarjetas pasan de 0,01 a desaparecer sin volver a 1; con
movimiento reducido entran y salen sin animación.

**No reproducido:** un parpadeo al **entrar**. Si el dueño lo sigue viendo al
entrar (p. ej. al terminar una partida, con Resultados subiendo a la vez), hace
falta una grabación de ese momento: la ruta de entrada medida no remonta ni
repite la animación.

La alternativa (animar también el hueco que dejan al irse, con una transición de
altura) evitaría el salto de las tarjetas de arriba cuando se va una de abajo
que llegó antes, pero añade medición de alturas para un caso raro (tandas
separadas en el tiempo); se deja fuera.

**Rama:** `fix/avisos-sonido-notificaciones`

_Contexto común de la unidad (antes `30-avisos-sonido-notificaciones.md`): en D125._
