import { Container, FederatedPointerEvent, Graphics, Rectangle, Text } from 'pixi.js';
import { CANVAS, COLORS, ECONOMY, EMOTION_COLOR, EMOTION_LABEL, HUD_COPY } from '../game/config';
import { EMOTION_TYPES, TOWER_CATEGORIES, TOWER_CATEGORY_LABEL } from '../game/types';
import type { EmotionalBalance } from '../game/EmotionalBalance';
import { makeLabel, makeText, makeHeadline } from './text';
import { UI_THEME, mixToward } from './theme';
import { balanceLore } from '../content/lore';
import { formatCompactNumber, formatDecimal, formatMultiplier } from './format';

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
  synergyBadges?: Array<{ label: string; detail?: string; color: number }>;
  bossWave?: boolean;
  notice: string;
}

const COL = {
  stability: 24,
  memory: 242,
  score: 364,
  wave: 492,
  balance: 614,
  status: CANVAS.width - 32
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
  private synergyChips: Container;
  private synergyTooltip: Container;
  private synergyTooltipBg: Graphics;
  private synergyTooltipText: Text;
  private balanceHotspot: Container;
  private balancePopup: Container;
  private balancePopupBg: Graphics;
  private balancePopupBody: Container;
  private lastBalance: EmotionalBalance | null = null;
  private lastSynergyBadges: Array<{ label: string; detail?: string; color: number }> = [];
  private displayedStability = 0;
  private displayedMemory = 0;
  private displayedScore = 0;
  private pulseTime = 0;
  private lastStability = 0;
  private damageFlash = 0;
  private synergyBadgeKey = '';

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

    this.memoryValue = makeHeadline(`${ECONOMY.startingMemory}`, { fontSize: 20, fill: 0xffd166 });
    this.memoryValue.position.set(COL.memory, 24);
    this.container.addChild(this.memoryValue);

    this.scoreLabel = makeLabel(HUD_COPY.score, { fontSize: 9, letterSpacing: 2 });
    this.scoreLabel.position.set(COL.score, 10);
    this.container.addChild(this.scoreLabel);

    this.scoreValue = makeHeadline('0', { fontSize: 17, fill: 0x77ffaa });
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

    this.balanceHotspot = new Container();
    this.balanceHotspot.position.set(600, 7);
    this.balanceHotspot.hitArea = new Rectangle(0, 0, 302, 50);
    this.balanceHotspot.eventMode = 'static';
    this.balanceHotspot.cursor = 'pointer';
    this.balanceHotspot.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.toggleBalancePopup();
    });
    this.container.addChild(this.balanceHotspot);

    this.synergyChips = new Container();
    this.synergyChips.position.set(COL.balance + 150, 27);
    this.synergyChips.eventMode = 'static';
    this.synergyChips.cursor = 'pointer';
    this.synergyChips.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.toggleBalancePopup();
    });
    this.container.addChild(this.synergyChips);

    this.synergyTooltip = new Container();
    this.synergyTooltip.visible = false;
    this.synergyTooltip.eventMode = 'none';
    this.synergyTooltipBg = new Graphics();
    this.synergyTooltipText = makeText('', {
      fontSize: 10,
      fill: 0xe8edf2,
      wordWrap: true,
      wordWrapWidth: CANVAS.rightPanelWidth - 28,
      lineHeight: 14
    });
    this.synergyTooltipText.position.set(10, 8);
    this.synergyTooltip.position.set(CANVAS.width - CANVAS.rightPanelWidth + 8, CANVAS.hudHeight + 10);
    this.synergyTooltip.addChild(this.synergyTooltipBg, this.synergyTooltipText);
    this.container.addChild(this.synergyTooltip);

    this.balancePopup = new Container();
    this.balancePopup.visible = false;
    this.balancePopup.eventMode = 'static';
    this.balancePopupBg = new Graphics();
    this.balancePopupBody = new Container();
    this.balancePopup.position.set(592, CANVAS.hudHeight + 8);
    this.balancePopup.addChild(this.balancePopupBg, this.balancePopupBody);
    this.container.addChild(this.balancePopup);

    this.statusLabel = makeLabel(HUD_COPY.status, { fontSize: 9, letterSpacing: 2 });
    this.statusLabel.anchor.set(1, 0);
    this.statusLabel.position.set(COL.status, 10);
    this.container.addChild(this.statusLabel);

    this.statusText = makeText('', { fontSize: 10, letterSpacing: 0, fill: 0x6cf0ff, fontWeight: '800', align: 'right', wordWrap: true, wordWrapWidth: 292, lineHeight: 12 });
    this.statusText.position.set(0, 27);
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

    this.drawHudCard(g, 14, 7, 202, 50, 0x77ffaa);
    this.drawHudCard(g, 228, 7, 108, 50, 0xffd166);
    this.drawHudCard(g, 350, 7, 118, 50, 0x77ffaa);
    this.drawHudCard(g, 478, 7, 106, 50, 0x6cf0ff);
    this.drawHudCard(g, 600, 7, 302, 50, 0xb070ff);
    this.drawHudCard(g, 914, 7, 350, 50, 0x6cf0ff);
  }

  private drawHudCard(g: Graphics, x: number, y: number, width: number, height: number, accent: number): void {
    g.roundRect(x, y, width, height, 8)
      .fill({ color: 0x080d18, alpha: 0.72 })
      .stroke({ color: COLORS.panelEdge, width: 1, alpha: 0.68 });
    g.rect(x + 10, y + height - 3, Math.min(width - 20, width * 0.42), 1)
      .fill({ color: accent, alpha: 0.36 });
  }

  update(state: HUDState, balance: EmotionalBalance) {
    this.lastBalance = balance;
    this.lastSynergyBadges = state.synergyBadges ?? [];
    this.pulseTime += 0.05;
    if (this.displayedMemory === 0) this.displayedMemory = state.memory;
    if (this.displayedScore === 0) this.displayedScore = state.score;
    if (this.displayedStability === 0) this.displayedStability = state.stability;
    if (state.stability < this.lastStability) this.damageFlash = 1;
    this.lastStability = state.stability;
    this.damageFlash = Math.max(0, this.damageFlash - 0.08);
    this.displayedStability = mixToward(this.displayedStability, state.stability, 0.22);
    this.displayedMemory = mixToward(this.displayedMemory, state.memory, 0.18);
    this.displayedScore = mixToward(this.displayedScore, state.score, 0.16);

    const ratio = Math.max(0, this.displayedStability / state.maxStability);
    const barW = 148, barH = 10;
    const stabColor =
      ratio > 0.5 ? 0x77ffaa :
      ratio > 0.25 ? 0xffd166 : 0xff5577;
    this.stabBar.clear();
    const lowPulse = ratio < 0.3 ? 0.18 + Math.sin(this.pulseTime * 8) * 0.12 : 0;
    this.stabBar.roundRect(-2, -2, barW + 4, barH + 4, 5)
      .fill({ color: this.damageFlash > 0 ? UI_THEME.color.danger : UI_THEME.color.primary, alpha: this.damageFlash * 0.22 + lowPulse });
    this.stabBar.roundRect(0, 0, barW, barH, 4).fill({ color: 0x05070d, alpha: 1 })
      .stroke({ color: COLORS.panelEdge, width: 1, alpha: 1 });
    this.stabBar.roundRect(1, 1, Math.max(2, (barW - 2) * ratio), barH - 2, 3).fill({ color: stabColor, alpha: 1 });
    this.stabBar.rect(3, 2, Math.max(0, (barW - 6) * ratio), 2).fill({ color: 0xffffff, alpha: 0.24 });
    this.stabValue.text = `${Math.round(state.stability)}/${state.maxStability}`;
    this.stabValue.style.fill = stabColor;

    this.memoryValue.text = formatCompactNumber(this.displayedMemory);
    this.scoreValue.text = formatCompactNumber(this.displayedScore);
    this.waveValue.text = state.bossWave ? `!${state.wave}` : `${state.wave}`;
    this.waveValue.style.fill = state.bossWave ? UI_THEME.color.danger : 0x6cf0ff;

    this.drawBalanceDots(balance);
    const balanceState = balance.analysis().state;
    this.balanceValue.text = this.compactBalanceStatus(balance);
    this.balanceValue.style.fill =
      balanceState === 'overloaded' ? 0xff5577 :
      balanceState === 'imbalanced' ? 0xff8a4d :
      balanceState === 'tense' ? 0xffd166 :
      balance.isResonating() ? 0x77ffaa : 0x7d8ba6;
    this.drawSynergyChips(state.synergyBadges ?? []);
    if (this.balancePopup.visible) this.redrawBalancePopup();

    if (state.paused) {
      this.statusText.text = `${HUD_COPY.paused} / ${state.speedMultiplier}X`;
      this.statusText.style.fill = 0xffd166;
    } else if (state.notice) {
      this.statusText.text = this.compactStatusNotice(state.notice);
      this.statusText.style.fill = 0xffd166;
    } else if (state.balanceDisruption > 0) {
      this.statusText.text = `${HUD_COPY.spiralDisruption} ${state.balanceDisruption.toFixed(1)}S`;
      this.statusText.style.fill = 0xff5577;
    } else if (state.betweenWaves) {
      if (state.countdown >= 0) {
        this.statusText.text = state.autoStartEnabled ? `${HUD_COPY.nextWave} ${state.countdown.toFixed(1)}s` : HUD_COPY.autoOff;
        this.statusText.style.fill = 0x6cf0ff;
      } else {
        this.statusText.text = '';
      }
    } else {
      this.statusText.text = `${HUD_COPY.wave} ${state.wave} / ${state.speedMultiplier}X`;
      this.statusText.style.fill = 0x6cf0ff;
    }
  }

  private compactBalanceStatus(balance: EmotionalBalance): string {
    const analysis = balance.analysis();
    if (analysis.totalInfluence <= 0) return 'NEUTRAL';
    if (analysis.deepResonanceActive) return 'STABLE / DEEP RESONANCE';
    if (analysis.resonanceActive) return 'STABLE / RESONANCE';
    if (analysis.state === 'stable') return 'STABLE';
    const dominantEmotion = analysis.dominantEmotion ? EMOTION_LABEL[analysis.dominantEmotion] : null;
    const dominantCategory = analysis.dominantCategory ? TOWER_CATEGORY_LABEL[analysis.dominantCategory] : null;
    const dominant = analysis.dominantCategoryShare >= analysis.dominantEmotionShare
      ? dominantCategory
      : dominantEmotion;
    return `${balanceLore[analysis.state].title} / ${dominant ?? 'MIXED'}`;
  }

  private compactStatusNotice(text: string): string {
    return text.length > 42 ? `${text.slice(0, 39)}...` : text;
  }

  private drawBalanceDots(balance: EmotionalBalance) {
    const g = this.balanceDots;
    g.clear();
    let x = 0;
    const analysis = balance.analysis();
    for (const t of EMOTION_TYPES) {
      const n = balance.counts[t];
      const c = EMOTION_COLOR[t];
      g.circle(x, 0, 5.5).fill({ color: c, alpha: n > 0 ? 0.95 : 0.18 });
      if (n > 0) {
        g.circle(x, 0, 8.5).stroke({ color: c, width: 1, alpha: 0.5 });
      }
      if (analysis.dominantEmotion === t && analysis.state !== 'stable') {
        const alpha = analysis.state === 'overloaded' ? 0.95 : 0.7;
        g.circle(x, 0, 11).stroke({ color: analysis.state === 'tense' ? 0xffd166 : 0xff5577, width: 2, alpha });
      }
      x += 18;
    }
  }

  private drawSynergyChips(badges: Array<{ label: string; detail?: string; color: number }>): void {
    const key = badges.map((badge) => `${badge.label}:${badge.detail ?? ''}:${badge.color}`).join('|');
    if (key === this.synergyBadgeKey) return;
    this.synergyBadgeKey = key;
    this.synergyChips.removeChildren().forEach((child) => child.destroy({ children: true }));
    if (badges.length === 0) {
      this.synergyTooltip.visible = false;
      return;
    }
    this.synergyTooltip.visible = false;
    const count = makeText(`${badges.length} SYNERGIES`, {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
      fill: 0x77ffaa
    });
    count.position.set(0, -17);
    this.synergyChips.addChild(count);
    const max = 2;
    let x = 0;
    badges.slice(0, max).forEach((badge) => {
      const chip = new Container();
      const bg = new Graphics();
      const labelText = this.compactSynergyLabel(badge.label);
      const label = makeText(labelText, { fontSize: 8, fontWeight: '800', letterSpacing: 0, fill: UI_THEME.color.text });
      const w = Math.min(50, Math.max(36, (label.width as number) + 10));
      bg.roundRect(0, 0, w, 14, 5)
        .fill({ color: UI_THEME.color.panelSoft, alpha: 0.92 })
        .stroke({ color: badge.color, width: 1, alpha: 0.88 });
      bg.rect(5, 12, w - 10, 1).fill({ color: badge.color, alpha: 0.5 });
      label.anchor.set(0.5);
      label.position.set(w / 2, 7);
      chip.position.set(x, 0);
      chip.addChild(bg, label);
      this.synergyChips.addChild(chip);
      x += w + 5;
    });
    if (badges.length > max) {
      const more = makeText(`+${badges.length - max}`, { fontSize: 9, fontWeight: '800', fill: UI_THEME.color.warn });
      more.position.set(x, 3);
      this.synergyChips.addChild(more);
    }
  }

  private compactSynergyLabel(label: string): string {
    return label
      .replace('RADIANT ', '')
      .replace('BRIGHT ', '')
      .replace('DEEP ', '')
      .replace('QUIET ', '')
      .replace('SECURE ', '')
      .replace('SOCIAL ', '')
      .slice(0, 10);
  }

  private toggleBalancePopup(): void {
    this.synergyTooltip.visible = false;
    this.balancePopup.visible = !this.balancePopup.visible;
    if (this.balancePopup.visible) this.redrawBalancePopup();
  }

  private redrawBalancePopup(): void {
    const balance = this.lastBalance;
    if (!balance) return;
    const analysis = balance.analysis();
    this.balancePopupBody.removeChildren().forEach((child) => child.destroy({ children: true }));

    const width = 390;
    let y = 12;
    const title = makeHeadline('EMOTIONAL BALANCE', { fontSize: 18, fill: this.balanceColor(analysis.state) });
    title.position.set(14, y);
    this.balancePopupBody.addChild(title);
    y += 27;

    const lore = balanceLore[analysis.state];
    const summary = makeText(`${lore.title}: ${lore.description}`, {
      fontSize: 11,
      fill: 0xc0c8d8,
      wordWrap: true,
      wordWrapWidth: width - 28,
      lineHeight: 15
    });
    summary.position.set(14, y);
    this.balancePopupBody.addChild(summary);
    y += (summary.height as number) + 12;

    const effectLines = this.balanceEffectLines(balance);
    y = this.addPopupSection('ACTIVE EFFECTS', effectLines, y, width, 0xffd166);
    y = this.addPopupSection('DOMINANCE', this.balanceShareLines(balance), y, width, 0xb070ff);
    y = this.addPopupSection('SYNERGIES', this.synergyPopupLines(), y, width, 0x77ffaa);

    const height = y + 12;
    this.balancePopupBg.clear();
    this.balancePopupBg.roundRect(0, 0, width, height, 10)
      .fill({ color: 0x05070d, alpha: 0.98 })
      .stroke({ color: this.balanceColor(analysis.state), width: 1.5, alpha: 0.92 });
    this.balancePopupBg.rect(14, 0, width - 28, 2).fill({ color: 0x6cf0ff, alpha: 0.55 });
  }

  private addPopupSection(label: string, lines: string[], y: number, width: number, accent: number): number {
    const heading = makeLabel(label, { fontSize: 9, letterSpacing: 2, fill: accent });
    heading.position.set(14, y);
    this.balancePopupBody.addChild(heading);
    y += 15;
    const text = makeText(lines.length > 0 ? lines.join('\n') : 'None active.', {
      fontSize: 10,
      fill: 0xe8edf2,
      wordWrap: true,
      wordWrapWidth: width - 30,
      lineHeight: 14
    });
    text.position.set(14, y);
    this.balancePopupBody.addChild(text);
    return y + (text.height as number) + 12;
  }

  private balanceEffectLines(balance: EmotionalBalance): string[] {
    const analysis = balance.analysis();
    const lines: string[] = [];
    if (analysis.deepResonanceActive) lines.push('Deep Resonance: +7% damage, +7% utility, -5% leak damage');
    else if (analysis.resonanceActive) lines.push('Resonance: +4% damage and utility');
    if (analysis.balancedFormationActive) lines.push('Balanced Formation: synergy effects +5%, boss damage +4%');
    if (analysis.dominantEmotion && analysis.state !== 'stable') {
      const damageMul = balance.damageMulFor(analysis.dominantEmotion);
      const takenMul = balance.damageTakenMulForSource(analysis.dominantEmotion);
      lines.push(`${EMOTION_LABEL[analysis.dominantEmotion]} dominance: damage ${formatMultiplier(damageMul)}, enemy adaptation ${formatMultiplier(takenMul)}`);
    }
    if (analysis.dominantCategory && analysis.state !== 'stable') {
      if (analysis.dominantCategory === 'control') lines.push(`Control overload: CC effects ${formatMultiplier(balance.controlEffectMul())}`);
      if (analysis.dominantCategory === 'support') lines.push(`Support overload: buffs ${formatMultiplier(balance.supportEffectMul())}`);
      if (analysis.dominantCategory === 'damage') lines.push(`Damage overload: core leak damage ${formatMultiplier(balance.coreDamageMul())}`);
      if (analysis.dominantCategory === 'defense') lines.push(`Defense overload: new enemy HP ${formatMultiplier(balance.enemyHpMul())}`);
    }
    if (lines.length === 0) lines.push('No penalty. Keep mixing emotions to maintain resonance.');
    return lines;
  }

  private balanceShareLines(balance: EmotionalBalance): string[] {
    const analysis = balance.analysis();
    const emotions = EMOTION_TYPES
      .map((type) => ({ label: EMOTION_LABEL[type], share: analysis.shareByEmotion[type] }))
      .filter((entry) => entry.share > 0)
      .sort((a, b) => b.share - a.share)
      .slice(0, 5)
      .map((entry) => `${entry.label}: ${formatDecimal(entry.share * 100, 1)}%`);
    const categories = TOWER_CATEGORIES
      .map((category) => `${TOWER_CATEGORY_LABEL[category]}: ${formatDecimal(analysis.shareByCategory[category] * 100, 1)}%`);
    return [...emotions, ...categories];
  }

  private synergyPopupLines(): string[] {
    if (this.lastSynergyBadges.length === 0) return ['No local synergies active. Place matching emotions nearby.'];
    const lines = this.lastSynergyBadges.slice(0, 8).map((badge) => (
      badge.detail ? `${badge.label}: ${badge.detail}` : badge.label
    ));
    if (this.lastSynergyBadges.length > 8) lines.push(`+${this.lastSynergyBadges.length - 8} more active synergies`);
    return lines;
  }

  private balanceColor(state: string): number {
    if (state === 'overloaded') return 0xff5577;
    if (state === 'imbalanced') return 0xff8a4d;
    if (state === 'tense') return 0xffd166;
    return 0x77ffaa;
  }

  forceRebuild(): void {
    this.synergyBadgeKey = '';
    this.drawBg();
    this.synergyChips.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.synergyTooltip.visible = false;
    this.balancePopup.visible = false;
  }
}
