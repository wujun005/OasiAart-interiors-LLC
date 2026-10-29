export const USAGE_STEPS = [
  'home_view',
  'service_detail_view',
  'payment_view',
  'payment_success',
] as const

export type UsageStep = (typeof USAGE_STEPS)[number]
export type UsagePlatform = 'web' | 'h5' | 'ios' | 'android'
export type UsagePlatformFilter = 'all' | 'web' | 'h5' | 'app' | UsagePlatform

export type UsageEvent = {
  eventId: string
  name: UsageStep
  occurredAt: string
  anonymousId: string
  sessionId: string
  userId: string
  userName: string
  platform: UsagePlatform
  paymentChannel: string
  orderNo: string
  targetId: string
}

export type UsageStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export type PaidOrderSnapshot = {
  orderNo: string
  userId: string
  userName: string
  phone: string
  email: string
  platform: UsagePlatform | ''
  paymentChannel: string
  paidAt: string
  amountText: string
}

export type UsageFunnelStep = {
  name: UsageStep
  visitors: number
  rateFromStart: number
  rateFromPrevious: number
}

export type UsageJourney = {
  key: string
  platform: UsagePlatform
  userId: string
  userName: string
  anonymousId: string
  reached: UsageStep
  steps: UsageStep[]
  paymentChannel: string
  orderNo: string
  occurredAt: string
}

export type UsageChannelRow = {
  channel: string
  count: number
  share: number
}

export type UsageReport = {
  steps: UsageFunnelStep[]
  byPlatform: Array<{ platform: UsagePlatform; steps: number[] }>
  channels: UsageChannelRow[]
  journeys: UsageJourney[]
}

const STEP_SET = new Set<string>(USAGE_STEPS)
const PLATFORM_SET = new Set<string>(['web', 'h5', 'ios', 'android'])
const ANONYMOUS_KEY = 'hourx.analytics.anonymousId'
const SESSION_KEY = 'hourx.analytics.sessionId'

export function usageRange(days: number, now = Date.now()) {
  const end = new Date(now)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  return { startMs: start.getTime(), endMs: end.getTime() }
}

