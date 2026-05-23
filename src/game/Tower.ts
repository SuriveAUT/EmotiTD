import { Container, Graphics } from 'pixi.js';
import {
  BASE_TOWER_SPECIALS,
  EMOTION_ACCENT,
  EMOTION_COLOR,
  TOWER_STATS,
  TOWER_UPGRADES,
  type SynergyModifiers,
  type TowerSpecialStats,
  type TowerStats,
  type TowerUpgradeBonus
} from './config';
import { EmotionType, type UpgradePath } from './types';
import { EnemyKind, type TargetingMode } from './types';
import type { Enemy } from './Enemy';
import type { ParticleSystem } from './Particles';
import { Projectile, type ProjectileSpec } from './Projectile';
import { TAU, distSq } from './math';

export interface TowerStatBreakdown {
  damage: {
    base: number;
    upgraded: number;
    final: number;
    upgradePercent: number;
    multiplier: number;
    lines: string[];
  };
}

export class Tower {
  readonly type: EmotionType;
  readonly cx: number; readonly cy: number;
  readonly x: number;  readonly y: number;
  readonly cost: number;

  private cooldown = 0;
  private fireRate: number;
  private fireRateMod = 1;     // calm buff applied each frame
  private damageMul = 1;       // resonance bonus
  private damageBreakdownLines: string[] = [];
  private synergyModifiers: SynergyModifiers = {};
  private supportSuppressedTimer = 0;
  private upgradePath: UpgradePath | null = null;
  private upgradeLevel = 0;
  private upgradeSpent = 0;
  private targetingMode: TargetingMode = 'first';
  private rotation = 0;
  private targetAngle = 0;
  selected = false;
  hovered = false;

  readonly container: Container;
  private base: Graphics;
  private head: Container;
  private headG: Graphics;
  private rangeG: Graphics;
  private auraTime = 0;
  private aura: Graphics;
  private upgradeFlashTimer = 0;
  private recoilTimer = 0;
  private simplifiedVisuals = false;

  constructor(type: EmotionType, cx: number, cy: number, worldX: number, worldY: number) {
    this.type = type;
    this.cx = cx; this.cy = cy;
    this.x = worldX; this.y = worldY;
    const stats = TOWER_STATS[type];
    this.cost = stats.cost;
    this.fireRate = stats.fireRate;

    this.container = new Container();
    this.container.label = `tower:${type}`;
    this.container.x = worldX; this.container.y = worldY;
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.hitArea = { contains: (x: number, y: number) => (x * x + y * y) <= 22 * 22 } as any;

    this.aura = new Graphics();
    this.base = new Graphics();
    this.head = new Container();
    this.headG = new Graphics();
    this.rangeG = new Graphics();
    this.head.addChild(this.headG);
    this.container.addChild(this.aura, this.rangeG, this.base, this.head);

    this.drawBase();
    this.drawHead();
    this.drawRange(false);
  }

  /* ----------------------- draw ----------------------- */

