# CHANGELOG v14 — Stage01 Cohesion & Art Pass

## Objetivo
Elevar Stage01 desde presentación arcade funcional a pantalla cohesionada de juego: sustituir el dron provisional, compactar HUD, ocultar sabor debug y añadir cierre de misión.

## Cambios principales
- Integrado RAVEN DRONE como enemigo aéreo básico del Stage01.
- Añadido `assets/raven_drone_atlas.png` reconstruido desde `drone01_source.png`.
- Añadido `src/enemies/raven_drone_enemy.js` con hover, boost, gun, missile, damaged y death.
- `Stage01Director` ya spawnea RAVEN DRONE en oleadas y evita aparición instantánea desde el centro.
- HUD rediseñado: panel LIFE más compacto, stage plate menos invasivo y boss bar con estética arcade.
- El texto de controles se muestra solo en modo debug.
- Añadido `src/ui/stage_clear_screen.js` con pantalla de resultados y `celebration01.png`.
- `Game` carga `ravenDrone` y `celebration` y dibuja la reward screen al terminar el stage.
- Se mantiene intacto: disparo vertical/diagonal sin salto, helicóptero, boss, muerte del boss v12, Stage01 flow y estructura modular.

## Validación
- `node --check` sobre todos los JS: OK.
- Manifest regenerado.
- ZIP test: OK.
