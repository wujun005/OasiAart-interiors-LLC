<template>
  <div class="usage-page">
    <header class="usage-heading">
      <div>
        <p>{{ t('admin.analytics.description') }}</p>
        <h1>{{ t('admin.analytics.title') }}</h1>
      </div>
      <div class="usage-filters">
        <div class="usage-ranges" role="group" :aria-label="t('admin.analytics.rangeLabel')">
          <button
            v-for="days in rangeOptions"
            :key="days"
            type="button"
            :class="{ 'is-active': rangeDays === days }"
            @click="changeRange(days)"
          >
            {{ t(`admin.analytics.range${days}`) }}
          </button>
        </div>
        <el-select v-model="clientFilter" class="usage-client" :aria-label="t('admin.analytics.client')">
          <el-option value="all" :label="t('admin.analytics.clientAll')" />
          <el-option value="web" :label="t('admin.analytics.platform.web')" />
          <el-option value="h5" :label="t('admin.analytics.platform.h5')" />
          <el-option value="app" :label="t('admin.analytics.clientApp')" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="load">{{ t('admin.analytics.refresh') }}</el-button>
      </div>
    </header>

    <p v-if="eventsUnavailable" class="usage-note">{{ t('admin.analytics.eventsMissing') }}</p>
    <p v-else-if="!loading && !events.length" class="usage-note">{{ t('admin.analytics.eventsEmpty') }}</p>
    <p v-if="ordersFailed" class="usage-note usage-note--warn">{{ t('admin.analytics.ordersFailed') }}</p>
    <p v-else-if="ordersTruncated" class="usage-note">{{ t('admin.analytics.truncated') }}</p>

    <section class="usage-panel" :aria-busy="loading">
      <div class="usage-panel__head">
        <h2>{{ t('admin.analytics.funnelTitle') }}</h2>
        <p>{{ t('admin.analytics.funnelHint') }}</p>
      </div>
      <div class="funnel">
        <article v-for="(step, index) in report.steps" :key="step.name" class="funnel-step">
          <span>{{ t(`admin.analytics.step.${step.name}`) }}</span>
          <strong>{{ loading ? '—' : step.visitors }}</strong>
          <div class="funnel-step__bar" aria-hidden="true">
            <i :style="{ width: barWidth(step.visitors) }" />
          </div>
          <p v-if="index > 0">{{ t('admin.analytics.fromPrevious', { rate: formatRate(step.rateFromPrevious) }) }}</p>
          <p v-if="index > 0">{{ t('admin.analytics.fromStart', { rate: formatRate(step.rateFromStart) }) }}</p>
          <p v-if="step.name === 'payment_success' && !loading">{{ t('admin.analytics.paidOrders', { count: visibleOrders.length }) }}</p>
        </article>
      </div>
    </section>

    <div class="usage-split">
      <section class="usage-panel">
        <div class="usage-panel__head">
          <h2>{{ t('admin.analytics.platformTitle') }}</h2>
          <p>{{ t('admin.analytics.platformHint') }}</p>
        </div>
        <div class="usage-table-wrap">
          <table class="usage-table">
            <thead>
              <tr>
                <th>{{ t('admin.analytics.client') }}</th>
                <th v-for="step in report.steps" :key="step.name">{{ t(`admin.analytics.step.${step.name}`) }}</th>
                <th>{{ t('admin.analytics.paidRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.byPlatform" :key="row.platform">
                <td>{{ platformLabel(row.platform) }}</td>
                <td v-for="(count, index) in row.steps" :key="index">{{ loading ? '—' : count }}</td>
                <td>{{ loading ? '—' : formatRate(rate(row.steps[3] || 0, row.steps[0] || 0)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="usage-panel">
        <div class="usage-panel__head">
          <h2>{{ t('admin.analytics.channelTitle') }}</h2>
          <p>{{ t('admin.analytics.channelHint') }}</p>
        </div>
        <p v-if="!channelRows.length" class="usage-empty">{{ t('admin.analytics.channelEmpty') }}</p>
        <ul v-else class="channels">
          <li v-for="row in channelRows" :key="row.channel">
            <div class="channels__meta">
              <strong>{{ channelLabel(row.channel) }}</strong>
              <span>{{ row.count }} · {{ formatRate(row.share) }}</span>
            </div>
            <div class="channels__bar" aria-hidden="true"><i :style="{ width: formatRate(row.share) }" /></div>
          </li>
        </ul>
      </section>
    </div>

    <section class="usage-panel">
      <div class="usage-panel__head">
        <h2>{{ t('admin.analytics.paidTitle') }}</h2>
        <p>{{ t('admin.analytics.paidHint', { count: visibleOrders.length }) }}</p>
      </div>
      <p v-if="!visibleOrders.length" class="usage-empty">{{ t('admin.analytics.paidEmpty') }}</p>
      <p v-else-if="visibleOrders.length > 100" class="usage-empty">{{ t('admin.analytics.paidLimited') }}</p>
      <div v-if="visibleOrders.length" class="usage-table-wrap">
        <table class="usage-table">
          <thead>
            <tr>
              <th>{{ t('admin.analytics.client') }}</th>
              <th>{{ t('admin.analytics.user') }}</th>
              <th>{{ t('admin.analytics.phone') }}</th>
              <th>{{ t('admin.analytics.email') }}</th>
              <th>{{ t('admin.analytics.channelTitle') }}</th>
              <th>{{ t('admin.analytics.orderNo') }}</th>
              <th>{{ t('admin.analytics.amount') }}</th>
              <th>{{ t('admin.analytics.paidAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in visibleOrders.slice(0, 100)" :key="`${order.orderNo}-${order.paidAt}-${order.userId}`">
              <td>{{ order.platform ? platformLabel(order.platform) : t('admin.analytics.unknownClient') }}</td>
              <td>{{ order.userName || order.userId || t('admin.analytics.guest') }}</td>
              <td>{{ order.phone || '—' }}</td>
              <td>{{ order.email || '—' }}</td>
              <td>{{ channelLabel(order.paymentChannel) }}</td>
              <td>{{ order.orderNo || '—' }}</td>
              <td>{{ order.amountText || '—' }}</td>
              <td>{{ formatTime(order.paidAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="report.journeys.length" class="usage-panel">
      <div class="usage-panel__head">
        <h2>{{ t('admin.analytics.journeyTitle') }}</h2>
        <p>{{ t('admin.analytics.journeyHint') }}</p>
      </div>
      <div class="usage-table-wrap">
        <table class="usage-table">
          <thead>
            <tr>
              <th>{{ t('admin.analytics.client') }}</th>
              <th>{{ t('admin.analytics.user') }}</th>
              <th>{{ t('admin.analytics.reached') }}</th>
              <th>{{ t('admin.analytics.channelTitle') }}</th>
              <th>{{ t('admin.analytics.orderNo') }}</th>
              <th>{{ t('admin.analytics.paidAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="journey in report.journeys.slice(0, 80)" :key="journey.key">
              <td>{{ platformLabel(journey.platform) }}</td>
              <td>{{ journey.userName || journey.userId || t('admin.analytics.guest') }}</td>
              <td>{{ t(`admin.analytics.step.${journey.reached}`) }}</td>
              <td>{{ journey.paymentChannel ? channelLabel(journey.paymentChannel) : '—' }}</td>
              <td>{{ journey.orderNo || '—' }}</td>
              <td>{{ formatTime(journey.occurredAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadPaidOrders, loadUsageEvents } from '@/modules/admin/api/analytics'
import {
  buildUsageReport,
  orderMatchesPlatform,
  summarizePaymentChannels,
  usageRange,
  type PaidOrderSnapshot,
  type UsageEvent,
  type UsagePlatform,
  type UsagePlatformFilter,
} from '@/utils/usage-analytics-core'

const { t, te, locale } = useI18n({ useScope: 'global' })
const rangeOptions = [7, 30, 90] as const
const rangeDays = ref<(typeof rangeOptions)[number]>(7)
const clientFilter = ref<UsagePlatformFilter>('all')
const loading = ref(true)
const eventsUnavailable = ref(false)
const ordersFailed = ref(false)
const ordersTruncated = ref(false)
const events = ref<UsageEvent[]>([])
const orders = ref<PaidOrderSnapshot[]>([])
const activeRange = ref(usageRange(7))

const report = computed(() => buildUsageReport(events.value, {
  ...activeRange.value,
  platform: clientFilter.value,
}))
const visibleOrders = computed(() => orders.value
  .filter((order) => orderMatchesPlatform(order, clientFilter.value))
  .sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt))))
const channelRows = computed(() => (
  visibleOrders.value.length
    ? summarizePaymentChannels(visibleOrders.value.map((order) => order.paymentChannel || 'stripe'))
    : report.value.channels
))

const formatRate = (rate: number) => {
  if (!Number.isFinite(rate) || rate <= 0) return '0%'
  const percent = Math.round(rate * 1000) / 10
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`
}

const rate = (part: number, total: number) => (total ? part / total : 0)

const barWidth = (visitors: number) => {
  const start = report.value.steps[0]?.visitors || 0
  if (!start || !visitors) return '0%'
  return formatRate(visitors / start)
}

const platformLabel = (platform: UsagePlatform) => t(`admin.analytics.platform.${platform}`)

const channelLabel = (channel: string) => {
  if (!channel) return t('admin.analytics.unknownChannel')
  const key = `admin.analytics.channel.${channel}`
  return te(key) ? t(key) : t('admin.analytics.channel.other')
}

const formatTime = (value: string) => {
  const text = String(value || '').trim()
  if (!text) return '—'
  const parsed = Date.parse(text.includes('T') ? text : text.replace(' ', 'T'))
  if (!Number.isFinite(parsed)) return text
  return new Intl.DateTimeFormat(locale.value.startsWith('zh') ? 'zh-CN' : 'en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

const load = async () => {
  const range = usageRange(rangeDays.value)
  activeRange.value = range
  loading.value = true
  eventsUnavailable.value = false
  ordersFailed.value = false
  const [eventResult, orderResult] = await Promise.allSettled([
    loadUsageEvents(new Date(range.startMs).toISOString(), new Date(range.endMs).toISOString()),
    loadPaidOrders(range.startMs, range.endMs),
  ])
  events.value = eventResult.status === 'fulfilled' ? eventResult.value : []
  eventsUnavailable.value = eventResult.status === 'rejected'
  if (orderResult.status === 'fulfilled') {
    orders.value = orderResult.value.orders
    ordersTruncated.value = orderResult.value.truncated
  } else {
    orders.value = []
    ordersTruncated.value = false
    ordersFailed.value = true
  }
  loading.value = false
}

const changeRange = (days: (typeof rangeOptions)[number]) => {
  if (rangeDays.value === days) return
  rangeDays.value = days
  void load()
}

onMounted(load)
</script>

<style scoped>
.usage-page {
  display: grid;
  gap: 16px;
  color: #1b2839;
}

.usage-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.usage-heading p,
.usage-panel__head p {
  margin: 0;
  color: #7a7166;
  font-size: 13px;
  line-height: 1.6;
}

.usage-heading h1,
.usage-panel__head h2 {
  margin: 4px 0 0;
  color: #05152b;
  font-weight: 650;
}

.usage-heading h1 { font-size: 28px; }
.usage-panel__head h2 { font-size: 18px; }

.usage-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.usage-ranges {
  display: flex;
  padding: 3px;
  border: 1px solid rgba(23, 33, 48, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
}

.usage-ranges button {
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #5d564e;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.usage-ranges button.is-active {
  background: #05152b;
  color: #fff;
}

.usage-client { width: 148px; }

.usage-note,
.usage-empty {
  margin: 0;
  color: #7a7166;
  font-size: 13px;
  line-height: 1.6;
}

.usage-note--warn { color: #8d4d3a; }

.usage-panel {
  padding: 18px 18px 16px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.92);
  box-shadow: 0 10px 24px rgba(5, 21, 43, 0.04);
}

.usage-panel__head { margin-bottom: 14px; }

.funnel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.funnel-step {
  min-width: 0;
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: #f6f1e8;
}

.funnel-step span {
  display: block;
  color: #7a7166;
  font-size: 12px;
}

.funnel-step strong {
  display: block;
  margin-top: 8px;
  color: #05152b;
  font-family: var(--hx-font-numeric, inherit);
  font-size: 32px;
  font-weight: 650;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.funnel-step p {
  margin: 6px 0 0;
  color: #5d564e;
  font-size: 12px;
}

.funnel-step__bar,
.channels__bar {
  overflow: hidden;
  height: 6px;
  margin-top: 12px;
  border-radius: 99px;
  background: rgba(5, 21, 43, 0.08);
}

.funnel-step__bar i,
.channels__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #4269b5;
}

.usage-split {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.usage-table-wrap { overflow: auto; }

.usage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.usage-table th,
.usage-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee7dd;
  text-align: left;
  white-space: nowrap;
}

.usage-table th {
  color: #7a7166;
  font-size: 12px;
  font-weight: 650;
}

.usage-table td { color: #1b2839; }

.channels {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.channels__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #5d564e;
  font-size: 13px;
}

.channels__meta strong { color: #05152b; font-weight: 650; }

@media (max-width: 1100px) {
  .usage-heading,
  .usage-split,
  .funnel { display: grid; grid-template-columns: 1fr; }
  .usage-filters { justify-content: flex-start; }
}
</style>
