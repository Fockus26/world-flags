# D109 · UX · `useRequiredUpdate` consulta al montar y en cada vuelta a primer plano (`visibilitychange`) · Implementado

**Resumen:** `useRequiredUpdate` consulta al montar y en cada vuelta a primer plano (`visibilitychange`); si `APP_VERSION` < mínima, `RequiredUpdateDialog` tapa el juego (también el tutorial) y se desmontan los avisos de `SystemSnackbars` (flotaban por encima)

`useRequiredUpdate` consulta al montar y en cada `visibilitychange` a
`visible` (una PWA puede pasar días abierta sin recargar), sin apilar
consultas. El hook vive en `FlagGame`: si `APP_VERSION` < mínima, monta
`RequiredUpdateDialog`, que tapa el juego (también el tutorial: se monta el
último), y desmonta `SystemSnackbars`. Los avisos de sistema van en `z-[300]`,
por encima del diálogo, y React Aria no los oculta (son región `status`): sin
esto quedaban visibles y pulsables ("Ahora no", "Ver novedades") sobre el
bloqueo (visto en el navegador).

**Rama:** `feat/actualizacion-obligatoria`

_Contexto común de la unidad (antes `25-actualizacion-obligatoria.md`): en D107._
