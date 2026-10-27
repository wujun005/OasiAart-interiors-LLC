<template>
  <section class="staff-orders">
    <div v-if="!detailOpen" class="staff-orders__list">
      <header class="staff-workspace">
        <div>
          <p class="staff-workspace__eyebrow">{{ t('admin.supplierOrders.staffEyebrow') }}</p>
          <h1>{{ t('admin.supplierOrders.staffTitle') }}</h1>
          <p class="staff-workspace__hint">{{ t('admin.supplierOrders.staffHint') }}</p>
        </div>
        <span class="staff-workspace__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="15" rx="3" /><path d="M9 6V3h6v3M8 12l3 3 5-5" /></svg>
        </span>
      </header>

      <div class="staff-orders__bar">
        <form class="staff-orders__search" role="search" @submit.prevent="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <input
            v-model.trim="keyword"
            type="search"
            enterkeyhint="search"
            :aria-label="t('admin.supplierOrders.searchOrder')"
            :placeholder="t('admin.supplierOrders.searchOrder')"
          />
          <button type="submit">{{ t('admin.supplierOrders.search') }}</button>
        </form>
        <div class="staff-orders__stages" role="tablist" :aria-label="t('admin.supplierOrders.serviceStatus')">
          <button
            v-for="stage in stages"
            :id="'staff-stage-' + stage.value"
            :key="stage.value"
            type="button"
            role="tab"
            :aria-selected="orderStage === stage.value"
            aria-controls="staff-order-results"
            :class="{ 'is-on': orderStage === stage.value }"
            @click="changeStage(stage.value)"
          >{{ stage.label }}<b v-if="stage.count != null">{{ stage.count }}</b></button>
        </div>
      </div>

      <div class="staff-orders__results-heading" aria-live="polite">
        <strong>{{ stages.find(stage => stage.value === orderStage)?.label }}</strong>
        <span>{{ loading ? t('admin.supplierOrders.loading') : t(total === 1 ? 'admin.supplierOrders.resultsOne' : 'admin.supplierOrders.results', { count: total }) }}</span>
      </div>
      <div id="staff-order-results" role="tabpanel" :aria-labelledby="'staff-stage-' + orderStage" :aria-busy="loading">
        <div v-if="loading" class="staff-orders__cards staff-orders__skeletons" role="status">
          <span class="staff-sr-only">{{ t('admin.supplierOrders.loading') }}</span>
          <article v-for="index in 3" :key="index" class="staff-card staff-skeleton" aria-hidden="true">
            <i /><i /><i /><i />
          </article>
        </div>
        <div v-else-if="failed" class="staff-state staff-state--error" role="alert">
          <span class="staff-state__icon" aria-hidden="true">!</span>
          <h2>{{ t('admin.supplierOrders.loadFailed') }}</h2>
          <button class="staff-primary" type="button" @click="loadOrders">{{ t('admin.common.refresh') }}</button>
        </div>
        <div v-else-if="!orders.length" class="staff-state">
          <span class="staff-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="17" rx="3" /><path d="M8 2v4M16 2v4M8 11h8M8 15h5" /></svg>
          </span>
          <h2>{{ t(keyword || orderStage !== 'all' ? 'admin.supplierOrders.emptyFiltered' : 'admin.supplierOrders.empty') }}</h2>
          <p>{{ t(keyword || orderStage !== 'all' ? 'admin.supplierOrders.filterHint' : 'admin.supplierOrders.emptyHint') }}</p>
          <button v-if="keyword || orderStage !== 'all'" class="staff-ghost" type="button" @click="keyword = ''; orderStage = 'all'; search()">{{ t('admin.supplierOrders.resetFilters') }}</button>
          <button v-else class="staff-ghost" type="button" @click="loadOrders">{{ t('admin.common.refresh') }}</button>
        </div>
        <div v-else class="staff-orders__cards">
          <article v-for="row in orders" :key="visitKey(row)" class="staff-card" :class="{ 'staff-card--cancelled': cancelled(row) }">
            <button type="button" class="staff-card__open" @click="openDetail(row)">
              <span class="staff-card__top">
                <span class="staff-card__no">{{ row.orderNo || '—' }}</span>
                <em class="staff-status" :class="statusClass(row)">{{ statusText(row) }}</em>
              </span>
              <strong class="staff-card__title">{{ serviceTitle(row) }}</strong>
              <span v-if="packageOrderTitle(row)" class="staff-card__spec staff-card__package">{{ packageOrderTitle(row) }}</span>
              <span v-if="packageVisitText(row)" class="staff-card__spec staff-card__package">{{ packageVisitText(row) }}</span>
              <span v-if="assignedStaffText(row)" class="staff-card__spec">{{ t('admin.supplierOrders.assignedStaff') }} · {{ assignedStaffText(row) }}</span>
              <span v-if="specText(row) !== '—'" class="staff-card__spec">{{ specText(row) }}</span>
              <span class="staff-card__schedule">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 11h16" /></svg>
                <strong>{{ row.serviceDate || '—' }}</strong>
                <span>{{ startTime(row.serviceTime) || '—' }}</span>
              </span>
              <span class="staff-card__place">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <span>{{ placeText(row) }}</span>
              </span>
              <span v-if="cancelled(row)" class="staff-notice staff-notice--cancelled">
                {{ row.cancelReason ? t('admin.supplierOrders.cancelReason', { reason: row.cancelReason }) : t('admin.supplierOrders.orderCancelled') }}
              </span>
              <span v-else-if="rescheduleUnread(row)" class="staff-notice">
                {{ t('admin.supplierOrders.rescheduleNotice') }}
              </span>
            </button>
            <div class="staff-card__actions">
              <span class="staff-card__price"><small>{{ t('admin.supplierOrders.price') }}</small><strong><small v-if="money(row.quotePrice) !== '—'">AED</small> {{ money(row.quotePrice) }}</strong></span>
              <div>
                <a v-if="navigateUrl(row)" class="staff-nav staff-nav--icon" :href="navigateUrl(row)" target="_blank" rel="noopener noreferrer" :aria-label="t('admin.supplierOrders.navigateGoogle')" :title="t('admin.supplierOrders.navigateGoogle')">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-6 18-4-8-8-4 18-6Z" /></svg>
                </a>
                <button type="button" class="staff-card__detail" @click="openDetail(row)">
                  {{ t('admin.supplierOrders.viewDetail') }}
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
      <footer v-if="total > pageSize && !failed" class="staff-orders__pager">
        <button type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">{{ t('admin.supplierOrders.prevPage') }}</button>
        <span>{{ page }} <small>/ {{ pageCount }}</small></span>
        <button type="button" :disabled="page >= pageCount || loading" @click="changePage(page + 1)">{{ t('admin.supplierOrders.nextPage') }}</button>
      </footer>
    </div>

    <article v-else class="staff-detail">
      <header class="staff-detail__bar">
        <button type="button" class="staff-detail__back" :disabled="actionBusy" @click="closeDetail">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
          {{ t('admin.supplierOrders.backToList') }}
        </button>
        <span>{{ t('admin.supplierOrders.detailTitle') }}</span>
      </header>
      <div v-if="detailLoading" class="staff-state" role="status" aria-busy="true">
        <span class="staff-state__icon staff-spinner" aria-hidden="true" />
        <p>{{ t('admin.supplierOrders.loading') }}</p>
      </div>
      <div v-else-if="detailFailed || !detailReady" class="staff-state staff-state--error" role="alert">
        <span class="staff-state__icon" aria-hidden="true">!</span>
        <h2>{{ t('admin.supplierOrders.detailFailed') }}</h2>
        <p>{{ t('admin.supplierOrders.retryDetailHint') }}</p>
        <button class="staff-primary" type="button" @click="retryDetail">{{ t('admin.common.refresh') }}</button>
      </div>
      <template v-else>
        <section class="staff-detail__hero">
          <div class="staff-detail__hero-top"><span>{{ t('admin.supplierOrders.assignedOrder') }}</span><em class="staff-status" :class="statusClass(order)">{{ statusText(order) }}</em></div>
          <h1>{{ serviceTitle(order) }}</h1>
          <p v-if="packageOrderTitle(order) || packageVisitText(order)" class="staff-detail__package">
            <template v-if="packageOrderTitle(order)">{{ packageOrderTitle(order) }}</template>
            <template v-if="packageOrderTitle(order) && packageVisitText(order)"> · </template>
            {{ packageVisitText(order) }}
          </p>
          <p class="staff-detail__no">{{ order?.orderNo || '—' }}</p>
          <p v-if="cancelled(order)" class="staff-notice staff-notice--cancelled">{{ order?.cancelReason ? t('admin.supplierOrders.cancelReason', { reason: order.cancelReason }) : t('admin.supplierOrders.orderCancelled') }}</p>
          <p v-else-if="order?.rescheduled" class="staff-notice">{{ t('admin.supplierOrders.rescheduleNotice') }}</p>
        </section>

        <div class="staff-detail__grid">
          <section class="staff-section staff-section--schedule">
            <div class="staff-section__heading"><span class="staff-section__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 11h16" /></svg></span><h2>{{ t('admin.supplierOrders.scheduleBlock') }}</h2></div>
            <div class="staff-appointment">
              <strong>{{ order?.serviceDate || '—' }}</strong>
              <span>{{ startTime(order?.serviceTime) || '—' }} <small>{{ t('admin.supplierOrders.timezone') }}</small></span>
            </div>
            <div class="staff-location">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <div><span>{{ t('admin.supplierOrders.address') }}</span><p>{{ placeText(order) }}</p></div>
            </div>
            <a v-if="navigateUrl(order)" class="staff-map-link" :href="navigateUrl(order)" target="_blank" rel="noopener noreferrer">{{ t('admin.supplierOrders.navigateGoogle') }} <span aria-hidden="true">↗</span></a>
          </section>

          <section class="staff-section">
            <div class="staff-section__heading"><span class="staff-section__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="15" rx="3" /><path d="M9 6V3h6v3M4 11h16" /></svg></span><h2>{{ t('admin.supplierOrders.servicePlan') }}</h2></div>
            <dl class="staff-facts">
              <div><dt>{{ t('admin.supplierOrders.assignedStaff') }}</dt><dd>{{ assignedStaffText(order) || t('admin.supplierOrders.assignedStaffEmpty') }}</dd></div>
              <div><dt>{{ t('admin.supplierOrders.specs') }}</dt><dd>{{ specText(order) }}</dd></div>
              <div><dt>{{ t('admin.supplierOrders.addons') }}</dt><dd>{{ addonText(order) }}</dd></div>
              <div class="staff-facts__price"><dt>{{ t('admin.supplierOrders.price') }}</dt><dd><small v-if="money(order?.quotePrice) !== '—'">AED</small> {{ money(order?.quotePrice) }}</dd></div>
            </dl>
          </section>

          <section class="staff-section">
            <div class="staff-section__heading"><span class="staff-section__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2c2 3 3 4 5 5l2-3 5 2v4c-8 2-17-7-15-15Z" /></svg></span><h2>{{ t('admin.supplierOrders.contactBlock') }}</h2></div>
            <dl class="staff-facts">
              <div><dt>{{ t('admin.supplierOrders.phones') }}</dt><dd>{{ phones(order).join(' · ') || '—' }}</dd></div>
              <div v-if="order?.customerPhoneTail"><dt>{{ t('admin.supplierOrders.customerTail') }}</dt><dd>{{ order.customerPhoneTail }}</dd></div>
              <div><dt>{{ t('admin.supplierOrders.customerRemark') }}</dt><dd>{{ order?.remark || '—' }}</dd></div>
              <div v-if="order?.additionalNotes"><dt>{{ t('admin.supplierOrders.additionalNotes') }}</dt><dd>{{ order.additionalNotes }}</dd></div>
            </dl>
            <p class="staff-section__hint">{{ t('admin.supplierOrders.contactHint') }}</p>
          </section>

          <section class="staff-section">
            <div class="staff-section__heading"><span class="staff-section__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span><h2>{{ t('admin.supplierOrders.progressTitle') }}</h2></div>
            <ol v-if="!cancelled(order)" class="staff-progress">
              <li
                v-for="(item, index) in [{ step: 0, label: t('admin.supplierOrders.notStarted') }, { step: 4, label: t('admin.supplierOrders.accepted') }, { step: 3, label: t('admin.supplierOrders.departed') }, { step: 1, label: t('admin.supplierOrders.arrived') }, { step: 2, label: t('admin.supplierOrders.completed') }]"
                :key="item.step"
                :class="{ 'is-current': step(order) === item.step, 'is-past': [0, 4, 3, 1, 2].indexOf(step(order)) > index }"
                :aria-current="step(order) === item.step ? 'step' : undefined"
              ><span aria-hidden="true">{{ [0, 4, 3, 1, 2].indexOf(step(order)) > index ? '✓' : index + 1 }}</span><strong>{{ item.label }}</strong></li>
            </ol>
            <p v-else class="staff-notice staff-notice--cancelled">{{ t('admin.supplierOrders.orderCancelled') }}</p>
            <p class="staff-section__hint">{{ t('admin.supplierOrders.progressHint') }}</p>
          </section>
        </div>

        <footer class="staff-detail__foot" :aria-busy="actionBusy">
          <span class="staff-detail__foot-status"><small>{{ t('admin.supplierOrders.serviceStatus') }}</small><strong>{{ statusText(order) }}</strong></span>
          <div class="staff-detail__foot-actions">
            <a v-if="navigateUrl(order)" class="staff-nav" :href="navigateUrl(order)" target="_blank" rel="noopener noreferrer">{{ t('admin.supplierOrders.navigateGoogle') }}</a>
            <button v-if="canAct(order, 0)" type="button" class="staff-danger" :disabled="actionBusy" @click="reject(order)">{{ t('admin.supplierOrders.rejectAction') }}</button>
            <button v-if="canAct(order, 0)" type="button" class="staff-primary" :disabled="actionBusy" @click="accept(order)">{{ t(actionBusy ? 'admin.supplierOrders.actionPending' : 'admin.supplierOrders.acceptAction') }}</button>
            <button v-else-if="canAct(order, 4)" type="button" class="staff-primary" :disabled="actionBusy" @click="depart(order)">{{ t(actionBusy ? 'admin.supplierOrders.actionPending' : 'admin.supplierOrders.departAction') }}</button>
            <button v-else-if="canAct(order, 3)" type="button" class="staff-primary" :disabled="actionBusy" @click="openAction(order, 'arrive')">{{ t('admin.supplierOrders.arriveAction') }}</button>
            <button v-else-if="canAct(order, 1)" type="button" class="staff-primary" :disabled="actionBusy" @click="openAction(order, 'complete')">{{ t('admin.supplierOrders.completeAction') }}</button>
            <span v-else class="staff-detail__no-action">{{ t('admin.supplierOrders.noAction') }}</span>
          </div>
        </footer>
      </template>
    </article>

    <el-dialog
      v-model="action.open"
      class="staff-action"
      :title="action.mode === 'arrive' ? t('admin.supplierOrders.arriveTitle') : t('admin.supplierOrders.completeTitle')"
      width="min(520px, calc(100vw - 24px))"
      :close-on-click-modal="!action.saving && !action.uploading"
      :close-on-press-escape="!action.saving && !action.uploading"
      :show-close="!action.saving && !action.uploading"
      append-to-body
    >
      <p class="staff-action__hint">{{ t('admin.supplierOrders.evidenceHint') }}</p>
      <label class="staff-action__note">
        <span>{{ t('admin.supplierOrders.remark') }}<small>{{ action.remark.length }}/512</small></span>
        <textarea v-model="action.remark" :disabled="action.saving" maxlength="512" rows="3" :placeholder="t('admin.supplierOrders.remarkPlaceholder')" />
      </label>
      <div class="staff-action__photos-label"><strong>{{ t('admin.supplierOrders.photos') }}</strong><span>{{ action.photos.length }}/20</span></div>
      <ul v-if="action.photos.length" class="staff-action__photos">
        <li v-for="(photo, index) in action.photos" :key="photo.url + index">
          <img :src="photo.url" :alt="photo.name" />
          <span :title="photo.name">{{ photo.name }}</span>
          <button type="button" :disabled="action.saving || action.uploading" :aria-label="t('admin.supplierOrders.removePhoto', { name: photo.name })" @click="removePhoto(index)">×</button>
        </li>
      </ul>
      <label class="staff-action__pick" :class="{ 'is-disabled': action.uploading || action.saving }">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple :disabled="action.uploading || action.saving" @change="addPhotos" />
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" /></svg>
        {{ t(action.uploading ? 'admin.supplierOrders.uploadingPhotos' : 'admin.supplierOrders.addPhoto') }}
      </label>
      <p class="staff-action__format">{{ t('admin.supplierOrders.photoFormatHint') }}</p>
      <template #footer>
        <el-button :disabled="action.saving || action.uploading" @click="closeAction">{{ t('admin.supplierPricing.cancel') }}</el-button>
        <el-button type="primary" :loading="action.saving" :disabled="action.uploading" @click="submitAction">{{ t('admin.supplierOrders.confirm') }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  supplierAccept,
  supplierReject,
  supplierArrive,
  supplierAssignedOrderDetail,
  supplierAssignedOrders,
  supplierComplete,
  supplierDepart,
  uploadFile,
} from '@/modules/admin/api/supplierWorkbench'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import { packageVisitProgress, supplierMineCounts } from '@/modules/admin/utils/supplier-mine'
import { googleNavigateUrl } from '@/modules/admin/utils/supplierMap'

