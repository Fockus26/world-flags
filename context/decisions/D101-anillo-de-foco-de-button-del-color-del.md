# D101 · Accesibilidad · Anillo de foco de `Button` del color del botón · Implementado

**Resumen:** Anillo de foco de `Button` del color del botón: `--focus` = `var(--color-<color>-hover)` en su `style` (HeroUI lo lee de `ring-focus`). El `-hover` y no el base: en claro `success`/`warning` base dan 2,68–2,77:1 (falla el 3:1); el `-hover` ≥3,88:1 en claro y ≥7,99:1 en oscuro. Skip link a `outline-primary-hover` (antes ≈2:1)

- HeroUI pinta el anillo con `ring-focus` = `var(--focus)` (compilado `@theme
  inline`, así que la utilidad lee `--focus` directamente) y `--focus` vale
  `var(--accent)` en `:root`. `ui/Button.tsx` fija ahora `--focus` en el `style`
  del propio botón (junto a `--button-bg-*`): basta, porque la variable se resuelve
  en el elemento.
- **Tono: `var(--color-<color>-hover)`, no el base.** Medido contra lo que rodea al
  anillo: por dentro la banda de separación de HeroUI (`ring-offset-background` =
  `--background`), por fuera la superficie (tarjeta o modal). En claro el base de
  `success` y `warning` no llega al 3:1 de un anillo; el `-hover` sí. En oscuro los
  `-hover` son más claros que el base y dan más contraste. Un solo tono por color
  para las 4 variantes (`contained`/`soft`/`outline`/`text`) y coherente con la
  regla "el foco replica el hover".
- `success` usa el token `--color-success-hover`, no la mezcla con negro que usa su
  fondo `hover` en `brand`.
- El skip link de `Layout.astro` (relleno `primary`) pasa de `outline-primary-border`
  (≈2:1 en oscuro, fallaba) a `outline-primary-hover`.

Contraste medido (navegador, estilo computado del anillo) — mínimo entre la banda
interior (`--background`) y la superficie exterior:

| Color | Claro: base | Claro: `-hover` (usado) | Oscuro: `-hover` (usado) |
|---|---|---|---|
| primary | 4,15 | **5,39** | **7,99** |
| secondary | 3,86 | **5,07** | **10,27** |
| danger | 3,64 | **4,95** | **8,61** |
| warning | 2,77 ✗ | **3,88** | **10,10** |
| success | 2,68 ✗ | **3,88** | **10,77** |
| neutral | 6,55 | **9,39** | **12,56** |

**Rama:** `style/foco-y-toque`

## Contexto común de la unidad (antes `23-foco-y-toque.md`)

> Unidad `style/foco-y-toque` (tanda del 2026-09-23, W7). Cubre D101–D104.
> D105 queda reservado y sin usar.

Pedidos del dueño:

1. "Al hacer focus con el tab del keyboard sale un outline de color morado; me
   gustaría que ese color de outline sea según el color del elemento."
2. "En mobile que al pulsar el elemento se muestre el estilo del hover."