export function formatUsageDay(ms: number) {
  const date = new Date(ms)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function parseUsageDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function usageRangeFromDates(startDay: string, endDay: string) {
  const start = parseUsageDay(startDay)
  const end = parseUsageDay(endDay)
  if (!start || !end || end.getTime() < start.getTime()) return null
  const endExclusive = new Date(end)
  endExclusive.setDate(endExclusive.getDate() + 1)
  return { startMs: start.getTime(), endMs: endExclusive.getTime() }
}

export function normalizeUsageChannel(value: unknown): string {
  const text = String(value ?? '').trim().toLowerCase()
  if (!text || /^(pm_|pi_|seti_)/.test(text)) return ''
  if (text.includes('apple')) return 'apple_pay'
  if (text.includes('google')) return 'google_pay'
  if (text.includes('paypal')) return 'paypal'
  if (text === 'link' || /(^|[\s_-])link($|[\s_-])/.test(text)) return 'link'
  if (
    text.includes('visa')
    || text.includes('master')
    || text.includes('amex')
    || text.includes('union')
    || text.includes('card')
    || text.includes('银行卡')
    || text.includes('信用卡')
  ) return 'card'
  if (text === 'stripe') return 'stripe'
  return 'other'
}

export function paymentChannelFromStripe(intent: unknown): string {
  if (!intent || typeof intent !== 'object') return ''
  const record = intent as Record<string, any>
  const charge = Array.isArray(record.charges?.data) ? record.charges.data[0] : undefined
  const details = charge?.payment_method_details
  const candidates = [
    details?.card?.wallet?.type,
    record.payment_method_details?.card?.wallet?.type,
    record.payment_method?.card?.wallet?.type,
    details?.type,
    record.payment_method_details?.type,
    record.payment_method?.type,
    Array.isArray(record.payment_method_types) ? record.payment_method_types[0] : '',
  ]
  for (const candidate of candidates) {
    const channel = normalizeUsageChannel(candidate)
    if (channel) return channel
  }
  return ''
}

function queryText(query: Record<string, unknown> | undefined, key: string) {
  const value = query?.[key]
  const raw = Array.isArray(value) ? value[0] : value
  return String(raw ?? '').trim()
}

export function usageStepForLocation(path: string, query?: Record<string, unknown>) {
  const clean = (path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/')
  if (clean === '/' || clean === '/index' || clean === '/home') {
    return { name: 'home_view' as const, targetId: '', orderNo: '' }
  }
  const service = clean.match(/^\/services\/detail\/([^/]+)$/)
  if (service?.[1]) {
    return { name: 'service_detail_view' as const, targetId: decodeURIComponent(service[1]), orderNo: '' }
  }
  const pack = clean.match(/^\/packages\/([^/]+)$/)
  if (pack?.[1]) {
    return { name: 'service_detail_view' as const, targetId: `package:${decodeURIComponent(pack[1])}`, orderNo: '' }
  }
  if (clean === '/orders/success') {
    return {
      name: 'payment_success' as const,
      targetId: '',
      orderNo: queryText(query, 'orderNo') || queryText(query, 'orderId'),
    }
  }
  return null
}

export function createUsageTracker(options: {
  platform: UsagePlatform
  local: UsageStorage
  session: UsageStorage
  now?: () => number
  createId?: () => string
  user?: () => { userId: string; userName: string }
  send: (events: UsageEvent[]) => void
}) {
  const seen = new Set<string>()
  let serial = 0
  const now = () => options.now?.() ?? Date.now()
  const createId = () => options.createId?.() ?? `evt-${now().toString(36)}-${serial}`

  const remember = (storage: UsageStorage, key: string) => {
    const existing = storage.getItem(key)?.trim() || ''
    if (existing) return existing
    const created = createId()
    serial += 1
    storage.setItem(key, created)
    return created
  }

  const track = (
    name: UsageStep,
    extra: { targetId?: string; orderNo?: string; paymentChannel?: string } = {},
  ) => {
    const targetId = String(extra.targetId || '').trim().slice(0, 64)
    const orderNo = String(extra.orderNo || '').trim().slice(0, 64)
    const dedupeKey = `${name}|${targetId}|${orderNo}`
    if (seen.has(dedupeKey)) return
    seen.add(dedupeKey)
    const person = options.user?.() ?? { userId: '', userName: '' }
    const event: UsageEvent = {
      eventId: createId(),
      name,
      occurredAt: new Date(now()).toISOString(),
      anonymousId: remember(options.local, ANONYMOUS_KEY),
      sessionId: remember(options.session, SESSION_KEY),
      userId: String(person.userId || '').trim().slice(0, 64),
      userName: String(person.userName || '').trim().slice(0, 80),
      platform: options.platform,
      paymentChannel: normalizeUsageChannel(extra.paymentChannel),
      orderNo,
      targetId,
    }
    serial += 1
    try {
      options.send([event])
    } catch {
      seen.delete(dedupeKey)
    }
  }

  return {
    track,
    trackRoute(path: string, query?: Record<string, unknown>) {
      const step = usageStepForLocation(path, query)
      if (!step) return
      track(step.name, step)
    },
  }
}

export function sanitizeUsageEvent(value: unknown): UsageEvent | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const name = String(row.name || '')
  const platform = String(row.platform || '')
  if (!STEP_SET.has(name) || !PLATFORM_SET.has(platform)) return null
  const occurredAt = String(row.occurredAt || '')
  if (!Number.isFinite(Date.parse(occurredAt))) return null
  const userId = String(row.userId || '').trim().slice(0, 64)
  const anonymousId = String(row.anonymousId || '').trim().slice(0, 80) || (userId ? `user:${userId}` : '')
  if (!anonymousId) return null
  return {
    eventId: String(row.eventId || '').slice(0, 80),
    name: name as UsageStep,
    occurredAt,
    anonymousId,
    sessionId: String(row.sessionId || '').slice(0, 80),
    userId,
    userName: String(row.userName || '').trim().slice(0, 80),
    platform: platform as UsagePlatform,
    paymentChannel: normalizeUsageChannel(row.paymentChannel),
    orderNo: String(row.orderNo || '').trim().slice(0, 64),
    targetId: String(row.targetId || '').trim().slice(0, 64),
  }
}

function listFromPayload(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, any>
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key]
  }
  const data = record.data
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  return []
}