type Stage = 'all' | 'newRequests' | 'upcoming' | 'inProgress' | 'completed' | 'cancelled'

const { t, locale } = useI18n({ useScope: 'global' })
const keyword = ref('')
const orderStage = ref<Stage>('all')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const failed = ref(false)
const orders = ref<any[]>([])
const order = ref<any>(null)
const detailOpen = ref(false)
const detailLoading = ref(false)
const detailFailed = ref(false)
const actionBusy = ref(false)
type VisitIds = { orderId: number; fulfillmentId?: number }
const detailTarget = ref<VisitIds | null>(null)
let listRequest = 0
let detailRequest = 0
let actionSession = 0
let disposed = false
const action = reactive({
  open: false,
  mode: 'arrive' as 'arrive' | 'complete',
  orderId: 0,
  fulfillmentId: undefined as number | undefined,
  remark: '',
  photos: [] as Array<{ name: string; url: string }>,
  uploading: false,
  saving: false,
})

const stageCounts = ref<Partial<Record<Stage, number>>>({})
const stages = computed(() => [
  { value: 'all' as Stage, label: t('admin.supplierPortal.allOrders'), count: null as number | null },
  { value: 'newRequests' as Stage, label: t('admin.supplierPortal.newRequests'), count: stageCounts.value.newRequests ?? null },
  { value: 'upcoming' as Stage, label: t('admin.supplierPortal.upcoming'), count: stageCounts.value.upcoming ?? null },
  { value: 'inProgress' as Stage, label: t('admin.supplierPortal.inProgress'), count: stageCounts.value.inProgress ?? null },
  { value: 'completed' as Stage, label: t('admin.supplierPortal.completed'), count: stageCounts.value.completed ?? null },
  { value: 'cancelled' as Stage, label: t('admin.supplierPortal.cancelled'), count: null as number | null },
])
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const stageParam = (stage: Stage) => {
  if (stage === 'newRequests') return 'NEW'
  if (stage === 'upcoming') return 'UPCOMING'
  if (stage === 'inProgress') return 'IN_PROGRESS'
  if (stage === 'completed') return 'COMPLETED'
  if (stage === 'cancelled') return 'CANCELLED'
  return undefined
}
const positiveId = (value: unknown) => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return 0
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}
const idsOf = (row: any): VisitIds => {
  const orderId = positiveId(row?.orderId)
  // Keep an explicitly invalid fulfillment ID invalid instead of silently acting on the whole order.
  const fulfillmentId = row?.fulfillmentId == null ? undefined : positiveId(row.fulfillmentId)
  return {
    orderId,
    ...(fulfillmentId !== undefined ? { fulfillmentId } : {}),
  }
}
const validIds = (ids: VisitIds) => ids.orderId > 0 && ids.fulfillmentId !== 0
const sameVisit = (left: VisitIds | null, right: VisitIds | null) => !!left && !!right
  && left.orderId === right.orderId && left.fulfillmentId === right.fulfillmentId
