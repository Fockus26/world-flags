# D160 · Accesibilidad · `AutoHeight` abierto: su capa `overflow-hidden` lleva `p-1 -m-1` (4 px para el anillo de foco: outline 2 + separación 2) · Implementado

**Resumen:** `AutoHeight` abierto: su capa `overflow-hidden` lleva `p-1 -m-1` (4 px para el anillo de foco: outline 2 + separación 2); cerrado sin ellos para no dejar asomar el contenido. Mismas posiciones y alto animado. Arregla el anillo recortado de las `OptionTile` del modal de configuración (P27); los paneles de pestañas ya tenían 8 px de HeroUI

**Decisión:** `AutoHeight` deja 4 px de hueco para el anillo de foco: abierto, su capa `overflow-hidden` lleva `p-1` y `-m-1` (el margen negativo devuelve el contenido a su sitio y la pista de la rejilla mide lo mismo); cerrado, ninguno de los dos
**Por qué:** El anillo de `OptionTile` (outline 2 px + separación 2 px) salía 4 px por fuera y ese `overflow-hidden` lo cortaba en "Orden", "Temporizador", "5 s / 10 s / 15 s" y "Dificultad" del modal de configuración, por los lados, arriba o abajo (P27). Los paneles de pestañas del modal no recortaban: HeroUI les da 8 px de relleno. Cerrado sin relleno porque, con él, asomarían 4 px del contenido plegado. Medido: posiciones de todas las opciones y alto de cada `AutoHeight` idénticos con y sin el hueco. Alternativa: `overflow-clip-margin` (no lo soporta Safari y en cerrado dejaría asomar el contenido)

**Rama:** `fix/contraste-foco-configuracion`

_Contexto común de la unidad (antes `41-contraste-foco-configuracion.md`): en D159._
