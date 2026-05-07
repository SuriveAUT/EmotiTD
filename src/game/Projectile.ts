import { Container, Graphics } from 'pixi.js';
import { EMOTION_COLOR, EMOTION_ACCENT, type BurnGroundSpec } from './config';
import type { DamagePacket } from './types';
import { EmotionType, EnemyKind } from './types';
import type { Enemy } from './Enemy';
import type { ParticleSystem } from './Particles';
import { dist, rand } from './math';

export interface ProjectileSpec {
  type: EmotionType;
  damage: number;
  speed: number;
  splashRadius?: number;
  chainCount?: number;
  chainRange?: number;
  slowAmount?: number;
  slowDuration?: number;
  fearChance?: number;
  stunDuration?: number;
  bossDamageMul?: number;
  numbDamageMul?: number;
  fastEnemyDamageMul?: number;
  splashSparkDamageMul?: number;
  splashSparkRadius?: number;
  splashSparkCount?: number;
  splashFearChance?: number;
  splashFearStunDuration?: number;
  burnGround?: BurnGroundSpec;
  poisonDps?: number;
  poisonDuration?: number;
  armorShred?: number;
  armorShredDuration?: number;
  guiltMark?: number;
  guiltExecuteThreshold?: number;
  coreShield?: number;
  trustAnchorDuration?: number;
  shameGroupRadius?: number;
  shameGroupDamageMul?: number;
  /** damage multiplier applied at hit (resonance / synergy) */
  damageMul?: number;
}

export class Projectile {
  readonly spec: ProjectileSpec;
  x: number; y: number;
  private target: Enemy | null;
  alive = true;
  private hitSet = new Set<Enemy>();
  private chainsLeft: number;
  private trailTimer = 0;
  private rot = 0;
  private readonly trailInterval: number;

  readonly container: Container;
  private body: Graphics;

  constructor(x: number, y: number, target: Enemy, spec: ProjectileSpec) {
    this.x = x; this.y = y;
    this.target = target;
    this.spec = spec;
    this.chainsLeft = (spec.chainCount ?? 1) - 1;
    this.trailInterval = this.spec.type === EmotionType.Joy || this.spec.type === EmotionType.Hope ? 0.05 : 0.07;

    this.container = new Container();
    this.container.eventMode = 'none';
    this.container.label = `proj:${spec.type}`;
    this.body = new Graphics();
    this.container.addChild(this.body);
    this.draw();
    this.container.x = x;
    this.container.y = y;
  }

