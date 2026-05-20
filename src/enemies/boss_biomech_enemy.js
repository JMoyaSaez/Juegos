window.SKY = window.SKY || {};

class BossBiomechEnemy extends SKY.Actor {
  constructor(x, y, options = {}) {
    super(x, y);
    const cfg = SKY.Config.enemy.bossBiomech;
    this.spawnX = x;
    this.spawnY = y;
    this.targetX = options.targetX || cfg.targetX;
    this.maxHp = options.hp || cfg.hp;
    this.hp = this.maxHp;
    this.scale = options.scale || cfg.scale;
    this.name = options.name || 'BIOMECH OMEGA-01';
    this.state = 'enter';
    this.facing = -1;
    this.frame = 0;
    this.frameTime = 0;
    this.phase = 0;
    this.hitFlash = 0;
    this.attackCooldown = 1.15;
    this.actionTimer = 0;
    this.deathTimer = 0;
    this.deadFxLatch = 0;
    this.finalExplosionDone = false;
    this.phase2Triggered = false;
    this.boss = true;

    // Production note v12:
    // Boss death no longer uses the normal uniform boss atlas row.
    // The original final row contained frames wider than the 220x180 cells,
    // so it produced side fragments and clipped smoke. Death is now rendered
    // from boss_biomech_death_atlas.png with larger clean cells.
    this.deathAnchorX = x;
    this.deathAnchorY = y;
    this.deathSpriteAlpha = 1;
  }

  getAnimationName() {
    if (this.dead) return 'death';
    if (this.state === 'rage') return 'rage';
    if (this.state === 'cannonCharge') return 'cannonCharge';
    if (this.state === 'cannonFire') return 'cannonFire';
    if (this.state === 'melee') return 'melee';
    if (this.state === 'missile') return 'missile';
    if (this.hitFlash > 0.06 && this.state === 'idle') return 'hurt';
    if (this.state === 'enter') return 'walk';
    return 'idle';
  }

  getHurtbox() {
    const s = this.scale;
    return {
      x: this.x - 78 * s,
      y: this.y - 145 * s,
      w: 146 * s,
      h: 145 * s,
    };
  }

  getHitbox() {
    return this.getHurtbox();
  }

  getDamageCenter() {
    return { x: this.x - 8 * this.scale, y: this.y - 82 * this.scale };
  }

  containsPoint(x, y) {
    if (this.dead) return false;
    return SKY.Math2D.pointInRect(x, y, this.getHurtbox());
  }

  intersectsSegment(x1, y1, x2, y2) {
    if (this.dead) return false;
    return SKY.Math2D.segmentIntersectsRect(x1, y1, x2, y2, this.getHurtbox());
  }

  cannonPoint() {
    return {
      x: this.x - 96 * this.scale,
      y: this.y - 88 * this.scale,
    };
  }

  missilePoint(offsetY = 0) {
    return {
      x: this.x - 42 * this.scale,
      y: this.y - (132 + offsetY) * this.scale,
    };
  }

