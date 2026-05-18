import { classifyVisualLoad, type VisualBudgetInput, type VisualLoadLevel } from './performancePolicy';

export type VisualEffectKind =
  | 'hit'
  | 'death'
  | 'trail'
  | 'impact'
  | 'splash'
  | 'ground'
  | 'floatingText';

export type { VisualBudgetInput, VisualLoadLevel } from './performancePolicy';

export class VisualBudget {
  private skipRate = 1;
  private loadLevel: VisualLoadLevel = 'normal';
  private frame = 0;

  update(input: VisualBudgetInput): void {
    this.frame++;
    const next = classifyVisualLoad(input);
    this.skipRate = next.skipRate;
    this.loadLevel = next.level;
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
