# CHANGELOG v12 - Boss Death Rebuild

## Objetivo
Reconstruir la muerte del boss con calidad de producción. El problema detectado no era solo `x/y`: los frames finales estaban cortados porque la fila de muerte original se había convertido a celdas uniformes demasiado pequeñas.

## Cambios
- Añadido `assets/boss_biomech_death_atlas.png` como atlas específico de muerte.
- La muerte del boss ya no se renderiza desde la fila `row:8` del atlas normal `220x180`.
- Añadido `SKY.Config.bossDeathAtlas` con celdas limpias `300x210` y 9 frames.
- El render del boss selecciona automáticamente `bossBiomechDeath` cuando `animName === 'death'`.
- Eliminado el rectángulo gris/blanco del flash: ya no se usa `source-atop` sobre el canvas principal.
- Al entrar en muerte se fuerza `hitFlash = 0` para evitar overlays residuales.
- Mantiene animación one-shot, ancla estable de muerte y explosiones procedurales.

## No tocado
- Mini stage helicóptero → boss → stage clear.
- Controles v9: salto separado y disparo vertical/diagonal.
- Helicóptero.
- Player, escalas, granadas, proyectiles, HUD y estructura modular.
