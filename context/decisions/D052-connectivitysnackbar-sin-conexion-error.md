# D052 · UX · `ConnectivitySnackbar` (sin conexión / error de sync / de vuelta) y degradación sin red · Implementado

**Resumen:** `ConnectivitySnackbar` (sin conexión / error de sync / de vuelta) y degradación sin red: ranking con mensaje, login deshabilitado con nota, avatares con inicial o número. Banderas nunca vistas: precarga (D054)

`ConnectivitySnackbar`, primero en el contenedor de `SystemSnackbars`:

| Estado | Aviso |
|---|---|
| Sin conexión, con cuenta | 📡 "Sin conexión" — el progreso se guarda en este dispositivo y se sube al volver. "Entendido" lo oculta hasta el siguiente corte |
| Sin conexión, invitado | 📡 "Sin conexión" — se puede seguir practicando; ranking e inicio de sesión vuelven con la conexión |
| Hay red, la sync falla (con cuenta) | ⚠️ "No se pudo sincronizar" — se guarda aquí, se reintenta. No se dice "sin conexión": sería mentira |
| Vuelta | ✅ "Progreso sincronizado" (con cuenta: solo tras una sincronización buena) o "Conexión recuperada" (invitado). Se va sola a los 5 s, con botón de cerrar |

- Un corte de menos de 2 s no avisa (ni se anuncia la vuelta). El estado nunca
  va solo por color: emoji + título + texto. Vive en la región
  `role="status"`/`aria-live="polite"` de `SystemSnackbars`.
- **Qué no funciona sin conexión, y cómo se degrada:**
  - **Ranking público:** no se pide; el modal lo dice y se carga solo al volver
    la red. Si el navegador dice "en línea" pero el GET falla sin respuesta,
    mismo mensaje.
  - **Login / crear cuenta / Google:** nota "Sin conexión: … necesitas
    internet", botones deshabilitados (`aria-describedby` a la nota). Si aun
    así falla por red, "Failed to fetch" pasa a un mensaje en español.
  - **Avatares de dicebear:** uno ya visto sale de la caché HTTP del navegador
    (dicebear sirve `max-age` de ~1 año). Si no está: la inicial del nombre en
    la cabecera y el número de opción en el selector (se puede elegir igual; el
    selector lo avisa). Al volver la red se reintentan solos.
  - **Sincronización entre dispositivos y ranking:** esperan a la red (D050,
    D051).
- **Banderas nunca vistas:** el SW solo tenía las que ya habían aparecido
  alguna vez; sin red, un continente nunca practicado enseñaba imágenes rotas.
  Se planteó (a) precargar las 197, (b) aviso en la tarjeta + saltar o
  (c) dejarlo; el dueño eligió (a) → D054.
- Copy provisional → `context/CONTENT_CHECKLIST.md`.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
