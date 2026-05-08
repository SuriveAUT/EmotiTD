import { Container, Graphics } from 'pixi.js';
import type { QualitySetting } from '../core/SaveManager';
import { getRenderCaps, type RenderCaps } from '../core/renderQuality';
import type { VisualBudget, VisualEffectKind } from '../core/VisualBudget';
import { rand, TAU } from './math';

type Shape = 'circle' | 'square' | 'spark' | 'shard';

interface BurstOpts {
  count: number;
  color: number;
  speedMin: number;
  speedMax: number;
  sizeMin: number;
  sizeMax: number;
  lifeMin: number;
  lifeMax: number;
  gravity?: number;
  drag?: number;
  shape?: Shape;
  spread?: number;     // angle range (radians) — defaults to TAU
  baseAngle?: number;  // center angle if spread < TAU
  fadeIn?: number;     // 0..1 portion of life spent fading in
  spin?: number;       // rotational velocity
  visualKind?: VisualEffectKind;
  important?: boolean;
}

interface RingOpts {
  color: number;
  startRadius: number;
  endRadius: number;
  duration: number;
  thickness: number;
  alpha?: number;
  visualKind?: VisualEffectKind;
  important?: boolean;
}

class Particle {
  active = false;
  x = 0; y = 0;
  vx = 0; vy = 0;
  rot = 0; spin = 0;
  size = 1;
  life = 0; maxLife = 1;
  drag = 0;
  gravity = 0;
  fadeIn = 0;
  alphaPeak = 1;
  shape: Shape = 'circle';
  color = 0xffffff;
  readonly g = new Graphics();

  reset(opts: { x: number; y: number; angle: number; speed: number } & BurstOpts) {
    this.active = true;
    this.x = opts.x; this.y = opts.y;
    this.vx = Math.cos(opts.angle) * opts.speed;
    this.vy = Math.sin(opts.angle) * opts.speed;
    this.size = rand(opts.sizeMin, opts.sizeMax);
    this.maxLife = rand(opts.lifeMin, opts.lifeMax);
    this.life = this.maxLife;
    this.drag = opts.drag ?? 0;
    this.gravity = opts.gravity ?? 0;
    this.fadeIn = opts.fadeIn ?? 0;
    this.spin = opts.spin ?? 0;
    this.rot = rand(0, TAU);
    this.shape = opts.shape ?? 'circle';
    this.color = opts.color;
    this.alphaPeak = 1;

    const g = this.g;
    g.clear();
    switch (this.shape) {
      case 'circle':
        g.circle(0, 0, this.size).fill({ color: this.color, alpha: 1 });
        break;
      case 'square':
        g.rect(-this.size, -this.size, this.size * 2, this.size * 2).fill({ color: this.color, alpha: 1 });
        break;
      case 'spark':
        g.moveTo(-this.size * 2, 0).lineTo(this.size * 2, 0)
          .stroke({ color: this.color, width: Math.max(1, this.size * 0.6), alpha: 1 });
        break;
      case 'shard':
        g.poly([
          -this.size, -this.size * 0.4,
          this.size * 0.6, -this.size,
          this.size, this.size * 0.5,
          -this.size * 0.4, this.size
        ]).fill({ color: this.color, alpha: 1 });
        break;
    }
    g.x = this.x; g.y = this.y;
    g.rotation = this.rot;
    g.alpha = this.fadeIn > 0 ? 0 : 1;
    g.visible = true;
  }

  step(dt: number): boolean {
    this.vy += this.gravity * dt;
    if (this.drag > 0) {
      const f = Math.exp(-this.drag * dt);
      this.vx *= f; this.vy *= f;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.spin * dt;
    this.life -= dt;

    const t = 1 - this.life / this.maxLife; // 0..1
    let a = 1;
    if (this.fadeIn > 0 && t < this.fadeIn) a = t / this.fadeIn;
    else a = Math.max(0, this.life / this.maxLife);
    a = Math.min(1, a) * this.alphaPeak;

    this.g.x = this.x;
    this.g.y = this.y;
    this.g.rotation = this.rot;
    this.g.alpha = a;

    return this.life > 0;
  }
}

class Ring {
  active = false;
  x = 0; y = 0;
  age = 0; duration = 1;
  startR = 0; endR = 50;
  color = 0xffffff;
  thickness = 2;
  baseAlpha = 1;
  readonly g = new Graphics();

  reset(x: number, y: number, opts: RingOpts) {
    this.active = true;
    this.x = x; this.y = y;
    this.age = 0;
    this.duration = opts.duration;
    this.startR = opts.startRadius;
    this.endR = opts.endRadius;
    this.color = opts.color;
    this.thickness = opts.thickness;
    this.baseAlpha = opts.alpha ?? 1;
    this.g.x = x; this.g.y = y;
    this.g.visible = true;
    this.draw(this.startR, this.baseAlpha);
  }

