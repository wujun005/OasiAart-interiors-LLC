import { pickI18nText } from './i18n'

export type QuoteCompareSpec = {
  label: string
  details: string[]
}

const recordOf = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
)

const textOf = (value: unknown) => (
  typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
)

/** Use the SKU catalogue for descriptions only; comparison prices come from the quote API. */
export function buildQuoteCompareSpecs(payload: unknown, locale: string): Record<number, QuoteCompareSpec> {
  const envelope = recordOf(payload)
  if (!envelope || envelope.success === false) return {}
  const catalogue = recordOf('data' in envelope ? envelope.data : envelope)
  if (!catalogue || !Array.isArray(catalogue.skus)) return {}

  const dimensions = (Array.isArray(catalogue.specTypes) ? catalogue.specTypes : []).flatMap((entry) => {
    const type = recordOf(entry)
    if (!type) return []
    const key = textOf(type.specKey ?? type.specTypeId)
    if (!key) return []
    return [{
      key,
      label: pickI18nText(recordOf(type.nameI18n), locale, textOf(type.specTypeName) || key),
    }]
  })

  const specs: Record<number, QuoteCompareSpec> = {}
  for (const entry of catalogue.skus) {
    const sku = recordOf(entry)
    if (!sku || (typeof sku.skuId !== 'string' && typeof sku.skuId !== 'number')) continue
    const skuId = Number(sku.skuId)
    if (!Number.isSafeInteger(skuId) || skuId <= 0) continue
    const values = dimensions.flatMap((dimension) => {
      const raw = sku[dimension.key]
      const value = recordOf(raw)
      const label = value
        ? pickI18nText(recordOf(value.nameI18n) ?? value, locale, textOf(value.specValueName))
        : textOf(raw)
      return label ? [{ label, detail: `${dimension.label}: ${label}` }] : []
    })
    specs[skuId] = {
      label: values.map(value => value.label).join(' · ') || textOf(sku.skuCode) || String(skuId),
      details: values.map(value => value.detail),
    }
  }
  return specs
}
