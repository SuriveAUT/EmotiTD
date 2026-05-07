# EMOTICORE TD

Emotional Tower Defense in WebGL. Defend a fragile Core against escalating waves using nine emotion towers, Resonance synergies and targeted upgrades.

Stack: TypeScript, Vite, PixiJS v8.

## Alpha Status

Version: `0.1.0-alpha`

This is a playable alpha, not a content-complete game. It includes the full first-run loop, two maps, nine towers, ten enemies, a standard Wave 30 victory target and endless continuation after victory. Balance, audio polish, copy consistency and long-run variety are still alpha work.

Included alpha features:

- 2 maps: Fractured Mind and Silent Lake.
- 9 towers: Anger, Sadness, Joy, Fear, Calm, Hope, Disgust, Guilt and Trust.
- 10 enemies including the boss The Spiral.
- Standard run to Wave 30.
- Endless mode after victory.
- Main Menu, Tutorial, How To Play, Settings, Credits.
- Save/highscore persistence via LocalStorage.
- Run Summary after victory and defeat.
- Boss intro and defeat state.

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

## Typecheck

```bash
npm run typecheck
```

## Controls

| Input | Action |
| --- | --- |
| `1` to `9` | Select emotion tower |
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
