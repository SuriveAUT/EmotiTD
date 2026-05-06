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

export class Tower {
  readonly type: EmotionType;
  readonly cx: number; readonly cy: number;
  readonly x: number;  readonly y: number;
  readonly cost: number;

  private cooldown = 0;
  private fireRate: number;
  private fireRateMod = 1;     // calm buff applied each frame
  private damageMul = 1;       // resonance bonus
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

    // grounded plate
    g.regularPoly(0, 0, 18, 6, 0).fill({ color: 0x0a0f1a, alpha: 0.95 });
    g.regularPoly(0, 0, 18, 6, 0).stroke({ color, width: 2, alpha: 0.7 });
    g.regularPoly(0, 0, 13, 6, Math.PI / 6).fill({ color, alpha: 0.18 });
    g.regularPoly(0, 0, 13, 6, Math.PI / 6).stroke({ color: accent, width: 1, alpha: 0.7 });
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
        g.poly([4, -7, 16, -4, 18, 0, 16, 4, 4, 7]).fill({ color, alpha: 1 });
        g.poly([4, -7, 16, -4, 18, 0, 16, 4, 4, 7]).stroke({ color: accent, width: 1.5, alpha: 0.9 });
        g.circle(0, 0, 8).fill({ color: 0x110714, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.circle(0, 0, 3).fill({ color: accent, alpha: 1 });
        break;
      case EmotionType.Sadness:
        // long sleek barrel
        g.rect(2, -2, 22, 4).fill({ color, alpha: 1 });
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
        g.moveTo(4, 0).lineTo(17, 0).stroke({ color, width: 3, alpha: 0.9 });
        break;
      case EmotionType.Guilt:
        g.regularPoly(0, 0, 11, 8, 0).fill({ color: 0x18130d, alpha: 1 }).stroke({ color, width: 2, alpha: 1 });
        g.circle(0, 0, 5).stroke({ color: accent, width: 1.5, alpha: 0.95 });
        g.moveTo(0, 0).lineTo(16, 0).stroke({ color: accent, width: 2, alpha: 0.85 });
        break;
      case EmotionType.Trust:
        g.circle(0, 0, 12).stroke({ color, width: 2.5, alpha: 1 });
        g.circle(0, 0, 8).fill({ color, alpha: 0.22 });
        g.poly([-6, 1, -2, 6, 8, -5]).stroke({ color: accent, width: 2.2, alpha: 0.95 });
        g.moveTo(7, 0).lineTo(16, 0).stroke({ color, width: 2, alpha: 0.8 });
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
    }
  }

  /* ----------------------- behavior ----------------------- */

  setDamageMul(mul: number) { this.damageMul = mul; }
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

  applyTowerAuras(towers: Tower[], globalFireRateMul = 1) {
    let mult = globalFireRateMul;
    for (const t of towers) {
      if (t === this) continue;
      if (t.type !== EmotionType.Calm) continue;
      if (t.isSupportSuppressed()) continue;
      const stats = t.getEffectiveStats();
      const r = stats.buffRadius ?? 0;
      if (distSq({ x: t.x, y: t.y }, { x: this.x, y: this.y }) <= r * r) {
        mult *= stats.buffFireRate ?? 1;
      }
    }
    this.fireRateMod = mult;
  }

  update(dt: number, enemies: Enemy[], particles: ParticleSystem, fire: (p: Projectile) => void) {
    this.cooldown -= dt;
    this.auraTime += dt;
    if (this.supportSuppressedTimer > 0) {
      this.supportSuppressedTimer = Math.max(0, this.supportSuppressedTimer - dt);
    }
    this.aura.clear();
    if (this.supportSuppressedTimer > 0) {
      this.aura.rect(-15, -15, 30, 30).stroke({ color: 0x77ffaa, width: 1.5, alpha: 0.65 });
      this.aura.rect(-9, -9, 18, 18).stroke({ color: 0x05070d, width: 2, alpha: 0.8 });
    } else if (this.type === EmotionType.Calm) {
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

    // smooth rotation toward target angle
    const da = this.angleDelta(this.rotation, this.targetAngle);
    this.rotation += Math.sign(da) * Math.min(Math.abs(da), 12 * dt);
    this.head.rotation = this.rotation;

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
      ...(stats.coreShield !== undefined ? { coreShield: stats.coreShield * specials.coreShieldMul, trustAnchorDuration: stats.trustAnchorDuration } : {})
    };

    fire(new Projectile(mx, my, target, spec));
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
    const bossCandidates = candidates.filter((enemy) => enemy.kind === EnemyKind.Spiral);
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
    return { stats, specials };
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
    if (bonus.slowAmountMul !== undefined && stats.slowAmount !== undefined) stats.slowAmount = Math.max(0.25, stats.slowAmount * bonus.slowAmountMul);
    if (bonus.slowDurationAdd !== undefined) stats.slowDuration = (stats.slowDuration ?? 0) + bonus.slowDurationAdd;
    if (bonus.fearChanceAdd !== undefined) stats.fearChance = Math.min(0.95, (stats.fearChance ?? 0) + bonus.fearChanceAdd);
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
