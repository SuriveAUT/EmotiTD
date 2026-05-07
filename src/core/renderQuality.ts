import type { Application } from 'pixi.js';
import type { QualitySetting } from './SaveManager';
import { CANVAS } from '../game/config';

export function getRenderResolution(quality: QualitySetting, devicePixelRatio = window.devicePixelRatio || 1): number {
  if (quality === 'low') return 1;
  if (quality === 'medium') return Math.min(2, Math.max(1.5, devicePixelRatio));
  return Math.min(3, Math.max(2.5, devicePixelRatio));
}

export function applyRenderResolution(app: Application, quality: QualitySetting): number {
  const resolution = getRenderResolution(quality);
  app.renderer.resize(CANVAS.width, CANVAS.height, resolution);
  return resolution;
}
