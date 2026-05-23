import { Container, Graphics, Text } from 'pixi.js';
import type { SaveManager } from '../core/SaveManager';
import { COLORS, EMOTION_COLOR, TUTORIAL_STEPS } from './config';
import { EmotionType, type UpgradePath } from './types';
import { makeHeadline, makeLabel, makeText } from '../ui/text';

export type TutorialStepId =
  | 'welcome'
  | 'select-anger'
  | 'place-anger-tower'
  | 'start-wave'
  | 'place-second-emotion'
  | 'explain-resonance'
  | 'select-tower'
  | 'upgrade-tower'
  | 'finish';

interface TutorialStep {
  id: TutorialStepId;
  title: string;
  body: string;
  hint: string;
  nextLabel?: string;
  advanceMode: 'button' | 'event';
}

const STEPS: readonly TutorialStep[] = TUTORIAL_STEPS;

export class TutorialManager {
  readonly container = new Container();

  private readonly saves: SaveManager;
  private readonly panel = new Graphics();
  private readonly title: Text;
  private readonly body: Text;
  private readonly hint: Text;
  private readonly progress: Text;
  private readonly nextButton: Container;
  private readonly skipButton: Container;
  private currentIndex = 0;
  private active = false;

  constructor(saves: SaveManager) {
    this.saves = saves;
    this.container.visible = false;
    this.container.label = 'tutorial-overlay';
    this.container.eventMode = 'passive';

    this.title = makeHeadline('', { fontSize: 18, fontWeight: '900', letterSpacing: 2, fill: COLORS.pathCore });
    this.body = makeText('', { fontSize: 13, fill: COLORS.text, wordWrap: true, wordWrapWidth: 390, lineHeight: 18 });
    this.hint = makeLabel('', { fontSize: 10, letterSpacing: 2, fill: COLORS.warn, wordWrap: true, wordWrapWidth: 390 });
    this.progress = makeLabel('', { fontSize: 10, letterSpacing: 2, fill: COLORS.textDim });
    this.nextButton = this.createButton('NEXT', 0x77ffaa, () => this.advanceFromButton());
    this.skipButton = this.createButton('SKIP', COLORS.danger, () => this.complete());

    this.panel.position.set(0, 0);
    this.title.position.set(24, 20);
    this.body.position.set(24, 52);
    this.hint.position.set(24, 124);
    this.progress.position.set(24, 164);
    this.nextButton.position.set(290, 170);
    this.skipButton.position.set(394, 170);
    this.container.position.set(24, 82);
    this.container.addChild(this.panel, this.title, this.body, this.hint, this.progress, this.nextButton, this.skipButton);
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.currentIndex = 0;
    this.container.visible = true;
    this.render();
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  onEmotionSelected(type: EmotionType): void {
    this.advanceOn('select-anger', type === EmotionType.Anger);
  }

  onBuiltTowerSelected(_type: EmotionType): void {
    this.advanceOn('select-tower', true);
  }

  onTowerPlaced(type: EmotionType, totalTowers: number): void {
    this.advanceOn('place-anger-tower', type === EmotionType.Anger);
    this.advanceOn('place-second-emotion', totalTowers >= 2);
  }

  onWaveStarted(): void {
    this.advanceOn('start-wave', true);
  }

  onTowerUpgraded(_path: UpgradePath): void {
    this.advanceOn('upgrade-tower', true);
  }

  private advanceOn(stepId: TutorialStepId, condition: boolean): void {
    if (!this.active || !condition) return;
    if (STEPS[this.currentIndex].id !== stepId) return;
    this.advance();
  }

  private advanceFromButton(): void {
    const step = STEPS[this.currentIndex];
    if (step.advanceMode !== 'button') return;
    this.advance();
  }

  private advance(): void {
    if (this.currentIndex >= STEPS.length - 1) {
      this.complete();
      return;
    }

    this.currentIndex++;
    this.render();
  }

  private complete(): void {
    this.active = false;
    this.container.visible = false;
    this.saves.completeTutorial();
  }

  private render(): void {
    const step = STEPS[this.currentIndex];
    this.panel.clear();
    this.panel.roundRect(0, 0, 500, 220, 8)
      .fill({ color: 0x05070d, alpha: 0.94 })
      .stroke({ color: this.colorForStep(step.id), width: 2, alpha: 0.9 });
    this.panel.rect(0, 0, 500, 4).fill({ color: this.colorForStep(step.id), alpha: 0.78 });

    this.title.text = step.title;
    this.body.text = step.body;
    this.hint.text = step.hint;
    this.progress.text = `${this.currentIndex + 1}/${STEPS.length}`;
    this.nextButton.visible = step.advanceMode === 'button';
    this.setButtonLabel(this.nextButton, step.nextLabel ?? 'NEXT');
  }

  private colorForStep(stepId: TutorialStepId): number {
    if (stepId.includes('anger')) return EMOTION_COLOR[EmotionType.Anger];
    if (stepId.includes('resonance')) return 0x77ffaa;
    if (stepId.includes('upgrade')) return COLORS.warn;
    return COLORS.pathCore;
  }

  private createButton(label: string, color: number, onClick: () => void): Container {
    const button = new Container();
    const frame = new Graphics();
    const text = makeLabel(label, { fontSize: 10, letterSpacing: 2, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-42, -18, 84, 36, 7)
        .fill({ color: hovered ? color : COLORS.panel, alpha: hovered ? 0.22 : 0.92 })
        .stroke({ color, width: 1.5, alpha: hovered ? 1 : 0.8 });
    };

    draw(false);
    text.anchor.set(0.5);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointertap', onClick);
    button.addChild(frame, text);
    return button;
  }

  private setButtonLabel(button: Container, label: string): void {
    const text = button.children.find((child): child is Text => child instanceof Text);
    if (text) text.text = label;
  }
}

export const TUTORIAL_STATIC_GUIDE = STEPS.map((step) => ({
  title: step.title,
  body: step.body
}));
