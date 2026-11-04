# D226 · Sincronización · Con base se fusiona, aunque la cuenta no tenga progreso de juego · Implementado

**Resumen:** `planSync` trataba toda cuenta sin progreso de juego como vacía, también si este dispositivo ya tenía su base. Al recargar, un dispositivo con datos viejos subía los suyos y pisaba el nombre, el avatar y las mejores marcas que otro había cambiado después. Lo encontró la QA de la migración al VPS (2026-11-03).

**Decisión:** "la cuenta no tiene progreso, lo local pasa a ser la cuenta" solo vale **sin base**: es el invitado que acaba de entrar (D056, que no cambia). Con base, lo local es de esta misma cuenta y va por `mergeLearningData`, como cuando hay progreso: gana lo más reciente por campo (D049, D055).

**Alternativas descartadas:** contar nombre, avatar y marcas como "progreso" en `hasLearningProgress`: cambiaría D056, porque un invitado ya no pasaría a una cuenta que solo tiene nombre.

**Rama:** `fix/plansync-cuenta-sin-progreso`
