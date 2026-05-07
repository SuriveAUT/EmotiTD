import { Application, Container, Graphics } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { CANVAS, COLORS, CREDITS_COPY } from '../game/config';
import { makeHeadline, makeLabel, makeText } from '../ui/text';
import { MainMenuScene } from './MainMenuScene';

export class CreditsScene implements Scene {
  private readonly app: Application;
  private readonly sceneManager: SceneManager;
  private readonly root = new Container();

  constructor(app: Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
  }

  init(): void {
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: COLORS.bg });
    bg.roundRect(300, 120, 680, 470, 8)
      .fill({ color: COLORS.panel, alpha: 0.96 })
      .stroke({ color: 0xb070ff, width: 2, alpha: 0.85 });

    const title = makeText(CREDITS_COPY.title, {
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: 5,
      fill: 0xb070ff
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS.width / 2, 175);

    const lines = CREDITS_COPY.lines;

    this.root.addChild(bg, title);

    lines.forEach((line, index) => {
      const text = index === 0
        ? makeHeadline(line, { fontSize: 22, fontWeight: '800', letterSpacing: 3, fill: COLORS.text })
        : makeLabel(line, { fontSize: 13, letterSpacing: 2, fill: COLORS.textDim });
      text.anchor.set(0.5);
      text.position.set(CANVAS.width / 2, 270 + index * 52);
      this.root.addChild(text);
    });

    this.root.addChild(this.createBackButton());
    this.app.stage.addChild(this.root);
  }

  update(_deltaSeconds: number): void {
    // Static credits scene.
  }

  destroy(): void {
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private createBackButton(): Container {
    const button = new Container();
    const frame = new Graphics();
    const label = makeLabel(CREDITS_COPY.back, { fontSize: 13, letterSpacing: 3, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-70, -24, 140, 48, 8)
        .fill({ color: hovered ? 0xb070ff : COLORS.panel, alpha: hovered ? 0.22 : 0.9 })
        .stroke({ color: 0xb070ff, width: 2, alpha: 0.9 });
    };

    draw(false);
    label.anchor.set(0.5);
    button.position.set(CANVAS.width / 2, 510);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointertap', () => {
      audioManager.playSfx('ui-click');
      this.sceneManager.changeScene(new MainMenuScene(this.app, this.sceneManager));
    });
    button.addChild(frame, label);
    return button;
  }
}
