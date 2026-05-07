import { BALANCE } from './config';
import { EMOTION_TYPES, EmotionType } from './types';

export class EmotionalBalance {
  private synergyPowerModifier = 1;
  private singleEmotionPenaltyModifier = 1;
  readonly counts: Record<EmotionType, number> = {
    [EmotionType.Anger]: 0,
    [EmotionType.Sadness]: 0,
    [EmotionType.Joy]: 0,
    [EmotionType.Fear]: 0,
    [EmotionType.Calm]: 0,
    [EmotionType.Hope]: 0,
    [EmotionType.Disgust]: 0,
    [EmotionType.Guilt]: 0,
    [EmotionType.Trust]: 0,
    [EmotionType.Shame]: 0,
    [EmotionType.Love]: 0,
    [EmotionType.Pride]: 0
  };

  add(t: EmotionType) { this.counts[t]++; }
  remove(t: EmotionType) {
    if (this.counts[t] > 0) this.counts[t]--;
  }

  setChallengeModifiers(synergyPowerModifier = 1, singleEmotionPenaltyModifier = 1): void {
    this.synergyPowerModifier = synergyPowerModifier;
    this.singleEmotionPenaltyModifier = singleEmotionPenaltyModifier;
  }

  uniqueCount(): number {
    let n = 0;
    for (const k of EMOTION_TYPES) {
      if (this.counts[k] > 0) n++;
    }
    return n;
  }

  totalTowers(): number {
    let n = 0;
    for (const k of EMOTION_TYPES) n += this.counts[k];
    return n;
  }

  isResonating(): boolean {
    return this.uniqueCount() >= BALANCE.resonanceUniqueThreshold;
  }

  /** dominant type among placed towers, or null if no clear majority */
  dominant(): EmotionType | null {
    let best: EmotionType | null = null;
    let bestN = 0;
    for (const k of EMOTION_TYPES) {
      if (this.counts[k] > bestN) { bestN = this.counts[k]; best = k; }
    }
    return bestN >= BALANCE.imbalanceCount ? best : null;
  }

  /** damage multiplier applied to towers of `type` */
  damageMulFor(type: EmotionType): number {
    let mul = 1;
    if (this.isResonating()) mul *= 1 + ((BALANCE.resonanceDamageMult - 1) * this.synergyPowerModifier);
    if (this.dominant() === type) mul *= 1 - ((1 - BALANCE.imbalanceDamageMult) * this.singleEmotionPenaltyModifier);
    return mul;
  }

  /** fire rate multiplier (lower = faster) for resonance */
  fireRateMul(): number {
    return this.isResonating()
      ? 1 - ((1 - BALANCE.resonanceFireRateMult) * this.synergyPowerModifier)
      : 1;
  }
}
