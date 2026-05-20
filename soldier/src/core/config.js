window.SKY = window.SKY || {};

window.SKY.Config = {
  version: 'v14_stage01_cohesion_art_pass',

  canvas: {
    width: 1280,
    height: 720,
    groundY: 610,
  },

  atlas: {
    playerSrc: 'assets/soldier_atlas.png',
    cellW: 420,
    cellH: 360,
    frames: {
      walk:    [0,1,2,3,4,5,6].map(col => ({ row:0, col })),
      idle:    [0,1,2].map(col => ({ row:1, col })),
      jump:    [{ row:2, col:0 }],
      crouch:  [{ row:2, col:1 }],
      shoot:   [{ row:2, col:2 }],
      grenade: [{ row:2, col:3 }],
    }
  },


  ravenDroneAtlas: {
    src: 'assets/raven_drone_atlas.png',
    cellW: 280,
    cellH: 220,
    anchor: { x: 140, y: 112 },
    frames: {
      hover:   [0,1,2,3,4,5].map(col => ({ row:0, col })),
      boost:   [0,1,2,3,4,5].map(col => ({ row:1, col })),
      gun:     [0,1,2,3,4,5].map(col => ({ row:2, col })),
      missile: [0,1,2,3,4,5].map(col => ({ row:3, col })),
      damaged: [0,1,2].map(col => ({ row:4, col })),
      death:   [0,1,2,3,4,5].map(col => ({ row:5, col })),
    }
  },

  celebrationAtlas: {
    src: 'assets/celebration01.png',
    cellW: 362,
    cellH: 543,
    frames: {
      cheer: [{ row: 0, col: 0 }],
      wave:  [{ row: 0, col: 1 }],
      clap:  [{ row: 0, col: 2 }],
      point: [{ row: 0, col: 3 }],
      thumb: [{ row: 1, col: 1 }],
      present: [{ row: 1, col: 2 }],
    }
  },

  helicopterAtlas: {
    src: 'assets/helicopter_atlas.png',
    cellW: 280,
    cellH: 220,
    frames: {
      hover:   [0,1,2,3,4,5].map(col => ({ row:0, col })),
      patrol:  [0,1,2,3,4,5].map(col => ({ row:1, col })),
      gun:     [0,1,2,3,4,5].map(col => ({ row:2, col })),
      missile: [0,1,2,3,4,5].map(col => ({ row:3, col })),
      damaged: [0,1,2].map(col => ({ row:4, col })),
      death:   [0,1,2,3,4,5,6,7].map(col => ({ row:5, col })),
    }
  },


  bossAtlas: {
    src: 'assets/boss_biomech_atlas.png',
    cellW: 220,
    cellH: 180,

    // v11 production rule:
    // Boss frames are not positioned from the generic cell bottom anymore.
    // They use explicit anchor points in atlas pixels. This is especially
    // important for death frames, because smoke/debris changes the visual mass
    // and a simple x/y draw offset makes the destruction drift.
    anchor: { x: 110, y: 172 },
    deathAnchors: [
      { x: 110, y: 172 },
      { x: 110, y: 172 },
      { x: 110, y: 172 },
      { x: 110, y: 172 },
      { x: 112, y: 172 },
      { x: 112, y: 172 },
      { x: 110, y: 172 },
      { x: 112, y: 172 },
    ],

    frames: {
      idle:          [0,1,2,3,4,5].map(col => ({ row:0, col })),
      walk:          [0,1,2,3,4,5,6,7].map(col => ({ row:1, col })),
      cannonCharge: [0,1,2,3,4,5].map(col => ({ row:2, col })),
      cannonFire:   [0,1,2,3,4,5].map(col => ({ row:3, col })),
      melee:         [0,1,2,3,4,5].map(col => ({ row:4, col })),
      missile:       [0,1,2,3,4,5,6,7].map(col => ({ row:5, col })),
      hurt:          [0,1,2,3].map(col => ({ row:6, col })),
      rage:          [0,1,2,3,4,5,6,7].map(col => ({ row:7, col })),
      death:         [0,1,2,3,4,5,6,7].map(col => ({ row:8, col })),
    }
  },

  bossDeathAtlas: {
    src: 'assets/boss_biomech_death_atlas.png',
    cellW: 300,
    cellH: 210,
    anchor: { x: 150, y: 190 },
    frames: {
      death: [0,1,2,3,4,5,6,7,8].map(col => ({ row:0, col })),
    }
  },

  scaleProfiles: {
    mission: 0.26,
    boss: 0.38,
  },

  player: {
    startX: 280,
    maxHp: 6,
    minScale: 0.16,
    maxScale: 1.40,
    scaleStep: 0.02,
    baseSpeed: 255,
    runMultiplier: 1.55,
    jumpPower: 650,
    gravity: 1780,
    bulletSpeed: 1460,
    jumpButtonDelay: 0.00,
    aimAssist: {
      enabled: true,
      maxDistance: 920,
      horizontalDot: 0.975,
      diagonalDot: 0.77,
      upDot: 0.70,
      blend: 0.72,
      verticalBlend: 0.52,
    },
    invulnTime: 0.90,
    muzzle: {
      horizontal: { x: 172, y: -206 },
      diagonalUp: { x: 154, y: -238 },
      up: { x: 52, y: -282 },
      crouch: { x: 120, y: -118 },
    },
  },

  enemy: {
    targetX: 955,
    targetScale: 1.0,
    hp: 8,

    drone: { // legacy procedural drone, kept for debug/backward compatibility only.
      hp: 5,
      scale: 1.0,
      speed: 34,
      shotCooldown: 1.35,
      boltSpeed: 520,
      respawnTime: 2.8,
    },

    ravenDrone: {
      hp: 5,
      scale: 0.72,
      enterSpeed: 145,
      hoverAmplitude: 13,
      patrolSpeed: 44,
      shotCooldown: 1.25,
      missileCooldown: 2.75,
      boltSpeed: 540,
      missileSpeed: 430,
      deathTime: 0.92,
    },

    helicopter: {
      hp: 18,
      scale: 0.78,
      hoverAmplitude: 18,
      enterSpeed: 105,
      patrolSpeed: 38,
      shotCooldown: 1.05,
      missileCooldown: 2.75,
      boltSpeed: 500,
      respawnTime: 4.5,
    },

    bossBiomech: {
      hp: 90,
      scale: 1.45,
      targetX: 1035,
      enterSpeed: 92,
      cannonSpeed: 560,
      missileSpeed: 470,
      deathTime: 2.85,
    }
  },

  combat: {
    hitStopLight: 0.035,
    hitStopHeavy: 0.075,
    shakeLight: 5,
    shakeHeavy: 13,
  }
};
