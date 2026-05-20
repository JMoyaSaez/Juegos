window.SKY = window.SKY || {};

class Actor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.dead = false;
    this.remove = false;
  }

  update(_dt, _world) {}
  draw(_ctx, _world) {}
}

window.SKY.Actor = Actor;
