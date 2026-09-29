# D111 · Accesibilidad · Diálogo `alertdialog` no descartable, con el foco en su único botón "Actualizar" · Implementado

**Resumen:** Diálogo `alertdialog` no descartable (`ui/Modal` gana `isKeyboardDismissDisabled`, por defecto `false`), foco en su único botón "Actualizar". `forceUpdate` (en `useServiceWorkerUpdate`): `registration.update()` si no hay SW esperando → `SKIP_WAITING` → recarga; si no, recarga directa (navegación network-first)

`ui/Modal` con `role="alertdialog"`, nombrado por su `<h2>` y descrito por su
texto, `isDismissable={false}` y la nueva prop `isKeyboardDismissDisabled`
(ampliación de la API del wrapper; por defecto `false`, los consumidores no
cambian): ni clic fuera ni Escape lo cierran. El foco entra directo en el
botón, la única acción. Un segundo clic no hace nada y el texto pasa a
"Actualizando…" (sin `disabled`, que le quitaría el foco).

"Actualizar" usa `forceUpdate` (nuevo en `useServiceWorkerUpdate`): si no hay
SW esperando, pide `registration.update()` y espera a que se instale (tope
5 s); con uno esperando y la página controlada, `SKIP_WAITING` y la recarga
del `controllerchange` de siempre (D047); en cualquier otro caso, o si la
recarga no llega en 5 s, `location.reload()`. La navegación es network-first,
así que recargar ya trae el HTML y el bundle nuevos.

## Verificación

`bunx astro check`, `bunx biome check` sobre lo tocado, `bun run test` (tests
nuevos `sw-version` y `min-version`) y `bun run build`. En el navegador
integrado, con `bun run dev` (puerto 4341) como invitado: sin tabla (404
`PGRST205`) no bloquea; con la respuesta interceptada, sin red / valor
`latest` / `2.0.0` no bloquean, `9.0.0` bloquea (foco en "Actualizar", Escape
y clic fuera no cierran, Tab no sale, avisos de sistema ocultos); ya bloqueado,
sin red sigue bloqueado y `2.0.0` lo quita. axe-core 4.10 sin violaciones en
claro y oscuro; a 320 px sin scroll horizontal. "Actualizar" sin SW recarga.

No verificado en navegador: la rama con SW en espera (`SKIP_WAITING`). El
navegador integrado no deja registrar el SW ("unknown error when fetching the
script", también con `bun run preview`). Reutiliza el camino ya probado de
D047.

## Aviso

Esto frena a clientes viejos **honestos**, no a un tramposo: las políticas RLS
de `leaderboard_entries` dejan a cualquier usuario autenticado escribir el
tiempo que quiera en su fila llamando directo a la API. La protección real es
validar en el servidor (P5, unidad `fix/ranking-validacion-servidor`).

**Rama:** `feat/actualizacion-obligatoria`

_Contexto común de la unidad (antes `25-actualizacion-obligatoria.md`): en D107._
