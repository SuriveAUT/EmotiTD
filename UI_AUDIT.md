# EMOTICORE TD UI Audit

## Main Findings
- The game still renders to a fixed `1280x800` canvas and scales it with CSS. This keeps gameplay stable, but UI must be designed for the internal canvas and for the scaled touch target size.
- HUD, TowerBar and SidePanel use many fixed x/y values. The worst pressure points are the HUD balance/status region, TowerBar control cluster, and SidePanel upgrade cards.
- HUD information is too flat: primary stats, balance state, synergies and status compete in one row. Synergy chips can collide visually with status/right panel content.
- TowerBar cards are compact and use very small role text. Controls sit inside the same band as buying, which makes the lower UI feel crowded.
- SidePanel is the largest text pressure point. Tower lore, stats, synergy details, breakdowns and upgrades stack into a long inspector; upgrade cards need more height and tighter hierarchy.
- HowToPlay is still a fixed three-column scene. It is readable on desktop, but not a true mobile codex.
- Mobile portrait is not a realistic primary play mode for this UI density. It needs a clear landscape recommendation instead of pretending to be desktop.
- `renderQuality.ts` currently allows high resolution up to `3x`. This is risky for long runs and mobile GPUs, especially with Pixi text and many visual effects.
- Tower range rings are currently only selected/placement, which is good. Synergy lines are selected-only and capped, but visual effects can still build load in long runs.
- UI objects are mostly persistent in HUD, but SidePanel intentionally rebuilds views. Scroll preservation already exists; avoid rebuilding SidePanel from score/memory-only updates.

## Targeted Fixes For This Pass
- Add central layout mode helpers so future UI decisions do not create more hardcoded breakpoint logic.
- Add number formatting helpers for compact HUD values.
- Rebalance HUD into clearer cards with compact synergy/status presentation.
- Make TowerBar cards wider and touch targets larger while keeping the same internal canvas/gameplay layout.
- Give SidePanel upgrade cards more breathing room and reduce text density in tower briefs.
- Cap high render resolution to safer values.
- Add mobile portrait recommendation overlay outside Pixi.
- Document mobile landscape recommendation and UI overhaul.
