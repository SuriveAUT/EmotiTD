import { EmotionType, EnemyKind } from '../game/types';

export const EMOTION_LABEL: Record<EmotionType, string> = {
  [EmotionType.Anger]: 'ANGER',
  [EmotionType.Sadness]: 'SADNESS',
  [EmotionType.Joy]: 'JOY',
  [EmotionType.Fear]: 'FEAR',
  [EmotionType.Calm]: 'CALM',
  [EmotionType.Hope]: 'HOPE',
  [EmotionType.Disgust]: 'DISGUST',
  [EmotionType.Guilt]: 'GUILT',
  [EmotionType.Trust]: 'TRUST',
  [EmotionType.Shame]: 'SHAME',
  [EmotionType.Love]: 'LOVE',
  [EmotionType.Pride]: 'PRIDE'
};

export const TOWER_BAR_COPY = {
  startWave: 'START WAVE',
  startKey: 'SPACE',
  pause: 'PAUSE',
  resume: 'RESUME',
  autoOn: 'AUTO ON',
  autoOff: 'AUTO OFF',
  restart: 'RESTART',
  subLabel: {
    [EmotionType.Anger]: 'SPLASH',
    [EmotionType.Sadness]: 'RANGE / SLOW',
    [EmotionType.Joy]: 'CHAIN',
    [EmotionType.Fear]: 'STUN',
    [EmotionType.Calm]: 'SUPPORT',
    [EmotionType.Hope]: 'ANTI-NUMB',
    [EmotionType.Disgust]: 'POISON',
    [EmotionType.Guilt]: 'MARK',
    [EmotionType.Trust]: 'SHIELD',
    [EmotionType.Shame]: 'GROUP DEBUFF',
    [EmotionType.Love]: 'LINK BUFF',
    [EmotionType.Pride]: 'BOSS DPS'
  } satisfies Record<EmotionType, string>
} as const;

export const TOWER_HELP_COPY = {
  [EmotionType.Anger]: {
    role: 'Cluster damage starter',
    strengths: ['Clears packed weak enemies', 'Great on bends and choke points'],
    weaknesses: ['Short range', 'Falls off against isolated bosses without upgrades'],
    placement: 'Place close to tight turns where splash can hit the same pack twice.'
  },
  [EmotionType.Sadness]: {
    role: 'Long-range slow control',
    strengths: ['Buys time across long lanes', 'Helps damage towers finish rushes'],
    weaknesses: ['Low damage alone', 'Bosses and NumbOne resist control'],
    placement: 'Use early sight lines before your main damage cluster.'
  },
  [EmotionType.Joy]: {
    role: 'Chain damage',
    strengths: ['Punishes dense waves', 'Excellent when lanes run close together'],
    weaknesses: ['Needs nearby targets', 'Less focused boss pressure'],
    placement: 'Place where multiple enemies are usually inside chain range.'
  },
  [EmotionType.Fear]: {
    role: 'Stun control',
    strengths: ['Interrupts dangerous runners', 'Holds targets inside splash zones'],
    weaknesses: ['Stun has immunity windows', 'Boss stun duration is heavily resisted'],
    placement: 'Use near leak points or just before high-damage towers.'
  },
  [EmotionType.Calm]: {
    role: 'Local tempo support',
    strengths: ['Improves nearby tower fire rate', 'Great in compact clusters'],
    weaknesses: ['Very low damage', 'Support can be suppressed by some enemies'],
    placement: 'Put it in the middle of towers you plan to keep upgrading.'
  },
  [EmotionType.Hope]: {
    role: 'Anti-Numb support damage',
    strengths: ['Strong into NumbOne', 'Fits mixed emotion builds'],
    weaknesses: ['Not a pure wave clearer', 'Needs help against large packs'],
    placement: 'Cover lanes where NumbOne appears and pair with other damage types.'
  },
  [EmotionType.Disgust]: {
    role: 'Poison and armor shred',
    strengths: ['Good against high-HP enemies', 'Damage keeps ticking after hits'],
    weaknesses: ['Delayed damage', 'Needs time on target'],
    placement: 'Place early in the path so poison and shred have time to work.'
  },
  [EmotionType.Guilt]: {
    role: 'Mark scaling control',
    strengths: ['Repeated hits punish tough targets', 'Can execute low-HP enemies'],
    weaknesses: ['Needs focus fire', 'Less efficient when constantly switching targets'],
    placement: 'Use targeting to keep marks on giants, bosses, or other high-HP threats.'
  },
  [EmotionType.Trust]: {
    role: 'Core defense and anchor',
    strengths: ['Adds Core shield', 'Counters PanicRunner and VoidWraith movement'],
    weaknesses: ['Low damage', 'Cannot replace real wave clear'],
    placement: 'Place where it can shoot often while covering fast enemy lanes.'
  },
  [EmotionType.Shame]: {
    role: 'Grouped enemy debuff',
    strengths: ['Boosts damage into packed groups', 'Works well with splash and poison'],
    weaknesses: ['Weaker against isolated targets', 'Needs enemies grouped together'],
    placement: 'Aim at lane sections where waves compress naturally.'
  },
  [EmotionType.Love]: {
    role: 'Synergy link support',
    strengths: ['Buffs compatible nearby towers', 'Rewards planned tower pairs'],
    weaknesses: ['Low personal damage', 'Needs correct partners within link radius'],
    placement: 'Place between two synergy partners instead of at the lane edge.'
  },
  [EmotionType.Pride]: {
    role: 'Isolated boss DPS',
    strengths: ['High single-target damage', 'Strong when isolated from other towers'],
    weaknesses: ['Poor wave clear', 'Loses value if crowded by other towers'],
    placement: 'Give it a clean lane and keep nearby build tiles open when possible.'
  }
} satisfies Record<EmotionType, {
  role: string;
  strengths: string[];
  weaknesses: string[];
  placement: string;
}>;

