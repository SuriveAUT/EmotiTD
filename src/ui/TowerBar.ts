import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import { CANVAS, COLORS, EMOTION_COLOR, EMOTION_LABEL, TOWER_STATS } from '../game/config';
import { EMOTION_TYPES, EmotionType } from '../game/types';
import { makeLabel, makeText } from './text';

export interface TowerBarCallbacks {
  onSelect(type: EmotionType | null): void;
  onStartWave(): void;
  onPauseToggle(): void;
  onSpeedToggle(): void;
  onAutoStartToggle(): void;
  onRestart(): void;
}

const BUTTON_W = 66;
const BUTTON_H = 72;
const BUTTON_GAP = 6;

class TowerButton {
  readonly container: Container;
  readonly type: EmotionType;
  private bg: Graphics;
  private icon: Graphics;
  selected = false;
  affordable = true;
  hovered = false;

  constructor(type: EmotionType, onClick: () => void) {
    this.type = type;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.bg = new Graphics();
    this.icon = new Graphics();
    this.container.addChild(this.bg, this.icon);

    const stats = TOWER_STATS[type];
    const label = makeText(EMOTION_LABEL[type], { fontSize: 9, fontWeight: '700', letterSpacing: 0, fill: 0xe8edf2 });
    label.position.set(6, 8);
    const cost = makeText(`${stats.cost}`, { fontSize: 16, fontWeight: '700', fill: 0xffd166 });
    cost.anchor.set(1, 0);
    cost.position.set(BUTTON_W - 6, 23);
    const sub = makeLabel(this.subFor(type), { fontSize: 8, letterSpacing: 0 });
    sub.position.set(6, BUTTON_H - 15);
    this.container.addChild(label, cost, sub);

    this.draw();
    this.drawIcon();

    this.container.on('pointerover', () => { this.hovered = true; this.draw(); });
    this.container.on('pointerout',  () => { this.hovered = false; this.draw(); });
    this.container.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      audioManager.playSfx('ui-click');
      onClick();
    });
  }

  private subFor(t: EmotionType): string {
    switch (t) {
      case EmotionType.Anger:   return 'SPLASH';
      case EmotionType.Sadness: return 'RANGE / SLOW';
      case EmotionType.Joy:     return 'CHAIN';
      case EmotionType.Fear:    return 'STUN';
      case EmotionType.Calm:    return 'SUPPORT';
      case EmotionType.Hope:    return 'ANTI-NUMB';
      case EmotionType.Disgust: return 'POISON';
      case EmotionType.Guilt:   return 'MARK';
      case EmotionType.Trust:   return 'SHIELD';
    }
  }

  setSelected(s: boolean) { this.selected = s; this.draw(); }
  setAffordable(a: boolean) { this.affordable = a; this.draw(); }

  private draw() {
    const g = this.bg;
    const c = EMOTION_COLOR[this.type];
    g.clear();
    g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).fill({ color: 0x0a0f1a, alpha: 0.95 });
    if (this.selected) {
      g.roundRect(-2, -2, BUTTON_W + 4, BUTTON_H + 4, 10).stroke({ color: c, width: 2, alpha: 1 });
      g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).fill({ color: c, alpha: 0.14 });
    } else {
      const edgeAlpha = this.hovered ? 0.9 : 0.5;
      g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).stroke({ color: c, width: 1.5, alpha: edgeAlpha });
    }
    if (!this.affordable) g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).fill({ color: 0x000000, alpha: 0.55 });
  }

  private drawIcon() {
    const g = this.icon;
    g.clear();
    const cx = BUTTON_W - 18, cy = BUTTON_H - 23;
    const c = EMOTION_COLOR[this.type];
    g.circle(cx, cy, 14).fill({ color: c, alpha: 0.18 });
    g.circle(cx, cy, 9).fill({ color: c, alpha: 0.65 });
    g.circle(cx, cy, 4).fill({ color: 0xffffff, alpha: 1 });
  }
}

class ControlButton {
  readonly container: Container;
  private bg: Graphics;
  private label: Text;
  private width: number;
  private enabled = true;
  private active = false;

  constructor(width: number, labelText: string, onClick: () => void) {
    this.width = width;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= width && y >= 0 && y <= 26 } as any;
    this.bg = new Graphics();
    this.label = makeText(labelText, { fontSize: 10, fontWeight: '700', letterSpacing: 1, fill: 0xe8edf2 });
    this.label.anchor.set(0.5);
    this.label.position.set(width / 2, 13);
    this.container.addChild(this.bg, this.label);
    this.draw(width);
    this.container.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (this.enabled) {
        audioManager.playSfx('ui-click');
        onClick();
      }
    });
  }

  set(labelText: string, enabled: boolean, active = false) {
    this.label.text = labelText;
    this.enabled = enabled;
    this.active = active;
    this.container.cursor = enabled ? 'pointer' : 'not-allowed';
    this.draw(this.width);
  }

  private draw(width: number) {
    const g = this.bg;
    g.clear();
    const fill = this.active ? 0x263a34 : 0x0a0f1a;
    const edge = this.active ? 0x77ffaa : COLORS.panelEdge;
    g.roundRect(0, 0, width, 26, 6)
      .fill({ color: fill, alpha: this.enabled ? 0.96 : 0.72 })
      .stroke({ color: edge, width: 1, alpha: this.enabled ? 1 : 0.55 });
    this.label.alpha = this.enabled ? 1 : 0.45;
    this.label.style.fill = this.active ? 0x77ffaa : 0xe8edf2;
  }
}

