# D217 · Seguridad · El ranking rechaza un nombre hecho solo de espacios · Implementado (migración sin aplicar)

**Resumen:** la QA de cierre del 2026-10-21 ([Bajo]) subió por API `display_name: "   "` con una marca válida y obtuvo 201: D211 solo mira `char_length` (de 1 a 24), y tres espacios miden 3. Quedaba una fila con el nombre en blanco en el ranking público.

**Decisión:** migración nueva `supabase/migrations/20261021120000_leaderboard_nombre_en_blanco.sql` (la de D211 ya está aplicada y no se edita), que redefine `leaderboard_entries_validate_time()` igual que D211 más una comprobación: si `btrim(display_name, <espacios>)` queda vacío, `PT422` con `leaderboard_profile_rejected` (detalle `display_name en blanco`). Se mira en cada insert y update, como el resto del nombre.
- **Qué es un espacio:** exactamente lo que quita `String.prototype.trim` (tab, saltos, espacio, espacio duro, U+1680, U+2000–U+200A, U+2028/2029, U+202F, U+205F, U+3000, BOM), escrito con `chr()`. Un test recorre U+0000–U+FFFF y compara esa lista con la del SQL. Así nada que el cliente mande tras recortar se rechaza, y nada que el cliente vea vacío pasa.
- **Cliente:** ya lo cumplía: `toLeaderboardDisplayName` recorta y cae a "Explorador", y el campo Nombre de `AccountTab` vuelve al nombre anterior si queda vacío al recortar. Solo se añaden tests (espacio duro, ideográfico, tab).
- El test del SQL lee la última migración que redefine la función, no un nombre de archivo fijo.

**Verificado en local** (`bun run qa:local -- --port 4304`): los 14 casos de D211 siguen igual y los 7 nombres en blanco (insert y update de perfil) devuelven 422; `" Ana "` y el update legítimo pasan (`.qa/w11-trigger.mjs`, 32 comprobaciones). `supabase/leaderboard-limpieza-d217.sql` encuentra y borra filas en blanco sembradas con el trigger desactivado.

**Aplicar en producción (dueño):** `supabase/leaderboard-limpieza-d217.sql` (revisar → borrar en transacción) y después `supabase db push`. El orden no es crítico: no hay constraints y el cliente siempre manda un nombre recortado, así que las filas viejas no quedan bloqueadas.

**Alternativas descartadas:** editar la migración de D211 (ya aplicada: `db push` no la volvería a correr); `[[:space:]]` en regex (depende del locale de la base); recortar en el trigger en vez de rechazar (el pedido es rechazar, como D211); tratar también como blanco los caracteres de ancho cero (U+200B…): `trim` no los quita, así que el cliente los mandaría y quedarían rechazados para siempre; si se quiere, va con su cambio en el cliente.
**Rama:** `fix/ranking-nombre-espacios`
