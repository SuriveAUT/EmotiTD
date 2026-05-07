import { Application } from 'pixi.js';
import type { Scene } from '../core/Scene';
import { saveManager, type CurrentRunSave, type SaveManager } from '../core/SaveManager';
import { DEFAULT_MAP, type MapDefinition } from '../game/config';
import { Game } from '../game/Game';
import type { GameMode } from '../game/GameMode';
import { createDefaultRunConfig, type RunConfig } from '../game/RunConfig';

interface GameSceneOptions {
  mode?: GameMode;
  map?: MapDefinition;
  runConfig?: RunConfig;
  onMainMenu?: () => void;
  saves?: SaveManager;
  resumeSave?: CurrentRunSave;
}

export class GameScene implements Scene {
  private readonly app: Application;
  private readonly mode: GameMode;
  private readonly map: MapDefinition;
  private readonly runConfig: RunConfig;
  private readonly onMainMenu?: () => void;
  private readonly saves: SaveManager;
  private readonly resumeSave?: CurrentRunSave;
  private game: Game | null = null;

  constructor(app: Application, options: GameSceneOptions = {}) {
    this.app = app;
    this.mode = options.mode ?? 'standard';
    this.map = options.map ?? DEFAULT_MAP;
    this.runConfig = options.runConfig ?? createDefaultRunConfig(this.map.id);
    this.onMainMenu = options.onMainMenu;
    this.saves = options.saves ?? saveManager;
    this.resumeSave = options.resumeSave;
  }

  init(): void {
    this.game = new Game(this.app, this.saves, {
      mode: this.mode,
      map: this.map,
      runConfig: this.runConfig,
      resumeSave: this.resumeSave,
      onMainMenu: this.onMainMenu
    });
  }

  update(_deltaSeconds: number): void {
    // Game owns its existing ticker loop.
  }

  destroy(): void {
    this.game?.destroy();
    this.game = null;
  }
}
