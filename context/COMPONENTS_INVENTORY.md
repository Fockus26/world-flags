# Components Inventory — World Flags

> Revisa esto antes de crear un componente. Los de `src/components/ui/` son
> **wrappers sobre HeroUI v3 que conservan la API previa a la migración** — no
> rompas ese contrato, amplíalo.

## UI reutilizable (`src/components/ui/`)

| Componente | Envuelve | API que expone (contrato) | Notas |
|---|---|---|---|
| `Button` | HeroUI `Button` | `color` (primary/secondary/danger/warning/success/neutral) · `variant` (contained/outline/text/soft) · `disabled` · `onClick` · `onFocus` (D058) · `pressed` · `fullWidth` · `isIconOnly` | Pinta las custom props `--button-*` de HeroUI con tokens de marca. **`fullWidth` por defecto** salvo icon-only. `soft` hover ahonda tinte (no salta a color pleno). Foco = aspecto hover |
| `IconButton` | `Button isIconOnly` | `Button` + `aria-label` obligatorio | |
| `Modal` | HeroUI `ModalBackdrop/Container/Dialog` | `isOpen` · `onClose` · `role` · `ariaLabel(ledby/describedby)` · `size` | `onClose` con Escape y clic-fuera. Diálogo `![max-height:90dvh] [overflow-y:auto]` (HeroUI recorta sin barra). `animateHeight` está deprecado (no-op) |
| `Input` | HeroUI `Input` / `TextField`+`Label` | API nativa de `<input>` (incl. `onChange` con evento) · `label?` | Con `label` → `TextField`+`Label`; sin label → `Input` pelado |
| `Select` | HeroUI `Select`+`ListBox` | `options[{value,label}]` · `value` · `onChange(value)` · `label?` · `aria-label?` | Reemplazó al combobox `aria-activedescendant` casero |
| `Tooltip` | **propio** (portal a `<body>`, `position:fixed`) | `label` · `children` · `side` | NO usa el Tooltip de HeroUI (envolvía botones → nested-interactive; y lo recortaba el overflow del modal). Muestra en hover del ratón y focus del hijo |
| `FeedbackMessage` | HeroUI `Alert` | `variant` (success/danger) · `size` · `role` · `autoDismissMs?` · `onDismiss?` | Se le fuerza fondo `*-soft` + borde del color + `items-center` (el Alert de HeroUI por defecto es una tarjeta sutil sin color de fondo). Entra con `animate-in` |
| `OptionTile` | radio nativo + label | `name` · `value` · `checked` · `onChange` | Segmentado de selección única (modo/orden/dificultad/tema). Estilado con tokens HeroUI. Accesible sin ser HeroUI |
| `GradeButtons` | `Button` `variant="soft"` ×4 | `onGrade(grade)` | Otra vez/Difícil/Bien/Fácil, atajos 1–4, feedback de selección |
| `Fieldset` | `<fieldset>`/`<legend>` | `legend` · `hideLegend?` | Sin equivalente en HeroUI; se conserva por semántica |
| `Skeleton` | HeroUI `Skeleton` (renderizado como `<span>`) | `className` · `shape` (`block`/`line`) · `children` (referencia invisible que da la medida) · `animated` | Espera `SKELETON_DELAY_MS` (300 ms) antes de verse, siempre `aria-hidden`, brillo apagado con movimiento reducido. Color = `--surface-tertiary` puenteado (D043). Ver D042 |
| `LoadingAnnouncer` | **propio** (`role="status"` `sr-only`) | `isLoading` · `loadingMessage` · `readyMessage` | Anuncia "cargando" solo si la carga supera el umbral del skeleton y "listo" solo si antes anunció. Montarlo fuera de la zona `inert` |

`GradeButtons` y `Fieldset` no son HeroUI a propósito.

## Componentes del modo Países (`src/components/game/configuration/` y `src/components/game/session/countries/`, rama experimental `feat/modo-paises`)

| Componente | Qué es | Notas |
|---|---|---|
| `GameTypeToggle` | Selector Países/Banderas (`Fieldset`+`OptionTile`) | Extraído de `Configuration` para reutilizarlo también en `LeaderboardModal` — mismo componente, `name` distinto por instancia |
| `CountriesRush` | Rush competitivo de países | Input libre sin botón "Comprobar" (D031/D032), termina completando o con "Rendirme" (D033) |
| `CountriesPractice` | Práctica con SRS de países | Tarjeta cloze + botón "Pista" (D034), reutiliza `AnswerForm`/`GradeButtons` de Banderas |
| `CountryBoard` | Tablero agrupado por continente, con su propio scroll | `<section tabIndex={0}>` (D038: accesible por teclado, ver D028–D038) |
| `BoardSlot` | Un país del tablero | Estados `hidden`/`revealed`/`target`/`missed`/`context`; ancho = nombre real (`invisible`, D038) |
| `CountryClozeCard` | Tablero-cloze compartido | Usado por `CountriesPractice` y por `DailyPractice` (país en `gameType: "countries"`) |

