# D071 · UX · Partida guiada la primera vez: se ofrece sola solo con `hydrationStatus === "ready"` y `hasLearningProgress === false` · Implementado

**Resumen:** Partida guiada la primera vez: se ofrece sola solo con `hydrationStatus === "ready"` y `hasLearningProgress === false`; la marca de "ya se ofreció" va **por dispositivo** en `localStorage` vía `learning-storage.ts` (no en `UserLearningData`: costaría columna nueva + SQL a mano, y el invitado no tiene cuenta). Se reabre desde el pie de `ConfigurationModal` ("Cómo se juega", junto a Novedades, D059), que no se cierra para que el foco vuelva a su botón

**Qué es.** Un recorrido de seis pasos en un diálogo modal: bienvenida (con la
promesa de que nada cuenta), los tres juegos, el modo de juego, los ajustes de
práctica (orden, dificultad, temporizador), la partida de ejemplo y el cierre.

**Cuándo aparece solo** (`utils/tutorial-gate.ts`, `shouldOfferTutorial`):

- `hydrationStatus === "ready"`, **nunca** `"local"`. En `local` los datos son la
  copia de `localStorage` sin contrastar con la nube (Auth que no resolvió en
  2,5 s, D042; o una sincronización fallida, D044): "parece no tener progreso"
  puede ser simplemente que su progreso no ha llegado todavía. Esperar es gratis;
  ofrecerle un tutorial a quien lleva meses jugando, no.
- `hasLearningProgress(data) === false` — la misma función que protege el
  progreso en `planSync` (D056): cubre los tres juegos, los logros y el historial
  de sesiones.
- Sin partida, práctica diaria ni resultados en pantalla.
- Una sola vez por carga (`tutorial.hasBeenOffered`): una re-hidratación
  posterior no lo vuelve a sacar, y cerrarlo no lo reabre.

**Dónde se guarda el "ya se ofreció".** En su propia clave de `localStorage`
(`world-flags-tutorial-seen`), siempre vía `learning-storage.ts`
(`getTutorialSeen`/`saveTutorialSeen`) — **por dispositivo**, como la versión
vista de "Novedades" (D058), y no dentro de `UserLearningData`.

El dilema es el de `DailyReminderPreference`, que sí vive en el blob. Se decidió
al revés por tres razones:

1. `UserLearningData` se sincroniza entera por cuenta: un campo nuevo ahí cuesta
   **una columna nueva en Supabase**, con su SQL corrido a mano antes de
   desplegar. Eso bloqueó los dos últimos despliegues (D055, D062); no vale la
   pena por un booleano de UI.
2. Quien más ve el tutorial es el **invitado**, que no tiene cuenta que
   sincronizar.
3. La puerta real no es la marca, es `hasLearningProgress`. En el segundo
   dispositivo de una cuenta que ya jugó, el tutorial no se ofrece aunque su
   marca no haya viajado.

**Invitado que luego crea cuenta:** la marca es del dispositivo, así que
sobrevive intacta al login — al contrario que si viviera en el blob, donde D056
puede descartar el progreso del invitado entero y con él la marca.

**Lo que queda descubierto, a propósito:** misma persona, cero progreso, otro
dispositivo → lo ve otra vez. Es inofensivo: todavía no ha jugado. Si algún día
molesta, el arreglo es mover la marca al blob con su columna.

**Reabrirlo.** Entrada "Cómo se juega" en el **pie de `ConfigurationModal`**,
junto a "Versión X · Novedades" — se reutiliza el sitio que abrió D059 en vez de
inventar un cuarto icono, porque la fila de 🏅 🏆 📍 a 320 px ya va justa. El pie
pasa a `flex-wrap`: con tres cosas en vez de dos, en pantallas estrechas los
botones bajan a su propia línea. Reabrirlo a mano **no** pasa por la puerta: se
ve siempre, con el progreso que sea.

**El modal de configuración no se cierra al abrir el recorrido**: se queda
abierto por debajo, como ya hace "Novedades". Así, al cerrar el tutorial, React
Aria devuelve el foco al botón que lo abrió (WCAG 2.4.3); cerrándolo antes, ese
botón ya no existiría y el foco caería en `<body>`.

**Estado en pantalla:** slice efímero `tutorial` (`isOpen`, `hasBeenOffered`),
como `achievementToasts`. Está en Redux y no en un estado local de `FlagGame`
porque quien lo reabre es el pie del modal de configuración, varios niveles por
debajo, y el recorrido tiene que montarse por encima de toda la app.

**Rama:** `feat/tutorial-inicial`

## Contexto común de la unidad (antes `17-tutorial-inicial.md`)

> Unidad `feat/tutorial-inicial` (1.2.0). Forma elegida por el dueño, literal:
> *"partida guiada, ese progreso no contaría, y en esas partidas debe señalarse
> los distintos modos de juego, dificultades, orden y temporizador"*.
