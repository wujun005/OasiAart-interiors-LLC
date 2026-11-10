export type SpecSelection = {
  specTypeId: number | null
  specIds: number[]
}

export function supplierQuoteStarted(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

export function countOf(value: unknown) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

export function specSelections(groups: SpecSelection[]) {
  return groups.map((group) => ({
    specTypeId: Number.isInteger(Number(group?.specTypeId)) && Number(group.specTypeId) > 0
      ? Number(group.specTypeId)
      : null,
    specIds: (Array.isArray(group?.specIds) ? group.specIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0),
  }))
}

/** 已有供应商报价后，只能保留或减少规格，不能新增规格类型或选项。 */
export function specsExpanded(stored: SpecSelection[], incoming: SpecSelection[]) {
  const base = new Map<number, Set<number>>()
  for (const group of specSelections(stored)) {
    if (group.specTypeId == null) continue
    const values = base.get(group.specTypeId) ?? new Set<number>()
    group.specIds.forEach((id) => values.add(id))
    base.set(group.specTypeId, values)
  }
  for (const group of specSelections(incoming)) {
    if (group.specTypeId == null) continue
    const existing = base.get(group.specTypeId)
    if (!existing) return true
    if (group.specIds.some((id) => !existing.has(id))) return true
  }
  return false
}

export function allowedSpecIds(stored: SpecSelection[], typeId: number | null) {
  if (typeId == null) return null
  const allowed = new Set<number>()
  for (const group of specSelections(stored)) {
    if (group.specTypeId === typeId) group.specIds.forEach((id) => allowed.add(id))
  }
  return allowed
}
