import type { TowerCategory } from '../game/types';
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
  category: TowerCategory;
}

export const TOWER_STATS: Record<EmotionType, TowerStats> = {
  [EmotionType.Anger]: {
    cost: 76,
    damage: 25,
    range: 128,
    fireRate: 0.58,
    projectileSpeed: 540,
    splashRadius: 38,
    description: 'Splash damage. Short range, explosive hits.',
    synergies: [EmotionType.Joy, EmotionType.Fear],
    category: 'damage'
  },
  [EmotionType.Sadness]: {
    cost: 88,
    damage: 18,
    range: 220,
    fireRate: 1.15,
    projectileSpeed: 460,
    slowAmount: 0.72,
    slowDuration: 1.00,
    description: 'Long range and reliable slows.',
    synergies: [EmotionType.Calm, EmotionType.Fear],
    category: 'control'
  },
  [EmotionType.Joy]: {
    cost: 104,
    damage: 17,
    range: 160,
    fireRate: 0.86,
    projectileSpeed: 620,
    chainCount: 3,
    chainRange: 105,
    description: 'Chains between enemies.',
    synergies: [EmotionType.Calm, EmotionType.Anger],
    category: 'damage'
  },
  [EmotionType.Fear]: {
    cost: 82,
    damage: 14,
    range: 140,
    fireRate: 0.68,
    projectileSpeed: 500,
    fearChance: 0.20,
    stunDuration: 0.40,
    description: 'Briefly stuns enemies for crowd control.',
    synergies: [EmotionType.Sadness, EmotionType.Anger],
    category: 'control'
  },
  [EmotionType.Calm]: {
    cost: 112,
    damage: 4,
    range: 150,
    fireRate: 1.45,
    projectileSpeed: 380,
    buffRadius: 125,
    buffFireRate: 0.86,
    description: 'Buffs nearby towers.',
    synergies: [EmotionType.Sadness, EmotionType.Joy],
    category: 'support'
  },
  [EmotionType.Hope]: {
    cost: 122,
    damage: 14,
    range: 175,
    fireRate: 1.00,
    projectileSpeed: 560,
    numbDamageMul: 1.75,
    description: 'Starlight against numb enemies.',
    synergies: [EmotionType.Calm, EmotionType.Joy, EmotionType.Sadness],
    category: 'support'
  },
  [EmotionType.Disgust]: {
    cost: 96,
    damage: 8,
    range: 150,
    fireRate: 1.00,
    projectileSpeed: 500,
    poisonDps: 5.2,
    poisonDuration: 2.2,
    armorShred: 1.10,
    armorShredDuration: 1.45,
    description: 'Poison, damage over time and armor shred.',
    synergies: [EmotionType.Sadness, EmotionType.Fear, EmotionType.Calm],
    category: 'damage'
  },
  [EmotionType.Guilt]: {
    cost: 116,
    damage: 13,
    range: 165,
    fireRate: 1.10,
    projectileSpeed: 540,
    guiltMark: 0.095,
    guiltExecuteThreshold: 0.10,
    description: 'Marks targets. Repeated hits escalate.',
    synergies: [EmotionType.Anger, EmotionType.Fear, EmotionType.Hope],
    category: 'control'
  },
  [EmotionType.Trust]: {
    cost: 92,
    damage: 5,
    range: 165,
    fireRate: 1.25,
    projectileSpeed: 440,
    coreShield: 0.25,
    trustAnchorDuration: 0.70,
    description: 'Defensive Core shielding, low damage.',
    synergies: [EmotionType.Calm, EmotionType.Hope, EmotionType.Joy],
    category: 'defense'
  },
  [EmotionType.Shame]: {
    cost: 106,
    damage: 12,
    range: 155,
    fireRate: 0.78,
    projectileSpeed: 520,
    shameGroupRadius: 60,
    shameGroupDamageMul: 1.30,
    splashRadius: 22,
    description: 'Groups take more damage when packed together.',
    synergies: [EmotionType.Fear, EmotionType.Disgust, EmotionType.Love],
    category: 'control'
  },
  [EmotionType.Love]: {
    cost: 132,
    damage: 6,
    range: 145,
    fireRate: 1.30,
    projectileSpeed: 420,
    loveLinkRadius: 145,
    loveFireRateMul: 0.91,
    loveDamageMul: 1.07,
    description: 'Links nearby synergy partners with tempo and damage buffs.',
    synergies: [EmotionType.Joy, EmotionType.Trust, EmotionType.Shame],
    category: 'support'
  },
  [EmotionType.Pride]: {
    cost: 148,
    damage: 42,
    range: 185,
    fireRate: 1.45,
    projectileSpeed: 660,
    prideIsolationRadius: 95,
    prideIsolationDamageMul: 1.25,
    description: 'High single-target boss damage, stronger when isolated.',
    synergies: [EmotionType.Anger, EmotionType.Guilt, EmotionType.Love],
    category: 'damage'
  }
};
