import type { PackageCatalogCard, PackageCatalogItem, PackageSpecLine } from '@/modules/client/api'

type RecordValue = Record<string, unknown>
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {}
const validId = (value: unknown) => /^[1-9]\d*$/.test(String(value ?? '')) && Number.isSafeInteger(Number(value))
const needsIdentity = (line: PackageSpecLine) => !validId(line.specTypeId) || !validId(line.specValueId)

const names = (value: unknown) => Object.fromEntries(Object.entries(record(value))
  .filter(([key, text]) => /^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/i.test(key) && typeof text === 'string' && text.trim())
  .map(([key, text]) => [key.toLowerCase().replaceAll('_', '-'), String(text).trim()]))

// Match within one service's authoritative bindings. Conflicting translations
// or more than one matching dictionary entry remain unshared.
const sameName = (left: unknown, right: unknown) => {
  const source = names(left)
  const target = names(right)
  const common = Object.keys(source).filter((language) => target[language] != null)
  return common.length > 0 && common.every((language) => source[language] === target[language])
}

const addIdentity = (line: PackageSpecLine, metadata: RecordValue): PackageSpecLine => {
  if (!needsIdentity(line)) return line
  const bindings = (Array.isArray(metadata.specBindings) ? metadata.specBindings : []).map(record)
  const typeNames = record(metadata.specTypeNameI18n)
  const valueNames = record(metadata.specValueNameI18n)
  const types = new Map<string, string[]>()
  for (const binding of bindings) {
    if (!validId(binding.specTypeId)) continue
    const typeId = String(binding.specTypeId)
    const values = (Array.isArray(binding.specValueIds) ? binding.specValueIds : []).filter(validId).map(String)
    types.set(typeId, [...new Set([...(types.get(typeId) || []), ...values])])
  }
  const matches = [...types].filter(([typeId, values]) =>
    (validId(line.specTypeId) ? typeId === String(line.specTypeId) : sameName(line.specTypeNameI18n, typeNames[typeId]))
    && (!validId(line.specValueId) || values.includes(String(line.specValueId))),
  )
  if (matches.length !== 1) return line
  const [typeId, values] = matches[0]!
  const matchingValues = values.filter((valueId) => validId(line.specValueId)
    ? valueId === String(line.specValueId)
    : sameName(line.specValueNameI18n, valueNames[valueId]))
  if (matchingValues.length !== 1) return line
  return { ...line, specTypeId: typeId, specValueId: matchingValues[0]! }
}

const needsMetadata = (item: PackageCatalogItem) => Number(item.bindType) !== 2
  && validId(item.spuId)
  && (item.skuOptions || []).some((option) => (option.specI18n || []).some(needsIdentity))

/** Compatibility for servers that omit IDs from package SKU options. */
export const hydratePackageSpecIds = async (
  card: PackageCatalogCard,
  loadProductDetail: (spuId: string) => Promise<unknown>,
): Promise<PackageCatalogCard> => {
  const pending = new Map<string, Promise<RecordValue>>()
  for (const item of card.items || []) {
    if (!needsMetadata(item)) continue
    const spuId = String(item.spuId)
    if (!pending.has(spuId)) pending.set(spuId, Promise.resolve().then(() => loadProductDetail(spuId)).then((value) => {
      const metadata = record(value)
      return validId(metadata.id) && String(metadata.id) !== spuId ? {} : metadata
    }).catch(() => ({})))
  }
  if (!pending.size) return card
  const items = await Promise.all((card.items || []).map(async (item) => {
    const request = pending.get(String(item.spuId))
    if (!request || !needsMetadata(item)) return item
    const metadata = await request
    return {
      ...item,
      skuOptions: (item.skuOptions || []).map((option) => ({
        ...option,
        specI18n: (option.specI18n || []).map((line) => addIdentity(line, metadata)),
      })),
    }
  }))
  return { ...card, items }
}
