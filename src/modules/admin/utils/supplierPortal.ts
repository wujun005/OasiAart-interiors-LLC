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

export function optionMissingFields(option: QuoteOption, mode: QuoteMode, rate: unknown): string[] {
  if (option.available === false || !option.enabled) return []
  const missing: string[] = []
  if (!(Number(option.staffCount) > 0) || !Number.isInteger(Number(option.staffCount))) missing.push('staff')
  if (!(Number(option.serviceHours) > 0)) missing.push('hours')
  if (mode === 1 && !positiveAmount(option.quotePrice)) missing.push('price')
  if (mode === 2 && calculatedQuotePrice(rate, option.staffCount, option.serviceHours) == null) {
    if (!missing.length && !(Number(rate) > 0)) missing.push('rate')
  }
  return missing
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
