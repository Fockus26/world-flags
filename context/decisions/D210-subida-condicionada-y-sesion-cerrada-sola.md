# D210 · Sincronización · Subida condicionada a la versión leída; token rechazado y cierre en otra pestaña cierran la sesión con aviso y apartan lo pendiente · Implementado

**Resumen:** cada subida de `user_learning_data` es un `UPDATE … WHERE user_id AND updated_at = <leído>` (o un `INSERT` si no había fila). Si otro dispositivo escribió entre la lectura y la subida, no se toca nada y se vuelve a leer y fusionar (`runVersionedSync`, hasta 3 vueltas). Un token que el servidor rechaza se refresca una vez; si sigue rechazado, se cierra la sesión en este dispositivo. Todo cierre de sesión no pedido en la pestaña se avisa ("Se cerró tu sesión") y lo que quedaba sin subir se aparta y vuelve como cola al entrar de nuevo con esa cuenta.

Hallazgos del QA funcional del 2026-10-20: [Alto] 1, [Medio] 7 y [Medio] 8.

## Concurrencia (hallazgo 1)

- **Qué pasaba:** D051 lee → fusiona → sube, pero el `UPDATE` era incondicional. Una subida retenida (red lenta) de B salía después de la de A y pisaba la configuración más reciente de A con la suya, con su fecha vieja; la fusión por fecha de D055 nunca llegaba a ver el cambio de A.
- **Ahora:** `fetchRemoteLearningData` trae también `updated_at` (la versión). `pushLearningData` sube condicionada a esa versión y pide `select=user_id` para saber si escribió; cero filas = conflicto. Sin fila, `INSERT` en vez de `upsert`: si otro dispositivo la creó entre medias (23505), también es conflicto. El bucle (`src/utils/sync-attempts.ts`) es puro y se prueba contra una fila en memoria con el orden de llegada invertido (`tests/unit/sync-concurrency.test.ts`).
- **Versión nueva distinta de la leída:** `nextVersion` suma 1 ms si la hora local coincide con la leída (relojes desajustados), para que no se confundan.
- **Sin migración:** `updated_at` ya existía (`not null default now()`) y la escribe el cliente. Es lo que ya proponía D051 como "siguiente paso posible".
- **Límite:** un cliente viejo en caché (SW) sigue subiendo sin condición hasta que se actualiza. Protegerlo exigiría un trigger en el servidor que fusionara por fecha (`field_updated_at`), duplicando en SQL la regla de `pickLatest`.
- Si se agotan los 3 intentos (`SyncConflictError`), la subida falla como cualquier otra y la cola reintenta (D051).

## Sesión rechazada (hallazgo 7)

- `CloudRequestError.sessionRejected`: 401 o códigos `PGRST301`–`PGRST303` de PostgREST.
- `GameEffects` (hidratación y subidas): la primera vez `supabase.auth.refreshSession()` y reintento inmediato; si el refresco falla o el token nuevo vuelve a rechazarse, `signOut({ scope: "local" })`. La marca se borra con cada sincronización buena.
- Con un token alterado y el refresh token bueno, el refresco lo arregla sin cerrar nada: es mejor que cerrar la sesión.

## Cierre no pedido (hallazgos 7 y 8)

- `useAuth().signOut` marca su cierre como voluntario (`src/utils/session-end.ts`). Cualquier otro `SIGNED_OUT` de una sesión que estaba abierta (otra pestaña por `BroadcastChannel`, refresco fallido, el cierre forzado de arriba) pone `auth.endedUnexpectedly`.
- `SessionEndedSnackbar` (en `SystemSnackbars`, región `aria-live`) lo avisa hasta "Entendido" o hasta volver a entrar. Un solo texto para todas las causas: Supabase no dice cuál fue.
- `GameEffects`, antes de borrar los datos de la cuenta (D009), aparta datos + base si había cambios pendientes (`savePendingAccountData`). Al hidratar esa misma cuenta en este dispositivo, `restorePendingAccountData` los repone como datos locales + base: la cola de D049, que la sincronización fusiona y sube. Lo jugado como invitado entre medias se descarta, como en D056. Los de otra cuenta se quedan apartados para la suya.
- **Límite:** si el cierre llega mientras la pestaña aún está en `loading` (hidratando), no hay base en memoria y no se aparta nada.

**Alternativas descartadas:**
- Fusión por fecha en el servidor (RPC/trigger): protege también a clientes viejos, pero duplica la regla de fusión en SQL y exige migración en producción. Se puede añadir encima más adelante.
- Cerrar la sesión al primer 401 sin refrescar: un access token caducado o alterado con refresh token válido se arregla solo; cerrar sería peor.
- No borrar los datos de la cuenta en un cierre no pedido: el invitado jugaría sobre los datos de la cuenta (contra D009).

**Rama:** `fix/sync-concurrencia-sesion`
