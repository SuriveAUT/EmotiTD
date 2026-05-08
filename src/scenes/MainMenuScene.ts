import { Application, Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { saveManager, type SaveData } from '../core/SaveManager';
import { APP_VERSION } from '../core/version';
import { CANVAS, COLORS, DEFAULT_MAP, EMOTION_COLOR, MAP_LIST, type MapDefinition } from '../game/config';
import { EmotionType } from '../game/types';
import { makeHeadline, makeLabel, makeText } from '../ui/text';
import { CreditsScene } from './CreditsScene';
import { GameScene } from './GameScene';
import { HowToPlayScene } from './HowToPlayScene';
import { ScoreboardScene } from './ScoreboardScene';
import { SettingsScene } from './SettingsScene';

interface MenuParticle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  color: number;
  phase: number;
}

export class MainMenuScene implements Scene {
  private readonly app: Application;
  private readonly sceneManager: SceneManager;
  private readonly root = new Container();
  private readonly backgroundLayer = new Container();
  private readonly particleLayer = new Container();
  private readonly uiLayer = new Container();
  private readonly core = new Graphics();
  private readonly lines = new Graphics();
  private readonly particleGraphics = new Graphics();
  private readonly particles: MenuParticle[] = [];

  private elapsed = 0;
  private saveData: SaveData = saveManager.load();
  private selectedMap: MapDefinition = DEFAULT_MAP;
  private mapButtonDrawers: Array<() => void> = [];
  private bestWaveText: Text | null = null;
  private resetConfirm: Container | null = null;

  constructor(app: Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
  }

  init(): void {
    this.saveData = saveManager.load();
    audioManager.applySettings(this.saveData.settings);
    audioManager.playMusic('menu-theme');
    this.createParticles();

    this.root.addChild(this.backgroundLayer, this.particleLayer, this.uiLayer);
    this.drawStaticBackground();
    this.backgroundLayer.addChild(this.lines, this.core);
    this.particleLayer.addChild(this.particleGraphics);
    this.buildUi();
    this.app.stage.addChild(this.root);
  }

