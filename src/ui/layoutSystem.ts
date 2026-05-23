import { CANVAS } from '../game/config';

export type LayoutMode = 'desktop' | 'compact' | 'mobileLandscape' | 'mobilePortrait';

export interface UIRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UIRegions {
  mode: LayoutMode;
  hudRect: UIRect;
  playfieldRect: UIRect;
  rightPanelRect: UIRect;
  towerBarRect: UIRect;
  overlayRect: UIRect;
  safeArea: UIRect;
}

export function getLayoutMode(viewportWidth: number, viewportHeight: number, canvasScale = 1): LayoutMode {
  const minSide = Math.min(viewportWidth, viewportHeight);
  const portrait = viewportHeight > viewportWidth;
  const scaledCanvasWidth = CANVAS.width * canvasScale;
  if (portrait && minSide < 900) return 'mobilePortrait';
  if (!portrait && (viewportWidth < 980 || viewportHeight < 560)) return 'mobileLandscape';
  if (scaledCanvasWidth < 1180 || viewportWidth < 1360 || viewportHeight < 780) return 'compact';
  return 'desktop';
}

export function getUIRegions(mode: LayoutMode): UIRegions {
  const rightPanelWidth = mode === 'mobileLandscape' ? 260 : CANVAS.rightPanelWidth;
  return {
    mode,
    hudRect: { x: 0, y: 0, width: CANVAS.width, height: CANVAS.hudHeight },
    playfieldRect: {
      x: 0,
      y: CANVAS.hudHeight,
      width: CANVAS.width - rightPanelWidth,
      height: CANVAS.height - CANVAS.hudHeight - CANVAS.towerBarHeight
    },
    rightPanelRect: {
      x: CANVAS.width - rightPanelWidth,
      y: CANVAS.hudHeight,
      width: rightPanelWidth,
      height: CANVAS.height - CANVAS.hudHeight
    },
    towerBarRect: {
      x: 0,
      y: CANVAS.height - CANVAS.towerBarHeight,
      width: CANVAS.width,
      height: CANVAS.towerBarHeight
    },
    overlayRect: { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height },
    safeArea: { x: 16, y: 12, width: CANVAS.width - 32, height: CANVAS.height - 24 }
  };
}

export function isMobileLike(mode: LayoutMode): boolean {
  return mode === 'mobileLandscape' || mode === 'mobilePortrait';
}

export function isCompactLike(mode: LayoutMode): boolean {
  return mode !== 'desktop';
}
