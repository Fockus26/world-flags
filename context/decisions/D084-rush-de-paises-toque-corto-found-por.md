# D084 · UX · Rush de Países: toque corto `found` por país, dos a menos de 70 ms se quedan en uno · Implementado

**Resumen:** Rush de Países: toque corto `found` por país, dos a menos de 70 ms se quedan en uno; fallo solo con Enter sobre algo que no es un país; "Ya tienes X" no suena

Escribiendo rápido, los países llegan muy seguidos. Cada país encontrado suena
con `found` (un toque de ~0,1 s, más suave que el acierto), y dos `found` a menos
de 70 ms se quedan en uno (el segundo se descarta, no se encola). Así, al
escribir deprisa se oye un "tic" por país, no una pila de acordes.

Fallo en el rush de Países: solo Enter con algo que no es un país del alcance
(lo único que allí se muestra como error). "Ya tienes X" es un recordatorio, no
un fallo, y no suena. No hay penalización que reforzar.

**Rama:** `feat/sonidos`

_Contexto común de la unidad (antes `19-sonidos.md`): en D080._
