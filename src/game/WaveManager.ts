import { EnemyKind } from './types';
import type { RunConfig } from './RunConfig';

export interface SpawnGroup {
  kind: EnemyKind;
  count: number;
  spacing: number;
  delay: number;
  hpScale?: number;
}

export interface WaveDef {
  number: number;
  groups: SpawnGroup[];
  isBoss?: boolean;
  bonusMemory?: number;
}

interface Pending {
  kind: EnemyKind;
  at: number;
  hpScale: number;
}

const D = EnemyKind.Doubtling;
const P = EnemyKind.PanicRunner;
const F = EnemyKind.Fractureling;
const K = EnemyKind.PressureKnot;
const G = EnemyKind.GuiltGiant;
const S = EnemyKind.ShameSwarm;
const E = EnemyKind.EnvyLeech;
const B = EnemyKind.BurnoutBrute;
const V = EnemyKind.VoidWraith;
const O = EnemyKind.Overthinker;
const N = EnemyKind.NumbOne;
const X = EnemyKind.Spiral;
const M = EnemyKind.Mask;
const R = EnemyKind.BurnoutBoss;

const previewCache = new Map<number, WaveDef>();

function hpScaleFor(number: number): number {
  if (number <= 5) return 1 + (number - 1) * 0.055;
  if (number <= 10) return 1.22 + (number - 5) * 0.095;
  if (number <= 20) return 1.70 + (number - 10) * 0.13;
  if (number <= 30) return 3.00 + (number - 20) * 0.17;
  return 4.70 * Math.pow(1.075, number - 30);
}

function spacingDensityFor(number: number): number {
  if (number <= 5) return 1.02 - (number - 1) * 0.025;
  if (number <= 10) return 0.90 - (number - 6) * 0.02;
  if (number <= 20) return 0.78 - (number - 11) * 0.014;
  return Math.max(0.38, 0.64 - (number - 21) * 0.017);
}

function bossHpScaleFor(number: number): number {
  if (number <= 10) return 1.35 + number * 0.03;
  if (number <= 20) return 1.65 + (number - 10) * 0.09;
  if (number <= 30) return 2.55 + (number - 20) * 0.115;
  return 3.70 * Math.pow(1.09, number - 30);
}

export function bossKindForWave(number: number, bossFrequency = 10): EnemyKind {
  const bossIndex = Math.max(1, Math.floor(number / bossFrequency));
  if (bossIndex === 1) return X;
  if (bossIndex === 2) return M;
  if (bossIndex === 3) return R;
  const cycle = (bossIndex - 1) % 3;
  return cycle === 0 ? X : cycle === 1 ? M : R;
}

