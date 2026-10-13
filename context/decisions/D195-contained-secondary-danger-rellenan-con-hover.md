# D195 · Accesibilidad · Botón `contained` de `secondary` y `danger`: el relleno es el token `-hover` y el hover lo oscurece · Implementado

**Resumen:** en claro, blanco sobre `secondary` (`#b34bd1`) da 4,34:1 y sobre `danger` (`#e0435f`) 4,08:1: fallan AA. El botón `contained` de esos dos colores pinta en reposo su token `-hover`, y el hover/pulsado una mezcla más oscura de ese `-hover` (`color-mix(in oklab, <-hover> 86%, black)`, la misma fórmula que ya usaba `success`). Decisión del dueño 2026-10-12: P48 (a) y P52.1 (a).

**Decisión:**
- `src/components/ui/Button.tsx`: `brand.secondary` y `brand.danger` llevan un relleno propio para `contained` (`contained: { base, hover }`); el resto de colores y las variantes `soft`/`outline`/`text` no cambian. `--button-bg-hover` y `--button-bg-pressed` siguen siendo el mismo tono, como antes.
- Sin tokens nuevos: se usan `--color-*-hover` y `color-mix` con `black`, igual que `success`.
- El anillo de foco (`--focus` = `-hover`, D101) no cambia: va separado del botón por el `ring-offset` de 2 px, así que coincidir con el relleno no lo esconde; su contraste contra `--background` es el de D101.
- Afecta a todos los `contained` de esos colores: "Práctica diaria" (y su skeleton), "Reenviar correo"/"Usar otro correo" de la confirmación de correo, "Sí, abandonar" (`ConfirmationModal`) y "Cerrar sesión" (`AuthSection`).

**Contraste medido (navegador, valores computados; texto `--btn-contained-fg`):**

| Botón | Tema | Antes reposo / hover | Ahora reposo / hover y pulsado |
|---|---|---|---|
| Práctica diaria | claro (blanco) | `#b34bd1` 4,34 ✗ / `#9b3ab8` 5,69 | `#9b3ab8` 5,69 / `#7e2e96` 7,73 |
| Práctica diaria | oscuro (`#14121f`) | `#e19bec` 8,89 / `#eab8f0` 11,10 | `#eab8f0` 11,10 / `#bf96c4` 7,37 |
| Sí, abandonar | claro | `#e0435f` 4,09 ✗ / `#c22e49` 5,55 | `#c22e49` 5,55 / `#9e243a` 7,59 |
| Sí, abandonar | oscuro | `#f2748c` 6,74 / `#f6a0b1` 9,31 | `#f6a0b1` 9,31 / `#c98290` 6,23 |

Reposo contra hover: ~1,36:1 en claro y ~1,5:1 en oscuro (antes 1,31–1,38): el cambio de estado se sigue viendo. axe (WCAG 2.1 AA) limpio en el modal de abandonar y en Configuración, claro y oscuro (antes: `color-contrast` en "Sí, abandonar", claro).

**Alternativas descartadas:**
- Texto oscuro sobre el base: cambia el lenguaje de los `contained` (blanco en claro en todos los demás).
- Oscurecer los tokens `secondary`/`danger`: arrastra bordes, barra de progreso, casillas y el texto `danger` de otras variantes, que no tienen el problema.
- En oscuro, hover que aclara (mezcla hacia `--foreground`): el pastel ya casi no puede aclararse y el hover quedaba a 1,05–1,10:1 del reposo, imperceptible.

**Rama:** `fix/contraste-secondary-danger`
