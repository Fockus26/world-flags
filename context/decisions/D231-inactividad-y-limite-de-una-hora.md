# D231 · Juego · Inactividad (45 s dormida, 90 s «¿Sigues ahí?», 5 min fuera) y límite de 1 h de tiempo real · Implementado

**Decisión del dueño:** detalle, aviso y salida; **1 h de tiempo real**.

- **Actividad:** teclado, puntero (movimiento, como mucho uno por segundo) y toque. Vale en todos los modos: Banderas, Capitales, Países (práctica y rush) y Repaso diario. La partida guiada del tutorial no vigila (`isGuarded={false}`).
- **45 s:** la partida «se duerme». Aparece una píldora decorativa con una bandera y «Zzz», que flota lento solo con `motion-safe` y queda estática con movimiento reducido. No bloquea nada y cualquier actividad la quita.
- **90 s:** «¿Sigues ahí?» (`alertdialog`, foco en «Sigo aquí»). La partida queda tapada (`invisible` + `aria-hidden`) y el reloj, en pausa. Solo se cierra con «Sigo aquí» o Escape: ni un clic fuera ni teclear o mover el ratón. La pausa cuenta desde los 90 s aunque se detecte tarde, y se fecha en `performance.now()` (`getAskPauseAt`), nunca restando una duración de `Date.now()`. Los primeros 90 s sí cuentan en la marca del rush, para que no sea una pausa gratis.
- **5 min sin actividad:** la partida se cierra, sin marca ni sesión. Lo aprendido ya está guardado (cada respuesta se guarda al momento). En la pantalla de inicio sale un aviso hasta «Entendido» o hasta empezar otra partida (`GameEndNoticeSnackbar`, en `SystemSnackbars`).
- **1 h de tiempo real** desde que empieza la partida, sin castigos ni pausas:
  - En el rush termina sin marca y con aviso.
  - En la práctica sale una vez «Llevas una hora practicando», con «Seguir practicando» o «Terminar» (sale como «Abandonar»). Si «¿Sigues ahí?» está abierto, espera a que se cierre.
- **Pestaña oculta o equipo suspendido:** se usa tiempo de pared (`Date.now()`) y se mira cada segundo y al volver a la pestaña (`visibilitychange`). Lo que pasó fuera se calcula de golpe: si pasaron más de 5 min, sale; si más de 90 s, pregunta, con la pausa desde los 90 s.
- **Estadísticas:** el tiempo inactivo no suma a `totalTimePlayedMs`. Se mide sobre el reloj de la partida (`getClockMs`), no en tiempo de pared: cuenta como inactiva una racha en la que el reloj avanzó 45 s o más sin actividad, y como mucho 90 s. Con el reloj parado por otra cosa (modal de abandonar, rendirse, bandera que no carga) no hay inactividad que descontar. Va en `idleMs` del resultado y del `SessionRecord`, que es opcional (los registros viejos no lo traen). `getPlayedMs` resta `idleMs` en `registerSessionOutcome` y en `aggregateSessionCounters`. La marca del rush (`elapsedMs`) no cambia.
- **Reloj:** las pausas nuevas (`idle`, `limit`, y `surrender` en el rush de Países) usan `utils/session-clock.ts` (D230). `CountriesPractice` y `CountriesRush` dejan sus contadores propios de pausa. Una pausa con efecto atrás nunca empieza antes de que acabara la anterior. Cada razón guarda desde cuándo pidió parar, y `resumeClock` admite un máximo: la transición de 900 ms del rush no se alarga si la página se congela, y si el aviso empezó más tarde, el reloj corre entre las dos. El cronómetro nunca muestra negativos. Al rendirse en el rush de Países, el tiempo final es el del momento de pulsar «Rendirme», el mismo que ya mostraba la cabecera. Antes seguía sumando hasta «Ver resultados».

**Por qué:** una partida abandonada seguía corriendo indefinidamente. En el rush daba marcas absurdas, y en la práctica inflaba el tiempo jugado. Un rush de horas no es una marca comparable.

**Alternativa descartada:** pausar sin preguntar (sería una pausa gratis en el ranking) y contar el tiempo con `performance.now()`, que en algunos sistemas no avanza con el equipo suspendido.

**QA (`functional-qa`, 2026-11-05):** 1 alto, 2 medios y 4 bajos, todos corregidos en el mismo PR. Alto: un salto de la hora del sistema restaba tiempo a la marca del rush (llegó a 2,74 s), por mezclar una duración de pared con `performance.now()`. Medios: el aviso seguía sobre la partida siguiente tapando «Abandonar»; `idleMs` contaba tiempo con el reloj ya parado. Bajos: transición congelada, clic fuera, foco y los dos avisos apilados. Repros en `.qa/repro/10…16`.

**Verificación:** `tests/unit/session-guard.test.ts` (umbrales, inactividad en el reloj, aviso tardío, límite) y `session-clock.test.ts` (pausa con efecto atrás). Sonda `.qa/inactividad-probe.mjs`, con el reloj simulado de Playwright sobre el build local.
