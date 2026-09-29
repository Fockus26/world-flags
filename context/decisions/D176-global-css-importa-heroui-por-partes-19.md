# D176 · Rendimiento · `global.css` importa HeroUI por partes (19 hojas de componentes, mismo orden y capas que `dist/index.css`) · Implementado

**Resumen:** `global.css` importa HeroUI por partes (19 hojas de componentes, mismo orden y capas que `dist/index.css`) en vez de `@heroui/styles` entero: 49,3 → 24,9 KB gzip. Componente nuevo de HeroUI ⇒ añadir su hoja

`@import "@heroui/styles"` metía el CSS de sus 84 componentes. `global.css` replica ahora su
`dist/index.css` (mismas capas y mismo orden: `tailwindcss`, `tw-animate-css`, `base`,
`scrollbar`, componentes, `themes/default`, `utilities`, `variants`) con **19** hojas:

- Usados directamente: `label`, `accordion`, `tabs`, `button`, `dropdown`, `list-box`,
  `alert`, `skeleton`, `input`, `textfield`, `modal`, `select`.
- Montados por dentro (imports de `@heroui/react/dist/components/*`): `menu-item`,
  `menu-section`, `surface` (Dropdown, Select, Modal, Alert, Accordion), `close-button`
  (Modal), `scroll-shadow` (Tabs), `list-box-item`, `list-box-section` (ListBox).

Resultado (`bun run build`): **483,7 KB → 196,1 KB** crudo, **49,3 KB → 24,9 KB** gzip.

Comprobado: ninguna clase del CSS anterior que aparezca como clase en el JS/HTML del build
falta en el nuevo (las 15 coincidencias eran nombres de etiqueta o cadenas internas); las
hojas quitadas no traen reglas globales salvo las de `::view-transition-*` de `toast`, que
la app no usa.

**Regla:** usar un componente nuevo de HeroUI exige añadir su hoja (y las de lo que monte
por dentro) a `global.css`; si no, se pinta sin estilos.

**Rama:** `perf/css-heroui-granular`

## Contexto común de la unidad (antes `50-css-heroui-granular.md`)

> Unidad `perf/css-heroui-granular` (2026-09-28). Fila 5 de `CONTENT_CHECKLIST.md`. Cubre D176.
