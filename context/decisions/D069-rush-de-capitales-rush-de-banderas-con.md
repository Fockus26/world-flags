# D069 · UX · Rush de Capitales = rush de Banderas con otra tarjeta · Implementado

**Resumen:** Rush de Capitales = rush de Banderas con otra tarjeta; ranking `capitals:world` sin migración, subido desde el efecto único de `GameEffects`. Práctica diaria con la tarjeta del juego; Capitales añade la pregunta y, al revelar, alias + nota. Candado de "hoy" por juego

- **Rush = rush de Banderas** con la tarjeta de Capitales (D068): cada país una
  vez, penalización de 2 s por fallo y 5 s por saltar, tildes obligatorias,
  `completed: true` siempre. Los mejores tiempos van a
  `capitalsGame.regionBestTimes`.
- **Ranking:** scope **`capitals:world`** en `leaderboard_entries`, sin
  migración (`scope text`, PK `(user_id, scope)`). `GameEffects` sube la marca
  de "Todo el mundo" de cada juego desde un solo efecto que recorre
  `GAME_TYPES` (D061), con reintento por juego tras la siguiente
  sincronización buena (D050). `LeaderboardModal` ya tenía el selector de tres
  (D066) y la descripción "…practicando todas las capitales".
- **Práctica diaria:** Países sigue con su tablero; Banderas y Capitales usan
  la tarjeta de su juego (`SESSION_CARDS`). Capitales muestra además la
  pregunta ("¿Cuál es la capital de Israel?", `showQuestionInDaily`), porque el
  nombre del país solo no dice qué se pregunta. Al revelar: la capital, las
  otras respuestas que valen y la nota. Banderas no cambia.
- El candado de "practicado hoy" ya era por juego (`lastPracticeByCountry` de
  cada `GameProgress`); la práctica diaria sigue sin marcarlo.
- Los países cuya capital se llama como el país (Mónaco, Singapur, Kuwait…)
  son "gratis" en el rush: es el contenido, igual para todos; no se toca.

### Verificación (navegador real)

- Con 3 capitales vencidas inyectadas: "Práctica diaria (3)" solo en
  Capitales (Banderas y Países sin botón), la tarjeta con la pregunta, al
  revelar "Jerusalén" + nota y "Jerusalén Este" + "También vale Ramala o
  Jerusalén Oriental." + nota. "3" dos veces avanza una sola tarjeta. La
  sesión se guarda como `daily` / `capitals`; el progreso, en `capitalsGame`.
- Candado independiente: Sudamérica marca 7/12 hoy en Capitales, 3/12 en
  Banderas y nada en Países, cada uno con lo suyo.
- Modal de ranking en Capitales: descripción correcta, consulta sin error
  (vacío). axe-core sin violaciones en la práctica diaria y en el modal.
- **No verificado:** subir una marca al ranking (hace falta cuenta y la
  columna `capitals_game` en Supabase); el rush completo de "Todo el mundo".
- **Visto de paso, no tocado:** al revelar en la práctica diaria la respuesta
  aparece sin región viva, así que un lector de pantalla no la anuncia por sí
  solo. Ya pasaba en Banderas; queda reportado.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
