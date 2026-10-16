# fix/avisos-sonido-notificaciones (W6, tanda 2026-09-24) — PR #31, 2.2.1
Pendientes P11, P12 y P13. Decisiones D125–D128 en context/decisions/30-avisos-sonido-notificaciones.md.
1. fix(sonido): fallo La4–Mi4 en triángulo + octava a ½, picos 0,65/0,7 (D125). Antes −5,6 dB (A) / −26,6 dB (móvil) respecto al acierto; ahora +0,6 / −1,8.
2. fix(logros): parpadeo reproducido al SALIR (fill-mode none + timer 220 ms > animación 200 ms). fill-mode-forwards + onAnimationEnd, timer de respaldo 400 ms (D128). Entrada medida limpia.
3. fix(notificaciones): requestPermission dentro del gesto (userActivation verificado), permiso previo, contexto seguro, iOS sin instalar, serviceWorker.ready con límite 10 s; el aviso explica cada fallo con "Reintentar" (D126, D127). Cerrar guarda "no" (antes "sí").
Acción manual: PUBLIC_VAPID_PUBLIC_KEY ausente en el .env local; comprobar producción y Edge Functions subscribe-push / send-daily-reminders.
No verificado: sonido en móvil real, diálogo real de permisos, iPhone real, suscripción completa.
