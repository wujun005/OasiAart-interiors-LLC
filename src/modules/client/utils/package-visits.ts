const positiveInteger = (value: unknown) => {
  const count = Number(value)
  return Number.isInteger(count) && count > 0 ? count : 0
}

const namedVisitTotal = (source?: { packageName?: unknown; nameI18n?: Record<string, unknown> | null } | null) => {
  const names = [
    source?.packageName,
    ...Object.values(source?.nameI18n || {}),
  ].filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
  const totals = names.flatMap((name) => {
    if (/\beach\b/i.test(name) || name.includes('各')) return []
    const matches = [...name.matchAll(/(\d+)\s*(?:visits?|次上门|次)/gi)].map((match) => Number(match[1]))
    return matches.length === 1 ? [matches[0]] : []
  }).filter((count) => count > 0)
  return totals.length && totals.every((count) => count === totals[0]) ? totals[0] : 0
}

/**
 * Door visits follow the longest included service. A shorter service, such as
 * one AC clean during the first home cleaning, happens on an existing visit
 * and does not add another trip. The catalog list often omits those item
 * counts and sends their sum, so a package titled with one visit total uses
 * that total instead of the sum.
 */
export function packageVisitCount(source?: {
  redeemTimes?: unknown
  packageName?: unknown
  nameI18n?: Record<string, unknown> | null
  items?: Array<{ redeemTimes?: unknown } | null> | null
} | null) {
  const itemCounts = (Array.isArray(source?.items) ? source.items : [])
    .map((item) => positiveInteger(item?.redeemTimes))
    .filter((count) => count > 0)
  if (itemCounts.length) return Math.max(...itemCounts)
  const stored = positiveInteger(source?.redeemTimes)
  const named = namedVisitTotal(source)
  if (named > 0 && stored > named) return named
  return stored || named
}
