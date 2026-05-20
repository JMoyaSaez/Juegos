# SkyStrike Arcade Lab · Partial Handoff Contract

Objetivo: poder trabajar en producción sin tener que pasar siempre todo el proyecto.

## Regla base

Cuando trabajemos una zona, pásame solo el grupo indicado en `manifest/handoff_groups.json` y, si hay duda, añade `index.html` y `src/core/config.js`.

## Grupos recomendados

### Player / heroína
Pasa:
- `src/entities/player.js`
- `src/core/config.js`
- `src/projectiles/bullet.js`
- `src/projectiles/grenade.js`
- `src/projectiles/shell.js`
- `src/fx/dust_particle.js`
- `src/fx/spark_particle.js`
- `assets/soldier_atlas.png`, solo si cambiamos arte
- `assets/atlas_meta.json`, solo si cambiamos atlas/celdas

### Enemigos
Pasa:
- `src/enemies/enemy_factory.js`
- `src/enemies/<enemy>.js`
- `src/stages/test_stage.js`
- `src/scenes/game.js`, solo si cambiamos colisiones/spawn general
- assets del enemigo, si los hay

### Escenario / cámara / background
Pasa:
- `src/scenes/lab_background.js`
- `src/scenes/game.js`
- `src/core/config.js`

### Input / controles
Pasa:
- `src/core/input.js`
- `src/scenes/game.js`
- `src/entities/player.js`, si afecta a acciones del jugador

### Configuración de escalas y feeling
Pasa:
- `src/core/config.js`
- `src/entities/player.js`, si el ajuste afecta a física, salto o animación

## Contrato técnico

- No se cambia una mecánica funcionando sin revisar su impacto.
- `src/core/config.js` contiene números globales: escalas, velocidad, física, atlas.
- `src/entities/player.js` contiene el estado completo del jugador.
- Los enemigos se registran con `SKY.EnemyFactory.register(type, Class)`.
- Las escenas crean enemigos desde `src/stages/test_stage.js`.
- El orden visual se mantiene explícito en `src/scenes/game.js`.

## Para añadir un enemigo real

1. Crear asset: `assets/enemies/<enemy_name>_atlas.png`.
2. Crear clase: `src/enemies/<enemy_name>.js`.
3. Registrar clase: `SKY.EnemyFactory.register('<enemy-type>', EnemyClass)`.
4. Añadir script en `index.html`.
5. Añadir instancia en `src/stages/test_stage.js`.

Con esto, el siguiente intercambio puede ser solo:
- el JS del enemigo,
- su atlas,
- `test_stage.js`,
- y, si hace falta, `index.html`.
