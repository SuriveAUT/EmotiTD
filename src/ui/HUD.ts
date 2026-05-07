import { Container, Graphics, Text } from 'pixi.js';
import { CANVAS, COLORS, ECONOMY, EMOTION_COLOR, HUD_COPY } from '../game/config';
import { EMOTION_TYPES } from '../game/types';
import type { EmotionalBalance } from '../game/EmotionalBalance';
import { makeLabel, makeText, makeHeadline } from './text';

export interface HUDState {
  stability: number;
  maxStability: number;
  memory: number;
  score: number;
  wave: number;
  betweenWaves: boolean;
  countdown: number;
  paused: boolean;
  speedMultiplier: number;
  autoStartEnabled: boolean;
  balanceDisruption: number;
  synergyStatus: string;
  notice: string;
}

const COL = {
  stability: 24,
  memory: 232,
  score: 332,
  wave: 432,
  balance: 512,
  status: CANVAS.width - CANVAS.rightPanelWidth - 16
} as const;

export class HUD {
  readonly container: Container;
  private bg: Graphics;
  private stabBar: Graphics;
  private stabLabel: Text;
  private stabValue: Text;
  private memoryLabel: Text;
  private memoryValue: Text;
  private scoreLabel: Text;
  private scoreValue: Text;
  private waveLabel: Text;
  private waveValue: Text;
  private balanceLabel: Text;
  private balanceValue: Text;
  private balanceDots: Graphics;
  private statusLabel: Text;
  private statusText: Text;

  constructor() {
    this.container = new Container();
    this.container.label = 'hud-top';

    this.bg = new Graphics();
    this.container.addChild(this.bg);
    this.drawBg();

    this.stabLabel = makeLabel(HUD_COPY.coreStability, { fontSize: 9, letterSpacing: 2 });
    this.stabLabel.position.set(COL.stability, 10);
    this.container.addChild(this.stabLabel);

    this.stabBar = new Graphics();
    this.stabBar.position.set(COL.stability, 30);
    this.container.addChild(this.stabBar);

    this.stabValue = makeHeadline('20/20', { fontSize: 13 });
    this.stabValue.position.set(COL.stability + 158, 28);
    this.container.addChild(this.stabValue);

    this.memoryLabel = makeLabel(HUD_COPY.memory, { fontSize: 9, letterSpacing: 2 });
    this.memoryLabel.position.set(COL.memory, 10);
    this.container.addChild(this.memoryLabel);

    this.memoryValue = makeHeadline(`${ECONOMY.startingMemory}`, { fontSize: 22, fill: 0xffd166 });
    this.memoryValue.position.set(COL.memory, 24);
    this.container.addChild(this.memoryValue);

    this.scoreLabel = makeLabel(HUD_COPY.score, { fontSize: 9, letterSpacing: 2 });
    this.scoreLabel.position.set(COL.score, 10);
    this.container.addChild(this.scoreLabel);

    this.scoreValue = makeHeadline('0', { fontSize: 18, fill: 0x77ffaa });
    this.scoreValue.position.set(COL.score, 26);
    this.container.addChild(this.scoreValue);

    this.waveLabel = makeLabel(HUD_COPY.wave, { fontSize: 9, letterSpacing: 2 });
    this.waveLabel.position.set(COL.wave, 10);
    this.container.addChild(this.waveLabel);

    this.waveValue = makeHeadline('0', { fontSize: 22, fill: 0x6cf0ff });
    this.waveValue.position.set(COL.wave, 24);
    this.container.addChild(this.waveValue);

    this.balanceLabel = makeLabel(HUD_COPY.emotionalBalance, { fontSize: 10, letterSpacing: 2 });
    this.balanceLabel.position.set(COL.balance, 8);
    this.container.addChild(this.balanceLabel);

    this.balanceDots = new Graphics();
    this.balanceDots.position.set(COL.balance + 6, 30);
    this.container.addChild(this.balanceDots);

    this.balanceValue = makeText('-', { fontSize: 11, fill: 0xe8edf2, letterSpacing: 1, fontWeight: '700' });
    this.balanceValue.position.set(COL.balance, 46);
    this.container.addChild(this.balanceValue);

    this.statusLabel = makeLabel(HUD_COPY.status, { fontSize: 9, letterSpacing: 2 });
    this.statusLabel.anchor.set(1, 0);
    this.statusLabel.position.set(COL.status, 10);
    this.container.addChild(this.statusLabel);

    this.statusText = makeText('', { fontSize: 11, letterSpacing: 1, fill: 0x6cf0ff, fontWeight: '700' });
    this.statusText.position.set(0, 28);
    this.statusText.anchor.set(1, 0);
    this.statusText.x = COL.status;
    this.container.addChild(this.statusText);
  }

