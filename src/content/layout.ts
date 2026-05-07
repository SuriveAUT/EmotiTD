import { EmotionType } from '../game/types';

/* ------------------------------------------------------------------ *
 *  Canvas / Layout
 * ------------------------------------------------------------------ */
export const CANVAS = {
  width: 1280,
  height: 800,
  hudHeight: 64,
  towerBarHeight: 96,
  rightPanelWidth: 280
} as const;

/** Game playfield rect (inside HUDs) */
export const FIELD = {
  x: 0,
  y: CANVAS.hudHeight,
  width: CANVAS.width - CANVAS.rightPanelWidth,
  height: CANVAS.height - CANVAS.hudHeight - CANVAS.towerBarHeight
} as const;

export const GRID_SIZE = 40;

/* ------------------------------------------------------------------ *
 *  Colors — neon palette
 * ------------------------------------------------------------------ */
export const COLORS = {
  bg: 0x05070d,
  bgGrid: 0x0e1422,
  bgGridStrong: 0x1a2238,
  panel: 0x0a0f1a,
  panelEdge: 0x1f2a44,
  text: 0xe8edf2,
  textDim: 0x7d8ba6,
  pathCore: 0x6cf0ff,
  pathEdge: 0x143246,
  pathFlow: 0xff5577,
  core: 0xff5577,
  coreCool: 0x6cf0ff,
  danger: 0xff3355,
  ok: 0x77ffaa,
  warn: 0xffd166
} as const;

export const EMOTION_COLOR: Record<EmotionType, number> = {
  [EmotionType.Anger]: 0xff5b3a,
  [EmotionType.Sadness]: 0x4ba8ff,
  [EmotionType.Joy]: 0xffd54a,
  [EmotionType.Fear]: 0xb070ff,
  [EmotionType.Calm]: 0x6cf0d9,
  [EmotionType.Hope]: 0xf7f3a6,
  [EmotionType.Disgust]: 0x8ee05f,
  [EmotionType.Guilt]: 0xc0a06a,
  [EmotionType.Trust]: 0x5fd4ff,
  [EmotionType.Shame]: 0xff77b7,
  [EmotionType.Love]: 0xff6fae,
  [EmotionType.Pride]: 0xffb84d
};

export const EMOTION_ACCENT: Record<EmotionType, number> = {
  [EmotionType.Anger]: 0xffd166,
  [EmotionType.Sadness]: 0x6cf0ff,
  [EmotionType.Joy]: 0xffffff,
  [EmotionType.Fear]: 0xff77ff,
  [EmotionType.Calm]: 0xffffff,
  [EmotionType.Hope]: 0x6cf0ff,
  [EmotionType.Disgust]: 0xd6ff77,
  [EmotionType.Guilt]: 0xffd166,
  [EmotionType.Trust]: 0xffffff,
  [EmotionType.Shame]: 0xb070ff,
  [EmotionType.Love]: 0xffffff,
  [EmotionType.Pride]: 0xfff0a8
};
