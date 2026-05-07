import { Application, Container, FederatedPointerEvent, Graphics, Text, Ticker } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { audioManager } from '../core/AudioManager';
import type { QualitySetting } from '../core/SaveManager';
import { CANVAS, COLORS, DEFAULT_MAP, ECONOMY, EMOTION_COLOR, ENEMY_STATS, FIELD, TOWER_STATS, type BurnGroundSpec, type MapDefinition } from './config';
import { EMOTION_TYPES, EmotionType, EnemyKind, isBossKind, type DamagePacket, type TargetingMode, type UpgradePath } from './types';
import { GameMap } from './GameMap';
import { ParticleSystem } from './Particles';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { bossKindForWave, WaveManager } from './WaveManager';
import { EmotionalBalance } from './EmotionalBalance';
import { HUD } from '../ui/HUD';
import { TowerBar } from '../ui/TowerBar';
import { SidePanel } from '../ui/SidePanel';
import { makeHeadline, makeLabel, makeText } from '../ui/text';
import { saveManager, type SaveManager } from '../core/SaveManager';
import { TutorialManager } from './TutorialManager';
import { STANDARD_MAX_WAVE, type GameMode } from './GameMode';
import { SynergySystem } from './SynergySystem';
import { RunStats } from './RunStats';
import { DevToolsOverlay, type DevToolsSnapshot } from '../debug/DevToolsOverlay';

interface GameState {
  stability: number;
  memory: number;
  paused: boolean;
  speedMultiplier: 1 | 2;
  autoStartEnabled: boolean;
  defeat: boolean;
  victory: boolean;
  betweenWaves: boolean;
  autoStartIn: number;        // seconds until next wave auto-start
  shake: number;
  notice: string;
  noticeTimer: number;
  coreShield: number;
  bossIntroTimer: number;
}

interface GameOptions {
  mode?: GameMode;
  map?: MapDefinition;
  onMainMenu?: () => void;
}

const AUTO_START_SECONDS = 8;
const GROUND_TICK_SECONDS = 0.25;

interface GroundEffect {
  x: number;
  y: number;
  radius: number;
  dps: number;
  source: EmotionType;
  duration: number;
  remaining: number;
  tick: number;
  gfx: Graphics;
}

interface OverheatZone {
  x: number;
  y: number;
  radius: number;
  duration: number;
  remaining: number;
  gfx: Graphics;
}

