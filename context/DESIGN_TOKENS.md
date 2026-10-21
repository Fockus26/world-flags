# Design Tokens — World Flags

> Valores reutilizables que no son color ni tipografía. Fuente real: `src/styles/*.css`.

## Espaciado

No hay tokens de espaciado propios: se usa la **escala de Tailwind** (`gap-2`,
`p-4`, `mt-3`, …), unidad base 0.25rem (4px). Hay `p-[0.85rem]`, `gap-[0.45rem]`,
etc. arbitrarios heredados en las pantallas de sesión — no sumar más.

## Radios

`theme.css` **reemplaza la escala de radios de Tailwind** por una más generosa
("HeroUI-ish") + HeroUI deriva su `--radius`:

| Token | Valor | Notas |
|---|---|---|
| `--radius` (HeroUI, `heroui-theme.css`) | `0.75rem` | base de HeroUI (botones, campos) |
| `--radius-xs` (Tailwind, `theme.css`) | `0.25rem` | casillas de 16 px (picker de países, D201) |
| `--radius-sm` (Tailwind, `theme.css`) | `0.625rem` | |
| `--radius-md` | `1rem` | |
| `--radius-lg` | `1.375rem` | tarjetas de pantalla |
| `--radius-xl` | `1.75rem` | |
| `--radius-2xl` | `2rem` | tarjetas grandes en `min-[44rem]` |
| `--field-radius` (HeroUI) | `calc(var(--radius) * 0.85)` | inputs/selects |

Clases: `rounded-sm/md/lg/xl/2xl` ya heredan estos valores. Modales HeroUI usan
`min(32px, var(--radius-3xl))` internamente.

## Anchos de tarjeta (D208)

Tokens `--container-*` de Tailwind en `theme.css` (dan `w-*` y `max-w-*`). Se usan
como `w-full max-w-card`: el ancho del token, sin pasar del contenedor en móvil
(lo mismo que el antiguo `w-[min(100%,Xrem)]`). No al revés (`w-card max-w-full`):
dentro de un `grid place-items-center` la pista toma los 32rem fijos y la tarjeta
desborda a 320 px.

| Token | Valor | Dónde |
|---|---|---|
| `--container-card` | `32rem` | pantallas de estado: 404 (`404.astro`) y error (`ErrorBoundary`) |
| `--container-card-wide` | `38rem` | `Results` (récord, resumen y botones) |
| `--container-session` | `58rem` | sesiones: `Session`, `DailyPractice`, `CountriesPractice`, `CountriesRush` (`w-full max-w-session`); tope del diálogo del tutorial mientras se juega |

## Anchos de diálogo y aviso (D213)

Estos llevan dentro el `min()` con su margen al viewport y se usan como `w-*`
(`w-dialog` = el antiguo `w-[min(28rem,92vw)]`). Los que pasan del `max-w-md` (28rem)
de HeroUI necesitan `max-w-none`.

| Token | Valor | Dónde |
|---|---|---|
| `--container-dialog-sm` | `min(24rem, 92vw)` | `RequiredUpdateDialog` (`size="sm"`) |
| `--container-dialog` | `min(28rem, 92vw)` | `ConfigurationModal`, `ReleaseNotesModal` |
| `--container-dialog-wide` | `min(34rem, 92vw)` | `CountryPickerModal`, `LeaderboardModal` (con `max-w-none`) |
| `--container-dialog-xl` | `min(58rem, 94vw)` | `AchievementsModal` (con `max-w-none`), pasos del tutorial |
| `--container-toast` | `min(22rem, 100vw - 1.5rem)` | `SystemSnackbars`, `AchievementToasts` (`sm:w-toast`) |

`ConfigurationModal` y `ReleaseNotesModal` pedían 30 y 32rem, pero el `max-w-md` de
HeroUI los dejaba en 28rem: el token es el ancho que se veía.

Sin `min-width` en `html`: en rem crece con la letra del navegador y con el texto al
200 % deja la página más ancha que el viewport (D213). Las rejillas que contienen un
campo de texto llevan `grid-cols-1` (`minmax(0,1fr)`): con la columna implícita
`auto`, el ancho intrínseco del `<input>` empujaba la columna fuera del viewport.

## Sombras

- `shadow-xl` de Tailwind en las tarjetas de pantalla (`Configuration`, `Session`,
  `DailyPractice`, `Results`).
- `--overlay-shadow` de HeroUI en modales/tooltips.
- Anillos de 2 px: `ring-2` del color de la nota en `RegionOption` (antes `shadow-[0_0_0_2px_...]`; D157).
- Elevación al pasar (D157): `shadow-md` en la tarjeta de continente, `shadow-sm` en las opciones del selector de juego y en `OptionTile`. `ring-*` y `shadow-*` se suman en un solo `box-shadow`.

## Movimiento

- `--default-transition-duration` (HeroUI): `0.15s`.
- Transiciones CSS propias: `duration-150` / `duration-180` / `duration-200` según componente.
- Celebración de Resultados (D154–D156): `COUNT_UP_DURATION_MS` = 600 ms
  (`hooks/useCountUp.ts`, números que cuentan); insignia de récord `duration-300`
  (como el badge de castigo, D132); confeti `confetti-fall` de 1,2–1,7 s, una vez.
- `tw-animate-css` (viene con `@heroui/styles`): `animate-in fade-in-0 slide-in-from-*
  duration-200` para entradas de vista y paneles de tabs.
- Respuesta en la partida (`StimulusFrame`, D151–D152, `@theme` al final de
  `global.css`): `animate-stimulus-ring` (anillo de acierto, **600 ms** `ease-out`,
  única duración fuera de la escala: con 200 ms no se percibe) y
  `animate-stimulus-shake` (sacudida de fallo, 200 ms, ±`--spacing`). Siempre con
  `motion-safe:`.
- "Pop" al elegir (D158): `animate-in zoom-in-95` con `motion-safe:`, solo desde el
  `onChange` del usuario (nunca al montar ni al restaurar lo guardado).
- Skeleton (`ui/Skeleton.tsx`, D042): brillo de HeroUI (`skeleton 2s linear
  infinite` en `::after`) + entrada `animate-in fade-in duration-200` que espera
  `SKELETON_DELAY_MS` (300 ms) para que una carga rápida no parpadee. Con
  movimiento reducido: sin brillo, misma espera, fundido de 0,01 ms.
- `framer-motion` y `src/styles/animations.ts` se quitaron (D177): todo va con
  `tw-animate-css` (con `motion-safe:`) o transiciones CSS.
- `prefers-reduced-motion`: bloque global en `global.css`.

## z-index

Sin escala tokenizada. Valores en uso: skip-link `z-1000`, modales HeroUI `z-50`,
tooltip propio (`Tooltip.tsx`, portal a `<body>`) `z-[200]`, listbox del Select `z-20`.

## Iconos

`iconoir-react` (import por nombre). Emojis funcionales para 🏆 (ranking) y 📍 (picker de países).
