-- Validación del ranking en el servidor (P5, D112–D114,
-- `fix/ranking-validacion-servidor`).
--
-- ⚠️ SIN APLICAR. Lo aplica el dueño (SQL Editor o MCP), idealmente antes de
-- mergear el PR. El cliente funciona igual con o sin este SQL: sin él no hay
-- rechazo; con él, un rechazo no se reintenta en bucle (D113).
--
-- Hasta ahora la única regla de escritura era RLS: `with check (auth.uid() =
-- user_id)`. Cualquier usuario autenticado podía escribir en su fila el
-- `best_time_ms` que quisiera llamando directo a la API. Este trigger rechaza
-- los tiempos que un humano no puede hacer.
--
-- Mínimo por scope (D112): nº de países del scope × 300 ms por respuesta.
-- Los tres scopes que se leen hoy recorren el catálogo entero (197 países):
-- 197 × 300 = 59 100 ms. Ganarle exige escribir sin pensar a más de ~27
-- teclas por segundo sostenidas (Países 1648 letras; Banderas 1648 + 197
-- Enter; Capitales 1386 + 197 Enter, con la forma más corta aceptada), más
-- del doble del récord de mecanografía. Generoso a propósito.
--
-- Los números salen de `src/utils/leaderboard-validation.ts`
-- (`getLeaderboardMinimums`). `tests/unit/leaderboard-validation.test.ts`
-- comprueba que coinciden con el catálogo y, si este archivo existe (solo en
-- la carpeta principal, no en git ni en CI), que el `case` de abajo dice lo
-- mismo. Si cambia el catálogo o `LEADERBOARD_SCOPES`, se actualiza aquí y se
-- vuelve a correr (el `create or replace` lo sustituye).
--
-- Qué hace (D113, D114):
-- - Rechaza `best_time_ms` nulo o <= 0 en cualquier scope.
-- - Rechaza un tiempo por debajo del mínimo en los scopes vigentes.
-- - Scope sin mínimo (los viejos "world" y "capitals:world", que ya nadie
--   lee, o uno nuevo que todavía no esté aquí): deja pasar. Mejor un tramposo
--   en un scope que nadie mira que perder la marca de alguien honesto cuando
--   el cliente estrene un scope antes que este SQL.
-- - En un update solo valida si cambia el tiempo o el scope: el `update` de
--   nombre y avatar (`syncLeaderboardProfile`, D079) toca todas las filas del
--   usuario y no debe fallar por una fila antigua.
-- - Rechaza con SQLSTATE `PT422`: PostgREST responde HTTP 422 con
--   `code: "PT422"`, que el cliente reconoce (`isLeaderboardTimeRejected`).
--   En un upsert el trigger `before insert` salta siempre (antes de mirar el
--   conflicto), así que cubre también `insert ... on conflict do update`.

create or replace function public.leaderboard_entries_validate_time()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
	min_time_ms integer;
begin
	if tg_op = 'UPDATE'
		and new.best_time_ms is not distinct from old.best_time_ms
		and new.scope is not distinct from old.scope then
		return new;
	end if;

	if new.best_time_ms is null or new.best_time_ms <= 0 then
		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_time_rejected',
			detail = format('best_time_ms %s no es un tiempo válido', new.best_time_ms);
	end if;

	min_time_ms := case new.scope
		when 'countries:world' then 59100
		when 'flags:world@2' then 59100
		when 'capitals:world@2' then 59100
		else null
	end;

	if min_time_ms is not null and new.best_time_ms < min_time_ms then
		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_time_rejected',
			detail = format(
				'best_time_ms %s por debajo del mínimo %s de %s',
				new.best_time_ms,
				min_time_ms,
				new.scope
			);
	end if;

	return new;
end;
$$;

drop trigger if exists leaderboard_entries_validate_time on public.leaderboard_entries;
create trigger leaderboard_entries_validate_time
before insert or update on public.leaderboard_entries
for each row execute function public.leaderboard_entries_validate_time();

-- La función solo la usa el trigger: nadie la llama por la API.
revoke execute on function public.leaderboard_entries_validate_time() from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- Comprobación en seco (solo lectura): filas actuales que el trigger habría
-- rechazado. El trigger no toca las filas que ya existen; esto solo informa.
-- Corrida el 2026-09-24 por el MCP de Supabase: 0 filas (hay 2 filas en total:
-- "countries:world" 798 764 ms y el scope viejo "world" 596 586 ms).
--
-- select user_id, scope, best_time_ms
-- from public.leaderboard_entries
-- where best_time_ms <= 0
--    or best_time_ms < case scope
--         when 'countries:world' then 59100
--         when 'flags:world@2' then 59100
--         when 'capitals:world@2' then 59100
--         else 0
--       end;


-- ---------------------------------------------------------------------------
-- Rollback (deja la tabla como antes: sin trigger ni función):
--
-- drop trigger if exists leaderboard_entries_validate_time on public.leaderboard_entries;
-- drop function if exists public.leaderboard_entries_validate_time();
