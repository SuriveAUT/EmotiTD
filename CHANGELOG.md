# Changelog

All notable changes to EMOTICORE TD are documented here. Format follows Keep a Changelog, versioning follows SemVer.

## [0.1.4-alpha] - 2026-05-11

### Changed

- Added a focused UI/UX audit document covering HUD, TowerBar, SidePanel, mobile, hardcoded layout and render-pressure risks.
- Added a central layout mode helper for desktop, compact, mobile landscape and mobile portrait decisions.
- Added compact number formatting for dense HUD and run-summary values.
- Reworked the top HUD into clearer card regions with compact Score/Memory values, reduced synergy clutter and shorter status text.
- Widened TowerBar cards, increased touch hit areas and added a clear placement/cancel chip while building.
- Increased SidePanel upgrade-card height and reduced inspector text density so upgrade descriptions no longer feel compressed.
- Added a mobile portrait recommendation overlay with a continue-anyway option.
- Reduced high-quality render resolution caps to safer values for long runs and mobile GPUs.

### Notes

- No gameplay balance, tower, enemy, economy, map, boss, audio or backend logic was changed in this UI pass.

## [0.1.3-alpha] - 2026-05-08

### Changed

- Added lore integration pass connecting the Core, emotional responses, mental fractures, maps and run outcomes.
- Added tower lore one-liners, strengths, weaknesses and imbalance warnings to tower selection panels.
- Added a Fractures codex to How To Play with threat and counter hints.
- Added map lore/gameplay identity copy to map selection cards.
- Added important-wave lore messages and boss intro lore copy.
- Added Core Report narrative blocks for victory/defeat and lore labels in run summaries.
- Improved Emotional Balance UI language so states read as regulation, tension, imbalance and overload.
- Compressed Endless trashmob scaling after Wave 30 so late runs lean more on elites and boss pressure instead of Doubtling mass.
- Added stricter max simultaneous enemy caps with spawn queue backpressure instead of dropping queued spawns.
- Reworked Emotional Balance into weighted influence by emotion/category, including Stable, Tense, Imbalanced and Overloaded states.
- Added dominant emotion/category consequences plus small Resonance rewards for mixed builds.
- Reduced range/aura/synergy visual clutter by simplifying unselected towers under high tower counts/load and limiting selected synergy lines.

### Fixed

- Version now reports `0.1.3-alpha` in the main menu, package metadata and run summary exports.
- Boss waves continue rotating every 10 waves through Endless and boss spawns are no longer blocked by enemy caps.
- RunStats now tracks balance state time, max imbalance state and dominant emotion/category at run end.
- Hotfix: softened early Standard waves after live feedback by delaying and reducing first large enemy pressure without changing economy or tower values.
- Hotfix: reduced Wave 10 Spiral HP/add pressure so the first boss is a learnable check instead of a hard wall.
- Hotfix: added Fractureling and Pressure Knot as mid-tier enemies to smooth Waves 6-20 and provide fairer Memory before boss checks.

## [0.1.2-alpha] - 2026-05-07

### Fixed

- Added WebGL context lost/restored detection with emergency visual cleanup and UI refresh.
- Added hard caps for particles, projectile visuals, floating combat text, ground effects and simultaneous enemies.
- Added adaptive visual throttling for late waves so hit/trail/impact/death cosmetics are skipped under high load without changing gameplay damage.
- Fixed boss spawns after Wave 30 being blocked by the simultaneous-enemy safety cap, which caused BossKills to undercount in Endless.
- Fixed a SidePanel text cleanup leak by destroying removed text/graphics children during rebuilds.
- Prevented HUD synergy chips from rebuilding text every frame when the active synergy list is unchanged.
- Reduced late Endless render pressure with stricter Wave 31+ spawn caps and high-load quality fallback.

### Improved

- Added DEV late-wave performance counters for enemies, projectiles, particles, effects, UI children and FPS.
- Added panic recovery that clears visual-only effects and temporarily lowers quality when FPS/load becomes unsafe.
- Tower SidePanel stats now show a compact damage breakdown with base, upgraded, final multiplier and relevant synergy/support bonus labels.
- DevTools now shows visual skip rate, visual load level, quality and WebGL context loss count.

## [0.1.1-alpha] - 2026-05-07

### Fixed

- Fixed top HUD text overlap by moving synergy chips out of the right status text area and wrapping long status messages.
- Fixed upgrade card readability with taller cards, wrapped descriptions and dynamic max-level labels.
- Improved Endless stability past Wave 40 with late-wave spawn caps, projectile safety cleanup and DEV-only high-load diagnostics.
- Clarified run leave flow with Save & Quit plus confirmed Abandon Run.

### Improved

- Active synergies now show concrete bonus labels in HUD/SidePanel instead of only names.
- SidePanel selected-tower view now focuses synergy badges on bonuses relevant to that tower.
- Map grid visuals are less generic: fractured layouts are irregular and Panic Circuit uses broken glitch segments.

## [0.1.0-alpha] - 2026-05-07

First playable alpha. The core loop is ready for release validation.

### Added

- Local run auto-save and resume support for reloads, tab closes and mobile save-and-quit flow.
- Main Menu resume entry showing saved mode, map, wave, score and saved time.
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

### Fixed

- Mobile placement now resolves the tapped cell directly on `pointerdown`, so a selected tower can be placed with one tap instead of depending on stale hover state.
- UI panels stop propagation more consistently, preventing TowerBar and SidePanel touches from leaking into map placement/deselect handling.
- TowerBar, Main Menu and SidePanel touch targets are larger and safer for mobile input.
- SidePanel scroll position is preserved per selected tower across combat refreshes, upgrades and targeting changes.
- Current runs are cleared safely on victory, defeat, reset and intentional new-run overwrite.
