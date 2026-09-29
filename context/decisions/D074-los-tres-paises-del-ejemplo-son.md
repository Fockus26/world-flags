# D074 · Contenido · Los tres países del ejemplo son **Norteamérica completa** · Implementado

**Resumen:** Los tres países del ejemplo son **Norteamérica completa** (Canadá, Estados Unidos, México), el continente más pequeño del catálogo: un alcance real del juego terminado de verdad, no un recorte de tres países sueltos. Juego Países (D030), modo Práctica

El ejemplo se juega con **Canadá, Estados Unidos y México**: Norteamérica entera,
el continente más pequeño del catálogo (`data/countries.ts`).

No están elegidos uno a uno. Así la partida guiada es un **alcance real del
juego, terminado de verdad** —con su tablero, su etiqueta de continente y su
resultado— en vez de un recorte artificial de tres países sueltos que no se
parece a nada de lo que el usuario va a jugar después. De paso son de los más
reconocibles para el público en español, que es el mercado de la app.

El juego es **Países** porque es con el que arranca un usuario nuevo (D030), y el
modo es Práctica (D073). Un test comprueba que siguen siendo tres y que todos
están en el catálogo, por si el catálogo cambia.

**Rama:** `feat/tutorial-inicial`

_Contexto común de la unidad (antes `17-tutorial-inicial.md`): en D071._
