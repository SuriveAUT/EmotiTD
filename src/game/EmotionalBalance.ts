import { EMOTION_LABEL, TOWER_STATS } from './config';
import { EMOTION_TYPES, EmotionType, TOWER_CATEGORIES, TOWER_CATEGORY_LABEL, type TowerCategory } from './types';

export type BalanceState = 'stable' | 'tense' | 'imbalanced' | 'overloaded';

export interface BalanceAnalysis {
  state: BalanceState;
  totalInfluence: number;
  influenceByEmotion: Record<EmotionType, number>;
  shareByEmotion: Record<EmotionType, number>;
  influenceByCategory: Record<TowerCategory, number>;
  shareByCategory: Record<TowerCategory, number>;
  dominantEmotion: EmotionType | null;
  dominantEmotionShare: number;
  dominantCategory: TowerCategory | null;
  dominantCategoryShare: number;
  representedEmotions: number;
  representedCategories: number;
  resonanceActive: boolean;
  deepResonanceActive: boolean;
  balancedFormationActive: boolean;
}

interface TowerLike {
  type: EmotionType;
  getUpgradeState?: () => { level: number };
}

const STATE_RANK: Record<BalanceState, number> = { stable: 0, tense: 1, imbalanced: 2, overloaded: 3 };
const DAMAGE_PENALTY: Record<BalanceState, number> = { stable: 1, tense: 0.96, imbalanced: 0.91, overloaded: 0.85 };
const RATE_PENALTY: Record<BalanceState, number> = { stable: 1, tense: 1.04, imbalanced: 1.08, overloaded: 1.12 };
const RESIST_MUL: Record<BalanceState, number> = { stable: 1, tense: 0.96, imbalanced: 0.92, overloaded: 0.85 };
const CORE_DAMAGE_MUL: Record<BalanceState, number> = { stable: 1, tense: 1.05, imbalanced: 1.10, overloaded: 1.18 };
const CATEGORY_CORE_MUL: Record<BalanceState, number> = { stable: 1, tense: 1.08, imbalanced: 1.15, overloaded: 1.22 };
const CONTROL_EFFECT_MUL: Record<BalanceState, number> = { stable: 1, tense: 0.95, imbalanced: 0.88, overloaded: 0.80 };
const SUPPORT_EFFECT_MUL: Record<BalanceState, number> = { stable: 1, tense: 0.95, imbalanced: 0.88, overloaded: 0.80 };
const DEFENSE_HP_MUL: Record<BalanceState, number> = { stable: 1, tense: 1.05, imbalanced: 1.10, overloaded: 1.16 };

export class EmotionalBalance {
  private synergyPowerModifier = 1;
  private singleEmotionPenaltyModifier = 1;
  readonly counts: Record<EmotionType, number> = createEmotionRecord(0);
  private current: BalanceAnalysis = createEmptyAnalysis();

  add(t: EmotionType) { this.counts[t]++; }
  remove(t: EmotionType) {
    if (this.counts[t] > 0) this.counts[t]--;
  }

  setChallengeModifiers(synergyPowerModifier = 1, singleEmotionPenaltyModifier = 1): void {
    this.synergyPowerModifier = synergyPowerModifier;
    this.singleEmotionPenaltyModifier = singleEmotionPenaltyModifier;
  }

