# Plantilla del correo de confirmación de registro

> Carpeta local (gitignored). La plantilla vive en el panel de Supabase, no en el
> código: estos archivos son la copia de trabajo para pegarla allí.
> Decisión: D095 · Copy provisional: `CONTENT_CHECKLIST.md` fila 32.
> Documentación consultada el 2026-09-23: "Email Templates"
> (supabase.com/docs/guides/auth/auth-email-templates) y "Send emails with custom SMTP"
> (supabase.com/docs/guides/auth/auth-smtp).

| Archivo | Qué es |
|---|---|
| `confirmar-registro.html` | Cuerpo del correo (HTML completo, se pega tal cual) |
| `confirmar-registro.asunto.txt` | Asunto recomendado + una alternativa |

## 1. Aplicarla (5 minutos)

1. Supabase → tu proyecto → **Authentication** → **Emails** (en algunas versiones del
   panel se llama **Email Templates**) → pestaña **Templates** → **Confirm sign up**.
2. **Subject:** pega la línea recomendada de `confirmar-registro.asunto.txt`
   (sin el texto de alrededor).
3. **Message body:** cambia a la vista de código/HTML si el editor la ofrece, borra
   todo lo que hay y pega **el archivo entero** `confirmar-registro.html`
   (desde `<!DOCTYPE html>` hasta `</html>`).
4. Mira la vista previa del panel y pulsa **Save**.

No toques el resto de plantillas ni de ajustes: solo cambia "Confirm sign up".

La única variable que usa es `{{ .ConfirmationURL }}` (dos veces: en el botón y en el
enlace de texto plano de debajo). Es la variable documentada para el enlace de
confirmación; no hace falta nada más.

## 2. Probarla

1. **Ojo con el servicio de correo incluido** (sección 3): mientras no haya SMTP propio,
   Supabase **solo entrega a direcciones del equipo de la organización**. Prueba con tu
   propio correo (`alejandrorey2654@gmail.com`) o añade otra dirección en
   Organization → Team.
2. En la app: Perfil y configuración → crear cuenta con un correo que **no** tenga cuenta
   todavía (un alias de Gmail sirve: `alejandrorey2654+prueba1@gmail.com`).
3. Revisa en el correo recibido: asunto, línea de vista previa ("Un clic y tu progreso
   queda guardado…"), cabecera morada, botón, enlace de texto plano y pie.
4. Pulsa **Confirmar mi correo**: debe abrir la app ya con la sesión iniciada. La
   pestaña original ("Revisa tu correo") también entra sola (reintenta el inicio de
   sesión en segundo plano).
5. Prueba **Reenviar correo** desde esa pantalla: usa **la misma plantilla**
   (`supabase.auth.resend({ type: "signup" })` reenvía el "Confirm sign up").
6. Si puedes, míralo también en el móvil (Gmail app) y con el modo oscuro del sistema.
7. Borra después los usuarios de prueba en Authentication → Users si no los quieres.

Si el enlace da "Token has expired or is invalid" nada más abrirlo: algunos correos de
empresa (Outlook con Safe Links / Defender) "visitan" los enlaces antes que la persona y
gastan el token. Es una limitación documentada por Supabase; no afecta a Gmail/iCloud
normales. Se arregla con un flujo por código OTP, que hoy la app no tiene.

## 3. Lo que debes saber del envío

### El servicio de correo incluido NO sirve para producción

Según la documentación actual de Supabase, el SMTP que trae el proyecto por defecto:

- **Solo envía a direcciones del equipo** de la organización (Organization → Team).
  A cualquier otra dirección falla con *"Email address not authorized"*. Es decir:
  **hoy, un jugador cualquiera que se registre con correo no recibe el correo de
  confirmación y no puede terminar el registro** (salvo que el proyecto tenga ya un
  SMTP propio configurado — compruébalo en Authentication → Emails → SMTP Settings).
- Tiene un **límite de envíos por hora muy bajo** a nivel de proyecto (la cifra exacta
  la muestra Authentication → Rate Limits; Supabase avisa de que puede cambiar sin
  aviso) y solo se puede subir con SMTP propio.
- Sin garantía de entrega ni de disponibilidad: "solo para pruebas y demos".

El inicio de sesión con Google no depende de esto.

### Recomendación: SMTP propio (p. ej. Resend)

Resend aparece en la lista de servicios compatibles de Supabase y tiene capa gratuita.
Requisito previo real: **un dominio propio** (la app aún no lo tiene, ver
`CONTENT_CHECKLIST.md` › `SITE_URL`). Sin dominio verificado, Resend solo deja enviar
de prueba a tu propia dirección.

Pasos a alto nivel:

1. Tener el dominio definitivo (o un subdominio para correo, p. ej. `auth.tudominio`).
2. Crear cuenta en Resend → **Domains** → añadir el dominio → crear en tu DNS los
   registros que indique (SPF, DKIM y, recomendable, DMARC) → esperar a "Verified".
3. Resend → **API Keys** → crear una clave con permiso de envío.
4. Supabase → Authentication → Emails → **SMTP Settings** → activar *Custom SMTP*:
   - Host `smtp.resend.com` · puerto `465` (o `587`) · usuario `resend` ·
     contraseña = la API key (datos de la guía de Resend para Supabase; compruébalos
     allí al hacerlo).
   - Sender email: `no-reply@<tu dominio>` · Sender name: `World Flags`.
5. Guardar. Al activar SMTP propio Supabase pone el límite en **30 correos/hora**;
   súbelo en Authentication → Rate Limits según lo que esperes.
6. Repetir la prueba de la sección 2 con un correo que no sea del equipo.

Buenas prácticas de la guía de Supabase que ya sigue la plantilla: sin imágenes, un
solo botón, sin publicidad, asunto corto y sin emojis. Si más adelante hay abuso de
registros por bots, la guía recomienda activar CAPTCHA en Auth.

## 4. A dónde lleva el enlace

- El enlace pasa por `https://<proyecto>.supabase.co/auth/v1/verify?...` y luego
  redirige a la **Site URL** de Authentication → **URL Configuration**, porque
  `signUpWithEmail` (`src/hooks/useAuth.ts`) **no pasa `emailRedirectTo`** (y el
  reenvío tampoco). Comprueba que la Site URL es la dirección pública real de la app y
  no `http://localhost:…`: si es localhost, el enlace del correo no abre la app para
  nadie.
- Cuando la app tenga dominio definitivo, actualiza la Site URL y añade el dominio a
  **Redirect URLs**.
- Mejora de código recomendada (no aplicada, va en su propia unidad): pasar
  `options: { emailRedirectTo: window.location.origin }` en `signUp` y en `resend`,
  igual que ya hace el login con Google con `redirectTo`. Así el enlace vuelve al
  mismo origen desde el que se registró la persona (útil en previews/despliegues
  alternativos), siempre que ese origen esté en Redirect URLs.

## 5. Si quieres cambiar el diseño

- Colores: los de `context/COLORS.md` (claro: `#6d5ef0`, fondo `#f2f1f8`, texto
  `#1c1b2e`, secundario `#6b6880`; oscuro: fondo `#14121f`, tarjeta `#1b1930`, texto
  `#f1eefc`, botón `#9b8bff` con texto `#14121f`). Contrastes medidos en D095.
- Cualquier texto nuevo es copy provisional (fila 32).
- Cambia la plantilla pocas veces y de una vez: la guía de Supabase avisa de que los
  cambios frecuentes perjudican la entregabilidad.