export function generateWave(number: number, config?: RunConfig): WaveDef {
  const useCache = !config || config.mode === 'standard';
  const cached = useCache ? previewCache.get(number) : undefined;
  if (cached) return cached;

  const hpScale = hpScaleFor(number);
  const density = spacingDensityFor(number);
  const bossFrequency = config?.bossFrequency ?? 10;
  const bossWave = number % bossFrequency === 0;
  const groups: SpawnGroup[] = [];

  if (bossWave) {
    const bossKind = bossKindForWave(number, bossFrequency);
    const endless = number > 30;
    const firstBoss = number <= 10;
    groups.push(
      { kind: D, count: endless ? 6 + Math.floor(number * 0.12) : firstBoss ? 5 + Math.floor(number * 0.22) : 6 + Math.floor(number * 0.45), spacing: Math.max(0.36, density * 0.9), delay: 0, hpScale: hpScale * (endless ? 1.05 : firstBoss ? 0.62 : 0.86) },
      { kind: bossKind, count: 1, spacing: 1, delay: 5, hpScale: bossHpScaleFor(number) * (firstBoss ? 0.66 : 1) },
      ...(firstBoss ? [{ kind: F, count: 3, spacing: 2.3, delay: 7, hpScale: hpScale * 0.72 }] : []),
      { kind: S, count: endless ? 8 + Math.floor(number * 0.13) : firstBoss ? 4 + Math.floor(number * 0.18) : 8 + Math.floor(number * 0.36), spacing: Math.max(0.22, density * 0.52), delay: firstBoss ? 13 : 10, hpScale: hpScale * (endless ? 0.9 : firstBoss ? 0.52 : 0.72) }
    );
    if (!endless && number >= 20) groups.push({ kind: K, count: 2 + Math.floor(number / 14), spacing: 3.4, delay: 8.5, hpScale: hpScale * 0.86 });
    if (number >= 20) groups.push({ kind: V, count: 1 + Math.floor(number / 20), spacing: 3.0, delay: 7, hpScale: hpScale * 0.78 });
    if (number >= 30) groups.push({ kind: O, count: 1 + Math.floor(number / 30), spacing: 4.2, delay: 12, hpScale: hpScale * 0.92 });
    if (number >= 30) groups.push({ kind: E, count: 2 + Math.floor(number / 18), spacing: 2.4, delay: 14, hpScale });
    if (number >= 40) groups.push({ kind: N, count: 3 + Math.floor(number / 18), spacing: 1.7, delay: 16, hpScale: hpScale * 0.88 });
  } else {
    groups.push({ kind: D, count: number > 30 ? 8 + Math.floor(number * 0.16) : 5 + Math.floor(number * 1.1), spacing: Math.max(0.36, density), delay: 0, hpScale: number > 30 ? hpScale * 1.1 : hpScale });

    if (number >= 3) {
      groups.push({ kind: P, count: 1 + Math.floor(number * 0.38), spacing: Math.max(0.46, density * 0.95), delay: 3.5, hpScale: hpScale * 0.86 });
    }
    if (number >= 6) {
      groups.push({ kind: F, count: number > 30 ? 4 + Math.floor((number - 30) / 12) : number <= 12 ? 1 + Math.floor((number - 6) / 3) : 3 + Math.floor((number - 12) / 5), spacing: 2.1, delay: 5.8, hpScale: number > 30 ? hpScale * 1.02 : number <= 12 ? hpScale * 0.78 : hpScale * 0.9 });
    }
    if (number >= 9) {
      groups.push({ kind: K, count: number > 30 ? 2 + Math.floor((number - 30) / 16) : number <= 13 ? 1 : 1 + Math.floor((number - 9) / 6), spacing: 3.6, delay: 7.2, hpScale: number > 30 ? hpScale * 1.03 : number <= 13 ? hpScale * 0.82 : hpScale * 0.95 });
    }
    if (number >= 8) {
      groups.push({ kind: G, count: number > 30 ? 3 + Math.floor((number - 30) / 14) : number <= 12 ? 1 : 1 + Math.floor(number / 7), spacing: 3.2, delay: number <= 12 ? 8 : 6, hpScale: number > 30 ? hpScale * 1.08 : number <= 12 ? hpScale * 0.82 : hpScale });
    }
    if (number >= 7) {
      groups.push({ kind: S, count: number <= 12 ? 3 + Math.floor(number * 0.35) : 5 + Math.floor(number * 0.6), spacing: Math.max(0.18, density * 0.42), delay: 8, hpScale: hpScale * (number <= 12 ? 0.62 : 0.7) });
    }
    if (number >= 8) {
      groups.push({ kind: E, count: number <= 12 ? 1 : 1 + Math.floor(number / 9), spacing: 2.4, delay: number <= 12 ? 10.5 : 5.5, hpScale: hpScale * (number <= 12 ? 0.78 : 0.88) });
    }
    if (number >= 13) {
      groups.push({ kind: B, count: number > 30 ? 3 + Math.floor((number - 30) / 13) : 1 + Math.floor(number / 9), spacing: 3.4, delay: 9, hpScale: number > 30 ? hpScale * 1.08 : hpScale });
    }
    if (number >= 14) {
      groups.push({ kind: V, count: number > 30 ? 3 + Math.floor((number - 30) / 16) : 2 + Math.floor(number / 10), spacing: 1.8, delay: 4.5, hpScale: hpScale * (number > 30 ? 1.0 : 0.85) });
    }
    if (number >= 18) {
      groups.push({ kind: O, count: number > 30 ? 2 + Math.floor((number - 30) / 18) : 1 + Math.floor((number - 18) / 7), spacing: 4.0, delay: 7.5, hpScale: hpScale * (number > 30 ? 1.08 : 0.95) });
    }
    if (number >= 22) {
      groups.push({ kind: N, count: number > 30 ? 2 + Math.floor((number - 30) / 12) : 2 + Math.floor((number - 22) / 5), spacing: Math.max(0.7, density * 1.25), delay: 6.5, hpScale: hpScale * (number > 30 ? 1.02 : 0.9) });
    }
  }

  const def: WaveDef = {
    number,
    groups: capEndlessGroups(applyConfigToGroups(groups, config), number, bossWave, config).sort((a, b) => a.delay - b.delay),
    isBoss: bossWave,
    bonusMemory: applyWaveBonusModifier(bossWave ? 38 + Math.floor(number * 2.1) + earlyBossBonus(number, config) : number % 5 === 0 ? 10 + Math.floor(number * 0.8) : undefined, config)
  };
  if (useCache) previewCache.set(number, def);
  return def;
}

