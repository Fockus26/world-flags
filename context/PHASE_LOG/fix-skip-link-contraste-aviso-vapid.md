# fix/skip-link-contraste-aviso-vapid (W3, tanda 2026-09-26) — PR #34

- P16: skip link enfocado `focus:text-primary-soft` → `focus:text-accent-foreground` (`Layout.astro`). axe medido: claro 4,65:1 (4,66 según D106), oscuro 6,74:1, 0 violaciones; anillo `primary-hover` sin cambios.
- P17.3: `console.error` de `PUBLIC_VAPID_PUBLIC_KEY` ausente una vez por carga (flag de módulo en `push-notifications.ts`). Verificado: 4 intentos → 1 aviso.
- D142 en `context/decisions/35-skip-link-contraste.md` + fila en el índice. Changeset patch.
- Fila 46 de CONTENT_CHECKLIST sin usar (no hay copy nuevo).
- Checks: astro check 0 errores, biome limpio en los archivos tocados, test 169 pass / 1 skip, build OK.
