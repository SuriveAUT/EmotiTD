# Known Issues - 0.1.0-alpha

These are accepted alpha limitations, not blockers for the first public test build.

## Gameplay

- Balance is still provisional. Some tower/emotion combinations may overperform once players optimize around Resonance.
- Endless mode uses the same procedural wave rules after Wave 30, so late-wave variety is functional but not final.
- Boss encounters currently reuse The Spiral as the recurring boss identity.

## Presentation

- Audio hooks are implemented, but final music and SFX assets are not complete.
- Visual effects have quality settings, but lower-end hardware still needs broader testing.
- UI copy is now English-only. Broader localization is not planned for this alpha.

## Saves

- Saves use LocalStorage under `emoticore-td-save`. Clearing browser storage resets progress and highscores.
- Save schema migration is minimal because this is the first alpha save version.

## QA Gaps

- No automated gameplay simulation covers a full Wave 1-30 clear yet.
- Manual smoke testing should cover both maps, defeat, victory, continue endless, settings persistence and reset save.
