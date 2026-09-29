# D078 · Persistencia · `leaderboard_entries.avatar_style` / `avatar_seed` nullable (**aplicadas** en producción el 2026-09-23) · Implementado

**Resumen:** `leaderboard_entries.avatar_style` / `avatar_seed` nullable (**aplicadas** en producción el 2026-09-23). Sin avatar → inicial. Avatar con respaldo extraído a `configuration/UserAvatar.tsx`

Columnas nuevas `avatar_style text` y `avatar_seed text`, **nullable**, en
`leaderboard_entries` (aplicadas en producción el 2026-09-23 23:09 UTC vía MCP,
autorizado por el dueño; SQL en `supabase/leaderboard-avatares.sql`). Las
políticas RLS de insert/update propias no filtran columnas y los grants de tabla
cubren las nuevas (comprobado). `fetchLeaderboard` las pide, `upsertLeaderboardEntry`
las manda; un cliente viejo no las manda y el upsert de PostgREST solo actualiza
las columnas enviadas, así que no las borra.

Una fila sin avatar (vieja, o con un estilo que este cliente no conoce) pinta la
inicial del nombre, como `UserSummary`. El avatar con respaldo sale de
`UserSummary` a `configuration/UserAvatar.tsx` (misma apariencia: la caja y la
tipografía de la inicial las pone quien lo usa). Avatares de 32 px,
`loading="lazy"`, decorativos (`alt=""`: el nombre va al lado). Sin conexión,
la caché HTTP o la inicial (D052).

**Rama:** `feat/ranking-nueva-regla`

_Contexto común de la unidad (antes `18-ranking-nueva-regla.md`): en D075._
