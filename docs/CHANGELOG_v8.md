# CHANGELOG v8 — Mini Stage: Helicopter → Boss

## Objetivo
Crear una primera microfase jugable con progresión real: primero aparece el helicóptero enemigo; al destruirlo se limpia la escena, se anuncia el boss y entra el enemigo final biomecánico.

## Cambios principales
- Nuevo `assets/boss_biomech_atlas.png` generado a partir del sprite sheet del boss.
- Nuevo módulo `src/enemies/boss_biomech_enemy.js`.
- `TestStage` pasa a funcionar como director de mini-stage:
  - Fase 1: helicóptero.
  - Transición: `BOSS INCOMING`.
  - Fase 2: boss biomecánico.
  - Final: `STAGE CLEAR`.
- El helicóptero puede configurarse con `respawn:false` para uso en fases reales.
- `Game` carga el atlas del boss y permite actualización secuencial del stage.
- HUD actualizado con fase actual.
- Al entrar el boss, el player cambia automáticamente a escala `boss` (`0.38`) para dar sensación de encuentro arcade/cinemático.

## Criterio de producción
- No se elimina el aiming vertical/diagonal de v7.
- No se elimina el helicóptero.
- No se rompe la estructura modular.
- La secuencia ya permite construir una vertical slice arcade: enemigo aéreo → boss.
