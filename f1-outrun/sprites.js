window.SpritePainter = (() => {

  function drawCrowd(ctx, x, y, s) {
    const cw = 36 * s;
    const ch = 22 * s;
    ctx.fillStyle = '#efdcc0';
    ctx.fillRect(x, y - ch, cw, ch);
    const cols = ['#ff5d73', '#3cc8ff', '#ffd541', '#35d070', '#ffffff', '#b587ff'];
    for (let i = 0; i < 16; i++) {
      const px = x + 3 + (i * 9) % Math.max(10, cw - 8);
      const py = y - ch + 3 + ((i * 13) % Math.max(10, ch - 8));
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(px, py + 5, 5, 7);
      ctx.fillStyle = '#f4cfb0';
      ctx.fillRect(px + 1, py, 3, 4);
    }
  }

  function drawRaceCar(ctx, x, y, s, color) {
    const cw = 56 * s;
    const ch = 30 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#111';
    ctx.fillRect(-cw * 0.55, ch * 0.05, cw * 0.18, ch * 0.45);
    ctx.fillRect(cw * 0.37, ch * 0.05, cw * 0.18, ch * 0.45);
    const g = ctx.createLinearGradient(0, -ch * 0.6, 0, ch * 0.4);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.18, color);
    g.addColorStop(1, '#7c1010');
    ctx.fillStyle = g;
    ctx.fillRect(-cw * 0.27, -ch * 0.42, cw * 0.54, ch * 0.82);
    ctx.fillRect(-cw * 0.10, -ch * 0.66, cw * 0.20, ch * 0.24);
    ctx.fillStyle = '#dff6ff';
    ctx.fillRect(-cw * 0.14, -ch * 0.26, cw * 0.28, ch * 0.12);
    ctx.fillStyle = '#222';
    ctx.fillRect(-cw * 0.38, -ch * 0.02, cw * 0.76, ch * 0.08);
    ctx.fillStyle = '#ffba08';
    ctx.fillRect(-cw * 0.05, ch * 0.29, cw * 0.10, ch * 0.11);
    ctx.restore();
  }

  function drawPlayerCar(ctx, w, h, playerX, shakeX, shakeY) {
    const x = w * 0.5 + playerX * w * 0.19 + shakeX;
    const y = h * 0.84 + shakeY;
    const scale = Math.max(1, h / 480);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 70, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090909';
    ctx.fillRect(-68, 10, 24, 40);
    ctx.fillRect(44, 10, 24, 40);
    const g = ctx.createLinearGradient(0, -50, 0, 38);
    g.addColorStop(0, '#fff2b0');
    g.addColorStop(0.16, '#ff5a36');
    g.addColorStop(0.7, '#d81f1f');
    g.addColorStop(1, '#7b0606');
    ctx.fillStyle = g;
    ctx.fillRect(-38, -28, 76, 62);
    ctx.fillRect(-12, -52, 24, 22);
    ctx.fillStyle = '#141414';
    ctx.fillRect(-58, -4, 116, 8);
    ctx.fillStyle = '#ff2d2d';
    ctx.fillRect(-55, -10, 110, 6);
    ctx.fillStyle = '#ffe14c';
    ctx.beginPath();
    ctx.arc(0, -39, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3acbff';
    ctx.fillRect(-8, -35, 16, 8);
    ctx.fillStyle = '#dff6ff';
    ctx.fillRect(-18, -10, 36, 12);
    ctx.fillStyle = '#222';
    ctx.fillRect(-8, 34, 16, 8);
    ctx.fillStyle = '#ffba08';
    ctx.fillRect(-5, 36, 10, 6);
    ctx.restore();
  }

  return {
    text,
    drawSky,
    drawPalm,
    drawBillboard,
    drawCrowd,
    drawRaceCar,
    drawPlayerCar
  };
})();
