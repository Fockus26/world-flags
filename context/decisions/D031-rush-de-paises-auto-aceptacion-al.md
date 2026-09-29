# D031 · UX · Rush de países: auto-aceptación al escribir · Implementado

**Resumen:** Rush de países: auto-aceptación al escribir, con espera de 700 ms/Enter cuando el texto es prefijo ambiguo de otro país sin descubrir

`findMatch` (`src/utils/country-board.ts`) compara el texto normalizado
contra el alcance completo de la sesión en cada `onChange`. Si coincide
exactamente con un país no encontrado, se acepta al instante — sin botón
"Comprobar": es una carrera de tecleo, no una prueba de acierto/fallo, así
que no hay "penalización" que aplicar a medio escribir.

Si el texto coincide con un país **y además es prefijo** de otro país sin
descubrir, se espera 700 ms (o Enter, que acepta ya) antes de darlo por
bueno. Colisiones reales en `src/data/countries.ts`: `Guinea` ⊂
`Guinea-Bisáu`/`Guinea Ecuatorial`, `Sudán` ⊂ `Sudán del Sur`, `Níger` ⊂
`Nigeria` (sin espacio de por medio). **Hallazgo de la Fase 3:** la
ambigüedad Níger/Nigeria solo existe comparando sin tildes — con tildes
("hard") ya difieren en la segunda letra (í vs i). Tras D032 (revisada:
el rush compara con tildes), este caso concreto de Níger/Nigeria ya no se
da en la práctica — quedan Guinea y Sudán, que no dependen de acentos.

Verificado en el navegador (Fase 4): escribir "Guinea" lo acepta tras la
espera; completar hasta "Guinea Ecuatorial" lo acepta antes de que la
espera expire; un país ya encontrado muestra "Ya tienes {nombre}" sin
duplicar ni reiniciar el input.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
