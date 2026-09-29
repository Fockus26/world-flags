# Typography — World Flags

## Familia

- **Plus Jakarta Sans** (Google Fonts) para todo. Pesos cargados: **500, 600, 700, 800**.
  - `--font-sans` en `heroui-theme.css` y `theme.css`.
  - Carga hoy: `<link rel="stylesheet" href="fonts.googleapis.com/css2?...&display=swap">`
    en `Layout.astro` (render-blocking, con `preconnect`). Autohospedar con
    `@fontsource-variable/plus-jakarta-sans` mejoraría LCP — ver `CONTENT_CHECKLIST.md`.
- `font-black` (900) se usa en varios sitios pero **el peso 900 no se carga** y
  `font-synthesis: none` → renderiza igual que `font-extrabold`. Al tocar un archivo,
  cambiar `font-black` → `font-extrabold` o añadir `900` al import.

## Escala

No hay una escala tokenizada formal. Los headings usan `clamp()` en `global.css`:

| Nivel | Tamaño |
|---|---|
| h1 | `clamp(1.5rem, 4vw, 2rem)` |
| h2 | `clamp(1.2rem, 3vw, 1.5rem)` |
| h3 | `clamp(1.05rem, 2.5vw, 1.2rem)` |
| body | 14px (system-font base del reset) / `text-sm`–`text-base` en componentes |

El resto de la app usa la escala propia de `theme.css` (D178), sin interlineado propio
(se hereda, como hacían los `text-[Xrem]` que sustituyó):

| Utilidad | Tamaño | Sustituyó a |
|---|---|---|
| `text-micro` | 0,625 rem (10 px) | 0,6 · 0,65 |
| `text-tiny` | 0,7 rem | 0,68 · 0,7 · 0,72 |
| `text-caption` | 0,78 rem | 0,75 · 0,78 · 0,8 |
| `text-label` | 0,85 rem | 0,82 · 0,85 · 0,875 |
| `text-body-sm` | 0,925 rem | 0,9 · 0,92 · 0,95 |
| `text-number` | 1,1 rem | 1,1 (número del `Timer`) |
| `text-heading-sm` | 1,4 rem | 1,35 · 1,4 · 1,45 |
| `text-heading` | 1,5 rem | 1,5 |
| `text-display` | 1,8 rem | 1,75 · 1,8 |
| `text-stat` | `clamp(1.65rem, 4vh, 2.75rem)` | titulares de Resultados (`sm:`) |
| `text-stat-sm` | `clamp(1.5rem, 4.2vw, 2.1rem)` | cifras de Resultados (`sm:`) |
| `text-score` | `clamp(2rem, 6vw, 2.8rem)` | puntuación de Resultados (`sm:`) |
| `text-session-title` | `clamp(1rem, 2.5vh, 1.3rem)` | título de la sesión (`sm:`) |
| `text-capital` | `clamp(0.9rem, min(32cqh, 9cqw), 3rem)` | nombre en `CapitalCard` (container query) |

Las de Tailwind (`text-xs`…`text-2xl`) siguen valiendo, pero traen su propio
interlineado.

## Reglas

- **Cero tamaños arbitrarios** (`text-[Xrem]`): escala de arriba o de Tailwind.
- Un tamaño nuevo intencional = decisión → su archivo `D0NN-<tema>.md` en `decisions/`.
- Un tamaño nuevo = token en `theme.css` + fila en esta tabla + decisión.
