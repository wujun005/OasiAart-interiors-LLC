import assert from 'node:assert/strict'
import test from 'node:test'
import {
  closedWeekdays,
  dispatchEligibility,
  ibanValid,
  licenceExpiryState,
  swiftValid,
} from '../src/modules/admin/utils/supplierReviewState.ts'
import {
  countCoverageStatuses,
  countQuoteLineStatuses,
  countSingleReviewStatus,
  countWorkspaceQuotes,
  quotePriceView,
} from '../src/modules/admin/utils/supplierPortal.ts'

test('dispatch eligibility explains why a supplier is not receiving jobs', () => {
  assert.equal(dispatchEligibility({ reviewStatus: 1, acceptDispatch: 1, enabled: 1 }), 'pendingVerification')
  assert.equal(dispatchEligibility({ reviewStatus: 2, acceptDispatch: 1, enabled: 1 }), 'active')
  assert.equal(dispatchEligibility({ reviewStatus: 2, acceptDispatch: 0, enabled: 1 }), 'verificationApproved')
  assert.equal(dispatchEligibility({ reviewStatus: 0, acceptDispatch: 1, enabled: 1 }), 'setupIncomplete')
  assert.equal(dispatchEligibility({ reviewStatus: 3, acceptDispatch: 1, enabled: 1 }), 'changesRequired')
  assert.equal(dispatchEligibility({ reviewStatus: 2, acceptDispatch: 1, enabled: 0 }), 'suspended')
})

test('UAE IBAN and SWIFT formats are checked before payout details can be submitted', () => {
  assert.equal(ibanValid('AE07 0331 2345 6789 0123 456'), true)
  assert.equal(ibanValid('AE070331234567890123457'), false)
  assert.equal(ibanValid('GB82WEST12345698765432'), false)
  assert.equal(swiftValid(''), true)
  assert.equal(swiftValid('EBILAEAD'), true)
  assert.equal(swiftValid('EBILAEADXXX'), true)
  assert.equal(swiftValid('NOT-A-CODE'), false)
})

test('a repeating all-day Sunday block closes Sunday without closing the rest of the week', () => {
  assert.deepEqual(closedWeekdays([
    { endDate: '2026-12-31', fullDay: 1, weekdays: [7], services: [], areas: [] },
    { endDate: '2026-10-01', fullDay: 1, weekdays: [6], services: [], areas: [] },
    { endDate: '2026-12-31', fullDay: 0, startTime: '09:00', endTime: '12:00', weekdays: [1], services: [], areas: [] },
  ], '2026-10-19'), [7])
})

test('a licence expiring within 30 days is marked soon', () => {
  assert.equal(licenceExpiryState('2026-10-25', new Date(2026, 9, 19)), 'soon')
  assert.equal(licenceExpiryState('2026-10-18', new Date(2026, 9, 19)), 'expired')
  assert.equal(licenceExpiryState('', new Date(2026, 9, 19)), 'missing')
})

test('line status counts match the labels shown on each quote row', () => {
  assert.deepEqual(countQuoteLineStatuses([
    { quotePrice: 300, reviewStatus: 3 },
    { quotePrice: 500 },
    { quotePrice: 700, reviewStatus: 2 },
  ], 1), {
    underReview: 2,
    approvedPending: 0,
    rejected: 1,
    active: 0,
    draft: 0,
    none: 0,
  })
  assert.deepEqual(countQuoteLineStatuses([
    { approvedPrice: 400, quotePrice: 400, reviewStatus: 2 },
    { approvedPrice: 700, quotePrice: 800, reviewStatus: 2 },
    { quotePrice: 120, reviewStatus: 3 },
    { quotePrice: 90 },
  ], 2), {
    underReview: 0,
    approvedPending: 1,
    rejected: 1,
    active: 1,
    draft: 1,
    none: 0,
  })
})

test('a pending quote stays separate from the active supplier rate', () => {
  assert.deepEqual(quotePriceView({
    approvedPrice: 250,
    quotePrice: 280,
    quoteStatus: 1,
  }), { view: 'underReview', showActive: true, showPending: true })
  assert.deepEqual(quotePriceView({
    approvedPrice: 250,
    quotePrice: 250,
    quoteStatus: 2,
    reviewStatus: 2,
  }), { view: 'active', showActive: true, showPending: false })
  assert.equal(quotePriceView({ approvedPrice: 250, quotePrice: 280, quoteStatus: 2, reviewStatus: 2 }).view, 'approvedPending')
})

test('workspace status counts keep every review bucket, including zeros', () => {
  assert.deepEqual(countSingleReviewStatus(2), {
    none: 0,
    draft: 0,
    reviewing: 0,
    approved: 1,
    rejected: 0,
  })
  assert.deepEqual(countSingleReviewStatus(null), {
    none: 1,
    draft: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
  })
  assert.deepEqual(countWorkspaceQuotes([
    { status: undefined },
    { status: 0 },
    { status: 1 },
    { status: 2, priceChangeStatus: 1 },
    { status: 3, priceChangeStatus: 3 },
  ]), {
    awaiting: 1,
    draft: 1,
    reviewing: 1,
    approved: 1,
    rejected: 1,
    priceChange: 1,
    priceChangeRejected: 1,
  })
  assert.deepEqual(countCoverageStatuses({
    selectedAreas: 2,
    fullAreas: 1,
    partialAreas: 1,
    communities: 6,
  }), {
    unset: 0,
    areas: 2,
    full: 1,
    partial: 1,
    communities: 6,
  })
  assert.deepEqual(countCoverageStatuses({ selectedAreas: 0 }), {
    unset: 1,
    areas: 0,
    full: null,
    partial: null,
    communities: null,
  })
})
