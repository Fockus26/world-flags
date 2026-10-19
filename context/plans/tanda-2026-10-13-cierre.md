# Tanda de cierre 2026-10-13 — dejar la app lista

Pedido del dueño (2026-10-13): «quiero dejar la app lista, resolver todo de una sola vez».
Base: main 9106506 (#78–#82 mergeados; #83 release abierto). Ola A de arreglos cerrada sin QA propia:
la QA se hace una sola vez al final, sobre todo junto.

## Regla de cierre (para que no salgan pendientes sin fin)

- Esta tanda recoge **todo** lo abierto en `pendientes.md`.
- Una sola QA final (wave-qa + a11y + diseño + SEO) sobre main con todo mergeado.
- De esa QA solo bloquea **Crítico/Alto** → un arreglo y fin. **Medio/Bajo** → backlog post-lanzamiento
  (`pendientes.md`, sección "Después del lanzamiento"), no reabre la tanda.

## Unidades (una ola, en paralelo salvo lo marcado)

| ID | Rama | Qué | Pendientes | Archivos |
|---|---|---|---|---|
| C1 | `fix/foco-perdido` | Foco tras Empezar/abandonar/fin de lote/Volver, un solo h1 en Resultados, AnswerForm, Todos/Ninguno, `rounded-[0.25rem]` → token | P51, P53, P54, P50 bajo | `Configuration.tsx`, `LearningPathPanel.tsx`, `Results.tsx`, `AnswerForm`, `CountryPickerModal.tsx` |
| C2 | `fix/copy-lotes-y-nota` | "Lote N de M", "Cancelar", "Lote en marcha", nota en claro AA | P49, P52.3, P52.4, P58 | `Configuration.tsx`, `score.ts`, `Results.tsx`, cabecera de sesión |
| C3 | `feat/pantallas-de-estado` | 404 propia, error boundary, `::selection` | P39, P40, P41 | `src/pages/404.astro`, `App.tsx`, `global.css`, tokens, `sw.js` (no cachear 404) |
| C4 | `chore/marca-titulo` | `<title>` + alt og-image aprobados | P57 | `index.astro`, `Layout.astro` |

C1 y C2 comparten `Configuration.tsx`/`Results.tsx` → C2 sale tras mergear C1 (o un solo worker hace ambas
en dos PRs seguidos). C3 y C4 en paralelo con C1.

## Acciones del dueño (no las puede hacer un agente)

1. P42: `supabase/` local con migraciones (pide la contraseña de la base) + Docker abierto + `.env.test.local`.
   Sin esto la QA final no prueba nada con sesión.
2. P57: rehacer `og-image.png` con "Banderas del Mundo" (opcional) y desplegar la Edge Function del recordatorio.
3. P43: confirmar si la plantilla de "Confirmar cuenta" está aplicada en producción.
4. Mergear #83 (versión) cuando quiera publicar.

## Sin acción

P38 (404 de bundle viejo tras deploy): solo observar. P50 medio (tutorial tapa 🏆 1 s): es diseño.

## Decisiones (respuesta del dueño, 2026-10-19)

- P58: texto del círculo con `color-mix(in oklab, <nota> 62%, var(--foreground))` (opción 3 de D196); medir las 10 notas.
- P57 `<title>`: «Banderas del Mundo — Aprende con repetición espaciada».
- P57 alt de la og-image: se aprueba el actual (fila 52); se revisa si se rehace la imagen.
- Copy de C2 ya decidido el 2026-10-12 (P49 "Lote N de M", P52.3 "Cancelar", P52.4 "Lote en marcha").
- Se hace en esta sesión, una unidad tras otra, sin workers (la PC nueva no tiene el kit instalado). C1 → #86.

## Estado (2026-10-19)

C1 #86 · C4 #87 · C3 #88 · C2 #89 (tras #86). Todas con astro check, biome (archivos tocados), tests y build en verde; ninguna verificada en navegador.
Sigue: el dueño mergea → QA final única. Medio/Bajo de esa QA → "Después del lanzamiento" en `pendientes.md`.
