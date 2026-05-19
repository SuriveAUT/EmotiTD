import type { SaveSettings } from './SaveManager';
import { getAudioAsset } from './audioManifest';

export class AudioManager {
  private musicVolume = 0.8;
  private sfxVolume = 0.8;
  private muted = false;
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicName: string | null = null;
  private desiredMusicName: string | null = null;
  private currentMusicGain = 1;
  private audioUnlocked = false;
  private unlockListenersAttached = false;

  constructor() {
    this.attachUnlockListeners();
  }

  applySettings(settings: SaveSettings): void {
    this.setMusicVolume(settings.musicVolume);
    this.setSfxVolume(settings.sfxVolume);
    this.setMuted(settings.muted);
  }

  playSfx(name: string): void {
    if (this.muted || this.sfxVolume <= 0) return;
    this.audioUnlocked = true;
    void this.playSfxAsync(name);
  }

  playMusic(name: string): void {
    this.desiredMusicName = name;
    void this.playMusicAsync(name);
  }

  stopMusic(): void {
    this.stopActiveMusic();
    this.desiredMusicName = null;
  }

  private stopActiveMusic(): void {
    if (!this.currentMusic) {
      this.currentMusicName = null;
      this.currentMusicGain = 1;
      return;
    }
    this.currentMusic.pause();
    this.currentMusic.currentTime = 0;
    this.currentMusic = null;
    this.currentMusicName = null;
    this.currentMusicGain = 1;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = this.clamp01(volume);
    if (this.currentMusic) {
      this.currentMusic.volume = this.effectiveMusicVolume(this.currentMusicGain);
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = this.clamp01(volume);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.currentMusic) {
      this.currentMusic.volume = this.effectiveMusicVolume(this.currentMusicGain);
      if (muted) this.currentMusic.pause();
      else this.resumeCurrentMusic();
    }
  }

  private async playSfxAsync(name: string): Promise<void> {
    const asset = getAudioAsset('sfx', name);
    if (!asset) return;

    const audio = new Audio(asset.src);
    audio.preload = asset.preload;
    audio.volume = this.effectiveSfxVolume(asset.gain);
    audio.play().catch(() => undefined);
    this.resumeCurrentMusic();
  }

  private async playMusicAsync(name: string): Promise<void> {
    const asset = getAudioAsset('music', name);
    if (!asset) return;

    if (!this.audioUnlocked) {
      this.desiredMusicName = name;
      return;
    }

    if (this.currentMusicName === name) {
      if (this.currentMusic && !this.muted) {
        this.currentMusicGain = asset.gain;
        this.currentMusic.volume = this.effectiveMusicVolume(asset.gain);
        if (this.audioUnlocked) this.resumeCurrentMusic();
      }
      return;
    }

    this.stopActiveMusic();
    const audio = new Audio(asset.src);
    audio.loop = asset.loop;
    audio.preload = asset.preload;
    audio.volume = this.effectiveMusicVolume(asset.gain);
    audio.addEventListener('ended', () => this.handleMusicEnded(audio));
    this.currentMusic = audio;
    this.currentMusicName = name;
    this.currentMusicGain = asset.gain;
    if (this.audioUnlocked) this.resumeCurrentMusic();
  }

  private handleMusicEnded(audio: HTMLAudioElement): void {
    if (this.currentMusic !== audio) return;
    this.currentMusic = null;
    this.currentMusicName = null;
    this.desiredMusicName = null;
    this.currentMusicGain = 1;
  }

  private clamp01(value: number): number {
    return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  }

  private effectiveMusicVolume(gain: number): number {
    return this.muted ? 0 : this.clamp01(this.musicVolume * gain);
  }

  private effectiveSfxVolume(gain: number): number {
    return this.clamp01(this.sfxVolume * gain);
  }

  private resumeCurrentMusic(): void {
    if (this.audioUnlocked && !this.currentMusic && this.desiredMusicName) {
      void this.playMusicAsync(this.desiredMusicName);
      return;
    }

    const music = this.currentMusic;
    if (!music || !this.audioUnlocked || this.muted || this.musicVolume <= 0 || !music.paused) return;
    music.play().catch(() => undefined);
  }

  private attachUnlockListeners(): void {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const unlock = (): void => {
      this.audioUnlocked = true;
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      this.resumeCurrentMusic();
    };

    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
  }
}

export const audioManager = new AudioManager();
