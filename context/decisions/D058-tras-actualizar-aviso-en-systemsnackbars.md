# D058 · UX · Tras actualizar, aviso en `SystemSnackbars` ("Ahora no" / "Ver novedades"), no el modal abierto solo · Implementado

**Resumen:** Tras actualizar, aviso en `SystemSnackbars` ("Ahora no" / "Ver novedades"), no el modal abierto solo. "Visto" **por dispositivo** (`world-flags-seen-release`, vía `learning-storage.ts`), no en `UserLearningData`. Primera carga: se sella sin avisar

**Aviso y no modal automático.** Al arrancar con una versión posterior a la
vista, `ReleaseNotesSnackbar` (en `SystemSnackbars`, junto a los demás avisos
de sistema) dice "Novedades de la versión X" con "Ahora no" / "Ver novedades".
Abrir el modal solo al cargar le quitaría el foco y taparía la pantalla a quien
abrió la app para practicar, por algo que puede esperar; el aviso no bloquea y
se anuncia por la región `role="status"` que ya existe. Mientras el modal está
abierto, el aviso se oculta (si no, flotaría sobre el fondo del modal).

Cuándo se da por visto: al responder al aviso ("Ahora no" o cerrar las
novedades), no al mostrarse. Si se recarga sin tocarlo, vuelve a salir. No se
auto-descarta (WCAG 2.2.1).

**Foco.** El aviso desaparece al responderle, así que no puede recibir el foco
de vuelta, y cerrar el modal que abrió lo dejaba en `<body>` (visto en el
navegador). Ahora vuelve a donde estaba antes de entrar en el aviso, como en
los toasts de React Aria: se recuerda en el `onFocus` de sus botones
(`relatedTarget`) y se mueve ahí antes de que el aviso desaparezca; al abrir
las novedades, justo antes de abrirlas, para que el modal lo tome como el
elemento al que devolver el foco al cerrarse. Sin foco previo (un clic), se
queda en `<body>`, como antes de entrar. Para eso `Button` gana una prop
`onFocus` (ampliación de su API, sin tocar a los consumidores). Un `onFocus` en
el contenedor del aviso chocaba con la regla de Biome de elementos estáticos,
y el `role` que pide (`group` → `<fieldset>`) no corresponde a un aviso.

**Por dispositivo, no en `UserLearningData`.** Clave propia en `localStorage`
(`world-flags-seen-release`), leída y escrita solo por `learning-storage.ts`
(`getSeenReleaseVersion` / `saveSeenReleaseVersion`), como el id de
dispositivo y la base de sincronización. Razones:

- Lo que se anuncia es el bundle que acaba de llegar a **este** navegador, y
  cada dispositivo se actualiza en su momento (el SW de cada uno puede seguir
  sirviendo uno anterior). Sincronizado, verlo en el móvil lo daría por visto
  en un portátil que todavía no se ha actualizado, y ahí nunca se avisaría.
- Sincronizarlo costaría una columna nueva en Supabase (con su SQL manual antes
  de desplegar), reglas de fusión y fecha por campo (D055), para un dato que no
  es progreso.
- El invitado no tiene cuenta y también se actualiza.

Es el caso contrario a `DailyReminderPreference`, que sí se sincroniza porque
es una respuesta del usuario ("no me preguntes más") y no un hecho del
dispositivo.

**La decisión** es pura y está probada (`checkRelease` en `utils/changelog.ts`):

| Versión vista | Resultado |
|---|---|
| Ninguna (primera carga en el dispositivo, o la primera desde que existe el changelog) | Se guarda la actual **sin avisar**: no hay "antes" con el que comparar. Por eso nadie ve un aviso por la 1.0.0 |
| Ilegible | Igual que ninguna |
| Anterior a la actual | Aviso con la entrada de la actual |
| Igual | Nada |
| Posterior (pestaña con un bundle viejo) | Nada, y no se rebaja lo guardado |

El modal lista todas las entradas, de la más nueva a la más vieja; quien se
saltó varias versiones las tiene justo debajo. Si con el tiempo la lista se
hace larga, la opción natural es plegar las versiones viejas en un disclosure;
hoy no hace falta.

_Contexto común de la unidad (antes `15-changelog-y-versionado.md`): en D057._