export class TowerBar {
  readonly container: Container;
  private buttons: TowerButton[] = [];
  private startBtn: Container;
  private startBg: Graphics;
  private callbacks: TowerBarCallbacks;
  private startEnabled = true;
  private pauseControl: ControlButton;
  private speedControl: ControlButton;
  private autoControl: ControlButton;
  private restartControl: ControlButton;

  constructor(callbacks: TowerBarCallbacks) {
    this.callbacks = callbacks;
    this.container = new Container();
    this.container.label = 'tower-bar';
    this.container.y = CANVAS.height - CANVAS.towerBarHeight;

    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.towerBarHeight).fill({ color: COLORS.panel, alpha: 0.95 });
    bg.rect(0, 0, CANVAS.width, 1).fill({ color: COLORS.panelEdge, alpha: 1 });
    bg.rect(0, 1, CANVAS.width, 1).fill({ color: 0x6cf0ff, alpha: 0.16 });
    this.container.addChild(bg);

    let x = 20;
    const y = (CANVAS.towerBarHeight - BUTTON_H) / 2;
    for (const t of EMOTION_TYPES) {
      const b = new TowerButton(t, () => this.toggle(t));
      b.container.position.set(x, y);
      this.container.addChild(b.container);
      this.buttons.push(b);
      x += BUTTON_W + BUTTON_GAP;
    }

    /* start wave button */
    this.startBtn = new Container();
    this.startBtn.eventMode = 'static';
    this.startBtn.cursor = 'pointer';
    this.startBg = new Graphics();
    this.startBtn.addChild(this.startBg);
    const label = makeText('▶  START WAVE', { fontSize: 14, fontWeight: '700', letterSpacing: 3, fill: 0x05070d });
    label.anchor.set(0.5);
    label.position.set(86, 22);
    this.startBtn.addChild(label);
    const sub = makeText('SPACE', { fontSize: 9, fontWeight: '700', letterSpacing: 4, fill: 0x05070d });
    sub.anchor.set(0.5);
    sub.position.set(86, 44);
    sub.alpha = 0.7;
    this.startBtn.addChild(sub);
    this.startBtn.position.set(CANVAS.width - 192 - CANVAS.rightPanelWidth - 20, y);
    this.drawStartBg(false);
    this.startBtn.on('pointerover', () => this.drawStartBg(true));
    this.startBtn.on('pointerout',  () => this.drawStartBg(false));
    this.startBtn.on('pointerdown', () => {
      if (this.startEnabled) {
        audioManager.playSfx('ui-click');
        this.callbacks.onStartWave();
      }
    });
    this.container.addChild(this.startBtn);

    this.pauseControl = new ControlButton(60, 'PAUSE', () => this.callbacks.onPauseToggle());
    this.speedControl = new ControlButton(44, '1X', () => this.callbacks.onSpeedToggle());
    this.autoControl = new ControlButton(64, 'AUTO ON', () => this.callbacks.onAutoStartToggle());
    this.restartControl = new ControlButton(64, 'RESTART', () => this.callbacks.onRestart());
    const cx = 666;
    this.pauseControl.container.position.set(cx, y + 6);
    this.speedControl.container.position.set(cx + 70, y + 6);
    this.autoControl.container.position.set(cx, y + 40);
    this.restartControl.container.position.set(cx + 74, y + 40);
    this.container.addChild(
      this.pauseControl.container,
      this.speedControl.container,
      this.autoControl.container,
      this.restartControl.container
    );
  }

  private drawStartBg(hover: boolean) {
    const g = this.startBg;
    g.clear();
    const enabled = this.startEnabled;
    if (!enabled) {
      g.roundRect(0, 0, 172, 56, 10).fill({ color: 0x1a2238, alpha: 0.9 })
        .stroke({ color: COLORS.panelEdge, width: 1, alpha: 1 });
      return;
    }
    const fill = hover ? 0x9bffce : 0x77ffaa;
    g.roundRect(-2, -2, 176, 60, 12).stroke({ color: 0x77ffaa, width: 2, alpha: 0.7 });
    g.roundRect(0, 0, 172, 56, 10).fill({ color: fill, alpha: 1 });
  }

  setStartEnabled(enabled: boolean) {
    this.startEnabled = enabled;
    this.startBtn.cursor = enabled ? 'pointer' : 'not-allowed';
    this.drawStartBg(false);
  }

  setControls(state: {
    paused: boolean;
    speedMultiplier: number;
    autoStartEnabled: boolean;
    canRestart: boolean;
  }) {
    this.pauseControl.set(state.paused ? 'RESUME' : 'PAUSE', true, state.paused);
    this.speedControl.set(`${state.speedMultiplier}X`, true, state.speedMultiplier > 1);
    this.autoControl.set(state.autoStartEnabled ? 'AUTO ON' : 'AUTO OFF', true, state.autoStartEnabled);
    this.restartControl.set('RESTART', state.canRestart, false);
  }

  setSelected(t: EmotionType | null) {
    for (const b of this.buttons) b.setSelected(b.type === t);
  }

  setAffordability(memory: number) {
    for (const b of this.buttons) b.setAffordable(TOWER_STATS[b.type].cost <= memory);
  }

  private toggle(t: EmotionType) {
    const cur = this.buttons.find(b => b.selected);
    const next = cur && cur.type === t ? null : t;
    this.callbacks.onSelect(next);
  }
}
