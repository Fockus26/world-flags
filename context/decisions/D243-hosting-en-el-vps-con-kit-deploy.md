# D243 · Infraestructura · De Vercel al VPS con kit-deploy · Implementado en el repo (corte pendiente de los pasos del dueño)

**Resumen:** decidido por el dueño (2026-11-24) para un coste fijo y la app junto a su base. La app deja Vercel y pasa a kit-deploy en el VPS: imagen Docker construida en GitHub Actions, preview por PR en `world-flags-pr-<n>.preview.fockus.dev`, producción en `https://world-flags.fockus.dev`.

**Decisión:**
- **Adaptador:** `@astrojs/node` en modo standalone (`node dist/server/entry.mjs`, puerto 3000, uid 1001). `@astrojs/vercel` solo cuando el build lo hace Vercel (`VERCEL=1`), mientras siga de respaldo.
- **Imagen propia:** la plantilla de kit-deploy es para Next.js; `Dockerfile` adapta la suya a Astro. `deploy-vps.yml` y `.dockerignore` sí son los de la plantilla.
- **Variables públicas:** kit-deploy solo lleva al build las `NEXT_PUBLIC_*`. La clave VAPID pública se guarda como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; el `Dockerfile` la copia a `PUBLIC_VAPID_PUBLIC_KEY` para Astro, y el cron la lee con cualquiera de los dos nombres.
- **Dominio:** `world-flags.fockus.dev`, sin aviso de mudanza ni migración del progreso de invitados (el dueño es el único jugador hoy). El origen cambia: localStorage y la PWA instalada de `*.vercel.app` no pasan.
- **Previews y auth:** Better Auth confía en `KIT_DEPLOY_PREVIEW_URL`, que kit-agent pone en cada preview (equivale a `VERCEL_BRANCH_URL`).
- **Recordatorio diario:** el cron de kit-deploy (`GET`, con `CRON_SECRET`); la ruta acepta `GET` y `POST` hasta retirar el temporizador `systemd`.
- **Salud:** `/api/health` responde 200 sin tocar la base.
- **Base:** la de siempre (`world_flags`, creada a mano con kit-db) se adopta con `kit-deploy db adopt`; no se mueve nada.

**Alternativas descartadas:** Vercel como proxy del VPS (conserva el origen, pero Vercel sigue en medio); dominio propio ahora (coste; se puede añadir luego con `kit-deploy domain add`).

**Rollback:** una semana con Vercel publicando `main` (con su adaptador) en `world-flags-hazel.vercel.app`; apagar kit-deploy = `gh variable set KIT_DEPLOY_ENABLED --body false`. Pasada la semana, el dueño decide y se van `vercel.json`, `@astrojs/vercel`, `@vercel/functions` y el proyecto de Vercel.

**Rama:** `chore/hosting-vps`
