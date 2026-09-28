<template>
  <div class="availability" v-loading="loading">
    <section class="avail-banner" :class="{ 'is-off': !accepting }">
      <div class="avail-banner__main">
        <el-switch :model-value="accepting" :loading="dispatchSaving" :disabled="!canToggle" @change="onDispatch" />
        <div>
          <strong>{{ t('admin.supplierAvailability.accepting') }}</strong>
          <p>{{ accepting ? t('admin.supplierAvailability.acceptingHint') : t('admin.supplierAvailability.pausedHint') }}</p>
          <p v-if="!enabled" class="avail-banner__note">{{ t('admin.supplierAvailability.accountOff') }}</p>
        </div>
      </div>
      <div class="avail-status">
        <span class="avail-mark" aria-hidden="true"></span>
        <div>
          <strong>{{ accepting ? t('admin.supplierAvailability.available') : t('admin.supplierAvailability.unavailable') }}</strong>
          <p>{{ accepting ? t('admin.supplierAvailability.availableHint') : t('admin.supplierAvailability.unavailableHint') }}</p>
        </div>
      </div>
    </section>

    <section class="avail-card">
      <header>
        <div>
          <h2>{{ t('admin.supplierAvailability.hoursTitle') }}</h2>
          <p>{{ t('admin.supplierAvailability.hoursHint') }}</p>
        </div>
        <el-button @click="openHours">{{ t('admin.supplierAvailability.edit') }}</el-button>
      </header>
      <div class="hour-grid">
        <article>
          <span>{{ t('admin.supplierAvailability.workingDays') }}</span>
          <strong>{{ weekend ? t('admin.supplierAvailability.daysAll') : t('admin.supplierAvailability.daysWeek') }}</strong>
        </article>
        <article>
          <span>{{ t('admin.supplierAvailability.workingHours') }}</span>
          <strong>{{ hourText }}</strong>
        </article>
        <article>
          <span>{{ t('admin.supplierAvailability.maxJobs') }}</span>
          <strong>{{ t('admin.supplierAvailability.jobsValue', { count: concurrent }) }}</strong>
        </article>
      </div>
    </section>

    <section class="avail-card">
      <header>
        <div>
          <h2>{{ t('admin.supplierAvailability.blockTitle') }}</h2>
          <p>{{ t('admin.supplierAvailability.blockHint') }}</p>
        </div>
        <div class="avail-card__tools">
          <span v-if="!loadError">{{ t('admin.supplierAvailability.count', { count: total }) }}</span>
          <el-button @click="calendarOpen = true">{{ t('admin.supplierAvailability.calendar') }}</el-button>
          <el-button type="primary" @click="openBlock()">{{ t('admin.supplierAvailability.addBlock') }}</el-button>
        </div>
      </header>
      <el-table :data="events" class="avail-table" row-key="id" :empty-text="loadError ? t('admin.supplierAvailability.loadFailed') : t('admin.supplierAvailability.empty')">
        <el-table-column :label="t('admin.supplierAvailability.date')" min-width="180">
          <template #default="{ row }">{{ eventDate(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.time')" min-width="140">
          <template #default="{ row }">{{ eventTime(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.service')" min-width="180">
          <template #default="{ row }">
            <div class="tag-row">
              <em v-if="!row.services?.length">{{ t('admin.supplierAvailability.allServices') }}</em>
              <em v-for="service in row.services" v-else :key="service.spuId">{{ service.serviceName || service.spuId }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.area')" min-width="160">
          <template #default="{ row }">
            <div class="tag-row">
              <em v-if="!row.areas?.length">{{ t('admin.supplierAvailability.allAreas') }}</em>
              <em v-for="area in row.areas" v-else :key="area.areaId">{{ area.areaName || area.areaId }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.reason')" min-width="160">
          <template #default="{ row }">{{ row.reason || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierAvailability.actions')" width="88" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openBlock(row)">{{ t('admin.supplierAvailability.edit') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
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
          <el-select v-model="blockForm.spuIds" multiple filterable clearable collapse-tags :placeholder="t('admin.supplierAvailability.allServices')">
            <el-option v-for="service in serviceChoices" :key="service.spuId" :label="service.name" :value="service.spuId" />
          </el-select>
        </label>
        <label>
          <span>{{ t('admin.supplierAvailability.areaOptional') }}</span>
          <el-select v-model="blockForm.areaIds" multiple filterable clearable collapse-tags :placeholder="t('admin.supplierAvailability.allAreas')">
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
            <strong>{{ t('admin.supplierAvailability.weekend') }}</strong>
            <small>{{ t('admin.supplierAvailability.weekendHint') }}</small>
          </span>
          <el-switch v-model="draft.weekend" />
        </label>
      </div>
      <template #footer>
        <el-button @click="hoursOpen = false">{{ t('admin.supplierAvailability.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveHours">{{ t('admin.supplierAvailability.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="calendarOpen" :title="t('admin.supplierAvailability.calendar')" width="min(720px, calc(100vw - 32px))">
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
          <span>{{ event.reason || eventDate(event) }}</span>
        </li>
      </ul>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { supplierEventPage, supplierEventSave } from '@/modules/admin/api/supplierWorkbench'

type ServiceItem = { spuId: number; serviceName: string }
type AreaItem = { areaId: number; areaName: string }
type SupplierEvent = {
  id: number
  startDate: string
  endDate: string
  fullDay: number
  startTime?: string
  endTime?: string
  services: ServiceItem[]
  areas: AreaItem[]
  reason?: string
}

const props = defineProps<{
  enabled: boolean
  acceptDispatch: boolean
  dispatchSaving: boolean
  canToggle: boolean
  start: string
  end: string
  concurrent: number
  weekend: boolean
  saving: boolean
  services?: { spuId: number; name: string }[]
  areas?: { areaId: number; areaName: string }[]
}>()

const emit = defineEmits<{
  'save-hours': [payload: { start: string; end: string; concurrent: number; weekend: boolean }]
  'toggle-dispatch': [value: boolean]
}>()

const { t, locale } = useI18n({ useScope: 'global' })
const accepting = computed(() => props.acceptDispatch)
const hourText = computed(() => (props.start && props.end ? `${props.start} – ${props.end}` : '—'))

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
  spuIds: [] as number[],
  areaIds: [] as number[],
  reason: '',
})
const calendarOpen = ref(false)
const cursor = ref(new Date())
const pickedDay = ref('')
const draft = reactive({ start: '', end: '', concurrent: 0, weekend: false })

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)

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

const loadEvents = async () => {
  loading.value = true
  try {
    const collected: SupplierEvent[] = []
    let pageNum = 1
    let totalCount = 0
    do {
      const result = unwrap(await supplierEventPage({ pageNum, pageSize: 50 }))
      const list = Array.isArray(result?.list) ? result.list : []
      totalCount = Number(result?.total || 0)
      collected.push(...list)
      if (!list.length) break
      pageNum += 1
    } while (collected.length < totalCount && pageNum <= 8)
    allEvents.value = collected
    total.value = totalCount
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
  draft.weekend = props.weekend
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
    weekend: draft.weekend,
  })
  hoursOpen.value = false
}

const serviceChoices = computed(() => {
  const map = new Map<number, string>()
  for (const service of props.services || []) map.set(service.spuId, service.name)
  for (const service of extraServices.value) if (!map.has(service.spuId)) map.set(service.spuId, service.name)
  return [...map.entries()].map(([spuId, name]) => ({ spuId, name }))
})
const areaChoices = computed(() => {
  const map = new Map<number, string>()
  for (const area of props.areas || []) map.set(area.areaId, area.areaName)
  for (const area of extraAreas.value) if (!map.has(area.areaId)) map.set(area.areaId, area.name)
  return [...map.entries()].map(([areaId, name]) => ({ areaId, name }))
})
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
  blockForm.spuIds = (row?.services || []).map((service) => service.spuId)
  blockForm.areaIds = (row?.areas || []).map((area) => area.areaId)
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
      spuIds: blockForm.spuIds,
      areaIds: blockForm.areaIds,
      reason: reason || null,
    })
    ElMessage.success(t('admin.supplierAvailability.blockSaved'))
    blockOpen.value = false
    page.value = 1
    await loadEvents()
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
  return key >= start && key <= end
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
.availability { display: flex; flex-direction: column; gap: 16px; }
.avail-banner { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 20px; background: #f3f8f4; border: 1px solid #d5eadc; border-radius: 16px; }
.avail-banner.is-off { background: #f7f3ec; border-color: #e6dccb; }
.avail-banner__main, .avail-status { display: flex; align-items: center; gap: 14px; }
.avail-status { padding: 12px 14px; background: #fffdf8; border: 1px solid #d5eadc; border-radius: 14px; }
.avail-banner.is-off .avail-status { border-color: #e6dccb; }
.avail-banner strong { display: block; color: #05152b; font-size: 16px; }
.avail-banner p { margin: 4px 0 0; color: #5f6b62; font-size: 13px; }
.avail-banner__note { color: #8d5a32 !important; }
.avail-mark { width: 14px; height: 14px; border-radius: 50%; background: #1f8a5b; box-shadow: 0 0 0 6px #d9f0e4; }
.avail-banner.is-off .avail-mark { background: #8d5a32; box-shadow: 0 0 0 6px #f3e6d4; }
.avail-card { background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; overflow: hidden; }
.avail-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px 8px; }
.avail-card h2 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 26px; font-weight: 520; letter-spacing: -.03em; }
.avail-card header p { margin: 6px 0 0; color: #74685a; font-size: 13px; line-height: 1.45; }
.avail-card__tools { display: flex; align-items: center; gap: 12px; color: #74685a; font-size: 12px; white-space: nowrap; }
.hour-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 8px 20px 20px; }
.hour-grid article { padding: 16px; background: #fff; border: 1px solid #efe4d4; border-radius: 14px; }
.hour-grid span { display: block; color: #8a7d70; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.hour-grid strong { display: block; margin-top: 8px; color: #05152b; font-size: 18px; font-weight: 650; }
.avail-table { --el-table-header-bg-color: #f7f3ec; --el-table-bg-color: transparent; }
.avail-table :deep(th.el-table__cell) { color: #74685a; font-size: 11px; font-weight: 700; letter-spacing: .06em; }
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-row em { padding: 3px 8px; border-radius: 999px; background: #f7f3ec; color: #05152b; font-style: normal; font-size: 12px; font-weight: 650; }
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
@media (max-width: 820px) {
  .hour-grid, .avail-card header, .avail-banner { grid-template-columns: 1fr; }
  .avail-card header, .avail-banner { flex-direction: column; align-items: stretch; }
}
</style>
