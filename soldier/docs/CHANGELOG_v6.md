# CHANGELOG v6 - Arcade Combat Evolution

Baseline: `soldier_v03` / v5 modular contract.

## Objetivo
Evolucionar la demo hacia un primer bucle arcade real sin retroceder en lo ya validado: movimiento, salto, agacharse, disparo, granada, escalas 0.26/0.38, debug, reset, estructura modular y handoff parcial.

## Cambios principales

### Combat loop
- Añadido `SecurityDrone` como primer enemigo procedural premium.
- Añadido disparo enemigo `EnemyBolt` con trayectoria hacia el jugador.
- Añadida vida de jugador, invulnerabilidad temporal y feedback de daño.
- Añadidas colisiones jugador vs proyectiles enemigos.
- Añadido texto de combate flotante (`CombatText`) para daño, break, down y recover.

### Feeling arcade
- Añadido hit-stop ligero/pesado en impactos.
- Añadida vibración de cámara en disparos, impactos y explosiones.
- Mejorado feedback de impactos contra dianas y drones.
- Mejoradas explosiones con más chispas y polvo.

### Escenario
- Rehecho `lab_background.js` con fondo industrial premium procedural:
  - reactor/glow distante,
  - siluetas de hangar,
  - vigas y paneles,
  - scan lines/rain,
  - luces volumétricas,
  - suelo con paneles y parallax.

### HUD
- Añadido HUD superior de combate con vida del jugador.
- Mini HUD actualizado con build, estado, escala, HP, enemigos vivos y disparos activos.

## Archivos nuevos
- `src/enemies/security_drone.js`
- `src/projectiles/enemy_bolt.js`
- `src/fx/combat_text.js`
- `docs/CHANGELOG_v6.md`

## Archivos modificados
- `index.html`
- `src/core/config.js`
- `src/core/namespace.js`
- `src/entities/player.js`
- `src/enemies/hologram_target.js`
- `src/scenes/game.js`
- `src/scenes/lab_background.js`
- `src/stages/test_stage.js`
- `manifest/files.sha256`

## Validación técnica
- `node --check` ejecutado sobre todos los JS de `src/`: OK.
