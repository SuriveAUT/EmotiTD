# EMOTICORE TD Performance and UI Polish Design

Date: 2026-05-18
Status: Approved for planning

## Goal

Prepare the current alpha for a safer deploy by improving runtime stability, reducing avoidable render/UI cost, and polishing readability in the existing PixiJS canvas interface.

The pass must preserve the current game identity: psychological neon tower defense, fixed internal 1280x800 playfield, PixiJS v8 rendering, TypeScript/Vite build, and existing frontend deploy path to `/emoticore-td/`.

## Scope

- Performance hardening in the current renderer and game loop.
- UI and polish improvements for HUD, TowerBar, SidePanel, and game-state overlays.
- QA gates before deploy: typecheck, production build, local preview smoke test, and representative browser screenshots.
- Deploy through the existing `npm run deploy:server` workflow after verification passes.

## Non-Goals

- No new towers, enemies, maps, modes, or balance redesign.
- No engine migration and no rewrite from PixiJS to another runtime.
- No backend feature expansion beyond verifying that the frontend still points at the configured scoreboard API.
- No broad localization pass.

## Runtime Design

The pass keeps simulation and rendering ownership as-is. Gameplay state remains inside the existing game modules, while changes should target render pressure, UI rebuild pressure, and release safety.

Performance work should prioritize:

- Avoiding unnecessary object churn in frequently refreshed UI surfaces.
- Keeping particle, projectile, floating-text, ground-effect, and late-wave visual caps enforceable.
- Making high-load fallback behavior clear and non-disruptive.
- Preserving save/resume behavior while avoiding renderer-owned objects in saved state.

Changes that alter tower damage, enemy HP, wave composition, economy, or challenge rules are out of scope unless a verified bug requires a narrow fix.

## UI Design

The UI should remain readable without hiding the playfield. Critical survival information stays first: Stability, Memory, Wave, boss/notice state, and placement affordability. Secondary information such as synergies, lore, damage breakdowns, and deeper tower details should stay compact or contextual.

Polish work should focus on:

- HUD hierarchy and text wrapping under combat pressure.
- TowerBar selected, unaffordable, locked, and control states.
- SidePanel upgrade readability and scroll stability.
- Pause, victory, defeat, abandon, and score-submit overlays.
- Mobile landscape sanity and portrait recommendation behavior.

Canvas UI remains acceptable for this pass because the current game already ships with Pixi-based UI. DOM migration is not part of this release pass.

## QA Design

Verification must happen before deploy.

Required checks:

- `npm run typecheck`
- `npm run build`
- local production preview smoke test
- screenshot review for menu, active run, pause overlay, and at least one compact/mobile viewport

The QA pass should look for boot failures, console errors, unreadable or overlapping UI, broken input state, missing assets, and obvious performance regressions. If a check fails, deploy is blocked until the failure is fixed or explicitly accepted.

## Deploy Design

Deployment uses the existing PowerShell script behind `npm run deploy:server`. The deploy target remains `http://fersd.com/emoticore-td/` with Vite base `/emoticore-td/`.

The deploy script already builds, copies release docs into `dist/release-docs`, uploads `dist`, replaces `/var/www/html/emoticore-td`, and verifies the deployed index plus main asset. That workflow remains the release path.

## Success Criteria

- Production build completes without TypeScript or Vite errors.
- Smoke test boots to the first actionable screen.
- Main menu, active run UI, and overlays have no obvious text overlap at representative desktop and mobile-sized viewports.
- No new gameplay-content scope is introduced.
- Deploy command completes and reports the public URL.
