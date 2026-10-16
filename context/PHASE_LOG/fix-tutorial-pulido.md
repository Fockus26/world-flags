# fix/tutorial-pulido (W4) — PR #19, 1.2.1, pendiente de revisión

(Redactado por el orquestador desde el informe de W4: el aislamiento del worktree no le dejó escribir aquí.)

Hecho:
- D091: sin "Saltar tutorial" en el último paso; la cabecera conserva 44 px de alto.
- D092: "partida de ejemplo" dicho una sola vez, en el aviso que se ve mientras se juega (`demoBanner` ampliado: progreso, racha, ranking, "Puedes fallar sin miedo"). Bienvenida, ajustes, nota de competitivo, botones, final y aviso de abandonar ya no lo repiten.
- D090: mientras se juega, el diálogo ocupa el lugar de la página principal. `ui/Modal` gana la prop opcional `fillViewport` (apagada por defecto) + `max-w-none`; mismo padding y topes de alto (45rem/50rem) que la partida real; título solo para lectores de pantalla; cabecera en una fila (aviso + "Saltar tutorial"); transición de ancho/padding de 300 ms.
- D093–D094 sin usar.

Medidas (área de juego, partida normal vs ejemplo): 320×568 307×555 / 307×482 · 390×844 378×720 / 378×720 · 768×1024 727×800 / 727×800 · 1280×800 928×768 / 928×720 · 1440×900 928×800 / 928×800. Ancho siempre igual; en pantallas bajas el ejemplo pierde la fila de cabecera (48–73 px), sin desbordar. "Comprobar" visible a 320×568.

Verificado (4334, invitado): seis pasos + ejemplo completo; aviso de abandonar; foco al título / a la respuesta / de vuelta a "Cómo se juega" con Escape; sin scroll horizontal a 320; localStorage byte a byte igual (D072); axe 0 jugando y en pasos 1, 2, 5, 6 (claro y oscuro); pasos 3 y 4 en claro fallan contraste por un bug previo (abajo). check/biome/test 109/109/build en verde.
No verificado: animación de tamaño a ojo, reduced motion emulado, cierre con "Empezar a jugar" desde el modal de configuración (mismo camino de código).

Decisiones abiertas: fila de cabecera mientras se juega (mantener vs quitar para igualar alto); pasos explicativos a 448 px vs `max-w-none` para usar min(58rem,94vw); padding y topes de alto duplicados en Tutorial.tsx (con comentario) vs constantes compartidas con FlagGame/CountriesPractice.

CONTENT_CHECKLIST #31: Copy del tutorial reescrito (D092): bienvenida, paso de ajustes ("la partida del paso siguiente…"), nota de competitivo ("La partida de este recorrido se juega en Práctica"), "Empezar la partida", "Jugar otra vez", "Partida terminada: así es como se juega.", `demoBanner` ampliado, `demoExitDescription` nuevo. Provisional como #24/#25 · `tutorial-script.tsx`, `TutorialSettings.tsx` · Pendiente de aprobación del dueño.

Acciones manuales: ninguna.

Bug visto (no arreglado): en claro, la opción seleccionada de `OptionTile` da 4,34:1 (`--accent-foreground` #f7f6ff sobre `--accent` #6d5ef0, `src/styles/heroui-theme.css`). Previo a esta unidad; afecta también a GameTab.

Conflicto previsible: W1 (PR #18) también toca una frase del paso "Modo de juego" en `tutorial-script.tsx`.
