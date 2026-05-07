import { HUD_COPY, SYNERGY_DEFS, type SynergyDef, type SynergyModifiers } from './config';
import type { EmotionType } from './types';

export class SynergySystem {
  private active: SynergyDef[] = [];
  private modifiers = new Map<EmotionType, SynergyModifiers>();
  private powerModifier = 1;

  setPowerModifier(powerModifier = 1): void {
    this.powerModifier = powerModifier;
    this.rebuildModifiers();
  }

  updateFromTowers(towers: Array<{ type: EmotionType; x: number; y: number }>): void {
    const active: SynergyDef[] = [];
    for (const synergy of SYNERGY_DEFS) {
      const radius = synergy.activationRadius ?? 170;
      if (this.hasLocalPair(towers, synergy.emotions[0], synergy.emotions[1], radius)) {
        active.push(synergy);
      }
    }
    this.active = active;
    this.rebuildModifiers();
  }

  private hasLocalPair(
    towers: Array<{ type: EmotionType; x: number; y: number }>,
    emotionA: EmotionType,
    emotionB: EmotionType,
    radius: number
  ): boolean {
    const aTowers = towers.filter(t => t.type === emotionA);
    const bTowers = towers.filter(t => t.type === emotionB);
    if (aTowers.length === 0 || bTowers.length === 0) return false;
    
    const rSq = radius * radius;
    for (const a of aTowers) {
      for (const b of bTowers) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy <= rSq) return true;
      }
    }
    return false;
  }

  activeSynergies(): SynergyDef[] {
    return this.active;
  }

  activeCount(): number {
    return this.active.length;
  }

  modifiersFor(type: EmotionType): SynergyModifiers {
    return this.modifiers.get(type) ?? {};
  }

  statusText(): string {
    if (this.active.length === 0) return HUD_COPY.noSynergy;
    if (this.active.length === 1) return this.active[0].label;
    return `${this.active.length} SYNERGIES`;
  }

  private rebuildModifiers(): void {
    this.modifiers.clear();
    for (const synergy of this.active) {
      for (const [type, modifiers] of Object.entries(synergy.modifiers) as Array<[EmotionType, SynergyModifiers]>) {
        this.modifiers.set(type, this.merge(this.modifiers.get(type) ?? {}, this.scaleModifiers(modifiers)));
      }
    }
  }

  private scaleModifiers(modifiers: SynergyModifiers): SynergyModifiers {
    const scale = this.powerModifier;
    return {
      splashSparkDamageMul: this.scaleMultiplier(modifiers.splashSparkDamageMul, scale),
      splashSparkRadius: this.scaleAdd(modifiers.splashSparkRadius, scale),
      splashSparkCount: modifiers.splashSparkCount,
      splashFearChance: this.scaleAdd(modifiers.splashFearChance, scale),
      splashFearStunDuration: this.scaleAdd(modifiers.splashFearStunDuration, scale),
      slowDurationAdd: this.scaleAdd(modifiers.slowDurationAdd, scale),
      numbDamageMul: this.scaleMultiplier(modifiers.numbDamageMul, scale),
      chainRangeAdd: this.scaleAdd(modifiers.chainRangeAdd, scale),
      resonanceDamageMul: this.scaleMultiplier(modifiers.resonanceDamageMul, scale),
      stunDurationAdd: this.scaleAdd(modifiers.stunDurationAdd, scale),
      fastEnemyDamageMul: this.scaleMultiplier(modifiers.fastEnemyDamageMul, scale),
      poisonDpsMul: this.scaleMultiplier(modifiers.poisonDpsMul, scale),
      armorShredAdd: this.scaleAdd(modifiers.armorShredAdd, scale),
      guiltMarkAdd: this.scaleAdd(modifiers.guiltMarkAdd, scale),
      guiltExecuteThresholdAdd: this.scaleAdd(modifiers.guiltExecuteThresholdAdd, scale),
      coreShieldMul: this.scaleMultiplier(modifiers.coreShieldMul, scale),
      trustAnchorDurationAdd: this.scaleAdd(modifiers.trustAnchorDurationAdd, scale),
      shameGroupDamageMul: this.scaleMultiplier(modifiers.shameGroupDamageMul, scale),
      shameGroupRadiusAdd: this.scaleAdd(modifiers.shameGroupRadiusAdd, scale),
      loveDamageMul: this.scaleMultiplier(modifiers.loveDamageMul, scale),
      loveFireRateMul: this.scaleFireRate(modifiers.loveFireRateMul, scale),
      prideIsolationDamageMul: this.scaleMultiplier(modifiers.prideIsolationDamageMul, scale)
    };
  }

  private scaleAdd(value: number | undefined, scale: number): number | undefined {
    return value === undefined ? undefined : value * scale;
  }

  private scaleMultiplier(value: number | undefined, scale: number): number | undefined {
    return value === undefined ? undefined : 1 + ((value - 1) * scale);
  }

  private scaleFireRate(value: number | undefined, scale: number): number | undefined {
    return value === undefined ? undefined : 1 - ((1 - value) * scale);
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
      fastEnemyDamageMul: this.mul(a.fastEnemyDamageMul, b.fastEnemyDamageMul),
      poisonDpsMul: this.mul(a.poisonDpsMul, b.poisonDpsMul),
      armorShredAdd: this.add(a.armorShredAdd, b.armorShredAdd),
      guiltMarkAdd: this.add(a.guiltMarkAdd, b.guiltMarkAdd),
      guiltExecuteThresholdAdd: this.add(a.guiltExecuteThresholdAdd, b.guiltExecuteThresholdAdd),
      coreShieldMul: this.mul(a.coreShieldMul, b.coreShieldMul),
      trustAnchorDurationAdd: this.add(a.trustAnchorDurationAdd, b.trustAnchorDurationAdd),
      shameGroupDamageMul: this.mul(a.shameGroupDamageMul, b.shameGroupDamageMul),
      shameGroupRadiusAdd: this.add(a.shameGroupRadiusAdd, b.shameGroupRadiusAdd),
      loveDamageMul: this.mul(a.loveDamageMul, b.loveDamageMul),
      loveFireRateMul: this.mul(a.loveFireRateMul, b.loveFireRateMul),
      prideIsolationDamageMul: this.mul(a.prideIsolationDamageMul, b.prideIsolationDamageMul)
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
