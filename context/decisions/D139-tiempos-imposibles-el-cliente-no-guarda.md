# D139 · Seguridad · Tiempos imposibles: el cliente no guarda ni sube un rush bajo el mínimo · Implementado

**Resumen:** Tiempos imposibles: el cliente no guarda ni sube un rush bajo el mínimo (`isPlausibleRushTime`), `CountriesRush` mide con `performance.now()`; el trigger guarda `least(nuevo, viejo)` en el mismo scope (una marca peor no pisa una mejor)

**Decisión:** Tiempos imposibles (P15). Cliente: `useGame` no registra como mejor marca un rush por debajo del mínimo de su alcance (`isPlausibleRushTime`, misma fórmula que el servidor), la cola no sube marcas locales imposibles ya guardadas, y `CountriesRush` mide con `performance.now()` (monótono; `Session.tsx` lo hace W1). Servidor: el trigger deja `best_time_ms = least(nuevo, viejo)` (y el `updated_at` viejo) en un update del mismo scope
**Por qué:** En servidor y no en cliente para "no sustituir una marca mejor": atómico, cubre también a los clientes viejos y no cuesta un GET por subida. Alternativa descartada: leer la fila antes del upsert (carrera entre dispositivos, no protege de clientes viejos)

**Nota de estado:** SQL sin aplicar

_Contexto común de la unidad (antes `34-ranking-continentes.md`): en D137._
