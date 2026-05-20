# CHANGELOG v13 - Stage01 Arcade Presentation

## Objetivo
Convertir la base técnica v12 en un primer Stage01 con sensación de juego arcade real, manteniendo sin regresiones el player, el disparo vertical/diagonal, helicóptero, boss y muerte reconstruida del boss.

## Cambios principales

- Nuevo `Stage01Director` en `src/stages/stage01_director.js`.
  - Flujo de fase: `intro → ready → wave01 → wave02 → helicopterWarning → helicopterFight → bossWarning → bossFight → stageClear`.
  - Secuencia jugable completa: drones iniciales, helicóptero, boss biomecánico y `STAGE CLEAR`.
  - Transición a boss con modo de alarma y escala de player en perfil boss.

- Nuevo sistema de mensajes arcade en `src/ui/arcade_messages.js`.
  - Mensajes con estilo recreativa: azul/blanco, borde fuerte, glow, sombra, overshoot de escala y fade.
  - Mensajes incluidos: `STAGE 01`, `READY!`, `WARNING!!`, `BOSS INCOMING`, `STAGE CLEAR`.

- Nuevo HUD de juego limpio en `src/ui/game_hud.js`.
  - Vida del jugador con pips arcade.
  - Barra de boss central cuando Omega-01 entra en combate.
  - Label de fase sin mostrar datos técnicos.
  - La información de desarrollo queda restringida a `D` debug.

- Nuevo background premium procedural en `src/scenes/stage01_background.js`.
  - Hangar industrial nocturno.
  - Parallax multicapa, lluvia, focos volumétricos, puerta de contención, suelo metálico y luces de alarma.
  - Modo `normal`, `alert` y `boss` gestionado desde el Stage01Director.

- Limpieza de modo juego.
  - El HUD HTML externo queda oculto.
  - El mini HUD técnico solo aparece con `D`.
  - La partida normal arranca como juego, no como herramienta de desarrollo.

- Ajuste de drones para flow de stage.
  - `SecurityDrone` ahora soporta `respawn: false`.
  - Las oleadas de Stage01 pueden limpiarse correctamente sin respawn automático.

## Conservado explícitamente

- Controles v9: `↑/W` apunta arriba y `Z/J/Ctrl` salta, evitando que el disparo diagonal provoque salto.
- Disparo horizontal, vertical, diagonal y agachado.
- Helicóptero enemigo real.
- Boss biomecánico.
- Muerte del boss v12 con atlas dedicado `boss_biomech_death_atlas.png`.
- Granadas, proyectiles, hit-stop, screen shake y partículas.
- Estructura modular y handoff parcial.

## Validación recomendada

1. Abrir `index.html` en carpeta nueva.
2. Confirmar que arranca con `STAGE 01 / IRON HANGAR` y `READY!` arcade.
3. Eliminar las dos oleadas de drones con disparo horizontal/vertical/diagonal.
4. Confirmar entrada del helicóptero con `WARNING!!`.
5. Destruir helicóptero y validar `BOSS INCOMING` + cambio a modo alarma.
6. Destruir boss y validar `STAGE CLEAR` sin celdas cortadas en la muerte.
7. Pulsar `D` y confirmar que el debug sigue disponible solo cuando se pide.
