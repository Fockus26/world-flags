# Script de implementación: tercer tipo de juego "Capitales"

> Plan para aprobar **antes de escribir código**. Sesión de planificación del
> 2026-09-22, worktree `.claude/worktrees/cranky-cohen-e9f64d`, rama
> `feat/modo-capitales` (creada desde `main` @ `c7c56dd`, sin cambios todavía).
> Modelo: `context/plans/modo-paises.md` (7 fases, commit y pausa por fase).
> Anexo con las 197 capitales: `context/plans/modo-capitales-capitales.md`
> (+ `.json`, fuente de la Fase 3).
> **Léelo entero antes de tocar nada.** Si algo de aquí choca con `CLAUDE.md`, gana `CLAUDE.md`.
>
> **Estado (2026-09-22): aprobado; respuestas del dueño en §7.1.** Faltan: si el
> aprobar el copy provisional (notas de
> Israel/Palestina incluidas). Fase 1 en curso. `GameTypeToggle` ya no se toca en la
> Fase 1: el desplegable lo sustituye en la Fase 4.

---

## 0. Qué es esto (en una frase)

Un tercer tipo de juego, **"Capitales"**: se muestra un país y se escribe su capital.
Reutiliza todo el flujo existente (alcance por continentes o países sueltos,
práctica con SRS, competitivo cronometrado, práctica diaria, candado "practicado
hoy", logros, ranking). Se parece mucho más a Banderas ("estímulo → respuesta
escrita → calificar") que a Países (tablero), así que **generaliza `Session.tsx`**
en vez de crear componentes de sesión propios.

### Vocabulario

| Término | Significado |
|---|---|
| `gameType` | `"countries"` · `"flags"` · `"capitals"` |
| **Registro de juegos** | Tabla única en `learning-storage.ts` que dice dónde vive el progreso de cada juego (Banderas en el primer nivel de `UserLearningData`, los demás en su sub-objeto). Sustituye a las ramas `=== "countries"` repartidas por el código (D061) |
| **Tarjeta de sesión** | Lo que `Session.tsx` necesita saber de un juego: qué estímulo pinta, qué respuestas acepta, la pregunta del input (D068) |
| **Principal** | Forma de la capital que se muestra al revelar/fallar |
| **Alias** | Otra respuesta que también vale (otra capital del mismo país, variante gráfica) |
| **Nota** | Frase breve que se muestra al revelar (capitales múltiples, disputadas, cambios recientes) |

### Correcciones al encargo (comprobadas, no opiniones)

| El encargo decía | Realidad hoy |
|---|---|
| 196 países / 196 capitales | **197**: PR #7 añadió Taiwán (D041). La auditoría se cerró con la opción A (Taiwán dentro, Kosovo se queda); no hay cambio de catálogo pendiente |
| Decisiones nuevas "continuando desde D038" | El índice va por **D060** (modo offline y changelog). Las de esta unidad empiezan en **D061** |
| `context/decisions/08-modo-capitales.md` | `08` está ocupado (`08-puntuacion-todo-el-mundo.md`). El siguiente libre es **`16-modo-capitales.md`** |
| "Si falta la columna, el usuario cae al fallback de localStorage" | Desde D044/D050 cae a `hydrationStatus = "local"` con el aviso "No se pudo sincronizar" y **sin subir nada**: sigue siendo una regresión para toda cuenta autenticada, y sigue bloqueando el despliegue |
| Verificar capitales "de una fuente fiable" | El CIA World Factbook ya no existe. Fuentes usadas: **UE (Anexo A5, 16-09-2026, consultado con la RAE)**, **Wikidata P36** y **Wikipedia (en)**; la de la RAE devuelve 403 (Cloudflare) y no se forzó. Detalle en el anexo |
| — | **Guinea Ecuatorial cambió de capital el 03-01-2026** (Malabo → Ciudad de la Paz), según las tres fuentes |
| La PK del ranking soporta `capitals:world` | Confirmado en `supabase/leaderboard.sql` (local): `scope text not null`, PK `(user_id, scope)`, sin `CHECK`. Sin migración (si la base real difiere del SQL local, lo sabrá el dueño) |

---

## 1. Decisiones propuestas (registrar como D061–D070 si se aprueban)

Si al implementar alguna resulta imposible, **para y pregunta** (no improvises otra).

### D061 — Persistencia: `capitalsGame` + columna `capitals_game`, y un registro de juegos en el código

**Almacenamiento: igual que D028.** `UserLearningData` gana `capitalsGame: GameProgress`
(mismo shape que `countriesGame`) y Supabase una columna
`capitals_game jsonb not null default '{}'::jsonb`. Banderas sigue en el primer nivel.

**Código: se acaba el "uno especial + los demás aparte".** Hoy hay ramas por juego en
`toGameView`/`fromGameView`, `hasLearningProgress`, `normalize`/`merge`, logros
(`countLearnedInCountriesGameRegions`), `GameEffects` (dos efectos de ranking casi
iguales), `LeaderboardModal`, `Results` y `Configuration`. Con tres juegos, cada una
es un sitio donde olvidarse del tercero. Se sustituyen por:

- En `learning-storage.ts`, un **registro** `Record<Exclude<GameType, "flags">, "countriesGame" | "capitalsGame">`
  y dos funciones, `getGameProgress(data, gameType)` / `setGameProgress(data, gameType, progress)`.
  `toGameView`/`fromGameView` se reescriben encima (misma semántica, D029 intacto);
  `normalize`, `merge` y `hasLearningProgress` recorren `GAME_TYPES`.
- Mapas por juego (`Record<GameType, …>`) para lo visible: etiqueta, icono, título,
  sustantivo ("países/banderas/capitales"), scope del ranking y su descripción.
  `Record` hace que TypeScript **obligue** a rellenar el juego nuevo.
- Regla: fuera del registro y del enrutado de `FlagGame`, no queda ningún
  `=== "countries"` ni `=== "flags"`.

**Por qué importa (no es estética):** `hasLearningProgress` decide D056. Si no
contara `capitalsGame`, una cuenta que solo jugó Capitales sería "sin progreso" y **el
invitado que entra en ella la pisaría entera**. Con el registro, ese olvido no compila.

Descartado:
- **Migrar todo a una columna `games jsonb`** (`{ flags, countries, capitals }`):
  migración de filas en producción, y un cliente viejo con SW en caché seguiría
  escribiendo `country_history`/`countries_game` (mismo motivo que D021/D028).
- **Columna genérica `extra_games` para el tercer juego y siguientes**: ahorraría la
  migración del cuarto juego, pero añade una tercera forma de guardar y obliga a
  conservar juegos desconocidos al fusionar. Beneficio especulativo; una columna por
  juego es explícita y ya está probada.

**Cliente viejo** (SW en caché, no conoce Capitales): `pushLearningData` enumera
columnas, así que no manda `capitals_game` y Postgres conserva lo que hay (igual que
D028). No puede borrar el progreso de Capitales. Tamaño: con los tres juegos
aprendidos enteros la fila pasa de ~50 a ~75 KB por subida (D051 agrupa ~5 por sesión).

### D062 — `gameType` desconocido y clientes viejos

1. **A partir de esta versión** (futuro cuarto juego): `migrateConfiguration`
   **conserva** un `gameType` que no conoce (no lo pisa: lo subiría a la nube) y se
   **resuelve al leer** con `resolveGameType()` en el único sitio que lo lee
   (`Configuration.tsx`). Patrón D040.
2. **Los clientes de hoy no lo tienen.** Qué hace una pestaña vieja (PWA abierta desde
   antes del despliegue) cuando le llega por la nube `lastConfiguration.gameType = "capitals"`:
   selector sin opción marcada, título de Banderas, y `toGameView(…, "capitals")` cae en
   la rama de Países (`if (gameType === "flags") … else countriesGame`). **Riesgo real:**
   su "Práctica diaria" enseñaría banderas pero calificaría el SRS de **Países**. No
   pierde datos, pero los falsea. Solo con dos dispositivos, uno sin actualizar.
3. **Mitigación propuesta:** cambiar los bytes de `public/sw.js` (un comentario con la
   versión) **sin** subir `CACHE_NAME`: el navegador instala el SW nuevo y las pestañas
   abiertas ven "Actualizar" (D047/D050). Subir `CACHE_NAME` también funcionaría, pero
   borra la caché y re-descarga las 197 banderas (~3,1 MB por dispositivo, D054).
   No lo impide (quien no pulse "Actualizar" sigue igual), pero lo hace improbable.
   → Pregunta 9.

### D063 — Datos: archivo aparte, fuente y criterio

- **`src/data/capitals.ts`**, no un campo `capital` en `Country`:
  `Record<código, { name: string; accepted?: readonly string[]; note?: string }>`.
  `Country` es el catálogo compartido por los tres juegos (lo tipan 6 módulos y viaja
  en `activeGame.countries`); los alias y notas son contenido de este juego (y un futuro `aliases` de
  nombres de país, fuera de alcance en Países, iría en `Country`: no se mezclan).
- Cobertura garantizada por test (`tests/unit/capitals.test.ts`: 197/197, sin códigos
  de más), no por un `throw` al importar como el de `countries.ts`: un fallo aquí no
  debe tumbar la isla entera. Si faltara una entrada en ejecución, ese país se trata
  como fuera de catálogo (D040: la sesión se lo salta, nunca pantalla en blanco).
- **Fuente** (detalle y consultas en el anexo): se muestra la forma de la **UE**
  (Libro de estilo interinstitucional, Anexo A5, actualizado el 16-09-2026, elaborado
  "en consulta con la Real Academia Española"); qué ciudad y desde cuándo, con
  **Wikidata (P36)**; **Wikipedia (en)** como tercera referencia. 176/197 coinciden
  letra por letra entre UE y Wikidata. Fila en `CONTENT_CHECKLIST.md`.

### D064 — Capitales múltiples, disputadas y cambios recientes

**Es decisión del dueño** (§5.3 y pregunta 4). Propuesta resumida — el detalle con
fuentes y notas está en el anexo:

| País | Se muestra | También vale | No vale |
|---|---|---|---|
| Bolivia | Sucre (constitucional) | La Paz (sede del Gobierno) | — |
| Sudáfrica | Pretoria (administrativa) | Ciudad del Cabo (legislativa), Bloemfontein (judicial), Tshwane | — |
| Países Bajos | Ámsterdam (constitucional) | — | La Haya (sede del Gobierno) |
| Chile | Santiago | Santiago de Chile | Valparaíso (Congreso) |
| Malasia | Kuala Lumpur (constitucional) | Putrajaya (sede del Gobierno) | — |
| Benín | Porto Novo (oficial) | Cotonú (sede del Gobierno) | — |
| Costa de Marfil | Yamusukro (oficial) | — | Abiyán (económica / centro administrativo) |
| Tanzania | Dodoma | — | Dar es-Salaam (antigua) |
| Sri Lanka | Sri Jayawardenapura Kotte | Colombo (comercial, sede del Ejecutivo) | — |
| Esuatini | Babane | Mbabane, Lobamba (real y legislativa) | — |
| Montenegro | Podgorica | — | Cetiña (antigua capital real) |
| Myanmar | Naipyidó | Naypyidaw, Nay Pyi Taw, Nepidó | Rangún (antigua) |
| Yemen | Saná (de iure) | Adén (provisional del Gobierno reconocido) | — |
| Guinea Ecuatorial | **Ciudad de la Paz** (desde 03-01-2026) | — | Malabo (hasta 2026) — decidido por el dueño; la nota lo explica |
| Burundi | Guitega | Gitega | Buyumbura (económica) |
| Indonesia | Yakarta | Jakarta | Nusantara (designada, sin traslado) |
| Kazajistán | Astaná | — | Nur-Sultán (nombre 2019-2022) |
| Israel | Jerusalén (nota neutra) | — | Tel Aviv — **opción B de §5.3, elegida por el dueño** |
| Palestina | **Jerusalén Este** (capital proclamada) | Ramala (sede administrativa) | — **elegido por el dueño** |

Regla detrás de la tabla: vale toda ciudad que la UE (en su tabla o notas) o
Wikidata (P36 vigente) llaman capital de cualquier tipo; no valen las antiguas, las
económicas ni las sedes que ninguna fuente llama capital. Si un país cambia de
capital, se actualiza el archivo en su propio PR.

### D065 — Respuestas: alias por entrada; en difícil cuentan tildes y signos, en fácil no (decidido por el dueño)

- `normalize-answer.ts` gana `isAcceptedAnswer(answer, accepted[], difficulty)`.
  **`normalize` e `isCorrectAnswer` no cambian**: Banderas y Países comparan
  exactamente igual que hoy (lo prueba un test que sigue rechazando "Guinea Bisáu").
- **Regla del dueño (2026-09-22):** en **difícil** (y por tanto en competitivo) los
  apóstrofos, guiones y espacios **cuentan igual que las tildes**: hay que escribirlos
  como son ("Saint John's", "Porto Novo", "Port-au-Prince"). En **fácil** se ignoran,
  junto con las tildes ("saint johns", "portonovo" valen).
- Única equivalencia en difícil: el apóstrofo tipográfico `’` (el que usa la UE en
  "Saint John’s") cuenta como el `'` del teclado, que es el único que se puede
  escribir. Sigue habiendo que escribir el apóstrofo. (Propuesta del agente, pendiente
  de confirmar.)
- **Tildes: D032 intacto.** El competitivo fuerza "hard" (lo hace ya `startGame`).
  Una variante que solo difiere en la tilde no se añade como alias (la cubre "fácil"),
  salvo grafías documentadas como distintas (Hanói/Hanoi, Uagadugú/Uagadugu, Taipéi/Taipei).
- **Sin reglas genéricas de artículo ni de "Ciudad de"**: alias explícitos por
  entrada. Motivo concreto: "La Paz" es Bolivia y "Ciudad de la Paz" es Guinea
  Ecuatorial; una regla genérica los confundiría.
- En difícil, formas que difieren solo en signos y que las fuentes documentan como
  distintas se añaden como alias (p. ej. "Washington" además de "Washington D. C.").
- **Política de alias → pregunta 5.** A (recomendada): solo español, como los otros
  dos juegos (variantes documentadas por UE/Wikidata + formas corta/larga + topónimos
  locales que Wikidata registra como alias españoles). B: A + la forma internacional
  (etiqueta inglesa de Wikidata: Kyiv, Vilnius, Tallinn…), descartando la que sea la
  misma palabra sin tilde para no vaciar D032 ("Paris" ≠ "París" en competitivo).
  La tabla del anexo está hecha con A.
- Banderas y Países no cambian: su modo fácil sigue ignorando solo las tildes.
  Aplicarles la misma regla sería cambiar juegos cerrados → pregunta aparte.

### D066 — Selector de tres juegos a 320 px

Orden: **Países · Banderas · Capitales** (Capitales al final: no mueve lo que ya
existe; D030 intacto, el usuario nuevo sigue arrancando en Países). Icono: `City`
de `iconoir-react` (existe en la versión instalada).

**El problema, sobre el CSS real:** a 320 px quedan ~271 px para el segmentado
(`main` 0,4 rem + tarjeta `p-3` + bordes + `p-1` del grupo) → **~90 px por opción**.
"Capitales" en `text-xs` bold + icono de 18 px + hueco ≈ **87 px** (estimación; se
mide en el navegador en la Fase 4). Cabe con ~3 px de margen, que desaparecen con
cualquier ampliación de texto: con el espaciado de WCAG 1.4.12
(`letter-spacing: 0.12em`) "Capitales" crece ~13 px y **se sale**. No se reutiliza
`OptionTile` (el comentario de `GameTypeToggle` explica por qué).

Tres opciones → **pregunta 2**:

| | Qué es | A favor | En contra |
|---|---|---|---|
| **A (recomendada)** | Mismo segmentado con píldora; por debajo de `min-[30rem]` (breakpoint que ya existe) el icono va **encima** del texto | Conserva el diseño elegido ("B" del canvas); ~90 px solo para el texto → aguanta 1.4.12 y zoom; admite un cuarto juego | ~16 px más alto en móvil |
| B | Solo iconos en móvil, texto `sr-only` + tooltip | Igual de bajo que hoy | Un globo, una bandera y un edificio no se entienden solos; texto oculto a quien más lo necesita; rompe el helper de e2e que pulsa "Banderas" por texto |
| C | `Select` de HeroUI en móvil | Cabe cualquier número de juegos | Esconde las opciones tras un toque; cambia un diseño ya aprobado; dos componentes según ancho |

De paso (se reescribe el componente, así que se arregla aquí; si exige tocar un token,
se para y se pregunta):
- **Contraste de la opción marcada**: ya reportado dos veces (4,34:1 en claro, 2,44:1
  en oscuro, falla AA).
- **Sospecha, a comprobar en el navegador:** con el `translateX(calc(100% + 0.5rem))`
  actual, la píldora en "Banderas" sale 0,5 rem a la derecha de su opción (el padding
  del grupo ya desplaza la píldora; el `+ 0.5rem` lo cuenta dos veces). No se pudo
  medir en esta sesión (el navegador integrado no ejecuta scripts en archivos
  locales). La versión N usa `width: calc((100% - 0.5rem) / N)` y
  `translateX(índice × 100%)`. Si se confirma, es un arreglo visible y va al changelog.

### D067 — La tarjeta de Capitales

→ **pregunta 3**:

| | Qué muestra | A favor | En contra |
|---|---|---|---|
| **A (recomendada)** | Nombre del país grande + su bandera (de `public/flags/`, decorativa: `alt=""`, el nombre ya está en la pregunta) | Mismo peso visual que Banderas en el hueco de `FlagDisplay`; refuerza el juego de Banderas; banderas ya precargadas sin red (D054) | La bandera no aporta a la respuesta (no es pista) |
| B | Solo el nombre, grande | Lo más limpio; recuerdo puro | Hueco vacío grande en escritorio; se ve "a medio hacer" al lado de Banderas |
| C | Nombre solo; la bandera aparece al revelar/responder | La bandera como refuerzo después, sin distraer antes | Más estados que diseñar; la tarjeta cambia de alto al responder |

La pregunta del input lleva el país ("¿Cuál es la capital de Perú?"): el lector de
pantalla la oye entera al enfocar el input, sin depender de la tarjeta.

### D068 — `Session.tsx` generalizado para Banderas y Capitales

- `FlagGame`: `countries` → `CountriesRush`/`CountriesPractice` (sin cambios); **todo lo
  demás** → `Session`.
- `Session` lee `gameType` de `activeGame.configuration` y sus cinco `"flags"` fijos
  (`gradeCountryReview`, `attemptCountry`, los dos `finishGame`) pasan a ser ese valor.
  Lo que cambia por juego lo da una **tarjeta de sesión** (`session/session-cards.tsx`):
  estímulo, respuesta mostrada, cómo se comprueba, pregunta y placeholder.
  **Banderas usa `isCorrectAnswer` tal cual**, no el comparador nuevo: garantiza que
  compara exactamente igual.
- `AnswerForm` gana una prop opcional `answerNote?: ReactNode` (se pinta tras el aviso
  de acierto/fallo). Aditivo: `Session` de Banderas no la pasa.
- `DailyPractice`: `countries` → tarjeta cloze (sin cambios); si no, la tarjeta de
  sesión del juego, y al revelar la respuesta mostrada (+ alias + nota en Capitales).
- **Bugs que heredaría Capitales** (ya reportados, en código cerrado): repetir 1-4 muy
  rápido califica dos veces y el doble envío en competitivo. `CountriesPractice` los
  evitó desde el principio. → **pregunta 7**.
- Temporizador de práctica: `Session` conserva su efecto actual (con su comentario).
  Pasar a `useCardCountdown` sigue fuera de alcance.

### D069 — Rush de Capitales = rush de Banderas; ranking `capitals:world`

- Cada país una vez, orden aleatorio, penalización de 2 s por fallo y 5 s por
  saltar, tildes obligatorias, `completed: true` siempre (no hay "Rendirme"). Es
  literalmente el camino competitivo de `Session`, con otra tarjeta.
- Mejor tiempo por continente y de "Todo el mundo" en `capitalsGame.regionBestTimes`.
  Ranking en `leaderboard_entries` con scope **`capitals:world`**, sin migración.
  `GameEffects` sube la marca de cada juego desde **un solo efecto** que recorre los
  juegos (D061), con reintento tras la siguiente sincronización buena (D050) por juego.
- `LeaderboardModal`: el mismo selector de tres juegos (D066) dentro del modal
  (`w-[min(28rem,92vw)]`: a 320 px el caso es el mismo que en la tarjeta).
- Países cuya capital se llama como el país (Mónaco, Singapur, San Marino,
  Luxemburgo, Kuwait, Yibuti, Panamá, Túnez, Ciudad del Vaticano): en el rush son
  "gratis". Es la realidad del contenido e igual para todos; no se toca.

### D070 — Logros de Capitales

Sí, cuatro, espejo de los de Países (D036), con `gameType: "capitals"` (el modal ya
separa por juego). Copy provisional → `CONTENT_CHECKLIST.md`:

| id | Nombre (provisional) | Condición | Retroactivo |
|---|---|---|---|
| `capitales_de_europa` | Capitales de Europa | Aprender las 45 de Europa en Capitales | Sí (`capitalsGame.countryHistory`) |
| `primer_rush_de_capitales` | Contrarreloj de capitales | Terminar un competitivo de Capitales | Sí (`capitalsGame.regionBestTimes` no vacío) |
| `capitales_del_mundo` | La vuelta a las capitales | Terminar el competitivo de Capitales de "Todo el mundo" | Sí |
| `tres_en_uno` | Tres en uno | Un continente entero aprendido en los tres juegos | Sí |

- D017 intacto (nada se des-desbloquea; el motor no se toca). D026 intacto.
- Los que filtran por juego ya excluyen Capitales: `rush_impecable`/`sin_frenos`
  piden `gameType ?? "flags" === "flags"`; `primer_tablero`, `=== "countries"`. Los
  registros de Capitales se guardan con `gameType: "capitals"`. Test que lo pruebe.
- **Visto de paso:** los compartidos que leen `stats.*` ya cuentan respuestas de
  todos los juegos desde Países, pero su texto dice "banderas" ("Acierta 500 banderas
  en total", "sin fallar una sola bandera"). Con tres juegos el texto es más falso.
  Propuesta de texto neutro → fila 7 del checklist (copy del dueño; no se cambia sin
  su visto bueno).

### Sin decisión nueva (lo resuelve el registro de D061)

- **Práctica diaria** (D035): `dailyPracticeQueue = { gameType, codes }` ya es por juego.
- **Candado "practicado hoy"**: independiente por juego porque cada uno tiene su
  `lastPracticeByCountry`. Practicar Europa en Capitales no bloquea Europa en Banderas.
- Nota de "Todo el mundo" (D039), "X/197 aprendidos", selector de países sueltos
  (`isCountryDisabled`): todo sale de `toGameView`.

---

## 2. Reglas del proyecto que aplican aquí (resumen, no sustituye `CLAUDE.md`)

- **Bun** para todo. **Nadie levanta `bun run dev` salvo el dueño**: se le pide y se
  espera (Fases 4-7). Tras cada cambio en dev: desregistrar SW y borrar cachés.
- **Context7** antes de usar APIs de HeroUI v3, React Aria, Supabase o Tailwind.
- **Cero valores mágicos** de color/espaciado/radio (`COLORS.md`, `DESIGN_TOKENS.md`).
  No más `text-[Xrem]`. `primary`/`success` no van como color de texto.
- Persistencia **solo** por `learning-storage.ts`; Redux solo vía hooks y slices.
- Wrappers de `src/components/ui/` y `AnswerForm`: solo cambios **aditivos y opcionales**.
- framer-motion no se usa para nada nuevo (D006): `tw-animate-css`, CSS o WAAPI.
- WCAG 2.1 AA; skill **`a11y`** en cada fase de UI; nada alcanzable solo con ratón (D038).
- Copy nuevo = provisional marcado + fila en `CONTENT_CHECKLIST.md`.
- Bug encontrado en código cerrado → se **reporta**, no se arregla (salvo lo que el
  dueño apruebe en §7). Archivo que quede sin uso → se **señala**, no se borra.
- Comentarios en español, con el tono y la densidad del archivo (explican el porqué).
  Indentación con tabs (biome).
- Nunca push a `main`, nunca `gh pr merge`, sin `reset --hard` ni `push --force`.
  Los archivos locales (`context/plans/`, `CURRENT_PHASE.md`, `supabase/`) no van a git.

---

## 3. Arranque y forma de entrega

1. Ya leídos: `CLAUDE.md`, `PROJECT_CONTEXT`, `CURRENT_PHASE`, `DESIGN_RULES`,
   `DECISIONS_INDEX`, `plans/modo-paises.md`, `decisions/07`, `09`, `10`, `14`, `15`,
   `plans/auditoria-paises.md`, `CONTENT_CHECKLIST`, y el código de
   `types/`, `learning-storage`, `cloud-storage`, `useGame`, `gameSlice`, `FlagGame`,
   `Session`, `DailyPractice`, `AnswerForm`, `GameTypeToggle`, `Configuration`,
   `Results`, `LeaderboardModal`, `GameEffects` (ranking), `achievements`,
   `normalize-answer`, `usePracticeQueue`, `useCardCountdown`, `countries.ts`.
2. Antes de cambiar nada: `bunx astro check`, `bunx biome check ./src`,
   `bun run test`, `bun run build` sobre `main` y guardar la salida (línea base).
3. **Forma de entrega → pregunta 1.** Recomendado: **dos PR**.
   - **PR A `refactor/progreso-por-juego`** (Fase 1): el registro de D061 con los dos
     juegos de hoy. Invisible, sin versión ni changelog (D060), sin SQL. Se revisa
     solo, se mergea, y el PR B sale de `main` actualizado.
   - **PR B `feat/modo-capitales`** (Fases 2-7): todo lo de Capitales + SQL + 1.1.0.
   - Por qué: el refactor toca la capa que decide sincronizaciones (D048-D056); mejor
     revisarlo sin la feature alrededor y ver en producción que no cambió nada antes
     de añadir un juego encima. Coste: una espera de merge más. Alternativa: un solo
     PR con las 7 fases como 7 commits (lo que pedía el encargo); el plan sirve igual.
4. Anotar la rama en `CURRENT_PHASE.md` › Estado actual.

---

## 4. Fases

Cada fase termina con: `bunx astro check` limpio + `bunx biome check ./src` limpio +
`bun run test` verde + `bun run build` verde + reporte corto al dueño (qué se hizo, qué
no se pudo verificar) + **PAUSA** hasta que apruebe. Tras la aprobación: un commit en
Conventional Commits con el trailer de co-autoría. Una fase = un commit.

---

### Fase 1 — Progreso por juego sin ramas (refactor invisible)

**Objetivo:** que añadir un juego sea rellenar tablas, sin cambiar nada de lo que hay.

1. `learning-storage.ts`: registro + `getGameProgress`/`setGameProgress`;
   `toGameView`/`fromGameView` encima (misma semántica, incluido el segundo
   `saveLearningData` de D029); `normalizeLearningData`, `mergeLearningData` y
   `hasLearningProgress` recorriendo los juegos. **Mismo orden de claves** que hoy
   (lo compara `planSync` con `JSON.stringify`).
2. `types/country.ts`: mapas por juego (`GAME_TYPE_TITLES`, `GAME_TYPE_NOUNS`,
   `LEADERBOARD_SCOPES` = `{ flags: "world", countries: "countries:world" }` —
   **"world" se queda como está**: cambiarlo reiniciaría el ranking de Banderas).
3. `achievements.ts`: `countLearnedInGameRegions(data, gameType, regions)` en lugar de
   las dos funciones gemelas. Ningún logro cambia de condición.
4. `GameEffects.tsx`: los dos efectos de ranking → uno que recorre los juegos, con un
   ref por juego (mismo reintento con `lastSyncedAt`).
5. `Configuration`, `Results`, `LeaderboardModal`: ternarios → mapas.
6. `GameTypeToggle`: píldora para N opciones (ancho y desplazamiento calculados).
   Con 2 opciones debe verse igual que hoy salvo el desfase de 0,5 rem si se confirma
   (D066) — en ese caso se para y se pregunta si entra aquí o en la Fase 4.
7. **Tests** (`tests/unit/sync-merge.test.ts` y uno nuevo si hace falta): los 55 de hoy
   siguen verdes sin tocarlos; fixture realista → `normalize` y `merge` dan **el mismo
   JSON byte a byte** que antes del refactor; `toGameView`/`fromGameView` ida y vuelta
   para cada juego.
8. Docs: `decisions/16-modo-capitales.md` (D061), `DECISIONS_INDEX`,
   `docs/state-management.md`.

**PAUSA.** Commit: `refactor(progreso): registro de juegos en vez de ramas por juego`.
(Si se hacen dos PR: aquí se abre el PR A y se espera al merge.)

---

### Fase 2 — Capitales en el modelo de datos y la sincronización (sin juego todavía)

1. `types/country.ts`: `GAME_TYPES = ["countries", "flags", "capitals"]`, etiqueta
   "Capitales", icono `City`, título, sustantivo, scope `capitals:world`.
   `isGameType`/`resolveGameType` (D062).
2. `types/progress.ts`: `capitalsGame: GameProgress` (comentario D061).
3. `learning-storage.ts`: `capitalsGame` en `DEFAULT_DATA`, registro, orden de claves
   justo después de `countriesGame` en `normalize` **y** en `merge`.
   `migrateConfiguration` conserva un `gameType` desconocido (D062).
4. `cloud-storage.ts`: `capitals_game` en el `select`, en el mapeo (`?? {}`) y en el `upsert`.
5. **`supabase/capitals-game.sql`** (carpeta local, en la principal del repo), mismo
   estilo que `countries-game.sql`:
   `alter table public.user_learning_data add column if not exists capitals_game jsonb not null default '{}'::jsonb;`
   **No lo ejecuta el agente.**
6. `Configuration.tsx`: `resolveGameType(lastConfiguration?.gameType)`.
7. `FlagGame.tsx`: con `gameType === "capitals"`, marcador temporal dentro de la
   tarjeta ("Capitales — en construcción" + Salir), como hizo Países en su Fase 2. No
   llega a producción: se despliega el PR entero.
8. **Tests**: `normalizeLearningData({})` trae `capitalsGame` vacío; fila vieja sin
   `capitals_game` (`{}`) → válida; merge por revisión más reciente en Capitales
   (D048); idempotencia `merge(merge(r,l,b),l,b)` con Capitales; **cuenta con progreso
   solo en Capitales → `planSync` no la pisa con el invitado (D056)**; `gameType`
   desconocido se conserva y `resolveGameType` cae al por defecto.
9. `CURRENT_PHASE.md`: **acción manual bloqueante** — correr `supabase/capitals-game.sql`
   antes de desplegar. Sin la columna, el `select` falla con error de servidor y toda
   cuenta autenticada se queda en `local` con "No se pudo sincronizar" (D044/D050).

**PAUSA.** Commit: `feat(capitales): añade el juego al modelo de datos y a la sincronización`.

---

### Fase 3 — Datos de capitales y comparación de respuestas (puro, sin UI)

**Bloqueada hasta que el dueño apruebe el anexo** (preguntas 4 y 5).

1. `src/data/capitals.ts` generado desde `context/plans/modo-capitales-capitales.json`
   ya aprobado (script en el scratchpad, no en el repo), con cabecera que cite las
   fuentes y la fecha, y comentario en cada entrada con decisión (Israel, Palestina…).
2. `normalize-answer.ts`: `isAcceptedAnswer` (D065). `normalize`/`isCorrectAnswer` sin cambios.
3. `src/utils/capitals.ts`: `getCapital(code)` y la "respuesta mostrada"
   ("Sucre", con "También vale: La Paz" y la nota).
4. **`tests/unit/capitals.test.ts`**: 197/197 y nada más; nombres sin espacios
   sobrantes; sin alias repetidos tras normalizar; y casos: Bolivia (las dos),
   Sudáfrica (las tres), "Saint Johns" falla en "hard" y vale en "easy", "Saint John’s"
   vale escrito con ' en "hard", "Porto-Novo" falla en "hard", "Bogota" falla en
   "hard" y vale en "easy", Hanoi/Hanói en "hard", "La Paz" **no** vale para Guinea Ecuatorial,
   lo decidido sobre Malabo. Y uno de guarda: `isCorrectAnswer("Guinea Bisáu", "Guinea-Bisáu")`
   sigue siendo `false` (Banderas/Países no cambian).
5. `CONTENT_CHECKLIST.md`: fila de la lista de capitales (aprobada, con fecha).
6. Docs: D063-D065.

**PAUSA.** Commit: `feat(capitales): añade las 197 capitales con alias y su comparación`.

---

### Fase 4 — Selector de tres juegos y configuración

1. Context7: nada nuevo de HeroUI si se elige A; con C, `Select` de HeroUI v3.
2. `GameTypeToggle` según la opción elegida (D066), con arreglo de contraste.
   Tokens existentes; si hace falta uno nuevo, se para y se pregunta.
3. `Configuration`: título "Aprende las capitales del mundo" (provisional); progreso,
   notas y práctica diaria del juego elegido ya salen de `toGameView`.
4. **Pedir al dueño que levante `bun run dev`.** Verificar: 320/360/390/768/1280,
   claro y oscuro, zoom 200 % y 400 %, espaciado de texto 1.4.12, teclado (flechas
   dentro del grupo, foco visible), carga inicial (D042: sin píldora), y el
   `LeaderboardModal` con tres opciones a 320 px. Medir aquí el ancho real de
   "Capitales" y el desfase de la píldora (D066).
5. Skill **`a11y`** + axe-core 4.10 en claro y oscuro (objetivo: sin violaciones
   nuevas; y que desaparezca la de contraste del selector).
6. `CONTENT_CHECKLIST.md`: copy del selector y del título. Docs: D066.

**PAUSA.** Commit: `feat(capitales): selector de tres juegos en configuración`.

---

### Fase 5 — Sesión: práctica y competitivo de Capitales

1. `session/session-cards.tsx`: tarjeta de Banderas (`FlagDisplay`, `isCorrectAnswer`,
   textos actuales) y de Capitales (`CapitalCard` + `isAcceptedAnswer` + nota).
2. `session/capitals/CapitalCard.tsx` según D067. Sin framer (D006); la entrada, con
   `tw-animate-css` como el resto.
3. `Session.tsx` generalizado (D068). `AnswerForm` + `answerNote?`. Si el dueño aprueba
   la pregunta 7, el guard de calificación doble va en un PR previo, no aquí.
4. `FlagGame`: quita el marcador de la Fase 2.
5. `Results`: sustantivo por juego ("capitales").
6. Verificar con dev: práctica de Sudamérica (Bolivia con las dos respuestas, fallo con
   nota), dificultad fácil/difícil, saltar, 1-4, temporizador de 5 s, rush de Oceanía
   completo con penalizaciones, **Banderas intacta** (práctica y rush), 320 px,
   claro/oscuro, lector de pantalla (la pregunta incluye el país; la nota se anuncia).
7. Skill `a11y` + axe-core. `CONTENT_CHECKLIST`: pregunta, placeholder, feedback, notas.
8. Docs: D067-D069 (la parte de sesión).

**PAUSA.** Commit: `feat(capitales): práctica y competitivo reutilizando la sesión de banderas`.

---

### Fase 6 — Ranking y práctica diaria

1. Ranking: el efecto de `GameEffects` (Fase 1) ya incluye `capitals:world`;
   `LeaderboardModal` con el selector de tres; descripción "…todas las capitales".
2. `DailyPractice`: Capitales con su tarjeta; al revelar, capital + alias + nota.
3. Verificar con dev (vencidos inyectados a mano en `localStorage`, como en Países):
   la cola de Capitales, que "Práctica diaria (N)" cambia al cambiar de juego, que
   el **candado es independiente** (Europa en Capitales no bloquea Europa en Banderas
   ni en Países), y el ranking de Capitales tras completar "Todo el mundo" con cuenta
   (si hay cuenta de prueba; si no, se marca no verificado).
4. Skill `a11y` + axe-core sobre modal de ranking y práctica diaria.

**PAUSA.** Commit: `feat(capitales): ranking y práctica diaria de capitales`.

---

### Fase 7 — Logros y cierre

1. `achievements.ts`: los cuatro de D070 + test de que ningún registro de Capitales
   desbloquea logros de Banderas o Países, y de retroactividad.
2. **Changelog y versión (D057-D060):** `package.json` **1.0.0 → 1.1.0** (MINOR: juego
   nuevo) y entrada arriba de `CHANGELOG.md` en lenguaje de jugador (Añadido:
   Capitales…; Corregido: lo que se haya arreglado de paso y el dueño haya aprobado).
   Será el **primer aviso real de "Novedades"** (D058 selló la 1.0.0 en silencio).
3. `public/sw.js`: el cambio de bytes de D062 si se aprueba (pregunta 9).
4. Skill **`a11y`** completa sobre todo el flujo, sin ratón de punta a punta.
5. `bun run test:e2e` con el server del dueño. Si fallan flujos de Banderas por el
   selector, se reporta; el test se ajusta solo si el cambio es intencional y se dice.
   Si Playwright se cuelga (entorno Windows documentado), se dice, no se tapa.
6. Subagentes `design-qa` y `functional-qa` sobre Capitales (si no pueden ejecutar,
   su reporte se marca **no verificado en navegador**).
7. Documentación: `decisions/16-modo-capitales.md` completo (D061-D070),
   `DECISIONS_INDEX`, `COMPONENTS_INVENTORY` (`CapitalCard`, `session-cards`),
   `CONTENT_CHECKLIST`, `docs/state-management.md`, `PROJECT_CONTEXT` (tres juegos),
   `CURRENT_PHASE` (qué se verificó y qué no, acción manual del SQL).
8. `git push -u origin feat/modo-capitales` + `gh pr create` con la plantilla, la
   acción manual bloqueante en el cuerpo y la lista de lo no verificado.

**PAUSA FINAL.** El merge lo hace el dueño.

---

## 5. Contenido que necesita al dueño

### 5.1 Copy provisional (todo va a `CONTENT_CHECKLIST.md`, filas nuevas #21-#23)

- **#21 Modo Capitales:** "Capitales" (selector), "Aprende las capitales del mundo",
  "¿Cuál es la capital de {país}?", "Escribe el nombre de la capital", "También vale:
  …", las notas por capital (factuales, pero la redacción es del agente),
  "…practicando todas las capitales" (ranking), "capitales" en resultados.
- **#22 Lista de capitales** (principal, alias, casos de §5.3): contenido del dueño.
- **#23 Logros de Capitales** (4): nombres y descripciones.

### 5.2 Grafías donde UE y Wikidata difieren (se muestra la de la UE; las dos valen)

Camberra/Canberra · Nueva Deli/Nueva Delhi · Hanoi/Hanói · Babane/Mbabane ·
Nassau/Nasáu · Uagadugu/Uagadugú · Abu Dabi/Abu Dhabi · Port Moresby/Puerto Moresby ·
Tarawa/Tarawa Sur · Melekeok/Ngerulmud · Santiago/Santiago de Chile ·
Panamá/Ciudad de Panamá · Kuwait/Ciudad de Kuwait · Yibuti/Ciudad de Yibuti.
Propuesta: una regla sin excepciones (la UE). Si prefieres la más conocida en
alguna (Canberra, Mbabane, Nueva Delhi…), basta con decir cuáles: solo cambia qué se
muestra al fallar.

### 5.3 Israel y Palestina (decisión del dueño, no del agente)

Lo que dicen las fuentes, sin interpretarlo:

- **Israel.** Wikidata: Jerusalén. La **UE deja la casilla vacía a propósito** (nota 64:
  "El Gobierno, la Knesset (Parlamento) y el Tribunal Supremo se hallan en Jerusalén.
  Los Estados miembros de la Unión Europea tienen sus embajadas en Tel Aviv").
  Wikipedia: la Ley de Jerusalén la declara capital; la Resolución 478 del Consejo de
  Seguridad la declaró nula.
- **Palestina.** La UE no la lista. Wikidata: **Jerusalén Este** (de iure, proclamada) y
  **Ramala** (de facto, sede administrativa). Wikipedia: ídem.

Opciones (se pueden combinar por país):

| | Israel | Palestina | A favor | En contra |
|---|---|---|---|---|
| **A** | Se muestra Jerusalén; vale Jerusalén. Nota neutra ("sede del Gobierno y del Parlamento; su estatus es objeto de disputa internacional") | Se muestra Jerusalén Este; valen Jerusalén Este y Ramala. Nota neutra ("Ramala es la sede administrativa") | Coherente con la regla de D064 (lo que registra Wikidata); la nota explica sin tomar partido | Alguien leerá "tomar partido" en cualquier elección |
| B | Igual que A | Se muestra Ramala; vale Ramala (y Jerusalén Este) | Muestra lo que funciona hoy como capital | Rompe la regla de D064 solo en un país |
| C | Sin capital en el juego (como la UE): no aparecen en Capitales | Ídem | Es lo que hace la fuente principal | Rompe "los 197 en los tres juegos": "Todo el mundo" serían 195 capitales, y los logros, el ranking y "X/197" necesitan un total por juego (más código, más casos) |

No hay recomendación del agente sobre el fondo. Si se elige C, hay que decirlo antes
de la Fase 1 (cambia el registro y los totales).

---

## 6. Fuera de alcance (anotar en `CURRENT_PHASE.md`, no implementar)

- Pistas letra a letra en Capitales (las tiene Países; `Session` no).
- Modo inverso (capital → país) o bandera → capital: descartados por el dueño.
- Ignorar apóstrofos/guiones/espacios en el modo fácil de Banderas y Países (D065).
- Alias de nombres de país en Países/Banderas (sigue fuera, `modo-paises.md` §5).
- Rankings por continente (el esquema ya lo soporta: `capitals:europe`…).
- Pasar `Session` a `useCardCountdown`.
- Un mecanismo general para que cada publicación ofrezca "Actualizar" (D062 lo hace
  a mano para esta; convertirlo en regla de publicación sería una unidad aparte).

## 7. Preguntas para el dueño

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| 1 | ¿Dos PR (refactor primero) o uno con 7 commits? | Dos PR | Fase 1 |
| 2 | Selector a 320 px: A (icono encima del texto en móvil), B (solo iconos) o C (desplegable) | A | Fase 4 |
| 3 | Tarjeta: A (país + bandera), B (solo país) o C (bandera al responder) | A | Fase 5 |
| 4 | ¿Apruebas la tabla de D064 y el anexo? En particular: **Israel y Palestina** (§5.3), **Malabo** (¿vale o no?), La Haya / Abiyán / Valparaíso (propuesta: no valen) y la regla de grafías de §5.2 | Ver cada fila | Fase 3 (la opción C de §5.3: Fase 1) |
| 5 | Alias: política A (solo español) o B (+ forma internacional) | A | Fase 3 |
| 6 | ¿Los cuatro logros de D070? ¿Y propongo texto neutro para los compartidos que dicen "banderas" (fila 7)? | Sí a los cuatro; texto neutro con tu aprobación | Fase 7 |
| 7 | Bugs que heredaría Capitales de `Session` (1-4 repetido, doble envío): ¿PR pequeño `fix/sesion-calificacion-doble` antes de la Fase 5? Si no, Capitales sale con ellos | Sí, PR previo | Fase 5 |
| 8 | "Acertaste X de Y **banderas** a la primera" también sale en la práctica de **Países** (bug de copy ya en `main`); esa línea se parametriza por juego en la Fase 5, ¿lo arreglo ahí mismo? Igual el "calificas cada bandera" de la ayuda de `GameTab` | Sí, las dos líneas se tocan igual | Fase 5 |
| 9 | ¿Cambio de bytes en `sw.js` (sin subir `CACHE_NAME`) para que las pestañas viejas vean "Actualizar"? | Sí | Fase 7 |
| 10 | Orden del selector: Países · Banderas · Capitales | Así | Fase 2 |

## 8. Riesgos conocidos

| Riesgo | Mitigación |
|---|---|
| Desplegar sin correr `capitals-game.sql` → toda cuenta autenticada queda en `local` sin sincronizar | Acción manual bloqueante en `CURRENT_PHASE.md` (Fase 2) y en el cuerpo del PR |
| Olvidar el tercer juego en alguna fusión o conteo → el invitado pisa una cuenta que solo jugó Capitales (D056) | Registro de D061 (`Record` obliga a rellenarlo) + test específico en la Fase 2 |
| El refactor cambia sin querer el JSON de la fila → una subida de más en cada sincronización, o peor | Test de igualdad byte a byte con un fixture (Fase 1) |
| Pestaña vieja con "capitals" en la configuración → califica el SRS de Países desde una tarjeta de bandera (D062) | Aviso "Actualizar" (pregunta 9); desde esta versión, `resolveGameType` |
| Romper Banderas al generalizar `Session` | Banderas sigue con `isCorrectAnswer`; `bun run test:e2e` (14 flujos) + verificación manual en la Fase 5 |
| El selector no cabe a 320 px o con texto ampliado | Opción A de D066 y verificación con 1.4.12 y zoom 400 % (Fase 4) |
| Capitales que cambian (Indonesia/Nusantara) | Archivo con fecha y fuente; revisar Indonesia antes de cada PR que lo toque |
| Playwright intermitente en este Windows | Se dice en el reporte; la verificación manual con el server del dueño no depende de él |

### 7.1 Respuestas del dueño (2026-09-22)

| # | Respuesta |
|---|---|
| 1 | **Dos PR**: primero `refactor/progreso-por-juego` (Fase 1), luego `feat/modo-capitales` |
| 2 | Vistas en el canvas de Claude Design "Capitales: selector y tarjeta" (https://claude.ai/artifact/6F17Z9SsY9URwCVR2chsPd): **desplegable (opción C) solo en móvil; en pantallas mayores, las pastillas de hoy con tres opciones**. El umbral: el breakpoint `min-[30rem]` que ya existe (a confirmar midiendo en la Fase 4) |
| 3 | **Opción B: solo el nombre del país** (sin bandera) |
| 4 | **Israel = Jerusalén** (con nota neutra) y **Palestina = Jerusalén Este** (vale también Ramala, su sede administrativa). **Malabo no vale.** La Haya, Valparaíso y Abiyán: regla del dueño — "si el país tiene otra ciudad como capital, esas no valen; si no la tuviera, se eligen esas" → Países Bajos = Ámsterdam, Chile = Santiago, Costa de Marfil = Yamusukro; las tres quedan como **no válidas** (con su nota). Grafías de §5.2: la regla de la UE, sin excepciones |
| 5 | **Política A** (solo español) |
| 6 | Sí a los cuatro logros; texto neutro para los compartidos, a aprobar en su fila del checklist |
| 7 | Sí: PR pequeño `fix/sesion-calificacion-doble` antes de la Fase 5 |
| 8 | Sí: se arreglan las dos líneas de copy en la Fase 5 |
| 9 | Sí: cambio de bytes en `sw.js` sin subir `CACHE_NAME` |
| 10 | (Sin objeción) Países · Banderas · Capitales |
| — | **Signos (D065), regla del dueño:** en difícil/competitivo los apóstrofos, guiones y espacios cuentan como las tildes; en fácil se ignoran. Confirmado: el `’` tipográfico equivale al `'` del teclado |
