import { Container, Graphics } from 'pixi.js';
import { ENEMY_STATS } from './config';
import type { DamagePacket } from './types';
import { EmotionType, EnemyKind, isBossKind } from './types';
import type { ParticleSystem } from './Particles';
import type { PathSampler } from './math';
import { TAU, rand } from './math';

export class Enemy {
  readonly kind: EnemyKind;
  readonly maxHp: number;
  hp: number;
  baseSpeed: number;
  bounty: number;
  damage: number;
  radius: number;

  /** distance along path */
  traveled = 0;
  x = 0; y = 0; angle = 0;

  alive = true;
  reachedCore = false;
  /** flagged once death rewards have been paid out */
  rewarded = false;

  private slowMul = 1;
  private slowTimer = 0;
  private stunTimer = 0;
  private stunImmunityTimer = 0;
  private hasteMul = 1;
  private hasteTimer = 0;
  /** 0..1, glitch wobble amount when feared */
  private fearWobble = 0;
  private firstDodgeReady = true;
  private dodgeTimer = 0;
  private dodgeSide = 1;
  private panicPulseTimer = rand(0.7, 2.0);
  private panicBoostTimer = 0;
  private armorFlashTimer = 0;
  private voidTeleportTimer = rand(2.2, 3.8);
  private leechPulseTimer = rand(1.0, 2.2);
  private thinkDelayTimer = rand(2.0, 3.4);
  private thinkChannelTimer = 0;
  private splitReady = false;
  private hasSplit = false;
  private poisonTimer = 0;
  private poisonDps = 0;
  private poisonSource: EmotionType = EmotionType.Disgust;
  private unreportedDamage: { source: EmotionType; amount: number } | null = null;
  private armorShredTimer = 0;
  private armorShredMul = 1;
  private guiltStacks = 0;
  private guiltTimer = 0;
  private trustAnchorTimer = 0;

  /** boss callback hook */
  private spawnTimer = 0;

  readonly container: Container;
  private body: Container;
  private bodyGfx: Graphics;
  private hpBar: Graphics;
  private flashTimer = 0;
  private wobblePhase: number;

  constructor(kind: EnemyKind, hpScale = 1) {
    this.kind = kind;
    const stats = ENEMY_STATS[kind];
    this.maxHp = stats.hp * hpScale;
    this.hp = this.maxHp;
    this.baseSpeed = stats.speed;
    this.bounty = Math.round(stats.bounty * Math.sqrt(hpScale));
    this.damage = stats.damage;
    this.radius = stats.radius;

    this.container = new Container();
    this.container.label = `enemy:${kind}`;
    this.body = new Container();
    this.bodyGfx = new Graphics();
    this.hpBar = new Graphics();
    this.body.addChild(this.bodyGfx);
    this.container.addChild(this.body, this.hpBar);
    this.wobblePhase = Math.random() * TAU;
    this.drawBody();
  }

  private drawBody() {
    const g = this.bodyGfx;
    g.clear();
    switch (this.kind) {
      case EnemyKind.Doubtling: this.drawDoubtling(g); break;
      case EnemyKind.PanicRunner: this.drawPanic(g); break;
      case EnemyKind.GuiltGiant: this.drawGuilt(g); break;
      case EnemyKind.ShameSwarm: this.drawShame(g); break;
      case EnemyKind.EnvyLeech: this.drawEnvy(g); break;
      case EnemyKind.BurnoutBrute: this.drawBurnout(g); break;
      case EnemyKind.VoidWraith: this.drawVoid(g); break;
      case EnemyKind.Overthinker: this.drawOverthinker(g); break;
      case EnemyKind.NumbOne: this.drawNumb(g); break;
      case EnemyKind.Spiral: this.drawSpiral(g); break;
      case EnemyKind.Mask: this.drawMask(g); break;
      case EnemyKind.BurnoutBoss: this.drawBurnoutBoss(g); break;
    }
  }

