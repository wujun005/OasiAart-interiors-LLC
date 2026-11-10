export type SupplierMineCountKey =
  | "newRequests"
  | "upcoming"
  | "inProgress"
  | "completed"

const COUNT_FIELDS: Record<SupplierMineCountKey, string> = {
  newRequests: "newOrderCount",
  upcoming: "upcomingOrderCount",
  inProgress: "inProgressOrderCount",
  completed: "completedOrderCount",
}

const countOf = (value: unknown) => {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value
  if (typeof value !== "string" || !value.trim()) return null
  const count = Number(value)
  return Number.isSafeInteger(count) && count >= 0 ? count : null
}

const positive = (value: unknown) => {
  const count = countOf(value)
  return count != null && count > 0 ? count : null
}

/** Counts stay on the page payload and do not follow the selected tab. */
export function supplierMineCounts(page: unknown) {
  const record = page && typeof page === "object" ? (page as Record<string, unknown>) : {}
  const summary =
    record.summary && typeof record.summary === "object"
      ? (record.summary as Record<string, unknown>)
      : {}
  const counts: Partial<Record<SupplierMineCountKey, number>> = {}
  for (const key of Object.keys(COUNT_FIELDS) as SupplierMineCountKey[]) {
    const count = countOf(record[COUNT_FIELDS[key]]) ?? countOf(summary[key])
    if (count != null) counts[key] = count
  }
  return counts
}

export function isSupplierPackageOrder(row: { packageOrder?: unknown; orderType?: unknown } | null | undefined) {
  return row?.packageOrder === true || Number(row?.orderType) === 2
}

const MATERIAL_HOUR_QUOTE_MODE = 2

const finiteNumber = (value: unknown) => {
  if (value == null || value === "") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/**
 * 普通订单，且服务报价方式是带材料/不带材料按人小时。
 * 套餐单、一口价、按人小时、按数量都不展示 ext 里的服务人数和服务时长。
 */
type MaterialHourOrder = {
  packageOrder?: unknown
  orderType?: unknown
  quoteMode?: unknown
  withMaterial?: unknown
  lines?: unknown
  staffCount?: unknown
  serviceHours?: unknown
}

const lineHasMaterialHourMode = (row: MaterialHourOrder) => {
  const lines = Array.isArray(row.lines) ? row.lines : []
  return lines.some((line) => {
    if (!line || typeof line !== "object") return false
    return Number((line as { quoteMode?: unknown }).quoteMode) === MATERIAL_HOUR_QUOTE_MODE
  })
}

export function showsMaterialHourWorkload(row: MaterialHourOrder | null | undefined) {
  if (!row || isSupplierPackageOrder(row)) return false
  const mode = finiteNumber(row.quoteMode)
  if (mode === MATERIAL_HOUR_QUOTE_MODE || lineHasMaterialHourMode(row)) return true
  // 平台订单详情目前不返回 quoteMode。withMaterial 只有「带材料/不带材料按人小时」会写成 true/false。
  return mode == null && typeof row.withMaterial === "boolean"
}

export function materialHourStaffCount(row: MaterialHourOrder | null | undefined) {
  if (!showsMaterialHourWorkload(row)) return null
  return finiteNumber(row?.staffCount)
}

export function materialHourServiceHours(row: MaterialHourOrder | null | undefined) {
  if (!showsMaterialHourWorkload(row)) return null
  return finiteNumber(row?.serviceHours)
}

/** Server order type: package visits are 2, ordinary bookings are 1. */
export function supplierOrderKind(row: { packageOrder?: unknown; orderType?: unknown } | null | undefined) {
  if (isSupplierPackageOrder(row)) return "package" as const
  if (row?.packageOrder === false || Number(row?.orderType) === 1) return "normal" as const
  return "" as const
}

/** Package visits carry seqNo (this visit) and totalTimes (this sub-service). */
export function packageVisitProgress(
  row: { packageOrder?: unknown; orderType?: unknown; seqNo?: unknown; totalTimes?: unknown } | null | undefined,
) {
  if (!isSupplierPackageOrder(row)) return null
  const seq = positive(row?.seqNo)
  const total = positive(row?.totalTimes)
  if (seq == null && total == null) return null
  return { seq, total }
}

const moneyAmount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (value == null) return null
  const text = String(value).trim()
  if (!text) return null
  const amount = Number(text)
  return Number.isFinite(amount) ? amount : null
}