  private drawBg() {
    const g = this.bg;
    g.clear();
    g.rect(0, 0, CANVAS.width, CANVAS.hudHeight)
      .fill({ color: COLORS.panel, alpha: 0.95 });
    g.rect(0, CANVAS.hudHeight - 1, CANVAS.width, 1)
      .fill({ color: COLORS.panelEdge, alpha: 1 });
    g.rect(0, CANVAS.hudHeight - 2, CANVAS.width, 1)
      .fill({ color: 0x6cf0ff, alpha: 0.18 });

    for (const x of [COL.memory - 14, COL.score - 12, COL.wave - 12, COL.balance - 14]) {
      g.rect(x, 12, 1, CANVAS.hudHeight - 20).fill({ color: COLORS.panelEdge, alpha: 0.55 });
    }
  }

  update(state: HUDState, balance: EmotionalBalance) {
    const ratio = Math.max(0, state.stability / state.maxStability);
    const barW = 148, barH = 10;
    const stabColor =
      ratio > 0.5 ? 0x77ffaa :
      ratio > 0.25 ? 0xffd166 : 0xff5577;
    this.stabBar.clear();
    this.stabBar.rect(0, 0, barW, barH).fill({ color: 0x0a0f1a, alpha: 1 })
      .stroke({ color: COLORS.panelEdge, width: 1, alpha: 1 });
    this.stabBar.rect(0, 0, barW * ratio, barH).fill({ color: stabColor, alpha: 1 });
    this.stabValue.text = `${state.stability}/${state.maxStability}`;
    this.stabValue.style.fill = stabColor;

    this.memoryValue.text = `${state.memory}`;
    this.scoreValue.text = `${state.score}`;
    this.waveValue.text = `${state.wave}`;

    this.drawBalanceDots(balance);
    if (balance.isResonating()) {
      this.balanceValue.text = state.synergyStatus === HUD_COPY.noSynergy
        ? HUD_COPY.resonance
        : `${HUD_COPY.resonance} / ${state.synergyStatus}`;
      this.balanceValue.style.fill = 0x77ffaa;
    } else if (balance.dominant()) {
      this.balanceValue.text = state.synergyStatus === HUD_COPY.noSynergy
        ? HUD_COPY.imbalance
        : `${HUD_COPY.imbalance} / ${state.synergyStatus}`;
      this.balanceValue.style.fill = 0xff5577;
    } else if (balance.totalTowers() === 0) {
      this.balanceValue.text = HUD_COPY.neutral;
      this.balanceValue.style.fill = 0x7d8ba6;
    } else {
      this.balanceValue.text = state.synergyStatus === HUD_COPY.noSynergy ? HUD_COPY.building : state.synergyStatus;
      this.balanceValue.style.fill = state.synergyStatus === HUD_COPY.noSynergy ? 0xffd166 : 0x77ffaa;
    }

    if (state.paused) {
      this.statusText.text = `${HUD_COPY.paused} / ${state.speedMultiplier}X`;
      this.statusText.style.fill = 0xffd166;
    } else if (state.notice) {
      this.statusText.text = state.notice;
      this.statusText.style.fill = 0xffd166;
    } else if (state.balanceDisruption > 0) {
      this.statusText.text = `${HUD_COPY.spiralDisruption} ${state.balanceDisruption.toFixed(1)}S`;
      this.statusText.style.fill = 0xff5577;
    } else if (state.betweenWaves) {
      if (state.countdown >= 0) {
        const prefix = state.autoStartEnabled ? `${HUD_COPY.nextWave}  ${state.countdown.toFixed(1)}s` : HUD_COPY.autoOff;
        this.statusText.text = `${prefix} / ${HUD_COPY.spaceToStart}`;
        this.statusText.style.fill = 0x6cf0ff;
      } else {
        this.statusText.text = '';
      }
    } else {
      this.statusText.text = `${HUD_COPY.wave} ${state.wave} / ${state.speedMultiplier}X`;
      this.statusText.style.fill = 0x6cf0ff;
    }
  }

  private drawBalanceDots(balance: EmotionalBalance) {
    const g = this.balanceDots;
    g.clear();
    let x = 0;
    for (const t of EMOTION_TYPES) {
      const n = balance.counts[t];
      const c = EMOTION_COLOR[t];
      g.circle(x, 0, 5.5).fill({ color: c, alpha: n > 0 ? 0.95 : 0.18 });
      if (n > 0) {
        g.circle(x, 0, 8.5).stroke({ color: c, width: 1, alpha: 0.5 });
      }
      x += 18;
    }
  }
}