const detailReady = computed(() => detailOpen.value && !detailLoading.value && !detailFailed.value
  && !!order.value && validIds(idsOf(order.value)))
const visitKey = (row: any) => {
  const ids = idsOf(row)
  return `${ids.orderId}-${ids.fulfillmentId || ''}-${row?.serviceDate || ''}-${row?.serviceTime || ''}`
}
const localized = (value: unknown, plain?: unknown) => {
  locale.value
  if (value && typeof value === 'object') {
    const record = { ...(value as Record<string, unknown>) }
    delete record.remarkI18n
    const nested = record.nameI18n
    const source = nested && typeof nested === 'object' ? nested as Record<string, unknown> : record
    const text = pickI18nText(source, locale.value, '')
    if (text) return text
  } else if (value != null && value !== '') {
    return String(value)
  }
  const fallback = plain == null ? '' : String(plain).trim()
  return fallback || '—'
}
const serviceTitle = (row: any) => localized(row?.spuNameI18n, row?.spuName)
const packageOrderTitle = (row: any) => {
  if (row?.packageOrder !== true && Number(row?.orderType) !== 2) return ''
  const name = localized(row?.packageNameI18n, row?.packageName)
  return name === '—' ? '' : name
}
const packageVisitText = (row: any) => {
  const visit = packageVisitProgress(row)
  if (!visit) return ''
  if (visit.seq != null && visit.total != null) return t('admin.supplierOrders.packageVisit', visit)
  if (visit.seq != null) return t('admin.supplierOrders.packageVisitSeq', visit)
  return t('admin.supplierOrders.packageVisitTotal', visit)
}
const assignedStaffText = (row: any) => {
  const list = Array.isArray(row?.assignedStaff) ? row.assignedStaff : []
  return list.map((item: any) => String(item?.name || item?.phone || '').trim()).filter(Boolean).join('、')
}
const specText = (row: any) => {
  const specs = Array.isArray(row?.specs) ? row.specs : []
  const text = specs.map((spec: any) => [localized(spec?.typeNameI18n, spec?.typeName), localized(spec?.valueNameI18n, spec?.valueName)]
    .filter((part) => part && part !== '—').join(': ')).filter(Boolean)
  if (text.length) return text.join('; ')
  return row?.specDescription || '—'
}
const addonText = (row: any) => {
  const attaches = Array.isArray(row?.attaches) ? row.attaches : []
  if (!attaches.length) {
    const extra = String(row?.additionalItems || '').trim()
    return !extra || extra === 'None' ? t('admin.supplierOrders.noAddons') : extra
  }
  return attaches.map((item: any) => {
    const name = localized(item?.nameI18n, item?.name)
    if (!name || name === '—') return ''
    const unit = localized(item?.unitI18n, item?.unit)
    const labeled = unit && unit !== '—' ? `${name} / ${unit}` : name
    const quantity = Number(item?.quantity)
    return quantity > 1 ? `${labeled} × ${quantity}` : labeled
  }).filter(Boolean).join(', ') || t('admin.supplierOrders.noAddons')
}
const startTime = (value?: string) => {
  const text = String(value || '').trim()
  const matched = text.match(/^(\d{1,2}:\d{2})\s*[-~–—～]\s*\d{1,2}:\d{2}$/)
  if (!matched) return text
  const [hour, minute] = matched[1].split(':')
  return `${hour.padStart(2, '0')}:${minute}`
}
const whenText = (row: any) => [row?.serviceDate, startTime(row?.serviceTime)].filter(Boolean).join(', ') || '—'
const placeText = (row: any) => [row?.serviceAddress, row?.building, row?.roomNo, row?.community]
  .map((part) => String(part || '').trim()).filter(Boolean)
  .filter((part, index, list) => {
    const segments = part.toLowerCase().split(',').map((value) => value.trim()).filter(Boolean)
    return !list.slice(0, index).some((previous) => {
      const existing = previous.toLowerCase().split(',').map((value) => value.trim())
      return segments.every((segment) => existing.includes(segment))
    })
  })
  .join(', ') || '—'
