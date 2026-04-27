'use strict';

window.SpritePainter = (() => {
  function text(ctx, value, x, y, size, fill, stroke = '#001026', align = 'left') {
    ctx.save();
    ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = align;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.15);
    ctx.strokeStyle = stroke;
    ctx.strokeText(value, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function drawSky(ctx, width, height, horizonCurve, skyScroll) {
    const g = ctx.createLinearGradient(0, 0, 0, height * 0.67);
    g.addColorStop(0.00, '#2028a8');
    g.addColorStop(0.26, '#7435bd');
    g.addColorStop(0.58, '#ff5ea4');
    g.addColorStop(1.00, '#ffb24d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    drawCloudBands(ctx, width, height, skyScroll);
    drawSun(ctx, width, height, horizonCurve);
    drawMountains(ctx, width, height, horizonCurve);
    drawSea(ctx, width, height, skyScroll);
  }

  function drawCloudBands(ctx, width, height, skyScroll) {
    for (let i = 0; i < 5; i++) {
      const y = height * 0.09 + i * height * 0.06;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,195,125,0.45)' : 'rgba(255,120,198,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 20) {
        const yy = y + Math.sin(x * 0.012 + i * 0.9 + skyScroll * 0.04) * (5 + i);
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function drawSun(ctx, width, height, horizonCurve) {
    const x = width * 0.5 + horizonCurve * width * 0.12;
    const y = height * 0.31;
    const r = height * 0.14;
    ctx.fillStyle = '#ffe85c';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = Math.max(2, height * 0.004);
    for (let i = -3; i <= 3; i++) {
      const yy = y + i * r * 0.18;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.82, yy);
      ctx.lineTo(x + r * 0.82, yy);
      ctx.stroke();
    }
  }

  function drawMountains(ctx, width, height, horizonCurve) {
    const base = height * 0.50;
    const shift = horizonCurve * width * 0.10;
    const peaks = [
      { x: width * 0.15 + shift * 0.5, h: height * 0.11, c: '#4c2b8a' },
      { x: width * 0.37 + shift * 0.3, h: height * 0.18, c: '#5b34a3' },
      { x: width * 0.52 + shift * 0.15, h: height * 0.09, c: '#7040b7' },
      { x: width * 0.72 + shift * 0.2, h: height * 0.15, c: '#4c2b8a' },
      { x: width * 0.91 + shift * 0.35, h: height * 0.10, c: '#5b34a3' }
    ];

    for (const peak of peaks) {
      ctx.fillStyle = peak.c;
      ctx.beginPath();
      ctx.moveTo(peak.x - width * 0.16, base);
      ctx.lineTo(peak.x, base - peak.h);
      ctx.lineTo(peak.x + width * 0.18, base);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawSea(ctx, width, height, skyScroll) {
    const y = height * 0.49;
    ctx.fillStyle = '#1787da';
    ctx.fillRect(0, y, width, height * 0.09);
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.38)' : 'rgba(255,240,160,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const yy = y + 8 + i * 11;
      for (let x = 0; x <= width; x += 22) {
        const wave = yy + Math.sin(x * 0.028 + i * 0.8 + skyScroll * 0.1) * 2;
        if (x === 0) ctx.moveTo(x, wave);
        else ctx.lineTo(x, wave);
      }
      ctx.stroke();
    }
  }

  function drawPalm(ctx, x, y, scale, side) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ad7a4a';
    ctx.fillRect(-4, -48, 8, 52);
    ctx.fillStyle = '#7d5432';
    for (let i = 0; i < 6; i++) ctx.fillRect(-4, -44 + i * 8, 8, 2);

    ctx.strokeStyle = '#24d56f';
    ctx.lineWidth = 5;
    const dir = side === 'left' ? -1 : 1;
    for (let i = 0; i < 6; i++) {
      const a = -1.8 + i * 0.48;
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(Math.cos(a) * 30 * dir, -48 + Math.sin(a) * 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBillboard(ctx, x, y, scale, label) {
    const width = 58 * scale;
    const height = 36 * scale;
    ctx.fillStyle = '#e71d36';
    ctx.fillRect(x - width / 2 - 3 * scale, y - height - 3 * scale, width + 6 * scale, height + 6 * scale);
    ctx.fillStyle = '#0f3cff';
    ctx.fillRect(x - width / 2, y - height, width, height);
    ctx.fillStyle = '#fff7de';
    ctx.fillRect(x - width * 0.42, y - height * 0.82, width * 0.84, height * 0.62);
    text(ctx, label, x, y - height * 0.36, Math.max(8, 9 * scale), '#ff2d2d', '#001026', 'center');
    ctx.fillStyle = '#7d5432';
    ctx.fillRect(x - 2 * scale, y, 4 * scale, height * 0.8);
  }

  function drawCrowd(ctx, x, y, scale) {
    const width = 40 * scale;
    const height = 24 * scale;
    ctx.fillStyle = '#efdcc0';
    ctx.fillRect(x, y - height, width, height);
    const colors = ['#ff5d73', '#3cc8ff', '#ffd541', '#35d070', '#ffffff', '#b587ff'];
    for (let i = 0; i < 18; i++) {
      const px = x + 3 + (i * 9) % Math.max(10, width - 8);
      const py = y - height + 3 + ((i * 13) % Math.max(10, height - 8));
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(px, py + 5, 5, 7);
      ctx.fillStyle = '#f4cfb0';
      ctx.fillRect(px + 1, py, 3, 4);
    }
  }

  function drawRaceCar(ctx, x, y, scale, color) {
    const width = 56 * scale;
    const height = 30 * scale;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#111';
    ctx.fillRect(-width * 0.55, height * 0.05, width * 0.18, height * 0.45);
    ctx.fillRect(width * 0.37, height * 0.05, width * 0.18, height * 0.45);

    const g = ctx.createLinearGradient(0, -height * 0.62, 0, height * 0.42);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.18, color);
    g.addColorStop(1, '#701010');
    ctx.fillStyle = g;
    ctx.fillRect(-width * 0.27, -height * 0.42, width * 0.54, height * 0.82);
    ctx.fillRect(-width * 0.10, -height * 0.66, width * 0.20, height * 0.24);

    ctx.fillStyle = '#dff6ff';
    ctx.fillRect(-width * 0.14, -height * 0.26, width * 0.28, height * 0.12);
    ctx.fillStyle = '#222';
    ctx.fillRect(-width * 0.38, -height * 0.02, width * 0.76, height * 0.08);
    ctx.fillStyle = '#ffba08';
    ctx.fillRect(-width * 0.05, height * 0.29, width * 0.10, height * 0.11);

    ctx.restore();
  }

  function drawPlayerCar(ctx, width, height, playerX, lean, shakeX, shakeY) {
    const x = width * 0.5 + playerX * width * 0.19 + shakeX;
    const y = height * 0.84 + shakeY;
    const scale = Math.max(1, height / 480);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.transform(1, 0, lean * 0.05, 1, 0, 0);

    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath();
    ctx.ellipse(0, 31, 72, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#070707';
    ctx.fillRect(-70, 10, 25, 42);
    ctx.fillRect(45, 10, 25, 42);
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(-64, 14, 16, 8);
    ctx.fillRect(48, 14, 16, 8);

    const body = ctx.createLinearGradient(0, -54, 0, 40);
    body.addColorStop(0, '#fff4b8');
    body.addColorStop(0.15, '#ff633a');
    body.addColorStop(0.70, '#d51f1f');
    body.addColorStop(1.00, '#760606');
    ctx.fillStyle = body;
    ctx.fillRect(-40, -30, 80, 66);
    ctx.fillRect(-13, -54, 26, 24);

    ctx.fillStyle = '#121212';
    ctx.fillRect(-62, -7, 124, 9);
    ctx.fillStyle = '#ff2d2d';
    ctx.fillRect(-58, -13, 116, 7);

    ctx.fillStyle = '#ffe14c';
    ctx.beginPath();
    ctx.arc(0, -41, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3acbff';
    ctx.fillRect(-8, -37, 16, 8);

    ctx.fillStyle = '#effbff';
    ctx.fillRect(-19, -11, 38, 13);
    ctx.fillStyle = '#252525';
    ctx.fillRect(-9, 35, 18, 8);
    ctx.fillStyle = '#ffba08';
    ctx.fillRect(-5, 37, 10, 6);

    ctx.restore();
  }

  function drawSpeedLines(ctx, width, height, speedRatio, scroll) {
    if (speedRatio < 0.35) return;
    ctx.save();
    ctx.globalAlpha = 0.07 + speedRatio * 0.11;
    ctx.strokeStyle = '#fff7d1';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = (i / 13) * width + Math.sin(scroll + i) * 30;
      ctx.beginPath();
      ctx.moveTo(x, height * 0.58 + i * 4);
      ctx.lineTo(x - 18 - speedRatio * 60, height * 0.92);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStartBanner(ctx, width, height, pulse) {
    const y = height * 0.15 + Math.sin(pulse) * 3;
    ctx.fillStyle = '#ececec';
    ctx.fillRect(width * 0.22, y, width * 0.56, height * 0.09);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(width * 0.22 - 10, y, 10, height * 0.18);
    ctx.fillRect(width * 0.78, y, 10, height * 0.18);
    text(ctx, 'START', width * 0.5, y + height * 0.066, Math.max(34, height * 0.07), '#ff2d2d', '#5c0000', 'center');
  }

  return {
    text,
    drawSky,
    drawPalm,
    drawBillboard,
    drawCrowd,
    drawRaceCar,
    drawPlayerCar,
    drawSpeedLines,
    drawStartBanner
  };
})();
