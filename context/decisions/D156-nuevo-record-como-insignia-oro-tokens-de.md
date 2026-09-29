# D156 · UX · "¡Nuevo récord!" como insignia oro (tokens de medalla D147 + `Trophy`), zoom-in de 300 ms con `motion-safe`, montada con el confeti · Implementado

**Resumen:** "¡Nuevo récord!" como insignia oro (tokens de medalla D147 + `Trophy`), zoom-in de 300 ms con `motion-safe`, montada con el confeti en el mismo render en que suena `record`

**Decisión:** La línea de texto "¡Nuevo récord!" de D146 pasa a insignia: píldora `bg-medal-gold-soft text-medal-gold border-medal-gold` (D147, ≥5,5:1 en claro y oscuro) con `Trophy` de iconoir (`aria-hidden`), entrada `zoom-in-50 fade-in-0` de 300 ms (la misma duración que el badge de castigo, D132) solo con `motion-safe`. Confeti e insignia montan en el mismo render en que `finishGame` pide `record`: arrancan a la vez que la fanfarria (que como mucho espera a que acabe el último acierto)
**Por qué:** El oro dice "marca" igual que en el ranking y no depende solo del color (texto + icono). Sin retraso artificial: el sonido puede tardar unas décimas por la cola, pero el confeti dura más que ese margen. Alternativa: retrasar insignia y confeti a que termine de contar el tiempo (600 ms), a costa de quedar desfasados del sonido

**Rama:** `style/animaciones-resultados`

_Contexto común de la unidad (antes `39-animaciones-resultados.md`): en D154._
