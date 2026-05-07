# Changelog

All notable changes to EMOTICORE TD are documented here. Format follows Keep a Changelog, versioning follows SemVer.

## [0.1.0-alpha] - 2026-05-07

First playable alpha. The core loop is ready for release validation.

### Added

- Premium UI polish pass with a shared dark-neon UI theme, smoother panel styling and improved visual consistency.
- Scene fade transitions between menus, game, settings, how-to-play and run-end navigation.
- Animated main menu refinements: intro fade, stronger vignette, premium cards and selected-state glow.
- HUD polish: animated resource values, improved Stability bar, boss-wave emphasis and active synergy chips.
- TowerBar polish: richer cards, hover/selected motion, clearer unavailable state and upgraded tooltip panel styling.
- Quality-aware visual polish for map decoration, impact particles and high-DPI sharpness.
- RunConfig system for standard and challenge runs, including mode, map, seed, rules and run modifiers.
- Local challenge modes: Boss Rush, Limited Emotions, Fragile Core and Resonance Trial.
- Boss Rush support for boss waves every 5 waves with challenge-only reward and pressure rules.
- Limited Emotions support for seeded 5-tower pools shown directly in the Tower Bar.
- Local highscore records per mode and map, while preserving the existing global best wave and score.
- Run summaries now include run mode, map, seed, towers used, highest upgrade level and max active synergies.
- Core loop: wave setup, build phase, active wave, victory and defeat conditions.
- Nine emotion tower types with distinct mechanics: Anger (splash), Sadness (slow), Joy (chain), Fear (stun), Calm (buff aura), Hope (Numb damage multiplier), Disgust (poison and armor shred), Guilt (mark and execute), Trust (core shield and anchor).
- Resonance synergy system between matching emotions.
- Upgrade paths A / B / C per tower.
- Targeting modes: First, Last, Strongest, Weakest, Fastest, Boss.
- Ten enemy types: Doubtling, Panic Runner, Guilt Giant, Shame Swarm, Envy Leech, Burnout Brute, Void Wraith, Overthinker, Numb One and boss The Spiral.
- WaveManager with escalating waves and boss encounters.
- Standard mode victory after Wave 30.
- Endless continuation after standard victory.
- Emotional Balance and RunStats tracking per run.
- Particle effects and Pixi filters for glow and atmosphere.
- Two maps: Fractured Mind and Silent Lake.
- Scenes: Main Menu, Game, Settings, How To Play, Credits.
- HUD, Side Panel and Tower Bar.
- Interactive tutorial and static How To Play overview.
- How To Play Tower Roles reference covering all nine towers.
- AudioManager with master, SFX and music channels.
- Persistent settings, tutorial state, best wave and best score via SaveManager LocalStorage.
- Boss intro overlay and defeat window with run summary.
- Keyboard controls: `1`-`9` selection, `Space` wave start, `P` pause, `F` speed toggle, `Esc` cancel, `R` restart.
- Responsive canvas fit with atmospheric frame background.
- Release preparation docs: `RELEASE_CHECKLIST.md` and `KNOWN_ISSUES.md`.

### Build

- Vite production build without sourcemaps.
- `npm run typecheck` as a separate step and as a pre-step of `npm run build`.
