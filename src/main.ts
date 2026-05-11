import { Application } from 'pixi.js';
import { audioManager } from './core/AudioManager';
import { getRenderResolution } from './core/renderQuality';
import { SceneManager } from './core/SceneManager';
import { saveManager } from './core/SaveManager';
import { CANVAS } from './game/config';
import { MainMenuScene } from './scenes/MainMenuScene';
import { getLayoutMode } from './ui/layoutSystem';

async function main() {
  const initialSave = saveManager.load();
  const app = new Application();
  await app.init({
    width: CANVAS.width,
    height: CANVAS.height,
    background: 0x05070d,
    antialias: true,
    resolution: getRenderResolution(initialSave.settings.quality),
    autoDensity: true,
    powerPreference: 'high-performance'
  });

  const host = document.getElementById('app')!;
  host.appendChild(app.canvas);
  app.canvas.style.touchAction = 'none';
  app.canvas.style.userSelect = 'none';
  app.canvas.style.webkitUserSelect = 'none';
  const rotateHint = document.getElementById('rotate-hint');
  const rotateDismiss = rotateHint?.querySelector('button');
  let rotateHintDismissed = false;
  rotateDismiss?.addEventListener('click', () => {
    rotateHintDismissed = true;
    rotateHint?.classList.remove('visible');
  });
  app.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.error('[EMOTICORE TD] WebGL context lost');
    window.dispatchEvent(new CustomEvent('emoticore:renderer-context-lost'));
  });
  app.canvas.addEventListener('webglcontextrestored', () => {
    console.warn('[EMOTICORE TD] WebGL context restored');
    window.dispatchEvent(new CustomEvent('emoticore:renderer-context-restored'));
  });

  const fit = () => {
    const viewport = window.visualViewport;
    const w = viewport?.width ?? window.innerWidth;
    const h = viewport?.height ?? window.innerHeight;
    // tiny inset so the canvas almost fills the viewport while still
    // showing a thin glow of the atmospheric background as chrome.
    const inset = Math.min(16, Math.max(4, Math.min(w, h) * 0.008));
    const availableW = Math.max(320, w - inset * 2);
    const availableH = Math.max(240, h - inset * 2);
    const scale = Math.min(availableW / CANVAS.width, availableH / CANVAS.height);
    app.canvas.style.width = `${CANVAS.width * scale}px`;
    app.canvas.style.height = `${CANVAS.height * scale}px`;
    const mode = getLayoutMode(w, h, scale);
    document.documentElement.dataset.layout = mode;
    const showRotateHint = mode === 'mobilePortrait' && !rotateHintDismissed;
    rotateHint?.classList.toggle('visible', showRotateHint);
  };
  const scheduleFit = () => requestAnimationFrame(fit);
  fit();
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('orientationchange', scheduleFit);
  window.visualViewport?.addEventListener('resize', scheduleFit);
  window.visualViewport?.addEventListener('scroll', scheduleFit);

  const sceneManager = new SceneManager(app);
  audioManager.applySettings(initialSave.settings);
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
