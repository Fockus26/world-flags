-- Revisión y limpieza de los nombres invisibles del ranking (D221), para la
-- migración `migrations/20261022120000_leaderboard_nombre_invisible.sql`.
--
-- ⚠️ Solo con el visto bueno del dueño, en el SQL editor del proyecto real.
-- Orden: 1) revisar, 2) limpiar, 3) aplicar la migración. La migración no añade
-- constraints, así que no fallaría con estas filas; se limpian para que dejen de
-- salir en el ranking público con un nombre que no se ve.
--
-- La app nunca manda un nombre así (usa "Explorador"): estas filas solo pueden
-- venir de la API. Si alguna es una marca honesta, vuelve sola con un nombre
-- válido: cada cliente sube sus marcas vigentes al cargar (D140).
--
-- "En blanco" = vacío tras quitar los espacios de D217 y los invisibles de D221
-- (la lista de la migración). Incluye también las filas solo de espacios (D217).

-- 1) Revisar --------------------------------------------------------------

select
	e.user_id,
	e.scope,
	e.best_time_ms,
	char_length(e.display_name) as largo_nombre,
	encode(convert_to(e.display_name, 'UTF8'), 'hex') as nombre_hex,
	e.updated_at
from public.leaderboard_entries e
where translate(
	e.display_name,
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
) = ''
order by e.scope, e.user_id;

-- 2) Limpiar (en una transacción: revisa el recuento antes del commit) -----

begin;

delete from public.leaderboard_entries
where translate(
	display_name,
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
) = '';

commit;

-- 3) Aplicar la migración: `supabase db push` (enlazado al proyecto real) o
--    pegar en el SQL editor el contenido de
--    `migrations/20261022120000_leaderboard_nombre_invisible.sql`.
