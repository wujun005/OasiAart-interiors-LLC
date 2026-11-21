import assert from 'node:assert/strict';
import test from 'node:test';

import { claimPurchase, parseMoney, purchaseOrderKey } from '../src/modules/client/utils/metaPixel.ts';

test('parseMoney reads AED amounts and rejects empty values', () => {
  assert.equal(parseMoney('AED 12.5'), 12.5);
  assert.equal(parseMoney('12.50 AED'), 12.5);
  assert.equal(parseMoney(0), 0);
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney('not-a-price'), null);
  assert.equal(parseMoney(-1), null);
});

test('purchaseOrderKey sorts and dedupes order references', () => {
  assert.equal(purchaseOrderKey(' b, a , b '), 'a,b');
  assert.equal(purchaseOrderKey(''), '');
});

test('claimPurchase fires once for the same order in this page', () => {
  assert.equal(claimPurchase('order-a'), 'order-a');
  assert.equal(claimPurchase('order-a'), null);
  assert.equal(claimPurchase(''), null);
});
