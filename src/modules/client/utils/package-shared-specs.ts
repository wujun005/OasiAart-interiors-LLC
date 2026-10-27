export interface SpecPart {
  typeKey: string
  typeLabel: string
  valueKey: string
  valueLabel: string
  typeId?: string
  valueId?: string
}

export interface SkuChoice {
  id: string
  label: string
  parts: SpecPart[]
}

export interface SpecItem {
  id: string
  choices: SkuChoice[]
}

export interface SharedSpec {
  id: string
  label: string
  itemIds: string[]
  options: Array<{ id: string; label: string }>
}

export interface SharedSpecGroup extends SharedSpec {
  selectedId: string
  options: Array<{ id: string; label: string; disabled: boolean }>
}

type Selection = Record<string, string>
const validId = (value: string | undefined) => /^[1-9]\d*$/.test(value || '')
const partFor = (choice: SkuChoice | undefined, typeKey: string) => choice?.parts.find((part) => part.typeKey === typeKey)

// Search actual SKU rows instead of multiplying independent option lists. This
// keeps combinations that do not exist in one of the services out of the UI.
const solve = (items: SpecItem[], definitions: SharedSpec[], current: Selection, constraints: Selection, preserveLocal: boolean): Selection | null => {
  const related = items.filter((item) => definitions.some((group) => group.itemIds.includes(item.id)))
  const candidates = new Map(related.map((item) => {
    const groups = definitions.filter((group) => group.itemIds.includes(item.id))
    const sharedKeys = new Set(groups.map((group) => group.id))
    const selected = item.choices.find((choice) => choice.id === current[item.id])
    const local = preserveLocal ? selected?.parts.filter((part) => !sharedKeys.has(part.typeKey)) || [] : []
    const choices = item.choices.filter((choice) =>
      local.every((part) => partFor(choice, part.typeKey)?.valueKey === part.valueKey)
      && groups.every((group) => {
        const value = partFor(choice, group.id)?.valueKey
        return group.options.some((option) => option.id === value)
          && (!constraints[group.id] || constraints[group.id] === value)
      }),
    ).sort((a, b) => Number(b.id === current[item.id]) - Number(a.id === current[item.id]))
    // Different local options with the same shared values cannot change the
    // solution; keep the preferred row without enumerating their cross product.
    const tuples = new Set<string>()
    return [item.id, choices.filter((choice) => {
      const key = JSON.stringify(groups.map((group) => partFor(choice, group.id)?.valueKey))
      if (tuples.has(key)) return false
      tuples.add(key)
      return true
    })] as const
  }))
  const search = (remaining: SpecItem[], values: Selection, result: Selection): Selection | null => {
    if (!remaining.length) return result
    const rows = remaining.map((item) => ({
      item,
      groups: definitions.filter((group) => group.itemIds.includes(item.id)),
      choices: (candidates.get(item.id) || []).filter((choice) => definitions
        .filter((group) => group.itemIds.includes(item.id))
        .every((group) => !values[group.id] || partFor(choice, group.id)?.valueKey === values[group.id])),
    })).sort((a, b) => a.choices.length - b.choices.length)
    const row = rows[0]
    if (!row?.choices.length) return null
    for (const choice of row.choices) {
      const nextValues = { ...values }
      for (const group of row.groups) nextValues[group.id] = partFor(choice, group.id)!.valueKey
      const next = search(remaining.filter((item) => item.id !== row.item.id), nextValues, { ...result, [row.item.id]: choice.id })
      if (next) return next
    }
    return null
  }
  return search(related, constraints, { ...current })
}

export const findSharedSpecs = (items: SpecItem[]): SharedSpec[] => {
  const typeIds = new Set(items.flatMap((item) => item.choices.flatMap((choice) => choice.parts
    .filter((part) => validId(part.typeId) && validId(part.valueId)).map((part) => part.typeId!))))
  const candidates: SharedSpec[] = []
  for (const typeId of typeIds) {
    const complete = items.map((item) => ({
      item,
      parts: item.choices.map((choice) => choice.parts.filter((part) => part.typeId === typeId)),
    })).filter(({ item, parts }) => item.choices.length && parts.every((parts) => parts.length === 1 && validId(parts[0]?.valueId)))
    if (complete.length < 2) continue
    const first = complete[0]!.parts.flat()
    const firstPart = first[0]!
    const firstValues = new Set(first.map((part) => part.valueId!))
    // Sharing must not hide an option that only one service provides. Compare
    // the complete value sets; unequal sets keep this dimension per service.
    if (!complete.every(({ parts }) => {
      const values = new Set(parts.flat().map((part) => part.valueId!))
      return values.size === firstValues.size && [...values].every((value) => firstValues.has(value))
    })) continue
    const seen = new Set<string>()
    const options = first.filter((part) => {
      if (seen.has(part.valueId!)) return false
      seen.add(part.valueId!)
      return true
    }).map((part) => ({ id: part.valueKey, label: part.valueLabel }))
    if (options.length) candidates.push({ id: firstPart.typeKey, label: firstPart.typeLabel, itemIds: complete.map(({ item }) => item.id), options })
  }
  // An impossible component falls back to per-service fields. An unrelated
  // compatible component may still share its choices.
  const pending = candidates.slice()
  const result: SharedSpec[] = []
  while (pending.length) {
    const component = [pending.shift()!]
    const itemIds = new Set(component[0]!.itemIds)
    let expanded = true
    while (expanded) {
      expanded = false
      for (let index = pending.length - 1; index >= 0; index -= 1) {
        const group = pending[index]!
        if (!group.itemIds.some((id) => itemIds.has(id))) continue
        component.push(group)
        group.itemIds.forEach((id) => itemIds.add(id))
        pending.splice(index, 1)
        expanded = true
      }
    }
    if (solve(items, component, {}, {}, false)) result.push(...component)
  }
  return result
}

export const resolveSharedSpecs = (items: SpecItem[], definitions: SharedSpec[], current: Selection, patch: Selection = {}, preserveLocal = true): Selection | null => {
  if (Object.entries(patch).some(([key, value]) => !definitions.some((group) => group.id === key && group.options.some((option) => option.id === value)))) return null
  const constraints: Selection = {}
  if (preserveLocal) {
    for (const group of definitions) {
      const values = group.itemIds.map((id) => {
        const item = items.find((item) => item.id === id)
        return partFor(item?.choices.find((choice) => choice.id === current[id]), group.id)?.valueKey
      })
      if (values[0] && values.every((value) => value === values[0])) constraints[group.id] = values[0]
    }
  }
  return solve(items, definitions, current, { ...constraints, ...patch }, preserveLocal)
}

export const getSharedSpecGroups = (items: SpecItem[], definitions: SharedSpec[], current: Selection): SharedSpecGroup[] => definitions.map((group) => {
  const values = group.itemIds.map((id) => {
    const item = items.find((item) => item.id === id)
    return partFor(item?.choices.find((choice) => choice.id === current[id]), group.id)?.valueKey
  })
  return {
    ...group,
    selectedId: values[0] && values.every((value) => value === values[0]) ? values[0] : '',
    options: group.options.map((option) => ({ ...option, disabled: !resolveSharedSpecs(items, definitions, current, { [group.id]: option.id }) })),
  }
})
