# D103 · UX · `hover:` también al pulsar: `@custom-variant hover` · Implementado

**Resumen:** `hover:` también al pulsar: `@custom-variant hover` en `global.css` = `:hover` dentro de `@media (hover: hover)` + `:active` sin media. Sin hover pegado en táctil; los `active:` propios siguen ganando; el CSS de HeroUI no cambia. Se quitan los `active:` duplicados

```css
@custom-variant hover {
	@media (hover: hover) { &:hover { @slot; } }
	&:active { @slot; }
}
```

- Tailwind v4 envuelve `hover:` en `@media (hover: hover)` (Context7, guía de
  actualización), por eso al tocar no se veía nada. Redefinir la variante arregla
  todos los `hover:` y `group-hover:` de `src/` a la vez, en vez de sembrar `active:`.
- **Sin hover pegado:** el `:hover` sigue solo para ratón; en táctil solo aplica
  `:active`, que dura lo que el dedo. Quitar la media query (`@custom-variant hover
  (&:hover)`, lo que propone la guía) sí dejaría el hover pegado tras tocar.
- **Orden:** la variante redefinida conserva su sitio (antes que `focus-visible` y
  `active`), comprobado en el CSS compilado: los `active:` propios siguen ganando
  (p. ej. `RegionOption` `active:translate-y-0 active:scale-[0.98]` al pulsar).
- **HeroUI no se toca:** su CSS trae `:hover`/`[data-hovered]` dentro de su propia
  `@media (hover: hover)` y `:active`/`[data-pressed]` → `--button-bg-pressed`. Los
  botones ya mostraban el estado pulsado al tocar (medido: `data-pressed="true"` y
  fondo = `--button-bg-hover` en `contained`/`outline`/`text`; en `soft` un tinte
  algo más hondo, como ya estaba decidido en D003–D005, D013).
- Se quitan los `active:` duplicados que alguien había sembrado a mano
  (`UserSummary`, `AuthSection`, `AccountTab`, `Avatar`, `RegionOption`,
  `FlagDisplay`): ahora los cubre `hover:`.
- iOS Safari solo aplica `:active` si hay un `touchstart` escuchando; React ya
  registra sus eventos táctiles en la raíz. No verificado en un iPhone real.

**Rama:** `style/foco-y-toque`

_Contexto común de la unidad (antes `23-foco-y-toque.md`): en D101._
