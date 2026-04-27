'use strict';

window.RoadEngine = (() => {
  const ROAD = {
    segmentLength: 220,
    roadWidth: 2200,
    drawDistance: 190,
    cameraHeight: 930,
    cameraDepth: 0.92,
    lanes: 3,
    rumbleWidth: 1.18
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wrap(index, length) {
    if (!Number.isFinite(length) || length <= 0) return 0;
    return ((Math.floor(index) % length) + length) % length;
  }

  function smoothStep(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function buildSegments(trackDef) {
    if (!trackDef || !Array.isArray(trackDef.segments)) {
      throw new Error('Track definition inválida: falta segments[]');
    }

    const segments = [];
    let previousCurve = 0;
    let previousHill = 0;

    for (const block of trackDef.segments) {
      const count = Math.max(1, Math.floor(block.count || 1));
      const targetCurve = Number(block.curve || 0);
      const targetHill = Number(block.hill || 0);
      const zone = String(block.zone || 'coast');

      for (let i = 0; i < count; i++) {
        const t = smoothStep(i / Math.max(1, count - 1));
        segments.push({
          index: segments.length,
          curve: previousCurve + (targetCurve - previousCurve) * t,
          hill: previousHill + (targetHill - previousHill) * t,
          zone
        });
      }

      previousCurve = targetCurve;
      previousHill = targetHill;
    }

    return segments;
  }

  function trackLength(segments) {
    return segments.length * ROAD.segmentLength;
  }

  function findSegment(segments, z) {
    const index = wrap(z / ROAD.segmentLength, segments.length);
    return segments[index];
  }

  function project(worldX, worldY, worldZ, cameraX, cameraY, cameraZ, width, height) {
    const dz = Math.max(1, worldZ - cameraZ);
    const scale = ROAD.cameraDepth / dz;
    return {
      x: Math.round((1 + scale * (worldX - cameraX)) * width * 0.5),
      y: Math.round((1 - scale * (worldY - cameraY)) * height * 0.5),
      w: Math.max(1, Math.round(scale * ROAD.roadWidth * width * 0.5)),
      scale
    };
  }

  function getRoadOffsetAt(segments, baseIndex, count, basePercent) {
    let x = 0;
    let dx = -(segments[wrap(baseIndex, segments.length)].curve * basePercent);
    for (let i = 0; i < count; i++) {
      const seg = segments[wrap(baseIndex + i, segments.length)];
      x += dx;
      dx += seg.curve * 0.011;
    }
    return x;
  }

  function runTests(trackDef) {
    const testSegments = buildSegments(trackDef);
    console.assert(Array.isArray(testSegments), 'RoadEngine: buildSegments devuelve array');
    console.assert(testSegments.length > 100, 'RoadEngine: track suficientemente largo');
    console.assert(typeof testSegments[0].curve === 'number', 'RoadEngine: curve numérico');
    console.assert(typeof testSegments[0].hill === 'number', 'RoadEngine: hill numérico');
    console.assert(wrap(-1, 10) === 9, 'RoadEngine: wrap negativos');
    console.assert(wrap(10, 10) === 0, 'RoadEngine: wrap overflow');
    const p = project(0, 0, 100, 0, ROAD.cameraHeight, 0, 800, 600);
    console.assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.w), 'RoadEngine: project finito');
  }

  return {
    ROAD,
    clamp,
    wrap,
    buildSegments,
    trackLength,
    findSegment,
    project,
    getRoadOffsetAt,
    runTests
  };
})();
