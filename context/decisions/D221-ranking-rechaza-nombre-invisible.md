# D221 · Seguridad · El ranking rechaza un nombre hecho solo de caracteres invisibles · Implementado (migración sin aplicar)

**Resumen:** la QA de cierre del 2026-10-21 (hallazgo 9) subió por API nombres hechos solo de caracteres de ancho cero o "en blanco" (U+200B, U+3164, U+2800…). `trim` no los quita, así que D217 no los veía: quedaba una fila que en el ranking público se ve vacía.

**Decisión:** migración nueva `supabase/migrations/20261022120000_leaderboard_nombre_invisible.sql` (no se editan las aplicadas) que redefine `leaderboard_entries_validate_time()` igual que D217, cambiando solo la comprobación de nombre en blanco: `translate(display_name, <espacios D217 + invisibles>, '') = ''` → `PT422` `leaderboard_profile_rejected`, detalle `display_name en blanco`.
- **Invisibles:** `LEADERBOARD_INVISIBLE_CODE_POINTS` en `src/utils/leaderboard-validation.ts`: U+00AD, U+034F, U+061C, U+115F, U+1160, U+17B4–17B5, U+180B–180F, U+200B–200F, U+202A–202E, U+2060–2064, U+2066–206F, U+2800, U+3164, U+FE00–FE0F, U+FEFF, U+FFA0 (casi todo `Default_Ignorable_Code_Point` del plano básico). Un test compara la lista del SQL con espacios de `trim` ∪ esta lista.
- **Solo se rechaza el nombre que no se ve:** mezclados con letras ("A​na") siguen valiendo y no se tocan.
- **Cliente:** `isBlankDisplayName`; `toLeaderboardDisplayName` cae a "Explorador" si el nombre (ya cortado a 24) queda en blanco; el campo Nombre de `AccountTab` vuelve al nombre anterior.
- **Limpieza en producción:** `supabase/leaderboard-limpieza-d221.sql` (revisar con el nombre en hex → borrar en transacción), luego `supabase db push`.

**Alternativas descartadas:** quitar los invisibles de dentro del nombre (cambia nombres válidos; no se pidió); una regex con clases Unicode (`\p{...}` no existe en las regex de Postgres); incluir planos suplementarios (U+E0000…, U+1D159…): caso marginal, se añade a la lista si aparece.
**Rama:** `fix/ranking-nombres-invisibles`
