import assert from 'node:assert/strict'
import test from 'node:test'
import { filterQuoteCompareMatrix } from '../src/modules/admin/utils/quoteCompareFilters.ts'

const cell = (quotePrice, overrides = {}) => ({ quotePrice, profitRate: 0.5, status: 2, quoteMode: 1,
  versionNo: 1, best: true, ...overrides })
const row = (skuId, cells, overrides = {}) => ({ key: String(skuId), skuId, skuCode: `SKU-${skuId}`,
  spuId: 10, spuName: 'Villa cleaning', platformPrice: 100, cells, ...overrides })
const matrix = (skus) => ({ suppliers: [
  { id: 11, name: 'Alpha', no: 'SUP11' }, { id: 22, name: 'Beta', no: 'SUP22' },
  { id: 33, name: 'Gamma', no: 'SUP33' },
], skus, grouped: new Set(skus.map(sku => sku.spuId)).size > 1 })
const fixture = () => matrix([
  row(101, { 11: cell(0, { profitRate: 1, status: 1 }), 22: cell(40, { profitRate: 0.6 }),
    33: cell(60, { profitRate: 0.4, quoteMode: 2 }) }),
  row(102, { 11: cell(30, { profitRate: 0.7 }), 22: cell(30, { profitRate: 0.7, status: 1 }) }),
  row(103, { 33: cell(70, { profitRate: 0.3, status: 1, quoteMode: 2 }) }),
  row(104, { 11: cell(null, { profitRate: 10, status: 1 }), 22: cell(-1, { profitRate: 11 }),
    33: cell(Infinity, { profitRate: 12 }) }),
])

test('default view preserves missing rows, compares valid prices including zero and marks all ties', () => {
  const source = fixture()
  const view = filterQuoteCompareMatrix(source, {})
  assert.deepEqual(view.skus.map(sku => sku.key), ['101', '102', '103', '104'])
  assert.equal(view.quoteCount, 6)
  assert.equal(view.pendingCount, 3)
  assert.equal(view.lowestPrice, 0)
  assert.equal(view.comparableSkuCount, 2)
  assert.equal(view.skus[0].lowestPrice, 0)
  assert.equal(view.skus[0].highestPrice, 60)
  assert.equal(view.skus[0].spread, 60)
  assert.deepEqual(view.skus[0].lowestSupplierIds, [11])
  assert.equal(view.skus[0].cells[11].best, true)
  assert.equal(view.skus[0].cells[22].best, false)
  assert.equal(view.skus[1].spread, 0)
  assert.deepEqual(view.skus[1].lowestSupplierIds, [11, 22])
  assert.equal(view.skus[1].cells[11].best, true)
  assert.equal(view.skus[1].cells[22].best, true)
  assert.equal(view.skus[2].spread, null)
  assert.equal(view.skus[3].lowestPrice, null)
  assert.equal(view.skus[3].highestPrice, null)
  assert.deepEqual(view.skus[3].lowestSupplierIds, [])
  assert.equal(view.skus[3].cells[22].quotePrice, null)
  assert.equal(view.skus[3].cells[33].best, false)
})

test('supplier and SKU selections combine with localized search and keep source missing distinct from filtered cells', () => {
  const view = filterQuoteCompareMatrix(fixture(), {
    supplierIds: [22, 33], skuKeys: ['101', '102', '103'], search: '  2 bhk  ',
    status: 2, quoteMode: 1, minPrice: 30, maxPrice: 40,
  }, { 101: 'Unfurnished · 2 BHK', 102: 'Furnished · 2 BHK', 103: '3 BHK' })
  assert.deepEqual(view.suppliers.map(supplier => supplier.id), [22, 33])
  assert.deepEqual(view.skus.map(sku => sku.key), ['101'])
  assert.deepEqual(Object.keys(view.skus[0].cells), ['22'])
  assert.deepEqual(view.skus[0].excludedSupplierIds, [33])
  assert.equal(view.skus[0].cells[11], undefined)
  assert.equal(view.skus[0].cells[22].best, true)
  assert.equal(view.quoteCount, 1)
  assert.equal(view.pendingCount, 0)
  assert.equal(view.lowestPrice, 40)
  assert.equal(view.comparableSkuCount, 0)

  const partial = filterQuoteCompareMatrix(fixture(), { status: 1 })
  const missing = partial.skus.find(sku => sku.skuId === 102)
  assert.deepEqual(missing.excludedSupplierIds, [11])
  assert.equal(missing.cells[11], undefined)
  assert.equal(missing.cells[33], undefined)
  assert.equal(missing.excludedSupplierIds.includes(33), false, 'A supplier with no source quote is not filtered out')
})

test('empty selections mean all; selected columns preserve unquoted rows until a quote filter is active', () => {
  const all = filterQuoteCompareMatrix(fixture(), { supplierIds: [], skuKeys: [] })
  assert.equal(all.suppliers.length, 3)
  assert.equal(all.skus.length, 4)
  const selected = filterQuoteCompareMatrix(fixture(), { supplierIds: [11] })
  assert.equal(selected.skus.length, 4)
  assert.deepEqual(selected.skus[2].cells, {})
  assert.deepEqual(selected.skus[2].excludedSupplierIds, [])
  assert.equal(selected.quoteCount, 2)
  assert.equal(selected.pendingCount, 1)
  assert.equal(selected.comparableSkuCount, 0)
  assert.deepEqual(filterQuoteCompareMatrix(fixture(), { supplierIds: [11], status: 1 }).skus.map(sku => sku.skuId), [101])
  assert.deepEqual(filterQuoteCompareMatrix(fixture(), { search: 'SKU-102' }).skus.map(sku => sku.skuId), [102])
  assert.equal(filterQuoteCompareMatrix(fixture(), { search: 'VILLA CLEANING' }).skus.length, 4)
})

