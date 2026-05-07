import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import { CANVAS, COLORS, EMOTION_COLOR, EMOTION_LABEL, TOWER_BAR_COPY, TOWER_HELP_COPY, TOWER_STATS } from '../game/config';
import { EMOTION_TYPES, EmotionType, TOWER_CATEGORIES, TOWER_CATEGORY_LABEL, type TowerCategory } from '../game/types';
import { makeLabel, makeText } from './text';
import { UI_THEME } from './theme';

export interface TowerBarCallbacks {
  onSelect(type: EmotionType | null): void;
  onStartWave(): void;
  onPauseToggle(): void;
  onSpeedToggle(): void;
  onAutoStartToggle(): void;
  onRestart(): void;
}

export interface TowerBarOptions {
  allowedTowers?: EmotionType[];
}

/* ------------------------------------------------------------------ *
 *  Layout — bar height stays at 96 px so the playfield grid stays
 *  aligned. The bar splits into a small tab strip (top) and the
 *  filtered tower row (below). Controls + START WAVE keep their
 *  positions on the right side of the bar.
 * ------------------------------------------------------------------ */
const TAB_W = 84;
const TAB_H = 22;
const TAB_GAP = 6;
const TAB_BASE_X = 16;
const TAB_BASE_Y = 4;

const BUTTON_W = 60;
const BUTTON_H = 60;
const BUTTON_GAP = 6;
const BUTTON_BASE_X = 16;
const BUTTON_BASE_Y = 32;

const TOWER_BUTTON_LABEL: Record<EmotionType, string> = {
  [EmotionType.Anger]: 'ANGER',
  [EmotionType.Sadness]: 'SAD',
  [EmotionType.Joy]: 'JOY',
  [EmotionType.Fear]: 'FEAR',
  [EmotionType.Calm]: 'CALM',
  [EmotionType.Hope]: 'HOPE',
  [EmotionType.Disgust]: 'DISG',
  [EmotionType.Guilt]: 'GUILT',
  [EmotionType.Trust]: 'TRUST',
  [EmotionType.Shame]: 'SHAME',
  [EmotionType.Love]: 'LOVE',
  [EmotionType.Pride]: 'PRIDE'
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

class TowerButton {
  readonly container: Container;
  readonly type: EmotionType;
  readonly category: TowerCategory;
  private bg: Graphics;
  private icon: Graphics;
  selected = false;
  affordable = true;
  hovered = false;
  private pulse = 0;

  constructor(type: EmotionType, onClick: () => void, onHover: (hovered: boolean) => void) {
    this.type = type;
    this.category = TOWER_STATS[type].category;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.hitArea = { contains: (x: number, y: number) => x >= -4 && x <= BUTTON_W + 4 && y >= -4 && y <= BUTTON_H + 4 } as any;
    this.bg = new Graphics();
    this.icon = new Graphics();
    this.container.addChild(this.bg, this.icon);

    const stats = TOWER_STATS[type];
    const label = makeText(TOWER_BUTTON_LABEL[type], { fontSize: 8, fontWeight: '700', letterSpacing: 0, fill: 0xe8edf2 });
    label.position.set(5, 6);
    const cost = makeText(`${stats.cost}`, { fontSize: 13, fontWeight: '700', fill: 0xffd166 });
    cost.anchor.set(1, 0);
    cost.position.set(BUTTON_W - 5, 20);
    const sub = makeLabel(TOWER_BAR_COPY.subLabel[type], { fontSize: 7, letterSpacing: 0 });
    sub.position.set(5, BUTTON_H - 12);
    this.container.addChild(label, cost, sub);

    this.draw();
    this.drawIcon();

    this.container.on('pointerover', () => { this.hovered = true; this.container.scale.set(1.035); this.draw(); onHover(true); });
    this.container.on('pointerout',  () => { this.hovered = false; this.container.scale.set(1); this.draw(); onHover(false); });
    this.container.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      audioManager.playSfx('ui-click');
      this.pulse = 1;
      onClick();
    });
  }

  setSelected(s: boolean) { this.selected = s; this.draw(); }
  setAffordable(a: boolean) { this.affordable = a; this.draw(); }

  private draw() {
    const g = this.bg;
    const c = EMOTION_COLOR[this.type];
    g.clear();
    const pulseAlpha = this.pulse > 0 ? this.pulse * 0.25 : 0;
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - 0.18);
    g.roundRect(-2, -2, BUTTON_W + 4, BUTTON_H + 4, 10).fill({ color: c, alpha: pulseAlpha });
    g.roundRect(0, 0, BUTTON_W, BUTTON_H, UI_THEME.radius.md).fill({ color: 0x080d18, alpha: 0.97 });
    g.roundRect(1, 1, BUTTON_W - 2, Math.floor(BUTTON_H * 0.48), UI_THEME.radius.md).fill({ color: c, alpha: this.affordable ? 0.08 : 0.03 });
    if (this.selected) {
      g.roundRect(-2, -2, BUTTON_W + 4, BUTTON_H + 4, 10).stroke({ color: c, width: 2, alpha: 1 });
      g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).fill({ color: c, alpha: 0.16 });
      g.rect(6, BUTTON_H - 4, BUTTON_W - 12, 2).fill({ color: c, alpha: 0.95 });
    } else {
      const edgeAlpha = this.hovered ? 0.9 : 0.5;
      g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).stroke({ color: c, width: 1.5, alpha: edgeAlpha });
    }
    if (!this.affordable) {
      g.roundRect(0, 0, BUTTON_W, BUTTON_H, 8).fill({ color: 0x000000, alpha: 0.55 });
      g.moveTo(8, BUTTON_H - 8).lineTo(BUTTON_W - 8, BUTTON_H - 8).stroke({ color: UI_THEME.color.danger, width: 1, alpha: 0.7 });
    }
  }

  private drawIcon() {
    const g = this.icon;
    g.clear();
    const cx = BUTTON_W - 14, cy = BUTTON_H - 18;
    const c = EMOTION_COLOR[this.type];
    g.circle(cx, cy, 10).fill({ color: c, alpha: 0.18 });
    g.circle(cx, cy, 6.5).fill({ color: c, alpha: 0.65 });
    g.circle(cx, cy, 2.8).fill({ color: 0xffffff, alpha: 1 });
  }
}

