(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  const keys = Object.create(null);
  addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)) e.preventDefault();
  }, { passive: false });
  addEventListener('keyup', e => { keys[e.key] = false; });

  const trackDef = TRACKS.coastRun;
  const segments = RoadEngine.buildSegments(trackDef);

  const state = {
    mode: 'title',
    countdown: 3,
    countdownTick: 0,
    timeLeft: trackDef.time,
    score: 0,
    lap: 1,
    totalLaps: trackDef.laps,
    gear: 1,
    player: { x: 0, z: 0, speed: 0, maxSpeed: 330 },
    bestLap: null,
    lapTime: 0,
    position: 8,
    rivals: createRivals(),
    horizonCurve: 0,
    skyScroll: 0,
    cameraShake: 0,
    flash: 0
  };

  function createRivals() {
    const colors = ['#ff5a36', '#ffd541', '#3cc8ff', '#ffffff', '#ff71d1', '#86ff6a', '#b587ff'];
    const arr = [];
    for (let i = 0; i < 7; i++) {
      arr.push({
        x: (Math.random() * 1.4 - 0.7),
        z: (i + 1) * RoadEngine.ROAD.segLen * 18,
        speed: 190 + Math.random() * 60,
        color: colors[i % colors.length],
        wobble: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function startRace() {
    state.mode = 'countdown';
    state.countdown = 3;
    state.countdownTick = 0;
    state.flash = 1;
  }

  function update(dt) {
    state.skyScroll += dt * 14;
    state.cameraShake *= 0.88;
    state.flash *= 0.92;

    if (state.mode === 'title') {
      if (keys[' '] || keys.Enter) {
        keys[' '] = false;
        keys.Enter = false;
        startRace();
      }
      return;
})();
