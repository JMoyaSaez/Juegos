window.SKY = window.SKY || {};

class SecurityDrone extends SKY.Actor {
  constructor(x, y, options = {}) {
    super(x, y);
    const cfg = SKY.Config.enemy.drone;
    this.spawnX = x;
    this.spawnY = y;
    this.homeX = x;
    this.baseY = y;
    this.maxHp = options.hp || cfg.hp;
    this.hp = this.maxHp;
    this.scale = options.scale || cfg.scale;
    this.speed = options.speed || cfg.speed;
    this.shotCooldownBase = options.shotCooldown || cfg.shotCooldown;
    this.shotTimer = 0.55 + Math.random() * 0.7;
    this.deadTimer = 0;
    this.hitFlash = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.name = options.name || 'XR-7 Security Drone';
    this.respawnEnabled = options.respawn !== false;
  }

  resetBody() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.homeX = this.spawnX;
    this.baseY = this.spawnY;
    this.hp = this.maxHp;
    this.dead = false;
    this.hitFlash = 0.15;
    this.shotTimer = 0.65;
  }

  getHitbox() {
    return this.getHurtbox();
  }

  getHurtbox() {
    const w = 132 * this.scale;
    const h = 88 * this.scale;
    return {
      x: this.x - w / 2,
      y: this.y - h / 2,
      w,
      h,
    };
  }

  getDamageCenter() {
    return { x: this.x, y: this.y };
  }

  containsPoint(x, y) {
    if (this.dead) return false;
    return SKY.Math2D.pointInRect(x, y, this.getHurtbox());
  }

  intersectsSegment(x1, y1, x2, y2) {
    if (this.dead) return false;
    return SKY.Math2D.segmentIntersectsRect(x1, y1, x2, y2, this.getHurtbox());
  }

  applyDamage(amount, world) {
    if (this.dead) return;

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.10;
    world.addShake(SKY.Config.combat.shakeLight, 0.07);
    world.addHitStop(SKY.Config.combat.hitStopLight);
    world.particles.push(new SKY.CombatText(this.x, this.y - 58 * this.scale, amount, 'cyan'));

    for (let i = 0; i < 7; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + Math.random() * 52 - 26,
        this.y + Math.random() * 32 - 16,
        -220 + Math.random() * 440,
        -200 + Math.random() * 250,
        0.08 + Math.random() * 0.10,
        0.21,
        Math.random() > 0.4 ? 'cyan' : 'orange'
      ));
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.deadTimer = this.respawnEnabled ? SKY.Config.enemy.drone.respawnTime : 0.72;
      world.explode(this.x, this.y, 112, 0);
      world.addShake(SKY.Config.combat.shakeHeavy, 0.22);
      world.particles.push(new SKY.CombatText(this.x, this.y - 42, 'DOWN', 'gold'));
    }
  }

  fire(world) {
    if (this.dead) return;

    const px = world.player.x;
    const py = world.player.y - 165 * world.player.scale;
    const dx = px - this.x;
    const dy = py - this.y;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const speed = SKY.Config.enemy.drone.boltSpeed;

    world.projectiles.push(new SKY.EnemyBolt(
      this.x + this.facing * 54 * this.scale,
      this.y + 6 * this.scale,
      dx / len * speed,
      dy / len * speed,
      1
    ));

    for (let i = 0; i < 6; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + this.facing * 56 * this.scale,
        this.y + 6 * this.scale,
        this.facing * (240 + Math.random() * 160),
        -100 + Math.random() * 200,
        0.07 + Math.random() * 0.07,
        0.15,
        'orange'
      ));
    }
  }

  update(dt, world) {
    const s = dt / 1000;
    this.phase += s;
    this.hitFlash = Math.max(0, this.hitFlash - s);

    if (this.dead) {
      this.deadTimer -= s;
      this.y += 60 * s;
      if (this.deadTimer <= 0) {
        if (this.respawnEnabled) this.resetBody();
        else this.remove = true;
      }
      return;
    }

    const player = world.player;
    const desiredX = SKY.Math2D.clamp(player.x + 380, 710, 1180);
    this.homeX += (desiredX - this.homeX) * Math.min(1, s * 0.45);
    this.x += (this.homeX - this.x) * Math.min(1, s * 1.2);
    this.y = this.baseY + Math.sin(this.phase * 3.1) * 18 + Math.sin(this.phase * 7.8) * 4;
    this.facing = player.x < this.x ? -1 : 1;

    this.shotTimer -= s;
    const inRange = Math.abs(player.x - this.x) < 820;
    if (this.shotTimer <= 0 && inRange) {
      this.shotTimer = this.shotCooldownBase + Math.random() * 0.45;
      this.fire(world);
    }
  }

  draw(ctx, world) {
    const s = this.scale;
    const b = this.getHitbox();
    const pulse = Math.sin(this.phase * 8) * 0.5 + 0.5;
    const flash = this.hitFlash > 0;
    const front = this.facing;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Rotor blur and hovering shadow.
    ctx.globalAlpha = this.dead ? 0.32 : 0.72;
    ctx.strokeStyle = 'rgba(185, 238, 255, .28)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.ellipse(-38 * s, -36 * s, 44 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(38 * s, -36 * s, 44 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Energy wings.
    ctx.globalAlpha = this.dead ? 0.20 : 0.48;
    ctx.fillStyle = 'rgba(80, 220, 255, .30)';
    ctx.beginPath();
    ctx.moveTo(-58 * s, -10 * s);
    ctx.lineTo(-116 * s, -28 * s);
    ctx.lineTo(-82 * s, 18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(58 * s, -10 * s);
    ctx.lineTo(116 * s, -28 * s);
    ctx.lineTo(82 * s, 18 * s);
    ctx.closePath();
    ctx.fill();

    // Body shell.
    ctx.globalAlpha = this.dead ? 0.45 : 1;
    ctx.fillStyle = flash ? 'rgba(255,255,255,.96)' : '#26323a';
    ctx.strokeStyle = flash ? 'rgba(255,255,255,.95)' : 'rgba(144, 225, 255, .82)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    SKY.Draw.roundRectPath(ctx, -54 * s, -34 * s, 108 * s, 68 * s, 18 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = flash ? 'rgba(255,255,255,.90)' : '#101820';
    ctx.beginPath();
    SKY.Draw.roundRectPath(ctx, -39 * s, -22 * s, 78 * s, 42 * s, 12 * s);
    ctx.fill();

    // Sensor eye points toward the player.
    ctx.fillStyle = flash ? '#ffffff' : `rgba(255, ${120 + pulse*80}, 70, .95)`;
    ctx.beginPath();
    ctx.arc(front * 17 * s, 0, 11 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,160,.95)';
    ctx.fillRect(front > 0 ? -19 * s : -13 * s, -2 * s, 32 * s, 4 * s);

    // Weapon pod is always on the front side.
    ctx.fillStyle = '#151d23';
    ctx.fillRect(front * 42 * s, 9 * s, front * 36 * s, 12 * s);
    ctx.fillStyle = `rgba(255,80,70,${0.45 + pulse * .4})`;
    ctx.fillRect(front * 72 * s, 12 * s, front * 12 * s, 6 * s);

    // HP rail.
    ctx.globalAlpha = 0.92;
    const hpW = 86 * s;
    const hpA = this.hp / this.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(-hpW / 2, -68 * s, hpW, 5 * s);
    ctx.fillStyle = 'rgba(120,235,255,.9)';
    ctx.fillRect(-hpW / 2, -68 * s, hpW * hpA, 5 * s);

    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    ctx.beginPath();
    ctx.ellipse(this.x, SKY.Config.canvas.groundY + 11, 42 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (world.debug) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,80,160,.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    }
  }
}

window.SKY.SecurityDrone = SecurityDrone;
SKY.EnemyFactory.register('security-drone', SecurityDrone);
