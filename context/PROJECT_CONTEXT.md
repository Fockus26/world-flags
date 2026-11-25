# Project Context — World Flags

> Primer archivo que lee cualquier agente. Si un dato no existe, dice `PENDIENTE` y
> tiene fila en `CONTENT_CHECKLIST.md`.

## Resumen

App web / PWA para aprender los países, las banderas y las capitales del mundo (tres juegos) con repetición espaciada
(SM2, estilo Anki). Convierte el estudio de geografía en un hábito sostenible:
prioriza lo que el usuario olvida y espacia lo que ya domina.

## Tipo de proyecto

Juego / app instalable (PWA). No es landing ni sitio de contenido.

## Negocio

- **Qué hace:** entrena tres cosas, cada una con su progreso: qué países hay en cada continente (Países), qué bandera es de cada país (Banderas) y cuál es la capital de cada país (Capitales).
- **Qué debe lograr:** que el usuario vuelva a practicar día tras día (retención).
- **Acción principal:** empezar y completar una sesión de práctica.

## Público objetivo

Gente que quiere memorizar banderas/geografía: estudiantes, aficionados a trivia,
gente preparando concursos. Uso principal declarado: **móvil**.

## Tono de marca

Educativo, motivador, moderno, con un punto lúdico (morado de marca, avatares
"dicebear", emojis funcionales 🏆 📍). **No debe parecer:** infantil, corporativo/frío,
ni un test académico severo.

## Idioma y mercado

- UI en **español**. `<html lang="es">`, `og:locale=es_ES`.
- El README del repo está en inglés (para GitHub); todo lo demás en español.

## Restricciones de marca

- **Color obligatorio:** morado `#6d5ef0` (primary light). Ya es `theme_color` del
  manifest y del `<meta name="theme-color">`.
- **Tipografía:** Plus Jakarta Sans (Google Fonts, hoy render-blocking — ver
  `CONTENT_CHECKLIST.md`).
- Logo: solo `public/favicon.svg` (bandera estilizada sobre gradiente morado). No hay logotipo con texto.

## Stack técnico

- Framework: **Astro 7** (`output` estático; una sola ruta `/` con una isla React `client:load`)
- Lenguaje: **TypeScript** estricto · **React 19** + React Compiler
- Componentes: **HeroUI v3** (`@heroui/react` 3.2.x + `@heroui/styles`) — razón:
  el dueño lo pidió explícitamente; el tema propio ya iba "HeroUI-ish"
- Estilos: **Tailwind CSS v4** (CSS-first, sin `tailwind.config.js`); tokens propios
  puenteados a los de HeroUI (ver D003–D005, D013)
- Gestor: **bun**. Docs de librerías: **Context7**
- Estado en memoria: **Redux Toolkit** (`src/store/`, slices `auth`/`game`/`theme`)
- Base de datos: **Postgres en el VPS** con **Drizzle** (`user_learning_data` privada + `leaderboard_entries` pública), por rutas `src/pages/api/`; D227
- Auth: **Better Auth** (correo + Google), cookie httpOnly
- Persistencia local: `localStorage` vía `src/utils/learning-storage.ts`
- Pagos: N/A · Correo: solo el de confirmar cuenta (ver "Correos")
- Despliegue: **kit-deploy en el VPS** (Docker + `@astrojs/node`, D243; ver "Repo y despliegue")

## Repo y despliegue

- Repo: https://github.com/Fockus26/World-Flags (público; "Automatically delete head branches" activo)
- Hosting: **kit-deploy** en el VPS (D243): `deploy-vps.yml` construye la imagen en GitHub Actions
  y la despliega; proyecto `world-flags`, base `world_flags` adoptada
- Producción: https://world-flags.fockus.dev (`SITE_URL`) · Previews: `world-flags-pr-<n>.preview.fockus.dev`, uno por PR
- Vercel: respaldo una semana tras el corte (`world-flags-hazel.vercel.app`, construye con `@astrojs/vercel`); luego se retira
- DNS gestionado por: kit-deploy (subdominio de `fockus.dev`, sin dominio propio)
- Mantenimiento: no aplica (app estática; el SW sirve la última versión sin red)

