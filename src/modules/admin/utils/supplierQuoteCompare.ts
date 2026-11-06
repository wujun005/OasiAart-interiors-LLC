export type QuoteCompareRow = {
  supplierId?: number | string | null
  supplierName?: string | null
  supplierNo?: string | null
  spuId?: number | string | null
  spuName?: string | null
  skuId?: number | string | null
  skuCode?: string | null
  quotePrice?: number | string | null
  status?: number | string | null
  statusI18n?: Record<string, string> | null
  quoteMode?: number | string | null
  quoteModeI18n?: Record<string, string> | null
  profitRate?: number | string | null
  platformPriceWithTax?: number | string | null
  versionNo?: number | string | null
}

export type CompareSupplier = {
  id: number
  name: string
  no: string
}

export type CompareCell = {
  quotePrice: number | null
  profitRate: number | null
  status: number | null
  quoteMode: number | null
  statusI18n?: Record<string, string> | null
  quoteModeI18n?: Record<string, string> | null
  versionNo: number | null
  best: boolean
}

export type CompareSkuRow = {
  key: string
  skuId: number
  skuCode: string
  spuId: number
  spuName: string
  platformPrice: number | null
  cells: Record<number, CompareCell>
}

export type QuoteCompareMatrix = {
  suppliers: CompareSupplier[]
  skus: CompareSkuRow[]
  grouped: boolean
}

const finiteNumber = (value: unknown) => {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const formatCompareMoney = (value: unknown) => {
  const amount = finiteNumber(value)
  return amount == null ? '—' : amount.toFixed(2)
}

export const formatProfitPercent = (value: unknown) => {
  const rate = finiteNumber(value)
  if (rate == null) return '—'
  const percent = Math.round((rate * 100 + Number.EPSILON) * 100) / 100
  const text = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, '')
  return `${text}%`
}

export function buildQuoteCompareMatrix(rows: QuoteCompareRow[] | null | undefined): QuoteCompareMatrix {
  const supplierMap = new Map<number, CompareSupplier & { bestRate: number | null }>()
  const skuMap = new Map<number, CompareSkuRow>()

  for (const row of rows || []) {
    const supplierId = finiteNumber(row?.supplierId)
    const skuId = finiteNumber(row?.skuId)
    if (supplierId == null || skuId == null) continue

    const rate = finiteNumber(row.profitRate)
    const supplier = supplierMap.get(supplierId) || {
      id: supplierId,
      name: String(row.supplierName || '').trim() || String(supplierId),
      no: String(row.supplierNo || '').trim(),
      bestRate: null as number | null,
    }
    if (rate != null && (supplier.bestRate == null || rate > supplier.bestRate)) supplier.bestRate = rate
    supplierMap.set(supplierId, supplier)

    const sku = skuMap.get(skuId) || {
      key: String(skuId),
      skuId,
      skuCode: String(row.skuCode || '').trim() || String(skuId),
      spuId: finiteNumber(row.spuId) || 0,
      spuName: String(row.spuName || '').trim(),
      platformPrice: finiteNumber(row.platformPriceWithTax),
      cells: {},
    }
    if (!sku.skuCode && row.skuCode) sku.skuCode = String(row.skuCode).trim()
    if (!sku.spuName && row.spuName) sku.spuName = String(row.spuName).trim()
    if (sku.platformPrice == null) sku.platformPrice = finiteNumber(row.platformPriceWithTax)
    sku.cells[supplierId] = {
      quotePrice: finiteNumber(row.quotePrice),
      profitRate: rate,
      status: finiteNumber(row.status),
      quoteMode: finiteNumber(row.quoteMode),
      statusI18n: row.statusI18n,
      quoteModeI18n: row.quoteModeI18n,
      versionNo: finiteNumber(row.versionNo),
      best: false,
    }
    skuMap.set(skuId, sku)
  }

  const suppliers = [...supplierMap.values()]
    .sort((left, right) => {
      if (left.bestRate == null && right.bestRate == null) return left.id - right.id
      if (left.bestRate == null) return 1
      if (right.bestRate == null) return -1
      if (left.bestRate !== right.bestRate) return right.bestRate - left.bestRate
      return left.id - right.id
    })
    .map(({ bestRate: _bestRate, ...supplier }) => supplier)

  const skus = [...skuMap.values()].sort((left, right) => {
    if (left.spuId !== right.spuId) return left.spuId - right.spuId
    return left.skuCode.localeCompare(right.skuCode, undefined, { numeric: true })
  })

  for (const sku of skus) {
    let best: number | null = null
    for (const cell of Object.values(sku.cells)) {
      if (cell.profitRate == null) continue
      if (best == null || cell.profitRate > best) best = cell.profitRate
    }
    if (best == null) continue
    for (const cell of Object.values(sku.cells)) {
      cell.best = cell.profitRate === best
    }
  }

  return {
    suppliers,
    skus,
    grouped: new Set(skus.map((sku) => sku.spuId)).size > 1,
  }
}
