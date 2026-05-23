import { EmotionType, EnemyKind, type TowerCategory } from '../game/types';
import type { BalanceState } from '../game/EmotionalBalance';

export const gameLore = {
  shortPitch: 'A psychological neon tower defense where emotional responses defend the Core from mental fractures.',
  coreDescription: 'The Core is the inner signal that holds the run together. If Stability reaches zero, the signal collapses.',
  fracturesDescription: 'Enemies are Fractures: intrusive patterns, pressure spikes and distorted thoughts moving toward the Core.',
  emotionalResponsesDescription: 'Towers are emotional responses. Each one protects differently, but repetition can overload the system.',
  balanceDescription: 'Emotional Balance measures how regulated the build is. Mixed responses create resonance; dominance creates strain.'
} as const;

export const mapLore: Record<string, {
  title: string;
  shortDescription: string;
  gameplayMeaning: string;
  ambientLines: string[];
}> = {
  'fractured-mind': {
    title: 'Fractured Mind',
    shortDescription: 'The first fracture in the Core signal.',
    gameplayMeaning: 'Balanced layout. Learn coverage, upgrades and Resonance.',
    ambientLines: ['The first signal is still readable.', 'Small fractures test the response layer.']
  },
  'silent-lake': {
    title: 'Silent Lake',
    shortDescription: 'A quiet mental surface where pressure travels slowly.',
    gameplayMeaning: 'Long sight lines reward range, slow and scaling damage.',
    ambientLines: ['The lake reflects what the Core cannot process.', 'Stillness buys time, not safety.']
  },
  'panic-circuit': {
    title: 'Panic Circuit',
    shortDescription: 'Emergency signals loop through broken pathways.',
    gameplayMeaning: 'Short sight lines. Coverage, Control and Trust matter.',
    ambientLines: ['Signals jump before they resolve.', 'Every turn is a false alarm.']
  },
  'memory-palace': {
    title: 'Memory Palace',
    shortDescription: 'An archive of old selves and unresolved pressure.',
    gameplayMeaning: 'Constrained placement. Elite pressure rewards Pride and Guilt.',
    ambientLines: ['Old patterns remember the path.', 'The archive opens only under pressure.']
  },
  'burnout-sector': {
    title: 'Burnout Sector',
    shortDescription: 'A scorched mental sector where every route feels urgent.',
    gameplayMeaning: 'Many chokes. Tight placement punishes loose builds.',
    ambientLines: ['The Core is hot to the touch.', 'Signals burn before they stabilize.']
  }
};

