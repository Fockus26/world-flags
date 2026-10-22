# fix/ranking-trigger-validacion · W5 tanda 2026-10-20b · PR #114 · D211

- Migración `supabase/migrations/20261020120000_leaderboard_validar_todo.sql`: el trigger del ranking rechaza (PT422) scopes sin ranking (salvo `world`/`capitals:world`, D114), `display_name` fuera de 1..24, `avatar_style` desconocido, `avatar_seed` > 64; `updated_at` lo pone el servidor.
- Cliente: nombre recortado a 24 puntos de código al subir/sincronizar (`toLeaderboardDisplayName`).
- `supabase/leaderboard-limpieza-d211.sql`: revisión + limpieza previa para producción.
- Verificado en Supabase local: ataques del informe → 422; marca legítima sube desde la app con el nombre cortado; limpieza deja 0 inválidas.
- **Pendiente del dueño:** limpiar y aplicar la migración en producción (no aplicada). Sin changeset.
