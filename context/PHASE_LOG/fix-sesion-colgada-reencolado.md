# fix/sesion-colgada-reencolado — F1 (ola de arreglos 2026-10-12, ola A) · PR #79

- P55: usePracticeQueue avanza por turnos (`advancePracticeQueue` pura, `turn` expuesto). Países libera guard/pistas/anuncio por turno; temporizador por `código:turno` en Países (`useCardCountdown` cardCode→cardKey) y en Session (Banderas/Capitales). D194, changeset patch.
- Banderas/Capitales/Diaria no se colgaban; Session sí arrastraba el temporizador (agotado → se saltaba solo al volver). Arreglado.
- Verificado en navegador (4301, invitado): Centroamérica lotes de 5, todo "Bien" con clic y con tecla 3 → Honduras dos veces → Resultados. Con main reproduce el cuelgue. Temporizador de Session no verificado en navegador.
- Tests: tests/unit/practice-queue-turn.test.ts. Capturas: context/plans/shots-F1/.
