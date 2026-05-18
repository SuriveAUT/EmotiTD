# Performance UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve EMOTICORE TD release stability with a small performance policy layer, tighter UI text policy, browser smoke checks, and deploy verification.

**Architecture:** Keep the PixiJS canvas game intact. Add pure policy helpers for render pressure and UI text compaction, then integrate them into `VisualBudget`, `Game`, `HUD`, `TowerBar`, and overlay button sizing without touching gameplay balance. Validate pure behavior with Node-based TypeScript tests and validate canvas UI with local production preview screenshots.

**Tech Stack:** TypeScript, Vite, PixiJS v8, Node built-in `node:test`, PowerShell deploy script.

---

### Task 1: Add Logic Test Harness and Failing Tests

**Files:**
- Modify: `package.json`
- Create: `tools/run-typescript-tests.mjs`
- Create: `tools/performancePolicy.test.ts`
- Create: `tools/textPolicy.test.ts`

- [ ] **Step 1: Add the test script and test runner**

Add `test:logic` to `package.json`:

```json
"test:logic": "node tools/run-typescript-tests.mjs"
```

Create `tools/run-typescript-tests.mjs` to compile selected source and test files to `test-artifacts/logic-tests`, then run Node's built-in test runner against the compiled `.js` tests.

- [ ] **Step 2: Write failing tests**

`tools/performancePolicy.test.ts` should assert:

```ts
assert.deepEqual(classifyVisualLoad({ wave: 8, fps: 60, enemyCount: 10, projectileCount: 20, particleCount: 30, quality: 'medium' }), { level: 'normal', skipRate: 1 });
assert.deepEqual(classifyVisualLoad({ wave: 36, fps: 48, enemyCount: 20, projectileCount: 30, particleCount: 40, quality: 'medium' }), { level: 'medium', skipRate: 2 });
assert.equal(assessPerformancePressure(sampleAtCap, caps).recoveryRecommended, true);
```

`tools/textPolicy.test.ts` should assert:

```ts
assert.equal(compactStatusNotice('Short notice', 20), 'Short notice');
assert.equal(compactStatusNotice('Performance recovered. Visual quality reduced.', 32), 'Performance recovered. Visual...');
assert.equal(overlayButtonWidth('RESTART'), 170);
assert.equal(overlayButtonWidth('CONTINUE ENDLESS'), 230);
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm run test:logic`

Expected: fails because `src/core/performancePolicy.ts` and `src/ui/textPolicy.ts` do not exist yet.

### Task 2: Implement Performance Policy and Integrate It

**Files:**
- Create: `src/core/performancePolicy.ts`
- Modify: `src/core/VisualBudget.ts`
- Modify: `src/game/Game.ts`

- [ ] **Step 1: Implement minimal policy helper**

Create `classifyVisualLoad(input)` returning the existing `normal/medium/high/extreme` levels and skip rates, plus `assessPerformancePressure(sample, caps)` returning cap ratios, level, reason, and `recoveryRecommended`.

- [ ] **Step 2: Run logic tests and verify GREEN for policy**

Run: `npm run test:logic`

Expected: performance policy tests pass once `textPolicy` exists in Task 3; before that, only text module absence remains.

- [ ] **Step 3: Integrate into `VisualBudget`**

Replace duplicated threshold logic in `VisualBudget.update()` with `classifyVisualLoad(input)`. Preserve `shouldRender()` behavior and effect-kind offsets.

- [ ] **Step 4: Integrate into `Game.updateHighLoadRecovery()`**

Use `assessPerformancePressure(...)` to decide when to accumulate `highLoadTimer`. Keep the existing panic recovery mechanism, but make the warning reason more specific than raw FPS when a cap is reached.

### Task 3: Implement UI Text Policy and Integrate It

**Files:**
- Create: `src/ui/textPolicy.ts`
- Modify: `src/ui/HUD.ts`
- Modify: `src/ui/TowerBar.ts`
- Modify: `src/game/Game.ts`

- [ ] **Step 1: Implement minimal text policy helper**

Create:

```ts
export function compactStatusNotice(text: string, maxChars = 42): string
export function overlayButtonWidth(label: string): number
export function placementHintCopy(label: string): string
```

The status compactor should prefer word boundaries, overlay buttons should keep the current 170/230 sizing contract, and placement hints should avoid a long single-line sentence.

- [ ] **Step 2: Run logic tests and verify GREEN**

Run: `npm run test:logic`

Expected: all logic tests pass.

- [ ] **Step 3: Integrate into HUD and overlays**

Use `compactStatusNotice` in `HUD`, `overlayButtonWidth` in `Game.createOverlayButton()`, and `placementHintCopy` in `TowerBar.updatePlacementHint()`.

- [ ] **Step 4: Keep UI text wrapped**

Update placement hint text style to use `wordWrap: true`, `wordWrapWidth: 316`, and a modest `lineHeight` so the banner cannot overflow.

### Task 4: Release Verification and Deploy

**Files:**
- Modify only if verification exposes a concrete issue.

- [ ] **Step 1: Run full local verification**

Run:

```powershell
npm run test:logic
npm run typecheck
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run production preview smoke test**

Run `npm run preview -- --host 127.0.0.1`, open the local preview in the in-app browser, capture screenshots for main menu, active run, pause overlay, and compact/mobile viewport.

- [ ] **Step 3: Fix any verified blocker**

If screenshots show text overlap, boot failure, missing assets, or console errors, add a narrow fix and repeat Step 1 and Step 2.

- [ ] **Step 4: Deploy**

Run: `npm run deploy:server`

Expected: script builds with base `/emoticore-td/`, uploads `dist`, verifies deployed index and main asset, and prints `http://fersd.com/emoticore-td/`.

---

## Self-Review

- Spec coverage: performance hardening is covered by Tasks 1-2, UI polish by Task 3, QA and deploy by Task 4.
- Placeholder scan: no TBD/TODO/fill-later language remains.
- Type consistency: `classifyVisualLoad`, `assessPerformancePressure`, `compactStatusNotice`, `overlayButtonWidth`, and `placementHintCopy` are introduced before integration steps reference them.
