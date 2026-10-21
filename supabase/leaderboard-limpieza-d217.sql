-- Revisión y limpieza de los nombres en blanco del ranking (D217), para la
-- migración `migrations/20261021120000_leaderboard_nombre_en_blanco.sql`.
--
-- ⚠️ Solo con el visto bueno del dueño, en el SQL editor del proyecto real.
-- Orden: 1) revisar, 2) limpiar, 3) aplicar la migración. La migración no añade
-- constraints, así que no fallaría con estas filas; se limpian para que dejen de
-- salir en el ranking público con el nombre vacío.
--
-- La app nunca manda un nombre en blanco (recorta y usa "Explorador"): estas
-- filas solo pueden venir de la API. Si alguna es una marca honesta, vuelve sola
-- con un nombre válido: cada cliente sube sus marcas vigentes al cargar (D140).
--
-- "En blanco" = vacío tras quitar lo mismo que `String.prototype.trim` (la
-- lista de la migración).

-- 1) Revisar --------------------------------------------------------------

select
	e.user_id,
	e.scope,
	e.best_time_ms,
	char_length(e.display_name) as largo_nombre,
	e.updated_at
from public.leaderboard_entries e
where btrim(
	e.display_name,
	chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) ||
	chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) ||
	chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) ||
	chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) ||
	chr(65279)
) = ''
order by e.scope, e.user_id;

-- 2) Limpiar (en una transacción: revisa el recuento antes del commit) -----

begin;

delete from public.leaderboard_entries
where btrim(
	display_name,
	chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) ||
	chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) ||
	chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) ||
	chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) ||
	chr(65279)
) = '';

commit;

-- 3) Aplicar la migración: `supabase db push` (enlazado al proyecto real) o
--    pegar en el SQL editor el contenido de
--    `migrations/20261021120000_leaderboard_nombre_en_blanco.sql`.
