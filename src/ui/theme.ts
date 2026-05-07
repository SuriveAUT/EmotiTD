export const UI_THEME = {
  color: {
    bg: 0x03050a,
    panel: 0x070b16,
    panelSoft: 0x0d1424,
    panelGlass: 0x10192d,
    edge: 0x213656,
    edgeStrong: 0x6cf0ff,
    primary: 0x6cf0ff,
    accent: 0xff77ff,
    danger: 0xff5577,
    warn: 0xffd166,
    success: 0x77ffaa,
    text: 0xe8edf2,
    textDim: 0x93a2bd,
    textMuted: 0x62708a,
    gold: 0xffd166
  },
  alpha: {
    panel: 0.92,
    glass: 0.74,
    edge: 0.78,
    glow: 0.28,
    disabled: 0.42
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 18
  },
  anim: {
    fast: 0.16,
    normal: 0.28,
    sceneFade: 0.36
  }
} as const;

export function mixToward(value: number, target: number, factor: number): number {
  if (Math.abs(value - target) < 0.01) return target;
  return value + (target - value) * factor;
}
