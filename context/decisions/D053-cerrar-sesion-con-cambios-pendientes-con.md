# D053 · UX · Cerrar sesión con cambios pendientes: con red sincroniza y cierra solo · Implementado

**Resumen:** Cerrar sesión con cambios pendientes: con red sincroniza y cierra solo; sin red (o error) avisa con "Cancelar" / "Cerrar sesión igualmente". El botón no se desmonta: el foco se conserva

Cerrar sesión borra los datos de la cuenta de este dispositivo (D009), y
supabase-js lo permite sin red. `AuthSection`:

- Sin nada pendiente: cierra como siempre.
- Pendiente y con red: "Guardando…" — pide sincronizar ya y cierra sola en
  cuanto no queda nada pendiente (en la prueba, ~1 s).
- Pendiente y sin red, error de servidor, o más de 12 s guardando: aviso
  (`role="alert"`) de que se perderá, con "Cancelar" y "Cerrar sesión
  igualmente".
- El botón de cerrar sesión no se desmonta ni se deshabilita durante los
  avisos: el foco de teclado se queda en él (`aria-describedby` al aviso).
- **Límite conocido:** un cierre de sesión involuntario (refresh token
  revocado) sigue borrando lo no subido. Sin red, supabase-js conserva la
  sesión ante un refresco fallido, así que no pasa por estar offline.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
