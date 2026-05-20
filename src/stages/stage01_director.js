window.SKY = window.SKY || {};

class Stage01Director {
  constructor() {
    this.name = 'STAGE 01 - IRON HANGAR';
    this.resetState();
  }

  resetState() {
    this.phase = 'boot';
    this.timer = 0;
    this.waveIndex = 0;
    this.backgroundMode = 'normal';
    this.spawnLatch = false;
    this.heliSpawned = false;
    this.bossSpawned = false;
    this.clearLatch = false;
    this.complete = false;
    this.arcadeLocked = false;
  }

  reset(world) {
    this.resetState();
    this.phase = 'intro';
    this.timer = 0;
    this.arcadeLocked = false;
    this.backgroundMode = 'normal';
    world.enemies.length = 0;
    world.projectiles.length = 0;
    world.particles.length = 0;
    world.player.setScaleProfile('mission');
    world.arcadeMessages?.reset();
    world.arcadeMessages?.showStageTitle('STAGE 01', 'IRON HANGAR');
  }

  phaseLabel() {
    switch (this.phase) {
      case 'intro': return 'STAGE 01 // IRON HANGAR';
      case 'ready': return 'READY';
      case 'wave01': return 'STAGE 01 // ACCESS PLATFORM';
      case 'wave02': return 'STAGE 01 // AIR SECURITY';
      case 'helicopterWarning': return 'WARNING // ENEMY CHOPPER';
      case 'helicopterFight': return 'STAGE 01 // AH-91 RAZORBACK';
      case 'bossWarning': return 'WARNING // OMEGA-01';
      case 'bossFight': return 'BOSS // BIOMECH OMEGA-01';
      case 'stageClear': return 'STAGE CLEAR';
      case 'complete': return 'MISSION COMPLETE';
      default: return 'STAGE 01';
    }
  }

  isArcadeLocked() {
    return this.phase === 'stageClear' || this.phase === 'complete';
  }

  hasLiveEnemy(world, klass) {
    return world.enemies.some(enemy => enemy instanceof klass && !enemy.dead && !enemy.remove);
  }

  hasEnemyOrDeathSequence(world, klass) {
    return world.enemies.some(enemy => enemy instanceof klass && !enemy.remove);
  }

  spawnDrone(world, x, y, opts = {}) {
    // x/y define the intended combat position. Spawn outside screen so every drone
    // enters as a real arcade enemy instead of popping in like a debug target.
    world.enemies.push(SKY.EnemyFactory.create('raven-drone', opts.spawnX ?? world.W + 150, y, {
      targetX: x,
      respawn: false,
      hp: opts.hp ?? SKY.Config.enemy.ravenDrone.hp,
      scale: opts.scale ?? SKY.Config.enemy.ravenDrone.scale,
      shotCooldown: opts.shotCooldown ?? 1.55,
      name: opts.name || 'RAVEN-01 DRONE',
    }));
  }

  spawnWave01(world) {
    this.waveIndex = 1;
    this.spawnDrone(world, 845, 244, { scale: 0.58, shotCooldown: 1.75, name: 'RAVEN-01' });
    this.spawnDrone(world, 1060, 315, { scale: 0.62, shotCooldown: 1.55, name: 'RAVEN-02' });
    world.arcadeMessages?.show('GO!', 'CLEAR THE ACCESS PLATFORM', {
      kind: 'ready',
      y: 245,
      size: 70,
      subtitleSize: 20,
      duration: 1.30,
    });
  }

  spawnWave02(world) {
    this.waveIndex = 2;
    this.spawnDrone(world, 785, 218, { scale: 0.56, shotCooldown: 1.55, name: 'RAVEN-03' });
    this.spawnDrone(world, 990, 282, { scale: 0.62, shotCooldown: 1.35, name: 'RAVEN-04' });
    this.spawnDrone(world, 1180, 350, { scale: 0.58, shotCooldown: 1.65, name: 'RAVEN-05' });
    world.arcadeMessages?.show('AIR RAID', 'AIM UP / DIAGONAL FIRE', {
      kind: 'stage',
      y: 238,
      size: 66,
      subtitleSize: 20,
      duration: 1.35,
    });
  }

  spawnHelicopter(world) {
    this.heliSpawned = true;
    world.enemies.push(SKY.EnemyFactory.create('helicopter-enemy', 1235, 268, {
      hp: SKY.Config.enemy.helicopter.hp,
      scale: SKY.Config.enemy.helicopter.scale,
      respawn: false,
      name: 'AH-91 RAZORBACK',
    }));
    world.addShake(SKY.Config.combat.shakeLight + 3, 0.18);
  }