  applyDamage(amount, world) {
    if (this.dead || this.state === 'enter') return;

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.12;

    world.addShake(SKY.Config.combat.shakeLight + 1, 0.06);
    world.addHitStop(SKY.Config.combat.hitStopLight);
    world.particles.push(new SKY.CombatText(this.x - 18 * this.scale, this.y - 166 * this.scale, amount, 'gold'));

    for (let i = 0; i < 14; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + Math.random() * 126 * this.scale - 78 * this.scale,
        this.y - 95 * this.scale + Math.random() * 92 * this.scale,
        -290 + Math.random() * 520,
        -255 + Math.random() * 300,
        0.08 + Math.random() * 0.16,
        0.28,
        Math.random() > 0.42 ? 'orange' : 'cyan'
      ));
    }

    if (!this.phase2Triggered && this.hp <= this.maxHp * 0.50) {
      this.phase2Triggered = true;
      this.state = 'rage';
      this.actionTimer = 1.35;
      this.attackCooldown = 0.25;
      world.addShake(SKY.Config.combat.shakeHeavy + 5, 0.38);
      world.addHitStop(SKY.Config.combat.hitStopHeavy);
      world.particles.push(new SKY.CombatText(this.x, this.y - 192 * this.scale, 'PHASE 2', 'orange'));
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.state = 'death';
      this.frame = 0;
      this.frameTime = 0;
      this.deathAnchorX = this.x;
      this.deathAnchorY = this.y;
      this.deathSpriteAlpha = 1;
      this.hitFlash = 0;
      this.deathTimer = SKY.Config.enemy.bossBiomech.deathTime;
      this.deadFxLatch = 0.12;
      world.addShake(SKY.Config.combat.shakeHeavy + 8, 0.50);
      world.addHitStop(SKY.Config.combat.hitStopHeavy + 0.05);
      world.particles.push(new SKY.CombatText(this.x, this.y - 196 * this.scale, 'BOSS DOWN', 'gold'));
    }
  }

  fireCannon(world) {
    const muzzle = this.cannonPoint();
    const targetX = world.player.x;
    const targetY = world.player.y - 145 * world.player.scale;
    const dir = SKY.Math2D.normalize(targetX - muzzle.x, targetY - muzzle.y);
    const speed = SKY.Config.enemy.bossBiomech.cannonSpeed;
    world.projectiles.push(new SKY.EnemyBolt(muzzle.x, muzzle.y, dir.x * speed, dir.y * speed, 2));

    for (let i = 0; i < 22; i++) {
      world.particles.push(new SKY.SparkParticle(
        muzzle.x,
        muzzle.y,
        dir.x * (260 + Math.random() * 480) + (Math.random() - 0.5) * 210,
        dir.y * (260 + Math.random() * 480) + (Math.random() - 0.5) * 210,
        0.07 + Math.random() * 0.11,
        0.20,
        'orange'
      ));
    }
    world.addShake(SKY.Config.combat.shakeLight + 2, 0.12);
  }

  fireMissileBarrage(world) {
    const p = this.missilePoint(Math.random() * 24 - 12);
    const targetX = world.player.x;
    const targetY = world.player.y - 115 * world.player.scale;
    const base = SKY.Math2D.normalize(targetX - p.x, targetY - p.y);
    const spread = this.phase2Triggered ? [-0.18, 0, 0.18] : [-0.10, 0.10];
    for (const off of spread) {
      const vx = base.x * Math.cos(off) - base.y * Math.sin(off);
      const vy = base.x * Math.sin(off) + base.y * Math.cos(off);
      const sp = SKY.Config.enemy.bossBiomech.missileSpeed;
      world.projectiles.push(new SKY.EnemyBolt(p.x, p.y, vx * sp, vy * sp, 1));
    }
    world.addShake(SKY.Config.combat.shakeLight, 0.08);
  }

  updateAlive(dt, world) {
    const s = dt / 1000;
    const cfg = SKY.Config.enemy.bossBiomech;

    if (this.state === 'enter') {
      this.x -= cfg.enterSpeed * s;
      if (this.x <= this.targetX) {
        this.x = this.targetX;
        this.state = 'idle';
        world.particles.push(new SKY.CombatText(this.x, this.y - 192 * this.scale, 'WARNING: BOSS', 'orange'));
        world.addShake(SKY.Config.combat.shakeHeavy, 0.25);
        world.spawnDustBurst(this.x - 25 * this.scale, world.GROUND_Y + 3, 32, 1.7);
      }
      return;
    }

    if (this.actionTimer > 0) {
      this.actionTimer -= s;
      if (this.state === 'cannonFire' && this.actionTimer < 0.28 && !this.fireLatch) {
        this.fireLatch = true;
        this.fireCannon(world);
      }
      if (this.state === 'missile' && this.actionTimer < 0.42 && !this.missileLatch) {
        this.missileLatch = true;
        this.fireMissileBarrage(world);
      }
      if (this.actionTimer <= 0) {
        if (this.state === 'cannonCharge') {
          this.state = 'cannonFire';
          this.actionTimer = 0.48;
          this.fireLatch = false;
        } else {
          this.state = 'idle';
          this.fireLatch = false;
          this.missileLatch = false;
          this.attackCooldown = (this.phase2Triggered ? 0.55 : 0.95) + Math.random() * 0.45;
        }
      }
      return;
    }

    this.attackCooldown -= s;
    if (this.attackCooldown <= 0) {
      const roll = Math.random();
      if (roll < 0.48) {
        this.state = 'cannonCharge';
        this.actionTimer = 0.34;
      } else if (roll < 0.82) {
        this.state = 'missile';
        this.actionTimer = 0.72;
        this.missileLatch = false;
      } else {
        this.state = 'melee';
        this.actionTimer = 0.62;
        world.addShake(SKY.Config.combat.shakeLight + 1, 0.12);
      }
    }

    if (this.hp < this.maxHp * 0.45 && Math.random() < 0.08) {
      world.particles.push(new SKY.DustParticle(
        this.x + 26 * this.scale,
        this.y - 132 * this.scale,
        -35 + Math.random() * 70,
        -90 - Math.random() * 70,
        8 + Math.random() * 12,
        0.50 + Math.random() * 0.30,
        0.80
      ));
    }
  }

  updateDeath(dt, world) {
    const s = dt / 1000;
    this.deathTimer -= s;
    this.deadFxLatch -= s;
    if (this.deadFxLatch <= 0 && this.deathTimer > 0.35) {
      this.deadFxLatch = 0.16;
      world.explode(
        this.deathAnchorX + Math.random() * 150 * this.scale - 80 * this.scale,
        this.deathAnchorY - 80 * this.scale + Math.random() * 125 * this.scale,
        90,
        0
      );
    }
    if (this.deathTimer < 0.95) {
      this.deathSpriteAlpha = Math.max(0, this.deathTimer / 0.95);
    }

    if (this.deathTimer <= 0 && !this.finalExplosionDone) {
      this.finalExplosionDone = true;
      world.explode(this.deathAnchorX - 10 * this.scale, this.deathAnchorY - 78 * this.scale, 220, 0);
      world.spawnDustBurst(this.deathAnchorX, world.GROUND_Y + 3, 60, 2.2);
      world.addShake(SKY.Config.combat.shakeHeavy + 12, 0.65);
    }
  }

  updateAnimation(dt) {
    const s = dt / 1000;
    const animName = this.getAnimationName();
    const C = animName === 'death' ? SKY.Config.bossDeathAtlas : SKY.Config.bossAtlas;
    const anim = C.frames[animName] || C.frames.idle;
    let fps = 8;
    if (animName === 'cannonFire' || animName === 'missile') fps = 12;
    if (animName === 'death') fps = 9;
    if (animName === 'rage') fps = 10;

    this.frameTime += s;
    if (this.frameTime >= 1 / fps) {
      this.frameTime = 0;

      // v10: death must be one-shot. Looping the destruction row caused the
      // final smoke/explosion frames to jump back to earlier collapse frames.
      if (animName === 'death') {
        this.frame = Math.min(this.frame + 1, anim.length - 1);
      } else {
        this.frame = (this.frame + 1) % anim.length;
      }
    }
  }

  update(dt, world) {
    const s = dt / 1000;
    this.phase += s;
    this.hitFlash = this.dead ? 0 : Math.max(0, this.hitFlash - s);
    if (this.dead) this.updateDeath(dt, world);
    else this.updateAlive(dt, world);
    this.updateAnimation(dt);
  }

  getFrameAnchor(animName, frame) {
    if (animName === 'death') return SKY.Config.bossDeathAtlas.anchor;
    return SKY.Config.bossAtlas.anchor;
  }

  getFrameSource(animName) {
    if (animName === 'death') {
      return {
        image: SKY.Assets.getImage('bossBiomechDeath'),
        atlas: SKY.Config.bossDeathAtlas,
      };
    }
    return {
      image: SKY.Assets.getImage('bossBiomech'),
      atlas: SKY.Config.bossAtlas,
    };
  }

  draw(ctx, world) {
    const animName = this.getAnimationName();
    const source = this.getFrameSource(animName);
    const image = source.image;
    const C = source.atlas;
    if (!image) return;
    const anim = C.frames[animName] || C.frames.idle;
    const f = anim[this.frame % anim.length];
    const sx = f.col * C.cellW;
    const sy = f.row * C.cellH;
    const dw = C.cellW * this.scale;
    const dh = C.cellH * this.scale;
    const anchor = this.getFrameAnchor(animName, this.frame);
    const drawX = this.dead ? this.deathAnchorX : this.x;
    const drawY = this.dead ? this.deathAnchorY : this.y;
    const spriteDx = Math.round(-anchor.x * this.scale);
    const spriteDy = Math.round(-anchor.y * this.scale);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.40)';
    ctx.beginPath();
    ctx.ellipse(drawX - 8 * this.scale, world.GROUND_Y + 13, 74 * this.scale, 13 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(Math.round(drawX), Math.round(drawY));
    if (this.dead) ctx.globalAlpha = this.deathSpriteAlpha;
    ctx.drawImage(image, sx, sy, C.cellW, C.cellH,
      spriteDx,
      spriteDy,
      Math.round(dw), Math.round(dh));

    if (this.hitFlash > 0 && !this.dead) {
      // v12: never fill a raw rectangle over the canvas. `source-atop` on the
      // main canvas uses the already drawn background as destination and creates
      // a huge grey block. A second additive sprite pass keeps the flash masked
      // by the sprite alpha.
      ctx.save();
      ctx.globalAlpha = Math.min(0.68, this.hitFlash * 5.2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(image, sx, sy, C.cellW, C.cellH,
        spriteDx,
        spriteDy,
        Math.round(dw), Math.round(dh));
      ctx.restore();
    }

    if (!this.dead) {
      const hpW = 172 * this.scale;
      const hpA = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,.62)';
      ctx.fillRect(-hpW / 2, -170 * this.scale, hpW, 8 * this.scale);
      ctx.fillStyle = hpA < 0.50 ? 'rgba(255,91,42,.96)' : 'rgba(255,196,74,.96)';
      ctx.fillRect(-hpW / 2, -170 * this.scale, hpW * hpA, 8 * this.scale);
    }
    ctx.restore();

    if (world.debug) {
      const b = this.getHurtbox();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,190,60,.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      const m = this.cannonPoint();
      ctx.fillStyle = 'rgba(255,190,60,.95)';
      ctx.fillRect(m.x - 3, m.y - 3, 6, 6);
      if (this.dead) {
        ctx.strokeStyle = 'rgba(0,255,210,.95)';
        ctx.beginPath();
        ctx.moveTo(this.deathAnchorX - 12, this.deathAnchorY);
        ctx.lineTo(this.deathAnchorX + 12, this.deathAnchorY);
        ctx.moveTo(this.deathAnchorX, this.deathAnchorY - 12);
        ctx.lineTo(this.deathAnchorX, this.deathAnchorY + 12);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

window.SKY.BossBiomechEnemy = BossBiomechEnemy;
SKY.EnemyFactory.register('boss-biomech', BossBiomechEnemy);
