window.SKY = window.SKY || {};

class Grenade extends SKY.Actor {
  constructor(x, y, facing) {
    super(x, y);
    this.vx = facing * 430;
    this.vy = -520;
    this.rot = 0;
    this.life = 2.0;
    this.exploded = false;
  }

  update(dt, world) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.vy += 1120 * s;
    this.rot += 8 * s;
    this.life -= s;

    const gy = SKY.Config.canvas.groundY;
    if (this.y >= gy - 12 && !this.exploded) {
      this.exploded = true;
      world.explode(this.x, gy - 10, 135, 4);
      this.remove = true;
    } else if (this.life <= 0) {
      this.remove = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = '#354328';
    ctx.fillRect(-6, -7, 12, 14);
    ctx.fillStyle = '#1d2417';
    ctx.fillRect(-7, -2, 14, 3);
    ctx.fillStyle = '#a6b37b';
    ctx.fillRect(-2, -10, 6, 3);
    ctx.restore();
  }
}

window.SKY.Grenade = Grenade;
