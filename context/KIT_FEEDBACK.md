# Kit feedback — World Flags

> Lo que el **web-agent-kit** hizo mal, de más o de menos en este proyecto, para mejorarlo.
> No es el diario del proyecto: es material para el kit. Se busca con `grep`, no se lee por
> defecto. Kit en el que arrancó / al que se actualizó: ver `.kit-version`.

## Cuándo se anota (lo hace el agente, sin que se lo pidan)

| Tipo | Señal |
|---|---|
| **Corrección** | César corrige algo que el agente hizo siguiendo el kit ("no, así no", "otra vez el…", revierte un cambio) |
| **Repetición** | César tuvo que pedir lo mismo por segunda vez, o hacer a mano un paso que el kit podría hacer |
| **Hueco** | El kit no decía qué hacer y el agente tuvo que improvisar o preguntar algo que debería estar resuelto |
| **Fricción** | Un paso del kit costó mucho para lo que aportó (tokens, tiempo, ceremonia), o una instrucción estaba mal |

No se anota: errores del agente que el kit ya prohíbe con claridad (eso es otra cosa), ni
preferencias de este proyecto solo (van a `decisions/`).

**Si ya existe una fila del mismo problema, no se duplica: se suma 1 a "Veces", se
actualiza la fecha y, si estaba marcada como enviada (`→ PR …`), se quita la marca.** Lo que se repite es lo que más vale arreglar.

## Registro

