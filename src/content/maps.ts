import { COLORS } from './layout';
import type { Vec2 } from '../game/types';

export type MapStyle = 'fractured' | 'silent';

export interface MapDefinition {
  id: string;
  name: string;
  theme: string;
  style: MapStyle;
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

export const FRACTURED_MIND_MAP: MapDefinition = {
  id: 'fractured-mind',
  name: 'Fractured Mind',
  theme: 'neon-consciousness',
  style: 'fractured',
  waypoints: [
    { x: -40, y: 240 },
    { x: 230, y: 240 },
    { x: 230, y: 520 },
    { x: 490, y: 520 },
    { x: 490, y: 200 },
    { x: 760, y: 200 },
    { x: 760, y: 600 },
    { x: 950, y: 600 }
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
  waypoints: [
    { x: -40, y: 560 },
    { x: 360, y: 560 },
    { x: 360, y: 200 },
    { x: 700, y: 200 },
    { x: 700, y: 560 },
    { x: 880, y: 560 },
    { x: 880, y: 360 },
    { x: 950, y: 360 }
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
  corePosition: { x: 950, y: 360 }
};

export const MAP_DEFINITIONS: Record<string, MapDefinition> = {
  [FRACTURED_MIND_MAP.id]: FRACTURED_MIND_MAP,
  [SILENT_LAKE_MAP.id]: SILENT_LAKE_MAP
};

export const MAP_LIST: MapDefinition[] = [FRACTURED_MIND_MAP, SILENT_LAKE_MAP];

export const DEFAULT_MAP_ID = FRACTURED_MIND_MAP.id;
export const DEFAULT_MAP = FRACTURED_MIND_MAP;
