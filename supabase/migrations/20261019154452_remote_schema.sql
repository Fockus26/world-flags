SET local check_function_bodies = off;

CREATE EXTENSION "pg_cron";

CREATE EXTENSION "pg_net" SCHEMA "public";

CREATE TABLE "public"."app_config" (
  "key"        text                     NOT NULL,
  "value"      text                     NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "app_config_pkey" PRIMARY KEY (key)
);

ALTER TABLE "public"."app_config"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."leaderboard_entries" (
  "user_id"      uuid                     NOT NULL,
  "scope"        text                     NOT NULL,
  "display_name" text                     NOT NULL,
  "best_time_ms" integer                  NOT NULL,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "avatar_style" text,
  "avatar_seed"  text,
  CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY (user_id, scope)
);

ALTER TABLE "public"."leaderboard_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."push_subscriptions" (
  "device_id"     text                     NOT NULL,
  "user_id"       uuid,
  "endpoint"      text                     NOT NULL,
  "p256dh"        text                     NOT NULL,
  "auth_key"      text                     NOT NULL,
  "timezone"      text                     NOT NULL DEFAULT 'UTC'::text,
  "reminder_hour" smallint                 NOT NULL DEFAULT 19,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE (endpoint),
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY (device_id)
);

ALTER TABLE "public"."push_subscriptions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_learning_data" (
  "user_id"                  uuid                     NOT NULL,
  "profile"                  jsonb                    NOT NULL,
  "country_history"          jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "region_game_scores"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "last_configuration"       jsonb,
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "last_practice_by_country" jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "region_best_times"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "achievements"             jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "stats"                    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "session_history"          jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "countries_game"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "daily_reminder"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "field_updated_at"         jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "capitals_game"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "learning_paths"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "user_learning_data_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."user_learning_data"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.leaderboard_entries_validate_time()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."leaderboard_entries_validate_time"() FROM PUBLIC, "anon", "authenticated";

ALTER TABLE "public"."leaderboard_entries"
  ADD CONSTRAINT "leaderboard_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."push_subscriptions"
  ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_learning_data"
  ADD CONSTRAINT "user_learning_data_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX leaderboard_entries_scope_time_idx ON public.leaderboard_entries USING btree (scope, best_time_ms);

CREATE TRIGGER leaderboard_entries_validate_time
  BEFORE INSERT OR UPDATE ON public.leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.leaderboard_entries_validate_time();

CREATE POLICY "app_config lectura pública" ON "public"."app_config"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Leaderboard is publicly readable" ON "public"."leaderboard_entries"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Users can update their own leaderboard entry" ON "public"."leaderboard_entries"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can upsert their own leaderboard entry" ON "public"."leaderboard_entries"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "insert own data" ON "public"."user_learning_data"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own data" ON "public"."user_learning_data"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "update own data" ON "public"."user_learning_data"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id));

COMMENT ON EXTENSION "pg_cron" IS 'Job scheduler for PostgreSQL';

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';

COMMENT ON TABLE "public"."app_config" IS 'Ajustes de la app legibles por cualquiera (clave/valor). Se editan solo desde el dashboard.';

REVOKE ALL ON FUNCTION "public"."leaderboard_entries_validate_time"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."leaderboard_entries_validate_time"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."leaderboard_entries_validate_time"() TO "service_role";

REVOKE ALL ON TABLE "public"."app_config" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."app_config" TO "anon";

REVOKE ALL ON TABLE "public"."app_config" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."app_config" TO "authenticated";

REVOKE ALL ON TABLE "public"."app_config" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_config" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_config" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."leaderboard_entries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."leaderboard_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."leaderboard_entries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."leaderboard_entries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."push_subscriptions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."push_subscriptions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."push_subscriptions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."push_subscriptions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_learning_data" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_learning_data" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_learning_data" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_learning_data" TO "service_role";

