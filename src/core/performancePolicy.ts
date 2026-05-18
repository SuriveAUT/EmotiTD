export type QualitySetting = 'low' | 'medium' | 'high';
export type VisualLoadLevel = 'normal' | 'medium' | 'high' | 'extreme';
export type PerformancePressureLevel = VisualLoadLevel | 'critical';

export interface VisualBudgetInput {
  wave: number;
  fps: number;
  enemyCount: number;
  projectileCount: number;
  particleCount: number;
  quality: QualitySetting;
}

export interface VisualLoadClassification {
  level: VisualLoadLevel;
  skipRate: number;
}

export interface RenderCapsLike {
  maxParticles: number;
  maxProjectiles: number;
  maxFloatingTexts: number;
  maxGroundEffects: number;
  maxOverheatZones: number;
  maxSimultaneousEnemies: number;
}

export interface PerformancePressureSample extends VisualBudgetInput {
  floatingTextCount: number;
  groundEffectCount: number;
  overheatZoneCount: number;
}

export interface PerformancePressure {
  level: PerformancePressureLevel;
  reason: string;
  recoveryRecommended: boolean;
  ratios: {
    particles: number;
    projectiles: number;
    floatingTexts: number;
    groundEffects: number;
    overheatZones: number;
    enemies: number;
  };
}

export function classifyVisualLoad(input: VisualBudgetInput): VisualLoadClassification {
  let level: VisualLoadLevel = 'normal';
  let skipRate = 1;

  if (input.enemyCount > 85 || input.fps < 28 || input.particleCount > 320 || input.projectileCount > 180) {
    level = 'extreme';
    skipRate = 8;
  } else if (input.enemyCount > 60 || input.fps < 38 || input.wave > 45 || input.particleCount > 220) {
    level = 'high';
    skipRate = 4;
  } else if (input.enemyCount > 30 || input.fps < 50 || input.wave > 30) {
    level = 'medium';
    skipRate = 2;
  }

  if (input.quality === 'low') {
    skipRate = Math.max(skipRate, 4);
    if (level === 'normal' || level === 'medium') level = 'high';
  }

  return { level, skipRate };
}

export function assessPerformancePressure(sample: PerformancePressureSample, caps: RenderCapsLike): PerformancePressure {
  const ratios = {
    particles: capRatio(sample.particleCount, caps.maxParticles),
    projectiles: capRatio(sample.projectileCount, caps.maxProjectiles),
    floatingTexts: caps.maxFloatingTexts <= 0 ? 0 : capRatio(sample.floatingTextCount, caps.maxFloatingTexts),
    groundEffects: capRatio(sample.groundEffectCount, caps.maxGroundEffects),
    overheatZones: capRatio(sample.overheatZoneCount, caps.maxOverheatZones),
    enemies: capRatio(sample.enemyCount, caps.maxSimultaneousEnemies)
  };

  const saturated = [
    ['projectile cap reached', ratios.projectiles],
    ['particle cap reached', ratios.particles],
    ['floating text cap reached', ratios.floatingTexts],
    ['ground effect cap reached', ratios.groundEffects],
    ['overheat zone cap reached', ratios.overheatZones],
    ['enemy cap reached', ratios.enemies]
  ] as const;
  const capReason = saturated.find(([, ratio]) => ratio >= 1)?.[0];
  const lateWaveFpsPressure = sample.wave >= 35 && sample.fps < 35;
  const visualLoad = classifyVisualLoad(sample);

  if (capReason || lateWaveFpsPressure || sample.fps < 28) {
    return {
      level: 'critical',
      reason: capReason ?? (sample.fps < 28 ? 'FPS below safety floor' : 'late-wave FPS pressure'),
      recoveryRecommended: true,
      ratios
    };
  }

  const maxRatio = Math.max(...Object.values(ratios));
  if (maxRatio >= 0.88 || visualLoad.level === 'extreme') {
    return {
      level: 'high',
      reason: visualLoad.level === 'extreme' ? 'extreme visual load' : 'near visual cap',
      recoveryRecommended: false,
      ratios
    };
  }

  return {
    level: visualLoad.level,
    reason: visualLoad.level === 'normal' ? 'normal load' : `${visualLoad.level} visual load`,
    recoveryRecommended: false,
    ratios
  };
}

function capRatio(count: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.max(0, count / cap);
}
