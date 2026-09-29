# D062 · Persistencia · `gameType` desconocido (de una versión más nueva, por la nube) · Implementado

**Resumen:** `gameType` desconocido (de una versión más nueva, por la nube): se conserva al guardar y se resuelve al leer con `resolveGameType`, solo en `Configuration.tsx` (patrón D040). **Corregido por QA:** un cliente de hoy (sin la guarda) no cae en Países, **falla y se queda en blanco** con `gameType: "capitals"`; el cambio de bytes de `sw.js` no basta. Confirmado en navegador. Estrategia de despliegue: decisión del dueño. Columna `capitals_game` ya aplicada en Supabase Columna `capitals_game` (**correr `supabase/capitals-game.sql` antes de desplegar**)

Con Capitales, `lastConfiguration.gameType` puede valer `"capitals"`, y por la
nube eso llega también a clientes que no lo conocen.

### Desde esta versión

`migrateConfiguration` **conserva** un `gameType` desconocido (pisarlo al
normalizar lo subiría a la nube y le cambiaría el juego al dispositivo que lo
eligió) y se **resuelve al leerlo** con `resolveGameType` (`types/country.ts`)
en el único sitio que lee el juego de la configuración, `Configuration.tsx`;
todo lo demás (partida, práctica diaria, ranking) recibe el juego ya resuelto.
Un juego desconocido cae en el de usuario nuevo (Países, D030). Es el patrón
de D040 con los códigos de país: se conserva al guardar, se filtra al leer.
`SessionRecord.gameType` puede traer también un juego desconocido: los logros
lo comparan (`=== "flags"`, D036), nunca lo usan para indexar.

### Los clientes de hoy (sin esta guarda) — premisa corregida por QA

> **Corrección (QA funcional, 2026-09-23):** lo que sigue en este párrafo
> original era falso. Se dejó escrito que `toGameView(…, "capitals")` «cae en
> la rama de Países de la versión anterior». No es así: en `main`,
> `getGameProgress` devuelve `data[SUB_GAME_KEYS["capitals"]]`, que es
> `undefined` (ese registro solo tiene `countries`), y `setGameProgress`
> **lanza** al leer `progress.countryHistory`. `Configuration.tsx` lo llama al
> pintar y el árbol no tiene `ErrorBoundary`: la app se queda en blanco, y
> con ella el aviso "Actualizar" (`SystemSnackbars` vive en el mismo árbol),
> que era la mitigación. Además, la configuración queda guardada, así que cada
> recarga con el bundle viejo vuelve a fallar hasta que el SW nuevo toma el
> control (cerrar todas las pestañas o la PWA). Comprobado en la función de
> `main`; el render con el bundle viejo, no. **La estrategia de despliegue la
> decide el dueño** (ver el PR).

Texto original (premisa equivocada): una pestaña o PWA abierta desde antes
de desplegar Capitales, con `gameType: "capitals"` recibido por la nube,
tendría el selector sin opción marcada, el título de Banderas, y
`toGameView(…, "capitals")` en la rama de Países; no perdería datos, pero los
falsearía. Mitigación prevista: cambiar los bytes de `public/sw.js` sin subir
`CACHE_NAME`, para que esas pestañas vean "Actualizar" (D047/D050) sin volver
a descargar las 197 banderas (D054). Sigue en la rama, pero no basta.

### Supabase

Columna nueva `capitals_game jsonb not null default '{}'::jsonb`
(`supabase/capitals-game.sql`, local). **Hay que correrla antes de desplegar**:
si el `select` pide una columna que no existe, falla con error de servidor y
toda cuenta autenticada se queda en `local` con "No se pudo sincronizar"
(D044/D050). Los clientes viejos no la piden y, al subir, enumeran sus
columnas: no la pisan (D028). El ranking usa `capitals:world` en
`leaderboard_entries`, sin migración.

### Verificación

`bun run test`: 65. Los datos compartidos de todos los escenarios existentes
(offline, dos dispositivos, invitado, idempotencia, diez recargas) llevan
ahora progreso de Capitales; nuevos: fila vieja sin la columna, posición de la
clave, fusión sin mezclar juegos, juego desconocido conservado y resuelto. El
de D056 con progreso en un solo juego ya recorre los tres. En el build, el
`select` y el mapa de columnas llevan `capitals_game`.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
