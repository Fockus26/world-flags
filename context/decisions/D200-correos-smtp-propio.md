# D200 · Auth · Los correos de Supabase Auth salen por SMTP propio · Proveedor por confirmar

**Decisión:** los correos de registro y recuperación salen por un SMTP propio, no por el correo por defecto de Supabase (que solo entrega a los miembros del equipo del proyecto). El dueño dijo "Brevo/Resend" el 2026-10-16 sin elegir uno; el kit propone Brevo por SMTP. Falta confirmar el proveedor y configurarlo en Supabase › Auth › SMTP (acción del dueño).
**Por qué:** sin SMTP propio, Supabase solo entrega a los miembros del equipo del proyecto; los jugadores no recibirían la confirmación.
