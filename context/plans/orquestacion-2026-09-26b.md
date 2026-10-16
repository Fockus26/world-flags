# Orquestación 2026-09-26 (b): pendientes P22–P27 — brief y prompts

> Una sola ola, tres unidades independientes. **Reglas de la tanda: las 13 del brief
> `context/plans/orquestacion-2026-09-26.md` (sección "Reglas de la tanda") valen tal cual**:
> léelas primero. El pedido de cada P está en `context/plans/pendientes.md` (léelo entero para
> tus P). Carpeta principal: `C:\Users\Admin\Documents\Work\world-flags\`. `main` en 2.6.0.

Decisiones del dueño: dev server autorizado en tu slot (si el sistema de permisos lo deniega, no
lo intentes por otra vía: verifica con tests/build y márcalo "sin verificar en navegador" en el PR);
SQL lo aplica él; P26 = **borrar** `motionVariants.flagEnter`.

| # | Rama | Pendientes | Decisiones | Checklist | Changeset |
|---|---|---|---|---|---|
| X1 | `fix/contraste-foco-configuracion` | P25, P27 | `decisions/41-contraste-foco-configuracion.md`, D159–D161 | 52 | patch |
| X2 | `fix/modales-ancho-320` | P23, P24 | `decisions/42-modales-ancho-320.md`, D162–D164 | 53 | patch |
| X3 | `fix/practica-diaria-reloj` | P22, P26 | `decisions/43-practica-diaria-reloj.md`, D165 | — | patch (solo por P22) |

Archivos: X1 = `GameTypeToggle.tsx`, `ConfigurationModal.tsx`/`AutoHeight` (y `global.css` si hace
falta, añadiendo al final). X2 = `CountryPickerModal.tsx`, `LeaderboardModal.tsx`. X3 =
`DailyPractice.tsx`, `src/styles/animations.ts`. No toquéis los de otra unidad.

---

## X1 — `fix/contraste-foco-configuracion`

P25 y P27 de `pendientes.md`. Condicionan: D101–D106 (foco, `--btn-contained-fg`), D129–D130,
D157 (W8: `OptionTile` no sube 2 px por el recorte; si das margen interior, puedes activarlo o
dejarlo, explícalo), comentario del fallo de recálculo de Chrome en `GameTypeToggle.tsx`.

- **P25:** reproducir con tema "system" y el sistema en oscuro (`resize_window colorScheme: dark` o
  emulación), opción elegida del segmentado a 2,44:1. Encontrar por qué el color de la etiqueta no se
  recalcula (¿`color` heredado de una variable resuelta en `:root` antes de aplicar el tema? ¿transición
  de color?) y arreglarlo de raíz; medir ≥ 4,5:1 en claro, oscuro y "system" oscuro, al cargar y al
  cambiar de tema en caliente.
- **P27:** anillo de foco de las `OptionTile` de la columna derecha del modal de configuración
  recortado por `overflow-hidden`. Margen interior (tokens de espaciado) en el contenedor que recorta,
  sin cambiar la API de `OptionTile` ni el alto animado de `AutoHeight`. Medir: anillo entero en todas
  las opciones, 320 px sin scroll horizontal.
- Cierre: changeset patch — "La opción elegida del tipo de juego se lee bien en tema oscuro y el
  contorno de foco de los ajustes ya no se corta."

## X2 — `fix/modales-ancho-320`

P23 y P24 de `pendientes.md`. Condicionan: D150 (`max-w-none`, el tope de 28 rem de
`modal__dialog--md`), D147–D149 (podio), D137–D141 (selector de continente).

- **P23:** `CountryPickerModal` aplica su ancho de 34 rem (como D150). Verificar que su contenido
  (lista, buscador, chips) se ve bien a 34 rem y a 320 px.
- **P24:** a 320 px con tu puesto de 3 cifras (`?demo-ranking=lejos`), el nombre de tu fila tiene
  ~19 px. Enfoque: por debajo de `sm`, el tiempo pasa debajo del nombre (en todas las filas, para que
  el ritmo sea igual), o la opción más conservadora que dé ≥ ~8 caracteres de nombre. Filas del
  skeleton coherentes con el nuevo alto. Medir con `?demo-ranking`, `=top`, `=podio`, `=lejos`.
- Cierre: changeset patch — "El ranking deja más sitio a tu nombre en pantallas pequeñas y el
  selector de países aprovecha el ancho."

## X3 — `fix/practica-diaria-reloj`

P22 y P26 de `pendientes.md`. Condiciona: D132 (reloj monótono en `Session.tsx`).

- **P22:** `DailyPractice.tsx:48` y `:79`: `performance.now()` en vez de `Date.now()` (el ref se
  inicializa en el montaje; `finishedAt` sigue siendo fecha real). Mismo tiempo final.
- **P26:** borrar `motionVariants.flagEnter` de `src/styles/animations.ts` (confirma con `grep` que
  nadie lo usa; el resto de variantes sí se usa). Decisión del dueño.
- Verificación: tests, build, astro check; una práctica diaria en el navegador si puedes levantar el
  servidor (hay que tener tarjetas pendientes: como invitado, juega una práctica y fuerza el día
  siguiente solo si hay una forma de depuración existente; si no, basta con código + tests).
- Cierre: changeset patch — "El tiempo de la práctica diaria ya no se descuadra si cambia la hora del
  dispositivo." D165 recoge los dos puntos.