interface CombatNotice {
  text: Text;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class Game {
  private app: Application;
  private root: Container;
  private worldRoot: Container;       // shaken
  private mapLayer: Container;
  private effectsLayer: Container;
  private towersLayer: Container;
  private enemiesLayer: Container;
  private projectilesLayer: Container;
  private particlesLayer: Container;
  private overlayLayer: Container;    // placement preview, range circles
  private uiLayer: Container;

  private map: GameMap;
  private particles: ParticleSystem;
  private waves = new WaveManager();
  private balance = new EmotionalBalance();
  private synergies = new SynergySystem();
  private runStats = new RunStats();

  private hud: HUD;
  private towerBar: TowerBar;
  private sidePanel: SidePanel;

  private state: GameState = {
    stability: ECONOMY.startingStability,
    memory: ECONOMY.startingMemory,
    paused: false,
    speedMultiplier: 1,
    autoStartEnabled: true,
    defeat: false,
    victory: false,
    betweenWaves: true,
    autoStartIn: AUTO_START_SECONDS,
    shake: 0,
    notice: '',
    noticeTimer: 0,
    coreShield: 0,
    bossIntroTimer: 0
  };

  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  private groundEffects: GroundEffect[] = [];
  private overheatZones: OverheatZone[] = [];
  private combatNotices: CombatNotice[] = [];
  private spiralPulseTimer = 5;
  private balanceDisruption = 0;
  private leechNoticeTimer = 0;
  private bossIntroOverlay: Container | null = null;
  private bossIntroWave: number | null = null;
  private lowStabilityPulseTimer = 0;
  private maskResistTimer = 0;
  private maskResistEmotion: EmotionType | null = null;
  private burnoutZoneTimer = 4.5;

  private selectedTowerType: EmotionType | null = null;
  private selectedTower: Tower | null = null;
  private hoveredCell: { cx: number; cy: number } | null = null;
  private pointer = { x: 0, y: 0 };
  private readonly handlePointerMove = (e: FederatedPointerEvent) => this.onPointerMove(e);
  private readonly handlePointerDown = (e: FederatedPointerEvent) => this.onPointerDown(e);
  private readonly handleRightDown = (e: FederatedPointerEvent) => {
    e.preventDefault?.();
    this.cancelPlacement();
  };
  private readonly handleKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
  private readonly handleContextMenu = (e: MouseEvent) => e.preventDefault();

  private ghost = new Container();
  private ghostBody = new Graphics();
  private ghostRange = new Graphics();
  private rangePreview = new Graphics();
  private readonly saves: SaveManager;
  private mode: GameMode;
  private readonly onMainMenu?: () => void;
  private readonly mapDefinition: MapDefinition;
  private tutorial: TutorialManager | null = null;
  private victoryOverlay: Container | null = null;
  private pauseOverlay: Container | null = null;
  private devTools: DevToolsOverlay | null = null;

  constructor(app: Application, saves: SaveManager = saveManager, options: GameOptions = {}) {
    this.app = app;
    this.saves = saves;
    this.mode = options.mode ?? 'standard';
    this.mapDefinition = options.map ?? DEFAULT_MAP;
    this.onMainMenu = options.onMainMenu;
    this.waves.setMaxWave(this.mode === 'standard' ? STANDARD_MAX_WAVE : null);
    const saveData = this.saves.load();
    audioManager.applySettings(saveData.settings);
    audioManager.playMusic('run-ambient');
    this.state.autoStartEnabled = saveData.settings.autoStart;
    this.root = new Container();
    this.worldRoot = new Container();
    this.mapLayer = new Container();
    this.effectsLayer = new Container();
    this.towersLayer = new Container();
    this.enemiesLayer = new Container();
    this.projectilesLayer = new Container();
    this.particlesLayer = new Container();
    this.overlayLayer = new Container();
    this.uiLayer = new Container();

    this.worldRoot.addChild(
      this.mapLayer,
      this.effectsLayer,
      this.overlayLayer,
      this.towersLayer,
      this.enemiesLayer,
      this.projectilesLayer,
      this.particlesLayer
    );
    this.root.addChild(this.worldRoot, this.uiLayer);

    this.map = new GameMap(this.mapDefinition);
    this.mapLayer.addChild(this.map.container);

    this.particles = new ParticleSystem();
    this.particles.setQuality(saveData.settings.quality);
    this.particlesLayer.addChild(this.particles.container);

    this.applyQualitySettings(saveData.settings.quality);

    /* placement ghost */
    this.ghost.visible = false;
    this.ghost.eventMode = 'none';
    this.ghost.addChild(this.ghostRange, this.ghostBody);
    this.overlayLayer.addChild(this.ghost);
    this.overlayLayer.addChild(this.rangePreview);

    /* UI */
    this.hud = new HUD();
    this.towerBar = new TowerBar({
      onSelect: (t) => this.setSelectedType(t),
      onStartWave: () => this.requestStartWave(),
      onPauseToggle: () => this.togglePause(),
      onSpeedToggle: () => this.toggleSpeed(),
      onAutoStartToggle: () => this.toggleAutoStart(),
      onRestart: () => this.restart()
    });
    this.sidePanel = new SidePanel({
      onUpgrade: (path) => this.tryUpgradeSelected(path),
      onTargetingChange: (mode) => this.setSelectedTargetingMode(mode),
      onSell: () => this.sellSelectedTower()
    });
    this.uiLayer.addChild(this.hud.container, this.towerBar.container, this.sidePanel.container);
    if (import.meta.env.DEV) {
      this.devTools = new DevToolsOverlay({
        addMemory: (amount) => this.devAddMemory(amount),
        healCore: () => this.devHealCore(),
        damageCore: (amount) => this.devDamageCore(amount),
        jumpToWave: (wave) => this.devJumpToWave(wave),
        spawnEnemy: (kind) => this.devSpawnEnemy(kind),
        killAllEnemies: () => this.devKillAllEnemies(),
        logRunStats: () => this.devLogRunStats(),
        snapshot: () => this.devSnapshot()
      });
      this.uiLayer.addChild(this.devTools.container);
    }

    if (!saveData.tutorialCompleted) {
      this.state.autoStartEnabled = false;
      this.tutorial = new TutorialManager(this.saves);
      this.uiLayer.addChild(this.tutorial.container);
      this.tutorial.start();
    }

    this.attachInput();
    this.app.stage.addChild(this.root);

    this.refreshSidePanel();
    this.refreshUi();
    this.app.ticker.add(this.tick);
  }

  private applyQualitySettings(quality: QualitySetting): void {
    this.particles.setQuality(quality);
    if (quality === 'low') {
      this.enemiesLayer.filters = [];
      this.towersLayer.filters = [];
      this.projectilesLayer.filters = [];
      this.particlesLayer.filters = [];
      return;
    }
    const glowQuality = quality === 'high' ? 0.35 : 0.2;
    const glowMul = quality === 'high' ? 1.35 : 1;
    this.enemiesLayer.filters = [new GlowFilter({ distance: 8 * glowMul, outerStrength: 1.4 * glowMul, innerStrength: 0, color: 0xffffff, quality: glowQuality })];
    this.towersLayer.filters = [new GlowFilter({ distance: 10 * glowMul, outerStrength: 1.2 * glowMul, innerStrength: 0, color: 0xffffff, quality: glowQuality })];
    this.projectilesLayer.filters = [new GlowFilter({ distance: 8 * glowMul, outerStrength: 1.6 * glowMul, innerStrength: 0, color: 0xffffff, quality: glowQuality })];
    this.particlesLayer.filters = [new GlowFilter({ distance: 6 * glowMul, outerStrength: 1.2 * glowMul, innerStrength: 0, color: 0xffffff, quality: quality === 'high' ? 0.25 : 0.15 })];
  }

  destroy(): void {
    this.app.ticker.remove(this.tick);
    this.detachInput();
    this.app.stage.removeChild(this.root);
    this.devTools = null;
    this.tutorial = null;
    this.root.destroy({ children: true });
  }

  /* ----------------------------- input ---------------------------- */

  private attachInput() {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = { contains: () => true } as any;
    this.app.stage.on('pointermove', this.handlePointerMove);
    this.app.stage.on('pointerdown', this.handlePointerDown);
    this.app.stage.on('rightdown', this.handleRightDown);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('contextmenu', this.handleContextMenu);
  }

  private detachInput() {
    this.app.stage.off('pointermove', this.handlePointerMove);
    this.app.stage.off('pointerdown', this.handlePointerDown);
    this.app.stage.off('rightdown', this.handleRightDown);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private onPointerMove(e: FederatedPointerEvent) {
    const p = e.global;
    this.pointer.x = p.x; this.pointer.y = p.y;
    this.updateHoverCell();
  }

  private onPointerDown(e: FederatedPointerEvent) {
    if (this.state.defeat || this.state.victory) return;
    const p = e.global;
    const inField = p.x >= FIELD.x && p.x < FIELD.x + FIELD.width &&
                    p.y >= FIELD.y && p.y < FIELD.y + FIELD.height;
    if (!inField) return;

    if (this.selectedTowerType) {
      this.tryPlace(p.x, p.y);
      return;
    }

    // attempt to select existing tower
    const tower = this.findTowerAt(p.x, p.y);
    if (tower) {
      this.selectTower(tower);
    } else {
      this.deselectTower();
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Escape') {
      this.cancelPlacement();
      this.deselectTower();
    } else if (e.code === 'Space') {
      e.preventDefault();
      this.requestStartWave();
    } else if (e.code === 'KeyP') {
      this.togglePause();
    } else if (e.code === 'KeyF') {
      this.toggleSpeed();
    } else if (e.code === 'KeyR' && (this.state.defeat || this.state.victory)) {
      this.restart();
    } else if (e.code.startsWith('Digit')) {
      const index = Number(e.code.slice(5)) - 1;
      if (index >= 0 && index < EMOTION_TYPES.length) this.setSelectedType(EMOTION_TYPES[index]);
    }
  }

  /* --------------------------- placement -------------------------- */

  private setSelectedType(t: EmotionType | null) {
    if (t && TOWER_STATS[t].cost > this.state.memory) {
      // still allow toggling, but ghost will show invalid
    }
    this.selectedTowerType = t;
    this.deselectTower();
    this.towerBar.setSelected(t);
    if (t) {
      this.tutorial?.onEmotionSelected(t);
      this.buildGhost(t);
      this.refreshSidePanel();
    } else {
      this.ghost.visible = false;
      this.refreshSidePanel();
    }
  }

  private buildGhost(type: EmotionType) {
    this.ghostBody.clear();
    this.ghostRange.clear();
    const c = EMOTION_COLOR[type];
    const stats = TOWER_STATS[type];
    this.ghostBody.regularPoly(0, 0, 18, 6, 0).fill({ color: c, alpha: 0.25 });
    this.ghostBody.regularPoly(0, 0, 18, 6, 0).stroke({ color: c, width: 2, alpha: 0.95 });
    this.ghostBody.circle(0, 0, 8).fill({ color: 0x0a0f1a, alpha: 1 }).stroke({ color: c, width: 2, alpha: 1 });
    this.ghostRange.circle(0, 0, stats.range).fill({ color: c, alpha: 0.05 });
    this.ghostRange.circle(0, 0, stats.range).stroke({ color: c, width: 1.2, alpha: 0.5 });
    this.ghost.visible = true;
  }

  private cancelPlacement() {
    if (!this.selectedTowerType) return;
    this.selectedTowerType = null;
    this.ghost.visible = false;
    this.towerBar.setSelected(null);
    this.refreshSidePanel();
  }

  private updateHoverCell() {
    const cell = this.map.worldToCell(this.pointer.x, this.pointer.y);
    if (!cell) {
      this.hoveredCell = null;
      this.ghost.visible = false;
      return;
    }
    this.hoveredCell = cell;
    if (this.selectedTowerType) {
      const center = this.map.cellCenter(cell.cx, cell.cy);
      const ok = this.map.isPlaceable(cell.cx, cell.cy) &&
                 this.state.memory >= TOWER_STATS[this.selectedTowerType].cost;
      this.ghost.position.set(center.x, center.y);
      this.ghost.alpha = ok ? 1 : 0.55;
      this.ghostBody.tint = ok ? 0xffffff : 0xff5577;
      this.ghostRange.tint = ok ? 0xffffff : 0xff5577;
      this.ghost.visible = true;
    }
  }

  private tryPlace(_wx: number, _wy: number) {
    if (!this.selectedTowerType || !this.hoveredCell) return;
    const { cx, cy } = this.hoveredCell;
    if (!this.map.isPlaceable(cx, cy)) {
      this.showStatusNotice('Invalid build space');
      this.fizzle();
      return;
    }
    const cost = TOWER_STATS[this.selectedTowerType].cost;
    if (this.state.memory < cost) {
      this.showStatusNotice('Not enough Memory');
      this.fizzle();
      return;
    }
    const center = this.map.cellCenter(cx, cy);
    const tower = new Tower(this.selectedTowerType, cx, cy, center.x, center.y);
    tower.container.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.selectTower(tower);
    });
    tower.container.on('pointerover', () => { tower.hovered = true; });
    tower.container.on('pointerout',  () => { tower.hovered = false; });
    this.towers.push(tower);
    this.runStats.recordTowerBuilt(tower.type);
    this.towersLayer.addChild(tower.container);
    this.map.occupy(cx, cy);
    this.balance.add(this.selectedTowerType);
    this.refreshSynergies();
    this.spendMemory(cost);
    this.applyBalanceModifiers();
    audioManager.playSfx('tower-place');
    this.tutorial?.onTowerPlaced(tower.type, this.towers.length);

    // place flourish
    const c = EMOTION_COLOR[this.selectedTowerType];
    this.particles.ring(center.x, center.y, { color: c, startRadius: 6, endRadius: 50, duration: 0.5, thickness: 2 });
    this.particles.burst(center.x, center.y, {
      count: 12, color: c, speedMin: 60, speedMax: 200,
      sizeMin: 1, sizeMax: 2.5, lifeMin: 0.3, lifeMax: 0.6, drag: 3
    });

    this.towerBar.setAffordability(this.state.memory);
    if (this.state.memory < cost) this.cancelPlacement();
  }

