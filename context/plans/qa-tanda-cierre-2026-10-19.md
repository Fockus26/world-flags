# QA tanda de cierre 2026-10-13 — 2026-10-19 — 2026-10-19

**Entorno:** main @ b766a29 · slot wt1:4301 · base: local (Supabase en Docker, `qa:local`) · roles: usuario (+ invitado y una cuenta nueva creada por registro)
**Resultado:** 0 críticos · 1 alto · 2 medios · 1 bajo

## Hallazgos

### [Alto] "Todos"/"Ninguno" del selector de países: el foco cae en "Cerrar" del modal, no en el botón que queda
- **PR / unidad:** #86
- **Rol:** invitado y usuario (no depende del rol)
- **Pasos:** 1. 📍 "Elegir países específicos". 2. Tab hasta "Todos: marcar los países de Europa" (Europa sin nada marcado). 3. Intro (o Espacio, o clic). 4. Con todo Europa marcado, Tab hasta "Ninguno" e Intro.
- **Esperado / ocurre:** se espera el foco en "Ninguno" (y luego en "Todos"). Ocurre: en los dos sentidos `document.activeElement` = botón "Cerrar" del diálogo (medido a +50, +300 y +1500 ms; con Intro y con Espacio, en 2 de 2 corridas). Si el usuario pulsa Intro otra vez, cierra el selector. Solo funciona cuando el continente estaba marcado a medias (ahí se ven los dos botones y "Ninguno" ya existe antes del clic).
- **Evidencia:** `after Todos +1500 ms active: BUTTON#react-aria…:Cerrar`; `after Ninguno active: BUTTON#react-aria…:Cerrar dialog open: 1`. Caso parcial (Francia marcada → "Todos"): `active: BUTTON:Ninguno: desmarcar los países de Europa` (bien).
- **Dónde mirar:** `src/components/game/configuration/CountryPickerModal.tsx:125-133` + `src/utils/focus.ts:40`. La primera llamada a `focusIfLost` es síncrona, dentro del `onClick`: el `querySelector` del continente todavía devuelve el botón pulsado, que tiene el foco, y el `return` de la línea 40 corta sin reintentar. Después React desmonta el botón y el FocusScope de React Aria manda el foco al primer elemento del diálogo ("Cerrar"), no a `<body>`, así que un reintento tampoco lo arreglaría tal como está escrito (solo actúa si el foco está en `<body>`).
- **Reproducible:** siempre

### [Medio] Doble clic en los botones de los modales de lotes llega a lo que está debajo
- **PR / unidad:** costura entre #89 (modal de abandonar con "Cancelar") y #86 (flujo de lotes); el modal es de D185
- **Rol:** invitado y usuario
- **Pasos:** A) Panel de lotes → "Abandonar" → doble clic en "Sí, abandonar". B) "Aprender por lotes" → doble clic en "Empezar".
- **Esperado / ocurre:** A) abandona y no toca nada más. Ocurre: abandona y el segundo clic cae en la casilla del continente que hay debajo y la desmarca (antes `south-america`, después ninguno); el siguiente "Comenzar práctica" se encuentra sin alcance. B) crea el lote, y el segundo clic cae en "Comenzar práctica": arranca una práctica normal de todo el alcance (cabecera "SUDAMÉRICA 1 / 12") en lugar de la sesión del lote ("LOTE 1 DE 3 · 1 / 5").
- **Evidencia:** `before south-america` → `after dblclick (vacío)`; `mid session header: SUDAMÉRICA 1 / 12` justo después de doble clic en "Empezar".
- **Dónde mirar:** `Configuration.tsx:549-563` (ConfirmationModal de lotes) y `LearningPathModal.tsx:150-157`: el diálogo se desmonta con el primer clic y el segundo se lo lleva lo que queda en esa posición. Se podría ignorar el puntero durante la animación de salida o no cerrar hasta el `pointerup`.
- **Reproducible:** siempre (con Playwright `dblclick`)

### [Medio] Al abandonar una partida el foco se queda en `<body>`
- **PR / unidad:** #86 (hueco: D202 no cubre este caso)
- **Rol:** invitado
- **Pasos:** 1. Empezar cualquier partida (Países, Capitales o Banderas; práctica o rush). 2. "Abandonar" → "Sí, abandonar".
- **Esperado / ocurre:** se espera el foco en el `h1` de inicio, como al hacer "Volver al inicio". Ocurre: `document.activeElement` = `<body>` en las 5 combinaciones probadas (medido a 2,5 s).
- **Evidencia:** `back focus: BODY` en countries/capitals/flags × práctica/competitivo.
- **Dónde mirar:** `Session.tsx:508` y `countries/CountriesPractice.tsx:389` (`onConfirm={exitGame}` sin el `focusIfLost` hacia `CONFIGURATION_TITLE_ID`, que es lo que sí hace `FlagGame.tsx:116-122` para Resultados). Seguramente también en `CountriesRush` y `DailyPractice`.
- **Reproducible:** siempre

