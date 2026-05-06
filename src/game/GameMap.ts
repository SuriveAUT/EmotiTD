import { Container, Graphics } from 'pixi.js';
import { CANVAS, COLORS, DEFAULT_MAP, FIELD, GRID_SIZE, type MapDefinition } from './config';
import type { Vec2 } from './types';
import { PathSampler, dist, clamp } from './math';

const PATH_HALF_WIDTH = 22;

interface DecorRipple {
  x: number;
  y: number;
  baseRadius: number;
  speed: number;
  phase: number;
}

interface DecorLilyPad {
  x: number;
  y: number;
  radius: number;
  hue: number;
  phase: number;
}

interface DecorGlitchLine {
  y: number;
  speed: number;
  width: number;
  alpha: number;
  phase: number;
}

interface DecorHex {
  x: number;
  y: number;
  radius: number;
  phase: number;
}

export class GameMap {
  readonly container: Container;
  readonly path: PathSampler;
  readonly corePos: Vec2;
  readonly definition: MapDefinition;

  private bg: Graphics;
  private gridG: Graphics;
  private decorStaticG: Graphics;
  private decorAnimG: Graphics;
  private pathBaseG: Graphics;
  private pathFlowG: Graphics;
  private coreG: Graphics;
  private flowOffset = 0;
  private coreTime = 0;
  private decorTime = 0;
  private coreStabilityRatio = 1;

  /* style-specific decoration state */
  private ripples: DecorRipple[] = [];
  private lilyPads: DecorLilyPad[] = [];
  private glitchLines: DecorGlitchLine[] = [];
  private hexes: DecorHex[] = [];

  /** Cells that are blocked because a tower is on them (cell key "cx,cy") */
  private occupied = new Set<string>();
  /** Cells blocked because the path runs through them */
  private pathBlocked = new Set<string>();

  readonly cols: number;
  readonly rows: number;

  constructor(definition: MapDefinition = DEFAULT_MAP) {
    this.definition = definition;
    this.container = new Container();
    this.container.label = 'map';
    this.path = new PathSampler(definition.waypoints);
    this.corePos = { ...(definition.corePosition ?? definition.waypoints[definition.waypoints.length - 1]) };
    this.cols = Math.floor(FIELD.width / GRID_SIZE);
    this.rows = Math.floor(FIELD.height / GRID_SIZE);

    this.bg = new Graphics();
    this.gridG = new Graphics();
    this.decorStaticG = new Graphics();
    this.decorAnimG = new Graphics();
    this.pathBaseG = new Graphics();
    this.pathFlowG = new Graphics();
    this.coreG = new Graphics();

    this.drawBackground();
    this.drawGrid();
    this.markPathCells();
    this.initDecorations();
    this.drawStaticDecorations();
    this.drawPathBase();
    this.drawCore();

    this.container.addChild(
      this.bg,
      this.gridG,
      this.decorStaticG,
      this.decorAnimG,
      this.pathBaseG,
      this.pathFlowG,
      this.coreG
    );
  }

