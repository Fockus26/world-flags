# D085 · UX · Modal de logros a `w-[min(58rem,94vw)]` (ancho de la partida guiada) con rejilla en el `ul` de cada categoría · Implementado

**Resumen:** Modal de logros a `w-[min(58rem,94vw)]` (ancho de la partida guiada) con rejilla en el `ul` de cada categoría: 1 columna de base, 2 desde `min-[30rem]`, 3 desde `min-[44rem]`. `AchievementRow` pasa a `AchievementCard` vertical de alto igual por fila; se conservan estado con icono + texto, anillo + "Nuevo" y el scroll a la primera nueva

Pedido del dueño: "el modal de logros más amplio, que en lugar de una tarjeta por
categoría puedan haber más".

- **Ancho:** `w-[min(58rem,94vw)]`, el mismo que la partida guiada (`Tutorial.tsx`).
  No es un valor nuevo: ya existe en el código para un modal de contenido ancho.
  **Hace falta `max-w-none`:** `ui/Modal` usa `size="md"` y HeroUI aplica
  `.modal__dialog--md` = `max-w-md` (28rem), que gana a cualquier `w-*`; medido en el
  navegador, sin él el diálogo se quedaba en ~448 px aunque pidiera 58rem. La partida
  guiada (`Tutorial.tsx`) sufre el mismo tope hoy (fuera de esta unidad).
- **Rejilla en el propio `ul`** de cada categoría: 1 columna de base (320 px),
  2 desde `min-[30rem]` y 3 desde `min-[44rem]`. Son breakpoints que ya usa la app
  (`DESIGN_RULES.md`: no se inventan más). Se miden contra el viewport, no contra el
  modal, pero con el modal al 94 % del ancho las columnas nunca bajan de ~200 px.
- **Tarjeta vertical** (`AchievementCard`, antes `AchievementRow`): emoji + nombre +
  insignia "Nuevo" arriba, descripción, barra de progreso y el estado con icono
  empujado abajo (`mt-auto`). Cada `li` es `h-full` + columna flex: las tarjetas de
  una fila miden lo mismo (el grid las estira) y los estados quedan alineados.
- **Se conserva todo lo de antes:** estado nunca solo por color (candado/check +
  texto "Bloqueado — x/y" / "Desbloqueado el…"), anillo + insignia de texto "Nuevo",
  scroll a la primera nueva (`rowNodesRef` + `scrollIntoView`, `auto` con
  `prefers-reduced-motion`), semántica `ul`/`li`. El botón "Cerrar" de la cabecera
  no se toca (lo cambia la ola 2, `feat/menu-movil`).

Alternativa descartada: rejilla por `auto-fill, minmax(…)`. Da columnas según el
ancho real del modal, pero exige un ancho mínimo en `rem` que sería un valor nuevo
sin token; con los breakpoints existentes el resultado es equivalente.

**Rama:** `feat/modales-logros-novedades`

## Contexto común de la unidad (antes `20-modales-logros-novedades.md`)

> Unidad `feat/modales-logros-novedades` (tanda del 2026-09-23, W3). Cubre D085–D086.
> D087–D089 quedan reservados y sin usar.
