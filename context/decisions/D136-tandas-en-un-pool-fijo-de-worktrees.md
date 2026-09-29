# D136 · Flujo · Tandas en un pool fijo de worktrees (`..\world-flags-wt\wtN`, `wt.ps1` de `orchestrate`) · Implementado

**Resumen:** Tandas en un pool fijo de worktrees (`..\world-flags-wt\wtN`, `wt.ps1` de `orchestrate`): `node_modules` persiste, `.env*` copiados, puerto 4300+N, `wt free` tras el merge. Sin `isolation: "worktree"`

`orchestrate` ya no crea ni borra un worktree por unidad (`isolation: "worktree"`):
usa un pool fijo `..\world-flags-wt\wt1..wtN` que gestiona `wt.ps1` de la skill
(`init`, `take`, `free`, `status`). Cada slot conserva su `node_modules` (solo
reinstala si cambió `bun.lock`), trae los `.env*` copiados y usa el puerto `4300 + N`.
`context/` local no se copia: se lee y escribe en la carpeta principal. Tras el merge de
cada PR, el orquestador libera el slot con `wt free`. `wt init` lo corre `orchestrate`
la primera vez que lanza una tanda.

**Rama:** `chore/changesets`

_Contexto común de la unidad (antes `33-changesets.md`): en D135._
