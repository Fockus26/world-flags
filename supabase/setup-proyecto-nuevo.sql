-- Esquema completo de World Flags para un proyecto de Supabase NUEVO y vacío.
--
-- Sacado el 2026-09-25 del proyecto en producción "Flag Quiz Game"
-- (xycknorabrashewkehgn, cuenta alejandrorey2654) leyendo el catálogo real, no
-- solo los scripts sueltos de esta carpeta. Es la suma de: la tabla base
-- `user_learning_data` + practice-sync, achievements, countries-game,
-- capitals-game, field-updated-at, notifications, leaderboard,
-- leaderboard-avatares y app-config. Sin datos (salvo la fila min_version).
--
-- NO incluye `leaderboard-validacion.sql`: en producción no estaba aplicado.
-- Si lo quieres, córrelo después de este.
--
-- El cron va aparte, al final y comentado: necesita el ref del proyecto nuevo,
-- el CRON_SECRET y las edge functions ya desplegadas.
--
-- Correr una sola vez en el SQL Editor del proyecto nuevo.

-- ---------------------------------------------------------------------------
-- Progreso por usuario (privado)
-- ---------------------------------------------------------------------------
create table if not exists public.user_learning_data (
	user_id uuid primary key references auth.users (id) on delete cascade,
	profile jsonb not null,
	country_history jsonb not null default '{}'::jsonb,
	region_game_scores jsonb not null default '{}'::jsonb,
	last_configuration jsonb,
	updated_at timestamptz not null default now(),
	last_practice_by_country jsonb not null default '{}'::jsonb,
	region_best_times jsonb not null default '{}'::jsonb,
	achievements jsonb not null default '{}'::jsonb,
	stats jsonb not null default '{}'::jsonb,
	session_history jsonb not null default '[]'::jsonb,
	countries_game jsonb not null default '{}'::jsonb,
	daily_reminder jsonb not null default '{}'::jsonb,
	field_updated_at jsonb not null default '{}'::jsonb,
	capitals_game jsonb not null default '{}'::jsonb,
	learning_paths jsonb not null default '{}'::jsonb
);

alter table public.user_learning_data enable row level security;

drop policy if exists "select own data" on public.user_learning_data;
create policy "select own data" on public.user_learning_data
	for select using (auth.uid() = user_id);

drop policy if exists "insert own data" on public.user_learning_data;
create policy "insert own data" on public.user_learning_data
	for insert with check (auth.uid() = user_id);

drop policy if exists "update own data" on public.user_learning_data;
create policy "update own data" on public.user_learning_data
	for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Ranking público
-- ---------------------------------------------------------------------------
create table if not exists public.leaderboard_entries (
	user_id uuid not null references auth.users (id) on delete cascade,
	scope text not null,
	display_name text not null,
	best_time_ms integer not null,
	updated_at timestamptz not null default now(),
	avatar_style text,
	avatar_seed text,
	primary key (user_id, scope)
);

create index if not exists leaderboard_entries_scope_time_idx
	on public.leaderboard_entries (scope, best_time_ms);

alter table public.leaderboard_entries enable row level security;

drop policy if exists "Leaderboard is publicly readable" on public.leaderboard_entries;
create policy "Leaderboard is publicly readable" on public.leaderboard_entries
	for select to anon, authenticated using (true);

drop policy if exists "Users can upsert their own leaderboard entry" on public.leaderboard_entries;
create policy "Users can upsert their own leaderboard entry" on public.leaderboard_entries
	for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own leaderboard entry" on public.leaderboard_entries;
create policy "Users can update their own leaderboard entry" on public.leaderboard_entries
	for update to authenticated
	using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Suscripciones Web Push (solo las tocan las edge functions con service role)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
	device_id text primary key,
	user_id uuid references auth.users (id) on delete cascade,
	endpoint text not null unique,
	p256dh text not null,
	auth_key text not null,
	timezone text not null default 'UTC',
	reminder_hour smallint not null default 19,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- RLS sin políticas a propósito (ver notifications.sql).
alter table public.push_subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- Configuración de la app (lectura pública, se edita desde el dashboard)
-- ---------------------------------------------------------------------------
create table if not exists public.app_config (
	key text primary key,
	value text not null,
	updated_at timestamptz not null default now()
);

comment on table public.app_config is
	'Ajustes de la app legibles por cualquiera (clave/valor). Se editan solo desde el dashboard.';

alter table public.app_config enable row level security;

drop policy if exists "app_config lectura pública" on public.app_config;
create policy "app_config lectura pública" on public.app_config
	for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.app_config from anon, authenticated;
grant select on public.app_config to anon, authenticated;

insert into public.app_config (key, value) values ('min_version', '2.0.0')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Extensiones para el recordatorio diario
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Cron (DESPUÉS de desplegar las edge functions y fijar los secrets).
-- Reemplaza <NUEVO_REF> y <CRON_SECRET>, descomenta y corre solo este bloque.
-- ---------------------------------------------------------------------------
-- select cron.schedule(
-- 	'send-daily-reminders',
-- 	'0 * * * *',
-- 	$$
-- 	select net.http_post(
-- 		url := 'https://<NUEVO_REF>.supabase.co/functions/v1/send-daily-reminders',
-- 		headers := jsonb_build_object(
-- 			'Content-Type', 'application/json',
-- 			'Authorization', 'Bearer <CRON_SECRET>'
-- 		),
-- 		body := '{}'::jsonb
-- 	);
-- 	$$
-- );
