window.SKY = window.SKY || {};

class SparkParticle extends SKY.Actor {
  constructor(x, y, vx, vy, life, maxLife, tone = 'orange') {
    super(x, y);
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.max = maxLife || life;
    this.tone = tone;
  }

  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.vy += 350 * s;
    this.life -= s;

    if (this.life <= 0) this.remove = true;
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.tone === 'cyan'
      ? `rgba(80, 220, 255, ${0.85 * a})`
      : `rgba(255, 170, 45, ${0.85 * a})`;

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.018, this.y - this.vy * 0.018);
    ctx.stroke();
    ctx.restore();
  }
}

window.SKY.SparkParticle = SparkParticle;
