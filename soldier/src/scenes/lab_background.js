window.SKY = window.SKY || {};

window.SKY.LabBackground = {
  draw(ctx, world) {
    const W = world.W;
    const H = world.H;
    const groundY = world.GROUND_Y;
    const t = world.time || 0;
    const px = world.player ? world.player.x : 0;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#172637');
    sky.addColorStop(.36, '#0c1420');
    sky.addColorStop(.72, '#070910');
    sky.addColorStop(1, '#030405');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Distant electric moon / reactor glow.
    ctx.save();
    ctx.globalAlpha = .28;
    const reactorX = 970 - ((px * .015) % 30);
    const reactorY = 170;
    const rg = ctx.createRadialGradient(reactorX, reactorY, 10, reactorX, reactorY, 310);
    rg.addColorStop(0, 'rgba(105, 228, 255, .72)');
    rg.addColorStop(.28, 'rgba(75, 145, 225, .22)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(reactorX - 350, reactorY - 350, 700, 700);
    ctx.restore();

    // Far skyline / hangar mass.
    ctx.save();
    ctx.globalAlpha = .35;
    ctx.fillStyle = '#172230';
    for (let i = -2; i < 14; i++) {
      const x = i * 145 - ((px * .05) % 145);
      const h = 88 + ((i * 47) % 120);
      ctx.fillRect(x, groundY - 255 - h * .22, 90, h);
      ctx.fillRect(x + 18, groundY - 302 - h * .13, 42, 55);
    }
    ctx.restore();

    // Mid hangar beams, rich enough to feel like an arcade stage but still procedural.
    ctx.save();
    ctx.globalAlpha = .40;
    for (let i = -2; i < 13; i++) {
      const x = i * 178 - ((px * .11) % 178);
      ctx.fillStyle = '#1e2b35';
      ctx.fillRect(x, 142, 26, groundY - 108);
      ctx.fillRect(x - 52, 176, 130, 14);
      ctx.fillStyle = 'rgba(90, 170, 210, .20)';
      ctx.fillRect(x + 8, 152, 4, groundY - 128);
      ctx.fillRect(x - 40, 181, 106, 3);
    }
    ctx.restore();

    // Moving scan lines / rain-like particles in the background.
    ctx.save();
    ctx.globalAlpha = .17;
    ctx.strokeStyle = '#9fd8ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 38; i++) {
      const x = (i * 41 + t * 28 + px * .03) % (W + 80) - 40;
      const y = (i * 73 + t * 115) % (groundY - 80) + 34;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 12, y + 22);
      ctx.stroke();
    }
    ctx.restore();

    // Parallax diagonal grid.
    ctx.save();
    ctx.globalAlpha = .13;
    ctx.strokeStyle = '#b7d7e8';
    ctx.lineWidth = 1;
    for (let x = -W; x < W * 2; x += 64) {
      const xx = x - ((px * .04) % 64);
      ctx.beginPath();
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx - 160, H);
      ctx.stroke();
    }
    ctx.restore();

    // Volumetric lights.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 300 - ((px * .025) % 160);
      const alpha = .06 + Math.sin(t * 1.3 + i) * .018;
      const g = ctx.createLinearGradient(x, 70, x + 110, groundY);
      g.addColorStop(0, `rgba(110,220,255,${alpha})`);
      g.addColorStop(1, 'rgba(110,220,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 34, 68);
      ctx.lineTo(x + 54, 68);
      ctx.lineTo(x + 205, groundY);
      ctx.lineTo(x - 170, groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Floor base.
    const floor = ctx.createLinearGradient(0, groundY, 0, H);
    floor.addColorStop(0, '#333941');
    floor.addColorStop(.30, '#24282f');
    floor.addColorStop(1, '#111319');
    ctx.fillStyle = floor;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Floor top line and panels.
    ctx.fillStyle = '#59616d';
    ctx.fillRect(0, groundY, W, 5);
    ctx.fillStyle = 'rgba(91, 196, 255, .22)';
    ctx.fillRect(0, groundY + 5, W, 2);

    for (let x = -160; x < W + 200; x += 142) {
      const xx = x - ((px * .22) % 142);
      ctx.fillStyle = 'rgba(255,255,255,.040)';
      ctx.fillRect(xx, groundY + 18, 84, 4);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(xx + 96, groundY + 1, 2, H - groundY);
      ctx.fillStyle = 'rgba(105, 205, 255, .16)';
      ctx.fillRect(xx + 14, groundY + 48, 48, 3);
    }

    // Mission target glow zone.
    ctx.save();
    ctx.globalAlpha = .22;
    const targetX = SKY.Config.enemy.targetX;
    const eg = ctx.createRadialGradient(targetX, groundY, 20, targetX, groundY, 255);
    eg.addColorStop(0, 'rgba(70,220,255,.52)');
    eg.addColorStop(1, 'rgba(70,220,255,0)');
    ctx.fillStyle = eg;
    ctx.fillRect(targetX - 270, groundY - 230, 540, 285);
    ctx.restore();

    // Foreground dark cover at the bottom gives arcade depth.
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = '#050608';
    for (let x = -100; x < W + 160; x += 210) {
      const xx = x - ((px * .34) % 210);
      ctx.fillRect(xx, groundY + 82, 120, 18);
      ctx.fillRect(xx + 62, groundY + 64, 32, 40);
    }
    ctx.restore();

    const v = ctx.createRadialGradient(W / 2, H / 2, 110, W / 2, H / 2, 760);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.60)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
};
