# CHANGELOG v7 — Aiming & Air Combat Foundation

Baseline de entrada: `soldier_v04.zip` / v6 arcade combat.

## Objetivo

Convertir el prototipo en una base de combate aéreo jugable sin romper lo conseguido: movimiento, salto, agacharse, disparo, granada, escala 0.26/0.38, HUD, hit-stop, screen shake, partículas y estructura modular.

## Cambios principales

- Añadido disparo en varias direcciones:
  - `Space`: disparo horizontal.
  - `↑ + Space`: disparo vertical hacia arriba.
  - `↑ + ←/→ + Space`: disparo diagonal hacia arriba.
  - `↓ + Space`: disparo agachado horizontal.
- `ArrowUp/W` ya no fuerza salto cuando el disparo se ejecuta en el mismo frame.
- Añadido sistema de `muzzle points` para que la bala salga de posiciones distintas según dirección de disparo.
- `Bullet` pasa de trayectoria horizontal a vector completo `vx/vy` con `prevX/prevY` para colisión por segmento.
- Añadidas utilidades geométricas en `Math2D`: normalización, punto en rectángulo e intersección segmento-rectángulo.
- Mejoradas las colisiones contra enemigos aéreos mediante `hurtbox` y `intersectsSegment`.
- Añadido atlas limpio `assets/helicopter_atlas.png` generado desde el sprite sheet del helicóptero.
- Añadido enemigo real `src/enemies/helicopter_enemy.js` con:
  - entrada/hover/patrol,
  - ráfaga de disparo,
  - ataque tipo misil,
  - daño y flash,
  - humo cuando está tocado,
  - secuencia de muerte/explosión,
  - respawn para pruebas continuas.
- Añadido el helicóptero al stage de prueba.
- Conservados los assets fuente `boss_biomech_source.png` y `plane01_source.png` para futuras v8/v9.

## Criterio de aceptación

- La heroína puede destruir enemigos voladores disparando hacia arriba o diagonal.
- Los drones son alcanzables con disparo diagonal/vertical.
- El helicóptero entra, ataca, recibe daño, humea y explota.
- El sistema anterior no retrocede: movimiento, salto, crouch, granada, escala, HUD, shake y debug siguen operativos.

## Próximo bloque lógico

- v8: integrar avión/gunship como enemigo aéreo rápido.
- v9: preparar pipeline y primer encuentro con boss biomecánico.