Hooks propios: `useFlyToSlot` (animación de "vuelo" con Web Animations API, D037) y
`useCardCountdown` (temporizador por tarjeta, extraído del efecto de `Session.tsx`
sin tocarlo).

## Componentes del modo Capitales (`src/components/game/session/`, rama `feat/modo-capitales`, D066-D068)

| Componente | Qué es | Notas |
|---|---|---|
| `session-cards.tsx` | `SESSION_CARDS: Record<CardGameType, SessionCard>` | Lo que cambia por juego en `Session` y `DailyPractice`: estímulo, respuesta mostrada, comparación, pregunta, placeholder, nota del aviso y `showQuestionInDaily`. Banderas compara con `isCorrectAnswer` tal cual (D068) |
| `capitals/CapitalCard` | Estímulo de Capitales: solo el nombre del país (D067, opción B) | Mismo hueco que `FlagDisplay`; entrada con `tw-animate-css`, `key` por país |
| `CapitalAnswerNote` (interno de `session-cards.tsx`) | "También vale X o Y." + nota | Va dentro del aviso de `AnswerForm` (`answerNote`) para que se anuncie |
| `GameTypeToggle` (cambiado) | Selector de tres juegos | `ui/Select` por debajo de `min-[30rem]`, pastillas a partir de ahí; se pintan los dos (D066) |


## Componentes de juego (una pantalla, no reutilizables entre pantallas)

Ver `SECTION_INVENTORY.md`. Resumen de dónde vive qué:

- `components/game/FlagGame.tsx` — router de vistas por estado de Redux
- `components/game/configuration/` — pantalla de config: `Configuration`, `RegionSelector`,
  `RegionOption`, `UserSummary`, `ThemeSwitcher`, `CountryPickerModal`, `LeaderboardModal`,
  `AchievementsModal`, y `configurationModal/` (`ConfigurationModal` con HeroUI `Tabs`,
  `AccountTab`, `GameTab`, `AuthSection`, `Avatar`, `EmailConfirmationPending`)
- `components/game/AchievementToasts.tsx` — snackbars de logro apiladas abajo a
  la derecha, montadas una sola vez en `FlagGame` (fuera del router de vistas,
  así se ven en cualquier pantalla)
- `components/game/session/` — sesión: `Session` (práctica y rush de Banderas y Capitales, con `session-cards.tsx`), `DailyPractice`,
  `AnswerForm` (props `label`/`placeholder`/`correctSuffix`/`answerNote`/`inputRef` opcionales,
  añadidas para el modo Países sin tocar el contrato de `Session.tsx`), `FlagDisplay`,
  `Header` (cronómetro), `Timer`, `ConfirmationModal` (props `title`/`description`/
  `confirmLabel`/`cancelLabel` opcionales, con el texto de "abandonar" de siempre
  como default), y `countries/` (ver la tabla del modo Países más abajo)
- `components/game/Results.tsx` — resultados (práctica vs. competitivo por `result.mode`)
- `components/app/` — `Providers`, `AuthEffects`, `GameEffects`, `ThemeEffects`,
  `AchievementsEffects` (sella los logros recién cumplidos; ver D016–D023),
  `NetworkEffects` (estado de red, D050) y `SystemSnackbars` con `ConnectivitySnackbar`
  (sin conexión / error de sync / de vuelta, D052), `UpdateAvailableSnackbar`,
  `ReleaseNotesSnackbar` (novedades tras actualizar, D058) y
  `DailyReminderSnackbar`. Estado de red y sync para la UI: `hooks/useSyncStatus.ts`.
  `ReleaseNotesModal` ("Novedades": lee `CHANGELOG.md` vía `data/changelog.ts`, D057),
  abierto desde ese aviso y desde el pie de `ConfigurationModal` (D059)

## Estilos globales (`src/styles/`)

`global.css` (entrypoint Tailwind + `@import "@heroui/styles"` + reset), `variables.css`
(`--app-color-*`), `theme.css` (`@theme inline` → `--color-*` + radios), `heroui-theme.css`
(puente a los tokens de HeroUI), `animations.ts` (legado framer, inerte).
