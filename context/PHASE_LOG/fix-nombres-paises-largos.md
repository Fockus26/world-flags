# fix/nombres-paises-largos (Y2, tanda 2026-09-26 c) — P29

- PR: https://github.com/Fockus26/world-flags/pull/49 · slot wt2 · changeset patch.
- `CountryPickerModal.tsx`: nombre del país `truncate` → `line-clamp-2 min-w-0 wrap-break-word`;
  etiqueta `items-start leading-snug`, casilla `mt-px` (alineada con la primera línea). D169 en
  `decisions/45-nombres-paises-largos.md`.
- Verificado: astro check (0 errores), biome del archivo, test (196 pass), build.
- **Sin verificar en navegador:** `astro dev` se pasa solo a segundo plano en entorno de agente y
  muere al terminar el comando; el sistema de permisos denegó arrancarlo sin esa detección.
  Pendiente: Caribe y Europa abiertos a 320 px y 34 rem, axe claro/oscuro, sin scroll horizontal.
- Copy nuevo: ninguno (el texto del changeset es el aprobado en el plan).
