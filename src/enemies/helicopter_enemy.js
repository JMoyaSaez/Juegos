window.SKY = window.SKY || {};

class HelicopterEnemy extends SKY.Actor {
  constructor(x, y, options = {}) {
    super(x, y);
    const cfg = SKY.Config.enemy.helicopter;
    this.spawnX = x;
    this.spawnY = y;
    this.homeX = x;
    this.baseY = y;
    this.maxHp = options.hp || cfg.hp;
    this.hp = this.maxHp;
    this.scale = options.scale || cfg.scale;
    this.name = options.name || 'AH-91 Razorback Helicopter';
    this.state = 'enter';
    this.frame = 0;
    this.frameTime = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.gunTimer = 0;
    this.missileTimer = 1.4;
    this.attackTimer = 0;
    this.deathTimer = 0;
    this.respawnTimer = 0;
    this.deadFxLatch = 0;
    this.finalExplosionDone = false;
    this.facing = -1; // natural sprite faces left
    this.respawnEnabled = options.respawn !== false;
  }

  resetBody() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.homeX = this.spawnX;
    this.baseY = this.spawnY;
    this.hp = this.maxHp;
    this.dead = false;
    this.remove = false;
    this.state = 'enter';
    this.frame = 0;
    this.frameTime = 0;
    this.hitFlash = 0.18;
    this.gunTimer = 0.8;
    this.missileTimer = 1.9;
    this.attackTimer = 0;
    this.deathTimer = 0;
    this.respawnTimer = 0;
    this.deadFxLatch = 0;
    this.finalExplosionDone = false;
  }

  getAnimationName() {
    if (this.dead) return 'death';
    if (this.state === 'gun') return 'gun';
    if (this.state === 'missile') return 'missile';
    if (this.hp <= this.maxHp * 0.38) return 'damaged';
    if (this.state === 'patrol') return 'patrol';
    return 'hover';
  }

  getHurtbox() {
    const s = this.scale;
    return {
      x: this.x - 108 * s,
      y: this.y - 45 * s,
      w: 216 * s,
      h: 84 * s,
    };
  }

  getHitbox() {
    return this.getHurtbox();
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
    this.hitFlash = 0.12;
    world.addShake(SKY.Config.combat.shakeLight + 1, 0.07);
    world.addHitStop(SKY.Config.combat.hitStopLight);
    world.particles.push(new SKY.CombatText(this.x, this.y - 70 * this.scale, amount, 'cyan'));

    for (let i = 0; i < 10; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + Math.random() * 120 * this.scale - 60 * this.scale,
        this.y + Math.random() * 46 * this.scale - 23 * this.scale,
        -260 + Math.random() * 520,
        -240 + Math.random() * 310,
        0.08 + Math.random() * 0.12,
        0.24,
        Math.random() > 0.35 ? 'orange' : 'cyan'
      ));
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.state = 'death';
      this.frame = 0;
      this.frameTime = 0;
      this.deathTimer = 1.65;
      this.respawnTimer = SKY.Config.enemy.helicopter.respawnTime;
      this.deadFxLatch = 0;
      world.addShake(SKY.Config.combat.shakeHeavy, 0.24);
      world.particles.push(new SKY.CombatText(this.x, this.y - 78 * this.scale, 'AIR KILL', 'gold'));
    }
  }

  muzzlePoint() {
    // Natural helicopter nose points left. When flipped right, the front is positive X.
    const front = this.facing;
    return {
      x: this.x + front * 112 * this.scale,
      y: this.y + 12 * this.scale,
    };
  }

  fireAtPlayer(world, speedMul = 1, damage = 1) {
    if (this.dead) return;
    const muzzle = this.muzzlePoint();
    const targetX = world.player.x;
    const targetY = world.player.y - 155 * world.player.scale;
    const dx = targetX - muzzle.x;
    const dy = targetY - muzzle.y;
    const dir = SKY.Math2D.normalize(dx, dy);
    const speed = SKY.Config.enemy.helicopter.boltSpeed * speedMul;

    world.projectiles.push(new SKY.EnemyBolt(
      muzzle.x,
      muzzle.y,
      dir.x * speed,
      dir.y * speed,
      damage
    ));

    for (let i = 0; i < 8; i++) {
      world.particles.push(new SKY.SparkParticle(
        muzzle.x,
        muzzle.y,
        dir.x * (230 + Math.random() * 250) + (Math.random() - 0.5) * 120,
        dir.y * (230 + Math.random() * 250) + (Math.random() - 0.5) * 120,
        0.06 + Math.random() * 0.08,
        0.16,
        'orange'
      ));
    }
  }

  spawnDamageSmoke(world) {
    if (this.hp > this.maxHp * 0.38 || this.dead || Math.random() > 0.22) return;
    world.particles.push(new SKY.DustParticle(
      this.x + 38 * this.scale,
      this.y - 36 * this.scale,
      -25 + Math.random() * 50,
      -75 - Math.random() * 55,
      8 + Math.random() * 12,
      0.45 + Math.random() * 0.38,
      0.8
    ));
  }

  updateAlive(dt, world) {
    const s = dt / 1000;
    const cfg = SKY.Config.enemy.helicopter;
    const player = world.player;

    this.facing = player.x < this.x ? -1 : 1;
    this.homeX = SKY.Math2D.clamp(player.x + 560, 790, 1160);

    if (this.state === 'enter') {
      this.x += (this.homeX - this.x) * Math.min(1, s * 0.85);
      if (Math.abs(this.homeX - this.x) < 22) this.state = 'patrol';
    } else {
      const speed = cfg.patrolSpeed * s;
      const drift = Math.sin(this.phase * 0.7) * 80;
      const tx = SKY.Math2D.clamp(this.homeX + drift, 760, 1195);
      this.x += SKY.Math2D.clamp(tx - this.x, -speed, speed);
    }

    this.y = this.baseY + Math.sin(this.phase * 2.2) * cfg.hoverAmplitude + Math.sin(this.phase * 6.2) * 4;

    this.gunTimer -= s;
    this.missileTimer -= s;
    this.attackTimer = Math.max(0, this.attackTimer - s);

    const inRange = Math.abs(player.x - this.x) < 900;
    if (this.attackTimer <= 0 && inRange) {
      if (this.missileTimer <= 0) {
        this.state = 'missile';
        this.attackTimer = 0.62;
        this.missileTimer = cfg.missileCooldown + Math.random() * 0.8;
        this.fireAtPlayer(world, 0.72, 1);
        this.fireAtPlayer(world, 0.62, 1);
      } else if (this.gunTimer <= 0) {
        this.state = 'gun';
        this.attackTimer = 0.44;
        this.gunTimer = cfg.shotCooldown + Math.random() * 0.38;
        this.fireAtPlayer(world, 1.0, 1);
      }
    }

    if (this.attackTimer <= 0 && (this.state === 'gun' || this.state === 'missile')) {
      this.state = 'patrol';
    }

    this.spawnDamageSmoke(world);
  }

  updateDeath(dt, world) {
    const s = dt / 1000;
    this.deathTimer -= s;
    this.respawnTimer -= s;
    this.y += 58 * s;
    this.x += this.facing * 18 * s;
    this.vy += 65 * s;

    this.deadFxLatch -= s;
    if (this.deadFxLatch <= 0 && this.deathTimer > 0.25) {
      this.deadFxLatch = 0.18;
      world.explode(
        this.x + Math.random() * 120 * this.scale - 60 * this.scale,
        this.y + Math.random() * 66 * this.scale - 33 * this.scale,
        70,
        0
      );
    }

    if (this.deathTimer <= 0 && !this.finalExplosionDone) {
      this.finalExplosionDone = true;
      world.explode(this.x, this.y, 150, 0);
    }

    if (!this.respawnEnabled) {
      if (this.finalExplosionDone && this.deathTimer <= -0.35) this.remove = true;
      return;
    }

    if (this.respawnTimer <= 0) {
      this.finalExplosionDone = false;
      this.resetBody();
    }
  }

  updateAnimation(dt) {
    const s = dt / 1000;
    const C = SKY.Config.helicopterAtlas;
    const animName = this.getAnimationName();
    const anim = C.frames[animName] || C.frames.hover;
    const fps = animName === 'death' ? 9 : animName === 'gun' || animName === 'missile' ? 12 : 9;

    this.frameTime += s;
    if (this.frameTime >= 1 / fps) {
      this.frameTime = 0;
      this.frame = (this.frame + 1) % anim.length;
    }
  }

  update(dt, world) {
    const s = dt / 1000;
    this.phase += s;
    this.hitFlash = Math.max(0, this.hitFlash - s);

    if (this.dead) this.updateDeath(dt, world);
    else this.updateAlive(dt, world);

    this.updateAnimation(dt);
  }

  draw(ctx, world) {
    const image = SKY.Assets.getImage('helicopter');
    if (!image) return;

    const C = SKY.Config.helicopterAtlas;
    const animName = this.getAnimationName();
    const anim = C.frames[animName] || C.frames.hover;
    const f = anim[this.frame % anim.length];
    const sx = f.col * C.cellW;
    const sy = f.row * C.cellH;
    const dw = C.cellW * this.scale;
    const dh = C.cellH * this.scale;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath();
    ctx.ellipse(this.x, SKY.Config.canvas.groundY + 13, 78 * this.scale, 12 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    // The atlas faces left. Flip only when the player is to the right.
    ctx.scale(this.facing === -1 ? 1 : -1, 1);

    if (this.dead && this.deathTimer <= 0) ctx.globalAlpha = 0.35;
    ctx.drawImage(image, sx, sy, C.cellW, C.cellH,
      Math.round(-dw / 2), Math.round(-dh / 2), Math.round(dw), Math.round(dh));

    if (this.hitFlash > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.80, this.hitFlash * 6)})`;
      ctx.fillRect(Math.round(-dw / 2), Math.round(-dh / 2), Math.round(dw), Math.round(dh));
    }

    ctx.globalCompositeOperation = 'source-over';
    if (!this.dead) {
      const hpW = 118 * this.scale;
      const hpA = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,.50)';
      ctx.fillRect(-hpW / 2, -83 * this.scale, hpW, 6 * this.scale);
      ctx.fillStyle = hpA < 0.38 ? 'rgba(255,110,75,.95)' : 'rgba(120,235,255,.9)';
      ctx.fillRect(-hpW / 2, -83 * this.scale, hpW * hpA, 6 * this.scale);
    }

    ctx.restore();

    if (world.debug) {
      const b = this.getHurtbox();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,80,160,.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,80,160,.95)';
      ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
      ctx.restore();
    }
  }
}

window.SKY.HelicopterEnemy = HelicopterEnemy;
SKY.EnemyFactory.register('helicopter-enemy', HelicopterEnemy);
