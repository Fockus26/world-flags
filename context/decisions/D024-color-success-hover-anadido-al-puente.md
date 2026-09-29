# D024 · Tokens · `--color-success-hover` añadido al puente (única familia sin `-hover`) · Implementado

**Resumen:** `--color-success-hover` añadido al puente (única familia sin `-hover`). Logro desbloqueado = verde en fondo/borde/icono, nunca en el texto (`text-success` falla AA igual que falló `text-primary`)

Se pidió que los logros completados se vean en verde. `text-success` sobre
`bg-success-soft` da **2.71:1** en claro — falla AA para texto, el mismo error
que ya se había corregido para `text-primary` en D016–D023. Mismo patrón
de solución:

- **Tarjeta** (modal y snackbar): `bg-success-soft` + borde
  `color-mix(in oklab, var(--success) 45%, transparent)` — el mismo idioma que
  ya usa `FeedbackMessage.tsx` para sus variantes, no un verde inventado.
- **Nombre**: se queda en `text-surface-soft` (alto contraste, neutro). Nunca
  coloreado — ni verde ni morado.
- **Icono** (`CheckCircle`, `text-success-hover`): un icono informativo solo
  necesita 3:1, no 4.5:1, así que aquí sí puede llevar el acento de color.
- **Texto de estado/etiqueta** ("Desbloqueado el...", "Logro desbloqueado" del
  snackbar): se queda en `text-text-placeholder`, neutro — a ese tamaño ni
  `success` (2.71:1) ni `success-hover` (3.92:1 en claro) llegan a 4.5:1.

Se añadió `--color-success-hover` al puente Tailwind (`theme.css`) — era la
única familia de color sin su tono `-hover` expuesto (`primary`, `secondary`,
`warning`, `danger` ya lo tenían). El valor (`--app-color-success-hover`) ya
existía en `variables.css`, solo faltaba conectarlo.

## Contexto común de la unidad (antes `06-ajustes-logros.md`)

> Ronda de feedback del dueño sobre D016–D023. Cubre D024–D027.
