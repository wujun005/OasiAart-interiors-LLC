import { detail, page } from '@/modules/admin/api/order'
import {
  extractOrderRows,
  extractUsageEvents,
  parsePaidOrder,
  parseUsageTime,
  type PaidOrderSnapshot,
  type UsageEvent,
} from '@/utils/usage-analytics-core'
import http from '@/modules/admin/utils/request'

const ORDER_PAGE_SIZE = 100
const ORDER_PAGE_LIMIT = 20
const DETAIL_LIMIT = 200
const DETAIL_CONCURRENCY = 5

export async function loadUsageEvents(startTime: string, endTime: string): Promise<UsageEvent[]> {
  const payload = await http.post('/api/analytics/funnel', { startTime, endTime })
  return extractUsageEvents(payload)
}

function orderIdOf(row: unknown) {
  const record = row && typeof row === 'object' ? row as Record<string, any> : {}
  const nested = record.orderHeader && typeof record.orderHeader === 'object' ? record.orderHeader : {}
  const id = Number(record.orderId ?? record.id ?? nested.orderId)
  return Number.isFinite(id) && id > 0 ? id : 0
}

function detailRecord(payload: unknown) {
  if (!payload || typeof payload !== 'object') return {}
  const record = payload as Record<string, any>
  if (record.order && typeof record.order === 'object') return { ...record, ...record.order }
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) return record.data as Record<string, any>
  return record
}

function withDetailFields(row: unknown, source: Record<string, any>, startMs: number, endMs: number) {
  const next: Record<string, any> = { ...(row as Record<string, any>) }
  if (source.paymentMethodDetail) next.paymentMethodDetail = source.paymentMethodDetail
  if (source.cardLast4) next.cardLast4 = source.cardLast4
  if (source.paymentGateway) next.paymentGateway = source.paymentGateway
  if (source.userName) next.userName = source.userName
  if (source.userEmail) next.userEmail = source.userEmail
  if (source.amountWithTax != null && source.amountWithTax !== '') next.amountWithTax = source.amountWithTax
  const paidMs = parseUsageTime(source.paidTime)
  if (paidMs != null && paidMs >= startMs && paidMs < endMs) next.paidTime = source.paidTime
  return next
}

async function mapPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0
  const run = async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

export async function loadPaidOrders(startMs: number, endMs: number) {
  const matched: Array<{ row: unknown; paidAt: string }> = []
  let truncated = false
  for (let pageNum = 1; pageNum <= ORDER_PAGE_LIMIT; pageNum += 1) {
    const payload = await page({
      pageNum,
      pageSize: ORDER_PAGE_SIZE,
      paymentStatuses: [1, 4, 5, 6],
    })
    const rows = extractOrderRows(payload)
    for (const row of rows) {
      const paid = parsePaidOrder(row, { startMs, endMs })
      if (paid) matched.push({ row, paidAt: paid.paidAt })
    }
    if (rows.length < ORDER_PAGE_SIZE) break
    if (pageNum === ORDER_PAGE_LIMIT) truncated = true
  }
  matched.sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  const selected = matched.slice(0, DETAIL_LIMIT)
  if (matched.length > DETAIL_LIMIT) truncated = true
  const enriched = await mapPool(selected, DETAIL_CONCURRENCY, async ({ row }) => {
    const orderId = orderIdOf(row)
    if (!orderId) return row
    try {
      const payload = await detail(orderId)
      return withDetailFields(row, detailRecord(payload), startMs, endMs)
    } catch {
      return row
    }
  })
  const orders = enriched
    .map((row) => parsePaidOrder(row, { startMs, endMs }))
    .filter((order): order is PaidOrderSnapshot => Boolean(order))
  return { orders, truncated }
}
