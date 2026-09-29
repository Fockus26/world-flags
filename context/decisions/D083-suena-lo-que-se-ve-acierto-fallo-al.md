# D083 · UX · Suena lo que se ve: acierto/fallo al comprobar (no al calificar) · Implementado

**Resumen:** Suena lo que se ve: acierto/fallo al comprobar (no al calificar); saltar suena a fallo en los dos modos (también el temporizador agotado; sustituido por D144: nota propia `skip`); práctica diaria suena al calificar ("Otra vez" = fallo)

**Regla: suena lo que se ve.**

- **Banderas y Capitales (`Session`), práctica y competitivo:** acierto o fallo
  al comprobar la respuesta. Calificar después (Otra vez/Difícil/Bien/Fácil) no
  suena otra vez.
- **Saltar**, en los dos modos, suena como fallo: se ve como fallo (aviso rojo
  con la respuesta). En competitivo además penaliza; en práctica se califica
  "otra vez" sola. Lo mismo cuando se agota el temporizador de práctica (llama al
  mismo salto). La alternativa era no sonar al saltar en práctica (un salto es
  "no lo sé", no un error), pero rompería la regla de que suena lo que se ve.
- **Práctica de Países (`CountriesPractice`, también en la partida guiada):**
  igual que la práctica de Banderas.
- **Práctica diaria:** no se escribe la respuesta, se revela y quien juega se
  califica. Suena al calificar: "Otra vez" como fallo, el resto como acierto (el
  mismo criterio con el que la práctica diaria cuenta aciertos).

**Rama:** `feat/sonidos`

_Contexto común de la unidad (antes `19-sonidos.md`): en D080._
