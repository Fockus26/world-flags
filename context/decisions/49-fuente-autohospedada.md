# 49 — Fuente autohospedada

> Unidad `perf/fuente-autohospedada` (2026-09-28). Fila 4 de `CONTENT_CHECKLIST.md`. Cubre D175.

## D175 — Plus Jakarta Sans desde `@fontsource-variable`

Antes: `<link rel="stylesheet">` a Google Fonts (render-blocking, dos orígenes más, y el SW no
lo cachea porque no es del mismo origen → sin red, fuente del sistema).

- `@fontsource-variable/plus-jakarta-sans/wght.css` importado en `global.css` (solo estilo
  normal: la app no usa cursiva). Una sola fuente variable 200–800 sustituye a los cuatro
  pesos (500/600/700/800); `font-black` (900) sigue cayendo en 800 como antes.
- Cada subconjunto (`latin`, `latin-ext`, `vietnamese`, `cyrillic-ext`) va con su
  `unicode-range`: el navegador solo descarga los que la página usa.
- `Layout.astro` precarga el `latin` (`?url` de Vite, mismo archivo con hash que el CSS).
- `--font-sans`: `"Plus Jakarta Sans Variable", "Plus Jakarta Sans", …` en `theme.css` y
  `heroui-theme.css`.
- Mismo origen → el SW lo guarda como el resto de `/_astro/` y la fuente también sale sin red.
