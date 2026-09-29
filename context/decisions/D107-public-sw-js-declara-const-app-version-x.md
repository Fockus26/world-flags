# D107 · PWA · `public/sw.js` declara `const APP_VERSION = "x.y.z"` = versión de `package.json`, vigilado por `tests/unit/sw-version.test.ts` · Implementado

**Resumen:** `public/sw.js` declara `const APP_VERSION = "x.y.z"` = versión de `package.json`, vigilado por `tests/unit/sw-version.test.ts`: cada versión cambia los bytes del SW y las pestañas abiertas reciben "Actualizar". `CACHE_NAME` sigue en `v4` (D054). Descartada la plantilla en el build (en dev el SW sale de `public/` sin build)

> Desde D135 (D135–D136) `APP_VERSION` no se toca a mano: lo sube `scripts/release.ts`
> en el PR de versión, junto con `package.json` y el CHANGELOG. El test sigue vigilándolo.

`public/sw.js` declara `const APP_VERSION = "x.y.z";` y
`tests/unit/sw-version.test.ts` falla si no es la de `package.json` (como
`changelog.test.ts` con la primera entrada del `CHANGELOG.md`). Al subir la
versión en un PR hay que tocar tres sitios (package, changelog, sw.js) y el
test lo recuerda en CI. `CACHE_NAME` sigue en `v4` (D054; el test también lo
vigila).

Descartado: generar `sw.js` desde una plantilla en el build (plugin de Vite /
integración de Astro que reemplace `__APP_VERSION__`). Quita el paso manual,
pero en `bun run dev` el SW se sirve desde `public/` sin pasar por el build,
así que habría que mantener dos caminos (dev y build) y el archivo del repo
dejaría de ser el que se ejecuta. El test es más simple y no toca el registro.

**Nota de estado:** `APP_VERSION` lo sube el PR de versión (D135)

## Contexto común de la unidad (antes `25-actualizacion-obligatoria.md`)

> Unidad `feat/actualizacion-obligatoria` (pendientes P1). Versión 2.3.0 (MINOR).
> El dueño eligió el enfoque (versión en `sw.js` vigilada por test + versión
> mínima en una tabla de Supabase, valor inicial 2.0.0, SQL escrito y no
> aplicado); el resto de decisiones son del agente, justificadas aquí.

### El problema

`public/sw.js` no cambiaba de bytes desde 1.2.0: lo único que lo movía era un
comentario escrito a mano. Sin bytes nuevos el navegador no instala un service
worker nuevo, así que las pestañas (y PWAs) abiertas no recibieron el aviso
"Actualizar" en 1.3.0, 2.0.0, 2.1.x ni 2.2.0, y seguían con su bundle viejo.
Además no había forma de impedir que un cliente viejo siguiera jugando con
reglas ya retiradas (la regla del ranking de 2.0.0).
