-- D221: el ranking rechaza un nombre hecho solo de caracteres invisibles.
--
-- D217 (`20261021120000_leaderboard_nombre_en_blanco.sql`, ya aplicada o por
-- aplicar: no se edita) rechaza un nombre hecho solo de espacios, pero los de
-- ancho cero (U+200B…), el relleno Hangul (U+3164), el braille en blanco
-- (U+2800) y afines no los quita `trim`: por API quedaba una fila que en el
-- ranking público se ve vacía. Esta migración redefine la misma función (el
-- trigger no cambia) con una sola diferencia: el nombre en blanco es el que no
-- tiene nada más que espacios (los de D217) e invisibles (los de
-- `LEADERBOARD_INVISIBLE_CODE_POINTS` en `src/utils/leaderboard-validation.ts`;
-- un test compara las dos listas). Mismo `PT422` (`leaderboard_profile_rejected`,
-- detalle `display_name en blanco`).
--
-- Mezclados con letras siguen valiendo ("A​na" pasa): solo se rechaza el
-- nombre que no se ve. El cliente (`toLeaderboardDisplayName`) usa entonces
-- "Explorador", así que nada que mande la app se rechaza aquí.
--
-- No añade constraints: no falla con filas existentes. Las filas que ya haya
-- se revisan y se borran con `supabase/leaderboard-limpieza-d221.sql`.

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

	-- D217 + D221: solo espacios (los de `String.prototype.trim`) o caracteres
	-- invisibles (`LEADERBOARD_INVISIBLE_CODE_POINTS`) no es un nombre. `translate`
	-- los quita todos, estén donde estén: si no queda nada, en blanco.
	if translate(
		new.display_name,
		chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) ||
		chr(160) || chr(173) || chr(847) || chr(1564) || chr(4447) || chr(4448) ||
		chr(5760) || chr(6068) || chr(6069) || chr(6155) || chr(6156) || chr(6157) ||
		chr(6158) || chr(6159) || chr(8192) || chr(8193) || chr(8194) || chr(8195) ||
		chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) ||
		chr(8202) || chr(8203) || chr(8204) || chr(8205) || chr(8206) || chr(8207) ||
		chr(8232) || chr(8233) || chr(8234) || chr(8235) || chr(8236) || chr(8237) ||
		chr(8238) || chr(8239) || chr(8287) || chr(8288) || chr(8289) || chr(8290) ||
		chr(8291) || chr(8292) || chr(8294) || chr(8295) || chr(8296) || chr(8297) ||
		chr(8298) || chr(8299) || chr(8300) || chr(8301) || chr(8302) || chr(8303) ||
		chr(10240) || chr(12288) || chr(12644) || chr(65024) || chr(65025) || chr(65026) ||
		chr(65027) || chr(65028) || chr(65029) || chr(65030) || chr(65031) || chr(65032) ||
		chr(65033) || chr(65034) || chr(65035) || chr(65036) || chr(65037) || chr(65038) ||
		chr(65039) || chr(65279) || chr(65440),
		''
	) = '' then
		raise exception using
			errcode = 'PT422',
			message = 'leaderboard_profile_rejected',
			detail = 'display_name en blanco';
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
