import { saveManager } from '../core/SaveManager';
import { submitScore, type ScoreSubmitPayload } from '../services/scoreboardApi';

export interface ScoreSubmitOptions {
  payload: Omit<ScoreSubmitPayload, 'playerName'>;
  onClose?: () => void;
}

const NAME_REGEX = /^[A-Za-z0-9 _\-.]+$/;

/**
 * Lightweight DOM overlay for entering a player name and submitting a score.
 * Lives inside #app, on top of the canvas. Self-mounting and self-cleaning.
 */
export class ScoreSubmitOverlay {
  private root: HTMLDivElement;
  private destroyed = false;
  private submitted = false;

  constructor(private opts: ScoreSubmitOptions) {
    this.root = this.build();
  }

  mount(parent: HTMLElement = document.getElementById('app') ?? document.body): void {
    if (this.destroyed) return;
    parent.appendChild(this.root);
    const input = this.root.querySelector<HTMLInputElement>('input[name="player"]');
    input?.focus();
    input?.select();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.root.parentElement?.removeChild(this.root);
    this.opts.onClose?.();
  }

  private build(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'emt-score-submit';
    wrapper.style.cssText = [
      'position:absolute',
      'right:24px',
      'top:80px',
      'width:300px',
      'padding:16px 18px',
      'background:rgba(10,15,26,0.96)',
      'border:1px solid #1f2a44',
      'border-left:2px solid #6cf0ff',
      'border-radius:8px',
      'color:#e8edf2',
      'font-family:Inter,system-ui,sans-serif',
      'font-size:12px',
      'letter-spacing:1px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
      'z-index:50',
      'pointer-events:auto'
    ].join(';');

    const heading = document.createElement('div');
    heading.textContent = 'ONLINE SCOREBOARD';
    heading.style.cssText = 'font-weight:800;letter-spacing:3px;color:#6cf0ff;font-size:11px;margin-bottom:10px;';

    const sub = document.createElement('div');
    sub.textContent = 'Submit run to leaderboard';
    sub.style.cssText = 'color:#7d8ba6;font-size:10px;letter-spacing:2px;margin-bottom:12px;';

    const summary = document.createElement('div');
    const p = this.opts.payload;
    summary.textContent = `${p.mapName}  ·  Wave ${p.wave}  ·  Score ${p.score}`;
    summary.style.cssText = 'color:#c0c8d8;font-size:11px;margin-bottom:12px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'player';
    input.maxLength = 18;
    input.placeholder = 'YOUR NAME';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.value = saveManager.getData().lastPlayerName;
    input.style.cssText = [
      'width:100%',
      'padding:8px 10px',
      'background:#05070d',
      'border:1px solid #1f2a44',
      'border-radius:5px',
      'color:#e8edf2',
      'font-family:Inter,sans-serif',
      'font-size:13px',
      'letter-spacing:2px',
      'outline:none',
      'margin-bottom:10px'
    ].join(';');

    const status = document.createElement('div');
    status.style.cssText = 'min-height:14px;font-size:11px;letter-spacing:1px;color:#ffd166;margin-bottom:10px;';

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:8px;';

    const submit = document.createElement('button');
    submit.textContent = 'SUBMIT';
    submit.type = 'button';
    submit.style.cssText = this.buttonStyle('#77ffaa');

    const skip = document.createElement('button');
    skip.textContent = 'SKIP';
    skip.type = 'button';
    skip.style.cssText = this.buttonStyle('#7d8ba6');

    buttonRow.append(submit, skip);
    wrapper.append(heading, sub, summary, input, status, buttonRow);

    skip.addEventListener('click', () => this.destroy());
    submit.addEventListener('click', () => this.handleSubmit(input, status, submit, skip));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit(input, status, submit, skip);
      }
    });

    return wrapper;
  }

  private buttonStyle(accent: string): string {
    return [
      'flex:1',
      'padding:8px 10px',
      'background:#0a0f1a',
      `border:1px solid ${accent}`,
      'border-radius:5px',
      `color:${accent}`,
      'font-family:Inter,sans-serif',
      'font-size:11px',
      'letter-spacing:3px',
      'font-weight:800',
      'cursor:pointer'
    ].join(';');
  }

  private async handleSubmit(
    input: HTMLInputElement,
    status: HTMLDivElement,
    submit: HTMLButtonElement,
    skip: HTMLButtonElement
  ): Promise<void> {
    if (this.submitted) return;
    const name = input.value.trim();
    if (name.length < 1 || name.length > 18 || !NAME_REGEX.test(name)) {
      status.style.color = '#ff5577';
      status.textContent = 'Name: 1-18 chars, letters / digits / _ - .';
      return;
    }

    this.submitted = true;
    submit.disabled = true;
    skip.disabled = true;
    submit.style.opacity = '0.5';
    skip.style.opacity = '0.5';
    status.style.color = '#6cf0ff';
    status.textContent = 'Submitting…';

    saveManager.setLastPlayerName(name);

    try {
      const result = await submitScore({ playerName: name, ...this.opts.payload });
      if (result.ok && result.rank !== undefined) {
        status.style.color = '#77ffaa';
        status.textContent = `Submitted! Rank #${result.rank}`;
        skip.textContent = 'CLOSE';
        skip.disabled = false;
        skip.style.opacity = '1';
      } else {
        status.style.color = '#ffd166';
        status.textContent = `Not submitted: ${result.reason ?? 'unknown'}`;
        this.submitted = false;
        submit.disabled = false;
        skip.disabled = false;
        submit.style.opacity = '1';
        skip.style.opacity = '1';
      }
    } catch (err) {
      status.style.color = '#ff5577';
      status.textContent = 'Scoreboard unavailable. Run summary stays local.';
      this.submitted = false;
      submit.disabled = false;
      skip.disabled = false;
      submit.style.opacity = '1';
      skip.style.opacity = '1';
      void err;
    }
  }
}