  private fizzle() {
    if (!this.hoveredCell) return;
    const c = this.map.cellCenter(this.hoveredCell.cx, this.hoveredCell.cy);
    this.particles.burst(c.x, c.y, {
      count: 8, color: 0xff5577, speedMin: 40, speedMax: 120,
      sizeMin: 1, sizeMax: 2, lifeMin: 0.2, lifeMax: 0.4, drag: 4
    });
  }

  private selectTower(t: Tower) {
    if (this.selectedTower) {
      this.selectedTower.selected = false;
      this.selectedTower.drawRange(false);
    }
    this.selectedTower = t;
    t.selected = true;
    t.drawRange(true);
    this.cancelPlacement();
    this.sidePanel.showSelectedTower(t, this.state.memory);
    this.tutorial?.onBuiltTowerSelected(t.type);
  }

  private deselectTower() {
    if (this.selectedTower) {
      this.selectedTower.selected = false;
      this.selectedTower.drawRange(false);
      this.selectedTower = null;
      this.refreshSidePanel();
    }
  }

  private tryUpgradeSelected(path: UpgradePath) {
    const tower = this.selectedTower;
    if (!tower) return;
    const cost = tower.nextUpgradeCost(path);
    if (cost === null || this.state.memory < cost) {
      this.showStatusNotice(cost === null ? 'Upgrade path locked' : 'Not enough Memory');
      this.particles.burst(tower.x, tower.y, {
        count: 8, color: 0xff5577, speedMin: 40, speedMax: 120,
        sizeMin: 1, sizeMax: 2, lifeMin: 0.2, lifeMax: 0.4, drag: 4
      });
      this.refreshSidePanel();
      return;
    }
    if (!tower.upgrade(path)) return;
    this.runStats.recordUpgradePurchased();
    audioManager.playSfx('tower-upgrade');
    this.tutorial?.onTowerUpgraded(path);
    this.spendMemory(cost);
    this.addCombatNotice(tower.x, tower.y - 30, 'UPGRADE', EMOTION_COLOR[tower.type], 1.0);
    const c = EMOTION_COLOR[tower.type];
    this.particles.ring(tower.x, tower.y, { color: c, startRadius: 18, endRadius: 72, duration: 0.55, thickness: 2.5 });
    this.particles.burst(tower.x, tower.y, {
      count: 18, color: c, speedMin: 70, speedMax: 220,
      sizeMin: 1.2, sizeMax: 3, lifeMin: 0.28, lifeMax: 0.62, drag: 3, shape: 'spark'
    });
    this.refreshSidePanel();
  }

  private setSelectedTargetingMode(mode: TargetingMode) {
    if (!this.selectedTower) return;
    this.selectedTower.setTargetingMode(mode);
    audioManager.playSfx('ui-click');
    this.refreshSidePanel();
  }

  private sellSelectedTower() {
    const tower = this.selectedTower;
    if (!tower) return;
    const refund = tower.sellValue();
    this.map.release(tower.cx, tower.cy);
    this.balance.remove(tower.type);
    this.towersLayer.removeChild(tower.container);
    this.towers = this.towers.filter((candidate) => candidate !== tower);
    this.runStats.recordTowerSold();
    tower.destroy();
    this.selectedTower = null;
    this.gainMemory(refund, false);
    this.refreshSynergies();
    this.showStatusNotice(`Tower sold: +${refund} Memory`, 1.3);
    audioManager.playSfx('tower-sell');
    this.refreshSidePanel();
    this.refreshUi();
  }