export function extractUsageEvents(payload: unknown): UsageEvent[] {
  return listFromPayload(payload, ['events', 'list', 'records'])
    .map((row) => sanitizeUsageEvent(row))
    .filter((event): event is UsageEvent => event !== null)
}

export function extractOrderRows(payload: unknown): unknown[] {
  return listFromPayload(payload, ['list', 'records', 'rows'])
}

export function parseUsageTime(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(value) < 1e12 ? value * 1000 : value
  }
  const text = String(value ?? '').trim()
  if (!text) return null
  if (/^\d{10,13}$/.test(text)) {
    const numeric = Number(text)
    return Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric
  }
  const parsed = Date.parse(text.includes('T') ? text : text.replace(' ', 'T'))
  return Number.isFinite(parsed) ? parsed : null
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {}
}

function isPaidStatus(value: unknown) {
  if (value === 1 || value === 4 || value === 5 || value === 6) return true
  const text = String(value ?? '').trim().toLowerCase()
  if (!text) return false
  if (text.includes('unpaid') || text.includes('未支付') || text.includes('待支付') || text.includes('取消') || text === 'failed' || text === 'cancelled' || text === 'canceled') {
    return false
  }
  return ['1', '4', '5', '6', 'paid', 'refunding', 'refunded', 'refunded_fail', 'refund_failed'].includes(text)
    || text.includes('已支付')
    || text.includes('退款')
}

function usagePlatformFromOrder(value: unknown): UsagePlatform | '' {
  const text = String(value ?? '').trim().toLowerCase()
  if (!text) return ''
  if (text === 'ios' || text.includes('iphone') || text.includes('ipad')) return 'ios'
  if (text.includes('android')) return 'android'
  if (text === 'h5' || text === 'wap' || text.includes('mobile')) return 'h5'
  if (text === 'web' || text === 'pc' || text.includes('desktop') || text.includes('website')) return 'web'
  return ''
}

