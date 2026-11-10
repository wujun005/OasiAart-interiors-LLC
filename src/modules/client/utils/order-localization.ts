type LocalizedText = Record<string, string> | undefined

const normalizeNamePart = (value: unknown) => {
  const normalized = String(value || "").trim()
  return normalized === "-" ? "" : normalized
}

export const formatContactName = (firstName?: string, lastName?: string) => {
  const first = normalizeNamePart(firstName)
  const last = normalizeNamePart(lastName)
  if (first && last && first.localeCompare(last, undefined, { sensitivity: "accent" }) === 0) {
    return first
  }
  return [first, last].filter(Boolean).join(" ")
}

export const splitContactName = (fullName: string) => {
  const value = normalizeNamePart(fullName).replace(/\s+/g, " ")
  const separatorIndex = value.lastIndexOf(" ")
  return {
    firstName: separatorIndex < 0 ? value : value.slice(0, separatorIndex),
    lastName: separatorIndex < 0 ? "" : value.slice(separatorIndex + 1),
  }
}

export type LocalizedSpecSelection = {
  specTypeName?: string
  specTypeNameI18n?: LocalizedText
  specValueName?: string
  specValueNameI18n?: LocalizedText
}

export type LocalizedAttachSelection = {
  attachTypeName?: string
  attachTypeNameI18n?: LocalizedText
  attachValueName?: string
  attachValueNameI18n?: LocalizedText
  unit?: string
  unitI18n?: LocalizedText
  quantity?: number | string
  source?: string
  sourceI18n?: LocalizedText
  addedAfterPay?: boolean
  unitPriceWithoutTax?: number | string | null
  unitPriceWithTax?: number | string | null
  amountWithoutTax?: number | string | null
  amountWithTax?: number | string | null
  taxAmount?: number | string | null
  attachValueId?: number | string
}

const preferredLanguages = (locale: string) =>
  locale.startsWith("zh")
    ? ["zh-CN", "zh_CN", "zh", "en", "en-US"]
    : ["en", "en-US", "en_US", "zh-CN", "zh"]

const pickLocalizedText = (
  values: LocalizedText,
  fallback: string,
  locale: string,
) => {
  for (const language of preferredLanguages(locale)) {
    const value = String(values?.[language] || "").trim()
    if (value) return value
  }
  return (
    Object.values(values || {})
      .map((value) => String(value || "").trim())
      .find(Boolean) || fallback
  )
}

const normalizeEnglishType = (value: string) => {
  const normalized = value.trim().toLowerCase()
  const labels: Record<string, string> = {
    房型: "Unit Types",
    户型: "Unit Types",
    家具配置: "Furnished / Unfurnished",
    家具: "Furnished / Unfurnished",
    数量: "Per Unit",
    服务数量: "Per Unit",
    服务时长: "Duration",
    时长: "Duration",
    服务人数: "Number of People",
    人数: "Number of People",
  }
  if (labels[value.trim()]) return labels[value.trim()]
  if (normalized === "unit type") return "Unit Types"
  return value.trim()
}

const normalizeChineseType = (value: string) => {
  const normalized = value.trim().toLowerCase()
  const labels: Record<string, string> = {
    "unit types": "房型",
    "unit type": "房型",
    "furnished / unfurnished": "家具配置",
    "furnished/unfurnished": "家具配置",
    "per unit": "数量",
    duration: "服务时长",
    "number of people": "服务人数",
  }
  return labels[normalized] || value.trim()
}

const normalizeEnglishValue = (value: string) => {
  const trimmed = value.trim()
  if (/^(不带家具|无家具|無家具|无家私|無家私)$/.test(trimmed)) {
    return "Unfurnished"
  }
  if (/^(带家具|有家具|帶家具|有家私)$/.test(trimmed)) return "Furnished"

  return trimmed
    .replace(/(\d+)\s*(?:居室|卧室|臥室|房间|房間)/g, (_, count) =>
      `${count} Bedroom${Number(count) === 1 ? "" : "s"}`,
    )
    .replace(/(\d+)\s*台/g, (_, count) =>
      `${count} Unit${Number(count) === 1 ? "" : "s"}`,
    )
    .replace(/(\d+)\s*(?:小时|小時)/g, (_, count) =>
      `${count} Hour${Number(count) === 1 ? "" : "s"}`,
    )
    .replace(/(\d+)\s*(?:人|位|technicians?|people|persons?)/gi, (_, count) =>
      `${count} Person${Number(count) === 1 ? "" : "s"}`,
    )
}

const normalizeChineseValue = (value: string) => {
  const trimmed = value.trim()
  if (/^unfurnished$/i.test(trimmed)) return "不带家具"
  if (/^furnished$/i.test(trimmed)) return "带家具"

  return trimmed
    .replace(/(\d+)\s*bedrooms?/gi, "$1 居室")
    .replace(/(\d+)\s*units?/gi, "$1 台")
    .replace(/(\d+)\s*hours?/gi, "$1 小时")
    .replace(/(\d+)\s*(?:technicians?|people|persons?)/gi, "$1 人")
}

export const localizeOrderText = (
  values: LocalizedText,
  fallback: string | undefined,
  locale: string,
  kind: "type" | "value" = "value",
) => {
  const raw = pickLocalizedText(values, String(fallback || "").trim(), locale)
  if (!raw) return ""
  if (locale.startsWith("zh")) {
    return kind === "type" ? normalizeChineseType(raw) : normalizeChineseValue(raw)
  }
  return kind === "type" ? normalizeEnglishType(raw) : normalizeEnglishValue(raw)
}

