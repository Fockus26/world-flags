# D179 · Hidratación · Lo que depende de la fecha/zona horaria se pinta tras montar · Implementado

**Resumen:** Lo que depende de la fecha/zona horaria se pinta tras montar: `useIsClient` (`useSyncExternalStore`, `false` en el build de Astro y en la hidratación). `StreakPanel` pinta un esqueleto hasta entonces. Arregla el error #418 (P36)

En producción salía `Minified React error #418 … args[]=text`. `<App client:load />` no tiene
SSR en tiempo de ejecución, pero Astro **sí la prerenderiza en el build**: `dist/index.html`
trae el HTML de la isla. `StreakPanel` se monta siempre (dentro de `AutoHeight`, aunque esté
cerrado) y pintaba el mes y "N de M días" con `new Date()` del build (Vercel, UTC). Abierta
otro día o en otra zona (el dueño está en UTC−4), el texto no coincidía y React repintaba la
isla entera en el cliente.

- `src/hooks/useIsClient.ts`: `useSyncExternalStore` con `getServerSnapshot` = `false`. En el
  build y en la hidratación vale `false`; en el render siguiente, `true`. Sin `useEffect` ni
  `useState` (React Compiler).
- `StreakPanel`: sin cliente devuelve `StreakPanelSkeleton` (misma caja, `ui/Skeleton`, 5
  semanas de celdas). Rachas, mes y calendario se calculan solo en el navegador. El panel
  está cerrado al cargar, así que el esqueleto casi nunca se ve.
- Tema: el store lee `localStorage` al crearse, pero en el build no hay `window` y queda
  "system". El HTML no depende del tema (colores por `data-theme`, script bloqueante de
  `Layout.astro`); las notas de `RegionOption` que sí lo usan salen `null` hasta que carga el
  progreso. Se corrige el comentario de `themeSlice.ts` que decía "sin SSR".
- Regla: cualquier texto que dependa de la fecha, la zona horaria o `localStorage` y se pinte
  al cargar pasa por `useIsClient` (o por el estado de carga de D042).

No verificado en navegador: comprobado en `dist/index.html` que el HTML ya no trae el mes ni
el conteo de días. Confirmar en la consola de prod tras el despliegue que no vuelve el #418
(React solo avisa del primer desajuste: si hubiera otro, saldría ahora).

**Rama:** `fix/hidratacion-calendario-racha`

## Contexto común de la unidad (antes `52-hidratacion-fecha.md`)

> Unidad `fix/hidratacion-calendario-racha` (2026-09-28). Pendiente P36. Cubre D179.
