import { Application, Container, Graphics, Ticker } from 'pixi.js';
import type { Scene } from './Scene';
import { CANVAS } from '../game/config';
import { UI_THEME } from '../ui/theme';

export class SceneManager {
  private readonly app: Application;
  private currentScene: Scene | null = null;
  private overlay: Container | null = null;
  private transition: {
    next: Scene;
    phase: 'out' | 'in';
    t: number;
    duration: number;
  } | null = null;

  constructor(app: Application) {
    this.app = app;
    this.app.ticker.add(this.update);
  }

  changeScene(scene: Scene): void {
    if (!this.currentScene) {
      this.currentScene = scene;
      this.currentScene.init();
      this.startFadeIn();
      return;
    }

    this.transition = {
      next: scene,
      phase: 'out',
      t: 0,
      duration: UI_THEME.anim.sceneFade
    };
    this.ensureOverlay();
  }

  destroy(): void {
    this.app.ticker.remove(this.update);
    if (this.currentScene) {
      this.currentScene.destroy();
      this.currentScene = null;
    }
    if (this.overlay) {
      this.app.stage.removeChild(this.overlay);
      this.overlay.destroy({ children: true });
      this.overlay = null;
    }
  }

  private update = (ticker: Ticker): void => {
    const dt = Math.min(0.05, ticker.deltaMS / 1000);
    this.currentScene?.update(dt);
    this.updateTransition(dt);
  };

  private startFadeIn(): void {
    this.transition = {
      next: this.currentScene!,
      phase: 'in',
      t: 0,
      duration: UI_THEME.anim.sceneFade
    };
    this.ensureOverlay();
    if (this.overlay) this.overlay.alpha = 1;
  }

  private updateTransition(dt: number): void {
    if (!this.transition || !this.overlay) return;
    this.transition.t += dt;
    const p = Math.min(1, this.transition.t / this.transition.duration);
    if (this.transition.phase === 'out') {
      this.overlay.alpha = p;
      if (p >= 1) {
        this.currentScene?.destroy();
        this.currentScene = this.transition.next;
        this.currentScene.init();
        this.transition.phase = 'in';
        this.transition.t = 0;
      }
    } else {
      this.overlay.alpha = 1 - p;
      if (p >= 1) {
        this.app.stage.removeChild(this.overlay);
        this.overlay.destroy({ children: true });
        this.overlay = null;
        this.transition = null;
      }
    }
  }

  private ensureOverlay(): void {
    if (this.overlay) return;
    const overlay = new Container();
    overlay.eventMode = 'none';
    const veil = new Graphics();
    veil.rect(0, 0, CANVAS.width, CANVAS.height)
      .fill({ color: UI_THEME.color.bg, alpha: 1 });
    const line = new Graphics();
    line.rect(0, CANVAS.height / 2 - 1, CANVAS.width, 2)
      .fill({ color: UI_THEME.color.primary, alpha: 0.22 });
    overlay.addChild(veil, line);
    overlay.alpha = 0;
    this.overlay = overlay;
    this.app.stage.addChild(overlay);
  }
}
