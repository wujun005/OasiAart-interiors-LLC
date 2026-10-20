import assert from 'node:assert/strict'
import test from 'node:test'
import { sortSupplierQueue, supplierMatchesQueueFocus, supplierQuoteBadges } from '../src/modules/admin/utils/supplierQueue.ts'

test('suppliers waiting for review or a quote decision stay ahead of settled ones', () => {
  const sorted = sortSupplierQueue([
    { id: 'approved-old', onboardingStatus: 2, latestSubmitTime: '2026-10-10 09:00' },
    { id: 'quotes', onboardingStatus: 2, pendingCount: 7, latestSubmitTime: '2026-10-17 20:08' },
    { id: 'submitted-new', onboardingStatus: 1, latestSubmitTime: '2026-10-18 22:20' },
    { id: 'approved-new', onboardingStatus: 2, latestSubmitTime: '2026-10-18 21:11' },
    { id: 'price-change', onboardingStatus: 2, priceChangePendingCount: 1, latestSubmitTime: '2026-10-13 13:03' },
    { id: 'submitted-old', onboardingStatus: 1, latestSubmitTime: '2026-10-15 16:00' },
  ])

  assert.deepEqual(sorted.map((row) => row.id), [
    'submitted-new',
    'quotes',
    'submitted-old',
    'price-change',
    'approved-new',
    'approved-old',
  ])
})

test('quote badges keep pending, rejected, and approved counts visible together', () => {
  assert.deepEqual(supplierQuoteBadges({
    pendingCount: 2,
    rejectedCount: 1,
    effectiveCount: 5,
    priceChangePendingCount: 0,
  }), {
    pending: 2,
    rejected: 1,
    approved: 5,
    priceChange: 0,
    none: false,
  })
  assert.equal(supplierQuoteBadges({ effectiveCount: 0, pendingCount: 0 }).none, true)
})

test('queue focus matches price changes, missing quotes, and licences that need attention', () => {
  assert.equal(supplierMatchesQueueFocus({ priceChangePendingCount: 2, effectiveCount: 1 }, 'priceChange'), true)
  assert.equal(supplierMatchesQueueFocus({ priceChangePendingCount: 0, effectiveCount: 1 }, 'priceChange'), false)
  assert.equal(supplierMatchesQueueFocus({ effectiveCount: 0, pendingCount: 0, priceChangePendingCount: 0 }, 'noQuote'), true)
  assert.equal(supplierMatchesQueueFocus({ effectiveCount: 3 }, 'noQuote'), false)
  assert.equal(supplierMatchesQueueFocus({ licenseExpiry: '2026-10-01' }, 'licence'), true)
  assert.equal(supplierMatchesQueueFocus({ licenseExpiry: '2026-11-01' }, 'licence'), true)
  assert.equal(supplierMatchesQueueFocus({ licenseExpiry: '2027-01-01' }, 'licence'), false)
  assert.equal(supplierMatchesQueueFocus({}, 'licence'), false)
})

test('missing quotes and an expired licence stay with the items that need action', () => {
  const sorted = sortSupplierQueue([
    { id: 'settled', onboardingStatus: 2, effectiveCount: 3, latestSubmitTime: '2026-10-18 21:11' },
    { id: 'no-quote', onboardingStatus: 2, effectiveCount: 0, latestSubmitTime: '2026-10-12 10:00' },
    { id: 'expired', onboardingStatus: 2, effectiveCount: 4, licenseExpiry: '2026-10-01', latestSubmitTime: '2026-10-11 10:00' },
  ])

  assert.deepEqual(sorted.map((row) => row.id), ['no-quote', 'expired', 'settled'])
})
