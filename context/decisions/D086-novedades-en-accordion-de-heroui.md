# D086 · UX · "Novedades" en `Accordion` de HeroUI: expansión única (por defecto), `defaultExpandedKeys={[APP_VERSION]}` · Implementado

**Resumen:** "Novedades" en `Accordion` de HeroUI: expansión única (por defecto), `defaultExpandedKeys={[APP_VERSION]}` (la que corre abierta, también desde "Ver novedades"), h3 por versión con la fecha UTC en el disparador, animación CSS de HeroUI con `motion-reduce`, foco = hover

Pedido del dueño: "mostrar las anteriores versiones colapsadas y que solo se pueda
abrir una versión a la vez".

- `Accordion` de HeroUI v3 (sobre `DisclosureGroup` de React Aria), no uno casero:
  teclado (Tab entre disparadores, Enter/Espacio), `aria-expanded`, `aria-controls`
  y el `aria-labelledby` del panel vienen dados.
- **Expansión única:** `allowsMultipleExpanded` se deja en su valor por defecto
  (`false`). Pulsar la abierta la cierra (comportamiento de React Aria), así que
  puede quedar todo cerrado; se acepta porque lo pidió así el prompt de la unidad.
- **La versión que corre abierta por defecto:** `defaultExpandedKeys={[APP_VERSION]}`,
  con `id={entry.version}` en cada elemento. `tests/unit/changelog.test.ts` ya exige
  que la primera entrada sea `APP_VERSION`. El modal se desmonta al cerrarse, así que
  cada apertura (también desde "Ver novedades" del aviso, D058) vuelve a empezar con
  la actual abierta.
- **Encabezados:** h2 del modal → `Accordion.Heading level={3}` por versión (el
  disparador va dentro del h3) → h4 por sección, igual que antes. El `id`
  `release-notes-<versión>` pasa al disparador, que es lo que nombra al panel.
- **Fecha** en el disparador, con `formatReleaseDate` en UTC (sin cambios).
- **Animación:** la de HeroUI, una transición CSS de `height`/`opacity` sobre
  `--disclosure-panel-height` (sin framer, compatible con D006) con
  `motion-reduce:transition-none`. El texto del cuerpo usa los tokens de siempre
  (`text-surface-soft`, `text-text-placeholder`), no el `text-muted` de HeroUI.
- **Foco = hover** (`DESIGN_RULES.md`): el disparador lleva `bg-surface-hover` en
  hover y en `data-focus-visible`, además del anillo `status-focused` de HeroUI.

Alternativa: controlar `expandedKeys` para impedir que quede todo cerrado. Se
descartó por añadir estado sin que el dueño lo pidiera.

**Rama:** `feat/modales-logros-novedades`

_Contexto común de la unidad (antes `20-modales-logros-novedades.md`): en D085._
