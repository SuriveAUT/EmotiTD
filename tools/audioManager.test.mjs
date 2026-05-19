import assert from 'node:assert/strict';
import test from 'node:test';
import { AudioManager } from '../test-artifacts/logic-tests/src/core/AudioManager.js';

test('starts music immediately after audio is unlocked without waiting for a HEAD request', () => {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const constructed = [];
  const playCalls = [];

  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.loop = false;
      this.preload = 'metadata';
      this.volume = 1;
      this.paused = true;
      this.currentTime = 0;
      constructed.push(src);
    }

    play() {
      this.paused = false;
      playCalls.push(this.src);
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
    }

    addEventListener() {}
  }

  globalThis.Audio = FakeAudio;
  globalThis.fetch = () => new Promise(() => {});

  try {
    const manager = new AudioManager();

    manager.playSfx('ui-click');
    manager.playMusic('run-ambient');

    assert.ok(
      constructed.some((src) => src.endsWith('/audio/music/run-ambient.ogg')),
      'run ambient music should create an audio element synchronously once unlocked'
    );
    assert.ok(
      playCalls.some((src) => src.endsWith('/audio/music/run-ambient.ogg')),
      'run ambient music should call play synchronously once unlocked'
    );
  } finally {
    globalThis.Audio = originalAudio;
    globalThis.fetch = originalFetch;
  }
});
