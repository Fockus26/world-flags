# D080 · UX · Sonidos de acierto, fallo, país encontrado y logro **sintetizados con Web Audio** (`utils/sound.ts`, `playSound`) · Implementado

**Resumen:** Sonidos de acierto, fallo, país encontrado y logro **sintetizados con Web Audio** (`utils/sound.ts`, `playSound`): 0 KB, sin red, sin licencias. Un `AudioContext` perezoso, dentro del gesto; `document.hidden`, sin Web Audio o error → silencio. Logros: un arpegio por tanda, nunca en la pasada silenciosa ni por logros sellados en otro dispositivo

**Qué es.** `src/utils/sound.ts` expone una sola función, `playSound(name)`, con
cuatro sonidos:

| Sonido | Cuándo | Forma | Duración |
|---|---|---|---|
| `correct` | acierto | dos notas ascendentes (Mi5–La5, cuarta justa), triángulo + octava suave | ~0,3 s |
| `incorrect` | fallo o salto | dos notas graves descendentes (Re4–La3) en seno, la última se desliza un poco hacia abajo | ~0,3 s |
| `found` | país encontrado en el rush de Países | un solo toque del La5 del acierto, más corto y más suave | ~0,1 s |
| `achievement` | tanda de logros nuevos | arpegio de Do mayor (Do–Mi–Sol–Do) | ~0,4 s |

Todas las notas llevan envolvente (ataque de 8 ms, caída exponencial) para que no
hagan "clic", y pasan por una ganancia general baja (0,35).

**Por qué sintetizados y no archivos de audio:**

- **0 KB de assets.** Nada que añadir al precache del SW (D054) ni que versionar.
- **Funcionan sin red**, que es la mitad de la gracia de la PWA (D050–D054). Un
  archivo que no llegó a cachearse sería silencio justo sin conexión.
- **Sin licencias** que revisar ni atribuciones que mostrar.
- Se ajustan en código (tono, duración, volumen) sin editar audio.

La alternativa (archivos `.mp3`/`.ogg` de un banco libre) suena más "producida",
pero cuesta peso, precache y una licencia que aprobar. Si algún día se quiere,
`playSound` es el único punto que cambia.

**Contexto y política de reproducción automática.** Un único `AudioContext`,
creado la primera vez que hace falta. `playSound` se llama dentro del manejador
del gesto que lo provoca (enviar, calificar, escribir), que es donde el navegador
deja arrancar el audio. Si el contexto está suspendido se pide `resume()`; si no
se reanuda en 150 ms, ese sonido se descarta — fuera de un gesto `resume()` puede
quedarse esperando al siguiente toque y entonces sonaría todo lo acumulado de
golpe.

**Nunca rompe el juego.** Sin Web Audio, con la pestaña oculta
(`document.hidden`), con el contexto bloqueado o ante cualquier error: no suena y
no pasa nada más.

**Logros: una vez por tanda.** Suena en `AchievementsEffects`, justo después de
encolar los avisos, así que varios logros juntos son un solo arpegio. Además, un
segundo arpegio que llegue mientras suena el primero (un logro que desbloquea
otro en la pasada siguiente) se descarta. El arpegio espera a que termine el
sonido anterior (el acierto que lo desbloqueó) en vez de pisarlo.

**Nunca suena** en la pasada silenciosa de la primera carga (la siembra
retroactiva, o lo que trae un login) ni por logros que llegan de otro
dispositivo: esos llegan ya sellados y no están en `getNewlyUnlocked`. Si una
sincronización trajera progreso que cruza un umbral no sellado en el otro
dispositivo, sonaría igual que ya sale su aviso: el sonido sigue al aviso.

**Rama:** `feat/sonidos`

## Contexto común de la unidad (antes `19-sonidos.md`)

> Unidad `feat/sonidos` (1.3.0). Pedido del dueño, literal: *"Agregar sonidos al
> responder correcta e incorrectamente, también en los logros."*
