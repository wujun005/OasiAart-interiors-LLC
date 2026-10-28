import { getClientAuthStorageValue } from '@/utils/auth-state'
import {
  createUsageTracker,
  paymentChannelFromStripe,
  type UsageEvent,
  type UsagePlatform,
  type UsageStorage,
} from '@/utils/usage-analytics-core'

export {
  paymentChannelFromStripe,
  usageStepForLocation,
} from '@/utils/usage-analytics-core'

type UsageRouteQuery = Record<string, unknown>

let tracker: ReturnType<typeof createUsageTracker> | null = null

function memoryStorage(): UsageStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

function safeStorage(storage: Storage | undefined): UsageStorage {
  const memory = memoryStorage()
  if (!storage) return memory
  return {
    getItem(key) {
      try {
        const stored = storage.getItem(key)
        if (stored) return stored
      } catch {
        // Storage can throw in private mode. Fall back to this visit's memory.
      }
      return memory.getItem(key)
    },
    setItem(key, value) {
      memory.setItem(key, value)
      try {
        storage.setItem(key, value)
      } catch {
        // Private browsing can reject storage writes. The in-memory copy still
        // keeps this visit together.
      }
    },
  }
}

function currentUser() {
  try {
    return {
      userId: getClientAuthStorageValue('userId'),
      userName: getClientAuthStorageValue('username') || getClientAuthStorageValue('account'),
    }
  } catch {
    return { userId: '', userName: '' }
  }
}

function postUsageEvents(events: UsageEvent[]) {
  const base = String(import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api').replace(/\/$/, '')
  const url = `${base}/client/analytics/events`
  const body = JSON.stringify({ events })
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(url, blob)) return
    }
  } catch {
    // Fall through to fetch when Beacon is unavailable.
  }
  if (typeof fetch !== 'function') return
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined)
}

export function startUsageAnalytics(platform: Extract<UsagePlatform, 'web' | 'h5'>) {
  if (tracker || typeof window === 'undefined') return
  tracker = createUsageTracker({
    platform,
    local: safeStorage(window.localStorage),
    session: safeStorage(window.sessionStorage),
    user: currentUser,
    send: postUsageEvents,
  })
}

export function trackUsageRoute(path: string, query?: UsageRouteQuery) {
  tracker?.trackRoute(path, query)
}

export function trackUsagePaymentView(orderNo = '') {
  tracker?.track('payment_view', { orderNo })
}

export function trackUsagePaymentSuccess(orderNo = '', intent?: unknown) {
  tracker?.track('payment_success', {
    orderNo,
    paymentChannel: paymentChannelFromStripe(intent),
  })
}
