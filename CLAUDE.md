# World Flags

App web (instalable como PWA) para aprender las banderas del mundo con repetición
espaciada estilo Anki: progreso sincronizado en la nube, modo competitivo
cronometrado ("rush") con ranking público, y alcance de práctica flexible
(mundo / continentes / países sueltos, combinables).

**Tipo:** juego / app · **Estado:** en producción, iterando diseño y features
**Dueño:** Alejandro (`alejandrorey2654@gmail.com`, git `Fockus26`)
**Kit:** web-agent-kit, versión en `.kit-version` (se actualiza con `prompts/ACTUALIZAR-KIT.md`
del kit) · **Despliegue:** Vercel `world-flags-hazel.vercel.app` · preview por PR

---

## Antes de tocar código, lee en este orden

1. `context/PROJECT_CONTEXT.md` — qué es, stack, alcance
2. `context/CURRENT_PHASE.md` — dónde quedó todo y qué está abierto *(local)*
3. `context/DESIGN_RULES.md` — lo que no se negocia

**Buscar, no leer:** `decisions/` (un archivo por decisión; no las re-litigues),
`CONTENT_CHECKLIST.md`, inventarios, `PHASE_LOG/`. `grep` y abrir solo lo que sale:
`grep -rhi "^# D.*modal" context/decisions/`. Más detalle en `docs/`, `README.md`, `CONTRIBUTING.md`.

### Qué está en el repo y qué vive solo en local

En git: `.kit-version` y los documentos **fijos** de `context/`: `PROJECT_CONTEXT`,
`DESIGN_RULES`, `COLORS`, `DESIGN_TOKENS`, `TYPOGRAPHY` y `decisions/`.

Son **locales** (gitignored): `CURRENT_PHASE.md`, `CONTENT_CHECKLIST.md`, `KIT_FEEDBACK.md`, los
inventarios (`*_INVENTORY.md`), `PHASE_LOG/`, `plans/` (incluidos los `*.dc.html` de
Claude Design), `.env*` y todo `supabase/` salvo su `README.md` (SQL y edge functions
son privados). Nunca van a git (ni con `git add -f`).
Los slots del pool de worktrees (`orchestrate`, `..\world-flags-wt\wtN`, D136) traen los
`.env*` copiados, pero **no** `context/` local: se lee (y actualiza) en la carpeta
principal, `C:\Users\Admin\Documents\Work\world-flags\`. Un subagente en un slot que no
pueda escribir ahí lo devuelve en su informe. El estado de las ramas es `gh pr list`.

---

## Stack

- **Astro 7** estático: `/` monta **un** árbol React (`client:load`). El build prerenderiza:
  lo que dependa de la fecha o de `localStorage` va tras `useIsClient` (D179)
- **React 19** + **TypeScript** estricto · **React Compiler** (solo `src/`)
- **HeroUI v3** (CSS por partes en `global.css`: componente nuevo ⇒ su hoja, D176) sobre
  **Tailwind CSS v4** (CSS-first) · **Redux Toolkit** · **Supabase** (auth + sync)
- **Bun** para todo — nunca npm/yarn/pnpm · **iconoir-react** · PWA con SW propio (`public/sw.js`)
- Animaciones: `tw-animate-css` o transiciones CSS. Sin `framer-motion` (D006, D177).

```bash
bun install
bun run build
bunx astro check       # typecheck
bunx biome check ./src # lint (src/ trae errores previos; en CI no bloquea)
bun run test           # tests/unit
bun run test:e2e       # Playwright (necesita el server corriendo)
```

**Servidor de desarrollo:** lo levanta el dueño. Excepciones: los agentes de QA (`wave-qa`,
`functional-qa`) siempre, y los workers si el dueño lo autoriza para una tanda (cada uno en
su puerto). Build, typecheck, lint y tests sí se corren sin preguntar.

**QA contra base local:** `bun run qa:local -- --port <p>` levanta Supabase en Docker
(migraciones + seed), crea las cuentas de `.env.test.local` (`EMAIL_TEST`/`PASSWORD_TEST`)
y arranca el servidor apuntando a lo local. Nunca contra la base real. `supabase/` es
privado: en un slot se copia de la carpeta principal (D184). Playwright se corre con `node`.

**Docs de librerías:** **Context7** antes de usar APIs de HeroUI, Astro, React Aria,
Supabase o Tailwind (cambian rápido).

---

## Cómo se trabaja aquí

Una unidad a la vez (componente, pantalla, flujo o fix acotado).

Todo cambio llega a `main` **por Pull Request**. `main` está protegida.

```
git switch main && git pull  →  git switch -c <tipo>/<descripcion>
   →  implementar  →  [skill a11y]  →  [skill seo si aplica]
   →  si quien juega lo nota: .changeset/<desc>.md
   →  bunx astro check + bunx biome check ./src + bun run test + bun run build
   →  actualizar context/ (local)  →  commit(s) Conventional Commits en la rama
   →  git push -u origin <rama>  →  gh pr create (rellena la plantilla)
   →  PAUSA: el dueño revisa el PR y lo mergea en GitHub (squash)
