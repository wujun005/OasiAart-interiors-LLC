<template>
  <div class="availability" v-loading="loading">
    <section class="availability-control" :class="{ 'is-off': !accepting }">
      <div class="availability-control__copy">
        <span class="availability-control__kicker">{{ copy.workspace }}</span>
        <h2>{{ copy.acceptingNewJobs }}</h2>
        <p>{{ accepting ? t('admin.supplierAvailability.acceptingHint') : t('admin.supplierAvailability.pausedHint') }}</p>
        <p v-if="!enabled" class="availability-control__note">{{ t('admin.supplierAvailability.accountOff') }}</p>
      </div>
      <div class="availability-control__action">
        <div class="availability-state" role="status">
          <span class="availability-state__mark" aria-hidden="true"></span>
          <span>
            <strong>{{ accepting ? t('admin.supplierAvailability.available') : t('admin.supplierAvailability.unavailable') }}</strong>
            <small>{{ accepting ? t('admin.supplierAvailability.availableHint') : t('admin.supplierAvailability.unavailableHint') }}</small>
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
            <span class="workspace-card__index">01</span>
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

      <section class="workspace-card schedule-card">
        <header class="workspace-card__header">
          <div>
            <span class="workspace-card__index">02</span>
            <div>
              <h2>{{ copy.defaultSchedule }}</h2>
              <p>{{ t('admin.supplierAvailability.hoursHint') }}</p>
            </div>
          </div>
          <el-button @click="openHours">{{ copy.editSchedule }}</el-button>
        </header>
        <div class="schedule-summary">
          <article>
            <span>{{ t('admin.supplierAvailability.workingDays') }}</span>
            <strong>{{ workingDaysText }}</strong>
          </article>
          <article>
            <span>{{ t('admin.supplierAvailability.workingHours') }}</span>
            <strong>{{ hourText }}</strong>
          </article>
          <article class="schedule-summary__capacity">
            <span>{{ t('admin.supplierAvailability.maxJobs') }}</span>
            <strong>{{ t('admin.supplierAvailability.jobsValue', { count: concurrent }) }}</strong>
          </article>
        </div>
      </section>
    </div>

    <section class="workspace-card blocked-card">
      <header class="workspace-card__header blocked-card__header">
        <div>
          <span class="workspace-card__index">03</span>
          <div>
            <h2>{{ copy.blockedTime }}</h2>
            <p>{{ t('admin.supplierAvailability.blockHint') }}</p>
          </div>
        </div>
        <div class="blocked-card__tools">
          <span v-if="!loadError">{{ t('admin.supplierAvailability.count', { count: total }) }}</span>
          <el-button @click="calendarOpen = true">{{ copy.viewCalendar }}</el-button>
          <el-button type="primary" @click="openBlock()">{{ copy.addBlockedTime }}</el-button>
        </div>
      </header>
      <el-table :data="events" class="avail-table" row-key="id" :empty-text="loadError ? t('admin.supplierAvailability.loadFailed') : t('admin.supplierAvailability.empty')">
        <el-table-column :label="t('admin.supplierAvailability.date')" min-width="138">
          <template #default="{ row }">{{ eventDate(row) }}</template>
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
        <el-table-column :label="t('admin.supplierAvailability.actions')" width="76" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openBlock(row)">{{ t('admin.supplierAvailability.edit') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="blocked-cards">
        <article v-for="row in events" :key="`compact-${row.id}`">
          <header>
            <span>
              <strong>{{ eventDate(row) }}</strong>
              <small>{{ eventTime(row) }} · {{ weekdayText(row) }}</small>
            </span>
            <el-button link type="primary" @click="openBlock(row)">{{ t('admin.supplierAvailability.edit') }}</el-button>
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
        </div>
      </div>
      <div v-if="total > pageSize" class="avail-pager">
        <el-pagination layout="prev, pager, next" :current-page="page" :page-size="pageSize" :total="total" @current-change="changePage" />
      </div>
    </section>

    <el-dialog v-model="blockOpen" :title="blockForm.id ? t('admin.supplierAvailability.blockEdit') : t('admin.supplierAvailability.blockCreate')" width="min(640px, calc(100vw - 32px))" :close-on-click-modal="false">
      <div class="block-form">
        <label>
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
        <label v-if="!blockForm.fullDay">
          <span>{{ t('admin.supplierAvailability.time') }}</span>
          <div class="hours-form__range">
            <el-time-select v-model="blockForm.startTime" start="00:00" step="00:30" end="23:30" />
            <em>–</em>
            <el-time-select v-model="blockForm.endTime" start="00:00" step="00:30" end="23:30" />
          </div>
        </label>
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
        <el-button type="primary" :loading="blockSaving" @click="saveBlock">{{ t('admin.supplierAvailability.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="hoursOpen" :title="t('admin.supplierAvailability.hoursTitle')" width="min(520px, calc(100vw - 32px))" :close-on-click-modal="false">
      <div class="hours-form">
        <label>
          <span>{{ t('admin.supplierAvailability.workingHours') }}</span>
          <div class="hours-form__range">
            <el-time-select v-model="draft.start" start="06:00" step="00:30" end="23:00" />
            <em>–</em>
            <el-time-select v-model="draft.end" start="06:00" step="00:30" end="23:30" />
          </div>
        </label>
        <label>
          <span>{{ t('admin.supplierAvailability.maxJobs') }}</span>
          <el-input-number v-model="draft.concurrent" :min="0" :precision="0" controls-position="right" />
        </label>
        <label class="hours-form__switch">
          <span>
            <strong>{{ t('admin.supplierAvailability.saturday') }}</strong>
            <small>{{ t('admin.supplierAvailability.saturdayHint') }}</small>
          </span>
          <el-switch v-model="draft.saturday" />
        </label>
        <label class="hours-form__switch">
          <span>
            <strong>{{ t('admin.supplierAvailability.sunday') }}</strong>
            <small>{{ t('admin.supplierAvailability.sundayHint') }}</small>
          </span>
          <el-switch v-model="draft.sunday" />
        </label>
      </div>
      <template #footer>
        <el-button @click="hoursOpen = false">{{ t('admin.supplierAvailability.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveHours">{{ t('admin.supplierAvailability.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="calendarOpen" :title="t('admin.supplierAvailability.calendarTitle')" width="min(720px, calc(100vw - 32px))">
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { supplierEventSave } from '@/modules/admin/api/supplierWorkbench'
import { useAdminSessionStore } from '@/modules/admin/stores/session'
import {
  ALL_AVAILABILITY_SCOPE,
  availabilityScopePayload,
  availabilityScopeSelection,
  updateAvailabilityScopeSelection,
  type AvailabilityScopeValue,
} from '@/modules/admin/utils/availabilityScope'

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
  enabled: boolean
  acceptDispatch: boolean
  dispatchSaving: boolean
  canToggle: boolean
  start: string
  end: string
  concurrent: number
  saturday: boolean
  sunday: boolean
  saving: boolean
  services?: { spuId: number; name: string }[]
  areas?: { areaId: number; areaName: string }[]
  coverageRows?: CoverageRow[]
  coverageLoading?: boolean
}>()

const emit = defineEmits<{
  'save-hours': [payload: { start: string; end: string; concurrent: number; saturday: boolean; sunday: boolean }]
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
  defaultSchedule: '默认排班',
  editSchedule: '编辑排班',
  blockedTime: '不可用时间',
  viewCalendar: '查看日历',
  addBlockedTime: '添加不可用时间',
  zones: '区域',
  communities: '已覆盖小区',
  fullCoverage: '全部覆盖',
  partialCoverage: '部分覆盖',
  activeCoverage: '已覆盖',
  inactiveCoverage: '未覆盖',
} : {
  workspace: 'Coverage & Availability',
  acceptingNewJobs: 'Accepting New Jobs',
  serviceCoverage: 'Service Coverage',
  manageCoverage: 'Manage Coverage',
  defaultSchedule: 'Default Schedule',
  editSchedule: 'Edit Schedule',
  blockedTime: 'Blocked Time',
  viewCalendar: 'View Calendar',
  addBlockedTime: 'Add Blocked Time',
  zones: 'Zones',
  communities: 'Communities covered',
  fullCoverage: 'Full coverage',
  partialCoverage: 'Partial coverage',
  activeCoverage: 'Covered',
  inactiveCoverage: 'Not covered',
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
const hourText = computed(() => (props.start && props.end ? `${props.start} – ${props.end}` : '—'))
const workingDaysText = computed(() => {
  if (props.saturday && props.sunday) return t('admin.supplierAvailability.daysAll')
  if (props.saturday) return t('admin.supplierAvailability.daysWithSaturday')
  if (props.sunday) return t('admin.supplierAvailability.daysWithSunday')
  return t('admin.supplierAvailability.daysWeek')
})

const loading = ref(false)
const loadError = ref('')
const allEvents = ref<SupplierEvent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 8
const hoursOpen = ref(false)
const blockOpen = ref(false)
const blockSaving = ref(false)
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
const draft = reactive({ start: '', end: '', concurrent: 0, saturday: false, sunday: false })

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

const openHours = () => {
  draft.start = props.start || '08:00'
  draft.end = props.end || '20:00'
  draft.concurrent = props.concurrent || 0
  draft.saturday = props.saturday
  draft.sunday = props.sunday
  hoursOpen.value = true
}
const saveHours = () => {
  if (!draft.start || !draft.end || draft.start >= draft.end) {
    ElMessage.warning(t('admin.supplierAvailability.hoursInvalid'))
    return
  }
  emit('save-hours', {
    start: draft.start,
    end: draft.end,
    concurrent: Number(draft.concurrent || 0),
    saturday: draft.saturday,
    sunday: draft.sunday,
  })
  hoursOpen.value = false
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
.availability-control h2 { margin: 0; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: clamp(29px, 3.2vw, 40px); font-weight: 520; line-height: 1.05; letter-spacing: -.035em; }
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

.availability-overview { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr); gap: 18px; min-width: 0; }
.workspace-card { min-width: 0; overflow: hidden; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 20px; box-shadow: 0 12px 34px rgba(5, 21, 43, .045); }
.workspace-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px; border-bottom: 1px solid #eee3d3; }
.workspace-card__header > div:first-child { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.workspace-card__header > div:first-child > div { min-width: 0; }
.workspace-card__index { display: grid; flex: 0 0 34px; place-items: center; width: 34px; height: 34px; color: #8d5a32; background: #f4eadc; border-radius: 10px; font-family: Fraunces, Georgia, serif; font-size: 11px; font-weight: 700; }
.workspace-card h2 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 24px; font-weight: 520; line-height: 1.12; letter-spacing: -.025em; }
.workspace-card__header p { margin: 5px 0 0; color: #74685a; font-size: 12px; line-height: 1.45; }
.workspace-card__header :deep(.el-button) { flex: 0 0 auto; min-height: 38px; border-color: #d8c8b2; border-radius: 10px; color: #05152b; background: #fff; font-weight: 650; }
.workspace-card__header :deep(.el-button--primary) { color: #fffdf8; background: #05152b; border-color: #05152b; }

.coverage-totals { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 16px 20px 10px; }
.coverage-totals > div { min-width: 0; padding: 13px 14px; background: #f7f3ec; border: 1px solid #eee2d1; border-radius: 13px; }
.coverage-totals span, .schedule-summary span { display: block; color: #8a7d70; font-size: 9px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
.coverage-totals strong { display: block; margin-top: 6px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 25px; font-weight: 520; line-height: 1; }
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

.schedule-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 16px 20px 20px; }
.schedule-summary article { min-width: 0; padding: 16px; background: #fff; border: 1px solid #eee2d1; border-radius: 14px; }
.schedule-summary__capacity { grid-column: 1 / -1; background: linear-gradient(135deg, #f7f3ec, #fffdf8) !important; }
.schedule-summary strong { display: block; margin-top: 8px; color: #05152b; font-size: 17px; font-weight: 680; line-height: 1.35; overflow-wrap: anywhere; }

.blocked-card__header { align-items: center; }
.blocked-card__tools { display: flex; align-items: center; justify-content: flex-end; gap: 9px; min-width: 0; color: #74685a; font-size: 11px; white-space: nowrap; }
.avail-table { width: 100%; --el-table-header-bg-color: #f7f3ec; --el-table-bg-color: transparent; --el-table-row-hover-bg-color: #fbf7f0; }
.avail-table :deep(th.el-table__cell) { color: #74685a; font-size: 10px; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; }
.avail-table :deep(td.el-table__cell) { color: #28384d; font-size: 12px; vertical-align: top; }
.avail-table :deep(.cell) { line-height: 1.45; overflow-wrap: anywhere; }
.tag-row { display: flex; flex-wrap: wrap; gap: 5px; min-width: 0; }
.tag-row em { max-width: 100%; padding: 3px 7px; overflow: hidden; border-radius: 999px; background: #f7f3ec; color: #05152b; font-style: normal; font-size: 10px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
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
.hours-form label, .block-form > label:not(.hours-form__switch) { display: flex; flex-direction: column; gap: 8px; }
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
.cal-nav strong { color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 22px; font-weight: 520; }
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
  .coverage-totals, .schedule-summary { grid-template-columns: minmax(0, 1fr); }
  .schedule-summary__capacity { grid-column: auto; }
  .blocked-cards dl { grid-template-columns: minmax(0, 1fr); }
  .blocked-cards__reason { grid-column: auto; }
  .hours-form__range { grid-template-columns: minmax(0, 1fr); }
  .hours-form__range em { display: none; }
}
</style>
