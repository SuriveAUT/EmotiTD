import { Application, Ticker } from 'pixi.js';
import type { Scene } from './Scene';

export class SceneManager {
  private readonly app: Application;
  private currentScene: Scene | null = null;

  constructor(app: Application) {
    this.app = app;
    this.app.ticker.add(this.update);
  }

  changeScene(scene: Scene): void {
    if (this.currentScene) {
      this.currentScene.destroy();
    }

    this.currentScene = scene;
    this.currentScene.init();
  }

  destroy(): void {
    this.app.ticker.remove(this.update);
    if (this.currentScene) {
      this.currentScene.destroy();
      this.currentScene = null;
    }
  }

  private update = (ticker: Ticker): void => {
    this.currentScene?.update(Math.min(0.05, ticker.deltaMS / 1000));
  };
}
