window.SKY = window.SKY || {};

class RavenDroneEnemy extends SKY.Actor {
  constructor(x, y, options = {}) {
    super(x, y);
    const cfg = SKY.Config.enemy.ravenDrone;
    this.spawnX = x;
    this.spawnY = y;
    this.homeX = x;
    this.baseY = y;
    this.targetX = options.targetX || x;
    this.maxHp = options.hp || cfg.hp;
    this.hp = this.maxHp;
    this.scale = options.scale || cfg.scale;
    this.name = options.name || 'RAVEN-01 DRONE';
    this.state = 'enter';
    this.frame = 0;
    this.frameTime = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.deathTimer = 0;
    this.actionTimer = 0;
    this.shotTimer = 0.75 + Math.random() * 0.55;
    this.missileTimer = 1.90 + Math.random() * 0.95;
    this.facing = -1; // The atlas faces left. Draw normal when facing left.
    this.respawnEnabled = options.respawn === true;
    this.deadOneShotDone = false;
  }

  getAnimationName() {
    if (this.dead) return 'death';
    if (this.state === 'gun') return 'gun';
    if (this.state === 'missile') return 'missile';
    if (this.hp <= this.maxHp * 0.40) return 'damaged';
    if (this.state === 'enter' || this.state === 'boost') return 'boost';
    return 'hover';
  }

  getFrameList() {
    const C = SKY.Config.ravenDroneAtlas;
    return C.frames[this.getAnimationName()] || C.frames.hover;
  }

  getHurtbox() {
    const s = this.scale;
    return {
      x: this.x - 86 * s,
      y: this.y - 48 * s,
      w: 158 * s,
      h: 82 * s,
    };
  }

  getHitbox() { return this.getHurtbox(); }
  getDamageCenter() { return { x: this.x - 8 * this.scale * (this.facing === -1 ? 1 : -1), y: this.y - 4 * this.scale }; }

  containsPoint(x, y) {
    if (this.dead) return false;
    return SKY.Math2D.pointInRect(x, y, this.getHurtbox());
  }

  intersectsSegment(x1, y1, x2, y2) {
    if (this.dead) return false;
    return SKY.Math2D.segmentIntersectsRect(x1, y1, x2, y2, this.getHurtbox());
  }

  muzzlePoint() {
    // Front cannon. Atlas front is left.
    const dir = this.facing;
    return {
      x: this.x + dir * 88 * this.scale,
      y: this.y + 2 * this.scale,
    };
  }

  missilePoint() {
    const dir = this.facing;
    return {
      x: this.x + dir * 66 * this.scale,
      y: this.y + 24 * this.scale,
    };
  }

