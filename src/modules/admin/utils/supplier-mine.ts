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
