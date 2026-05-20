window.SKY = window.SKY || {};

class StageClearScreen {
  drawArcadeLine(ctx, text, x, y, size, main = false) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px Impact, Haettenschweiler, "Arial Black", system-ui, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.shadowColor = main ? 'rgba(60,210,255,.70)' : 'rgba(255,190,80,.42)';
    ctx.shadowBlur = main ? 18 : 10;
    ctx.lineWidth = Math.max(7, size * .14);
    ctx.strokeStyle = 'rgba(0,4,12,.98)';
    ctx.strokeText(text, x, y);
    ctx.lineWidth = Math.max(3, size * .06);
    ctx.strokeStyle = main ? 'rgba(85,220,255,.95)' : 'rgba(255,196,68,.90)';
    ctx.strokeText(text, x, y);
    const g = ctx.createLinearGradient(x, y - size * .5, x, y + size * .5);
    if (main) {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(.42, '#dffbff');
      g.addColorStop(.72, '#69e8ff');
      g.addColorStop(1, '#1688e8');
    } else {
      g.addColorStop(0, '#fff8d0');
      g.addColorStop(.55, '#ffd25c');
      g.addColorStop(1, '#ff8c2c');
    }
    ctx.fillStyle = g;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawCelebration(ctx, world, age, alpha) {
    const image = SKY.Assets.getImage('celebration');
    if (!image) return;
    const C = SKY.Config.celebrationAtlas;
    const sequence = [C.frames.cheer[0], C.frames.wave[0], C.frames.thumb[0], C.frames.present[0], C.frames.point[0]];
    const f = sequence[Math.floor(age * 1.55) % sequence.length];
    const sx = f.col * C.cellW;
    const sy = f.row * C.cellH;
    const scale = 0.58 + Math.sin(age * 3.2) * 0.012;
    const dw = C.cellW * scale;
    const dh = C.cellH * scale;
    const x = world.W - 292;
    const y = world.H - 86;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y - dh * .55, 20, x, y - dh * .55, 200);
    glow.addColorStop(0, 'rgba(80,215,255,.16)');
    glow.addColorStop(1, 'rgba(80,215,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 220, y - dh - 70, 440, 400);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(image, sx, sy, C.cellW, C.cellH, Math.round(x - dw / 2), Math.round(y - dh), Math.round(dw), Math.round(dh));
    ctx.restore();
  }

  draw(ctx, world) {
    const phase = world.stage?.phase;
    if (phase !== 'stageClear' && phase !== 'complete') return;
    const age = world.stage?.timer || 0;
    if (age < 0.55 && phase === 'stageClear') return;
    const inAlpha = Math.min(1, Math.max(0, (age - 0.55) / 0.55));
    const alpha = phase === 'complete' ? 1 : inAlpha;

    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, 0, world.H);
    g.addColorStop(0, 'rgba(0,7,18,.10)');
    g.addColorStop(.35, 'rgba(0,9,22,.34)');
    g.addColorStop(1, 'rgba(0,0,0,.62)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, world.W, world.H);

    // Results plate, deliberately compact so it feels like an arcade result screen, not a web modal.
    const px = 72;
    const py = 112;
    const pw = 570;
    const ph = 360;
    const panel = ctx.createLinearGradient(px, py, px, py + ph);
    panel.addColorStop(0, 'rgba(5,20,36,.86)');
    panel.addColorStop(.55, 'rgba(3,10,22,.82)');
    panel.addColorStop(1, 'rgba(0,4,10,.80)');
    ctx.fillStyle = panel;
    SKY.Draw.roundRectPath(ctx, px, py, pw, ph, 18);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(93,226,255,.74)';
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.20)';
    SKY.Draw.roundRectPath(ctx, px + 6, py + 6, pw - 12, ph - 12, 13);
    ctx.stroke();

    this.drawArcadeLine(ctx, 'STAGE CLEAR', px + pw / 2, py + 72, 58, true);
    this.drawArcadeLine(ctx, 'MISSION COMPLETE', px + pw / 2, py + 128, 31, false);

    ctx.font = '900 19px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(228,249,255,.92)';
    ctx.textAlign = 'left';
    ctx.fillText('TIME BONUS', px + 78, py + 195);
    ctx.fillText('AERIAL CLEAR', px + 78, py + 240);
    ctx.fillText('BOSS DESTROYED', px + 78, py + 285);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,218,96,.98)';
    ctx.fillText('+2500', px + pw - 78, py + 195);
    ctx.fillText('+1500', px + pw - 78, py + 240);
    ctx.fillText('+5000', px + pw - 78, py + 285);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(80,220,255,${0.18 + Math.sin((world.time || 0) * 5) * .04})`;
    ctx.fillRect(px + 76, py + 324, pw - 152, 3);
    ctx.globalCompositeOperation = 'source-over';

    ctx.textAlign = 'center';
    ctx.font = '900 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(210,238,255,.72)';
    ctx.fillText('PRESS R TO RESTART', px + pw / 2, py + 342);

    this.drawCelebration(ctx, world, age, alpha);
    ctx.restore();
  }
}

window.SKY.StageClearScreen = StageClearScreen;
