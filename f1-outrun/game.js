(() => {
    SpritePainter.drawSky(ctx, w, h, state.horizonCurve, state.skyScroll);
    renderRoad();
    drawHUD();

    if (state.mode === 'title') {
      SpritePainter.text(ctx, 'PULSA ESPACIO', w * 0.5, h * 0.90, Math.max(20, h * 0.04), '#ffffff', '#001', 'center');
    }
    if (state.mode === 'countdown') {
      SpritePainter.text(ctx, String(state.countdown), w * 0.5, h * 0.52, Math.max(56, h * 0.12), '#ffd541', '#7a0000', 'center');
    }
    if (state.mode === 'finished') {
      SpritePainter.text(ctx, 'GOAL!', w * 0.5, h * 0.45, Math.max(56, h * 0.11), '#ffd541', '#7a0000', 'center');
    }
  }

  console.assert(Array.isArray(segments), 'segments debe ser array');
  console.assert(segments.length > 100, 'segments debe tener contenido');
  console.assert(typeof RoadEngine.findSegment(segments, 0).curve === 'number', 'findSegment debe devolver segmento válido');
  console.assert(Number.isFinite(RoadEngine.project(0, 0, 100, 0, 0, 0, 800, 600).x), 'project debe devolver números finitos');

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
