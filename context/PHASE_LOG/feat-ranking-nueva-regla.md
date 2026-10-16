# feat/ranking-nueva-regla (W1) — 2.0.0

**Estado:** PR #18 abierto (https://github.com/Fockus26/World-Flags/pull/18), esperando revisión del dueño.
Decisiones D075–D079 en `context/decisions/18-ranking-nueva-regla.md`.

> Nota: este archivo y los dos SQL de abajo están en el worktree
> (`.claude/worktrees/agent-ad6ea5634bfffd7d1/`), porque el aislamiento del worktree
> no dejó escribir en la carpeta principal. El orquestador tiene que copiarlos:
> - `context/PHASE_LOG/feat-ranking-nueva-regla.md` → `context/PHASE_LOG/`
> - `supabase/leaderboard-avatares.sql` y `supabase/leaderboard-limpieza-regla-2.sql` → `supabase/`

## Qué se hizo
- Castigo del competitivo de Banderas y Capitales: +10 s por fallo, +20 s por saltar. Países no tiene castigo y no cambia.
- Ranking limpio: la versión de la regla va en la clave (`world@2`, scopes `flags:world@2` / `capitals:world@2`). Sin migración ni columna.
- Top 20, avatares (columnas aplicadas), puesta al día de nombre y avatar, skeleton.

## Verificado
- astro check 0 errores, biome limpio, 126/126 tests, build OK.
- Navegador (puerto 4331, invitado, sin sesión): fallo = +10 s y salto = +20 s medidos en el cronómetro; `world` viejo oculto y `world@2` visible; scopes nuevos en la petición real; 20 filas, avatares e inicial, skeleton de 5 filas con aria-busy y anuncio; axe 0 violaciones en claro (320 px, los cinco estados) y en oscuro (cargando y cargado); sin scroll horizontal a 320 px.

## No verificado
- La fila propia fuera del top 20, el "(tú)" y la puesta al día del perfil: necesitan sesión en producción. Solo revisé el código.

## Filas de CONTENT_CHECKLIST (añadir)
- **#26** Copy del castigo: "+10 s al cronómetro" / "+20 s al cronómetro" (aviso de fallo), la ayuda de "Modo de juego" ("en Banderas y Capitales cada fallo suma 10 s al cronómetro y cada salto, 20 s") y la frase de la partida guiada (paso "Modo de juego"). Provisional.
- **#27** Copy del ranking: "(tú)", "Tu puesto" (aria-label de la lista propia), "Cargando el ranking…" / "Ranking cargado." (anuncio). Provisional.

## Acciones manuales
1. Columnas `avatar_style` / `avatar_seed`: YA APLICADAS el 2026-09-23 a las 23:09 UTC (MCP, migración `leaderboard_avatares`).
2. DESPUÉS de desplegar la 2.0.0: correr `supabase/leaderboard-limpieza-regla-2.sql` (borra los scopes `world` y `capitals:world`). Se puede repetir.

## Vistos de paso (no arreglados)
- Con W4 (`fix/tutorial-pulido`) puede haber conflicto en `tutorial-script.tsx`: esta rama cambia una frase del paso "Modo de juego".
