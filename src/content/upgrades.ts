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
      id: 'A', title: 'BIGGER RAGE', role: 'Splash Area',
      levels: [
        { cost: 105, summary: '+12 Splash, +5% Damage', bonus: { splashRadiusAdd: 12, damageMul: 1.05 } },
        { cost: 180, summary: '+14 Splash, +6% Damage', bonus: { splashRadiusAdd: 14, damageMul: 1.06 } },
        { cost: 295, summary: '+16 Splash, +7% Damage', bonus: { splashRadiusAdd: 16, damageMul: 1.07 } },
        { cost: 470, summary: '+18 Splash, +8% Damage, faster', bonus: { splashRadiusAdd: 18, damageMul: 1.08, fireRateMul: 0.96 } }
      ]
    },
    B: {
      id: 'B', title: 'BURNING GROUND', role: 'Burn zone',
      levels: [
        { cost: 110, summary: 'Burn radius 38, 1.5s', bonus: { burnGround: { radius: 38, duration: 1.5, dps: 7 } } },
        { cost: 190, summary: 'Burn radius 44, 1.9s', bonus: { burnGround: { radius: 44, duration: 1.9, dps: 10 } } },
        { cost: 310, summary: 'Burn radius 50, 2.2s', bonus: { burnGround: { radius: 50, duration: 2.2, dps: 13 } } },
        { cost: 500, summary: 'Burn radius 56, 2.6s', bonus: { burnGround: { radius: 56, duration: 2.6, dps: 16 } } }
      ]
    },
    C: {
      id: 'C', title: 'FOCUSED ANGER', role: 'Boss pressure, less area',
      levels: [
        { cost: 115, summary: '+10% Dmg, -5% Area, +18% Boss', bonus: { damageMul: 1.10, splashRadiusMul: 0.95, bossDamageMul: 1.18 } },
        { cost: 195, summary: '+11% Dmg, -6% Area, +18% Boss', bonus: { damageMul: 1.11, splashRadiusMul: 0.94, bossDamageMul: 1.18 } },
        { cost: 320, summary: '+12% Dmg, -7% Area, +20% Boss', bonus: { damageMul: 1.12, splashRadiusMul: 0.93, bossDamageMul: 1.20 } },
        { cost: 510, summary: '+14% Dmg, -8% Area, +22% Boss', bonus: { damageMul: 1.14, splashRadiusMul: 0.92, bossDamageMul: 1.22 } }
      ]
    }
  },
  [EmotionType.Sadness]: {
    A: {
      id: 'A', title: 'DEEPER BLUE', role: 'Stronger slow',
      levels: [
        { cost: 105, summary: 'Better slow duration', bonus: { slowAmountMul: 0.98, slowDurationAdd: 0.25 } },
        { cost: 180, summary: 'Better slow duration', bonus: { slowAmountMul: 0.98, slowDurationAdd: 0.30 } },
        { cost: 290, summary: 'Even stronger slow', bonus: { slowAmountMul: 0.98, slowDurationAdd: 0.35 } },
        { cost: 460, summary: 'Even stronger slow, +10 Range', bonus: { slowAmountMul: 0.98, slowDurationAdd: 0.45, rangeAdd: 10 } }
      ]
    },
    B: {
      id: 'B', title: 'LONG RAIN', role: 'Sniper range',
      levels: [
        { cost: 110, summary: '+24 Range', bonus: { rangeAdd: 24 } },
        { cost: 185, summary: '+28 Range, +4% Damage', bonus: { rangeAdd: 28, damageMul: 1.04 } },
        { cost: 300, summary: '+32 Range, +5% Damage', bonus: { rangeAdd: 32, damageMul: 1.05 } },
        { cost: 480, summary: '+36 Range, +8% Damage, faster', bonus: { rangeAdd: 36, damageMul: 1.08, fireRateMul: 0.97 } }
      ]
    },
    C: {
      id: 'C', title: 'BLUE FRACTURE', role: 'Split shots',
      levels: [
        { cost: 120, summary: '+1 Split shot', bonus: { splitShotsAdd: 1, splitDamageMul: 0.45 } },
        { cost: 205, summary: 'Faster projectile, better split', bonus: { projectileSpeedMul: 1.08, splitDamageMul: 0.50 } },
        { cost: 335, summary: '+1 Split shot', bonus: { splitShotsAdd: 1, splitDamageMul: 0.46 } },
        { cost: 540, summary: '+8% Damage, better split', bonus: { damageMul: 1.08, splitDamageMul: 0.55 } }
      ]
    }
  },
  [EmotionType.Joy]: {
    A: {
      id: 'A', title: 'BRIGHTER CHAIN', role: 'Chain count/range',
      levels: [
        { cost: 125, summary: '+1 Chain, +12 Range', bonus: { chainCountAdd: 1, chainRangeAdd: 12 } },
        { cost: 215, summary: '+20 Chain range', bonus: { chainRangeAdd: 20 } },
        { cost: 345, summary: '+1 Chain, +16 Range', bonus: { chainCountAdd: 1, chainRangeAdd: 16 } },
        { cost: 560, summary: '+30 Chain range, +8% Damage', bonus: { chainRangeAdd: 30, damageMul: 1.08 } }
      ]
    },
    B: {
      id: 'B', title: 'SPARK TEMPO', role: 'Faster chains',
      levels: [
        { cost: 120, summary: 'Faster fire rate & projectile', bonus: { fireRateMul: 0.92, projectileSpeedMul: 1.06 } },
        { cost: 210, summary: 'Faster fire rate', bonus: { fireRateMul: 0.91 } },
        { cost: 340, summary: 'Faster fire rate & projectile', bonus: { fireRateMul: 0.90, projectileSpeedMul: 1.08 } },
        { cost: 550, summary: 'Faster fire rate, +8% Damage', bonus: { fireRateMul: 0.90, damageMul: 1.08 } }
      ]
    },
    C: {
      id: 'C', title: 'RESONANT JOY', role: 'Mixed-build payoff',
      levels: [
        { cost: 130, summary: '+8% Resonance damage', bonus: { resonanceDamageMul: 1.08 } },
        { cost: 225, summary: '+8% Resonance, +8 Range', bonus: { resonanceDamageMul: 1.08, rangeAdd: 8 } },
        { cost: 360, summary: '+10% Resonance damage', bonus: { resonanceDamageMul: 1.10 } },
        { cost: 585, summary: '+10% Resonance, +18 Chain range', bonus: { resonanceDamageMul: 1.10, chainRangeAdd: 18 } }
      ]
    }
  },
  [EmotionType.Fear]: {
    A: {
      id: 'A', title: 'DEEP GLITCH', role: 'More stun',
      levels: [
        { cost: 105, summary: '+6% Chance, +0.08s Stun', bonus: { fearChanceAdd: 0.06, stunDurationAdd: 0.08 } },
        { cost: 180, summary: '+6% Chance, +0.10s Stun', bonus: { fearChanceAdd: 0.06, stunDurationAdd: 0.10 } },
        { cost: 295, summary: '+5% Chance, +0.12s Stun', bonus: { fearChanceAdd: 0.05, stunDurationAdd: 0.12 } },
        { cost: 470, summary: '+4% Chance, +0.15s Stun', bonus: { fearChanceAdd: 0.04, stunDurationAdd: 0.15 } }
      ]
    },
    B: {
      id: 'B', title: 'AREA FLICKER', role: 'AoE control',
      levels: [
        { cost: 115, summary: 'Small glitch zone, +3% Damage', bonus: { splashRadiusAdd: 20, damageMul: 1.03 } },
        { cost: 195, summary: '+18 Splash, +3% Chance', bonus: { splashRadiusAdd: 18, fearChanceAdd: 0.03 } },
        { cost: 315, summary: '+18 Splash, +5% Damage', bonus: { splashRadiusAdd: 18, damageMul: 1.05 } },
        { cost: 500, summary: '+22 Splash, +0.08s Stun', bonus: { splashRadiusAdd: 22, stunDurationAdd: 0.08 } }
      ]
    },
    C: {
      id: 'C', title: 'CHASE PANIC', role: 'Fast-enemy counter',
      levels: [
        { cost: 110, summary: '+22% vs fast enemies', bonus: { fastEnemyDamageMul: 1.22 } },
        { cost: 190, summary: '+18% vs fast, +8% Projectile', bonus: { fastEnemyDamageMul: 1.18, projectileSpeedMul: 1.08 } },
        { cost: 305, summary: '+16% vs fast, faster fire rate', bonus: { fastEnemyDamageMul: 1.16, fireRateMul: 0.95 } },
        { cost: 490, summary: '+16% vs fast, +8% Damage', bonus: { fastEnemyDamageMul: 1.16, damageMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Calm]: {
    A: {
      id: 'A', title: 'WIDER MIST', role: 'Larger buff radius',
      levels: [
        { cost: 130, summary: '+20 Buff Radius, +6 Range', bonus: { buffRadiusAdd: 20, rangeAdd: 6 } },
        { cost: 230, summary: '+24 Buff Radius', bonus: { buffRadiusAdd: 24 } },
        { cost: 380, summary: '+28 Buff Radius, +8 Range', bonus: { buffRadiusAdd: 28, rangeAdd: 8 } },
        { cost: 620, summary: '+32 Buff Radius', bonus: { buffRadiusAdd: 32 } }
      ]
    },
    B: {
      id: 'B', title: 'SOFTER TEMPO', role: 'Stronger aura tempo',
      levels: [
        { cost: 140, summary: 'Faster buff', bonus: { buffFireRateMul: 0.95 } },
        { cost: 250, summary: 'Faster buff, +8 Buff Radius', bonus: { buffFireRateMul: 0.95, buffRadiusAdd: 8 } },
        { cost: 410, summary: 'Even faster buff', bonus: { buffFireRateMul: 0.94 } },
        { cost: 660, summary: 'Even faster buff, +12 Buff Radius', bonus: { buffFireRateMul: 0.94, buffRadiusAdd: 12 } }
      ]
    },
    C: {
      id: 'C', title: 'RESTORE CORE', role: 'Defensive recovery',
      levels: [
        { cost: 145, summary: '+1 Stability per wave', bonus: { stabilityOnWaveCompleteAdd: 1 } },
        { cost: 260, summary: '+12 Range, +5% Damage', bonus: { rangeAdd: 12, damageMul: 1.05 } },
        { cost: 430, summary: '+18 Buff Radius', bonus: { buffRadiusAdd: 18 } },
        { cost: 700, summary: '+12% Shield cap, +8% Damage', bonus: { coreShieldMul: 1.12, damageMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Hope]: {
    A: {
      id: 'A', title: 'BRIGHTER SIGNAL', role: 'General damage/range',
      levels: [
        { cost: 135, summary: '+10% Damage, +10 Range', bonus: { damageMul: 1.10, rangeAdd: 10 } },
        { cost: 235, summary: '+10% Damage, +12 Range', bonus: { damageMul: 1.10, rangeAdd: 12 } },
        { cost: 385, summary: '+12% Damage, +14 Range', bonus: { damageMul: 1.12, rangeAdd: 14 } },
        { cost: 630, summary: '+14% Damage, +18 Range', bonus: { damageMul: 1.14, rangeAdd: 18 } }
      ]
    },
    B: {
      id: 'B', title: 'STARBREAK', role: 'Anti-Numb',
      levels: [
        { cost: 140, summary: '+22% vs Numb Ones', bonus: { numbDamageMul: 1.22, projectileSpeedMul: 1.05 } },
        { cost: 245, summary: '+20% vs Numb Ones, +5% Damage', bonus: { numbDamageMul: 1.20, damageMul: 1.05 } },
        { cost: 400, summary: '+18% vs Numb Ones, faster', bonus: { numbDamageMul: 1.18, fireRateMul: 0.96 } },
        { cost: 650, summary: '+18% vs Numb Ones, +10% Damage', bonus: { numbDamageMul: 1.18, damageMul: 1.10 } }
      ]
    },
    C: {
      id: 'C', title: 'GUIDING LIGHT', role: 'Defensive hope scaling',
      levels: [
        { cost: 145, summary: '+1 Stability per wave', bonus: { stabilityOnWaveCompleteAdd: 1 } },
        { cost: 255, summary: '+12 Range, faster', bonus: { rangeAdd: 12, fireRateMul: 0.96 } },
        { cost: 420, summary: '+8% Resonance damage', bonus: { resonanceDamageMul: 1.08 } },
        { cost: 680, summary: '+10% Damage, +10% Shield', bonus: { damageMul: 1.10, coreShieldMul: 1.10 } }
      ]
    }
  },
  [EmotionType.Disgust]: {
    A: {
      id: 'A', title: 'THICKER TOXIN', role: 'Poison DPS',
      levels: [
        { cost: 125, summary: '+15% Poison, +0.25s', bonus: { poisonDpsMul: 1.15, poisonDurationAdd: 0.25 } },
        { cost: 215, summary: '+14% Poison, +0.30s', bonus: { poisonDpsMul: 1.14, poisonDurationAdd: 0.30 } },
        { cost: 350, summary: '+13% Poison, +0.35s', bonus: { poisonDpsMul: 1.13, poisonDurationAdd: 0.35 } },
        { cost: 570, summary: '+12% Poison, +0.45s, +6% Dmg', bonus: { poisonDpsMul: 1.12, poisonDurationAdd: 0.45, damageMul: 1.06 } }
      ]
    },
    B: {
      id: 'B', title: 'CORROSIVE BITE', role: 'Armor shred',
      levels: [
        { cost: 130, summary: '+3.5% Shred, +0.25s', bonus: { armorShredAdd: 0.035, armorShredDurationAdd: 0.25 } },
        { cost: 225, summary: '+3.5% Shred, +0.30s', bonus: { armorShredAdd: 0.035, armorShredDurationAdd: 0.30 } },
        { cost: 365, summary: '+4% Shred, +10 Range', bonus: { armorShredAdd: 0.04, rangeAdd: 10 } },
        { cost: 590, summary: '+4% Shred, faster', bonus: { armorShredAdd: 0.04, fireRateMul: 0.96 } }
      ]
    },
    C: {
      id: 'C', title: 'CONTAGION', role: 'Area poison',
      levels: [
        { cost: 135, summary: '+18 Splash, -4% Tempo', bonus: { splashRadiusAdd: 18, fireRateMul: 1.04 } },
        { cost: 235, summary: '+18 Splash, +0.25s Poison', bonus: { splashRadiusAdd: 18, poisonDurationAdd: 0.25 } },
        { cost: 380, summary: '+20 Splash, +5% Damage', bonus: { splashRadiusAdd: 20, damageMul: 1.05 } },
        { cost: 610, summary: '+22 Splash, +10% Poison', bonus: { splashRadiusAdd: 22, poisonDpsMul: 1.10 } }
      ]
    }
  },
  [EmotionType.Guilt]: {
    A: {
      id: 'A', title: 'HEAVIER MARK', role: 'Scaling mark damage',
      levels: [
        { cost: 135, summary: '+2.5% Mark bonus', bonus: { guiltMarkAdd: 0.025 } },
        { cost: 235, summary: '+2.5% Mark, +4% Damage', bonus: { guiltMarkAdd: 0.025, damageMul: 1.04 } },
        { cost: 385, summary: '+3.0% Mark bonus', bonus: { guiltMarkAdd: 0.030 } },
        { cost: 630, summary: '+3.0% Mark, +8% Damage', bonus: { guiltMarkAdd: 0.030, damageMul: 1.08 } }
      ]
    },
    B: {
      id: 'B', title: 'CONFESSION', role: 'Execute',
      levels: [
        { cost: 140, summary: '+2.0% Execute threshold', bonus: { guiltExecuteThresholdAdd: 0.020 } },
        { cost: 245, summary: '+2.0% Execute, +8 Range', bonus: { guiltExecuteThresholdAdd: 0.020, rangeAdd: 8 } },
        { cost: 400, summary: '+2.5% Execute threshold', bonus: { guiltExecuteThresholdAdd: 0.025 } },
        { cost: 650, summary: '+2.5% Execute, +8% Damage', bonus: { guiltExecuteThresholdAdd: 0.025, damageMul: 1.08 } }
      ]
    },
    C: {
      id: 'C', title: 'RELENTLESS LOOP', role: 'Faster marks',
      levels: [
        { cost: 130, summary: '+6% Tempo', bonus: { fireRateMul: 0.94 } },
        { cost: 230, summary: '+7% Tempo, +5% Projectile', bonus: { fireRateMul: 0.93, projectileSpeedMul: 1.05 } },
        { cost: 375, summary: '+8% Tempo', bonus: { fireRateMul: 0.92 } },
        { cost: 610, summary: '+8% Tempo, +2.0% Mark', bonus: { fireRateMul: 0.92, guiltMarkAdd: 0.020 } }
      ]
    }
  },
  [EmotionType.Trust]: {
    A: {
      id: 'A', title: 'WIDER GUARD', role: 'More range/shield',
      levels: [
        { cost: 110, summary: '+14 Range, +0.08 Shield', bonus: { rangeAdd: 14, coreShieldAdd: 0.08 } },
        { cost: 190, summary: '+16 Range, +0.08 Shield', bonus: { rangeAdd: 16, coreShieldAdd: 0.08 } },
        { cost: 305, summary: '+18 Range, +0.08 Shield', bonus: { rangeAdd: 18, coreShieldAdd: 0.08 } },
        { cost: 490, summary: '+20 Range, +0.10 Shield', bonus: { rangeAdd: 20, coreShieldAdd: 0.10 } }
      ]
    },
    B: {
      id: 'B', title: 'ANCHOR FIELD', role: 'Counter Panic/Void',
      levels: [
        { cost: 115, summary: '+0.22s Anchor', bonus: { trustAnchorDurationAdd: 0.22 } },
        { cost: 195, summary: '+0.25s Anchor, faster', bonus: { trustAnchorDurationAdd: 0.25, fireRateMul: 0.97 } },
        { cost: 315, summary: '+0.28s Anchor', bonus: { trustAnchorDurationAdd: 0.28 } },
        { cost: 500, summary: '+0.30s Anchor, +14 Range', bonus: { trustAnchorDurationAdd: 0.30, rangeAdd: 14 } }
      ]
    },
    C: {
      id: 'C', title: 'CORE VOW', role: 'Defensive specialization',
      levels: [
        { cost: 120, summary: '+14% Shield cap, -4% Damage', bonus: { coreShieldMul: 1.14, damageMul: 0.96 } },
        { cost: 205, summary: '+14% Shield cap', bonus: { coreShieldMul: 1.14 } },
        { cost: 330, summary: '+15% Shield, +1 Stability', bonus: { coreShieldMul: 1.15, stabilityOnWaveCompleteAdd: 1 } },
        { cost: 530, summary: '+16% Shield, +12 Range', bonus: { coreShieldMul: 1.16, rangeAdd: 12 } }
      ]
    }
  },
  [EmotionType.Shame]: {
    A: {
      id: 'A', title: 'WIDER STARE', role: 'Larger group vulnerability',
      levels: [
        { cost: 125, summary: '+14 Group radius, +4% Dmg', bonus: { shameGroupRadiusAdd: 14, damageMul: 1.04 } },
        { cost: 215, summary: '+16 Group radius', bonus: { shameGroupRadiusAdd: 16 } },
        { cost: 350, summary: '+18 Group radius, +5% Dmg', bonus: { shameGroupRadiusAdd: 18, damageMul: 1.05 } },
        { cost: 570, summary: '+20 Group radius, faster', bonus: { shameGroupRadiusAdd: 20, fireRateMul: 0.96 } }
      ]
    },
    B: {
      id: 'B', title: 'EXPOSED CROWD', role: 'Stronger grouped damage',
      levels: [
        { cost: 130, summary: '+10% Group damage', bonus: { shameGroupDamageMul: 1.10 } },
        { cost: 225, summary: '+9% Group damage', bonus: { shameGroupDamageMul: 1.09 } },
        { cost: 365, summary: '+8% Group damage, +5% Dmg', bonus: { shameGroupDamageMul: 1.08, damageMul: 1.05 } },
        { cost: 595, summary: '+8% Group damage, +12 Range', bonus: { shameGroupDamageMul: 1.08, rangeAdd: 12 } }
      ]
    },
    C: {
      id: 'C', title: 'PUBLIC FRACTURE', role: 'Splash pressure',
      levels: [
        { cost: 135, summary: '+16 Splash, +4% Damage', bonus: { splashRadiusAdd: 16, damageMul: 1.04 } },
        { cost: 235, summary: '+18 Splash', bonus: { splashRadiusAdd: 18 } },
        { cost: 380, summary: '+20 Splash, faster', bonus: { splashRadiusAdd: 20, fireRateMul: 0.96 } },
        { cost: 610, summary: '+22 Splash, +8% Damage', bonus: { splashRadiusAdd: 22, damageMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Love]: {
    A: {
      id: 'A', title: 'LONGER THREAD', role: 'Link radius',
      levels: [
        { cost: 150, summary: '+20 Link radius, +8 Range', bonus: { loveLinkRadiusAdd: 20, rangeAdd: 8 } },
        { cost: 265, summary: '+24 Link radius', bonus: { loveLinkRadiusAdd: 24 } },
        { cost: 430, summary: '+28 Link radius, +10 Range', bonus: { loveLinkRadiusAdd: 28, rangeAdd: 10 } },
        { cost: 700, summary: '+32 Link radius', bonus: { loveLinkRadiusAdd: 32 } }
      ]
    },
    B: {
      id: 'B', title: 'WARMER TEMPO', role: 'Stronger link fire rate',
      levels: [
        { cost: 155, summary: 'Better link tempo', bonus: { loveFireRateMul: 0.96 } },
        { cost: 275, summary: 'Better link tempo, +8 Link R', bonus: { loveFireRateMul: 0.96, loveLinkRadiusAdd: 8 } },
        { cost: 450, summary: 'Even better tempo', bonus: { loveFireRateMul: 0.95 } },
        { cost: 730, summary: 'Even better tempo, +12 Link R', bonus: { loveFireRateMul: 0.95, loveLinkRadiusAdd: 12 } }
      ]
    },
    C: {
      id: 'C', title: 'DEVOTED PAIR', role: 'Stronger link damage',
      levels: [
        { cost: 160, summary: '+6% Link damage', bonus: { loveDamageMul: 1.06 } },
        { cost: 285, summary: '+6% Link damage', bonus: { loveDamageMul: 1.06 } },
        { cost: 465, summary: '+6% Link damage, faster', bonus: { loveDamageMul: 1.06, fireRateMul: 0.97 } },
        { cost: 760, summary: '+7% Link damage', bonus: { loveDamageMul: 1.07 } }
      ]
    }
  },
  [EmotionType.Pride]: {
    A: {
      id: 'A', title: 'SHARPER AIM', role: 'Boss damage',
      levels: [
        { cost: 160, summary: '+12% Damage, +16% Boss', bonus: { damageMul: 1.12, bossDamageMul: 1.16 } },
        { cost: 285, summary: '+12% Damage, +16% Boss', bonus: { damageMul: 1.12, bossDamageMul: 1.16 } },
        { cost: 465, summary: '+13% Damage, +18% Boss', bonus: { damageMul: 1.13, bossDamageMul: 1.18 } },
        { cost: 760, summary: '+14% Damage, +20% Boss', bonus: { damageMul: 1.14, bossDamageMul: 1.20 } }
      ]
    },
    B: {
      id: 'B', title: 'STAND ALONE', role: 'Isolated damage',
      levels: [
        { cost: 155, summary: '+12% Isolated damage', bonus: { prideIsolationDamageMul: 1.12 } },
        { cost: 275, summary: '+12% Isolated, tighter', bonus: { prideIsolationDamageMul: 1.12, prideIsolationRadiusMul: 0.94 } },
        { cost: 445, summary: '+13% Isolated damage', bonus: { prideIsolationDamageMul: 1.13 } },
        { cost: 720, summary: '+14% Isolated, tighter', bonus: { prideIsolationDamageMul: 1.14, prideIsolationRadiusMul: 0.90 } }
      ]
    },
    C: {
      id: 'C', title: 'CLEAN SHOT', role: 'Range/projectile/tempo',
      levels: [
        { cost: 150, summary: '+16 Range, +8% Projectile', bonus: { rangeAdd: 16, projectileSpeedMul: 1.08 } },
        { cost: 265, summary: '+18 Range', bonus: { rangeAdd: 18 } },
        { cost: 430, summary: '+20 Range, faster', bonus: { rangeAdd: 20, fireRateMul: 0.96 } },
        { cost: 700, summary: '+22 Range, +10% Damage', bonus: { rangeAdd: 22, damageMul: 1.10 } }
      ]
    }
  }
};
