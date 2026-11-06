# D231 · Juego · Inactividad (45 s dormida, 90 s «¿Sigues ahí?», 5 min fuera) y límite de 1 h de tiempo real · Implementado

**Decisión del dueño:** detalle, aviso y salida; **1 h de tiempo real**.

- **Actividad:** teclado, puntero (movimiento, como mucho uno por segundo) y toque. Vale en todos los modos: Banderas, Capitales, Países (práctica y rush) y Repaso diario. La partida guiada del tutorial no vigila (`isGuarded={false}`).
- **45 s:** la partida «se duerme». Aparece una píldora decorativa con una bandera y «Zzz», que flota lento solo con `motion-safe` y queda estática con movimiento reducido. No bloquea nada y cualquier actividad la quita.
- **90 s:** «¿Sigues ahí?» (`alertdialog`). La partida queda tapada (`invisible` + `aria-hidden`) y el reloj, en pausa. Solo se cierra con «Sigo aquí» o Escape: teclear o mover el ratón no basta. La pausa cuenta desde los 90 s aunque se detecte tarde. Los primeros 90 s sí cuentan en la marca del rush, para que no sea una pausa gratis.
- **5 min sin actividad:** la partida se cierra, sin marca ni sesión. Lo aprendido ya está guardado (cada respuesta se guarda al momento). En la pantalla de inicio sale un aviso hasta «Entendido» (`GameEndNoticeSnackbar`, en `SystemSnackbars`).
- **1 h de tiempo real** desde que empieza la partida, sin castigos ni pausas:
  - En el rush termina sin marca y con aviso.
  - En la práctica sale una vez «Llevas una hora practicando», con «Seguir practicando» o «Terminar» (sale como «Abandonar»).
- **Pestaña oculta o equipo suspendido:** se usa tiempo de pared (`Date.now()`) y se mira cada segundo y al volver a la pestaña (`visibilitychange`). Lo que pasó fuera se calcula de golpe: si pasaron más de 5 min, sale; si más de 90 s, pregunta, con la pausa desde los 90 s.
- **Estadísticas:** el tiempo inactivo no suma a `totalTimePlayedMs`. Cuenta como inactiva una racha sin actividad que llega a 45 s, y solo hasta los 90 s, porque desde ahí el reloj ya está en pausa. Va en `idleMs` del resultado y del `SessionRecord`, que es opcional (los registros viejos no lo traen). `getPlayedMs` resta `idleMs` en `registerSessionOutcome` y en `aggregateSessionCounters`. La marca del rush (`elapsedMs`) no cambia.
- **Reloj:** las pausas nuevas (`idle`, `limit`, y `surrender` en el rush de Países) usan `utils/session-clock.ts` (D230). `CountriesPractice` y `CountriesRush` dejan sus contadores propios de pausa. Una pausa con efecto atrás nunca empieza antes de que acabara la anterior. Al rendirse en el rush de Países, el tiempo final es el del momento de pulsar «Rendirme», el mismo que ya mostraba la cabecera. Antes seguía sumando hasta «Ver resultados».

**Por qué:** una partida abandonada seguía corriendo indefinidamente. En el rush daba marcas absurdas, y en la práctica inflaba el tiempo jugado. Un rush de horas no es una marca comparable.

**Alternativa descartada:** pausar sin preguntar (sería una pausa gratis en el ranking) y contar el tiempo con `performance.now()`, que en algunos sistemas no avanza con el equipo suspendido.

**Verificación:** `tests/unit/session-guard.test.ts` (umbrales, inactividad en el reloj, aviso tardío, límite) y `session-clock.test.ts` (pausa con efecto atrás). Sonda `.qa/inactividad-probe.mjs`, con el reloj simulado de Playwright sobre el build local.
