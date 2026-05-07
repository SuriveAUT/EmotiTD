# EMOTICORE TD Balance Notes

## Balance Pass 1 - 2026-05-07

### Goals

- Wave 1-5: light onboarding with enough Memory to try two to three early towers.
- Wave 6-10: learning phase that introduces support pressure and the first heavy enemy checks.
- Wave 10: first real boss test, not a hard wall.
- Wave 11-20: build test for mixed tower coverage, upgrades, and support placement.
- Wave 21-30: heavy final phase where missed counters and single-type builds should struggle.

### Test Plan

1. Start a standard run without DevTools and play waves 1-5 using two different opening builds.
   - Expected: no core damage or only minor mistakes punished.
   - Watch: whether Anger-only or Joy-only clears with too much leftover Memory.
2. Play waves 6-10 with at least one support/control tower and one damage tower.
   - Expected: Guilt Giant, Envy Leech, and Wave 10 boss require targeting/upgrades, but remain recoverable.
   - Watch: whether Wave 10 boss survives too long without a boss/DoT/mark answer.
3. Jump to waves 11, 15, 20 with DevTools and test mixed builds.
   - Expected: mixed builds feel stronger through resonance/synergy, but single-type builds can still limp through with focused upgrades.
   - Watch: whether Calm/Trust defensive stacking removes too much risk.
4. Jump to waves 21, 25, 30 and test final-phase pressure.
   - Expected: Void/Numb/Overthinker combinations force target selection and counter coverage.
   - Watch: whether late enemy density causes visual clutter or unavoidable leaks.
5. Use DevTools "LOG RUNSTATS JSON" after each segment.
   - Compare damage by emotion, kills by enemy kind, memory earned, core damage taken, and max resonance time.

### Major Changes

- Tower costs were slightly normalized:
  - Anger/Fear/Disgust/Guilt became a little more expensive to reduce trivial early damage stacking.
  - Sadness/Calm/Hope/Trust became slightly cheaper to make control, support, and defensive mixed builds easier to enter.
  - Damage values and mechanics were not changed.
- Enemy base rewards were nudged up while several bulky enemy HP values were slightly reduced.
  - This smooths early/mid economy without making raw tower DPS stronger.
  - Spiral bounty increased so boss kills feel economically meaningful.
- Wave HP scaling was split into phases instead of one linear formula.
  - Waves 1-5 now scale gently.
  - Waves 6-10 ramp into the first boss.
  - Waves 11-20 increase steadily as the build test.
  - Waves 21-30 escalate harder for final pressure.
- Wave density was reduced in early and boss waves.
  - Fewer early Doubtlings/Panic Runners and slightly wider spacing give players more time to learn.
  - Boss waves now use fewer adds around the Spiral so the boss itself is the test.
- Boss HP scaling was reduced for Wave 10 and made more gradual.
  - Wave 10 should be a real check, not a run-ending wall.
  - Wave 30 receives an extra boss scale bump for the final phase after static curve testing showed the boss wave had much lower total HP than waves 28-29.
- Upgrade costs were re-tiered.
  - High-output damage paths, chain scaling, poison/mark scaling, and boss-pressure upgrades cost more.
  - Support/defensive first upgrades are slightly more accessible.
  - Second upgrade levels are generally more expensive to delay snowballing.

### Open Questions For Next Pass

- Does Anger still dominate early waves because splash handles density too efficiently?
- Does Trust plus Calm create too much safety once both have defensive upgrades?
- Is Wave 10 boss clearable with at least three distinct mixed-build openings?
- Are Wave 21-30 enemy counts challenging without becoming unreadable?