export const BOSS_WARNING_COPY: Partial<Record<EnemyKind, {
  name: string;
  mechanic: string;
  counter: string;
}>> = {
  [EnemyKind.Spiral]: {
    name: 'THE SPIRAL',
    mechanic: 'Disrupts emotional balance and spawns Doubtlings while alive.',
    counter: 'Bring mixed damage, kill adds quickly, and avoid relying on one emotion cluster.'
  },
  [EnemyKind.Mask]: {
    name: 'THE MASK',
    mechanic: 'Temporarily resists the emotion currently dealing the most damage.',
    counter: 'Split boss damage across multiple emotions and switch pressure with targeting.'
  },
  [EnemyKind.BurnoutBoss]: {
    name: 'THE BURNOUT',
    mechanic: 'Creates Overheat zones that slow tower fire rate nearby.',
    counter: 'Spread key towers out and keep boss damage outside the hottest zones.'
  }
};

export const SIDE_PANEL_COPY = {
  placementMode: 'BUILD MODE',
  placementHelp: 'Click an open tile to build.\nEsc or right click cancels.',
  notEnoughMemory: 'Not enough Memory.',
  selectedTowerSuffix: 'TOWER',
  selected: 'SELECTED',
  nextWave: 'NEXT WAVE',
  currentWave: 'CURRENT WAVE',
  noWaveData: 'No wave data',
  enemies: 'ENEMIES',
  bonusOnClear: (amount: number) => `+${amount} CLEAR BONUS`,
  victoryTitle: 'VICTORY',
  victoryBody: 'Core defended.\nRestart for a new run.',
  defeatTitle: 'CORE BROKEN',
  defeatBody: (wave: number) => `The Core fell.\nReached Wave: ${wave}\nRestart to try again.`,
  statCost: 'COST',
  statDamage: 'DAMAGE',
  statRange: 'RANGE',
  statFireRate: 'FIRE RATE',
  statTempo: 'tempo',
  statPoison: 'POISON',
  synergy: 'SYNERGY',
  activeSynergies: 'ACTIVE SYNERGIES',
  noActivePairs: 'Place matching emotions nearby to activate local synergies.',
  upgrades: 'UPGRADES',
  targeting: 'TARGETING',
  tips: 'TIPS',
  sellMemory: (refund: number) => `SELL  +${refund} MEMORY`,
  lockedByOtherPath: 'LOCKED BY OTHER PATH',
  levelMax: (level: string) => `LEVEL ${level}  -  MAX`,
  levelCost: (level: string, cost: number) => `LEVEL ${level}  -  ${cost} MEMORY`
} as const;

