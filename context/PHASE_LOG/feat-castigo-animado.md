# feat/castigo-animado (W1, tanda 2026-09-26) — PR #35

- P10: "+10 s"/"+20 s" junto al cronómetro del rush (`PenaltyBadge`), cronómetro que salta con `zoom-in-125`, aviso de fallo sin el castigo. Un badge por castigo, vida por temporizador (900 + 300 ms). `aria-live="polite"` con "10/20 segundos de castigo".
- P15 (parte de W1): `Session.tsx` mide el reloj con `performance.now()` (inicio, intervalo, castigos, pausa entre tarjetas, modal de abandonar). `DailyPractice.tsx` sigue con `Date.now()` (fuera de la unidad).
- Integrado `main` (#33): `package.json`, `CHANGELOG.md`, `public/sw.js` devueltos a `main`; changeset patch `castigo-animado.md`.
- Decisiones D132–D134 (`decisions/32-castigo-animado.md`). D132 corregida: la partida guiada es siempre de práctica, sin castigo (el wip decía que se veía allí).
- Verificado en navegador (dev 4301, invitado): Banderas y Capitales, fallo y skip, dos skips seguidos, movimiento reducido, aria-live, 320 px sin scroll, contraste 9,31:1 oscuro / 5,55:1 claro, axe 0 violaciones claro y oscuro.
- Fila 43 de CONTENT_CHECKLIST (añadir a mano): "10 segundos de castigo" / "20 segundos de castigo" (`formatPenaltyAnnouncement`, `utils/rush-penalty.ts`), anuncio del lector de pantalla al castigar en competitivo. Copy provisional.
- `applyPenalty` (Session.tsx) es el punto único del castigo: W4 engancha ahí el sonido `penalty`.
- Checks: astro check 0 errores, biome limpio en lo tocado, test 169 pass / 1 skip, build OK.
