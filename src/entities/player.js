window.SKY = window.SKY || {};

// Player is isolated by design: work on movement, scale, weapons and sprite state here.

class Player extends SKY.Actor {
  constructor(x, y, atlas) {
    super(x, y);
    const cfg = SKY.Config.player;
    this.atlas = atlas;
    this.state = 'idle';
    this.frame = 0;
    this.frameTime = 0;
    this.scale = SKY.Config.scaleProfiles.mission;
    this.scaleProfile = 'mission';
    this.baseSpeed = cfg.baseSpeed;
    this.jumpPower = cfg.jumpPower;
    this.gravity = cfg.gravity;
    this.maxHp = cfg.maxHp;
    this.hp = this.maxHp;
    this.invuln = 0;
    this.hitFlash = 0;
    this.shootTimer = 0;
    this.shootCooldown = 0;
    this.grenadeTimer = 0;
    this.grenadeCooldown = 0;
    this.wasOnGround = true;
  }

  reset() {
    this.x = SKY.Config.player.startX;
    this.y = SKY.Config.canvas.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.dead = false;
    this.hp = this.maxHp;
    this.invuln = 0;
    this.hitFlash = 0;
    this.state = 'idle';
    this.frame = 0;
    this.frameTime = 0;
    this.shootTimer = 0;
    this.shootCooldown = 0;
    this.grenadeTimer = 0;
    this.grenadeCooldown = 0;
    this.setScaleProfile('mission');
  }

  onGround() {
    return this.y >= SKY.Config.canvas.groundY - 0.1;
  }

  setScaleProfile(profile) {
    const value = SKY.Config.scaleProfiles[profile];
    if (!value) return;
    this.scaleProfile = profile;
    this.scale = value;
  }

  adjustScale(delta) {
    const cfg = SKY.Config.player;
    this.scaleProfile = 'custom';
    this.scale = SKY.Math2D.clamp(this.scale + delta, cfg.minScale, cfg.maxScale);
  }

  setState(next) {
    if (next === this.state) return;
    this.state = next;
    this.frame = 0;
    this.frameTime = 0;
  }

  getHitbox() {
    const sc = this.scale;
    const crouch = this.onGround() && this.state === 'crouch';
    const w = (crouch ? 118 : 96) * sc;
    const h = (crouch ? 155 : 245) * sc;
    const yOffset = crouch ? 155 : 245;
    return {
      x: this.x - w / 2,
      y: this.y - yOffset * sc,
      w,
      h,
    };
  }

