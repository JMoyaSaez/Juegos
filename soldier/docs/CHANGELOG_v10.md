# CHANGELOG v10 — Boss Death Lock

## Objetivo
Corregir el descuadre visual de la destrucción del boss biomecánico sin tocar el feeling ya validado de v9.

## Cambios
- La animación `death` del boss pasa a ser **one-shot**: ya no vuelve a empezar mientras siguen las explosiones procedurales.
- Se bloquea un `deathAnchorX/deathAnchorY` al morir, para que toda la destrucción quede anclada a la posición real del boss.
- Se añaden offsets manuales por frame de muerte para compensar humo/debris del atlas.
- Las explosiones procedurales de muerte usan el ancla de muerte, no la posición viva del actor.
- Se añade fade-out final del sprite de destrucción antes de la explosión grande final.

## No se toca
- Controles v9.
- Disparo vertical/diagonal.
- Helicóptero.
- Mini stage helicóptero → boss → clear.
- Escalas misión/boss.
- HUD y FX generales.
