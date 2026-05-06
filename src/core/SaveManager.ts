export type QualitySetting = 'low' | 'medium' | 'high';

export interface SaveSettings {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  quality: QualitySetting;
  screenShake: boolean;
  autoStart: boolean;
}

export interface SaveData {
  version: number;
  bestWave: number;
  bestScore: number;
  tutorialCompleted: boolean;
  settings: SaveSettings;
}

const SAVE_KEY = 'emoticore-td-save';
const SAVE_VERSION = 1;

const DEFAULT_SAVE_DATA: SaveData = {
  version: SAVE_VERSION,
  bestWave: 0,
  bestScore: 0,
  tutorialCompleted: false,
  settings: {
    musicVolume: 0.8,
    sfxVolume: 0.8,
    muted: false,
    quality: 'high',
    screenShake: true,
    autoStart: true
  }
};

type PartialSaveSettings = Partial<SaveSettings>;

export class SaveManager {
  private data: SaveData = structuredClone(DEFAULT_SAVE_DATA);

  load(): SaveData {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) {
        this.data = structuredClone(DEFAULT_SAVE_DATA);
        return this.getData();
      }

      const parsed = JSON.parse(raw) as Partial<SaveData>;
      this.data = this.normalize(parsed);
      this.save();
      return this.getData();
    } catch {
      this.data = structuredClone(DEFAULT_SAVE_DATA);
      return this.getData();
    }
  }

  save(data: SaveData = this.data): void {
    this.data = this.normalize(data);
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  updateSettings(settings: Partial<SaveSettings>): SaveData {
    this.data.settings = {
      ...this.data.settings,
      ...settings
    };
    this.save();
    return this.getData();
  }

  reset(): SaveData {
    this.data = structuredClone(DEFAULT_SAVE_DATA);
    this.save();
    return this.getData();
  }

  recordRun(wave: number, score: number): SaveData {
    this.data.bestWave = Math.max(this.data.bestWave, Math.max(0, Math.floor(wave)));
    this.data.bestScore = Math.max(this.data.bestScore, Math.max(0, Math.floor(score)));
    this.save();
    return this.getData();
  }

  completeTutorial(): SaveData {
    this.data.tutorialCompleted = true;
    this.save();
    return this.getData();
  }

  getData(): SaveData {
    return structuredClone(this.data);
  }

  private normalize(data: Partial<SaveData>): SaveData {
    const settings: PartialSaveSettings = data.settings ?? {};

    return {
      version: SAVE_VERSION,
      bestWave: this.numberOrDefault(data.bestWave, DEFAULT_SAVE_DATA.bestWave),
      bestScore: this.numberOrDefault(data.bestScore, DEFAULT_SAVE_DATA.bestScore),
      tutorialCompleted: typeof data.tutorialCompleted === 'boolean'
        ? data.tutorialCompleted
        : DEFAULT_SAVE_DATA.tutorialCompleted,
      settings: {
        musicVolume: this.clamp01(this.numberOrDefault(settings.musicVolume, DEFAULT_SAVE_DATA.settings.musicVolume)),
        sfxVolume: this.clamp01(this.numberOrDefault(settings.sfxVolume, DEFAULT_SAVE_DATA.settings.sfxVolume)),
        muted: typeof settings.muted === 'boolean' ? settings.muted : DEFAULT_SAVE_DATA.settings.muted,
        quality: this.isQuality(settings.quality) ? settings.quality : DEFAULT_SAVE_DATA.settings.quality,
        screenShake: typeof settings.screenShake === 'boolean'
          ? settings.screenShake
          : DEFAULT_SAVE_DATA.settings.screenShake,
        autoStart: typeof settings.autoStart === 'boolean' ? settings.autoStart : DEFAULT_SAVE_DATA.settings.autoStart
      }
    };
  }

  private numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  private isQuality(value: unknown): value is QualitySetting {
    return value === 'low' || value === 'medium' || value === 'high';
  }
}

export const saveManager = new SaveManager();
