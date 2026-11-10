export type QuoteMode = 1 | 2 | 3 | 4 | null
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
  if (mode === 2 || mode === 3 || mode === 4) return []
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
  const lineStatus = Number(input.reviewStatus)
  const lineApproved = lineStatus === 2
  const quoted = pending != null && pending > 0
  let view: QuotePriceView = 'none'
  if (input.rejected || lineStatus === 3) view = 'rejected'
  else if (Number(input.priceChangeStatus) === 1 && !lineApproved) view = 'underReview'
  else if (lineApproved && differs) view = 'approvedPending'
  else if (lineApproved && showActive) view = 'active'
  else if (lineApproved) view = 'approvedPending'
  else if (Number(input.quoteStatus) === 1 && quoted) view = 'underReview'
  else if (differs && Number(input.quoteStatus) === 2) view = 'approvedPending'
  else if (showActive && Number(input.quoteStatus) === 2) view = 'active'
  else if (quoted) view = 'draft'
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

export type HourlyProfitInput = {
  quoteMode?: unknown
  unitPrice?: unknown
  unitPriceWithMaterial?: unknown
  unitPriceWithoutMaterial?: unknown
  quotePrice?: unknown
  staffCount?: unknown
  serviceHours?: unknown
  platformPriceWithTax?: unknown
  platformPrice?: unknown
  platformOriginalPrice?: unknown
  sources?: unknown
}

const positiveNumber = (value: unknown) => {
  if (value == null || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON * Math.abs(value)) * 100) / 100

const collectQuoteTexts = (value: unknown, into: string[] = [], depth = 0): string[] => {
  if (value == null || depth > 8) return into
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim()
    if (text) into.push(text)
    return into
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectQuoteTexts(item, into, depth + 1))
    return into
  }
  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectQuoteTexts(item, into, depth + 1))
  }
  return into
}

const firstMatch = (texts: string[], pattern: RegExp) => {
  for (const text of texts) {
    const matched = text.match(pattern)
    if (matched) return Number(matched[1])
  }
  return null
}

const parsedHours = (texts: string[]) => {
  const hours = firstMatch(texts, /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|小时)/i)
    ?? firstMatch(texts, /(?:hours?|hrs?|小时|duration|时长)[^\d]{0,16}(\d+(?:\.\d+)?)/i)
  if (hours != null && hours > 0) return hours
  const minutes = firstMatch(texts, /(\d+(?:\.\d+)?)\s*(?:mins?|minutes|分钟)/i)
    ?? firstMatch(texts, /(?:mins?|minutes|分钟)[^\d]{0,16}(\d+(?:\.\d+)?)/i)
  if (minutes == null || minutes <= 0) return null
  return Math.round((minutes / 60) * 100) / 100
}

const namedStaff = (text: string) => {
  const value = text.trim()
  if (/^(?:couples?|双人|两人|二人)$/i.test(value)) return 2
  if (/^(?:single|单人|一人)$/i.test(value)) return 1
  return null
}

const STAFF_ROLE = "cleaners?|persons?|people|staff|workers?|technicians?|techs?|技术员|技术|清洁工|工人|人"

