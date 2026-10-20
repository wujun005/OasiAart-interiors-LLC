export type SupplierQueueRow = {
  onboardingStatus?: unknown
  pendingCount?: unknown
  priceChangePendingCount?: unknown
  pendingReview?: unknown
  latestSubmitTime?: unknown
  effectiveCount?: unknown
  licenseExpiry?: unknown
}

const amount = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export const supplierHasNoQuote = (row: SupplierQueueRow) =>
  row.effectiveCount != null
  && row.effectiveCount !== ''
  && amount(row.effectiveCount) === 0
  && amount(row.pendingCount) === 0
  && amount(row.priceChangePendingCount) === 0

export function supplierQuoteBadges(row: SupplierQueueRow & { rejectedCount?: unknown }) {
  const pending = amount(row.pendingCount)
  const rejected = amount(row.rejectedCount)
  const approved = amount(row.effectiveCount)
  const priceChange = amount(row.priceChangePendingCount)
  return {
    pending,
    rejected,
    approved,
    priceChange,
    none: pending === 0 && rejected === 0 && approved === 0 && priceChange === 0,
  }
}

const licenceNeedsAction = (value: unknown) => {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return false
  const expiry = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((expiry - today) / 86400000) <= 30
}

export type SupplierQueueFocus = 'priceChange' | 'noQuote' | 'licence'

export const supplierMatchesQueueFocus = (
  row: SupplierQueueRow & { rejectedCount?: unknown },
  focus: SupplierQueueFocus,
) => {
  if (focus === 'priceChange') return amount(row.priceChangePendingCount) > 0
  if (focus === 'noQuote') return supplierQuoteBadges(row).none
  return licenceNeedsAction(row.licenseExpiry)
}

export const supplierNeedsAction = (row: SupplierQueueRow) =>
  amount(row.onboardingStatus) === 1
  || amount(row.pendingCount) > 0
  || amount(row.priceChangePendingCount) > 0
  || row.pendingReview === true
  || supplierHasNoQuote(row)
  || licenceNeedsAction(row.licenseExpiry)

const submitTime = (value: unknown) => {
  const match = String(value || '').match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (!match) return 0
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
}

export const compareSupplierQueue = (left: SupplierQueueRow, right: SupplierQueueRow) => {
  const action = Number(supplierNeedsAction(right)) - Number(supplierNeedsAction(left))
  if (action) return action
  return submitTime(right.latestSubmitTime) - submitTime(left.latestSubmitTime)
}

export const sortSupplierQueue = <T extends SupplierQueueRow>(rows: T[]) =>
  [...rows].sort(compareSupplierQueue)
