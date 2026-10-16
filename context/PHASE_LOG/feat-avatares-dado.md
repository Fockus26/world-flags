# feat/avatares-dado — W4 (tanda 2026-10-12, ola 2) · PR #74

- Botón de dado (IconButton + DiceFive) sobre la rejilla de avatares en Configuración → Usuario: 8 seeds aleatorios nuevos por tirada (`createRandomAvatarSeeds`, `withSelectedAvatarSeed` en `src/utils/avatar.ts`, tests en `tests/unit/avatar-seeds.test.ts`).
- Tanda local, no persistida; el elegido va en la primera casilla si la tanda no lo trae; se mete en la tanda al tirar para que elegir no desplace la rejilla.
- Opciones nombradas por posición ("Seleccionar avatar N"). `role="status"` "Nuevos avatares". Giro solo `motion-safe`.
- D190, changeset minor `avatares-dado.md`.
- Verificado (Playwright + astro preview 4305): tirada cambia la rejilla, elegido se mantiene al tirar y al reabrir, sin desplazamiento al elegir, teclado y foco visible, axe 0 en claro/oscuro, 320 px sin scroll, sin conexión cae a números. Capturas en `context/plans/shots-W4/`.