## Assets de marca

| Pieza | Estado | Dónde / nota |
|---|---|---|
| Logo | no aplica | No hay logotipo con texto; la marca es el icono |
| Icono / isotipo | existe | `public/favicon.svg` (bandera estilizada sobre gradiente morado) |
| Favicon | existe | `public/favicon.svg` |
| Apple touch icon | existe | `public/apple-touch-icon.png` (+ `pwa-192/512`, `maskable-icon-512x512.png`, `manifest.webmanifest`) |
| Imagen Open Graph | existe | `public/og-image.png` (#52) |

Detalle de tamaños y archivos: `reference/BRAND-ASSETS.md` del kit.

## Correos

La app solo manda el correo de confirmar cuenta (Better Auth + `src/server/email.ts`, por SMTP). Google OAuth no manda ninguno;
no hay recuperación de contraseña ni magic link. Los recordatorios diarios son push (VAPID), no correo.

| Correo | Lo manda | Destinatario | Estado |
|---|---|---|---|
| Confirmar cuenta ("Confirm sign up", reenviable desde `EmailConfirmationPending`) | La app (Brevo) | jugador que se registra con correo | diseñado (D095, `PHASE_LOG/email-confirmacion.md`); plantilla en `emails/confirmar-registro.html` |

Remitente: Brevo por SMTP (`SMTP_*` en Vercel) · dominio verificado (SPF/DKIM/DMARC): **PENDIENTE**,
acción del dueño, necesita dominio propio. Detalle:
`reference/EMAIL-TEMPLATES.md` del kit.

## Alcance de "páginas"

| "Página" | Ruta | Estado |
|---|---|---|
| App (shell único) | `/` | Cerrada |

No hay más rutas. Dentro de `/` hay 4 **vistas** que alternan por estado de Redux, no por URL — ver `PAGE_INVENTORY.md` / `SECTION_INVENTORY.md`.

## Funcionalidad más allá de lo estático

- [x] Autenticación de usuarios (Better Auth, email/password + Google OAuth)
- [x] Persistencia de progreso de usuario (local + nube, con merge)
- [x] Ranking público (leaderboard competitivo "mundo")
- [x] Formularios con envío real (auth)
- [x] Correos que manda la app (solo el de confirmar cuenta, ver § "Correos")
- [ ] Pagos / carrito / CMS / multi-idioma — no aplica

## Track de fases

No sigue el track de fases del kit (Tokens→Layout→…) porque **el proyecto ya
existía y estaba en producción** cuando entró el kit. Lo que se hizo fue una
**unidad grande de migración + fixes** (ver `PHASE_LOG/heroui-migracion.md`).
El track por fases aplicaría a partir de un rediseño mayor o modos de juego nuevos.

## Modo de trabajo

- Dark mode: **sí** (claro / oscuro / sistema, `[data-theme]` en `<html>`).
- Ramas: sin rama madre — cada unidad sale de `main` y vuelve por Pull Request (ver `CLAUDE.md`).

## Particularidades

- **Astro islands:** toda la app React es una isla única (`src/pages/index.astro` →
  `App.tsx` con `client:load`). No hay Server Components; el patrón "`'use client'`
  abajo" del kit no aplica.
- **El SW cachea muy agresivo** (dev y prod). Ver la nota en `CLAUDE.md`.
- **Entorno de este equipo (Windows):** Playwright / navegador embebido fallan a
  ratos (`window.innerHeight === 0`, Chromium cuelga). Afecta a QA automatizada,
  no al producto.
- Las 197 banderas están autohospedadas en `public/flags/{code}.svg` (~3.1 MB,
  descargadas una vez de `flagcdn.com`) y se sirven desde el propio origen, así
  que `sw.js` las cachea igual que el resto de assets same-origin. Además,
  unos segundos después de cargar, la app le pide al SW que precargue las que
  falten (~3,1 MB una vez; no con "ahorro de datos" ni en 2G, D054): sin red
  se puede practicar cualquier continente. Los avatares siguen viniendo de `dicebear` (CDN externo,
  mismo riesgo offline que antes).
