# D065 · UX · Respuestas de Capitales: `isAcceptedAnswer` con alias explícitos por entrada (solo español) · Implementado

**Resumen:** Respuestas de Capitales: `isAcceptedAnswer` con alias explícitos por entrada (solo español). En difícil/competitivo cuentan tildes, apóstrofos, guiones y espacios (cualquier apóstrofo = el ' del teclado, cualquier guion o raya = "-", NFC); en fácil se ignoran. `normalize`/`isCorrectAnswer` sin cambios

- `isAcceptedAnswer(answer, accepted, difficulty)` en `normalize-answer.ts`,
  solo para Capitales. **`normalize` e `isCorrectAnswer` no cambian**: Banderas
  y Países comparan igual que antes (lo comprueba un test).
- **Regla del dueño:** en difícil (y por tanto en competitivo) los apóstrofos,
  guiones y espacios cuentan igual que las tildes: "Saint John's",
  "Port-au-Prince" y "Porto Novo" se escriben como son. En fácil se ignoran,
  junto con las tildes, los puntos y las comas ("saint johns", "washington
  dc"). En difícil, el apóstrofo tipográfico de la fuente (’) equivale al del
  teclado ('), y varios espacios seguidos cuentan como uno (confirmado por el
  dueño).
- **Alias explícitos por entrada, sin reglas genéricas** de artículo ni de
  "Ciudad de": "La Paz" es Bolivia y "Ciudad de la Paz" es Guinea Ecuatorial;
  una regla genérica los confundiría. Política A (del dueño): solo español,
  como los otros dos juegos — variantes documentadas por la UE o Wikidata,
  formas corta o larga ("Washington", "Habana") y topónimos locales que
  Wikidata registra como alias en español ("Phnom Penh", "Accra"). No valen
  apodos, abreviaturas ni nombres anteriores.
- Una variante que solo difiere en la tilde no se añade (la cubre "fácil"),
  salvo tres grafías documentadas como distintas: Hanói, Uagadugú, Taipei.
- Ignorar signos en el modo fácil de Banderas y Países sería cambiar juegos
  cerrados: fuera de alcance (la auditoría del catálogo vio que "Guinea
  Bisáu" falla).

### Verificación (D063-D065)

`tests/unit/capitals.test.ts`: cobertura 197/197, datos sin espacios
sobrantes ni alias repetidos, cada decisión de la tabla de D064, la regla de
signos en los dos modos y la guarda de Banderas/Países. `bun run test`: 80.
Con la regla rota a propósito (difícil ignorando guiones), falla el test de
signos.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
