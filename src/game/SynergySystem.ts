import { SYNERGY_DEFS, type SynergyDef, type SynergyModifiers } from './config';
import type { EmotionType } from './types';

export class SynergySystem {
  private active: SynergyDef[] = [];
  private modifiers = new Map<EmotionType, SynergyModifiers>();

  updateFromTowers(towers: Array<{ type: EmotionType }>): void {
    const present = new Set(towers.map((tower) => tower.type));
    this.active = SYNERGY_DEFS.filter(({ emotions: [a, b] }) => present.has(a) && present.has(b));
    this.rebuildModifiers();
  }

  activeSynergies(): SynergyDef[] {
    return this.active;
  }

  modifiersFor(type: EmotionType): SynergyModifiers {
    return this.modifiers.get(type) ?? {};
  }

  statusText(): string {
    if (this.active.length === 0) return 'NO SYNERGY';
    if (this.active.length === 1) return this.active[0].label;
    return `${this.active.length} SYNERGIES`;
  }

  private rebuildModifiers(): void {
    this.modifiers.clear();
    for (const synergy of this.active) {
      for (const [type, modifiers] of Object.entries(synergy.modifiers) as Array<[EmotionType, SynergyModifiers]>) {
        this.modifiers.set(type, this.merge(this.modifiers.get(type) ?? {}, modifiers));
      }
    }
  }

  private merge(a: SynergyModifiers, b: SynergyModifiers): SynergyModifiers {
    return {
      splashSparkDamageMul: this.max(a.splashSparkDamageMul, b.splashSparkDamageMul),
      splashSparkRadius: this.max(a.splashSparkRadius, b.splashSparkRadius),
      splashSparkCount: this.max(a.splashSparkCount, b.splashSparkCount),
      splashFearChance: this.add(a.splashFearChance, b.splashFearChance),
      splashFearStunDuration: this.max(a.splashFearStunDuration, b.splashFearStunDuration),
      slowDurationAdd: this.add(a.slowDurationAdd, b.slowDurationAdd),
      numbDamageMul: this.mul(a.numbDamageMul, b.numbDamageMul),
      chainRangeAdd: this.add(a.chainRangeAdd, b.chainRangeAdd),
      resonanceDamageMul: this.mul(a.resonanceDamageMul, b.resonanceDamageMul),
      stunDurationAdd: this.add(a.stunDurationAdd, b.stunDurationAdd),
      fastEnemyDamageMul: this.mul(a.fastEnemyDamageMul, b.fastEnemyDamageMul)
    };
  }

  private add(a: number | undefined, b: number | undefined): number | undefined {
    if (a === undefined) return b;
    if (b === undefined) return a;
    return a + b;
  }

  private max(a: number | undefined, b: number | undefined): number | undefined {
    if (a === undefined) return b;
    if (b === undefined) return a;
    return Math.max(a, b);
  }

  private mul(a: number | undefined, b: number | undefined): number | undefined {
    if (a === undefined) return b;
    if (b === undefined) return a;
    return a * b;
  }
}
