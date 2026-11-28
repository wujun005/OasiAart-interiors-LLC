import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/modules/client/utils/package-visit-progress.ts', import.meta.url), 'utf8');
const exports = {};
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { buildPackageVisitProgress } = exports;

const states = (plan) => Array.from(plan.rounds, (round) => round.state);
const summary = ({ total, completed, scheduled, available, next }) => [total, completed, scheduled, available, next];

test('the purchased package advances from Visit 2 to Visit 3, then has no next visit', () => {
  const history = [{ seqNo: 1, spuId: 7, scheduleStatus: 1, serviceStatus: 2 }];
  const plan = (remainingTimes, canSchedule = true) => buildPackageVisitProgress([
    { spuId: '7', totalTimes: '3', remainingTimes },
  ], history, canSchedule);
  assert.deepEqual(summary(plan(2)), [3, 1, 0, 2, 2]);
  assert.deepEqual(states(plan(2)), ['completed', 'available', 'available']);

  history.push({ seqNo: 2, spuId: 7, scheduleStatus: 1 });
  assert.deepEqual(summary(plan(1)), [3, 1, 1, 1, 3]);
  assert.deepEqual(states(plan(1, false)), ['completed', 'scheduled', 'unavailable']);
  assert.equal(plan(1, false).next, null);

  history.push({ seqNo: 3, spuId: 7, scheduleStatus: 1 });
  assert.deepEqual(summary(plan(0)), [3, 1, 2, 0, null]);
});

test('multiple service records share each round and a canceled service can reopen its round', () => {
  const history = [
    { seqNo: 2, skuId: 302, scheduleStatus: 1 },
    { seqNo: 1, skuId: 302, scheduleStatus: 1, serviceStatus: 2 },
    { seqNo: 2, fulfillmentNo: 'PK-SPU7-N2', scheduleStatus: 2, serviceStatus: 2 },
    { seqNo: 1, spuId: 7, skuId: 201, scheduleStatus: 1, serviceStatus: 2 },
  ];
  const plan = (occupiedTimes) => buildPackageVisitProgress([
    { bindType: 1, spuId: '7', redeemTimes: 3, occupiedTimes },
    { bindType: 2, skuId: '302', redeemTimes: 2, remainingTimes: 0 },
  ], history, true);
  const reopened = plan(1);
  assert.deepEqual(summary(reopened), [3, 1, 0, 2, 2]);
  assert.deepEqual(states(reopened), ['completed', 'partial', 'available']);
  assert.equal(reopened.numberByFulfillment.get(0), 2);
  assert.equal(reopened.numberByFulfillment.get(1), 1);
  assert.equal(reopened.numberByFulfillment.has(2), false);
  assert.equal(reopened.numberByFulfillment.get(3), 1);

  history.push({ seqNo: 3, fulfillmentNo: 'PK-SPU7-N3', scheduleStatus: 1 });
  const replacement = plan(2);
  assert.deepEqual(summary(replacement), [3, 1, 1, 1, 3]);
  assert.equal(replacement.numberByFulfillment.get(4), 2);
});

test('prepared visits retain their numbers while missing quota data leaves the next visit unknown', () => {
  const history = [null, { seqNo: '6', spuId: 7, scheduleStatus: 0 }];
  const legacy = buildPackageVisitProgress(undefined, history, true);
  assert.deepEqual(summary(legacy), [1, 0, 0, 0, null]);
  assert.equal(legacy.numberByFulfillment.get(1), 1);
  assert.deepEqual(states(legacy), ['pending']);
});