  private findTowerAt(wx: number, wy: number): Tower | null {
    let best: Tower | null = null;
    let bestD = 24 * 24;
    for (const t of this.towers) {
      const dx = t.x - wx, dy = t.y - wy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = t; }
    }
    return best;
  }

  /* ------------------------------ tick ----------------------------- */

  private tick = (ticker: Ticker) => {
    const rawDt = Math.min(0.05, ticker.deltaMS / 1000);
    this.updateStatusNotice(rawDt);
    if (this.state.paused || this.state.defeat) {
      this.refreshUi();
      this.devTools?.update(rawDt);
      return;
    }
    const dt = rawDt * this.state.speedMultiplier;
    this.update(dt);
    this.devTools?.update(rawDt);
  };

  private update(dt: number) {
    if (this.state.bossIntroTimer > 0) {
      this.map.update(dt);
      this.updateBossIntro(dt);
      this.particles.update(dt);
      this.updateCombatNotices(dt);
      this.refreshUi();
      return;
    }

    this.refreshSynergies();
    this.map.update(dt);

    /* spawn from wave */
    if (!this.state.betweenWaves) {
      const spawns = this.waves.tick(dt);
      for (const s of spawns) this.spawnEnemy(s.kind, s.hpScale);
    } else if (this.state.autoStartEnabled && this.state.autoStartIn > 0) {
      this.state.autoStartIn = Math.max(0, this.state.autoStartIn - dt);
      if (this.state.autoStartIn <= 0 && this.waves.nextDef()) this.startNextWave();
    }

    /* enemies */
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.map.path, this.particles);
      const periodicDamage = e.consumeUnreportedDamage();
      if (periodicDamage) this.runStats.recordDamage(periodicDamage.source, periodicDamage.amount);

      if (this.waves.active && e.consumeSpawn(dt)) {
        // boss spawns
        const child = new Enemy(this.waves.current >= 20 && Math.random() < 0.35 ? EnemyKind.EnvyLeech : EnemyKind.Doubtling, 1.0 + this.waves.current * 0.025);
        child.traveled = e.traveled - 30; // just behind boss
        this.enemies.push(child);
        this.enemiesLayer.addChild(child.container);
      }

      if (e.consumeSplit()) {
        this.spawnOverthinkerChildren(e);
      }

      if (e.reachedCore) {
        this.coreHit(e.damage);
        this.removeEnemy(e, false);
        continue;
      }
      if (!e.alive && !e.rewarded) {
        e.rewarded = true;
        this.runStats.recordKill(e.kind, e.bounty, this.waves.current);
        this.gainMemory(e.bounty);
        this.addCombatNotice(e.x, e.y - e.radius - 10, `+${e.bounty}`, 0xffd166, 0.9);
        if (e.kind === EnemyKind.ShameSwarm) this.triggerShamePulse(e);
        e.spawnDeathParticles(this.particles);
        if (isBossKind(e.kind)) this.shake(1.2);
        this.removeEnemy(e, true);
      }
    }

    this.updateSpiralDisruption(dt);
    this.updateMaskResistance(dt);
    this.updateBurnoutOverheat(dt);
    this.updateEnvyLeeches(dt);
    this.updateLowStabilityWarning(dt);
    this.runStats.updateResonance(dt, this.balance.isResonating());

    /* towers */
    const globalRateMul = this.balance.fireRateMul() * (this.balanceDisruption > 0 ? 1.08 : 1);
    for (const t of this.towers) {
      t.setSynergyModifiers(this.synergies.modifiersFor(t.type));
      t.applyTowerAuras(this.towers, globalRateMul * this.overheatMulForTower(t));
      const specials = t.getSpecialStats();
      let damageMul = this.balance.damageMulFor(t.type);
      if (this.balance.isResonating()) damageMul *= specials.resonanceDamageMul;
      if (this.balanceDisruption > 0) damageMul *= 0.9;
      damageMul *= t.loveDamageMulFrom(this.towers);
      damageMul *= t.prideIsolationMulFrom(this.towers);
      t.setDamageMul(damageMul);
      t.update(dt, this.enemies, this.particles, (p) => this.spawnProjectile(p));
    }

    /* projectiles */
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(
        dt,
        this.enemies,
        this.particles,
        (target, packet, _proj) => this.applyDamage(target, packet),
        (x, y, spec, source) => this.spawnGroundEffect(x, y, spec, source)
      );
      if (!p.alive) {
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    this.updateGroundEffects(dt);
    this.updateOverheatZones(dt);

    /* particles */
    this.particles.update(dt);
    this.updateCombatNotices(dt);

    /* wave-end check */
    if (this.waves.active && this.waves.isSpawningDone() && this.enemies.length === 0) {
      this.completeWave();
    }

    /* shake */
    if (this.state.shake > 0) {
      this.state.shake = Math.max(0, this.state.shake - dt * 4);
      const s = this.state.shake;
      this.worldRoot.x = (Math.random() - 0.5) * s * 6;
      this.worldRoot.y = (Math.random() - 0.5) * s * 6;
    } else {
      this.worldRoot.x = 0; this.worldRoot.y = 0;
    }

    this.refreshUi();
  }

  /* ------------------------------------------------------------------ */

  private devAddMemory(amount: number): void {
    this.gainMemory(amount, false);
    this.showStatusNotice(`DEV +${amount} Memory`, 0.9);
  }

  private devHealCore(): void {
    this.state.stability = ECONOMY.startingStability;
    this.state.coreShield = 0;
    this.map.redrawCore(1);
    this.showStatusNotice('DEV Core healed', 0.9);
    this.refreshUi();
  }

  private devDamageCore(amount: number): void {
    this.coreHit(amount);
    this.showStatusNotice(`DEV Core -${amount}`, 0.9);
  }

  private devJumpToWave(wave: number): void {
    this.clearActiveEnemiesAndProjectiles();
    this.hideVictoryOverlay();
    this.hidePauseOverlay();
    this.state.defeat = false;
    this.state.victory = false;
    this.state.paused = false;
    this.state.betweenWaves = false;
    this.state.autoStartIn = AUTO_START_SECONDS;
    this.waves.setMaxWave(null);
    this.waves.start(Math.max(1, Math.floor(wave)));
    this.showStatusNotice(`DEV Wave ${this.waves.current}`, 1.1);
    this.refreshSidePanel();
    this.refreshUi();
  }

  private devSpawnEnemy(kind: EnemyKind): void {
    this.spawnEnemy(kind, 1);
    this.showStatusNotice(`DEV Spawn ${kind}`, 0.9);
  }

  private devKillAllEnemies(): void {
    this.clearActiveEnemiesAndProjectiles();
    this.showStatusNotice('DEV Enemies cleared', 0.9);
    this.refreshUi();
  }

  private devLogRunStats(): void {
    console.info('[EMOTICORE TD] RunStats', JSON.stringify(this.runStats.toJson(), null, 2));
    this.showStatusNotice('DEV RunStats logged', 0.9);
  }

  private devSnapshot(): DevToolsSnapshot {
    return {
      wave: this.waves.current,
      memory: this.state.memory,
      stability: this.state.stability,
      maxStability: ECONOMY.startingStability,
      enemies: this.enemies.length,
      towers: this.towers.length,
      projectiles: this.projectiles.length,
      score: this.runStats.score
    };
  }

  private clearActiveEnemiesAndProjectiles(): void {
    for (const e of this.enemies) {
      this.enemiesLayer.removeChild(e.container);
      e.destroy();
    }
    for (const p of this.projectiles) {
      this.projectilesLayer.removeChild(p.container);
      p.destroy();
    }
    this.enemies = [];
    this.projectiles = [];
  }

  private spawnEnemy(kind: EnemyKind, hpScale = 1) {
    const e = new Enemy(kind, hpScale);
    this.enemies.push(e);
    this.enemiesLayer.addChild(e.container);
  }

  private spawnOverthinkerChildren(source: Enemy) {
    const count = this.waves.current >= 28 ? 3 : 2;
    for (let n = 0; n < count; n++) {
      const kind = this.waves.current >= 25 && n === count - 1 ? EnemyKind.ShameSwarm : EnemyKind.Doubtling;
      const child = new Enemy(kind, 0.82 + this.waves.current * 0.018);
      child.traveled = Math.max(0, source.traveled - 28 - n * 14);
      this.enemies.push(child);
      this.enemiesLayer.addChild(child.container);
    }
    this.showStatusNotice('Overthinker split into smaller thoughts', 1.3);
    this.shake(0.25);
  }

  private removeEnemy(e: Enemy, _killed: boolean) {
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
    this.enemiesLayer.removeChild(e.container);
    e.destroy();
  }

  private spawnProjectile(p: Projectile) {
    this.projectiles.push(p);
    this.projectilesLayer.addChild(p.container);
  }

  private applyDamage(target: Enemy, packet: DamagePacket) {
    const adjusted = { ...packet };
    if (adjusted.shameGroupRadius !== undefined && adjusted.shameGroupDamageMul !== undefined) {
      const r2 = adjusted.shameGroupRadius * adjusted.shameGroupRadius;
      let packed = 0;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.x - target.x;
        const dy = e.y - target.y;
        if (dx * dx + dy * dy <= r2) packed++;
      }
      if (packed >= 3) adjusted.amount *= adjusted.shameGroupDamageMul;
    }
    if (target.kind === EnemyKind.Mask && this.maskResistEmotion === adjusted.source && this.maskResistTimer > 0) {
      adjusted.amount *= 0.42;
      if (Math.random() < 0.18) {
        this.particles.ring(target.x, target.y, { color: EMOTION_COLOR[adjusted.source], startRadius: 10, endRadius: 42, duration: 0.25, thickness: 2, alpha: 0.55 });
      }
    }
    const before = target.hp;
    target.takeDamage(adjusted);
    const dealt = Math.max(0, before - Math.max(0, target.hp));
    this.runStats.recordDamage(adjusted.source, dealt);
    if (adjusted.coreShield !== undefined && dealt > 0) {
      const bonus = adjusted.source === EmotionType.Trust && (target.kind === EnemyKind.PanicRunner || target.kind === EnemyKind.VoidWraith) ? 1.65 : 1;
      this.state.coreShield = Math.min(8, this.state.coreShield + adjusted.coreShield * bonus);
    }
    if (dealt >= 1) {
      this.addCombatNotice(target.x, target.y - target.radius - 12, `-${Math.round(dealt)}`, EMOTION_COLOR[adjusted.source], 0.55);
    }
  }

  private spawnGroundEffect(x: number, y: number, spec: BurnGroundSpec, source: EmotionType) {
    const gfx = new Graphics();
    const effect: GroundEffect = {
      x, y,
      radius: spec.radius,
      dps: spec.dps,
      source,
      duration: spec.duration,
      remaining: spec.duration,
      tick: GROUND_TICK_SECONDS,
      gfx
    };
    this.effectsLayer.addChild(gfx);
    this.groundEffects.push(effect);
    this.drawGroundEffect(effect);
  }

  private updateGroundEffects(dt: number) {
    for (let i = this.groundEffects.length - 1; i >= 0; i--) {
      const effect = this.groundEffects[i];
      effect.remaining -= dt;
      effect.tick -= dt;
      if (effect.tick <= 0) {
        effect.tick += GROUND_TICK_SECONDS;
        const amount = effect.dps * GROUND_TICK_SECONDS;
        const r2 = effect.radius * effect.radius;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const dx = e.x - effect.x;
          const dy = e.y - effect.y;
          if (dx * dx + dy * dy <= r2) {
            this.applyDamage(e, { amount, source: effect.source });
          }
        }
      }
      if (effect.remaining <= 0) {
        this.effectsLayer.removeChild(effect.gfx);
        effect.gfx.destroy();
        this.groundEffects.splice(i, 1);
      } else {
        this.drawGroundEffect(effect);
      }
    }
  }

  private drawGroundEffect(effect: GroundEffect) {
    const t = 1 - effect.remaining / effect.duration;
    const c = EMOTION_COLOR[effect.source];
    const g = effect.gfx;
    g.clear();
    g.circle(effect.x, effect.y, effect.radius).fill({ color: c, alpha: 0.08 + (1 - t) * 0.08 });
    g.circle(effect.x, effect.y, effect.radius * (0.55 + 0.45 * t)).stroke({ color: c, width: 2, alpha: 0.35 * (1 - t) });
    g.circle(effect.x, effect.y, effect.radius).stroke({ color: 0xffd166, width: 1.4, alpha: 0.45 * (1 - t) });
  }

  private spawnOverheatZone(x: number, y: number): void {
    const gfx = new Graphics();
    const zone: OverheatZone = { x, y, radius: 86, duration: 5.5, remaining: 5.5, gfx };
    this.effectsLayer.addChild(gfx);
    this.overheatZones.push(zone);
    this.drawOverheatZone(zone);
  }

  private updateOverheatZones(dt: number): void {
    for (let i = this.overheatZones.length - 1; i >= 0; i--) {
      const zone = this.overheatZones[i];
      zone.remaining -= dt;
      if (zone.remaining <= 0) {
        this.effectsLayer.removeChild(zone.gfx);
        zone.gfx.destroy();
        this.overheatZones.splice(i, 1);
      } else {
        this.drawOverheatZone(zone);
      }
    }
  }

  private drawOverheatZone(zone: OverheatZone): void {
    const t = 1 - zone.remaining / zone.duration;
    const g = zone.gfx;
    g.clear();
    g.circle(zone.x, zone.y, zone.radius).fill({ color: 0xff5b3a, alpha: 0.09 + (1 - t) * 0.06 });
    g.circle(zone.x, zone.y, zone.radius * (0.45 + 0.55 * t)).stroke({ color: 0xffd166, width: 2, alpha: 0.42 * (1 - t) });
    g.circle(zone.x, zone.y, zone.radius).stroke({ color: 0xff5b3a, width: 1.6, alpha: 0.58 * (1 - t) });
  }

  private overheatMulForTower(tower: Tower): number {
    for (const zone of this.overheatZones) {
      const dx = tower.x - zone.x;
      const dy = tower.y - zone.y;
      if (dx * dx + dy * dy <= zone.radius * zone.radius) return 1.32;
    }
    return 1;
  }

  private coreHit(amount: number) {
    if (this.state.coreShield > 0) {
      const absorbed = Math.min(amount, Math.floor(this.state.coreShield));
      if (absorbed > 0) {
        amount -= absorbed;
        this.state.coreShield = Math.max(0, this.state.coreShield - absorbed);
        this.addCombatNotice(this.map.corePos.x, this.map.corePos.y - 64, `-${absorbed} SHIELDED`, EMOTION_COLOR[EmotionType.Trust], 1.0);
        this.particles.ring(this.map.corePos.x, this.map.corePos.y, {
          color: EMOTION_COLOR[EmotionType.Trust], startRadius: 18, endRadius: 78, duration: 0.45, thickness: 2.5
        });
      }
    }
    if (amount <= 0) return;
    this.runStats.recordCoreDamage(amount);
    this.state.stability = Math.max(0, this.state.stability - amount);
    this.shake(amount * 0.5);
    this.particles.burst(this.map.corePos.x, this.map.corePos.y, {
      count: 22, color: 0xff5577,
      speedMin: 80, speedMax: 320,
      sizeMin: 1.5, sizeMax: 3.5,
      lifeMin: 0.4, lifeMax: 0.8, drag: 3
    });
    this.particles.ring(this.map.corePos.x, this.map.corePos.y, {
      color: 0xff5577, startRadius: 24, endRadius: 90, duration: 0.5, thickness: 3
    });
    audioManager.playSfx('core-hit');
    this.map.redrawCore(this.state.stability / ECONOMY.startingStability);
    this.addCombatNotice(this.map.corePos.x, this.map.corePos.y - 46, `-${amount} STABILITY`, 0xff5577, 1.0);
    if (this.state.stability <= 0) this.lose();
  }

  private gainMemory(amount: number, countStats = true) {
    this.state.memory += amount;
    if (countStats) this.runStats.recordMemoryEarned(amount);
    this.refreshEconomyUi();
  }

  private spendMemory(amount: number) {
    this.state.memory = Math.max(0, this.state.memory - amount);
    this.refreshEconomyUi();
  }

  private refreshEconomyUi() {
    this.towerBar.setAffordability(this.state.memory);
    if (this.selectedTower || this.selectedTowerType) this.refreshSidePanel();
  }

  private requestStartWave() {
    if (this.state.victory) return;
    if (this.state.paused) this.state.paused = false;
    if (!this.state.betweenWaves) return;
    const def = this.waves.nextDef();
    if (!def) return;
    this.startNextWave();
  }

  private startNextWave() {
    if (this.state.victory) return;
    const next = this.waves.current + 1;
    const def = this.waves.nextDef();
    if (!def) return;
    if (def.isBoss) {
      this.showBossIntro(next, ENEMY_STATS[bossKindForWave(next)].label.toUpperCase());
      return;
    }
    this.beginWave(next, false);
  }

  private showBossIntro(wave: number, bossName: string): void {
    if (this.bossIntroOverlay) return;
    this.bossIntroWave = wave;
    this.state.bossIntroTimer = 2.45;
    this.state.autoStartIn = AUTO_START_SECONDS;
    audioManager.playSfx('ui-click');

    const overlay = new Container();
    overlay.label = 'boss-intro-overlay';
    overlay.eventMode = 'none';

    const tint = new Graphics();
    tint.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: 0x020409, alpha: 0.72 });

    const ring = new Graphics();
    ring.label = 'boss-intro-ring';
    ring.position.set(CANVAS.width / 2 - CANVAS.rightPanelWidth / 2, CANVAS.height / 2);

    const waveText = makeLabel(`WAVE ${wave}  /  BOSS`, { fontSize: 12, letterSpacing: 4, fill: COLORS.warn });
    waveText.anchor.set(0.5);
    waveText.position.set(CANVAS.width / 2 - CANVAS.rightPanelWidth / 2, CANVAS.height / 2 - 86);

    const name = makeHeadline(bossName, {
      fontSize: 48,
      fontWeight: '900',
      letterSpacing: 8,
      fill: 0xff5577,
      stroke: { color: 0x05070d, width: 5 }
    });
    name.anchor.set(0.5);
    name.position.set(CANVAS.width / 2 - CANVAS.rightPanelWidth / 2, CANVAS.height / 2 - 24);
    name.label = 'boss-intro-name';

    const sub = makeText('EMOTIONAL COLLAPSE DETECTED', { fontSize: 12, fontWeight: '700', letterSpacing: 3, fill: 0x6cf0ff });
    sub.anchor.set(0.5);
    sub.position.set(CANVAS.width / 2 - CANVAS.rightPanelWidth / 2, CANVAS.height / 2 + 38);
    sub.label = 'boss-intro-sub';

    overlay.addChild(tint, ring, waveText, name, sub);
    this.bossIntroOverlay = overlay;
    this.uiLayer.addChild(overlay);
    this.shake(0.8);
  }

  private updateBossIntro(dt: number): void {
    if (!this.bossIntroOverlay || this.bossIntroWave === null) return;
    this.state.bossIntroTimer = Math.max(0, this.state.bossIntroTimer - dt);
    const total = 2.45;
    const elapsed = total - this.state.bossIntroTimer;
    const centerX = CANVAS.width / 2 - CANVAS.rightPanelWidth / 2;
    const centerY = CANVAS.height / 2;
    const ring = this.bossIntroOverlay.getChildByLabel('boss-intro-ring') as Graphics | null;
    const name = this.bossIntroOverlay.getChildByLabel('boss-intro-name') as Text | null;
    const sub = this.bossIntroOverlay.getChildByLabel('boss-intro-sub') as Text | null;
    if (ring) {
      ring.clear();
      for (let i = 0; i < 4; i++) {
        const t = (elapsed * 0.75 + i * 0.18) % 1;
        ring.circle(0, 0, 36 + t * 180).stroke({ color: i % 2 === 0 ? 0xff5577 : 0x6cf0ff, width: 3 - t * 2, alpha: (1 - t) * 0.7 });
      }
      for (let i = 0; i < 12; i++) {
        const a = i * (Math.PI * 2 / 12) + elapsed * 2.6;
        const r = 78 + Math.sin(elapsed * 8 + i) * 8;
        ring.moveTo(Math.cos(a) * r, Math.sin(a) * r)
          .lineTo(Math.cos(a) * (r + 24), Math.sin(a) * (r + 24))
          .stroke({ color: 0xff5577, width: 2, alpha: 0.46 });
      }
    }
    if (name) {
      name.x = centerX + (Math.random() - 0.5) * (elapsed < 1.9 ? 10 : 3);
      name.y = centerY - 24 + Math.sin(elapsed * 10) * 2;
      name.alpha = Math.min(1, elapsed * 2.2) * Math.min(1, this.state.bossIntroTimer * 2.5);
      name.scale.set(0.88 + Math.min(1, elapsed * 2.2) * 0.12);
    }
    if (sub) sub.alpha = 0.55 + Math.sin(elapsed * 14) * 0.25;
    if (Math.random() < 0.35) {
      this.particles.trail(centerX + (Math.random() - 0.5) * 320, centerY + (Math.random() - 0.5) * 160, Math.random() < 0.5 ? 0xff5577 : 0x6cf0ff, 2.4);
    }
    if (this.state.bossIntroTimer <= 0) {
      this.uiLayer.removeChild(this.bossIntroOverlay);
      this.bossIntroOverlay.destroy({ children: true });
      this.bossIntroOverlay = null;
      const wave = this.bossIntroWave;
      this.bossIntroWave = null;
      this.beginWave(wave, true);
    }
  }

  private beginWave(next: number, boss: boolean) {
    this.waves.start(next);
    audioManager.playSfx('wave-start');
    this.tutorial?.onWaveStarted();
    this.state.betweenWaves = false;
    this.state.autoStartIn = AUTO_START_SECONDS;
    if (boss) this.showStatusNotice('BOSS WAVE INCOMING', 2.5);
    this.refreshSidePanel();
  }

  private completeWave() {
    this.waves.endWave();
    const def = this.waves.currentDef();
    const bonus = (def?.bonusMemory ?? 0) + ECONOMY.waveCompleteBonus;
    const interest = Math.floor(this.state.memory * ECONOMY.interestPerWave);
    this.gainMemory(bonus + interest);
    this.runStats.recordWaveComplete(this.waves.current, !!def?.isBoss);
    this.restoreStabilityFromCalm();
    this.state.betweenWaves = true;
    this.state.autoStartIn = AUTO_START_SECONDS;
    this.showStatusNotice(`Wave ${this.waves.current} complete: +${bonus + interest} Memory`, 1.8);
    audioManager.playSfx('wave-complete');
    if (this.mode === 'standard' && this.waves.isLast()) {
      this.win();
      return;
    }
    this.refreshSidePanel();
  }

  private applyBalanceModifiers() {
    /* nothing right now — towers query balance each frame */
  }

  private triggerShamePulse(source: Enemy) {
    const radius = 86;
    let affected = 0;
    for (const e of this.enemies) {
      if (!e.alive || e === source) continue;
      const dx = e.x - source.x;
      const dy = e.y - source.y;
      if (dx * dx + dy * dy <= radius * radius) {
        e.applySpeedBoost(1.18, 1.45);
        affected++;
      }
    }
    if (affected > 0) {
      this.showStatusNotice(`Shame pulse hastened ${affected} enemies`, 1.2);
      this.particles.ring(source.x, source.y, {
        color: 0xff77ff, startRadius: 8, endRadius: radius, duration: 0.35, thickness: 2, alpha: 0.8
      });
    }
  }

  private updateSpiralDisruption(dt: number) {
    if (this.balanceDisruption > 0) {
      this.balanceDisruption = Math.max(0, this.balanceDisruption - dt);
    }
    const spiral = this.enemies.find(e => e.kind === EnemyKind.Spiral && e.alive);
    if (!this.waves.active || !spiral) {
      this.spiralPulseTimer = 5;
      this.balanceDisruption = 0;
      return;
    }
    this.spiralPulseTimer -= dt;
    if (this.spiralPulseTimer > 0) return;
    this.spiralPulseTimer = 7.5;
    this.balanceDisruption = 3.4;
    this.showStatusNotice('SPIRAL DISRUPTION: tower damage reduced', 1.8);
    this.shake(0.7);
    this.particles.ring(spiral.x, spiral.y, {
      color: 0xff5577, startRadius: 28, endRadius: 150, duration: 0.8, thickness: 3
    });
    this.particles.burst(spiral.x, spiral.y, {
      count: 34, color: 0xb070ff, speedMin: 40, speedMax: 180,
      sizeMin: 1.2, sizeMax: 3.2, lifeMin: 0.35, lifeMax: 0.8, drag: 2.5, shape: 'shard'
    });
  }

  private updateMaskResistance(dt: number) {
    const mask = this.enemies.find(e => e.kind === EnemyKind.Mask && e.alive);
    if (!this.waves.active || !mask) {
      this.maskResistTimer = 0;
      this.maskResistEmotion = null;
      return;
    }
    this.maskResistTimer -= dt;
    if (this.maskResistTimer > 0 && this.maskResistEmotion) return;
    const top = this.runStats.summary().topDamageEmotion;
    if (!top) {
      this.maskResistTimer = 2.5;
      return;
    }
    this.maskResistEmotion = top;
    this.maskResistTimer = 5.8;
    this.showStatusNotice(`THE MASK resists ${top.toUpperCase()}`, 1.6);
    this.particles.ring(mask.x, mask.y, {
      color: EMOTION_COLOR[top], startRadius: 24, endRadius: 130, duration: 0.65, thickness: 3, alpha: 0.82
    });
  }

  private updateBurnoutOverheat(dt: number) {
    const burnout = this.enemies.find(e => e.kind === EnemyKind.BurnoutBoss && e.alive);
    if (!this.waves.active || !burnout) {
      this.burnoutZoneTimer = 4.5;
      return;
    }
    this.burnoutZoneTimer -= dt;
    if (this.burnoutZoneTimer > 0) return;
    this.burnoutZoneTimer = 5.8;
    const target = this.towers.length > 0
      ? this.towers[Math.floor(Math.random() * this.towers.length)]
      : null;
    const x = target ? target.x : burnout.x;
    const y = target ? target.y : burnout.y;
    this.spawnOverheatZone(x, y);
    this.showStatusNotice('THE BURNOUT creates an Overheat zone', 1.6);
    this.shake(0.45);
  }

  private updateEnvyLeeches(dt: number) {
    if (this.leechNoticeTimer > 0) this.leechNoticeTimer = Math.max(0, this.leechNoticeTimer - dt);
    for (const e of this.enemies) {
      if (!e.consumeLeechPulse(dt)) continue;
      let affected = 0;
      for (const t of this.towers) {
        if (t.type !== EmotionType.Calm) continue;
        const dx = t.x - e.x;
        const dy = t.y - e.y;
        if (dx * dx + dy * dy > 155 * 155) continue;
        t.suppressSupport(2.4);
        affected++;
        this.particles.trail((e.x + t.x) / 2, (e.y + t.y) / 2, 0x77ffaa, 3);
      }
      if (affected > 0) {
        this.particles.ring(e.x, e.y, { color: 0x77ffaa, startRadius: 8, endRadius: 82, duration: 0.45, thickness: 2, alpha: 0.75 });
        if (this.leechNoticeTimer <= 0) {
          this.showStatusNotice(`Envy siphoned ${affected} Calm aura${affected > 1 ? 's' : ''}`, 1.4);
          this.leechNoticeTimer = 2.2;
        }
      }
    }
  }

  private updateLowStabilityWarning(dt: number): void {
    const ratio = this.state.stability / ECONOMY.startingStability;
    if (ratio >= 0.35 || this.state.defeat || this.state.victory) {
      this.lowStabilityPulseTimer = 0;
      return;
    }
    this.lowStabilityPulseTimer -= dt;
    if (this.lowStabilityPulseTimer > 0) return;
    this.lowStabilityPulseTimer = ratio < 0.2 ? 0.55 : 0.9;
    this.particles.ring(this.map.corePos.x, this.map.corePos.y, {
      color: ratio < 0.2 ? COLORS.danger : COLORS.warn,
      startRadius: 34,
      endRadius: ratio < 0.2 ? 128 : 96,
      duration: 0.55,
      thickness: ratio < 0.2 ? 3 : 2,
      alpha: 0.72
    });
    if (ratio < 0.2) this.shake(0.18);
  }

  private restoreStabilityFromCalm() {
    if (this.state.stability <= 0) return;
    const restore = this.towers.reduce((sum, t) => sum + t.getSpecialStats().stabilityOnWaveComplete, 0);
    if (restore <= 0 || this.state.stability >= ECONOMY.startingStability) return;
    const before = this.state.stability;
    this.state.stability = Math.min(ECONOMY.startingStability, this.state.stability + restore);
    if (this.state.stability === before) return;
    this.map.redrawCore(this.state.stability / ECONOMY.startingStability);
    this.addCombatNotice(this.map.corePos.x, this.map.corePos.y - 46, `+${this.state.stability - before} STABILITY`, EMOTION_COLOR[EmotionType.Calm], 1.0);
    this.particles.ring(this.map.corePos.x, this.map.corePos.y, {
      color: EMOTION_COLOR[EmotionType.Calm], startRadius: 24, endRadius: 100, duration: 0.65, thickness: 2.5
    });
  }

  private shake(intensity: number) {
    if (!this.saves.load().settings.screenShake) return;
    this.state.shake = Math.min(1.5, this.state.shake + intensity);
  }

  private lose() {
    if (this.state.defeat) return;
    this.state.defeat = true;
    this.saves.recordRun(this.waves.current, this.calculateScore());
    audioManager.playSfx('game-over');
    audioManager.playMusic('game-over');
    this.sidePanel.showDefeat(this.waves.current, this.runStats.summary());
    this.showStatusNotice('Defeat - restart is available', 5);
    this.refreshUi();
    this.shake(2);
    this.particles.ring(this.map.corePos.x, this.map.corePos.y, {
      color: 0xff5577, startRadius: 30, endRadius: 220, duration: 1.4, thickness: 5
    });
  }

  private win() {
    if (this.state.victory) return;
    this.state.victory = true;
    this.state.paused = false;
    this.state.autoStartIn = 0;
    this.runStats.recordVictory(this.state.stability);
    this.saves.recordRun(this.waves.current, this.calculateScore());
    audioManager.playSfx('victory');
    audioManager.playMusic('victory');
    this.sidePanel.showVictory(this.runStats.summary());
    this.showStatusNotice('Victory - Core stabilized', 5);
    this.showVictoryOverlay();
    this.refreshUi();
    this.shake(1.2);
    this.particles.ring(this.map.corePos.x, this.map.corePos.y, {
      color: 0x77ffaa, startRadius: 28, endRadius: 240, duration: 1.2, thickness: 4
    });
  }

  private refreshSidePanel() {
    if (this.state.victory) { this.sidePanel.showVictory(this.runStats.summary()); return; }
    if (this.state.defeat)  { this.sidePanel.showDefeat(this.waves.current, this.runStats.summary());  return; }
    if (this.selectedTowerType) {
      this.sidePanel.showSelectedType(this.selectedTowerType, this.state.memory >= TOWER_STATS[this.selectedTowerType].cost);
      return;
    }
    if (this.selectedTower) {
      this.sidePanel.showSelectedTower(this.selectedTower, this.state.memory);
      return;
    }
    this.sidePanel.showWavePreview(this.waves.nextDef(), this.waves.currentDef(), this.state.betweenWaves);
  }

  private togglePause() {
    if (this.state.defeat || this.state.victory) return;
    this.state.paused = !this.state.paused;
    if (this.state.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
    this.refreshUi();
  }

  private toggleSpeed() {
    this.state.speedMultiplier = this.state.speedMultiplier === 1 ? 2 : 1;
    this.refreshUi();
  }

  private toggleAutoStart() {
    this.state.autoStartEnabled = !this.state.autoStartEnabled;
    this.saves.updateSettings({ autoStart: this.state.autoStartEnabled });
    this.showStatusNotice(this.state.autoStartEnabled ? 'Auto-start enabled' : 'Auto-start disabled', 1.2);
    this.refreshUi();
  }

  private restart(mode: GameMode = this.mode) {
    for (const t of this.towers) {
      this.map.release(t.cx, t.cy);
      t.destroy();
    }
    for (const e of this.enemies) e.destroy();
    for (const p of this.projectiles) p.destroy();
    for (const effect of this.groundEffects) effect.gfx.destroy();
    for (const zone of this.overheatZones) zone.gfx.destroy();
    for (const n of this.combatNotices) n.text.destroy();
    if (this.bossIntroOverlay) {
      this.uiLayer.removeChild(this.bossIntroOverlay);
      this.bossIntroOverlay.destroy({ children: true });
      this.bossIntroOverlay = null;
    }

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.groundEffects = [];
    this.overheatZones = [];
    this.combatNotices = [];
    this.towersLayer.removeChildren();
    this.enemiesLayer.removeChildren();
    this.projectilesLayer.removeChildren();
    this.effectsLayer.removeChildren();
    this.hideVictoryOverlay();
    this.hidePauseOverlay();

    this.particlesLayer.removeChild(this.particles.container);
    this.particles.container.destroy({ children: true });
    this.particles = new ParticleSystem();
    this.particles.setQuality(this.saves.load().settings.quality);
    this.particlesLayer.addChild(this.particles.container);
    this.applyQualitySettings(this.saves.load().settings.quality);

    const keepSpeed = this.state.speedMultiplier;
    const keepAuto = this.state.autoStartEnabled;
    this.mode = mode;
    this.waves.setMaxWave(this.mode === 'standard' ? STANDARD_MAX_WAVE : null);
    this.state = {
      stability: ECONOMY.startingStability,
      memory: ECONOMY.startingMemory,
      paused: false,
      speedMultiplier: keepSpeed,
      autoStartEnabled: keepAuto,
      defeat: false,
      victory: false,
      betweenWaves: true,
      autoStartIn: AUTO_START_SECONDS,
      shake: 0,
      notice: '',
      noticeTimer: 0,
      coreShield: 0,
      bossIntroTimer: 0
    };
    this.waves.reset();
    this.balance = new EmotionalBalance();
    this.synergies = new SynergySystem();
    this.runStats = new RunStats();
    this.sidePanel.setActiveSynergies([]);
    this.balanceDisruption = 0;
    this.leechNoticeTimer = 0;
    this.spiralPulseTimer = 5;
    this.maskResistTimer = 0;
    this.maskResistEmotion = null;
    this.burnoutZoneTimer = 4.5;
    this.bossIntroWave = null;
    this.lowStabilityPulseTimer = 0;
    this.selectedTowerType = null;
    this.selectedTower = null;
    this.hoveredCell = null;
    this.ghost.visible = false;
    this.rangePreview.clear();
    this.worldRoot.position.set(0, 0);
    this.map.redrawCore(1);
    this.towerBar.setSelected(null);
    this.refreshSidePanel();
    this.refreshUi();
  }

  private continueEndless() {
    this.mode = 'endless';
    this.waves.setMaxWave(null);
    this.state.victory = false;
    this.state.betweenWaves = true;
    this.state.autoStartIn = AUTO_START_SECONDS;
    this.hideVictoryOverlay();
    audioManager.playMusic('run-ambient');
    this.showStatusNotice('Endless mode unlocked - Wave 31 awaits', 2.2);
    this.refreshSidePanel();
    this.refreshUi();
  }

  private showVictoryOverlay() {
    this.hideVictoryOverlay();

    const overlay = new Container();
    overlay.eventMode = 'static';
    overlay.hitArea = { contains: () => true } as any;
    overlay.on('pointerdown', (e: FederatedPointerEvent) => e.stopPropagation());

    const veil = new Graphics();
    veil.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: 0x020409, alpha: 0.58 });

    const panel = new Graphics();
    panel.roundRect(-270, -150, 540, 300, 8)
      .fill({ color: 0x05070d, alpha: 0.98 })
      .stroke({ color: 0x77ffaa, width: 2.5, alpha: 0.95 });
    panel.rect(-270, -150, 540, 4).fill({ color: 0x77ffaa, alpha: 0.9 });

    const title = makeHeadline('VICTORY', {
      fontSize: 42,
      fontWeight: '900',
      letterSpacing: 7,
      fill: 0x77ffaa
    });
    title.anchor.set(0.5);
    title.position.set(0, -96);

    const run = this.runStats.summary();
    const summary = makeText(`Wave ${this.waves.current} cleared. The Core is stable.\nScore ${run.score}  |  Kills ${run.killsTotal}  |  Boss ${run.bossKills}\nMemory ${run.memoryEarned}  |  Core Damage ${run.coreDamageTaken}`, {
      fontSize: 14,
      fill: COLORS.text,
      align: 'center',
      lineHeight: 22
    });
    summary.anchor.set(0.5);
    summary.position.set(0, -34);

    const hint = makeLabel('Continue into endless escalation or bank the standard victory.', {
      fontSize: 10,
      letterSpacing: 2,
      fill: COLORS.textDim
    });
    hint.anchor.set(0.5);
    hint.position.set(0, 25);

    const continueButton = this.createOverlayButton('CONTINUE ENDLESS', 0, 74, 0x77ffaa, () => this.continueEndless());
    const restartButton = this.createOverlayButton('RESTART', -105, 126, COLORS.warn, () => this.restart('standard'));
    const menuButton = this.createOverlayButton('MAIN MENU', 105, 126, COLORS.pathCore, () => this.onMainMenu?.());

    const content = new Container();
    content.position.set(CANVAS.width / 2, CANVAS.height / 2);
    content.addChild(panel, title, summary, hint, continueButton, restartButton, menuButton);

    overlay.addChild(veil, content);
    this.victoryOverlay = overlay;
    this.uiLayer.addChild(overlay);
  }

  private hideVictoryOverlay() {
    if (!this.victoryOverlay) return;
    this.uiLayer.removeChild(this.victoryOverlay);
    this.victoryOverlay.destroy({ children: true });
    this.victoryOverlay = null;
  }

  private showPauseOverlay() {
    this.hidePauseOverlay();

    const overlay = new Container();
    overlay.eventMode = 'static';
    overlay.hitArea = { contains: () => true } as any;
    overlay.on('pointerdown', (e: FederatedPointerEvent) => e.stopPropagation());

    const veil = new Graphics();
    veil.rect(0, 0, CANVAS.width, CANVAS.height).fill({ color: 0x020409, alpha: 0.52 });

    const panel = new Graphics();
    panel.roundRect(-220, -120, 440, 240, 8)
      .fill({ color: 0x05070d, alpha: 0.98 })
      .stroke({ color: COLORS.warn, width: 2, alpha: 0.95 });

    const title = makeHeadline('PAUSED', {
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: 6,
      fill: COLORS.warn
    });
    title.anchor.set(0.5);
    title.position.set(0, -72);

    const resume = this.createOverlayButton('RESUME', 0, -16, 0x77ffaa, () => this.resumeFromOverlay());
    const restart = this.createOverlayButton('RESTART', -95, 48, COLORS.warn, () => this.restart(this.mode));
    const menu = this.createOverlayButton('MAIN MENU', 95, 48, COLORS.pathCore, () => this.onMainMenu?.());

    const content = new Container();
    content.position.set(CANVAS.width / 2, CANVAS.height / 2);
    content.addChild(panel, title, resume, restart, menu);
    overlay.addChild(veil, content);
    this.pauseOverlay = overlay;
    this.uiLayer.addChild(overlay);
  }

  private hidePauseOverlay() {
    if (!this.pauseOverlay) return;
    this.uiLayer.removeChild(this.pauseOverlay);
    this.pauseOverlay.destroy({ children: true });
    this.pauseOverlay = null;
  }

  private resumeFromOverlay() {
    this.state.paused = false;
    this.hidePauseOverlay();
    this.refreshUi();
  }

  private createOverlayButton(label: string, x: number, y: number, color: number, onClick: () => void): Container {
    const button = new Container();
    const width = label.length > 9 ? 230 : 170;
    const frame = new Graphics();
    const text = makeLabel(label, { fontSize: 11, letterSpacing: 2, fill: COLORS.text });
    const draw = (hovered: boolean): void => {
      frame.clear();
      frame.roundRect(-width / 2, -22, width, 44, 8)
        .fill({ color: hovered ? color : COLORS.panel, alpha: hovered ? 0.2 : 0.92 })
        .stroke({ color, width: hovered ? 2.5 : 1.5, alpha: hovered ? 1 : 0.82 });
    };

    draw(false);
    text.anchor.set(0.5);
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerover', () => draw(true));
    button.on('pointerout', () => draw(false));
    button.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      audioManager.playSfx('ui-click');
      onClick();
    });
    button.addChild(frame, text);
    return button;
  }

  private showStatusNotice(text: string, duration = 1.4) {
    this.state.notice = text;
    this.state.noticeTimer = duration;
  }

  private updateStatusNotice(dt: number) {
    if (this.state.noticeTimer <= 0) return;
    this.state.noticeTimer = Math.max(0, this.state.noticeTimer - dt);
    if (this.state.noticeTimer <= 0) this.state.notice = '';
  }

  private addCombatNotice(x: number, y: number, value: string, color: number, maxLife: number) {
    if (this.combatNotices.length > 44) {
      const old = this.combatNotices.shift();
      if (old) {
        this.effectsLayer.removeChild(old.text);
        old.text.destroy();
      }
    }
    const text = makeText(value, {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      fill: color,
      stroke: { color: 0x05070d, width: 3 }
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    this.effectsLayer.addChild(text);
    this.combatNotices.push({ text, x, y, vy: -24, life: maxLife, maxLife });
  }

  private updateCombatNotices(dt: number) {
    for (let i = this.combatNotices.length - 1; i >= 0; i--) {
      const n = this.combatNotices[i];
      n.life -= dt;
      n.y += n.vy * dt;
      n.text.position.set(n.x, n.y);
      n.text.alpha = Math.max(0, n.life / n.maxLife);
      if (n.life <= 0) {
        this.effectsLayer.removeChild(n.text);
        n.text.destroy();
        this.combatNotices.splice(i, 1);
      }
    }
  }

  private calculateScore(): number {
    return this.runStats.score;
  }

  private refreshSynergies(): void {
    this.synergies.updateFromTowers(this.towers);
    this.sidePanel.setActiveSynergies(this.synergies.activeSynergies());
  }

  private refreshUi() {
    this.hud.update({
      stability: this.state.stability,
      maxStability: ECONOMY.startingStability,
      memory: this.state.memory,
      score: this.runStats.score,
      wave: this.waves.current,
      betweenWaves: this.state.betweenWaves,
      countdown: this.state.betweenWaves && this.state.autoStartEnabled ? this.state.autoStartIn : 0,
      paused: this.state.paused,
      speedMultiplier: this.state.speedMultiplier,
      autoStartEnabled: this.state.autoStartEnabled,
      balanceDisruption: this.balanceDisruption,
      synergyStatus: this.synergies.statusText(),
      notice: this.state.notice
    }, this.balance);
    this.towerBar.setAffordability(this.state.memory);
    this.towerBar.setStartEnabled(this.state.betweenWaves && !!this.waves.nextDef());
    this.towerBar.setControls({
      paused: this.state.paused,
      speedMultiplier: this.state.speedMultiplier,
      autoStartEnabled: this.state.autoStartEnabled,
      canRestart: this.state.defeat || this.state.victory || this.waves.current > 0 || this.towers.length > 0
    });
  }
}