  updateFromTowers(towers: TowerLike[]): void {
    for (const t of EMOTION_TYPES) this.counts[t] = 0;
    const influenceByEmotion = createEmotionRecord(0);
    const influenceByCategory = createCategoryRecord(0);

    for (const tower of towers) {
      this.counts[tower.type]++;
      const influence = Math.min(2.5, 1 + (tower.getUpgradeState?.().level ?? 0) * 0.25);
      influenceByEmotion[tower.type] += influence;
      influenceByCategory[TOWER_STATS[tower.type].category] += influence;
    }

    let totalInfluence = 0;
    for (const type of EMOTION_TYPES) totalInfluence += influenceByEmotion[type];

    const shareByEmotion = createEmotionRecord(0);
    const shareByCategory = createCategoryRecord(0);
    let dominantEmotion: EmotionType | null = null;
    let dominantEmotionShare = 0;
    for (const type of EMOTION_TYPES) {
      const share = totalInfluence > 0 ? influenceByEmotion[type] / totalInfluence : 0;
      shareByEmotion[type] = share;
      if (share > dominantEmotionShare) {
        dominantEmotionShare = share;
        dominantEmotion = type;
      }
    }

    let dominantCategory: TowerCategory | null = null;
    let dominantCategoryShare = 0;
    for (const category of TOWER_CATEGORIES) {
      const share = totalInfluence > 0 ? influenceByCategory[category] / totalInfluence : 0;
      shareByCategory[category] = share;
      if (share > dominantCategoryShare) {
        dominantCategoryShare = share;
        dominantCategory = category;
      }
    }

    const totalTowers = towers.length;
    const representedEmotions = EMOTION_TYPES.filter((type) => influenceByEmotion[type] > 0).length;
    const representedCategories = TOWER_CATEGORIES.filter((category) => influenceByCategory[category] > 0).length;
    const state = this.stateFor(totalTowers, dominantEmotionShare, dominantCategoryShare);
    const overloaded = state === 'overloaded';
    const resonanceActive = !overloaded && representedEmotions >= 4 && state !== 'imbalanced';
    const deepResonanceActive = !overloaded && representedEmotions >= 7;
    const balancedFormationActive = !overloaded && representedCategories === TOWER_CATEGORIES.length;

    this.current = {
      state,
      totalInfluence,
      influenceByEmotion,
      shareByEmotion,
      influenceByCategory,
      shareByCategory,
      dominantEmotion: totalInfluence > 0 ? dominantEmotion : null,
      dominantEmotionShare,
      dominantCategory: totalInfluence > 0 ? dominantCategory : null,
      dominantCategoryShare,
      representedEmotions,
      representedCategories,
      resonanceActive,
      deepResonanceActive,
      balancedFormationActive
    };
  }

  analysis(): BalanceAnalysis {
    return this.current;
  }

  uniqueCount(): number {
    return this.current.representedEmotions;
  }

  totalTowers(): number {
    let n = 0;
    for (const k of EMOTION_TYPES) n += this.counts[k];
    return n;
  }

  isResonating(): boolean {
    return this.current.resonanceActive || this.current.deepResonanceActive;
  }

  dominant(): EmotionType | null {
    return this.current.state === 'stable' ? null : this.current.dominantEmotion;
  }

  damageMulFor(type: EmotionType): number {
    let mul = this.current.deepResonanceActive
      ? 1 + (0.07 * this.synergyPowerModifier)
      : this.current.resonanceActive
        ? 1 + (0.04 * this.synergyPowerModifier)
        : 1;
    if (this.current.balancedFormationActive) mul *= 1.02;
    if (this.current.dominantEmotion === type && this.current.state !== 'stable') {
      const penalty = 1 - ((1 - DAMAGE_PENALTY[this.current.state]) * this.singleEmotionPenaltyModifier);
      mul *= penalty;
    }
    return mul;
  }

  fireRateMul(): number {
    return this.current.deepResonanceActive
      ? 1 - (0.07 * this.synergyPowerModifier)
      : this.current.resonanceActive
        ? 1 - (0.04 * this.synergyPowerModifier)
        : 1;
  }

  fireRateMulFor(type: EmotionType): number {
    if (this.current.dominantEmotion !== type || this.current.state === 'stable') return 1;
    return RATE_PENALTY[this.current.state];
  }

  supportEffectMul(): number {
    return this.current.dominantCategory === 'support'
      ? SUPPORT_EFFECT_MUL[this.current.state]
      : 1;
  }

  controlEffectMul(): number {
    return this.current.dominantCategory === 'control'
      ? CONTROL_EFFECT_MUL[this.current.state]
      : 1;
  }

  enemyHpMul(): number {
    return this.current.dominantCategory === 'defense'
      ? DEFENSE_HP_MUL[this.current.state]
      : 1;
  }

  damageTakenMulForSource(type: EmotionType): number {
    if (this.current.dominantEmotion !== type || this.current.state === 'stable') return 1;
    const mul = 1 - ((1 - RESIST_MUL[this.current.state]) * this.singleEmotionPenaltyModifier);
    return Math.max(0.65, mul);
  }

  coreDamageMul(): number {
    let mul = CORE_DAMAGE_MUL[this.current.state];
    if (this.current.dominantCategory === 'damage') {
      mul = Math.max(mul, CATEGORY_CORE_MUL[this.current.state]);
    }
    if (this.current.deepResonanceActive) mul *= 0.95;
    return mul;
  }

