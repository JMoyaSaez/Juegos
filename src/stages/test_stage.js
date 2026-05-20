window.SKY = window.SKY || {};

window.SKY.TestStage = {
  name: 'Mini Stage 01 - Razorback to Omega',
  enemies: [
    {
      type: 'helicopter-enemy',
      x: 1210,
      y: 268,
      hp: SKY.Config.enemy.helicopter.hp,
      scale: SKY.Config.enemy.helicopter.scale,
      respawn: false,
      name: 'AH-91 Razorback Helicopter',
    }
  ],

  runtime: null,

  resetRuntime() {
    this.runtime = {
      phase: 'helicopter',
      bossSpawned: false,
      bossDelay: 0,
      complete: false,
      announceLatch: false,
    };
  },

  phaseLabel() {
    if (!this.runtime) return 'BOOT';
    if (this.runtime.phase === 'helicopter') return 'PHASE 1 // HELICOPTER';
    if (this.runtime.phase === 'bossIncoming') return 'PHASE 2 // BOSS INCOMING';
    if (this.runtime.phase === 'boss') return 'PHASE 2 // OMEGA BOSS';
    if (this.runtime.phase === 'clear') return 'STAGE CLEAR';
    return this.runtime.phase.toUpperCase();
  },

  spawnBoss(world) {
    const cfg = SKY.Config.enemy.bossBiomech;
    world.player.setScaleProfile('boss');
    world.enemies.push(SKY.EnemyFactory.create('boss-biomech', 1380, world.GROUND_Y, {
      hp: cfg.hp,
      scale: cfg.scale,
      targetX: cfg.targetX,
      name: 'BIOMECH OMEGA-01',
    }));
    world.projectiles.length = 0;
    world.addShake(SKY.Config.combat.shakeHeavy + 4, 0.36);
    world.particles.push(new SKY.CombatText(world.W * 0.52, 190, 'OMEGA-01 DEPLOYED', 'orange'));
  },

  update(dt, world) {
    if (!this.runtime) this.resetRuntime();
    const r = this.runtime;
    const s = dt / 1000;

    if (r.phase === 'helicopter') {
      const helicopterAliveOrDying = world.enemies.some(enemy => enemy instanceof SKY.HelicopterEnemy && !enemy.remove);
      if (!helicopterAliveOrDying) {
        r.phase = 'bossIncoming';
        r.bossDelay = 1.25;
        world.projectiles.length = 0;
        world.particles.push(new SKY.CombatText(world.W * 0.52, 190, 'BOSS INCOMING', 'gold'));
        world.addShake(SKY.Config.combat.shakeHeavy, 0.24);
      }
      return;
    }

    if (r.phase === 'bossIncoming') {
      r.bossDelay -= s;
      if (r.bossDelay <= 0 && !r.bossSpawned) {
        r.bossSpawned = true;
        r.phase = 'boss';
        this.spawnBoss(world);
      }
      return;
    }

    if (r.phase === 'boss') {
      const bosses = world.enemies.filter(enemy => enemy instanceof SKY.BossBiomechEnemy);
      const bossAliveOrDying = bosses.some(enemy => !enemy.dead || !enemy.finalExplosionDone);
      if (bosses.length > 0 && !bossAliveOrDying && !r.complete) {
        r.complete = true;
        r.phase = 'clear';
        world.projectiles.length = 0;
        world.player.setScaleProfile('mission');
        world.addShake(SKY.Config.combat.shakeHeavy, 0.22);
        world.particles.push(new SKY.CombatText(world.W * 0.50, 190, 'STAGE CLEAR', 'gold'));
      }
    }
  }
};
