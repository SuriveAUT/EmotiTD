import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getAudioAsset, listAudioAssets } from '../test-artifacts/logic-tests/src/core/audioManifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredSfx = [
  'ui-click',
  'tower-place',
  'tower-upgrade',
  'tower-sell',
  'core-hit',
  'wave-start',
  'wave-complete',
  'victory',
  'game-over'
];

const requiredMusic = [
  'menu-theme',
  'run-ambient',
  'victory',
  'game-over'
];

test('covers every runtime audio cue with a shipped ogg file', () => {
  for (const name of requiredSfx) {
    const asset = getAudioAsset('sfx', name);
    assert.ok(asset, `missing sfx: ${name}`);
    assert.match(asset.src, /^\/audio\/sfx\/.+\.ogg$/);
    assert.equal(existsSync(path.join(root, 'public', asset.src)), true, asset.src);
  }

  for (const name of requiredMusic) {
    const asset = getAudioAsset('music', name);
    assert.ok(asset, `missing music: ${name}`);
    assert.match(asset.src, /^\/audio\/music\/.+\.ogg$/);
    assert.equal(existsSync(path.join(root, 'public', asset.src)), true, asset.src);
  }
});

test('keeps cue gains in a controlled mix range', () => {
  for (const asset of listAudioAssets()) {
    assert.ok(asset.gain > 0 && asset.gain <= 1, `${asset.name} gain out of range`);

    if (asset.kind === 'music') {
      assert.ok(asset.gain >= 0.18 && asset.gain <= 0.5, `${asset.name} music gain too extreme`);
    } else {
      assert.ok(asset.gain >= 0.28 && asset.gain <= 0.75, `${asset.name} sfx gain too extreme`);
    }
  }
});

test('uses loop settings that match gameplay intent', () => {
  assert.equal(getAudioAsset('music', 'menu-theme')?.loop, true);
  assert.equal(getAudioAsset('music', 'run-ambient')?.loop, true);
  assert.equal(getAudioAsset('music', 'victory')?.loop, false);
  assert.equal(getAudioAsset('music', 'game-over')?.loop, false);
});