class TowerTooltip {
  readonly container: Container;
  private readonly bg: Graphics;
  private readonly body: Container;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
    this.container.visible = false;
    this.bg = new Graphics();
    this.body = new Container();
    this.container.addChild(this.bg, this.body);
  }

  show(type: EmotionType, anchorX: number, _anchorY: number): void {
    const oldChildren = this.body.removeChildren();
    for (const child of oldChildren) child.destroy({ children: true });

    const stats = TOWER_STATS[type];
    const color = EMOTION_COLOR[type];
    const width = 286;
    const pad = 12;
    const textWidth = width - pad * 2;
    let y = pad;

    const title = makeText(EMOTION_LABEL[type], {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 2,
      fill: color
    });
    title.position.set(pad, y);
    this.body.addChild(title);

    const role = makeLabel(TOWER_BAR_COPY.subLabel[type], {
      fontSize: 9,
      letterSpacing: 2,
      fill: COLORS.warn
    });
    role.anchor.set(1, 0);
    role.position.set(width - pad, y + 3);
    this.body.addChild(role);
    y += 26;

    const help = TOWER_HELP_COPY[type];
    const meta = makeText(`${TOWER_CATEGORY_LABEL[stats.category]}  /  ${help.role}`, {
      fontSize: 11,
      fill: 0xc0c8d8,
      wordWrap: true,
      wordWrapWidth: textWidth,
      lineHeight: 15
    });
    meta.position.set(pad, y);
    this.body.addChild(meta);
    y += Math.max(18, meta.height as number) + 10;

    const rows = this.statRows(type);
    for (let i = 0; i < rows.length; i++) {
      const [label, value] = rows[i];
      const rowY = y + i * 17;
      const key = makeLabel(label, { fontSize: 9, letterSpacing: 1, fill: 0x7d8ba6 });
      key.position.set(pad, rowY);
      const val = makeText(value, { fontSize: 10, fontWeight: '700', fill: 0xe8edf2 });
      val.anchor.set(1, 0);
      val.position.set(width - pad, rowY - 1);
      this.body.addChild(key, val);
    }
    y += rows.length * 17 + 8;

    y = this.addSection('STRENGTHS', help.strengths.join(' / '), pad, y, textWidth, 0x77ffaa);
    y = this.addSection('WEAKNESSES', help.weaknesses.join(' / '), pad, y, textWidth, 0xff9a7a);
    y = this.addSection('SYNERGIES', stats.synergies.map((emotion) => EMOTION_LABEL[emotion]).join(' / '), pad, y, textWidth, 0x6cf0ff);
    y = this.addSection('PLACEMENT', help.placement, pad, y, textWidth, 0xc0c8d8) + 2;

    this.bg.clear();
    this.bg.roundRect(0, 0, width, y, 8)
      .fill({ color: 0x05070d, alpha: 0.98 })
      .stroke({ color, width: 2, alpha: 0.95 });
    this.bg.roundRect(1, 1, width - 2, 44, 8).fill({ color, alpha: 0.08 });
    this.bg.rect(10, 0, width - 20, 2).fill({ color, alpha: 0.82 });

    const maxX = CANVAS.width - CANVAS.rightPanelWidth - width - 10;
    this.container.position.set(clamp(anchorX - width / 2, 10, maxX), -y - 14);
    this.container.alpha = 0.98;
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  private addSection(label: string, value: string, x: number, y: number, width: number, fill: number): number {
    const heading = makeLabel(label, { fontSize: 9, letterSpacing: 1, fill: 0x7d8ba6 });
    heading.position.set(x, y);
    const body = makeText(value, {
      fontSize: 10,
      fontWeight: label === 'PLACEMENT' ? '500' : '700',
      fill,
      wordWrap: true,
      wordWrapWidth: width,
      lineHeight: 14
    });
    body.position.set(x, y + 14);
    this.body.addChild(heading, body);
    return y + 18 + Math.max(14, body.height as number) + 5;
  }

  private statRows(type: EmotionType): [string, string][] {
    const stats = TOWER_STATS[type];
    const rows: [string, string][] = [
      ['COST', `${stats.cost}`],
      ['DAMAGE', `${Math.round(stats.damage)}`],
      ['RANGE', `${Math.round(stats.range)}`],
      ['FIRE RATE', `${stats.fireRate.toFixed(2)}s`]
    ];

    if (stats.splashRadius) rows.push(['SPLASH', `${Math.round(stats.splashRadius)}`]);
    if (stats.chainCount) rows.push(['CHAIN', `${stats.chainCount} / ${stats.chainRange}`]);
    if (stats.slowAmount) rows.push(['SLOW', `${Math.round((1 - stats.slowAmount) * 100)}% / ${stats.slowDuration}s`]);
    if (stats.fearChance) rows.push(['STUN', `${Math.round(stats.fearChance * 100)}% / ${stats.stunDuration}s`]);
    if (stats.buffRadius) rows.push(['BUFF', `${stats.buffRadius} / +${Math.round((1 - (stats.buffFireRate ?? 1)) * 100)}% tempo`]);
    if (stats.numbDamageMul) rows.push(['NUMB', `x${stats.numbDamageMul.toFixed(2)}`]);
    if (stats.poisonDps) rows.push(['POISON', `${stats.poisonDps.toFixed(1)}/s / ${stats.poisonDuration}s`]);
    if (stats.armorShred) rows.push(['SHRED', `x${stats.armorShred.toFixed(2)} / ${stats.armorShredDuration}s`]);
    if (stats.guiltMark) rows.push(['MARK', `+${Math.round(stats.guiltMark * 100)}% / hit`]);
    if (stats.guiltExecuteThreshold) rows.push(['EXECUTE', `${Math.round(stats.guiltExecuteThreshold * 100)}% HP`]);
    if (stats.coreShield) rows.push(['SHIELD', `+${stats.coreShield.toFixed(2)} Core`]);
    if (stats.trustAnchorDuration) rows.push(['ANCHOR', `${stats.trustAnchorDuration.toFixed(2)}s`]);
    if (stats.shameGroupDamageMul) rows.push(['GROUP', `x${stats.shameGroupDamageMul.toFixed(2)} / ${stats.shameGroupRadius}`]);
    if (stats.loveLinkRadius) rows.push(['LINK', `${stats.loveLinkRadius} / x${stats.loveDamageMul?.toFixed(2) ?? '1.00'}`]);
    if (stats.prideIsolationDamageMul) rows.push(['ISOLATED', `x${stats.prideIsolationDamageMul.toFixed(2)}`]);

    return rows;
  }
}