function capEndlessGroups(groups: SpawnGroup[], number: number, bossWave: boolean, config?: RunConfig): SpawnGroup[] {
  if (number <= 30) return groups;
  void bossWave;
  const maxTotal = config?.mode === 'bossRush'
    ? 65
    : number >= 81
      ? 70
      : number >= 51
        ? 80
        : 90;
  const maxDoubtlings = Math.max(4, Math.floor(maxTotal * (number >= 81 ? 0.2 : number >= 51 ? 0.3 : 0.42)));
  let used = 0;
  return groups.map((group) => {
    const isBoss = group.kind === X || group.kind === M || group.kind === R;
    if (isBoss) return group;
    const remaining = Math.max(0, maxTotal - used);
    const kindCap = group.kind === D ? maxDoubtlings : remaining;
    const count = Math.min(group.count, remaining, kindCap);
    used += count;
    return { ...group, count };
  }).filter((group) => group.count > 0);
}

function applyConfigToGroups(groups: SpawnGroup[], config?: RunConfig): SpawnGroup[] {
  const hpMul = config?.enemyHpModifier ?? 1;
  const reduceBossRushAdds = config?.mode === 'bossRush';
  return groups.map((group) => {
    const isBoss = group.kind === X || group.kind === M || group.kind === R;
    return {
      ...group,
      count: reduceBossRushAdds && !isBoss ? Math.max(1, Math.floor(group.count * 0.82)) : group.count,
      hpScale: (group.hpScale ?? 1) * hpMul
    };
  });
}

function applyWaveBonusModifier(value: number | undefined, config?: RunConfig): number | undefined {
  if (value === undefined) return undefined;
  return Math.max(0, Math.floor(value * (config?.waveBonusModifier ?? 1)));
}

function earlyBossBonus(number: number, config?: RunConfig): number {
  if (config && config.mode !== 'standard') return 0;
  if (number === 10) return 10;
  if (number === 20) return 15;
  return 0;
}

export class WaveManager {
  current = 0;
  active = false;
  elapsed = 0;
  private queue: Pending[] = [];
  private maxWave: number | null;
  private config: RunConfig | null = null;

  constructor(maxWave: number | null = null) {
    this.maxWave = maxWave;
  }

  get total() { return this.maxWave ?? Infinity; }
  isLast() { return this.maxWave !== null && this.current >= this.maxWave; }

  setMaxWave(maxWave: number | null): void {
    this.maxWave = maxWave;
  }

  setRunConfig(config: RunConfig): void {
    this.config = config;
    this.maxWave = config.maxWave ?? null;
  }

  currentDef(): WaveDef | null {
    if (this.current === 0) return null;
    return generateWave(this.current, this.config ?? undefined);
  }

  nextDef(): WaveDef | null {
    if (this.maxWave !== null && this.current >= this.maxWave) return null;
    return generateWave(this.current + 1, this.config ?? undefined);
  }

  start(n: number) {
    if (this.maxWave !== null && n > this.maxWave) return;
    this.current = n;
    this.active = true;
    this.elapsed = 0;
    this.queue = [];
    const def = generateWave(n, this.config ?? undefined);
    for (const g of def.groups) {
      for (let i = 0; i < g.count; i++) {
        this.queue.push({
          kind: g.kind,
          at: g.delay + i * g.spacing,
          hpScale: g.hpScale ?? 1
        });
      }
    }
    this.queue.sort((a, b) => a.at - b.at);
  }

  tick(dt: number): Pending[] {
    if (!this.active) return [];
    this.elapsed += dt;
    const out: Pending[] = [];
    while (this.queue.length && this.queue[0].at <= this.elapsed) {
      out.push(this.queue.shift()!);
    }
    return out;
  }

  deferSpawn(pending: Pending, delay = 0.35): void {
    if (!this.active) return;
    this.queue.push({ ...pending, at: this.elapsed + delay });
    this.queue.sort((a, b) => a.at - b.at);
  }

  isSpawningDone(): boolean {
    return this.active && this.queue.length === 0;
  }

  hasPendingBossSpawn(): boolean {
    return this.queue.some((pending) => pending.kind === X || pending.kind === M || pending.kind === R);
  }

  endWave() {
    this.active = false;
  }

  reset() {
    this.current = 0;
    this.active = false;
    this.elapsed = 0;
    this.queue = [];
  }

  restoreBetweenWaves(currentWave: number): void {
    this.current = Math.max(0, Math.floor(currentWave));
    this.active = false;
    this.elapsed = 0;
    this.queue = [];
  }
}
