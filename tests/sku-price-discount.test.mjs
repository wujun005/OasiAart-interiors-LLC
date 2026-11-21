import assert from 'node:assert/strict';
import test from 'node:test';
import { saleFromPercentOff } from '../src/modules/admin/utils/skuPriceTable.ts';

test('a percent off fills the discount price from the original price', () => {
  assert.equal(saleFromPercentOff(100, 10), 90);
  assert.equal(saleFromPercentOff(99.99, 10), 89.99);
  assert.equal(saleFromPercentOff(10.05, 10), 9.05);
  assert.equal(saleFromPercentOff(100, 0), 0);
  assert.equal(saleFromPercentOff(0, 10), 0);
  assert.equal(saleFromPercentOff(0.01, 99.99), null);
  assert.equal(saleFromPercentOff(100, 100), null);
  assert.equal(saleFromPercentOff(100, -1), null);
});
