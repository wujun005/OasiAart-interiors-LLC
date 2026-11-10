<template>
  <div class="availability" :class="{ 'availability--mobile': mobile }" v-loading="loading">
    <section class="availability-control" :class="{ 'is-off': !dispatchActive }">
      <div class="availability-control__copy">
        <span class="availability-control__kicker">{{ copy.workspace }}</span>
        <h2>{{ t('admin.supplierAvailability.manageHint') }}</h2>
        <div class="availability-facts">
          <em>{{ verificationLabel }}</em>
          <em>{{ t('admin.supplierAvailability.acceptJobs') }} · {{ accepting ? t('admin.supplierAvailability.preferenceOn') : t('admin.supplierAvailability.preferenceOff') }}</em>
          <em>{{ t('admin.supplierAvailability.preference') }} · {{ accepting ? t('admin.supplierAvailability.preferenceOn') : t('admin.supplierAvailability.preferenceOff') }}</em>
        </div>
        <p v-if="eligibilityKey === 'notBookable'" class="availability-control__note">{{ t('admin.supplierAvailability.operationsRequired') }}</p>
        <template v-else>
          <p v-if="!dispatchActive">{{ t('admin.supplierAvailability.dispatchLater') }}</p>
          <p v-if="!dispatchActive" class="availability-control__note">{{ t('admin.supplierAvailability.preferenceSaved') }}</p>
          <p v-else-if="!enabled" class="availability-control__note">{{ t('admin.supplierAvailability.accountOff') }}</p>
        </template>
      </div>
      <div class="availability-control__action">
        <div class="availability-state" role="status">
          <span class="availability-state__mark" aria-hidden="true"></span>
          <span>
            <strong>{{ t('admin.supplierAvailability.acceptJobs') }}</strong>
            <small>{{ eligibilityLabel }}</small>
          </span>
        </div>
        <el-switch
          :model-value="accepting"
          :loading="dispatchSaving"
          :disabled="!canToggle"
          size="large"
          :aria-label="copy.acceptingNewJobs"
          @change="onDispatch"
        />
      </div>
    </section>

    <div class="availability-overview">
      <section class="workspace-card coverage-card" v-loading="coverageLoading">
        <header class="workspace-card__header">
          <div>
            <div>
              <h2>{{ copy.serviceCoverage }}</h2>
              <p>{{ t('admin.supplierArea.description') }}</p>
            </div>
          </div>
          <el-button @click="emit('manage-coverage')">{{ copy.manageCoverage }}</el-button>
        </header>

        <div class="coverage-totals" aria-live="polite">
          <div>
            <span>{{ copy.zones }}</span>
            <strong>{{ normalizedCoverageRows.length }}</strong>
          </div>
          <div>
            <span>{{ copy.communities }}</span>
            <strong>{{ coverageCommunityTotal }}</strong>
          </div>
        </div>

        <div v-if="normalizedCoverageRows.length" class="coverage-list">
          <article v-for="row in normalizedCoverageRows" :key="row.id">
            <span class="coverage-list__zone">
              <strong>{{ row.zone }}</strong>
              <small>{{ coverageCountText(row) }}</small>
            </span>
            <em :class="coverageStatusTone(row)">{{ coverageStatusText(row) }}</em>
          </article>
        </div>
        <div v-else class="coverage-empty">
          <strong>{{ t('admin.supplierArea.noneTitle') }}</strong>
          <p>{{ t('admin.supplierArea.noneBody') }}</p>
        </div>
      </section>
    </div>

    <section class="workspace-card blocked-card">
      <header class="workspace-card__header blocked-card__header">
        <div>
          <div>
            <h2>{{ copy.blockedTime }}</h2>
            <p>{{ t('admin.supplierAvailability.blockHint') }}</p>
          </div>
        </div>
        <div class="blocked-card__tools">
          <span v-if="!loadError">{{ t('admin.supplierAvailability.count', { count: total }) }}</span>
          <el-button @click="calendarOpen = true">{{ copy.viewCalendar }}</el-button>
          <el-button v-if="canAction('btn:/admin/supplier-management/availability:create')" type="primary" @click="openBlock()">{{ copy.addBlockedTime }}</el-button>
        </div>
      </header>
      <el-table v-if="!mobile" :data="events" class="avail-table" row-key="id" :empty-text="loadError ? t('admin.supplierAvailability.loadFailed') : t('admin.supplierAvailability.empty')">
        <el-table-column :label="t('admin.supplierAvailability.date')" min-width="138">
          <template #default="{ row }">
            <strong v-if="weeklyClosureText(row)">{{ weeklyClosureText(row) }}</strong>
            <span>{{ eventDate(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.time')" min-width="104">
          <template #default="{ row }">{{ eventTime(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.weekdays')" min-width="106">
          <template #default="{ row }">{{ weekdayText(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.service')" min-width="132">
          <template #default="{ row }">
            <div class="tag-row">
              <em v-if="!row.services?.length">{{ t('admin.supplierAvailability.allServices') }}</em>
              <em v-for="service in row.services" v-else :key="service.spuId">{{ serviceLabel(service) }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.area')" min-width="120">
          <template #default="{ row }">
            <div class="tag-row">
              <em v-if="!row.areas?.length">{{ t('admin.supplierAvailability.allAreas') }}</em>
              <em v-for="area in row.areas" v-else :key="area.areaId">{{ area.areaName || area.areaId }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.reason')" min-width="126">
          <template #default="{ row }">{{ row.reason || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.actions')" width="148" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button v-if="canAction('btn:/admin/supplier-management/availability:edit')" link type="primary" @click="openBlock(row)">{{ t('admin.supplierAvailability.edit') }}</el-button>
              <el-button v-if="canAction('btn:/admin/supplier-management/availability:delete')" link type="danger" :loading="deletingId === row.id" @click="removeBlock(row)">{{ t('admin.supplierAvailability.delete') }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="blocked-cards">
        <article v-for="row in events" :key="`compact-${row.id}`">
          <header>
            <span>
              <strong>{{ weeklyClosureText(row) || eventDate(row) }}</strong>
              <small>{{ eventTime(row) }} · {{ weekdayText(row) }}<template v-if="weeklyClosureText(row)"> · {{ eventDate(row) }}</template></small>
            </span>
            <span class="row-actions">
              <el-button v-if="canAction('btn:/admin/supplier-management/availability:edit')" link type="primary" @click="openBlock(row)">{{ t('admin.supplierAvailability.edit') }}</el-button>
              <el-button v-if="canAction('btn:/admin/supplier-management/availability:delete')" link type="danger" :loading="deletingId === row.id" @click="removeBlock(row)">{{ t('admin.supplierAvailability.delete') }}</el-button>
            </span>
          </header>
          <dl>
            <div>
              <dt>{{ t('admin.supplierAvailability.service') }}</dt>
              <dd class="tag-row">
                <em v-if="!row.services?.length">{{ t('admin.supplierAvailability.allServices') }}</em>
                <em v-for="service in row.services" v-else :key="service.spuId">{{ serviceLabel(service) }}</em>
              </dd>
            </div>
            <div>
              <dt>{{ t('admin.supplierAvailability.area') }}</dt>
              <dd class="tag-row">
                <em v-if="!row.areas?.length">{{ t('admin.supplierAvailability.allAreas') }}</em>
                <em v-for="area in row.areas" v-else :key="area.areaId">{{ area.areaName || area.areaId }}</em>
              </dd>
            </div>
            <div class="blocked-cards__reason">
              <dt>{{ t('admin.supplierAvailability.reason') }}</dt>
              <dd>{{ row.reason || '—' }}</dd>
            </div>
          </dl>
        </article>
        <div v-if="!events.length" class="blocked-empty">
          {{ loadError ? t('admin.supplierAvailability.loadFailed') : t('admin.supplierAvailability.empty') }}
          <el-button v-if="loadError" @click="loadEvents(true)">{{ t('admin.common.refresh') }}</el-button>
        </div>
      </div>
      <div v-if="total > pageSize" class="avail-pager">
        <el-pagination layout="prev, pager, next" :current-page="page" :page-size="pageSize" :total="total" @current-change="changePage" />
      </div>
    </section>

    <el-dialog v-model="blockOpen" :class="{ 'supplier-mobile-availability-dialog': mobile }" :fullscreen="mobile" :title="blockForm.id ? t('admin.supplierAvailability.blockEdit') : t('admin.supplierAvailability.blockCreate')" width="min(640px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
      <div class="block-form">
        <div v-if="mobile" class="mobile-date-field">
          <span>{{ t('admin.supplierAvailability.date') }}</span>
          <div class="mobile-date-pair">
            <label><span>{{ copy.startDate }}</span><input v-model="blockForm.dates[0]" type="date" :max="blockForm.dates[1] || undefined" /></label>
            <label><span>{{ copy.endDate }}</span><input v-model="blockForm.dates[1]" type="date" :min="blockForm.dates[0] || undefined" /></label>
          </div>
        </div>
        <label v-else>
          <span>{{ t('admin.supplierAvailability.date') }}</span>
          <el-date-picker v-model="blockForm.dates" type="daterange" value-format="YYYY-MM-DD" :start-placeholder="t('admin.supplierAvailability.date')" :end-placeholder="t('admin.supplierAvailability.date')" />
        </label>
        <div class="weekday-field">
          <span>{{ t('admin.supplierAvailability.weekdays') }}</span>
          <small>{{ t('admin.supplierAvailability.weekdaysHint') }}</small>
          <div class="weekday-picks">
            <button
              v-for="day in weekdayChoices"
              :key="day.code"
              type="button"
              :class="{ 'is-on': blockForm.weekdays.includes(day.code) }"
              :aria-pressed="blockForm.weekdays.includes(day.code)"
              @click="toggleWeekday(day.code)"
            >
              <i class="weekday-check" aria-hidden="true"></i>
              {{ day.label }}
            </button>
          </div>
        </div>
        <label class="hours-form__switch">
          <span>
            <strong>{{ t('admin.supplierAvailability.allDay') }}</strong>
            <small>{{ t('admin.supplierAvailability.fullDayHint') }}</small>
          </span>
          <el-switch v-model="blockForm.fullDay" />
        </label>
        <div v-if="!blockForm.fullDay" class="hours-range-field">
          <span>{{ t('admin.supplierAvailability.time') }}</span>
          <div v-if="mobile" class="mobile-date-pair">
            <label><span>{{ copy.startTime }}</span><input v-model="blockForm.startTime" type="time" step="1800" /></label>
            <label><span>{{ copy.endTime }}</span><input v-model="blockForm.endTime" type="time" step="1800" /></label>
          </div>
          <div v-else class="hours-form__range">
            <el-time-select v-model="blockForm.startTime" start="00:00" step="00:30" end="23:30" />
            <em>–</em>
            <el-time-select v-model="blockForm.endTime" start="00:00" step="00:30" end="23:30" />
          </div>
        </div>
        <label>
          <span>{{ t('admin.supplierAvailability.serviceOptional') }}</span>
          <el-select :model-value="blockForm.spuIds" multiple filterable clearable collapse-tags :placeholder="t('admin.supplierAvailability.allServices')" @update:model-value="setServiceScope">
            <el-option key="all-services" :label="t('admin.supplierAvailability.allServices')" :value="ALL_AVAILABILITY_SCOPE" />
            <el-option v-for="service in serviceChoices" :key="service.spuId" :label="service.name" :value="service.spuId" />
          </el-select>
        </label>
        <label>
          <span>{{ t('admin.supplierAvailability.areaOptional') }}</span>
          <el-select :model-value="blockForm.areaIds" multiple filterable clearable collapse-tags :placeholder="t('admin.supplierAvailability.allAreas')" @update:model-value="setAreaScope">
            <el-option key="all-areas" :label="t('admin.supplierAvailability.allAreas')" :value="ALL_AVAILABILITY_SCOPE" />
            <el-option v-for="area in areaChoices" :key="area.areaId" :label="area.name" :value="area.areaId" />
          </el-select>
        </label>
        <label>
          <span>{{ t('admin.supplierAvailability.reason') }}</span>
          <el-input v-model="blockForm.reason" type="textarea" :rows="3" maxlength="512" show-word-limit :placeholder="t('admin.supplierAvailability.reasonPlaceholder')" />
        </label>
      </div>
      <template #footer>
        <el-button @click="blockOpen = false">{{ t('admin.supplierAvailability.cancel') }}</el-button>
        <el-button v-if="canAction(blockForm.id ? 'btn:/admin/supplier-management/availability:edit' : 'btn:/admin/supplier-management/availability:create')" type="primary" :loading="blockSaving" @click="saveBlock">{{ t('admin.supplierAvailability.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="calendarOpen" :class="{ 'supplier-mobile-availability-dialog': mobile }" :fullscreen="mobile" :title="t('admin.supplierAvailability.calendarTitle')" width="min(720px, calc(100vw - 32px))" append-to-body>
      <p class="cal-hint">{{ t('admin.supplierAvailability.calendarHint') }}</p>
      <div class="cal-nav">
        <el-button @click="shiftMonth(-1)">‹</el-button>
        <strong>{{ monthLabel }}</strong>
        <el-button @click="shiftMonth(1)">›</el-button>
      </div>
      <div class="cal-week">
        <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
      </div>
      <div class="cal-grid">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          type="button"
          :class="{ 'is-out': !day.inMonth, 'is-marked': day.marked, 'is-picked': day.key === pickedDay }"
          @click="pickedDay = day.key"
        >
          {{ day.date.getDate() }}
          <i v-if="day.marked"></i>
        </button>
      </div>
      <ul v-if="pickedEvents.length" class="cal-list">
        <li v-for="event in pickedEvents" :key="event.id">
          <strong>{{ eventTime(event) }}</strong>
          <span>{{ [weekdayText(event), event.reason || eventDate(event)].filter(Boolean).join(' · ') }}</span>
        </li>
      </ul>
      <p v-else-if="pickedDay" class="cal-hint cal-hint--empty">{{ t('admin.supplierAvailability.empty') }}</p>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { supplierEventDelete, supplierEventSave } from '@/modules/admin/api/supplierWorkbench'
import { useAdminSessionStore } from '@/modules/admin/stores/session'
import {
  ALL_AVAILABILITY_SCOPE,
  availabilityScopePayload,
  availabilityScopeSelection,
  updateAvailabilityScopeSelection,
  type AvailabilityScopeValue,
} from '@/modules/admin/utils/availabilityScope'
import { dispatchEligibility } from '@/modules/admin/utils/supplierReviewState'

type ServiceItem = { spuId: number; serviceName: string }
type AreaItem = { areaId: number; areaName: string }
type CoverageRow = {
  id: number | string
  zone: string
  selectedCommunities: number
  totalCommunities: number
  status: string
  statusLabel?: string
}
type SupplierEvent = {
  id: number
  startDate: string
  endDate: string
  fullDay: number
  startTime?: string
  endTime?: string
  weekdays?: Array<number | string>
  services: ServiceItem[]
  areas: AreaItem[]
  reason?: string
}
const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

const props = defineProps<{
  mobile?: boolean
  enabled: boolean
  acceptDispatch: boolean
  reviewStatus?: number | null
  dispatchSaving: boolean
  canToggle: boolean
  operationsReady?: boolean
  services?: { spuId: number; name: string }[]
  areas?: { areaId: number; areaName: string }[]
  coverageRows?: CoverageRow[]
  coverageLoading?: boolean
}>()

const emit = defineEmits<{
  'toggle-dispatch': [value: boolean]
  'manage-coverage': []
}>()

const { t, locale } = useI18n({ useScope: 'global' })
const isZh = computed(() => String(locale.value).toLowerCase().startsWith('zh'))
const copy = computed(() => (isZh.value ? {
  workspace: '服务区域与可用时间',
  acceptingNewJobs: '接受新订单',
  serviceCoverage: '服务覆盖范围',
  manageCoverage: '管理服务区域',
  blockedTime: '不可用时间',
  viewCalendar: '查看日历',
  addBlockedTime: '添加不可用时间',
  zones: '区域',
  communities: '已覆盖小区',
  fullCoverage: '全部覆盖',
  partialCoverage: '部分覆盖',
  activeCoverage: '已覆盖',
  inactiveCoverage: '未覆盖',
  startDate: '开始日期',
  endDate: '结束日期',
  startTime: '开始时间',
  endTime: '结束时间',
} : {
  workspace: 'Service areas & Availability',
  acceptingNewJobs: 'Accept new bookings',
  serviceCoverage: 'Service Coverage',
  manageCoverage: 'Manage service areas',
  blockedTime: 'Blocked Time',
  viewCalendar: 'View Calendar',
  addBlockedTime: 'Add Unavailable Time',
  zones: 'Zones',
  communities: 'Communities covered',
  fullCoverage: 'Full coverage',
  partialCoverage: 'Partial coverage',
  activeCoverage: 'Covered',
  inactiveCoverage: 'Not covered',
  startDate: 'Start date',
  endDate: 'End date',
  startTime: 'Start time',
  endTime: 'End time',
}))
const normalizedCoverageRows = computed(() => props.coverageRows || [])
const coverageCommunityTotal = computed(() => normalizedCoverageRows.value.reduce(
  (sum, row) => sum + Math.max(0, Number(row.selectedCommunities) || 0),
  0,
))
const normalizedCoverageStatus = (row: CoverageRow) => String(row.status || '').trim().toLowerCase()
const coverageStatusTone = (row: CoverageRow) => {
  const status = normalizedCoverageStatus(row)
  if (status.includes('partial')) return 'is-partial'
  if (status.includes('inactive') || status.includes('disabled') || status.includes('none')) return 'is-inactive'
  return 'is-active'
}
const coverageStatusText = (row: CoverageRow) => {
  if (row.statusLabel) return row.statusLabel
  const status = normalizedCoverageStatus(row)
  if (status.includes('partial')) return copy.value.partialCoverage
  if (status.includes('inactive') || status.includes('disabled') || status.includes('none')) return copy.value.inactiveCoverage
  if (status.includes('full')) return copy.value.fullCoverage
  if (status && !['active', 'enabled', 'covered'].includes(status)) return row.status
  return copy.value.activeCoverage
}
const coverageCountText = (row: CoverageRow) => {
  const selected = Math.max(0, Number(row.selectedCommunities) || 0)
  const total = Math.max(0, Number(row.totalCommunities) || 0)
  if (!total) return selected ? String(selected) : t('admin.supplierArea.zoneOnly')
  return `${selected} / ${total} ${copy.value.communities.toLocaleLowerCase(locale.value)}`
}
const accepting = computed(() => props.acceptDispatch)
const eligibilityKey = computed(() => dispatchEligibility({
  reviewStatus: props.reviewStatus,
  enabled: props.enabled ? 1 : 0,
  acceptDispatch: props.acceptDispatch ? 1 : 0,
  operationsReady: props.operationsReady,
}))
const eligibilityLabel = computed(() => {
  const keys = {
    pendingVerification: 'eligibilityPending',
    verificationApproved: 'eligibilityApproved',
    setupIncomplete: 'eligibilitySetup',
    notBookable: 'eligibilityNotBookable',
    active: 'eligibilityActive',
    suspended: 'eligibilitySuspended',
    changesRequired: 'eligibilityChanges',
  } as const
  return t(`admin.supplierAvailability.${keys[eligibilityKey.value]}`)
})
const verificationLabel = computed(() => {
  if (props.reviewStatus === 1) return t('admin.supplierAvailability.pendingApproval')
  if (props.reviewStatus === 2) return t('admin.supplierAvailability.eligibilityApproved')
  if (props.reviewStatus === 3) return t('admin.supplierAvailability.eligibilityChanges')
  return t('admin.supplierAvailability.eligibilitySetup')
})
const dispatchActive = computed(() => eligibilityKey.value === 'active')
const weekdayName = (code: number) => weekdayChoices.value.find((day) => day.code === code)?.label || String(code)
const weeklyClosureText = (row: SupplierEvent) => {
  const allDay = Number(row.fullDay) === 1 || (!row.startTime && !row.endTime)
  const codes = [...new Set((row.weekdays || []).map((item) => Number(item)).filter((code) => code >= 1 && code <= 7))]
  if (!allDay || !codes.length || codes.length === 7 || row.services?.length || row.areas?.length) return ''
  return codes.map((code) => t('admin.supplierAvailability.dayClosed', { day: weekdayName(code) })).join(locale.value === 'zh' ? '；' : '; ')
}

const loading = ref(false)
const loadError = ref('')
const allEvents = ref<SupplierEvent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 8
const blockOpen = ref(false)
const blockSaving = ref(false)
const deletingId = ref<number | null>(null)
const extraServices = ref<{ spuId: number; name: string }[]>([])
const extraAreas = ref<{ areaId: number; name: string }[]>([])
const blockForm = reactive({
  id: null as number | null,
  dates: [] as string[],
  fullDay: false,
  startTime: '',
  endTime: '',
  weekdays: [] as number[],
  spuIds: [ALL_AVAILABILITY_SCOPE] as AvailabilityScopeValue[],
  areaIds: [ALL_AVAILABILITY_SCOPE] as AvailabilityScopeValue[],
  reason: '',
})
const calendarOpen = ref(false)
const cursor = ref(new Date())
const pickedDay = ref('')

const eventDate = (row: SupplierEvent) => {
  const start = formatDay(row.startDate)
  const end = formatDay(row.endDate)
  if (!start) return '—'
  if (!end || row.endDate === row.startDate) return start
  return `${start} – ${end}`
}
const eventTime = (row: SupplierEvent) => {
  if (Number(row.fullDay) === 1 || (!row.startTime && !row.endTime)) return t('admin.supplierAvailability.allDay')
  return [row.startTime, row.endTime].filter(Boolean).join(' – ')
}
const normalizeWeekdays = (value?: Array<number | string>) => {
  const codes = [...new Set((value || []).map((item) => Number(item)).filter((code) => code >= 1 && code <= 7))].sort((a, b) => a - b)
  return !codes.length || codes.length === 7 ? [...ALL_WEEKDAYS] : codes
}
const weekdayChoices = computed(() => {
  const base = new Date(2024, 0, 1)
  return ALL_WEEKDAYS.map((code, index) => {
    const day = new Date(base)
    day.setDate(base.getDate() + index)
    return {
      code,
      label: day.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }),
    }
  })
})
const weekdayText = (row: SupplierEvent) => {
  const codes = normalizeWeekdays(row.weekdays)
  if (codes.length === 7) return t('admin.supplierAvailability.weekdaysEvery')
  const labels = new Map(weekdayChoices.value.map((day) => [day.code, day.label]))
  return codes.map((code) => labels.get(code) || String(code)).join(locale.value === 'zh' ? '、' : ', ')
}
const toggleWeekday = (code: number) => {
  const next = new Set(blockForm.weekdays)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  blockForm.weekdays = [...next].sort((a, b) => a - b)
}
const isoWeekday = (key: string) => {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) return 0
  const date = new Date(year, month - 1, day)
  return date.getDay() === 0 ? 7 : date.getDay()
}
const rangeHasWeekday = (start: string, end: string, codes: number[]) => {
  const cursor = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return false
  for (let index = 0; index < 7 && cursor <= last; index += 1) {
    const code = cursor.getDay() === 0 ? 7 : cursor.getDay()
    if (codes.includes(code)) return true
    cursor.setDate(cursor.getDate() + 1)
  }
  return false
}
const formatDay = (value?: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const loadEvents = async (fresh = false) => {
  loading.value = true
  try {
    const result = await useAdminSessionStore().supplierEvents(fresh)
    allEvents.value = result.list
    total.value = result.total
    const maxPage = Math.max(1, Math.ceil(total.value / pageSize))
    if (page.value > maxPage) page.value = maxPage
    loadError.value = ''
  } catch (error: any) {
    allEvents.value = []
    total.value = 0
    loadError.value = error?.message || t('admin.supplierAvailability.loadFailed')
    ElMessage.error(loadError.value)
  } finally {
    loading.value = false
  }
}
const events = computed(() => allEvents.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const changePage = (next: number) => {
  page.value = next
}

const onDispatch = (value: boolean | string | number) => {
  emit('toggle-dispatch', value === true || value === 1 || value === '1')
}

const serviceChoices = computed(() => {
  const map = new Map<number, string>()
  for (const service of props.services || []) map.set(service.spuId, service.name)
  for (const service of extraServices.value) if (!map.has(service.spuId)) map.set(service.spuId, service.name)
  return [...map.entries()].map(([spuId, name]) => ({ spuId, name }))
})
const serviceLabel = (service: ServiceItem) => (
  serviceChoices.value.find((item) => item.spuId === Number(service.spuId))?.name
  || service.serviceName
  || String(service.spuId)
)
const areaChoices = computed(() => {
  const map = new Map<number, string>()
  for (const area of props.areas || []) map.set(area.areaId, area.areaName)
  for (const area of extraAreas.value) if (!map.has(area.areaId)) map.set(area.areaId, area.name)
  return [...map.entries()].map(([areaId, name]) => ({ areaId, name }))
})
const setServiceScope = (values: unknown) => {
  blockForm.spuIds = updateAvailabilityScopeSelection(blockForm.spuIds, values)
}
const setAreaScope = (values: unknown) => {
  blockForm.areaIds = updateAvailabilityScopeSelection(blockForm.areaIds, values)
}
const todayKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`
}
const openBlock = (row?: SupplierEvent) => {
  extraServices.value = (row?.services || []).map((service) => ({ spuId: service.spuId, name: service.serviceName || String(service.spuId) }))
  extraAreas.value = (row?.areas || []).map((area) => ({ areaId: area.areaId, name: area.areaName || String(area.areaId) }))
  const today = todayKey()
  blockForm.id = row?.id ?? null
  blockForm.dates = [row?.startDate || today, row?.endDate || row?.startDate || today]
  blockForm.fullDay = Number(row?.fullDay) === 1
  blockForm.startTime = row?.startTime || ''
  blockForm.endTime = row?.endTime || ''
  blockForm.weekdays = row ? normalizeWeekdays(row.weekdays) : []
  blockForm.spuIds = availabilityScopeSelection((row?.services || []).map((service) => service.spuId))
  blockForm.areaIds = availabilityScopeSelection((row?.areas || []).map((area) => area.areaId))
  blockForm.reason = row?.reason || ''
  blockOpen.value = true
}
const saveBlock = async () => {
  const [startDate, endDate] = blockForm.dates || []
  if (!startDate || !endDate) {
    ElMessage.warning(t('admin.supplierAvailability.dateRequired'))
    return
  }
  if (endDate < startDate) {
    ElMessage.warning(t('admin.supplierAvailability.dateInvalid'))
    return
  }
  if (!blockForm.weekdays.length) {
    ElMessage.warning(t('admin.supplierAvailability.weekdaysRequired'))
    return
  }
  if (blockForm.weekdays.length < 7 && !rangeHasWeekday(startDate, endDate, blockForm.weekdays)) {
    ElMessage.warning(t('admin.supplierAvailability.weekdaysOutOfRange'))
    return
  }
  if (!blockForm.fullDay && (!blockForm.startTime || !blockForm.endTime)) {
    ElMessage.warning(t('admin.supplierAvailability.timeRequired'))
    return
  }
  if (!blockForm.fullDay && startDate === endDate && blockForm.startTime >= blockForm.endTime) {
    ElMessage.warning(t('admin.supplierAvailability.timeInvalid'))
    return
  }
  const reason = blockForm.reason.trim()
  if (reason.length > 512) {
    ElMessage.warning(t('admin.supplierAvailability.reasonTooLong'))
    return
  }
  blockSaving.value = true
  try {
    await supplierEventSave({
      id: blockForm.id || undefined,
      startDate,
      endDate,
      fullDay: blockForm.fullDay ? 1 : 0,
      startTime: blockForm.fullDay ? null : blockForm.startTime,
      endTime: blockForm.fullDay ? null : blockForm.endTime,
      weekdays: [...blockForm.weekdays],
      spuIds: availabilityScopePayload(blockForm.spuIds),
      areaIds: availabilityScopePayload(blockForm.areaIds),
      reason: reason || null,
    })
    ElMessage.success(t('admin.supplierAvailability.blockSaved'))
    blockOpen.value = false
    page.value = 1
    await loadEvents(true)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierAvailability.blockFailed'))
  } finally {
    blockSaving.value = false
  }
}
const blockLabel = (row: SupplierEvent) => weeklyClosureText(row) || eventDate(row)
const removeBlock = async (row: SupplierEvent) => {
  try {
    await ElMessageBox.confirm(
      t('admin.supplierAvailability.deleteConfirm', { label: blockLabel(row) }),
      t('admin.common.confirmTitle'),
      {
        type: 'warning',
        customClass: props.mobile ? 'supplier-mobile-availability-confirm' : undefined,
        confirmButtonText: t('admin.supplierAvailability.delete'),
        cancelButtonText: t('admin.supplierAvailability.cancel'),
      },
    )
  } catch {
    return
  }
  deletingId.value = row.id
  try {
    await supplierEventDelete(row.id)
    ElMessage.success(t('admin.supplierAvailability.deleted'))
    await loadEvents(true)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierAvailability.deleteFailed'))
  } finally {
    deletingId.value = null
  }
}

const monthLabel = computed(() => cursor.value.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' }))
const weekdayLabels = computed(() => {
  const base = new Date(2024, 0, 7)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(base)
    day.setDate(base.getDate() + index)
    return day.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' })
  })
})
const dayKey = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
const covers = (event: SupplierEvent, key: string) => {
  const start = event.startDate || key
  const end = event.endDate || start
  if (key < start || key > end) return false
  const codes = normalizeWeekdays(event.weekdays)
  return codes.length === 7 || codes.includes(isoWeekday(key))
}
const calendarDays = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = dayKey(date)
    return {
      key,
      date,
      inMonth: date.getMonth() === month,
      marked: allEvents.value.some((event) => covers(event, key)),
    }
  })
})
const pickedEvents = computed(() => allEvents.value.filter((event) => pickedDay.value && covers(event, pickedDay.value)))
const shiftMonth = (step: number) => {
  const next = new Date(cursor.value)
  next.setMonth(next.getMonth() + step)
  cursor.value = next
  pickedDay.value = ''
}

onMounted(loadEvents)
</script>

<style scoped>
.availability { display: flex; min-width: 0; flex-direction: column; gap: 18px; }
.availability-control { position: relative; isolation: isolate; display: flex; align-items: center; justify-content: space-between; gap: 28px; min-width: 0; min-height: 154px; padding: 26px 28px; overflow: hidden; color: #fffdf8; background: linear-gradient(118deg, #06182e 0%, #0a2b43 58%, #12513f 120%); border: 1px solid rgba(232, 194, 122, .24); border-radius: 22px; box-shadow: 0 18px 44px rgba(5, 21, 43, .13); }
.availability-control::after { position: absolute; z-index: -1; right: -76px; bottom: -126px; width: 350px; height: 260px; content: ''; background: radial-gradient(circle, rgba(232, 194, 122, .2), transparent 66%); pointer-events: none; }
.availability-control.is-off { background: linear-gradient(118deg, #121c2b 0%, #29313a 58%, #6e5137 125%); }
.availability-control__copy { min-width: 0; }
.availability-control__kicker { display: block; margin-bottom: 8px; color: #e8c27a; font-size: 10px; font-weight: 750; letter-spacing: .18em; text-transform: uppercase; }
.availability-control h2 { margin: 0; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: clamp(22px, 2.2vw, 30px); font-weight: 520; line-height: 1.2; letter-spacing: -.03em; }
.availability-facts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.availability-facts em { padding: 4px 8px; color: #fffdf8; background: rgba(255, 255, 255, .12); border-radius: 999px; font-size: 12px; font-style: normal; font-weight: 650; }
.availability-control p { max-width: 620px; margin: 8px 0 0; color: rgba(247, 241, 230, .72); font-size: 13px; line-height: 1.55; }
.availability-control__note { color: #f4ce91 !important; }
.availability-control__action { display: flex; flex: 0 0 auto; align-items: center; gap: 18px; min-width: 0; padding: 14px 16px; background: rgba(4, 17, 33, .5); border: 1px solid rgba(255, 255, 255, .13); border-radius: 16px; backdrop-filter: blur(12px); }
.availability-state { display: flex; align-items: center; gap: 12px; min-width: 0; }
.availability-state__mark { width: 10px; height: 10px; border-radius: 50%; background: #66d69a; box-shadow: 0 0 0 6px rgba(102, 214, 154, .14); }
.is-off .availability-state__mark { background: #e8c27a; box-shadow: 0 0 0 6px rgba(232, 194, 122, .14); }
.availability-state > span:last-child { display: grid; min-width: 0; gap: 3px; }
.availability-state strong { color: #fffdf8; font-size: 13px; }
.availability-state small { max-width: 230px; overflow: hidden; color: rgba(247, 241, 230, .58); font-size: 10px; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.availability-control :deep(.el-switch) { --el-switch-on-color: #36a873; --el-switch-off-color: #8a7561; }

.availability-overview { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; min-width: 0; }
.workspace-card { min-width: 0; overflow: hidden; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 20px; box-shadow: 0 12px 34px rgba(5, 21, 43, .045); }
.workspace-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px; border-bottom: 1px solid #eee3d3; }
.workspace-card__header > div:first-child { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.workspace-card__header > div:first-child > div { min-width: 0; }
.workspace-card h2 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 24px; font-weight: 520; line-height: 1.12; letter-spacing: -.025em; }
.workspace-card__header p { margin: 5px 0 0; color: #74685a; font-size: 12px; line-height: 1.45; }
.workspace-card__header :deep(.el-button) { flex: 0 0 auto; min-height: 38px; border-color: #d8c8b2; border-radius: 10px; color: #05152b; background: #fff; font-weight: 650; }
.workspace-card__header :deep(.el-button--primary) { color: #fffdf8; background: #05152b; border-color: #05152b; }

.coverage-totals { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 16px 20px 10px; }
.coverage-totals > div { min-width: 0; padding: 13px 14px; background: #f7f3ec; border: 1px solid #eee2d1; border-radius: 13px; }
.coverage-totals span { display: block; color: #8a7d70; font-size: 9px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
.coverage-totals strong { display: block; margin-top: 6px; color: #05152b; font-family: var(--hx-font-numeric); font-size: 25px; font-weight: 600; line-height: 1; letter-spacing: normal; font-variant-numeric: lining-nums tabular-nums; }
.coverage-list { display: flex; max-height: 246px; padding: 0 20px 18px; overflow-y: auto; flex-direction: column; }
.coverage-list article { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-width: 0; padding: 12px 2px; border-bottom: 1px solid #efe5d7; }
.coverage-list article:last-child { border-bottom: 0; }
.coverage-list__zone { display: grid; min-width: 0; gap: 3px; }
.coverage-list__zone strong { overflow: hidden; color: #05152b; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.coverage-list__zone small { color: #74685a; font-size: 11px; }
.coverage-list em { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; font-size: 10px; font-style: normal; font-weight: 750; }
.coverage-list em.is-active { color: #1f6f4e; background: #e6f4ec; }
.coverage-list em.is-partial { color: #865d22; background: #fff1d9; }
.coverage-list em.is-inactive { color: #81505a; background: #f8e8eb; }
.coverage-empty { margin: 0 20px 20px; padding: 18px; text-align: left; background: #f7f3ec; border: 1px dashed #d8c9b4; border-radius: 14px; }
.coverage-empty strong { color: #05152b; font-size: 13px; }
.coverage-empty p { margin: 5px 0 0; color: #74685a; font-size: 11px; line-height: 1.5; }

.blocked-card__header { align-items: center; }
.blocked-card__tools { display: flex; align-items: center; justify-content: flex-end; gap: 9px; min-width: 0; color: #74685a; font-size: 11px; white-space: nowrap; }
.avail-table { width: 100%; --el-table-header-bg-color: #f7f3ec; --el-table-bg-color: transparent; --el-table-row-hover-bg-color: #fbf7f0; }
.avail-table :deep(th.el-table__cell) { color: #74685a; font-size: 10px; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; }
.avail-table :deep(td.el-table__cell) { color: #28384d; font-size: 12px; vertical-align: top; }
.avail-table :deep(.cell) { line-height: 1.45; overflow-wrap: anywhere; }
.tag-row { display: flex; flex-wrap: wrap; gap: 5px; min-width: 0; }
.tag-row em { max-width: 100%; padding: 3px 7px; overflow: hidden; border-radius: 999px; background: #f7f3ec; color: #05152b; font-style: normal; font-size: 10px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.row-actions { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.blocked-cards { display: none; }
.blocked-cards > article { min-width: 0; padding: 15px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.blocked-cards > article > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.blocked-cards > article > header > span { display: grid; min-width: 0; gap: 3px; }
.blocked-cards > article > header strong { color: #05152b; font-size: 13px; }
.blocked-cards > article > header small { color: #74685a; font-size: 11px; line-height: 1.4; }
.blocked-cards dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 14px 0 0; padding-top: 13px; border-top: 1px solid #efe5d7; }
.blocked-cards dl > div { min-width: 0; }
.blocked-cards__reason { grid-column: 1 / -1; }
.blocked-cards dt { color: #8a7d70; font-size: 9px; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; }
.blocked-cards dd { margin: 5px 0 0; color: #28384d; font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
.blocked-empty { grid-column: 1 / -1; padding: 30px 16px; color: #74685a; text-align: center; }
.avail-pager { display: flex; justify-content: flex-end; padding: 12px 16px 16px; }

.block-form, .hours-form { display: flex; flex-direction: column; gap: 16px; }
.block-form :deep(.el-date-editor), .block-form :deep(.el-select) { width: 100%; }
.hours-form label, .block-form > label:not(.hours-form__switch), .hours-range-field { display: flex; flex-direction: column; gap: 8px; }
.hours-form span, .block-form span { color: #74685a; font-size: 12px; font-weight: 700; }
.hours-form__range { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
.hours-form__range em { color: #74685a; font-style: normal; }
.hours-form :deep(.el-input-number), .hours-form :deep(.el-select) { width: 100%; }
.hours-form__switch { display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #efe4d4; border-radius: 12px; }
.hours-form__switch strong, .hours-form__switch small { display: block; }
.hours-form__switch strong { color: #05152b; font-size: 14px; }
.hours-form__switch small { margin-top: 4px; color: #74685a; font-size: 12px; font-weight: 500; }
.weekday-field { display: flex; flex-direction: column; gap: 8px; }
.weekday-field > span { color: #74685a; font-size: 12px; font-weight: 700; }
.weekday-field small { color: #74685a; font-size: 12px; line-height: 1.45; }
.weekday-picks { display: flex; flex-wrap: wrap; gap: 8px; }
.weekday-picks button { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 12px 6px 6px; border: 1px solid #e6dccb; border-radius: 12px; background: #fff; color: #5c564c; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.weekday-check { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1.5px solid #cfc3b2; border-radius: 8px; background: #fff; flex: none; }
.weekday-picks button.is-on { border-color: #05152b; background: #eef1f4; color: #05152b; }
.weekday-picks button.is-on .weekday-check { border-color: #05152b; background: #05152b; }
.weekday-picks button.is-on .weekday-check::after { content: ''; width: 6px; height: 11px; margin-top: -2px; border: solid #fff; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
.cal-hint { margin: 0 0 14px; color: #74685a; font-size: 13px; line-height: 1.5; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.cal-nav strong { color: #05152b; font-family: var(--hx-font-numeric); font-size: 22px; font-weight: 600; letter-spacing: normal; font-variant-numeric: lining-nums tabular-nums; }
.cal-week, .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.cal-week { margin-bottom: 6px; color: #8a7d70; font-size: 11px; font-weight: 700; text-align: center; }
.cal-grid button { position: relative; height: 44px; border: 0; border-radius: 10px; background: #fffdf8; color: #05152b; font: inherit; cursor: pointer; }
.cal-grid button.is-out { color: #c4b8aa; }
.cal-grid button.is-marked { background: #f7f3ec; }
.cal-grid button.is-picked { box-shadow: inset 0 0 0 1px #05152b; }
.cal-grid i { position: absolute; left: 50%; bottom: 6px; width: 5px; height: 5px; margin-left: -2px; border-radius: 50%; background: #8d5a32; }
.cal-list { display: flex; flex-direction: column; gap: 8px; margin: 14px 0 0; padding: 0; list-style: none; }
.cal-list li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; background: #f7f3ec; border-radius: 10px; }
.cal-list strong { color: #05152b; }
.cal-list span { color: #74685a; }

@media (max-width: 1180px) {
  .availability-overview { grid-template-columns: minmax(0, 1fr); }
  .avail-table { display: none; }
  .blocked-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 14px 16px 4px; }
}
@media (max-width: 820px) {
  .availability-control { align-items: stretch; flex-direction: column; min-height: 0; padding: 22px; }
  .availability-control__action { justify-content: space-between; width: 100%; box-sizing: border-box; }
  .workspace-card__header, .blocked-card__header { align-items: stretch; flex-direction: column; }
  .workspace-card__header :deep(.el-button) { width: 100%; }
  .blocked-card__tools { justify-content: flex-start; flex-wrap: wrap; white-space: normal; }
  .blocked-card__tools > span { flex: 1 0 100%; }
  .blocked-card__tools :deep(.el-button) { width: auto; flex: 1 1 170px; }
  .blocked-cards { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 520px) {
  .availability-control { padding: 19px; border-radius: 18px; }
  .availability-control__action { align-items: flex-start; }
  .availability-state small { max-width: 190px; white-space: normal; }
  .coverage-totals { grid-template-columns: minmax(0, 1fr); }
  .blocked-cards dl { grid-template-columns: minmax(0, 1fr); }
  .blocked-cards__reason { grid-column: auto; }
  .hours-form__range { grid-template-columns: minmax(0, 1fr); }
  .hours-form__range em { display: none; }
}

.availability--mobile { gap: 16px; color: #102b44; font-size: 14px; }
.availability--mobile .availability-control { flex-direction: column; align-items: stretch; gap: 18px; min-height: 0; padding: 18px 16px; color: #102b44; border: 1px solid #e4e9ef; border-radius: 16px; background: #fff; box-shadow: none; }
.availability--mobile .availability-control::after { display: none; }
.availability--mobile .availability-control.is-off { background: #fff; }
.availability--mobile .availability-control h2 { color: #102b44; font-family: inherit; font-size: 20px; font-weight: 700; line-height: 1.35; letter-spacing: -.025em; }
.availability--mobile .availability-control__kicker { margin-bottom: 6px; color: #8e744c; font-size: 10px; letter-spacing: .08em; }
.availability--mobile .availability-facts { gap: 6px; }
.availability--mobile .availability-facts em { padding: 5px 8px; color: #44576b; border-radius: 7px; background: #f0f4f8; font-size: 11px; font-weight: 600; line-height: 1.45; }
.availability--mobile .availability-control p { color: #64748b; font-size: 12px; line-height: 1.65; }
.availability--mobile .availability-control__note { color: #946d35 !important; }
.availability--mobile .availability-control__action { justify-content: space-between; align-items: center; width: 100%; padding: 14px; border: 1px solid #e4ece8; border-radius: 12px; background: #f4f9f6; backdrop-filter: none; }
.availability--mobile .availability-state { gap: 12px; }
.availability--mobile .availability-state__mark { width: 8px; height: 8px; background: #238266; box-shadow: 0 0 0 4px #23826612; }
.availability--mobile .is-off .availability-state__mark { background: #b4935c; box-shadow: 0 0 0 4px #b4935c14; }
.availability--mobile .availability-state strong { color: #1c4b3b; font-size: 13px; }
.availability--mobile .availability-control :deep(.el-switch) { --el-switch-on-color: #238266; --el-switch-off-color: #a1acb8; }
.availability--mobile .availability-state small { max-width: none; color: #637d70; white-space: normal; font-size: 11px; line-height: 1.5; }
.availability--mobile .workspace-card { border-color: #e4e9ef; border-radius: 16px; background: #fff; box-shadow: none; }
.availability--mobile .workspace-card__header { flex-direction: column; gap: 14px; padding: 17px 16px; border-bottom-color: #edf0f4; }
.availability--mobile .workspace-card h2 { color: #102b44; font-family: inherit; font-size: 17px; font-weight: 650; line-height: 1.4; letter-spacing: -.02em; }
.availability--mobile .workspace-card__header p { color: #64748b; font-size: 12px; line-height: 1.65; }
.availability--mobile .workspace-card__header :deep(.el-button) { width: 100%; min-height: 44px; height: auto; padding: 10px 12px; border-color: #dce4ec; border-radius: 10px; color: #102b44; font-size: 13px; white-space: normal; }
.availability--mobile .workspace-card__header :deep(.el-button--primary) { border-color: #102b44; color: #fff; background: #102b44; }
.availability--mobile .coverage-totals { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px 16px 8px; }
.availability--mobile .coverage-totals > div { padding: 14px 12px; border-color: #e8edf3; border-radius: 12px; background: #f7f9fb; }
.availability--mobile .coverage-totals span { color: #64748b; font-size: 11px; font-weight: 600; line-height: 1.45; letter-spacing: 0; }
.availability--mobile .coverage-totals strong { margin-top: 8px; color: #102b44; font-size: 26px; font-weight: 700; }
.availability--mobile .coverage-list { max-height: none; padding: 0 16px 14px; overflow: visible; }
.availability--mobile .coverage-list article { gap: 10px; padding-block: 14px; border-bottom-color: #edf0f4; }
.availability--mobile .coverage-list__zone strong { font-size: 14px; }
.availability--mobile .coverage-list__zone small { color: #64748b; font-size: 12px; line-height: 1.5; }
.availability--mobile .coverage-list em { max-width: 45%; padding: 5px 8px; font-size: 11px; line-height: 1.4; text-align: center; }
.availability--mobile .coverage-empty { margin: 0 16px 16px; border-color: #dce4ec; border-radius: 12px; background: #f7f9fb; }
.availability--mobile .coverage-empty p { color: #64748b; }
.availability--mobile .blocked-card__tools { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; gap: 10px; }
.availability--mobile .blocked-card__tools > span { grid-column: 1 / -1; color: #64748b; font-size: 12px; }
.availability--mobile .blocked-card__tools :deep(.el-button) { margin: 0; }
.availability--mobile .blocked-cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 14px 12px 12px; }
.availability--mobile .blocked-cards > article { padding: 16px 14px; border-color: #e4e9ef; border-radius: 12px; background: #fff; }
.availability--mobile .blocked-cards > article > header { flex-direction: column; gap: 12px; }
.availability--mobile .blocked-cards > article > header strong { font-size: 14px; line-height: 1.5; }
.availability--mobile .blocked-cards > article > header small { color: #64748b; font-size: 12px; line-height: 1.5; }
.availability--mobile .blocked-cards > article > header .row-actions { display: flex; width: 100%; gap: 10px; }
.availability--mobile .row-actions :deep(.el-button) { flex: 1; min-height: 44px; margin: 0; border: 1px solid #e4e9ef; border-radius: 10px; background: #fff; font-size: 13px; }
.availability--mobile .blocked-cards dl { grid-template-columns: minmax(0, 1fr); gap: 14px; border-top-color: #edf0f4; }
.availability--mobile .blocked-cards dt { color: #64748b; font-size: 11px; font-weight: 600; letter-spacing: 0; }
.availability--mobile .tag-row em { padding: 5px 8px; border-radius: 7px; background: #f0f4f8; color: #43566a; font-size: 12px; white-space: normal; overflow-wrap: anywhere; }
.availability--mobile .blocked-empty { display: grid; justify-items: center; gap: 14px; padding: 32px 18px; color: #64748b; font-size: 13px; line-height: 1.65; }
.availability--mobile .avail-pager { justify-content: center; padding: 10px 12px 18px; }
.availability--mobile .avail-pager :deep(.btn-prev), .availability--mobile .avail-pager :deep(.btn-next), .availability--mobile .avail-pager :deep(.el-pager li) { min-width: 38px; height: 42px; }

.mobile-date-field { display: grid; gap: 8px; }
.mobile-date-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.mobile-date-pair label { display: grid; gap: 6px; min-width: 0; }
.mobile-date-pair span { font-size: 11px; font-weight: 500; color: #64748b; }
.mobile-date-pair input { box-sizing: border-box; width: 100%; min-width: 0; min-height: 46px; padding: 10px 8px; color: #102b44; border: 1px solid #dce4ec; border-radius: 10px; background: #fff; font: inherit; font-size: 16px; font-weight: 500; line-height: 1.4; }
.mobile-date-pair input:focus-visible { outline: 2px solid #b4935c; outline-offset: 2px; }

:global(.supplier-mobile-availability-dialog.el-dialog.is-fullscreen) { display: flex; flex-direction: column; box-sizing: border-box; width: 100% !important; max-width: 100vw; height: 100dvh; max-height: 100dvh; margin: 0 !important; padding: 0; border: 0; border-radius: 0; background: #f5f6f8; }
:global(.supplier-mobile-availability-dialog .el-dialog__header) { flex: none; margin: 0; padding: calc(16px + env(safe-area-inset-top, 0px)) 52px 16px 18px; border-bottom: 1px solid #e4e9ef; background: #fff; }
:global(.supplier-mobile-availability-dialog .el-dialog__title) { color: #102b44; font-size: 18px; font-weight: 650; line-height: 1.4; }
:global(.supplier-mobile-availability-dialog .el-dialog__headerbtn) { top: calc(10px + env(safe-area-inset-top, 0px)); right: 10px; width: 40px; height: 40px; }
:global(.supplier-mobile-availability-dialog .el-dialog__body) { flex: 1; min-height: 0; padding: 20px 18px; overflow-y: auto; overscroll-behavior: contain; }
:global(.supplier-mobile-availability-dialog .el-dialog__footer) { flex: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid #e4e9ef; background: #fff; }
:global(.supplier-mobile-availability-dialog .el-dialog__footer .el-button) { min-height: 46px; height: auto; margin: 0; font-size: 15px; }
:global(.supplier-mobile-availability-dialog .el-select__wrapper), :global(.supplier-mobile-availability-dialog .el-input__wrapper) { min-height: 44px; }
:global(.supplier-mobile-availability-dialog .el-input__inner), :global(.supplier-mobile-availability-dialog .el-textarea__inner) { font-size: 16px; }
:global(.supplier-mobile-availability-dialog .weekday-picks) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
:global(.supplier-mobile-availability-dialog .weekday-picks button) { justify-content: center; gap: 4px; min-height: 44px; padding: 6px 4px; border-radius: 9px; font-size: 12px; }
:global(.supplier-mobile-availability-dialog .weekday-check) { width: 17px; height: 17px; border-radius: 5px; }
:global(.supplier-mobile-availability-dialog .weekday-picks button.is-on .weekday-check::after) { width: 4px; height: 8px; border-width: 0 2px 2px 0; }
:global(.supplier-mobile-availability-dialog .cal-week), :global(.supplier-mobile-availability-dialog .cal-grid) { grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
:global(.supplier-mobile-availability-dialog .cal-grid button) { min-height: 44px; font-size: 14px; }
:global(.supplier-mobile-availability-dialog .cal-nav strong) { font-size: 21px; }
:global(.supplier-mobile-availability-dialog .cal-list li) { flex-direction: column; gap: 5px; font-size: 13px; line-height: 1.5; }
:global(.supplier-mobile-availability-dialog .cal-hint--empty) { margin-top: 18px; padding: 15px; border: 1px solid #e4e9ef; border-radius: 12px; background: #f7f9fb; }
:global(.supplier-mobile-availability-confirm) { box-sizing: border-box; width: calc(100vw - 32px); max-width: 390px; }
</style>
