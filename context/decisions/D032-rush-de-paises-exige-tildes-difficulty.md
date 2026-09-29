# D032 · UX · Rush de países: exige tildes (`difficulty: "hard"`), igual que el resto del competitivo · Implementado

**Resumen:** Rush de países: exige tildes (`difficulty: "hard"`), igual que el resto del competitivo — revisada tras feedback del dueño (Fase 4 la implementó sin tildes)

**Revisada tras feedback del dueño** (la Fase 4 la implementó al revés:
`findMatch` siempre con `difficulty: "easy"`, sin exigir tildes, razonando
que era "una carrera de tecleo, no una prueba de acento"). Decisión final:
el rush de Países exige tildes igual que el resto del modo competitivo
(que en Banderas ya fuerza `"hard"`) — `findMatch` se llama siempre con
`difficulty: "hard"` en `CountriesRush.tsx`, sin importar la dificultad
configurada (el competitivo no deja elegirla). Consistencia entre los dos
juegos: si Banderas exige tildes en competitivo, Países también. La
práctica de países sigue respetando la dificultad elegida (`isCorrectAnswer`
normal en `CountriesPractice`, sin tocar).

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