  applyDamage(amount, world, sourceX = this.x) {
    if (this.invuln > 0 || this.dead) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invuln = SKY.Config.player.invulnTime;
    this.hitFlash = 0.18;
    this.vx = (this.x < sourceX ? -1 : 1) * 105;
    this.vy = Math.min(this.vy, -145);

    world.addShake(SKY.Config.combat.shakeHeavy, 0.17);
    world.addHitStop(SKY.Config.combat.hitStopHeavy);
    world.particles.push(new SKY.CombatText(this.x, this.y - 230 * this.scale, `-${amount}`, 'danger'));

    for (let i = 0; i < 12; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + Math.random() * 40 - 20,
        this.y - 155 * this.scale + Math.random() * 52 - 26,
        -210 + Math.random() * 420,
        -210 + Math.random() * 260,
        0.10 + Math.random() * 0.12,
        0.25,
        Math.random() > 0.35 ? 'orange' : 'cyan'
      ));
    }

    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this.x = SKY.Config.player.startX;
      this.y = SKY.Config.canvas.groundY;
      this.vx = 0;
      this.vy = 0;
      world.spawnDustBurst(this.x, SKY.Config.canvas.groundY + 2, 18, 1.35);
      world.particles.push(new SKY.CombatText(this.x, this.y - 260 * this.scale, 'RECOVER', 'gold'));
    }

    return true;
  }

  jump(world) {
    if (!this.onGround()) return;
    if (world.input.keys.down) return;
    this.vy = -this.jumpPower;
    this.y = SKY.Config.canvas.groundY - 1;
    world.spawnDustBurst(this.x, SKY.Config.canvas.groundY + 2, 8, 1.1);
  }

  resolveAim(world) {
    const keys = world.input.keys;
    const crouching = this.onGround() && keys.down;

    if (!crouching && keys.left && !keys.right) this.facing = -1;
    if (!crouching && keys.right && !keys.left) this.facing = 1;

    if (crouching) {
      return { name: 'crouch', dx: this.facing, dy: 0 };
    }

    if (keys.up) {
      if (keys.left && !keys.right) return { name: 'diagonalUp', dx: -0.72, dy: -0.72 };
      if (keys.right && !keys.left) return { name: 'diagonalUp', dx: 0.72, dy: -0.72 };
      return { name: 'up', dx: 0, dy: -1 };
    }

    return { name: 'horizontal', dx: this.facing, dy: 0 };
  }

  getMuzzlePoint(world, aim) {
    const s = this.scale;
    const cfg = SKY.Config.player.muzzle;
    const m = cfg[aim.name] || cfg.horizontal;
    const side = aim.name === 'up' ? this.facing : Math.sign(aim.dx || this.facing || 1);

    return {
      x: this.x + side * m.x * s,
      y: this.y + m.y * s,
    };
  }

  shoot(world) {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = 0.13;
    this.shootTimer = 0.15;

    const aim = this.resolveAim(world);
    let dir = SKY.Math2D.normalize(aim.dx, aim.dy);
    const speed = SKY.Config.player.bulletSpeed;
    const muzzle = this.getMuzzlePoint(world, aim);
    const assisted = world.getAimAssistDirection?.(muzzle, dir, aim.name);
    if (assisted) dir = assisted;
    const s = this.scale;

    const aimedLife = (aim.name === 'up' || aim.name === 'diagonalUp') ? 0.62 : 0.50;
    world.projectiles.push(new SKY.Bullet(
      muzzle.x,
      muzzle.y,
      dir.x * speed,
      dir.y * speed,
      { damage: 1, life: aimedLife, aimName: aim.name }
    ));

    // Shell ejection stays readable even for vertical/diagonal shots.
    world.particles.push(new SKY.Shell(
      this.x + this.facing * 32 * s,
      this.y - 185 * s,
      this.facing
    ));

    world.addShake(1.4, 0.045);

    for (let i=0; i<7; i++) {
      const sideSpray = (Math.random() - 0.5) * 150;
      world.particles.push(new SKY.SparkParticle(
        muzzle.x,
        muzzle.y,
        dir.x * (230 + Math.random()*260) + -dir.y * sideSpray,
        dir.y * (230 + Math.random()*260) + dir.x * sideSpray,
        0.05 + Math.random()*0.08,
        0.14,
        'orange'
      ));
    }
  }

  throwGrenade(world) {
    if (this.grenadeCooldown > 0) return;
    if (!this.onGround()) return;
    this.grenadeCooldown = 0.70;
    this.grenadeTimer = 0.28;

    const s = this.scale;
    world.projectiles.push(new SKY.Grenade(
      this.x + this.facing * 72 * s,
      this.y - 250 * s,
      this.facing
    ));
  }

  spawnWalkDust(world) {
    if (Math.random() > .45) return;
    world.particles.push(new SKY.DustParticle(
      this.x - this.facing * 25 + Math.random()*18-9,
      SKY.Config.canvas.groundY + 3,
      -this.facing*(38+Math.random()*70),
      -18-Math.random()*22,
      3 + Math.random()*5,
      .35,
      .35
    ));
  }

  update(dt, world) {
    const s = dt / 1000;
    const keys = world.stage?.isArcadeLocked?.()
      ? { left:false, right:false, up:false, down:false, run:false }
      : world.input.keys;
    const C = SKY.Config;

    this.shootCooldown = Math.max(0, this.shootCooldown - s);
    this.grenadeCooldown = Math.max(0, this.grenadeCooldown - s);
    this.shootTimer = Math.max(0, this.shootTimer - s);
    this.grenadeTimer = Math.max(0, this.grenadeTimer - s);
    this.invuln = Math.max(0, this.invuln - s);
    this.hitFlash = Math.max(0, this.hitFlash - s);

    const grounded = this.onGround();
    this.vx *= grounded ? 0.62 : 0.96;

    const canMove = !(grounded && keys.down) && this.grenadeTimer <= 0;
    const spd = keys.run ? this.baseSpeed * C.player.runMultiplier : this.baseSpeed;

    if (canMove && keys.left && !keys.right) { this.vx = -spd; this.facing = -1; }
    if (canMove && keys.right && !keys.left) { this.vx = spd; this.facing = 1; }

    this.x = SKY.Math2D.clamp(this.x + this.vx * s, 70, C.canvas.width - 70);

    if (!grounded || this.vy !== 0) {
      this.vy += this.gravity * s;
      this.y += this.vy * s;
      if (this.y >= C.canvas.groundY) {
        this.y = C.canvas.groundY;
        this.vy = 0;
        if (!this.wasOnGround) world.spawnDustBurst(this.x, C.canvas.groundY + 2, 10, 1.0);
      }
    }
    this.wasOnGround = this.onGround();

    let nextState = 'idle';
    if (!this.onGround()) nextState = 'jump';
    else if (this.grenadeTimer > 0) nextState = 'grenade';
    else if (keys.down) nextState = 'crouch';
    else if (this.shootTimer > 0) nextState = 'shoot';
    else if (Math.abs(this.vx) > 0.1) nextState = 'walk';
    else nextState = 'idle';
    this.setState(nextState);

    const fps = this.state === 'walk' ? (keys.run ? 15 : 10) :
                this.state === 'idle' ? 4 : 1;
    this.frameTime += s;
    if (this.frameTime >= 1/fps) {
      this.frameTime = 0;
      const anim = C.atlas.frames[this.state] || C.atlas.frames.idle;
      this.frame = (this.frame + 1) % anim.length;
      if (this.state === 'walk') this.spawnWalkDust(world);
    }
  }

  draw(ctx, world) {
    const C = SKY.Config;
    const anim = C.atlas.frames[this.state] || C.atlas.frames.idle;
    const f = anim[this.frame % anim.length];
    const sc = this.scale;
    const dw = C.atlas.cellW * sc;
    const dh = C.atlas.cellH * sc;
    const sx = f.col * C.atlas.cellW;
    const sy = f.row * C.atlas.cellH;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    const shadowW = (this.state === 'jump') ? 38*sc : (this.state === 'crouch' ? 66*sc : 54*sc);
    const shadowH = (this.state === 'jump') ? 8*sc : 13*sc;
    ctx.beginPath();
    ctx.ellipse(this.x, C.canvas.groundY+10, shadowW, shadowH, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(this.facing, 1);

    if (this.invuln > 0 && Math.floor(this.invuln * 24) % 2 === 0) ctx.globalAlpha = 0.62;
    ctx.drawImage(this.atlas, sx, sy, C.atlas.cellW, C.atlas.cellH,
      Math.round(-dw/2), Math.round(-dh), Math.round(dw), Math.round(dh));

    if (this.hitFlash > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.75, this.hitFlash * 4)})`;
      ctx.fillRect(Math.round(-dw/2), Math.round(-dh), Math.round(dw), Math.round(dh));
    }

    if (world.debug) {
      const b = this.getHitbox();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,255,180,.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(-dw/2), Math.round(-dh), Math.round(dw), Math.round(dh));
      ctx.fillStyle = 'rgba(0,255,180,.95)';
      ctx.fillRect(-4,-4,8,8);
      ctx.strokeStyle = 'rgba(255,255,0,.95)';
      ctx.strokeRect(b.x - this.x, b.y - this.y, b.w, b.h);
    }
    ctx.restore();
  }
}

window.SKY.Player = Player;