  private draw() {
    const g = this.body;
    g.clear();
    const color = EMOTION_COLOR[this.spec.type];
    const accent = EMOTION_ACCENT[this.spec.type];

    switch (this.spec.type) {
      case EmotionType.Anger: {
        g.circle(0, 0, 9).fill({ color, alpha: 0.18 });
        g.circle(0, 0, 6).fill({ color, alpha: 0.7 });
        g.circle(0, 0, 3).fill({ color: accent, alpha: 1 });
        break;
      }
      case EmotionType.Sadness: {
        // tear shape
        g.poly([0, -8, 5, 4, 0, 9, -5, 4]).fill({ color, alpha: 0.85 });
        g.circle(0, 0, 3).fill({ color: 0xffffff, alpha: 0.9 });
        break;
      }
      case EmotionType.Joy: {
        // 4-pointed sparkle
        const r = 7;
        g.poly([0, -r, 2, -2, r, 0, 2, 2, 0, r, -2, 2, -r, 0, -2, -2])
          .fill({ color, alpha: 1 });
        g.circle(0, 0, 2).fill({ color: 0xffffff, alpha: 1 });
        break;
      }
      case EmotionType.Fear: {
        // glitch box
        g.rect(-5, -5, 10, 10).fill({ color, alpha: 0.7 });
        g.rect(-3, -7, 6, 2).fill({ color: accent, alpha: 1 });
        g.rect(-7, 3, 14, 2).fill({ color: accent, alpha: 0.8 });
        break;
      }
      case EmotionType.Calm: {
        g.circle(0, 0, 8).fill({ color, alpha: 0.18 });
        g.circle(0, 0, 5).fill({ color, alpha: 0.55 });
        g.circle(0, 0, 2).fill({ color: 0xffffff, alpha: 1 });
        break;
      }
      case EmotionType.Hope: {
        const r = 8;
        g.poly([0, -r, 2, -2, r, 0, 2, 2, 0, r, -2, 2, -r, 0, -2, -2])
          .fill({ color, alpha: 0.95 });
        g.circle(0, 0, 5).stroke({ color: accent, width: 1.5, alpha: 0.9 });
        g.circle(0, 0, 2).fill({ color: 0xffffff, alpha: 1 });
        break;
      }
      case EmotionType.Disgust: {
        g.circle(0, 0, 8).fill({ color, alpha: 0.28 });
        g.circle(-2, 0, 5).fill({ color, alpha: 0.75 });
        g.circle(3, -3, 2.2).fill({ color: accent, alpha: 0.95 });
        g.circle(4, 4, 1.7).fill({ color: accent, alpha: 0.8 });
        break;
      }
      case EmotionType.Guilt: {
        g.regularPoly(0, 0, 7, 8, 0).fill({ color, alpha: 0.85 });
        g.circle(0, 0, 4).stroke({ color: accent, width: 1.4, alpha: 0.95 });
        g.moveTo(-5, 0).lineTo(5, 0).stroke({ color: accent, width: 1.2, alpha: 0.75 });
        break;
      }
      case EmotionType.Trust: {
        g.circle(0, 0, 8).stroke({ color, width: 2, alpha: 0.95 });
        g.circle(0, 0, 4).fill({ color, alpha: 0.45 });
        g.poly([-4, 0, -1, 4, 5, -4]).stroke({ color: accent, width: 1.5, alpha: 0.95 });
        break;
      }
      case EmotionType.Shame: {
        g.regularPoly(0, 0, 8, 3, -Math.PI / 2).fill({ color, alpha: 0.82 });
        g.rect(-7, -1, 14, 2).fill({ color: accent, alpha: 0.8 });
        break;
      }
      case EmotionType.Love: {
        g.circle(-3, -2, 5).fill({ color, alpha: 0.75 });
        g.circle(3, -2, 5).fill({ color, alpha: 0.75 });
        g.poly([-8, 0, 0, 8, 8, 0]).fill({ color, alpha: 0.85 });
        g.circle(0, 0, 2).fill({ color: accent, alpha: 1 });
        break;
      }
      case EmotionType.Pride: {
        g.poly([0, -9, 3, -2, 9, 0, 3, 2, 0, 9, -3, 2, -9, 0, -3, -2])
          .fill({ color, alpha: 0.95 });
        g.circle(0, 0, 2.4).fill({ color: accent, alpha: 1 });
        break;
      }
    }
  }

  update(
    dt: number,
    enemies: Enemy[],
    particles: ParticleSystem,
    onHit: (e: Enemy, packet: DamagePacket, p: Projectile) => void,
    onGroundEffect?: (x: number, y: number, spec: BurnGroundSpec, source: EmotionType) => void
  ) {
    if (!this.alive) return;

    // Retarget if dead
    if (!this.target || !this.target.alive) {
      const next = this.findNextTarget(enemies);
      if (next) this.target = next;
      else { this.alive = false; return; }
    }

    const tx = this.target.x;
    const ty = this.target.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.spec.speed * dt;

    if (d <= step + this.target.radius) {
      this.x = tx; this.y = ty;
      this.applyHit(enemies, particles, onHit, onGroundEffect);
      return;
    }
    const k = step / d;
    this.x += dx * k;
    this.y += dy * k;
    this.container.x = this.x;
    this.container.y = this.y;

    // rotation / trail
    this.rot += dt * 8;
    this.body.rotation = this.spec.type === EmotionType.Joy ? this.rot : Math.atan2(dy, dx);

    this.trailTimer += dt;
    if (this.trailTimer > this.trailInterval) {
      this.trailTimer = 0;
      particles.trail(this.x, this.y, EMOTION_COLOR[this.spec.type], this.spec.type === EmotionType.Anger ? 1.35 : 1.15);
    }
  }

