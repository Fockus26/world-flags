# D057 · Versionado · `CHANGELOG.md` (Keep a Changelog, español) es la única fuente del modal "Novedades" · Implementado

**Resumen:** `CHANGELOG.md` (Keep a Changelog, español) es la única fuente del modal "Novedades": se importa con `?raw` y se interpreta en el cliente. Versión = `import { version } from "package.json"` (sin `vite.define`). Viajan en el mismo bundle: se muestra lo que corre, no lo desplegado. `tests/unit/changelog.test.ts` exige formato y primera entrada = `package.json`

**Contenido.** El modal lee `CHANGELOG.md` directamente: `src/data/changelog.ts`
lo importa con `?raw` (Vite lo incrusta como texto en el bundle; el plugin de
Markdown de Astro no intercepta imports con query) y `src/utils/changelog.ts`
lo interpreta (Keep a Changelog: `## [x.y.z] - AAAA-MM-DD`, `### Sección`,
`- punto`, con puntos partidos en varias líneas).

Descartado: un módulo TS tipado mantenido en paralelo. Serían dos textos del
mismo cambio en cada PR, y la única forma de mantenerlos iguales sería un test
que compare los dos... que ya es un parser del Markdown. Con el Markdown como
fuente, ese parser es el que usa la app y no hay nada que sincronizar.

Lo que el Markdown no garantiza por sí solo lo garantiza `bun run test` (CI):
`tests/unit/changelog.test.ts` interpreta el archivo real y falla si hay una
línea con otro formato, una sección que no es de Keep a Changelog (en español:
Añadido, Cambiado, Obsoleto, Eliminado, Corregido, Seguridad), una sección o
versión vacía, versiones o fechas fuera de orden, formato Markdown dentro de un
punto (el modal pinta texto plano) o **una primera entrada distinta de la
versión de `package.json`**. Ese último es el que impide que número y
changelog se desincronicen. En la app, lo que no se entiende se ignora en vez
de romper el modal.

**Versión.** `import { version } from "../../package.json"`: import con nombre
de JSON, que Vite resuelve al compilar y sacude el resto del archivo (verificado
en el build: `APP_VERSION` sale como la cadena `1.0.0` y ningún otro campo de
`package.json` llega al bundle). Descartado `vite.define` en `astro.config.mjs`:
también es una sola fuente, pero necesita una global declarada a mano y no
existe al correr `bun test`.

**Por qué del bundle y no de la red.** `sw.js` sirve los assets con hash desde
caché (stale-while-revalidate), así que una pestaña puede correr un bundle
anterior al último despliegue. La versión y el texto viajan en el mismo chunk:
lo que se muestra es siempre lo que de verdad corre. Leer un `version.json`
por red diría la versión desplegada, no la ejecutada.

## Contexto común de la unidad (antes `15-changelog-y-versionado.md`)

> **Mecánica de versión reemplazada por D135 (D135–D136):** los PRs ya no suben la
> versión; lo hace el PR de versión de Changesets. Semver y lo que es MAJOR/MINOR/PATCH siguen.
>
> Unidad `feat/changelog`. El dueño eligió el enfoque (**`CHANGELOG.md` en el
> repo + modal "Novedades" en la app + semver en `package.json`, escrito a
> mano**, no generado desde commits) y el número de arranque (**1.0.0**). El
> resto de decisiones de abajo son del agente, justificadas aquí.
>
> Verificado con `bunx astro check` / `bunx biome check ./src` /
> `bun run test` / `bun run build` y en el navegador embebido sobre el build
> de producción (`bun run preview`, autorizado por el dueño; Supabase de
> relleno, como invitado): los cinco casos de la tabla de D058, foco con
> teclado en los dos caminos, anidado (Escape y clic fuera cierran solo el de
> arriba), axe-core 4.10 en claro y oscuro, 320 px sin scroll horizontal.
