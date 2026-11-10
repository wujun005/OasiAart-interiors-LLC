export type OrderAddonCandidate = {
  orderId?: unknown
  orderNo?: unknown
  orderType?: unknown
  packageOrder?: unknown
  packageId?: unknown
  orderStatus?: unknown
  paymentStatus?: unknown
  spuId?: unknown
  canAddAttach?: unknown
}

export type AddonGate = "allowed" | "syncing" | "package" | "blocked" | "missing"

export type AddonOption = {
  id: string
  label: string
  unit: string
  price: number
}

export type AddonGroup = {
  id: string
  label: string
  options: AddonOption[]
}

export type AddonLineCharge = {
  id: string
  quantity: number
  unitPrice: number
  without: number
  tax: number
  withTax: number
}

const ADDON_ORDER_STATUSES = new Set([1, 2, 6])

function isPackageOrder(order: OrderAddonCandidate) {
  const packageId = order.packageId == null ? "" : String(order.packageId).trim()
  return order.packageOrder === true || Number(order.orderType) === 2 || packageId !== ""
}

function resolvedStatus(order: OrderAddonCandidate, status?: number | null) {
  if (status != null && Number.isFinite(status)) return Number(status)
  const explicit = Number(order.orderStatus)
  return Number.isFinite(explicit) ? explicit : NaN
}

export function addonGate(
  order: OrderAddonCandidate | null | undefined,
  status?: number | null,
): AddonGate {
  if (!order) return "missing"
  if (typeof order.canAddAttach === "boolean") return order.canAddAttach ? "allowed" : "blocked"
  if (isPackageOrder(order)) return "package"
  const orderStatus = resolvedStatus(order, status)
  if (orderStatus === 0) return "syncing"
  if (!ADDON_ORDER_STATUSES.has(orderStatus)) return "blocked"
  const payment = order.paymentStatus
  if (payment != null && String(payment).trim() !== "" && Number(payment) !== 1) {
    return Number(payment) === 0 ? "syncing" : "blocked"
  }
  const orderId = String(order.orderId ?? "").trim()
  const orderNo = String(order.orderNo ?? "").trim()
  if (!orderId && !orderNo) return "missing"
  return "allowed"
}

export function canAddPaidOrderAddons(
  order: OrderAddonCandidate | null | undefined,
  status?: number | null,
) {
  return addonGate(order, status) === "allowed"
}

export function singleOrderKey(value: unknown) {
  const parts = (Array.isArray(value) ? value : [value]).flatMap((raw) =>
    String(raw ?? "").split(",").map((part) => part.trim()).filter(Boolean),
  )
  return parts.length === 1 ? parts[0] : ""
}

export function singleOrderReference(orderId: unknown, orderNo: unknown) {
  const id = singleOrderKey(orderId)
  const no = singleOrderKey(orderNo)
  const provided = (value: unknown) => (Array.isArray(value) ? value : [value])
    .some((item) => String(item ?? "").trim() !== "")
  if ((provided(orderId) && !id) || (provided(orderNo) && !no) || (!id && !no)) return null
  return { orderId: id, orderNo: no }
}

export function roundMoney(value: number) {
  if (!Number.isFinite(value)) return 0
  const sign = value < 0 ? -1 : 1
  return (sign * Math.round(Math.abs(value) * 100 + 1e-8)) / 100
}

export function addonLineCharge(id: string, unitPrice: number, quantity: number): AddonLineCharge | null {
  const qty = Math.floor(Number(quantity))
  const unit = Number(unitPrice)
  if (!id || !Number.isFinite(unit) || unit < 0 || qty < 1) return null
  const without = roundMoney(roundMoney(unit) * qty)
  const tax = roundMoney(without * 0.05)
  return {
    id,
    quantity: qty,
    unitPrice: roundMoney(unit),
    without,
    tax,
    withTax: roundMoney(without + tax),
  }
}

export function sumAddonCharges(lines: AddonLineCharge[]) {
  const without = roundMoney(lines.reduce((sum, line) => sum + line.without, 0))
  const tax = roundMoney(lines.reduce((sum, line) => sum + line.tax, 0))
  return {
    without,
    tax,
    withTax: roundMoney(without + tax),
  }
}