export const formatOrderSpecs = (
  selections: LocalizedSpecSelection[] | undefined,
  locale: string,
) =>
  (Array.isArray(selections) ? selections : [])
    .map((selection) => {
      const typeName = localizeOrderText(
        selection.specTypeNameI18n,
        selection.specTypeName,
        locale,
        "type",
      )
      const valueName = localizeOrderText(
        selection.specValueNameI18n,
        selection.specValueName,
        locale,
      )
      if (!valueName) return ""
      return typeName ? `${typeName}: ${valueName}` : valueName
    })
    .filter(Boolean)
    .join(" · ")

export type OrderSummaryAttachLine = {
  id: string
  label: string
  quantity: number
  amount?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const asLocalizedText = (value: unknown): LocalizedText => {
  if (!isRecord(value)) return undefined
  const entries = Object.entries(value).filter(
    ([, text]) => typeof text === "string" && text.trim(),
  )
  if (!entries.length) return undefined
  return Object.fromEntries(entries.map(([key, text]) => [key, String(text).trim()]))
}

const roundOrderMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export const readOrderSummaryAttachLines = (
  value: unknown,
  locale: string,
): OrderSummaryAttachLine[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap((item, index) => {
    if (!isRecord(item)) return []
    const label = localizeOrderText(
      asLocalizedText(item.labelI18n) || asLocalizedText(item.attachValueNameI18n),
      String(item.label ?? item.attachValueName ?? "").trim(),
      locale,
    )
    if (!label) return []
    const unit = localizeOrderText(
      asLocalizedText(item.unitI18n),
      String(item.unit ?? "").trim(),
      locale,
    )
    const quantity = Math.max(0, Number(item.quantity ?? 1) || 0)
    if (quantity <= 0) return []
    const amountValue = Number(item.amount)
    const hasAmount =
      item.amount !== undefined &&
      item.amount !== null &&
      item.amount !== "" &&
      Number.isFinite(amountValue)
    return [{
      id: String(item.id ?? item.attachValueId ?? `${label}-${index}`),
      label: unit ? `${label} / ${unit}` : label,
      quantity,
      ...(hasAmount ? { amount: roundOrderMoney(amountValue) } : {}),
    }]
  })
}

export const orderLineSourceLabel = (
  item: {
    source?: unknown
    sourceI18n?: LocalizedText
    addedAfterPay?: unknown
  } | null | undefined,
  locale: string,
) => {
  const fromMap = localizeOrderText(item?.sourceI18n, "", locale)
  if (fromMap) return fromMap
  const addon = item?.source === "ADDON" || item?.addedAfterPay === true
  const initial = item?.source === "INITIAL"
  if (!addon && !initial) return ""
  const zh = String(locale || "").toLowerCase().startsWith("zh")
  if (addon) return zh ? "支付后追加" : "Added after payment"
  return zh ? "首次下单" : "Initial order"
}

const optionalOrderMoney = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null
  const amount = Number(value)
  return Number.isFinite(amount) ? roundOrderMoney(amount) : null
}

export type PurchasedAttachLine = {
  id: string
  label: string
  typeName: string
  quantity: number
  unit: string
  source: string
  addon: boolean
  unitPriceWithoutTax: number | null
  unitPriceWithTax: number | null
  amountWithoutTax: number | null
  amountWithTax: number | null
  taxAmount: number | null
}

export const readPurchasedAttachLines = (
  selections: LocalizedAttachSelection[] | undefined,
  locale: string,
): PurchasedAttachLine[] =>
  (Array.isArray(selections) ? selections : []).flatMap((selection, index) => {
    const label = localizeOrderText(
      selection.attachValueNameI18n,
      selection.attachValueName,
      locale,
    )
    if (!label) return []
    const quantity = Math.max(0, Number(selection.quantity ?? 0) || 0)
    const source = orderLineSourceLabel(selection, locale)
    return [{
      id: `${selection.attachValueId ?? label}-${index}`,
      label,
      typeName: localizeOrderText(
        selection.attachTypeNameI18n,
        selection.attachTypeName,
        locale,
      ),
      quantity,
      unit: localizeOrderText(selection.unitI18n, selection.unit, locale),
      source,
      addon: selection.source === "ADDON" || selection.addedAfterPay === true,
      unitPriceWithoutTax: optionalOrderMoney(selection.unitPriceWithoutTax),
      unitPriceWithTax: optionalOrderMoney(selection.unitPriceWithTax),
      amountWithoutTax: optionalOrderMoney(selection.amountWithoutTax),
      amountWithTax: optionalOrderMoney(selection.amountWithTax),
      taxAmount: optionalOrderMoney(selection.taxAmount),
    }]
  })

const formatAttachMoney = (amount: number | null) =>
  amount == null ? "" : `AED ${amount.toFixed(2)}`

export const formatOrderAddOns = (
  selections: LocalizedAttachSelection[] | undefined,
  locale: string,
) =>
  readPurchasedAttachLines(selections, locale)
    .map((line) => {
      const labeled = line.unit ? `${line.label} / ${line.unit}` : line.label
      const base = line.quantity > 1 ? `${labeled} × ${line.quantity}` : labeled
      const named = !line.source
        ? base
        : String(locale || "").toLowerCase().startsWith("zh")
          ? `${base}（${line.source}）`
          : `${base} (${line.source})`
      const amount = formatAttachMoney(line.amountWithTax ?? line.amountWithoutTax)
      return amount ? `${named} · ${amount}` : named
    })
    .filter(Boolean)
    .join(" · ")
