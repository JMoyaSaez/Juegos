window.SKY = window.SKY || {};

class HologramTarget extends SKY.Actor {
  constructor(x, y, options = {}) {
    super(x, y);
    this.maxHp = options.hp || SKY.Config.enemy.hp;
    this.hp = this.maxHp;
    this.hitFlash = 0;
    this.deadTimer = 0;
    this.phase = 0;
    this.scale = options.scale || SKY.Config.enemy.targetScale;
    this.name = options.name || 'Target Holo-01';
  }

  getHitbox() {
    return this.getHurtbox();
  }

  getHurtbox() {
    const w = 70 * this.scale;
    const h = 170 * this.scale;
    return {
      x: this.x - w / 2,
      y: this.y - h,
      w,
      h,
    };
  }

  getDamageCenter() {
    return { x: this.x, y: this.y - 88 * this.scale };
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
    world.addShake(SKY.Config.combat.shakeLight, 0.06);
    world.addHitStop(SKY.Config.combat.hitStopLight);
    world.particles.push(new SKY.CombatText(this.x, this.y - 210 * this.scale, amount, 'cyan'));

    for (let i=0; i<8; i++) {
      world.particles.push(new SKY.SparkParticle(
        this.x + (Math.random()*52-26),
        this.y - 95 + (Math.random()*70-35),
        -180 + Math.random()*360,
        -180 + Math.random()*220,
        0.10 + Math.random()*0.12,
        0.24,
        'cyan'
      ));
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.deadTimer = 1.8;
      world.explode(this.x, this.y - 88, 100, 0);
      world.particles.push(new SKY.CombatText(this.x, this.y - 215 * this.scale, 'BREAK', 'gold'));
    }
  }

  update(dt) {
    const s = dt / 1000;
    this.phase += s;
    this.hitFlash = Math.max(0, this.hitFlash - s);
    if (this.dead) {
      this.deadTimer -= s;
      if (this.deadTimer <= 0) {
        this.dead = false;
        this.hp = this.maxHp;
        this.hitFlash = 0.16;
      }
    }
  }

  draw(ctx, world) {
    const b = this.getHitbox();
    const cx = this.x;
    const baseY = this.y;
    const pulse = Math.sin(this.phase * 7) * 0.5 + 0.5;
    const deadAlpha = this.dead ? 0.20 : 1.0;
    const flash = this.hitFlash > 0 ? 1 : 0;

    ctx.save();

    // Ground anchor and hologram base
    ctx.globalAlpha = 0.95 * deadAlpha;
    ctx.strokeStyle = `rgba(80, 220, 255, ${0.40 + pulse*0.20})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 8, 48, 11, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 8, 26, 5, 0, 0, Math.PI*2);
    ctx.stroke();

    if (!this.dead) {
      ctx.globalAlpha = 0.18 + pulse*0.08;
      const grad = ctx.createLinearGradient(cx, baseY, cx, baseY - 190);
      grad.addColorStop(0, 'rgba(80, 220, 255, .00)');
      grad.addColorStop(.45, 'rgba(80, 220, 255, .40)');
      grad.addColorStop(1, 'rgba(80, 220, 255, .00)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx - 58, baseY + 4);
      ctx.lineTo(cx - 26, baseY - 178);
      ctx.lineTo(cx + 26, baseY - 178);
      ctx.lineTo(cx + 58, baseY + 4);
      ctx.closePath();
      ctx.fill();
    }

    // Silhouette: deliberately a premium test dummy, not a fake enemy sprite.
    ctx.globalAlpha = deadAlpha;
    const bodyColor = flash ? 'rgba(255,255,255,.92)' : 'rgba(75, 218, 255, .48)';
    const edgeColor = flash ? 'rgba(255,255,255,.95)' : 'rgba(120, 235, 255, .95)';
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(cx, baseY - 150, 22, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    SKY.Draw.roundRectPath(ctx, cx - 26, baseY - 128, 52, 76, 12);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 18, baseY - 56);
    ctx.lineTo(cx - 34, baseY - 8);
    ctx.moveTo(cx + 18, baseY - 56);
    ctx.lineTo(cx + 34, baseY - 8);
    ctx.moveTo(cx - 27, baseY - 112);
    ctx.lineTo(cx - 58, baseY - 82);
    ctx.moveTo(cx + 27, baseY - 112);
    ctx.lineTo(cx + 58, baseY - 82);
    ctx.stroke();

    // Scanner bars
    if (!this.dead) {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = 'rgba(210, 250, 255, .70)';
      for (let i=0; i<5; i++) {
        const yy = baseY - 170 + ((this.phase*80 + i*38) % 158);
        ctx.beginPath();
        ctx.moveTo(cx - 44, yy);
        ctx.lineTo(cx + 44, yy);
        ctx.stroke();
      }
    }

    // HP pips
    ctx.globalAlpha = 0.82;
    const pipW = 10;
    for (let i=0; i<this.maxHp; i++) {
      ctx.fillStyle = i < this.hp ? 'rgba(100,230,255,.9)' : 'rgba(100,230,255,.18)';
      ctx.fillRect(cx - (this.maxHp*pipW)/2 + i*pipW, baseY - 204, 7, 4);
    }

    if (world.debug) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,80,160,.9)';
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    ctx.restore();
  }
}

window.SKY.HologramTarget = HologramTarget;

SKY.EnemyFactory.register('hologram-target', HologramTarget);