class CategoryTab {
  readonly container: Container;
  readonly category: TowerCategory;
  private bg: Graphics;
  private label: Text;
  private active = false;
  private hovered = false;

  constructor(category: TowerCategory, onClick: () => void) {
    this.category = category;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.hitArea = { contains: (x: number, y: number) => x >= -4 && x <= TAB_W + 4 && y >= -10 && y <= TAB_H + 10 } as any;
    this.bg = new Graphics();
    this.label = makeText(TOWER_CATEGORY_LABEL[category], {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 2,
      fill: 0xe8edf2
    });
    this.label.anchor.set(0.5);
    this.label.position.set(TAB_W / 2, TAB_H / 2 + 1);
    this.container.addChild(this.bg, this.label);
    this.draw();

    this.container.on('pointerover', () => { this.hovered = true; this.draw(); });
    this.container.on('pointerout',  () => { this.hovered = false; this.draw(); });
    this.container.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      audioManager.playSfx('ui-click');
      onClick();
    });
  }

  setActive(active: boolean) {
    this.active = active;
    this.draw();
  }

  private draw() {
    const g = this.bg;
    g.clear();
    const fill = this.active ? 0x162236 : 0x0a0f1a;
    const edge = this.active ? 0x6cf0ff : COLORS.panelEdge;
    g.roundRect(0, 0, TAB_W, TAB_H, 6)
      .fill({ color: fill, alpha: 0.95 })
      .stroke({ color: edge, width: this.active ? 1.5 : 1, alpha: this.active || this.hovered ? 1 : 0.6 });
    if (this.active) {
      g.rect(7, TAB_H - 2, TAB_W - 14, 2).fill({ color: 0x6cf0ff, alpha: 0.95 });
      g.roundRect(2, 2, TAB_W - 4, TAB_H - 4, 5).fill({ color: 0x6cf0ff, alpha: 0.08 });
    }
    this.label.style.fill = this.active ? 0x6cf0ff : 0xe8edf2;
    this.label.alpha = this.active || this.hovered ? 1 : 0.78;
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
  private buttonsByCategory: Record<TowerCategory, TowerButton[]> = {
    damage: [], control: [], support: [], defense: []
  };
  private tabs: CategoryTab[] = [];
  private startBtn: Container;
  private startBg: Graphics;
  private callbacks: TowerBarCallbacks;
  private startEnabled = true;
  private pauseControl: ControlButton;
  private speedControl: ControlButton;
  private autoControl: ControlButton;
  private restartControl: ControlButton;
  private selectedCategory: TowerCategory = 'damage';
  private tooltip: TowerTooltip;

  constructor(callbacks: TowerBarCallbacks, options: TowerBarOptions = {}) {
    this.callbacks = callbacks;
    this.container = new Container();
    this.container.label = 'tower-bar';
    this.container.y = CANVAS.height - CANVAS.towerBarHeight;
    this.container.eventMode = 'static';
    this.container.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= CANVAS.width && y >= 0 && y <= CANVAS.towerBarHeight } as any;
    this.container.on('pointerdown', (e: FederatedPointerEvent) => e.stopPropagation());
    this.tooltip = new TowerTooltip();

    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.towerBarHeight).fill({ color: COLORS.panel, alpha: 0.95 });
    bg.rect(0, 0, CANVAS.width, 1).fill({ color: COLORS.panelEdge, alpha: 1 });
    bg.rect(0, 1, CANVAS.width, 1).fill({ color: 0x6cf0ff, alpha: 0.16 });
    this.container.addChild(bg);

    /* category tabs */
    TOWER_CATEGORIES.forEach((category, i) => {
      const tab = new CategoryTab(category, () => this.setCategory(category));
      tab.container.position.set(TAB_BASE_X + i * (TAB_W + TAB_GAP), TAB_BASE_Y);
      this.container.addChild(tab.container);
      this.tabs.push(tab);
    });

    /* tower buttons — created once, positioned per category, visibility toggled on tab change */
    const allowed = options.allowedTowers ? new Set(options.allowedTowers) : null;
    for (const t of EMOTION_TYPES) {
      if (allowed && !allowed.has(t)) continue;
      const b = new TowerButton(
        t,
        () => this.toggle(t),
        (hovered) => {
          if (hovered && b.container.visible) {
            this.tooltip.show(t, b.container.x + BUTTON_W / 2, b.container.y);
          } else {
            this.tooltip.hide();
          }
        }
      );
      this.container.addChild(b.container);
      this.buttons.push(b);
      this.buttonsByCategory[b.category].push(b);
    }
    for (const cat of TOWER_CATEGORIES) {
      this.buttonsByCategory[cat].forEach((b, i) => {
        b.container.position.set(BUTTON_BASE_X + i * (BUTTON_W + BUTTON_GAP), BUTTON_BASE_Y);
      });
    }
    this.applyCategoryVisibility();

    /* control buttons — sit between tower bar and start button */
    this.pauseControl = new ControlButton(60, TOWER_BAR_COPY.pause, () => this.callbacks.onPauseToggle());
    this.speedControl = new ControlButton(44, '1X', () => this.callbacks.onSpeedToggle());
    this.autoControl = new ControlButton(64, TOWER_BAR_COPY.autoOn, () => this.callbacks.onAutoStartToggle());
    this.restartControl = new ControlButton(64, TOWER_BAR_COPY.restart, () => this.callbacks.onRestart());
    const cx = 674;
    const ctlY = 14;
    this.pauseControl.container.position.set(cx, ctlY);
    this.speedControl.container.position.set(cx + 66, ctlY);
    this.autoControl.container.position.set(cx, ctlY + 36);
    this.restartControl.container.position.set(cx + 70, ctlY + 36);
    this.container.addChild(
      this.pauseControl.container,
      this.speedControl.container,
      this.autoControl.container,
      this.restartControl.container
    );

    /* start wave button — pinned to right edge of tower bar */
    this.startBtn = new Container();
    this.startBtn.eventMode = 'static';
    this.startBtn.cursor = 'pointer';
    this.startBtn.hitArea = { contains: (x: number, y: number) => x >= -8 && x <= 180 && y >= -8 && y <= 64 } as any;
    this.startBg = new Graphics();
    this.startBtn.addChild(this.startBg);
    const label = makeText(`>  ${TOWER_BAR_COPY.startWave}`, { fontSize: 14, fontWeight: '700', letterSpacing: 3, fill: 0x05070d });
    label.anchor.set(0.5);
    label.position.set(86, 22);
    this.startBtn.addChild(label);
    const sub = makeText(TOWER_BAR_COPY.startKey, { fontSize: 9, fontWeight: '700', letterSpacing: 4, fill: 0x05070d });
    sub.anchor.set(0.5);
    sub.position.set(86, 44);
    sub.alpha = 0.7;
    this.startBtn.addChild(sub);
    this.startBtn.position.set(CANVAS.width - CANVAS.rightPanelWidth - 176, 18);
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
    this.container.addChild(this.tooltip.container);
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
    this.pauseControl.set(state.paused ? TOWER_BAR_COPY.resume : TOWER_BAR_COPY.pause, true, state.paused);
    this.speedControl.set(`${state.speedMultiplier}X`, true, state.speedMultiplier > 1);
    this.autoControl.set(state.autoStartEnabled ? TOWER_BAR_COPY.autoOn : TOWER_BAR_COPY.autoOff, true, state.autoStartEnabled);
    this.restartControl.set(TOWER_BAR_COPY.restart, state.canRestart, false);
  }

  setSelected(t: EmotionType | null) {
    this.tooltip.hide();
    for (const b of this.buttons) b.setSelected(b.type === t);
    if (t !== null) {
      if (!this.buttons.some((b) => b.type === t)) return;
      const targetCategory = TOWER_STATS[t].category;
      if (targetCategory !== this.selectedCategory) {
        this.selectedCategory = targetCategory;
        this.applyCategoryVisibility();
      }
    }
  }

  setAffordability(memory: number) {
    for (const b of this.buttons) b.setAffordable(TOWER_STATS[b.type].cost <= memory);
  }

  /** Returns the tower type at the given index inside the visible category, or null. */
  visibleTypeAt(index: number): EmotionType | null {
    const visible = this.buttonsByCategory[this.selectedCategory];
    if (index < 0 || index >= visible.length) return null;
    return visible[index].type;
  }

  private setCategory(category: TowerCategory) {
    if (category === this.selectedCategory) return;
    this.tooltip.hide();
    this.selectedCategory = category;
    this.applyCategoryVisibility();
    // cancel any in-progress placement when the user browses to a new category
    const cur = this.buttons.find((b) => b.selected);
    if (cur && cur.category !== category) {
      this.callbacks.onSelect(null);
    }
  }

  private applyCategoryVisibility() {
    for (const tab of this.tabs) tab.setActive(tab.category === this.selectedCategory);
    for (const b of this.buttons) {
      b.container.visible = b.category === this.selectedCategory;
    }
  }

  private toggle(t: EmotionType) {
    const cur = this.buttons.find(b => b.selected);
    const next = cur && cur.type === t ? null : t;
    this.callbacks.onSelect(next);
  }
}
