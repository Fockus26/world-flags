# D021 · Persistencia · Ids de logro persistidos como `string`, no `AchievementId` · Implementado

**Resumen:** Ids de logro persistidos como `string`, no `AchievementId`: un cliente viejo (SW cachea agresivo) borraría ids de versiones nuevas de forma irreversible

`achievements` es `Record<string, AchievementUnlock>`, no
`Record<AchievementId, …>`. El service worker cachea agresivo, así que un cliente
viejo puede leer una fila con logros de una versión más nueva; si el normalizador
filtrara por los ids conocidos, los **borraría** en el siguiente push — y con
merge por unión, borrar es irreversible. Se estrecha a `AchievementId` solo al
buscar en el catálogo.

_Contexto común de la unidad (antes `05-logros.md`): en D016._
