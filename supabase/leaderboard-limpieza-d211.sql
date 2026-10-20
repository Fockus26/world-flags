-- Revisión y limpieza del ranking antes de aplicar la migración
-- `migrations/20261020120000_leaderboard_validar_todo.sql` (D211).
--
-- ⚠️ Solo con el visto bueno del dueño, en el SQL editor del proyecto real.
-- Orden: 1) revisar, 2) limpiar, 3) aplicar la migración. La migración solo
-- cambia la función del trigger (no añade constraints), así que no fallaría con
-- las filas de hoy; se limpia ANTES porque el trigger viejo deja corregir
-- `updated_at` y el nuevo no (la fecha pasa a ser del servidor).
--
-- Las marcas honestas que se borren aquí vuelven solas: cada cliente sube sus
-- marcas vigentes al cargar la app (D140), ya con el nombre cortado a 24.

-- 1) Revisar --------------------------------------------------------------

-- Filas por scope (los 27 vigentes, los 2 viejos de D114 y lo que sobre):
select scope, count(*) as entradas, min(best_time_ms) as mejor_ms
from public.leaderboard_entries
group by scope
order by scope;

-- Lo que el trigger nuevo rechazaría, con el motivo:
with vigentes(scope, min_ms) as (
	values
		('countries:world', 59100), ('countries:north-america', 900),
		('countries:central-america', 2100), ('countries:caribbean', 3900),
		('countries:south-america', 3600), ('countries:europe', 13500),
		('countries:oceania', 4200), ('countries:asia', 14700),
		('countries:africa', 16200),
		('flags:world@2', 59100), ('flags:north-america@2', 900),
		('flags:central-america@2', 2100), ('flags:caribbean@2', 3900),
		('flags:south-america@2', 3600), ('flags:europe@2', 13500),
		('flags:oceania@2', 4200), ('flags:asia@2', 14700),
		('flags:africa@2', 16200),
		('capitals:world@2', 59100), ('capitals:north-america@2', 900),
		('capitals:central-america@2', 2100), ('capitals:caribbean@2', 3900),
		('capitals:south-america@2', 3600), ('capitals:europe@2', 13500),
		('capitals:oceania@2', 4200), ('capitals:asia@2', 14700),
		('capitals:africa@2', 16200),
		('world', 1), ('capitals:world', 1)
)
select
	e.user_id,
	e.scope,
	e.best_time_ms,
	char_length(e.display_name) as largo_nombre,
	e.avatar_style,
	char_length(e.avatar_seed) as largo_seed,
	e.updated_at,
	case
		when v.scope is null then 'scope sin ranking'
		when e.best_time_ms < v.min_ms then 'tiempo bajo el mínimo'
		when char_length(e.display_name) not between 1 and 24 then 'nombre'
		when e.avatar_style is not null and e.avatar_style not in (
			'adventurer-neutral', 'fun-emoji', 'bottts-neutral',
			'notionists-neutral', 'voxel-art'
		) then 'avatar_style'
		when char_length(e.avatar_seed) > 64 then 'avatar_seed'
		when e.updated_at > now() then 'updated_at futuro'
	end as motivo
from public.leaderboard_entries e
left join vigentes v on v.scope = e.scope
where v.scope is null
	or e.best_time_ms < v.min_ms
	or char_length(e.display_name) not between 1 and 24
	or (e.avatar_style is not null and e.avatar_style not in (
		'adventurer-neutral', 'fun-emoji', 'bottts-neutral',
		'notionists-neutral', 'voxel-art'
	))
	or char_length(e.avatar_seed) > 64
	or e.updated_at > now()
order by motivo, e.scope;

-- 2) Limpiar (en una transacción: revisa los recuentos antes del commit) ---

begin;

-- Scopes sin ranking (se quedan los 27 vigentes y los 2 viejos de D114):
delete from public.leaderboard_entries
where scope not in (
	'countries:world', 'countries:north-america', 'countries:central-america',
	'countries:caribbean', 'countries:south-america', 'countries:europe',
	'countries:oceania', 'countries:asia', 'countries:africa',
	'flags:world@2', 'flags:north-america@2', 'flags:central-america@2',
	'flags:caribbean@2', 'flags:south-america@2', 'flags:europe@2',
	'flags:oceania@2', 'flags:asia@2', 'flags:africa@2',
	'capitals:world@2', 'capitals:north-america@2', 'capitals:central-america@2',
	'capitals:caribbean@2', 'capitals:south-america@2', 'capitals:europe@2',
	'capitals:oceania@2', 'capitals:asia@2', 'capitals:africa@2',
	'world', 'capitals:world'
);

-- Tiempos bajo el mínimo en un scope vigente (anteriores al trigger, D112):
delete from public.leaderboard_entries e
using (
	values
		('countries:world', 59100), ('countries:north-america', 900),
		('countries:central-america', 2100), ('countries:caribbean', 3900),
		('countries:south-america', 3600), ('countries:europe', 13500),
		('countries:oceania', 4200), ('countries:asia', 14700),
		('countries:africa', 16200),
		('flags:world@2', 59100), ('flags:north-america@2', 900),
		('flags:central-america@2', 2100), ('flags:caribbean@2', 3900),
		('flags:south-america@2', 3600), ('flags:europe@2', 13500),
		('flags:oceania@2', 4200), ('flags:asia@2', 14700),
		('flags:africa@2', 16200),
		('capitals:world@2', 59100), ('capitals:north-america@2', 900),
		('capitals:central-america@2', 2100), ('capitals:caribbean@2', 3900),
		('capitals:south-america@2', 3600), ('capitals:europe@2', 13500),
		('capitals:oceania@2', 4200), ('capitals:asia@2', 14700),
		('capitals:africa@2', 16200)
) as v(scope, min_ms)
where e.scope = v.scope and e.best_time_ms < v.min_ms;

-- Nombre vacío o de más de 24, avatar inventado o seed de más de 64:
delete from public.leaderboard_entries
where char_length(display_name) not between 1 and 24
	or (avatar_style is not null and avatar_style not in (
		'adventurer-neutral', 'fun-emoji', 'bottts-neutral',
		'notionists-neutral', 'voxel-art'
	))
	or char_length(avatar_seed) > 64;

-- Fechas en el futuro (con el trigger viejo, un update sin cambio de tiempo
-- las deja como se escriben):
update public.leaderboard_entries
set updated_at = now()
where updated_at > now();

-- Debe salir 0 filas antes del commit:
select count(*) as quedan_invalidas
from public.leaderboard_entries
where updated_at > now()
	or char_length(display_name) not between 1 and 24;

commit;

-- 3) Aplicar la migración: `supabase db push` o pegar en el SQL editor el
--    contenido de `migrations/20261020120000_leaderboard_validar_todo.sql`.