export const HUD_COPY = {
  coreStability: 'CORE STABILITY',
  memory: 'MEMORY',
  score: 'SCORE',
  wave: 'WAVE',
  emotionalBalance: 'EMOTIONAL BALANCE',
  status: 'STATUS',
  noSynergy: 'NO SYNERGY',
  resonance: 'RESONANCE',
  imbalance: 'IMBALANCE',
  neutral: 'NEUTRAL',
  building: 'BUILDING',
  paused: 'PAUSED',
  nextWave: 'NEXT WAVE',
  autoOff: 'AUTO OFF',
  spaceToStart: 'SPACE TO START',
  spiralDisruption: 'SPIRAL DISRUPTION'
} as const;

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to EMOTICORE TD',
    body: 'Your Core is breaking. Build emotion towers, hold the path, and keep Stability above zero.',
    hint: 'This short tutorial follows your first run.',
    nextLabel: 'BEGIN',
    advanceMode: 'button'
  },
  {
    id: 'select-anger',
    title: 'Select Anger',
    body: 'Anger is a cheap splash tower and the fastest first defense.',
    hint: 'Click the ANGER tower card in the bottom bar.',
    advanceMode: 'event'
  },
  {
    id: 'place-anger-tower',
    title: 'Place the Tower',
    body: 'Build on open grid cells near the path. Placement matters.',
    hint: 'Click a free build tile to place Anger.',
    advanceMode: 'event'
  },
  {
    id: 'start-wave',
    title: 'Start the Wave',
    body: 'Waves send thoughts toward the Core. Start manually or press Space.',
    hint: 'Click START WAVE or press Space.',
    advanceMode: 'event'
  },
  {
    id: 'place-second-emotion',
    title: 'Add an Emotion',
    body: 'Sadness slows, Joy chains, Fear stuns, Calm supports, Hope breaks numb enemies. New towers add group debuffs, links and boss damage.',
    hint: 'Place any second emotion tower.',
    advanceMode: 'event'
  },
  {
    id: 'explain-resonance',
    title: 'Resonance',
    body: 'Mix three unique emotions for Resonance. Too much of one emotion creates Imbalance.',
    hint: 'Watch the Emotional Balance dots.',
    nextLabel: 'GOT IT',
    advanceMode: 'button'
  },
  {
    id: 'select-tower',
    title: 'Select a Tower',
    body: 'Selecting a built tower opens stats, targeting and upgrades.',
    hint: 'Click any tower on the field.',
    advanceMode: 'event'
  },
  {
    id: 'upgrade-tower',
    title: 'Upgrade',
    body: 'Upgrades specialize a tower into one path.',
    hint: 'Buy any available upgrade in the right panel.',
    advanceMode: 'event'
  },
  {
    id: 'finish',
    title: 'Tutorial Complete',
    body: 'Build, start waves, balance emotions, upgrade, and protect the Core.',
    hint: 'Good luck.',
    nextLabel: 'FINISH',
    advanceMode: 'button'
  }
] as const;