export type SupplierQuoteRate = {
  key:
    | "admin.supplierOrders.rateWithMaterial"
    | "admin.supplierOrders.rateWithoutMaterial"
    | "admin.supplierOrders.rateStaffHour"
    | "admin.supplierOrders.rateQuantity"
  amount: number
}

/** Unit rates the assigned-order detail can show for the current quote mode. */
export function supplierQuoteRates(row: {
  quoteMode?: unknown
  unitPrice?: unknown
  unitPriceWithMaterial?: unknown
  unitPriceWithoutMaterial?: unknown
} | null | undefined): SupplierQuoteRate[] {
  const mode = Number(row?.quoteMode)
  const rates: SupplierQuoteRate[] = []
  const push = (key: SupplierQuoteRate["key"], value: unknown) => {
    const amount = moneyAmount(value)
    if (amount != null) rates.push({ key, amount })
  }
  if (mode === 2) {
    push("admin.supplierOrders.rateWithMaterial", row?.unitPriceWithMaterial)
    push("admin.supplierOrders.rateWithoutMaterial", row?.unitPriceWithoutMaterial)
  } else if (mode === 3) {
    push("admin.supplierOrders.rateStaffHour", row?.unitPrice)
  } else if (mode === 4) {
    push("admin.supplierOrders.rateQuantity", row?.unitPrice)
  }
  return rates
}

export function supplierSkuCode(row: { skuCode?: unknown } | null | undefined) {
  return String(row?.skuCode ?? "").trim()
}

export type SupplierAttachLine = {
  id: string
  name: unknown
  nameI18n: unknown
  unit: unknown
  unitI18n: unknown
  quantity: number
  addedAfterPay: boolean
  source: string
  sourceI18n: unknown
  addonPaymentId: string
  quotePrice: number | null
}

/** Attach rows from the supplier order detail, including prices added after payment. */
export function supplierAttachLines(row: { attaches?: unknown } | null | undefined): SupplierAttachLine[] {
  const attaches = Array.isArray(row?.attaches) ? row.attaches : []
  return attaches.flatMap((item, index) => {
    if (!item || typeof item !== "object") return []
    const record = item as Record<string, unknown>
    const quantity = Number(record.quantity)
    return [{
      id: `${record.attachValueId ?? "attach"}-${index}`,
      name: record.name,
      nameI18n: record.nameI18n,
      unit: record.unit,
      unitI18n: record.unitI18n,
      quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
      addedAfterPay: record.addedAfterPay === true || record.source === "ADDON",
      source: String(record.source ?? "").trim(),
      sourceI18n: record.sourceI18n,
      addonPaymentId: String(record.addonPaymentId ?? "").trim(),
      quotePrice: moneyAmount(record.quotePrice),
    }]
  })
}

export type SupplierSkuLine = {
  id: string
  spuName: unknown
  spuNameI18n: unknown
  specs: unknown
  specDescription: unknown
  skuId: string
  skuCode: string
  spuCode: string
  quantity: number | null
  quoteMode: unknown
  quoteModeI18n: unknown
  quotePrice: number | null
  quoteAmount: number | null
  staffCount: number | null
  serviceHours: number | null
  unitPrice: unknown
  unitPriceWithMaterial: unknown
  unitPriceWithoutMaterial: unknown
  supplierFulfillRemark: string
}

const wholeNumber = (value: unknown) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

const hasReadableSpecs = (row: { specs?: unknown; specDescription?: unknown; skuCode?: unknown } | null | undefined) => {
  if (supplierSpecSummary(row)) return true
  const specs = Array.isArray(row?.specs) ? row.specs : []
  return specs.some((spec) => {
    if (!spec || typeof spec !== "object") return false
    return Object.values(spec as Record<string, unknown>).some((value) => {
      if (typeof value === "string" && value.trim()) return true
      if (!value || typeof value !== "object") return false
      return Object.values(value as Record<string, unknown>).some((item) => typeof item === "string" && item.trim())
    })
  })
}

const fulfillRemark = (value: unknown) => String(value ?? "").trim().slice(0, 512)

const withVisitSpecs = <T extends SupplierSkuLine>(line: T, row: { specs?: unknown; specDescription?: unknown } | null | undefined): T => {
  if (hasReadableSpecs(line)) return line
  const specs = Array.isArray(row?.specs) ? row.specs : []
  const description = specPart(row?.specDescription)
  if (!specs.length && !description) return line
  return {
    ...line,
    specs: specs.length ? specs : line.specs,
    specDescription: description || line.specDescription,
  }
}

