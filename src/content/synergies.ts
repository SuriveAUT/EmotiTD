import { EmotionType } from '../game/types';

/* ------------------------------------------------------------------ *
 *  Synergies
 * ------------------------------------------------------------------ */
export interface SynergyModifiers {
  splashSparkDamageMul?: number;
  splashSparkRadius?: number;
  splashSparkCount?: number;
  splashFearChance?: number;
  splashFearStunDuration?: number;
  slowDurationAdd?: number;
  numbDamageMul?: number;
  chainRangeAdd?: number;
  resonanceDamageMul?: number;
  stunDurationAdd?: number;
  fastEnemyDamageMul?: number;
  poisonDpsMul?: number;
  armorShredAdd?: number;
  guiltMarkAdd?: number;
  guiltExecuteThresholdAdd?: number;
  coreShieldMul?: number;
  trustAnchorDurationAdd?: number;
  shameGroupDamageMul?: number;
  shameGroupRadiusAdd?: number;
  loveDamageMul?: number;
  loveFireRateMul?: number;
  prideIsolationDamageMul?: number;
}

export interface SynergyDef {
  id: string;
  label: string;
  emotions: readonly [EmotionType, EmotionType];
  description: string;
  modifiers: Partial<Record<EmotionType, SynergyModifiers>>;
  activationRadius?: number;
}

