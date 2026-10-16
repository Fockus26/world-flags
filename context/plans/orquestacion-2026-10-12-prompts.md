# Tanda 2026-10-12 — prompts por unidad

Brief común: `orquestacion-2026-10-12.md` (misma carpeta). Carpeta principal:
`C:\Users\Admin\Documents\Work\world-flags`. Antes de tocar código: `CLAUDE.md`,
`context/DESIGN_RULES.md` (y en la carpeta principal `context/CURRENT_PHASE.md` si lo necesitas).
Cierre común: a11y si tocas UI · `bunx astro check` + `bunx biome check ./src` (errores previos no bloquean) +
`bun run test` + `bun run build` · changeset patch · decisión en `context/decisions/D18N-<tema>.md`
(cabecera `# D18N · Categoría · Resumen · Implementado`) · commits Conventional en tu rama ·
`git push -u` · `gh pr create` con la plantilla · `PHASE_LOG/<rama>.md` en la carpeta principal
(si no puedes escribir ahí, en el informe). Nunca merge.

---

## W1 — "Ya sabido" exige 10/10 en el continente

**Pidió el dueño (literal):** "practiqué el continente Caribe y tuve una calificación 3/10 ya que no me
sabía la mayoría, entonces intenté aprender por lotes en este continente, pero me dice que está
completado ya que consolidé todo el Caribe. El tema aquí es que esto debe de ser así siempre y cuando
esté en 10/10, por lo tanto tiene que tomar en cuenta los países cuya puntuación no es 10/10."

**Causa (ya diagnosticada):** `createLearningPath` (`src/utils/learning-path.ts:52-84`) manda a
`knownCodes` todo país con `review.repetitions >= 2` (`KNOWN_MIN_REPETITIONS`, l.28). Antes del #67 los
reencolados de una misma partida sumaban repeticiones aunque se fallara a la primera, así que el
historial del dueño tiene países del Caribe con 2+ repeticiones sin sabérselos. `knownCodes` cuenta
como consolidado (`isLearningPathCountryConsolidated`, l.98) → todo el recorrido sale completo.
D185 ya admitía que `repetitions` no es fiable para consolidar.

**Enfoque decidido por el dueño:**
1. Un país es "ya sabido" solo si **la nota de su continente es 10/10** (promedio de las últimas 3
   partidas: `calculateRegionAverage(regionGameScores[region])`, `src/utils/learning-storage.ts:1826`)
   **y** SM2 con `repetitions >= 2`. Sin nota del continente (`null`) → no es ya sabido. Aplica a
   cualquier alcance (mundo, continentes, países sueltos): cada país mira la nota de su propio
   continente (`country.region`). `createLearningPath` recibe `regionGameScores` del juego
   (`toGameView(current, gameType).regionGameScores`, llamada en `src/hooks/useGame.ts:525`).
2. **Recorridos existentes se recalculan solos:** función pura (p. ej. `reconcileLearningPathKnown(path,
   { countryHistory, regionGameScores })`) que saca de `knownCodes` los que ya no cumplen y los mete en
   `codes`. Orden: con `order === "region"`, reordena `codes` por continente y nombre
   (`sortByRegionThenName`, necesita los `Country` — el catálogo está en `@/data/countries` /
   `isCatalogCountryCode`); con `"random"`, añádelos al final. **Solo degrada, nunca promueve** (un país
   que pasa a 10/10 después no se saca de los lotes: los lotes no deben moverse). Debe ser idempotente
   y devolver el mismo objeto si no cambia nada.
   Dónde aplicarla: donde se lee el recorrido para la vista (`getLearningPathOverview`,
   `useGame.ts:505`) y persistiendo el resultado con `saveLearningPath` solo si cambió (cuidado: no lo
   guardes en cada render; un efecto o al leer en una acción). Ojo a la sincronización: `mergeSlot`
   (`learning-path.ts:228`) con el mismo `id` toma `codes`/`knownCodes` de `remote.path`. Con la
   degradación determinista, un dispositivo sin recalcular puede devolver `knownCodes` viejos; tras la
   fusión el recalculo los vuelve a degradar, así que converge. Haz que `mergeSlot` con el mismo id use
   la **intersección** de `knownCodes` (y la unión en `codes`, respetando el orden del remoto y añadiendo
   los nuevos con la regla de orden de arriba) para que no oscile. Las claves siguen ordenadas
   (la sync compara `JSON.stringify`). `updatedAt` del slot **no** cambia por recalcular (solo al crear/abandonar, D185).
