import { EnemyKind } from './types';

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
  const tier = Math.max(0, number - 1);
  if (number <= 5) return 1 + tier * 0.035;
  if (number <= 10) return 1.14 + (number - 5) * 0.045;
  if (number <= 20) return 1.36 + (number - 10) * 0.055;
  return 1.91 + (number - 20) * 0.065;
}

function spacingDensityFor(number: number): number {
  const tier = Math.max(0, number - 1);
  if (number <= 5) return 1.04 - tier * 0.025;
  if (number <= 10) return 0.92 - (number - 6) * 0.018;
  if (number <= 20) return 0.82 - (number - 11) * 0.014;
  return Math.max(0.42, 0.68 - (number - 21) * 0.018);
}

function bossHpScaleFor(number: number): number {
  const base = 0.72 + number * 0.038;
  return number >= 30 ? base + 0.65 : base;
}

export function bossKindForWave(number: number): EnemyKind {
  if (number <= 10) return X;
  if (number <= 20) return M;
  if (number <= 30) return R;
  const cycle = Math.floor(number / 10 - 1) % 3;
  return cycle === 0 ? X : cycle === 1 ? M : R;
}

export function generateWave(number: number): WaveDef {
  const cached = previewCache.get(number);
  if (cached) return cached;

  const hpScale = hpScaleFor(number);
  const density = spacingDensityFor(number);
  const bossWave = number % 10 === 0;
  const groups: SpawnGroup[] = [];

  if (bossWave) {
    const bossKind = bossKindForWave(number);
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
    groups.push({ kind: D, count: 5 + Math.floor(number * 1.0), spacing: Math.max(0.36, density), delay: 0, hpScale });

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
    groups: groups.sort((a, b) => a.delay - b.delay),
    isBoss: bossWave,
    bonusMemory: bossWave ? 70 + Math.floor(number * 3.5) : number % 5 === 0 ? 24 + Math.floor(number * 1.5) : undefined
  };
  previewCache.set(number, def);
  return def;
}

export class WaveManager {
  current = 0;
  active = false;
  elapsed = 0;
  private queue: Pending[] = [];
  private maxWave: number | null;

  constructor(maxWave: number | null = null) {
    this.maxWave = maxWave;
  }

  get total() { return this.maxWave ?? Infinity; }
  isLast() { return this.maxWave !== null && this.current >= this.maxWave; }

  setMaxWave(maxWave: number | null): void {
    this.maxWave = maxWave;
  }

  currentDef(): WaveDef | null {
    if (this.current === 0) return null;
    return generateWave(this.current);
  }

  nextDef(): WaveDef | null {
    if (this.maxWave !== null && this.current >= this.maxWave) return null;
    return generateWave(this.current + 1);
  }

  start(n: number) {
    if (this.maxWave !== null && n > this.maxWave) return;
    this.current = n;
    this.active = true;
    this.elapsed = 0;
    this.queue = [];
    const def = generateWave(n);
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