const phones = (row: any) => (Array.isArray(row?.contactPhones) ? row.contactPhones : [])
  .map((phone: unknown) => String(phone || '').trim()).filter(Boolean)
const money = (value: unknown) => {
  if (value == null || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const step = (row: any) => {
  if (row?.serviceStatus == null || row.serviceStatus === '') return -1
  const status = Number(row?.serviceStatus)
  return [0, 1, 2, 3, 4].includes(status) ? status : -1
}
const cancelled = (row: any) => [3, 4, 5].includes(Number(row?.orderStatus))
  || Number(row?.scheduleStatus) === 2 || String(row?.supplierStage || '').toUpperCase() === 'CANCELLED'
const canAct = (row: any, expectedStep?: number) => detailReady.value && row === order.value
  && sameVisit(idsOf(row), detailTarget.value) && !cancelled(row) && Number(row?.orderStatus) === 1
  && (expectedStep === undefined ? [0, 4, 3, 1].includes(step(row)) : step(row) === expectedStep)
const rescheduleUnread = (row: any) => row?.rescheduled === true && row?.rescheduleRead !== true
const statusText = (row: any) => {
  if (cancelled(row)) return t('admin.supplierPortal.cancelled')
  const serviceStatus = localized(row?.serviceStatusI18n)
  if (serviceStatus !== '—') return serviceStatus
  if (step(row) === 4) return t('admin.supplierOrders.accepted')
  if (step(row) === 3) return t('admin.supplierOrders.departed')
  if (step(row) === 1) return t('admin.supplierOrders.arrived')
  if (step(row) === 2) return t('admin.supplierOrders.completed')
  if (step(row) === 0) return t('admin.supplierOrders.notStarted')
  const localizedStage = localized(row?.supplierStageI18n)
  if (localizedStage !== '—') return localizedStage
  const code = String(row?.supplierStage || '').toUpperCase()
  if (code === 'NEW') return t('admin.supplierPortal.newRequests')
  if (code === 'UPCOMING') return t('admin.supplierPortal.upcoming')
  if (code === 'IN_PROGRESS') return t('admin.supplierPortal.inProgress')
  if (code === 'COMPLETED') return t('admin.supplierPortal.completed')
  if (code === 'CANCELLED') return t('admin.supplierPortal.cancelled')
  return t('admin.supplierOrders.noAction')
}
const statusClass = (row: any) => {
  const code = String(row?.supplierStage || '').toUpperCase()
  if (code === 'CANCELLED' || cancelled(row)) return 'is-danger'
  if (code === 'COMPLETED' || step(row) === 2) return 'is-done'
  if (code === 'IN_PROGRESS' || code === 'UPCOMING' || [4, 3, 1].includes(step(row))) return 'is-live'
  return 'is-new'
}
const navigateUrl = (row: any) => googleNavigateUrl(row)

const loadOrders = async () => {
  const request = ++listRequest
  loading.value = true
  failed.value = false
  try {
    const result = unwrap(await supplierAssignedOrders({
      orderNo: keyword.value || undefined,
      supplierStage: stageParam(orderStage.value),
      pageNum: page.value,
      pageSize,
    }))
    if (disposed || request !== listRequest) return
    stageCounts.value = supplierMineCounts(result)
    const count = Number(result?.total || 0)
    total.value = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0
    // A status change can remove the last row from a filtered last page.
    if (page.value > pageCount.value) {
      page.value = pageCount.value
      await loadOrders()
      return
    }
    orders.value = Array.isArray(result?.list) ? result.list : []
  } catch (error: any) {
    if (disposed || request !== listRequest) return
    orders.value = []
    total.value = 0
    stageCounts.value = {}
    failed.value = true
    ElMessage.error(error?.message || t('admin.supplierOrders.loadFailed'))
  } finally {
    if (!disposed && request === listRequest) loading.value = false
  }
}
const search = () => {
  page.value = 1
  loadOrders()
}
const changeStage = (stage: Stage) => {
  if (orderStage.value === stage) return
  orderStage.value = stage
  page.value = 1
  loadOrders()
}
const changePage = (next: number) => {
  if (loading.value || !Number.isInteger(next) || next < 1 || next > pageCount.value) return
  page.value = next
  loadOrders()
}
const fetchDetail = async (ids: VisitIds) => {
  const request = ++detailRequest
  detailTarget.value = ids
  order.value = null
  detailOpen.value = true
  detailFailed.value = false
  detailLoading.value = true
  try {
    if (!validIds(ids)) throw new Error(t('admin.supplierOrders.detailFailed'))
    const detail = unwrap(await supplierAssignedOrderDetail(ids.orderId, ids.fulfillmentId))
    if (disposed || request !== detailRequest || !detailOpen.value) return
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)
      || (detail.orderId != null && positiveId(detail.orderId) !== ids.orderId)
      || (detail.fulfillmentId != null && (!positiveId(detail.fulfillmentId)
        || (ids.fulfillmentId !== undefined && positiveId(detail.fulfillmentId) !== ids.fulfillmentId)))) {
      throw new Error(t('admin.supplierOrders.detailFailed'))
    }
    // Older detail responses may omit fulfillmentId; never lose the selected visit context.
    const resolvedIds = {
      orderId: ids.orderId,
      fulfillmentId: ids.fulfillmentId ?? (detail.fulfillmentId == null ? undefined : positiveId(detail.fulfillmentId)),
    }
    detailTarget.value = resolvedIds
    order.value = { ...detail, ...resolvedIds }
  } catch (error: any) {
    if (disposed || request !== detailRequest || !detailOpen.value) return
    order.value = null
    detailFailed.value = true
    ElMessage.error(error?.message || t('admin.supplierOrders.detailFailed'))
  } finally {
    if (!disposed && request === detailRequest) detailLoading.value = false
  }
}
const openDetail = async (row: any) => {
  if (actionBusy.value || action.uploading || action.saving) return
  await fetchDetail(idsOf(row))
}
const retryDetail = async () => {
  if (actionBusy.value || detailLoading.value || !detailTarget.value) return
  await fetchDetail(detailTarget.value)
}
const closeDetail = () => {
  if (actionBusy.value || action.uploading || action.saving) return
  action.open = false
  detailRequest += 1
  detailOpen.value = false
  detailLoading.value = false
  detailFailed.value = false
  detailTarget.value = null
  order.value = null
  loadOrders()
}
const refreshAfterAction = async (ids: VisitIds) => {
  if (disposed) return
  await Promise.all([
    loadOrders(),
    detailOpen.value && sameVisit(detailTarget.value, ids) ? fetchDetail(ids) : Promise.resolve(),
  ])
}
const reject = async (row: any) => {
  if (actionBusy.value || action.open || !canAct(row, 0)) return
  const ids = idsOf(row)
  if (!validIds(ids)) return
  actionBusy.value = true
  try {
    let reason = ''
    try {
      const result = await ElMessageBox.prompt(
        t('admin.supplierOrders.rejectConfirm', { orderNo: row?.orderNo || ids.orderId }),
        t('admin.supplierOrders.rejectTitle'),
        {
          type: 'warning',
          confirmButtonText: t('admin.supplierOrders.rejectAction'),
          cancelButtonText: t('admin.supplierPricing.cancel'),
          inputPlaceholder: t('admin.supplierOrders.rejectReasonPlaceholder'),
          inputValidator: (value) => String(value || '').trim().length <= 512 || t('admin.supplierOrders.rejectTooLong'),
        },
      )
      reason = String(result.value || '').trim()
    } catch {
      return
    }
    if (disposed || !canAct(row, 0)) return
    await supplierReject({ ...ids, ...(reason ? { rejectReason: reason } : {}) })
    if (disposed) return
    ElMessage.success(t('admin.supplierOrders.rejectSaved'))
    detailOpen.value = false
    order.value = null
    await loadOrders()
  } catch (error: any) {
    if (!disposed) ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    actionBusy.value = false
  }
}
const accept = async (row: any) => {
  if (actionBusy.value || action.open || !canAct(row, 0)) return
  const ids = idsOf(row)
  actionBusy.value = true
  try {
    try {
      await ElMessageBox.confirm(
        t('admin.supplierOrders.acceptConfirm', { orderNo: row?.orderNo || ids.orderId }),
        t('admin.supplierOrders.acceptTitle'),
        { type: 'warning', confirmButtonText: t('admin.supplierOrders.acceptAction') },
      )
    } catch {
      return
    }
    if (disposed || !canAct(row, 0)) return
    await supplierAccept(ids)
    if (disposed) return
    ElMessage.success(t('admin.supplierOrders.acceptSaved'))
    await refreshAfterAction(ids)
  } catch (error: any) {
    if (!disposed) ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    actionBusy.value = false
  }
}
const depart = async (row: any) => {
  if (actionBusy.value || action.open || !canAct(row, 4)) return
  const ids = idsOf(row)
  actionBusy.value = true
  try {
    try {
      await ElMessageBox.confirm(
        t('admin.supplierOrders.departConfirm', { orderNo: row?.orderNo || '—' }),
        t('admin.supplierOrders.departTitle'),
        { confirmButtonText: t('admin.supplierOrders.departAction') },
      )
    } catch {
      return
    }
    if (disposed || !canAct(row, 4)) return
    await supplierDepart(ids)
    if (disposed) return
    ElMessage.success(t('admin.supplierOrders.departSaved'))
    await refreshAfterAction(ids)
  } catch (error: any) {
    if (!disposed) ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    actionBusy.value = false
  }
}
const openAction = (row: any, mode: 'arrive' | 'complete') => {
  if (actionBusy.value || action.open || !canAct(row, mode === 'arrive' ? 3 : 1)) return
  const ids = idsOf(row)
  actionSession += 1
  action.mode = mode
  action.orderId = ids.orderId
  action.fulfillmentId = ids.fulfillmentId
  action.remark = ''
  action.photos = []
  action.open = true
}
const closeAction = () => {
  if (actionBusy.value || action.uploading || action.saving) return
  action.open = false
}
const removePhoto = (index: number) => {
  if (!action.open || actionBusy.value || action.uploading || action.saving || !Number.isInteger(index)) return
  if (index >= 0 && index < action.photos.length) action.photos.splice(index, 1)
}
watch(() => action.open, (open, previous) => {
  if (open || !previous) return
  // A dismissed picker must not append its late upload result into the next action dialog.
  actionSession += 1
  action.orderId = 0
  action.fulfillmentId = undefined
  action.remark = ''
  action.photos = []
  action.uploading = false
  action.saving = false
}, { flush: 'sync' })
const addPhotos = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files || [])
  input.value = ''
  if (!action.open || action.uploading || action.saving || actionBusy.value || !picked.length) return
  if (!canAct(order.value, action.mode === 'arrive' ? 3 : 1)) return
  const room = 20 - action.photos.length
  if (room <= 0 || picked.length > room) {
    ElMessage.warning(t('admin.supplierOrders.photoLimit'))
    if (room <= 0) return
  }
  const valid = picked.filter((file) => /^(image\/(jpeg|png|webp|gif))$/i.test(file.type)
    && file.size > 0 && file.size <= 10 * 1024 * 1024)
  if (valid.length !== picked.length) ElMessage.warning(t('admin.supplierOrders.photoInvalid'))
  if (!valid.length) return
  const session = actionSession
  action.uploading = true
  try {
    for (const file of valid.slice(0, Math.max(room, 0))) {
      if (disposed || session !== actionSession || !action.open) return
      const uploaded = unwrap(await uploadFile(file))
      if (disposed || session !== actionSession || !action.open) return
      const url = typeof uploaded === 'string' ? uploaded.trim() : String(uploaded?.url || '').trim()
      if (!url) throw new Error(t('admin.supplierProfile.uploadFailed'))
      action.photos.push({ name: file.name, url })
    }
  } catch (error: any) {
    if (!disposed && session === actionSession && action.open) {
      ElMessage.error(error?.message || t('admin.supplierProfile.uploadFailed'))
    }
  } finally {
    if (!disposed && session === actionSession) action.uploading = false
  }
}
const submitAction = async () => {
  if (!action.open || actionBusy.value || action.saving || action.uploading) return
  const ids = idsOf(action)
  const mode = action.mode
  if (!validIds(ids) || !sameVisit(ids, detailTarget.value) || !canAct(order.value, mode === 'arrive' ? 3 : 1)) return
  if (action.photos.length > 20 || action.remark.trim().length > 512) {
    ElMessage.warning(t('admin.supplierOrders.actionFailed'))
    return
  }
  const session = actionSession
  actionBusy.value = true
  action.saving = true
  const payload = {
    ...ids,
    photos: action.photos.map((photo) => photo.url),
    remark: action.remark.trim() || null,
  }
  try {
    if (mode === 'arrive') await supplierArrive(payload)
    else await supplierComplete(payload)
    if (disposed) return
    ElMessage.success(t(mode === 'arrive' ? 'admin.supplierOrders.arriveSaved' : 'admin.supplierOrders.completeSaved'))
    if (session !== actionSession) {
      await refreshAfterAction(ids)
      return
    }
    action.open = false
    await refreshAfterAction(ids)
  } catch (error: any) {
    if (!disposed && session === actionSession) ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    actionBusy.value = false
    if (!disposed && session === actionSession) action.saving = false
  }
}

