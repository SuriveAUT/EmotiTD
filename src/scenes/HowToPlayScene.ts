import { Application, Container, Graphics } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { CANVAS, COLORS, EMOTION_LABEL, HOW_TO_PLAY_COPY, TOWER_STATS } from '../game/config';
import { EMOTION_TYPES, EnemyKind, type EmotionType } from '../game/types';
import { makeLabel, makeText } from '../ui/text';
import { enemyLore, gameLore } from '../content/lore';
import { MainMenuScene } from './MainMenuScene';

const TOWER_GUIDE: Array<{ type: EmotionType; role: string }> = EMOTION_TYPES.map((type) => ({
  type,
  role: TOWER_STATS[type].description
}));

const FRACTURE_GUIDE: EnemyKind[] = [
  EnemyKind.Doubtling,
  EnemyKind.PanicRunner,
  EnemyKind.Fractureling,
  EnemyKind.PressureKnot,
  EnemyKind.GuiltGiant,
  EnemyKind.ShameSwarm,
  EnemyKind.EnvyLeech,
  EnemyKind.BurnoutBrute,
  EnemyKind.VoidWraith,
  EnemyKind.Overthinker,
  EnemyKind.NumbOne,
  EnemyKind.Spiral,
  EnemyKind.Mask,
  EnemyKind.BurnoutBoss
];

/* ------------------------------------------------------------------ *
 *  HowToPlay layout (panel 220..1060, content 240..1040)
 *  Three columns: RUN LOOP | TOWER ROLES | BOSS ROTATION
 * ------------------------------------------------------------------ */
const PANEL_X = 220;
const PANEL_W = 840;
const PANEL_Y = 70;
const PANEL_H = 620;
const COL_HEAD_Y = 188;
const COL_BODY_Y = 220;
const COL_LOOP_X = 246;
const COL_LOOP_W = 250;
const COL_TOWER_X = 510;
const COL_TOWER_W = 250;
const COL_BOSS_X = 780;
const COL_BOSS_W = 260;

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

    const title = makeText(HOW_TO_PLAY_COPY.title, {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: 5,
      fill: COLORS.pathCore
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS.width / 2, 108);
    this.root.addChild(title);

    const intro = makeLabel(HOW_TO_PLAY_COPY.intro, {
      fontSize: 12,
      letterSpacing: 3,
      fill: COLORS.textDim
    });
    intro.anchor.set(0.5);
    intro.position.set(CANVAS.width / 2, 150);
    this.root.addChild(intro);

    this.drawRunLoopColumn();
    this.drawTowerColumn();
    this.drawFractureColumn();

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
    bg.roundRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8)
      .fill({ color: COLORS.panel, alpha: 0.96 })
      .stroke({ color: COLORS.pathCore, width: 2, alpha: 0.8 });
    bg.rect(COL_TOWER_X - 14, 190, 1, 410).fill({ color: COLORS.panelEdge, alpha: 0.9 });
    bg.rect(COL_BOSS_X - 14, 190, 1, 410).fill({ color: COLORS.panelEdge, alpha: 0.9 });
    this.root.addChild(bg);
  }

  private drawRunLoopColumn(): void {
    const heading = makeLabel(HOW_TO_PLAY_COPY.runLoop, { fontSize: 10, letterSpacing: 3, fill: COLORS.warn });
    heading.position.set(COL_LOOP_X, COL_HEAD_Y);
    this.root.addChild(heading);

    HOW_TO_PLAY_COPY.systems.forEach((item, index) => {
      const x = COL_LOOP_X;
      const y = COL_BODY_Y + index * 44;

      const number = makeLabel(`${index + 1}`.padStart(2, '0'), {
        fontSize: 9,
        letterSpacing: 2,
        fill: COLORS.warn
      });
      number.position.set(x, y);

      const heading = makeLabel(item.name.toUpperCase(), {
        fontSize: 9,
        letterSpacing: 1,
        fill: COLORS.text
      });
      heading.position.set(x + 26, y);

      const body = makeText(item.body, {
        fontSize: 9,
        fill: COLORS.textDim,
        wordWrap: true,
        wordWrapWidth: COL_LOOP_W - 30,
        lineHeight: 12
      });
      body.position.set(x + 26, y + 14);

      this.root.addChild(number, heading, body);
    });
  }

  private drawTowerColumn(): void {
    const heading = makeLabel(HOW_TO_PLAY_COPY.towerRoles, { fontSize: 10, letterSpacing: 3, fill: COLORS.warn });
    heading.position.set(COL_TOWER_X, COL_HEAD_Y);
    this.root.addChild(heading);

    TOWER_GUIDE.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = COL_TOWER_X + col * (COL_TOWER_W / 2);
      const y = COL_BODY_Y + row * 64;
      const name = makeLabel(EMOTION_LABEL[item.type], {
        fontSize: 10,
        letterSpacing: 1,
        fill: COLORS.text
      });
      name.position.set(x, y);

      const body = makeText(item.role, {
        fontSize: 9,
        fill: COLORS.textDim,
        wordWrap: true,
        wordWrapWidth: COL_TOWER_W / 2 - 6,
        lineHeight: 12
      });
      body.position.set(x, y + 14);
      this.root.addChild(name, body);
    });
  }

  private drawFractureColumn(): void {
    const heading = makeLabel('FRACTURES', { fontSize: 10, letterSpacing: 3, fill: COLORS.warn });
    heading.position.set(COL_BOSS_X, COL_HEAD_Y);
    this.root.addChild(heading);

    const intro = makeText(gameLore.fracturesDescription, {
      fontSize: 8,
      fill: COLORS.textDim,
      wordWrap: true,
      wordWrapWidth: COL_BOSS_W - 10,
      lineHeight: 10
    });
    intro.position.set(COL_BOSS_X, COL_BODY_Y - 18);
    this.root.addChild(intro);

    FRACTURE_GUIDE.forEach((kind, index) => {
      const lore = enemyLore[kind];
      const x = COL_BOSS_X;
      const y = COL_BODY_Y + 8 + index * 28;

      const name = makeLabel(lore.name.toUpperCase(), {
        fontSize: 8,
        letterSpacing: 1,
        fill: kind === EnemyKind.Spiral || kind === EnemyKind.Mask || kind === EnemyKind.BurnoutBoss ? 0xff5577 : COLORS.text
      });
      name.position.set(x, y);

      const body = makeText(`${lore.oneLine} Counter: ${lore.counterHint}`, {
        fontSize: 8,
        fill: COLORS.textDim,
        wordWrap: true,
        wordWrapWidth: COL_BOSS_W - 10,
        lineHeight: 10
      });
      body.position.set(x, y + 10);
      this.root.addChild(name, body);
    });
  }

  private createBackButton(): Container {
    const button = new Container();
    const frame = new Graphics();
    const label = makeLabel(HOW_TO_PLAY_COPY.back, { fontSize: 13, letterSpacing: 3, fill: COLORS.text });
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
