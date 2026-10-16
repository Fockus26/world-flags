# style/animaciones-configuracion (W8, tanda 2026-09-26) — PR #43

P19, solo la ★ de Configuración. Slot wt3, puerto 4303.

- RegionOption: sube 2 px + shadow-md al pasar/enfocar, 0,98 al pulsar; anillo de la
  nota a `ring-2` (antes `shadow-[0_0_0_2px_…]`) para sumar la sombra. Pop al marcar.
- GameTypeToggle: opciones no elegidas suben 2 px + shadow-sm; 0,98 al pulsar; píldora
  en dos capas (fuera translateX, dentro relleno + pop con `key` contador).
- OptionTile (API igual): shadow-sm, 0,98, pop. No sube: vive pegada a overflow-hidden
  (AutoHeight, paneles del modal) y los 2 px le cortaban el borde.
- Pop `zoom-in-95` solo desde el onChange del usuario; todo con `motion-safe:`.
- Decisiones D157–D158 (`context/decisions/40-animaciones-configuracion.md`). Changeset patch.
- Fila 51 de CONTENT_CHECKLIST: sin usar (no hay copy nuevo en la UI).
- Visto fuera: las OptionTile de la columna derecha del modal de configuración quedan a
  0 px del borde derecho del overflow-hidden del panel; su anillo de foco se recorta
  por ese lado (preexistente).
