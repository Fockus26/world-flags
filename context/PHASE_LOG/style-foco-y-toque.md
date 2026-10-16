# style/foco-y-toque (W7) — PR #24, 2.0.1

- Decisiones D101–D104 (D105 libre), `context/decisions/23-foco-y-toque.md`.
- Foco: anillo del color del elemento (Button → `--color-<c>-hover`; RegionOption → `--app-score-ring`; países → secondary-hover; racha → primary-hover; neutros → surface-soft). Peor caso 3,88:1 claro / 7,99:1 oscuro. Añadidos anillos que faltaban (skip link, casillas/desplegables del selector, "Gestionar sesión →", X de avisos).
- Toque: `@custom-variant hover` = hover media + `:active`; quitados `active:` duplicados en 6 archivos.
- Verificado: Tab real + contraste medido (principal, config, selector, sesiones, resultados), emulación táctil, axe claro/oscuro 0 (salvo OptionTile, lo arregla #21), 320 px, check/biome/test 126/build.
- No verificado: iPhone real, pestaña login, axe con modales ranking/logros/selector abiertos.
- CONTENT_CHECKLIST fila 35: no hace falta.
- Acción al mergear: rebasar CHANGELOG/versión si #20/#21/#23 entran antes.
- Bugs de paso (sin arreglar): `transition-colors` anima outline-color (150 ms); Tabs/Select/Accordion de HeroUI sin hover al tocar.
