-- D225: el ranking rechaza también los invisibles fuera del plano básico.
--
-- D221 (`20261022120000_leaderboard_nombre_invisible.sql`, ya aplicada o por
-- aplicar: no se edita) solo listaba invisibles del plano básico: por API aún
-- pasaba un nombre hecho de etiquetas (U+E0020–E007F), selectores de variante
-- suplementarios (U+E0100–E01EF), controles de formato musical (U+1D173–1D17A)
-- o de taquigrafía (U+1BCA0–1BCA3), que en el ranking público se ve vacío.
-- Esta migración redefine la misma función (el trigger no cambia) con la lista
-- de D221 más esos puntos de código (`LEADERBOARD_INVISIBLE_CODE_POINTS` en
-- `src/utils/leaderboard-validation.ts`; un test compara las dos listas). Mismo
-- `PT422` (`leaderboard_profile_rejected`, detalle `display_name en blanco`).
--
-- `translate` y `chr` trabajan por carácter (punto de código) en una base
-- UTF-8, así que los de 4 bytes se quitan igual que los del plano básico.
-- Mezclados con letras siguen valiendo: solo se rechaza el nombre que no se ve.
--
-- No añade constraints: no falla con filas existentes. Las filas que ya haya
-- se revisan y se borran con `supabase/leaderboard-limpieza-d225.sql`.

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

	-- D217 + D221 + D225: solo espacios (los de `String.prototype.trim`) o caracteres
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
		chr(65039) || chr(65279) || chr(65440) || chr(113824) || chr(113825) || chr(113826) ||
		chr(113827) || chr(119155) || chr(119156) || chr(119157) || chr(119158) || chr(119159) ||
		chr(119160) || chr(119161) || chr(119162) || chr(917505) || chr(917536) || chr(917537) ||
		chr(917538) || chr(917539) || chr(917540) || chr(917541) || chr(917542) || chr(917543) ||
		chr(917544) || chr(917545) || chr(917546) || chr(917547) || chr(917548) || chr(917549) ||
		chr(917550) || chr(917551) || chr(917552) || chr(917553) || chr(917554) || chr(917555) ||
		chr(917556) || chr(917557) || chr(917558) || chr(917559) || chr(917560) || chr(917561) ||
		chr(917562) || chr(917563) || chr(917564) || chr(917565) || chr(917566) || chr(917567) ||
		chr(917568) || chr(917569) || chr(917570) || chr(917571) || chr(917572) || chr(917573) ||
		chr(917574) || chr(917575) || chr(917576) || chr(917577) || chr(917578) || chr(917579) ||
		chr(917580) || chr(917581) || chr(917582) || chr(917583) || chr(917584) || chr(917585) ||
		chr(917586) || chr(917587) || chr(917588) || chr(917589) || chr(917590) || chr(917591) ||
		chr(917592) || chr(917593) || chr(917594) || chr(917595) || chr(917596) || chr(917597) ||
		chr(917598) || chr(917599) || chr(917600) || chr(917601) || chr(917602) || chr(917603) ||
		chr(917604) || chr(917605) || chr(917606) || chr(917607) || chr(917608) || chr(917609) ||
		chr(917610) || chr(917611) || chr(917612) || chr(917613) || chr(917614) || chr(917615) ||
		chr(917616) || chr(917617) || chr(917618) || chr(917619) || chr(917620) || chr(917621) ||
		chr(917622) || chr(917623) || chr(917624) || chr(917625) || chr(917626) || chr(917627) ||
		chr(917628) || chr(917629) || chr(917630) || chr(917631) || chr(917760) || chr(917761) ||
		chr(917762) || chr(917763) || chr(917764) || chr(917765) || chr(917766) || chr(917767) ||
		chr(917768) || chr(917769) || chr(917770) || chr(917771) || chr(917772) || chr(917773) ||
		chr(917774) || chr(917775) || chr(917776) || chr(917777) || chr(917778) || chr(917779) ||
		chr(917780) || chr(917781) || chr(917782) || chr(917783) || chr(917784) || chr(917785) ||
		chr(917786) || chr(917787) || chr(917788) || chr(917789) || chr(917790) || chr(917791) ||
		chr(917792) || chr(917793) || chr(917794) || chr(917795) || chr(917796) || chr(917797) ||
		chr(917798) || chr(917799) || chr(917800) || chr(917801) || chr(917802) || chr(917803) ||
		chr(917804) || chr(917805) || chr(917806) || chr(917807) || chr(917808) || chr(917809) ||
		chr(917810) || chr(917811) || chr(917812) || chr(917813) || chr(917814) || chr(917815) ||
		chr(917816) || chr(917817) || chr(917818) || chr(917819) || chr(917820) || chr(917821) ||
		chr(917822) || chr(917823) || chr(917824) || chr(917825) || chr(917826) || chr(917827) ||
		chr(917828) || chr(917829) || chr(917830) || chr(917831) || chr(917832) || chr(917833) ||
		chr(917834) || chr(917835) || chr(917836) || chr(917837) || chr(917838) || chr(917839) ||
		chr(917840) || chr(917841) || chr(917842) || chr(917843) || chr(917844) || chr(917845) ||
		chr(917846) || chr(917847) || chr(917848) || chr(917849) || chr(917850) || chr(917851) ||
		chr(917852) || chr(917853) || chr(917854) || chr(917855) || chr(917856) || chr(917857) ||
		chr(917858) || chr(917859) || chr(917860) || chr(917861) || chr(917862) || chr(917863) ||
		chr(917864) || chr(917865) || chr(917866) || chr(917867) || chr(917868) || chr(917869) ||
		chr(917870) || chr(917871) || chr(917872) || chr(917873) || chr(917874) || chr(917875) ||
		chr(917876) || chr(917877) || chr(917878) || chr(917879) || chr(917880) || chr(917881) ||
		chr(917882) || chr(917883) || chr(917884) || chr(917885) || chr(917886) || chr(917887) ||
		chr(917888) || chr(917889) || chr(917890) || chr(917891) || chr(917892) || chr(917893) ||
		chr(917894) || chr(917895) || chr(917896) || chr(917897) || chr(917898) || chr(917899) ||
		chr(917900) || chr(917901) || chr(917902) || chr(917903) || chr(917904) || chr(917905) ||
		chr(917906) || chr(917907) || chr(917908) || chr(917909) || chr(917910) || chr(917911) ||
		chr(917912) || chr(917913) || chr(917914) || chr(917915) || chr(917916) || chr(917917) ||
		chr(917918) || chr(917919) || chr(917920) || chr(917921) || chr(917922) || chr(917923) ||
		chr(917924) || chr(917925) || chr(917926) || chr(917927) || chr(917928) || chr(917929) ||
		chr(917930) || chr(917931) || chr(917932) || chr(917933) || chr(917934) || chr(917935) ||
		chr(917936) || chr(917937) || chr(917938) || chr(917939) || chr(917940) || chr(917941) ||
		chr(917942) || chr(917943) || chr(917944) || chr(917945) || chr(917946) || chr(917947) ||
		chr(917948) || chr(917949) || chr(917950) || chr(917951) || chr(917952) || chr(917953) ||
		chr(917954) || chr(917955) || chr(917956) || chr(917957) || chr(917958) || chr(917959) ||
		chr(917960) || chr(917961) || chr(917962) || chr(917963) || chr(917964) || chr(917965) ||
		chr(917966) || chr(917967) || chr(917968) || chr(917969) || chr(917970) || chr(917971) ||
		chr(917972) || chr(917973) || chr(917974) || chr(917975) || chr(917976) || chr(917977) ||
		chr(917978) || chr(917979) || chr(917980) || chr(917981) || chr(917982) || chr(917983) ||
		chr(917984) || chr(917985) || chr(917986) || chr(917987) || chr(917988) || chr(917989) ||
		chr(917990) || chr(917991) || chr(917992) || chr(917993) || chr(917994) || chr(917995) ||
		chr(917996) || chr(917997) || chr(917998) || chr(917999),
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
