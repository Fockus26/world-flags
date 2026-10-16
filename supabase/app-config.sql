-- Configuración de la app fuera del bundle (D108): hoy, la versión mínima con
-- la que se puede jugar (actualización obligatoria, D109).
-- Tabla clave/valor; el cliente (src/utils/app-config.ts) solo lee la fila min_version.
-- Lectura pública (anon y authenticated); sin políticas de escritura: se cambia
-- desde el dashboard (Table Editor / SQL Editor saltan RLS).
-- Orden: da igual antes o después de desplegar 2.3.0; sin tabla el cliente no bloquea (D110).
-- Subir min_version solo cuando un arreglo toque ranking, progreso guardado o logros.
-- Valor exactamente MAJOR.MINOR.PATCH; uno inválido no bloquea a nadie. Ejemplo:
--   update public.app_config set value = '2.4.0', updated_at = now() where key = 'min_version';
-- Ojo: frena a clientes viejos honestos, no a un tramposo (ver P5).

create table if not exists public.app_config (
	key text primary key,
	value text not null,
	updated_at timestamptz not null default now()
);

comment on table public.app_config is
	'Ajustes de la app legibles por cualquiera (clave/valor). Se editan solo desde el dashboard.';

alter table public.app_config enable row level security;

drop policy if exists "app_config lectura pública" on public.app_config;
create policy "app_config lectura pública"
	on public.app_config for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.app_config from anon, authenticated;
grant select on public.app_config to anon, authenticated;

-- 2.0.0: la regla nueva del ranking (10 s / 20 s).
insert into public.app_config (key, value) values ('min_version', '2.0.0')
on conflict (key) do nothing;

-- Rollback:
-- drop table if exists public.app_config;
