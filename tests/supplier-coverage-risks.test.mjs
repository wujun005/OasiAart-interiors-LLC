import assert from 'node:assert/strict';
import test from 'node:test';
import { countCoverageRisks, matchesCoverageFilter } from '../src/modules/admin/pages/supplier-coverage/catalogRisks.ts';

test('only known, on-shelf coverage values qualify as coverage risks', () => {
  const uncovered = { status: ' 1 ', fulfillableSupplierCount: '0', minProfitRate: '-0.005' };
  assert.equal(matchesCoverageFilter(uncovered, 'uncovered'), true);
  assert.equal(matchesCoverageFilter(uncovered, 'single'), false);
  assert.equal(matchesCoverageFilter(uncovered, 'negative'), true);
  assert.equal(matchesCoverageFilter({ status: 1, fulfillableSupplierCount: 1 }, 'single'), true);
  assert.equal(matchesCoverageFilter({ status: 1, fulfillableSupplierCount: 1 }, 'sufficient'), false);
  assert.equal(matchesCoverageFilter({ status: 1, fulfillableSupplierCount: 2 }, 'sufficient'), true);
  assert.equal(matchesCoverageFilter({ status: 1, fulfillableSupplierCount: 2 }, 'single'), false);
  assert.equal(matchesCoverageFilter({ status: 1, fulfillableSupplierCount: 0.5 }, 'single'), false);
  assert.equal(matchesCoverageFilter({ status: 1, minProfitRate: '0.00' }, 'negative'), false);

  for (const status of [0, '0', 2, null, undefined, '', ' ', 'unknown', true, '0x1']) {
    const row = { status, fulfillableSupplierCount: 0, minProfitRate: -1 };
    assert.equal(matchesCoverageFilter(row, 'all'), true);
    for (const filter of ['uncovered', 'single', 'sufficient', 'negative']) {
      assert.equal(matchesCoverageFilter(row, filter), false, `Unexpected risk for shelf status ${String(status)}`);
    }
  }
});

test('missing and invalid numeric values never become uncovered or negative', () => {
  for (const value of [null, undefined, '', '  ', 'N/A', 'NaN', false, [], NaN, Infinity, '-Infinity']) {
    const item = { status: 1, fulfillableSupplierCount: value, minProfitRate: value };
    for (const filter of ['uncovered', 'single', 'sufficient', 'negative']) {
      assert.equal(matchesCoverageFilter(item, filter), false, `Unexpected risk for ${String(value)}`);
    }
  }
  assert.equal(matchesCoverageFilter({ status: 1, minProfitRate: '-4e-2' }, 'negative'), true);
});

test('catalog counts deduplicate each risk independently, using the ID for the selected catalog kind', () => {
  const onShelf = { status: 1 };
  const gap = { ...onShelf, fulfillableSupplierCount: 0, minProfitRate: -.01 };
  const single = { ...onShelf, fulfillableSupplierCount: 1, minProfitRate: .2 };
  const categories = [
    { services: [{ ...gap, spuId: 31 }, { ...single, spuId: 32 }], packages: [{ ...gap, packageId: 13 }] },
    {
      services: [{ ...gap, spuId: ' 031 ' }, { ...single, spuId: '32' },
        { ...gap, spuId: '9007199254740992' }, { ...gap, spuId: '9007199254740993' },
        { ...gap, spuId: '09007199254740993' }, { ...gap, spuId: 9007199254740992 }, { ...gap, spuId: 'missing' },
        { ...gap, packageId: 16 }, { ...gap, spuId: 33, status: 0 }],
      packages: [{ ...gap, packageId: '13' }, { ...single, packageId: '14' }, { ...gap, spuId: 17 }],
    },
    { services: null },
    null,
  ];

  assert.deepEqual(countCoverageRisks(categories, 'service'), { uncovered: 3, single: 1, negative: 3 });
  assert.deepEqual(countCoverageRisks(categories, 'package'), { uncovered: 1, single: 1, negative: 1 });
  assert.deepEqual(countCoverageRisks([], 'service'), { uncovered: 0, single: 0, negative: 0 });
});
