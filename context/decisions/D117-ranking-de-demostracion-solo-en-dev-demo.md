# D117 · Herramientas · Ranking de demostración solo en dev: `?demo-ranking` + `import.meta.env.DEV`, `import()` dentro de la rama `DEV` · Implementado

**Resumen:** Ranking de demostración solo en dev: `?demo-ranking` + `import.meta.env.DEV`, `import()` dentro de la rama `DEV` (fuera de `dist/`). 30 personas con semilla fija por scope, tu fila en el 27 (opciones `lento`, `top`, `sin-mi`, número). Nada en la base

`configuration/leaderboard-demo.ts` genera un ranking falso para ver cómo luce
con mucha gente, sin tocar `leaderboard_entries` (tabla de producción, pública).

- **Activación**: `import.meta.env.DEV` **y** `?demo-ranking` en la URL.
  `LeaderboardModal.loadLeaderboard` hace un `import()` del archivo dentro de la
  rama `DEV`: en producción Vite sustituye `DEV` por `false`, la rama se elimina y
  el archivo no se empaqueta (comprobado buscando sus cadenas en `dist/`).
  `cloud-storage.ts` no se toca.
- **Datos**: 30 personas con nombres variados (nombre, nombre + inicial, apodos),
  tiempos verosímiles por juego ordenados, avatares de los 5 estilos y ~12 % sin
  avatar (se ve la inicial, D078). Generador con semilla fija por scope: cada
  juego tiene su ranking, igual en cada recarga.
- **Tu fila**: en la demo tu fila es una de las falsas ("Tu nombre", id
  `demo-ranking-tu`), tengas sesión o no, para poder verla como invitado. Por
  defecto en el puesto 27 (fuera del top 20, bajo el separador).
- **Opciones** (separadas por comas): `lento` (3 s de respuesta en vez de 250 ms,
  para ver el skeleton y la altura), `top` (tu fila en el puesto 4), `sin-mi` (sin
  tu fila), y un número 0–30 de personas. Ej.: `?demo-ranking=1,sin-mi,lento`
  para una sola fila con red lenta.
- **Nada en la base**: no hay SQL de inserción ni de borrado.

Alternativas del pendiente P8, descartadas por el dueño: filas reales en un scope
de prueba, o insertarlas en los scopes reales y borrarlas después.

**Rama:** `feat/ranking-skeleton-demo`

_Contexto común de la unidad (antes `27-ranking-skeleton-demo.md`): en D115._