export function localizedText(
  map: Record<string, string> | null | undefined,
  locale: string,
  fallback = "",
) {
  const valueMap = map || {}
  const keys = String(locale || "").toLowerCase().startsWith("zh")
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]
  for (const key of keys) {
    const value = valueMap[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  const first = Object.values(valueMap).find((value) => typeof value === "string" && value.trim())
  return typeof first === "string" ? first.trim() : fallback
}

const configuredPrice = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null
  if (typeof value === "string" && !value.trim()) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function amountMap(detail: Record<string, unknown> | null | undefined) {
  const prices: Record<string, number> = {}
  const sources = [
    detail?.attachValueAmountMap,
    detail?.attachValuePriceMap,
    detail?.attachAmountMap,
    detail?.attachPriceMap,
  ]
  sources.forEach((source) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) return
    Object.entries(source as Record<string, unknown>).forEach(([id, raw]) => {
      const key = String(id || "").trim()
      const price = configuredPrice(raw)
      if (!key || price == null) return
      if (prices[key] == null || prices[key] <= 0) prices[key] = price
    })
  })
  return prices
}

/** 1 is checkout only, 2 is extra-service purchase only, anything else stays visible in both. */
export function attachShownAt(mode: unknown, place: "checkout" | "extra") {
  const code = Number(mode)
  if (code === 1) return place === "checkout"
  if (code === 2) return place === "extra"
  return true
}

export function addonGroupsFromOptions(options: unknown, locale: string): AddonGroup[] {
  const rows = Array.isArray(options) ? options : []
  const groups: AddonGroup[] = []
  const byType = new Map<string, AddonGroup>()
  const seen = new Set<string>()
  rows.forEach((raw) => {
    if (!raw || typeof raw !== "object") return
    const row = raw as Record<string, unknown>
    if (!attachShownAt(row.displayMode, "extra")) return
    const price = configuredPrice(row.unitPriceWithoutTax)
    if (price == null) return
    const id = String(row.attachValueId ?? "").trim()
    if (!id || seen.has(id)) return
    seen.add(id)
    const names = row.attachValueNameI18n as Record<string, string> | undefined
    const label = localizedText(names, locale, String(row.attachValueName ?? "").trim())
    if (!label) return
    const typeId = String(row.attachTypeId ?? "").trim() || "0"
    let group = byType.get(typeId)
    if (!group) {
      const typeNames = row.attachTypeNameI18n as Record<string, string> | undefined
      group = {
        id: typeId,
        label: localizedText(typeNames, locale, String(row.attachTypeName ?? "").trim() || typeId),
        options: [],
      }
      byType.set(typeId, group)
      groups.push(group)
    }
    if (group.options.some((item) => item.id === id)) return
    const units = row.unitI18n as Record<string, string> | undefined
    group.options.push({
      id,
      label,
      unit: localizedText(units, locale, String(row.unit ?? "").trim()),
      price,
    })
  })
  return groups
}

export function addonCatalog(
  detail: Record<string, unknown> | null | undefined,
  locale: string,
): AddonGroup[] {
  const bindings = Array.isArray(detail?.attachBindings) ? detail.attachBindings : []
  const prices = amountMap(detail)
  const typeNames = (detail?.attachTypeNameI18n || {}) as Record<string, Record<string, string>>
  const valueNames = (detail?.attachValueNameI18n || {}) as Record<string, Record<string, string>>
  const valueUnits = (detail?.attachValueUnitI18n || {}) as Record<string, Record<string, string>>
  return bindings
    .map((binding) => {
      if (!binding || typeof binding !== "object") return null
      const row = binding as Record<string, unknown>
      if (!attachShownAt(row.displayMode, "extra")) return null
      const typeId = String(row.attachTypeId ?? "").trim()
      if (!typeId) return null
      const valueIds = Array.isArray(row.attachValueIds) ? row.attachValueIds : []
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? "").trim()
          if (!id) return null
          const label = localizedText(valueNames[id], locale, "")
          if (!label) return null
          const price = prices[id]
          if (price == null) return null
          return {
            id,
            label,
            unit: localizedText(valueUnits[id], locale, ""),
            price,
          }
        })
        .filter((option): option is AddonOption => Boolean(option))
      if (!options.length) return null
      return {
        id: typeId,
        label: localizedText(typeNames[typeId], locale, typeId),
        options,
      }
    })
    .filter((group): group is AddonGroup => Boolean(group))
}
