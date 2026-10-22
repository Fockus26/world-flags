# QA funcional — flujo con cuenta completo + regresión #86–#103 — 2026-10-20

**Entorno:** slot wt2, origin/main 53284e7 (detached: main ocupada por wt1) · bun run qa:local -- --port 4302 · Supabase local en Docker (hubo que hacer supabase stop/start: el contenedor db llevaba 19 h unhealthy) · cuenta EMAIL_TEST + cuenta víctima local qa-victim@example.test · Playwright con node (.qa/ del slot).
**Resultado:** 0 críticos · 2 altos · 6 medios · 2 bajos

## Resumen
RLS sólido: ningún IDOR (leer/editar/borrar/insertar filas de otro usuario en user_learning_data, leaderboard_entries, push_subscriptions, app_config: todo bloqueado). XSS en el ranking escapado. Lo que no debería quedarse así: una subida lenta de otro dispositivo pisa un cambio más reciente de configuración (pérdida silenciosa; D055 solo se cumple en el cliente) y el trigger del ranking acepta cualquier tiempo en scopes que no conoce y nombres sin límite de longitud.

## Hallazgos

### [Alto] Una subida retrasada de otro dispositivo pisa un cambio más reciente (lastConfiguration)
- Flujo: sync entre dispositivos (D055)
- Pasos: 1. Contextos A y B con la misma cuenta. 2. En B retener 8 s el PATCH a user_learning_data tras jugar una partida (lleva last_configuration + field_updated_at). 3. Mientras, en A cambiar Modo (Práctica/Competitivo) en Configuración > Juego; A sube su PATCH (fecha 15:22:38). 4. Sale el PATCH de B (fecha 15:22:15). 5. A cierra sesión.
- Esperado: gana el cambio de A (fecha posterior).
- Ocurre: la fila queda con la config de B y field_updated_at.lastConfiguration = 15:22:15; A conserva la suya en local, cree que está sincronizado y al cerrar sesión el cambio se pierde.
- Evidencia: .qa/race2.mjs: DB final mode competitive con fecha 15:22:15, A local practice; tras logout de A la DB sigue en competitive.
- Impacto: pérdida silenciosa de perfil/configuración/notas con dos dispositivos y red lenta.
- Dónde mirar: src/utils/cloud-storage.ts:197-203 (UPDATE sin control de concurrencia: condicionar al updated_at leído y reintentar, o fusionar por fecha en servidor vía RPC).
- Para: backend-build · Reproducible: siempre (2/2 con la retención)

### [Alto] El ranking acepta tiempos imposibles en scopes no listados y nombres sin límite
- Pasos (API con el token del propio usuario): upsert en leaderboard_entries con scope flags:world, countries:world@2 o flags:hacked y best_time_ms=1: OK. display_name de 10 000 caracteres y avatar_style=evil: OK. updated_at=2999-01-01: OK.
- Esperado: el trigger rechaza scopes desconocidos y display_name > 24.
- Ocurre: el CASE termina en else null y deja pasar; la tabla pública se puede inflar sin límite (fetchLeaderboard trae el scope entero) y cualquier scope nuevo nace sin validación si no se toca el trigger.
- Dónde mirar: supabase/migrations/20261019154452_remote_schema.sql:103-132; falta check de longitud de display_name y lista blanca de scope.
- Para: backend-build · Reproducible: siempre (.qa/rls.mjs)

### [Medio] Errores de auth en inglés crudo
- Login con contraseña mala: "Invalid login credentials". Registro con correo existente: "User already registered" (la rama en español de useAuth.ts:68 no se alcanza: Supabase responde 422). Contraseña > 72: "Password cannot be longer than 72 characters".
- Dónde: src/hooks/useAuth.ts:15-19 (toAuthErrorMessage solo traduce el offline). Para: frontend-build · siempre.

### [Medio] El registro revela si el correo existe
- Crear cuenta con EMAIL_TEST: 422 user_already_exists. Decidir si se acepta. Para: dueño/backend-build · siempre en local; producción según configuración (acción 1).

### [Medio] Contraseña de 6 espacios aceptada
- Crear cuenta con contraseña y repetir = 6 espacios: cuenta creada y correo enviado. Dónde: AuthSection.tsx:266-284 y política de contraseñas de Supabase. Para: frontend-build · siempre.

