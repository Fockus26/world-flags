# D060 · Versionado · Arranca en **1.0.0** (dueño). Cada PR con cambio visible sube la versión y añade su entrada · Implementado

**Resumen:** Arranca en **1.0.0** (dueño). Cada PR con cambio visible sube la versión y añade su entrada (cada merge se despliega: sin "Sin publicar"). MAJOR rompe progreso o quita algo, MINOR función nueva, PATCH arreglos; docs/tests/CI no suben

- Arranca en **1.0.0** (decisión del dueño): la app ya está en producción con
  progreso real de usuarios; la FAQ de semver dice que en ese caso ya debería
  ser 1.0.0. `0.x` habría vaciado de significado la regla de abajo.
- **Cada PR con un cambio que nota quien juega sube la versión y añade su
  entrada** en el mismo PR. Cada merge a `main` se despliega, así que cada PR
  es una publicación: una sección "Sin publicar" nunca llegaría a existir en
  producción, y la app estaría mostrando el número anterior con código nuevo.
  Por eso el formato no la admite (el test la rechaza).
- **MAJOR**: rompe la compatibilidad con el progreso guardado (algo que un
  cliente anterior no puede leer, un reinicio del ranking) o quita algo que la
  gente usaba. **MINOR**: una función nueva visible (un modo, una opción, logros
  nuevos). **PATCH**: arreglos y ajustes sin función nueva.
- PRs sin cambio visible (docs, tests, CI, refactor, tooling) no suben la
  versión ni añaden entrada.
- Fecha de la entrada: la del día en que se abre el PR. Si dos PRs abiertos a
  la vez suben la misma versión, el segundo en mergearse renumera la suya al
  actualizarse desde `main` (el conflicto en `package.json` y `CHANGELOG.md`
  lo hace evidente).
- Sin etiquetas de git por ahora: el enlace de cada versión en el changelog es
  opcional. Si el dueño quiere etiquetas `vX.Y.Z` al mergear, no cambia nada
  de lo de arriba.

Las reglas para quien contribuye están en `CONTRIBUTING.md` › *Changelog and
versioning* y en `CLAUDE.md`.

**Nota de estado:** subir versión en cada PR lo reemplaza D135

_Contexto común de la unidad (antes `15-changelog-y-versionado.md`): en D057._
