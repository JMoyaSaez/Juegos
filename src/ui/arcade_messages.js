window.SKY = window.SKY || {};

class ArcadeMessages {
  constructor() {
    this.messages = [];
  }

  reset() {
    this.messages.length = 0;
  }

  show(title, subtitle = '', options = {}) {
    this.messages.push({
      title,
      subtitle,
      age: 0,
      duration: options.duration ?? 1.75,
      y: options.y ?? 258,
      kind: options.kind || 'ready',
      size: options.size || 86,
      subtitleSize: options.subtitleSize || 24,
      shake: options.shake || 0,
    });
  }

  showStageTitle(title, subtitle = '') {
    this.show(title, subtitle, {
      kind: 'stage',
      y: 235,
      size: 64,
      subtitleSize: 25,
      duration: 2.15,
    });
  }

  showReady() {
    this.show('READY!', '', {
      kind: 'ready',
      y: 285,
      size: 104,
      duration: 1.55,
    });
  }

  showWarning(subtitle = '') {
    this.show('WARNING!!', subtitle, {
      kind: 'warning',
      y: 245,
      size: 88,
      subtitleSize: 24,
      duration: 1.65,
      shake: 2.5,
    });
  }

  showBossIncoming() {
    this.show('BOSS INCOMING', 'OMEGA-01 CONTAINMENT BREACH', {
      kind: 'warning',
      y: 248,
      size: 76,
      subtitleSize: 21,
      duration: 2.00,
      shake: 3.0,
    });
  }

  showStageClear() {
    this.show('STAGE CLEAR', 'MISSION COMPLETE', {
      kind: 'clear',
      y: 250,
      size: 90,
      subtitleSize: 28,
      duration: 3.40,
    });
  }

  update(dt) {
    const s = dt / 1000;
    for (const msg of this.messages) msg.age += s;
    this.messages = this.messages.filter(msg => msg.age < msg.duration);
  }

  getEnvelope(msg) {
    const t = Math.max(0, Math.min(1, msg.age / msg.duration));
    const inT = Math.min(1, msg.age / 0.16);
    const outT = Math.max(0, (msg.age - (msg.duration - 0.32)) / 0.32);
    const alpha = Math.max(0, Math.min(1, inT * (1 - outT)));
    const overshoot = 1 + Math.sin(Math.min(1, msg.age / 0.18) * Math.PI) * 0.18;
    const pulse = 1 + Math.sin(msg.age * 18) * 0.012;
    const warningFlicker = msg.kind === 'warning' ? (0.86 + Math.sin(msg.age * 38) * 0.14) : 1;
    const scale = (0.82 + 0.18 * overshoot) * pulse;
    return { t, alpha: alpha * warningFlicker, scale };
  }

  drawArcadeText(ctx, text, x, y, size, kind, alpha, scale = 1) {
    if (!text) return;
    const fonts = `900 ${size}px Impact, Haettenschweiler, "Arial Black", system-ui, sans-serif`;
    const cyan = kind !== 'warning';
    const clear = kind === 'clear';
    const flash = kind === 'warning';

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    ctx.globalAlpha *= alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = fonts;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    ctx.shadowColor = flash ? 'rgba(255,70,35,.65)' : 'rgba(55,190,255,.65)';
    ctx.shadowBlur = clear ? 24 : 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.lineWidth = Math.max(13, size * 0.18);
    ctx.strokeStyle = 'rgba(0,4,12,.96)';
    ctx.strokeText(text, 0, 0);

    ctx.lineWidth = Math.max(8, size * 0.105);
    ctx.strokeStyle = flash ? 'rgba(255,85,40,.98)' : 'rgba(8,72,176,.98)';
    ctx.strokeText(text, 0, 0);

    ctx.lineWidth = Math.max(3, size * 0.045);
    ctx.strokeStyle = flash ? 'rgba(255,222,145,.95)' : 'rgba(102,221,255,.95)';
    ctx.strokeText(text, 0, 0);

    const g = ctx.createLinearGradient(0, -size * 0.56, 0, size * 0.46);
    if (flash) {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.38, '#ffe7a8');
      g.addColorStop(0.68, '#ff6d36');
      g.addColorStop(1, '#961c18');
    } else if (clear) {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.42, '#dffbff');
      g.addColorStop(0.70, '#6fe9ff');
      g.addColorStop(1, '#1684e6');
    } else if (cyan) {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.38, '#edfaff');
      g.addColorStop(0.67, '#8be9ff');
      g.addColorStop(1, '#1c8cea');
    }
    ctx.fillStyle = g;
    ctx.fillText(text, 0, 0);

    // Arcade bevel highlight.
    ctx.globalAlpha *= 0.58;
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.font = `900 ${Math.max(12, size * 0.94)}px Impact, Haettenschweiler, "Arial Black", system-ui, sans-serif`;
    ctx.fillText(text, 0, -size * 0.06);
    ctx.restore();
  }

  drawSubtitle(ctx, text, x, y, size, kind, alpha) {
    if (!text) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(0,5,12,.95)';
    ctx.strokeText(text, x, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = kind === 'warning' ? 'rgba(255,98,43,.95)' : 'rgba(45,170,255,.95)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = kind === 'warning' ? 'rgba(255,226,160,.98)' : 'rgba(226,250,255,.98)';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  draw(ctx, world) {
    for (const msg of this.messages) {
      const env = this.getEnvelope(msg);
      if (env.alpha <= 0.01) continue;
      const flick = msg.shake ? (Math.sin(msg.age * 74) * msg.shake) : 0;
      const x = world.W / 2 + flick;
      const y = msg.y + Math.sin(msg.age * 5.2) * 2;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(x, y, 30, x, y, 260);
      const glowColor = msg.kind === 'warning' ? '255,82,35' : '55,194,255';
      glow.addColorStop(0, `rgba(${glowColor},${0.18 * env.alpha})`);
      glow.addColorStop(1, `rgba(${glowColor},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - 310, y - 150, 620, 300);
      ctx.restore();

      this.drawArcadeText(ctx, msg.title, x, y, msg.size, msg.kind, env.alpha, env.scale);
      this.drawSubtitle(ctx, msg.subtitle, x, y + msg.size * 0.72, msg.subtitleSize, msg.kind, env.alpha * 0.94);
    }
  }
}

window.SKY.ArcadeMessages = ArcadeMessages;
