import assert from 'node:assert/strict';
import test from 'node:test';
import { compactStatusNotice, overlayButtonWidth, placementHintCopy, sidePanelBodyTextWidth } from '../test-artifacts/logic-tests/src/ui/textPolicy.js';

test('keeps short status notices unchanged', () => {
  assert.equal(compactStatusNotice('Short notice', 20), 'Short notice');
});

test('compacts long status notices at a word boundary', () => {
  assert.equal(
    compactStatusNotice('Performance recovered. Visual quality reduced.', 32),
    'Performance recovered. Visual...'
  );
});

test('uses stable overlay button widths for short and long labels', () => {
  assert.equal(overlayButtonWidth('RESTART'), 170);
  assert.equal(overlayButtonWidth('CONTINUE ENDLESS'), 230);
});

test('keeps placement hint copy compact and two-line friendly', () => {
  assert.equal(placementHintCopy('Anger'), 'PLACING ANGER\nTap map to place / banner to cancel');
});

test('keeps side panel body text inside the inspector gutter', () => {
  assert.equal(sidePanelBodyTextWidth(304), 268);
  assert.equal(sidePanelBodyTextWidth(140), 120);
});
