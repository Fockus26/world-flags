# D146 · UX · Sonido `record` (fanfarria de ~1 s) al mejorar una marca de rush que ya existía; espera a que termine el acierto · Implementado

**Resumen:** Sonido `record` (fanfarria de ~1 s) al mejorar una marca de rush que ya existía; espera a que termine el acierto. `finishGame` pone `isNewRecord` y `Results` muestra "¡Nuevo récord!" (copy provisional #47; la insignia animada es de P19)

**Decisión:** `record`: fanfarria en Do mayor (Sol–Do–Mi–Sol en staccato y acorde final de 0,55 s), ~1 s, más del doble que el logro. Suena al terminar un rush que **mejora una marca que ya existía** (misma regla que la guarda: completo, plausible, alcance con continente, clave vigente). Espera a que termine lo que suena, como el logro. `finishGame` marca `isNewRecord` en el resultado y `Results` muestra "¡Nuevo récord!"
**Por qué:** El primer rush completado crea la marca, no la bate. La señal visible es obligatoria (D082): la línea de texto es la mínima; la insignia animada con confeti es de W7 (P19) y puede reemplazarla. Copy provisional #47

**Rama:** `feat/mas-sonidos`

_Contexto común de la unidad (antes `36-mas-sonidos.md`): en D143._
