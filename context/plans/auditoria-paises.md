# Auditoría del catálogo de países (`src/data/countries.ts`)

> **Unidad de solo auditoría — sin cambios de código.** Sesión del 2026-09-21,
> worktree `.claude/worktrees/unruffled-lamport-f20993` sobre `main` @ `0fc1b9d`.
> No se tocó `src/` ni ningún archivo de producto; no hay commits ni PR.
> Documento local (gitignored por `/context/plans/`). Si el dueño lo quiere en el
> repo, lo decide él. Su sitio definitivo es la carpeta principal
> (`C:\Users\Admin\Documents\Work\world-flags\context\plans\`).
>
> Todo lo que aquí se afirma sobre datos externos se comprobó contra una fuente
> descargada en esta sesión (ver §9). Lo que no se pudo verificar lo dice.

---

## 0. Resumen

**Criterio actual, verificado:** los 196 son exactamente los **193 miembros de la
ONU + Santa Sede (Vaticano) + Palestina** (los dos observadores) **+ Kosovo**. No
falta ningún miembro de la ONU. Taiwán no está.

Ese criterio **ya es coherente tal cual**, con un nombre sencillo: *"los Estados
reconocidos por más de la mitad de los miembros de la ONU"* (Palestina 157/193,
Kosovo ~110/193; Taiwán 11/193 queda fuera). No es un criterio "raro" que haya que
arreglar sí o sí.

**Continentes:** la asignación coincide **exactamente** con el esquema geográfico
oficial de la ONU (M49) en 194 de 195 países; la **única** excepción es México
(M49 → Centroamérica; la app → Norteamérica). Kosovo no figura en M49.

**Nombres:** cero erratas. 187/196 idénticos al estándar CLDR (`es`); los 9
restantes son variantes legítimas. El riesgo real no está en los nombres sino en
la falta de alias (ya fuera de alcance, `modo-paises.md` §5).

**Hallazgos técnicos que condicionan cualquier cambio del total** (detalle en §5):

1. **Bug latente de pantalla en blanco.** Si una cola de práctica contiene un
   código que el catálogo no conoce, `DailyPractice` y `Session` devuelven `null`
   y el usuario se queda **sin tarjeta, sin cabecera y sin botón Salir** (solo sale
   recargando). Hoy no pasa nunca; **se activa en cuanto un código salga del
   catálogo** (bajar a 195) o llegue un código nuevo a un cliente viejo (subir a 197).
2. **Los conteos no se cruzan con el catálogo:** `countLearnedCountries`,
   `getDueCountries` y `countLearned` (logros) cuentan cualquier clave guardada.
   Con un país eliminado: "196/195 · 101 %" y un logro "La vuelta al mundo" que se
   puede desbloquear en falso — y por D017 **ya no se podría retirar**.
3. **El ranking no se puede "resetear" borrando filas:** `GameEffects` vuelve a
   subir `regionBestTimes.world` en **cada** carga autenticada, y el merge se queda
   con el tiempo menor de cualquier dispositivo. Si se quiere un ranking limpio hay
   que **versionar la clave**, no borrar.
4. **Ninguna opción necesita migración de esquema en Supabase.**

**Recomendación (§6):** opción **A — añadir Taiwán (197)**, en **dos PR**: primero
uno defensivo invisible (filtrar códigos fuera de catálogo + derivar el total de
`countries.length`), y después el de contenido. El tratamiento del ranking se
decide con la consulta de diagnóstico de §7. La opción C (bajar a 195) es la que
más rompe: prácticamente todo usuario activo tiene progreso de Kosovo guardado.

---

## 1. Verificación del criterio actual

### Método

1. Se parsearon las 196 entradas de `src/data/countries.ts` (código, nombre, región).
2. Se descargó la lista oficial de miembros de `un.org/en/about-us/member-states`:
   **193 miembros** (192 cabeceras `<h2 class="mb-0">` + Türkiye, que en esa página
   usa un `<h2>` sin clase; hay 193 "Date of Admission", que cuadra).
3. Cada nombre oficial de la ONU se mapeó a su código ISO 3166-1 alfa-2: 165 por
   coincidencia literal con el índice en inglés de flagcdn (`flagcdn.com/en/codes.json`)
   y 28 a mano (formas largas: "Bolivia (Plurinational State of)", "Naoero" = Nauru,
   "Türkiye", etc.; cada una con el nombre de flagcdn al lado como control).
   Un falso positivo del mapeo automático ("Georgia" = estado de EE. UU. `us-ga`)
   se corrigió a `ge`.
4. Diferencia de conjuntos contra el catálogo.

### Resultado

| Comprobación | Resultado |
|---|---|
| Miembros ONU ausentes del catálogo | **Ninguno** (0/193) |
| Entradas del catálogo que no son miembros ONU | **3:** `va` Ciudad del Vaticano, `ps` Palestina, `xk` Kosovo |
| Total | 193 + 3 = **196** ✔ |
| `public/flags/*.svg` ↔ códigos del catálogo | 196 archivos, **1:1** (diff vacío) ✔ |
| `xk.svg` local vs `flagcdn.com/xk.svg` | Idénticos byte a byte |
| ¿Cambió el catálogo alguna vez? | **No.** Mismo conjunto de códigos y de nombres desde el primer commit (`b3cad69` "Beta Phase") → hoy no debería haber códigos huérfanos en datos de usuarios |

Reparto por continente confirmado: África 54 · Asia 48 · Europa 45 · Oceanía 14 ·
Caribe 13 · Sudamérica 12 · Centroamérica 7 · Norteamérica 3. Los tres extra caen
en Europa (`va`, `xk`) y Asia (`ps`); África, América y Oceanía son 100 % ONU.

La lista país a país está en el **Anexo A**.

### Correcciones al punto de partida del encargo

Los datos de partida eran correctos salvo números de línea (el archivo cambió desde
que se anotaron):

| Encargo decía | Línea real hoy |
|---|---|
| `Configuration.tsx:79` | `Configuration.tsx:80` (`calculateLearningProgress(…, 196)`) |
| `Configuration.tsx:149` | `Configuration.tsx:157` (`totalCountries={196}`) |
| `RegionSelector.tsx:98` | `RegionSelector.tsx:100` (`countryCount={196}`) |
| `countries.ts:1001-1003` | igual (`if` en 1001, `throw` en 1002) |
| `Layout.astro:13` | igual |

"196" aparece además solo en comentarios: `types/country.ts:63`,
`learning-storage.ts:1240-1241`, `CountryBoard.tsx:54,56`. En la documentación:
`context/PROJECT_CONTEXT.md:8` y `:98` (y el histórico `plans/modo-paises.md`).
README, manifest, `sw.js` y los e2e **no** dependen del número.

---

## 2. Entidades que quedan fuera

| Entidad | Reconocimiento (verificado en esta sesión) | Continente según el criterio de la app (M49) | flagcdn |
|---|---|---|---|
| **Taiwán** (República de China) | **11 miembros ONU + Santa Sede** (12 "aliados" según su Ministerio de Exteriores). La ONU no la reconoce desde la Res. 2758 (1971); ~142 miembros apoyan explícitamente la postura de la RPC (Lowy, ene-2025). Control efectivo pleno, bandera propia muy conocida | **Asia** (Asia oriental). M49 no la lista aparte (la cuenta dentro de China) | ✔ `tw` — `flagcdn.com/tw.svg` 200, 397 B, "Taiwán" |
| **Sáhara Occidental / RASD** | La RASD ha sido reconocida por **84** miembros ONU en algún momento; varios la han congelado o retirado. Miembro de la Unión Africana. La ONU lista el Sáhara Occidental como territorio no autónomo | **África** (M49: Northern Africa) | ✔ `eh` — 200, 504 B. El SVG pinta **la bandera de la RASD** (colores `#007a3d`, `#c4111b`, blanco + negro). Ojo: el código ISO `eh` es del *territorio*, no del Estado |
| **Chipre del Norte** | Solo **Turquía**. Res. 541 del Consejo de Seguridad la declara inválida | **Asia** (igual que Chipre en la app) | ✘ sin código (probado) |
| **Somalilandia** | **1 miembro ONU: Israel** (26-12-2025). Un intento de Guinea-Bisáu en jul-2026 se cayó | **África** | ✘ sin código |
| **Abjasia** | **4 miembros ONU:** Rusia, Nicaragua, Venezuela, Siria. Nauru lo retiró el 30-07-2026; Vanuatu y Tuvalu antes | **Asia** (igual que Georgia en la app) | ✘ sin código |
| **Osetia del Sur** | Los mismos 4 que Abjasia | **Asia** (igual que Georgia) | ✘ sin código |
| **Transnistria** | **Ningún** miembro ONU (solo relaciones con Abjasia y Osetia del Sur) | **Europa** (igual que Moldavia) | ✘ sin código |
| **Islas Cook** | Estado en libre asociación con Nueva Zelanda. No es miembro de la ONU, pero la ONU le reconoce plena capacidad para firmar tratados; miembro de organismos especializados | **Oceanía** (M49: Polynesia) | ✔ `ck` — 200, 1056 B, "Islas Cook" |
| **Niue** | Igual que Islas Cook; miembro de UNESCO y OMS | **Oceanía** (M49: Polynesia) | ✔ `nu` — 200, 1023 B, "Niue" |

Notas:

- flagcdn tiene 306 códigos (252 de dos letras); los únicos no estándar fuera de
  los estados de EE. UU. son `gb-eng`, `gb-nir`, `gb-sct`, `gb-wls`. Ninguno cubre
  Chipre del Norte, Somalilandia, Abjasia, Osetia del Sur ni Transnistria. Esas cinco
  banderas habría que sacarlas de otra fuente (p. ej. Wikimedia Commons) **verificando
  la licencia archivo por archivo** — regla de "cero contenido inventado".
- Bajo qué criterio entraría cada una:
  - *"Reconocido por la mayoría de la ONU"* (el implícito hoy): ninguna.
  - *"Estados con control efectivo pleno y amplia presencia internacional"*: Taiwán.
  - *"Estados que la ONU trata como Estados sin ser miembros"*: Islas Cook y Niue
    (y Palestina/Vaticano, que ya están).
  - *"Cualquier entidad soberana de facto"*: todas, pero agruparlas juntas es
    discutible: Cook/Niue tienen estatus reconocido; Abjasia, Osetia del Sur y Chipre
    del Norte son, para casi toda la comunidad internacional, territorio ocupado.
- **Colisión nueva en el rush de países:** "Chipre" es prefijo de "Chipre del Norte".
  Lo absorbe la regla existente de D031 (espera de 700 ms / Enter), pero añade
  fricción. Ningún otro candidato crea colisiones de prefijo.

---

## 3. Asignación por continente

### Qué criterio sigue

Se comparó cada país con el esquema geográfico oficial de la ONU (M49, tabla de
`unstats.un.org`), convirtiendo así: *Northern America* → Norteamérica; región
intermedia *Caribbean / Central America / South America* → Caribe / Centroamérica /
Sudamérica; *Europe / Asia / Africa / Oceania* → su continente.

**Resultado: 194 de 195 coinciden.** El criterio de facto es **M49 con una
excepción explícita: México en Norteamérica** (M49 lo pone en *Central America*).
Kosovo no está en M49; Europa es su sitio natural.

La excepción de México tiene sentido: con M49 estricto, Norteamérica quedaría con
**2 países** (Canadá, EE. UU.), y la costumbre escolar en español es "América del
Norte = Canadá, EE. UU. y México". Conviene dejarla **anotada como decisión**, no
como accidente.

### Dónde un usuario podría discrepar (todos coherentes con M49)

| País | En la app | Por qué alguien lo esperaría en otro sitio |
|---|---|---|
| Rusia | Europa | La mayor parte del territorio está en Asia. (M49: Eastern Europe; capital y mayoría de la población en Europa) |
| Turquía | Asia | Estambul, candidata a la UE, UEFA, Consejo de Europa |
| **Chipre** | Asia | **Miembro de la UE** — probablemente la queja más frecuente |
| Armenia, Azerbaiyán, **Georgia** | Asia | Consejo de Europa, UEFA, Eurovisión; frontera del Cáucaso ambigua |
| Kazajistán | Asia | Una franja al oeste del río Ural es Europa; UEFA |
| México | Norteamérica | Quien siga M49 o el uso "Mesoamérica" lo esperaría en Centroamérica |
| Guyana, Surinam | Sudamérica | Cultural y políticamente caribeños (CARICOM) |
| Egipto, Indonesia | África, Asia | Son transcontinentales (Sinaí; Papúa), pero es la convención habitual |

¿Es coherente consigo mismo? **Sí.** La regla implícita (M49) coincide con "el
continente de la capital" en todos los transcontinentales: Moscú → Europa; Ankara,
Nicosia, Ereván, Bakú, Tiflis y Astaná → Asia. La asimetría Rusia/Turquía que
llama la atención tiene esa explicación.

### Por qué esto importa más en el modo Países

En Banderas el continente es solo un filtro. En **Países, el continente es el
contenido que se aprende.** Consecuencia concreta: en el rush de "Europa", escribir
*Chipre*, *Turquía*, *Georgia*, *Armenia*, *Azerbaiyán* o *Kazajistán* **no hace
nada** (`findMatch` solo mira los países del alcance → `kind: "none"`, sin
mensaje), y el usuario puede creer que lo escribió mal. No es un bug (así se diseñó
D031), pero sí la fricción más probable por la asignación de continentes. Una pista
del estilo "Chipre está en Asia en este juego" sería una unidad aparte.

---

## 4. Nombres en español (`name`)

### Erratas

**Ninguna.** Los 196 nombres coinciden con al menos una fuente normativa:

- **CLDR `es`** (Unicode, lo que usan navegadores e `Intl.DisplayNames`; ICU 73.2):
  **187/196 idénticos**.
- Los 9 distintos de CLDR `es`, todos válidos:

| Código | App | CLDR `es` | Nota |
|---|---|---|---|
| `ba` | Bosnia y Herzegovina | = (`es-419`: Bosnia-Herzegovina) | *Ortografía* 2010 / DPD: Bosnia-Herzegovina; ONU: "y" |
| `cz` | República Checa | **Chequia** | *Ortografía* 2010, DPD, Fundéu y CLDR: Chequia (nombre corto oficial desde 2016) |
| `sa` | Arabia Saudita | Arabia Saudí | DPD admite ambas |
| `mm` | Myanmar | Myanmar (Birmania) | *Ortografía* 2010 / DPD: Birmania; ONU: Myanmar |
| `ps` | Palestina | Territorios Palestinos (corto: Palestina) | La app usa la forma corta, correcta para un Estado observador |
| `tl` | Timor Oriental | Timor-Leste | *Ortografía* 2010: Timor Oriental |
| `ci` | Costa de Marfil | Côte d'Ivoire (`es-419`: Costa de Marfil) | Uso general en español |
| `ml` | Malí | Mali | Fundéu y *Ortografía*: ambas válidas |
| `cg` | República del Congo | Congo (`es-419`: República del Congo) | La forma larga evita la ambigüedad con `cd` |

- Frente a flagcdn (de donde salieron las banderas), la app eligió a propósito
  formas más actuales en 6 casos: Rumanía, Bangladés, Esuatini, Malaui, República del
  Congo, República Democrática del Congo. Todas coinciden con CLDR `es` y con Fundéu.
- Frente a la *Ortografía* 2010 (vía el anexo de Wikipedia; la web de la RAE bloquea
  descargas automáticas con Cloudflare y **no se forzó**): aparte de artículos
  ("el Perú") solo difieren Chequia, Birmania, Bosnia-Herzegovina, Suazilandia (la
  *Ortografía* es anterior al cambio de nombre de 2018) y Nueva Zelandia (el DPD
  admite Nueva Zelanda).

**Dato útil para decidir:** el progreso se guarda **por código**, no por nombre.
Renombrar (p. ej. República Checa → Chequia) **no toca datos** ni necesita
migración; solo cambia lo que el usuario tiene que escribir.

### Dónde fallaría hoy un usuario que "se lo sabe"

`normalize` solo hace `trim` + minúsculas (y quita tildes en "fácil"). **No
colapsa guiones ni espacios dobles**, y el competitivo exige tildes (D032, no se
re-litiga). Con eso:

- **Tildes poco habituales** (fallan en competitivo si se escriben sin tilde):
  Bangladés, Baréin, Brunéi, Malí, Benín, Guinea-Bisáu. Es donde más pesa D032,
  sobre todo en el rush de "Todo el mundo".
- **Guion vs. espacio:** "Guinea Bisáu" (con espacio) falla; "Bosnia-Herzegovina" y
  "Timor-Leste" fallan.
- **Alias que un usuario escribiría** — el alias está registrado como **fuera de
  alcance** en `context/plans/modo-paises.md` §5 (decisión de contenido del dueño).
  Aquí solo se listan como insumo para esa decisión, **no se implementan**:
  - Formas cortas: *Vaticano* / *Santa Sede*, *Congo* (ambiguo `cg`/`cd`), *RDC*,
    *Macedonia*, *Bosnia*, *Marshall* / *Salomón* (sin "Islas"), *Emiratos*, *EAU*.
  - Otras formas oficiales o normativas: *Chequia*, *Birmania*, *Suazilandia*,
    *Nueva Zelandia*, *Arabia Saudí*, *Timor-Leste*, *Moldova*, *Belarús*,
    *Suriname*, *Iraq*, *Qatar*, *Rumania* (sin tilde: válida según DPD y habitual
    en América, pero hoy falla en competitivo).
  - Grafías inglesas o antiguas muy extendidas: *Bangladesh*, *Bahréin*, *Malawi*,
    *Botswana*, *Lesotho*, *Djibouti*, *Zimbabwe*, *Rwanda*, *Kenya*, *Fiji*,
    *Palau*, *Guinea-Bissau*, *Kazajstán*, *Kirguizistán*.
  - Coloquiales: *EE. UU.* / *EEUU* / *USA*, *Holanda*, *Gran Bretaña* (e
    *Inglaterra*, que no es Estado soberano: aceptarlo sería una decisión de contenido).

---

## 5. Impacto de cambiar el total (lo importante para decidir)

### 5.1 Qué hay que tocar sí o sí

| Sitio | Qué pasa si no se toca |
|---|---|
| `countries.ts:1001-1003` (assert) | El módulo lanza al importarse → la isla no monta (y probablemente el build falle). Es una alarma intencionada: se actualiza en el mismo cambio |
| `Configuration.tsx:80` y `:157` | "X de 196" y el % con el total equivocado |
| `RegionSelector.tsx:100` | La tarjeta "Todo el mundo" dice 196 |
| `Layout.astro:13` | Descripción SEO equivocada |
| Comentarios (`types/country.ts:63`, etc.) y `PROJECT_CONTEXT.md` | Documentación desfasada |

Recomendación de paso: sustituir los tres `196` de la UI por `countries.length`
(o una constante derivada), para que el próximo cambio sea de una sola línea.

**Ya se adaptan solos** (derivan del catálogo): `REGION_COUNTRY_COUNTS`
(`region-stats.ts`), los contadores por continente de `RegionSelector` y del
tablero, `calculateWorldAverage` (D039), y los objetivos y descripciones de los
logros por continente y de "La vuelta al mundo".

### 5.2 Mejores tiempos y ranking público

- `regionBestTimes.world` (Banderas) y `countriesGame.regionBestTimes.world`
  (Países) dejan de ser comparables: con 197 las marcas viejas tienen **una bandera
  (o un nombre) de ventaja**; con 195, **desventaja**. Como orden de magnitud, al
  ritmo del umbral de "Vuelta rápida" (15 min / 196 ≈ 4,6 s por bandera) son unos
  **4-5 s**; en un ranking con centésimas decide puestos.
- **También Asia (A) o Europa (C)**, no solo el mundo: las marcas personales por
  continente (`regionBestTimes.asia` / `.europe`, en los dos juegos) cambian de
  composición. No son públicas, pero la tarjeta muestra la marca vieja como "mejor
  tiempo" y con 197 cuesta más batirla.
- `leaderboard_entries`: los scopes afectados son `world` y `countries:world`
  (los únicos que existen, `LeaderboardModal.tsx:74`).
- **Borrar filas no resetea nada.** `GameEffects.tsx:222-248` sube
  `regionBestTimes.world` en **cada hidratación autenticada**: `pushedWorldBestRef`
  arranca en `undefined`, así que en cada carga se reenvía la marca local. Y
  `mergeRegionBestTimes` (`learning-storage.ts:780`) se queda con el **mínimo**
  entre remoto y local de cualquier dispositivo. Una marca de 196 vuelve sola al
  ranking y a la nube desde cualquier `localStorage` o cliente viejo.
- **Si se quiere un ranking limpio**, la única vía robusta es **versionar la clave**:
  una clave local nueva (p. ej. `"world@197"` dentro del mismo jsonb) + un scope
  nuevo (`"world@197"`, `"countries:world@197"`). Verificado que es compatible con
  clientes viejos: `normalizeLearningData` (`?? {}`) y `mergeRegionBestTimes`
  (spread del remoto + `Object.entries` del local) **conservan claves
  desconocidas**. El scope es `text` con PK `(user_id, scope)` → sin migración. Los
  clientes viejos seguirían escribiendo en `world`, que pasaría a ser la
  "temporada 1" congelada.
- Si **no** se versiona: coste cero, pero hay que aceptar ~1 elemento de diferencia
  y avisarlo en el modal ("marcas anteriores al DD/MM: 196 países").

### 5.3 "X de 196 aprendidos" y `calculateLearningProgress`

- Con A: quien tenía 196/196 pasa a **196/197 = 99 %**. Es honesto, pero se ve
  como una "pérdida". El % se recalcula solo si el total sale de `countries.length`.
- **Problema real:** `countLearnedCountries` (`learning-storage.ts:1118`) cuenta
  **todas** las claves de `countryHistory`, sin cruzarlas con el catálogo. Así:
  - **C (quitar Kosovo):** `xk` sigue guardado → quien había aprendido los 196
    ve **"196/195 · 101 %"**; y cualquiera con Kosovo aprendido tiene el numerador
    inflado en +1.
  - **A en un cliente viejo** que reciba `tw`: "197/196 · 101 %".
  - La barra de `UserSummary.tsx:92` no limita el ancho (`width: 101%`); el
    `overflow-hidden` del padre lo tapa, pero el texto no.
- Arreglo (unidad aparte): contar solo los códigos que existen en el catálogo.

### 5.4 Logros (`src/utils/achievements.ts`)

| Logro | Depende del total | Efecto |
|---|---|---|
| `vuelta_al_mundo` (l. 255) | **Sí**: objetivo y texto = `countries.length` | A: pide 197. C: pide 195 → **con `xk` huérfano, `countLearned` (l. 93) lo cuenta y el logro puede desbloquearse con 194 países reales + Kosovo** |
| `dueno_de_europa`, `mapa_mental_europa` | Sí (Europa 45) | C: pide 44. `countLearnedInRegions` **sí** cruza con el catálogo → correcto. Quien solo tenía pendiente Kosovo lo desbloquea (desbloqueo nuevo, válido) |
| `travesia_de_asia` | Sí (Asia 48) | A: pide 49 |
| `primero_los_paises` | Sí (por continente) | A/C: el continente cambiado exige el nuevo total |
| `america_completa`, `alma_de_africa`, `oceania_y_sus_islas` | Sí, pero ninguna opción los cambia | — (B sí, si algún territorio cae ahí) |
| `vuelta_rapida` (l. 311), `mundo_de_memoria` (l. 504) | Composición del mundo | Umbral fijo sobre una ruta con ±1 país; leen `regionBestTimes.world` |
| Umbrales fijos (1/20/50/100/150 banderas, rachas, precisión, `coleccionista`…) | No | — |

**¿Puede alguno des-desbloquearse? No.** D017 se sostiene a nivel de datos:
`getNewlyUnlocked` se salta los ids ya sellados, `useAchievements.ts:68` usa
`unlock !== undefined || …` y `mergeAchievements` es unión. Matices:

- Cambiar el catálogo rompe la **monotonía de `evaluate` entre versiones** (algo
  que se cumplía con 196 deja de cumplirse con 197). Lo cubre el sellado; el punto
  fijo sigue terminando porque dentro de una versión el conjunto solo crece.
- Cosmético: un "Travesía de Asia" sellado con 48 pasará a decir "Aprende los 49
  países de Asia" (la descripción es dinámica). No hay barra en los desbloqueados.
- **El riesgo real es el contrario: desbloqueos falsos permanentes.** En C, si se
  despliega sin filtrar huérfanos, "La vuelta al mundo" puede sellarse en falso, y
  por D017 **no hay vuelta atrás** (la unión lo propaga a todos los dispositivos).
  Por eso el filtrado tiene que llegar **antes** que el cambio de catálogo.

### 5.5 Progreso guardado de un país eliminado (C: Kosovo)

- No se borra nada: `xk` queda en `countryHistory`,
  `countriesGame.countryHistory` y `lastPracticeByCountry`, en `localStorage` y en
  Supabase, indefinidamente (`migrateCountryHistory`, l. 92, no filtra).
- A la vez, eso es una **ventaja**: si Kosovo volviera, el progreso reaparece intacto.
- Efectos si no se filtra:
  1. Conteo e índice inflados (§5.3) y desbloqueo falso posible (§5.4).
  2. `getDueCountries` (l. 1262) incluye `xk` → "Práctica diaria (N)" cuenta uno de
     más (`Configuration.tsx:83`) y, **cuando `xk` llegue a la cabeza de la cola,
     pantalla en blanco** (§5.8). Kosovo sale en cualquier sesión de Europa o de
     "Todo el mundo", así que **casi todo usuario activo lo tiene programado en el
     SRS: no sería un caso raro, sería seguro**.
  3. `lastConfiguration.scope.countryCodes` con `xk`: `resolveScopeCountries` lo
     ignora, pero `getScopeLabel`/`isEmptyScope` (`practice-scope.ts:61,69`)
     cuentan el código crudo → "1 país personalizado" fantasma. Si la selección era
     **solo** Kosovo: en práctica sale el aviso engañoso "Ya practicaste … hoy"; en
     competitivo de Banderas, `Session` monta con 0 países → pantalla en blanco.
     (Rush de Países con 0 países: no verificado en detalle.)
- `public/flags/xk.svg`: conviene **conservarlo** aunque salga del catálogo (4 KB),
  porque los clientes viejos lo seguirán pidiendo.

### 5.6 ¿Migración de datos en Supabase?

**No hace falta en ninguna de las tres opciones.**

- Todo el progreso está en jsonb indexado por código de país o por región → un
  código nuevo es una clave más, y uno eliminado es una clave que sobra.
- `leaderboard_entries.scope` es `text` con PK `(user_id, scope)` → un scope
  versionado no necesita DDL.
- Limpieza **opcional** en C (quitar `xk` con el operador jsonb `-`): **no se
  recomienda**. Un cliente viejo o cualquier `localStorage` lo volvería a subir
  (push de fila entera), y se pierde la reversibilidad. Mejor filtrar al leer.
- Borrar filas del ranking para "resetear": inútil (§5.2).

### 5.7 El cliente viejo cacheado por el service worker

Cómo funciona hoy `public/sw.js`:

- Navegación (HTML) **network-first**; assets **cache-first**; los bundles de
  Astro llevan hash. Al recargar con red siempre llega el HTML nuevo, que apunta a
  bundles nuevos.
- Por tanto, el cliente viejo solo sobrevive en: **pestañas o PWA abiertas desde
  antes del deploy** (muy típico en móvil, donde la PWA se reanuda sin recargar) y
  **arranques sin conexión**.
- **Un cambio de catálogo no cambia `sw.js`** → el navegador no detecta un SW
  nuevo → **no aparece el aviso "Actualizar"** (`UpdateAvailableSnackbar`). Para
  empujar a esas pestañas a actualizarse hay que subir `CACHE_NAME`
  (`banderas-cache-v2` → `v3`) en el mismo PR. Contrapartida: se borra la caché
  vieja y las banderas se vuelven a descargar según se usen (hasta ~3,1 MB, poco a poco).

Qué haría el cliente viejo en cada opción:

| | A / B (códigos nuevos, p. ej. `tw`) | C (`xk` eliminado) |
|---|---|---|
| Pérdida de datos por códigos desconocidos | **No**: normaliza, fusiona y sube `tw` sin tocarlo (verificado en `migrateCountryHistory`, `mergeGameProgress`, `pushLearningData`) | No |
| Conteos | Puede mostrar "197/196 · 101 %" | Sigue viendo 196, correcto para él |
| Práctica diaria | Si `tw` llega a la cabeza de la cola → **pantalla en blanco** hasta recargar (al recargar con red carga la versión nueva y se arregla) | Sigue practicando Kosovo; sube `xk`; inofensivo si el cliente nuevo filtra |
| Rush de "Todo el mundo" | Registra marcas de 196 en `world` → **contamina el ranking** salvo que se versione la clave | Registra marcas de 196 en `world` → ídem |
| Logros | Desbloqueo falso posible de "La vuelta al mundo" (195 reales + `tw`), muy improbable | Sin efecto nuevo |

¿Cuándo tiene un cliente viejo datos con `tw`? Casi solo cuando arranca sin
conexión (HTML viejo en caché), luego recupera la red y `syncOnLogin` trae la fila
remota ya escrita por un dispositivo actualizado. Es poco probable, pero la
consecuencia (pantalla sin salida) es grave. La única mitigación posible: **que los
clientes que estén en circulación cuando llegue Taiwán ya traigan el filtro** → dos
deploys (§6).

Riesgo **preexistente**, no nuevo: una pestaña vieja abierta en paralelo sube la
fila entera desde su memoria y puede pisar `country_history` (last-writer-wins).
Le pasa hoy a cualquier país; el cambio de catálogo no lo empeora.

### 5.8 Bug latente (se reporta, no se arregla aquí)

**Síntoma:** pantalla en blanco sin cabecera ni botón Salir.

- `DailyPractice.tsx:101` — `if (!currentCode || !currentCountry) return null;`
  cuando `countries.find` no encuentra el código de la cabeza de la cola.
- `Session.tsx:213` — `if (!activeGame || !currentCountry) return null;`
  (partida con 0 países, o cola con un código desconocido).
- Orígenes: `getDueCountries` (`learning-storage.ts:1262`) y `startDailyPractice`
  (`useGame.ts:371`) no filtran por catálogo; `startGame` en competitivo no
  comprueba que el alcance resuelto tenga países; `isEmptyScope` cuenta códigos crudos.
- Relacionados: `countLearnedCountries` (l. 1118) y `countLearned`
  (`achievements.ts:93`) cuentan claves no presentes en el catálogo.

Hoy es **inalcanzable**: los códigos solo salen del catálogo y este no ha cambiado
desde el primer commit. Es **precondición** de cualquier cambio de catálogo
(obligatoria para C; muy recomendable para A/B). Propuesta: una unidad propia,
`fix/codigos-fuera-de-catalogo`, invisible para el usuario.

---

## 6. Recomendación

Punto de partida: **quedarse en 196 es defendible** — criterio "reconocido por la
mayoría de miembros de la ONU", coste cero. Las tres opciones que baraja el dueño,
con su coste real:

| | **A — Añadir Taiwán (197)** | **B — 197 + territorios de facto aparte** | **C — Bajar a 195 (ONU + observadores)** |
|---|---|---|---|
| Criterio resultante | "ONU + observadores + los dos Estados de reconocimiento parcial con control pleno y bandera conocida (Kosovo, Taiwán)" | "Todo lo que tiene gobierno propio", con un grupo aparte | "ONU + observadores". El más "oficial"; con él M49 casa al 100 % (salvo México) |
| Contenido | 1 entrada + `tw.svg` (flagcdn, 397 B) | + hasta 8 entidades; **5 banderas sin flagcdn** (fuente y licencia por archivo) y nombres a decidir | Quitar 1 entrada (conservar `xk.svg`) |
| Código | Assert + 3 hardcodes → `countries.length` + SEO | Todo lo de A + **modelo nuevo** (9.ª región o campo `status` en `Country`) que toca `REGIONS`, `REGION_LABELS`, `REGION_ORDER`, `calculateWorldAverage` (hoy exige los 8 continentes), el grid de `RegionSelector`, el tablero, los logros por continente y la definición de "Todo el mundo" | Assert + hardcodes + **filtrado obligatorio** de huérfanos antes del deploy |
| Decisiones de UX / contenido | Ninguna nueva (salvo el ranking) | Varias (¿entran en "Todo el mundo"? ¿en logros? ¿en ranking? ¿cómo se llama el grupo?) → pedir 3 opciones al dueño en cada una | Ninguna, salvo cómo comunicar que Kosovo ya no está |
| Ranking | +1 elemento: aceptar y avisar, o versionar | Depende de si los territorios entran en "Todo el mundo" | −1 elemento: las marcas nuevas salen ventajosas; mismo dilema |
| Logros | Asia 49 y "La vuelta al mundo" 197; nada se des-desbloquea | Según el diseño | **Desbloqueo falso permanente** de "La vuelta al mundo" si no se filtra antes |
| Datos de usuarios | Nada que limpiar | Nada que limpiar | `xk` huérfano en casi todos los usuarios activos; sin filtro, **pantalla en blanco segura** en la práctica diaria |
| Supabase | Sin migración | Sin migración | Sin migración (limpieza opcional desaconsejada) |
| Riesgo con clientes viejos | Bajo (pantalla en blanco solo en el borde sin-conexión → con-conexión) | Igual que A, multiplicado por N códigos | Bajo para el viejo; **alto para el nuevo** sin filtro |
| Sensibilidad política | Media (la RPC lo objeta; para un público hispanohablante, poco probable) | **Alta**: Abjasia, Osetia del Sur y Chipre del Norte son territorio ocupado para casi toda la comunidad internacional; mezclarlas con Cook/Niue es discutible | Media (Kosovo lo reconocen ~110 miembros ONU; quitarlo quita contenido que la gente ya aprendió) |
| Reversibilidad | Alta | Baja (modelo y copy nuevos) | Alta (el progreso no se borra) |
| **Coste total estimado** | **Bajo**: 2 PR pequeños | **Alto**: una unidad de diseño + varios PR + búsqueda de licencias | **Medio**: el mismo PR defensivo, pero obligatorio, y comunicar la retirada |

### Opción recomendada: **A (197, con Taiwán)**, en dos pasos

1. **PR 1 — defensivo, sin cambio visible:** filtrar códigos fuera de catálogo en
   `countLearnedCountries`, `countLearned`, `getDueCountries` / práctica diaria,
   `isEmptyScope` y `getScopeLabel`; `Session`/`DailyPractice` con salida digna en
   vez de `return null`; los 196 de la UI → `countries.length`. Subir
   `CACHE_NAME` para que las pestañas abiertas reciban el aviso "Actualizar".
   Desplegar y dejar pasar unos días.
2. **PR 2 — contenido:** entrada `tw` "Taiwán" en `asia`, `public/flags/tw.svg`
   (flagcdn), assert 197, SEO y documentación. Registrar la decisión (D040) con el
   criterio escrito, incluida la excepción de México (§3).
3. **Ranking:** decidir con la consulta de §7. Si `leaderboard_entries` tiene
   pocas filas y casi todas propias o de prueba → **no versionar** y avisar en el
   modal. Si hay usuarios reales compitiendo → **versionar la clave** (§5.2): una
   "temporada 2" con `world@197` / `countries:world@197`.

Por qué A y no las otras:

- Frente a **C**: C "limpia" el criterio pero es la que más rompe (huérfanos en
  casi todos los usuarios, desbloqueos falsos irreversibles si se despliega mal, y
  quita contenido ya aprendido). A no deja huérfanos: solo añade.
- Frente a **B**: B es otro producto (un modo "territorios", que además podría
  incluir Groenlandia, Puerto Rico, Hong Kong…), con decisiones de UX y contenido
  sin resolver y el mayor riesgo político. Si interesa, mejor como feature aparte
  que como cambio del total.
- Frente a **quedarse en 196**: Taiwán es de las banderas que un usuario más
  espera encontrar. Si el dueño prefiere cero riesgo para el ranking, quedarse en
  196 es igual de defendible — **pero el PR 1 vale igual**: blinda el siguiente
  cambio de catálogo, sea cual sea.

---

## 7. Consulta de diagnóstico (solo lectura — la corre el dueño, no un agente)

Para saber cuánta gente se vería afectada antes de decidir. SQL Editor de Supabase:

```sql
-- Cuántos usuarios tocaría cada opción
select
  count(*)                                                                as filas,
  count(*) filter (where region_best_times ? 'world')                     as banderas_marca_mundo,
  count(*) filter (where (countries_game -> 'regionBestTimes') ? 'world') as paises_marca_mundo,
  count(*) filter (where region_best_times ? 'asia')                      as banderas_marca_asia,
  count(*) filter (where region_best_times ? 'europe')                    as banderas_marca_europa,
  count(*) filter (where country_history ? 'xk')                          as banderas_con_kosovo,
  count(*) filter (where (countries_game -> 'countryHistory') ? 'xk')     as paises_con_kosovo,
  count(*) filter (where achievements ? 'vuelta_al_mundo')                as logro_vuelta_al_mundo,
  count(*) filter (where achievements ? 'travesia_de_asia')               as logro_travesia_asia,
  count(*) filter (where achievements ? 'dueno_de_europa')                as logro_dueno_europa
from public.user_learning_data;

-- Tamaño real del ranking público
select scope, count(*) as entradas, min(best_time_ms) as mejor_ms
from public.leaderboard_entries
group by scope;
```

(Invitados sin cuenta: su progreso vive solo en `localStorage` y no aparece aquí.)

---

## 8. Vistos de paso (no relacionados con el catálogo; no se tocaron)

- `CLAUDE.md` dice que `bunx biome check ./src` "en CI no bloquea", pero
  `.github/workflows/ci.yml` lo ejecuta como paso normal (sin
  `continue-on-error`) desde `d90d2a4` ("lo hace bloqueante en CI"). Documentación
  desfasada.
- `plans/modo-paises.md` (D031) cita "Níger ⊂ Nigeria (con y sin tilde)"; desde que
  D032 exige tildes en el rush, esa colisión solo existe en modo "fácil"
  (práctica). Inofensivo.

---

## 9. Fuentes (consultadas el 2026-09-21)

Descargadas y procesadas con scripts en el scratchpad de la sesión (no en el repo):

- ONU, Estados miembros: <https://www.un.org/en/about-us/member-states> (193).
- ONU, esquema M49: <https://unstats.un.org/unsd/methodology/m49/overview/> (tabla EN).
- flagcdn, índice de códigos: <https://flagcdn.com/es/codes.json>,
  <https://flagcdn.com/en/codes.json>; SVG comprobados con petición HTTP
  (`tw`, `eh`, `ck`, `nu`, `xk` → 200; `so-sl`, `xa`, `xn`, `xs`, `xt` → 404).
- Unicode CLDR vía `Intl.DisplayNames` (Bun 1.3.14, ICU 73.2), locales `es` y `es-419`.
- Wikipedia (es), wikitext de «Anexo:Nombres de países en español» (columnas ONU,
  DPD, *Ortografía* 2010): <https://es.wikipedia.org/wiki/Anexo:Nombres_de_pa%C3%ADses_en_espa%C3%B1ol>.
- RAE, lista de países: <https://www.rae.es/buen-uso-espa%C3%B1ol/lista-de-pa%C3%ADses-y-capitales-con-sus-gentilicios>
  — **no accesible** (403 / verificación de Cloudflare; no se forzó).
- Fundéu (vía resultados de búsqueda): Malí/Mali, Bangladés, Guinea-Bisáu, Chequia,
  Esuatini — p. ej. <https://www.cope.es/actualidad/cultura/noticias/fundeu-bbva-toponimos-gentilicios-paises-africanos-20190531_426785>.
- Taiwán: <https://en.mofa.gov.tw/AlliesIndex.aspx?n=1294&sms=1007>,
  <https://factually.co/fact-checks/politics/countries-recognizing-taiwan-2026-formal-diplomatic-relations-ecc179>,
  <https://en.wikipedia.org/wiki/Political_status_of_Taiwan>.
- Kosovo: <https://en.wikipedia.org/wiki/International_recognition_of_Kosovo> (≥110 a 19-12-2025; Kosovo dice 120, Serbia 84).
- RASD: <https://en.wikipedia.org/wiki/International_recognition_of_the_Sahrawi_Arab_Democratic_Republic>.
- Palestina: <https://en.wikipedia.org/wiki/International_recognition_of_Palestine> (157, sept-2025).
- Somalilandia: <https://www.cnn.com/2025/12/26/africa/israel-recognizes-somaliland-latam-intl>,
  <https://www.madamasr.com/en/2026/08/10/feature/politics/how-guinea-bissaus-planned-recognition-of-somaliland-fell-apart/>.
- Abjasia / Osetia del Sur: <https://en.wikipedia.org/wiki/International_recognition_of_Abkhazia_and_South_Ossetia>,
  <https://en.wikipedia.org/wiki/Abkhazia%E2%80%93Nauru_relations>.
- Chipre del Norte, Transnistria, Islas Cook, Niue: artículos homónimos de en.wikipedia.org.

Código leído (sin modificar): `src/data/countries.ts`, `src/types/country.ts`,
`src/utils/{achievements,learning-storage,region-stats,practice-scope,prepare-countries,normalize-answer,cloud-storage}.ts`,
`src/hooks/{useGame,useAchievements,usePracticeQueue}.ts`,
`src/components/app/GameEffects.tsx`,
`src/components/game/configuration/{Configuration,RegionSelector,UserSummary,AchievementsModal,LeaderboardModal}.tsx`,
`src/components/game/session/{Session,DailyPractice}.tsx`,
`src/components/game/session/countries/CountriesRush.tsx`, `public/sw.js`,
`supabase/{leaderboard,practice-sync}.sql` (locales).

---

## Anexo A — Verificación país a país

Los 196 del catálogo con su nombre oficial en la lista de la ONU. Los tres sin
nombre ONU son los extra.

**Norteamérica (3; ONU 3)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `ca` | Canadá | Canada |
| `us` | Estados Unidos | United States of America |
| `mx` | México | Mexico |

**Centroamérica (7; ONU 7)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `bz` | Belice | Belize |
| `cr` | Costa Rica | Costa Rica |
| `sv` | El Salvador | El Salvador |
| `gt` | Guatemala | Guatemala |
| `hn` | Honduras | Honduras |
| `ni` | Nicaragua | Nicaragua |
| `pa` | Panamá | Panama |

**Caribe (13; ONU 13)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `ag` | Antigua y Barbuda | Antigua and Barbuda |
| `bs` | Bahamas | Bahamas (The) |
| `bb` | Barbados | Barbados |
| `cu` | Cuba | Cuba |
| `dm` | Dominica | Dominica |
| `gd` | Granada | Grenada |
| `ht` | Haití | Haiti |
| `jm` | Jamaica | Jamaica |
| `do` | República Dominicana | Dominican Republic |
| `kn` | San Cristóbal y Nieves | Saint Kitts and Nevis |
| `vc` | San Vicente y las Granadinas | Saint Vincent and the Grenadines |
| `lc` | Santa Lucía | Saint Lucia |
| `tt` | Trinidad y Tobago | Trinidad and Tobago |

**Sudamérica (12; ONU 12)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `ar` | Argentina | Argentina |
| `bo` | Bolivia | Bolivia (Plurinational State of) |
| `br` | Brasil | Brazil |
| `cl` | Chile | Chile |
| `co` | Colombia | Colombia |
| `ec` | Ecuador | Ecuador |
| `gy` | Guyana | Guyana |
| `py` | Paraguay | Paraguay |
| `pe` | Perú | Peru |
| `sr` | Surinam | Suriname |
| `uy` | Uruguay | Uruguay |
| `ve` | Venezuela | Venezuela, Bolivarian Republic of |

**Europa (45; ONU 43, no-ONU 2)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `al` | Albania | Albania |
| `de` | Alemania | Germany |
| `ad` | Andorra | Andorra |
| `at` | Austria | Austria |
| `be` | Bélgica | Belgium |
| `by` | Bielorrusia | Belarus |
| `ba` | Bosnia y Herzegovina | Bosnia and Herzegovina |
| `bg` | Bulgaria | Bulgaria |
| `va` | Ciudad del Vaticano | — (Santa Sede, observador) |
| `hr` | Croacia | Croatia |
| `dk` | Dinamarca | Denmark |
| `sk` | Eslovaquia | Slovakia |
| `si` | Eslovenia | Slovenia |
| `es` | España | Spain |
| `ee` | Estonia | Estonia |
| `fi` | Finlandia | Finland |
| `fr` | Francia | France |
| `gr` | Grecia | Greece |
| `hu` | Hungría | Hungary |
| `ie` | Irlanda | Ireland |
| `is` | Islandia | Iceland |
| `it` | Italia | Italy |
| `xk` | Kosovo | — (no es miembro ni observador) |
| `lv` | Letonia | Latvia |
| `li` | Liechtenstein | Liechtenstein |
| `lt` | Lituania | Lithuania |
| `lu` | Luxemburgo | Luxembourg |
| `mk` | Macedonia del Norte | North Macedonia |
| `mt` | Malta | Malta |
| `md` | Moldavia | Republic of Moldova |
| `mc` | Mónaco | Monaco |
| `me` | Montenegro | Montenegro |
| `no` | Noruega | Norway |
| `nl` | Países Bajos | Netherlands (Kingdom of the) |
| `pl` | Polonia | Poland |
| `pt` | Portugal | Portugal |
| `gb` | Reino Unido | United Kingdom of Great Britain and Northern Ireland |
| `cz` | República Checa | Czechia |
| `ro` | Rumanía | Romania |
| `ru` | Rusia | Russian Federation |
| `sm` | San Marino | San Marino |
| `rs` | Serbia | Serbia |
| `se` | Suecia | Sweden |
| `ch` | Suiza | Switzerland |
| `ua` | Ucrania | Ukraine |

**Oceanía (14; ONU 14)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `au` | Australia | Australia |
| `fj` | Fiyi | Fiji |
| `mh` | Islas Marshall | Marshall Islands |
| `sb` | Islas Salomón | Solomon Islands |
| `ki` | Kiribati | Kiribati |
| `fm` | Micronesia | Micronesia (Federated States of) |
| `nr` | Nauru | Naoero |
| `nz` | Nueva Zelanda | New Zealand |
| `pw` | Palaos | Palau |
| `pg` | Papúa Nueva Guinea | Papua New Guinea |
| `ws` | Samoa | Samoa |
| `to` | Tonga | Tonga |
| `tv` | Tuvalu | Tuvalu |
| `vu` | Vanuatu | Vanuatu |

**Asia (48; ONU 47, no-ONU 1)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `af` | Afganistán | Afghanistan |
| `sa` | Arabia Saudita | Saudi Arabia |
| `am` | Armenia | Armenia |
| `az` | Azerbaiyán | Azerbaijan |
| `bh` | Baréin | Bahrain |
| `bd` | Bangladés | Bangladesh |
| `bn` | Brunéi | Brunei Darussalam |
| `bt` | Bután | Bhutan |
| `kh` | Camboya | Cambodia |
| `qa` | Catar | Qatar |
| `cn` | China | China (the People's Republic of) |
| `cy` | Chipre | Cyprus |
| `kp` | Corea del Norte | Democratic People's Republic of Korea |
| `kr` | Corea del Sur | Republic of Korea |
| `ae` | Emiratos Árabes Unidos | United Arab Emirates |
| `ph` | Filipinas | Philippines |
| `ge` | Georgia | Georgia |
| `in` | India | India |
| `id` | Indonesia | Indonesia |
| `iq` | Irak | Iraq |
| `ir` | Irán | Iran (Islamic Republic of) |
| `il` | Israel | Israel |
| `jp` | Japón | Japan |
| `jo` | Jordania | Jordan |
| `kz` | Kazajistán | Kazakhstan |
| `kg` | Kirguistán | Kyrgyzstan |
| `kw` | Kuwait | Kuwait |
| `la` | Laos | Lao People’s Democratic Republic |
| `lb` | Líbano | Lebanon |
| `my` | Malasia | Malaysia |
| `mv` | Maldivas | Maldives |
| `mn` | Mongolia | Mongolia |
| `mm` | Myanmar | Myanmar |
| `np` | Nepal | Nepal |
| `om` | Omán | Oman |
| `pk` | Pakistán | Pakistan |
| `ps` | Palestina | — (Estado de Palestina, observador) |
| `sg` | Singapur | Singapore |
| `sy` | Siria | Syrian Arab Republic |
| `lk` | Sri Lanka | Sri Lanka |
| `th` | Tailandia | Thailand |
| `tj` | Tayikistán | Tajikistan |
| `tl` | Timor Oriental | Timor-Leste |
| `tm` | Turkmenistán | Turkmenistan |
| `tr` | Turquía | Türkiye |
| `uz` | Uzbekistán | Uzbekistan |
| `vn` | Vietnam | Viet Nam |
| `ye` | Yemen | Yemen |

**África (54; ONU 54)**

| Código | Nombre en la app | Nombre oficial ONU (inglés) |
|---|---|---|
| `ao` | Angola | Angola |
| `dz` | Argelia | Algeria |
| `bj` | Benín | Benin |
| `bw` | Botsuana | Botswana |
| `bf` | Burkina Faso | Burkina Faso |
| `bi` | Burundi | Burundi |
| `cv` | Cabo Verde | Cabo Verde |
| `cm` | Camerún | Cameroon |
| `td` | Chad | Chad |
| `km` | Comoras | Comoros |
| `ci` | Costa de Marfil | Côte D'Ivoire |
| `eg` | Egipto | Egypt |
| `er` | Eritrea | Eritrea |
| `sz` | Esuatini | Eswatini |
| `et` | Etiopía | Ethiopia |
| `ga` | Gabón | Gabon |
| `gm` | Gambia | Gambia (Republic of The) |
| `gh` | Ghana | Ghana |
| `gn` | Guinea | Guinea |
| `gw` | Guinea-Bisáu | Guinea Bissau |
| `gq` | Guinea Ecuatorial | Equatorial Guinea |
| `ke` | Kenia | Kenya |
| `ls` | Lesoto | Lesotho |
| `lr` | Liberia | Liberia |
| `ly` | Libia | Libya |
| `mg` | Madagascar | Madagascar |
| `mw` | Malaui | Malawi |
| `ml` | Malí | Mali |
| `ma` | Marruecos | Morocco |
| `mu` | Mauricio | Mauritius |
| `mr` | Mauritania | Mauritania |
| `mz` | Mozambique | Mozambique |
| `na` | Namibia | Namibia |
| `ne` | Níger | Niger |
| `ng` | Nigeria | Nigeria |
| `cf` | República Centroafricana | Central African Republic |
| `cg` | República del Congo | Congo |
| `cd` | República Democrática del Congo | Democratic Republic of the Congo |
| `rw` | Ruanda | Rwanda |
| `st` | Santo Tomé y Príncipe | Sao Tome and Principe |
| `sn` | Senegal | Senegal |
| `sc` | Seychelles | Seychelles |
| `sl` | Sierra Leona | Sierra Leone |
| `so` | Somalia | Somalia |
| `za` | Sudáfrica | South Africa |
| `sd` | Sudán | Sudan |
| `ss` | Sudán del Sur | South Sudan |
| `tz` | Tanzania | United Republic of Tanzania |
| `tg` | Togo | Togo |
| `tn` | Túnez | Tunisia |
| `ug` | Uganda | Uganda |
| `dj` | Yibuti | Djibouti |
| `zm` | Zambia | Zambia |
| `zw` | Zimbabue | Zimbabwe |
