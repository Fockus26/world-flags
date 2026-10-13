# D193 · Accesibilidad · Escape cierra el tutorial aunque el foco se haya caído a `<body>` · Implementado

**Resumen:** `Tutorial` escucha `keydown` en `document` y, si llega un Escape no atendido con el foco en `<body>` (o en ningún elemento), cierra igual que "Saltar tutorial" (`onClose`, marca visto). Con el foco en cualquier elemento no hace nada: lo atiende React Aria o el diálogo que haya encima.

**Causa (reproducida con Playwright y teclado real, P45):** React Aria cierra el diálogo con Escape escuchando `keydown` **en el propio diálogo**, así que solo le llega con el foco dentro. Al abrir (incluida la apertura automática como invitado), en los pasos de texto y jugando con el foco en la respuesta, Escape cerraba bien. Fallaba con el foco perdido:
- en la partida de ejemplo, al responder una tarjeta: `AnswerForm` deshabilita el input enfocado y quita "Comprobar", y el foco cae a `<body>`;
- a veces, tras un clic en el fondo del modal (`isDismissable={false}`): el foco también acaba en `<body>`. Es lo más probable que se viera al cargar en W2.

Los listeners de teclado de la partida (`Session`, `CountriesPractice`, `DailyPractice`) solo miran las teclas de nota; no se comían el Escape.

**Decisión:** la condición es una función pura, `isLostFocusEscape` (`src/components/game/tutorial/tutorial-escape.ts`, con test): Escape, sin `defaultPrevented` y con `activeElement` igual a `body` o `null`. Así no se cierra dos veces (React Aria) ni se salta el diálogo de "Abandonar" anidado: con él abierto el foco está dentro y Escape cierra solo la confirmación, como antes (comprobado: primer Escape cierra la confirmación y devuelve el foco a "Abandonar"; el segundo cierra el recorrido).

**Alternativas descartadas:**
- Devolver el foco al diálogo cuando cae a `<body>`: arreglaría también el focus-trap, pero en Chrome deshabilitar el elemento enfocado no siempre dispara `blur`/`focusout`, así que la detección no es fiable; y robar el foco mientras se anuncia el aviso de acierto/fallo mete ruido al lector de pantalla.
- Arreglar la pérdida de foco en `AnswerForm` (llevarlo a la nota o al aviso): cambia el comportamiento de teclado de todas las partidas, no solo del recorrido. Queda como hallazgo aparte.

**Rama:** `fix/tutorial-escape`
