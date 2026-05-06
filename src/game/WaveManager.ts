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

const previewCache = new Map<number, WaveDef>();

export function generateWave(number: number): WaveDef {
  const cached = previewCache.get(number);
  if (cached) return cached;

  const tier = Math.max(0, number - 1);
  const hpScale = 1 + tier * 0.055 + Math.floor(number / 10) * 0.08;
  const density = Math.max(0.18, 0.82 - tier * 0.018);
  const bossWave = number % 10 === 0;
  const groups: SpawnGroup[] = [];

  if (bossWave) {
    groups.push(
      { kind: D, count: 8 + Math.floor(number * 0.55), spacing: Math.max(0.28, density * 0.72), delay: 0, hpScale: hpScale * 0.9 },
      { kind: X, count: 1, spacing: 1, delay: 4, hpScale: 0.85 + number * 0.045 },
      { kind: S, count: 10 + Math.floor(number * 0.45), spacing: Math.max(0.14, density * 0.32), delay: 10, hpScale: hpScale * 0.75 }
    );
    if (number >= 20) groups.push({ kind: V, count: 2 + Math.floor(number / 20), spacing: 2.8, delay: 7, hpScale: hpScale * 0.8 });
    if (number >= 30) groups.push({ kind: O, count: 1 + Math.floor(number / 30), spacing: 4.2, delay: 12, hpScale: hpScale * 0.92 });
    if (number >= 30) groups.push({ kind: E, count: 2 + Math.floor(number / 18), spacing: 2.4, delay: 14, hpScale });
    if (number >= 40) groups.push({ kind: N, count: 3 + Math.floor(number / 18), spacing: 1.7, delay: 16, hpScale: hpScale * 0.88 });
  } else {
    groups.push({ kind: D, count: 7 + Math.floor(number * 1.2), spacing: Math.max(0.28, density), delay: 0, hpScale });

    if (number >= 3) {
      groups.push({ kind: P, count: 2 + Math.floor(number * 0.45), spacing: Math.max(0.38, density * 0.9), delay: 3.5, hpScale: hpScale * 0.88 });
    }
    if (number >= 5) {
      groups.push({ kind: G, count: 1 + Math.floor(number / 7), spacing: 3.2, delay: 6, hpScale });
    }
    if (number >= 7) {
      groups.push({ kind: S, count: 8 + Math.floor(number * 0.75), spacing: Math.max(0.14, density * 0.34), delay: 8, hpScale: hpScale * 0.72 });
    }
    if (number >= 6) {
      groups.push({ kind: E, count: 2 + Math.floor(number / 8), spacing: 2.2, delay: 5.5, hpScale: hpScale * 0.9 });
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
