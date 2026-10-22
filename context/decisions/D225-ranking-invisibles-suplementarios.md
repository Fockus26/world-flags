# D225 · Seguridad · El ranking rechaza también los invisibles fuera del plano básico · Implementado (migración sin aplicar)

**Resumen:** la QA de cierre de la ola 4 (bajo de #121) subió por API nombres hechos solo de etiquetas (U+E0020–E007F), selectores de variante suplementarios (U+E0100–E01EF) o formato musical (U+1D173–1D17A). D221 solo listaba invisibles del plano básico, así que esas filas pasaban y se veían vacías en el ranking.

**Decisión:** migración nueva `supabase/migrations/20261023120000_leaderboard_invisibles_suplementarios.sql` (no se edita la de D221) que redefine `leaderboard_entries_validate_time()` igual, añadiendo a la lista de `translate`: U+1BCA0–1BCA3, U+1D173–1D17A, U+E0001, U+E0020–E007F, U+E0100–E01EF. Mismo `PT422` (`display_name en blanco`).
- **Cliente:** los mismos puntos en `LEADERBOARD_INVISIBLE_CODE_POINTS`; el test que compara cliente y SQL sigue cubriendo las dos listas.
- **4 bytes:** `chr(n)` con n > 0xFFFF en una base UTF-8 es un carácter y `translate` trabaja por carácter (no verificado contra Postgres en esta unidad: lo cubre la wave-qa con base local).
- **Visibles intactos:** con letras siguen valiendo; la bandera de Inglaterra (U+1F3F4 + etiquetas) no está en blanco.
- **Limpieza en producción:** `supabase/leaderboard-limpieza-d225.sql` (revisar → borrar en transacción), luego `supabase db push`.

**Alternativas descartadas:** todo el bloque U+E0000–E0FFF (4096 `chr`, la mayoría sin asignar); regex por rangos (rompe el test que compara listas y la de Postgres no tiene `\p{...}`).
**Rama:** `fix/ranking-invisibles-suplementarios`
