# EMOTICORE TD - Closed Alpha Playtest Guide

Thanks for testing EMOTICORE TD. The build is alpha: the loop is playable, but balance, audio polish, and edge cases are still in motion. Your feedback lets us decide what to harden next.

## Goal of the alpha

We want to learn whether:

1. The core loop (build, balance emotions, upgrade, survive) reads as fun within the first run.
2. The 12 towers have distinct, understandable roles.
3. Difficulty pacing across Wave 1-30 is fair.
4. The boss rotation (Spiral / Mask / Burnout) feels readable.
5. Challenge modes change the run enough to matter.

We are not yet looking for final balance numbers. We are looking for clarity, fairness, and friction points.

## How to start

1. Open the alpha build in a desktop browser (Chrome/Edge/Firefox, latest version). Mobile is not supported.
2. Allow audio. The game starts on the main menu.
3. From the main menu:
   - Select a **Map** (Fractured Mind, Silent Lake, or Panic Circuit).
   - Select a **Mode** (Standard recommended for the first run).
   - Click **START RUN**.
4. The first run shows a short tutorial. Skip is fine on later runs.
5. Hotkeys you may want:
   - `Space` - start next wave
   - `P` - pause
   - `F` - speed toggle
   - `1-9` - select tower in the active category
   - `F2` or `` ` `` - toggle dev tools (alpha only)
   - `Esc` / right click - cancel placement or close detail
6. Reset progress: main menu -> RESET SAVE.

## What to test

Pick at least **two** focus areas. You do not have to cover everything.

### Run feel
- Does the first 30 seconds make sense?
- After three placed towers, do you feel like you have a plan?
- Are wave breaks long enough for upgrades and re-positioning?

### Towers
- Pick a category tab. Try every tower in it once across runs.
- Do the in-game tooltips match what the tower actually does?
- Which towers do you ignore? Which do you over-rely on?

### Bosses
- Wave 10 (Spiral): do you notice the balance disruption?
- Wave 20 (Mask): does the resist swap force you to switch damage?
- Wave 30 (Burnout): are Overheat zones readable?

### UI
- Tower bar tabs and category switching.
- Side panel content during placement, tower select, victory/defeat.
- HUD readability when wave 10+ enemy density spikes.
- Tooltips: hover any tower button.

### Modes
- Try at least one challenge mode (Boss Rush, Limited Emotions, Fragile Core, Resonance Trial).
- Note whether the mode rule felt clear from the menu description.

## Feedback questions

Use `ALPHA_FEEDBACK_TEMPLATE.md` to send notes. Short answers are fine.

## Known limitations

- Audio is placeholder. No mute-mix or final SFX.
- Save data is local; clearing browser storage resets progress.
- Mobile/touch is unsupported. Resize below ~1280x720 will downscale.
- Performance has been tuned for desktop GPUs; integrated graphics on long runs may dip below 60fps once the field is full.
- Some balance numbers are intentionally rough; ignore tuning unless something feels broken.
- Dev tools (`F2`) are exposed on the alpha build for repro. They will be hidden in release.

## Recommended test duration

Plan for **15-25 minutes** per session. That covers:

- 1 full Standard run (about 12-18 minutes if you reach Wave 20).
- A short Challenge mode attempt (5-7 minutes) or a second Standard run on a different map.

If you do not finish a run, that is data too: tell us where you stopped.

## When you finish

1. Open the Victory or Defeat panel.
2. Click **COPY RUN SUMMARY**. The JSON lands on your clipboard. Paste it into the feedback template.
3. Fill in the rest of the template and send it back through the agreed channel.

Thanks for the time. Notes from this round shape the next milestone.
