import type { Application } from 'pixi.js';
import type { QualitySetting } from './SaveManager';
import { CANVAS } from '../game/config';

export interface RenderCaps {
  maxParticles: number;
  maxParticleRings: number;
  maxProjectiles: number;
  maxFloatingTexts: number;
  maxGroundEffects: number;
  maxOverheatZones: number;
  maxSimultaneousEnemies: number;
}

const RENDER_CAPS: Record<QualitySetting, RenderCaps> = {
  low: {
    maxParticles: 100,
    maxParticleRings: 18,
    maxProjectiles: 120,
    maxFloatingTexts: 0,
    maxGroundEffects: 12,
    maxOverheatZones: 8,
    maxSimultaneousEnemies: 60
  },
  medium: {
    maxParticles: 220,
    maxParticleRings: 32,
    maxProjectiles: 180,
    maxFloatingTexts: 10,
    maxGroundEffects: 18,
    maxOverheatZones: 12,
    maxSimultaneousEnemies: 75
  },
  high: {
    maxParticles: 360,
    maxParticleRings: 48,
    maxProjectiles: 240,
    maxFloatingTexts: 20,
    maxGroundEffects: 24,
    maxOverheatZones: 16,
    maxSimultaneousEnemies: 90
  }
};

export function getRenderResolution(quality: QualitySetting, devicePixelRatio = window.devicePixelRatio || 1): number {
  if (quality === 'low') return 1;
  if (quality === 'medium') return Math.min(devicePixelRatio, 1.5);
  return Math.min(devicePixelRatio, 2);
}

export function applyRenderResolution(app: Application, quality: QualitySetting): number {
  const resolution = getRenderResolution(quality);
  app.renderer.resize(CANVAS.width, CANVAS.height, resolution);
  return resolution;
}

export function getRenderCaps(quality: QualitySetting): RenderCaps {
  return RENDER_CAPS[quality];
}