  update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    this.drawLines();
    this.drawCore();
    this.drawParticles(deltaSeconds);
  }

  destroy(): void {
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private buildUi(): void {
    const cx = CANVAS.width / 2;

    const title = makeText('EMOTICORE TD', {
      fontSize: 64,
      fontWeight: '900',
      letterSpacing: 7,
      fill: COLORS.text,
      stroke: { color: 0xff5577, width: 3 }
    });
    title.anchor.set(0.5);
    title.position.set(cx, 120);

    const subtitle = makeHeadline('Defend the Core of a breaking mind.', {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 2,
      fill: COLORS.pathCore
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(cx, 175);

    this.bestWaveText = makeLabel('', {
      fontSize: 12,
      letterSpacing: 4,
      fill: COLORS.warn
    });
    this.bestWaveText.anchor.set(0.5);
    this.bestWaveText.position.set(cx, 232);
    this.refreshBestWave();

    const mapLabel = makeLabel('SELECT MAP', {
      fontSize: 10,
      letterSpacing: 4,
      fill: COLORS.textDim
    });
    mapLabel.anchor.set(0.5);
    mapLabel.position.set(cx, 282);

    const mapSelector = new Container();
    mapSelector.position.set(cx, 330);
    this.mapButtonDrawers = [];
    mapSelector.addChild(...MAP_LIST.map((map, index) => this.createMapButton(map, (index - (MAP_LIST.length - 1) / 2) * 260, 0)));

    const buttonStartY = 400;
    const buttonGap = 56;
    const buttons = new Container();
    buttons.position.set(cx, buttonStartY);
    buttons.addChild(
      this.createButton('START RUN', 0, 0 * buttonGap, 0xff5577, () => this.sceneManager.changeScene(new GameScene(this.app, {
        mode: 'standard',
        map: this.selectedMap,
        onMainMenu: () => this.sceneManager.changeScene(new MainMenuScene(this.app, this.sceneManager))
      }))),
      this.createButton('SCOREBOARD', 0, 1 * buttonGap, 0x77ffaa, () => {
        this.sceneManager.changeScene(new ScoreboardScene(this.app, this.sceneManager));
      }),
      this.createButton('HOW TO PLAY', 0, 2 * buttonGap, 0x6cf0ff, () => {
        this.sceneManager.changeScene(new HowToPlayScene(this.app, this.sceneManager));
      }),
      this.createButton('SETTINGS', 0, 3 * buttonGap, 0xffd166, () => {
        this.sceneManager.changeScene(new SettingsScene(this.app, this.sceneManager));
      }),
      this.createButton('CREDITS', 0, 4 * buttonGap, 0xb070ff, () => {
        this.sceneManager.changeScene(new CreditsScene(this.app, this.sceneManager));
      }),
      this.createButton('RESET SAVE', 0, 5 * buttonGap, 0xff3355, () => this.showResetConfirm())
    );

    const version = makeLabel(`v${APP_VERSION}`, {
      fontSize: 11,
      letterSpacing: 2,
      fill: COLORS.textDim
    });
    version.anchor.set(1, 1);
    version.position.set(CANVAS.width - 26, CANVAS.height - 24);

    const signal = makeLabel('NEURAL CORE SIGNAL UNSTABLE', {
      fontSize: 10,
      letterSpacing: 4,
      fill: 0xff5577
    });
    signal.anchor.set(0, 1);
    signal.position.set(26, CANVAS.height - 24);

    this.uiLayer.addChild(title, subtitle, this.bestWaveText, mapLabel, mapSelector, buttons, signal, version);
  }

  private drawStaticBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: 0x03050a });

    for (let x = 0; x <= CANVAS.width; x += 64) {
      const alpha = x % 256 === 0 ? 0.28 : 0.12;
      bg.moveTo(x, 0).lineTo(x, CANVAS.height).stroke({ color: COLORS.bgGridStrong, width: 1, alpha });
    }
    for (let y = 0; y <= CANVAS.height; y += 64) {
      const alpha = y % 256 === 0 ? 0.26 : 0.1;
      bg.moveTo(0, y).lineTo(CANVAS.width, y).stroke({ color: COLORS.bgGridStrong, width: 1, alpha });
    }

    bg.rect(0, 0, CANVAS.width, 160).fill({ color: COLORS.bg, alpha: 0.55 });
    bg.rect(0, CANVAS.height - 150, CANVAS.width, 150).fill({ color: COLORS.bg, alpha: 0.55 });
    bg.roundRect(360, 70, 560, 690, 10)
      .fill({ color: COLORS.panel, alpha: 0.34 })
      .stroke({ color: COLORS.panelEdge, width: 1, alpha: 0.65 });
    this.backgroundLayer.addChild(bg);
  }

  private drawLines(): void {
    const pulse = (Math.sin(this.elapsed * 1.5) + 1) / 2;
    this.lines.clear();

    const cx = CANVAS.width / 2;
    const cy = 168;
    const nodes = [
      { x: 170, y: 178, color: EMOTION_COLOR[EmotionType.Anger] },
      { x: 330, y: 610, color: EMOTION_COLOR[EmotionType.Sadness] },
      { x: 640, y: 720, color: EMOTION_COLOR[EmotionType.Joy] },
      { x: 965, y: 604, color: EMOTION_COLOR[EmotionType.Fear] },
      { x: 1110, y: 205, color: EMOTION_COLOR[EmotionType.Calm] },
      { x: 650, y: 56, color: EMOTION_COLOR[EmotionType.Hope] }
    ];

    for (const node of nodes) {
      this.lines.moveTo(cx, cy).lineTo(node.x, node.y).stroke({ color: node.color, width: 1.2, alpha: 0.12 + pulse * 0.12 });
      this.lines.circle(node.x, node.y, 5 + pulse * 2).fill({ color: node.color, alpha: 0.45 });
      this.lines.circle(node.x, node.y, 18 + pulse * 8).stroke({ color: node.color, width: 1, alpha: 0.18 });
    }

    this.lines.circle(cx, cy, 170 + pulse * 6).stroke({ color: 0xff5577, width: 1.4, alpha: 0.2 });
    this.lines.circle(cx, cy, 112 - pulse * 4).stroke({ color: 0x6cf0ff, width: 1, alpha: 0.22 });
  }

  private drawCore(): void {
    const pulse = (Math.sin(this.elapsed * 2.4) + 1) / 2;
    const cx = CANVAS.width / 2;
    const cy = 168;
    this.core.clear();
    this.core.circle(cx, cy, 34 + pulse * 8).fill({ color: 0xff5577, alpha: 0.06 });
    this.core.circle(cx, cy, 20 + pulse * 4).fill({ color: 0x6cf0ff, alpha: 0.08 });
    this.core.circle(cx, cy, 14 + pulse * 2).stroke({ color: 0x6cf0ff, width: 2, alpha: 0.55 });
    this.core.circle(cx, cy, 6 + pulse * 1.5).fill({ color: 0xff5577, alpha: 0.82 });
    this.core.moveTo(cx - 56, cy).lineTo(cx - 22, cy).stroke({ color: 0xff5577, width: 1, alpha: 0.55 });
    this.core.moveTo(cx + 22, cy).lineTo(cx + 56, cy).stroke({ color: 0xff5577, width: 1, alpha: 0.55 });
  }

  private createParticles(): void {
    this.particles.length = 0;
    const colors = [
      EMOTION_COLOR[EmotionType.Anger],
      EMOTION_COLOR[EmotionType.Sadness],
      EMOTION_COLOR[EmotionType.Joy],
      EMOTION_COLOR[EmotionType.Fear],
      EMOTION_COLOR[EmotionType.Calm],
      EMOTION_COLOR[EmotionType.Hope]
    ];

    for (let i = 0; i < 42; i++) {
      this.particles.push({
        x: (i * 97) % CANVAS.width,
        y: (i * 181) % CANVAS.height,
        radius: 1.3 + (i % 4) * 0.45,
        speed: 8 + (i % 7) * 2,
        drift: 10 + (i % 5) * 3,
        color: colors[i % colors.length],
        phase: i * 0.37
      });
    }
  }

  private drawParticles(deltaSeconds: number): void {
    this.particleGraphics.clear();

    for (const particle of this.particles) {
      particle.y -= particle.speed * deltaSeconds;
      if (particle.y < -20) particle.y = CANVAS.height + 20;

      const x = particle.x + Math.sin(this.elapsed + particle.phase) * particle.drift;
      const alpha = 0.25 + ((Math.sin(this.elapsed * 1.8 + particle.phase) + 1) / 2) * 0.45;
      this.particleGraphics.circle(x, particle.y, particle.radius).fill({ color: particle.color, alpha });
      this.particleGraphics.circle(x, particle.y, particle.radius + 5).stroke({ color: particle.color, width: 1, alpha: alpha * 0.18 });
    }
  }

  private createButton(label: string, x: number, y: number, color: number, onClick: () => void): Container {
    const button = new Container();
    const width = 380;
    const height = 54;
    const frame = new Graphics();
    const text = makeHeadline(label, {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 4,
      fill: COLORS.text
    });

    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-width / 2, -height / 2, width, height, 9)
        .fill({ color: hovered ? color : COLORS.panel, alpha: hovered ? 0.2 : 0.86 })
        .stroke({ color, width: hovered ? 3 : 2, alpha: hovered ? 1 : 0.78 });
      frame.rect(-width / 2 + 14, height / 2 - 7, hovered ? width - 28 : width * 0.36, 2)
        .fill({ color, alpha: hovered ? 0.78 : 0.32 });
      text.style.fill = hovered ? color : COLORS.text;
    };

    draw(false);
    text.anchor.set(0.5);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => {
      button.scale.set(1.025);
      draw(true);
    });
    button.on('pointerout', () => {
      button.scale.set(1);
      draw(false);
    });
    button.on('pointertap', onClick);
    button.on('pointertap', () => audioManager.playSfx('ui-click'));
    button.addChild(frame, text);
    return button;
  }

  private createMapButton(map: MapDefinition, x: number, y: number): Container {
    const button = new Container();
    const width = 240;
    const height = 60;
    const frame = new Graphics();
    const title = makeLabel(map.name.toUpperCase(), {
      fontSize: 14,
      letterSpacing: 2,
      fill: COLORS.text
    });
    const theme = makeLabel(map.theme.toUpperCase(), {
      fontSize: 9,
      letterSpacing: 2,
      fill: COLORS.textDim
    });

    let hoveredState = false;
    const draw = (): void => {
      const selected = this.selectedMap.id === map.id;
      const hovered = hoveredState;
      const accentColor = map.backgroundColors.pathCore;
      frame.clear();
      frame.roundRect(-width / 2, -height / 2, width, height, 10)
        .fill({
          color: selected ? accentColor : hovered ? COLORS.bgGridStrong : COLORS.panel,
          alpha: selected ? 0.16 : 0.88
        })
        .stroke({
          color: selected ? accentColor : COLORS.panelEdge,
          width: selected ? 2 : 1,
          alpha: hovered || selected ? 1 : 0.7
        });
      // selection accent dot
      frame.circle(-width / 2 + 18, 0, 6)
        .fill({ color: accentColor, alpha: selected ? 1 : 0.55 })
        .stroke({ color: accentColor, width: 1, alpha: selected ? 0.95 : 0.4 });
      title.style.fill = selected ? accentColor : COLORS.text;
      theme.style.fill = selected ? COLORS.text : COLORS.textDim;
    };

    title.anchor.set(0.5);
    title.position.set(14, -10);
    theme.anchor.set(0.5);
    theme.position.set(14, 12);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => { hoveredState = true; draw(); });
    button.on('pointerout', () => { hoveredState = false; draw(); });
    button.on('pointertap', () => {
      this.selectedMap = map;
      audioManager.playSfx('ui-click');
      this.refreshMapButtons();
    });
    this.mapButtonDrawers.push(draw);
    draw();
    button.addChild(frame, title, theme);
    return button;
  }

  private refreshMapButtons(): void {
    for (const redraw of this.mapButtonDrawers) redraw();
  }

  private showResetConfirm(): void {
    if (this.resetConfirm) return;

    const panel = new Container();
    const frame = new Graphics();
    frame.roundRect(-260, -94, 520, 188, 10)
      .fill({ color: 0x05070d, alpha: 0.98 })
      .stroke({ color: COLORS.danger, width: 2, alpha: 0.95 });

    const title = makeHeadline('RESET SAVE?', {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 4,
      fill: COLORS.danger
    });
    title.anchor.set(0.5);
    title.position.set(0, -52);

    const body = makeLabel('This clears best wave, score and settings.', {
      fontSize: 11,
      letterSpacing: 2,
      fill: COLORS.textDim
    });
    body.anchor.set(0.5);
    body.position.set(0, -16);

    const confirm = this.createSmallButton('CONFIRM', -94, 50, COLORS.danger, () => {
      this.saveData = saveManager.reset();
      this.refreshBestWave();
      this.hideResetConfirm();
    });
    const cancel = this.createSmallButton('CANCEL', 94, 50, COLORS.pathCore, () => this.hideResetConfirm());

    panel.position.set(CANVAS.width / 2, CANVAS.height / 2);
    panel.addChild(frame, title, body, confirm, cancel);
    this.resetConfirm = panel;
    this.uiLayer.addChild(panel);
  }

  private hideResetConfirm(): void {
    if (!this.resetConfirm) return;
    this.uiLayer.removeChild(this.resetConfirm);
    this.resetConfirm.destroy({ children: true });
    this.resetConfirm = null;
  }

  private createSmallButton(label: string, x: number, y: number, color: number, onClick: () => void): Container {
    const button = new Container();
    const frame = new Graphics();
    const text = makeLabel(label, { fontSize: 11, letterSpacing: 2, fill: COLORS.text });

    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-72, -22, 144, 44, 8)
        .fill({ color: hovered ? color : COLORS.panel, alpha: hovered ? 0.2 : 0.92 })
        .stroke({ color, width: 2, alpha: hovered ? 1 : 0.8 });
    };

    draw(false);
    text.anchor.set(0.5);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointertap', onClick);
    button.on('pointertap', () => audioManager.playSfx('ui-click'));
    button.addChild(frame, text);
    return button;
  }

  private refreshBestWave(): void {
    if (!this.bestWaveText) return;
    this.bestWaveText.text = `BEST WAVE  ${this.saveData.bestWave}      BEST SCORE  ${this.saveData.bestScore}`;
  }
}
