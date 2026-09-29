# D116 · Animación · Alto del ranking animado al llegar los datos · Implementado

**Resumen:** Alto del ranking animado al llegar los datos: `ui/AnimatedHeight` mide con `ResizeObserver` (`offsetHeight`, `flow-root`) y transiciona `height` 300 ms; `auto` hasta la primera medida; sin transición con movimiento reducido

Todo lo que cambia con la carga (skeleton, filas, aviso de error / sin conexión /
ranking vacío, tu fila bajo el separador, "Todavía no tienes un tiempo…") va dentro
de `ui/AnimatedHeight`, un contenedor nuevo que mide su contenido con
`ResizeObserver` y transiciona `height` (300 ms, `ease-in-out`, como las pestañas
de `ConfigurationModal`, D010). Así 5 filas de skeleton → 20 filas crece, y
5 → 1 fila encoge, sin salto. Como el diálogo está centrado, crece hacia los dos
lados a la vez.

- **Movimiento reducido**: `motion-reduce:transition-none` (además del bloque de
  `global.css`): el alto cambia de golpe.
- **Medida con `offsetHeight`**, no `getBoundingClientRect`: la entrada del
  diálogo de HeroUI escala el contenido y la medida transformada se quedaría fija.
- **Hasta la primera medida el alto es `auto`**: al abrir no crece desde 0.
- **`flow-root`** en la caja medida: los márgenes de los hijos cuentan en la medida.
- **`shrink-0`** en la caja: el diálogo de HeroUI es flex en columna, y con
  `overflow-hidden` la caja pierde el mínimo por contenido y encogía hasta caber
  en el 90dvh (406 px de 1109 con 30 personas), recortando filas en vez de dejar
  el scroll al diálogo. Encontrado al verificar con la demo.
- **Sin efecto en foco ni lectura**: el contenido nuevo está en el DOM desde el
  primer momento; la caja solo recorta visualmente durante 300 ms. No hay nada
  enfocable dentro. Con 20 filas el alto final pasa del 90dvh del diálogo y el
  scroll sigue siendo el del propio diálogo (D077).
- **No es `AutoHeight`** (D009): ese abre y cierra un bloque siempre montado con
  `grid-template-rows`; aquí el contenido es arbitrario y hay que medirlo.

Alternativa: reservar un alto fijo (p. ej. el de 20 filas) desde el skeleton;
evita el movimiento pero deja un hueco grande cuando hay poca gente.

**Rama:** `feat/ranking-skeleton-demo`

_Contexto común de la unidad (antes `27-ranking-skeleton-demo.md`): en D115._
