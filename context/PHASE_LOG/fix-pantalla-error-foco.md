# fix/pantalla-error-foco · PR #106 · D208 · patch

- ErrorBoundary: h1 con tabIndex={-1}, foco con focusWhenVisible en componentDidMount (si hasError) y componentDidUpdate (hasError false→true, también tras Reintentar).
- Tokens --container-card 32rem (404/error) y --container-card-wide 38rem (Results); patrón `w-full max-w-card` (no `w-card max-w-full`: desborda en el grid a 320 px).
- Verificado (Playwright contra preview 4303 con componente Boom temporal, no commiteado): foco en los 3 casos, axe 0, 404 320–3840 sin scroll, zoom 200 % y texto 200 % a 1280 sin scroll.
- No verificado: Results en vivo (solo CSS del build).
- Visto de paso: body min-width 20rem (global.css:150) → scroll con texto 200 % a 320 px; anchos mágicos en modales/toasts/sesiones.
