export type AudioKind = 'sfx' | 'music';

export interface AudioAsset {
  kind: AudioKind;
  name: string;
  src: string;
  gain: number;
  loop: boolean;
  preload: 'auto' | 'metadata' | 'none';
  credit: string;
  source: string;
  sourceFile: string;
}

interface AudioAssetConfig {
  file: string;
  gain: number;
  loop?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  credit: string;
  source: string;
  sourceFile: string;
}

const KENNEY = 'Kenney CC0';
const OPENGAMEART = 'OpenGameArt CC0';

const audioLibrary: Record<AudioKind, Record<string, AudioAssetConfig>> = {
  sfx: {
    'ui-click': {
      file: 'ui-click.ogg',
      gain: 0.52,
      credit: KENNEY,
      source: 'Interface Sounds',
      sourceFile: 'click_002.ogg'
    },
    'tower-place': {
      file: 'tower-place.ogg',
      gain: 0.38,
      credit: KENNEY,
      source: 'Digital Audio',
      sourceFile: 'phaseJump2.ogg'
    },
    'tower-upgrade': {
      file: 'tower-upgrade.ogg',
      gain: 0.38,
      credit: KENNEY,
      source: 'Digital Audio',
      sourceFile: 'powerUp7.ogg'
    },
    'tower-sell': {
      file: 'tower-sell.ogg',
      gain: 0.48,
      credit: KENNEY,
      source: 'Interface Sounds',
      sourceFile: 'back_002.ogg'
    },
    'core-hit': {
      file: 'core-hit.ogg',
      gain: 0.6,
      credit: KENNEY,
      source: 'Sci-fi Sounds',
      sourceFile: 'impactMetal_002.ogg'
    },
    'wave-start': {
      file: 'wave-start.ogg',
      gain: 0.34,
      credit: KENNEY,
      source: 'Digital Audio',
      sourceFile: 'threeTone1.ogg'
    },
    'wave-complete': {
      file: 'wave-complete.ogg',
      gain: 0.33,
      credit: KENNEY,
      source: 'Interface Sounds',
      sourceFile: 'confirmation_001.ogg'
    },
    victory: {
      file: 'victory.ogg',
      gain: 0.52,
      credit: KENNEY,
      source: 'Music Jingles',
      sourceFile: 'jingles_STEEL07.ogg'
    },
    'game-over': {
      file: 'game-over.ogg',
      gain: 0.44,
      credit: KENNEY,
      source: 'Music Jingles',
      sourceFile: 'jingles_HIT16.ogg'
    }
  },
  music: {
    'menu-theme': {
      file: 'menu-theme.ogg',
      gain: 0.48,
      loop: true,
      preload: 'auto',
      credit: OPENGAMEART,
      source: 'Heavenly Loop by isaiah658',
      sourceFile: 'Heavenly Loop.ogg'
    },
    'run-ambient': {
      file: 'run-ambient.ogg',
      gain: 0.18,
      loop: true,
      preload: 'auto',
      credit: OPENGAMEART,
      source: 'Calm Track by pmiller',
      sourceFile: 'calm_track-loop.ogg'
    },
    victory: {
      file: 'victory.ogg',
      gain: 0.4,
      loop: false,
      preload: 'auto',
      credit: KENNEY,
      source: 'Music Jingles',
      sourceFile: 'jingles_STEEL14.ogg'
    },
    'game-over': {
      file: 'game-over.ogg',
      gain: 0.38,
      loop: false,
      preload: 'auto',
      credit: KENNEY,
      source: 'Music Jingles',
      sourceFile: 'jingles_HIT05.ogg'
    }
  }
};

export function getAudioAsset(kind: AudioKind, name: string): AudioAsset | null {
  const config = audioLibrary[kind][name];
  if (!config) return null;

  return {
    kind,
    name,
    src: publicAudioSrc(kind, config.file),
    gain: config.gain,
    loop: config.loop ?? false,
    preload: config.preload ?? 'metadata',
    credit: config.credit,
    source: config.source,
    sourceFile: config.sourceFile
  };
}

export function listAudioAssets(): AudioAsset[] {
  return (Object.keys(audioLibrary) as AudioKind[]).flatMap((kind) =>
    Object.keys(audioLibrary[kind])
      .map((name) => getAudioAsset(kind, name))
      .filter((asset): asset is AudioAsset => asset !== null)
  );
}

function publicAudioSrc(kind: AudioKind, file: string): string {
  return `${publicBase()}audio/${kind}/${file}`;
}

function publicBase(): string {
  if (typeof window === 'undefined') return '/';
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}
