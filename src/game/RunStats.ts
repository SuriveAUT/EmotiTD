import { BOSS_KINDS, EMOTION_TYPES, EmotionType, EnemyKind, isBossKind, type TowerCategory } from './types';
import type { BalanceAnalysis, BalanceState } from './EmotionalBalance';

export interface RunSummary {
  score: number;
  killsTotal: number;
  bossKills: number;
  towersSold: number;
  upgradesPurchased: number;
  memoryEarned: number;
  coreDamageTaken: number;
  maxResonanceTime: number;
  topDamageEmotion: EmotionType | null;
  topDamage: number;
  highestUpgradeLevel: number;
  maxActiveSynergies: number;
  towersUsed: number;
  maxBalanceState: BalanceState;
  timeInStable: number;
  timeInTense: number;
  timeInImbalanced: number;
  timeInOverloaded: number;
  dominantEmotionAtDeath: EmotionType | null;
  dominantCategoryAtDeath: TowerCategory | null;
  maxDominantEmotionShare: number;
  maxDominantCategoryShare: number;
}

export interface RunStatsJson extends RunSummary {
  killsByEnemyKind: Record<EnemyKind, number>;
  damageDealtByEmotion: Record<EmotionType, number>;
  towersBuiltByEmotion: Record<EmotionType, number>;
}

const ENEMY_KINDS: EnemyKind[] = [
  EnemyKind.Doubtling,
  EnemyKind.PanicRunner,
  EnemyKind.Fractureling,
  EnemyKind.PressureKnot,
  EnemyKind.GuiltGiant,
  EnemyKind.ShameSwarm,
  EnemyKind.EnvyLeech,
  EnemyKind.BurnoutBrute,
  EnemyKind.VoidWraith,
  EnemyKind.Overthinker,
  EnemyKind.NumbOne,
  ...BOSS_KINDS
];

export class RunStats {
  score = 0;
  killsTotal = 0;
  readonly killsByEnemyKind: Record<EnemyKind, number> = this.createEnemyRecord();
  readonly damageDealtByEmotion: Record<EmotionType, number> = this.createEmotionRecord();
  readonly towersBuiltByEmotion: Record<EmotionType, number> = this.createEmotionRecord();
  towersSold = 0;
  upgradesPurchased = 0;
  memoryEarned = 0;
  coreDamageTaken = 0;
  bossKills = 0;
  maxResonanceTime = 0;
  highestUpgradeLevel = 0;
  maxActiveSynergies = 0;
  maxBalanceState: BalanceState = 'stable';
  timeInStable = 0;
  timeInTense = 0;
  timeInImbalanced = 0;
  timeInOverloaded = 0;
  dominantEmotionAtDeath: EmotionType | null = null;
  dominantCategoryAtDeath: TowerCategory | null = null;
  maxDominantEmotionShare = 0;
  maxDominantCategoryShare = 0;
  private currentResonanceTime = 0;

  recordKill(kind: EnemyKind, bounty: number, wave: number): void {
    this.killsTotal++;
    this.killsByEnemyKind[kind]++;
    const killScore = bounty * 12 + Math.max(0, wave) * 4;
    this.addScore(killScore);
    if (isBossKind(kind)) {
      this.bossKills++;
      this.addScore(5000 + Math.max(0, wave) * 120);
    }
  }

  recordWaveComplete(wave: number, isBoss: boolean): void {
    this.addScore(Math.max(0, wave) * 250 + (isBoss ? 1500 : 0));
  }

  recordVictory(stability: number): void {
    this.addScore(Math.max(0, Math.floor(stability)) * 200);
  }

  recordDamage(source: EmotionType, amount: number): void {
    if (amount <= 0) return;
    this.damageDealtByEmotion[source] += amount;
    this.addScore(Math.floor(amount * 2));
  }

  recordTowerBuilt(type: EmotionType): void {
    this.towersBuiltByEmotion[type]++;
  }