export const towerLore: Record<EmotionType, {
  title: string;
  oneLine: string;
  roleLore: string;
  strengthLore: string;
  weaknessLore: string;
  imbalanceWarning: string;
}> = {
  [EmotionType.Anger]: {
    title: 'ANGER',
    oneLine: 'A raw protection response.',
    roleLore: 'Turns pressure into immediate force.',
    strengthLore: 'Strong against packed fractures and early swarms.',
    weaknessLore: 'Weak against isolated bosses without support.',
    imbalanceWarning: 'Too much Anger makes the Core reactive and brittle.'
  },
  [EmotionType.Sadness]: {
    title: 'SADNESS',
    oneLine: 'A slowing response that makes pain visible.',
    roleLore: 'Buys time by stretching the fracture path.',
    strengthLore: 'Strong on long lanes and before damage clusters.',
    weaknessLore: 'Low damage alone and resisted by bosses.',
    imbalanceWarning: 'Too much Sadness leaves the Core waiting instead of acting.'
  },
  [EmotionType.Joy]: {
    title: 'JOY',
    oneLine: 'A bright response that jumps between signals.',
    roleLore: 'Links nearby threats through chain damage.',
    strengthLore: 'Strong when fractures travel in dense groups.',
    weaknessLore: 'Less reliable against single heavy targets.',
    imbalanceWarning: 'Too much Joy scatters focus and weakens deep pressure.'
  },
  [EmotionType.Fear]: {
    title: 'FEAR',
    oneLine: 'A threat response that interrupts movement.',
    roleLore: 'Briefly stops dangerous fractures from slipping through.',
    strengthLore: 'Strong against runners and final-turn leaks.',
    weaknessLore: 'Stun immunity and boss resistance limit repeats.',
    imbalanceWarning: 'Too much Fear locks the build into hesitation.'
  },
  [EmotionType.Calm]: {
    title: 'CALM',
    oneLine: 'A regulating response that steadies nearby emotions.',
    roleLore: 'Improves the tempo of planned clusters.',
    strengthLore: 'Strong in compact builds with upgraded partners.',
    weaknessLore: 'Low direct damage and vulnerable to suppression.',
    imbalanceWarning: 'Too much Calm can become passivity under pressure.'
  },
  [EmotionType.Hope]: {
    title: 'HOPE',
    oneLine: 'A forward signal that cracks numb patterns.',
    roleLore: 'Keeps late threats from becoming inert walls.',
    strengthLore: 'Strong against NumbOne and mixed builds.',
    weaknessLore: 'Needs help clearing large packs.',
    imbalanceWarning: 'Too much Hope can overextend the Core without coverage.'
  },
  [EmotionType.Disgust]: {
    title: 'DISGUST',
    oneLine: 'A rejection response that poisons harmful patterns.',
    roleLore: 'Applies damage over time and weakens armor.',
    strengthLore: 'Strong against heavy fractures with time to tick.',
    weaknessLore: 'Delayed damage can miss urgent leaks.',
    imbalanceWarning: 'Too much Disgust isolates the Core from flexible responses.'
  },
  [EmotionType.Guilt]: {
    title: 'GUILT',
    oneLine: 'A repeating response that marks unresolved pressure.',
    roleLore: 'Builds value through focus and execution.',
    strengthLore: 'Strong against high-HP enemies and bosses.',
    weaknessLore: 'Loses efficiency when forced to switch targets.',
    imbalanceWarning: 'Too much Guilt traps the Core in one pattern.'
  },
  [EmotionType.Trust]: {
    title: 'TRUST',
    oneLine: 'A stabilizing response that shields the Core.',
    roleLore: 'Creates safety margins and anchors fast threats.',
    strengthLore: 'Strong near final turns and against movement tricks.',
    weaknessLore: 'Cannot replace real damage pressure.',
    imbalanceWarning: 'Too much Trust can become dependence without offense.'
  },
  [EmotionType.Shame]: {
    title: 'SHAME',
    oneLine: 'A mirroring response that exposes grouped fractures.',
    roleLore: 'Makes clustered enemies take more punishment.',
    strengthLore: 'Strong with splash, poison and chain damage.',
    weaknessLore: 'Weak when threats are isolated.',
    imbalanceWarning: 'Too much Shame distorts the Core around the crowd.'
  },
  [EmotionType.Love]: {
    title: 'LOVE',
    oneLine: 'A linking response that strengthens compatible pairs.',
    roleLore: 'Turns nearby emotional partners into a stronger system.',
    strengthLore: 'Strong in planned synergy clusters.',
    weaknessLore: 'Low personal damage and placement-sensitive.',
    imbalanceWarning: 'Too much Love can overbind the build to fragile pairs.'
  },
  [EmotionType.Pride]: {
    title: 'PRIDE',
    oneLine: 'A focused response that stands alone.',
    roleLore: 'Converts isolation into single-target force.',
    strengthLore: 'Strong against bosses and heavy checks.',
    weaknessLore: 'Poor wave clear and loses value when crowded.',
    imbalanceWarning: 'Too much Pride isolates the Core from cooperation.'
  }
};

export const enemyLore: Record<EnemyKind, {
  name: string;
  oneLine: string;
  threatDescription: string;
  counterHint: string;
}> = {
  [EnemyKind.Doubtling]: {
    name: 'Doubtling',
    oneLine: 'Small doubts that slip through hesitation.',
    threatDescription: 'Low pressure alone, dangerous in numbers.',
    counterHint: 'Use splash, chain or early coverage.'
  },
  [EnemyKind.PanicRunner]: {
    name: 'Panic Runner',
    oneLine: 'Fast panic impulses that outrun weak coverage.',
    threatDescription: 'Punishes late targeting and open final turns.',
    counterHint: 'Use Sadness, Fear or Trust near leak points.'
  },
  [EnemyKind.Fractureling]: {
    name: 'Fractureling',
    oneLine: 'A clean midweight fracture in the signal.',
    threatDescription: 'Moderate HP with fair bounty.',
    counterHint: 'Basic upgraded damage handles it well.'
  },
  [EnemyKind.PressureKnot]: {
    name: 'Pressure Knot',
    oneLine: 'A slow knot of unresolved pressure.',
    threatDescription: 'Mini-tank that can leak if ignored.',
    counterHint: 'Focus fire or mark it before boss waves.'
  },
  [EnemyKind.GuiltGiant]: {
    name: 'Guilt Giant',
    oneLine: 'Heavy guilt given shape.',
    threatDescription: 'High HP and partial armor against small hits.',
    counterHint: 'Use Disgust, Guilt, Pride or upgraded damage.'
  },
  [EnemyKind.ShameSwarm]: {
    name: 'Shame Swarm',
    oneLine: 'A cluster of brittle self-conscious fragments.',
    threatDescription: 'Weak but dense, and death pulses can hasten nearby enemies.',
    counterHint: 'Splash and Shame punish the cluster.'
  },
  [EnemyKind.EnvyLeech]: {
    name: 'Envy Leech',
    oneLine: 'A siphon that drains calm from nearby support.',
    threatDescription: 'Suppresses Calm support if it reaches the cluster.',
    counterHint: 'Kill before support towers are exposed.'
  },
  [EnemyKind.BurnoutBrute]: {
    name: 'Burnout Brute',
    oneLine: 'A hot, heavy fracture that resists raw force.',
    threatDescription: 'High HP and resistance to Anger/burn.',
    counterHint: 'Use Sadness, Calm-supported damage or poison.'
  },
  [EnemyKind.VoidWraith]: {
    name: 'Void Wraith',
    oneLine: 'A blank signal that jumps past certainty.',
    threatDescription: 'Teleports along the path and punishes late aim.',
    counterHint: 'Use Trust anchors and early coverage.'
  },
  [EnemyKind.Overthinker]: {
    name: 'Overthinker',
    oneLine: 'A looping thought that splits if left alone.',
    threatDescription: 'Channels, then creates extra pressure.',
    counterHint: 'Kill it before the split pulse.'
  },
  [EnemyKind.NumbOne]: {
    name: 'Numb One',
    oneLine: 'A dense numb pattern that resists control.',
    threatDescription: 'Shrugs off slow, stun and most debuffs.',
    counterHint: 'Hope and focused damage crack it fastest.'
  },
  [EnemyKind.Spiral]: {
    name: 'The Spiral',
    oneLine: 'A boss loop that turns thought against itself.',
    threatDescription: 'Disrupts balance and adds recurring pressure.',
    counterHint: 'Use mixed damage and clean add clear.'
  },
  [EnemyKind.Mask]: {
    name: 'The Mask',
    oneLine: 'A boss that adapts to your dominant response.',
    threatDescription: 'Resists the emotion dealing the most damage.',
    counterHint: 'Split boss pressure across several emotions.'
  },
  [EnemyKind.BurnoutBoss]: {
    name: 'The Burnout',
    oneLine: 'A boss collapse of heat and fatigue.',
    threatDescription: 'Overheats tower zones and slows fire rate.',
    counterHint: 'Spread key towers and keep boss damage distributed.'
  }
};

