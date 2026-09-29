# D073 · UX · Los ajustes (modo, orden, dificultad, temporizador) se enseñan **funcionando dentro del recorrido**, no resaltando la UI real · Implementado

**Resumen:** Los ajustes (modo, orden, dificultad, temporizador) se enseñan **funcionando dentro del recorrido**, no resaltando la UI real: `PageFlip` deja la vista anterior montada en su ranura oculta y transforma en 3D, así que medir posiciones o buscar por selector es frágil. El modo es vista previa (el ejemplo siempre es Práctica) y repite el aviso de `GameTab`. `ui/Modal` gana `isDismissable` y `CountriesPractice` gana `exitDescription`

El brief dejaba elegir entre abrir `ConfigurationModal` dentro del recorrido y
señalar sus controles, o explicarlos sin abrirlo. Se eligió una tercera:
**montarlos dentro del recorrido, reales y tocables**, sobre la configuración del
sandbox — lo que se elija es con lo que arranca la partida de ejemplo, y no toca
la configuración guardada del usuario.

**Por qué no resaltar la UI real.** Las vistas del juego viven dentro del giro 3D
de `PageFlip`, que deja montada la vista anterior en su ranura oculta y aplica
`rotateY`/`perspective` al contenedor. Un overlay que buscara por selector
encontraría dos nodos, y medir posiciones (`getBoundingClientRect` sobre un
elemento transformado en 3D) devuelve rectángulos proyectados. Es frágil de una
forma que no se nota hasta que se rompe. Enseñar los controles en su sitio,
funcionando, no necesita medir nada; el paso de cierre dice dónde viven.

**Qué se enseña:**

- **Modo de juego** (paso propio). El selector es una **vista previa**: no entra
  en la configuración del sandbox. La partida de ejemplo siempre es Práctica —
  tres tarjetas no enseñan una carrera contra el reloj — y el paso lo dice en vez
  de prometer otra cosa. El aviso del competitivo repite lo que ya dice `GameTab`:
  orden aleatorio y dificultad difícil, no ajustables. El tutorial **no puede
  prometer lo contrario**.
- **Orden, dificultad y temporizador** (paso propio). Sí entran en el sandbox.

`TutorialSettings` usa los mismos primitivos (`Fieldset`, `OptionTile`,
`AutoHeight`) y **las mismas constantes** que `GameTab` (`GAME_MODES`,
`GAME_MODE_LABELS`, `TIMER_DURATIONS`), no una copia de sus etiquetas: añadir un
modo o una duración allí aparece aquí solo. Los `name` de los radios sí son
propios (`tutorial-*`), para no agruparse con los del modal si coexisten en el
DOM (que es lo que pasa al reabrirlo desde el pie).

`ui/Modal` gana `isDismissable?: boolean` (por defecto `true`, los consumidores
existentes no cambian): el recorrido no se pierde con un clic fuera. **Escape
sigue cerrando** — `isKeyboardDismissDisabled` no se toca.

`CountriesPractice` gana `exitDescription?: string`. El aviso de abandonar de
siempre dice que "el progreso de esta partida se perderá", y en la partida
guiada eso sería mentira justo en lo único que el tutorial promete.

**Rama:** `feat/tutorial-inicial`

_Contexto común de la unidad (antes `17-tutorial-inicial.md`): en D071._