onMounted(loadOrders)
onBeforeUnmount(() => {
  disposed = true
  listRequest += 1
  detailRequest += 1
  actionSession += 1
})
</script>

<style scoped>
.staff-orders {
  --staff-ink: #0c2038;
  --staff-muted: #718093;
  --staff-line: #e4e9ef;
  --staff-gold: #b79052;
  min-height: calc(100dvh - 48px);
  background: #f4f6f8;
  color: var(--staff-ink);
  font-size: 14px;
  line-height: 1.5;
}
.staff-orders *, .staff-orders *::before, .staff-orders *::after { box-sizing: border-box; }
.staff-orders button, .staff-orders input, .staff-orders textarea { font: inherit; }
.staff-orders button, .staff-orders a { -webkit-tap-highlight-color: transparent; }
.staff-orders button { cursor: pointer; }
.staff-orders button:disabled { cursor: wait; }
.staff-orders button:focus-visible, .staff-orders a:focus-visible, .staff-action__pick:focus-within { outline: 3px solid #b7905270; outline-offset: 3px; }
.staff-orders svg, .staff-action svg { width: 20px; height: 20px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.staff-orders__list { width: min(1160px, 100%); margin: auto; padding: 22px 24px 28px; }
.staff-workspace { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 154px; padding: 26px 30px; overflow: hidden; border-radius: 20px; background: linear-gradient(115deg, #0c2038, #193a58); color: white; }
.staff-workspace::after { position: absolute; right: -55px; bottom: -125px; width: 290px; height: 290px; border: 1px solid #ffffff10; border-radius: 50%; content: ''; pointer-events: none; }
.staff-workspace__eyebrow { margin: 0 0 8px; color: #d3b57e; font-size: 10px; font-weight: 750; letter-spacing: .14em; }
.staff-workspace h1 { margin: 0; font-size: 27px; font-weight: 750; line-height: 1.25; letter-spacing: -.035em; }
.staff-workspace__hint { max-width: 500px; margin: 10px 0 0; color: #c1cdd8; font-size: 12px; line-height: 1.65; }
.staff-workspace__mark { display: grid; flex-shrink: 0; width: 66px; height: 66px; place-items: center; border: 1px solid #ffffff24; border-radius: 19px; background: #ffffff08; color: #d3b57e; transform: rotate(-6deg); }
.staff-workspace__mark svg { width: 32px; height: 32px; stroke-width: 1.35; }
.staff-orders__bar { position: sticky; top: 0; z-index: 5; padding: 18px 0 0; background: #f4f6f8f5; backdrop-filter: blur(12px); }
.staff-orders__search { display: flex; align-items: center; gap: 10px; height: 46px; padding: 4px 5px 4px 14px; border: 1px solid var(--staff-line); border-radius: 12px; background: white; box-shadow: 0 3px 10px #0c203804; }
.staff-orders__search svg { width: 17px; height: 17px; color: #8b97a5; }
.staff-orders__search input { flex: 1; min-width: 0; width: 100%; height: 100%; padding: 0; border: 0; border-radius: 0; outline: none; background: transparent; color: var(--staff-ink); font-size: 13px; }
.staff-orders__search:focus-within { border-color: var(--staff-gold); box-shadow: 0 0 0 3px #b7905214; }
.staff-orders__search input::placeholder { color: #929eab; }
.staff-orders__search button { align-self: stretch; min-width: 64px; padding: 0 17px; border: 0; border-radius: 8px; background: var(--staff-ink); color: white; font-size: 12px; font-weight: 650; }
.staff-orders__stages { display: flex; gap: 24px; min-width: 0; margin-top: 7px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--staff-line); }
.staff-orders__stages::-webkit-scrollbar { display: none; }
.staff-orders__stages button { position: relative; flex: 0 0 auto; min-height: 49px; padding: 0 1px; border: 0; background: transparent; color: var(--staff-muted); font-size: 12px; font-weight: 600; white-space: nowrap; }
.staff-orders__stages button.is-on { color: var(--staff-ink); font-weight: 750; }
.staff-orders__stages b { margin-left: 4px; font-weight: 750; }
.staff-card__package, .staff-detail__package { color: #8d5a32; font-weight: 650; }
.staff-orders__stages button.is-on::after { position: absolute; right: 0; bottom: 0; left: 0; height: 3px; border-radius: 3px; background: var(--staff-gold); content: ''; }
.staff-orders__results-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 19px 1px 13px; }
.staff-orders__results-heading strong { font-size: 14px; font-weight: 700; }
.staff-orders__results-heading > span { color: var(--staff-muted); font-size: 11px; }
.staff-orders__cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.staff-card { min-width: 0; overflow: hidden; border: 1px solid var(--staff-line); border-radius: 16px; background: white; box-shadow: 0 4px 14px #0c203803; transition: border-color .16s, box-shadow .16s; }
.staff-card:hover { border-color: #c8d3de; box-shadow: 0 6px 20px #0c203808; }
.staff-card__open { display: flex; flex-direction: column; align-items: stretch; gap: 0; width: 100%; padding: 17px 17px 14px; border: 0; background: none; color: inherit; text-align: left; }
.staff-card__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 13px; }
.staff-card__no { min-width: 0; overflow: hidden; color: #84909f; font-size: 11px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.staff-status { display: inline-flex; align-items: center; flex-shrink: 0; gap: 5px; max-width: 60%; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-style: normal; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; }
.staff-status::before { width: 4px; height: 4px; flex-shrink: 0; border-radius: 50%; background: currentColor; content: ''; }
.is-new { background: #fff4e5; color: #9b6b26; }
.is-live { background: #edf3fa; color: #3a628b; }
.is-done { background: #eaf5ee; color: #36734e; }
.is-danger { background: #fcf0ef; color: #a85c58; }
.staff-card__title { display: -webkit-box; margin-bottom: 6px; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: var(--staff-ink); font-size: 16px; line-height: 1.4; font-weight: 720; overflow-wrap: anywhere; }
.staff-card__spec { display: -webkit-box; min-height: 18px; overflow: hidden; -webkit-line-clamp: 1; -webkit-box-orient: vertical; color: #8a94a2; font-size: 11px; line-height: 1.5; }
.staff-card__schedule { display: flex; align-items: center; gap: 8px; margin-top: 13px; padding: 9px 11px; border-radius: 8px; background: #f5f7f9; color: #52677b; font-size: 12px; font-variant-numeric: tabular-nums; }
.staff-card__schedule svg { width: 15px; height: 15px; color: #8e9cab; }
.staff-card__schedule strong { color: #334c63; font-weight: 650; }
.staff-card__schedule > span { margin-left: auto; color: var(--staff-ink); font-weight: 700; }
.staff-card__place { display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; color: #6a7a8b; font-size: 11px; line-height: 1.55; }
.staff-card__place svg { width: 15px; height: 15px; margin-top: 1px; color: #8e9cab; }
.staff-card__place > span { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
.staff-card__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 17px; border-top: 1px solid #edf0f4; }
.staff-card__actions > div { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.staff-card__price { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.staff-card__price > small { color: #939eab; font-size: 10px; }
.staff-card__price strong { color: var(--staff-ink); font-size: 16px; font-weight: 750; font-variant-numeric: tabular-nums; }
.staff-card__price strong small { font-size: 9px; font-weight: 600; }
.staff-card__detail { display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 40px; padding: 0 12px; border: 0; border-radius: 9px; background: var(--staff-ink); color: white; font-size: 11px; font-weight: 650; }
.staff-card__detail svg { width: 13px; height: 13px; }
.staff-nav { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 14px; border: 1px solid #d9e1e9; border-radius: 10px; background: white; color: #314d67; font-size: 12px; font-weight: 650; line-height: 1.35; text-align: center; text-decoration: none; }
.staff-nav--icon { width: 40px; min-height: 40px; padding: 0; border: 1px solid #dfe6ec; background: #f8fafb; }
.staff-nav--icon svg { width: 17px; height: 17px; }
.staff-notice { display: block; margin: 13px 0 0; padding: 9px 11px; border: 1px solid #f3e6cf; border-radius: 8px; background: #fdf8ed; color: #9a773d; font-size: 11px; line-height: 1.55; overflow-wrap: anywhere; }
.staff-notice--cancelled { border-color: #f0dfdd; background: #fcf4f3; color: #aa6661; }
.staff-orders__pager { display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 22px; }
.staff-orders__pager button { min-height: 40px; padding: 0 14px; border: 1px solid #dce3eb; border-radius: 10px; background: white; color: #485e73; font-size: 12px; }
.staff-orders__pager button:disabled { cursor: not-allowed; opacity: .4; }
.staff-orders__pager > span { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.staff-orders__pager small { color: var(--staff-muted); font-size: 12px; font-weight: 400; }
.staff-state { display: grid; min-height: 310px; align-content: center; justify-items: center; gap: 12px; padding: 30px 20px; text-align: center; }
.staff-state__icon { display: grid; width: 56px; height: 56px; margin-bottom: 4px; place-items: center; border: 1px solid #e0e6ed; border-radius: 17px; background: #edf1f5; color: #8a9bab; font-size: 24px; }
.staff-state__icon svg { width: 25px; height: 25px; stroke-width: 1.4; }
.staff-state h2 { margin: 0; color: #485e73; font-size: 16px; font-weight: 650; }
.staff-state p { max-width: 340px; margin: 0; color: #8492a1; font-size: 12px; }
.staff-state--error .staff-state__icon { border-color: #f0ddda; background: #fcf0ee; color: #b1796c; }
.staff-primary, .staff-ghost, .staff-danger { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: 10px 18px; border: 1px solid var(--staff-ink); border-radius: 10px; background: var(--staff-ink); color: white; font-size: 12px; line-height: 1.35; font-weight: 650; text-align: center; }
.staff-danger { background: #fff; color: #b42318; border-color: #e7b4ae; }
.staff-danger:disabled { opacity: .65; }
.staff-primary:disabled { opacity: .65; }
.staff-ghost { border-color: #d9e1e9; background: white; color: #485e73; }
.staff-skeleton { display: grid; gap: 15px; height: 255px; padding: 22px 17px; }
.staff-skeleton i { display: block; height: 16px; border-radius: 5px; background: linear-gradient(100deg, #f1f4f7 30%, #f9fafb 50%, #f1f4f7 70%); background-size: 200% 100%; animation: staff-shimmer 1.5s linear infinite; }
.staff-skeleton i:first-child { width: 45%; height: 11px; }
.staff-skeleton i:nth-child(2) { width: 80%; }
.staff-skeleton i:nth-child(3) { height: 36px; }
.staff-skeleton i:nth-child(4) { width: 65%; }
.staff-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
.staff-detail { width: min(1080px, 100%); min-height: calc(100dvh - 48px); margin: auto; padding: 0 24px calc(120px + env(safe-area-inset-bottom)); }
.staff-detail__bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 60px; background: #f4f6f8f5; backdrop-filter: blur(12px); color: #83909e; font-size: 11px; }
.staff-detail__back { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; padding: 0 5px 0 0; border: 0; background: none; color: #3f566c; font-size: 12px; font-weight: 600; }
.staff-detail__back:disabled { opacity: .5; }
.staff-detail__back svg { width: 17px; height: 17px; }
.staff-detail__hero { padding: 24px 26px; border: 1px solid var(--staff-line); border-radius: 16px; background: white; }
.staff-detail__hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #8a96a3; font-size: 10px; letter-spacing: .02em; }
.staff-detail h1 { margin: 14px 0 7px; color: var(--staff-ink); font-size: 25px; line-height: 1.35; font-weight: 750; letter-spacing: -.025em; overflow-wrap: anywhere; }
.staff-detail__no { margin: 0; color: #8a96a3; font-size: 12px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.staff-detail__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 14px; margin-top: 14px; }
.staff-section { min-width: 0; padding: 22px; border: 1px solid var(--staff-line); border-radius: 16px; background: white; }
.staff-section__heading { display: flex; align-items: center; gap: 9px; margin-bottom: 17px; }
.staff-section__heading h2 { margin: 0; color: #2b4259; font-size: 14px; font-weight: 700; }
.staff-section__icon { display: grid; width: 29px; height: 29px; flex-shrink: 0; place-items: center; border-radius: 8px; background: #f1f4f7; color: #657c91; }
.staff-section__icon svg { width: 16px; height: 16px; stroke-width: 1.6; }
.staff-appointment { display: grid; gap: 4px; padding-bottom: 17px; border-bottom: 1px solid #eef1f4; font-variant-numeric: tabular-nums; }
.staff-appointment > strong { color: #223c54; font-size: 22px; font-weight: 700; }
.staff-appointment > span { color: var(--staff-ink); font-size: 16px; font-weight: 650; }
.staff-appointment small { margin-left: 6px; color: #97a2ae; font-size: 10px; font-weight: 400; }
.staff-location { display: flex; align-items: flex-start; gap: 10px; margin-top: 18px; }
.staff-location > svg { width: 17px; height: 17px; margin-top: 2px; color: #91a0ae; }
.staff-location > div { min-width: 0; }
.staff-location span { color: #94a0ac; font-size: 11px; }
.staff-location p { margin: 4px 0 0; color: #4a6177; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.staff-map-link { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 42px; margin-top: 16px; padding: 0 13px; border: 1px solid #e0e7ed; border-radius: 9px; background: #f9fafb; color: #496681; font-size: 11px; font-weight: 650; text-decoration: none; }
.staff-map-link span { font-size: 17px; }
.staff-facts { display: grid; gap: 16px; margin: 0; }
.staff-facts > div { display: grid; gap: 5px; }
.staff-facts dt { color: #93a0ad; font-size: 11px; }
.staff-facts dd { margin: 0; color: #425a70; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.staff-facts__price { grid-template-columns: 1fr auto; align-items: baseline; padding-top: 15px; border-top: 1px solid #edf1f4; }
.staff-facts__price dd { color: var(--staff-ink); font-size: 23px; line-height: 1; font-weight: 750; font-variant-numeric: tabular-nums; }
.staff-facts__price dd small { font-size: 10px; font-weight: 600; }
.staff-section__hint { margin: 17px 0 0; color: #94a0ad; font-size: 10px; line-height: 1.65; }
.staff-progress { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.staff-progress li { position: relative; display: flex; align-items: center; gap: 12px; min-height: 40px; color: #a1acb7; font-size: 12px; }
.staff-progress li:not(:last-child)::after { position: absolute; top: 31px; left: 11px; height: 18px; border-left: 1px solid #e5eaf0; content: ''; }
.staff-progress li > span { position: relative; z-index: 1; display: grid; width: 24px; height: 24px; flex-shrink: 0; place-items: center; border: 1px solid #e4e9ef; border-radius: 50%; background: #fafbfc; color: #aab3bd; font-size: 10px; font-weight: 600; }
.staff-progress li > strong { font-weight: 500; }
.staff-progress li.is-past { color: #5e778a; }
.staff-progress li.is-past > span { border-color: #dfe9e5; background: #edf5f0; color: #55806a; }
.staff-progress li.is-current { color: var(--staff-ink); }
.staff-progress li.is-current > span { border-color: var(--staff-ink); background: var(--staff-ink); color: white; box-shadow: 0 0 0 4px #0c20380a; }
.staff-progress li.is-current > strong { font-weight: 700; }
.staff-detail__foot { position: fixed; right: 0; bottom: 14px; left: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 20px; width: min(1032px, calc(100% - 48px)); margin: auto; padding: 14px 18px; border: 1px solid #dfe5ec; border-radius: 14px; background: #fffffff5; box-shadow: 0 -4px 28px #0c20380b; backdrop-filter: blur(16px); }
.staff-detail__foot-status { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.staff-detail__foot-status small { color: #94a0ad; font-size: 10px; }
.staff-detail__foot-status strong { color: #3b536a; font-size: 12px; font-weight: 650; }
.staff-detail__foot-actions { display: flex; align-items: center; gap: 9px; }
.staff-detail__foot-actions > button, .staff-detail__foot-actions > a { min-width: 130px; max-width: 260px; }
.staff-detail__no-action { padding: 10px 4px; color: #8492a0; font-size: 12px; text-align: center; }
.staff-spinner { width: 30px; height: 30px; border: 2px solid #dfe6ed; border-top-color: var(--staff-ink); border-radius: 50%; background: none; animation: staff-spin .8s linear infinite; }
:global(.staff-action.el-dialog) { --el-dialog-padding-primary: 20px; max-height: calc(100dvh - 32px); margin: max(16px, 7vh) auto 16px; overflow-y: auto; border-radius: 18px; background: white; color: #425a70; }
:global(.staff-action .el-dialog__title) { color: #0c2038; font-size: 17px; font-weight: 700; }
.staff-action__hint { margin: 0 0 20px; padding: 11px 13px; border-radius: 10px; background: #f5f7f9; color: #8491a0; font-size: 12px; line-height: 1.65; }
.staff-action__note { display: grid; gap: 8px; }
.staff-action__note > span { display: flex; justify-content: space-between; color: #425a70; font-size: 12px; font-weight: 650; }
.staff-action__note small { color: #9ba7b4; font-size: 10px; font-weight: 400; }
.staff-action__note textarea { display: block; width: 100%; padding: 11px 12px; border: 1px solid #dce3eb; border-radius: 10px; outline: none; resize: vertical; color: #425a70; font: inherit; font-size: 13px; line-height: 1.6; box-sizing: border-box; }
.staff-action__note textarea:focus { border-color: #b79052; box-shadow: 0 0 0 3px #b7905212; }
.staff-action__photos-label { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 20px 0 9px; font-size: 12px; }
.staff-action__photos-label > span { color: #9ba7b4; font-size: 10px; }
.staff-action__photos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; margin: 0 0 12px; padding: 0; list-style: none; }
.staff-action__photos li { position: relative; min-width: 0; overflow: hidden; border: 1px solid #e5eaf0; border-radius: 10px; background: #f8fafb; }
.staff-action__photos img { display: block; width: 100%; height: 80px; object-fit: cover; }
.staff-action__photos li > span { display: block; overflow: hidden; padding: 6px 8px; color: #7c8d9e; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.staff-action__photos button { position: absolute; top: 4px; right: 4px; display: grid; width: 24px; height: 24px; padding: 0; place-items: center; border: 1px solid #ffffff80; border-radius: 50%; background: #142033c9; color: white; font-size: 18px; line-height: 1; cursor: pointer; }
.staff-action__photos button:disabled { opacity: .4; cursor: wait; }
.staff-action__pick { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 47px; margin-top: 9px; overflow: hidden; border: 1px dashed #c7d2dd; border-radius: 10px; background: #fafbfc; color: #536f87; font-size: 12px; font-weight: 650; cursor: pointer; }
.staff-action__pick input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.staff-action__pick svg { width: 18px; height: 18px; }
.staff-action__pick.is-disabled { opacity: .6; cursor: wait; }
.staff-action__format { margin: 8px 0 0; color: #9ba7b4; font-size: 10px; line-height: 1.6; }
:global(.staff-action .el-dialog__footer) { display: flex; gap: 9px; padding-top: 22px; }
:global(.staff-action .el-dialog__footer .el-button) { flex: 1; min-height: 42px; margin: 0; border-radius: 10px; }
:global(.staff-action .el-dialog__footer .el-button--primary) { --el-color-primary: #0c2038; --el-color-primary-light-3: #294760; --el-color-primary-dark-2: #07182b; }
@keyframes staff-shimmer { to { background-position: -200% 0; } }
@keyframes staff-spin { to { transform: rotate(360deg); } }
@media (min-width: 1100px) {
  .staff-orders__cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .staff-orders__list { padding: 14px 14px 24px; }
  .staff-workspace { min-height: 133px; gap: 14px; padding: 22px; border-radius: 16px; }
  .staff-workspace h1 { font-size: 24px; }
  .staff-workspace__mark { width: 48px; height: 48px; border-radius: 14px; }
  .staff-workspace__mark svg { width: 27px; height: 27px; }
  .staff-workspace__hint { margin-top: 8px; font-size: 11px; }
  .staff-orders__bar { padding-top: 14px; }
  .staff-orders__stages { gap: 23px; }
  .staff-orders__cards { grid-template-columns: 1fr; gap: 12px; }
  .staff-card__open { padding: 16px 16px 14px; }
  .staff-card__actions { padding: 11px 16px; }
  .staff-detail { padding: 0 14px calc(140px + env(safe-area-inset-bottom)); }
  .staff-detail__bar { min-height: 54px; }
  .staff-detail__hero { padding: 20px; }
  .staff-detail h1 { font-size: 22px; }
  .staff-detail__grid { grid-template-columns: 1fr; gap: 12px; margin-top: 12px; }
  .staff-section { padding: 19px 20px; }
  .staff-detail__foot { bottom: 0; display: block; width: 100%; padding: 10px max(14px, env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); border: 0; border-top: 1px solid #dfe5ec; border-radius: 0; }
  .staff-detail__foot-status { flex-direction: row; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
  .staff-detail__foot-status small { font-size: 10px; }
  .staff-detail__foot-status strong { font-size: 11px; }
  .staff-detail__foot-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .staff-detail__foot-actions > button, .staff-detail__foot-actions > a { width: 100%; min-width: 0; max-width: none; min-height: 46px; padding: 8px; font-size: 12px; }
  .staff-detail__foot-actions > :only-child { grid-column: 1 / -1; }
}
@media (max-width: 360px) {
  .staff-workspace { padding: 18px; }
  .staff-workspace h1 { font-size: 22px; }
  .staff-workspace__mark { display: none; }
  .staff-orders__stages { gap: 21px; }
  .staff-card__actions { gap: 6px; }
  .staff-card__actions > div { gap: 6px; }
  .staff-card__detail { padding: 0 9px; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .staff-skeleton i, .staff-spinner { animation: none; }
  .staff-card { transition: none; }
}
</style>