  spawnBoss(world) {
    const cfg = SKY.Config.enemy.bossBiomech;
    this.bossSpawned = true;
    this.backgroundMode = 'boss';
    world.player.setScaleProfile('boss');
    world.enemies.push(SKY.EnemyFactory.create('boss-biomech', 1380, world.GROUND_Y, {
      hp: cfg.hp,
      scale: cfg.scale,
      targetX: cfg.targetX,
      name: 'BIOMECH OMEGA-01',
    }));
    world.projectiles.length = 0;
    world.addShake(SKY.Config.combat.shakeHeavy + 4, 0.36);
  }

  clearProjectiles(world) {
    world.projectiles.length = 0;
  }

  allDronesCleared(world) {
    return !world.enemies.some(enemy => enemy instanceof SKY.RavenDroneEnemy && !enemy.remove);
  }

  updateIntro(dt, world) {
    const s = dt / 1000;
    this.timer += s;
    if (this.phase === 'intro' && this.timer >= 1.40) {
      this.phase = 'ready';
      this.timer = 0;
      world.arcadeMessages?.showReady();
      return;
    }
    if (this.phase === 'ready' && this.timer >= 1.55) {
      this.phase = 'wave01';
      this.timer = 0;
      this.spawnWave01(world);
    }
  }

  updateWaveFlow(dt, world) {
    const s = dt / 1000;
    this.timer += s;

    if (this.phase === 'wave01') {
      if (this.allDronesCleared(world)) {
        this.phase = 'wave02';
        this.timer = 0;
        this.clearProjectiles(world);
      }
      return;
    }

    if (this.phase === 'wave02' && this.waveIndex === 1 && this.timer >= 0.72) {
      this.spawnWave02(world);
      return;
    }

    if (this.phase === 'wave02' && this.waveIndex === 2 && this.allDronesCleared(world)) {
      this.phase = 'helicopterWarning';
      this.timer = 0;
      this.clearProjectiles(world);
      world.arcadeMessages?.showWarning('ENEMY CHOPPER');
      world.addShake(SKY.Config.combat.shakeLight + 5, 0.20);
    }
  }

  updateHelicopterFlow(dt, world) {
    const s = dt / 1000;
    this.timer += s;

    if (this.phase === 'helicopterWarning' && this.timer >= 1.05) {
      this.phase = 'helicopterFight';
      this.timer = 0;
      this.spawnHelicopter(world);
      return;
    }

    if (this.phase === 'helicopterFight') {
      const helicopterAliveOrDying = this.hasEnemyOrDeathSequence(world, SKY.HelicopterEnemy);
      if (this.heliSpawned && !helicopterAliveOrDying) {
        this.phase = 'bossWarning';
        this.timer = 0;
        this.backgroundMode = 'alert';
        this.clearProjectiles(world);
        world.arcadeMessages?.showBossIncoming();
        world.addShake(SKY.Config.combat.shakeHeavy, 0.28);
      }
    }
  }

  updateBossFlow(dt, world) {
    const s = dt / 1000;
    this.timer += s;

    if (this.phase === 'bossWarning' && this.timer >= 2.05) {
      this.phase = 'bossFight';
      this.timer = 0;
      this.spawnBoss(world);
      return;
    }

    if (this.phase === 'bossFight') {
      const bosses = world.enemies.filter(enemy => enemy instanceof SKY.BossBiomechEnemy);
      const bossAliveOrDying = bosses.some(enemy => !enemy.dead || !enemy.finalExplosionDone);
      if (bosses.length > 0 && !bossAliveOrDying && !this.clearLatch) {
        this.clearLatch = true;
        this.phase = 'stageClear';
        this.timer = 0;
        this.backgroundMode = 'normal';
        this.clearProjectiles(world);
        world.player.setScaleProfile('mission');
        world.addShake(SKY.Config.combat.shakeHeavy, 0.24);
        world.arcadeMessages?.showStageClear();
      }
      return;
    }

    if (this.phase === 'stageClear' && this.timer >= 3.20) {
      this.phase = 'complete';
      this.complete = true;
      this.timer = 0;
    }
  }

  update(dt, world) {
    if (this.phase === 'intro' || this.phase === 'ready') {
      this.updateIntro(dt, world);
      return;
    }

    if (this.phase === 'wave01' || this.phase === 'wave02') {
      this.updateWaveFlow(dt, world);
      return;
    }

    if (this.phase === 'helicopterWarning' || this.phase === 'helicopterFight') {
      this.updateHelicopterFlow(dt, world);
      return;
    }

    if (this.phase === 'bossWarning' || this.phase === 'bossFight' || this.phase === 'stageClear') {
      this.updateBossFlow(dt, world);
    }
  }
}

window.SKY.Stage01Director = Stage01Director;
