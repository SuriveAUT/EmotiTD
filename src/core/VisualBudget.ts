import type { QualitySetting } from './SaveManager';

export type VisualEffectKind =
  | 'hit'
  | 'death'
  | 'trail'
  | 'impact'
  | 'splash'
  | 'ground'
  | 'floatingText';

export type VisualLoadLevel = 'normal' | 'medium' | 'high' | 'extreme';

export interface VisualBudgetInput {
  wave: number;
  fps: number;
  enemyCount: number;
  projectileCount: number;
  particleCount: number;
  quality: QualitySetting;
}

export class VisualBudget {
  private skipRate = 1;
  private loadLevel: VisualLoadLevel = 'normal';
  private frame = 0;

  update(input: VisualBudgetInput): void {
    this.frame++;
    let nextLevel: VisualLoadLevel = 'normal';
    let nextSkipRate = 1;

    if (input.enemyCount > 85 || input.fps < 28 || input.particleCount > 320 || input.projectileCount > 180) {
      nextLevel = 'extreme';
      nextSkipRate = 8;
    } else if (input.enemyCount > 60 || input.fps < 38 || input.wave > 45 || input.particleCount > 220) {
      nextLevel = 'high';
      nextSkipRate = 4;
    } else if (input.enemyCount > 30 || input.fps < 50 || input.wave > 30) {
      nextLevel = 'medium';
      nextSkipRate = 2;
    }

    if (input.quality === 'low') {
      nextSkipRate = Math.max(nextSkipRate, 4);
      if (nextLevel === 'normal' || nextLevel === 'medium') nextLevel = 'high';
    }

    this.skipRate = nextSkipRate;
    this.loadLevel = nextLevel;
  }

  shouldRender(kind: VisualEffectKind, important = false): boolean {
    if (important) return this.loadLevel !== 'extreme' || kind === 'ground';
    if (this.skipRate <= 1) return true;
    const offset = this.offsetForKind(kind);
    return (this.frame + offset) % this.skipRate === 0;
  }

  getSkipRate(): number {
    return this.skipRate;
  }

  getLoadLevel(): VisualLoadLevel {
    return this.loadLevel;
  }

  private offsetForKind(kind: VisualEffectKind): number {
    switch (kind) {
      case 'trail': return 1;
      case 'impact': return 2;
      case 'splash': return 3;
      case 'death': return 4;
      case 'ground': return 5;
      case 'floatingText': return 6;
      default: return 0;
    }
  }
}
