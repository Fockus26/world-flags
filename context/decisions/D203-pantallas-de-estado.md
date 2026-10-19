# D203 · Pantallas · 404 propia, pantalla de error y color de selección · Implementado

**Resumen:**
- **404 (P40):** `src/pages/404.astro` con el `Layout` (`noindex`, prop nueva) y una tarjeta con "Volver a practicar" → `/`. Sin React: sigue el tema del sistema (`prefers-color-scheme` de `variables.css`); el tema elegido a mano no se lee porque solo `learning-storage.ts` toca el almacenamiento. El SW no necesita cambios: solo cachea navegaciones con `response.ok`, así que una 404 nunca entra en la caché.
- **Error (P41):** `ErrorBoundary` (clase) por fuera de `Providers` en `App.tsx`. HTML con tokens, sin HeroUI ni store (para que funcione aunque fallen ellos). "Reintentar" vuelve a montar la app; "Recargar la página" recarga. El progreso no se toca. `role="alert"`.
- **Selección (P39):** `::selection` con `--accent` / `--accent-foreground` (claro 4,66:1, oscuro 6,74:1), el par ya medido en D106. Sin colores nuevos.
Copy de 404 y error: provisional del agente (CONTENT_CHECKLIST filas 48–49), pendiente de aprobar.
**Alternativas descartadas:** leer el tema guardado en la 404 con un script en línea (rompe la regla de persistencia); un `primary-soft` como selección (se perdería sobre botones `soft`).
**Rama:** `feat/pantallas-de-estado`
