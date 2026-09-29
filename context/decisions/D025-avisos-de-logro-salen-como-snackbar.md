# D025 · Componentes · Avisos de logro salen como snackbar apilado (estilo Xbox/PS5), no en `Results` · Implementado

**Resumen:** Avisos de logro salen como snackbar apilado (estilo Xbox/PS5), no en `Results` — así también se ven desde la práctica diaria y a mitad de sesión. Slice de Redux nuevo y efímero (`achievementToasts`, no persiste)

Antes los desbloqueos de la sesión se mostraban como tarjetas dentro de
`Results`. Eso los dejaba invisibles si el logro se ganaba en la práctica
diaria (que no pasa por `Results`) o a mitad de un rush.

Ahora `AchievementToasts` (nuevo, montado una sola vez en `FlagGame.tsx`, fuera
del router de vistas) se apila abajo a la derecha — "si hay varios se
acoplan", estilo Xbox/PS5 — y aparece sin importar qué pantalla esté activa.

**Cómo se decide qué se anuncia y qué no.** El mismo dato (`getNewlyUnlocked`)
sirve tanto para sellar como para avisar, pero avisar de TODO lo sellado
inundaría de golpe a cualquiera que actualice la app con progreso viejo: abrir
la app con 120 países ya aprendidos desbloquearía media docena de logros a la
vez. `AchievementsEffects` distingue con un ref (`isNextPassSilentRef`):

- La primera evaluación tras **cada** transición a `hydrationStatus === "ready"`
  (arranque, o un login/logout que trae datos nuevos) sella lo que corresponda
  pero **no** encola snackbar — es una reconciliación retroactiva, no algo que
  "acaba de pasar".
- Cualquier evaluación posterior, con los datos ya asentados, sí encola.
- Salir de `"ready"` (a `"loading"`/`"idle"`) vuelve a armar la siguiente pasada
  como silenciosa, así que un login que trae logros fusionados desde otro
  dispositivo tampoco los anuncia de golpe.

La cola de avisos vive en un slice de Redux **nuevo y deliberadamente aparte**
de `game.learningData`: `store/slices/achievementToastSlice.ts`. No es
`UserLearningData` — no se persiste, no se sincroniza, se vacía al recargar.
Es la primera pieza de estado "solo UI" del store; documentado en
`docs/state-management.md` para que no se intente colar en el patrón de campos
persistidos por error.

Cada snackbar se autodescarta a los 6 s (con botón de cierre manual — sin eso
sería un límite de tiempo no ajustable, WCAG 2.2.1) y respeta
`prefers-reduced-motion` saltándose la espera de la animación de salida.

_Contexto común de la unidad (antes `06-ajustes-logros.md`): en D024._
