import { EmotionType, type UpgradePath } from '../game/types';

/* ------------------------------------------------------------------ *
 *  Tower upgrades
 * ------------------------------------------------------------------ */
export const UPGRADE_PATHS: UpgradePath[] = ['A', 'B', 'C'];

export interface BurnGroundSpec {
  radius: number;
  duration: number;
  dps: number;
}

export interface TowerSpecialStats {
  bossDamageMul: number;
  numbDamageMul: number;
  burnGround?: BurnGroundSpec;
  splitShots: number;
  splitDamageMul: number;
  fastEnemyDamageMul: number;
  resonanceDamageMul: number;
  stabilityOnWaveComplete: number;
  coreShieldMul: number;
}

export interface TowerUpgradeBonus {
  damageMul?: number;
  rangeAdd?: number;
  rangeMul?: number;
  fireRateMul?: number;
  projectileSpeedMul?: number;
  splashRadiusAdd?: number;
  splashRadiusMul?: number;
  chainCountAdd?: number;
  chainRangeAdd?: number;
  slowAmountMul?: number;
  slowDurationAdd?: number;
  fearChanceAdd?: number;
  stunDurationAdd?: number;
  buffRadiusAdd?: number;
  buffFireRateMul?: number;
  bossDamageMul?: number;
  numbDamageMul?: number;
  burnGround?: BurnGroundSpec;
  splitShotsAdd?: number;
  splitDamageMul?: number;
  fastEnemyDamageMul?: number;
  resonanceDamageMul?: number;
  stabilityOnWaveCompleteAdd?: number;
  poisonDpsMul?: number;
  poisonDurationAdd?: number;
  armorShredAdd?: number;
  armorShredDurationAdd?: number;
  guiltMarkAdd?: number;
  guiltExecuteThresholdAdd?: number;
  coreShieldAdd?: number;
  coreShieldMul?: number;
  trustAnchorDurationAdd?: number;
  shameGroupRadiusAdd?: number;
  shameGroupDamageMul?: number;
  loveLinkRadiusAdd?: number;
  loveFireRateMul?: number;
  loveDamageMul?: number;
  prideIsolationRadiusMul?: number;
  prideIsolationDamageMul?: number;
}

export interface TowerUpgradeLevel {
  cost: number;
  summary: string;
  bonus: TowerUpgradeBonus;
}

export interface TowerUpgradePathDef {
  id: UpgradePath;
  title: string;
  role: string;
  levels: TowerUpgradeLevel[];
}

export const BASE_TOWER_SPECIALS: TowerSpecialStats = {
  bossDamageMul: 1,
  numbDamageMul: 1,
  splitShots: 0,
  splitDamageMul: 0.55,
  fastEnemyDamageMul: 1,
  resonanceDamageMul: 1,
  stabilityOnWaveComplete: 0,
  coreShieldMul: 1
};

