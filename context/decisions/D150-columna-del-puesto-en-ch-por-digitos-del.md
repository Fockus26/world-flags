# D150 · UX · Columna del puesto en `ch` por dígitos del puesto más alto visible · Implementado

**Resumen:** Columna del puesto en `ch` por dígitos del puesto más alto visible (compartida con tu fila; skeleton = "#20"), `gap-3` puesto–avatar, `gap-2`/`px-2` bajo `sm`; modal `w-[min(34rem,92vw)] max-w-none` (el tope `--md` de HeroUI dejaba el ancho en 28 rem)

**Decisión:** Columna del puesto con ancho en `ch` según el puesto más alto que se ve ("#" + dígitos: `rankColumnWidth`), el mismo en todas las filas y en tu fila bajo el separador; el skeleton usa el de un top lleno ("#20") para que el avatar no se mueva al llegar los datos. Entre el puesto y el avatar siempre `gap-3` (antes `gap-2.5`); bajo `sm`, el resto de la fila a `gap-2` y `px-2`. Modal a `w-[min(34rem,92vw)] max-w-none`
**Por qué:** Con `w-7` fijo, "#100" se salía hacia el avatar. El `max-w-none` hacía falta: `modal__dialog--md` de HeroUI limita a 28 rem, así que el `30rem` de antes nunca se aplicaba (medido: 448 px). 34 rem, el mismo valor que ya usa `CountryPickerModal`; a 320 px manda el 92vw y no hay scroll horizontal. Alternativa: `size="lg"` del `Modal` (32 rem, token de HeroUI)

**Rama:** `style/ranking-podio`

_Contexto común de la unidad (antes `37-ranking-podio.md`): en D147._
