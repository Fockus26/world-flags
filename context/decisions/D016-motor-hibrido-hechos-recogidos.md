# D016 · Logros · Motor híbrido: hechos recogidos imperativamente, desbloqueo **declarativo** (catálogo puro + un solo efecto) · Implementado

**Resumen:** Motor híbrido: hechos recogidos imperativamente, desbloqueo **declarativo** (catálogo puro + un solo efecto). Los logros derivables son retroactivos

La recolección de hechos (`stats`, `sessionHistory`) es **imperativa**, porque no
se puede derivar de nada. La **detección** de desbloqueo es **declarativa**: un
catálogo de predicados puros sobre `UserLearningData`
(`src/utils/achievements.ts`) que un único efecto
(`src/components/app/AchievementsEffects.tsx`) re-evalúa.

Alternativa descartada: emitir eventos desde `finishGame`, `gradeCountryReview`,
`attemptCountry`… Un desbloqueo puede venir de cualquiera de esas rutas (y de los
modos de juego de `TODO.md` §3, que aún no existen); con un solo observador no
hay forma de olvidarse de una.

Efecto secundario buscado: **los logros derivables son retroactivos**. Un usuario
con 120 países aprendidos los desbloquea en cuanto abre la app.

## Contexto común de la unidad (antes `05-logros.md`)

> Unidad `feat/achievements`. Cubre D016–D023.

### Por qué

`TODO.md` §2 tenía reservado el sistema de logros y no había nada de código. El
objetivo del proyecto es la **retención** (`PROJECT_CONTEXT.md`) y lo único que
reforzaba ese bucle era el ranking competitivo, que solo aplica a quien juega
rush de "Todo el mundo".

El problema no era de UI sino de datos: todo lo que ocurría dentro de una sesión
(aciertos, fallos, skips, tiempo, y sobre todo **qué días se practicó**) se
descartaba al terminar. Sin eso no hay logros de hábito.
