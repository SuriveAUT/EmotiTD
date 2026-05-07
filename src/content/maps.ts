import { COLORS } from './layout';
import type { Vec2 } from '../game/types';

export type MapStyle = 'fractured' | 'silent' | 'panic' | 'palace' | 'burnout';

/** Difficulty 1 = tutorial / wide open, 5 = hostile / very tight. */
export type MapDifficulty = 1 | 2 | 3 | 4 | 5;

export interface MapDefinition {
  id: string;
  name: string;
  theme: string;
  style: MapStyle;
  difficulty: MapDifficulty;
  waypoints: Vec2[];
  backgroundColors: {
    field: number;
    grid: number;
    gridStrong: number;
    pathEdge: number;
    pathCore: number;
    pathFlow: number;
  };
  /** Background "ambient" color used by the map's decoration layer. */
  ambient?: number;
  corePosition?: Vec2;
}

/* ------------------------------------------------------------------ *
 *  Lane design notes
 *  - Fractured Mind: tutorial lane. Two long open sweeps, only three
 *    real corners. Plenty of buildable space on both sides.
 *  - Silent Lake: gentle switchback. More corners than Fractured Mind
 *    but consistently open neighbouring tiles. Encourages slow towers.
 *  - Panic Circuit: short hop pattern with ten direction changes.
 *    Sight lines stay short so range matters less than coverage.
 *  - Memory Palace: four nested rectangles. Long total length, but
 *    placement is constrained because the path doubles back on itself.
 *  - Burnout Sector: vertical tooth comb. Many quick chokes and a
 *    spliced detour at the end. Punishes loose builds.
 * ------------------------------------------------------------------ */

export const FRACTURED_MIND_MAP: MapDefinition = {
  id: 'fractured-mind',
  name: 'Fractured Mind',
  theme: 'neon-consciousness',
  style: 'fractured',
  difficulty: 1,
  waypoints: [
    { x: -40, y: 200 },
    { x: 280, y: 200 },
    { x: 280, y: 540 },
    { x: 660, y: 540 },
    { x: 660, y: 240 },
    { x: 950, y: 240 }
  ],
  backgroundColors: {
    field: COLORS.bg,
    grid: COLORS.bgGrid,
    gridStrong: COLORS.bgGridStrong,
    pathEdge: COLORS.pathEdge,
    pathCore: COLORS.pathCore,
    pathFlow: COLORS.pathFlow
  },
  ambient: 0xff5577
};

export const SILENT_LAKE_MAP: MapDefinition = {
  id: 'silent-lake',
  name: 'Silent Lake',
  theme: 'sadness-calm',
  style: 'silent',
  difficulty: 2,
  waypoints: [
    { x: -40, y: 480 },
    { x: 200, y: 480 },
    { x: 200, y: 220 },
    { x: 460, y: 220 },
    { x: 460, y: 560 },
    { x: 720, y: 560 },
    { x: 720, y: 280 },
    { x: 950, y: 280 }
  ],
  backgroundColors: {
    field: 0x040d1c,
    grid: 0x0c2238,
    gridStrong: 0x14385b,
    pathEdge: 0x0c3a52,
    pathCore: 0x4ba8ff,
    pathFlow: 0x9bdcff
  },
  ambient: 0x4ba8ff,
  corePosition: { x: 950, y: 280 }
};

export const PANIC_CIRCUIT_MAP: MapDefinition = {
  id: 'panic-circuit',
  name: 'Panic Circuit',
  theme: 'glitch-fear',
  style: 'panic',
  difficulty: 3,
  waypoints: [
    { x: -40, y: 360 },
    { x: 140, y: 360 },
    { x: 140, y: 160 },
    { x: 320, y: 160 },
    { x: 320, y: 500 },
    { x: 520, y: 500 },
    { x: 520, y: 200 },
    { x: 700, y: 200 },
    { x: 700, y: 600 },
    { x: 860, y: 600 },
    { x: 860, y: 360 },
    { x: 950, y: 360 }
  ],
  backgroundColors: {
    field: 0x08040f,
    grid: 0x231032,
    gridStrong: 0x4a1b5f,
    pathEdge: 0x351046,
    pathCore: 0xff77ff,
    pathFlow: 0x77ffaa
  },
  ambient: 0xff77ff,
  corePosition: { x: 950, y: 360 }
};

/** New: nested rectangles inside ornate gold framework. Long path, very
 *  little reusable space because the lane wraps over itself. */
export const MEMORY_PALACE_MAP: MapDefinition = {
  id: 'memory-palace',
  name: 'Memory Palace',
  theme: 'archive-pride',
  style: 'palace',
  difficulty: 4,
  waypoints: [
    { x: -40, y: 360 },
    { x: 120, y: 360 },
    { x: 120, y: 120 },
    { x: 880, y: 120 },
    { x: 880, y: 600 },
    { x: 240, y: 600 },
    { x: 240, y: 280 },
    { x: 720, y: 280 },
    { x: 720, y: 480 },
    { x: 400, y: 480 },
    { x: 400, y: 360 },
    { x: 950, y: 360 }
  ],
  backgroundColors: {
    field: 0x140d05,
    grid: 0x382410,
    gridStrong: 0x6a4318,
    pathEdge: 0x4a3010,
    pathCore: 0xffd166,
    pathFlow: 0xfff0c8
  },
  ambient: 0xffd166,
  corePosition: { x: 950, y: 360 }
};

/** New: long vertical tooth-comb with a final detour past the core
 *  socket. Hostile lane: every section of the path is short and
 *  surrounded by rebuild churn. */
export const BURNOUT_SECTOR_MAP: MapDefinition = {
  id: 'burnout-sector',
  name: 'Burnout Sector',
  theme: 'overheat-anger',
  style: 'burnout',
  difficulty: 5,
  waypoints: [
    { x: -40, y: 600 },
    { x: 160, y: 600 },
    { x: 160, y: 120 },
    { x: 320, y: 120 },
    { x: 320, y: 580 },
    { x: 480, y: 580 },
    { x: 480, y: 160 },
    { x: 640, y: 160 },
    { x: 640, y: 600 },
    { x: 800, y: 600 },
    { x: 800, y: 200 },
    { x: 950, y: 200 }
  ],
  backgroundColors: {
    field: 0x180603,
    grid: 0x3a1208,
    gridStrong: 0x6b1f0c,
    pathEdge: 0x5a1808,
    pathCore: 0xff5b3a,
    pathFlow: 0xffd166
  },
  ambient: 0xff5b3a,
  corePosition: { x: 950, y: 200 }
};

export const MAP_DEFINITIONS: Record<string, MapDefinition> = {
  [FRACTURED_MIND_MAP.id]: FRACTURED_MIND_MAP,
  [SILENT_LAKE_MAP.id]: SILENT_LAKE_MAP,
  [PANIC_CIRCUIT_MAP.id]: PANIC_CIRCUIT_MAP,
  [MEMORY_PALACE_MAP.id]: MEMORY_PALACE_MAP,
  [BURNOUT_SECTOR_MAP.id]: BURNOUT_SECTOR_MAP
};

export const MAP_LIST: MapDefinition[] = [
  FRACTURED_MIND_MAP,
  SILENT_LAKE_MAP,
  PANIC_CIRCUIT_MAP,
  MEMORY_PALACE_MAP,
  BURNOUT_SECTOR_MAP
];

export const DEFAULT_MAP_ID = FRACTURED_MIND_MAP.id;
export const DEFAULT_MAP = FRACTURED_MIND_MAP;
