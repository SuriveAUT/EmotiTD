import type { SaveSettings } from './SaveManager';

type AudioKind = 'sfx' | 'music';

export class AudioManager {
  private musicVolume = 0.8;
  private sfxVolume = 0.8;
  private muted = false;
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicName: string | null = null;
  private unavailable = new Set<string>();
  private availability = new Map<string, boolean>();

  applySettings(settings: SaveSettings): void {
    this.setMusicVolume(settings.musicVolume);
    this.setSfxVolume(settings.sfxVolume);
    this.setMuted(settings.muted);
  }

  playSfx(name: string): void {
    if (this.muted || this.sfxVolume <= 0) return;
    void this.playSfxAsync(name);
  }

  playMusic(name: string): void {
    void this.playMusicAsync(name);
  }

  stopMusic(): void {
    if (!this.currentMusic) return;
    this.currentMusic.pause();
    this.currentMusic.currentTime = 0;
    this.currentMusic = null;
    this.currentMusicName = null;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = this.clamp01(volume);
    if (this.currentMusic) {
      this.currentMusic.volume = this.muted ? 0 : this.musicVolume;
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = this.clamp01(volume);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.currentMusic) {
      this.currentMusic.volume = muted ? 0 : this.musicVolume;
      if (muted) this.currentMusic.pause();
      else this.currentMusic.play().catch(() => {
        if (this.currentMusicName) this.unavailable.add(this.srcFor('music', this.currentMusicName));
      });
    }
  }

  private async playSfxAsync(name: string): Promise<void> {
    const src = this.srcFor('sfx', name);
    if (!await this.hasAsset(src)) return;

    const audio = new Audio(src);
    audio.volume = this.sfxVolume;
    audio.play().catch(() => {
      this.unavailable.add(src);
    });
  }

  private async playMusicAsync(name: string): Promise<void> {
    if (this.currentMusicName === name) {
      if (this.currentMusic && !this.muted) {
        this.currentMusic.play().catch(() => this.unavailable.add(this.srcFor('music', name)));
      }
      return;
    }

    this.stopMusic();
    const src = this.srcFor('music', name);
    if (!await this.hasAsset(src)) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = this.muted ? 0 : this.musicVolume;
    this.currentMusic = audio;
    this.currentMusicName = name;
    audio.play().catch(() => {
      this.unavailable.add(src);
      if (this.currentMusic === audio) {
        this.currentMusic = null;
        this.currentMusicName = null;
      }
    });
  }

  private srcFor(kind: AudioKind, name: string): string {
    return `/audio/${kind}/${name}.mp3`;
  }

  private async hasAsset(src: string): Promise<boolean> {
    const known = this.availability.get(src);
    if (known !== undefined) return known;
    if (this.unavailable.has(src)) return false;

    try {
      const response = await fetch(src, { method: 'HEAD' });
      const available = response.ok;
      this.availability.set(src, available);
      if (!available) this.unavailable.add(src);
      return available;
    } catch {
      this.availability.set(src, false);
      this.unavailable.add(src);
      return false;
    }
  }

  private clamp01(value: number): number {
    return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  }
}

export const audioManager = new AudioManager();
