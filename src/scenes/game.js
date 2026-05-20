window.SKY = window.SKY || {};

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.W = SKY.Config.canvas.width;
    this.H = SKY.Config.canvas.height;
    this.GROUND_Y = SKY.Config.canvas.groundY;

    this.input = SKY.Input;
    this.debug = false;
    this.last = 0;
    this.time = 0;
    this.shakePower = 0;
    this.shakeTime = 0;
    this.hitStop = 0;

    this.playerAtlas = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];

    this.arcadeMessages = new SKY.ArcadeMessages();
    this.hud = new SKY.GameHud();
    this.stageClearScreen = new SKY.StageClearScreen();
    this.stage = new SKY.Stage01Director();
  }

  async start() {
    this.input.bind();

    try {
      const loaded = await Promise.all([
        SKY.Assets.loadImage('player', SKY.Config.atlas.playerSrc),
        SKY.Assets.loadImage('helicopter', SKY.Config.helicopterAtlas.src),
        SKY.Assets.loadImage('bossBiomech', SKY.Config.bossAtlas.src),
        SKY.Assets.loadImage('bossBiomechDeath', SKY.Config.bossDeathAtlas.src),
        SKY.Assets.loadImage('ravenDrone', SKY.Config.ravenDroneAtlas.src),
        SKY.Assets.loadImage('celebration', SKY.Config.celebrationAtlas.src),
      ]);
      this.playerAtlas = loaded[0];
      this.player = new SKY.Player(SKY.Config.player.startX, this.GROUND_Y, this.playerAtlas);
      this.stage.reset(this);
      requestAnimationFrame(ts => this.loop(ts));
    } catch (err) {
      this.drawLoadError(err);
    }
  }

  reset() {
    this.player.reset();
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.particles.length = 0;
    this.shakePower = 0;
    this.shakeTime = 0;
    this.hitStop = 0;
    this.stage.reset(this);
  }

  drawLoadError(err) {
    const ctx = this.ctx;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.fillStyle = '#fff';
    ctx.font = '26px sans-serif';
    ctx.fillText(err?.message || 'No se ha podido cargar el juego', 70, 120);
  }

  addShake(power, time = 0.10) {
    this.shakePower = Math.max(this.shakePower, power);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  addHitStop(time) {
    this.hitStop = Math.max(this.hitStop, time);
  }

  getShakeOffset() {
    if (this.shakeTime <= 0 || this.shakePower <= 0) return { x: 0, y: 0 };
    const decay = Math.min(1, this.shakeTime / 0.22);
    return {
      x: (Math.random() * 2 - 1) * this.shakePower * decay,
      y: (Math.random() * 2 - 1) * this.shakePower * decay,
    };
  }

  spawnDustBurst(x, y, count, power = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new SKY.DustParticle(
        x + Math.random() * 36 - 18,
        y,
        (Math.random() * 2 - 1) * 110 * power,
        -(25 + Math.random() * 55) * power,
        4 + Math.random() * 8,
        .28 + Math.random() * .25,
        .55
      ));
    }
  }

  getAimAssistDirection(muzzle, rawDir, aimName) {
    const cfg = SKY.Config.player.aimAssist;
    if (!cfg?.enabled) return null;

    let best = null;
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.remove) continue;
      const hb = enemy.getHurtbox?.() || enemy.getHitbox?.();
      if (!hb) continue;
      const target = enemy.getDamageCenter?.() || {
        x: hb.x + hb.w / 2,
        y: hb.y + hb.h / 2,
      };
      const dx = target.x - muzzle.x;
      const dy = target.y - muzzle.y;
      const d = SKY.Math2D.length(dx, dy);
      if (d <= 0.001 || d > cfg.maxDistance) continue;

      const toTarget = SKY.Math2D.normalize(dx, dy);
      const dot = rawDir.x * toTarget.x + rawDir.y * toTarget.y;
      const threshold = aimName === 'up' ? cfg.upDot :
                        aimName === 'diagonalUp' ? cfg.diagonalDot :
                        cfg.horizontalDot;
      if (dot < threshold) continue;

      const score = dot * 1000 - d * 0.12 + (enemy.boss ? 40 : 0);
      if (!best || score > best.score) best = { score, dir: toTarget };
    }

    if (!best) return null;
    const blend = aimName === 'up' ? cfg.verticalBlend : cfg.blend;
    return SKY.Math2D.normalize(
      rawDir.x * (1 - blend) + best.dir.x * blend,
      rawDir.y * (1 - blend) + best.dir.y * blend
    );
  }

  explode(x, y, radius = 120, damage = 0) {
    for (let i = 0; i < 44; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 90 + Math.random() * 420;
      this.particles.push(new SKY.SparkParticle(
        x,
        y,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        0.18 + Math.random() * 0.24,
        0.42,
        Math.random() > 0.35 ? 'orange' : 'cyan'
      ));
    }

    this.spawnDustBurst(x, this.GROUND_Y + 2, 22, 1.45);
    this.addShake(SKY.Config.combat.shakeHeavy, 0.22);

    if (damage > 0) {
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const center = enemy.getDamageCenter?.() || { x: enemy.x, y: enemy.y };
        const d = SKY.Math2D.dist(x, y, center.x, center.y);
        if (d <= radius) enemy.applyDamage(damage, this);
      }
    }
  }

  handleInput() {
    const input = this.input;

    if (!this.stage?.isArcadeLocked?.()) {
      if (input.wasFirePressed()) this.player.shoot(this);
      if (input.wasJumpPressed()) this.player.jump(this);
      if (input.wasPressed('KeyG')) this.player.throwGrenade(this);
    }

    if (input.wasPressed('Digit1') || input.wasPressed('Numpad1')) this.player.setScaleProfile('mission');
    if (input.wasPressed('Digit2') || input.wasPressed('Numpad2')) this.player.setScaleProfile('boss');
    if (input.wasPressed('Equal') || input.wasPressed('NumpadAdd')) this.player.adjustScale(SKY.Config.player.scaleStep);
    if (input.wasPressed('Minus') || input.wasPressed('NumpadSubtract')) this.player.adjustScale(-SKY.Config.player.scaleStep);

    if (input.wasPressed('KeyR')) this.reset();
    if (input.wasPressed('KeyD')) this.debug = !this.debug;
    if (input.wasPressed('KeyF')) this.toggleFullscreen();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.canvas.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  updateActors(dt) {
    this.player.update(dt, this);
    for (const enemy of this.enemies) enemy.update(dt, this);
    for (const projectile of this.projectiles) projectile.update(dt, this);
    for (const particle of this.particles) particle.update(dt, this);
  }

  updateScreenFx(dt) {
    const s = dt / 1000;
    this.time += s;
    this.shakeTime = Math.max(0, this.shakeTime - s);
    if (this.shakeTime <= 0) this.shakePower = Math.max(0, this.shakePower - 80 * s);
    this.arcadeMessages.update(dt);
  }

  solveCollisions() {
    for (const projectile of this.projectiles) {
      if (projectile.remove) continue;

      if (projectile instanceof SKY.Bullet) {
        for (const enemy of this.enemies) {
          if (enemy.dead && !(enemy instanceof SKY.HelicopterEnemy)) continue;
          const segmentHit = enemy.intersectsSegment?.(projectile.prevX, projectile.prevY, projectile.x, projectile.y);
          const pointHit = enemy.containsPoint?.(projectile.x, projectile.y);
          if (segmentHit || pointHit) {
            projectile.remove = true;
            enemy.applyDamage(projectile.damage, this);
            break;
          }
        }
      }

      if (projectile instanceof SKY.EnemyBolt) {
        const b = this.player.getHitbox();
        const hit = projectile.x >= b.x && projectile.x <= b.x + b.w &&
                    projectile.y >= b.y && projectile.y <= b.y + b.h;
        if (hit) {
          projectile.remove = true;
          this.player.applyDamage(projectile.damage, this, projectile.x);
        }
      }
    }
  }

  sweepDeadActors() {
    this.projectiles = this.projectiles.filter(projectile => !projectile.remove);
    this.particles = this.particles.filter(particle => !particle.remove);
    this.enemies = this.enemies.filter(enemy => !enemy.remove);
  }

  update(dt) {
    this.handleInput();
    this.updateScreenFx(dt);

    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt / 1000);
      for (const particle of this.particles) particle.update(dt, this);
      this.sweepDeadActors();
      this.stage.update(dt, this);
      this.input.endFrame();
      return;
    }

    this.updateActors(dt);
    this.solveCollisions();
    this.sweepDeadActors();
    this.stage.update(dt, this);
    this.sweepDeadActors();
    this.input.endFrame();
  }

  drawMiniHud() {
    if (!this.debug) return;
    const ctx = this.ctx;
    const aliveEnemies = this.enemies.filter(e => !e.dead).length;
    ctx.save();
    ctx.font = '16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(220,240,255,.86)';
    ctx.fillText(
      `build=${SKY.Build.version}  stage=${this.stage?.phaseLabel?.() || 'N/A'}  state=${this.player.state}  scale=${this.player.scale.toFixed(2)}  HP=${this.player.hp}/${this.player.maxHp}  enemies=${aliveEnemies}  shots=${this.projectiles.length}`,
      20,
      this.H - 48
    );
    ctx.restore();
  }

  drawWorld() {
    SKY.Stage01Background.draw(this.ctx, this);

    // Stable arcade order. Keep this explicit so visual layering never regresses by accident.
    for (const particle of this.particles) {
      if (particle instanceof SKY.DustParticle) particle.draw(this.ctx, this);
    }
    for (const projectile of this.projectiles) {
      if (projectile instanceof SKY.Bullet) projectile.draw(this.ctx, this);
    }
    for (const particle of this.particles) {
      if (particle instanceof SKY.Shell) particle.draw(this.ctx, this);
    }
    for (const projectile of this.projectiles) {
      if (projectile instanceof SKY.Grenade) projectile.draw(this.ctx, this);
    }
    for (const projectile of this.projectiles) {
      if (projectile instanceof SKY.EnemyBolt) projectile.draw(this.ctx, this);
    }
    for (const particle of this.particles) {
      if (particle instanceof SKY.SparkParticle) particle.draw(this.ctx, this);
    }

    for (const enemy of this.enemies) enemy.draw(this.ctx, this);
    this.player.draw(this.ctx, this);

    for (const particle of this.particles) {
      if (particle instanceof SKY.CombatText) particle.draw(this.ctx, this);
    }
  }

  draw() {
    const ctx = this.ctx;
    const shake = this.getShakeOffset();

    ctx.save();
    ctx.translate(Math.round(shake.x), Math.round(shake.y));
    this.drawWorld();
    ctx.restore();

    this.hud.draw(ctx, this);
    this.arcadeMessages.draw(ctx, this);
    this.stageClearScreen.draw(ctx, this);
    this.drawMiniHud();
  }

  loop(ts) {
    const dt = Math.min(32, ts - this.last || 16.7);
    this.last = ts;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
}

window.SKY.Game = Game;
