import { Application, Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { saveManager, type QualitySetting, type SaveData, type SaveManager } from '../core/SaveManager';
import { CANVAS, COLORS } from '../game/config';
import { makeLabel, makeText } from '../ui/text';
import { MainMenuScene } from './MainMenuScene';

export class SettingsScene implements Scene {
  private readonly app: Application;
  private readonly sceneManager: SceneManager;
  private readonly saves: SaveManager;
  private readonly root = new Container();
  private data: SaveData;
  private mutedValue: Text | null = null;
  private screenShakeValue: Text | null = null;
  private qualityValue: Text | null = null;
  private bestValue: Text | null = null;

  constructor(app: Application, sceneManager: SceneManager, saves: SaveManager = saveManager) {
    this.app = app;
    this.sceneManager = sceneManager;
    this.saves = saves;
    this.data = this.saves.load();
  }

  init(): void {
    this.data = this.saves.load();
    this.drawPanel();

    const title = makeText('SETTINGS', {
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: 5,
      fill: COLORS.warn
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS.width / 2, 160);

    this.bestValue = makeLabel('', { fontSize: 12, letterSpacing: 2, fill: COLORS.textDim });
    this.bestValue.anchor.set(0.5);
    this.bestValue.position.set(CANVAS.width / 2, 235);

    const muted = this.createSettingButton('MUTED', 285, () => {
      this.data = this.saves.updateSettings({ muted: !this.data.settings.muted });
      audioManager.applySettings(this.data.settings);
      this.refreshValues();
    });
    this.mutedValue = muted.value;

    const screenShake = this.createSettingButton('SCREEN SHAKE', 365, () => {
      this.data = this.saves.updateSettings({ screenShake: !this.data.settings.screenShake });
      audioManager.applySettings(this.data.settings);
      this.refreshValues();
    });
    this.screenShakeValue = screenShake.value;

    const quality = this.createSettingButton('QUALITY', 445, () => {
      this.data = this.saves.updateSettings({ quality: this.nextQuality(this.data.settings.quality) });
      audioManager.applySettings(this.data.settings);
      this.refreshValues();
    });
    this.qualityValue = quality.value;

    this.refreshValues();
    this.root.addChild(title, this.bestValue, muted.button, screenShake.button, quality.button, this.createBackButton());
    this.app.stage.addChild(this.root);
  }

  update(_deltaSeconds: number): void {
    // Static placeholder scene.
  }

  destroy(): void {
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private drawPanel(): void {
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: COLORS.bg });
    bg.roundRect(300, 110, 680, 500, 8)
      .fill({ color: COLORS.panel, alpha: 0.96 })
      .stroke({ color: COLORS.warn, width: 2, alpha: 0.8 });
    this.root.addChild(bg);
  }

  private createBackButton(): Container {
    const button = new Container();
    const frame = new Graphics();
    const label = makeLabel('BACK', { fontSize: 13, letterSpacing: 3, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-70, -24, 140, 48, 8)
        .fill({ color: hovered ? 0xffd166 : COLORS.panel, alpha: hovered ? 0.2 : 0.9 })
        .stroke({ color: COLORS.warn, width: 2, alpha: 0.9 });
    };

    draw(false);
    label.anchor.set(0.5);
    button.position.set(CANVAS.width / 2, 525);
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

  private createSettingButton(labelText: string, y: number, onClick: () => void): { button: Container; value: Text } {
    const button = new Container();
    const frame = new Graphics();
    const label = makeLabel(labelText, { fontSize: 12, letterSpacing: 3, fill: COLORS.textDim });
    const value = makeLabel('', { fontSize: 14, letterSpacing: 2, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-190, -26, 380, 52, 8)
        .fill({ color: hovered ? 0xffd166 : COLORS.panel, alpha: hovered ? 0.18 : 0.92 })
        .stroke({ color: COLORS.warn, width: 2, alpha: hovered ? 1 : 0.7 });
    };

    draw(false);
    label.anchor.set(0, 0.5);
    label.position.set(-160, 0);
    value.anchor.set(1, 0.5);
    value.position.set(160, 0);
    button.position.set(CANVAS.width / 2, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointertap', () => {
      audioManager.playSfx('ui-click');
      onClick();
    });
    button.addChild(frame, label, value);
    return { button, value };
  }

  private refreshValues(): void {
    if (!this.bestValue || !this.mutedValue || !this.screenShakeValue || !this.qualityValue) return;
    this.bestValue.text = `BEST WAVE ${this.data.bestWave}  /  BEST SCORE ${this.data.bestScore}`;
    this.mutedValue.text = this.data.settings.muted ? 'ON' : 'OFF';
    this.screenShakeValue.text = this.data.settings.screenShake ? 'ON' : 'OFF';
    this.qualityValue.text = this.data.settings.quality.toUpperCase();
  }

  private nextQuality(current: QualitySetting): QualitySetting {
    if (current === 'low') return 'medium';
    if (current === 'medium') return 'high';
    return 'low';
  }
}
