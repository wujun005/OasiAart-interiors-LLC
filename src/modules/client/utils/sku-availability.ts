export type SkuChoiceGroup = {
  typeId: string
  options: Array<{ id: string }>
}

export type SkuLookup = (payload: {
  spuId: string | number
  specValueIds: string[]
}) => Promise<{ valid?: unknown } | null>

/** 空和无法识别的状态按有效处理。只有明确的 0 才是失效。 */
export const isOfferedFlag = (valid: unknown) => {
  if (valid == null || valid === '') return true
  const flag = Number(valid)
  return !Number.isFinite(flag) || flag !== 0
}

export const isOfferedSku = (sku: { valid?: unknown } | null | undefined) =>
  Boolean(sku) && isOfferedFlag(sku?.valid)

export const skuComboKey = (ids: string[]) => ids.join(',')

const cartesian = (lists: string[][]): string[][] => {
  if (!lists.length) return [[]]
  return lists.reduce<string[][]>(
    (rows, list) => rows.flatMap((row) => list.map((item) => [...row, item])),
    [[]],
  )
}

const mapPool = async <T>(
  items: T[],
  limit: number,
  visit: (item: T) => Promise<void>,
) => {
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor += 1
      await visit(item)
    }
  })
  await Promise.all(workers)
}

export const loadValidSkuKeys = async (
  spuId: string | number,
  groups: SkuChoiceGroup[],
  lookup: SkuLookup,
) => {
  const combos = cartesian(groups.map((group) => group.options.map((option) => option.id)))
  const keys = new Set<string>()
  await mapPool(combos, 6, async (ids) => {
    try {
      const sku = await lookup({ spuId, specValueIds: ids })
      if (isOfferedSku(sku)) keys.add(skuComboKey(ids))
    } catch {
      // 查不到或已失效的组合不进入可选范围。
    }
  })
  return keys
}

const comboExists = (
  groups: SkuChoiceGroup[],
  chosen: Record<string, string>,
  groupIndex: number,
  optionId: string,
  keys: Set<string>,
) => {
  for (const key of keys) {
    const parts = key.split(',')
    if (parts.length !== groups.length) continue
    const matched = groups.every((group, index) => {
      const wanted = index === groupIndex ? optionId : chosen[group.typeId]
      return !wanted || parts[index] === wanted
    })
    if (matched) return true
  }
  return false
}

/** 只展示能和当前其它规格组成有效 SKU 的选项。 */
export const skuOptionShown = (
  groups: SkuChoiceGroup[],
  groupIndex: number,
  optionId: string,
  keys: Set<string> | null,
  selected: Record<string, string> = {},
) => {
  if (!keys) return true
  const chosen: Record<string, string> = {}
  groups.forEach((group, index) => {
    if (index === groupIndex) return
    const current = selected[group.typeId]
    if (current) chosen[group.typeId] = current
  })
  return comboExists(groups, chosen, groupIndex, optionId, keys)
}

export const skuSelectionOffered = (
  groups: SkuChoiceGroup[],
  selected: Record<string, string>,
  keys: Set<string> | null,
) => {
  if (!keys) return true
  if (!groups.length) return keys.has('')
  const ids = groups.map((group) => selected[group.typeId] || '')
  if (ids.some((id) => !id)) return false
  return keys.has(skuComboKey(ids))
}

/** 保留刚选中的规格，并把其余规格调到仍能组成有效 SKU 的选项。 */
export const reconcileSkuSelection = (
  groups: SkuChoiceGroup[],
  selected: Record<string, string>,
  keys: Set<string> | null,
  lockedTypeId: string | null = null,
) => {
  if (!keys) return { ...selected }
  const next: Record<string, string> = {}
  const lockedIndex = groups.findIndex((group) => group.typeId === lockedTypeId)
  const order = lockedIndex >= 0
    ? [lockedIndex, ...groups.map((_, index) => index).filter((index) => index !== lockedIndex)]
    : groups.map((_, index) => index)
  order.forEach((index) => {
    const group = groups[index]
    const candidates = group.options.filter((option) =>
      comboExists(groups, next, index, option.id, keys),
    )
    const chosen = candidates.find((option) => option.id === selected[group.typeId]) || candidates[0]
    if (chosen) next[group.typeId] = chosen.id
  })
  return next
}
