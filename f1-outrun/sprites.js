window.SpritePainter = (() => {
  function text(ctx, text, x, y, size, fill, stroke = '#001', align = 'left') {
    ctx.save();
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = align;
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawSky(ctx, w, h, horizonCurve, skyScroll) {
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    g.addColorStop(0, '#2028a8');
    g.addColorStop(0.28, '#7834bf');
    g.addColorStop(0.60, '#ff5f9f');
    g.addColorStop(1, '#ffb04d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 5; i++) {
      const y = h * 0.09 + i * h * 0.06;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,188,120,0.45)' : 'rgba(255,128,192,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const yy = y + Math.sin((x * 0.012) + i * 0.9 + skyScroll * 0.04) * (5 + i);
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    const sunX = w * 0.5 + horizonCurve * w * 0.12;
    const sunY = h * 0.31;
    const sunR = h * 0.14;
    ctx.fillStyle = '#ffe85c';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = Math.max(2, h * 0.004);
    for (let i = -3; i <= 3; i++) {
      const yy = sunY + i * sunR * 0.18;
      ctx.beginPath();
      ctx.moveTo(sunX - sunR * 0.8, yy);
      ctx.lineTo(sunX + sunR * 0.8, yy);
      ctx.stroke();
    }

    const base = h * 0.50;
    const shift = horizonCurve * w * 0.10;
    const peaks = [
      { x: w * 0.16 + shift * 0.5, hh: h * 0.11, c: '#4c2b8a' },
      { x: w * 0.38 + shift * 0.3, hh: h * 0.18, c: '#5b34a3' },
      { x: w * 0.52 + shift * 0.15, hh: h * 0.09, c: '#7040b7' },
      { x: w * 0.71 + shift * 0.2, hh: h * 0.15, c: '#4c2b8a' },
      { x: w * 0.90 + shift * 0.35, hh: h * 0.10, c: '#5b34a3' }
    ];
    for (const p of peaks) {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.moveTo(p.x - w * 0.16, base);
      ctx.lineTo(p.x, base - p.hh);
      ctx.lineTo(p.x + w * 0.18, base);
      ctx.closePath();
      ctx.fill();
    }

    const seaY = h * 0.49;
    ctx.fillStyle = '#1787da';
    ctx.fillRect(0, seaY, w, h * 0.09);
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.36)' : 'rgba(255,240,160,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const yy = seaY + 8 + i * 11;
      for (let x = 0; x <= w; x += 22) {
        const wave = yy + Math.sin(x * 0.028 + i * 0.8 + skyScroll * 0.1) * 2;
        if (x === 0) ctx.moveTo(x, wave);
        else ctx.lineTo(x, wave);
      }
      ctx.stroke();
    }
  }

  function drawPalm(ctx, x, y, s, side) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#ad7a4a';
    ctx.fillRect(-4, -48, 8, 52);
    ctx.fillStyle = '#7d5432';
    for (let i = 0; i < 6; i++) ctx.fillRect(-4, -44 + i * 8, 8, 2);
    ctx.strokeStyle = '#24d56f';
})();
