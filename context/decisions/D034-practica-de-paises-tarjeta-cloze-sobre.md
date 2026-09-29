# D034 · UX · Práctica de países: tarjeta cloze sobre el tablero del continente, con pistas letra a letra · Implementado

Cada tarjeta SRS es un país. `CountryClozeCard.tsx` (compartido con la Fase
6) muestra el tablero **del continente entero** del país objetivo — no solo
el alcance de la sesión — con todos los nombres visibles salvo el objetivo,
que aparece resaltado (`target`). El formulario es el mismo `AnswerForm` de
Banderas, con props opcionales nuevas (`label`, `placeholder`,
`correctSuffix`, `inputRef`) que no cambian nada para `Session.tsx`.

Botón "Pista": revela una letra más del hueco hasta `longitud - 1`,
anunciado por una región `aria-live`. Un acierto con pistas **cuenta igual**
para la puntuación (D034 original) — las pistas ayudan a recordar, la
calificación honesta (Otra vez/Difícil/Bien/Fácil) sigue siendo decisión del
usuario, y el aviso de acierto dice cuántas se usaron.

**Ajuste sobre el plan:** `CountryClozeCard` recibe el `BoardSlotState`
completo del hueco (`target`/`revealed`/`missed`), no el `isRevealed:
boolean` que proponía el plan original — la práctica con SRS necesita
distinguir un fallo (rojo, con el nombre) de un hueco sin más; la práctica
diaria (D035) nunca falla, así que simplemente nunca le pasa `"missed"`.

Guard contra tecleo repetido 1-4 (ref que se libera al cambiar de tarjeta):
`Session.tsx` tiene este hallazgo reportado sin arreglar (hallazgo
pre-existente de la unidad de logros); acá se previene desde el principio
en vez de heredar el bug.

Alternativas descartadas (del plan original): mostrar la palabra
directamente y hacer copiarla (sin recuerdo activo, el SRS no mide nada); un
mapa/silueta del país (mejor pedagógicamente, pero necesita un SVG con
licencia y geometría por país — fuera de alcance de una rama experimental,
fila en `CONTENT_CHECKLIST.md`).

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
