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
    groups.push(
      { kind: D, count: 6 + Math.floor(number * 0.45), spacing: Math.max(0.32, density * 0.78), delay: 0, hpScale: hpScale * 0.86 },
      { kind: bossKind, count: 1, spacing: 1, delay: 4, hpScale: bossHpScaleFor(number) },
      { kind: S, count: 8 + Math.floor(number * 0.36), spacing: Math.max(0.18, density * 0.38), delay: 10, hpScale: hpScale * 0.72 }
    );
    if (number >= 20) groups.push({ kind: V, count: 1 + Math.floor(number / 20), spacing: 3.0, delay: 7, hpScale: hpScale * 0.78 });
    if (number >= 30) groups.push({ kind: O, count: 1 + Math.floor(number / 30), spacing: 4.2, delay: 12, hpScale: hpScale * 0.92 });
    if (number >= 30) groups.push({ kind: E, count: 2 + Math.floor(number / 18), spacing: 2.4, delay: 14, hpScale });
    if (number >= 40) groups.push({ kind: N, count: 3 + Math.floor(number / 18), spacing: 1.7, delay: 16, hpScale: hpScale * 0.88 });
  } else {
    groups.push({ kind: D, count: 5 + Math.floor(number * 1.1), spacing: Math.max(0.36, density), delay: 0, hpScale });

    if (number >= 3) {
      groups.push({ kind: P, count: 1 + Math.floor(number * 0.38), spacing: Math.max(0.46, density * 0.95), delay: 3.5, hpScale: hpScale * 0.86 });
    }
    if (number >= 5) {
      groups.push({ kind: G, count: 1 + Math.floor(number / 7), spacing: 3.2, delay: 6, hpScale });
    }
    if (number >= 7) {
      groups.push({ kind: S, count: 5 + Math.floor(number * 0.6), spacing: Math.max(0.18, density * 0.42), delay: 8, hpScale: hpScale * 0.7 });
    }
    if (number >= 6) {
      groups.push({ kind: E, count: 1 + Math.floor(number / 9), spacing: 2.4, delay: 5.5, hpScale: hpScale * 0.88 });
    }
    if (number >= 10) {
      groups.push({ kind: B, count: 1 + Math.floor(number / 9), spacing: 3.4, delay: 9, hpScale });
    }
    if (number >= 14) {
      groups.push({ kind: V, count: 2 + Math.floor(number / 10), spacing: 1.8, delay: 4.5, hpScale: hpScale * 0.85 });
    }
    if (number >= 18) {
      groups.push({ kind: O, count: 1 + Math.floor((number - 18) / 7), spacing: 4.0, delay: 7.5, hpScale: hpScale * 0.95 });
    }
    if (number >= 22) {
      groups.push({ kind: N, count: 2 + Math.floor((number - 22) / 5), spacing: Math.max(0.7, density * 1.25), delay: 6.5, hpScale: hpScale * 0.9 });
    }
  }

  const def: WaveDef = {
    number,
    groups: applyConfigToGroups(groups, config).sort((a, b) => a.delay - b.delay),
    isBoss: bossWave,
    bonusMemory: applyWaveBonusModifier(bossWave ? 38 + Math.floor(number * 2.1) : number % 5 === 0 ? 10 + Math.floor(number * 0.8) : undefined, config)
  };
  if (useCache) previewCache.set(number, def);
  return def;
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

  isSpawningDone(): boolean {
    return this.active && this.queue.length === 0;
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
}