3. El progreso (`progress[code].passDays`) de un país degradado se conserva: si ya tenía días de acierto, cuentan.

**Tests** (`tests/unit/learning-path.test.ts`, `node:test`): Caribe con 3/10 y reps≥2 → todo en
`codes`; continente 10/10 + reps≥2 → known; 10/10 + reps 1 → codes; sin nota → codes; alcance mixto;
recalculo de un recorrido viejo "completo" → deja de estarlo, idempotente, no promueve, orden region y
random; fusión con knownCodes distintos converge.

**Verificar:** dev server en tu puerto como invitado. Simula en `localStorage` (vía la app/consola,
solo para depurar) un historial del Caribe con reps≥2 y nota 3; crea el recorrido → no sale completo.
Simula un recorrido viejo con todo en `knownCodes` → al abrir, se reabre.

**Copy:** si el panel explica qué cuenta como ya sabido, ajústalo de forma conservadora y deja la fila
propuesta en el informe (la fila 50 del checklist sigue pendiente).

**Decisión:** D186 (actualiza también la línea de D185 "Lo que ya se sabía…" con "ver D186").
**Changeset patch** — p. ej. "Aprender por lotes ya no da por sabidos los países de un continente
donde tu nota no es 10/10; los recorridos que salían completados se reabren."

---

## W2 — Selector de países: toda el área clicable

**Pidió el dueño (literal):** "Para la selección de países me gustaría que todo el select fuera
clickable ya que tiene un padding que no es clickable, del mismo modo con sus options."

**Dónde:** `src/components/game/configuration/CountryPickerModal.tsx`.
- Cabecera de continente: `div` con `px-2.5 py-2` (l.224) que envuelve el botón de desplegar
  (l.227-243, `p-0`) y los botones "Todos/Ninguno" (l.244-262). El padding del `div` no hace nada al
  clicar. Pasa el padding al botón para que ocupe toda la fila (alto completo, hasta el borde
  izquierdo y hasta los botones de la derecha), y que los botones de "todos/ninguno" tengan un área
  cómoda (objetivo táctil ≥ 24 px, idealmente 44 px en móvil — revisa D-decisiones de tamaño táctil
  con `grep -rhi "^# D.*t[aá]ctil" context/decisions/`). Hover/pressed en la fila entera.
- Opciones de país: `CountryCheckbox` (l.40-75), `label` con `py-0.5` en una rejilla `gap-x-3
  gap-y-0.5` + `px-2.5 py-2` (l.268). Los huecos entre opciones no son clicables. Que cada `label`
  llene su celda (sin `gap` muerto: mueve la separación a padding del propio `label`), con
  hover visible y alto ≥ 24 px (44 px en móvil si cabe sin romper la rejilla de 2/3 columnas a 320 px).
- Foco visible intacto (`peer-focus-visible`), estado deshabilitado sin hover. Tokens, nada de valores
  mágicos (`rounded-[0.25rem]` ya existe: no añadas más).

**Verificar:** dev server, abre el selector de países (configuración → países sueltos); clic en el
borde de la fila de continente y en el hueco entre opciones → responde. 320 px sin scroll horizontal,
claro/oscuro, axe limpio. Captura antes/después.

**Decisión:** D187. **Changeset patch** — "En el selector de países ya puedes tocar en cualquier parte
de la fila del continente o del país."

---

## W3 — Caché del ranking

**Pidió el dueño (literal):** "Al momento de ver el ranking me gustaría que guardara un caché de la
primera petición realizada en los primeros 30 s o 1 min para que al pasar por el mismo recorrido no
vuelva a pedir los datos."