### [Bajo] Un `profile.name` que no es texto en el almacenamiento tumba la app
- **PR / unidad:** fuera de la tanda (es lo que dejó ver la pantalla de #88)
- **Rol:** invitado
- **Pasos:** `world-flags-learning-data` con `profile.name` = 123 y recargar.
- **Esperado / ocurre:** se espera que la normalización lo corrija. Ocurre: aparece el ErrorBoundary con `TypeError: name is not iterable at truncateName`. Que salga "Algo salió mal" está bien (es justo lo que hace #88); lo que falta es que la normalización no compruebe el tipo.
- **Dónde mirar:** `UserSummary.tsx:38` / la normalización de `profile` en `learning-storage.ts`.
- **Reproducible:** siempre (solo con datos corruptos a mano)

## Camino feliz verificado
- #91: `qa:local` hizo `db reset` con migraciones y seed y creó la cuenta de usuario; las peticiones solo fueron a `127.0.0.1:54321` (ninguna a `*.supabase.co`).
- #87 (curl): `<title>`, `og:title` y `twitter:title` = «Banderas del Mundo — Aprende con repetición espaciada».
- #88: `/no-existe` devuelve 404 con tarjeta propia y `robots noindex, follow`. "Volver a practicar" se alcanza con 2 Tab (antes va "Saltar al contenido"), tiene anillo de 3 px y con Intro lleva a `/`. Contraste del enlace 4,66 en claro y 6,74 en oscuro; sin scroll horizontal a 320 px en los dos temas. `::selection` = accent (4,66 en claro, 6,74 en oscuro). ErrorBoundary (forzado con almacenamiento corrupto, sin tocar código): "Algo salió mal", "Reintentar" se alcanza con Tab.
- #86 lotes (invitado y usuario): "Empezar" lleva el foco a `h2#learning-path-panel-title`. En el modal de abandonar el foco inicial está en "Cancelar", y "Cancelar" lo devuelve a "Abandonar". "Sí, abandonar" lo lleva a `#learning-path-start`. Resultados pone el foco en `h1#results-title` ("Lote en marcha", "¡Completado!" y la nota normal) y "Volver al inicio" en `h1#configuration-title`. Con respuesta + Intro el foco sigue en `#country-answer` (`readOnly`, `aria-disabled="true"`), un segundo Intro no vuelve a comprobar y Tab va a "Otra vez".
- #89 lotes: la cabecera de la sesión dice "LOTE 1 DE 3" / "LOTE 1 DE 5". El titular de Resultados dentro de un lote es "Lote en marcha", junto con la línea de avance del lote. Fuera de lotes sale el mensaje de la nota. El modal de abandonar trae "Cancelar" y "Sí, abandonar". El de abandonar una partida sigue con "Continuar practicando" y "Sí, abandonar".
- Costura entre #86 y #89 en `PracticeResults`: en el mismo render, el foco está en el titular y el texto es "Lote en marcha".
- Contraste de la nota en claro, medido en Resultados: 7 → 5,12; 3 → 7,11; notas 5/6/7 con la función real → 5,20/4,93/5,12. En oscuro: 4,88–6,14.
- Usuario: inicio de sesión con contraseña. El lote, `learning_paths` y el progreso se guardan en `user_learning_data`: un segundo contexto sin almacenamiento local inicia sesión y ve el mismo panel ("Caribe · Lote 1 de 5"), también tras recargar. Al recargar a mitad de una sesión de lote no se pierde el lote.
- Rush de Banderas en Norteamérica, con sesión: 1,51 s. Se crea la fila `flags:north-america@2` 1507 ms y aparece en el ranking público como invitado ("#1 Explorador 1.51") y como el propio usuario ("(tú)").
- Cerrar sesión: el formulario de invitado vuelve y el panel desaparece. Si se cierra la sesión en otra pestaña, la primera pasa a invitado sola.
- Registro: con "Crear cuenta" aparece "Revisa tu correo". El correo llega a Mailpit, con `redirect_to=http://localhost:4301`. El enlace inicia la sesión y la pestaña que esperaba pasa sola a "Sesión iniciada como…".
- Permisos: un anónimo no lee `user_learning_data` ni `push_subscriptions` y no inserta en el ranking (401). Una cuenta autenticada no puede modificar ni borrar la fila de ranking ni los datos de otra (PATCH/DELETE → `[]`; upsert → 403). El trigger rechaza un tiempo propio de 100 ms (422 `PT422`).
- Regresión: Países, Capitales y Banderas arrancan en práctica y en rush. Responden `/` 200, `/no-existe` 404, manifest, `sw.js` y `robots.txt` 200. Sin errores de consola ni respuestas 5xx en ninguna corrida (solo el 401 esperado de la prueba anónima).

## No verificado
| Qué | Por qué |
|---|---|
| Rush de Países (mapa) completo hasta el ranking | Solo se comprobó que arranca |
| "Recargar la página" del ErrorBoundary y su aspecto en oscuro | Solo se vio con Tab el botón "Reintentar" |
| Back del navegador después de enviar | La app no crea entradas de historial: back sale de la app (igual que antes de la tanda) |
| Recordatorio diario / push | Fuera de la tanda; necesita permisos push |

## Datos creados
Base local: nada que borrar (progreso y lotes de la cuenta de prueba, una fila de ranking y una cuenta nueva `qa-ola-<timestamp>@example.test`; el próximo `db reset` lo borra todo). **Datos sin borrar:** ninguno.

## Acciones de César
Ninguna obligatoria. Si se quieren probar ranking y lotes con dos cuentas a la vez, añadir un segundo par `*_EMAIL_TEST`/`*_PASSWORD_TEST` a `.env.test.local`.

## Feedback para el kit
- bug · `scripts/qa-local.ts` + wave-qa §1 · Astro 7 lanza `astro dev` como demonio ("Stop: astro dev stop"), así que `qa:local` termina enseguida con código 0, el servidor queda huérfano y `taskkill /T` sobre su PID no lo apaga. El primer servidor murió a mitad de la QA sin dejar nada en `.astro/dev.log`. · Propuesta: con Astro ≥ 7, arrancarlo en primer plano o mandar `astro dev stop` al salir, y documentar el apagado en wave-qa.
- fricción · wave-qa §4 · faltaba el navegador de Playwright (`chromium_headless_shell-1243`) y `bunx` no estaba en el PATH bajo `timeout`; hubo que usar `node node_modules/@playwright/test/cli.js install chromium`. · Propuesta: que `qa:local` lo compruebe e instale al arrancar.