### [Medio] D056: el progreso de invitado se descarta sin avisar
- Pasos: invitado juega Centroamérica (7 países), inicia sesión en una cuenta con progreso: los 7 desaparecen sin mensaje (discardedLocal no llega a la UI). Es decisión del dueño, pero el jugador no sabe qué pasó. Dónde: GameEffects.tsx:268-289. Para: frontend-build · siempre.

### [Medio] Token alterado: "No se pudo sincronizar" en bucle en vez de cerrar sesión
- Pasos: con sesión, alterar los 5 últimos caracteres de access_token en la clave sb-*-auth-token de localStorage y recargar: PGRST301 en cada intento, aviso de reintento indefinido, sigue como sesión iniciada. (Expirado + refresh inválido sí vuelve a invitado bien.) Para: frontend-build · siempre.

### [Medio] Cerrar sesión en otra pestaña: la primera sigue jugando sin aviso
- Pasos: dos pestañas; en A empezar partida; en A2 cerrar sesión; A sigue sin aviso y lo jugado queda como invitado, no llega a la cuenta. Para: frontend-build · siempre.

### [Bajo] El foco cae a body tras iniciar sesión
- Tras el login activeElement = BODY y el primer Escape no cierra el modal. Dónde: AuthSection.tsx (el formulario se desmonta). Para: frontend-build · siempre.

### [Bajo] Sin límite de intentos de login en local
- 50 signInWithPassword fallidos seguidos: 50 x 400, nunca 429. Producción no verificada (acción 2).

## Verificado sin fallos
- RLS/IDOR completo; app_config no escribible; push_subscriptions no legible ni insertable por anon.
- XSS en nombre del ranking se pinta como texto y se trunca; sin scroll horizontal.
- Doble clic + Enter en Crear cuenta: 1 POST. Enlace de confirmación inicia sesión en la pestaña original; reusado da otp_expired (vuelve a invitado sin explicar el error: menor).
- Dos dispositivos: nombre por fecha (gana el último), partidas simultáneas sin pérdidas ni duplicados (28 países, sesiones y stats iguales), logros unidos.
- Offline: aviso Sin conexión y subida al volver (sesiones 8 a 9). D053: logout offline o con 500 pide confirmación; con red y pendiente guarda y cierra sola.
- Caché del ranking (D188): reabrir antes de 60 s no pide de nuevo.
- Lotes: doble clic en Empezar crea uno solo; recargar a mitad lo conserva; abandonar (doble clic en Sí, abandonar) llega a B y el foco vuelve a Aprender por lotes.

## No verificado
| Qué | Por qué no se pudo |
|---|---|
| Interruptor Notificaciones (D205, en main por #92) | Necesita permiso y push real; headless sin VAPID local |
| Subir marca de rush desde la UI | Requiere completar un rush competitivo; validado por API (trigger) |
| Rate limit y enumeración en producción | Solo base local |
| Sesión que expira en mitad de una partida real (1 h) | Simulado con token alterado/expirado |

## Datos creados
Solo base local: qa-victim@example.test, qa-sp-*, qa-dbl-*, qa-long-*@example.test y filas basura en leaderboard_entries. Nada remoto; el próximo qa:local (db reset) lo borra.

## Acciones requeridas del dueño
1. Enumeración: Supabase Dashboard > Authentication > Sign In / Providers > Email: confirmar que Confirm email está activo en producción. Devolver sí/no.
2. Rate limit: Dashboard > Authentication > Rate Limits: valor de Sign-ups and sign-ins. Devolver el valor.
3. Cuando backend-build prepare la migración del trigger, aplicarla y revisar basura con: select scope, count(*) from leaderboard_entries group by scope; borrar scopes no válidos o display_name > 24.
4. Probar D205 en un móvil real: Configuración > Juego > Notificaciones Activadas, recargar, sigue Activadas; Desactivadas, recargar, sigue Desactivadas.

## Camino feliz
Registro con confirmación (Mailpit), login/logout, invitado adopta su progreso en cuenta nueva, dos dispositivos jugando y cambiando nombre, offline y vuelta, lotes crear/seguir/abandonar, ranking por juego y continente: funciona salvo lo reportado.
