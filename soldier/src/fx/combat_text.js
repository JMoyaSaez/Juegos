window.SKY = window.SKY || {};

class CombatText extends SKY.Actor {
  constructor(x, y, text, tone = 'cyan') {
    super(x, y);
    this.text = String(text);
    this.tone = tone;
    this.vx = (Math.random() - 0.5) * 38;
    this.vy = -72 - Math.random() * 36;
    this.life = 0.62;
    this.max = this.life;
  }

  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.vy += 95 * s;
    this.life -= s;
    if (this.life <= 0) this.remove = true;
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);
    const lift = (1 - a) * 8;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '700 17px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,.68)';
    ctx.strokeText(this.text, this.x, this.y - lift);
    ctx.fillStyle = this.tone === 'danger' ? '#ff8370' : this.tone === 'gold' ? '#ffe08a' : '#98f2ff';
    ctx.fillText(this.text, this.x, this.y - lift);
    ctx.restore();
  }
}

window.SKY.CombatText = CombatText;