  private draw(r: number, alpha: number) {
    this.g.clear();
    this.g.circle(0, 0, r).stroke({ color: this.color, width: this.thickness, alpha });
  }

  step(dt: number): boolean {
    this.age += dt;
    const t = this.age / this.duration;
    if (t >= 1) return false;
    const r = this.startR + (this.endR - this.startR) * t;
    const a = (1 - t) * this.baseAlpha;
    this.draw(r, a);
    return true;
  }
}

export class ParticleSystem {
  readonly container: Container;
  private active: Particle[] = [];
  private pool: Particle[] = [];
  private rings: Ring[] = [];
  private ringPool: Ring[] = [];
  private quality: QualitySetting = 'medium';
  private caps: RenderCaps = getRenderCaps('medium');
  private suspended = false;
  private budget: VisualBudget | null = null;

  constructor() {
    this.container = new Container();
    this.container.label = 'particles';
    // Performance: most particles don't need to receive events.
    this.container.eventMode = 'none';
  }

  setQuality(quality: QualitySetting): void {
    this.quality = quality;
    this.caps = getRenderCaps(quality);
    this.trimToCaps();
  }

  setSuspended(suspended: boolean): void {
    this.suspended = suspended;
  }

  setVisualBudget(budget: VisualBudget): void {
    this.budget = budget;
  }

  counts(): { particles: number; rings: number } {
    return { particles: this.active.length, rings: this.rings.length };
  }

  clearVisuals(): void {
    for (const p of this.active) {
      p.g.visible = false;
      this.container.removeChild(p.g);
      this.pool.push(p);
    }
    for (const r of this.rings) {
      r.g.visible = false;
      r.g.clear();
      this.container.removeChild(r.g);
      this.ringPool.push(r);
    }
    this.active = [];
    this.rings = [];
  }

  burst(x: number, y: number, opts: BurstOpts) {
    if (this.suspended) return;
    if (this.active.length >= this.caps.maxParticles) {
      if (!opts.important) return;
      this.dropOldestParticle();
    }
    if (this.budget && !this.budget.shouldRender(opts.visualKind ?? 'hit', opts.important)) return;
    const qualityMul = this.quality === 'low' ? 0.45 : this.quality === 'high' ? 1.35 : 1;
    const available = Math.max(0, this.caps.maxParticles - this.active.length);
    const count = Math.min(available, Math.max(opts.count > 0 ? 1 : 0, Math.round(opts.count * qualityMul)));
    const spread = opts.spread ?? TAU;
    const base = opts.baseAngle ?? 0;
    for (let i = 0; i < count; i++) {
      const angle = base + rand(-spread / 2, spread / 2);
      const speed = rand(opts.speedMin, opts.speedMax);
      const p = this.pool.pop() ?? new Particle();
      p.reset({ x, y, angle, speed, ...opts });
      this.container.addChild(p.g);
      this.active.push(p);
    }
  }

  trail(x: number, y: number, color: number, size = 2) {
    if (this.budget && !this.budget.shouldRender('trail')) return;
    this.burst(x, y, {
      count: 1,
      color,
      speedMin: 0, speedMax: 6,
      sizeMin: size * 0.6, sizeMax: size,
      lifeMin: 0.18, lifeMax: 0.32,
      drag: 2,
      shape: 'circle',
      visualKind: 'trail'
    });
  }

  ring(x: number, y: number, opts: RingOpts) {
    if (this.suspended) return;
    if (this.rings.length >= this.caps.maxParticleRings) {
      if (!opts.important) return;
      this.dropOldestRing();
    }
    if (this.budget && !this.budget.shouldRender(opts.visualKind ?? 'impact', opts.important)) return;
    if (this.quality === 'low' && opts.duration < 0.35 && opts.endRadius < 70) return;
    const r = this.ringPool.pop() ?? new Ring();
    r.reset(x, y, opts);
    this.container.addChild(r.g);
    this.rings.push(r);
  }

  update(dt: number) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      if (!p.step(dt)) {
        p.g.visible = false;
        this.container.removeChild(p.g);
        this.active.splice(i, 1);
        this.pool.push(p);
      }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      if (!r.step(dt)) {
        r.g.visible = false;
        r.g.clear();
        this.container.removeChild(r.g);
        this.rings.splice(i, 1);
        this.ringPool.push(r);
      }
    }
  }

  private trimToCaps(): void {
    while (this.active.length > this.caps.maxParticles) {
      this.dropOldestParticle();
    }
    while (this.rings.length > this.caps.maxParticleRings) {
      this.dropOldestRing();
    }
  }

  private dropOldestParticle(): void {
    const p = this.active.shift();
    if (!p) return;
    p.g.visible = false;
    this.container.removeChild(p.g);
    this.pool.push(p);
  }

  private dropOldestRing(): void {
    const r = this.rings.shift();
    if (!r) return;
    r.g.visible = false;
    r.g.clear();
    this.container.removeChild(r.g);
    this.ringPool.push(r);
  }
}