  stateRank(): number {
    return STATE_RANK[this.current.state];
  }

  statusText(): string {
    const a = this.current;
    if (a.totalInfluence <= 0) return 'NEUTRAL';
    if (a.deepResonanceActive) return 'STABLE: Deep Resonance +7%';
    if (a.resonanceActive) return 'STABLE: Resonance +4%';
    if (a.state === 'stable') return 'STABLE';
    if (a.dominantCategory && a.dominantCategoryShare >= a.dominantEmotionShare) {
      return `${a.state.toUpperCase()}: ${TOWER_CATEGORY_LABEL[a.dominantCategory]} ${this.categoryEffectLabel(a.dominantCategory)}`;
    }
    return `${a.state.toUpperCase()}: ${a.dominantEmotion ? EMOTION_LABEL[a.dominantEmotion] : 'Emotion'} dominance`;
  }

  towerImpactLines(type: EmotionType): string[] {
    const lines: string[] = [];
    const a = this.current;
    if (a.deepResonanceActive) lines.push('Deep Resonance: +7% damage, -5% leak damage');
    else if (a.resonanceActive) lines.push('Resonance: +4% damage');
    if (a.balancedFormationActive) lines.push('Balanced Formation: synergy pressure bonus active');
    if (a.dominantEmotion === type && a.state !== 'stable') {
      const penalty = Math.round((1 - DAMAGE_PENALTY[a.state]) * 100 * this.singleEmotionPenaltyModifier);
      const resist = Math.round((1 - RESIST_MUL[a.state]) * 100 * this.singleEmotionPenaltyModifier);
      lines.push(`${EMOTION_LABEL[type]} dominance: -${penalty}% damage, enemies adapt +${resist}%`);
    }
    const category = TOWER_STATS[type].category;
    if (a.dominantCategory === category && a.state !== 'stable') {
      if (category === 'control') lines.push(`Control Overload: CC effects x${this.controlEffectMul().toFixed(2)}`);
      if (category === 'support') lines.push(`Support Overload: buffs x${this.supportEffectMul().toFixed(2)}`);
      if (category === 'damage') lines.push(`Damage Overload: core leaks x${this.coreDamageMul().toFixed(2)}`);
      if (category === 'defense') lines.push(`Defense Overload: new enemy HP x${this.enemyHpMul().toFixed(2)}`);
    }
    return lines;
  }

  private stateFor(totalTowers: number, emotionShare: number, categoryShare: number): BalanceState {
    if (totalTowers < 8) return 'stable';
    let state: BalanceState = 'stable';
    if (emotionShare > 0.22 || categoryShare > 0.42) state = 'tense';
    if (totalTowers >= 12 && (emotionShare > 0.28 || categoryShare > 0.50)) state = 'imbalanced';
    if (totalTowers >= 18 && (emotionShare > 0.36 || categoryShare > 0.60)) state = 'overloaded';
    return state;
  }

  private categoryEffectLabel(category: TowerCategory): string {
    if (category === 'control') return 'CC weaker';
    if (category === 'support') return 'buffs weaker';
    if (category === 'damage') return 'leaks hurt';
    return 'enemy HP up';
  }
}

function createEmotionRecord(value: number): Record<EmotionType, number> {
  return Object.fromEntries(EMOTION_TYPES.map((type) => [type, value])) as Record<EmotionType, number>;
}

function createCategoryRecord(value: number): Record<TowerCategory, number> {
  return Object.fromEntries(TOWER_CATEGORIES.map((category) => [category, value])) as Record<TowerCategory, number>;
}

function createEmptyAnalysis(): BalanceAnalysis {
  return {
    state: 'stable',
    totalInfluence: 0,
    influenceByEmotion: createEmotionRecord(0),
    shareByEmotion: createEmotionRecord(0),
    influenceByCategory: createCategoryRecord(0),
    shareByCategory: createCategoryRecord(0),
    dominantEmotion: null,
    dominantEmotionShare: 0,
    dominantCategory: null,
    dominantCategoryShare: 0,
    representedEmotions: 0,
    representedCategories: 0,
    resonanceActive: false,
    deepResonanceActive: false,
    balancedFormationActive: false
  };
}
