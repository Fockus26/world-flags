-- Limpieza del ranking tras el cambio de regla del competitivo (D075/D076,
-- `feat/ranking-nueva-regla`, versión 2.0.0).
--
-- ⚠️ CORRER SOLO DESPUÉS DE DESPLEGAR el cliente 2.0.0 (y con el visto bueno
-- del dueño). Los clientes 2.0.0 ya no leen estos scopes; los clientes viejos
-- (el SW los mantiene en caché) pueden seguir escribiendo en ellos, pero nadie
-- los vuelve a leer. Se puede repetir más adelante para barrer lo que suban
-- los clientes viejos rezagados.
--
-- Banderas pasó de "world" a "flags:world@2" y Capitales de "capitals:world"
-- a "capitals:world@2". Países ("countries:world") NO cambió de regla (su rush
-- no tiene castigo) y no se toca.

-- 1) Ver qué se va a borrar:
select scope, count(*) as entradas, min(best_time_ms) as mejor_ms
from public.leaderboard_entries
where scope in ('world', 'capitals:world')
group by scope;

-- 2) Borrar:
delete from public.leaderboard_entries
where scope in ('world', 'capitals:world');
