export const ALL_AVAILABILITY_SCOPE = '__all__' as const

export type AvailabilityScopeValue = number | typeof ALL_AVAILABILITY_SCOPE

const concreteIds = (values: unknown): number[] => {
  if (!Array.isArray(values)) return []
  return [...new Set(values
    .filter((value) => value !== ALL_AVAILABILITY_SCOPE)
    .map(Number)
    .filter((value) => Number.isSafeInteger(value) && value > 0))]
}

export const availabilityScopeSelection = (values: unknown): AvailabilityScopeValue[] => {
  const ids = concreteIds(values)
  return ids.length ? ids : [ALL_AVAILABILITY_SCOPE]
}

export const updateAvailabilityScopeSelection = (
  current: AvailabilityScopeValue[],
  incoming: unknown,
): AvailabilityScopeValue[] => {
  if (!Array.isArray(incoming) || !incoming.length) return [ALL_AVAILABILITY_SCOPE]

  const hadAll = current.includes(ALL_AVAILABILITY_SCOPE)
  const hasAll = incoming.includes(ALL_AVAILABILITY_SCOPE)
  const ids = concreteIds(incoming)

  if (hasAll && !hadAll) return [ALL_AVAILABILITY_SCOPE]
  if (hasAll && hadAll && ids.length) return ids
  return hasAll || !ids.length ? [ALL_AVAILABILITY_SCOPE] : ids
}

export const availabilityScopePayload = (values: unknown): number[] => {
  if (Array.isArray(values) && values.includes(ALL_AVAILABILITY_SCOPE)) return []
  return concreteIds(values)
}
