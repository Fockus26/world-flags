# D056 · Persistencia · Invitado que entra en una cuenta: su progreso pasa solo si la cuenta no tiene progreso · Implementado

**Resumen:** Invitado que entra en una cuenta: su progreso pasa solo si la cuenta no tiene progreso; si lo tiene, se descarta entero y no se sube nada (`planSync`)

Decisión del dueño. Al entrar en una cuenta, lo jugado como invitado en este
dispositivo:

- **Pasa a la cuenta** si ésta no tiene progreso (`hasLearningProgress`
  falso: recién registrada o sin jugar), como antes.
- **Se descarta entero** si la cuenta ya tiene progreso: revisiones, notas,
  candado diario, marcas, logros, estadísticas, historial, perfil y
  configuración. Queda la nube tal cual y no se sube nada. Antes (D020) se
  fusionaban candado, marcas, logros, estadísticas e historial, y la primera
  versión de esta unidad añadía las revisiones (D048).
- Lo jugado durante los segundos que tarda esa sincronización (aún con los
  datos del invitado en pantalla) también se descarta.
- Cómo se sabe que lo local es del invitado: no hay base de sincronización de
  esa cuenta en el dispositivo (primer login aquí, o tras cerrar sesión). Con
  base, son datos de la misma cuenta y se fusionan (D048/D049/D055).
- Pura y probada: `planSync(remote, local, base)` en `learning-storage.ts`;
  `syncLearningData` solo la ejecuta. `mergeLearningData` exige base.
- **Primer login sin red** con una cuenta que ya tiene progreso: se juega en
  `local` sobre los datos del invitado, y al recuperarse se descarta también
  lo jugado en ese rato (era continuación del invitado). El aviso de "Sin
  conexión" dice que se subirá: en este caso concreto no es así.

## Verificación

- `bunx astro check` 0 errores · `bunx biome check ./src` limpio ·
  `bun run build` verde.
- **D055/D056:** `bun run test` (39 en total). Al romper a propósito la regla
  de fechas o la del invitado fallan 3. En navegador (build + mock): un
  invitado con progreso entra en una cuenta con progreso → un GET y ningún
  POST, nada del invitado en local ni en la nube. Configuración cambiada sin
  red aquí y otra con fecha posterior en la nube → al volver gana la de la
  nube en local, en pantalla y en la nube.
- **`bun run test`** (nuevo, también en CI): 24 aserciones sobre la capa pura
  (`tests/unit/sync-merge.test.ts`) — D048, D049, offline en un dispositivo,
  dos dispositivos, login de invitado, idempotencia (y 10 recargas sin inflar
  contadores ni notas), D017, D021, D040, base por cuenta y logout. Con el merge
  anterior fallan 10.
- **En navegador** (embebido): el build de producción servido por un servidor
  desechable y un mock local de Supabase (scratchpad de la sesión, fuera del
  repo) al que se le corta la "red" (respuestas sin CORS = fallo de red real
  para el cliente) o se le hace devolver 500. Sesión de prueba inyectada.
  - Practicar sin red → 0 subidas, todo pendiente → recargar con la nube caída
    → modo `local` con lo jugado y el aviso → B sube cambios distintos → volver
    la red → 1 GET + 1 POST; la fila tiene lo de los dos (revisiones por país
    la más reciente, Asia de B, Norteamérica de A, 3 sesiones sin duplicar,
    contadores 3/6/3, logros de ambos incluido un id desconocido).
  - Recarga con red después: 1 GET, 0 POST, fila idéntica.
  - Agrupado, cierre de sesión (los tres caminos, foco conservado), ranking y
    login sin red, `navigator.onLine` falso sin peticiones, aviso de error del
    servidor, respaldo del avatar.
  - axe-core 4.10: sin violaciones nuevas en claro y oscuro (oscuro emulando
    `prefers-color-scheme`) con los avisos, el aviso de cierre de sesión y el de
    vuelta; 320 px sin scroll horizontal.
- **No verificado en navegador:** el navegador embebido no registró ningún
  service worker en esta sesión ("unknown error when fetching the script", en
  cualquier origen), así que la página servida por el SW sin red no se pudo
  ver. El `sw.js` real se comprobó en un arnés aislado (`self`/`caches`/`fetch`
  simulados): cross-origin no interceptado, recurso sin caché y sin red →
  `Response.error()`, navegación sin red → caché, recurso propio cacheado.
  El de `main` falla en la primera.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
