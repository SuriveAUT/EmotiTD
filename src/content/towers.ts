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
  description: string;
  synergies: EmotionType[];
}

export const TOWER_STATS: Record<EmotionType, TowerStats> = {
  [EmotionType.Anger]: {
    cost: 50,
    damage: 26,
    range: 130,
    fireRate: 0.55,
    projectileSpeed: 540,
    splashRadius: 40,
    description: 'Splash-Schaden. Kurz aber explosiv.',
    synergies: [EmotionType.Joy, EmotionType.Fear]
  },
  [EmotionType.Sadness]: {
    cost: 60,
    damage: 18,
    range: 220,
    fireRate: 1.1,
    projectileSpeed: 460,
    slowAmount: 0.55,
    slowDuration: 1.4,
    description: 'Lange Reichweite, verlangsamt Gegner.',
    synergies: [EmotionType.Calm, EmotionType.Fear]
  },
  [EmotionType.Joy]: {
    cost: 70,
    damage: 16,
    range: 160,
    fireRate: 0.85,
    projectileSpeed: 620,
    chainCount: 3,
    chainRange: 110,
    description: 'Springt zwischen Gegnern. Kettenreaktion.',
    synergies: [EmotionType.Calm, EmotionType.Anger]
  },
  [EmotionType.Fear]: {
    cost: 55,
    damage: 12,
    range: 140,
    fireRate: 0.7,
    projectileSpeed: 500,
    fearChance: 0.35,
    stunDuration: 0.6,
    description: 'Glitcht Gegner kurz aus dem Pfad. Crowd-Control.',
    synergies: [EmotionType.Sadness, EmotionType.Anger]
  },
  [EmotionType.Calm]: {
    cost: 65,
    damage: 5,
    range: 150,
    fireRate: 1.4,
    projectileSpeed: 380,
    buffRadius: 130,
    buffFireRate: 0.78,
    description: 'Buffed andere Türme im Umkreis.',
    synergies: [EmotionType.Sadness, EmotionType.Joy]
  },
  [EmotionType.Hope]: {
    cost: 75,
    damage: 15,
    range: 175,
    fireRate: 0.95,
    projectileSpeed: 560,
    numbDamageMul: 1.85,
    description: 'Sternenlicht gegen Taubheit. Stark gegen Numb Ones.',
    synergies: [EmotionType.Calm, EmotionType.Joy, EmotionType.Sadness]
  },
  [EmotionType.Disgust]: {
    cost: 68,
    damage: 9,
    range: 150,
    fireRate: 0.95,
    projectileSpeed: 500,
    poisonDps: 6,
    poisonDuration: 2.4,
    armorShred: 1.12,
    armorShredDuration: 1.6,
    description: 'Gift, Schaden ueber Zeit und Armor-Shred.',
    synergies: [EmotionType.Sadness, EmotionType.Fear, EmotionType.Calm]
  },
  [EmotionType.Guilt]: {
    cost: 72,
    damage: 14,
    range: 165,
    fireRate: 1.05,
    projectileSpeed: 540,
    guiltMark: 0.11,
    guiltExecuteThreshold: 0.12,
    description: 'Markiert Ziele. Wiederholte Treffer eskalieren.',
    synergies: [EmotionType.Anger, EmotionType.Fear, EmotionType.Hope]
  },
  [EmotionType.Trust]: {
    cost: 62,
    damage: 6,
    range: 170,
    fireRate: 1.15,
    projectileSpeed: 440,
    coreShield: 0.35,
    trustAnchorDuration: 0.85,
    description: 'Defensiver Schutz fuer den Core, wenig Schaden.',
    synergies: [EmotionType.Calm, EmotionType.Hope, EmotionType.Joy]
  }
};
