# D199 · QA · `supabase/` va en git (reemplaza D184) · Vigente

**Decisión:** `supabase/` (migraciones, `config.toml`, `seed.sql`, edge functions, plantillas y `README.md`) se sube al repo. Siguen fuera de git solo `supabase/.temp/`, `supabase/.branches/` y `supabase/.env*`. `qa-local.ts` deja de copiar `supabase/` desde la carpeta principal al slot: ya llega con el checkout.
**Por qué:** el kit 3.8.0 lo pide: con la carpeta perdida se pierde el esquema, y los slots del pool y `wave-qa` no veían las migraciones. El dueño lo eligió el 2026-10-16 (actualización a kit 3.9.0) y hará el repo privado en GitHub, que era la razón de D184 (repo público, SQL privado). Revisado antes de subir: solo hay marcadores (`<CRON_SECRET>`, `Deno.env.get`), ningún secreto real.
**Alternativa descartada:** seguir con `supabase/` ignorado y copiado al slot (D184).
