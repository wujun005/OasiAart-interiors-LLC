import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/admin/utils/supplierPortal.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const exports = {}
runInNewContext(code, { exports })
const { calculatedQuotePrice, optionMissingFields, quoteActionKey, supplierOrderBucket } = exports
const fields = (...args) => Array.from(optionMissingFields(...args))

test('hourly prices follow rate × staff × hours and reject missing or nonfinite inputs', () => {
  assert.equal(calculatedQuotePrice(80, 2, 3), 480)
  assert.equal(calculatedQuotePrice(79.99, 3, 1.5), 359.96)
  for (const rate of [null, '', 0, -1, Infinity, 'invalid']) assert.equal(calculatedQuotePrice(rate, 2, 3), null)
})

test('fixed prices are independent of staffing and disabled options require no fields', () => {
  const row = { enabled: true, staffCount: 2, serviceHours: 3, quotePrice: 329 }
  assert.deepEqual(fields(row, 1, 80), [])
  assert.deepEqual(fields({ ...row, staffCount: 4, serviceHours: 5 }, 1, 120), [])
  for (const price of [null, '', 0, -1, 'abc', '10.999']) {
    assert.deepEqual(fields({ ...row, quotePrice: price }, 1, 80), ['price'])
  }
  assert.deepEqual(fields({ enabled: false }, 1, null), [])
  assert.deepEqual(fields({ enabled: true, available: false }, 1, null), [])
  assert.deepEqual(fields({ ...row, staffCount: 1.5 }, 1, 80), ['staff'])
})

test('each quotation status has one destination-specific action', () => {
  assert.deepEqual([undefined, 0, 1, 2, 3].map(quoteActionKey), [
    'setUpQuote', 'continueQuote', 'viewSubmittedQuote', 'managePricing', 'updateResubmit',
  ])
})

test('cancelled orders never inflate active order metrics', () => {
  assert.equal(supplierOrderBucket({ orderStatus: 3, serviceStatus: 1 }), 'cancelled')
  assert.deepEqual([0, 4, 3, 1, 2].map((serviceStatus) => supplierOrderBucket({ serviceStatus })), [
    'new', 'upcoming', 'progress', 'progress', 'completed',
  ])
})
