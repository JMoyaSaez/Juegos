window.SKY = window.SKY || {};

class Shell extends SKY.Actor {
  constructor(x, y, facing) {
    super(x, y);
    this.vx = -facing * (120 + Math.random() * 80);
    this.vy = -(160 + Math.random() * 70);
    this.rot = Math.random() * Math.PI * 2;
    this.vr = (Math.random() - 0.5) * 12;
    this.life = 0.75;
    this.max = 0.75;
  }

  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.vy += 520 * s;
    this.rot += this.vr * s;
    this.life -= s;

    if (this.life <= 0 || this.y > SKY.Config.canvas.groundY + 40) {
      this.remove = true;
    }
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.max);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = `rgba(220, 160, 70, ${0.8 * a})`;
    ctx.fillRect(-3, -1, 7, 2);
    ctx.restore();
  }
}

window.SKY.Shell = Shell;
