window.SKY = window.SKY || {};

class DustParticle extends SKY.Actor {
  constructor(x, y, vx, vy, radius, life, maxLife) {
    super(x, y);
    this.vx = vx;
    this.vy = vy;
    this.r = radius;
    this.life = life;
    this.max = maxLife || life;
  }

  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.vy += 115 * s;
    this.life -= s;

    if (this.life <= 0) this.remove = true;
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);
    ctx.fillStyle = `rgba(190, 178, 146, ${0.28 * a})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * a, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.SKY.DustParticle = DustParticle;
