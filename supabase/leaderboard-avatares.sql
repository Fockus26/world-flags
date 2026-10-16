-- Avatar en el ranking público (D078, `feat/ranking-nueva-regla`).
--
-- YA APLICADO en producción (proyecto "Flag Quiz Game") el 2026-09-23 a las
-- 23:09 UTC, vía MCP de Supabase (migración `leaderboard_avatares`). Se deja
-- aquí para que el esquema local siga completo; volver a correrlo no hace nada.
--
-- Aditivo y nullable: las filas ya existentes y las que sube un cliente viejo
-- (que no manda estas columnas) quedan en null, y la app pinta la inicial del
-- nombre. Las políticas RLS de insert/update propias (ver leaderboard.sql) no
-- filtran columnas, así que ya cubren estas; los grants de tabla de anon y
-- authenticated también (comprobado en information_schema.column_privileges).

alter table public.leaderboard_entries
	add column if not exists avatar_style text,
	add column if not exists avatar_seed text;