  private drawBackground() {
    const { field } = this.definition.backgroundColors;
    this.bg.clear();
    this.bg
      .rect(FIELD.x, FIELD.y, FIELD.width, FIELD.height)
      .fill({ color: field, alpha: 1 });

    if (this.definition.style === 'silent') {
      // soft radial vignette evoking deep water
      this.bg.rect(FIELD.x, FIELD.y, FIELD.width, FIELD.height)
        .fill({ color: 0x000000, alpha: 0 });
      // gentle horizon glow at top
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        this.bg.rect(FIELD.x, FIELD.y + t * 80, FIELD.width, 80)
          .fill({ color: 0x6cf0d9, alpha: 0.012 * (1 - t) });
      }
      // depth gradient at bottom
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        this.bg.rect(FIELD.x, FIELD.y + FIELD.height - 100 + t * 100, FIELD.width, 18)
          .fill({ color: 0x040814, alpha: 0.06 + t * 0.06 });
      }
    } else {
      // fractured: subtle radial darkening near the edges
      this.bg.rect(FIELD.x, FIELD.y, FIELD.width, 4)
        .fill({ color: 0xff5577, alpha: 0.04 });
      this.bg.rect(FIELD.x, FIELD.y + FIELD.height - 4, FIELD.width, 4)
        .fill({ color: 0x6cf0ff, alpha: 0.04 });
    }

    this.bg.rect(FIELD.x, FIELD.y, FIELD.width, FIELD.height)
      .stroke({ color: COLORS.panelEdge, width: 1, alpha: 0.6 });
  }

  private drawGrid() {
    const g = this.gridG;
    g.clear();
    const dotted = this.definition.style === 'silent';
    const gridColor = this.definition.backgroundColors.grid;
    const gridStrongColor = this.definition.backgroundColors.gridStrong;

    if (dotted) {
      // tranquil dot lattice instead of hard lines
      for (let cx = 0; cx <= this.cols; cx++) {
        for (let cy = 0; cy <= this.rows; cy++) {
          const x = FIELD.x + cx * GRID_SIZE;
          const y = FIELD.y + cy * GRID_SIZE;
          const accent = cx % 4 === 0 && cy % 4 === 0;
          g.circle(x, y, accent ? 1.4 : 0.8)
            .fill({ color: accent ? gridStrongColor : gridColor, alpha: accent ? 0.85 : 0.45 });
        }
      }
    } else {
      for (let cx = 0; cx <= this.cols; cx++) {
        const x = FIELD.x + cx * GRID_SIZE;
        g.moveTo(x, FIELD.y).lineTo(x, FIELD.y + this.rows * GRID_SIZE);
      }
      for (let cy = 0; cy <= this.rows; cy++) {
        const y = FIELD.y + cy * GRID_SIZE;
        g.moveTo(FIELD.x, y).lineTo(FIELD.x + this.cols * GRID_SIZE, y);
      }
      g.stroke({ color: gridColor, width: 1, alpha: 0.65 });

      // accent every 4th line
      for (let cx = 0; cx <= this.cols; cx += 4) {
        const x = FIELD.x + cx * GRID_SIZE;
        g.moveTo(x, FIELD.y).lineTo(x, FIELD.y + this.rows * GRID_SIZE);
      }
      for (let cy = 0; cy <= this.rows; cy += 4) {
        const y = FIELD.y + cy * GRID_SIZE;
        g.moveTo(FIELD.x, y).lineTo(FIELD.x + this.cols * GRID_SIZE, y);
      }
      g.stroke({ color: gridStrongColor, width: 1, alpha: 0.5 });
    }
  }

  private markPathCells() {
    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        const wx = FIELD.x + cx * GRID_SIZE + GRID_SIZE / 2;
        const wy = FIELD.y + cy * GRID_SIZE + GRID_SIZE / 2;
        if (this.distanceToPath({ x: wx, y: wy }) < PATH_HALF_WIDTH + GRID_SIZE * 0.35) {
          this.pathBlocked.add(`${cx},${cy}`);
        }
      }
    }
  }

  private initDecorations() {
    if (this.definition.style === 'silent') {
      // ripples scattered around the field, biased away from the path
      for (let i = 0; i < 14; i++) {
        const point = this.findOpenSpot(40 + (i % 5) * 3);
        if (!point) continue;
        this.ripples.push({
          x: point.x,
          y: point.y,
          baseRadius: 22 + (i % 4) * 8,
          speed: 0.18 + (i % 5) * 0.04,
          phase: i * 0.7
        });
      }
      // static lily pads
      for (let i = 0; i < 9; i++) {
        const point = this.findOpenSpot(36);
        if (!point) continue;
        this.lilyPads.push({
          x: point.x,
          y: point.y,
          radius: 10 + (i % 3) * 4,
          hue: i % 2 === 0 ? 0x6cf0d9 : 0x4ba8ff,
          phase: i * 1.3
        });
      }
    } else {
      // glitch streak lines + decorative hex accents
      for (let i = 0; i < 5; i++) {
        this.glitchLines.push({
          y: FIELD.y + 40 + i * (FIELD.height / 5) + Math.random() * 20,
          speed: 80 + i * 30,
          width: 38 + i * 18,
          alpha: 0.18 + (i % 2) * 0.1,
          phase: i * 1.1
        });
      }
      for (let i = 0; i < 7; i++) {
        const point = this.findOpenSpot(40);
        if (!point) continue;
        this.hexes.push({
          x: point.x,
          y: point.y,
          radius: 14 + (i % 3) * 4,
          phase: i * 0.55
        });
      }
    }
  }

  private findOpenSpot(minDistanceToPath: number): Vec2 | null {
    for (let attempt = 0; attempt < 30; attempt++) {
      const x = FIELD.x + 30 + Math.random() * (FIELD.width - 60);
      const y = FIELD.y + 30 + Math.random() * (FIELD.height - 60);
      if (this.distanceToPath({ x, y }) > minDistanceToPath) {
        return { x, y };
      }
    }
    return null;
  }

  private drawStaticDecorations() {
    const g = this.decorStaticG;
    g.clear();

    if (this.definition.style === 'silent') {
      for (const pad of this.lilyPads) {
        // lily pad — soft layered disc
        g.circle(pad.x, pad.y, pad.radius + 6).fill({ color: pad.hue, alpha: 0.04 });
        g.circle(pad.x, pad.y, pad.radius).fill({ color: pad.hue, alpha: 0.12 });
        g.circle(pad.x, pad.y, pad.radius).stroke({ color: pad.hue, width: 1, alpha: 0.55 });
        g.circle(pad.x, pad.y, pad.radius * 0.45).fill({ color: 0x9bdcff, alpha: 0.5 });
      }
    } else {
      for (const hex of this.hexes) {
        g.regularPoly(hex.x, hex.y, hex.radius + 6, 6, 0).stroke({ color: 0x6cf0ff, width: 1, alpha: 0.16 });
        g.regularPoly(hex.x, hex.y, hex.radius, 6, 0).stroke({ color: 0xff5577, width: 1, alpha: 0.22 });
        g.circle(hex.x, hex.y, 1.8).fill({ color: 0x6cf0ff, alpha: 0.7 });
      }
    }
  }

  private drawAnimatedDecorations() {
    const g = this.decorAnimG;
    g.clear();
    const t = this.decorTime;

    if (this.definition.style === 'silent') {
      // expanding water rings
      for (const r of this.ripples) {
        const cycle = (t * r.speed + r.phase) % 1;
        const radius = r.baseRadius + cycle * 32;
        const alpha = (1 - cycle) * 0.22;
        if (alpha <= 0) continue;
        g.circle(r.x, r.y, radius).stroke({ color: 0x9bdcff, width: 1, alpha });
        g.circle(r.x, r.y, radius * 0.6).stroke({ color: 0x4ba8ff, width: 1, alpha: alpha * 0.65 });
      }
      // gentle bobbing highlight on lily pads
      for (const pad of this.lilyPads) {
        const bob = Math.sin(t * 1.2 + pad.phase) * 0.12;
        g.circle(pad.x + Math.cos(pad.phase) * 1.2, pad.y - 3 - bob * 4, pad.radius * 0.18)
          .fill({ color: 0xffffff, alpha: 0.3 + bob * 0.4 });
      }
    } else {
      // horizontal glitch streaks
      for (const line of this.glitchLines) {
        const x = FIELD.x + ((t * line.speed + line.phase * 80) % (FIELD.width + line.width)) - line.width;
        const w = line.width;
        g.rect(x, line.y, w, 1).fill({ color: 0x6cf0ff, alpha: line.alpha });
        g.rect(x, line.y + 1, w * 0.6, 1).fill({ color: 0xff5577, alpha: line.alpha * 0.4 });
      }
      // pulsing hex inner spark
      for (const hex of this.hexes) {
        const pulse = 0.5 + Math.sin(t * 2 + hex.phase) * 0.5;
        g.circle(hex.x, hex.y, 0.8 + pulse * 1.6).fill({ color: 0xff5577, alpha: 0.5 + pulse * 0.3 });
      }
    }
  }

  private drawPathBase() {
    const g = this.pathBaseG;
    g.clear();
    const colors = this.definition.backgroundColors;

    if (this.definition.style === 'silent') {
      // softer, wider, more diffuse path — like a slow current
      this.tracePath(g);
      g.stroke({ color: colors.pathEdge, width: PATH_HALF_WIDTH * 2 + 14, alpha: 0.5, cap: 'round', join: 'round' });
      this.tracePath(g);
      g.stroke({ color: 0x0c2842, width: PATH_HALF_WIDTH * 2 + 2, alpha: 0.85, cap: 'round', join: 'round' });
      this.tracePath(g);
      g.stroke({ color: colors.pathCore, width: 2, alpha: 0.7, cap: 'round', join: 'round' });
      this.tracePath(g);
      g.stroke({ color: 0xffffff, width: 0.6, alpha: 0.18, cap: 'round', join: 'round' });
    } else {
      // fractured: sharp neon circuit
      this.tracePath(g);
      g.stroke({ color: colors.pathEdge, width: PATH_HALF_WIDTH * 2 + 8, alpha: 0.45, cap: 'round', join: 'round' });
      this.tracePath(g);
      g.stroke({ color: 0x16344a, width: PATH_HALF_WIDTH * 2, alpha: 0.9, cap: 'round', join: 'round' });
      this.tracePath(g);
      g.stroke({ color: colors.pathCore, width: 2, alpha: 0.85, cap: 'round', join: 'round' });
    }
  }

  private tracePath(g: Graphics) {
    const waypoints = this.definition.waypoints;
    g.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      g.lineTo(waypoints[i].x, waypoints[i].y);
    }
  }

  private drawCore() {
    this.redrawCore(1);
  }

  redrawCore(stabilityRatio: number) {
    this.coreStabilityRatio = clamp(stabilityRatio, 0, 1);
    this.drawCoreVisual();
  }

  private drawCoreVisual() {
    const g = this.coreG;
    g.clear();
    const { x, y } = this.corePos;
    const r = 28;
    const stabilityRatio = this.coreStabilityRatio;
    const tint = stabilityRatio > 0.5 ? COLORS.coreCool : COLORS.core;
    const danger = stabilityRatio < 0.35;
    const critical = stabilityRatio < 0.2;
    const pulse = 1 + Math.sin(this.coreTime * (danger ? 7.5 : 3.2)) * (danger ? 0.12 : 0.05);
    const warnAlpha = danger ? 0.12 + 0.1 * Math.sin(this.coreTime * 9) : 0;
    // outer aura
    g.circle(x, y, (r + 26) * pulse).fill({ color: danger ? COLORS.danger : tint, alpha: danger ? 0.11 : 0.06 });
    g.circle(x, y, (r + 14) * pulse).fill({ color: tint, alpha: 0.10 });
    g.circle(x, y, (r + 5) * pulse).fill({ color: tint, alpha: 0.18 });
    if (danger) {
      g.circle(x, y, r + 42 + Math.sin(this.coreTime * 6) * 6).stroke({ color: COLORS.danger, width: 2.4, alpha: warnAlpha });
      g.circle(x, y, r + 60 + Math.sin(this.coreTime * 5.2) * 8).stroke({ color: COLORS.warn, width: 1.4, alpha: warnAlpha * 0.8 });
    }
    // shell
    g.circle(x, y, r * pulse).stroke({ color: danger ? COLORS.danger : tint, width: critical ? 3 : 2, alpha: 0.95 });
    g.circle(x, y, (r - 6) * pulse).stroke({ color: tint, width: 1, alpha: 0.6 });
    // crystal
    g.regularPoly(x, y, r * 0.55 * pulse, 6, this.coreTime * 0.25).fill({ color: tint, alpha: 0.65 });
    g.regularPoly(x, y, r * 0.32 * pulse, 6, Math.PI / 6 - this.coreTime * 0.18).fill({ color: 0xffffff, alpha: danger ? 0.38 : 0.55 });
    if (danger) {
      const cracks = critical ? 5 : 3;
      for (let i = 0; i < cracks; i++) {
        const a = -1.2 + i * 0.62;
        g.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25)
          .lineTo(x + Math.cos(a + 0.18) * r * 0.9, y + Math.sin(a + 0.18) * r * 0.9)
          .stroke({ color: COLORS.danger, width: 1.4, alpha: critical ? 0.9 : 0.62 });
      }
    }
  }

  /** Animate the bright "flow" particle along the path. */
  update(dt: number) {
    this.flowOffset = (this.flowOffset + dt * 220) % this.path.totalLength;
    this.coreTime += dt;
    this.decorTime += dt;
    this.drawAnimatedDecorations();
    this.drawFlow();
    this.drawCoreVisual();
  }

  private drawFlow() {
    const g = this.pathFlowG;
    g.clear();
    const dashes = 6;
    const total = this.path.totalLength;
    const dashLength = this.definition.style === 'silent' ? 22 : 14;
    const flowColor = this.definition.backgroundColors.pathFlow;
    for (let i = 0; i < dashes; i++) {
      const offset = (this.flowOffset + (i * total) / dashes) % total;
      const head = this.path.sample(offset);
      const tailD = Math.max(0, offset - dashLength);
      const tail = this.path.sample(tailD);
      g.moveTo(tail.x, tail.y).lineTo(head.x, head.y)
        .stroke({ color: flowColor, width: this.definition.style === 'silent' ? 3 : 4, alpha: this.definition.style === 'silent' ? 0.7 : 0.85, cap: 'round' });
      g.circle(head.x, head.y, this.definition.style === 'silent' ? 2.5 : 3).fill({ color: 0xffffff, alpha: 0.9 });
    }
  }

  /* ----------------------- placement helpers ----------------------- */

  worldToCell(wx: number, wy: number): { cx: number; cy: number } | null {
    const cx = Math.floor((wx - FIELD.x) / GRID_SIZE);
    const cy = Math.floor((wy - FIELD.y) / GRID_SIZE);
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return null;
    return { cx, cy };
  }

  cellCenter(cx: number, cy: number): Vec2 {
    return {
      x: FIELD.x + cx * GRID_SIZE + GRID_SIZE / 2,
      y: FIELD.y + cy * GRID_SIZE + GRID_SIZE / 2
    };
  }

  isPlaceable(cx: number, cy: number): boolean {
    const key = `${cx},${cy}`;
    if (this.pathBlocked.has(key)) return false;
    if (this.occupied.has(key)) return false;
    // Don't allow placing right on the core
    const center = this.cellCenter(cx, cy);
    if (dist(center, this.corePos) < 50) return false;
    return true;
  }

  occupy(cx: number, cy: number)  { this.occupied.add(`${cx},${cy}`); }
  release(cx: number, cy: number) { this.occupied.delete(`${cx},${cy}`); }

  private distanceToPath(p: Vec2): number {
    let min = Infinity;
    const waypoints = this.definition.waypoints;
    for (let i = 1; i < waypoints.length; i++) {
      const a = waypoints[i - 1], b = waypoints[i];
      const abx = b.x - a.x, aby = b.y - a.y;
      const apx = p.x - a.x, apy = p.y - a.y;
      const segLen2 = abx * abx + aby * aby;
      const t = clamp(segLen2 > 0 ? (apx * abx + apy * aby) / segLen2 : 0, 0, 1);
      const cx = a.x + abx * t, cy = a.y + aby * t;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < min) min = d;
    }
    return min;
  }

  /** Bounds of full canvas — for letterboxing. */
  static getCanvasBounds() { return CANVAS; }
}