```

- Base siempre `main`. Una unidad = una rama = un PR.
- **Versión (D057–D060, D135):** nadie toca `version`, `CHANGELOG.md` ni `APP_VERSION`
  de `public/sw.js`. Cambio que nota quien juega → `.changeset/<desc>.md` escrito a mano
  (cuerpo en lenguaje de jugador, texto plano; formato en `.changeset/README.md`): es lo
  que muestra "Novedades", nada inventado. Docs, tests, CI o refactors: sin changeset. El PR `chore(release): versión`
  lo abre la Action y lo mergea el dueño; ningún agente lo edita ni lo mergea.
- En **tu rama** commit y push sin pedir permiso (la aprobación es la revisión del PR).
  `git add` solo de los archivos de la unidad. Cambios pedidos en el PR: commits nuevos, sin amend.
- **Nunca** push a `main`, `gh pr merge` ni auto-merge: el merge lo hace el dueño.
- Tras el merge: `git switch main && git pull` (si el PR dejó de trackear archivos, el pull
  los borra: cópialos fuera antes).
- Nada destructivo: ni `reset --hard`, ni `push --force`, ni reescribir historia, ni borrar ramas ajenas.
- **Skill `git-flow`:** aplica en modo `pr` (ramas, Conventional Commits, changesets §2.1.3,
  prohibiciones). No aplican su pausa antes del commit ni su merge local. Sin `GIT_STATE.md`.

### Puertas de calidad (skills)

| Skill | Cuándo |
|---|---|
| `a11y` | Siempre que se toque UI, antes de pedir revisión. Objetivo axe-core limpio + checklist manual |
| `seo` | Al cerrar contenido/página. Ojo: `SITE_URL` = `https://world-flags-hazel.vercel.app` (`astro.config.mjs` + `public/robots.txt`) |
| `git-flow` | Al abrir y al cerrar cada unidad (con las excepciones de PR de arriba) |
| `orchestrate` | Llega una lista, o una fase se hace en olas (una ola por sesión) |
| `wave-qa` | Lo lanza `orchestrate` con la ola mergeada, antes de cerrarla |
| `design-qa` / `functional-qa` | Al cerrar una pantalla / un flujo completo |

**Entorno:** en este Windows Playwright falla a ratos (Chromium colgado, `innerHeight` = 0).
Si un agente de QA no puede ejecutar, su reporte es revisión de código, marcado como no verificado.

---

## Reglas no negociables

- **Cero valores mágicos de color/espaciado/radio/tamaño de letra.** Todo sale de tokens
  (`context/COLORS.md`, `DESIGN_TOKENS.md`, `TYPOGRAPHY.md` — escala `text-caption`…, D178).
  `text-[#6d5ef0]`, `mt-[13px]` o `text-[Xrem]` = falta un token o una decisión.
- **HeroUI antes que reimplementar** un primitivo. Los wrappers de `src/components/ui/`
  **conservan su API previa** (~17 consumidores).
- **Persistencia solo por `src/utils/learning-storage.ts`**, nunca `localStorage` directo.
  El store de Redux solo desde `store/slices/`; fuera, los hooks de `src/hooks/`.
- **WCAG 2.1 AA** mínimo. Contraste 4.5:1 texto normal, foco visible siempre,
  ningún estado solo por color, sin scroll horizontal a 320px.
- **Cero contenido final inventado** (copy, `alt` real, dominios, precios). Placeholder
  marcado + fila en `context/CONTENT_CHECKLIST.md`.
- **El SW (`public/sw.js`) cachea agresivo.** En dev, tras cada cambio: desregistrarlo,
  borrar `caches` y recargar. También puede servir bundle viejo tras un deploy.

---

## Cuándo parar y preguntar

- Falta un dato para decidir algo visual/UX → 3 opciones con pros/contras reales, y esperar.
- Algo choca con una regla de a11y → gana la regla, se escala.
- Se encuentra un bug en código ya cerrado → se reporta, no se arregla dentro de la unidad actual.
- Un archivo quedó sin uso → se señala, **no se borra**.

## Feedback para el kit

Cuando el dueño corrija algo hecho siguiendo el kit, pida lo mismo por segunda vez, haga a
mano un paso que el kit podría hacer, o el kit no diga qué hacer: fila en
`context/KIT_FEEDBACK.md` (o +1 en "Veces"). Sin preguntar; una línea de aviso. Si pide
"el informe para el kit", sigue el formato de ese archivo.
