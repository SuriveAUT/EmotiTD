import { Application, Container, Graphics, Rectangle, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { saveManager, type CurrentRunSave, type SaveData } from '../core/SaveManager';
import { APP_VERSION } from '../core/version';
import { CANVAS, COLORS, DEFAULT_MAP, EMOTION_COLOR, EMOTION_LABEL, MAP_LIST, MAP_MODIFIER_COPY, MENU_COPY, type MapDefinition } from '../game/config';
import { EmotionType } from '../game/types';
import {
  CHALLENGE_MODE_DESCRIPTION,
  CHALLENGE_MODE_DIFFICULTY,
  CHALLENGE_MODE_LABEL,
  createChallengeRunConfig,
  randomSeed,
  type RunConfig
} from '../game/RunConfig';
import type { GameMode } from '../game/GameMode';
import { makeHeadline, makeLabel, makeText } from '../ui/text';
import { UI_THEME } from '../ui/theme';
import { mapLore } from '../content/lore';
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
  private introTime = 0;
  private saveData: SaveData = saveManager.load();
  private selectedMap: MapDefinition = DEFAULT_MAP;
  private selectedMode: GameMode = 'standard';
  private challengeSeed = randomSeed();
  private mapButtonDrawers: Array<() => void> = [];
  private modeButtonDrawers: Array<() => void> = [];
  private bestWaveText: Text | null = null;
  private modeInfoText: Text | null = null;
  private resetConfirm: Container | null = null;
  private currentRunSave: CurrentRunSave | null = null;
  private pendingNewRunConfirm = false;

  constructor(app: Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
  }

  init(): void {
    this.saveData = saveManager.load();
    this.currentRunSave = saveManager.loadCurrentRun();
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
    this.introTime += deltaSeconds;
    const intro = Math.min(1, this.introTime / 0.65);
    this.uiLayer.alpha = intro;
    this.uiLayer.y = (1 - intro) * 10;
    this.drawLines();
    this.drawCore();
    this.drawParticles(deltaSeconds);
    this.refreshMapButtons();
    this.refreshModeButtons();
  }

  destroy(): void {
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private buildUi(): void {
    const cx = CANVAS.width / 2;
    const leftX = 405;
    const rightX = 855;

    const title = makeText(MENU_COPY.title, {
      fontSize: 44,
      fontWeight: '900',
      letterSpacing: 6,
      fill: COLORS.text,
      stroke: { color: 0xff5577, width: 2 }
    });
    title.anchor.set(0.5);
    title.position.set(cx, 56);

    const subtitle = makeHeadline(MENU_COPY.subtitle, {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 2,
      fill: COLORS.pathCore
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(cx, 104);

    this.bestWaveText = makeLabel('', {
      fontSize: 12,
      letterSpacing: 4,
      fill: COLORS.warn
    });
    this.bestWaveText.anchor.set(0.5);
    this.bestWaveText.position.set(cx, 144);
    this.refreshBestWave();

    const mapLabel = makeLabel(MENU_COPY.selectMap, {
      fontSize: 10,
      letterSpacing: 4,
      fill: COLORS.textDim
    });
    mapLabel.anchor.set(0.5);
    mapLabel.position.set(leftX, 188);

    const mapSelector = new Container();
    mapSelector.position.set(leftX, 248);
    this.mapButtonDrawers = [];
    mapSelector.addChild(...MAP_LIST.map((map, index) => this.createMapButton(map, 0, index * 108)));

    const modeLabel = makeLabel('SELECT MODE', {
      fontSize: 10,
      letterSpacing: 4,
      fill: COLORS.textDim
    });
    modeLabel.anchor.set(0.5);
    modeLabel.position.set(rightX, 216);

    const modeSelector = new Container();
    modeSelector.position.set(rightX, 270);
    this.modeButtonDrawers = [];
    const modes: GameMode[] = ['standard', 'bossRush', 'limitedEmotions', 'fragileCore', 'resonanceTrial'];
    modeSelector.addChild(...modes.map((mode, index) => this.createModeButton(mode, (index % 2) * 208 - 104, Math.floor(index / 2) * 64)));

    this.modeInfoText = makeText('', {
      fontSize: 10,
      fill: COLORS.textDim,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 410,
      lineHeight: 13
    });
    this.modeInfoText.anchor.set(0.5, 0);
    this.modeInfoText.position.set(rightX, 430);
    this.refreshModeInfo();
    this.modeInfoText.visible = !this.currentRunSave;

    const buttonStartY = this.currentRunSave ? 520 : 506;
    const buttonGap = this.currentRunSave ? 48 : 52;
    const buttons = new Container();
    buttons.position.set(rightX, buttonStartY);
    buttons.addChild(
      this.createButton(MENU_COPY.startRun, 0, 0 * buttonGap, 0xff5577, () => this.startNewRun()),
      this.createButton(MENU_COPY.scoreboard, 0, 1 * buttonGap, 0x77ffaa, () => {
        this.sceneManager.changeScene(new ScoreboardScene(this.app, this.sceneManager));
      }),
      this.createButton(MENU_COPY.howToPlay, 0, 2 * buttonGap, 0x6cf0ff, () => {
        this.sceneManager.changeScene(new HowToPlayScene(this.app, this.sceneManager));
      }),
      this.createButton(MENU_COPY.settings, 0, 3 * buttonGap, 0xffd166, () => {
        this.sceneManager.changeScene(new SettingsScene(this.app, this.sceneManager));
      }),
      this.createButton(MENU_COPY.credits, 0, 4 * buttonGap, 0xb070ff, () => {
        this.sceneManager.changeScene(new CreditsScene(this.app, this.sceneManager));
      }),
      this.createButton(MENU_COPY.resetSave, 0, 5 * buttonGap, 0xff3355, () => this.showResetConfirm())
    );

    const resumeUi = this.currentRunSave ? this.createResumeUi(rightX, 424) : null;

    const version = makeLabel(`v${APP_VERSION}`, {
      fontSize: 11,
      letterSpacing: 2,
      fill: COLORS.textDim
    });
    version.anchor.set(1, 1);
    version.position.set(CANVAS.width - 26, CANVAS.height - 24);

    const signal = makeLabel(MENU_COPY.signal, {
      fontSize: 10,
      letterSpacing: 4,
      fill: 0xff5577
    });
    signal.anchor.set(0, 1);
    signal.position.set(26, CANVAS.height - 24);

    this.uiLayer.addChild(title, subtitle, this.bestWaveText, mapLabel, mapSelector, modeLabel, modeSelector, this.modeInfoText, buttons, signal, version);
    if (resumeUi) this.uiLayer.addChild(resumeUi);
  }

  private startNewRun(): void {
    if (this.currentRunSave && !this.pendingNewRunConfirm) {
      this.pendingNewRunConfirm = true;
      if (this.modeInfoText) {
        this.modeInfoText.visible = true;
        this.modeInfoText.text = 'Saved run exists.\nTap START RUN again to overwrite it.';
      }
      return;
    }
    saveManager.clearCurrentRun();
    this.sceneManager.changeScene(new GameScene(this.app, {
      mode: this.selectedMode,
      map: this.selectedMap,
      runConfig: this.createSelectedRunConfig(),
      onMainMenu: () => this.sceneManager.changeScene(new MainMenuScene(this.app, this.sceneManager))
    }));
  }

  private resumeRun(): void {
    const save = saveManager.loadCurrentRun();
    if (!save) {
      this.currentRunSave = null;
      this.refreshModeInfo();
      return;
    }
    const map = MAP_LIST.find((candidate) => candidate.id === save.runConfig.mapId) ?? DEFAULT_MAP;
    this.sceneManager.changeScene(new GameScene(this.app, {
      mode: save.runConfig.mode,
      map,
      runConfig: save.runConfig,
      resumeSave: save,
      onMainMenu: () => this.sceneManager.changeScene(new MainMenuScene(this.app, this.sceneManager))
    }));
  }

  private createResumeUi(x: number, y: number): Container {
    const box = new Container();
    const save = this.currentRunSave!;
    const map = MAP_LIST.find((candidate) => candidate.id === save.runConfig.mapId);
    const savedAt = new Date(save.savedAt);
    const info = makeText(`Saved: ${map?.name ?? save.runConfig.mapId} / ${CHALLENGE_MODE_LABEL[save.runConfig.mode]}\nWave ${save.gameState.wave}  Score ${save.gameState.score}  ${Number.isNaN(savedAt.getTime()) ? '' : savedAt.toLocaleTimeString()}`, {
      fontSize: 10,
      fill: COLORS.textDim,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 360,
      lineHeight: 14
    });
    info.anchor.set(0.5, 0);
    info.position.set(x, y);
    const resume = this.createButton('RESUME RUN', x, y + 50, 0x77ffaa, () => this.resumeRun());
    box.addChild(info, resume);
    return box;
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

    bg.rect(0, 0, CANVAS.width, 168).fill({ color: COLORS.bg, alpha: 0.68 });
    bg.rect(0, CANVAS.height - 150, CANVAS.width, 150).fill({ color: COLORS.bg, alpha: 0.55 });
    bg.roundRect(224, 176, 848, 606, 10)
      .fill({ color: COLORS.panel, alpha: 0.38 })
      .stroke({ color: COLORS.panelEdge, width: 1, alpha: 0.65 });
    bg.rect(0, 0, CANVAS.width, 96).fill({ color: 0x000000, alpha: 0.34 });
    bg.rect(648, 204, 1, 538).fill({ color: COLORS.panelEdge, alpha: 0.3 });
    bg.rect(0, CANVAS.height - 118, CANVAS.width, 118).fill({ color: 0x000000, alpha: 0.28 });
    bg.rect(0, 0, 18, CANVAS.height).fill({ color: 0x000000, alpha: 0.38 });
    bg.rect(CANVAS.width - 18, 0, 18, CANVAS.height).fill({ color: 0x000000, alpha: 0.38 });
    this.backgroundLayer.addChild(bg);
  }

  private drawLines(): void {
    const pulse = (Math.sin(this.elapsed * 1.5) + 1) / 2;
    this.lines.clear();

    const cx = CANVAS.width / 2;
    const cy = 208;
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

    this.lines.circle(cx, cy, 170 + pulse * 6).stroke({ color: 0xff5577, width: 1.2, alpha: 0.12 });
    this.lines.circle(cx, cy, 112 - pulse * 4).stroke({ color: 0x6cf0ff, width: 1, alpha: 0.16 });
  }

  private drawCore(): void {
    const pulse = (Math.sin(this.elapsed * 2.4) + 1) / 2;
    const cx = CANVAS.width / 2;
    const cy = 208;
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
    const height = 50;
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
        .fill({ color: hovered ? color : UI_THEME.color.panel, alpha: hovered ? 0.2 : 0.88 })
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
    button.hitArea = new Rectangle(-width / 2 - 18, -height / 2 - 12, width + 36, height + 24);
    button.on('pointerover', () => {
      button.scale.set(1.025);
      draw(true);
    });
    button.on('pointerout', () => {
      button.scale.set(1);
      draw(false);
    });
    button.on('pointertap', onClick);
    button.on('pointerdown', () => button.scale.set(0.985));
    button.on('pointerup', () => button.scale.set(1.025));
    button.on('pointerupoutside', () => button.scale.set(1));
    button.on('pointertap', () => audioManager.playSfx('ui-click'));
    button.addChild(frame, text);
    return button;
  }

  private createMapButton(map: MapDefinition, x: number, y: number): Container {
    const button = new Container();
    const width = 360;
    const height = 96;
    const frame = new Graphics();
    const modifier = MAP_MODIFIER_COPY[map.id];
    const lore = mapLore[map.id];
    const title = makeLabel(map.name.toUpperCase(), {
      fontSize: 12,
      letterSpacing: 2,
      fill: COLORS.text
    });
    const theme = makeLabel(map.theme.toUpperCase(), {
      fontSize: 9,
      letterSpacing: 2,
      fill: COLORS.textDim
    });
    const summary = makeText(lore?.shortDescription ?? modifier?.summary ?? map.theme, {
      fontSize: 9,
      fill: COLORS.text,
      wordWrap: true,
      wordWrapWidth: width - 88,
      lineHeight: 12
    });
    const mods = makeText(this.compactMapGameplay(map.id, lore?.gameplayMeaning ?? (modifier?.modifiers ?? []).join(' / ')), {
      fontSize: 8,
      fontWeight: '700',
      fill: COLORS.warn,
      wordWrap: true,
      wordWrapWidth: width - 88,
      lineHeight: 11
    });
    const difficultyDots = new Graphics();

    let hoveredState = false;
    const draw = (): void => {
      const selected = this.selectedMap.id === map.id;
      const hovered = hoveredState;
      const accentColor = map.backgroundColors.pathCore;
      frame.clear();
      frame.roundRect(-width / 2, -height / 2, width, height, 10)
        .fill({
          color: selected ? accentColor : hovered ? COLORS.bgGridStrong : UI_THEME.color.panel,
          alpha: selected ? 0.16 : 0.88
        })
        .stroke({
          color: selected ? accentColor : COLORS.panelEdge,
          width: selected ? 2 : 1,
          alpha: hovered || selected ? 1 : 0.7
        });
      // selection accent dot
      frame.circle(-width / 2 + 20, -22, 6)
        .fill({ color: accentColor, alpha: selected ? 1 : 0.55 })
        .stroke({ color: accentColor, width: 1, alpha: selected ? 0.95 : 0.4 });
      if (selected) {
        const pulse = 0.5 + Math.sin(this.elapsed * 3) * 0.5;
        frame.roundRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, 12)
          .stroke({ color: accentColor, width: 1, alpha: 0.22 + pulse * 0.28 });
      }
      // difficulty pips on the right
      difficultyDots.clear();
      const pipRadius = 3;
      const pipGap = 4;
      const pipCount = 5;
      const totalPipW = pipCount * (pipRadius * 2) + (pipCount - 1) * pipGap;
      const pipStartX = width / 2 - 14 - totalPipW;
      const pipY = -height / 2 + 14;
      for (let i = 0; i < pipCount; i++) {
        const cx = pipStartX + i * (pipRadius * 2 + pipGap) + pipRadius;
        const lit = i < map.difficulty;
        difficultyDots.circle(cx, pipY, pipRadius)
          .fill({ color: lit ? accentColor : COLORS.panelEdge, alpha: lit ? 0.95 : 0.55 });
        if (lit) {
          difficultyDots.circle(cx, pipY, pipRadius + 2)
            .stroke({ color: accentColor, width: 1, alpha: selected ? 0.6 : 0.3 });
        }
      }
      // difficulty label above the pips
      title.style.fill = selected ? accentColor : COLORS.text;
      theme.style.fill = selected ? COLORS.text : COLORS.textDim;
      summary.style.fill = selected ? COLORS.text : COLORS.textDim;
      mods.style.fill = selected ? COLORS.warn : 0x9aa6bd;
    };

    title.anchor.set(0, 0.5);
    title.position.set(-width / 2 + 42, -30);
    theme.anchor.set(0, 0.5);
    theme.position.set(-width / 2 + 42, -13);
    summary.anchor.set(0, 0);
    summary.position.set(-width / 2 + 42, 7);
    mods.anchor.set(0, 0);
    mods.position.set(-width / 2 + 42, 36);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.hitArea = new Rectangle(-width / 2 - 16, -height / 2 - 12, width + 32, height + 24);
    button.on('pointerover', () => { hoveredState = true; draw(); });
    button.on('pointerout', () => { hoveredState = false; draw(); });
    button.on('pointertap', () => {
      this.selectedMap = map;
      audioManager.playSfx('ui-click');
      this.refreshMapButtons();
      this.refreshBestWave();
    });
    this.mapButtonDrawers.push(draw);
    draw();
    button.addChild(frame, difficultyDots, title, theme, summary, mods);
    return button;
  }

  private refreshMapButtons(): void {
    for (const redraw of this.mapButtonDrawers) redraw();
  }

  private compactMapGameplay(mapId: string, fallback: string): string {
    const copy: Record<string, string> = {
      'fractured-mind': 'Balanced layout. Learn coverage and upgrades.',
      'silent-lake': 'Long sight lines. Range and scaling matter.',
      'panic-circuit': 'Short sight lines. Control and Trust matter.',
      'memory-palace': 'Elite pressure. Pride and Guilt matter.',
      'burnout-sector': 'Many chokes. Tight placement matters.'
    };
    return copy[mapId] ?? fallback;
  }

  private createModeButton(mode: GameMode, x: number, y: number): Container {
    const button = new Container();
    const width = 170;
    const height = 46;
    const frame = new Graphics();
    const label = makeLabel(CHALLENGE_MODE_LABEL[mode].toUpperCase(), {
      fontSize: 9,
      letterSpacing: 1,
      fill: COLORS.text
    });

    let hoveredState = false;
    const draw = (): void => {
      const selected = this.selectedMode === mode;
      frame.clear();
      frame.roundRect(-width / 2, -height / 2, width, height, 7)
        .fill({ color: selected ? COLORS.pathCore : hoveredState ? COLORS.bgGridStrong : UI_THEME.color.panel, alpha: selected ? 0.18 : 0.88 })
        .stroke({ color: selected ? COLORS.pathCore : COLORS.panelEdge, width: selected ? 2 : 1, alpha: selected || hoveredState ? 1 : 0.7 });
      if (selected) frame.rect(-width / 2 + 10, height / 2 - 4, width - 20, 2).fill({ color: COLORS.pathCore, alpha: 0.86 });
      label.style.fill = selected ? COLORS.pathCore : COLORS.text;
    };

    label.anchor.set(0.5);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.hitArea = new Rectangle(-width / 2 - 14, -height / 2 - 10, width + 28, height + 20);
    button.on('pointerover', () => { hoveredState = true; draw(); });
    button.on('pointerout', () => { hoveredState = false; draw(); });
    button.on('pointertap', () => {
      this.selectedMode = mode;
      if (mode === 'limitedEmotions') this.challengeSeed = randomSeed();
      audioManager.playSfx('ui-click');
      this.refreshModeButtons();
      this.refreshModeInfo();
      this.refreshBestWave();
    });
    this.modeButtonDrawers.push(draw);
    draw();
    button.addChild(frame, label);
    return button;
  }

  private refreshModeButtons(): void {
    for (const redraw of this.modeButtonDrawers) redraw();
  }

  private createSelectedRunConfig(): RunConfig {
    return createChallengeRunConfig(this.selectedMode, this.selectedMap.id, this.selectedMode === 'standard' ? 'standard' : this.challengeSeed);
  }

  private refreshModeInfo(): void {
    if (!this.modeInfoText) return;
    const config = this.createSelectedRunConfig();
    const pool = config.allowedTowers?.map((type) => EMOTION_LABEL[type]).join(', ');
    const seedLine = this.selectedMode === 'limitedEmotions' ? `Seed ${config.seed} / ${pool}` : `Seed ${config.seed}`;
    const rules = config.rules.slice(0, 2).join(' / ');
    this.modeInfoText.text = `${CHALLENGE_MODE_LABEL[this.selectedMode]} - ${CHALLENGE_MODE_DIFFICULTY[this.selectedMode]}\n${rules || CHALLENGE_MODE_DESCRIPTION[this.selectedMode]} / ${seedLine}`;
  }

  private showResetConfirm(): void {
    if (this.resetConfirm) return;

    const panel = new Container();
    const frame = new Graphics();
    frame.roundRect(-260, -94, 520, 188, 10)
      .fill({ color: 0x05070d, alpha: 0.98 })
      .stroke({ color: COLORS.danger, width: 2, alpha: 0.95 });

    const title = makeHeadline(MENU_COPY.resetTitle, {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 4,
      fill: COLORS.danger
    });
    title.anchor.set(0.5);
    title.position.set(0, -52);

    const body = makeLabel(MENU_COPY.resetBody, {
      fontSize: 11,
      letterSpacing: 2,
      fill: COLORS.textDim
    });
    body.anchor.set(0.5);
    body.position.set(0, -16);

    const confirm = this.createSmallButton(MENU_COPY.confirm, -94, 50, COLORS.danger, () => {
      this.saveData = saveManager.reset();
      this.refreshBestWave();
      this.hideResetConfirm();
    });
    const cancel = this.createSmallButton(MENU_COPY.cancel, 94, 50, COLORS.pathCore, () => this.hideResetConfirm());

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
    button.hitArea = new Rectangle(-88, -28, 176, 56);
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointertap', onClick);
    button.on('pointertap', () => audioManager.playSfx('ui-click'));
    button.addChild(frame, text);
    return button;
  }

  private refreshBestWave(): void {
    if (!this.bestWaveText) return;
    const record = saveManager.getChallengeRecord(this.selectedMode, this.selectedMap.id);
    this.bestWaveText.text = record
      ? MENU_COPY.best(record.bestWave, record.bestScore)
      : MENU_COPY.best(this.saveData.bestWave, this.saveData.bestScore);
  }
}