export const TOWER_UPGRADES: Record<EmotionType, Record<UpgradePath, TowerUpgradePathDef>> = {
  [EmotionType.Anger]: {
    A: {
      id: 'A',
      title: 'BIGGER RAGE',
      role: 'More splash radius',
      levels: [
        { cost: 60, summary: '+16 Splash, +8% Damage', bonus: { splashRadiusAdd: 16, damageMul: 1.08 } },
        { cost: 95, summary: '+24 Splash, +10% Damage', bonus: { splashRadiusAdd: 24, damageMul: 1.10 } }
      ]
    },
    B: {
      id: 'B',
      title: 'BURNING GROUND',
      role: 'Burn zone on hit',
      levels: [
        { cost: 65, summary: 'Ground burns 1.8s', bonus: { burnGround: { radius: 44, duration: 1.8, dps: 10 } } },
        { cost: 105, summary: 'Larger burn zone', bonus: { burnGround: { radius: 56, duration: 2.4, dps: 16 } } }
      ]
    },
    C: {
      id: 'C',
      title: 'FOCUSED ANGER',
      role: 'Less area, more boss pressure',
      levels: [
        { cost: 70, summary: '+16% Damage, +35% Boss', bonus: { damageMul: 1.16, splashRadiusMul: 0.9, bossDamageMul: 1.35 } },
        { cost: 110, summary: '+18% Damage, +25% Boss', bonus: { damageMul: 1.18, splashRadiusMul: 0.88, bossDamageMul: 1.25 } }
      ]
    }
  },
  [EmotionType.Sadness]: {
    A: {
      id: 'A',
      title: 'DEEPER BLUE',
      role: 'Stronger slow',
      levels: [
        { cost: 52, summary: 'Better slow duration', bonus: { slowAmountMul: 0.86, slowDurationAdd: 0.45 } },
        { cost: 88, summary: 'Even stronger slow', bonus: { slowAmountMul: 0.84, slowDurationAdd: 0.6 } }
      ]
    },
    B: {
      id: 'B',
      title: 'LONG RAIN',
      role: 'Sniper range',
      levels: [
        { cost: 58, summary: '+34 Range', bonus: { rangeAdd: 34, fireRateMul: 1.04 } },
        { cost: 98, summary: '+46 Range, +10% Damage', bonus: { rangeAdd: 46, damageMul: 1.10 } }
      ]
    },
    C: {
      id: 'C',
      title: 'BLUE FRACTURE',
      role: 'Split shots for groups',
      levels: [
        { cost: 68, summary: '+1 Split shot', bonus: { splitShotsAdd: 1, splitDamageMul: 0.52 } },
        { cost: 108, summary: '+1 Split, faster', bonus: { splitShotsAdd: 1, projectileSpeedMul: 1.12, splitDamageMul: 0.58 } }
      ]
    }
  },
  [EmotionType.Joy]: {
    A: {
      id: 'A',
      title: 'BRIGHTER CHAIN',
      role: 'More chain targets',
      levels: [
        { cost: 72, summary: '+1 Chain, +20 Range', bonus: { chainCountAdd: 1, chainRangeAdd: 20 } },
        { cost: 112, summary: '+1 Chain, +30 Range', bonus: { chainCountAdd: 1, chainRangeAdd: 30 } }
      ]
    },
    B: {
      id: 'B',
      title: 'SPARK TEMPO',
      role: 'Faster chains',
      levels: [
        { cost: 68, summary: '+14% Tempo, +8% Projectile', bonus: { fireRateMul: 0.86, projectileSpeedMul: 1.08 } },
        { cost: 108, summary: '+12% Tempo, +12% Projectile', bonus: { fireRateMul: 0.88, projectileSpeedMul: 1.12 } }
      ]
    },
    C: {
      id: 'C',
      title: 'RESONANT JOY',
      role: 'Bonus for mixed builds',
      levels: [
        { cost: 74, summary: '+18% Damage in Resonance', bonus: { resonanceDamageMul: 1.18 } },
        { cost: 112, summary: '+18% Resonance, +10 Range', bonus: { resonanceDamageMul: 1.18, rangeAdd: 10 } }
      ]
    }
  },
  [EmotionType.Fear]: {
    A: {
      id: 'A',
      title: 'DEEP GLITCH',
      role: 'More stun',
      levels: [
        { cost: 60, summary: '+12% Chance, +0.15s', bonus: { fearChanceAdd: 0.12, stunDurationAdd: 0.15 } },
        { cost: 96, summary: '+10% Chance, +0.20s', bonus: { fearChanceAdd: 0.10, stunDurationAdd: 0.20 } }
      ]
    },
    B: {
      id: 'B',
      title: 'AREA FLICKER',
      role: 'AoE glitch',
      levels: [
        { cost: 70, summary: 'Small glitch zone', bonus: { splashRadiusAdd: 28, damageMul: 1.05 } },
        { cost: 108, summary: 'Larger glitch zone', bonus: { splashRadiusAdd: 18, fearChanceAdd: 0.08 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CHASE PANIC',
      role: 'Bonus vs fast enemies',
      levels: [
        { cost: 66, summary: '+40% vs fast enemies', bonus: { fastEnemyDamageMul: 1.40 } },
        { cost: 104, summary: '+25% vs fast enemies', bonus: { fastEnemyDamageMul: 1.25, projectileSpeedMul: 1.12 } }
      ]
    }
  },
  [EmotionType.Calm]: {
    A: {
      id: 'A',
      title: 'WIDER MIST',
      role: 'More buff radius',
      levels: [
        { cost: 56, summary: '+28 Buff Radius', bonus: { buffRadiusAdd: 28, rangeAdd: 10 } },
        { cost: 94, summary: '+36 Buff Radius', bonus: { buffRadiusAdd: 36, rangeAdd: 10 } }
      ]
    },
    B: {
      id: 'B',
      title: 'SOFTER TEMPO',
      role: 'Stronger tempo buff',
      levels: [
        { cost: 62, summary: 'Faster buff', bonus: { buffFireRateMul: 0.93 } },
        { cost: 104, summary: 'Even faster buff', bonus: { buffFireRateMul: 0.92, buffRadiusAdd: 10 } }
      ]
    },
    C: {
      id: 'C',
      title: 'RESTORE CORE',
      role: 'Stability after waves',
      levels: [
        { cost: 66, summary: '+1 Stability per wave', bonus: { stabilityOnWaveCompleteAdd: 1 } },
        { cost: 108, summary: '+1 Stability, +8% Damage', bonus: { stabilityOnWaveCompleteAdd: 1, damageMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Hope]: {
    A: {
      id: 'A',
      title: 'BRIGHTER SIGNAL',
      role: 'More damage and range',
      levels: [
        { cost: 74, summary: '+16% Damage, +18 Range', bonus: { damageMul: 1.16, rangeAdd: 18 } },
        { cost: 118, summary: '+18% Damage, +24 Range', bonus: { damageMul: 1.18, rangeAdd: 24 } }
      ]
    },
    B: {
      id: 'B',
      title: 'STARBREAK',
      role: 'Stronger vs Numb Ones',
      levels: [
        { cost: 76, summary: '+45% vs Numb Ones', bonus: { numbDamageMul: 1.45, projectileSpeedMul: 1.08 } },
        { cost: 122, summary: '+40% vs Numb Ones', bonus: { numbDamageMul: 1.40, damageMul: 1.08 } }
      ]
    },
    C: {
      id: 'C',
      title: 'GUIDING LIGHT',
      role: 'Stability through Hope',
      levels: [
        { cost: 78, summary: '+1 Stability per wave', bonus: { stabilityOnWaveCompleteAdd: 1, rangeAdd: 10 } },
        { cost: 124, summary: '+1 Stability, faster', bonus: { stabilityOnWaveCompleteAdd: 1, fireRateMul: 0.9 } }
      ]
    }
  },
  [EmotionType.Disgust]: {
    A: {
      id: 'A',
      title: 'THICKER TOXIN',
      role: 'Stronger damage over time',
      levels: [
        { cost: 72, summary: '+22% Poison, +0.4s', bonus: { poisonDpsMul: 1.22, poisonDurationAdd: 0.4 } },
        { cost: 112, summary: '+20% Poison, +0.5s', bonus: { poisonDpsMul: 1.20, poisonDurationAdd: 0.5 } }
      ]
    },
    B: {
      id: 'B',
      title: 'CORROSIVE BITE',
      role: 'More armor shred',
      levels: [
        { cost: 74, summary: '+5% Shred, +0.4s', bonus: { armorShredAdd: 0.05, armorShredDurationAdd: 0.4 } },
        { cost: 116, summary: '+5% Shred, +12 Range', bonus: { armorShredAdd: 0.05, rangeAdd: 12 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CONTAGION',
      role: 'Controlled area pressure',
      levels: [
        { cost: 80, summary: '+24 Splash, less tempo', bonus: { splashRadiusAdd: 24, fireRateMul: 1.06 } },
        { cost: 122, summary: '+18 Splash, +10% Damage', bonus: { splashRadiusAdd: 18, damageMul: 1.10 } }
      ]
    }
  },
  [EmotionType.Guilt]: {
    A: {
      id: 'A',
      title: 'HEAVIER MARK',
      role: 'Repeated hits scale better',
      levels: [
        { cost: 76, summary: '+4% Mark bonus', bonus: { guiltMarkAdd: 0.04 } },
        { cost: 118, summary: '+4% Mark, +8% Damage', bonus: { guiltMarkAdd: 0.04, damageMul: 1.08 } }
      ]
    },
    B: {
      id: 'B',
      title: 'CONFESSION',
      role: 'Earlier execute',
      levels: [
        { cost: 78, summary: '+3% Execute threshold', bonus: { guiltExecuteThresholdAdd: 0.03 } },
        { cost: 120, summary: '+3% Execute, +14 Range', bonus: { guiltExecuteThresholdAdd: 0.03, rangeAdd: 14 } }
      ]
    },
    C: {
      id: 'C',
      title: 'RELENTLESS LOOP',
      role: 'More tempo for marks',
      levels: [
        { cost: 74, summary: '+12% Tempo', bonus: { fireRateMul: 0.88 } },
        { cost: 116, summary: '+10% Tempo, +8% Projectile', bonus: { fireRateMul: 0.90, projectileSpeedMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Trust]: {
    A: {
      id: 'A',
      title: 'WIDER GUARD',
      role: 'More range and barrier',
      levels: [
        { cost: 58, summary: '+18 Range, +0.15 Shield', bonus: { rangeAdd: 18, coreShieldAdd: 0.15 } },
        { cost: 98, summary: '+22 Range, +0.15 Shield', bonus: { rangeAdd: 22, coreShieldAdd: 0.15 } }
      ]
    },
    B: {
      id: 'B',
      title: 'ANCHOR FIELD',
      role: 'Better vs Panic and Void',
      levels: [
        { cost: 62, summary: '+0.35s Anchor', bonus: { trustAnchorDurationAdd: 0.35 } },
        { cost: 104, summary: '+0.35s Anchor, faster', bonus: { trustAnchorDurationAdd: 0.35, fireRateMul: 0.92 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CORE VOW',
      role: 'Defensive specialization',
      levels: [
        { cost: 66, summary: '+35% Shield, -10% Damage', bonus: { coreShieldMul: 1.35, damageMul: 0.90 } },
        { cost: 108, summary: '+30% Shield, +1 Stability', bonus: { coreShieldMul: 1.30, stabilityOnWaveCompleteAdd: 1 } }
      ]
    }
  },
  [EmotionType.Shame]: {
    A: {
      id: 'A',
      title: 'WIDER STARE',
      role: 'Larger group vulnerability radius',
      levels: [
        { cost: 70, summary: '+18 Group radius', bonus: { shameGroupRadiusAdd: 18, damageMul: 1.06 } },
        { cost: 112, summary: '+22 Group radius', bonus: { shameGroupRadiusAdd: 22, damageMul: 1.08 } }
      ]
    },
    B: {
      id: 'B',
      title: 'EXPOSED CROWD',
      role: 'Harder group damage debuff',
      levels: [
        { cost: 74, summary: '+18% Group damage', bonus: { shameGroupDamageMul: 1.18 } },
        { cost: 118, summary: '+16% Group damage', bonus: { shameGroupDamageMul: 1.16, fireRateMul: 0.94 } }
      ]
    },
    C: {
      id: 'C',
      title: 'PUBLIC FRACTURE',
      role: 'Small splash pressure',
      levels: [
        { cost: 78, summary: '+22 Splash, +8% Damage', bonus: { splashRadiusAdd: 22, damageMul: 1.08 } },
        { cost: 122, summary: '+20 Splash, faster', bonus: { splashRadiusAdd: 20, fireRateMul: 0.90 } }
      ]
    }
  },
  [EmotionType.Love]: {
    A: {
      id: 'A',
      title: 'LONGER THREAD',
      role: 'Links farther',
      levels: [
        { cost: 74, summary: '+28 Link radius', bonus: { loveLinkRadiusAdd: 28, rangeAdd: 12 } },
        { cost: 116, summary: '+34 Link radius', bonus: { loveLinkRadiusAdd: 34, rangeAdd: 14 } }
      ]
    },
    B: {
      id: 'B',
      title: 'WARMER TEMPO',
      role: 'Stronger link fire-rate buff',
      levels: [
        { cost: 78, summary: 'Better link tempo', bonus: { loveFireRateMul: 0.92 } },
        { cost: 122, summary: 'Even better tempo', bonus: { loveFireRateMul: 0.92, loveLinkRadiusAdd: 10 } }
      ]
    },
    C: {
      id: 'C',
      title: 'DEVOTED PAIR',
      role: 'Stronger link damage buff',
      levels: [
        { cost: 82, summary: '+12% Link damage', bonus: { loveDamageMul: 1.12 } },
        { cost: 126, summary: '+10% Link damage, faster', bonus: { loveDamageMul: 1.10, fireRateMul: 0.92 } }
      ]
    }
  },
  [EmotionType.Pride]: {
    A: {
      id: 'A',
      title: 'SHARPER AIM',
      role: 'More boss and single-target damage',
      levels: [
        { cost: 86, summary: '+18% Damage, +25% Boss', bonus: { damageMul: 1.18, bossDamageMul: 1.25 } },
        { cost: 132, summary: '+18% Damage, +25% Boss', bonus: { damageMul: 1.18, bossDamageMul: 1.25 } }
      ]
    },
    B: {
      id: 'B',
      title: 'STAND ALONE',
      role: 'Better isolated damage',
      levels: [
        { cost: 84, summary: '+18% Isolated damage', bonus: { prideIsolationDamageMul: 1.18 } },
        { cost: 128, summary: '+18% Isolated, tighter', bonus: { prideIsolationDamageMul: 1.18, prideIsolationRadiusMul: 0.88 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CLEAN SHOT',
      role: 'Range and projectile speed',
      levels: [
        { cost: 80, summary: '+22 Range, +12% Projectile', bonus: { rangeAdd: 22, projectileSpeedMul: 1.12 } },
        { cost: 124, summary: '+24 Range, faster', bonus: { rangeAdd: 24, fireRateMul: 0.9 } }
      ]
    }
  }
};
