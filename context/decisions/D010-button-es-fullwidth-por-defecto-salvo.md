# D010 · Componentes · `Button` es `fullWidth` por defecto (salvo `isIconOnly`/`fullWidth={false}`); las filas de botones reparten el ancho · Implementado

**Decisión:** `Button` renderiza `fullWidth` por defecto; se excluye con `isIconOnly` o `fullWidth={false}` (usado en cabeceras de modal y "Abandonar")
**Por qué:** El dueño quiere que las filas de botones repartan el ancho completo