/** Every SKU the assigned-order detail returned, including a single-line order. */
export function supplierSkuLines(row: {
  lines?: unknown
  skuId?: unknown
  skuCode?: unknown
  spuCode?: unknown
  spuName?: unknown
  spuNameI18n?: unknown
  specs?: unknown
  specDescription?: unknown
  quantity?: unknown
  quoteMode?: unknown
  quoteModeI18n?: unknown
  quotePrice?: unknown
  quoteAmount?: unknown
  staffCount?: unknown
  serviceHours?: unknown
  unitPrice?: unknown
  unitPriceWithMaterial?: unknown
  unitPriceWithoutMaterial?: unknown
  supplierFulfillRemark?: unknown
} | null | undefined): SupplierSkuLine[] {
  const lines = Array.isArray(row?.lines) ? row.lines.filter((item) => item && typeof item === "object") : []
  const source = lines.length ? lines : row?.skuId || row?.skuCode || row?.spuCode || row?.spuName ? [row] : []
  const mapped = source.map((item, index) => {
    const record = item as Record<string, unknown>
    return {
      id: `${record.skuId ?? record.skuCode ?? "sku"}-${index}`,
      spuName: record.spuName,
      spuNameI18n: record.spuNameI18n,
      specs: record.specs,
      specDescription: record.specDescription,
      skuId: String(record.skuId ?? "").trim(),
      skuCode: String(record.skuCode ?? "").trim(),
      spuCode: String(record.spuCode ?? "").trim(),
      quantity: wholeNumber(record.quantity),
      quoteMode: record.quoteMode,
      quoteModeI18n: record.quoteModeI18n,
      quotePrice: moneyAmount(record.quotePrice),
      quoteAmount: moneyAmount(record.quoteAmount),
      staffCount: wholeNumber(record.staffCount),
      serviceHours: wholeNumber(record.serviceHours),
      unitPrice: record.unitPrice,
      unitPriceWithMaterial: record.unitPriceWithMaterial,
      unitPriceWithoutMaterial: record.unitPriceWithoutMaterial,
      supplierFulfillRemark: fulfillRemark(record.supplierFulfillRemark),
    }
  })
  if (!isSupplierPackageOrder(row) || !mapped.length) return mapped
  const visitSku = String(row?.skuId ?? "").trim()
  const match = visitSku ? mapped.findIndex((line) => line.skuId === visitSku) : -1
  const index = match >= 0 ? match : 0
  mapped[index] = withVisitSpecs(mapped[index], row)
  const visitRemark = fulfillRemark(row?.supplierFulfillRemark)
  if (visitRemark) mapped[index] = { ...mapped[index], supplierFulfillRemark: visitRemark }
  return mapped
}

/** Notes the platform wrote on the SKUs in this visit. Package visits use the visit SKU. */
export function supplierFulfillRemarks(row: {
  lines?: unknown
  skuId?: unknown
  packageOrder?: unknown
  orderType?: unknown
  supplierFulfillRemark?: unknown
} | null | undefined) {
  const notes: string[] = []
  const push = (value: unknown) => {
    const text = fulfillRemark(value)
    if (text && !notes.includes(text)) notes.push(text)
  }
  if (isSupplierPackageOrder(row)) {
    push(row?.supplierFulfillRemark)
    if (notes.length) return notes
  }
  supplierSkuLines(row).forEach((line) => push(line.supplierFulfillRemark))
  if (!notes.length) push(row?.supplierFulfillRemark)
  return notes
}

export type SupplierOrderGroup = {
  key: string
  source: "INITIAL" | "ADDON"
  sourceI18n: unknown
  addonPaymentId: string
  skus: SupplierSkuLine[]
  attaches: SupplierAttachLine[]
}

const addonAttach = (item: SupplierAttachLine) => item.source === "ADDON" || item.addedAfterPay

