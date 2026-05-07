# EMOTICORE TD Balance Notes

## Balance Pass 2 - Hard Mode Implementation (2026-05)

### Goals
- Make the game significantly harder but fair.
- Create strong economy constraints to prevent infinite scaling.
- Distinct tower base costs and clear investment choices.
- Extend upgrades to 4-tiers to smooth out power spikes and give late-game progression.
- Harder wave scaling and boss hp scaling.

### Major Changes

1. **Economy Constraints (Phase A & B)**
   - Hard capped alpha balance: `startingMemory` reduced to 120.
   - `interestPerWave` reduced to 0.015 and capped with `interestCap` at 25.
   - `coreShieldMax` added (5 cap) and `stabilityRegenCapPerWave` added (1 cap).
   - Enemy bounties significantly reduced across the board (e.g. Spiral bounty 230 -> 115).

2. **Tower Differentiation (Phase C)**
   - Towers completely re-priced into distinct tiers (Range: 76 - 148 memory).
   - Cheap starters (Anger, Fear, Sadness) vs Premium Damage (Pride, Love, Hope).
   - Re-balanced base damages, fire rates, and effects based on the new prices.

3. **Wave Scaling (Phase D)**
   - Exponential hp and boss scaling equations implemented.
   - Reduced spacing (more density) to make waves harder to clear without proper area control.
   - Reduced bonus memory from waves to choke player economy.

4. **Expanded Upgrade Paths (Phase E & F)**
   - Expanded all towers from 2 to 4 upgrade levels.
   - Level 4 is extremely expensive but offers significant "capstone" style bonuses.

5. **Clamp System (Phase G)**
   - Added `clampStats` in `Tower.ts` to hardcap stats like range (max 350), fireRate (min 0.2), and other status effects so they do not scale infinitely.

6. **UI Adjustments (Phase H)**
   - Side panel now correctly shows 4 upgrade levels.

### Open Questions For Next Pass
- Are 4 upgrade levels visually clear enough in the SidePanel?
- Do the hard caps on Stability and Shield feel too restrictive for full defensive builds?
- Can players reliably beat Wave 30 with the much harsher economy?

## Crowd Control Balance Pass (2026-05)

### Problem
- Slow and stun could chain hard enough to stop enemies for too long.
- Sadness/Fear/Calm control builds were suppressing wave pressure and trivializing some bosses.

### Changes
- Added minimum movement speed after all slow effects:
  - Normal enemies: at least 45% base speed.
  - PanicRunner and VoidWraith: at least 55% base speed.
  - Bosses: at least 65% base speed.
  - NumbOne: at least 75% base speed.
- Slow now uses only the strongest active multiplier; additional hits refresh duration without stacking strength.
- Added per-enemy stun immunity after stun attempts, with longer protection for fast enemies, NumbOne, and bosses.
- Added enemy config `slowResist` and `stunResist` values so elites and bosses have clear CC profiles.
- Nerfed Fear base stun chance/duration and Sadness base slow strength/duration.
- Reduced CC-heavy upgrade and synergy bonuses, especially Sadness + Calm, Fear + Calm, and Anger + Fear.
- Calm and Love fire-rate buffs now apply at reduced strength to Fear and Sadness towers.

### Expectation
- Control remains strong against normal enemies, especially with good placement.
- Bosses and NumbOne act as anti-CC checks.
- Enemies continue moving under slow pressure.
- Damage, path coverage, and target priority matter more again.
