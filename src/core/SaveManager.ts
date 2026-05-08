import type { RunConfig } from '../game/RunConfig';
import type { RunStatsJson } from '../game/RunStats';
import type { EmotionType, TargetingMode, UpgradePath } from '../game/types';

export type QualitySetting = 'low' | 'medium' | 'high';

export interface SaveSettings {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  quality: QualitySetting;
  screenShake: boolean;
  autoStart: boolean;
}

export interface ChallengeRecord {
  bestWave: number;
  bestScore: number;
  bestSeed?: string;
  completedAt?: string;
}

export interface SaveData {
  version: number;
  bestWave: number;
  bestScore: number;
  tutorialCompleted: boolean;
  settings: SaveSettings;
  challengeRecords: Record<string, ChallengeRecord>;
  lastChallengeSeed?: string;
  lastPlayerName: string;
}

export interface CurrentRunTowerSave {
  id: string;
  emotion: EmotionType;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  selectedPath: UpgradePath | null;
  pathLevel: number;
  targetingMode: TargetingMode;
  totalSpent: number;
}

export interface CurrentRunSave {
  version: number;
  savedAt: string;
  runConfig: RunConfig;
  gameState: {
    memory: number;
    stability: number;
    wave: number;
    score: number;
    waveInProgress: boolean;
    restoredFromWaveStart?: boolean;
  };
  towers: CurrentRunTowerSave[];
  runStats: RunStatsJson;
}

const SAVE_KEY = 'emoticore-td-save';
const CURRENT_RUN_KEY = 'emoticore-td-current-run';
const SAVE_VERSION = 1;
const CURRENT_RUN_VERSION = 1;

const DEFAULT_SAVE_DATA: SaveData = {
  version: SAVE_VERSION,
  bestWave: 0,
  bestScore: 0,
  tutorialCompleted: false,
  challengeRecords: {},
  lastChallengeSeed: undefined,
  lastPlayerName: '',
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
    this.clearCurrentRun();
    return this.getData();
  }

  recordRun(wave: number, score: number): SaveData {
    this.data.bestWave = Math.max(this.data.bestWave, Math.max(0, Math.floor(wave)));
    this.data.bestScore = Math.max(this.data.bestScore, Math.max(0, Math.floor(score)));
    this.save();
    return this.getData();
  }

  recordChallengeRun(mode: string, mapId: string, wave: number, score: number, seed?: string): SaveData {
    this.recordRun(wave, score);
    const key = this.challengeKey(mode, mapId);
    const current = this.data.challengeRecords[key] ?? { bestWave: 0, bestScore: 0 };
    const normalizedWave = Math.max(0, Math.floor(wave));
    const normalizedScore = Math.max(0, Math.floor(score));
    this.data.challengeRecords[key] = {
      bestWave: Math.max(current.bestWave, normalizedWave),
      bestScore: Math.max(current.bestScore, normalizedScore),
      bestSeed: normalizedScore >= current.bestScore ? seed : current.bestSeed,
      completedAt: normalizedScore >= current.bestScore ? new Date().toISOString() : current.completedAt
    };
    if (seed) this.data.lastChallengeSeed = seed;
    this.save();
    return this.getData();
  }

  recordLastChallengeSeed(seed: string): SaveData {
    this.data.lastChallengeSeed = seed;
    this.save();
    return this.getData();
  }

  setLastPlayerName(name: string): void {
    this.data.lastPlayerName = name;
    this.save();
  }

  getChallengeRecord(mode: string, mapId: string): ChallengeRecord | null {
    return this.data.challengeRecords[this.challengeKey(mode, mapId)] ?? null;
  }

  completeTutorial(): SaveData {
    this.data.tutorialCompleted = true;
    this.save();
    return this.getData();
  }

  getData(): SaveData {
    return structuredClone(this.data);
  }

  saveCurrentRun(run: Omit<CurrentRunSave, 'version' | 'savedAt'>): void {
    const payload: CurrentRunSave = {
      ...run,
      version: CURRENT_RUN_VERSION,
      savedAt: new Date().toISOString()
    };
    window.localStorage.setItem(CURRENT_RUN_KEY, JSON.stringify(payload));
  }

  loadCurrentRun(): CurrentRunSave | null {
    try {
      const raw = window.localStorage.getItem(CURRENT_RUN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CurrentRunSave>;
      if (parsed.version !== CURRENT_RUN_VERSION || !parsed.runConfig || !parsed.gameState || !Array.isArray(parsed.towers) || !parsed.runStats) {
        this.clearCurrentRun();
        return null;
      }
      return parsed as CurrentRunSave;
    } catch {
      this.clearCurrentRun();
      return null;
    }
  }

  clearCurrentRun(): void {
    window.localStorage.removeItem(CURRENT_RUN_KEY);
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
      challengeRecords: this.normalizeChallengeRecords(data.challengeRecords),
      lastChallengeSeed: typeof data.lastChallengeSeed === 'string' ? data.lastChallengeSeed : DEFAULT_SAVE_DATA.lastChallengeSeed,
      lastPlayerName: typeof data.lastPlayerName === 'string' ? data.lastPlayerName : '',
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

  private challengeKey(mode: string, mapId: string): string {
    return `${mode}:${mapId}`;
  }

  private normalizeChallengeRecords(value: unknown): Record<string, ChallengeRecord> {
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, ChallengeRecord> = {};
    for (const [key, record] of Object.entries(value as Record<string, Partial<ChallengeRecord>>)) {
      if (!record || typeof record !== 'object') continue;
      out[key] = {
        bestWave: this.numberOrDefault(record.bestWave, 0),
        bestScore: this.numberOrDefault(record.bestScore, 0),
        bestSeed: typeof record.bestSeed === 'string' ? record.bestSeed : undefined,
        completedAt: typeof record.completedAt === 'string' ? record.completedAt : undefined
      };
    }
    return out;
  }
}

export const saveManager = new SaveManager();
