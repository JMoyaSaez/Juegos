# CHANGELOG v11 - Boss Death Anchor Fix

## Objetivo
Corregir el descuadre de la destrucción del boss. El problema real no era solo el loop de la animación: el `x/y` de dibujo no estaba anclado correctamente para los frames de muerte.

## Cambios
- Añadido sistema de anchors explícitos para el atlas del boss.
- Añadido `bossAtlas.anchor` para frames normales.
- Añadido `bossAtlas.deathAnchors[]` para frames de muerte.
- Eliminado el enfoque anterior basado en `drawOffset`, porque compensaba el sprite después de dibujarlo pero no resolvía la referencia real del frame.
- La animación de muerte sigue siendo one-shot.
- La destrucción se dibuja ahora desde un ancla fija de mundo: `deathAnchorX / deathAnchorY`.
- Con `D` activo, durante la muerte se muestra una cruz cyan sobre el ancla de destrucción para facilitar calibración visual.

## No tocado
- Controles v9.
- Aiming vertical/diagonal.
- Helicóptero.
- Mini stage.
- HUD.
- Escalas de misión/boss.
- Estructura modular.
