import { Application, Container, Graphics } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { CANVAS, COLORS } from '../game/config';
import { TUTORIAL_STATIC_GUIDE } from '../game/TutorialManager';
import { makeLabel, makeText } from '../ui/text';
import { MainMenuScene } from './MainMenuScene';

export class HowToPlayScene implements Scene {
  private readonly app: Application;
  private readonly sceneManager: SceneManager;
  private readonly root = new Container();

  constructor(app: Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
  }

  init(): void {
    this.drawPanel();

    const title = makeText('HOW TO PLAY', {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: 5,
      fill: COLORS.pathCore
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS.width / 2, 108);
    this.root.addChild(title);

    const intro = makeLabel('Build, balance, upgrade, survive.', {
      fontSize: 12,
      letterSpacing: 3,
      fill: COLORS.textDim
    });
    intro.anchor.set(0.5);
    intro.position.set(CANVAS.width / 2, 150);
    this.root.addChild(intro);

    TUTORIAL_STATIC_GUIDE.forEach((item, index) => {
      const column = index < 5 ? 0 : 1;
      const row = index % 5;
      const x = column === 0 ? 300 : 665;
      const y = 205 + row * 78;

      const number = makeLabel(`${index + 1}`.padStart(2, '0'), {
        fontSize: 10,
        letterSpacing: 2,
        fill: COLORS.warn
      });
      number.position.set(x, y);

      const heading = makeLabel(item.title.toUpperCase(), {
        fontSize: 11,
        letterSpacing: 2,
        fill: COLORS.text
      });
      heading.position.set(x + 36, y);

      const body = makeText(item.body, {
        fontSize: 11,
        fill: COLORS.textDim,
        wordWrap: true,
        wordWrapWidth: 285,
        lineHeight: 15
      });
      body.position.set(x + 36, y + 18);

      this.root.addChild(number, heading, body);
    });

    this.root.addChild(this.createBackButton());
    this.app.stage.addChild(this.root);
  }

  update(_deltaSeconds: number): void {
    // Static information scene.
  }

  destroy(): void {
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private drawPanel(): void {
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: COLORS.bg });
    bg.roundRect(220, 70, 840, 620, 8)
      .fill({ color: COLORS.panel, alpha: 0.96 })
      .stroke({ color: COLORS.pathCore, width: 2, alpha: 0.8 });
    bg.rect(640, 190, 1, 410).fill({ color: COLORS.panelEdge, alpha: 0.9 });
    this.root.addChild(bg);
  }

  private createBackButton(): Container {
    const button = new Container();
    const frame = new Graphics();
    const label = makeLabel('BACK', { fontSize: 13, letterSpacing: 3, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-70, -24, 140, 48, 8)
        .fill({ color: hovered ? 0x6cf0ff : COLORS.panel, alpha: hovered ? 0.2 : 0.9 })
        .stroke({ color: COLORS.pathCore, width: 2, alpha: 0.9 });
    };

    draw(false);
    label.anchor.set(0.5);
    button.position.set(CANVAS.width / 2, 642);
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
