-- D211: el trigger del ranking valida toda la fila, no solo el tiempo.
--
-- Hasta aquí (D112–D114, D138, D139) solo miraba `best_time_ms` y dejaba pasar
-- cualquier scope que no tuviera mínimo (`else null`), un `display_name` de
-- cualquier largo, un `avatar_style` inventado y un `updated_at` en el año 2999.
-- La tabla es pública y `fetchLeaderboard` trae el scope entero, así que un
-- usuario podía inflarla sin límite con scopes nuevos.
--
-- Ahora:
--   - scope: solo los 27 vigentes (3 juegos × "Todo el mundo" y 8 continentes,
--     `getLeaderboardScope`) y los dos viejos que aún escriben los clientes
--     anteriores a la regla 2 (`world`, `capitals:world`, D076/D114: sin mínimo,
--     nadie los lee). El resto se rechaza.
--   - display_name: de 1 a 24 caracteres (el `maxLength` del campo Nombre).
--   - avatar_style: nulo o uno de `AVATAR_STYLES`; avatar_seed: nulo o ≤ 64.
--   - updated_at: lo pone el servidor (`now()` al estrenar o cambiar la marca;
--     el de antes si la marca no cambia). El del cliente se ignora.
--
-- Todo rechazo usa el SQLSTATE `PT422` (HTTP 422): el cliente lo trata como
-- definitivo y no lo reintenta (D113).
--
-- Nombre, avatar y fecha se miran en cada insert/update, también en el update de
-- perfil (D079). El scope y el tiempo, solo al insertar o si cambian: así una fila
-- vieja no impide poner al día el nombre del resto (D113).
--
-- ANTES de aplicarla en producción, revisar y limpiar las filas que ya no pasarían
-- (SQL en el PR y en `context/decisions/D211-*.md`).

create or replace function public.leaderboard_entries_validate_time()
	returns trigger
	language plpgsql
	set search_path to ''
	as $function$
declare
	min_time_ms integer;
begin
	if new.display_name is null
		or char_length(new.display_name) not between 1 and 24 then
		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_profile_rejected',
			detail = format(
				'display_name de %s caracteres (de 1 a 24)',
				coalesce(char_length(new.display_name), 0)
			);
	end if;

	if new.avatar_style is not null
		and new.avatar_style not in (
			'adventurer-neutral',
			'fun-emoji',
			'bottts-neutral',
			'notionists-neutral',
			'voxel-art'
		) then
		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_profile_rejected',
			detail = 'avatar_style desconocido';
	end if;

	if new.avatar_seed is not null and char_length(new.avatar_seed) > 64 then
		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_profile_rejected',
			detail = 'avatar_seed de más de 64 caracteres';
	end if;

	-- D139: en el mismo scope, nunca se empeora una marca válida.
	if tg_op = 'UPDATE'
		and new.scope is not distinct from old.scope
		and old.best_time_ms is not null
		and old.best_time_ms > 0
		and new.best_time_ms is not null
		and new.best_time_ms > old.best_time_ms then
		new.best_time_ms := old.best_time_ms;
	end if;

	-- Misma marca en el mismo scope (p. ej. el update de nombre y avatar, D079):
	-- la fecha sigue siendo la de la marca.
	if tg_op = 'UPDATE'
		and new.best_time_ms is not distinct from old.best_time_ms
		and new.scope is not distinct from old.scope then
		new.updated_at := old.updated_at;
		return new;
	end if;

	new.updated_at := now();

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

	if min_time_ms is null then
		-- Los dos scopes viejos (D114) siguen sin mínimo; cualquier otro, fuera.
		if new.scope in ('world', 'capitals:world') then
			return new;
		end if;

		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_scope_rejected',
			detail = format('scope %s no tiene ranking', new.scope);
	end if;

	if new.best_time_ms < min_time_ms then
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
$function$;

revoke all on function public.leaderboard_entries_validate_time() from public, anon, authenticated;