const parsedStaff = (texts: string[]) => {
  const count = firstMatch(texts, new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:名\\s*)?(?:${STAFF_ROLE})`, "i"))
    ?? firstMatch(texts, new RegExp(`(?:${STAFF_ROLE}|人数)[^\\d]{0,16}(\\d+(?:\\.\\d+)?)`, "i"))
  if (count != null && count > 0) return count
  const perTech = staffPerTech(texts)
  if (perTech != null) return perTech
  for (const text of texts) {
    const named = namedStaff(text)
    if (named != null) return named
  }
  return null
}

/** 「1 Hour / Tech」「1 小时/技术」表示 1 名技术员做这些小时；斜杠后另有数字时按那个人数。 */
const staffPerTech = (texts: string[]) => {
  const pattern = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|小时)\s*\/\s*(\d+(?:\.\d+)?)?\s*(?:techs?|technicians?|技术员|技术)/i
  for (const text of texts) {
    const matched = text.match(pattern)
    if (!matched) continue
    const staff = matched[2] == null || matched[2] === "" ? 1 : Number(matched[2])
    if (staff > 0) return staff
  }
  return null
}

const materialChoice = (texts: string[]) => {
  const blob = texts.join('\n').toLowerCase()
  const without = /without materials|no materials|不带材料|不含材料|无材料/.test(blob)
  const rest = blob.replace(/without materials|no materials|不带材料|不含材料|无材料/g, ' ')
  const withMaterials = /with materials|带材料|有材料|含材料/.test(rest)
  if (without && withMaterials) return null
  if (without) return 'without'
  if (withMaterials) return 'with'
  return null
}

const hourlyRate = (input: HourlyProfitInput, texts: string[]) => {
  const mode = Number(input.quoteMode)
  if (mode === 3) return positiveNumber(input.unitPrice)
  if (mode !== 2) return null
  const choice = materialChoice(texts)
  if (choice === 'with') return positiveNumber(input.unitPriceWithMaterial)
  if (choice === 'without') return positiveNumber(input.unitPriceWithoutMaterial)
  const withMaterial = positiveNumber(input.unitPriceWithMaterial)
  const withoutMaterial = positiveNumber(input.unitPriceWithoutMaterial)
  if (withMaterial != null && withoutMaterial != null && withMaterial === withoutMaterial) return withMaterial
  return null
}

/** 按小时报价的规格成本。能确定人数和时长时用当前小时单价计算，否则沿用已保存的行价。 */
export function hourlySupplierCost(input: HourlyProfitInput): number | null {
  const texts = collectQuoteTexts(input.sources)
  const staff = positiveNumber(input.staffCount) ?? parsedStaff(texts)
  const hours = positiveNumber(input.serviceHours) ?? parsedHours(texts)
  const computed = calculatedQuotePrice(hourlyRate(input, texts), staff, hours)
  if (computed != null) return computed
  const stored = positiveNumber(input.quotePrice)
  return stored == null ? null : roundMoney(stored)
}

export function customerPrice(input: HourlyProfitInput): number | null {
  const taxed = positiveNumber(input.platformPriceWithTax)
  if (taxed != null) return taxed
  const base = positiveNumber(input.platformPrice) ?? positiveNumber(input.platformOriginalPrice)
  return base == null ? null : roundMoney(base * 1.05)
}

/** 利润率按百分比取整，和平台审核里的毛利率同一口径。算不出时返回 null。 */
export function hourlyMarginPercent(input: HourlyProfitInput): number | null {
  const client = customerPrice(input)
  const quote = hourlySupplierCost(input)
  if (client == null || quote == null) return null
  return Math.round(((client - quote) / client) * 100)
}

const hourlyEffort = (input: HourlyProfitInput) => {
  const texts = collectQuoteTexts(input?.sources)
  const staff = positiveNumber(input?.staffCount) ?? parsedStaff(texts)
  const hours = positiveNumber(input?.serviceHours) ?? parsedHours(texts)
  if (staff == null || hours == null) return null
  return staff * hours
}

/** 客户售价折成每人每小时，用来和供应商小时单价对比。 */
export function hourlyCustomerUnitPrice(input: HourlyProfitInput): number | null {
  const client = customerPrice(input)
  const effort = hourlyEffort(input)
  if (client == null || effort == null) return null
  return roundMoney(client / effort)
}

export type HourlyCompareSummary = {
  customerMin: number | null
  customerMax: number | null
  marginMin: number | null
  marginMax: number | null
}

const numberSpan = (values: Array<number | null>) => {
  const present = values.filter((value): value is number => value != null)
  return present.length
    ? { min: Math.min(...present), max: Math.max(...present) }
    : { min: null, max: null }
}

/** 同一小时单价下，只汇总折算后的每人每小时售价和毛利率。 */
export function summarizeHourlyCompare(inputs: HourlyProfitInput[], material: 'with' | 'without' | null): HourlyCompareSummary {
  const matched = (inputs || []).filter((input) => {
    if (material == null) return true
    return materialChoice(collectQuoteTexts(input?.sources)) === material
  })
  const customers = numberSpan(matched.map(hourlyCustomerUnitPrice))
  const margins = numberSpan(matched.map(hourlyMarginPercent))
  return {
    customerMin: customers.min,
    customerMax: customers.max,
    marginMin: margins.min,
    marginMax: margins.max,
  }
}

/** 按数量报价的成本就是这一个单价，直接和客户含税售价比，不按人数或时长折算。 */
export function quantityMarginPercent(input: HourlyProfitInput): number | null {
  if (Number(input?.quoteMode) !== 4) return null
  const client = customerPrice(input)
  const quote = positiveNumber(input?.unitPrice)
  if (client == null || quote == null) return null
  return Math.round(((client - quote) / client) * 100)
}

export function summarizeQuantityCompare(inputs: HourlyProfitInput[]): HourlyCompareSummary {
  const rows = inputs || []
  const customers = numberSpan(rows.map(customerPrice))
  const margins = numberSpan(rows.map(quantityMarginPercent))
  return {
    customerMin: customers.min,
    customerMax: customers.max,
    marginMin: margins.min,
    marginMax: margins.max,
  }
}

/** 对比行算不出来时，区分是没有平台售价，还是规格里读不出人数或时长。 */
export function hourlyCompareGap(inputs: HourlyProfitInput[], material: 'with' | 'without' | null): 'ok' | 'price' | 'effort' {
  const matched = (inputs || []).filter((input) => {
    if (material == null) return true
    return materialChoice(collectQuoteTexts(input?.sources)) === material
  })
  const summary = summarizeHourlyCompare(matched, null)
  if (summary.customerMin != null || summary.marginMin != null) return 'ok'
  if (matched.some((input) => customerPrice(input) != null)) return 'effort'
  return 'price'
}
