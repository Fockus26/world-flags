# D158 · UX · "Pop" `zoom-in-95` al elegir · Implementado

**Resumen:** "Pop" `zoom-in-95` al elegir (continente que se marca, `OptionTile`, píldora del selector de juego) solo desde el `onChange` del usuario: estado local que apaga `animationend`, o contador como `key` del relleno de la píldora (dos capas para no pisar su `translateX`). Ni al montar ni al restaurar lo guardado

**Decisión:** "Pop" al elegir: `animate-in zoom-in-95` (de 95 % a 100 %, `tw-animate-css`, con `motion-safe:`) en la tarjeta de continente que se **marca**, en la `OptionTile` elegida y en la píldora del selector de juego. Solo sale del `onChange` del usuario: un estado local (`isPopping`, que se apaga en el `animationend` del propio elemento) o, en la píldora, un contador que hace de `key` del relleno. Ni el montaje, ni la selección guardada que llega tras la carga, ni desmarcar un continente lo disparan. La píldora va en dos capas: la de fuera se desliza con su `transform` en línea y la de dentro hace el pop
**Por qué:** El pop anima `transform`; las utilidades de hover y pulsado de Tailwind 4 usan `translate` y `scale` (propiedades aparte), así que se suman sin pisarse. En la píldora, el pop en la misma capa pisaba el `translateX` y la píldora saltaba a la primera opción mientras duraba. Una sola vez por elección, 150–200 ms: lejos del límite de 3 destellos por segundo. Alternativa: pop solo en el indicador (la casilla de la tarjeta), más discreto

**Rama:** `style/animaciones-configuracion`

_Contexto común de la unidad (antes `40-animaciones-configuracion.md`): en D157._
