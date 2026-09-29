# D127 · UX · Si el recordatorio no se activa, el mismo aviso explica por qué y qué hacer · Implementado

**Resumen:** Si el recordatorio no se activa, el mismo aviso explica por qué y qué hacer (bloqueado, fallo, iPhone sin instalar, sin https, sin soporte), con "Reintentar" donde se puede arreglar sin salir; cerrar guarda **no**. Foco a la primera acción del estado nuevo

`subscribeToDailyReminder` devuelve qué pasó en vez de un booleano:
`subscribed`, `dismissed`, `denied`, `failed`, `insecure-context`,
`ios-needs-install` o `unsupported`.

- **`subscribed`** → se guarda la respuesta como sí y se cierra (como antes).
- **`dismissed`** (se cerró el diálogo del navegador sin elegir) → se guarda
  como no y se cierra, sin sermón: fue una decisión.
- **El resto** → el mismo aviso cambia de contenido: icono, título y qué hacer.
  `denied` explica cómo permitirlo en los permisos del sitio y ofrece
  "Reintentar"; `failed` también ofrece "Reintentar"; los que no se arreglan sin
  salir (iPhone sin instalar, sin https, navegador sin soporte) solo
  "Entendido". Cerrar desde aquí guarda la respuesta como **no** (antes se
  guardaba "sí" aunque no hubiera suscripción).

El aviso vive en la región `role="status"` de `SystemSnackbars`, así que el
cambio se anuncia. El botón pulsado desaparece al cambiar de estado: si el foco
estaba en el aviso, pasa a la primera acción del estado nuevo (no cae a `body`);
si estaba en otro sitio no se roba.

⚠️ Copy provisional (`CONTENT_CHECKLIST.md` #41): los cinco textos de
explicación.

**Decisión tomada / alternativa.** Se sigue haciendo la pregunta a todos y se
explica el problema al pulsar "Sí". La alternativa era no preguntar cuando se
sabe de antemano que no puede funcionar (sin soporte, sin https) o preguntar ya
con la explicación (`denied`): menos pasos, pero en iPhone sin instalar
escondería que la función existe. Tampoco hay todavía un sitio en Configuración
para activar el recordatorio más tarde: tras cerrar, no se vuelve a preguntar
(como antes); añadirlo sería una función nueva (MINOR).

**Rama:** `fix/avisos-sonido-notificaciones`

_Contexto común de la unidad (antes `30-avisos-sonido-notificaciones.md`): en D125._
