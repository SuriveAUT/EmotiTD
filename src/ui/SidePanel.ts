import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Rectangle } from 'pixi.js';
import {
  CANVAS,
  COLORS,
  EMOTION_COLOR,
  EMOTION_LABEL,
  TOWER_STATS,
  TOWER_UPGRADES,
  UPGRADE_PATHS,
  ENEMY_STATS,
  ENEMY_TRAITS,
  BOSS_WARNING_COPY,
  SIDE_PANEL_COPY,
  TOWER_HELP_COPY,
  type MapDefinition,
  type SynergyDef,
  type TowerStats
} from '../game/config';
import { EmotionType, EnemyKind, TARGETING_LABEL, TARGETING_MODES, TOWER_CATEGORY_LABEL, type TargetingMode, type UpgradePath } from '../game/types';
import type { Tower } from '../game/Tower';
import type { RunSummary } from '../game/RunStats';
import type { WaveDef } from '../game/WaveManager';
import { CHALLENGE_MODE_LABEL, type RunConfig } from '../game/RunConfig';
import { makeLabel, makeText, makeHeadline } from './text';
import { balanceLore, categoryLoreLabel, towerLore } from '../content/lore';
import { formatCompactNumber, formatDecimal, formatInteger, formatMultiplier, formatSeconds } from './format';

const PANEL_X = CANVAS.width - CANVAS.rightPanelWidth;
const PANEL_W = CANVAS.rightPanelWidth;
const PANEL_Y = CANVAS.hudHeight;
const PANEL_H = CANVAS.height - CANVAS.hudHeight;
const UPGRADE_BUTTON_H = 118;
const SCROLL_PAD_TOP = 8;
const SCROLL_PAD_BOTTOM = 12;
const VIEWPORT_H = PANEL_H - SCROLL_PAD_TOP - SCROLL_PAD_BOTTOM;

export interface SidePanelCallbacks {
  onUpgrade(path: UpgradePath): void;
  onTargetingChange(mode: TargetingMode): void;
  onSell(): void;
  onCopyRunSummary?(): void;
}

export class SidePanel {
  readonly container: Container;
  private bg: Graphics;
  private body: Container;
  private scrollMask: Graphics;
  private scrollBar: Graphics;
  private callbacks: SidePanelCallbacks;
  private activeSynergies: SynergyDef[] = [];
  private runConfig: RunConfig | null = null;
  private mapDefinition: MapDefinition | null = null;
  private scrollY = 0;
  private contentHeight = 0;
  private currentViewKey = 'init';
  private readonly scrollYByViewKey = new Map<string, number>();
  private touchScrollActive = false;
  private touchScrollLastY = 0;