function amountText(source: Record<string, any>) {
  for (const key of ['payAmount', 'paidAmount', 'amountWithTax', 'totalAmount', 'payableAmount', 'amount', 'amountText', 'salePrice']) {
    const value = source[key]
    if (value == null || value === '') continue
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return `AED ${numeric.toFixed(2)}`
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

export function parsePaidOrder(
  item: unknown,
  range?: { startMs: number; endMs: number },
): PaidOrderSnapshot | null {
  const root = asRecord(item)
  const source = { ...root, ...asRecord(root.orderHeader), ...asRecord(root.order) }
  const status = source.paymentStatus ?? source.payStatus
  if (!isPaidStatus(status)) return null
  const paidRaw = source.paidTime ?? source.paymentTime ?? source.payTime ?? source.orderTime ?? source.createTime ?? ''
  const paidMs = parseUsageTime(paidRaw)
  if (paidMs == null) return null
  if (range && (paidMs < range.startMs || paidMs >= range.endMs)) return null
  const detail = String(source.paymentMethodDetail || '').trim()
  const method = String(
    source.paymentMethodName
    || source.paymentMethod
    || source.paymentGateway
    || source.paymentChannelName
    || source.paymentChannel
    || '',
  ).trim()
  const last4 = String(source.cardLast4 || '').trim()
  const fromDetail = normalizeUsageChannel(detail)
  const fromMethod = normalizeUsageChannel(method)
  const specific = (channel: string) => channel && channel !== 'stripe' && channel !== 'other'
  const paymentChannel = (specific(fromDetail) ? fromDetail : '')
    || (last4 ? 'card' : '')
    || (specific(fromMethod) ? fromMethod : '')
    || fromDetail
    || fromMethod
    || 'stripe'
  const firstName = String(source.firstName || '').trim()
  const lastName = String(source.lastName || '').trim()
  const combinedName = [firstName, lastName].filter(Boolean).join(' ')
  return {
    orderNo: String(source.orderNo || '').trim(),
    userId: String(source.userId || source.customerId || '').trim(),
    userName: String(source.customerName || source.userName || source.contactName || combinedName || '').trim(),
    phone: String(source.userPhone || source.contactPhone || source.phone || '').trim(),
    email: String(source.customerEmail || source.userEmail || source.contactEmail || source.email || '').trim(),
    platform: usagePlatformFromOrder(
      source.clientPlatform ?? source.clientType ?? source.platform ?? source.orderSource ?? source.terminal ?? source.source,
    ),
    paymentChannel,
    paidAt: typeof paidRaw === 'string' && paidRaw.trim() ? paidRaw.trim() : new Date(paidMs).toISOString(),
    amountText: amountText(source),
  }
}

export function platformMatches(platform: UsagePlatform, filter: UsagePlatformFilter) {
  if (filter === 'all') return true
  if (filter === 'app') return platform === 'ios' || platform === 'android'
  return platform === filter
}

export function orderMatchesPlatform(order: PaidOrderSnapshot, filter: UsagePlatformFilter) {
  if (filter === 'all') return true
  if (!order.platform) return false
  return platformMatches(order.platform, filter)
}

function platformsFor(filter: UsagePlatformFilter): UsagePlatform[] {
  if (filter === 'web' || filter === 'h5' || filter === 'ios' || filter === 'android') return [filter]
  if (filter === 'app') return ['ios', 'android']
  return ['web', 'h5', 'ios', 'android']
}

export function summarizePaymentChannels(channels: string[]): UsageChannelRow[] {
  const counts = new Map<string, number>()
  for (const channel of channels) {
    const key = channel || 'stripe'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
  return [...counts.entries()]
    .map(([channel, count]) => ({
      channel,
      count,
      share: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count || a.channel.localeCompare(b.channel))
}

export function buildUsageReport(
  events: UsageEvent[],
  options: { startMs: number; endMs: number; platform: UsagePlatformFilter },
): UsageReport {
  const groups = new Map<string, UsageEvent[]>()
  for (const event of events) {
    const time = Date.parse(event.occurredAt)
    if (!Number.isFinite(time) || time < options.startMs || time >= options.endMs) continue
    if (!platformMatches(event.platform, options.platform)) continue
    const key = event.anonymousId || (event.userId ? `user:${event.userId}` : '')
    if (!key) continue
    const list = groups.get(key) || []
    list.push(event)
    groups.set(key, list)
  }

  const journeys: UsageJourney[] = []
  for (const [key, list] of groups) {
    list.sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
    const reached: UsageEvent[] = []
    let cursor = Number.NEGATIVE_INFINITY
    for (const step of USAGE_STEPS) {
      const next = list.find((event) => event.name === step && Date.parse(event.occurredAt) >= cursor)
      if (!next) break
      reached.push(next)
      cursor = Date.parse(next.occurredAt)
    }
    if (!reached.length || reached[0]?.name !== 'home_view') continue
    const last = reached[reached.length - 1]!
    const success = reached.find((event) => event.name === 'payment_success')
    const named = [...reached].reverse().find((event) => event.userId || event.userName)
    const orderNo = [...reached].reverse().find((event) => event.orderNo)?.orderNo || ''
    journeys.push({
      key,
      platform: reached[0]!.platform,
      userId: named?.userId || '',
      userName: named?.userName || '',
      anonymousId: reached[0]!.anonymousId,
      reached: last.name,
      steps: reached.map((event) => event.name),
      paymentChannel: success?.paymentChannel || '',
      orderNo,
      occurredAt: last.occurredAt,
    })
  }
  journeys.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))

  const startCount = journeys.length
  const steps = USAGE_STEPS.map((name, index) => {
    const visitors = journeys.filter((journey) => journey.steps.includes(name)).length
    const previous = index === 0
      ? visitors
      : journeys.filter((journey) => journey.steps.includes(USAGE_STEPS[index - 1]!)).length
    return {
      name,
      visitors,
      rateFromStart: startCount ? visitors / startCount : 0,
      rateFromPrevious: previous ? visitors / previous : 0,
    }
  })
  const byPlatform = platformsFor(options.platform).map((platform) => ({
    platform,
    steps: USAGE_STEPS.map((name) => journeys.filter((journey) => (
      journey.platform === platform && journey.steps.includes(name)
    )).length),
  }))
  const channels = summarizePaymentChannels(
    journeys
      .filter((journey) => journey.steps.includes('payment_success'))
      .map((journey) => journey.paymentChannel || 'stripe'),
  )
  return { steps, byPlatform, channels, journeys }
}
