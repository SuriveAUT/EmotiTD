import assert from 'node:assert/strict';
import test from 'node:test';
import { assessPerformancePressure, classifyVisualLoad } from '../test-artifacts/logic-tests/src/core/performancePolicy.js';

test('classifies normal visual load without skipping effects', () => {
  assert.deepEqual(classifyVisualLoad({
    wave: 8,
    fps: 60,
    enemyCount: 10,
    projectileCount: 20,
    particleCount: 30,
    quality: 'medium'
  }), { level: 'normal', skipRate: 1 });
});

test('classifies late standard pressure as medium load', () => {
  assert.deepEqual(classifyVisualLoad({
    wave: 36,
    fps: 48,
    enemyCount: 20,
    projectileCount: 30,
    particleCount: 40,
    quality: 'medium'
  }), { level: 'medium', skipRate: 2 });
});

test('recommends recovery when a visual cap is saturated', () => {
  const pressure = assessPerformancePressure({
    wave: 42,
    fps: 44,
    enemyCount: 60,
    projectileCount: 180,
    particleCount: 120,
    floatingTextCount: 4,
    groundEffectCount: 8,
    overheatZoneCount: 2,
    quality: 'medium'
  }, {
    maxParticles: 220,
    maxParticleRings: 32,
    maxProjectiles: 180,
    maxFloatingTexts: 10,
    maxGroundEffects: 18,
    maxOverheatZones: 12,
    maxSimultaneousEnemies: 75
  });

  assert.equal(pressure.level, 'critical');
  assert.equal(pressure.recoveryRecommended, true);
  assert.equal(pressure.reason, 'projectile cap reached');
});
