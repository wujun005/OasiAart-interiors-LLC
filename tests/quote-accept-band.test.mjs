import test from "node:test"
import assert from "node:assert/strict"
import {
  acceptBandName,
  countAcceptBands,
  quoteLineOutcome,
} from "../src/modules/admin/utils/quoteAcceptBand.ts"

test("accept bands map the server profit tiers", () => {
  assert.equal(acceptBandName(1), "direct")
  assert.equal(acceptBandName("2"), "deferred")
  assert.equal(acceptBandName(3), "blocked")
  assert.equal(acceptBandName(null), "")
  assert.equal(acceptBandName(0), "")
})

test("a service quote lists direct, deferred, and blocked lines together", () => {
  assert.deepEqual(
    countAcceptBands({
      skus: [
        { acceptBand: 1, quotePrice: 80, enabled: 1 },
        { acceptBand: 1, quotePrice: 90, enabled: 1 },
        { acceptBand: 2, quotePrice: 100, enabled: 1, reviewStatus: 1 },
        { acceptBand: 3, quotePrice: 120, enabled: 0, reviewStatus: 3 },
        { acceptBand: 1, quotePrice: 70, enabled: 0 },
        { acceptBand: 2, enabled: 1 },
      ],
      attaches: [
        { acceptBand: 3, quotePrice: 40, canServe: true },
        { acceptBand: 1, quotePrice: 15, canServe: false },
      ],
    }),
    { direct: 2, deferred: 1, blocked: 2 },
  )
})

test("each quoted option says whether it can take a job", () => {
  assert.equal(quoteLineOutcome({ acceptBand: 1, enabled: 1, available: true }), "direct")
  assert.equal(quoteLineOutcome({ acceptBand: 2, enabled: true }), "deferred")
  assert.equal(quoteLineOutcome({ acceptBand: 3, enabled: 1, reviewStatus: 3 }), "blocked")
  assert.equal(quoteLineOutcome({ enabled: 0, quotePrice: 80 }), "blocked")
  assert.equal(quoteLineOutcome({ enabled: false }), "blocked")
  assert.equal(quoteLineOutcome({ available: false, enabled: 1, acceptBand: 1 }), "blocked")
  assert.equal(quoteLineOutcome({ enabled: 1, reviewStatus: 2 }), "open")
  assert.equal(quoteLineOutcome(null), "blocked")
})

test("a quote without a profit band stays out of the summary", () => {
  assert.deepEqual(countAcceptBands(null), {
    direct: 0,
    deferred: 0,
    blocked: 0,
  })
  assert.deepEqual(
    countAcceptBands({
      skus: [
        { acceptBand: 1, quotePrice: 80, enabled: 1, available: false },
        { acceptBand: 2, quotePrice: 90, enabled: 1, available: true },
      ],
    }),
    { direct: 0, deferred: 1, blocked: 0 },
  )
})
