# QA de los arreglos de la QA final — 2026-10-19


**Entorno:** slot wt1 en el puerto 4301 y base local (`qa:local`: Supabase en Docker, `db reset` con migraciones y seed). Ninguna petición fue a `*.supabase.co`.
- ErrorBoundary: en `main` @ b766a29, antes de los arreglos.
- Lo demás: en `qa/integracion-arreglos` (rama local, sin subir), que une #94, #95 (con su segundo commit), #96 y #97.

**Roles:** invitado y usuario (`EMAIL_TEST`).
**Herramienta:** Playwright con `node` (Chromium 1243, que hubo que reinstalar con `node node_modules/@playwright/test/cli.js install chromium`). Los scripts están en `shots-arreglos/scripts/` y las capturas en `shots-arreglos/`.
**Resultado:** 0 críticos · 0 altos · 1 medio arreglado durante la QA (#100, abierto) · 2 previos fuera de la tanda (1 medio, 1 bajo).

## PRs
| PR | Qué | Estado |
|---|---|---|
| #94 | Foco de "Todos"/"Ninguno" y foco al abandonar (Alto + Medio de la QA final) | mergeado |
| #95 | Doble clic en los diálogos (Medio) | mergeado **sin** su segundo commit → #100 |
| #96 | `profile` validado al normalizar (Bajo), con test | mergeado |
| #97 | Campo de respuesta de texto libre en el móvil | mergeado |
| #100 | Seguimiento de #95: doble clic con movimiento reducido | **abierto**: falta revisarlo y mergearlo |

## Hallazgos

### [Medio] Con movimiento reducido el doble clic seguía llegando a lo de debajo (arreglado en #100)
- **Unidad:** #95 (primera versión, la que está en `main`)
- **Pasos:** `reducedMotion: 'reduce'` → "Aprender por lotes" → doble clic en "Empezar".
- **Ocurría:** se creaba el lote y el segundo clic abría la sesión del lote ("Seguir aprendiendo" ocupa ese sitio); el foco acababa en `#answer-input`. Con `no-preference` no pasaba, porque la animación de salida, de 100 ms, todavía tapaba con el fondo del diálogo.
- **Causa:** `usePress` de React Aria empieza la pulsación en `pointerdown` y, si el `click` no le llega, dispara él mismo `target.click()` a los 80 ms, con `detail = 0`. Descartar solo los clics con `detail > 1` no bastaba.
- **Arreglo (#100):** también se descarta el `pointerdown`/`pointerup` que llega en menos de 800 ms y a menos de 16 px del clic que cerró el diálogo.
- **Verificado** con la versión de #100, tanto en `reduce` como en `no-preference`:
  - doble clic en "Empezar": el panel del lote se crea, no se abre ninguna partida y el foco va a `h2#learning-path-panel-title`;
  - doble clic en "Sí, abandonar" (lotes): las casillas siguen igual (`south-america`) y el foco va a `#learning-path-start`;
  - doble clic en "Sí, abandonar" (partida): las casillas siguen igual y el foco va a `h1#configuration-title`;
  - un clic suelto en otro sitio 150 ms después de cerrar funciona;
  - un doble clic sin diálogo sigue contando como dos clics.

### [Medio, previo] Contraste de "encontrados" en Resultados del rush de Países, en tema claro
- Fuera de la tanda: no lo toca ningún PR.
- **Pasos:** rush de Países → Rendirme → Ver resultados, en tema claro.
- **Ocurre:** según axe, `color-contrast` en `<span class="mt-1 text-tiny font-bold">encontrados</span>`: 3,96:1 (`#6d5ef0` sobre `#ecebfe`, 11,2 px). En oscuro pasa.
- **Dónde mirar:** la cifra y la etiqueta de "encontrados" de los resultados del rush. Es una decisión de token (accent sobre accent-soft en texto pequeño), así que se escala, no se parchea.

### [Bajo, previo] `label-content-name-mismatch` según axe
- Fuera de la tanda.
- **Dónde:** los botones de continente del selector de países (`aria-label="Norteamérica, 3 países"`, cuyo texto visible no coincide) y un `.group` de la pantalla de inicio. Aparece igual en claro y en oscuro.
- **Dónde mirar:** los `aria-label` de las filas de continente del `CountryPickerModal` y de `RegionOption`. El nombre accesible tiene que empezar por el texto visible (WCAG 2.5.3).

### Observaciones (no son fallos)
- "Todos"/"Ninguno" con **Espacio**: a +50 ms `document.activeElement` es `<body>` (el botón ya se desmontó y Espacio actúa en el `keyup`). A +300 ms ya está en el botón que queda. Con Intro y con clic está bien desde +50 ms.
- La pantalla del ErrorBoundary deja ver por abajo un trozo de la barra fija de la página (está fuera del árbol de React). No tapa nada.

## Verificado

### A1 — Foco de "Todos"/"Ninguno" (#94)
- Europa sin nada marcado: "Todos" con Intro → foco en "Ninguno: desmarcar los países de Europa" (a +50, +300 y +1500 ms). "Ninguno" con Intro → vuelve a "Todos".
- Con Espacio y con clic, igual. El diálogo sigue abierto (1).
- Europa a medias, con los dos botones visibles: "Todos" → "Ninguno" y "Ninguno" → "Todos".

### A2 — Foco al abandonar (#94)
- Países, Capitales y Banderas, en práctica y en competitivo (6 combinaciones):
  - en el diálogo, el foco empieza en "Continuar practicando";
  - tras "Sí, abandonar" va a `h1#configuration-title`.
- Práctica diaria (con 2 banderas vencidas inyectadas): al abandonar, el foco va a `h1#configuration-title`.
- Regresión de "Volver al inicio": Resultados enfoca `h1#results-title` y "Volver al inicio" lleva a `h1#configuration-title`.
- Rush de Países, "Rendirme":
  - en el diálogo, el foco empieza en "Seguir intentando";
  - doble clic en "Sí, rendirme" → foco en "Ver resultados" y no abre Resultados solo;
  - Resultados → `h1` "Te rendiste".

### A3 — Doble clic (#95 + #100)
Ver el primer hallazgo.

### A4 — `profile` dañado (#96)
- En `main`, `profile.name = 123` → ErrorBoundary.
- Con el arreglo, `{name:123, avatarStyle:{}, avatarSeed:null}` → la app carga, el `h1` es "Aprende los países del mundo" y el resumen dice "Explorador". Sin errores de consola.
- El valor dañado sigue en `localStorage` hasta el próximo guardado: la normalización corrige lo que se lee, no lo que está escrito.
- 5 tests unitarios nuevos y 305 en verde.

### B — Campo de respuesta en móvil (#97)
- **Entorno:** Pixel 7 emulado (táctil, `maxTouchPoints` 1, UA Android).
- En los 6 campos (Banderas, Capitales y Países × práctica y rush) el DOM lleva:
  - `id` `answer-input` / `rush-answer-input`, `name="answer"`, `type="text"`;
  - `inputmode="text"`, `enterkeyhint="done"`;
  - `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"`;
  - `data-1p-ignore`, `data-lpignore`, `data-bwignore`, `data-form-type="other"`;
  - sin scroll horizontal.
- Tras comprobar siguen `readonly` y `aria-disabled="true"`, con el foco en el campo (#86 intacto).
- **No verificado en un dispositivo real.** Que no salgan las sugerencias del teclado ni el autorrellenado de tarjeta solo se puede ver en un Android y un iPhone de verdad: ver "Acciones del dueño".
- Por qué esta combinación (código de Chromium):
  - `autocomplete="off"` literal es lo único que activa `AUTOCOMPLETE_OFF` → `TYPE_TEXT_FLAG_NO_SUGGESTIONS` en el teclado de Android. Un valor inventado apagaría el autofill de Chrome pero no las sugerencias.
  - El autofill clasifica por `name`/`id`/etiqueta (`country|countries`, `país|pais`, `nombre`). Por eso se quitó "country" de los ids.

### C — Lo que faltaba de la QA final
- **Rush de Países completo, con sesión** (Norteamérica: Canadá, Estados Unidos, México):
  - foco inicial en `#rush-answer-input`;
  - Resultados "¡Completado!", 2,92 s, "Esto se guardó para Norteamérica", con el foco en el `h1`;
  - en el ranking de Países › Norteamérica: usuario "#1 Explorador (tú) 2.92"; invitado "#1 Explorador 2.92" con "Inicia sesión para poder aparecer en el ranking";
  - sin errores de consola.
- **ErrorBoundary, "Recargar la página"** (en `main`, a 390 px):
  - con Intro y con clic la página navega y recarga; con los datos aún dañados vuelve el ErrorBoundary, que es lo esperado;
  - claro: título 16,86:1, texto 5,36:1, "Recargar la página" 4,66:1, anillo de foco sólido de 3 px;
  - oscuro: título 16,17:1, texto 7,09:1, "Recargar la página" 6,74:1, anillo de 3 px `rgb(179,166,255)`;
  - sin scroll horizontal (capturas `q1-eb-*.png`).
- **axe** (claro y oscuro), con 0 violaciones en: rush de Países, diálogo de rendirse, práctica de Capitales y diálogo de abandonar. En las demás pantallas solo salen los dos hallazgos previos de arriba.
- **Verificaciones de cada PR** (en la unión de los cuatro; el build, en wt1): `astro check` 0 errores · `biome` limpio · 305 tests · build OK. En #100, lo mismo sobre su propia rama.

## No verificado
| Qué | Por qué |
|---|---|
| Sugerencias del teclado, autocorrector y autorrellenado de tarjeta en un Android y un iPhone reales | No hay dispositivo. La emulación solo comprueba los atributos |
| Doble toque en táctil sobre los diálogos | Solo `dblclick` de ratón. La lógica es la misma (tiempo + distancia del `pointerdown`) |
| Ranking con dos cuentas a la vez | Solo hay una cuenta de prueba en `.env.test.local` |

## Datos creados
Solo en la base local: el progreso de la cuenta de prueba, un lote y una fila del ranking (`countries:north-america`, 2,92 s). El próximo `db reset` lo borra. **Sin borrar:** nada. La rama local `qa/integracion-arreglos` no está subida y se puede borrar.

## Acciones del dueño
1. Revisar y mergear **#100** (sin él, el doble clic con movimiento reducido sigue fallando en `main`).
2. Probar en un móvil real (Chrome Android y Safari iOS) que el campo de respuesta ya no muestra sugerencias ni el autorrellenado de pago.
3. Decidir si el contraste de "encontrados" (3,96:1) y el `label-content-name-mismatch` entran en la próxima tanda.

## Para CURRENT_PHASE.md
Tanda de cierre cerrada:
- #94–#97 mergeados;
- #100 abierto (seguimiento de #95);
- QA de arreglos con 0 críticos y 0 altos.

Pendiente: mergear #100, la prueba en un móvil real del campo de respuesta, y decidir los dos hallazgos previos de a11y (contraste de "encontrados" en Resultados del rush y `label-content-name-mismatch` de los continentes).

## Feedback para el kit (añadir a KIT_FEEDBACK.md)
- fricción · wave-qa / `qa:local` · Chromium de Playwright no estaba instalado aunque `ms-playwright` existía a medias. · Propuesta: que `qa:local` lo compruebe al arrancar (ya registrado en la QA anterior: +1).
- fricción · flujo de PR · el dueño mergeó un PR mientras su segundo commit, nacido de la QA, se estaba subiendo, y el commit se quedó fuera. · Propuesta: cuando la QA se hace con los PRs ya abiertos, marcarlos como borrador (`gh pr ready --undo`) hasta cerrarla, o avisar en el PR de que la QA sigue en curso.
- fricción · worktrees de sesión · un hook impide que una sesión en `.claude/worktrees/…` escriba en el `context/` local de la carpeta principal, pero CLAUDE.md dice que `context/` se actualiza ahí. · Propuesta: que el hook permita `context/` (gitignored) o que CLAUDE.md diga cómo hacerlo desde un worktree.
