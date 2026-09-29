# D133 · UX · Un badge por castigo (`key` = id creciente) que vive por temporizador (900 ms + 300 ms de salida), no por `animationend` · Implementado

**Resumen:** Un badge por castigo (`key` = id creciente) que vive por temporizador (900 ms + 300 ms de salida), no por `animationend`: con movimiento reducido (`motion-reduce:animate-none`) aparece y desaparece sin moverse

- `Session` guarda una lista `penalties: { id, penaltyMs }[]` con `id`
  creciente (ref). Cada badge se pinta con `key={id}`: dos castigos seguidos no
  se pisan, cada uno arranca su propia animación y el anterior termina su
  salida mientras entra el nuevo (el hueco mínimo entre dos es la pausa de
  900 ms del rush; el badge vive 900 + 300 ms, así que se solapan como mucho en
  la salida del primero).
- La vida del badge la marcan **temporizadores** (900 ms visible, 300 ms de
  salida, luego `onDone` lo quita de la lista), no `animationend`. Así, con
  movimiento reducido (`motion-reduce:animate-none`) aparece, se queda el mismo
  tiempo y desaparece, sin moverse. Con eventos de animación, al anular la
  animación no llegaría ningún `animationend` y el badge no se iría.
- `onDone` se lee de un ref: el padre renderiza cada 100 ms (cronómetro) con una
  flecha nueva y, como dependencia del efecto, reiniciaría los temporizadores
  sin parar.

**Rama:** `feat/castigo-animado`

_Contexto común de la unidad (antes `32-castigo-animado.md`): en D132._
