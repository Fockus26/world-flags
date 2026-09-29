# D081 · UX · Interruptor "Sonidos" en la pestaña Juego (dos `OptionTile`, como "Temporizador"), **activado por defecto** y **por dispositivo** · Implementado

**Resumen:** Interruptor "Sonidos" en la pestaña Juego (dos `OptionTile`, como "Temporizador"), **activado por defecto** y **por dispositivo** (`world-flags-sound-enabled` vía `learning-storage.ts`, no en `UserLearningData`). `useSoundPreference` con `useSyncExternalStore`: en vivo, sin recargar. La partida guiada solo lee (vigilado por test)

**Dónde.** Pestaña Juego de "Perfil y configuración", encima de "Tema": un
`Fieldset` "Sonidos" con dos `OptionTile` (Desactivados / Activados), el mismo
patrón que "Temporizador". No un `Switch` suelto: la pestaña entera son grupos
de radio con leyenda, y así se lee (y se navega con flechas) igual que el resto.

**Dónde se guarda.** Clave propia `world-flags-sound-enabled` en `localStorage`,
siempre vía `learning-storage.ts` (`getSoundEnabled` / `saveSoundEnabled`). Por
dispositivo, como la marca del tutorial (D071) y la versión vista (D058), no en
`UserLearningData`:

1. Es una preferencia del aparato (el móvil callado en el transporte, el
   portátil con sonido en casa), no de la cuenta.
2. En el blob costaría una columna nueva en Supabase con su SQL a mano.
3. El invitado también tiene que poder apagarlo.

**Activado por defecto.** Solo el valor `"false"` lo apaga: ausente, raro o
ilegible → activado. Es lo que pidió el dueño (que suene), y apagarlo está a un
toque en la configuración. La alternativa (apagado por defecto, se activa a
mano) sería más prudente con quien juega en público, pero casi nadie lo
descubriría.

**En vivo, sin recargar.** `useSoundPreference` usa `useSyncExternalStore`
(también escucha `storage`, para otras pestañas). Quien reproduce vuelve a leer
la preferencia en cada sonido, así que ninguna pantalla de partida necesita
suscribirse: apagarlo surte efecto en el siguiente sonido.

**La partida guiada solo lee.** `CountriesPractice` importa `playSound`, que
solo llama a `getSoundEnabled`. `saveSoundEnabled` y `useSoundPreference`
entran en la lista de imports prohibidos de `tests/unit/tutorial-sandbox.test.ts`,
y `utils/sound.ts` entra en los archivos que revisa.

**Rama:** `feat/sonidos`

_Contexto común de la unidad (antes `19-sonidos.md`): en D080._
