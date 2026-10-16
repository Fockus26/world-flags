# W5 — Plantilla del correo de confirmación de registro (2026-09-23)

**Estado:** entregables listos en local; **falta que el dueño la pegue en Supabase**.
Sin rama, sin PR, sin cambios en `src/` ni en git (todo lo escrito es local/gitignored).

## Qué se hizo

La confirmación por correo ya existía (`useAuth.signUpWithEmail` + `EmailConfirmationPending`),
pero Supabase mandaba su plantilla por defecto (inglés, sin marca). Se preparó la de
"Confirm sign up":

- `supabase/templates/confirmar-registro.html` — cuerpo del correo.
- `supabase/templates/confirmar-registro.asunto.txt` — asunto + alternativa.
- `supabase/templates/INSTRUCCIONES.md` — cómo aplicarla, probarla, límites del envío,
  SMTP propio (Resend) y a dónde redirige el enlace.

Diseño: fondo lavanda `#f2f1f8`; tarjeta blanca de 600 px máx. con cabecera morada
(`#6d5ef0` → `#8258e6`) y la "bandera en tarjeta" del favicon reconstruida con celdas de
tabla (sin imágenes); título "¡Ya casi estás dentro! 🌍", una frase, botón grande
"Confirmar mi correo", caja suave con dos ventajas (📍 progreso en todos los dispositivos,
🏆 ranking público), enlace en texto plano como alternativa, aviso de seguridad y pie.
Tablas + CSS en línea, preheader oculto, condicionales MSO para Outlook, `color-scheme`
+ `@media (prefers-color-scheme: dark)` con la paleta oscura de la app (Apple Mail,
Outlook.com vía `[data-ogsc]/[data-ogsb]`); Gmail aplica su propia inversión.
Plus Jakarta Sans por `<link>` con pila de sistema de respaldo.

Variable de plantilla usada: solo `{{ .ConfirmationURL }}` (verificada en la
documentación actual de Supabase, "Email Templates", vía MCP `search_docs`).

## D095 — Plantilla propia para "Confirm sign up", sin imágenes y sin datos del usuario

- **Decisión:** el correo de confirmación usa una plantilla HTML propia en español con la
  marca (morado `#6d5ef0`, paleta de `COLORS.md`, Plus Jakarta Sans con respaldo de
  sistema), construida solo con tablas, CSS en línea y emojis — **ninguna imagen alojada**
  (no hay dominio definitivo y Gmail no muestra SVG). Un único botón; sin
  `{{ .Email }}` ni otros datos del usuario; sin publicidad ni eslogan (la guía de
  entregabilidad de Supabase lo desaconseja en correos de auth). La plantilla vive en el
  panel de Supabase; la copia de trabajo, en `supabase/templates/` (local).
- **Alternativa descartada:** cabecera con el logo como PNG alojado (más fiel a la marca,
  pero necesita dominio/URL estable y suma una imagen que penaliza entregabilidad), o un
  flujo con código OTP de 6 dígitos (`{{ .Token }}`) que evita el problema de los enlaces
  "pre-visitados" por Outlook, pero requiere pantalla nueva en la app.
- **Contraste medido** (navegador integrado, `javascript_tool`, fórmula WCAG):
  - Claro: botón blanco/`#6d5ef0` **4,66:1**; cabecera blanco sobre el extremo del
    degradado `#8258e6` **4,68:1** (texto de 22 px/800, grande); título y cuerpo
    `#1c1b2e`/blanco 16,86:1; ventajas sobre `#ecebfe` 14,36:1; texto secundario
    `#6b6880`/blanco 5,36:1; pie `#6b6880`/`#f2f1f8` 4,78:1; enlace `#5b4bdb`/blanco 6,04:1.
  - Oscuro: botón `#14121f`/`#9b8bff` **6,63:1**; texto `#f1eefc`/`#1b1930` 14,96:1;
    ventajas sobre `#2c2650` 12,25:1; secundario `#a29cc0`/`#1b1930` 6,56:1; pie
    `#a29cc0`/`#14121f` 7,09:1; enlace `#b3a7ff`/`#1b1930` 8,05:1.
  - El extremo del degradado se oscureció de `#8a5fe8` (4,30:1) a `#8258e6` para no
    bajar de 4,5.

## Fila 32 de CONTENT_CHECKLIST (a consolidar por el orquestador)

| 32 | **Correo de confirmación de registro** (plantilla "Confirm sign up" de Supabase): asunto y alternativa, preheader ("Un clic y tu progreso queda guardado en la nube…"), título "¡Ya casi estás dentro!", texto, botón "Confirmar mi correo", las dos ventajas, "¿El botón no funciona?…", aviso de seguridad y pie. Redacción del agente | `supabase/templates/confirmar-registro.html`, `confirmar-registro.asunto.txt` (local) + panel de Supabase | W5 (sin rama) | Pendiente |

## Verificado

- Copia temporal con `{{ .ConfirmationURL }}` sustituida por una URL de ejemplo larga,
  servida en `localhost:4395` desde el scratchpad (fuera del entregable) y abierta en una
  pestaña propia del navegador integrado (cerrada al terminar; servidor parado).
- 700 px claro y oscuro; 320 px claro y oscuro: sin scroll horizontal
  (`scrollWidth === innerWidth`, ningún elemento se sale), botón 52 px de alto (a 320 px
  ocupa todo el ancho), título baja a 24 px, la URL larga parte línea sin desbordar.
- Contrastes de todos los textos (arriba). Foco con teclado en el botón: contorno
  sólido visible (`#1c1b2e` en claro, `#f1eefc` en oscuro).
- Esquinas redondeadas de la tarjeta (se corrigió `border-collapse` que las cuadraba).

## No verificado

- Clientes de correo reales (Gmail web/app, Apple Mail, Outlook escritorio): solo se
  probó el renderizado en Chromium. Outlook de escritorio no redondea esquinas ni carga la
  fuente (esperado, degrada bien por diseño, pero sin probar). La inversión de color de
  Gmail en oscuro no se puede emular.
- Que el panel de Supabase acepte el documento completo tal cual (lo habitual es que sí).
- Envío real: no se tocó la configuración de Auth (regla 9 del brief).

## Pendiente del dueño

1. Pegar asunto y cuerpo en Authentication → Emails → Templates → Confirm sign up
   (pasos en `supabase/templates/INSTRUCCIONES.md`).
2. **Comprobar si hay SMTP propio.** Si no lo hay, según la doc de Supabase el servicio
   incluido solo entrega a miembros del equipo de la organización: los jugadores que se
   registran con correo no reciben la confirmación. Configurar SMTP propio (Resend
   recomendado; necesita dominio) y subir el rate limit.
3. Revisar que la Site URL de Authentication → URL Configuration es la URL pública de la
   app (no localhost), porque `signUp` no pasa `emailRedirectTo`.
4. Revisar/aprobar el copy (fila 32).

## Cambios de código recomendados (no hechos, cada uno en su unidad)

- `src/hooks/useAuth.ts`: pasar `options: { emailRedirectTo: window.location.origin }` en
  `signUp` y en `resend`, como ya hace Google con `redirectTo`.
- Bug visto de paso: `EmailConfirmationPending.handleResend` pone "Correo reenviado"
  aunque `resendConfirmationEmail` devuelva error (rate limit, dirección no autorizada…);
  debería mostrar el error. No se arregló (fuera de alcance).
