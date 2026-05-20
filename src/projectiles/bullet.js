window.SKY = window.SKY || {};

class Bullet extends SKY.Actor {
  constructor(x, y, vx, vy = 0, options = {}) {
    super(x, y);
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.life = options.life || 0.46;
    this.max = this.life;
    this.damage = options.damage || 1;
    this.radius = options.radius || 4;
    this.angle = Math.atan2(this.vy, this.vx || 0.0001);
    this.kind = options.kind || 'player-bullet';
  }

  update(dt) {
    const s = dt / 1000;
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.life -= s;

    if (this.life <= 0 ||
        this.x < -160 || this.x > SKY.Config.canvas.width + 160 ||
        this.y < -180 || this.y > SKY.Config.canvas.height + 160) {
      this.remove = true;
    }
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);
    const dir = SKY.Math2D.normalize(this.vx, this.vy);
    const trail = 92;

    ctx.save();
    ctx.lineCap = 'round';

    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(255, 140, 40, ${0.26 * a})`;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - dir.x * trail, this.y - dir.y * trail);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255, 238, 155, ${0.92 * a})`;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - dir.x * trail * 0.72, this.y - dir.y * trail * 0.72);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 246, 205, ${0.95 * a})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.SKY.Bullet = Bullet;
