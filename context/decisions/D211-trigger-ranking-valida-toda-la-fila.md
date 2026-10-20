# D211 · Seguridad · El trigger del ranking valida toda la fila: scope, nombre ≤ 24, avatar y fecha del servidor · Implementado (migración sin aplicar)

**Resumen:** el functional-qa del 2026-10-20 ([Alto] 2) subió con el token de un usuario normal `flags:hacked`, `flags:world` o `countries:world@2` con `best_time_ms = 1`, un `display_name` de 10 000 caracteres, `avatar_style = 'evil'` y `updated_at = 2999-01-01`, y todo pasó: el `case` de mínimos acababa en `else null` (D114) y nada miraba el resto de columnas. La tabla es pública y `fetchLeaderboard` trae el scope entero, así que se podía inflar sin límite. Se sustituye D114 en lo que toca a los scopes desconocidos.

**Decisión:** migración `supabase/migrations/20261020120000_leaderboard_validar_todo.sql`, que redefine `leaderboard_entries_validate_time()` (el trigger no cambia):
- **Scope:** solo los 27 vigentes (`getLeaderboardScope`: 3 juegos × "Todo el mundo" y 8 continentes, con sus mínimos de D112/D138) y los dos viejos `world` y `capitals:world`, que siguen sin mínimo (D114: los escriben clientes anteriores a la regla 2 y nadie los lee; son 2 filas por usuario como mucho). Cualquier otro: `leaderboard_scope_rejected`.
- **Nombre:** `char_length(display_name)` de 1 a 24, el `maxLength` del campo Nombre (ahora la constante `LEADERBOARD_DISPLAY_NAME_MAX_LENGTH`).
- **Avatar:** `avatar_style` nulo o uno de `AVATAR_STYLES` (no ha cambiado desde la beta); `avatar_seed` nulo o ≤ 64 (los de la app miden ~16).
- **Fecha:** `updated_at` la pone el servidor: `now()` al insertar o al cambiar tiempo o scope; la anterior si el tiempo no cambia (update de perfil, D079, o una marca peor, D139). Lo que mande el cliente se ignora.
- Todo rechazo usa `PT422`: el cliente ya lo trata como definitivo, sin reintentos (D113). Mensajes distintos (`leaderboard_time_rejected`, `leaderboard_scope_rejected`, `leaderboard_profile_rejected`) para el log.
- Nombre y avatar se validan en cada insert/update; scope y tiempo, solo al insertar o si cambian. Así una fila vieja inválida no bloquea el update de perfil del resto (lo medido en local).
- **Cliente:** `upsertLeaderboardEntry` y `syncLeaderboardProfile` mandan `toLeaderboardDisplayName(name)`: sin espacios en los extremos y cortado a 24 puntos de código (lo mismo que cuenta `char_length`), con "Explorador" si queda vacío. Un perfil con un nombre más largo (escrito por otra vía) sigue subiendo sus marcas en vez de quedar rechazado para siempre.

**Por qué:** cerrar la lista de scopes acota la tabla a 29 filas por usuario. Los dos viejos se mantienen porque rechazarlos rompe a los clientes antiguos sin ganar nada (D114 sigue valiendo para ellos). El riesgo de D114 ("un scope nuevo que el cliente estrene antes que el SQL perdería marcas") se cubre con el proceso: los scopes nuevos llegan con su migración, y el test `leaderboard-validation.test.ts` compara la lista del SQL con `getLeaderboardMinimums()`.

**Verificado en local** (`bun run qa:local -- --port 4302`, Supabase en Docker): los ataques del informe devuelven 422 (`.qa/w5-trigger.mjs`, 32 comprobaciones); una marca legítima de Banderas en Norteamérica sube desde la app (cola de `GameEffects`) con un nombre de 30 caracteres cortado a 24, y la marca imposible del mundo no se sube; el script de limpieza borra/corrige las filas sembradas y deja 0 inválidas.

**Aplicar en producción (dueño):** primero `supabase/leaderboard-limpieza-d211.sql` (revisar → limpiar en transacción), después la migración. La migración no añade constraints, así que no fallaría con filas existentes; la limpieza va antes porque con el trigger nuevo `updated_at` ya no se puede corregir con un update normal.

**Alternativas descartadas:** rechazar también `world` y `capitals:world` (clientes viejos en bucle de reintentos, D114); `check` constraints en la tabla (fallan al aplicarse si queda una sola fila mala y no distinguen insert de update de perfil); cortar el nombre en el trigger en vez de rechazar (el pedido es rechazar, y el cliente ya manda el nombre cortado).
**Rama:** `fix/ranking-trigger-validacion`