export const bossLore: Partial<Record<EnemyKind, {
  name: string;
  introLine: string;
  mechanicLine: string;
  counterHint: string;
  defeatLine?: string;
}>> = {
  [EnemyKind.Spiral]: {
    name: 'THE SPIRAL',
    introLine: 'The Spiral has entered the thought stream.',
    mechanicLine: 'It disrupts Emotional Balance and spawns doubts while alive.',
    counterHint: 'Keep damage mixed and clear adds before the loop closes.',
    defeatLine: 'The loop breaks. The Core remembers its center.'
  },
  [EnemyKind.Mask]: {
    name: 'THE MASK',
    introLine: 'The Mask is reading your dominant response.',
    mechanicLine: 'It resists your top damage emotion in short windows.',
    counterHint: 'Build several damage emotions and shift pressure with targeting.',
    defeatLine: 'The false face cracks.'
  },
  [EnemyKind.BurnoutBoss]: {
    name: 'THE BURNOUT',
    introLine: 'The Burnout is spreading heat through the response layer.',
    mechanicLine: 'It creates Overheat zones that slow tower fire rate.',
    counterHint: 'Spread key towers and keep boss pressure outside hot zones.',
    defeatLine: 'The heat drops. The signal breathes again.'
  }
};

export const balanceLore: Record<BalanceState, {
  title: string;
  description: string;
  gameplayText: string;
}> = {
  stable: {
    title: 'REGULATED',
    description: 'The Core is regulated. Multiple emotions cooperate.',
    gameplayText: 'Mixed responses can activate Resonance bonuses.'
  },
  tense: {
    title: 'TENSE',
    description: 'One emotional pattern is rising.',
    gameplayText: 'Dominant responses begin losing efficiency.'
  },
  imbalanced: {
    title: 'IMBALANCED',
    description: 'The Core is leaning too hard on one response.',
    gameplayText: 'Enemies adapt and leaks become harder to absorb.'
  },
  overloaded: {
    title: 'OVERLOADED',
    description: 'Emotional overload. Repetition weakens the Core.',
    gameplayText: 'Dominant emotion/category penalties are fully active.'
  }
};

export const waveLoreMessages: Record<number, string> = {
  1: 'Core signal detected. Emotional responses online.',
  5: 'Minor fractures are forming along the path.',
  10: 'The Spiral has entered the thought stream.',
  15: 'The response layer is learning under pressure.',
  20: 'The Mask is adapting to your dominant response.',
  25: 'Old patterns are pressing against the Core.',
  30: 'Stabilization threshold reached. Endless mode can open.',
  40: 'The first deep loop returns with sharper edges.',
  50: 'Deep patterns are no longer defending. They are remembering.',
  60: 'The Core signal bends, but it has not broken.',
  70: 'Pressure is compressing into older shapes.',
  80: 'The response layer is running on memory.',
  90: 'Every pattern now knows where the Core lives.',
  100: 'The Core is past the mapped mind.'
};

export function categoryLoreLabel(category: TowerCategory): string {
  if (category === 'damage') return 'Damage pattern';
  if (category === 'control') return 'Control pattern';
  if (category === 'support') return 'Support pattern';
  return 'Defense pattern';
}
