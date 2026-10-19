# D201 · Tokens · `--radius-xs: 0.25rem` para las casillas de 16 px · Implementado

**Resumen:** nuevo token `--radius-xs` (0.25rem) en `src/styles/theme.css`; la casilla del picker de países (`CountryPickerModal.tsx`) pasa de `rounded-[0.25rem]` a `rounded-xs`. Fila nueva en `DESIGN_TOKENS.md`.
**Por qué:** P50 (bajo): valor mágico de radio. La escala existente empieza en `--radius-sm` = 0.625rem, demasiado para una casilla de 16 px (quedaría casi un círculo). Se sobrescribe el `rounded-xs` por defecto de Tailwind (0.125rem); no lo usaba nadie en `src/`.
**Alternativa descartada:** `rounded-sm` (0.625rem): cambia la forma de la casilla.
**Rama:** `fix/foco-perdido`
