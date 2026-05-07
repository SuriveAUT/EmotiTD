import { MAP_DEFINITIONS, TOWER_STATS } from './config';
import { STANDARD_MAX_WAVE, type GameMode } from './GameMode';
import { EMOTION_TYPES, EmotionType, type TowerCategory } from './types';

export interface RunConfig {
  mode: GameMode;
  mapId: string;
  seed: string;
  allowedTowers?: EmotionType[];
  startingMemoryModifier?: number;
  startingStabilityModifier?: number;
  enemyHpModifier?: number;
  enemySpeedModifier?: number;
  bountyModifier?: number;
  waveBonusModifier?: number;
  synergyPowerModifier?: number;
  singleEmotionPenaltyModifier?: number;
  bossFrequency?: number;
  maxWave?: number;
  rules: string[];
}

export const CHALLENGE_MODE_LABEL: Record<GameMode, string> = {
  standard: 'Standard',
  endless: 'Endless',
  bossRush: 'Boss Rush',
  limitedEmotions: 'Limited Emotions',
  fragileCore: 'Fragile Core',
  resonanceTrial: 'Resonance Trial'
};

export const CHALLENGE_MODE_DIFFICULTY: Record<GameMode, string> = {
  standard: 'Normal',
  endless: 'Escalating',
  bossRush: 'Hard',
  limitedEmotions: 'Variable',
  fragileCore: 'Hard',
  resonanceTrial: 'Technical'
};

export const CHALLENGE_MODE_DESCRIPTION: Record<GameMode, string> = {
  standard: 'The baseline Wave 30 run.',
  endless: 'Continue past standard victory into scaling waves.',
  bossRush: 'Bosses appear twice as often with reduced rewards.',
  limitedEmotions: 'A seeded pool limits the tower emotions available.',
  fragileCore: 'Lower Stability makes every leak matter.',
  resonanceTrial: 'Synergies matter more and imbalance hurts more.'
};

export function createDefaultRunConfig(mapId: string): RunConfig {
  return {
    mode: 'standard',
    mapId: normalizeMapId(mapId),
    seed: 'standard',
    maxWave: STANDARD_MAX_WAVE,
    rules: ['Standard Wave 30 run', 'Endless unlocks after victory']
  };
}

export function createChallengeRunConfig(mode: GameMode, mapId: string, seed = randomSeed()): RunConfig {
  const normalizedMapId = normalizeMapId(mapId);
  if (mode === 'standard') return createDefaultRunConfig(normalizedMapId);
  if (mode === 'endless') {
    return {
      mode,
      mapId: normalizedMapId,
      seed,
      maxWave: undefined,
      rules: ['No Wave 30 victory cap', 'Waves keep scaling']
    };
  }
  if (mode === 'bossRush') {
    return {
      mode,
      mapId: normalizedMapId,
      seed,
      bossFrequency: 5,
      enemyHpModifier: 1.08,
      bountyModifier: 0.85,
      waveBonusModifier: 0.75,
      maxWave: STANDARD_MAX_WAVE,
      rules: ['Boss every 5 waves', 'Reduced rewards', 'Stronger boss pressure']
    };
  }
  if (mode === 'limitedEmotions') {
    return {
      mode,
      mapId: normalizedMapId,
      seed,
      allowedTowers: seededTowerPool(seed),
      maxWave: STANDARD_MAX_WAVE,
      rules: ['Only 5 emotions available', 'Seeded tower pool']
    };
  }
  if (mode === 'fragileCore') {
    return {
      mode,
      mapId: normalizedMapId,
      seed,
      startingStabilityModifier: 0.55,
      startingMemoryModifier: 1.05,
      enemySpeedModifier: 1.03,
      maxWave: STANDARD_MAX_WAVE,
      rules: ['Reduced Stability', 'Leaks are much more dangerous']
    };
  }
  return {
    mode,
    mapId: normalizedMapId,
    seed,
    synergyPowerModifier: 1.15,
    singleEmotionPenaltyModifier: 1.25,
    bountyModifier: 0.95,
    maxWave: STANDARD_MAX_WAVE,
    rules: ['Local synergies are stronger', 'Imbalance is more punishing', 'Mixed builds are rewarded']
  };
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeMapId(mapId: string): string {
  return MAP_DEFINITIONS[mapId] ? mapId : Object.keys(MAP_DEFINITIONS)[0];
}

function seededTowerPool(seed: string): EmotionType[] {
  const picked: EmotionType[] = [];
  const byCategory = (category: TowerCategory) => EMOTION_TYPES.filter((type) => TOWER_STATS[type].category === category);
  const rng = createSeededRng(seed);
  const requiredCategories: TowerCategory[] = ['damage', 'control', rng() < 0.5 ? 'support' : 'defense'];
  for (const category of requiredCategories) {
    const options = byCategory(category).filter((type) => !picked.includes(type));
    const choice = options[Math.floor(rng() * options.length)];
    if (choice) picked.push(choice);
  }
  const rest = [...EMOTION_TYPES].filter((type) => !picked.includes(type));
  while (picked.length < 5 && rest.length > 0) {
    const index = Math.floor(rng() * rest.length);
    picked.push(rest.splice(index, 1)[0]);
  }
  return picked;
}

function createSeededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
