import { EmotionType } from '../game/types';

/* ------------------------------------------------------------------ *
 *  Tower stats
 * ------------------------------------------------------------------ */
export interface TowerStats {
  cost: number;
  damage: number;
  range: number;
  fireRate: number;          // seconds between shots
  projectileSpeed: number;   // units per second
  splashRadius?: number;     // anger
  chainCount?: number;       // joy
  chainRange?: number;       // joy
  slowAmount?: number;       // sadness — mult to enemy speed (0.6 = 40% slower)
  slowDuration?: number;     // sadness
  fearChance?: number;       // fear
  stunDuration?: number;     // fear
  buffRadius?: number;       // calm
  buffFireRate?: number;     // calm — mult to fireRate (0.8 = 20% faster)
  numbDamageMul?: number;    // hope
  poisonDps?: number;        // disgust
  poisonDuration?: number;   // disgust
  armorShred?: number;       // disgust
  armorShredDuration?: number;
  guiltMark?: number;        // guilt
  guiltExecuteThreshold?: number;
  coreShield?: number;       // trust
  trustAnchorDuration?: number;
  shameGroupRadius?: number;
  shameGroupDamageMul?: number;
  loveLinkRadius?: number;
  loveFireRateMul?: number;
  loveDamageMul?: number;
  prideIsolationRadius?: number;
  prideIsolationDamageMul?: number;
  description: string;
  synergies: EmotionType[];
}

export const TOWER_STATS: Record<EmotionType, TowerStats> = {
  [EmotionType.Anger]: {
    cost: 52,
    damage: 26,
    range: 130,
    fireRate: 0.55,
    projectileSpeed: 540,
    splashRadius: 40,
    description: 'Splash damage. Short range, explosive hits.',
    synergies: [EmotionType.Joy, EmotionType.Fear]
  },
  [EmotionType.Sadness]: {
    cost: 58,
    damage: 18,
    range: 220,
    fireRate: 1.1,
    projectileSpeed: 460,
    slowAmount: 0.55,
    slowDuration: 1.4,
    description: 'Long range and reliable slows.',
    synergies: [EmotionType.Calm, EmotionType.Fear]
  },
  [EmotionType.Joy]: {
    cost: 72,
    damage: 16,
    range: 160,
    fireRate: 0.85,
    projectileSpeed: 620,
    chainCount: 3,
    chainRange: 110,
    description: 'Chains between enemies.',
    synergies: [EmotionType.Calm, EmotionType.Anger]
  },
  [EmotionType.Fear]: {
    cost: 58,
    damage: 12,
    range: 140,
    fireRate: 0.7,
    projectileSpeed: 500,
    fearChance: 0.35,
    stunDuration: 0.6,
    description: 'Briefly stuns enemies for crowd control.',
    synergies: [EmotionType.Sadness, EmotionType.Anger]
  },
  [EmotionType.Calm]: {
    cost: 62,
    damage: 5,
    range: 150,
    fireRate: 1.4,
    projectileSpeed: 380,
    buffRadius: 130,
    buffFireRate: 0.78,
    description: 'Buffs nearby towers.',
    synergies: [EmotionType.Sadness, EmotionType.Joy]
  },
  [EmotionType.Hope]: {
    cost: 72,
    damage: 15,
    range: 175,
    fireRate: 0.95,
    projectileSpeed: 560,
    numbDamageMul: 1.85,
    description: 'Starlight against numb enemies.',
    synergies: [EmotionType.Calm, EmotionType.Joy, EmotionType.Sadness]
  },
  [EmotionType.Disgust]: {
    cost: 70,
    damage: 9,
    range: 150,
    fireRate: 0.95,
    projectileSpeed: 500,
    poisonDps: 6,
    poisonDuration: 2.4,
    armorShred: 1.12,
    armorShredDuration: 1.6,
    description: 'Poison, damage over time and armor shred.',
    synergies: [EmotionType.Sadness, EmotionType.Fear, EmotionType.Calm]
  },
  [EmotionType.Guilt]: {
    cost: 74,
    damage: 14,
    range: 165,
    fireRate: 1.05,
    projectileSpeed: 540,
    guiltMark: 0.11,
    guiltExecuteThreshold: 0.12,
    description: 'Marks targets. Repeated hits escalate.',
    synergies: [EmotionType.Anger, EmotionType.Fear, EmotionType.Hope]
  },
  [EmotionType.Trust]: {
    cost: 60,
    damage: 6,
    range: 170,
    fireRate: 1.15,
    projectileSpeed: 440,
    coreShield: 0.35,
    trustAnchorDuration: 0.85,
    description: 'Defensive Core shielding, low damage.',
    synergies: [EmotionType.Calm, EmotionType.Hope, EmotionType.Joy]
  },
  [EmotionType.Shame]: {
    cost: 68,
    damage: 11,
    range: 155,
    fireRate: 0.78,
    projectileSpeed: 520,
    shameGroupRadius: 64,
    shameGroupDamageMul: 1.38,
    splashRadius: 24,
    description: 'Groups take more damage when packed together.',
    synergies: [EmotionType.Fear, EmotionType.Disgust, EmotionType.Love]
  },
  [EmotionType.Love]: {
    cost: 76,
    damage: 7,
    range: 145,
    fireRate: 1.25,
    projectileSpeed: 420,
    loveLinkRadius: 150,
    loveFireRateMul: 0.88,
    loveDamageMul: 1.10,
    description: 'Links nearby synergy partners with tempo and damage buffs.',
    synergies: [EmotionType.Joy, EmotionType.Trust, EmotionType.Shame]
  },
  [EmotionType.Pride]: {
    cost: 82,
    damage: 38,
    range: 185,
    fireRate: 1.35,
    projectileSpeed: 660,
    prideIsolationRadius: 95,
    prideIsolationDamageMul: 1.32,
    description: 'High single-target boss damage, stronger when isolated.',
    synergies: [EmotionType.Anger, EmotionType.Guilt, EmotionType.Love]
  }
};
