# Changelog v5 · Modular Contract

## Cambios estructurales

- Se mueve el código a `src/` con carpetas por responsabilidad.
- Se separan efectos, proyectiles, player, enemigos, escenario y núcleo.
- Se añade `EnemyFactory` para registrar enemigos sin acoplarlos directamente al `Game`.
- Se añade `TestStage` como punto único para decidir qué enemigos aparecen.
- Se añade `LabBackground` separado para trabajar escenario/cámara sin tocar player ni enemigos.
- Se añade `Assets` para centralizar carga de imágenes.
- Se añade `Draw.roundRectPath` como helper compatible.
- Se documenta el contrato de entregas parciales en `docs/PARTIAL_HANDOFF.md`.

## Comportamiento preservado

- Movimiento izquierda/derecha.
- Salto.
- Agacharse.
- Disparo.
- Granada.
- Casquillos.
- Polvo.
- Chispas.
- Escalas 0.26 y 0.38.
- Ajuste `+/-`.
- Debug.
- Reset.
- Target holográfico con vida, daño, muerte y respawn.