  private drawDoubtling(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 3).fill({ color: 0x0a0f1a, alpha: 0.6 });
    g.circle(0, 0, r).fill({ color: 0x2a3552, alpha: 1 });
    g.circle(0, 0, r).stroke({ color: 0x6c7da0, width: 1.5, alpha: 0.8 });
    g.circle(0, -r * 0.3, r * 0.32).fill({ color: 0xb070ff, alpha: 0.95 });
    g.circle(0, r * 0.45, r * 0.18).fill({ color: 0xb070ff, alpha: 0.95 });
  }

  private drawPanic(g: Graphics) {
    const r = this.radius;
    // arrow-like triangle
    g.poly([r * 1.45, 0, -r * 1.0, -r * 1.05, -r * 0.65, 0, -r * 1.0, r * 1.05])
      .fill({ color: 0xff5577, alpha: 0.12 });
    g.poly([r * 1.1, 0, -r * 0.8, -r * 0.8, -r * 0.8, r * 0.8])
      .fill({ color: 0x441020, alpha: 1 })
      .stroke({ color: 0xff5577, width: 2, alpha: 1 });
    g.circle(-r * 0.2, 0, r * 0.3).fill({ color: 0xff5577, alpha: 0.9 });
    g.moveTo(-r * 1.15, -r * 0.62).lineTo(-r * 1.65, -r * 0.62).stroke({ color: 0xffd166, width: 1.5, alpha: 0.8 });
    g.moveTo(-r * 1.08, r * 0.55).lineTo(-r * 1.48, r * 0.55).stroke({ color: 0xffd166, width: 1.2, alpha: 0.65 });
  }

  private drawGuilt(g: Graphics) {
    const r = this.radius;
    g.regularPoly(0, 0, r + 7, 8, 0).fill({ color: 0x0a0f1a, alpha: 0.7 });
    g.regularPoly(0, 0, r + 3, 8, Math.PI / 8).stroke({ color: 0xffd166, width: 2, alpha: 0.34 });
    g.regularPoly(0, 0, r, 8, 0).fill({ color: 0x1d2438, alpha: 1 });
    g.regularPoly(0, 0, r, 8, 0).stroke({ color: 0x6c7da0, width: 2, alpha: 0.9 });
    // chain marks
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 8;
      const x = Math.cos(a) * r * 0.55;
      const y = Math.sin(a) * r * 0.55;
      g.circle(x, y, 3).stroke({ color: 0xffd166, width: 1.5, alpha: 0.8 });
    }
    g.regularPoly(0, 0, r * 0.32, 6, 0).fill({ color: 0xffd166, alpha: 0.7 });
  }

  private drawShame(g: Graphics) {
    const r = this.radius;
    // jagged shard cluster
    g.poly([
      -r, -r * 0.2,
      r * 0.5, -r,
      r, r * 0.4,
      -r * 0.3, r
    ])
      .fill({ color: 0x2a1a2c, alpha: 1 })
      .stroke({ color: 0xff77ff, width: 1.5, alpha: 0.9 });
    g.poly([
      0, -r * 0.5,
      r * 0.6, 0,
      0, r * 0.4,
      -r * 0.4, 0
    ]).fill({ color: 0xff77ff, alpha: 0.55 });
  }

  private drawSpiral(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 28).fill({ color: 0xff5577, alpha: 0.06 });
    g.circle(0, 0, r + 18).stroke({ color: 0xff5577, width: 2, alpha: 0.38 });
    g.circle(0, 0, r + 9).fill({ color: 0xff5577, alpha: 0.12 });
    g.circle(0, 0, r).fill({ color: 0x110714, alpha: 1 });
    // rotating arms (will be spun via container)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const inner = r * 0.18;
      const outer = r + 13;
      g.moveTo(Math.cos(a) * inner, Math.sin(a) * inner).lineTo(Math.cos(a + 0.42) * outer, Math.sin(a + 0.42) * outer)
        .stroke({ color: 0xff5577, width: 4, alpha: 0.9 });
      g.circle(Math.cos(a + 0.42) * outer, Math.sin(a + 0.42) * outer, 4).fill({ color: 0xffd166, alpha: 0.85 });
    }
    g.circle(0, 0, r * 0.58).stroke({ color: 0x6cf0ff, width: 2.5, alpha: 0.95 });
    g.circle(0, 0, r * 0.32).fill({ color: 0xffffff, alpha: 0.95 });
    g.circle(0, 0, r + 2).stroke({ color: 0xffffff, width: 1, alpha: 0.25 });
  }

  private drawMask(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 24).fill({ color: 0xff77ff, alpha: 0.05 });
    g.circle(0, 0, r + 14).stroke({ color: 0xff77ff, width: 2, alpha: 0.35 });
    g.ellipse(0, 0, r * 0.9, r * 1.15).fill({ color: 0x17091f, alpha: 1 }).stroke({ color: 0xff77ff, width: 3, alpha: 0.9 });
    g.circle(-r * 0.28, -r * 0.18, r * 0.14).fill({ color: 0x6cf0ff, alpha: 0.95 });
    g.circle(r * 0.28, -r * 0.18, r * 0.14).fill({ color: 0xffd166, alpha: 0.95 });
    g.moveTo(-r * 0.45, r * 0.35).lineTo(r * 0.45, r * 0.25).stroke({ color: 0xffffff, width: 2, alpha: 0.65 });
    g.moveTo(0, -r * 0.95).lineTo(0, r * 0.95).stroke({ color: 0xb070ff, width: 1.5, alpha: 0.55 });
  }

  private drawBurnoutBoss(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 26).fill({ color: 0xff5b3a, alpha: 0.07 });
    g.regularPoly(0, 0, r + 14, 8, Math.PI / 8).stroke({ color: 0xff5b3a, width: 3, alpha: 0.45 });
    g.regularPoly(0, 0, r + 2, 8, 0).fill({ color: 0x190906, alpha: 1 }).stroke({ color: 0xff5b3a, width: 3, alpha: 0.9 });
    g.circle(0, 0, r * 0.58).stroke({ color: 0xffd166, width: 2.4, alpha: 0.8 });
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + i * 0.6;
      g.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22)
        .lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92)
        .stroke({ color: 0xffd166, width: 2, alpha: 0.72 });
    }
  }

  private drawEnvy(g: Graphics) {
    const r = this.radius;
    g.circle(-r * 0.35, r * 0.2, r).fill({ color: 0x102a18, alpha: 0.45 });
    g.circle(0, 0, r).fill({ color: 0x07130b, alpha: 1 }).stroke({ color: 0x77ffaa, width: 2, alpha: 0.9 });
    g.circle(r * 0.3, -r * 0.15, r * 0.38).fill({ color: 0x77ffaa, alpha: 0.85 });
    g.moveTo(-r * 0.7, r * 0.55).lineTo(r * 0.8, -r * 0.55).stroke({ color: 0x2aff77, width: 1.5, alpha: 0.75 });
    g.circle(-r * 0.68, -r * 0.55, 2.6).fill({ color: 0x77ffaa, alpha: 0.8 });
    g.circle(r * 0.72, r * 0.5, 2.3).fill({ color: 0x77ffaa, alpha: 0.65 });
  }

  private drawBurnout(g: Graphics) {
    const r = this.radius;
    g.regularPoly(0, 0, r + 8, 7, 0).fill({ color: 0x12080a, alpha: 1 });
    g.regularPoly(0, 0, r + 3, 7, 0).stroke({ color: 0xff5b3a, width: 3, alpha: 0.75 });
    g.regularPoly(0, 0, r, 7, Math.PI / 7).fill({ color: 0x24100a, alpha: 0.75 });
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.55;
      g.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2)
        .lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85)
        .stroke({ color: 0xffd166, width: 1.7, alpha: 0.65 });
    }
    g.circle(0, 0, r * 0.32).fill({ color: 0x1a0f12, alpha: 1 }).stroke({ color: 0xff5577, width: 1, alpha: 0.7 });
  }

  private drawVoid(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 7).fill({ color: 0x000000, alpha: 0.42 });
    g.circle(0, 0, r + 11).stroke({ color: 0xb070ff, width: 1, alpha: 0.28 });
    g.poly([0, -r, r * 0.75, -r * 0.15, r * 0.35, r, -r * 0.75, r * 0.35, -r * 0.45, -r * 0.65])
      .fill({ color: 0x05030b, alpha: 1 })
      .stroke({ color: 0xb070ff, width: 2, alpha: 0.95 });
    g.rect(-r * 0.8, -2, r * 1.6, 4).fill({ color: 0x6cf0ff, alpha: 0.5 });
    g.circle(0, 0, r * 0.25).fill({ color: 0xffffff, alpha: 0.9 });
  }

  private drawOverthinker(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 6).fill({ color: 0x081026, alpha: 0.65 });
    g.circle(0, 0, r + 9).stroke({ color: 0x6cf0ff, width: 1, alpha: 0.25 });
    g.circle(0, 0, r).stroke({ color: 0x4ba8ff, width: 2, alpha: 0.85 });
    g.circle(0, 0, r * 0.62).fill({ color: 0x090b1a, alpha: 1 }).stroke({ color: 0xb070ff, width: 1.5, alpha: 0.8 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + Math.PI / 5;
      g.circle(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 3.2).fill({ color: 0x6cf0ff, alpha: 0.85 });
    }
    g.moveTo(-r * 0.45, 0).lineTo(r * 0.45, 0).stroke({ color: 0xff77ff, width: 1.4, alpha: 0.65 });
  }

  private drawNumb(g: Graphics) {
    const r = this.radius;
    g.circle(0, 0, r + 5).fill({ color: 0x090a0d, alpha: 0.6 });
    g.regularPoly(0, 0, r, 9, 0).fill({ color: 0x171a22, alpha: 1 });
    g.regularPoly(0, 0, r, 9, 0).stroke({ color: 0x8c95a8, width: 1.6, alpha: 0.6 });
    g.rect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44).stroke({ color: 0x596274, width: 1, alpha: 0.24 });
    g.circle(0, 0, r * 0.52).fill({ color: 0x262b35, alpha: 0.75 });
    g.moveTo(-r * 0.55, -r * 0.18).lineTo(r * 0.55, -r * 0.18).stroke({ color: 0x596274, width: 1.4, alpha: 0.8 });
    g.moveTo(-r * 0.35, r * 0.25).lineTo(r * 0.35, r * 0.25).stroke({ color: 0x596274, width: 1.2, alpha: 0.55 });
  }

  private drawHpBar() {
    const g = this.hpBar;
    g.clear();
    if (this.hp >= this.maxHp && !isBossKind(this.kind)) return; // hide when full except bosses
    const boss = isBossKind(this.kind);
    const w = this.radius * (boss ? 2.8 : 2) + 6;
    const h = boss ? 5 : 3;
    const y = -this.radius - 9;
    const ratio = Math.max(0, this.hp / this.maxHp);
    g.rect(-w / 2, y, w, h).fill({ color: 0x0a0f1a, alpha: 0.85 });
    g.rect(-w / 2, y, w * ratio, h).fill({ color: boss ? 0xff5577 : ratio > 0.5 ? 0x77ffaa : ratio > 0.25 ? 0xffd166 : 0xff5577, alpha: 1 });
    g.rect(-w / 2, y, w, h).stroke({ color: 0x1a2238, width: 1, alpha: 1 });
    if (boss) {
      g.rect(-w / 2, y - 4, w, 1).fill({ color: 0xffd166, alpha: 0.9 });
      g.circle(-w / 2 - 5, y + h / 2, 3).fill({ color: 0xff5577, alpha: 0.9 });
      g.circle(w / 2 + 5, y + h / 2, 3).fill({ color: 0xff5577, alpha: 0.9 });
    }
  }

  takeDamage(packet: DamagePacket): { killed: boolean } {
    if (!this.alive) return { killed: false };
    let amount = packet.amount;
    if (this.armorShredTimer > 0) amount *= this.armorShredMul;
    if (packet.source === EmotionType.Guilt && packet.guiltMark !== undefined) {
      amount *= 1 + Math.min(5, this.guiltStacks) * packet.guiltMark;
    }
    if (this.kind === EnemyKind.Doubtling && this.firstDodgeReady) {
      this.firstDodgeReady = false;
      this.dodgeTimer = 0.28;
      this.dodgeSide = Math.random() < 0.5 ? -1 : 1;
      amount *= 0.65;
    }
    if (this.kind === EnemyKind.GuiltGiant && amount < 30) {
      amount *= 0.62;
      this.armorFlashTimer = 0.18;
    }
    if (packet.source === EmotionType.Disgust && (this.kind === EnemyKind.GuiltGiant || this.kind === EnemyKind.BurnoutBrute)) {
      amount *= this.kind === EnemyKind.GuiltGiant ? 1.35 : 1.28;
      this.armorFlashTimer = 0.18;
    }
    if (this.kind === EnemyKind.BurnoutBrute) {
      if (packet.source === EmotionType.Anger) amount *= 0.48;
      else if (packet.source === EmotionType.Sadness || packet.source === EmotionType.Calm) amount *= 1.35;
    }
    if (this.kind === EnemyKind.NumbOne && packet.source !== EmotionType.Hope) {
      amount *= 0.9;
    }
    this.hp -= amount;
    if (packet.source === EmotionType.Guilt && packet.guiltMark !== undefined) {
      this.guiltStacks = Math.min(6, this.guiltStacks + 1);
      this.guiltTimer = 4.2;
      const threshold = packet.guiltExecuteThreshold ?? 0;
      if (threshold > 0 && this.hp > 0 && this.hp / this.maxHp <= threshold) this.hp = 0;
    }
    if (packet.poisonDps !== undefined && packet.poisonDuration !== undefined) {
      const antiBruteMul = this.kind === EnemyKind.GuiltGiant || this.kind === EnemyKind.BurnoutBrute ? 1.25 : 1;
      this.poisonDps = Math.max(this.poisonDps, packet.poisonDps * antiBruteMul);
      this.poisonTimer = Math.max(this.poisonTimer, packet.poisonDuration);
      this.poisonSource = packet.source;
    }
    if (packet.armorShred !== undefined && packet.armorShredDuration !== undefined) {
      this.armorShredMul = Math.max(this.armorShredMul, packet.armorShred);
      this.armorShredTimer = Math.max(this.armorShredTimer, packet.armorShredDuration);
    }
    if (packet.source === EmotionType.Trust && packet.trustAnchorDuration !== undefined) {
      if (this.kind === EnemyKind.PanicRunner || this.kind === EnemyKind.VoidWraith) {
        this.trustAnchorTimer = Math.max(this.trustAnchorTimer, packet.trustAnchorDuration);
        this.applySlow(0.72, packet.trustAnchorDuration);
        if (this.kind === EnemyKind.VoidWraith) this.voidTeleportTimer = Math.max(this.voidTeleportTimer, packet.trustAnchorDuration + 1.1);
        if (this.kind === EnemyKind.PanicRunner) this.panicBoostTimer = 0;
      }
    }
    this.flashTimer = 0.08;
    if (packet.slow !== undefined && Math.random() < 1) {
      this.applySlow(packet.slow, packet.slowDuration ?? 1);
    }
    if (packet.fearChance !== undefined && Math.random() < packet.fearChance) {
      this.applyStun(packet.stunDuration ?? 0.5);
    }
    if (this.hp <= 0) {
      this.alive = false;
      return { killed: true };
    }
    return { killed: false };
  }

  consumeLeechPulse(dt: number): boolean {
    if (this.kind !== EnemyKind.EnvyLeech || !this.alive) return false;
    this.leechPulseTimer -= dt;
    if (this.leechPulseTimer <= 0) {
      this.leechPulseTimer = rand(2.2, 3.2);
      return true;
    }
    return false;
  }

  consumeSplit(): boolean {
    if (!this.splitReady) return false;
    this.splitReady = false;
    return true;
  }

  /** applied slow: enemy speed *= mul for `duration` seconds (only stronger overrides) */
  applySlow(mul: number, duration: number) {
    if (duration <= 0) return;
    const resist = ENEMY_STATS[this.kind].slowResist ?? 0;
    const resistedMul = 1 - ((1 - mul) * (1 - resist));
    const effectiveMul = Math.max(this.minSpeedMultiplier(), Math.min(1, resistedMul));
    if (effectiveMul < this.slowMul) this.slowMul = effectiveMul;
    if (duration > this.slowTimer) this.slowTimer = duration;
  }

  applyStun(duration: number) {
    if (this.stunImmunityTimer > 0) return;
    const resist = ENEMY_STATS[this.kind].stunResist ?? 0;
    let effectiveDuration = duration * (1 - resist);
    if (isBossKind(this.kind)) effectiveDuration = Math.min(0.25, effectiveDuration * 0.25);
    if (!isBossKind(this.kind) && effectiveDuration <= 0.04) {
      this.stunImmunityTimer = Math.max(this.stunImmunityTimer, this.stunImmunityDuration());
      return;
    }
    if (effectiveDuration > this.stunTimer) this.stunTimer = effectiveDuration;
    this.stunImmunityTimer = effectiveDuration + this.stunImmunityDuration();
    this.fearWobble = 1;
  }

  applySpeedBoost(mult: number, duration: number) {
    if (mult > this.hasteMul) this.hasteMul = mult;
    if (duration > this.hasteTimer) this.hasteTimer = duration;
  }

  private minSpeedMultiplier(): number {
    if (isBossKind(this.kind)) return 0.65;
    if (this.kind === EnemyKind.NumbOne) return 0.75;
    if (this.kind === EnemyKind.PanicRunner || this.kind === EnemyKind.VoidWraith) return 0.55;
    return 0.45;
  }

  private stunImmunityDuration(): number {
    if (isBossKind(this.kind)) return 5.0;
    if (this.kind === EnemyKind.NumbOne) return 6.0;
    if (this.kind === EnemyKind.PanicRunner || this.kind === EnemyKind.VoidWraith) return 2.8;
    return 2.5;
  }

  /** boss spawns child enemies — Game polls and clears */
  consumeSpawn(dt: number): boolean {
    if (!isBossKind(this.kind) || !this.alive) return false;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 6;
      return true;
    }
    return false;
  }

  update(dt: number, path: PathSampler, particles: ParticleSystem): void {
    if (!this.alive) return;
    if (this.poisonTimer > 0) {
      const tickDamage = this.poisonDps * dt;
      const dealt = Math.min(this.hp, tickDamage);
      this.hp -= tickDamage;
      this.unreportedDamage = {
        source: this.poisonSource,
        amount: (this.unreportedDamage?.amount ?? 0) + dealt
      };
      this.poisonTimer = Math.max(0, this.poisonTimer - dt);
      if (Math.random() < 0.28) particles.trail(this.x + rand(-this.radius, this.radius), this.y + rand(-this.radius, this.radius), 0x8ee05f, 1.8);
      if (this.hp <= 0) {
        this.alive = false;
        return;
      }
    }
    if (this.armorShredTimer > 0) {
      this.armorShredTimer = Math.max(0, this.armorShredTimer - dt);
      if (this.armorShredTimer <= 0) this.armorShredMul = 1;
    }
    if (this.guiltTimer > 0) {
      this.guiltTimer = Math.max(0, this.guiltTimer - dt);
      if (this.guiltTimer <= 0) this.guiltStacks = 0;
    }
    if (this.trustAnchorTimer > 0) this.trustAnchorTimer = Math.max(0, this.trustAnchorTimer - dt);

    const controlled = this.slowTimer > 0 || this.stunTimer > 0;
    if (this.kind === EnemyKind.PanicRunner) {
      if (controlled) {
        this.panicPulseTimer = Math.max(this.panicPulseTimer, 1.2);
        this.panicBoostTimer = 0;
      } else {
        this.panicPulseTimer -= dt;
        if (this.panicPulseTimer <= 0) {
          this.panicPulseTimer = rand(3.2, 4.6);
          this.panicBoostTimer = 1.15;
        }
      }
    }
    if (this.panicBoostTimer > 0) this.panicBoostTimer = Math.max(0, this.panicBoostTimer - dt);

    if (this.hasteTimer > 0) {
      this.hasteTimer -= dt;
      if (this.hasteTimer <= 0) this.hasteMul = 1;
    }

    if (this.kind === EnemyKind.VoidWraith && this.trustAnchorTimer <= 0) {
      this.voidTeleportTimer -= dt;
      if (this.voidTeleportTimer <= 0) {
        this.voidTeleportTimer = rand(3.0, 4.5);
        const jump = rand(70, 125);
        this.traveled = Math.min(path.totalLength - 45, this.traveled + jump);
        particles.ring(this.x, this.y, { color: 0xb070ff, startRadius: 6, endRadius: 42, duration: 0.28, thickness: 2, alpha: 0.75 });
        particles.burst(this.x, this.y, {
          count: 16, color: 0xb070ff, speedMin: 20, speedMax: 120,
          sizeMin: 1, sizeMax: 2.6, lifeMin: 0.18, lifeMax: 0.42, drag: 3, shape: 'shard'
        });
      }
    }

    if (this.kind === EnemyKind.Overthinker && !this.hasSplit) {
      if (this.thinkChannelTimer > 0) {
        this.thinkChannelTimer = Math.max(0, this.thinkChannelTimer - dt);
        if (this.thinkChannelTimer <= 0) {
          this.hasSplit = true;
          this.splitReady = true;
          particles.ring(this.x, this.y, { color: 0x6cf0ff, startRadius: 12, endRadius: 70, duration: 0.42, thickness: 2.5, alpha: 0.8 });
          particles.burst(this.x, this.y, {
            count: 22, color: 0xb070ff, speedMin: 40, speedMax: 160,
            sizeMin: 1.2, sizeMax: 3, lifeMin: 0.22, lifeMax: 0.55, drag: 3, shape: 'shard'
          });
        } else if (Math.random() < 0.45) {
          particles.trail(this.x + rand(-14, 14), this.y + rand(-14, 14), 0x6cf0ff, 2.2);
        }
      } else {
        this.thinkDelayTimer -= dt;
        if (this.thinkDelayTimer <= 0) this.thinkChannelTimer = 1.2;
      }
    }

    let dodgeOffset = 0;
    if (this.dodgeTimer > 0) {
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
      dodgeOffset = Math.sin((this.dodgeTimer / 0.28) * Math.PI) * 11 * this.dodgeSide;
    }

    if (this.stunImmunityTimer > 0) {
      this.stunImmunityTimer = Math.max(0, this.stunImmunityTimer - dt);
    }

    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      // glitch jitter
      this.body.x = (Math.random() - 0.5) * 4;
      this.body.y = (Math.random() - 0.5) * 4;
    } else if (this.thinkChannelTimer > 0) {
      this.body.x = (Math.random() - 0.5) * 2;
      this.body.y = (Math.random() - 0.5) * 2;
    } else {
      this.body.x = -Math.sin(this.angle) * dodgeOffset;
      this.body.y = Math.cos(this.angle) * dodgeOffset;
      const panicMul = this.panicBoostTimer > 0 ? 1.34 : 1;
      const slowedSpeed = this.baseSpeed * this.slowMul * this.hasteMul * panicMul;
      const speed = Math.max(this.baseSpeed * this.minSpeedMultiplier(), slowedSpeed);
      this.traveled += speed * dt;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowMul = 1;
    }
    if (this.fearWobble > 0) this.fearWobble = Math.max(0, this.fearWobble - dt * 1.6);
    if (this.armorFlashTimer > 0) this.armorFlashTimer = Math.max(0, this.armorFlashTimer - dt);

    if (this.traveled >= path.totalLength) {
      this.reachedCore = true;
      this.alive = false;
      return;
    }

    const pos = path.sample(this.traveled);
    this.x = pos.x;
    this.y = pos.y;
    this.angle = pos.angle;

    // wobble
    const t = performance.now() * 0.001 + this.wobblePhase;
    const wob = Math.sin(t * 4) * 1.2;

    this.container.x = this.x;
    this.container.y = this.y + wob;

    // body rotation
    if (this.kind === EnemyKind.PanicRunner) {
      this.body.rotation = this.angle;
      this.body.scale.set(this.panicBoostTimer > 0 ? 1.18 : 1);
    } else if (isBossKind(this.kind)) {
      this.body.rotation += dt * 1.4;
      const bossPulse = 1 + Math.sin(t * 3.6) * 0.055;
      this.body.scale.set(bossPulse);
    } else if (this.kind === EnemyKind.VoidWraith) {
      this.body.rotation += dt * 2.4;
      this.body.scale.set(0.96 + Math.sin(t * 4.2) * 0.06);
    } else if (this.kind === EnemyKind.Overthinker) {
      this.body.rotation += this.thinkChannelTimer > 0 ? dt * 3.8 : dt * 0.45;
      this.body.scale.set(this.thinkChannelTimer > 0 ? 1.08 + Math.sin(t * 10) * 0.04 : 1);
    } else if (this.kind === EnemyKind.ShameSwarm) {
      this.body.rotation += dt * 1.8;
      this.body.scale.set(0.96 + Math.sin(t * 6) * 0.05);
    } else {
      this.body.rotation = Math.sin(t * 3) * 0.15;
      this.body.scale.set(1);
    }

    // damage flash
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.bodyGfx.tint = 0xffffff;
      this.bodyGfx.alpha = 1;
    } else if (this.armorFlashTimer > 0) {
      this.bodyGfx.tint = 0xffd166;
      this.bodyGfx.alpha = 1;
    } else {
      this.bodyGfx.tint = 0xffffff;
      this.bodyGfx.alpha = this.slowTimer > 0 ? 0.85 : 1;
    }

    // panic runner trail
    if (this.kind === EnemyKind.PanicRunner) {
      if (Math.random() < (this.panicBoostTimer > 0 ? 1 : 0.7)) {
        particles.trail(this.x - Math.cos(this.angle) * this.radius * 0.6,
                        this.y - Math.sin(this.angle) * this.radius * 0.6,
                        this.panicBoostTimer > 0 ? 0xffd166 : 0xff5577,
                        this.panicBoostTimer > 0 ? 3.2 : 2.5);
      }
    } else if (isBossKind(this.kind)) {
      if (Math.random() < 0.38) {
        const a = Math.random() * TAU;
        const r = this.radius + rand(8, 28);
        particles.trail(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, Math.random() < 0.25 ? 0xffd166 : 0xff5577, 2.2);
      }
    }
    if (this.kind === EnemyKind.EnvyLeech && Math.random() < 0.28) {
      particles.trail(this.x + rand(-8, 8), this.y + rand(-8, 8), 0x77ffaa, 1.9);
    } else if (this.kind === EnemyKind.BurnoutBrute && Math.random() < 0.22) {
      particles.trail(this.x + rand(-10, 10), this.y + rand(-10, 10), 0xff5b3a, 2.2);
    } else if (this.kind === EnemyKind.Overthinker && Math.random() < (this.thinkChannelTimer > 0 ? 0.48 : 0.18)) {
      particles.trail(this.x + rand(-12, 12), this.y + rand(-12, 12), this.thinkChannelTimer > 0 ? 0x6cf0ff : 0xb070ff, 2);
    } else if (this.kind === EnemyKind.NumbOne && Math.random() < 0.14) {
      particles.trail(this.x + rand(-6, 6), this.y + rand(-6, 6), 0x8c95a8, 1.6);
    }
    if (this.hasteTimer > 0 && Math.random() < 0.3) {
      particles.trail(this.x, this.y, 0xff77ff, 1.8);
    }

    this.drawHpBar();
  }

  consumeUnreportedDamage(): { source: EmotionType; amount: number } | null {
    const damage = this.unreportedDamage;
    this.unreportedDamage = null;
    return damage;
  }

  spawnDeathParticles(particles: ParticleSystem) {
    const colorMap: Record<EnemyKind, number> = {
      [EnemyKind.Doubtling]: 0xb070ff,
      [EnemyKind.PanicRunner]: 0xff5577,
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
    const c = colorMap[this.kind];
    const count = isBossKind(this.kind) ? 60 : this.kind === EnemyKind.GuiltGiant ? 26 : 14;
    particles.burst(this.x, this.y, {
      count, color: c,
      speedMin: 60, speedMax: 220,
      sizeMin: 1.5, sizeMax: 3.5,
      lifeMin: 0.4, lifeMax: 0.9,
      drag: 2.5, shape: this.kind === EnemyKind.ShameSwarm ? 'shard' : 'circle'
    });
    particles.ring(this.x, this.y, {
      color: c, startRadius: this.radius, endRadius: this.radius + 40,
      duration: 0.4, thickness: 2
    });
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
