# fix/foco-transicion-y-pulsado — W7 de la tanda 2026-09-24 (P3, P4, P6)
Versión 2.2.1 (PATCH). PR #32. Decisiones D129–D131 en `context/decisions/31-foco-transicion-pulsado.md`.
- P3 (D129): `.transition-colors` redefinida en `@layer utilities` de `global.css` sin `outline-color` (`@utility` NO sirve: se funde con la de Tailwind).
- P4 (D130): `[data-pressed="true"]` en `.tabs__tab`, `.select__trigger`, `.accordion__trigger` con el aspecto de su hover; la variante `hover` de D103 suma `&[data-pressed="true"]`.
- P6 (D131): skip link dentro de `<nav aria-label="Accesos directos">` en `Layout.astro`.
- DESIGN_RULES.md: regla de toque ampliada y regla nueva de `transition-colors`.
Verificado: astro check, biome, 138 tests, build; navegador (transiciones activas medidas con getAnimations), emulación móvil, axe 0 violaciones (region reproducido antes y limpio después).
No verificado: táctil real; anillo a ojo.
Bug visto: skip link enfocado en claro 3,96:1 (P16 en pendientes).