  recordTowerSold(): void {
    this.towersSold++;
  }

  recordUpgradePurchased(): void {
    this.upgradesPurchased++;
    this.addScore(75);
  }

  recordHighestUpgradeLevel(level: number): void {
    this.highestUpgradeLevel = Math.max(this.highestUpgradeLevel, Math.max(0, Math.floor(level)));
  }

  recordActiveSynergies(count: number): void {
    this.maxActiveSynergies = Math.max(this.maxActiveSynergies, Math.max(0, Math.floor(count)));
  }

  recordMemoryEarned(amount: number): void {
    if (amount <= 0) return;
    this.memoryEarned += amount;
  }

  recordCoreDamage(amount: number): void {
    if (amount <= 0) return;
    this.coreDamageTaken += amount;
  }

  updateResonance(dt: number, resonating: boolean): void {
    if (resonating) {
      this.currentResonanceTime += dt;
      this.maxResonanceTime = Math.max(this.maxResonanceTime, this.currentResonanceTime);
    } else {
      this.currentResonanceTime = 0;
    }
  }

  updateBalance(dt: number, analysis: BalanceAnalysis): void {
    if (dt <= 0) return;
    if (analysis.state === 'stable') this.timeInStable += dt;
    else if (analysis.state === 'tense') this.timeInTense += dt;
    else if (analysis.state === 'imbalanced') this.timeInImbalanced += dt;
    else this.timeInOverloaded += dt;
    if (balanceRank(analysis.state) > balanceRank(this.maxBalanceState)) this.maxBalanceState = analysis.state;
    this.maxDominantEmotionShare = Math.max(this.maxDominantEmotionShare, analysis.dominantEmotionShare);
    this.maxDominantCategoryShare = Math.max(this.maxDominantCategoryShare, analysis.dominantCategoryShare);
  }

  recordFinalBalance(analysis: BalanceAnalysis): void {
    this.dominantEmotionAtDeath = analysis.dominantEmotion;
    this.dominantCategoryAtDeath = analysis.dominantCategory;
    this.maxDominantEmotionShare = Math.max(this.maxDominantEmotionShare, analysis.dominantEmotionShare);
    this.maxDominantCategoryShare = Math.max(this.maxDominantCategoryShare, analysis.dominantCategoryShare);
    if (balanceRank(analysis.state) > balanceRank(this.maxBalanceState)) this.maxBalanceState = analysis.state;
  }

  summary(): RunSummary {
    let topDamageEmotion: EmotionType | null = null;
    let topDamage = 0;
    for (const type of EMOTION_TYPES) {
      const damage = this.damageDealtByEmotion[type];
      if (damage > topDamage) {
        topDamage = damage;
        topDamageEmotion = type;
      }
    }
    return {
      score: this.score,
      killsTotal: this.killsTotal,
      bossKills: this.bossKills,
      towersSold: this.towersSold,
      upgradesPurchased: this.upgradesPurchased,
      memoryEarned: this.memoryEarned,
      coreDamageTaken: this.coreDamageTaken,
      maxResonanceTime: this.maxResonanceTime,
      topDamageEmotion,
      topDamage,
      highestUpgradeLevel: this.highestUpgradeLevel,
      maxActiveSynergies: this.maxActiveSynergies,
      towersUsed: Object.values(this.towersBuiltByEmotion).filter((count) => count > 0).length,
      maxBalanceState: this.maxBalanceState,
      timeInStable: this.timeInStable,
      timeInTense: this.timeInTense,
      timeInImbalanced: this.timeInImbalanced,
      timeInOverloaded: this.timeInOverloaded,
      dominantEmotionAtDeath: this.dominantEmotionAtDeath,
      dominantCategoryAtDeath: this.dominantCategoryAtDeath,
      maxDominantEmotionShare: this.maxDominantEmotionShare,
      maxDominantCategoryShare: this.maxDominantCategoryShare
    };
  }

