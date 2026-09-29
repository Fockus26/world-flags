# D014 · Build · `astro.config` `optimizeDeps.include` para `@heroui/react` + `react-aria-components` + `framer-motion` · Implementado

**Resumen:** `astro.config` `optimizeDeps.include` para `@heroui/react` + `react-aria-components` + `framer-motion`, y React Compiler solo sobre `src/` — sin esto Vite reoptimiza a mitad de carga (504) y la isla no hidrata

**Decisión:** `astro.config.mjs`: `vite.optimizeDeps.include` = `react`, `react-dom`, `@heroui/react`, `react-aria-components`, `framer-motion`; `vite.resolve.dedupe` = `react`, `react-dom`; React Compiler solo sobre `src/` (implícito por defecto)
**Por qué:** Sin pre-empaquetar las deps grandes, Vite las descubre de forma perezosa y reoptimiza a mitad de carga → `504 Outdated Optimize Dep` y la isla de React no hidrata. `react-aria-components` (par de HeroUI) tiene que compartir la copia de React de la isla