export const HOW_TO_PLAY_COPY = {
  title: 'HOW TO PLAY',
  intro: 'Build, balance, upgrade, survive. Pick from 3 maps, 12 towers and rotating bosses.',
  runLoop: 'CORE SYSTEMS',
  towerRoles: 'TOWER ROLES',
  bossPrimer: 'BOSS ROTATION',
  back: 'BACK',
  systems: [
    { name: 'MEMORY', body: 'Currency for towers and upgrades. Earn it from kills, wave clears and selling.' },
    { name: 'STABILITY', body: 'Your Core health. Leaks reduce it; Trust and some upgrades help protect it.' },
    { name: 'SYNERGIES', body: 'Compatible nearby emotions activate local bonuses. Mix types around key lanes.' },
    { name: 'UPGRADE PATHS', body: 'Each tower commits to one path. Upgrade fewer important towers before overbuilding.' },
    { name: 'TARGETING', body: 'Selected towers can aim First, Last, Strongest, Weakest, Fastest or Boss.' },
    { name: 'SELLING', body: 'Sell misplaced towers for partial Memory when a lane plan changes.' },
    { name: 'BOSSES', body: 'Every tenth wave brings a rotating boss with a visible warning before combat.' },
    { name: 'CC RESISTANCE', body: 'Slow and stun remain useful, but elites, NumbOne and bosses resist control.' }
  ],
  bosses: [
    { name: 'WAVE 10  THE SPIRAL', body: 'Disrupts emotional balance and spawns Doubtlings while alive.' },
    { name: 'WAVE 20  THE MASK',   body: 'Resists your top damage emotion in 5s windows. Mix sources.' },
    { name: 'WAVE 30  THE BURNOUT',body: 'Drops Overheat zones that slow nearby tower fire rate.' },
    { name: 'ENDLESS ROTATION',    body: 'After Wave 30 the three boss types rotate every ten waves.' }
  ]
} as const;

export const MAP_MODIFIER_COPY: Record<string, { summary: string; modifiers: string[] }> = {
  'fractured-mind': {
    summary: 'Tutorial lane. Two long sweeps.',
    modifiers: ['Open build space', 'Forgiving sight lines']
  },
  'silent-lake': {
    summary: 'Calm switchback with long sight lines.',
    modifiers: ['Rewards range and scaling', 'Few hard turns']
  },
  'panic-circuit': {
    summary: 'Short glitch hops with ten direction changes.',
    modifiers: ['Coverage > range', 'Higher rush pressure']
  },
  'memory-palace': {
    summary: 'Nested rectangles. Path doubles back on itself.',
    modifiers: ['Constrained placement', 'Long total length']
  },
  'burnout-sector': {
    summary: 'Vertical tooth comb with smouldering chokes.',
    modifiers: ['Many fast chokes', 'Punishes loose builds']
  }
};

export const MENU_COPY = {
  title: 'EMOTICORE TD',
  subtitle: 'Defend the Core of a breaking mind.',
  selectMap: 'SELECT MAP',
  startRun: 'START RUN',
  howToPlay: 'HOW TO PLAY',
  settings: 'SETTINGS',
  credits: 'CREDITS',
  resetSave: 'RESET SAVE',
  signal: 'NEURAL CORE SIGNAL UNSTABLE',
  resetTitle: 'RESET SAVE?',
  resetBody: 'This clears best wave, score and settings.',
  confirm: 'CONFIRM',
  cancel: 'CANCEL',
  best: (wave: number, score: number) => `BEST WAVE  ${wave}      BEST SCORE  ${score}`
} as const;

export const SETTINGS_COPY = {
  title: 'SETTINGS',
  muted: 'MUTED',
  screenShake: 'SCREEN SHAKE',
  quality: 'QUALITY',
  back: 'BACK',
  best: (wave: number, score: number) => `BEST WAVE ${wave}  /  BEST SCORE ${score}`
} as const;

export const CREDITS_COPY = {
  title: 'CREDITS',
  back: 'BACK',
  lines: [
    'EMOTICORE TD',
    'Design, code and emotional systems prototype.',
    'Built with TypeScript, Vite and PixiJS.',
    'Designed by Dominik Fers with AI agent support.',
    'Alpha build, focused on the playable core loop.',
    '\n'
  ]
} as const;