  toJson(): RunStatsJson {
    return {
      ...this.summary(),
      killsByEnemyKind: { ...this.killsByEnemyKind },
      damageDealtByEmotion: { ...this.damageDealtByEmotion },
      towersBuiltByEmotion: { ...this.towersBuiltByEmotion }
    };
  }

  static fromJson(json: Partial<RunStatsJson> | null | undefined): RunStats {
    const stats = new RunStats();
    if (!json || typeof json !== 'object') return stats;
    stats.score = numberOrDefault(json.score, 0);
    stats.killsTotal = numberOrDefault(json.killsTotal, 0);
    stats.towersSold = numberOrDefault(json.towersSold, 0);
    stats.upgradesPurchased = numberOrDefault(json.upgradesPurchased, 0);
    stats.memoryEarned = numberOrDefault(json.memoryEarned, 0);
    stats.coreDamageTaken = numberOrDefault(json.coreDamageTaken, 0);
    stats.bossKills = numberOrDefault(json.bossKills, 0);
    stats.maxResonanceTime = numberOrDefault(json.maxResonanceTime, 0);
    stats.highestUpgradeLevel = numberOrDefault(json.highestUpgradeLevel, 0);
    stats.maxActiveSynergies = numberOrDefault(json.maxActiveSynergies, 0);
    stats.maxBalanceState = isBalanceState(json.maxBalanceState) ? json.maxBalanceState : 'stable';
    stats.timeInStable = numberOrDefault(json.timeInStable, 0);
    stats.timeInTense = numberOrDefault(json.timeInTense, 0);
    stats.timeInImbalanced = numberOrDefault(json.timeInImbalanced, 0);
    stats.timeInOverloaded = numberOrDefault(json.timeInOverloaded, 0);
    stats.dominantEmotionAtDeath = isEmotion(json.dominantEmotionAtDeath) ? json.dominantEmotionAtDeath : null;
    stats.dominantCategoryAtDeath = isCategory(json.dominantCategoryAtDeath) ? json.dominantCategoryAtDeath : null;
    stats.maxDominantEmotionShare = numberOrDefault(json.maxDominantEmotionShare, 0);
    stats.maxDominantCategoryShare = numberOrDefault(json.maxDominantCategoryShare, 0);

    for (const kind of ENEMY_KINDS) {
      stats.killsByEnemyKind[kind] = numberOrDefault(json.killsByEnemyKind?.[kind], 0);
    }
    for (const type of EMOTION_TYPES) {
      stats.damageDealtByEmotion[type] = numberOrDefault(json.damageDealtByEmotion?.[type], 0);
      stats.towersBuiltByEmotion[type] = numberOrDefault(json.towersBuiltByEmotion?.[type], 0);
    }
    return stats;
  }

  private addScore(amount: number): void {
    this.score += Math.max(0, Math.floor(amount));
  }

  private createEmotionRecord(): Record<EmotionType, number> {
    return Object.fromEntries(EMOTION_TYPES.map((type) => [type, 0])) as Record<EmotionType, number>;
  }

  private createEnemyRecord(): Record<EnemyKind, number> {
    return Object.fromEntries(ENEMY_KINDS.map((kind) => [kind, 0])) as Record<EnemyKind, number>;
  }
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function balanceRank(state: BalanceState): number {
  return state === 'overloaded' ? 3 : state === 'imbalanced' ? 2 : state === 'tense' ? 1 : 0;
}

function isBalanceState(value: unknown): value is BalanceState {
  return value === 'stable' || value === 'tense' || value === 'imbalanced' || value === 'overloaded';
}

function isEmotion(value: unknown): value is EmotionType {
  return typeof value === 'string' && (EMOTION_TYPES as string[]).includes(value);
}

function isCategory(value: unknown): value is TowerCategory {
  return value === 'damage' || value === 'control' || value === 'support' || value === 'defense';
}
