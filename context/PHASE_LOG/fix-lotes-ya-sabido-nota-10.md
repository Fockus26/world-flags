# fix/lotes-ya-sabido-nota-10 — W1 tanda 2026-10-12 · PR #69

- "Ya sabido" en Aprender por lotes = continente 10/10 + SM2 ≥2 (D189; D186 ya era del #67).
- `reconcileLearningPathKnown` (solo degrada, idempotente) al leer; se guarda al empezar sesión del recorrido o al acertar. `updatedAt` intacto.
- `mergeSlot` mismo id: intersección de `knownCodes`, unión de `codes`.
- Copy del modal: "Lo que ya sabías (con su continente en 10/10) cuenta como consolidado." → fila 50 del checklist (sigue pendiente, añadir esta frase).
- Verificado: tests puros (29 en learning-path), Playwright en :4301 como invitado (recorrido viejo se reabre; uno nuevo del Caribe 3/10 no sale completo).
- Changeset: `.changeset/lotes-ya-sabido-nota-10.md` (patch).
