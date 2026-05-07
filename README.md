# EMOTICORE TD

Emotional Tower Defense in WebGL. Defend a fragile Core against escalating waves using emotion towers, Resonance synergies and targeted upgrades.

Stack: TypeScript, Vite, PixiJS v8.

## Alpha Status

Version: `0.1.0-alpha`

This is a playable alpha, not a content-complete game. It includes the full first-run loop, three maps, twelve towers, rotating bosses, a standard Wave 30 victory target, endless continuation after victory and local challenge modes. Balance, audio polish, copy consistency and long-run variety are still alpha work.

Included alpha features:

- 3 maps: Fractured Mind, Silent Lake and Panic Circuit.
- 12 towers: Anger, Sadness, Joy, Fear, Calm, Hope, Disgust, Guilt, Trust, Shame, Love and Pride.
- 12 enemies including The Spiral, The Mask and The Burnout.
- Standard run to Wave 30.
- Endless mode after victory.
- Challenge modes: Boss Rush, Limited Emotions, Fragile Core and Resonance Trial.
- Premium dark-neon UI polish with animated menus, smoother scene transitions, clearer HUD feedback and richer combat impacts.
- Main Menu, Tutorial, How To Play, Settings, Credits.
- Save/highscore persistence via LocalStorage.
- Running games are auto-saved locally and can be resumed after reload.
- Run Summary after victory and defeat.
- Boss intro and defeat state.

## Run Modes

- Standard: baseline Wave 30 run. Standard balance is not modified by challenge rules.
- Boss Rush: boss waves every 5 waves, reduced rewards and stronger boss pressure.
- Limited Emotions: a seeded pool allows only 5 tower emotions for that run.
- Fragile Core: reduced starting Stability with slightly more starting Memory.
- Resonance Trial: stronger local synergies, harsher single-emotion imbalance.

Challenge records are stored locally per mode and map. There is no backend, account system or online leaderboard in this phase.

## Setup

```bash
npm install
```

## Dev Start

```bash
npm run dev
```

Starts the Vite dev server, usually at `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

Creates the production build in `dist/`. Typecheck runs as part of the build.

## Preview

```bash
npm run preview
```

Serves the built `dist/` output locally for release checks.

## Deploy

```bash
npm run deploy:server
```

Builds with base `/emoticore-td/`, copies release docs into `dist/release-docs`, uploads to SSH host `server`, and replaces `/var/www/html/emoticore-td`.

Optional manual form:

```powershell
powershell -ExecutionPolicy Bypass -File tools/deploy-server.ps1 -SshHost server -RemoteDir /var/www/html/emoticore-td -BasePath /emoticore-td/
```

## Typecheck

```bash
npm run typecheck
```

## Controls

| Input | Action |
| --- | --- |
| `1` to `9` | Select visible emotion tower |
| Left click | Place tower / select tower |
| Right click | Cancel placement |
| `Esc` | Clear selection |
| `Space` | Start wave |
| `P` | Pause |
| `F` | Toggle speed |
| `R` | Restart after victory / defeat |

## Release Docs

- [Release Checklist](RELEASE_CHECKLIST.md)
- [Known Issues](KNOWN_ISSUES.md)
- [Changelog](CHANGELOG.md)
