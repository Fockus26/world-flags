# D001 · HeroUI · Migrar toda la UI a **HeroUI v3** (`@heroui/react` 3.2.x) sobre Tailwind v4, con wrappers que conservan la API previa · Implementado

**Decisión:** Migrar toda la UI a HeroUI v3 (`@heroui/react` 3.2.x + `@heroui/styles`) sobre Tailwind v4 CSS-first
**Por qué:** Lo pidió el dueño; `theme.css` ya tenía la escala de radios comentada como "HeroUI-ish". HeroUI v3 es nativo de Tailwind v4 (`@import "@heroui/styles"`, sin plugin) y usa `[data-theme]`, el mismo selector que ya tenía la app

## Sin ID propio, de la misma unidad

**Decisión:** Config modal: `AnimatePresence` casero de tabs → HeroUI `Tabs` (roving tabindex, flechas, `aria-controls` de React Aria)
**Por qué:** Accesibilidad correcta sin reimplementar el patrón APG

**Decisión:** `Select` casero (`role=combobox` + `aria-activedescendant`) → HeroUI `Select`+`ListBox`
**Por qué:** React Aria ya trae el patrón listbox accesible
