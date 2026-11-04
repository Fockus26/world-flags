-- Datos mínimos para la base local de QA (`bun run qa:local`). Solo en local: nunca contra
-- la base real. Las cuentas de prueba no van aquí: las crea scripts/qa-local.ts desde
-- .env.test.local.

-- Versión mínima que exige la app. Para probar el aviso de actualización obligatoria,
-- súbela por encima de la versión de package.json.
insert into public.app_config (key, value) values ('min_version', '2.0.0')
on conflict (key) do nothing;
