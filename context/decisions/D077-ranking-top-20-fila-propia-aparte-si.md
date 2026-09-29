# D077 · UX · Ranking top 20 (fila propia aparte si estás fuera, con "(tú)") y 5 filas skeleton · Implementado

**Resumen:** Ranking top 20 (fila propia aparte si estás fuera, con "(tú)") y 5 filas skeleton con la forma real + `aria-busy` + `LoadingAnnouncer`. Modal a `min(30rem,92vw)`

`TOP_COUNT` 5 → 20; la fila propia sigue debajo de un separador si estás fuera
(ahora es una lista con `start` = tu puesto). El modal se ensancha a
`min(30rem, 92vw)` para el avatar; con 20 filas hace scroll dentro del propio
diálogo (`ui/Modal`, 90dvh). La cabecera y el selector se quedan arriba, en el
flujo: fijarlos (`sticky`) exigía casar el relleno del diálogo de HeroUI con
valores sueltos.

"Cargando…" pasa a 5 filas skeleton con la forma de las reales (puesto,
avatar redondo, nombre, tiempo), hechas con `ui/Skeleton` y texto de referencia
invisible: mismo alto por fila, así que al llegar los datos no se mueve nada de
lo que ya estaba (cuántas filas llegarán no se sabe; cinco es el alto del
ranking de antes). La lista va con `aria-busy` mientras carga y un
`LoadingAnnouncer` fuera de ella dice "Cargando el ranking…" / "Ranking
cargado." solo si el skeleton llegó a verse (umbral de 300 ms, D042).

Tu fila ya no se distingue solo por el color: lleva "(tú)" (copy provisional,
`CONTENT_CHECKLIST.md` #27).

**Rama:** `feat/ranking-nueva-regla`

_Contexto común de la unidad (antes `18-ranking-nueva-regla.md`): en D075._
