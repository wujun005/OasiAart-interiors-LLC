export type PackageServiceSource = {
  skuId?: unknown
  spuId?: unknown
  spuNameI18n?: Record<string, string> | null
  specI18n?: Array<{
    specTypeNameI18n?: Record<string, string> | null
    specValueNameI18n?: Record<string, string> | null
  }> | null
  redeemTimes?: unknown
  occupiedTimes?: unknown
  remainingTimes?: unknown
  totalTimes?: unknown
  completedTimes?: unknown
  inProgressTimes?: unknown
}

export type PackageServiceLine = {
  key: string
  name: string
  spec: string
  total: number | null
  completed: number | null
  inProgress: number | null
  remaining: number | null
}

export type OrderListPage<T> = {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

const finite = (value: unknown): number | null => {
  if (value == null || value === "") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const readPage = (
  payload: unknown,
  depth = 0,
): { list: unknown[]; total: number; pageNum: number; pageSize: number } | null => {
  if (depth > 3 || payload == null) return null
  if (Array.isArray(payload)) {
    return {
      list: payload,
      total: payload.length,
      pageNum: 1,
      pageSize: payload.length || 10,
    }
  }
  if (typeof payload !== "object") return null
  const record = payload as Record<string, unknown>
  const list = (["list", "records", "rows", "content", "items"] as const)
    .map((key) => record[key])
    .find(Array.isArray) as unknown[] | undefined
  if (list) {
    const pageNum = finite(record.pageNum)
    const pageSize = finite(record.pageSize)
    return {
      list,
      total: finite(record.total) ?? list.length,
      pageNum: pageNum != null && pageNum > 0 ? pageNum : 1,
      pageSize: pageSize != null && pageSize > 0 ? pageSize : list.length || 10,
    }
  }
  if ("data" in record) return readPage(record.data, depth + 1)
  return null
}

export function parseOrderListPage<T>(payload: unknown): OrderListPage<T> {
  const page = readPage(payload)
  return {
    list: (page?.list ?? []) as T[],
    total: page?.total ?? 0,
    pageNum: page?.pageNum ?? 1,
    pageSize: page?.pageSize ?? 10,
  }
}

export function packageServiceLines(
  items: PackageServiceSource[] | null | undefined,
  nameOf: (i18n?: Record<string, string> | null) => string,
): PackageServiceLine[] {
  if (!Array.isArray(items)) return []
  return items.flatMap((item, index) => {
    const name = nameOf(item?.spuNameI18n).trim()
    const spec = (item?.specI18n || [])
      .map((row) =>
        [nameOf(row?.specTypeNameI18n), nameOf(row?.specValueNameI18n)]
          .filter(Boolean)
          .join(": "),
      )
      .filter(Boolean)
      .join(" / ")
    const total = finite(item?.totalTimes) ?? finite(item?.redeemTimes)
    const occupied = finite(item?.occupiedTimes)
    const remaining =
      finite(item?.remainingTimes) ??
      (total != null && occupied != null ? Math.max(0, total - occupied) : null)
    if (!name && total == null && remaining == null) return []
    return [
      {
        key: `${item?.spuId ?? item?.skuId ?? index}:${index}`,
        name,
        spec,
        total,
        completed: finite(item?.completedTimes),
        inProgress: finite(item?.inProgressTimes),
        remaining,
      },
    ]
  })
}

export type OrderListKind = "all" | "booking" | "package"

export function orderListKind(value: unknown): OrderListKind {
  const kind = Array.isArray(value) ? value[0] : value
  return kind === "package" || kind === "booking" ? kind : "all"
}

export function orderTypeForListKind(kind: OrderListKind): 1 | 2 | undefined {
  if (kind === "package") return 2
  if (kind === "booking") return 1
  return undefined
}

export function isPackageOrderRecord(
  item: { packageOrder?: unknown; orderType?: unknown; packageId?: unknown } | null | undefined,
) {
  if (!item) return false
  const packageId = item.packageId == null ? "" : String(item.packageId).trim()
  return item.packageOrder === true || Number(item.orderType) === 2 || packageId !== ""
}

export function matchesOrderListKind(
  kind: OrderListKind,
  item: { packageOrder?: unknown; orderType?: unknown; packageId?: unknown } | null | undefined,
) {
  if (kind === "all") return true
  const packageOrder = isPackageOrderRecord(item)
  return kind === "package" ? packageOrder : !packageOrder
}

export function narrowOrderList<T extends { packageOrder?: unknown; orderType?: unknown; packageId?: unknown }>(
  kind: OrderListKind,
  records: T[],
  total: number,
) {
  if (kind === "all") return { records, total }
  const narrowed = records.filter((item) => matchesOrderListKind(kind, item))
  return {
    records: narrowed,
    total: narrowed.length === records.length ? total : narrowed.length,
  }
}

export function packageTimesText(
  line: Pick<PackageServiceLine, "total" | "completed" | "inProgress" | "remaining">,
  label: (key: "total" | "completed" | "inProgress" | "remaining", count: number) => string,
) {
  const parts: string[] = []
  if (line.total != null) parts.push(label("total", line.total))
  if (line.completed != null) parts.push(label("completed", line.completed))
  if (line.inProgress != null) parts.push(label("inProgress", line.inProgress))
  if (line.remaining != null) parts.push(label("remaining", line.remaining))
  return parts.join(" · ")
}