  constructor(callbacks: SidePanelCallbacks) {
    this.callbacks = callbacks;
    this.container = new Container();
    this.container.label = 'side-panel';
    this.bg = new Graphics();
    this.body = new Container();
    this.body.label = 'side-panel-body';
    this.scrollMask = new Graphics();
    this.scrollBar = new Graphics();

    this.container.addChild(this.bg, this.scrollMask, this.body, this.scrollBar);
    this.drawBg();
    this.drawScrollMask();

    /* mask the scrollable body to the panel viewport */
    this.body.mask = this.scrollMask;

    /* wheel handling — federated events bubble from children */
    this.container.eventMode = 'static';
    this.container.hitArea = new Rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    this.container.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.touchScrollActive = true;
      this.touchScrollLastY = e.global.y;
    });
    this.container.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.touchScrollActive) return;
      e.stopPropagation();
      const dy = this.touchScrollLastY - e.global.y;
      this.touchScrollLastY = e.global.y;
      this.scrollByDelta(dy * 2);
    });
    this.container.on('pointerup', () => { this.touchScrollActive = false; });
    this.container.on('pointerupoutside', () => { this.touchScrollActive = false; });
    this.container.on('wheel', (e: FederatedWheelEvent) => {
      const px = e.global.x;
      const py = e.global.y;
      if (px < PANEL_X || px > PANEL_X + PANEL_W || py < PANEL_Y || py > PANEL_Y + PANEL_H) return;
      e.preventDefault?.();
      e.stopPropagation();
      this.scrollByDelta(e.deltaY);
    });
  }

  private drawBg() {
    const g = this.bg;
    g.clear();
    g.rect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H).fill({ color: COLORS.panel, alpha: 0.96 });
    g.rect(PANEL_X, PANEL_Y, 1, PANEL_H).fill({ color: COLORS.panelEdge, alpha: 1 });
    g.rect(PANEL_X + 1, PANEL_Y, 1, PANEL_H).fill({ color: 0x6cf0ff, alpha: 0.14 });
  }

  private drawScrollMask() {
    const g = this.scrollMask;
    g.clear();
    g.rect(PANEL_X + 2, PANEL_Y + SCROLL_PAD_TOP, PANEL_W - 4, VIEWPORT_H).fill({ color: 0xffffff, alpha: 1 });
  }

  clear(viewKey = 'default') {
    this.saveScrollForCurrentView();
    this.body.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.currentViewKey = viewKey;
    this.scrollY = this.scrollYByViewKey.get(viewKey) ?? 0;
    this.body.y = 0;
    this.contentHeight = 0;
    this.scrollBar.clear();
  }

  setActiveSynergies(synergies: SynergyDef[]) {
    this.activeSynergies = synergies;
  }

  setRunConfig(config: RunConfig, map: MapDefinition): void {
    this.runConfig = config;
    this.mapDefinition = map;
  }

  showSelectedType(type: EmotionType, affordable: boolean) {
    this.clear(`placement:${type}`);
    const stats = TOWER_STATS[type];
    const c = EMOTION_COLOR[type];
    const x = PANEL_X + 18;
    let y = PANEL_Y + 22;

    const head = makeHeadline(EMOTION_LABEL[type], { fontSize: 22, fill: c, letterSpacing: 4 });
    head.position.set(x, y); this.body.addChild(head);
    y += 32;

    const sub = makeLabel(SIDE_PANEL_COPY.placementMode);
    sub.position.set(x, y); this.body.addChild(sub);
    y += 20;

    const help = makeText(affordable ? SIDE_PANEL_COPY.placementHelp : SIDE_PANEL_COPY.notEnoughMemory, {
      fontSize: 12, fill: affordable ? 0xc0c8d8 : 0xff5577, lineHeight: 16
    });
    help.position.set(x, y); this.body.addChild(help);
    y += 48;

    y = this.appendTowerBrief(x, y, type);

    y = this.appendStats(x, y, type);
    y = this.appendSynergy(x, y, stats.synergies);
    y = this.appendActiveSynergies(x, y + 4);
    this.finalizeLayout(y);
  }

  showSelectedTower(t: Tower, memory: number) {
    this.clear(`tower:${t.cx}:${t.cy}`);
    const c = EMOTION_COLOR[t.type];
    const x = PANEL_X + 18;
    let y = PANEL_Y + 22;

    const head = makeHeadline(`${EMOTION_LABEL[t.type]} - ${SIDE_PANEL_COPY.selectedTowerSuffix}`, { fontSize: 18, fill: c, letterSpacing: 3 });
    head.position.set(x, y); this.body.addChild(head);
    y += 28;

    const sub = makeLabel(SIDE_PANEL_COPY.selected);
    sub.position.set(x, y); this.body.addChild(sub);
    y += 20;

    const desc = makeText(TOWER_STATS[t.type].description, { fontSize: 12, fill: 0xc0c8d8, wordWrap: true, wordWrapWidth: PANEL_W - 36, lineHeight: 16 });
    desc.position.set(x, y); this.body.addChild(desc);
    y += Math.max(40, (desc.height as number) + 10);

    y = this.appendTowerBrief(x, y, t.type, false);

    y = this.appendStats(x, y, t.type, t.getEffectiveStats());
    y = this.appendDamageBreakdown(x, y, t);
    y = this.appendSynergy(x, y, TOWER_STATS[t.type].synergies);
    y = this.appendActiveSynergies(x, y);
    y += 8;
    y = this.appendTargetingControls(x, y, t);
    y = this.appendSellButton(x, y, t);
    y += 6;
    y = this.appendUpgrades(x, y, t, memory);
    this.finalizeLayout(y);
  }

  showWavePreview(next: WaveDef | null, current: WaveDef | null, between: boolean) {
    this.clear(`wave:${between ? 'next' : 'current'}:${between ? next?.number ?? 0 : current?.number ?? 0}`);
    const x = PANEL_X + 18;
    let y = PANEL_Y + 22;

    const head = makeHeadline(between ? SIDE_PANEL_COPY.nextWave : SIDE_PANEL_COPY.currentWave, { fontSize: 16, fill: 0x6cf0ff, letterSpacing: 4 });
    head.position.set(x, y); this.body.addChild(head);
    y += 28;

    const def = between ? next : current;
    if (!def) {
      const t = makeText(SIDE_PANEL_COPY.noWaveData, { fontSize: 12, fill: 0x7d8ba6 });
      t.position.set(x, y); this.body.addChild(t);
      this.finalizeLayout(y + 20);
      return;
    }

    const num = makeHeadline(`#${def.number}${def.isBoss ? '  •  BOSS' : ''}`, {
      fontSize: 28, fill: def.isBoss ? 0xff5577 : 0xe8edf2, letterSpacing: 2
    });
    num.position.set(x, y); this.body.addChild(num);
    y += 40;

    if (def.isBoss) {
      const warnBg = new Graphics();
      warnBg.roundRect(x, y, PANEL_W - 36, 44, 7)
        .fill({ color: 0x2a1018, alpha: 0.9 })
        .stroke({ color: 0xff5577, width: 1.5, alpha: 0.9 });
      const bossKind = def.groups.find(group => group.kind === EnemyKind.Spiral || group.kind === EnemyKind.Mask || group.kind === EnemyKind.BurnoutBoss)?.kind;
      const bossInfo = bossKind ? BOSS_WARNING_COPY[bossKind] : null;
      const warn = makeText(
        bossInfo
          ? `${bossInfo.name}\n${bossInfo.mechanic}\nCounter: ${bossInfo.counter}`
          : 'BOSS WARNING\nPrepare mixed damage and upgrades.',
        {
        fontSize: 10, fill: 0xffd166, fontWeight: '700', lineHeight: 14, wordWrap: true, wordWrapWidth: PANEL_W - 56
      });
      warn.position.set(x + 10, y + 6);
      warnBg.clear();
      warnBg.roundRect(x, y, PANEL_W - 36, Math.max(58, (warn.height as number) + 14), 7)
        .fill({ color: 0x2a1018, alpha: 0.9 })
        .stroke({ color: 0xff5577, width: 1.5, alpha: 0.9 });
      this.body.addChild(warnBg, warn);
      y += Math.max(70, (warn.height as number) + 26);
    }

    const composition = aggregateComposition(def);
    const lbl = makeLabel(SIDE_PANEL_COPY.enemies);
    lbl.position.set(x, y); this.body.addChild(lbl); y += 20;

    for (const [kind, count] of composition) {
      y = this.drawEnemyRow(x, y, kind, count);
    }

    if (def.bonusMemory) {
      y += 8;
      const bonus = makeText(SIDE_PANEL_COPY.bonusOnClear(def.bonusMemory), { fontSize: 12, fill: 0xffd166 });
      bonus.position.set(x, y); this.body.addChild(bonus);
      y += 26;
    }
    y = this.appendActiveSynergies(x, y + 8);
    this.finalizeLayout(y);
  }

  showVictory(summary?: RunSummary) {
    this.clear('victory');
    const x = PANEL_X + 18;
    let y = PANEL_Y + 60;
    const t1 = makeHeadline(SIDE_PANEL_COPY.victoryTitle, { fontSize: 36, fill: 0x77ffaa, letterSpacing: 8 });
    t1.position.set(x, y); this.body.addChild(t1);
    y += 56;
    const t2 = makeText(SIDE_PANEL_COPY.victoryBody, { fontSize: 13, fill: 0xc0c8d8, lineHeight: 20 });
    t2.position.set(x, y); this.body.addChild(t2);
    y += 56;
    if (summary) {
      y = this.appendCoreReport(x, y, summary, true);
      y = this.appendRunMeta(x, y);
      const run = makeText(this.formatRunSummary(summary), { fontSize: 12, fill: 0xc0c8d8, lineHeight: 18 });
      run.position.set(x, y); this.body.addChild(run);
      y += (run.height as number) + 10;
      y = this.appendCopySummaryButton(x, y);
    }
    this.finalizeLayout(y);
  }

  showDefeat(wave = 0, summary?: RunSummary) {
    this.clear('defeat');
    const x = PANEL_X + 18;
    let y = PANEL_Y + 60;
    const t1 = makeHeadline(SIDE_PANEL_COPY.defeatTitle, { fontSize: 24, fill: 0xff5577, letterSpacing: 4 });
    t1.position.set(x, y); this.body.addChild(t1);
    y += 50;
    const t2 = makeText(SIDE_PANEL_COPY.defeatBody(wave), { fontSize: 13, fill: 0xc0c8d8, lineHeight: 20 });
    t2.position.set(x, y); this.body.addChild(t2);
    y += (t2.height as number) + 14;
    if (summary) {
      y = this.appendCoreReport(x, y, summary, false);
      const hints = this.defeatHints(wave, summary);
      if (hints.length > 0) {
        const label = makeLabel(SIDE_PANEL_COPY.tips);
        label.position.set(x, y);
        this.body.addChild(label);
        y += 18;
        for (const hint of hints) {
          const tip = makeText(`- ${hint}`, {
            fontSize: 11,
            fill: 0xffd166,
            wordWrap: true,
            wordWrapWidth: PANEL_W - 36,
            lineHeight: 15
          });
          tip.position.set(x, y);
          this.body.addChild(tip);
          y += Math.max(15, tip.height as number) + 3;
        }
        y += 8;
      }
      y = this.appendRunMeta(x, y);
      const run = makeText(this.formatRunSummary(summary), { fontSize: 12, fill: 0xc0c8d8, lineHeight: 18 });
      run.position.set(x, y);
      this.body.addChild(run);
      y += (run.height as number) + 10;
      y = this.appendCopySummaryButton(x, y);
    }
    this.finalizeLayout(y);
  }

  private appendCopySummaryButton(x: number, y: number): number {
    if (!this.callbacks.onCopyRunSummary) return y;
    const w = PANEL_W - 36;
    const h = 30;
    const btn = new Container();
    const bg = new Graphics();
    const text = makeText('COPY RUN SUMMARY', {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
      fill: 0x6cf0ff
    });
    const draw = (hovered: boolean): void => {
      bg.clear();
      bg.roundRect(0, 0, w, h, 7)
        .fill({ color: hovered ? 0x10202c : 0x0a0f1a, alpha: 0.96 })
        .stroke({ color: 0x6cf0ff, width: hovered ? 1.6 : 1, alpha: hovered ? 1 : 0.7 });
    };
    draw(false);
    text.anchor.set(0.5);
    text.position.set(w / 2, h / 2);
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => draw(true));
    btn.on('pointerout', () => draw(false));
    btn.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.callbacks.onCopyRunSummary?.();
    });
    btn.addChild(bg, text);
    this.body.addChild(btn);
    return y + h + 10;
  }

  private formatRunSummary(summary: RunSummary): string {
    const top = summary.topDamageEmotion
      ? `${EMOTION_LABEL[summary.topDamageEmotion]} ${formatCompactNumber(summary.topDamage)}`
      : 'NONE';
    return [
      `Score: ${formatInteger(summary.score)}`,
      `Core State: ${balanceLore[summary.maxBalanceState].title}`,
      `Dominant Emotion: ${summary.dominantEmotionAtDeath ? EMOTION_LABEL[summary.dominantEmotionAtDeath] : 'Mixed'}`,
      `Dominant Category: ${summary.dominantCategoryAtDeath ? categoryLoreLabel(summary.dominantCategoryAtDeath) : 'Balanced pattern'}`,
      `Kills: ${formatInteger(summary.killsTotal)}  Boss: ${summary.bossKills}`,
      `Damage: ${top}`,
      `Memory earned: ${formatInteger(summary.memoryEarned)}`,
      `Towers used: ${summary.towersUsed}  Max upgrade: ${summary.highestUpgradeLevel}`,
      `Upgrades: ${summary.upgradesPurchased}  Sold: ${summary.towersSold}`,
      `Core damage: ${summary.coreDamageTaken}`,
      `Max resonance: ${summary.maxResonanceTime.toFixed(1)}s`,
      `Max synergies: ${summary.maxActiveSynergies}`
    ].join('\n');
  }

  private appendRunMeta(x: number, y: number): number {
    if (!this.runConfig || !this.mapDefinition) return y;
    const label = makeLabel('RUN CONFIG');
    label.position.set(x, y);
    this.body.addChild(label);
    y += 18;
    const text = makeText([
      `Mode: ${CHALLENGE_MODE_LABEL[this.runConfig.mode]}`,
      `Map: ${this.mapDefinition.name}`,
      `Seed: ${this.runConfig.seed}`,
      `Rules: ${this.runConfig.rules.join(' / ')}`
    ].join('\n'), {
      fontSize: 11,
      fill: 0xc0c8d8,
      wordWrap: true,
      wordWrapWidth: PANEL_W - 36,
      lineHeight: 16
    });
    text.position.set(x, y);
    this.body.addChild(text);
    return y + (text.height as number) + 12;
  }

  private appendStats(x: number, y: number, type: EmotionType, stats: TowerStats = TOWER_STATS[type]): number {
    const rows: [string, string][] = [];
    rows.push([SIDE_PANEL_COPY.statCost, `${TOWER_STATS[type].cost}`]);
    rows.push([SIDE_PANEL_COPY.statDamage, `${formatCompactNumber(stats.damage)}`]);
    rows.push([SIDE_PANEL_COPY.statRange, `${Math.round(stats.range)}`]);
    rows.push([SIDE_PANEL_COPY.statFireRate, formatSeconds(stats.fireRate)]);
    if (stats.splashRadius) rows.push(['SPLASH', `${Math.round(stats.splashRadius)}`]);
    if (stats.chainCount)   rows.push(['CHAIN', `${stats.chainCount}`]);
    if (stats.slowAmount)   rows.push(['SLOW', `${Math.round((1 - stats.slowAmount) * 100)}% / ${formatSeconds(stats.slowDuration)}`]);
    if (stats.fearChance)   rows.push(['STUN', `${Math.round(stats.fearChance * 100)}% / ${formatSeconds(stats.stunDuration)}`]);
    if (stats.buffRadius)   rows.push(['BUFF', `+${Math.round((1 - (stats.buffFireRate ?? 1)) * 100)}% ${SIDE_PANEL_COPY.statTempo}`]);
    if (stats.numbDamageMul) rows.push(['NUMB', formatMultiplier(stats.numbDamageMul)]);
    if (stats.poisonDps) rows.push([SIDE_PANEL_COPY.statPoison, `${formatDecimal(stats.poisonDps, 1)}/s / ${formatSeconds(stats.poisonDuration)}`]);
    if (stats.armorShred) rows.push(['SHRED', `${formatMultiplier(stats.armorShred)} / ${formatSeconds(stats.armorShredDuration)}`]);
    if (stats.guiltMark) rows.push(['MARK', `+${Math.round(stats.guiltMark * 100)}% / hit`]);
    if (stats.guiltExecuteThreshold) rows.push(['EXECUTE', `${Math.round(stats.guiltExecuteThreshold * 100)}% HP`]);
    if (stats.coreShield) rows.push(['SHIELD', `+${formatDecimal(stats.coreShield)} Core`]);
    if (stats.trustAnchorDuration) rows.push(['ANCHOR', formatSeconds(stats.trustAnchorDuration)]);
    if (stats.shameGroupDamageMul) rows.push(['GROUP', `${formatMultiplier(stats.shameGroupDamageMul)} / ${Math.round(stats.shameGroupRadius ?? 0)}`]);
    if (stats.loveLinkRadius) rows.push(['LINK', `${Math.round(stats.loveLinkRadius)} / ${formatMultiplier(stats.loveDamageMul)}`]);
    if (stats.prideIsolationDamageMul) rows.push(['ISOLATED', formatMultiplier(stats.prideIsolationDamageMul)]);

    for (const [k, v] of rows) {
      const kt = makeLabel(k);
      kt.position.set(x, y);
      const vt = makeText(v, { fontSize: 13, fill: 0xe8edf2 });
      vt.anchor.set(1, 0);
      vt.position.set(x + (PANEL_W - 36), y - 1);
      this.body.addChild(kt, vt);
      y += 18;
    }
    return y + 12;
  }

  private appendDamageBreakdown(x: number, y: number, tower: Tower): number {
    const breakdown = tower.getStatBreakdown().damage;
    const label = makeLabel('DAMAGE BREAKDOWN');
    label.position.set(x, y);
    this.body.addChild(label);
    y += 18;

    const lines = [
      `Base ${Math.round(breakdown.base)} -> Upgraded ${Math.round(breakdown.upgraded)} (${formatPercent(breakdown.upgradePercent)})`,
      `Final ${Math.round(breakdown.final)}  /  Active ${formatMultiplier(breakdown.multiplier)}`
    ];
    const bonusLines = breakdown.lines.length > 0
      ? breakdown.lines.slice(0, 5)
      : ['No local synergy bonuses applied.'];
    if (breakdown.lines.length > 5) bonusLines.push(`+${breakdown.lines.length - 5} more`);

    const text = makeText([...lines, ...bonusLines].join('\n'), {
      fontSize: 10,
      fill: 0xc0c8d8,
      wordWrap: true,
      wordWrapWidth: PANEL_W - 46,
      lineHeight: 14
    });
    const boxH = Math.max(58, (text.height as number) + 14);
    const box = new Graphics();
    box.roundRect(x, y, PANEL_W - 36, boxH, 7)
      .fill({ color: 0x0a0f1a, alpha: 0.82 })
      .stroke({ color: EMOTION_COLOR[tower.type], width: 1, alpha: 0.42 });
    text.position.set(x + 10, y + 7);
    this.body.addChild(box, text);
    return y + boxH + 12;
  }

  private appendTowerBrief(x: number, y: number, type: EmotionType, includeDescription = true): number {
    const stats = TOWER_STATS[type];
    const help = TOWER_HELP_COPY[type];
    const lore = towerLore[type];
    if (includeDescription) {
      const desc = makeText(`${lore.oneLine}\n${stats.description}`, {
        fontSize: 12,
        fill: 0xc0c8d8,
        wordWrap: true,
        wordWrapWidth: PANEL_W - 36,
        lineHeight: 16
      });
      desc.position.set(x, y);
      this.body.addChild(desc);
      y += Math.max(20, desc.height as number) + 8;
    }

    const detail = [
      `Category: ${TOWER_CATEGORY_LABEL[stats.category]}`,
      `Role: ${help.role}`,
      `Strong: ${lore.strengthLore}`,
      `Weak: ${lore.weaknessLore}`,
      `Imbalance: ${lore.imbalanceWarning}`,
      `Placement: ${help.placement}`
    ].join('\n');
    const box = new Graphics();
    const detailText = makeText(detail, {
      fontSize: 10,
      fill: 0x9aa6bd,
      wordWrap: true,
      wordWrapWidth: PANEL_W - 56,
      lineHeight: 14
    });
    const boxH = Math.max(74, (detailText.height as number) + 16);
    box.roundRect(x, y, PANEL_W - 36, boxH, 7)
      .fill({ color: 0x0a0f1a, alpha: 0.82 })
      .stroke({ color: EMOTION_COLOR[type], width: 1, alpha: 0.48 });
    detailText.position.set(x + 10, y + 8);
    this.body.addChild(box, detailText);
    return y + boxH + 14;
  }

  private appendCoreReport(x: number, y: number, summary: RunSummary, victory: boolean): number {
    const state = summary.maxBalanceState;
    const dominantEmotion = summary.dominantEmotionAtDeath ? EMOTION_LABEL[summary.dominantEmotionAtDeath] : 'Mixed';
    const dominantCategory = summary.dominantCategoryAtDeath ? categoryLoreLabel(summary.dominantCategoryAtDeath) : 'Balanced pattern';
    const cause = victory
      ? 'Stabilization reached. The Core survived the first fracture.'
      : this.primaryCollapseCause(summary);
    const report = makeText([
      victory ? 'CORE REPORT: STABILIZED' : 'CORE REPORT: COLLAPSE',
      cause,
      `Core State: ${balanceLore[state].title}`,
      `Pattern: ${dominantEmotion} / ${dominantCategory}`,
      balanceLore[state].description
    ].join('\n'), {
      fontSize: 10,
      fill: victory ? 0x77ffaa : 0xffd166,
      wordWrap: true,
      wordWrapWidth: PANEL_W - 56,
      lineHeight: 14
    });
    const boxH = Math.max(76, (report.height as number) + 16);
    const box = new Graphics();
    box.roundRect(x, y, PANEL_W - 36, boxH, 7)
      .fill({ color: 0x0a0f1a, alpha: 0.86 })
      .stroke({ color: victory ? 0x77ffaa : 0xff5577, width: 1.2, alpha: 0.68 });
    report.position.set(x + 10, y + 8);
    this.body.addChild(box, report);
    return y + boxH + 12;
  }

  private primaryCollapseCause(summary: RunSummary): string {
    if (summary.coreDamageTaken >= 8) return 'The Core collapsed under unresolved pressure. Fast fractures slipped through the final turns.';
    if (summary.maxBalanceState === 'overloaded' || summary.maxBalanceState === 'imbalanced') return 'The Core overloaded from repeated emotional patterns. Diversify responses to restore resonance.';
    if (summary.bossKills === 0 && summary.killsTotal > 0) return 'A boss pattern completed its loop. Stronger single-target pressure was needed.';
    if (summary.memoryEarned > 0 && summary.upgradesPurchased <= 2) return 'The Core had unused Memory at collapse. Spend earlier on upgrades or final-turn defenses.';
    return 'The fracture path reached the Core before the response layer stabilized.';
  }

  private defeatHints(wave: number, summary: RunSummary): string[] {
    const hints: string[] = [];
    if (summary.upgradesPurchased <= Math.max(1, Math.floor(wave / 7))) hints.push('Too few upgrades. Commit to one path on your most important towers.');
    if (wave >= 10 && summary.bossKills === 0) hints.push('Low damage against bosses. Add Pride, Guilt, poison, or mixed upgraded damage.');
    if (summary.maxBalanceState === 'overloaded') hints.push('Your build overloaded emotionally. Mix emotions or categories to regain Resonance.');
    else if (summary.maxBalanceState === 'imbalanced') hints.push('Emotional imbalance hurt efficiency. Add variety before scaling one emotion further.');
    if (summary.maxResonanceTime < 2 && wave >= 6) hints.push('Try mixing emotions for local synergies and Resonance.');
    if (summary.coreDamageTaken >= 6) hints.push('Too many leaks. Add earlier slow, fast targeting, or more damage near the final turns.');
    return hints.slice(0, 2);
  }

  private appendSynergy(x: number, y: number, synergies: EmotionType[]): number {
    const lbl = makeLabel(SIDE_PANEL_COPY.synergy);
    lbl.position.set(x, y); this.body.addChild(lbl);
    y += 18;
    let dx = x;
    for (const s of synergies) {
      const dot = new Graphics();
      dot.circle(0, 0, 6).fill({ color: EMOTION_COLOR[s], alpha: 0.95 });
      dot.position.set(dx + 6, y + 6);
      this.body.addChild(dot);
      const t = makeText(EMOTION_LABEL[s], { fontSize: 10, letterSpacing: 1, fill: 0xc0c8d8, fontWeight: '700' });
      t.position.set(dx + 16, y + 1);
      this.body.addChild(t);
      const w = (t.width as number) + 30;
      dx += w;
      if (dx > PANEL_X + PANEL_W - 60) { dx = x; y += 18; }
    }
    return y + 26;
  }

  private appendActiveSynergies(x: number, y: number): number {
    const label = makeLabel(SIDE_PANEL_COPY.activeSynergies);
    label.position.set(x, y);
    this.body.addChild(label);
    y += 18;

    if (this.activeSynergies.length === 0) {
      const empty = makeText(SIDE_PANEL_COPY.noActivePairs, { fontSize: 11, fill: 0x7d8ba6 });
      empty.position.set(x, y);
      this.body.addChild(empty);
      return y + 22;
    }

    const maxDisplayed = 5;
    for (const synergy of this.activeSynergies.slice(0, maxDisplayed)) {
      const title = makeText(synergy.label, { fontSize: 11, fill: 0x77ffaa, fontWeight: '700', letterSpacing: 1 });
      title.position.set(x + 9, y + 7);
      const desc = makeText(`${synergy.bonusLabel ? `${synergy.bonusLabel}: ` : ''}${synergy.description}`, {
        fontSize: 9,
        fill: 0x9aa6bd,
        wordWrap: true,
        wordWrapWidth: PANEL_W - 58,
        lineHeight: 13
      });
      desc.position.set(x + 9, y + 23);
      const boxH = Math.max(48, 31 + (desc.height as number));
      const box = new Graphics();
      box.roundRect(x, y, PANEL_W - 36, boxH, 7)
        .fill({ color: 0x0a0f1a, alpha: 0.76 })
        .stroke({ color: 0x77ffaa, width: 1, alpha: 0.24 });
      this.body.addChild(box, title, desc);
      y += boxH + 7;
    }

    if (this.activeSynergies.length > maxDisplayed) {
      const extraCount = this.activeSynergies.length - maxDisplayed;
      const extraLabel = makeText(`+ ${extraCount} more`, { fontSize: 11, fill: 0x7d8ba6, fontWeight: '700' });
      extraLabel.position.set(x, y);
      this.body.addChild(extraLabel);
      y += 20;
    }

    return y + 4;
  }

  private appendUpgrades(x: number, y: number, tower: Tower, memory: number): number {
    const label = makeLabel(SIDE_PANEL_COPY.upgrades);
    label.position.set(x, y);
    this.body.addChild(label);
    y += 20;

    for (const path of UPGRADE_PATHS) {
      this.drawUpgradeButton(x, y, tower, path, memory);
      y += UPGRADE_BUTTON_H + 8;
    }
    return y + 4;
  }

  private appendTargetingControls(x: number, y: number, tower: Tower): number {
    const label = makeLabel(SIDE_PANEL_COPY.targeting);
    label.position.set(x, y);
    this.body.addChild(label);
    y += 20;

    const current = tower.getTargetingMode();
    const buttonW = 76;
    const buttonH = 28;
    TARGETING_MODES.forEach((mode, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const btn = new Container();
      const bg = new Graphics();
      const active = mode === current;
      const text = makeText(TARGETING_LABEL[mode], {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
        fill: active ? 0x05070d : 0xe8edf2
      });
      const draw = (hovered: boolean): void => {
        bg.clear();
        bg.roundRect(0, 0, buttonW, buttonH, 6)
          .fill({ color: active ? 0x77ffaa : hovered ? 0x1a2238 : 0x0a0f1a, alpha: 0.96 })
          .stroke({ color: active ? 0x77ffaa : COLORS.panelEdge, width: 1, alpha: hovered || active ? 1 : 0.7 });
      };
      draw(false);
      text.anchor.set(0.5);
      text.position.set(buttonW / 2, buttonH / 2);
      btn.position.set(x + col * (buttonW + 6), y + row * (buttonH + 7));
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerover', () => draw(true));
      btn.on('pointerout', () => draw(false));
      btn.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation();
        this.callbacks.onTargetingChange(mode);
      });
      btn.addChild(bg, text);
      this.body.addChild(btn);
    });

    return y + 2 * (buttonH + 7) + 10;
  }

  private appendSellButton(x: number, y: number, tower: Tower): number {
    const refund = tower.sellValue();
    const btn = new Container();
    const bg = new Graphics();
    const text = makeText(SIDE_PANEL_COPY.sellMemory(refund), {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 2,
      fill: 0xffd166
    });
    const w = PANEL_W - 36;
    const draw = (hovered: boolean): void => {
      bg.clear();
      bg.roundRect(0, 0, w, 34, 7)
        .fill({ color: hovered ? 0x2a1d12 : 0x0a0f1a, alpha: 0.96 })
        .stroke({ color: 0xffd166, width: hovered ? 2 : 1, alpha: hovered ? 1 : 0.75 });
    };
    draw(false);
    text.anchor.set(0.5);
    text.position.set(w / 2, 17);
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => draw(true));
    btn.on('pointerout', () => draw(false));
    btn.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.callbacks.onSell();
    });
    btn.addChild(bg, text);
    this.body.addChild(btn);
    return y + 44;
  }

  private drawUpgradeButton(x: number, y: number, tower: Tower, path: UpgradePath, memory: number) {
    const def = TOWER_UPGRADES[tower.type][path];
    const state = tower.getUpgradeState();
    const active = state.path === path;
    const locked = state.path !== null && state.path !== path;
    const nextCost = tower.nextUpgradeCost(path);
    const maxed = active && nextCost === null;
    const enabled = tower.canUpgrade(path, memory);
    const c = EMOTION_COLOR[tower.type];
    const w = PANEL_W - 36;

    const btn = new Container();
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = enabled ? 'pointer' : 'not-allowed';
    btn.hitArea = { contains: (px: number, py: number) => px >= 0 && px <= w && py >= 0 && py <= UPGRADE_BUTTON_H } as any;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, UPGRADE_BUTTON_H, 7).fill({ color: active ? c : 0x0a0f1a, alpha: active ? 0.18 : 0.94 });
    bg.roundRect(0, 0, w, UPGRADE_BUTTON_H, 7).stroke({
      color: locked ? COLORS.panelEdge : c,
      width: active ? 2 : 1,
      alpha: locked ? 0.7 : enabled ? 0.95 : 0.45
    });
    if (!enabled && !maxed) bg.roundRect(0, 0, w, UPGRADE_BUTTON_H, 7).fill({ color: 0x000000, alpha: 0.38 });
    btn.addChild(bg);

    const maxLevel = def.levels.length;
    const title = makeText(`${path}  ${def.title}`, {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      fill: locked ? 0x7d8ba6 : 0xe8edf2
    });
    title.position.set(10, 8);
    btn.addChild(title);

    const role = makeText(def.role, { fontSize: 10, fill: locked ? 0x566178 : 0xc0c8d8, wordWrap: true, wordWrapWidth: w - 20, lineHeight: 13 });
    role.position.set(10, 26);
    btn.addChild(role);

    const levelText = `${active ? state.level : 0}/${maxLevel}`;
    const subText =
      locked ? SIDE_PANEL_COPY.lockedByOtherPath :
      maxed ? SIDE_PANEL_COPY.levelMax(levelText) :
      SIDE_PANEL_COPY.levelCost(levelText, nextCost ?? 0);
    const sub = makeText(subText, {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      fill: enabled ? 0xffd166 : maxed ? 0x77ffaa : 0x7d8ba6
    });
    sub.position.set(10, 60);
    btn.addChild(sub);

    const summary = locked || nextCost === null ? '' : def.levels[state.path === path ? state.level : 0]?.summary ?? '';
    if (summary) {
      const s = makeText(summary, { fontSize: 9, fill: 0x9aa6bd, wordWrap: true, wordWrapWidth: w - 20, lineHeight: 12 });
      s.position.set(10, 82);
      btn.addChild(s);
    }

    btn.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (enabled) this.callbacks.onUpgrade(path);
    });
    this.body.addChild(btn);
  }

  private drawEnemyRow(x: number, y: number, kind: EnemyKind, count: number): number {
    const stats = ENEMY_STATS[kind];
    const dot = new Graphics();
    const colors: Record<EnemyKind, number> = {
      [EnemyKind.Doubtling]: 0xb070ff,
      [EnemyKind.PanicRunner]: 0xff5577,
      [EnemyKind.Fractureling]: 0x6cf0ff,
      [EnemyKind.PressureKnot]: 0xffd166,
      [EnemyKind.GuiltGiant]: 0xffd166,
      [EnemyKind.ShameSwarm]: 0xff77ff,
      [EnemyKind.EnvyLeech]: 0x77ffaa,
      [EnemyKind.BurnoutBrute]: 0xff5b3a,
      [EnemyKind.VoidWraith]: 0xb070ff,
      [EnemyKind.Overthinker]: 0x6cf0ff,
      [EnemyKind.NumbOne]: 0x8c95a8,
      [EnemyKind.Spiral]: 0xff5577,
      [EnemyKind.Mask]: 0xff77ff,
      [EnemyKind.BurnoutBoss]: 0xff5b3a
    };
    dot.circle(0, 0, 7).fill({ color: colors[kind], alpha: 0.9 });
    dot.position.set(x + 7, y + 9);
    this.body.addChild(dot);

    const name = makeText(stats.label, { fontSize: 12, fill: 0xe8edf2, fontWeight: '700' });
    name.position.set(x + 22, y);
    this.body.addChild(name);

    const sub = makeText(`HP ${stats.hp}  •  Speed ${stats.speed}`, { fontSize: 9, letterSpacing: 1, fill: 0x7d8ba6 });
    sub.position.set(x + 22, y + 14);
    this.body.addChild(sub);

    const cnt = makeText(`×${count}`, { fontSize: 14, fontWeight: '700', fill: 0x6cf0ff });
    cnt.anchor.set(1, 0);
    cnt.position.set(PANEL_X + PANEL_W - 18, y + 1);
    this.body.addChild(cnt);

    y += 32;
    for (const trait of ENEMY_TRAITS[kind]) {
      const t = makeText(`- ${trait}`, {
        fontSize: 9,
        fill: 0x9aa6bd,
        wordWrap: true,
        wordWrapWidth: PANEL_W - 56,
        lineHeight: 12
      });
      t.position.set(x + 22, y);
      this.body.addChild(t);
      y += Math.max(12, t.height as number) + 2;
    }
    return y + 8;
  }

  /* ----------------------------- scrolling ----------------------------- */

  private finalizeLayout(maxAbsoluteY: number): void {
    // Convert "absolute Y reached" to "content height inside the viewport".
    const used = Math.max(0, maxAbsoluteY - PANEL_Y - SCROLL_PAD_TOP);
    this.contentHeight = used;
    this.applyScrollClamp();
    this.drawScrollBar();
  }

  private scrollByDelta(deltaY: number): void {
    if (this.contentHeight <= VIEWPORT_H) return;
    this.scrollY += deltaY * 0.5;
    this.applyScrollClamp();
    this.drawScrollBar();
    this.saveScrollForCurrentView();
  }

  private saveScrollForCurrentView(): void {
    this.scrollYByViewKey.set(this.currentViewKey, this.scrollY);
  }

  private applyScrollClamp(): void {
    const max = Math.max(0, this.contentHeight - VIEWPORT_H);
    if (this.scrollY < 0) this.scrollY = 0;
    else if (this.scrollY > max) this.scrollY = max;
    this.body.y = -this.scrollY;
  }

  private drawScrollBar(): void {
    const g = this.scrollBar;
    g.clear();
    if (this.contentHeight <= VIEWPORT_H) return;
    const trackX = PANEL_X + PANEL_W - 5;
    const trackY = PANEL_Y + SCROLL_PAD_TOP;
    const trackH = VIEWPORT_H;
    const thumbH = Math.max(34, (VIEWPORT_H / this.contentHeight) * trackH);
    const max = this.contentHeight - VIEWPORT_H;
    const t = max > 0 ? this.scrollY / max : 0;
    const thumbY = trackY + (trackH - thumbH) * t;
    g.roundRect(trackX, trackY, 2, trackH, 1).fill({ color: COLORS.panelEdge, alpha: 0.55 });
    g.roundRect(trackX - 1, thumbY, 4, thumbH, 2).fill({ color: 0x6cf0ff, alpha: 0.9 });
  }

  static readonly width = PANEL_W;
}

function aggregateComposition(def: WaveDef): [EnemyKind, number][] {
  const map = new Map<EnemyKind, number>();
  for (const g of def.groups) map.set(g.kind, (map.get(g.kind) ?? 0) + g.count);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function formatPercent(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}
