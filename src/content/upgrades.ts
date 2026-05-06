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
      role: 'Mehr Splash-Radius',
      levels: [
        { cost: 55, summary: '+16 Splash, +8% Schaden', bonus: { splashRadiusAdd: 16, damageMul: 1.08 } },
        { cost: 85, summary: '+24 Splash, +10% Schaden', bonus: { splashRadiusAdd: 24, damageMul: 1.10 } }
      ]
    },
    B: {
      id: 'B',
      title: 'BURNING GROUND',
      role: 'Feuerzone nach Treffern',
      levels: [
        { cost: 60, summary: 'Boden brennt 1.8s', bonus: { burnGround: { radius: 44, duration: 1.8, dps: 10 } } },
        { cost: 90, summary: 'Größere Feuerzone', bonus: { burnGround: { radius: 56, duration: 2.4, dps: 16 } } }
      ]
    },
    C: {
      id: 'C',
      title: 'FOCUSED ANGER',
      role: 'Weniger Flaeche, mehr Boss-Druck',
      levels: [
        { cost: 65, summary: '+16% Schaden, +35% Boss', bonus: { damageMul: 1.16, splashRadiusMul: 0.9, bossDamageMul: 1.35 } },
        { cost: 95, summary: '+18% Schaden, +25% Boss', bonus: { damageMul: 1.18, splashRadiusMul: 0.88, bossDamageMul: 1.25 } }
      ]
    }
  },
  [EmotionType.Sadness]: {
    A: {
      id: 'A',
      title: 'DEEPER BLUE',
      role: 'Staerkerer Slow',
      levels: [
        { cost: 55, summary: 'Slow + Dauer besser', bonus: { slowAmountMul: 0.86, slowDurationAdd: 0.45 } },
        { cost: 80, summary: 'Slow nochmals besser', bonus: { slowAmountMul: 0.84, slowDurationAdd: 0.6 } }
      ]
    },
    B: {
      id: 'B',
      title: 'LONG RAIN',
      role: 'Sniper-Reichweite',
      levels: [
        { cost: 60, summary: '+34 Reichweite', bonus: { rangeAdd: 34, fireRateMul: 1.04 } },
        { cost: 90, summary: '+46 Reichweite, +10% Schaden', bonus: { rangeAdd: 46, damageMul: 1.10 } }
      ]
    },
    C: {
      id: 'C',
      title: 'BLUE FRACTURE',
      role: 'Splitter gegen Gruppen',
      levels: [
        { cost: 65, summary: '+1 Splitter-Schuss', bonus: { splitShotsAdd: 1, splitDamageMul: 0.52 } },
        { cost: 95, summary: '+1 Splitter, schneller', bonus: { splitShotsAdd: 1, projectileSpeedMul: 1.12, splitDamageMul: 0.58 } }
      ]
    }
  },
  [EmotionType.Joy]: {
    A: {
      id: 'A',
      title: 'BRIGHTER CHAIN',
      role: 'Mehr Kettenziele',
      levels: [
        { cost: 65, summary: '+1 Chain, +20 Range', bonus: { chainCountAdd: 1, chainRangeAdd: 20 } },
        { cost: 95, summary: '+1 Chain, +30 Range', bonus: { chainCountAdd: 1, chainRangeAdd: 30 } }
      ]
    },
    B: {
      id: 'B',
      title: 'SPARK TEMPO',
      role: 'Schnellere Ketten',
      levels: [
        { cost: 60, summary: '+14% Tempo, +8% Projektil', bonus: { fireRateMul: 0.86, projectileSpeedMul: 1.08 } },
        { cost: 90, summary: '+12% Tempo, +12% Projektil', bonus: { fireRateMul: 0.88, projectileSpeedMul: 1.12 } }
      ]
    },
    C: {
      id: 'C',
      title: 'RESONANT JOY',
      role: 'Bonus bei gemischten Builds',
      levels: [
        { cost: 70, summary: '+18% Schaden in Resonance', bonus: { resonanceDamageMul: 1.18 } },
        { cost: 100, summary: '+18% Resonance, +10 Range', bonus: { resonanceDamageMul: 1.18, rangeAdd: 10 } }
      ]
    }
  },
  [EmotionType.Fear]: {
    A: {
      id: 'A',
      title: 'DEEP GLITCH',
      role: 'Mehr Stun',
      levels: [
        { cost: 55, summary: '+12% Chance, +0.15s', bonus: { fearChanceAdd: 0.12, stunDurationAdd: 0.15 } },
        { cost: 85, summary: '+10% Chance, +0.20s', bonus: { fearChanceAdd: 0.10, stunDurationAdd: 0.20 } }
      ]
    },
    B: {
      id: 'B',
      title: 'AREA FLICKER',
      role: 'AoE-Glitch',
      levels: [
        { cost: 65, summary: 'Kleine Glitch-Zone', bonus: { splashRadiusAdd: 28, damageMul: 1.05 } },
        { cost: 95, summary: 'Größere Glitch-Zone', bonus: { splashRadiusAdd: 18, fearChanceAdd: 0.08 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CHASE PANIC',
      role: 'Bonus gegen schnelle Gegner',
      levels: [
        { cost: 60, summary: '+40% vs schnelle Gegner', bonus: { fastEnemyDamageMul: 1.40 } },
        { cost: 90, summary: '+25% vs schnelle Gegner', bonus: { fastEnemyDamageMul: 1.25, projectileSpeedMul: 1.12 } }
      ]
    }
  },
  [EmotionType.Calm]: {
    A: {
      id: 'A',
      title: 'WIDER MIST',
      role: 'Mehr Buff-Radius',
      levels: [
        { cost: 60, summary: '+28 Buff-Radius', bonus: { buffRadiusAdd: 28, rangeAdd: 10 } },
        { cost: 90, summary: '+36 Buff-Radius', bonus: { buffRadiusAdd: 36, rangeAdd: 10 } }
      ]
    },
    B: {
      id: 'B',
      title: 'SOFTER TEMPO',
      role: 'Staerkerer Tempo-Buff',
      levels: [
        { cost: 65, summary: 'Buff nochmal schneller', bonus: { buffFireRateMul: 0.93 } },
        { cost: 95, summary: 'Buff nochmals schneller', bonus: { buffFireRateMul: 0.92, buffRadiusAdd: 10 } }
      ]
    },
    C: {
      id: 'C',
      title: 'RESTORE CORE',
      role: 'Stability nach Wellen',
      levels: [
        { cost: 70, summary: '+1 Stability pro Welle', bonus: { stabilityOnWaveCompleteAdd: 1 } },
        { cost: 100, summary: '+1 Stability, +8% Schaden', bonus: { stabilityOnWaveCompleteAdd: 1, damageMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Hope]: {
    A: {
      id: 'A',
      title: 'BRIGHTER SIGNAL',
      role: 'Mehr Schaden und Reichweite',
      levels: [
        { cost: 70, summary: '+16% Schaden, +18 Reichweite', bonus: { damageMul: 1.16, rangeAdd: 18 } },
        { cost: 105, summary: '+18% Schaden, +24 Reichweite', bonus: { damageMul: 1.18, rangeAdd: 24 } }
      ]
    },
    B: {
      id: 'B',
      title: 'STARBREAK',
      role: 'Stärker gegen Numb Ones',
      levels: [
        { cost: 75, summary: '+45% vs Numb Ones', bonus: { numbDamageMul: 1.45, projectileSpeedMul: 1.08 } },
        { cost: 110, summary: '+40% vs Numb Ones', bonus: { numbDamageMul: 1.40, damageMul: 1.08 } }
      ]
    },
    C: {
      id: 'C',
      title: 'GUIDING LIGHT',
      role: 'Stabilität durch Hoffnung',
      levels: [
        { cost: 80, summary: '+1 Stability pro Welle', bonus: { stabilityOnWaveCompleteAdd: 1, rangeAdd: 10 } },
        { cost: 115, summary: '+1 Stability, schneller', bonus: { stabilityOnWaveCompleteAdd: 1, fireRateMul: 0.9 } }
      ]
    }
  },
  [EmotionType.Disgust]: {
    A: {
      id: 'A',
      title: 'THICKER TOXIN',
      role: 'Staerkerer Schaden ueber Zeit',
      levels: [
        { cost: 65, summary: '+22% Gift, +0.4s', bonus: { poisonDpsMul: 1.22, poisonDurationAdd: 0.4 } },
        { cost: 95, summary: '+20% Gift, +0.5s', bonus: { poisonDpsMul: 1.20, poisonDurationAdd: 0.5 } }
      ]
    },
    B: {
      id: 'B',
      title: 'CORROSIVE BITE',
      role: 'Mehr Armor-Shred',
      levels: [
        { cost: 70, summary: '+5% Shred, +0.4s', bonus: { armorShredAdd: 0.05, armorShredDurationAdd: 0.4 } },
        { cost: 100, summary: '+5% Shred, +12 Range', bonus: { armorShredAdd: 0.05, rangeAdd: 12 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CONTAGION',
      role: 'Konservativer Flaechendruck',
      levels: [
        { cost: 75, summary: '+24 Splash, weniger Tempo', bonus: { splashRadiusAdd: 24, fireRateMul: 1.06 } },
        { cost: 105, summary: '+18 Splash, +10% Schaden', bonus: { splashRadiusAdd: 18, damageMul: 1.10 } }
      ]
    }
  },
  [EmotionType.Guilt]: {
    A: {
      id: 'A',
      title: 'HEAVIER MARK',
      role: 'Wiederholte Treffer skalieren besser',
      levels: [
        { cost: 70, summary: '+4% Mark-Bonus', bonus: { guiltMarkAdd: 0.04 } },
        { cost: 100, summary: '+4% Mark-Bonus, +8% Schaden', bonus: { guiltMarkAdd: 0.04, damageMul: 1.08 } }
      ]
    },
    B: {
      id: 'B',
      title: 'CONFESSION',
      role: 'Execute etwas frueher',
      levels: [
        { cost: 75, summary: '+3% Execute-Schwelle', bonus: { guiltExecuteThresholdAdd: 0.03 } },
        { cost: 105, summary: '+3% Execute, +14 Range', bonus: { guiltExecuteThresholdAdd: 0.03, rangeAdd: 14 } }
      ]
    },
    C: {
      id: 'C',
      title: 'RELENTLESS LOOP',
      role: 'Mehr Tempo fuer Markierungen',
      levels: [
        { cost: 70, summary: '+12% Tempo', bonus: { fireRateMul: 0.88 } },
        { cost: 100, summary: '+10% Tempo, +8% Projektil', bonus: { fireRateMul: 0.90, projectileSpeedMul: 1.08 } }
      ]
    }
  },
  [EmotionType.Trust]: {
    A: {
      id: 'A',
      title: 'WIDER GUARD',
      role: 'Mehr Reichweite und Barriere',
      levels: [
        { cost: 60, summary: '+18 Range, +0.15 Shield', bonus: { rangeAdd: 18, coreShieldAdd: 0.15 } },
        { cost: 90, summary: '+22 Range, +0.15 Shield', bonus: { rangeAdd: 22, coreShieldAdd: 0.15 } }
      ]
    },
    B: {
      id: 'B',
      title: 'ANCHOR FIELD',
      role: 'Besser gegen Panic und Void',
      levels: [
        { cost: 65, summary: '+0.35s Anchor', bonus: { trustAnchorDurationAdd: 0.35 } },
        { cost: 95, summary: '+0.35s Anchor, schneller', bonus: { trustAnchorDurationAdd: 0.35, fireRateMul: 0.92 } }
      ]
    },
    C: {
      id: 'C',
      title: 'CORE VOW',
      role: 'Defensive Spezialisierung',
      levels: [
        { cost: 70, summary: '+35% Shield, -10% Schaden', bonus: { coreShieldMul: 1.35, damageMul: 0.90 } },
        { cost: 100, summary: '+30% Shield, +1 Stability', bonus: { coreShieldMul: 1.30, stabilityOnWaveCompleteAdd: 1 } }
      ]
    }
  }
};
