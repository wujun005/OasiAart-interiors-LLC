export type QuoteMode = 1 | 2 | null
export type QuoteOption = {
  enabled?: boolean | number
  available?: boolean
  staffCount?: unknown
  serviceHours?: unknown
  quotePrice?: unknown
}

export const positiveAmount = (value: unknown) => {
  const text = String(value ?? '').trim()
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0
}

export function calculatedQuotePrice(rate: unknown, staff: unknown, hours: unknown): number | null {
  const values = [rate, staff, hours].map(Number)
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) return null
  const total = values[0] * values[1] * values[2]
  if (!Number.isFinite(total)) return null
  return Math.round((total + Number.EPSILON * Math.abs(total)) * 100) / 100
}

export function optionMissingFields(option: QuoteOption, mode: QuoteMode, _rate?: unknown): string[] {
  if (option.available === false || !option.enabled) return []
  if (mode === 2) return []
  return positiveAmount(option.quotePrice) ? [] : ['price']
}

export type QuotePriceView = 'underReview' | 'approvedPending' | 'rejected' | 'active' | 'draft' | 'none'

const quotedAmount = (value: unknown) => {
  if (value == null || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null
}

export function quotePriceView(input: {
  approvedPrice?: unknown
  quotePrice?: unknown
  reviewStatus?: unknown
  quoteStatus?: unknown
  priceChangeStatus?: unknown
  rejected?: boolean
}): { view: QuotePriceView; showActive: boolean; showPending: boolean } {
  const active = quotedAmount(input.approvedPrice)
  const pending = quotedAmount(input.quotePrice)
  const showActive = active != null && active > 0
  const differs = showActive && pending != null && pending > 0 && Math.abs(active - pending) > 0.009
  let view: QuotePriceView = 'none'
  if (input.rejected || Number(input.reviewStatus) === 3) view = 'rejected'
  else if (Number(input.quoteStatus) === 1 || Number(input.priceChangeStatus) === 1) view = 'underReview'
  else if (differs && (Number(input.reviewStatus) === 2 || Number(input.quoteStatus) === 2)) view = 'approvedPending'
  else if (showActive && (Number(input.reviewStatus) === 2 || Number(input.quoteStatus) === 2)) view = 'active'
  else if (pending != null && pending > 0) view = 'draft'
  const showPending = pending != null && pending > 0 && (differs || !showActive) && view !== 'active'
  return { view, showActive, showPending }
}

export type QuoteLineStatusCounts = Record<QuotePriceView, number>

export function countQuoteLineStatuses(
  rows: Array<{ approvedPrice?: unknown; quotePrice?: unknown; reviewStatus?: unknown }>,
  quoteStatus?: unknown,
): QuoteLineStatusCounts {
  const counts: QuoteLineStatusCounts = {
    underReview: 0,
    approvedPending: 0,
    rejected: 0,
    active: 0,
    draft: 0,
    none: 0,
  }
  for (const row of rows) {
    const { view } = quotePriceView({
      approvedPrice: row.approvedPrice,
      quotePrice: row.quotePrice,
      reviewStatus: row.reviewStatus,
      quoteStatus,
      rejected: Number(row.reviewStatus) === 3,
    })
    counts[view] += 1
  }
  return counts
}

export type ReviewBucketCounts = {
  none: number
  draft: number
  reviewing: number
  approved: number
  rejected: number
}

export function countSingleReviewStatus(status: unknown): ReviewBucketCounts {
  const counts: ReviewBucketCounts = { none: 0, draft: 0, reviewing: 0, approved: 0, rejected: 0 }
  const value = status == null || status === '' ? null : Number(status)
  if (value === 0) counts.draft = 1
  else if (value === 1) counts.reviewing = 1
  else if (value === 2) counts.approved = 1
  else if (value === 3) counts.rejected = 1
  else counts.none = 1
  return counts
}

export type WorkspaceQuoteCounts = {
  awaiting: number
  draft: number
  reviewing: number
  approved: number
  rejected: number
  priceChange: number
  priceChangeRejected: number
}

export function countWorkspaceQuotes(
  rows: Array<{ status?: unknown; priceChangeStatus?: unknown }>,
): WorkspaceQuoteCounts {
  const counts: WorkspaceQuoteCounts = {
    awaiting: 0,
    draft: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    priceChange: 0,
    priceChangeRejected: 0,
  }
  for (const row of rows) {
    const change = Number(row.priceChangeStatus)
    if (change === 1) counts.priceChange += 1
    if (change === 3) counts.priceChangeRejected += 1
    const status = row.status == null || row.status === '' ? null : Number(row.status)
    if (status === 0) counts.draft += 1
    else if (status === 1) counts.reviewing += 1
    else if (status === 2) counts.approved += 1
    else if (status === 3) counts.rejected += 1
    else counts.awaiting += 1
  }
  return counts
}

export type CoverageStatusCounts = {
  unset: number
  areas: number
  full: number | null
  partial: number | null
  communities: number | null
}

export function countCoverageStatuses(input: {
  selectedAreas: number
  fullAreas?: number | null
  partialAreas?: number | null
  communities?: number | null
}): CoverageStatusCounts {
  const areas = Math.max(0, Number(input.selectedAreas) || 0)
  const known = (value: number | null | undefined) =>
    value == null || Number.isNaN(Number(value)) ? null : Math.max(0, Number(value))
  return {
    unset: areas > 0 ? 0 : 1,
    areas,
    full: known(input.fullAreas),
    partial: known(input.partialAreas),
    communities: known(input.communities),
  }
}

export function quoteActionKey(status?: number | null): string {
  if (status === 0) return 'continueQuote'
  if (status === 1) return 'viewSubmittedQuote'
  if (status === 2) return 'managePricing'
  if (status === 3) return 'updateResubmit'
  return 'setUpQuote'
}

export type OrderBucket = 'new' | 'upcoming' | 'progress' | 'completed' | 'cancelled'
export function supplierOrderBucket(order: { orderStatus?: unknown; serviceStatus?: unknown }): OrderBucket {
  if (Number(order.orderStatus) === 3) return 'cancelled'
  const step = Number(order.serviceStatus)
  if (step === 2) return 'completed'
  if (step === 1 || step === 3) return 'progress'
  if (step === 4) return 'upcoming'
  return 'new'
}