  private applyHit(
    enemies: Enemy[],
    particles: ParticleSystem,
    onHit: (e: Enemy, packet: DamagePacket, p: Projectile) => void,
    onGroundEffect?: (x: number, y: number, spec: BurnGroundSpec, source: EmotionType) => void
  ) {
    const t = this.target!;
    const packet = this.makePacket(t);
    onHit(t, packet, this);
    this.hitSet.add(t);

    // visual hit
    const c = EMOTION_COLOR[this.spec.type];
    const impact = this.impactProfile();
    particles.burst(this.x, this.y, {
      count: impact.count, color: c,
      speedMin: impact.speedMin, speedMax: impact.speedMax,
      sizeMin: impact.sizeMin, sizeMax: impact.sizeMax,
      lifeMin: 0.14, lifeMax: impact.lifeMax,
      drag: 4,
      shape: impact.shape
    });
    if (impact.ringRadius > 0) {
      particles.ring(this.x, this.y, {
        color: c,
        startRadius: 3,
        endRadius: impact.ringRadius,
        duration: 0.22,
        thickness: impact.ringThickness,
        alpha: impact.ringAlpha
      });
    }
    if (this.spec.type === EmotionType.Hope && t.kind === EnemyKind.NumbOne) {
      particles.ring(this.x, this.y, {
        color: 0xf7f3a6, startRadius: 3, endRadius: 34,
        duration: 0.24, thickness: 2, alpha: 0.9
      });
      particles.burst(this.x, this.y, {
        count: 6, color: 0xffffff,
        speedMin: 55, speedMax: 150,
        sizeMin: 0.9, sizeMax: 1.9,
        lifeMin: 0.14, lifeMax: 0.28,
        drag: 4, shape: 'spark'
      });
    }

    if (this.spec.burnGround) {
      onGroundEffect?.(this.x, this.y, this.spec.burnGround, this.spec.type);
    }

    // splash
    if (this.spec.splashRadius) {
      const r = this.spec.splashRadius;
      particles.ring(this.x, this.y, {
        color: c, startRadius: 4, endRadius: r,
        duration: 0.32, thickness: 2.5
      });
      particles.burst(this.x, this.y, {
        count: 8, color: c,
        speedMin: 65, speedMax: 200,
        sizeMin: 1.2, sizeMax: 2.5,
        lifeMin: 0.2, lifeMax: 0.4,
        drag: 3, shape: 'spark'
      });
      for (const e of enemies) {
        if (!e.alive || e === t) continue;
        if (dist({ x: this.x, y: this.y }, { x: e.x, y: e.y }) <= r) {
          onHit(e, this.makeSplashPacket(e), this);
        }
      }
      this.applySplashSparks(enemies, particles, onHit);
    }

    // chain
    if (this.chainsLeft > 0) {
      const range = this.spec.chainRange ?? 100;
      const next = this.findNextTarget(enemies, range);
      if (next) {
        // visual link
        this.drawChainLink(particles, this.x, this.y, next.x, next.y, c);
        this.target = next;
        this.chainsLeft--;
        return;
      }
    }

    this.alive = false;
  }

  private makePacket(target: Enemy, amountMul = 1): DamagePacket {
    let amount = this.spec.damage * (this.spec.damageMul ?? 1) * amountMul;
    if (this.spec.bossDamageMul !== undefined && (target.kind === EnemyKind.Spiral || target.kind === EnemyKind.Mask || target.kind === EnemyKind.BurnoutBoss)) {
      amount *= this.spec.bossDamageMul;
    }
    if (this.spec.numbDamageMul !== undefined && target.kind === EnemyKind.NumbOne) {
      amount *= this.spec.numbDamageMul;
    }
    if (this.spec.fastEnemyDamageMul !== undefined && target.baseSpeed >= 120) {
      amount *= this.spec.fastEnemyDamageMul;
    }
    return {
      amount,
      source: this.spec.type,
      ...(this.spec.slowAmount !== undefined ? { slow: this.spec.slowAmount, slowDuration: this.spec.slowDuration } : {}),
      ...(this.spec.fearChance !== undefined ? { fearChance: this.spec.fearChance, stunDuration: this.spec.stunDuration } : {}),
      ...(this.spec.poisonDps !== undefined ? { poisonDps: this.spec.poisonDps, poisonDuration: this.spec.poisonDuration } : {}),
      ...(this.spec.armorShred !== undefined ? { armorShred: this.spec.armorShred, armorShredDuration: this.spec.armorShredDuration } : {}),
      ...(this.spec.guiltMark !== undefined ? { guiltMark: this.spec.guiltMark, guiltExecuteThreshold: this.spec.guiltExecuteThreshold } : {}),
      ...(this.spec.coreShield !== undefined ? { coreShield: this.spec.coreShield, trustAnchorDuration: this.spec.trustAnchorDuration } : {}),
      ...(this.spec.shameGroupRadius !== undefined ? { shameGroupRadius: this.spec.shameGroupRadius, shameGroupDamageMul: this.spec.shameGroupDamageMul } : {})
    };
  }

