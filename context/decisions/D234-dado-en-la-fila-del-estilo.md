# D234 · UI · El dado de avatares va en la misma fila que el selector de estilo · Implementado

**Ajusta D190** (dónde va el dado). El resto de D190 se mantiene: tanda local que no se persiste, el elegido siempre visible, anuncio `role="status"` («Nuevos avatares»), una vuelta por tirada solo con `motion-safe` y opciones nombradas por posición.

**Decisión del dueño:** junto al selector de estilo, en la misma fila; se elimina la fila propia del dado.

- **Cómo:** `Avatar` recibe el `Select` de estilo por la prop `styleControl` y lo pinta en una fila con el dado. El selector ocupa el espacio que queda (`flex-1`) y el dado se alinea con su campo (`items-end`, bajo la etiqueta «Avatar»). La tanda y el dado siguen dentro de `Avatar`, sin subir estado a `AccountTab`.
- **Ancho mínimo:** el selector tiene `basis-40` (10rem, crece con la letra, como los avisos de D222). A 1280 px y a 320 px con el texto normal van en una fila; a 320 px el nombre del estilo ocupa dos líneas. A 320 px con el texto al 200 % el selector se quedaba en 110 px con el nombre saliéndose del campo. Ahora el dado baja de línea, a la derecha, y el selector mide 214 px.
- **Espacio:** la separación entre la fila y la rejilla pasa a `gap-3`, la misma que había entre el selector y el bloque de avatares.

**Por qué:** pedido del dueño. Una fila solo para el dado ocupaba alto en el diálogo y lo separaba del estilo, que es con lo que va.

**Verificación:** `.qa/dado-shots.mjs` sobre el build local, en claro a 1280, en oscuro a 320 y en claro a 320 con el texto al 200 %. Comprueba que van en la misma fila (salvo al 200 %), que la tanda cambia al tirar, el anuncio «Nuevos avatares» y que no hay scroll horizontal.