test('comparable-only requires two matching priced suppliers after every other filter', () => {
  const all = filterQuoteCompareMatrix(fixture(), { onlyComparable: true })
  assert.deepEqual(all.skus.map(sku => sku.skuId), [101, 102])
  assert.equal(all.quoteCount, 5)
  assert.equal(all.comparableSkuCount, 2)
  const fixedApproved = filterQuoteCompareMatrix(fixture(), { onlyComparable: true, status: 2, quoteMode: 1 })
  assert.equal(fixedApproved.skus.length, 0)
  assert.equal(fixedApproved.quoteCount, 0)
  assert.equal(fixedApproved.lowestPrice, null)
  assert.equal(filterQuoteCompareMatrix(fixture(), { onlyComparable: true, supplierIds: [11] }).skus.length, 0)
})

test('price filters are inclusive and safe with zero, absent bounds, invalid bounds and reversed ranges', () => {
  const zero = filterQuoteCompareMatrix(fixture(), { minPrice: 0, maxPrice: 0 })
  assert.deepEqual(zero.skus.map(sku => sku.skuId), [101])
  assert.deepEqual(Object.keys(zero.skus[0].cells), ['11'])
  assert.deepEqual(zero.skus[0].excludedSupplierIds, [22, 33])
  assert.equal(zero.lowestPrice, 0)
  assert.equal(zero.quoteCount, 1)
  assert.equal(filterQuoteCompareMatrix(fixture(), { maxPrice: 30 }).quoteCount, 3)
  assert.equal(filterQuoteCompareMatrix(fixture(), { minPrice: null, maxPrice: null }).skus.length, 4)
  assert.equal(filterQuoteCompareMatrix(fixture(), { minPrice: -1, maxPrice: Infinity }).skus.length, 4)
  assert.equal(filterQuoteCompareMatrix(fixture(), { minPrice: NaN, maxPrice: -10 }).quoteCount, 6)
  const reversed = filterQuoteCompareMatrix(fixture(), { minPrice: 60, maxPrice: 30 })
  assert.equal(reversed.skus.length, 0)
  assert.equal(reversed.quoteCount, 0)
  assert.equal(reversed.pendingCount, 0)
  assert.equal(reversed.lowestPrice, null)
  assert.equal(reversed.grouped, false)
})

test('sorts within service groups, keeps null metrics last and preserves equal-price source order', () => {
  const source = matrix([
    row(101, { 11: cell(40), 22: cell(80) }),
    row(102, { 11: cell(20), 22: cell(80) }),
    row(103, { 11: cell(null) }),
    row(104, { 11: cell(20), 22: cell(50) }),
    row(201, { 11: cell(1), 22: cell(100) }, { spuId: 20, spuName: 'Windows' }),
    row(202, { 11: cell(0) }, { spuId: 20, spuName: 'Windows' }),
  ])
  assert.deepEqual(filterQuoteCompareMatrix(source, {}).skus.map(sku => sku.skuId), [101, 102, 103, 104, 201, 202])
  assert.deepEqual(filterQuoteCompareMatrix(source, { sort: 'price-asc' }).skus.map(sku => sku.skuId), [102, 104, 101, 103, 202, 201])
  const spread = filterQuoteCompareMatrix(source, { sort: 'spread-desc' })
  assert.deepEqual(spread.skus.map(sku => sku.skuId), [102, 101, 104, 103, 201, 202])
  assert.equal(spread.grouped, true)
  assert.equal(spread.comparableSkuCount, 4)
  assert.equal(filterQuoteCompareMatrix(source, { skuKeys: ['201'] }).grouped, false)
})

test('filtering and winner recalculation do not mutate the source matrix or reuse its cells', () => {
  const source = fixture()
  const before = structuredClone(source)
  const freeze = (value) => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze)
      Object.freeze(value)
    }
  }
  freeze(source)
  const view = filterQuoteCompareMatrix(source, { supplierIds: [22], status: 2 })
  assert.deepEqual(source, before)
  assert.notEqual(view.skus[0], source.skus[0])
  assert.notEqual(view.skus[0].cells[22], source.skus[0].cells[22])
  assert.equal(view.skus[0].cells[22].best, true)
  assert.equal(source.skus[0].cells[11].best, true)
  assert.equal(source.skus[0].cells[22].best, true)
})

test('invalid profit rates never win and negative finite margins still compare correctly', () => {
  const source = matrix([row(101, { 11: cell(10, { profitRate: Infinity }),
    22: cell(20, { profitRate: -0.1 }), 33: cell(30, { profitRate: -0.2 }) })])
  const view = filterQuoteCompareMatrix(source, {})
  assert.equal(view.skus[0].cells[11].best, false)
  assert.equal(view.skus[0].cells[22].best, true)
  assert.equal(view.skus[0].cells[33].best, false)
})
