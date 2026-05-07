import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { CANVAS, COLORS, ENEMY_STATS } from '../game/config';
import { EnemyKind } from '../game/types';
import { makeLabel, makeText } from '../ui/text';

export interface DevToolsSnapshot {
  wave: number;
  memory: number;
  stability: number;
  maxStability: number;
  enemies: number;
  towers: number;
  projectiles: number;
  score: number;
}

export interface DevToolsCallbacks {
  addMemory(amount: number): void;
  healCore(): void;
  damageCore(amount: number): void;
  jumpToWave(wave: number): void;
  spawnEnemy(kind: EnemyKind): void;
  killAllEnemies(): void;
  logRunStats(): void;
  logEconomyReport(): void;
  copyRunSummary(): void;
  snapshot(): DevToolsSnapshot;
}

const ENEMY_KINDS: EnemyKind[] = [
  EnemyKind.Doubtling,
  EnemyKind.PanicRunner,
  EnemyKind.GuiltGiant,
  EnemyKind.ShameSwarm,
  EnemyKind.EnvyLeech,
  EnemyKind.BurnoutBrute,
  EnemyKind.VoidWraith,
  EnemyKind.Overthinker,
  EnemyKind.NumbOne,
  EnemyKind.Spiral
];

export class DevToolsOverlay {
  readonly container = new Container();
  private readonly callbacks: DevToolsCallbacks;
  private readonly metricsText: Text;
  private readonly waveValue: Text;
  private readonly enemyValue: Text;
  private metricsVisible = true;
  private waveTarget = 1;
  private enemyIndex = 0;
  private fps = 0;

  constructor(callbacks: DevToolsCallbacks) {
    this.callbacks = callbacks;
    this.container.label = 'dev-tools-overlay';
    this.container.position.set(12, CANVAS.hudHeight + 12);
    this.container.eventMode = 'static';

    const bg = new Graphics();
    bg.roundRect(0, 0, 238, 406, 8)
      .fill({ color: 0x05070d, alpha: 0.9 })
      .stroke({ color: 0xffd166, width: 1.5, alpha: 0.9 });
    this.container.addChild(bg);

    const title = makeLabel('DEV TOOLS', { fontSize: 11, letterSpacing: 2, fill: 0xffd166 });
    title.position.set(12, 10);
    this.container.addChild(title);

    let y = 34;
    this.addButton('ADD 500 MEMORY', 12, y, 102, () => this.callbacks.addMemory(500));
    this.addButton('HEAL CORE', 124, y, 102, () => this.callbacks.healCore());
    y += 32;
    this.addButton('DAMAGE CORE', 12, y, 102, () => this.callbacks.damageCore(3));
    this.addButton('KILL ENEMIES', 124, y, 102, () => this.callbacks.killAllEnemies());

    y += 42;
    const waveLabel = makeLabel('JUMP TO WAVE', { fontSize: 9, letterSpacing: 1 });
    waveLabel.position.set(12, y);
    this.container.addChild(waveLabel);
    y += 16;
    this.addButton('-', 12, y, 30, () => this.setWaveTarget(this.waveTarget - 1));
    this.waveValue = makeText('', { fontSize: 12, fill: COLORS.text, fontWeight: '700' });
    this.waveValue.anchor.set(0.5);
    this.waveValue.position.set(78, y + 12);
    this.container.addChild(this.waveValue);
    this.addButton('+', 114, y, 30, () => this.setWaveTarget(this.waveTarget + 1));
    this.addButton('JUMP', 154, y, 72, () => this.callbacks.jumpToWave(this.waveTarget));

    y += 42;
    const spawnLabel = makeLabel('SPAWN ENEMY', { fontSize: 9, letterSpacing: 1 });
    spawnLabel.position.set(12, y);
    this.container.addChild(spawnLabel);
    y += 16;
    this.addButton('<', 12, y, 30, () => this.setEnemyIndex(this.enemyIndex - 1));
    this.enemyValue = makeText('', { fontSize: 10, fill: COLORS.text, fontWeight: '700' });
    this.enemyValue.anchor.set(0.5);
    this.enemyValue.position.set(94, y + 12);
    this.container.addChild(this.enemyValue);
    this.addButton('>', 154, y, 30, () => this.setEnemyIndex(this.enemyIndex + 1));
    this.addButton('SPAWN', 12, y + 32, 214, () => this.callbacks.spawnEnemy(ENEMY_KINDS[this.enemyIndex]));

    y += 76;
    this.addButton('TOGGLE METRICS', 12, y, 214, () => {
      this.metricsVisible = !this.metricsVisible;
      this.metricsText.visible = this.metricsVisible;
    });
    y += 32;
    this.addButton('LOG RUNSTATS JSON', 12, y, 214, () => this.callbacks.logRunStats());
    y += 32;
    this.addButton('LOG ECONOMY REPORT', 12, y, 214, () => this.callbacks.logEconomyReport());
    y += 32;
    this.addButton('COPY RUN SUMMARY', 12, y, 214, () => this.callbacks.copyRunSummary());

    this.metricsText = makeText('', {
      fontSize: 10,
      fill: 0x77ffaa,
      lineHeight: 14,
      letterSpacing: 0
    });
    this.metricsText.position.set(12, 360);
    this.container.addChild(this.metricsText);

    this.setWaveTarget(1);
    this.setEnemyIndex(0);
  }

  update(dt: number): void {
    const instant = dt > 0 ? 1 / dt : 0;
    this.fps = this.fps === 0 ? instant : this.fps * 0.9 + instant * 0.1;
    const s = this.callbacks.snapshot();
    this.waveTarget = Math.max(1, this.waveTarget || s.wave + 1);
    if (!this.metricsVisible) return;
    this.metricsText.text =
      `FPS ${Math.round(this.fps)} | Score ${s.score}\n` +
      `Wave ${s.wave} | Memory ${s.memory}\n` +
      `Core ${s.stability}/${s.maxStability}\n` +
      `Enemies ${s.enemies} | Towers ${s.towers} | Proj ${s.projectiles}`;
  }

  private setWaveTarget(wave: number): void {
    this.waveTarget = Math.max(1, Math.min(999, Math.floor(wave)));
    this.waveValue.text = `${this.waveTarget}`;
  }

  private setEnemyIndex(index: number): void {
    this.enemyIndex = (index + ENEMY_KINDS.length) % ENEMY_KINDS.length;
    this.enemyValue.text = ENEMY_STATS[ENEMY_KINDS[this.enemyIndex]].label.toUpperCase();
  }

  private addButton(label: string, x: number, y: number, width: number, onClick: () => void): void {
    const button = new Container();
    const bg = new Graphics();
    const text = makeLabel(label, { fontSize: 9, letterSpacing: 1, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      bg.clear();
      bg.roundRect(0, 0, width, 24, 6)
        .fill({ color: hovered ? 0x2a2412 : 0x0a0f1a, alpha: 0.96 })
        .stroke({ color: hovered ? 0xffd166 : COLORS.panelEdge, width: 1, alpha: 0.9 });
    };
    draw(false);
    text.anchor.set(0.5);
    text.position.set(width / 2, 12);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      onClick();
    });
    button.addChild(bg, text);
    this.container.addChild(button);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
