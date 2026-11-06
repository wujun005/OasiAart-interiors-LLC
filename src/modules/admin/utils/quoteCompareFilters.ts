import type {
  CompareCell,
  CompareSkuRow,
  QuoteCompareMatrix,
} from './supplierQuoteCompare'

export type QuoteCompareFilters = {
  supplierIds?: number[]
  skuKeys?: string[]
  status?: number | null
  minPrice?: number | null
  maxPrice?: number | null
  quoteMode?: number | null
  search?: string
  onlyComparable?: boolean
  sort?: 'default' | 'price-asc' | 'spread-desc'
}

export type FilteredCompareSkuRow = CompareSkuRow & {
  excludedSupplierIds: number[]
  lowestPrice: number | null
  highestPrice: number | null
  spread: number | null
  lowestSupplierIds: number[]
}

export type FilteredQuoteCompareMatrix = Omit<QuoteCompareMatrix, 'skus'> & {
  skus: FilteredCompareSkuRow[]
  quoteCount: number
  pendingCount: number
  lowestPrice: number | null
  comparableSkuCount: number
}

const nonNegativeNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
)

const filterCode = (value: unknown): number | null => (
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
)

const finiteRate = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
)

/** Filter displayed quotes without changing the source matrix or its winning cells. */
export function filterQuoteCompareMatrix(
  matrix: QuoteCompareMatrix,
  filters: QuoteCompareFilters,
  labels: Record<string, string> = {},
): FilteredQuoteCompareMatrix {
  const supplierIds = filters.supplierIds?.length ? new Set(filters.supplierIds) : null
  const skuKeys = filters.skuKeys?.length ? new Set(filters.skuKeys) : null
  const suppliers = matrix.suppliers.filter(supplier => !supplierIds || supplierIds.has(supplier.id))
    .map(supplier => ({ ...supplier }))
  const status = filterCode(filters.status)
  const quoteMode = filterCode(filters.quoteMode)
  const minPrice = nonNegativeNumber(filters.minPrice)
  const maxPrice = nonNegativeNumber(filters.maxPrice)
  const hasCellFilter = status != null || quoteMode != null || minPrice != null || maxPrice != null
  const invalidRange = minPrice != null && maxPrice != null && minPrice > maxPrice
  const search = (filters.search || '').trim().toLocaleLowerCase()
  let skus: FilteredCompareSkuRow[] = []

  if (!invalidRange) for (const sku of matrix.skus) {
    if (skuKeys && !skuKeys.has(sku.key)) continue
    if (search && !`${labels[sku.key] || ''} ${sku.skuCode} ${sku.spuName}`.toLocaleLowerCase().includes(search)) continue

    const cells: Record<number, CompareCell> = {}
    const excludedSupplierIds: number[] = []
    const priced: Array<{ supplierId: number; price: number; rate: number | null }> = []
    for (const supplier of suppliers) {
      const source = sku.cells[supplier.id]
      if (!source) continue
      const price = nonNegativeNumber(source.quotePrice)
      const matches = !hasCellFilter || (price != null
        && (status == null || source.status === status)
        && (quoteMode == null || source.quoteMode === quoteMode)
        && (minPrice == null || price >= minPrice)
        && (maxPrice == null || price <= maxPrice))
      if (!matches) {
        excludedSupplierIds.push(supplier.id)
        continue
      }
      cells[supplier.id] = { ...source, quotePrice: price, best: false }
      if (price != null) priced.push({ supplierId: supplier.id, price, rate: finiteRate(source.profitRate) })
    }
    if ((hasCellFilter && !priced.length) || (filters.onlyComparable && priced.length < 2)) continue

    const lowestPrice = priced.length ? Math.min(...priced.map(cell => cell.price)) : null
    const highestPrice = priced.length ? Math.max(...priced.map(cell => cell.price)) : null
    const rates = priced.flatMap(cell => cell.rate == null ? [] : [cell.rate])
    const bestRate = rates.length ? Math.max(...rates) : null
    for (const cell of priced) cells[cell.supplierId]!.best = bestRate != null && cell.rate === bestRate
    skus.push({
      ...sku,
      cells,
      excludedSupplierIds,
      lowestPrice,
      highestPrice,
      spread: priced.length >= 2 ? highestPrice! - lowestPrice! : null,
      lowestSupplierIds: priced.filter(cell => cell.price === lowestPrice).map(cell => cell.supplierId),
    })
  }

  if (filters.sort === 'price-asc' || filters.sort === 'spread-desc') {
    const groups = new Map<number, FilteredCompareSkuRow[]>()
    for (const sku of skus) {
      const group = groups.get(sku.spuId) || []
      group.push(sku)
      groups.set(sku.spuId, group)
    }
    const descending = filters.sort === 'spread-desc'
    skus = [...groups.values()].flatMap(group => group.sort((left, right) => {
      const first = descending ? left.spread : left.lowestPrice
      const second = descending ? right.spread : right.lowestPrice
      if (first == null) return second == null ? 0 : 1
      if (second == null) return -1
      return descending ? second - first : first - second
    }))
  }

  const visibleCells = skus.flatMap(sku => Object.values(sku.cells))
    .filter(cell => nonNegativeNumber(cell.quotePrice) != null)
  const prices = skus.flatMap(sku => sku.lowestPrice == null ? [] : [sku.lowestPrice])
  return {
    suppliers,
    skus,
    grouped: new Set(skus.map(sku => sku.spuId)).size > 1,
    quoteCount: visibleCells.length,
    pendingCount: visibleCells.filter(cell => cell.status === 1).length,
    lowestPrice: prices.length ? Math.min(...prices) : null,
    comparableSkuCount: skus.filter(sku => sku.spread != null).length,
  }
}
