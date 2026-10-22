# D224 · Auth / Persistencia · El error del popup de Google sale en Configuración y la marca de cierre pedido vale para su sesión · Implementado

**Resumen:** arreglos de dos hallazgos de la QA de cierre de la ola 4 (2026-10-22): el error del popup de Google llegaba detrás del diálogo modal de Configuración ([Medio], #124/D218) y la marca de cierre pedido de D219 caducaba a los 60 s, con lo que una pestaña congelada más tiempo volvía a fusionar lo del invitado ([Bajo], #122/D219).

**Error del popup dentro del diálogo.**

- "Continuar con Google" solo se pulsa con Configuración abierta, y el contenedor de avisos (`SystemSnackbars`) queda fuera del diálogo modal (`inert`, bajo el fondo con desenfoque): el aviso no se anunciaba ni se alcanzaba hasta cerrar el diálogo.
- `auth-link-error.ts` gana un registro de un solo receptor: `registerInlineAuthLinkError(handler)` (devuelve con qué soltarlo; soltar uno antiguo no suelta el nuevo) y `deliverInlineAuthLinkError(kind)`, que devuelve `false` si no hay nadie. `AuthSection` se registra mientras muestra su formulario (vista `form`, que es donde está el botón).
- `AuthLinkErrorSnackbar.handleMessage` (el mensaje del popup) entrega primero ahí; si no hay receptor, el aviso de siempre. El error que llega en la propia URL (sin `opener`) no cambia.
- En `AuthSection`: `FeedbackMessage` `variant="danger"` `role="alert"` justo debajo de "Continuar con Google", que lo referencia con `aria-describedby`. Se queda hasta volver a pulsar Google, enviar el formulario o cambiar de pestaña (como el error del formulario, D212); `attempt` lo remonta para volver a anunciarlo. El foco se deja en el botón; si se perdió (`<body>` o el contenedor del diálogo), vuelve a él (`focusIfLost`).
- Copy provisional: "No se pudo entrar con Google. Vuelve a intentarlo." (`AUTH_POPUP_ERROR_INLINE_COPY`). Un único texto para los dos tipos: el popup solo sale de Google y `otp_expired` no aplica ahí.

**Marca de cierre pedido sin caducidad por tiempo.**

- La marca (`world-flags-voluntary-sign-out`) guarda ahora `{ userId, sessionId, at }`: `sessionId` es el `session_id` del token de acceso de la sesión que se pide cerrar (`sessionIdFromAccessToken`, decodifica el JWT sin verificar firma; solo identifica). Marcas antiguas sin él se leen con `sessionId: null`.
- `AuthEffects` llama en cada evento a `rememberSession(userId, access_token)`: refrescar el token es la misma sesión; entrar tras un cierre es otra (aunque sea la misma cuenta). Tras el `SIGNED_OUT` se recuerda la sesión cerrada, para que `GameEffects` la compare al apartar.
- `isVoluntarySignOutOf(mark, ended, userId, now)` (pura): misma cuenta y, con `session_id` en los dos lados, **misma sesión**; sin él, la marca debe ser posterior al instante en que esta pestaña vio empezar esa sesión y no del futuro. Sin TTL: una pestaña congelada horas procesa su `SIGNED_OUT` y la marca sigue valiendo.
- **Ya no se borra al volver a entrar** (se quita `forgetVoluntarySignOut`): una pestaña congelada mientras otra cierra y vuelve a entrar procesa después el `SIGNED_OUT` atrasado y debe seguir viéndolo como pedido. La sesión nueva tiene otro `session_id` (o empieza después de la marca), así que un cierre involuntario posterior no la hereda. Se sigue borrando si `signOut` devuelve error.
- Caso residual aceptado: si `signOut` nunca llega al servidor (pestaña cerrada a mitad) y esa misma sesión termina más tarde por sí sola, ese fin se trata como pedido (lo del invitado se descarta con el aviso de D212). Es la sesión que el usuario pidió cerrar.

**Alternativas descartadas:** TTL más largo (sigue siendo frágil, y alarga el riesgo de contaminar un cierre posterior); que la otra pestaña "consuma" la marca (con tres o más pestañas, la primera la gastaría para las demás); borrar la marca cuando la sesión se refresca tras marcarla (carrera con un refresco en vuelo durante el `signOut`); renderizar el aviso general dentro del diálogo con un portal (habría que moverlo en cada diálogo; el error pertenece al formulario donde se pulsó el botón).

**Pendiente/limitación:** si con Configuración abierta se cambia de pestaña interna antes de que vuelva el popup (`AuthSection` desmontada), el error sale en el aviso general, detrás del diálogo, como antes.

**Verificado:** tests unitarios (`tests/unit/sync-concurrency.test.ts`: pestaña congelada horas, congelada mientras se vuelve a entrar, cierre involuntario de una sesión posterior, refresco de token, sin `session_id`, marca antigua, fallo de `signOut`, marca corrupta; `tests/unit/auth-link-error.test.ts`: registro del receptor). En navegador contra Supabase local (Docker): popup con error y Configuración abierta → error dentro del diálogo, `role=alert`, no `inert`, encima del fondo, foco en "Continuar con Google", sin aviso general; con Configuración cerrada → aviso general; axe limpio a 1280 y a 320 con texto al 200 %. Dos pestañas: la marca lleva el `session_id` real, la pestaña con el reloj 3 h adelantado aparta con `guestFollows: false`, y al volver a entrar la sesión es otra y la marca sigue.
**Rama:** `fix/auth-popup-error-y-marca`