**Dónde:** `LeaderboardModal.tsx` — `loadLeaderboard(scope)` (l.203) y el efecto de carga
(l.375-418) que pone `entries` a `null` y pide en cada apertura y cambio de continente/juego.
`fetchLeaderboard` en `src/utils/cloud-storage.ts:368`. La marca propia se sube con
`upsertLeaderboardEntry` (`cloud-storage.ts:487`), vía la cola de `src/utils/leaderboard-upload.ts`;
y `syncLeaderboardProfile` (l.413) cambia nombre/avatar.

**Enfoque decidido:**
- Módulo nuevo `src/utils/leaderboard-cache.ts`: caché en memoria (no `localStorage`; nada persistente)
  `Map<scope, { entries, fetchedAt }>`, TTL **60 s**, con `now` inyectable para tests. Comparte la
  promesa en vuelo (dos aperturas seguidas = una petición). Los errores no se cachean.
- El modal: si hay entrada fresca, la muestra al instante (sin skeleton ni `LoadingAnnouncer`; el
  anuncio de cambio de continente, D141, debe seguir saliendo). La demo de DEV (`?demo-ranking`) no
  pasa por la caché o usa clave aparte.
- Invalidación: al subir con éxito una marca propia (`upsertLeaderboardEntry`) se borra ese scope; al
  `syncLeaderboardProfile` y al cambiar de sesión (login/logout) se vacía todo — para que nunca veas tu
  tiempo viejo justo después de batirlo.
- Sin conexión: igual que hoy (D052); si hay caché fresca, se puede mostrar — decide y explícalo en el PR.

**Tests** (`tests/unit/leaderboard-cache.test.ts`): hit dentro de 60 s, miss después, promesa en vuelo
compartida, error no cacheado, invalidación por scope y total.

**Verificar:** dev server, `?demo-ranking` no sirve para la red real; usa la pestaña de red: abre el
ranking, ciérralo, reábrelo y cambia de continente ida y vuelta → una sola petición por scope en 60 s.
Como invitado (el ranking es público).

**Decisión:** D188. **Changeset patch** — "El ranking abre al instante si lo acabas de ver."

---

# Ola 2

Cabecera común de arriba + la nota de entorno de "Ola 2" en el brief. Decisiones: comprueba con
`git ls-tree --name-only origin/main context/decisions/` que tu ID sigue libre; si no, el siguiente libre.

## W4 — Botón de dado en los avatares

**Pidió el dueño (literal):** "Me gustaría que en los avatares que aparecen un botón como de dado o de
refrescar para mostrar nuevos iconos."

**Dónde:** `src/components/game/configuration/configurationModal/Avatar.tsx` (rejilla de 8 opciones de
`AVATAR_SEEDS`, `src/utils/avatar.ts:3`), montado en `AccountTab.tsx:77-92` bajo el select de estilo.
El seed es texto libre: la base no lo restringe (`supabase/leaderboard-avatares.sql`, columna `text`) y
el ranking solo exige que sea string (`cloud-storage.ts:397`). Comprueba que la normalización del perfil
en `learning-storage.ts` (default `explorer-1`, l.69) no rechace seeds fuera de `AVATAR_SEEDS`.

**Enfoque:** un `IconButton` (wrapper existente en `src/components/ui/`) con icono de dado o refrescar de
`iconoir-react` (`DiceSix`/`Refresh` o lo que exista; Context7 si dudas) y nombre accesible "Mostrar otros
avatares". Al pulsarlo, la rejilla pasa a 8 seeds aleatorios nuevos (función pura en `utils/avatar.ts`,
p. ej. `createRandomAvatarSeeds(count, random = Math.random)`, con tests). El avatar elegido actualmente
**no se pierde**: si no está en la nueva tanda, ocupa la primera casilla (o decide un patrón conservador y
explícalo). Pulsar el dado no cambia el perfil; solo elegir una opción lo cambia. Los seeds mostrados son
estado local del componente (no se persisten). Anuncia el cambio a lectores de pantalla (región viva
breve, p. ej. "Nuevos avatares"). Movimiento: giro del icono solo con `motion-safe`. Sin conexión: el
botón sigue funcionando (las imágenes caen al número, D052). Tokens, foco visible, 320 px.

