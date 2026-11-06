export type AcceptBandCounts = {
  direct: number
  deferred: number
  blocked: number
}

export type AcceptBandName = "direct" | "deferred" | "blocked"

export type QuoteLineOutcome = AcceptBandName | "open"

const emptyCounts = (): AcceptBandCounts => ({
  direct: 0,
  deferred: 0,
  blocked: 0,
})

export const acceptBandName = (value: unknown): AcceptBandName | "" => {
  const band = Number(value)
  if (band === 1) return "direct"
  if (band === 2) return "deferred"
  if (band === 3) return "blocked"
  return ""
}

const hasQuotePrice = (line: { quotePrice?: unknown }) => {
  const price = line?.quotePrice
  if (price == null || price === "") return false
  return Number.isFinite(Number(price))
}

const addBand = (counts: AcceptBandCounts, band: AcceptBandName) => {
  counts[band] += 1
}

/**
 * 汇总一份报价里各规格和附加项的接单分档。
 * 1 可直接接单，2 不优先派单，3 不能接单。
 * 供应商自己关掉、且没有被拒绝的规格不计入。
 * 审核拒绝后被停用的规格仍然计入，方便在列表里看到不能接单。
 */
export const countAcceptBands = (
  quote?: {
    skus?: Array<{
      acceptBand?: unknown
      quotePrice?: unknown
      enabled?: unknown
      available?: unknown
      reviewStatus?: unknown
    }>
    attaches?: Array<{
      acceptBand?: unknown
      quotePrice?: unknown
      canServe?: unknown
      offered?: unknown
      reviewStatus?: unknown
    }>
  } | null,
): AcceptBandCounts => {
  const counts = emptyCounts()
  for (const line of quote?.skus || []) {
    if (line?.available === false) continue
    const band = acceptBandName(line?.acceptBand)
    if (!band || !hasQuotePrice(line)) continue
    const turnedOff = line.enabled != null && Number(line.enabled) === 0
    const rejected = Number(line.reviewStatus) === 3
    if (turnedOff && !rejected) continue
    addBand(counts, band)
  }
  for (const line of quote?.attaches || []) {
    const band = acceptBandName(line?.acceptBand)
    if (!band || !hasQuotePrice(line)) continue
    const offered = line.canServe === true || line.offered === true
    const rejected = Number(line.reviewStatus) === 3
    if (!offered && !rejected) continue
    addBand(counts, band)
  }
  return counts
}

const turnedOff = (value: unknown) => value === false || Number(value) === 0

/**
 * 报价规格在列表里的接单结果。
 * 未启用、已下架、审核拒绝或利润率过低为不能接单。
 * 有利润分档时用可直接接单 / 不优先派单。
 * 已启用但还没有利润分档时返回 open。报价没通过前，页面不把它显示成能接单。
 */
export const quoteLineOutcome = (row?: {
  acceptBand?: unknown
  enabled?: unknown
  available?: unknown
  reviewStatus?: unknown
} | null): QuoteLineOutcome => {
  if (!row || row.available === false) return "blocked"
  const band = acceptBandName(row.acceptBand)
  if (band === "blocked" || Number(row.reviewStatus) === 3) return "blocked"
  if (turnedOff(row.enabled)) return "blocked"
  if (band) return band
  return "open"
}
