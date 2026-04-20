window.RoadEngine = (() => {
  const ROAD = {
    segLen: 220,
    roadWidth: 2200,
    drawDistance: 180,
    cameraHeight: 920,
    cameraDepth: 0.92,
    rumble: 1.18,
    lanes: 3
  };

  function wrap(n, max) {
    return ((n % max) + max) % max;
  }

  function buildSegments(trackDef) {
    const segments = [];
    for (const block of trackDef.segments) {
      for (let i = 0; i < block.count; i++) {
        segments.push({
          index: segments.length,
          curve: block.curve,
          hill: block.hill,
          zone: block.zone
        });
      }
    }
    return segments;
  }

  function project(worldX, worldY, worldZ, cameraX, cameraY, cameraZ, width, height) {
    const dz = Math.max(1, worldZ - cameraZ);
    const scale = ROAD.cameraDepth / dz;
    return {
      x: Math.round((1 + scale * (worldX - cameraX)) * width * 0.5),
      y: Math.round((1 - scale * (worldY - cameraY)) * height * 0.5),
      w: Math.max(1, Math.round(scale * ROAD.roadWidth * width * 0.5)),
      s: scale
    };
  }

  function findSegment(segments, z) {
    const index = wrap(Math.floor(z / ROAD.segLen), segments.length);
    return segments[index];
  }

  function trackLength(segments) {
    return segments.length * ROAD.segLen;
  }

  return {
    ROAD,
    wrap,
    buildSegments,
    project,
    findSegment,
    trackLength
  };
})();
