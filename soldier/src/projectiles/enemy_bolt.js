window.SKY = window.SKY || {};

class EnemyBolt extends SKY.Actor {
  constructor(x, y, vx, vy = 0, damage = 1) {
    super(x, y);
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.life = 1.6;
    this.max = this.life;
    this.radius = 8;
  }

  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.life -= s;

    if (this.life <= 0 || this.x < -140 || this.x > SKY.Config.canvas.width + 140 || this.y < -80 || this.y > SKY.Config.canvas.height + 80) {
      this.remove = true;
    }
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);
    const tail = Math.sign(this.vx || 1) * -48;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 70, 82, .36)';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + tail, this.y - this.vy * 0.035);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 220, 150, .92)';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + tail * .58, this.y - this.vy * 0.018);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 75, 82, .92)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * .72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

window.SKY.EnemyBolt = EnemyBolt;