  private drawBase() {
    const g = this.base;
    const color = EMOTION_COLOR[this.type];
    const accent = EMOTION_ACCENT[this.type];
    g.clear();

    // grounded plate, with per-emotion footprint differences for faster scanning
    switch (this.type) {
      case EmotionType.Anger:
        g.regularPoly(0, 0, 20, 6, Math.PI / 6).fill({ color: 0x16080a, alpha: 0.96 });
        g.regularPoly(0, 0, 20, 6, Math.PI / 6).stroke({ color, width: 2.4, alpha: 0.78 });
        g.moveTo(-17, 10).lineTo(0, -22).lineTo(17, 10).stroke({ color: accent, width: 1.2, alpha: 0.45 });
        break;
      case EmotionType.Sadness:
        g.ellipse(0, 0, 15, 22).fill({ color: 0x071426, alpha: 0.96 });
        g.ellipse(0, 0, 15, 22).stroke({ color, width: 2.2, alpha: 0.78 });
        g.moveTo(0, -16).lineTo(0, 16).stroke({ color: accent, width: 1, alpha: 0.5 });
        break;
      case EmotionType.Joy:
        g.regularPoly(0, 0, 19, 8, Math.PI / 8).fill({ color: 0x1c1604, alpha: 0.96 });
        g.regularPoly(0, 0, 19, 8, Math.PI / 8).stroke({ color, width: 2.2, alpha: 0.82 });
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          g.moveTo(Math.cos(a) * 8, Math.sin(a) * 8).lineTo(Math.cos(a) * 23, Math.sin(a) * 23)
            .stroke({ color: accent, width: 1, alpha: 0.4 });
        }
        break;
      case EmotionType.Fear:
        g.rect(-18, -18, 36, 36).fill({ color: 0x0f061b, alpha: 0.96 });
        g.rect(-18, -18, 36, 36).stroke({ color, width: 2, alpha: 0.75 });
        g.rect(-22, -8, 8, 3).fill({ color: accent, alpha: 0.55 });
        g.rect(12, 8, 12, 3).fill({ color: accent, alpha: 0.45 });
        break;
      case EmotionType.Calm:
        g.circle(0, 0, 19).fill({ color: 0x061813, alpha: 0.96 });
        g.circle(0, 0, 19).stroke({ color, width: 2, alpha: 0.74 });
        g.circle(0, 0, 12).stroke({ color: accent, width: 1, alpha: 0.42 });
        break;
      case EmotionType.Hope:
        g.regularPoly(0, 0, 21, 5, -Math.PI / 2).fill({ color: 0x1e1b08, alpha: 0.96 });
        g.regularPoly(0, 0, 21, 5, -Math.PI / 2).stroke({ color, width: 2.2, alpha: 0.8 });
        g.circle(0, 0, 9).stroke({ color: accent, width: 1.2, alpha: 0.5 });
        break;
      case EmotionType.Disgust:
        g.regularPoly(0, 0, 20, 7, 0).fill({ color: 0x071407, alpha: 0.96 });
        g.regularPoly(0, 0, 20, 7, 0).stroke({ color, width: 2.2, alpha: 0.75 });
        g.circle(-8, 8, 4).fill({ color: accent, alpha: 0.38 });
        g.circle(9, -5, 3).fill({ color, alpha: 0.45 });
        break;
      case EmotionType.Guilt:
        g.regularPoly(0, 0, 20, 8, 0).fill({ color: 0x18120b, alpha: 0.96 });
        g.regularPoly(0, 0, 20, 8, 0).stroke({ color, width: 2.2, alpha: 0.78 });
        g.moveTo(-15, -15).lineTo(15, 15).stroke({ color: accent, width: 1, alpha: 0.38 });
        g.moveTo(15, -15).lineTo(-15, 15).stroke({ color: accent, width: 1, alpha: 0.28 });
        break;
      case EmotionType.Trust:
        g.poly([0, -23, 19, -10, 15, 15, 0, 23, -15, 15, -19, -10])
          .fill({ color: 0x06141a, alpha: 0.96 })
          .stroke({ color, width: 2.4, alpha: 0.78 });
        g.poly([-9, 1, -3, 9, 12, -10]).stroke({ color: accent, width: 1.4, alpha: 0.45 });
        break;
      case EmotionType.Shame:
        g.regularPoly(0, 0, 20, 3, -Math.PI / 2).fill({ color: 0x1a0714, alpha: 0.96 });
        g.regularPoly(0, 0, 20, 3, -Math.PI / 2).stroke({ color, width: 2.2, alpha: 0.8 });
        g.moveTo(-14, 6).lineTo(14, 6).stroke({ color: accent, width: 1.1, alpha: 0.45 });
        break;
      case EmotionType.Love:
        g.circle(-7, -2, 13).fill({ color: 0x1a0710, alpha: 0.96 });
        g.circle(7, -2, 13).fill({ color: 0x1a0710, alpha: 0.96 });
        g.poly([-19, 2, 0, 22, 19, 2]).fill({ color: 0x1a0710, alpha: 0.96 });
        g.circle(0, 1, 20).stroke({ color, width: 2.2, alpha: 0.78 });
        break;
      case EmotionType.Pride:
        g.regularPoly(0, 0, 21, 5, -Math.PI / 2).fill({ color: 0x1c1004, alpha: 0.96 });
        g.regularPoly(0, 0, 21, 5, -Math.PI / 2).stroke({ color, width: 2.4, alpha: 0.82 });
        g.moveTo(-14, 10).lineTo(0, -17).lineTo(14, 10).stroke({ color: accent, width: 1.5, alpha: 0.5 });
        break;
    }
    if (this.upgradeLevel > 0) {
      for (let i = 0; i < this.upgradeLevel; i++) {
        const a = -Math.PI / 2 + i * 0.68;
        g.circle(Math.cos(a) * 25, Math.sin(a) * 25, 4.4).fill({ color: accent, alpha: 0.98 });
        g.circle(Math.cos(a) * 25, Math.sin(a) * 25, 7.2).stroke({ color, width: 1.8, alpha: 0.85 });
      }
      g.circle(0, 0, 20 + this.upgradeLevel * 2).stroke({ color: accent, width: 1, alpha: 0.28 + this.upgradeLevel * 0.08 });
    }
  }

  private drawHead() {
    const g = this.headG;
    const color = EMOTION_COLOR[this.type];
    const accent = EMOTION_ACCENT[this.type];
    g.clear();
    switch (this.type) {
      case EmotionType.Anger:
        // hex barrel facing right
        g.poly([-10, -12, -2, -5, -6, 0, -2, 5, -10, 12, -1, 2, -1, -2]).fill({ color: accent, alpha: 0.35 });
        g.poly([4, -7, 16, -4, 18, 0, 16, 4, 4, 7]).fill({ color, alpha: 1 });
        g.poly([4, -7, 16, -4, 18, 0, 16, 4, 4, 7]).stroke({ color: accent, width: 1.5, alpha: 0.9 });
        g.circle(0, 0, 8).fill({ color: 0x110714, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.circle(0, 0, 3).fill({ color: accent, alpha: 1 });
        break;
      case EmotionType.Sadness:
        // long sleek barrel
        g.rect(2, -2, 24, 4).fill({ color, alpha: 1 });
        g.poly([22, -5, 29, 0, 22, 5]).fill({ color: accent, alpha: 0.9 });
        g.circle(0, 0, 9).fill({ color: 0x0a1424, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.poly([0, -5, 5, 0, 0, 5, -5, 0]).fill({ color: accent, alpha: 1 });
        break;
      case EmotionType.Joy:
        // star turret
        g.poly([0, -10, 3, -3, 10, 0, 3, 3, 0, 10, -3, 3, -10, 0, -3, -3])
          .fill({ color, alpha: 1 })
          .stroke({ color: accent, width: 1, alpha: 0.9 });
        g.circle(0, 0, 4).fill({ color: 0xffffff, alpha: 1 });
        // direction marker (longer arm)
        g.moveTo(0, 0).lineTo(14, 0).stroke({ color, width: 2, alpha: 0.9 });
        break;
      case EmotionType.Fear:
        // glitchy rect
        g.rect(-7, -7, 14, 14).fill({ color: 0x110720, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.rect(-4, -4, 8, 8).fill({ color, alpha: 0.9 });
        g.rect(2, -1, 14, 2).fill({ color: accent, alpha: 1 });
        g.rect(-15, -10, 9, 2).fill({ color, alpha: 0.7 });
        g.rect(-13, 8, 7, 2).fill({ color: accent, alpha: 0.75 });
        break;
      case EmotionType.Calm:
        // floating ring
        g.circle(0, 0, 11).stroke({ color, width: 2, alpha: 0.95 });
        g.circle(0, 0, 7).stroke({ color, width: 1, alpha: 0.7 });
        g.circle(0, 0, 3).fill({ color: accent, alpha: 1 });
        break;
      case EmotionType.Hope:
        // star-lens turret
        g.poly([0, -12, 3, -3, 12, 0, 3, 3, 0, 12, -3, 3, -12, 0, -3, -3])
          .fill({ color, alpha: 0.95 })
          .stroke({ color: accent, width: 1.5, alpha: 0.9 });
        g.circle(0, 0, 5).fill({ color: 0xffffff, alpha: 1 });
        g.moveTo(0, 0).lineTo(17, 0).stroke({ color: accent, width: 2, alpha: 0.85 });
        break;
      case EmotionType.Disgust:
        g.circle(0, 0, 11).fill({ color: 0x0b1608, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.circle(6, -4, 4).fill({ color, alpha: 0.9 });
        g.circle(2, 5, 3).fill({ color: accent, alpha: 0.85 });
        g.moveTo(4, 0).lineTo(18, -4).stroke({ color, width: 3, alpha: 0.9 });
        g.moveTo(4, 0).lineTo(18, 4).stroke({ color: accent, width: 2, alpha: 0.75 });
        break;
      case EmotionType.Guilt:
        g.regularPoly(0, 0, 11, 8, 0).fill({ color: 0x18130d, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.circle(0, 0, 5).stroke({ color: accent, width: 1.5, alpha: 0.95 });
        g.moveTo(0, 0).lineTo(16, 0).stroke({ color: accent, width: 2, alpha: 0.85 });
        break;
      case EmotionType.Trust:
        g.circle(0, 0, 12).stroke({ color, width: 2.5, alpha: 1 });
        g.circle(0, 0, 8).fill({ color, alpha: 0.22 });
        g.poly([0, -12, 11, -4, 7, 10, 0, 14, -7, 10, -11, -4]).stroke({ color, width: 1.4, alpha: 0.65 });
        g.poly([-6, 1, -2, 6, 8, -5]).stroke({ color: accent, width: 2.2, alpha: 0.95 });
        g.moveTo(7, 0).lineTo(16, 0).stroke({ color, width: 2, alpha: 0.8 });
        break;
      case EmotionType.Shame:
        g.regularPoly(0, 0, 11, 3, -Math.PI / 2).fill({ color, alpha: 0.9 }).stroke({ color: accent, width: 1.4, alpha: 0.85 });
        g.rect(-11, -2, 22, 4).fill({ color: accent, alpha: 0.55 });
        g.moveTo(4, 0).lineTo(17, 0).stroke({ color, width: 2.2, alpha: 0.9 });
        break;
      case EmotionType.Love:
        g.circle(-4, -2, 7).fill({ color, alpha: 0.9 });
        g.circle(4, -2, 7).fill({ color, alpha: 0.9 });
        g.poly([-11, 1, 0, 12, 11, 1]).fill({ color, alpha: 0.9 }).stroke({ color: accent, width: 1, alpha: 0.8 });
        g.moveTo(8, 0).lineTo(16, 0).stroke({ color: accent, width: 2, alpha: 0.8 });
        break;
      case EmotionType.Pride:
        g.poly([0, -13, 5, -3, 15, -2, 7, 4, 9, 14, 0, 8, -9, 14, -7, 4, -15, -2, -5, -3])
          .fill({ color, alpha: 0.96 })
          .stroke({ color: accent, width: 1.2, alpha: 0.85 });
        g.moveTo(0, 0).lineTo(19, 0).stroke({ color: accent, width: 2.4, alpha: 0.9 });
        break;
    }
  }

  drawRange(show: boolean) {
    const g = this.rangeG;
    g.clear();
    if (!show) return;
    const stats = this.getEffectiveStats();
    const r = stats.range;
    g.circle(0, 0, r).fill({ color: EMOTION_COLOR[this.type], alpha: 0.06 });
    g.circle(0, 0, r).stroke({ color: EMOTION_COLOR[this.type], width: 1.4, alpha: 0.55 });
    if (this.type === EmotionType.Calm && stats.buffRadius) {
      g.circle(0, 0, stats.buffRadius).stroke({ color: EMOTION_ACCENT[this.type], width: 1, alpha: 0.4 });
    } else if (this.type === EmotionType.Love && stats.loveLinkRadius) {
      g.circle(0, 0, stats.loveLinkRadius).stroke({ color: EMOTION_ACCENT[this.type], width: 1, alpha: 0.34 });
    }
  }

  /* ----------------------- behavior ----------------------- */

  setDamageMul(mul: number, lines: string[] = []) {
    this.damageMul = mul;
    this.damageBreakdownLines = lines;
  }
  setSimplifiedVisuals(enabled: boolean) {
    this.simplifiedVisuals = enabled;
  }
  setSynergyModifiers(modifiers: SynergyModifiers) { this.synergyModifiers = modifiers; }
  suppressSupport(duration: number) {
    this.supportSuppressedTimer = Math.max(this.supportSuppressedTimer, duration);
  }
  isSupportSuppressed() { return this.supportSuppressedTimer > 0; }

  getUpgradeState() {
    return { path: this.upgradePath, level: this.upgradeLevel, spent: this.upgradeSpent };
  }

  getTargetingMode(): TargetingMode {
    return this.targetingMode;
  }

  setTargetingMode(mode: TargetingMode): void {
    this.targetingMode = mode;
  }

  sellValue(): number {
    return Math.floor(this.cost * 0.7 + this.upgradeSpent * 0.5);
  }

  nextUpgradeCost(path: UpgradePath): number | null {
    if (this.upgradePath && this.upgradePath !== path) return null;
    const def = TOWER_UPGRADES[this.type][path];
    return def.levels[this.upgradeLevel]?.cost ?? null;
  }

  canUpgrade(path: UpgradePath, memory = Infinity): boolean {
    const cost = this.nextUpgradeCost(path);
    return cost !== null && memory >= cost;
  }

  upgrade(path: UpgradePath): boolean {
    const cost = this.nextUpgradeCost(path);
    if (cost === null) return false;
    if (!this.upgradePath) this.upgradePath = path;
    this.upgradeLevel++;
    this.upgradeSpent += cost;
    this.fireRate = this.getEffectiveStats().fireRate;
    this.upgradeFlashTimer = 0.7;
    this.drawBase();
    this.drawHead();
    this.drawRange(this.selected);
    return true;
  }

  getEffectiveStats(): TowerStats {
    return this.computeStats().stats;
  }

  getSpecialStats(): TowerSpecialStats {
    return this.computeStats().specials;
  }

  getStatBreakdown(): TowerStatBreakdown {
    const base = TOWER_STATS[this.type].damage;
    const upgraded = this.getEffectiveStats().damage;
    return {
      damage: {
        base,
        upgraded,
        final: upgraded * this.damageMul,
        upgradePercent: base > 0 ? (upgraded / base - 1) * 100 : 0,
        multiplier: this.damageMul,
        lines: [...this.damageBreakdownLines]
      }
    };
  }

  applyTowerAuras(towers: Tower[], globalFireRateMul = 1, supportEffectMul = 1) {
    let mult = globalFireRateMul;
    for (const t of towers) {
      if (t === this) continue;
      if (t.type !== EmotionType.Calm) continue;
      if (t.isSupportSuppressed()) continue;
      const stats = t.getEffectiveStats();
      const r = stats.buffRadius ?? 0;
      if (distSq({ x: t.x, y: t.y }, { x: this.x, y: this.y }) <= r * r) {
        mult *= this.scaleSupportFireRate(stats.buffFireRate ?? 1, supportEffectMul, 0.65);
      }
    }
    for (const t of towers) {
      if (t === this || t.type !== EmotionType.Love || t.isSupportSuppressed()) continue;
      const stats = t.getEffectiveStats();
      const r = stats.loveLinkRadius ?? 0;
      if (r <= 0 || !stats.synergies.includes(this.type)) continue;
      if (distSq({ x: t.x, y: t.y }, { x: this.x, y: this.y }) <= r * r) {
        mult *= this.scaleSupportFireRate(stats.loveFireRateMul ?? 1, supportEffectMul, 0.70);
      }
    }
    this.fireRateMod = mult;
  }

  private supportFireRateMul(rawMul: number, ccScale: number): number {
    if (this.type !== EmotionType.Fear && this.type !== EmotionType.Sadness) return rawMul;
    return 1 - ((1 - rawMul) * ccScale);
  }

  private scaleSupportFireRate(rawMul: number, supportEffectMul: number, ccScale: number): number {
    const scaled = 1 - ((1 - rawMul) * supportEffectMul);
    return this.supportFireRateMul(scaled, ccScale);
  }

  loveDamageMulFrom(towers: Tower[]): number {
    let mult = 1;
    for (const t of towers) {
      if (t === this || t.type !== EmotionType.Love || t.isSupportSuppressed()) continue;
      const stats = t.getEffectiveStats();
      const r = stats.loveLinkRadius ?? 0;
      if (r <= 0 || !stats.synergies.includes(this.type)) continue;
      if (distSq({ x: t.x, y: t.y }, { x: this.x, y: this.y }) <= r * r) {
        mult *= stats.loveDamageMul ?? 1;
      }
    }
    return mult;
  }

  prideIsolationMulFrom(towers: Tower[]): number {
    if (this.type !== EmotionType.Pride) return 1;
    const stats = this.getEffectiveStats();
    const r = stats.prideIsolationRadius ?? 0;
    if (r <= 0) return 1;
    const isolated = towers.every(t => t === this || distSq({ x: t.x, y: t.y }, { x: this.x, y: this.y }) > r * r);
    return isolated ? stats.prideIsolationDamageMul ?? 1 : 1;
  }

  update(dt: number, enemies: Enemy[], particles: ParticleSystem, fire: (p: Projectile) => void) {
    this.cooldown -= dt;
    this.auraTime += dt;
    if (this.supportSuppressedTimer > 0) {
      this.supportSuppressedTimer = Math.max(0, this.supportSuppressedTimer - dt);
    }
    this.aura.clear();
    if (!this.simplifiedVisuals || this.selected || this.hovered || this.upgradeFlashTimer > 0) {
      this.drawIdleSignature();
    }
    if (this.supportSuppressedTimer > 0) {
      this.aura.rect(-15, -15, 30, 30).stroke({ color: 0x77ffaa, width: 1.5, alpha: 0.65 });
      this.aura.rect(-9, -9, 18, 18).stroke({ color: 0x05070d, width: 2, alpha: 0.8 });
    } else if (this.type === EmotionType.Calm && (!this.simplifiedVisuals || this.selected || this.hovered)) {
      const a = 0.18 + 0.12 * Math.sin(this.auraTime * 2.4);
      this.aura.circle(0, 0, 22 + Math.sin(this.auraTime * 2.4) * 2).fill({ color: EMOTION_COLOR[this.type], alpha: a * 0.4 });
      this.aura.circle(0, 0, 13).fill({ color: EMOTION_COLOR[this.type], alpha: a });
    } else if (this.hovered || this.selected) {
      this.aura.circle(0, 0, 22).fill({ color: EMOTION_COLOR[this.type], alpha: 0.18 });
    }
    if (this.upgradeFlashTimer > 0) {
      this.upgradeFlashTimer = Math.max(0, this.upgradeFlashTimer - dt);
      const t = 1 - this.upgradeFlashTimer / 0.7;
      const r = 20 + t * 34;
      this.aura.circle(0, 0, r).stroke({ color: EMOTION_ACCENT[this.type], width: 3 * (1 - t), alpha: 0.9 * (1 - t) });
      this.head.scale.set(1 + Math.sin(t * Math.PI) * 0.18);
      if (this.upgradeFlashTimer <= 0) this.head.scale.set(1);
    }
    if (this.recoilTimer > 0) {
      this.recoilTimer = Math.max(0, this.recoilTimer - dt);
      const recoil = Math.sin((this.recoilTimer / 0.14) * Math.PI);
      this.head.scale.set(1 + recoil * 0.1);
      this.head.x = -Math.cos(this.rotation) * recoil * 3;
      this.head.y += -Math.sin(this.rotation) * recoil * 3;
      if (this.recoilTimer <= 0) {
        this.head.scale.set(1);
        this.head.x = 0;
      }
    }

    // smooth rotation toward target angle
    const da = this.angleDelta(this.rotation, this.targetAngle);
    this.rotation += Math.sign(da) * Math.min(Math.abs(da), 12 * dt);
    this.head.rotation = this.rotation;
    this.head.y = Math.sin(this.auraTime * 2.2 + this.cx * 0.17 + this.cy * 0.11) * 0.8;

    const target = this.pickTarget(enemies);
    if (!target) return;
    this.targetAngle = Math.atan2(target.y - this.y, target.x - this.x);

    const effRate = this.fireRate * this.fireRateMod;
    if (this.cooldown <= 0 && Math.abs(this.angleDelta(this.rotation, this.targetAngle)) < 0.4) {
      this.cooldown = effRate;
      this.fire(target, enemies, particles, fire);
    }
  }

  private fire(target: Enemy, enemies: Enemy[], particles: ParticleSystem, fire: (p: Projectile) => void) {
    const stats = this.getEffectiveStats();
    const specials = this.getSpecialStats();
    const muzzleDist = 16;
    const mx = this.x + Math.cos(this.rotation) * muzzleDist;
    const my = this.y + Math.sin(this.rotation) * muzzleDist;

    const spec: ProjectileSpec = {
      type: this.type,
      damage: stats.damage,
      speed: stats.projectileSpeed,
      damageMul: this.damageMul,
      bossDamageMul: specials.bossDamageMul,
      numbDamageMul: (stats.numbDamageMul ?? 1) * specials.numbDamageMul,
      fastEnemyDamageMul: specials.fastEnemyDamageMul,
      ...(this.synergyModifiers.splashSparkDamageMul !== undefined ? { splashSparkDamageMul: this.synergyModifiers.splashSparkDamageMul } : {}),
      ...(this.synergyModifiers.splashSparkRadius !== undefined ? { splashSparkRadius: this.synergyModifiers.splashSparkRadius } : {}),
      ...(this.synergyModifiers.splashSparkCount !== undefined ? { splashSparkCount: this.synergyModifiers.splashSparkCount } : {}),
      ...(this.synergyModifiers.splashFearChance !== undefined ? { splashFearChance: this.synergyModifiers.splashFearChance } : {}),
      ...(this.synergyModifiers.splashFearStunDuration !== undefined ? { splashFearStunDuration: this.synergyModifiers.splashFearStunDuration } : {}),
      ...(specials.burnGround ? { burnGround: specials.burnGround } : {}),
      ...(stats.splashRadius !== undefined ? { splashRadius: stats.splashRadius } : {}),
      ...(stats.chainCount !== undefined ? { chainCount: stats.chainCount, chainRange: stats.chainRange } : {}),
      ...(stats.slowAmount !== undefined ? { slowAmount: stats.slowAmount, slowDuration: stats.slowDuration } : {}),
      ...(stats.fearChance !== undefined ? { fearChance: stats.fearChance, stunDuration: stats.stunDuration } : {}),
      ...(stats.poisonDps !== undefined ? { poisonDps: stats.poisonDps, poisonDuration: stats.poisonDuration } : {}),
      ...(stats.armorShred !== undefined ? { armorShred: stats.armorShred, armorShredDuration: stats.armorShredDuration } : {}),
      ...(stats.guiltMark !== undefined ? { guiltMark: stats.guiltMark, guiltExecuteThreshold: stats.guiltExecuteThreshold } : {}),
      ...(stats.coreShield !== undefined ? { coreShield: stats.coreShield * specials.coreShieldMul, trustAnchorDuration: stats.trustAnchorDuration } : {}),
      ...(stats.shameGroupRadius !== undefined ? { shameGroupRadius: stats.shameGroupRadius, shameGroupDamageMul: stats.shameGroupDamageMul } : {})
    };

    fire(new Projectile(mx, my, target, spec));
    this.recoilTimer = 0.14;
    if (specials.splitShots > 0) {
      const extras = this.pickAdditionalTargets(enemies, target, specials.splitShots, stats.range);
      for (const extra of extras) {
        fire(new Projectile(mx, my, extra, {
          ...spec,
          damage: stats.damage * specials.splitDamageMul,
          splashRadius: undefined
        }));
      }
    }

    // muzzle flash
    const c = EMOTION_COLOR[this.type];
    particles.burst(mx, my, {
      count: 5, color: c,
      speedMin: 40, speedMax: 140,
      sizeMin: 1, sizeMax: 2.4,
      lifeMin: 0.12, lifeMax: 0.28,
      drag: 5, shape: 'spark',
      baseAngle: this.rotation, spread: Math.PI * 0.5
    });
  }

  private drawIdleSignature(): void {
    const g = this.aura;
    const color = EMOTION_COLOR[this.type];
    const accent = EMOTION_ACCENT[this.type];
    const t = this.auraTime;
    const pulse = 0.5 + Math.sin(t * 2.4 + this.cx * 0.31 + this.cy * 0.19) * 0.5;

    switch (this.type) {
      case EmotionType.Anger:
        for (let i = 0; i < 3; i++) {
          const a = t * 1.8 + i * TAU / 3;
          g.moveTo(Math.cos(a) * 18, Math.sin(a) * 18)
            .lineTo(Math.cos(a) * (24 + pulse * 4), Math.sin(a) * (24 + pulse * 4))
            .stroke({ color: accent, width: 1.4, alpha: 0.18 + pulse * 0.18 });
        }
        break;
      case EmotionType.Sadness:
        g.ellipse(0, 4 + pulse * 2, 18 + pulse * 4, 26 + pulse * 2)
          .stroke({ color, width: 1, alpha: 0.12 + pulse * 0.16 });
        break;
      case EmotionType.Joy:
        for (let i = 0; i < 4; i++) {
          const a = t * 0.9 + i * Math.PI / 2;
          g.circle(Math.cos(a) * 24, Math.sin(a) * 24, 1.6 + pulse * 1.2)
            .fill({ color: accent, alpha: 0.24 + pulse * 0.26 });
        }
        break;
      case EmotionType.Fear:
        g.rect(-24 + pulse * 3, -20, 7, 2).fill({ color, alpha: 0.22 });
        g.rect(15 - pulse * 3, 18, 9, 2).fill({ color: accent, alpha: 0.24 });
        break;
      case EmotionType.Calm:
        g.circle(0, 0, 26 + pulse * 9).stroke({ color, width: 1.2, alpha: 0.12 + pulse * 0.18 });
        g.circle(0, 0, 38 + pulse * 7).stroke({ color: accent, width: 0.8, alpha: 0.08 + pulse * 0.12 });
        break;
      case EmotionType.Hope:
        g.circle(0, 0, 25 + pulse * 6).stroke({ color: accent, width: 1, alpha: 0.16 + pulse * 0.16 });
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + i * TAU / 5 + t * 0.28;
          g.moveTo(Math.cos(a) * 22, Math.sin(a) * 22)
            .lineTo(Math.cos(a) * 28, Math.sin(a) * 28)
            .stroke({ color, width: 1, alpha: 0.12 + pulse * 0.14 });
        }
        break;
      case EmotionType.Disgust:
        g.circle(-12 + Math.sin(t * 1.3) * 2, 14, 3 + pulse * 1.2).fill({ color, alpha: 0.18 });
        g.circle(16, -12 + Math.cos(t * 1.5) * 2, 2.4 + pulse).fill({ color: accent, alpha: 0.18 });
        break;
      case EmotionType.Guilt:
        g.regularPoly(0, 0, 25 + pulse * 3, 8, t * 0.12)
          .stroke({ color: accent, width: 1, alpha: 0.12 + pulse * 0.14 });
        break;
      case EmotionType.Trust:
        g.poly([0, -30 - pulse * 3, 25, -12, 19, 22, 0, 31 + pulse * 3, -19, 22, -25, -12])
          .stroke({ color, width: 1, alpha: 0.12 + pulse * 0.14 });
        break;
      case EmotionType.Shame:
        g.regularPoly(0, 0, 25 + pulse * 4, 3, -Math.PI / 2 + t * 0.1)
          .stroke({ color: accent, width: 1, alpha: 0.12 + pulse * 0.16 });
        break;
      case EmotionType.Love:
        g.moveTo(-22, 0).lineTo(22, 0).stroke({ color: accent, width: 1.1, alpha: 0.14 + pulse * 0.18 });
        g.circle(-18, 0, 3 + pulse * 1.4).fill({ color, alpha: 0.18 + pulse * 0.18 });
        g.circle(18, 0, 3 + pulse * 1.4).fill({ color, alpha: 0.18 + pulse * 0.18 });
        break;
      case EmotionType.Pride:
        g.regularPoly(0, 0, 27 + pulse * 4, 5, -Math.PI / 2)
          .stroke({ color: accent, width: 1.1, alpha: 0.14 + pulse * 0.16 });
        break;
    }
  }

  private pickTarget(enemies: Enemy[]): Enemy | null {
    const stats = this.getEffectiveStats();
    const r2 = stats.range * stats.range;
    const candidates: Enemy[] = [];
    for (const e of enemies) {
      if (!e.alive) continue;
      const d2 = (e.x - this.x) ** 2 + (e.y - this.y) ** 2;
      if (d2 > r2) continue;
      candidates.push(e);
    }
    if (candidates.length === 0) return null;
    const bossCandidates = candidates.filter((enemy) => enemy.kind === EnemyKind.Spiral || enemy.kind === EnemyKind.Mask || enemy.kind === EnemyKind.BurnoutBoss);
    const pool = this.targetingMode === 'boss' && bossCandidates.length > 0 ? bossCandidates : candidates;

    switch (this.targetingMode) {
      case 'last':
        return pool.reduce((best, enemy) => enemy.traveled < best.traveled ? enemy : best);
      case 'strongest':
        return pool.reduce((best, enemy) => enemy.hp > best.hp ? enemy : best);
      case 'weakest':
        return pool.reduce((best, enemy) => enemy.hp < best.hp ? enemy : best);
      case 'fastest':
        return pool.reduce((best, enemy) => enemy.baseSpeed > best.baseSpeed ? enemy : best);
      case 'boss':
      case 'first':
        return pool.reduce((best, enemy) => enemy.traveled > best.traveled ? enemy : best);
    }
  }

  private pickAdditionalTargets(enemies: Enemy[], primary: Enemy, count: number, range: number): Enemy[] {
    const r2 = range * range;
    return enemies
      .filter(e => e.alive && e !== primary && ((e.x - this.x) ** 2 + (e.y - this.y) ** 2) <= r2)
      .sort((a, b) => b.traveled - a.traveled)
      .slice(0, count);
  }

  private computeStats(): { stats: TowerStats; specials: TowerSpecialStats } {
    const stats: TowerStats = { ...TOWER_STATS[this.type] };
    const specials: TowerSpecialStats = { ...BASE_TOWER_SPECIALS };
    if (this.upgradePath && this.upgradeLevel > 0) {
      const def = TOWER_UPGRADES[this.type][this.upgradePath];
      for (let i = 0; i < this.upgradeLevel; i++) {
        const level = def.levels[i];
        if (level) this.applyBonus(stats, specials, level.bonus);
      }
    }
    this.applySynergyModifiers(stats, specials);
    this.clampStats(stats);
    return { stats, specials };
  }

  private clampStats(stats: TowerStats) {
    if (stats.damage !== undefined) stats.damage = Math.max(1, stats.damage);
    if (stats.range !== undefined) stats.range = Math.min(350, Math.max(50, stats.range));
    if (stats.fireRate !== undefined) stats.fireRate = Math.min(5.0, Math.max(0.2, stats.fireRate));
    if (stats.projectileSpeed !== undefined) stats.projectileSpeed = Math.min(1200, Math.max(100, stats.projectileSpeed));

    if (stats.splashRadius !== undefined) stats.splashRadius = Math.min(150, stats.splashRadius);
    if (stats.slowAmount !== undefined) stats.slowAmount = Math.min(0.95, Math.max(0.60, stats.slowAmount));
    if (stats.slowDuration !== undefined) stats.slowDuration = Math.min(2.4, stats.slowDuration);
    if (stats.fearChance !== undefined) stats.fearChance = Math.min(0.45, stats.fearChance);
    if (stats.stunDuration !== undefined) stats.stunDuration = Math.min(0.95, stats.stunDuration);
    if (stats.buffRadius !== undefined) stats.buffRadius = Math.min(280, stats.buffRadius);
    if (stats.chainCount !== undefined) stats.chainCount = Math.min(8, stats.chainCount);
    if (stats.chainRange !== undefined) stats.chainRange = Math.min(250, stats.chainRange);
    if (stats.poisonDps !== undefined) stats.poisonDps = Math.min(200, stats.poisonDps);
    if (stats.poisonDuration !== undefined) stats.poisonDuration = Math.min(10.0, stats.poisonDuration);
    if (stats.armorShred !== undefined) stats.armorShred = Math.min(2.5, stats.armorShred);
    if (stats.armorShredDuration !== undefined) stats.armorShredDuration = Math.min(8.0, stats.armorShredDuration);
    if (stats.guiltMark !== undefined) stats.guiltMark = Math.min(0.35, stats.guiltMark);
    if (stats.guiltExecuteThreshold !== undefined) stats.guiltExecuteThreshold = Math.min(0.25, stats.guiltExecuteThreshold);
    if (stats.coreShield !== undefined) stats.coreShield = Math.min(1.0, stats.coreShield);
    if (stats.trustAnchorDuration !== undefined) stats.trustAnchorDuration = Math.min(3.0, stats.trustAnchorDuration);
    if (stats.shameGroupRadius !== undefined) stats.shameGroupRadius = Math.min(160, stats.shameGroupRadius);
    if (stats.shameGroupDamageMul !== undefined) stats.shameGroupDamageMul = Math.min(2.0, stats.shameGroupDamageMul);
    if (stats.loveLinkRadius !== undefined) stats.loveLinkRadius = Math.min(300, stats.loveLinkRadius);
  }

  private applySynergyModifiers(stats: TowerStats, specials: TowerSpecialStats) {
    const modifiers = this.synergyModifiers;
    if (modifiers.slowDurationAdd !== undefined && stats.slowDuration !== undefined) {
      stats.slowDuration += modifiers.slowDurationAdd;
    }
    if (modifiers.numbDamageMul !== undefined) {
      stats.numbDamageMul = (stats.numbDamageMul ?? 1) * modifiers.numbDamageMul;
    }
    if (modifiers.chainRangeAdd !== undefined && stats.chainRange !== undefined) {
      stats.chainRange += modifiers.chainRangeAdd;
    }
    if (modifiers.resonanceDamageMul !== undefined) {
      specials.resonanceDamageMul *= modifiers.resonanceDamageMul;
    }
    if (modifiers.stunDurationAdd !== undefined && stats.stunDuration !== undefined) {
      stats.stunDuration += modifiers.stunDurationAdd;
    }
    if (modifiers.fastEnemyDamageMul !== undefined) {
      specials.fastEnemyDamageMul *= modifiers.fastEnemyDamageMul;
    }
    if (modifiers.poisonDpsMul !== undefined && stats.poisonDps !== undefined) {
      stats.poisonDps *= modifiers.poisonDpsMul;
    }
    if (modifiers.armorShredAdd !== undefined && stats.armorShred !== undefined) {
      stats.armorShred += modifiers.armorShredAdd;
    }
    if (modifiers.guiltMarkAdd !== undefined && stats.guiltMark !== undefined) {
      stats.guiltMark += modifiers.guiltMarkAdd;
    }
    if (modifiers.guiltExecuteThresholdAdd !== undefined && stats.guiltExecuteThreshold !== undefined) {
      stats.guiltExecuteThreshold += modifiers.guiltExecuteThresholdAdd;
    }
    if (modifiers.coreShieldMul !== undefined) {
      specials.coreShieldMul *= modifiers.coreShieldMul;
    }
    if (modifiers.trustAnchorDurationAdd !== undefined && stats.trustAnchorDuration !== undefined) {
      stats.trustAnchorDuration += modifiers.trustAnchorDurationAdd;
    }
    if (modifiers.shameGroupRadiusAdd !== undefined && stats.shameGroupRadius !== undefined) {
      stats.shameGroupRadius += modifiers.shameGroupRadiusAdd;
    }
    if (modifiers.shameGroupDamageMul !== undefined && stats.shameGroupDamageMul !== undefined) {
      stats.shameGroupDamageMul *= modifiers.shameGroupDamageMul;
    }
    if (modifiers.loveDamageMul !== undefined && stats.loveDamageMul !== undefined) {
      stats.loveDamageMul *= modifiers.loveDamageMul;
    }
    if (modifiers.loveFireRateMul !== undefined && stats.loveFireRateMul !== undefined) {
      stats.loveFireRateMul *= modifiers.loveFireRateMul;
    }
    if (modifiers.prideIsolationDamageMul !== undefined && stats.prideIsolationDamageMul !== undefined) {
      stats.prideIsolationDamageMul *= modifiers.prideIsolationDamageMul;
    }
  }

  private applyBonus(stats: TowerStats, specials: TowerSpecialStats, bonus: TowerUpgradeBonus) {
    if (bonus.damageMul !== undefined) stats.damage *= bonus.damageMul;
    if (bonus.rangeAdd !== undefined) stats.range += bonus.rangeAdd;
    if (bonus.rangeMul !== undefined) stats.range *= bonus.rangeMul;
    if (bonus.fireRateMul !== undefined) stats.fireRate *= bonus.fireRateMul;
    if (bonus.projectileSpeedMul !== undefined) stats.projectileSpeed *= bonus.projectileSpeedMul;
    if (bonus.splashRadiusAdd !== undefined) stats.splashRadius = (stats.splashRadius ?? 0) + bonus.splashRadiusAdd;
    if (bonus.splashRadiusMul !== undefined && stats.splashRadius !== undefined) stats.splashRadius *= bonus.splashRadiusMul;
    if (bonus.chainCountAdd !== undefined) stats.chainCount = (stats.chainCount ?? 1) + bonus.chainCountAdd;
    if (bonus.chainRangeAdd !== undefined) stats.chainRange = (stats.chainRange ?? 0) + bonus.chainRangeAdd;
    if (bonus.slowAmountMul !== undefined && stats.slowAmount !== undefined) stats.slowAmount = Math.max(0.60, stats.slowAmount * bonus.slowAmountMul);
    if (bonus.slowDurationAdd !== undefined) stats.slowDuration = (stats.slowDuration ?? 0) + bonus.slowDurationAdd;
    if (bonus.fearChanceAdd !== undefined) stats.fearChance = Math.min(0.45, (stats.fearChance ?? 0) + bonus.fearChanceAdd);
    if (bonus.stunDurationAdd !== undefined) stats.stunDuration = (stats.stunDuration ?? 0) + bonus.stunDurationAdd;
    if (bonus.buffRadiusAdd !== undefined) stats.buffRadius = (stats.buffRadius ?? 0) + bonus.buffRadiusAdd;
    if (bonus.buffFireRateMul !== undefined && stats.buffFireRate !== undefined) stats.buffFireRate *= bonus.buffFireRateMul;
    if (bonus.bossDamageMul !== undefined) specials.bossDamageMul *= bonus.bossDamageMul;
    if (bonus.numbDamageMul !== undefined) specials.numbDamageMul *= bonus.numbDamageMul;
    if (bonus.burnGround) specials.burnGround = bonus.burnGround;
    if (bonus.splitShotsAdd !== undefined) specials.splitShots += bonus.splitShotsAdd;
    if (bonus.splitDamageMul !== undefined) specials.splitDamageMul = bonus.splitDamageMul;
    if (bonus.fastEnemyDamageMul !== undefined) specials.fastEnemyDamageMul *= bonus.fastEnemyDamageMul;
    if (bonus.resonanceDamageMul !== undefined) specials.resonanceDamageMul *= bonus.resonanceDamageMul;
    if (bonus.stabilityOnWaveCompleteAdd !== undefined) specials.stabilityOnWaveComplete += bonus.stabilityOnWaveCompleteAdd;
    if (bonus.poisonDpsMul !== undefined && stats.poisonDps !== undefined) stats.poisonDps *= bonus.poisonDpsMul;
    if (bonus.poisonDurationAdd !== undefined) stats.poisonDuration = (stats.poisonDuration ?? 0) + bonus.poisonDurationAdd;
    if (bonus.armorShredAdd !== undefined) stats.armorShred = (stats.armorShred ?? 1) + bonus.armorShredAdd;
    if (bonus.armorShredDurationAdd !== undefined) stats.armorShredDuration = (stats.armorShredDuration ?? 0) + bonus.armorShredDurationAdd;
    if (bonus.guiltMarkAdd !== undefined) stats.guiltMark = (stats.guiltMark ?? 0) + bonus.guiltMarkAdd;
    if (bonus.guiltExecuteThresholdAdd !== undefined) stats.guiltExecuteThreshold = (stats.guiltExecuteThreshold ?? 0) + bonus.guiltExecuteThresholdAdd;
    if (bonus.coreShieldAdd !== undefined) stats.coreShield = (stats.coreShield ?? 0) + bonus.coreShieldAdd;
    if (bonus.coreShieldMul !== undefined) specials.coreShieldMul *= bonus.coreShieldMul;
    if (bonus.trustAnchorDurationAdd !== undefined) stats.trustAnchorDuration = (stats.trustAnchorDuration ?? 0) + bonus.trustAnchorDurationAdd;
    if (bonus.shameGroupRadiusAdd !== undefined) stats.shameGroupRadius = (stats.shameGroupRadius ?? 0) + bonus.shameGroupRadiusAdd;
    if (bonus.shameGroupDamageMul !== undefined) stats.shameGroupDamageMul = (stats.shameGroupDamageMul ?? 1) * bonus.shameGroupDamageMul;
    if (bonus.loveLinkRadiusAdd !== undefined) stats.loveLinkRadius = (stats.loveLinkRadius ?? 0) + bonus.loveLinkRadiusAdd;
    if (bonus.loveFireRateMul !== undefined) stats.loveFireRateMul = (stats.loveFireRateMul ?? 1) * bonus.loveFireRateMul;
    if (bonus.loveDamageMul !== undefined) stats.loveDamageMul = (stats.loveDamageMul ?? 1) * bonus.loveDamageMul;
    if (bonus.prideIsolationRadiusMul !== undefined && stats.prideIsolationRadius !== undefined) stats.prideIsolationRadius *= bonus.prideIsolationRadiusMul;
    if (bonus.prideIsolationDamageMul !== undefined) stats.prideIsolationDamageMul = (stats.prideIsolationDamageMul ?? 1) * bonus.prideIsolationDamageMul;
  }

  private angleDelta(a: number, b: number) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
