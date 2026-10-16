# fix/seo-metadata (F5) · PR #78 · D197

- P46: el `h1` ya estaba en el HTML prerenderizado pero vacío (solo skeleton `aria-hidden`). Ahora lleva el título en `sr-only` durante la carga. Cambio en `Configuration.tsx` limitado al bloque del `h1`.
- P47.5 description aprobada (143 car.). P47.6 alt ajustado (la imagen no tiene opciones de respuesta): «Banderas del Mundo: logo de una bandera sobre una tarjeta y el lema «Aprende las banderas del mundo con repetición espaciada»». P47.7 marca en og:site_name, JSON-LD, `<title>`, DailyReminderSnackbar (3), RequiredUpdateDialog, sw.js push. P47.8 `es_419`.
- JSON-LD `operatingSystem: "Web"` + `image`. og-image 588 → 169 KB. Fuera framer-motion de optimizeDeps.
- Verificado: build + preview 4303 + Playwright: 1 h1, sin #418, axe 0.
- Pendiente dueño: og-image dice «World Flags»; edge function `send-daily-reminders` (cuerpo del push) dice «World Flags».
