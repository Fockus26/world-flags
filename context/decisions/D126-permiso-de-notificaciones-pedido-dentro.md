# D126 · UX · Permiso de notificaciones pedido **dentro del gesto** · Implementado

**Resumen:** Permiso de notificaciones pedido **dentro del gesto**: `subscribeToDailyReminder` deja de ser `async` y su primera acción asíncrona es `requestPermission` (forma promesa y callback); con `granted`/`denied` no se pregunta; se comprueban contexto seguro y soporte (iOS solo instalada); `serviceWorker.ready` con límite de 10 s. Falta `PUBLIC_VAPID_PUBLIC_KEY` en el `.env` local

**Pedido (P13).** El dueño pulsa "Sí, avísame" y el navegador nunca enseña su
diálogo de permiso.

**Qué se revisó y qué se encontró.**

| Punto | Antes | Ahora |
|---|---|---|
| Llamada dentro del gesto | `handleAccept` hacía `setIsSubscribing(true)` y luego llamaba a una función `async` cuya primera línea era `await Notification.requestPermission()`. Técnicamente síncrona (una `async` corre hasta su primer `await`), pero frágil: cualquier `await` que se añadiera antes la sacaba del gesto. | `subscribeToDailyReminder` ya no es `async`: comprueba el soporte (síncrono) y su primera acción asíncrona es la propia petición; el manejador la llama antes de tocar el estado. Medido con Playwright: la petición llega con `navigator.userActivation.isActive === true`. |
| Permiso ya decidido | Se llamaba igual; si estaba `denied` el navegador responde `denied` al instante **sin enseñar nada**, y la app cerraba el aviso como si hubiera ido bien. | Con `granted`/`denied` no se pregunta y se actúa según el caso (D127). |
| Contexto seguro | Sin comprobar. Por `http` fuera de `localhost` (el servidor de desarrollo abierto desde el móvil por la IP de la red) no existen `serviceWorker` ni `PushManager`: `isPushSupported()` daba `false` y el aviso se cerraba en silencio. | `getNotificationSupport()` lo distingue (`insecure-context`) y se explica. |
| Soporte | iPhone/iPad en Safari sin instalar no tienen `PushManager` (iOS solo da Web Push a la app en la pantalla de inicio, 16.4+): mismo cierre silencioso. | `ios-needs-install`, con instrucciones. |
| Safari antiguo | Solo acepta `requestPermission(callback)`. | Se atienden la forma con promesa y con callback. |
| Suscripción del SW | `navigator.serviceWorker.ready` no se resuelve nunca si el SW no se registró: el aviso se quedaba "enviando" para siempre. | Límite de 10 s y se da por fallido. |

**Lo más probable en el caso del dueño**, por orden: el permiso ya estaba en
`denied` para ese origen (un "Bloquear" anterior, o el bloqueo automático de
Chrome tras varios rechazos), Chrome con los avisos "silenciosos" (solo una
campana tachada en la barra de direcciones, sin diálogo), o probar desde el
móvil por `http://<IP>`. En los tres la app callaba; ahora lo dice.

**Fuera del cliente (no se toca aquí):** el `.env` local no tiene
`PUBLIC_VAPID_PUBLIC_KEY`. Sin ella, aunque se conceda el permiso, no hay
suscripción (ahora se ve el aviso de fallo y el motivo en la consola). Hay que
comprobar que esté en el entorno de producción y que las Edge Functions
`subscribe-push` y `send-daily-reminders` estén desplegadas con sus secretos
VAPID.

**Rama:** `fix/avisos-sonido-notificaciones`

_Contexto común de la unidad (antes `30-avisos-sonido-notificaciones.md`): en D125._
