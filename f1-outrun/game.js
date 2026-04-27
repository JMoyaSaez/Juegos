'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const trackDef = window.TRACKS.coastRun;
  const segments = window.RoadEngine.buildSegments(trackDef);
  const keys = Object.create(null);

  const state = {
    mode: 'title',
    countdown: 3,
    countdownTick: 0,
    timeLeft: trackDef.time,
    score: 0,
    lap: 1,
    totalLaps: trackDef.laps,
    gear: 1,
    player: { x: 0, z: 0, speed: 0, maxSpeed: 330, steerLean: 0 },
    rivals: createRivals(),
    bestLap: null,
    lapTime: 0,
    position: 8,
    horizonCurve: 0,
    skyScroll: 0,
    titlePulse: 0,
    cameraShake: 0,
    flash: 0
  };

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('keydown', event => {
    keys[event.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) {
      event.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('keyup', event => {
    keys[event.key] = false;
  });

  function createRivals() {
    const colors = ['#ff5a36', '#ffd541', '#3cc8ff', '#ffffff', '#ff71d1', '#86ff6a', '#b587ff'];
    const rivals = [];
    for (let i = 0; i < 7; i++) {
      rivals.push({
        x: Math.random() * 1.4 - 0.7,
        z: (i + 1) * window.RoadEngine.ROAD.segmentLength * 18,
        speed: 190 + Math.random() * 60,
        color: colors[i % colors.length],
        wobble: Math.random() * Math.PI * 2
      });
    }
    return rivals;
  }

  function resetGame() {
    state.mode = 'title';
    state.countdown = 3;
    state.countdownTick = 0;
    state.timeLeft = trackDef.time;
    state.score = 0;
    state.lap = 1;
    state.gear = 1;
    state.player.x = 0;
    state.player.z = 0;
    state.player.speed = 0;
    state.player.maxSpeed = 330;
    state.player.steerLean = 0;
    state.rivals = createRivals();
    state.bestLap = null;
    state.lapTime = 0;
    state.position = 8;
    state.horizonCurve = 0;
    state.cameraShake = 0;
    state.flash = 0;
  }

  function startRace() {
    state.mode = 'countdown';
    state.countdown = 3;
    state.countdownTick = 0;
    state.player.x = 0;
    state.player.z = 0;
    state.player.speed = 0;
    state.flash = 1;
  }

  function update(dt) {
    state.skyScroll += dt * 14;
    state.titlePulse += dt * 4.2;
    state.cameraShake *= 0.88;
    state.flash *= 0.92;

    if (keys.r || keys.R) {
      keys.r = false;
      keys.R = false;
      resetGame();
      return;
    }

    if (state.mode === 'title') {
      state.player.z += 95 * window.RoadEngine.ROAD.segmentLength * 0.03 * dt;
      if (keys[' '] || keys.Enter) {
        keys[' '] = false;
        keys.Enter = false;
        startRace();
      }
      return;
    }

    if (state.mode === 'countdown') {
      state.countdownTick += dt;
      if (state.countdownTick >= 1) {
        state.countdownTick = 0;
        state.countdown -= 1;
        state.flash = 1;
        if (state.countdown <= 0) {
          state.mode = 'race';
        }
      }
      return;
    }

    if (state.mode === 'finished') {
      if (keys[' '] || keys.Enter) {
        keys[' '] = false;
        keys.Enter = false;
        resetGame();
      }
      return;
    }

    updateRace(dt);
  }

  function updateRace(dt) {
    const p = state.player;
    const road = window.RoadEngine.ROAD;
    const len = window.RoadEngine.trackLength(segments);
    const seg = window.RoadEngine.findSegment(segments, p.z + road.cameraHeight * road.cameraDepth);
    const curve = seg.curve;

    if (keys.ArrowUp) p.speed += 135 * dt;
    else p.speed -= 35 * dt;
    if (keys.ArrowDown) p.speed -= 220 * dt;
    if (keys[' '] && p.speed > 215) p.speed += 45 * dt;

    p.speed = window.RoadEngine.clamp(p.speed, 0, p.maxSpeed);

    const steerPower = (0.82 + (p.speed / p.maxSpeed) * 1.45) * dt;
    let steerDirection = 0;
    if (keys.ArrowLeft) {
      p.x -= steerPower;
      steerDirection -= 1;
    }
    if (keys.ArrowRight) {
      p.x += steerPower;
      steerDirection += 1;
    }

    p.x -= curve * 1.85 * dt * (0.46 + p.speed / p.maxSpeed);
    p.steerLean += (steerDirection - p.steerLean) * Math.min(1, dt * 8);

    if (Math.abs(p.x) > 1.08) {
      p.speed -= 95 * dt;
      state.cameraShake = 3 + p.speed * 0.02;
    }

    p.speed = window.RoadEngine.clamp(p.speed, 0, p.maxSpeed);
    p.x = window.RoadEngine.clamp(p.x, -1.38, 1.38);
    p.z += p.speed * road.segmentLength * 0.112 * dt;

    state.horizonCurve += (curve - state.horizonCurve) * Math.min(1, dt * 2.2);
    state.lapTime += dt;
    state.timeLeft -= dt;
    state.score += p.speed * dt * 0.9;
    state.gear = window.RoadEngine.clamp(1 + Math.floor((p.speed / p.maxSpeed) * 5.99), 1, 6);

    if (p.z >= len) {
      p.z -= len;
      state.bestLap = state.bestLap === null ? state.lapTime : Math.min(state.bestLap, state.lapTime);
      state.lapTime = 0;
      state.lap += 1;
      state.timeLeft += 17;
      state.flash = 1;
      if (state.lap > state.totalLaps) {
        state.lap = state.totalLaps;
        state.mode = 'finished';
      }
    }

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.mode = 'finished';
    }

    updateRivals(dt, len);
    updatePosition(len);
  }

  function updateRivals(dt, len) {
    const p = state.player;
    const road = window.RoadEngine.ROAD;

    for (const rival of state.rivals) {
      rival.z += rival.speed * road.segmentLength * 0.106 * dt;
      if (rival.z >= len) rival.z -= len;

      const seg = window.RoadEngine.findSegment(segments, rival.z);
      rival.x += Math.sin(performance.now() * 0.0015 + rival.wobble) * 0.001;
      rival.x -= seg.curve * dt * 0.58;
      rival.x = window.RoadEngine.clamp(rival.x, -0.96, 0.96);

      let dz = rival.z - p.z;
      if (dz < -len / 2) dz += len;
      if (dz > len / 2) dz -= len;

      if (Math.abs(dz) < road.segmentLength * 2.4 && Math.abs(rival.x - p.x) < 0.22) {
        p.speed *= 0.73;
        p.x += p.x < rival.x ? -0.13 : 0.13;
        state.cameraShake = 5;
        state.flash = 0.45;
      }
    }
  }

  function updatePosition(len) {
    const p = state.player;
    const ahead = state.rivals.filter(rival => {
      let dz = rival.z - p.z;
      if (dz < 0) dz += len;
      return dz > 0;
    }).length;
    state.position = 1 + ahead;
  }

  function render() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    window.SpritePainter.drawSky(ctx, width, height, state.horizonCurve, state.skyScroll);
    renderRoad(width, height);
    renderHUD(width, height);
    renderMessages(width, height);
  }

  function renderRoad(width, height) {
    const p = state.player;
    const road = window.RoadEngine.ROAD;
    const shakeX = (Math.random() - 0.5) * state.cameraShake;
    const shakeY = (Math.random() - 0.5) * state.cameraShake * 0.5;
    const baseIndex = window.RoadEngine.wrap(Math.floor(p.z / road.segmentLength), segments.length);
    const basePercent = (p.z % road.segmentLength) / road.segmentLength;

    let x = 0;
    let dx = -(window.RoadEngine.findSegment(segments, p.z).curve * basePercent);
    let prevY = height;
    const roadside = [];

    for (let n = 0; n < road.drawDistance; n++) {
      const seg = segments[window.RoadEngine.wrap(baseIndex + n, segments.length)];
      const p1 = window.RoadEngine.project(
        x * road.roadWidth - p.x * road.roadWidth,
        0,
        n * road.segmentLength - (p.z % road.segmentLength),
        0,
        road.cameraHeight,
        0,
        width,
        height
      );
      const p2 = window.RoadEngine.project(
        (x + dx) * road.roadWidth - p.x * road.roadWidth,
        seg.hill * 840,
        (n + 1) * road.segmentLength - (p.z % road.segmentLength),
        0,
        road.cameraHeight,
        0,
        width,
        height
      );

      x += dx;
      dx += seg.curve * 0.011;

      if (p2.y >= prevY || p2.y >= height) continue;

      drawRoadSlice(ctx, width, prevY, p1, p2, baseIndex + n, shakeX, shakeY);
      collectRoadsideObjects(roadside, seg, n, p2);
      prevY = p2.y;
    }

    renderRoadside(roadside);
    renderRivals(width, height, shakeX, shakeY);
    window.SpritePainter.drawSpeedLines(ctx, width, height, p.speed / p.maxSpeed, state.skyScroll);
    window.SpritePainter.drawPlayerCar(ctx, width, height, p.x, p.steerLean, shakeX, shakeY);
  }

  function drawRoadSlice(context, width, prevY, p1, p2, index, shakeX, shakeY) {
    const road = window.RoadEngine.ROAD;
    const grass = Math.floor(index / 3) % 2 === 0 ? '#2ad13f' : '#22b834';
    const rumble = Math.floor(index / 2) % 2 === 0 ? '#ffffff' : '#ff2c2c';
    const asphalt = Math.floor(index / 2) % 2 === 0 ? '#6f7078' : '#7c7d86';

    context.fillStyle = grass;
    context.fillRect(0, p2.y + shakeY, width, prevY - p2.y + 1);

    context.fillStyle = rumble;
    polygon(context, [
      [p1.x - p1.w * road.rumbleWidth + shakeX, prevY + shakeY],
      [p1.x - p1.w + shakeX, prevY + shakeY],
      [p2.x - p2.w + shakeX, p2.y + shakeY],
      [p2.x - p2.w * road.rumbleWidth + shakeX, p2.y + shakeY]
    ]);
    polygon(context, [
      [p1.x + p1.w + shakeX, prevY + shakeY],
      [p1.x + p1.w * road.rumbleWidth + shakeX, prevY + shakeY],
      [p2.x + p2.w * road.rumbleWidth + shakeX, p2.y + shakeY],
      [p2.x + p2.w + shakeX, p2.y + shakeY]
    ]);

    const roadGrad = context.createLinearGradient(0, p2.y, 0, prevY);
    roadGrad.addColorStop(0, asphalt);
    roadGrad.addColorStop(1, '#45464d');
    context.fillStyle = roadGrad;
    polygon(context, [
      [p1.x - p1.w + shakeX, prevY + shakeY],
      [p1.x + p1.w + shakeX, prevY + shakeY],
      [p2.x + p2.w + shakeX, p2.y + shakeY],
      [p2.x - p2.w + shakeX, p2.y + shakeY]
    ]);

    if (index % 10 < 5) {
      context.strokeStyle = '#ffffff';
      context.lineWidth = Math.max(1, p2.w * 0.038);
      for (let lane = 1; lane < road.lanes; lane++) {
        const lanePos = lane / road.lanes * 2 - 1;
        context.beginPath();
        context.moveTo(p1.x + lanePos * p1.w + shakeX, prevY + shakeY);
        context.lineTo(p2.x + lanePos * p2.w + shakeX, p2.y + shakeY);
        context.stroke();
      }
    }
  }

  function polygon(context, points) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i][0], points[i][1]);
    }
    context.closePath();
    context.fill();
  }

  function collectRoadsideObjects(list, seg, n, p2) {
    if (n % 7 === 0) {
      list.push({ type: 'palmL', x: p2.x - p2.w * 1.62, y: p2.y, s: Math.max(0.28, p2.scale * 3.4) });
      list.push({ type: 'palmR', x: p2.x + p2.w * 1.62, y: p2.y, s: Math.max(0.28, p2.scale * 3.4) });
    }
    if (seg.zone === 'crowd' && n % 10 === 0) {
      list.push({ type: 'crowd', x: p2.x - p2.w * 2.1, y: p2.y + 2, s: Math.max(0.55, p2.scale * 4.0) });
      list.push({ type: 'crowd', x: p2.x + p2.w * 1.75, y: p2.y + 2, s: Math.max(0.55, p2.scale * 4.0) });
    }
    if ((seg.zone === 'coast' || seg.zone === 'sunset' || seg.zone === 'beach') && n % 18 === 2) {
      list.push({
        type: 'billboard',
        x: p2.x + p2.w * 1.9,
        y: p2.y - 3,
        s: Math.max(0.48, p2.scale * 4.2),
        label: n % 36 === 2 ? 'TURBO' : 'F1'
      });
    }
  }

  function renderRoadside(list) {
    list.sort((a, b) => a.s - b.s);
    for (const item of list) {
      if (item.type === 'palmL') window.SpritePainter.drawPalm(ctx, item.x, item.y, item.s, 'left');
      else if (item.type === 'palmR') window.SpritePainter.drawPalm(ctx, item.x, item.y, item.s, 'right');
      else if (item.type === 'crowd') window.SpritePainter.drawCrowd(ctx, item.x, item.y, item.s);
      else if (item.type === 'billboard') window.SpritePainter.drawBillboard(ctx, item.x, item.y, item.s, item.label);
    }
  }

  function renderRivals(width, height, shakeX, shakeY) {
    const road = window.RoadEngine.ROAD;
    const p = state.player;
    const len = window.RoadEngine.trackLength(segments);
    const drawList = [];

    for (const rival of state.rivals) {
      let dz = rival.z - p.z;
      if (dz < 0) dz += len;
      if (dz > road.drawDistance * road.segmentLength) continue;

      const rel = dz / road.segmentLength;
      const seg = window.RoadEngine.findSegment(segments, rival.z);
      const projected = window.RoadEngine.project(
        (rival.x - p.x) * road.roadWidth,
        seg.hill * 840,
        rel * road.segmentLength,
        0,
        road.cameraHeight,
        0,
        width,
        height
      );

      if (projected.y > height * 0.14 && projected.y < height * 0.9) {
        drawList.push({
          x: projected.x + shakeX,
          y: projected.y + shakeY,
          s: Math.max(0.28, projected.scale * 1.35),
          color: rival.color
        });
      }
    }

    drawList.sort((a, b) => a.s - b.s);
    for (const car of drawList) {
      window.SpritePainter.drawRaceCar(ctx, car.x, car.y, car.s, car.color);
    }
  }

  function renderHUD(width, height) {
    const sp = window.SpritePainter;
    sp.text(ctx, 'TIME', width * 0.03, height * 0.08, Math.max(20, height * 0.04), '#ff6f2f', '#fff');
    sp.text(ctx, String(Math.max(0, Math.floor(state.timeLeft))).padStart(2, '0'), width * 0.13, height * 0.08, Math.max(34, height * 0.065), '#ffd541');
    sp.text(ctx, 'SCORE', width * 0.28, height * 0.08, Math.max(20, height * 0.04), '#ff63d7', '#fff');
    sp.text(ctx, String(Math.floor(state.score)).padStart(6, '0'), width * 0.40, height * 0.08, Math.max(32, height * 0.055), '#ffffff');
    sp.text(ctx, 'LAP', width * 0.69, height * 0.08, Math.max(20, height * 0.04), '#66d9ff', '#fff');
    sp.text(ctx, `${state.lap}/${state.totalLaps}`, width * 0.78, height * 0.08, Math.max(32, height * 0.055), '#ffffff');

    renderSpeedBox(width, height);
  }

  function renderSpeedBox(width, height) {
    const boxW = Math.max(190, width * 0.22);
    const boxH = Math.max(82, height * 0.12);
    const x = width * 0.025;
    const y = height * 0.84;
    const ratio = state.player.speed / state.player.maxSpeed;

    ctx.fillStyle = '#1030a5';
    ctx.beginPath();
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + boxW, y);
    ctx.lineTo(x + boxW - 18, y + boxH);
    ctx.lineTo(x, y + boxH);
    ctx.closePath();
    ctx.fill();

    window.SpritePainter.text(ctx, 'SPEED', x + 18, y + 30, Math.max(16, height * 0.03), '#7be7ff');
    window.SpritePainter.text(ctx, String(Math.round(state.player.speed)), x + 54, y + 75, Math.max(36, height * 0.07), '#ffd541');
    window.SpritePainter.text(ctx, 'km/h', x + boxW - 58, y + 72, Math.max(16, height * 0.03), '#ffd541');

    ctx.fillStyle = '#0b1320';
    ctx.fillRect(x + 14, y + boxH - 16, boxW - 34, 9);
    const g = ctx.createLinearGradient(x + 14, 0, x + boxW - 20, 0);
    g.addColorStop(0, '#22c55e');
    g.addColorStop(0.5, '#ffd541');
    g.addColorStop(1, '#ef4444');
    ctx.fillStyle = g;
    ctx.fillRect(x + 14, y + boxH - 16, (boxW - 34) * ratio, 9);
  }

  function renderMessages(width, height) {
    if (state.mode === 'title') {
      window.SpritePainter.drawStartBanner(ctx, width, height, state.titlePulse);
      const blink = Math.sin(state.titlePulse) > -0.25;
      if (blink) {
        window.SpritePainter.text(ctx, 'PULSA ESPACIO', width * 0.5, height * 0.91, Math.max(20, height * 0.04), '#ffffff', '#001026', 'center');
      }
    }

    if (state.mode === 'countdown') {
      window.SpritePainter.text(ctx, String(state.countdown), width * 0.5, height * 0.52, Math.max(56, height * 0.12), '#ffd541', '#7a0000', 'center');
    }

    if (state.mode === 'finished') {
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(0, 0, width, height);
      window.SpritePainter.text(ctx, 'GOAL!', width * 0.5, height * 0.45, Math.max(56, height * 0.11), '#ffd541', '#7a0000', 'center');
      window.SpritePainter.text(ctx, 'PULSA ESPACIO', width * 0.5, height * 0.62, Math.max(22, height * 0.04), '#ffffff', '#001026', 'center');
    }

    if (state.flash > 0.05) {
      ctx.fillStyle = `rgba(255,255,255,${0.10 * state.flash})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function runTests() {
    window.RoadEngine.runTests(trackDef);
    console.assert(Array.isArray(segments), 'Game: segments debe ser array');
    console.assert(segments.length > 100, 'Game: segments debe tener contenido');
    console.assert(typeof window.SpritePainter.drawPlayerCar === 'function', 'Game: SpritePainter cargado');
    console.assert(typeof window.SpritePainter.drawSpeedLines === 'function', 'Game: drawSpeedLines cargado');
    console.assert(typeof window.RoadEngine.findSegment(segments, 0).curve === 'number', 'Game: findSegment válido');
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  runTests();
  requestAnimationFrame(loop);
})();
