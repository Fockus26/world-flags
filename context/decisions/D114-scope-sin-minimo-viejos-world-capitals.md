# D114 · Seguridad · Scope sin mínimo (viejos `world`/`capitals:world` o uno nuevo aún no listado): se deja pasar, solo con tiempo > 0 · Implementado

**Resumen:** Scope sin mínimo (viejos `world`/`capitals:world` o uno nuevo aún no listado): se deja pasar, solo con tiempo > 0. Nadie lee los viejos (D076) y un scope nuevo no debe perder marcas honestas

**Decisión:** Scope sin mínimo (los viejos `world` y `capitals:world`, o uno nuevo aún no listado en el SQL): **se deja pasar**, solo con la regla de tiempo > 0
**Por qué:** Los viejos nadie los lee (D076) y los siguen escribiendo clientes viejos que no saben tolerar el rechazo. Uno nuevo que el cliente estrene antes que el SQL perdería marcas honestas en silencio; un tramposo en un scope que nadie lee no hace daño

**Rama:** `fix/ranking-validacion-servidor`
**Nota de estado:** SQL sin aplicar

_Contexto común de la unidad (antes `26-ranking-validacion.md`): en D112._