  applyDamage(amount, world) {
    if (this.dead) return;

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.10;
    world.addShake(SKY.Config.combat.shakeLight, 0.065);
    world.addHitStop(SKY.Config.combat.hitStopLight);
    world.particles.push(new SKY.CombatText(this.x, this.y - 62 * this.scale, amount, 'cyan'));

    for (let i = 0; i < 9; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + Math.random() * 80 * this.scale - 40 * this.scale,
        this.y + Math.random() * 50 * this.scale - 25 * this.scale,
        -260 + Math.random() * 520,
        -230 + Math.random() * 300,
        0.07 + Math.random() * 0.12,
        0.22,
        Math.random() > 0.45 ? 'cyan' : 'orange'
      ));
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.state = 'death';
      this.frame = 0;
      this.frameTime = 0;
      this.deathTimer = SKY.Config.enemy.ravenDrone.deathTime;
      this.deadOneShotDone = false;
      world.addShake(SKY.Config.combat.shakeHeavy, 0.18);
      world.addHitStop(SKY.Config.combat.hitStopHeavy * 0.75);
      world.particles.push(new SKY.CombatText(this.x, this.y - 44, 'DOWN', 'gold'));
      world.explode(this.x - 6 * this.scale, this.y + 8 * this.scale, 88, 0);
    }
  }

  fireGun(world) {
    const muzzle = this.muzzlePoint();
    const player = world.player;
    const targetY = player.y - 165 * player.scale;
    const dir = SKY.Math2D.normalize(player.x - muzzle.x, targetY - muzzle.y);
    const speed = SKY.Config.enemy.ravenDrone.boltSpeed;
    world.projectiles.push(new SKY.EnemyBolt(muzzle.x, muzzle.y, dir.x * speed, dir.y * speed, 1));

    for (let i = 0; i < 8; i++) {
      world.particles.push(new SKY.SparkParticle(
        muzzle.x,
        muzzle.y,
        dir.x * (260 + Math.random() * 210) + (Math.random() - 0.5) * 120,
        dir.y * (220 + Math.random() * 210) + (Math.random() - 0.5) * 120,
        0.055 + Math.random() * 0.07,
        0.16,
        'orange'
      ));
    }
  }

  fireMissile(world) {
    const p = this.missilePoint();
    const player = world.player;
    const targetY = player.y - 125 * player.scale;
    const dir = SKY.Math2D.normalize(player.x - p.x, targetY - p.y);
    const speed = SKY.Config.enemy.ravenDrone.missileSpeed;
    world.projectiles.push(new SKY.EnemyBolt(p.x, p.y, dir.x * speed, dir.y * speed, 1));
    world.addShake(SKY.Config.combat.shakeLight, 0.075);
  }

  updateAlive(dt, world) {
    const s = dt / 1000;
    const cfg = SKY.Config.enemy.ravenDrone;
    const player = world.player;

    this.phase += s;
    this.hitFlash = Math.max(0, this.hitFlash - s);
    this.facing = player.x < this.x ? -1 : 1;

    if (this.state === 'enter') {
      const desired = this.targetX || SKY.Math2D.clamp(player.x + 410, 760, 1160);
      this.x += (desired - this.x) * Math.min(1, s * 1.45);
      this.y = this.baseY + Math.sin(this.phase * 4.8) * 7;
      if (Math.abs(this.x - desired) < 10) {
        this.state = 'hover';
        this.homeX = desired;
      }
      return;
    }

    if (this.actionTimer > 0) {
      this.actionTimer -= s;
      this.y = this.baseY + Math.sin(this.phase * 5.2) * cfg.hoverAmplitude;
      if (this.actionTimer <= 0) this.state = 'hover';
      return;
    }

    const desiredX = SKY.Math2D.clamp(player.x + 410, 720, 1180);
    this.homeX += (desiredX - this.homeX) * Math.min(1, s * 0.36);
    this.x += (this.homeX - this.x) * Math.min(1, s * 1.1);
    this.y = this.baseY + Math.sin(this.phase * 3.2) * cfg.hoverAmplitude + Math.sin(this.phase * 7.9) * 4;

    this.shotTimer -= s;
    this.missileTimer -= s;
    const inRange = Math.abs(player.x - this.x) < 840;

    if (this.missileTimer <= 0 && inRange) {
      this.missileTimer = cfg.missileCooldown + Math.random() * 0.95;
      this.state = 'missile';
      this.frame = 0;
      this.frameTime = 0;
      this.actionTimer = 0.44;
      this.fireMissile(world);
      return;
    }

    if (this.shotTimer <= 0 && inRange) {
      this.shotTimer = cfg.shotCooldown + Math.random() * 0.55;
      this.state = 'gun';
      this.frame = 0;
      this.frameTime = 0;
      this.actionTimer = 0.36;
      this.fireGun(world);
    }

    if (this.hp <= this.maxHp * 0.40 && Math.random() < 0.045) {
      world.particles.push(new SKY.DustParticle(
        this.x + 30 * this.scale,
        this.y - 2 * this.scale,
        -35 + Math.random() * 70,
        -70 - Math.random() * 80,
        5 + Math.random() * 7,
        0.42 + Math.random() * 0.25,
        0.75
      ));
    }
  }

  updateDeath(dt, world) {
    const s = dt / 1000;
    this.phase += s;
    this.deathTimer -= s;
    this.y += 26 * s;
    if (this.deathTimer <= 0) {
      if (this.respawnEnabled) {
        this.dead = false;
        this.hp = this.maxHp;
        this.state = 'enter';
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.frame = 0;
      } else {
        this.remove = true;
      }
    }
  }

  updateAnimation(dt) {
    const s = dt / 1000;
    const frames = this.getFrameList();
    let fps = 8;
    const anim = this.getAnimationName();
    if (anim === 'gun' || anim === 'missile') fps = 12;
    if (anim === 'death') fps = 9;
    this.frameTime += s;
    if (this.frameTime >= 1 / fps) {
      this.frameTime = 0;
      if (anim === 'death') this.frame = Math.min(this.frame + 1, frames.length - 1);
      else this.frame = (this.frame + 1) % frames.length;
    }
  }

  update(dt, world) {
    if (this.dead) this.updateDeath(dt, world);
    else this.updateAlive(dt, world);
    this.updateAnimation(dt);
  }

  draw(ctx, world) {
    const image = SKY.Assets.getImage('ravenDrone');
    if (!image) return;
    const C = SKY.Config.ravenDroneAtlas;
    const frames = this.getFrameList();
    const f = frames[this.frame % frames.length];
    const sx = f.col * C.cellW;
    const sy = f.row * C.cellH;
    const dw = C.cellW * this.scale;
    const dh = C.cellH * this.scale;
    const anchor = C.anchor;
    const flip = this.facing === 1;

    ctx.save();
    ctx.globalAlpha = this.dead ? Math.max(0.15, this.deathTimer / SKY.Config.enemy.ravenDrone.deathTime) : 1;
    ctx.translate(Math.round(this.x), Math.round(this.y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      image,
      sx, sy, C.cellW, C.cellH,
      Math.round(-anchor.x * this.scale),
      Math.round(-anchor.y * this.scale),
      Math.round(dw), Math.round(dh)
    );

    if (this.hitFlash > 0 && !this.dead) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.82, this.hitFlash * 7)})`;
      ctx.fillRect(Math.round(-anchor.x * this.scale), Math.round(-anchor.y * this.scale), Math.round(dw), Math.round(dh));
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(this.x, SKY.Config.canvas.groundY + 10, 48 * this.scale, 9 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (world.debug) {
      const b = this.getHurtbox();
      const m = this.muzzlePoint();
      ctx.save();
      ctx.strokeStyle = 'rgba(90,235,255,.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,180,40,.95)';
      ctx.fillRect(m.x - 3, m.y - 3, 6, 6);
      ctx.restore();
    }
  }
}

window.SKY.RavenDroneEnemy = RavenDroneEnemy;
SKY.EnemyFactory.register('raven-drone', RavenDroneEnemy);
