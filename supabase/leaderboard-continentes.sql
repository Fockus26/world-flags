-- Ranking por continente y marcas que no empeoran (P20 + P15, D138–D139,
-- rama `feat/ranking-continentes`).
--
-- ⚠️ SIN APLICAR. Lo aplica el dueño (SQL Editor o MCP) ANTES o A LA VEZ que
-- el deploy de la rama. Sustituye (create or replace) la función del trigger
-- de `leaderboard-validacion.sql` (D112–D114): si ese SQL no se aplicó nunca,
-- este lo deja todo hecho (función + trigger). El cliente funciona igual sin
-- este SQL: las marcas de continente suben, pero el servidor no las valida
-- (scope desconocido = se deja pasar, D114) y una marca peor puede pisar una
-- mejor.
--
-- Qué cambia respecto de `leaderboard-validacion.sql`:
--
-- 1. Mínimos de los 24 scopes nuevos de continente (D137, D138): nº de países
--    del continente × 300 ms (D112). Los 3 de "Todo el mundo" no cambian.
--    Los números salen de `src/utils/leaderboard-validation.ts`
--    (`getLeaderboardMinimums`); `tests/unit/leaderboard-validation.test.ts`
--    compara el `case` de abajo con ellos si este archivo existe (solo en la
--    carpeta principal). Si cambia el catálogo, se regeneran y se vuelve a
--    correr.
-- 2. Una marca peor no sustituye a una mejor (P15, D139): en un update del
--    mismo scope, `best_time_ms` se queda con `least(nuevo, viejo)` (y con su
--    `updated_at`). El cliente hace upsert de su mejor marca local; si esa se
--    perdió (datos borrados, otro navegador sin sincronizar) antes pisaba la
--    pública. Se hace aquí y no en el cliente: vale también para los clientes
--    viejos que el SW mantiene en caché, es atómico y no cuesta una lectura
--    antes de cada subida. Para "subir" un tiempo a mano (moderación), borra
--    la fila.
--
-- Lo demás igual (D113, D114): rechaza `best_time_ms` nulo o <= 0 y lo que
-- queda bajo el mínimo con SQLSTATE `PT422` (HTTP 422, `code: "PT422"`, el
-- cliente no lo reintenta); scope sin mínimo, se deja pasar; en un update que
-- no cambia ni tiempo ni scope (nombre y avatar, D079) no valida nada.

create or replace function public.leaderboard_entries_validate_time()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
	min_time_ms integer;
begin
	-- D139: en el mismo scope, nunca se empeora una marca válida.
	if tg_op = 'UPDATE'
		and new.scope is not distinct from old.scope
		and old.best_time_ms is not null
		and old.best_time_ms > 0
		and new.best_time_ms is not null
		and new.best_time_ms > old.best_time_ms then
		new.best_time_ms := old.best_time_ms;
		new.updated_at := old.updated_at;
	end if;

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
		when 'countries:north-america' then 900
		when 'countries:central-america' then 2100
		when 'countries:caribbean' then 3900
		when 'countries:south-america' then 3600
		when 'countries:europe' then 13500
		when 'countries:oceania' then 4200
		when 'countries:asia' then 14700
		when 'countries:africa' then 16200
		when 'flags:world@2' then 59100
		when 'flags:north-america@2' then 900
		when 'flags:central-america@2' then 2100
		when 'flags:caribbean@2' then 3900
		when 'flags:south-america@2' then 3600
		when 'flags:europe@2' then 13500
		when 'flags:oceania@2' then 4200
		when 'flags:asia@2' then 14700
		when 'flags:africa@2' then 16200
		when 'capitals:world@2' then 59100
		when 'capitals:north-america@2' then 900
		when 'capitals:central-america@2' then 2100
		when 'capitals:caribbean@2' then 3900
		when 'capitals:south-america@2' then 3600
		when 'capitals:europe@2' then 13500
		when 'capitals:oceania@2' then 4200
		when 'capitals:asia@2' then 14700
		when 'capitals:africa@2' then 16200
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
-- Comprobación rápida tras aplicarlo (en una transacción que se deshace; usa
-- un user_id real de auth.users porque la tabla tiene FK/RLS):
--
-- begin;
--   insert into public.leaderboard_entries (user_id, scope, display_name, best_time_ms)
--   values ('<uuid>', 'flags:europe@2', 'prueba', 600000);
--   -- peor: se queda en 600000
--   update public.leaderboard_entries set best_time_ms = 900000
--   where user_id = '<uuid>' and scope = 'flags:europe@2';
--   select best_time_ms from public.leaderboard_entries
--   where user_id = '<uuid>' and scope = 'flags:europe@2';
--   -- bajo el mínimo (13 500): error PT422
--   update public.leaderboard_entries set best_time_ms = 1000
--   where user_id = '<uuid>' and scope = 'flags:europe@2';
-- rollback;


-- ---------------------------------------------------------------------------
-- Rollback: volver a correr `leaderboard-validacion.sql` (solo "Todo el
-- mundo", sin `least`), o quitarlo todo:
--
-- drop trigger if exists leaderboard_entries_validate_time on public.leaderboard_entries;
-- drop function if exists public.leaderboard_entries_validate_time();