| # | Fecha | Tipo | Veces | Pieza del kit | Qué pasó (1 línea) | Propuesta (1 línea) |
|---|---|---|---|---|---|---|
| 1 | 2026-10-02 | Hueco | 1 | ACTUALIZACIONES.md 3.4.0 + `qa-local.ts` | El script solo mapea variables de Next (`NEXT_PUBLIC_*`) y su comentario habla de `.env.local` de Next; en Astro hubo que añadir `PUBLIC_SUPABASE_*` | Que `MAPEO` traiga también `PUBLIC_*` (Astro/Vite) y el comentario diga "Next o Vite" → informe 2026-10-16 |
| 2 | 2026-10-02 | Hueco | 1 | ACTUALIZACIONES.md 3.4.0 | Da por hecho que las migraciones van al repo; con repo público y SQL privado los slots del pool no las tienen | Opción documentada: `supabase/` gitignored y copiado al slot desde la carpeta principal (como los `.env*`), en `wt.ps1` o en `qa-local.ts` → informe 2026-10-16 |
| 3 | 2026-10-02 | Hueco | 1 | `reference/STATUS-SCREENS.md` (3.3.0) | La implementación solo cubre Next App Router; para una SPA de Astro (404.astro, error boundary en la isla) hubo que traducirla | Sección "Astro / SPA" con 404.astro y ErrorBoundary → informe 2026-10-16 |
| 4 | 2026-10-02 | Fricción | 1 | ACTUALIZACIONES.md 3.3.0/3.4.0 (tope 8 KB de CLAUDE.md) | Cada versión añade párrafos a un CLAUDE.md que ya estaba en 8,1 KB; hubo que recortar reglas propias para que cupiera | Que cada paso diga qué párrafo viejo sustituye, o que el tope admita mover lo propio a `context/` → informe 2026-10-16 |
| 5 | 2026-10-12 | Hueco | 2 | `orchestrate` §4 (reservar números) | El orquestador reservó D186 mirando `context/decisions` de la carpeta principal (rama vieja, sin pull); en `origin/main` ya existía D186 (#67) | Que §4 diga: reservar IDs con `git ls-tree --name-only origin/main context/decisions/` tras `git fetch` → informe 2026-10-16 |
| 6 | 2026-10-12 | Hueco | 2 | `feature-worker` / brief (verificar en navegador) | Astro 7 en el slot escucha solo en `[::1]`, el primer request tarda >30 s y `<astro-dev-toolbar>` intercepta clics de Playwright | Nota de entorno en el brief: timeouts de 90 s, `localhost` (no 127.0.0.1) y quitar el toolbar antes de clicar → informe 2026-10-16 |
| 7 | 2026-10-12 | Fricción | 2 | `feature-worker` (editar archivos) | Editar con Python en modo texto en Windows convierte a CRLF y Biome marca el archivo entero | Indicar Edit o `newline=''` al escribir archivos → informe 2026-10-16 |
| 8 | 2026-10-12 | Hueco | 4 | brief del `feature-worker` (`bun run test:related`) | El script no existe en este proyecto; el worker usó `bun test <archivo>` | Quitarlo del brief o que el kit lo defina al instalarse → informe 2026-10-16 |
| 9 | 2026-10-12 | Fricción | 1 | verificación con dev server (Astro 7) | `astro dev` se desacopla, `astro dev stop` se colgó >120 s y `networkidle` nunca llega en dev | Patrón en el kit: arrancar, esperar con `curl`, matar por PID del puerto, `waitUntil: "load"` → informe 2026-10-16 |
| 10 | 2026-10-12 | Hueco | 1 | `git-flow` §2.1.1 (`bun run shots`) | El proyecto no tiene `shots` ni `shots:publish`; el worker hizo capturas con un script propio y las dejó en `plans/shots-w2/` | Que el kit instale el script o el brief diga a qué carpeta van las capturas → informe 2026-10-16 |
| 11 | 2026-10-12 | Hueco | 1 | brief de workers/QA | El modal del tutorial tapa la página al cargar como invitado y Escape no lo cierra; los scripts de Playwright tropiezan | Nota en el brief: cerrar con "Saltar tutorial" o sembrar el flag de tutorial visto → informe 2026-10-16 |
| 12 | 2026-10-12 | Hueco | 2 | nota de entorno (preview Astro 7) | `astro preview` se desacopla y queda ocupando el puerto tras una sesión interrumpida; arrancó en otro puerto | Leer el puerto real del log y parar con `bunx astro preview stop` → informe 2026-10-16 |
| 13 | 2026-10-12 | Hueco | 3 | skill `a11y` / brief | `axe-core` no está en `node_modules`; se inyectó desde cdnjs | `axe-core` como devDependency o el brief dice cómo cargarlo → informe 2026-10-16 |
| 14 | 2026-10-12 | Fricción | 1 | brief (Playwright con `node`) | Un script ESM en el scratchpad no resuelve `playwright` | Guardar el script dentro del slot o importar por ruta absoluta `file:///…/node_modules/playwright/index.mjs` → informe 2026-10-16 |
| 15 | 2026-10-12 | Fricción | 1 | entorno Windows | `bunx astro check` tarda >2 min y pasa a segundo plano | Avisar en el brief: timeout amplio o background → informe 2026-10-16 |

## Envío al kit

Cuando el dueño lo pida (o al cerrar la fase 09): la skill **`kit-feedback`** (`/kit-feedback`). Arma el informe con las filas sin enviar, agrupadas por pieza del kit y con lo más repetido primero, y abre un PR en el repo del kit con la etiqueta `kit-feedback`. Las filas enviadas se marcan con `→ PR <owner/repo#N>` en "Propuesta" (no se borran).
| 16 | 2026-10-16 | Fricción | 1 | `new-project.ps1 -Existing` (piece check de `kit-update`) | Asume Next: añadiría `typecheck` con `next typegen`, copia `phases/` y reformatea `package.json` entero; en un proyecto Astro se aplicó a mano | Detectar el framework y saltar `typecheck`/`phases/`, o que el piece check diga qué aplicar a mano |
| 17 | 2026-10-16 | Hueco | 1 | UPDATES.md 3.8.0 (paso 4) | No dice qué hacer con un `.gitignore` que ignora `/supabase/*` salvo el README ni con decisiones que lo fijaron (D184) | Mencionar que hay que abrir una decisión nueva que reemplace la anterior |
