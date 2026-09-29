# D004 · Tokens · `--color-overlay` apunta a `--overlay` de HeroUI (superficie opaca), no al scrim oscuro viejo · Implementado

**Resumen:** `--color-overlay` apunta a `--overlay` de HeroUI (superficie opaca), no al scrim oscuro viejo — colisión de namespace que pintaba los modales oscuros en modo claro

**Decisión:** `theme.css`: `--color-overlay` pasa de `var(--app-color-overlay)` (scrim oscuro translúcido) a `var(--overlay)` (token de HeroUI = superficie opaca blanca/oscura)
**Por qué:** HeroUI compila su CSS de componentes usando el namespace `overlay` de Tailwind → resolvía a `--color-overlay` → al viejo scrim oscuro. Efecto: **los modales se pintaban oscuros y translúcidos en modo claro** (texto oscuro sobre fondo oscuro). El scrim de antes ahora es `--backdrop` de HeroUI
