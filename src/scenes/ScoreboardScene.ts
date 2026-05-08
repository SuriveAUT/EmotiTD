import { Application, Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import type { Scene } from '../core/Scene';
import type { SceneManager } from '../core/SceneManager';
import { CANVAS, COLORS, MAP_LIST, type MapDefinition } from '../game/config';
import { getScores, type ScoreboardEntry } from '../services/scoreboardApi';
import { makeHeadline, makeLabel, makeText } from '../ui/text';
import { MainMenuScene } from './MainMenuScene';

type Mode = 'standard' | 'endless';
const MODES: Mode[] = ['standard', 'endless'];

interface LoadState {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'empty';
  scores: ScoreboardEntry[];
  error?: string;
}

export class ScoreboardScene implements Scene {
  private readonly app: Application;
  private readonly sceneManager: SceneManager;
  private readonly root = new Container();
  private readonly listLayer = new Container();
  private readonly statusLayer = new Container();
  private mapButtons: Array<{ map: MapDefinition; redraw: () => void }> = [];
  private modeButtons: Array<{ mode: Mode; redraw: () => void }> = [];
  private selectedMap: MapDefinition = MAP_LIST[0];
  private selectedMode: Mode = 'standard';
  private state: LoadState = { status: 'idle', scores: [] };
  private requestId = 0;

  constructor(app: Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
  }

  init(): void {
    this.buildBackground();
    this.buildHeader();
    this.buildMapPicker();
    this.buildModePicker();
    this.buildBackButton();
    this.root.addChild(this.listLayer, this.statusLayer);
    this.app.stage.addChild(this.root);
    void this.refresh();
  }

  update(_dt: number): void {
    /* static */
  }

  destroy(): void {
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private buildBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: COLORS.bg });
    bg.roundRect(140, 90, CANVAS.width - 280, CANVAS.height - 180, 10)
      .fill({ color: COLORS.panel, alpha: 0.94 })
      .stroke({ color: 0x6cf0ff, width: 2, alpha: 0.78 });
    this.root.addChild(bg);
  }

  private buildHeader(): void {
    const title = makeText('SCOREBOARD', {
      fontSize: 38, fontWeight: '900', letterSpacing: 7, fill: 0x6cf0ff
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS.width / 2, 130);

    const sub = makeLabel('Alpha · trust-based · top 10 per map', {
      fontSize: 11, letterSpacing: 3, fill: COLORS.textDim
    });
    sub.anchor.set(0.5);
    sub.position.set(CANVAS.width / 2, 168);
    this.root.addChild(title, sub);
  }

  private buildMapPicker(): void {
    const row = new Container();
    row.position.set(CANVAS.width / 2, 220);
    const total = MAP_LIST.length;
    const gap = 220;
    MAP_LIST.forEach((map, idx) => {
      const x = (idx - (total - 1) / 2) * gap;
      row.addChild(this.createPickerButton(map.name.toUpperCase(), x, 0, () => {
        if (this.selectedMap.id === map.id) return;
        this.selectedMap = map;
        for (const b of this.mapButtons) b.redraw();
        void this.refresh();
      }, () => this.selectedMap.id === map.id, (redraw) => this.mapButtons.push({ map, redraw })));
    });
    this.root.addChild(row);
  }

  private buildModePicker(): void {
    const row = new Container();
    row.position.set(CANVAS.width / 2, 274);
    const gap = 150;
    MODES.forEach((mode, idx) => {
      const x = (idx - (MODES.length - 1) / 2) * gap;
      const label = mode.toUpperCase();
      row.addChild(this.createPickerButton(label, x, 0, () => {
        if (this.selectedMode === mode) return;
        this.selectedMode = mode;
        for (const b of this.modeButtons) b.redraw();
        void this.refresh();
      }, () => this.selectedMode === mode, (redraw) => this.modeButtons.push({ mode, redraw }), 120, 32, 11));
    });
    this.root.addChild(row);
  }

  private createPickerButton(
    label: string,
    x: number,
    y: number,
    onClick: () => void,
    isActive: () => boolean,
    register: (redraw: () => void) => void,
    width = 200,
    height = 40,
    fontSize = 13
  ): Container {
    const btn = new Container();
    const frame = new Graphics();
    const text = makeLabel(label, { fontSize, letterSpacing: 3, fill: COLORS.text });
    let hovered = false;
    const draw = (): void => {
      const active = isActive();
      frame.clear();
      frame.roundRect(-width / 2, -height / 2, width, height, 7)
        .fill({
          color: active ? 0x6cf0ff : hovered ? COLORS.bgGridStrong : COLORS.panel,
          alpha: active ? 0.18 : 0.92
        })
        .stroke({ color: active ? 0x6cf0ff : COLORS.panelEdge, width: active ? 2 : 1, alpha: 0.85 });
      text.style.fill = active ? 0x6cf0ff : COLORS.text;
    };
    text.anchor.set(0.5);
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => { hovered = true; draw(); });
    btn.on('pointerout', () => { hovered = false; draw(); });
    btn.on('pointertap', () => { audioManager.playSfx('ui-click'); onClick(); });
    btn.addChild(frame, text);
    register(draw);
    draw();
    return btn;
  }

  private buildBackButton(): void {
    const btn = new Container();
    const frame = new Graphics();
    const label = makeLabel('BACK', { fontSize: 13, letterSpacing: 3, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-70, -22, 140, 44, 8)
        .fill({ color: hovered ? 0xb070ff : COLORS.panel, alpha: hovered ? 0.22 : 0.92 })
        .stroke({ color: 0xb070ff, width: 2, alpha: 0.85 });
    };
    draw(false);
    label.anchor.set(0.5);
    btn.position.set(CANVAS.width / 2, CANVAS.height - 64);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => draw(true));
    btn.on('pointerout', () => draw(false));
    btn.on('pointertap', () => {
      audioManager.playSfx('ui-click');
      this.sceneManager.changeScene(new MainMenuScene(this.app, this.sceneManager));
    });
    btn.addChild(frame, label);
    this.root.addChild(btn);
  }

  private async refresh(): Promise<void> {
    const id = ++this.requestId;
    this.state = { status: 'loading', scores: [] };
    this.renderList();
    try {
      const result = await getScores(this.selectedMap.id, this.selectedMode, 10);
      if (id !== this.requestId) return;
      if (!result.ok) {
        this.state = { status: 'error', scores: [], error: 'unavailable' };
      } else if (result.scores.length === 0) {
        this.state = { status: 'empty', scores: [] };
      } else {
        this.state = { status: 'ready', scores: result.scores };
      }
    } catch (err) {
      if (id !== this.requestId) return;
      this.state = { status: 'error', scores: [], error: err instanceof Error ? err.message : 'unknown' };
    }
    this.renderList();
  }

  private renderList(): void {
    this.listLayer.removeChildren();
    this.statusLayer.removeChildren();

    const left = 200;
    const top = 320;
    const width = CANVAS.width - 400;

    const header = new Graphics();
    header.roundRect(left, top, width, 30, 5).fill({ color: 0x05070d, alpha: 0.92 }).stroke({ color: COLORS.panelEdge, width: 1 });
    this.listLayer.addChild(header);

    const cols: Array<{ label: string; x: number; align?: 'left' | 'right' }> = [
      { label: '#',     x: left + 18 },
      { label: 'NAME',  x: left + 60 },
      { label: 'SCORE', x: left + 380, align: 'right' },
      { label: 'WAVE',  x: left + 500, align: 'right' },
      { label: 'MODE',  x: left + 620 },
      { label: 'DATE',  x: left + width - 18, align: 'right' }
    ];
    for (const col of cols) {
      const t = makeLabel(col.label, { fontSize: 10, letterSpacing: 2, fill: COLORS.textDim });
      t.position.set(col.x, top + 8);
      if (col.align === 'right') t.anchor.set(1, 0);
      this.listLayer.addChild(t);
    }

    if (this.state.status !== 'ready') {
      this.renderStatus();
      return;
    }

    let y = top + 38;
    for (const entry of this.state.scores) {
      this.renderRow(entry, left, y, width);
      y += 32;
    }
  }

  private renderRow(entry: ScoreboardEntry, left: number, y: number, width: number): void {
    const row = new Graphics();
    row.roundRect(left, y, width, 28, 5).fill({ color: COLORS.panel, alpha: 0.7 }).stroke({ color: COLORS.panelEdge, width: 1, alpha: 0.6 });
    this.listLayer.addChild(row);

    const rank: Text = makeText(`#${entry.rank}`, { fontSize: 13, fontWeight: '800', fill: entry.rank <= 3 ? 0xffd166 : COLORS.text });
    rank.position.set(left + 18, y + 6);
    const name: Text = makeText(entry.playerName, { fontSize: 13, fill: COLORS.text });
    name.position.set(left + 60, y + 6);
    const score: Text = makeText(entry.score.toLocaleString(), { fontSize: 13, fontWeight: '700', fill: 0x6cf0ff });
    score.anchor.set(1, 0);
    score.position.set(left + 380, y + 6);
    const wave: Text = makeText(String(entry.wave), { fontSize: 13, fill: COLORS.text });
    wave.anchor.set(1, 0);
    wave.position.set(left + 500, y + 6);
    const mode: Text = makeText(entry.mode, { fontSize: 11, fill: COLORS.textDim });
    mode.position.set(left + 620, y + 7);
    const date: Text = makeText(this.formatDate(entry.createdAt), { fontSize: 11, fill: COLORS.textDim });
    date.anchor.set(1, 0);
    date.position.set(left + width - 18, y + 7);
    this.listLayer.addChild(rank, name, score, wave, mode, date);
  }

  private renderStatus(): void {
    let message: string;
    let color: number;
    if (this.state.status === 'loading') {
      message = 'Loading scoreboard…';
      color = COLORS.textDim;
    } else if (this.state.status === 'empty') {
      message = 'No scores yet. Be the first to break the Core.';
      color = 0xffd166;
    } else {
      message = 'Scoreboard unavailable.';
      color = 0xff5577;
    }
    const text = makeHeadline(message, { fontSize: 16, fill: color, letterSpacing: 3 });
    text.anchor.set(0.5);
    text.position.set(CANVAS.width / 2, 470);
    this.statusLayer.addChild(text);
  }

  private formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