/** Original order first, then each paid add-on order on its own. */
export function supplierOrderGroups(row: Parameters<typeof supplierSkuLines>[0] & { attaches?: unknown } | null | undefined): SupplierOrderGroup[] {
  const skus = supplierSkuLines(row)
  const attaches = supplierAttachLines(row)
  const groups: SupplierOrderGroup[] = []
  const initialAttaches = attaches.filter((item) => !addonAttach(item))
  if (skus.length || initialAttaches.length) {
    groups.push({
      key: "INITIAL",
      source: "INITIAL",
      sourceI18n: initialAttaches.find((item) => item.sourceI18n)?.sourceI18n,
      addonPaymentId: "",
      skus,
      attaches: initialAttaches,
    })
  }
  const addonGroups = new Map<string, SupplierOrderGroup>()
  attaches.forEach((item, index) => {
    if (!addonAttach(item)) return
    const key = item.addonPaymentId ? `ADDON-${item.addonPaymentId}` : `ADDON-${item.id}-${index}`
    const current = addonGroups.get(key)
    if (current) {
      current.attaches.push(item)
      return
    }
    addonGroups.set(key, {
      key,
      source: "ADDON",
      sourceI18n: item.sourceI18n,
      addonPaymentId: item.addonPaymentId,
      skus: [],
      attaches: [item],
    })
  })
  groups.push(...addonGroups.values())
  return groups
}

const specPart = (value: unknown) => {
  const text = String(value ?? "").trim()
  if (!text || text === "—") return ""
  return text
}

/** Camel-case catalog keys such as ApolloHomeSize are not labels a supplier can read. */
const internalSpecCode = (value: string) =>
  /^[A-Za-z][A-Za-z0-9]*$/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value.slice(1))

const readableSpecPart = (value: unknown) => {
  const text = specPart(value)
  return internalSpecCode(text) ? "" : text
}

/** Supplier-facing spec text: keep the chosen values, and drop internal type codes. */
export function supplierSpecSummary(
  row: { specs?: unknown; specDescription?: unknown; skuCode?: unknown } | null | undefined,
  label: (i18n: unknown, plain: unknown) => unknown = (_i18n, plain) => plain,
) {
  const specs = Array.isArray(row?.specs) ? row.specs : []
  const lines = specs.flatMap((spec) => {
    if (!spec || typeof spec !== "object") return []
    const record = spec as Record<string, unknown>
    const text = [
      readableSpecPart(label(record.typeNameI18n, record.typeName)),
      readableSpecPart(label(record.valueNameI18n, record.valueName)),
    ].filter(Boolean).join(": ")
    return text ? [text] : []
  })
  if (lines.length) return lines.join("; ")
  const description = specPart(row?.specDescription)
  const skuCode = specPart(row?.skuCode)
  if (!description || description === skuCode) return ""
  if (/^[0-9a-f]{8}-[0-9a-f-]{13,}$/i.test(description)) return ""
  return description
    .split(/\s*;\s*/)
    .map((part) => {
      const index = part.indexOf(":")
      if (index <= 0) return readableSpecPart(part)
      const typeName = part.slice(0, index).trim()
      const valueName = part.slice(index + 1).trim()
      if (internalSpecCode(typeName)) return readableSpecPart(valueName)
      return [readableSpecPart(typeName), readableSpecPart(valueName)].filter(Boolean).join(": ")
    })
    .filter(Boolean)
    .join("; ")
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/** What the supplier receives for one SKU line. */
export function supplierLineEarning(row: { quoteAmount?: unknown; quotePrice?: unknown } | null | undefined) {
  const amount = moneyAmount(row?.quoteAmount)
  if (amount != null) return amount
  return moneyAmount(row?.quotePrice)
}

/** What the supplier receives for one add-on, including its quantity. */
export function supplierAttachEarning(row: { quotePrice?: unknown; quantity?: unknown } | null | undefined) {
  const unit = moneyAmount(row?.quotePrice)
  if (unit == null) return null
  const quantity = Number(row?.quantity)
  const count = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
  return roundMoney(unit * count)
}

/** What the supplier receives for the whole assigned order, including later add-ons. */
export function supplierOrderEarning(row: Parameters<typeof supplierOrderGroups>[0] & {
  packageQuotePrice?: unknown
}) {
  if (isSupplierPackageOrder(row)) {
    const visitTotal = moneyAmount(row?.quoteAmount)
    if (visitTotal != null) return visitTotal
    const visitPrice = moneyAmount(row?.packageQuotePrice) ?? moneyAmount(row?.quotePrice)
    if (visitPrice != null) return visitPrice
  }
  const groups = supplierOrderGroups(row)
  let cents = 0
  let found = false
  groups.forEach((group) => {
    group.skus.forEach((sku) => {
      const amount = supplierLineEarning(sku)
      if (amount == null) return
      cents += Math.round(amount * 100)
      found = true
    })
    group.attaches.forEach((item) => {
      const amount = supplierAttachEarning(item)
      if (amount == null) return
      cents += Math.round(amount * 100)
      found = true
    })
  })
  if (found) return cents / 100
  return supplierLineEarning(row)
}