**Verificar:** dev server/preview como invitado → configuración → cuenta. Dado varias veces, elegir uno,
reabrir: queda el elegido. axe limpio claro/oscuro, teclado. Capturas.
**Decisión:** D190. **Changeset minor** — "Nuevo botón de dado para ver más avatares en tu perfil."

## W5 — "Todos" / "Ninguno": mismo ancho y más tenues

**Pidió el dueño (literal):** "Me gustaría que el texto ninguno y todos tengan el mismo ancho para que
cuando cambie el texto no se vea ningún salto, además me gustaría un poco más tenue."

**Dónde:** `CountryPickerModal.tsx:255-280` aprox. ("Ninguno" l.264, "Todos" l.273; tras #71 son botones
de alto completo, `text-secondary-hover` por contraste, D187).

**Enfoque:** ancho fijo igual para los dos sin valores mágicos: p. ej. un `grid` que apila ambas
palabras en la misma celda (`[grid-area:1/1]`, la que no toca con `invisible` y `aria-hidden`) para que el
ancho sea el de la más larga, o el patrón equivalente que prefieras; el texto accesible no cambia. Revisa
cómo se muestran (¿se cambia uno por otro o salen los dos?): el salto que nota el dueño es el del
intercambio; arréglalo en cualquier combinación.
"Más tenue": menos peso visual (p. ej. `font-semibold` en vez de `font-bold`, color de un token más
apagado) **sin bajar de 4,5:1** sobre `surface-hover` en claro y oscuro (regla no negociable; calcula y
pon las cifras en el PR). Si ningún token lo cumple, conserva el contraste, baja solo el peso, y explícalo
con 2-3 alternativas. Hover sigue siendo visible.

**Verificar:** como W2 (#71): clic, teclado, 320 px, claro/oscuro, axe; captura antes/después del
cambio de texto. **Decisión:** D191. **Changeset patch** — "Los botones Todos y Ninguno del selector
de países ya no saltan al cambiar y se ven más discretos."

## W6 — P44: `text-secondary` como texto no llega a AA

Lee `## P44` en `context/plans/pendientes.md` (carpeta principal). `#b34bd1` da 4,34:1 sobre blanco y
3,80:1 sobre `surface-hover`. Usos como texto conocidos: `LearningPathPanel.tsx:15` (botón de enlace);
busca el resto (`grep -rn "text-secondary" src/` y variantes `hover:`, `group-*`, CSS en `global.css`).
**No toques** `CountryPickerModal.tsx` (lo cambia W5) ni `Avatar.tsx` (W4).
Arreglo: el mismo que #71 (`text-secondary-hover` u otro token que pase 4,5:1 en ambos temas), con hover
distinguible (subrayado si el color de reposo ya es el del hover, como D187). No cambies el valor del token
`secondary` (lo usan fondos y bordes). Anota en `context/COLORS.md` que `secondary` no sirve como texto
sobre claro. Cifras de contraste en el PR, axe limpio. **Decisión:** D192. **Changeset patch** — "Mejor
contraste en algunos enlaces de color morado."

## W7 — P45: el tutorial no se cierra con Escape

Lee `## P45` en `context/plans/pendientes.md`. `Tutorial.tsx:50-57` dice que Escape **debe** cerrar
(`isDismissable={false}` solo bloquea el clic fuera; `Modal.tsx:17-28`, `isKeyboardDismissDisabled`), pero
un worker vio que al cargar como invitado Escape no lo cierra. Reproduce primero (¿pasa siempre o solo en la
apertura automática? ¿el foco está dentro del diálogo al abrir? ¿otro listener de teclado de la partida
—`session-runtime.ts`, `CountriesPractice.tsx`— se come Escape?). Arregla la causa para que Escape cierre
igual que "Saltar tutorial" (mismo efecto: marca visto, D-decisiones del tutorial: `grep -rhi "^# D.*tutorial"
context/decisions/`). Test si hay lógica pura; verificación en navegador obligatoria (teclado real con
Playwright). **Decisión:** D193. **Changeset patch** — "Ya puedes cerrar el tutorial con la tecla Escape."
