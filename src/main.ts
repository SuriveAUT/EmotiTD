import { Application } from 'pixi.js';
import { audioManager } from './core/AudioManager';
import { SceneManager } from './core/SceneManager';
import { saveManager } from './core/SaveManager';
import { CANVAS } from './game/config';
import { MainMenuScene } from './scenes/MainMenuScene';

async function main() {
  const app = new Application();
  await app.init({
    width: CANVAS.width,
    height: CANVAS.height,
    background: 0x05070d,
    antialias: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    autoDensity: true,
    powerPreference: 'high-performance'
  });

  const host = document.getElementById('app')!;
  host.appendChild(app.canvas);

  const fit = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // tiny inset so the canvas almost fills the viewport while still
    // showing a thin glow of the atmospheric background as chrome.
    const inset = Math.min(16, Math.max(4, Math.min(w, h) * 0.008));
    const availableW = Math.max(320, w - inset * 2);
    const availableH = Math.max(240, h - inset * 2);
    const scale = Math.min(availableW / CANVAS.width, availableH / CANVAS.height);
    app.canvas.style.width  = `${Math.round(CANVAS.width * scale)}px`;
    app.canvas.style.height = `${Math.round(CANVAS.height * scale)}px`;
  };
  fit();
  window.addEventListener('resize', fit);

  const sceneManager = new SceneManager(app);
  audioManager.applySettings(saveManager.load().settings);
  sceneManager.changeScene(new MainMenuScene(app, sceneManager));

  // hide boot overlay
  const boot = document.getElementById('boot');
  if (boot) {
    requestAnimationFrame(() => {
      boot.classList.add('gone');
      setTimeout(() => boot.remove(), 700);
    });
  }
}

main().catch((err) => {
  console.error('[EMOTICORE TD] init failed', err);
  const boot = document.getElementById('boot');
  if (boot) boot.querySelector('.sub')!.textContent = 'init failed — siehe Konsole';
});
