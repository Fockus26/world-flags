# D205 · UX / Notificaciones · Interruptor "Notificaciones" en Configuración › Juego · Implementado

**Resumen:** el recordatorio diario solo se podía activar desde el aviso tras la primera partida y no había forma de apagarlo. Ahora la pestaña Juego tiene la fila "Notificaciones" (Desactivadas / Activadas), con el mismo patrón de dos `OptionTile` que "Sonidos" (D081).
- **Por dispositivo:** el estado se lee del navegador (`Notification.permission === "granted"` + `pushManager.getSubscription()`), no de `dailyReminder.optedIn`, que viaja con la cuenta. Mientras se consulta no va marcada ninguna opción.
- **Activar:** `subscribeToDailyReminder` dentro del gesto (D126). Si falla, el radio vuelve a "Desactivadas" y debajo sale el motivo (`role="status"`), con los mismos textos que el aviso (D127), que pasan a `utils/daily-reminder-explanations.ts`. El de "bloqueadas" dice "vuelve a intentarlo" en vez de "pulsa «Reintentar»" para servir a los dos.
- **Desactivar:** `PushSubscription.unsubscribe()` en el navegador, sin Edge Function nueva: `send-daily-reminders` ya borra la fila de `push_subscriptions` cuando el endpoint responde 404/410.
- Cambiarlo también guarda la respuesta (`saveDailyReminderAnswer`), así el aviso tras la partida no vuelve a preguntar.
**Alternativas descartadas:** Edge Function `unsubscribe-push` que borre la fila al momento (más backend y despliegue para lo mismo); un `Switch` suelto (rompe la lectura uniforme de la pestaña, D081).
**Rama:** `feat/interruptor-notificaciones`
