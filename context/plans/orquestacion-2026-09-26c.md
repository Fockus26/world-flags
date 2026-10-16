# Orquestación 2026-09-26 (c): P28–P32 + copy aprobado — brief y prompts

> Una sola ola, tres unidades. **Reglas: las 13 del brief `context/plans/orquestacion-2026-09-26.md`
> ("Reglas de la tanda")**, léelas primero. Pedido de cada P en `context/plans/pendientes.md`.
> Carpeta principal: `C:\Users\Admin\Documents\Work\world-flags\`.

Decisiones del dueño: dev server autorizado en tu slot (si el sistema de permisos lo deniega, no lo
intentes por otra vía; márcalo "sin verificar en navegador"). **Todo el copy de `CONTENT_CHECKLIST.md`
está aprobado** (2026-09-26). P29 = dos líneas (`line-clamp-2`), decidido por el orquestador.

| # | Rama | Pendientes | Decisiones | Changeset |
|---|---|---|---|---|
| Y1 | `fix/tema-y-reloj` | P28, P31, P32, P30 | `decisions/44-tema-y-reloj.md`, D166–D168 | patch |
| Y2 | `fix/nombres-paises-largos` | P29 | `decisions/45-nombres-paises-largos.md`, D169 | patch |
| Y3 | `docs/copy-aprobado` | — | ninguna | ninguno |

Archivos: Y1 = `CountriesPractice.tsx`, `ui/OptionTile.tsx`, `styles/heroui-theme.css`,
`decisions/37-ranking-podio.md`. Y2 = `CountryPickerModal.tsx`. Y3 = solo comentarios
`⚠️ Copy provisional …` en `src/` (puede tocar líneas de comentario en archivos de Y1/Y2: solo esas
líneas, nada más, para que git fusione solo).

## Y1 — `fix/tema-y-reloj`
- **P28:** `CountriesPractice.tsx` (~l. 125, ~147): `performance.now()` en vez de `Date.now()`, como
  D132/D165. Mismo tiempo final.
- **P31:** quitar `color` de la transición de `OptionTile` como D159 (no cambiar su API). Medir
  contraste tras cambiar de tema con la pestaña sin pintar (el caso de D159).
- **P32:** bloque `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])` en
  `heroui-theme.css`, igual que `variables.css`. Verificar con `data-theme` quitado y emulación oscura:
  HeroUI y app en el mismo tema; axe limpio.
- **P30:** actualizar "Lo que esto no cubre" de `decisions/37-ranking-podio.md` enlazando a
  `decisions/42-modales-ancho-320.md`.
- Changeset patch — "En tema oscuro del sistema, los ajustes y botones ya no aparecen un instante en
  claro, y el tiempo de la práctica de Países no se descuadra si cambia la hora."

## Y2 — `fix/nombres-paises-largos`
- **P29:** en `CountryPickerModal.tsx`, los nombres largos de país pasan a **dos líneas como máximo**
  (`line-clamp-2`, sin `truncate`), a 320 px y a 34 rem. Que la rejilla no quede descuadrada (alineación
  de las casillas arriba) y la altura de las filas sea razonable. Con 3+ líneas, "…" en la segunda.
  Verificar Caribe y Europa abiertos; axe; sin scroll horizontal.
- Changeset patch — "El selector de países muestra los nombres largos completos en dos líneas."

## Y3 — `docs/copy-aprobado`
- El dueño aprobó todo el copy provisional. Quita de `src/` los marcadores `⚠️ Copy provisional
  (CONTENT_CHECKLIST.md #NN)` (y variantes), dejando el resto del comentario si explica algo; si el
  comentario solo era el marcador, bórralo. **No cambies ningún texto visible ni código.** Busca también
  en `README.md`/`docs/` referencias a "copy provisional" que describan filas ya aprobadas.
- `git diff` debe contener solo comentarios. Verificación: astro check, biome, test, build.
- Sin changeset (quien juega no nota nada). Sin decisión.
