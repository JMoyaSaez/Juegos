window.SKY = window.SKY || {};

window.SKY.Stage01Background = {
  draw(ctx, world) {
    const W = world.W;
    const H = world.H;
    const groundY = world.GROUND_Y;
    const t = world.time || 0;
    const px = world.player ? world.player.x : 0;
    const mode = world.stage?.backgroundMode || 'normal';
    const alert = mode === 'alert' || mode === 'boss' ? 1 : 0;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, alert ? '#24141a' : '#102136');
    sky.addColorStop(.35, alert ? '#11101b' : '#071221');
    sky.addColorStop(.72, '#05070d');
    sky.addColorStop(1, '#020304');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Far energy glow: cold during stage, amber/red during boss alert.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .34;
    const reactorX = 960 - ((px * .012) % 34);
    const reactorY = 158;
    const rg = ctx.createRadialGradient(reactorX, reactorY, 8, reactorX, reactorY, 355);
    if (alert) {
      rg.addColorStop(0, 'rgba(255,95,42,.72)');
      rg.addColorStop(.28, 'rgba(255,118,38,.23)');
    } else {
      rg.addColorStop(0, 'rgba(105,228,255,.76)');
      rg.addColorStop(.28, 'rgba(70,142,230,.24)');
    }
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(reactorX - 400, reactorY - 360, 800, 720);
    ctx.restore();

    // Distant skyline and launch silos.
    ctx.save();
    ctx.globalAlpha = .50;
    for (let i = -3; i < 16; i++) {
      const x = i * 132 - ((px * .035) % 132);
      const h = 76 + ((i * 53) % 145);
      ctx.fillStyle = i % 3 === 0 ? '#14202c' : '#101923';
      ctx.fillRect(x, groundY - 260 - h * .20, 82, h);
      ctx.fillRect(x + 22, groundY - 308 - h * .12, 36, 58);
      ctx.fillStyle = alert ? 'rgba(255,90,45,.22)' : 'rgba(90,190,255,.18)';
      ctx.fillRect(x + 33, groundY - 295 - h * .12, 5, 52);
    }
    ctx.restore();

    // Massive hangar door / containment bay in the back.
    ctx.save();
    const doorX = 820 - ((px * .07) % 80);
    ctx.globalAlpha = .42;
    ctx.fillStyle = '#111924';
    ctx.fillRect(doorX - 190, 214, 440, groundY - 214);
    ctx.strokeStyle = alert ? 'rgba(255,112,52,.30)' : 'rgba(85,205,255,.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(doorX - 170, 236, 400, groundY - 252);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.025)';
      ctx.fillRect(doorX - 168 + i * 57, 238, 4, groundY - 256);
    }
    ctx.restore();

    // Mid structural beams and catwalks.
    ctx.save();
    ctx.globalAlpha = .55;
    for (let i = -2; i < 13; i++) {
      const x = i * 176 - ((px * .105) % 176);
      ctx.fillStyle = '#1a2935';
      ctx.fillRect(x, 130, 28, groundY - 96);
      ctx.fillRect(x - 60, 170, 145, 15);
      ctx.fillRect(x - 42, 325, 118, 12);
      ctx.fillStyle = alert ? 'rgba(255,105,48,.24)' : 'rgba(90,205,255,.23)';
      ctx.fillRect(x + 9, 145, 4, groundY - 118);
      ctx.fillRect(x - 48, 176, 118, 3);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(x + 27, 145, 7, groundY - 120);
    }
    ctx.restore();

    // Animated warning lamps.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = -1; i < 8; i++) {
      const x = 96 + i * 188 - ((px * .16) % 188);
      const blink = Math.sin(t * (alert ? 9 : 3.2) + i * 1.7) * .5 + .5;
      const color = alert ? `rgba(255,72,36,${0.16 + blink * .28})` : `rgba(70,210,255,${0.08 + blink * .12})`;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, 190 + (i % 2) * 118, 8 + blink * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Rain / sparks layer.
    ctx.save();
    ctx.globalAlpha = alert ? .26 : .18;
    ctx.strokeStyle = alert ? 'rgba(255,190,120,.65)' : 'rgba(170,225,255,.72)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 54; i++) {
      const x = (i * 47 + t * (alert ? 65 : 34) + px * .03) % (W + 90) - 45;
      const y = (i * 71 + t * (alert ? 146 : 112)) % (groundY - 70) + 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 13, y + 24);
      ctx.stroke();
    }
    ctx.restore();

    // Volumetric spotlights.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = 115 + i * 285 - ((px * .025) % 140);
      const alpha = .055 + Math.sin(t * 1.25 + i) * .018 + alert * .015;
      const g = ctx.createLinearGradient(x, 70, x + 95, groundY);
      const c = alert ? '255,120,55' : '110,220,255';
      g.addColorStop(0, `rgba(${c},${alpha})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 30, 66);
      ctx.lineTo(x + 56, 66);
      ctx.lineTo(x + 220, groundY);
      ctx.lineTo(x - 175, groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Foreground playable floor.
    const floor = ctx.createLinearGradient(0, groundY, 0, H);
    floor.addColorStop(0, alert ? '#3c3532' : '#303943');
    floor.addColorStop(.30, '#232930');
    floor.addColorStop(1, '#0e1118');
    ctx.fillStyle = floor;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.fillStyle = '#6c7480';
    ctx.fillRect(0, groundY, W, 5);
    ctx.fillStyle = alert ? 'rgba(255,130,58,.28)' : 'rgba(91,196,255,.26)';
    ctx.fillRect(0, groundY + 5, W, 2);

    // Premium metal plates with perspective details.
    for (let x = -180; x < W + 220; x += 146) {
      const xx = x - ((px * .25) % 146);
      ctx.fillStyle = 'rgba(255,255,255,.045)';
      ctx.fillRect(xx, groundY + 17, 88, 4);
      ctx.fillStyle = 'rgba(0,0,0,.27)';
      ctx.fillRect(xx + 100, groundY + 1, 2, H - groundY);
      ctx.fillStyle = alert ? 'rgba(255,145,66,.16)' : 'rgba(105,205,255,.17)';
      ctx.fillRect(xx + 15, groundY + 48, 54, 3);
      ctx.fillStyle = 'rgba(0,0,0,.17)';
      ctx.beginPath();
      ctx.moveTo(xx + 22, groundY + 80);
      ctx.lineTo(xx + 128, groundY + 80);
      ctx.lineTo(xx + 102, H);
      ctx.lineTo(xx - 4, H);
      ctx.closePath();
      ctx.fill();
    }

    // Low atmospheric fog on the floor.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = (i * 210 - ((px * .18 + t * 12) % 210));
      const g = ctx.createRadialGradient(x, groundY + 28, 8, x, groundY + 28, 150);
      const c = alert ? '255,115,55' : '95,210,255';
      g.addColorStop(0, `rgba(${c},.055)`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - 180, groundY - 48, 360, 160);
    }
    ctx.restore();

    // Front cover / silhouette.
    ctx.save();
    ctx.globalAlpha = .34;
    ctx.fillStyle = '#030507';
    for (let x = -100; x < W + 180; x += 210) {
      const xx = x - ((px * .38) % 210);
      ctx.fillRect(xx, groundY + 82, 125, 18);
      ctx.fillRect(xx + 64, groundY + 64, 34, 40);
    }
    ctx.restore();

    // Boss alert tint overlay.
    if (alert) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(255,54,18,${0.10 + Math.sin(t * 7) * 0.025})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    const v = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 760);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.58)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
};
