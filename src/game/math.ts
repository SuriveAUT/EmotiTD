import type { Vec2 } from './types';

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const dist = (a: Vec2, b: Vec2) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  return Math.hypot(dx, dy);
};

export const distSq = (a: Vec2, b: Vec2) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  return dx * dx + dy * dy;
};

export const angleTo = (from: Vec2, to: Vec2) => Math.atan2(to.y - from.y, to.x - from.x);

export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export const randSign = () => (Math.random() < 0.5 ? -1 : 1);

export const pick = <T>(arr: readonly T[]): T => arr[(Math.random() * arr.length) | 0];

export class PathSampler {
  readonly waypoints: Vec2[];
  readonly cumLengths: number[];
  readonly totalLength: number;

  constructor(waypoints: Vec2[]) {
    this.waypoints = waypoints;
    const cum = [0];
    let total = 0;
    for (let i = 1; i < waypoints.length; i++) {
      total += dist(waypoints[i - 1], waypoints[i]);
      cum.push(total);
    }
    this.cumLengths = cum;
    this.totalLength = total;
  }

  /**
   * Get the world position at distance `d` along the path (clamped).
   * Returns position AND angle of travel direction.
   */
  sample(d: number): { x: number; y: number; angle: number; segIndex: number } {
    if (d <= 0) {
      const a = this.waypoints[0];
      const b = this.waypoints[1] ?? a;
      return { x: a.x, y: a.y, angle: angleTo(a, b), segIndex: 0 };
    }
    if (d >= this.totalLength) {
      const last = this.waypoints[this.waypoints.length - 1];
      const prev = this.waypoints[this.waypoints.length - 2] ?? last;
      return { x: last.x, y: last.y, angle: angleTo(prev, last), segIndex: this.waypoints.length - 2 };
    }
    // binary search would be tidier; linear is fine for ~10 waypoints
    let i = 1;
    while (i < this.cumLengths.length && this.cumLengths[i] < d) i++;
    const a = this.waypoints[i - 1];
    const b = this.waypoints[i];
    const segLen = this.cumLengths[i] - this.cumLengths[i - 1];
    const t = segLen > 0 ? (d - this.cumLengths[i - 1]) / segLen : 0;
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      angle: angleTo(a, b),
      segIndex: i - 1
    };
  }
}