export const SYNERGY_DEFS: SynergyDef[] = [
  {
    id: 'anger-joy',
    label: 'RADIANT RAGE',
    emotions: [EmotionType.Anger, EmotionType.Joy],
    description: 'Anger splash hits throw bonus sparks into nearby enemies.',
    activationRadius: 170,
    modifiers: {
      [EmotionType.Anger]: { splashSparkDamageMul: 0.22, splashSparkRadius: 92, splashSparkCount: 2 }
    }
  },
  {
    id: 'anger-fear',
    label: 'PANIC BLAST',
    emotions: [EmotionType.Anger, EmotionType.Fear],
    description: 'Anger splash hits gain a small stun chance.',
    activationRadius: 165,
    modifiers: {
      [EmotionType.Anger]: { splashFearChance: 0.06, splashFearStunDuration: 0.18 }
    }
  },
  {
    id: 'sadness-calm',
    label: 'DEEP STILLNESS',
    emotions: [EmotionType.Sadness, EmotionType.Calm],
    description: 'Sadness slows last longer.',
    activationRadius: 190,
    modifiers: {
      [EmotionType.Sadness]: { slowDurationAdd: 0.15 }
    }
  },
  {
    id: 'sadness-hope',
    label: 'BLUE STAR',
    emotions: [EmotionType.Sadness, EmotionType.Hope],
    description: 'Sadness gains bonus pressure against Numb Ones.',
    activationRadius: 185,
    modifiers: {
      [EmotionType.Sadness]: { numbDamageMul: 1.28 }
    }
  },
  {
    id: 'joy-calm',
    label: 'SOFT ECHO',
    emotions: [EmotionType.Joy, EmotionType.Calm],
    description: 'Joy chains reach farther.',
    activationRadius: 190,
    modifiers: {
      [EmotionType.Joy]: { chainRangeAdd: 34 }
    }
  },
  {
    id: 'joy-hope',
    label: 'BRIGHT RESONANCE',
    emotions: [EmotionType.Joy, EmotionType.Hope],
    description: 'Joy gets stronger during Resonance.',
    activationRadius: 185,
    modifiers: {
      [EmotionType.Joy]: { resonanceDamageMul: 1.08 }
    }
  },
  {
    id: 'fear-calm',
    label: 'QUIET DREAD',
    emotions: [EmotionType.Fear, EmotionType.Calm],
    description: 'Fear stuns last slightly longer.',
    activationRadius: 180,
    modifiers: {
      [EmotionType.Fear]: { stunDurationAdd: 0.04 }
    }
  },
  {
    id: 'fear-hope',
    label: 'COURAGE SPIKE',
    emotions: [EmotionType.Fear, EmotionType.Hope],
    description: 'Fear deals bonus damage to fast enemies.',
    activationRadius: 175,
    modifiers: {
      [EmotionType.Fear]: { fastEnemyDamageMul: 1.32 }
    }
  },
  {
    id: 'disgust-sadness',
    label: 'SOUR RAIN',
    emotions: [EmotionType.Disgust, EmotionType.Sadness],
    description: 'Disgust poison lasts longer and Sadness slows bite longer.',
    modifiers: {
      [EmotionType.Disgust]: { poisonDpsMul: 1.10 },
      [EmotionType.Sadness]: { slowDurationAdd: 0.10 }
    }
  },
  {
    id: 'disgust-fear',
    label: 'REVULSION LOCK',
    emotions: [EmotionType.Disgust, EmotionType.Fear],
    description: 'Disgust shreds armor harder; Fear holds targets longer.',
    modifiers: {
      [EmotionType.Disgust]: { armorShredAdd: 0.04 },
      [EmotionType.Fear]: { stunDurationAdd: 0.04 }
    }
  },
  {
    id: 'guilt-anger',
    label: 'BLAME BURST',
    emotions: [EmotionType.Guilt, EmotionType.Anger],
    description: 'Guilt marks stack slightly harder; Anger keeps splash pressure.',
    modifiers: {
      [EmotionType.Guilt]: { guiltMarkAdd: 0.03 },
      [EmotionType.Anger]: { splashSparkDamageMul: 0.14, splashSparkRadius: 74, splashSparkCount: 1 }
    }
  },
  {
    id: 'guilt-hope',
    label: 'REDEMPTION',
    emotions: [EmotionType.Guilt, EmotionType.Hope],
    description: 'Guilt executes slightly earlier and Hope gains resonance bite.',
    modifiers: {
      [EmotionType.Guilt]: { guiltExecuteThresholdAdd: 0.025 },
      [EmotionType.Hope]: { resonanceDamageMul: 1.05 }
    }
  },
  {
    id: 'trust-calm',
    label: 'SAFE HARBOR',
    emotions: [EmotionType.Trust, EmotionType.Calm],
    description: 'Trust shields more while Calm improves support tempo.',
    modifiers: {
      [EmotionType.Trust]: { coreShieldMul: 1.18 },
      [EmotionType.Calm]: { slowDurationAdd: 0.2 }
    }
  },
  {
    id: 'trust-joy',
    label: 'OPEN HAND',
    emotions: [EmotionType.Trust, EmotionType.Joy],
    description: 'Trust anchors longer and Joy chains reach farther.',
    modifiers: {
      [EmotionType.Trust]: { trustAnchorDurationAdd: 0.25 },
      [EmotionType.Joy]: { chainRangeAdd: 18 }
    }
  },
  {
    id: 'shame-fear',
    label: 'SOCIAL DREAD',
    emotions: [EmotionType.Shame, EmotionType.Fear],
    description: 'Shame exposes groups harder while Fear holds them in place.',
    modifiers: {
      [EmotionType.Shame]: { shameGroupDamageMul: 1.12 },
      [EmotionType.Fear]: { stunDurationAdd: 0.04 }
    }
  },
  {
    id: 'shame-disgust',
    label: 'SOUR SPOTLIGHT',
    emotions: [EmotionType.Shame, EmotionType.Disgust],
    description: 'Grouped targets take stronger Shame pressure and longer poison.',
    activationRadius: 175,
    modifiers: {
      [EmotionType.Shame]: { shameGroupRadiusAdd: 14 },
      [EmotionType.Disgust]: { poisonDpsMul: 1.08 }
    }
  },
  {
    id: 'love-joy',
    label: 'BRIGHT BOND',
    emotions: [EmotionType.Love, EmotionType.Joy],
    description: 'Love links add damage and Joy chains reach farther.',
    activationRadius: 220,
    modifiers: {
      [EmotionType.Love]: { loveDamageMul: 1.08 },
      [EmotionType.Joy]: { chainRangeAdd: 16 }
    }
  },
  {
    id: 'love-trust',
    label: 'SECURE BOND',
    emotions: [EmotionType.Love, EmotionType.Trust],
    description: 'Love links pulse faster and Trust shields harder.',
    activationRadius: 220,
    modifiers: {
      [EmotionType.Love]: { loveFireRateMul: 0.94 },
      [EmotionType.Trust]: { coreShieldMul: 1.10 }
    }
  },
  {
    id: 'pride-guilt',
    label: 'PROVING POINT',
    emotions: [EmotionType.Pride, EmotionType.Guilt],
    description: 'Pride gets more isolated damage while Guilt marks hit harder.',
    activationRadius: 145,
    modifiers: {
      [EmotionType.Pride]: { prideIsolationDamageMul: 1.12 },
      [EmotionType.Guilt]: { guiltMarkAdd: 0.02 }
    }
  },
  {
    id: 'pride-love',
    label: 'SELF WORTH',
    emotions: [EmotionType.Pride, EmotionType.Love],
    description: 'Pride boss shots and Love links both strengthen.',
    activationRadius: 145,
    modifiers: {
      [EmotionType.Pride]: { prideIsolationDamageMul: 1.08 },
      [EmotionType.Love]: { loveDamageMul: 1.06 }
    }
  }
];
