export type DispatchEligibility =
  | 'suspended'
  | 'pendingVerification'
  | 'setupIncomplete'
  | 'changesRequired'
  | 'verificationApproved'
  | 'notBookable'
  | 'active'

type QuoteReadiness = {
  status?: unknown
  acceptOrder?: unknown
  available?: unknown
  effectiveVersionNo?: unknown
  effective?: unknown
}

const flagOff = (value: unknown) => value === 0 || value === false || value === '0'

export function quoteCanTakeJobs(quote: QuoteReadiness | null | undefined) {
  if (!quote || quote.available === false || flagOff(quote.acceptOrder)) return false
  if (Number(quote.status) === 2 || quote.effective === true) return true
  const version = Number(quote.effectiveVersionNo)
  return Number.isFinite(version) && version > 0
}

export function supplierOperationsReady(input: {
  quotes?: QuoteReadiness[] | null
  packageQuotes?: Array<{ services?: QuoteReadiness[] | null }> | null
  areas?: unknown[] | null
}) {
  const services = Array.isArray(input.quotes) ? input.quotes : []
  const packages = Array.isArray(input.packageQuotes) ? input.packageQuotes : []
  const quoted = services.some((quote) => quoteCanTakeJobs(quote))
    || packages.some((item) => (item?.services || []).some((quote) => quoteCanTakeJobs(quote)))
  return quoted && Array.isArray(input.areas) && input.areas.length > 0
}

export function dispatchEligibility(input: {
  reviewStatus?: number | null
  enabled?: unknown
  acceptDispatch?: unknown
  operationsReady?: boolean | null
}): DispatchEligibility {
  if (flagOff(input.enabled)) return 'suspended'
  const review = input.reviewStatus == null ? null : Number(input.reviewStatus)
  if (review === 1) return 'pendingVerification'
  if (review === 3) return 'changesRequired'
  if (review == null || Number.isNaN(review) || review === 0) return 'setupIncomplete'
  const accepting = input.acceptDispatch === 1 || input.acceptDispatch === true || input.acceptDispatch === '1'
  if (review === 2 && accepting) {
    if (input.operationsReady === false) return 'notBookable'
    return 'active'
  }
  if (review === 2) return 'verificationApproved'
  return 'setupIncomplete'
}

export function ibanValid(value: string) {
  const compact = value.replace(/\s+/g, '').toUpperCase()
  if (!/^AE\d{21}$/.test(compact)) return false
  const rearranged = compact.slice(4) + compact.slice(0, 4)
  let expanded = ''
  for (const char of rearranged) {
    expanded += char >= 'A' && char <= 'Z' ? String(char.charCodeAt(0) - 55) : char
  }
  let remainder = 0
  for (const digit of expanded) remainder = (remainder * 10 + Number(digit)) % 97
  return remainder === 1
}

export function swiftValid(value: string) {
  const compact = value.replace(/\s+/g, '').toUpperCase()
  if (!compact) return true
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(compact)
}

export type ClosureEvent = {
  endDate?: string | null
  fullDay?: unknown
  startTime?: string | null
  endTime?: string | null
  services?: unknown[] | null
  areas?: unknown[] | null
  weekdays?: Array<number | string> | null
}

export function closedWeekdays(events: ClosureEvent[], today: string) {
  const closed = new Set<number>()
  for (const event of events) {
    if (event.endDate && event.endDate < today) continue
    const allDay = Number(event.fullDay) === 1 || (!event.startTime && !event.endTime)
    if (!allDay) continue
    if (event.services?.length || event.areas?.length) continue
    const codes = [...new Set((event.weekdays || []).map((item) => Number(item)).filter((code) => code >= 1 && code <= 7))]
    if (!codes.length || codes.length === 7) continue
    codes.forEach((code) => closed.add(code))
  }
  return [...closed].sort((left, right) => left - right)
}

export function licenceExpiryState(value: unknown, today = new Date()) {
  const text = String(value ?? '').trim()
  if (!text) return 'missing' as const
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (!match) return 'ok' as const
  const expiry = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((expiry.getTime() - start.getTime()) / 86400000)
  if (days < 0) return 'expired' as const
  if (days <= 30) return 'soon' as const
  return 'ok' as const
}
