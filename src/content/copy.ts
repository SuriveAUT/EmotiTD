import { EmotionType } from '../game/types';

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
  noActivePairs: 'No active pairs.',
  upgrades: 'UPGRADES',
  targeting: 'TARGETING',
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
  runLoop: 'RUN LOOP',
  towerRoles: 'TOWER ROLES',
  bossPrimer: 'BOSS ROTATION',
  back: 'BACK',
  bosses: [
    { name: 'WAVE 10  THE SPIRAL', body: 'Disrupts emotional balance and spawns Doubtlings while alive.' },
    { name: 'WAVE 20  THE MASK',   body: 'Resists your top damage emotion in 5s windows. Mix sources.' },
    { name: 'WAVE 30  THE BURNOUT',body: 'Drops Overheat zones that slow nearby tower fire rate.' },
    { name: 'ENDLESS ROTATION',    body: 'After Wave 30 the three boss types rotate every ten waves.' }
  ]
} as const;

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