  private impactProfile(): {
    count: number;
    speedMin: number;
    speedMax: number;
    sizeMin: number;
    sizeMax: number;
    lifeMax: number;
    shape: 'circle' | 'square' | 'spark' | 'shard';
    ringRadius: number;
    ringThickness: number;
    ringAlpha: number;
  } {
    switch (this.spec.type) {
      case EmotionType.Anger:
        return { count: 10, speedMin: 70, speedMax: 230, sizeMin: 1.2, sizeMax: 2.8, lifeMax: 0.38, shape: 'spark', ringRadius: 34, ringThickness: 2.8, ringAlpha: 0.85 };
      case EmotionType.Sadness:
        return { count: 7, speedMin: 35, speedMax: 130, sizeMin: 1, sizeMax: 2.4, lifeMax: 0.36, shape: 'shard', ringRadius: 28, ringThickness: 1.8, ringAlpha: 0.65 };
      case EmotionType.Joy:
        return { count: 8, speedMin: 80, speedMax: 220, sizeMin: 0.9, sizeMax: 2.3, lifeMax: 0.28, shape: 'spark', ringRadius: 20, ringThickness: 1.8, ringAlpha: 0.6 };
      case EmotionType.Fear:
        return { count: 6, speedMin: 45, speedMax: 160, sizeMin: 1.2, sizeMax: 2.6, lifeMax: 0.3, shape: 'square', ringRadius: 24, ringThickness: 2, ringAlpha: 0.7 };
      case EmotionType.Disgust:
        return { count: 7, speedMin: 25, speedMax: 120, sizeMin: 1.3, sizeMax: 3, lifeMax: 0.44, shape: 'circle', ringRadius: 22, ringThickness: 1.7, ringAlpha: 0.55 };
      case EmotionType.Pride:
        return { count: 9, speedMin: 90, speedMax: 260, sizeMin: 1, sizeMax: 2.2, lifeMax: 0.26, shape: 'shard', ringRadius: 18, ringThickness: 2.5, ringAlpha: 0.7 };
      default:
        return { count: 5, speedMin: 45, speedMax: 150, sizeMin: 1, sizeMax: 2.1, lifeMax: 0.34, shape: 'circle', ringRadius: 14, ringThickness: 1.5, ringAlpha: 0.45 };
    }
  }

  private makeSplashPacket(target: Enemy): DamagePacket {
    const packet = this.makePacket(target, 0.65);
    if (this.spec.splashFearChance !== undefined) {
      packet.fearChance = Math.min(0.95, (packet.fearChance ?? 0) + this.spec.splashFearChance);
      packet.stunDuration = Math.max(packet.stunDuration ?? 0, this.spec.splashFearStunDuration ?? 0.2);
    }
    return packet;
  }

  private applySplashSparks(
    enemies: Enemy[],
    particles: ParticleSystem,
    onHit: (e: Enemy, packet: DamagePacket, p: Projectile) => void
  ): void {
    if (this.spec.splashSparkDamageMul === undefined) return;
    const radius = this.spec.splashSparkRadius ?? 80;
    const count = this.spec.splashSparkCount ?? 1;
    const targets = enemies
      .filter((enemy) => enemy.alive && dist({ x: this.x, y: this.y }, { x: enemy.x, y: enemy.y }) <= radius)
      .sort((a, b) => dist({ x: this.x, y: this.y }, { x: a.x, y: a.y }) - dist({ x: this.x, y: this.y }, { x: b.x, y: b.y }))
      .slice(0, count);

    for (const enemy of targets) {
      particles.burst(enemy.x, enemy.y, {
        count: 3,
        color: EMOTION_COLOR[EmotionType.Joy],
        speedMin: 30,
        speedMax: 120,
        sizeMin: 1,
        sizeMax: 2.2,
        lifeMin: 0.12,
        lifeMax: 0.24,
        drag: 4,
        shape: 'spark'
      });
      onHit(enemy, this.makePacket(enemy, this.spec.splashSparkDamageMul), this);
    }
  }

  private drawChainLink(particles: ParticleSystem, x1: number, y1: number, x2: number, y2: number, color: number) {
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t + rand(-3, 3);
      const py = y1 + (y2 - y1) * t + rand(-3, 3);
      particles.burst(px, py, {
        count: 1, color,
        speedMin: 0, speedMax: 8,
        sizeMin: 1.2, sizeMax: 2.4,
        lifeMin: 0.18, lifeMax: 0.32,
        drag: 4, shape: 'circle'
      });
    }
  }

  private findNextTarget(enemies: Enemy[], maxRange = Infinity): Enemy | null {
    let best: Enemy | null = null;
    let bestD = maxRange;
    for (const e of enemies) {
      if (!e.alive || this.hitSet.has(e)) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
