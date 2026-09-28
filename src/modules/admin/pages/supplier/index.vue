<template>
  <div class="supplier-review">
      <header class="supplier-review__head">
        <div>
          <h1>{{ t('admin.platformSuppliers.title') }}</h1>
          <p>{{ t('admin.platformSuppliers.description') }}</p>
        </div>
      </header>

      <section class="board">
        <div class="board__bar">
          <el-input
            v-model.trim="keyword"
            :placeholder="t('admin.platformSuppliers.searchPlaceholder')"
            clearable
            @keyup.enter="search"
            @clear="search"
          />
          <el-select v-model="quoteStatus" filterable :placeholder="t('admin.platformSuppliers.allSuppliers')" @change="search">
            <el-option :label="t('admin.platformSuppliers.allSuppliers')" value="" />
            <el-option :label="t('admin.platformSuppliers.quotePendingFilter')" :value="1" />
            <el-option :label="t('admin.platformSuppliers.quoteDraftFilter')" :value="0" />
            <el-option :label="t('admin.platformSuppliers.quoteApprovedFilter')" :value="2" />
            <el-option :label="t('admin.platformSuppliers.quoteRejectedFilter')" :value="3" />
          </el-select>
          <el-select v-model="onboardingStatus" clearable :placeholder="t('admin.platformSuppliers.onboardingStatus')" class="review-filter" @change="search">
            <el-option :label="t('admin.platformSuppliers.draft')" :value="0" />
            <el-option :label="t('admin.platformSuppliers.pending')" :value="1" />
            <el-option :label="t('admin.platformSuppliers.approved')" :value="2" />
            <el-option :label="t('admin.platformSuppliers.rejected')" :value="3" />
          </el-select>
          <el-select v-model="needReview" clearable :placeholder="t('admin.platformSuppliers.needReview')" class="review-filter" @change="search">
            <el-option :label="t('admin.platformSuppliers.reviewYes')" value="yes" />
            <el-option :label="t('admin.platformSuppliers.reviewNo')" value="no" />
          </el-select>
          <span class="board__count">{{ t('admin.platformSuppliers.supplierCount', { total }) }}</span>
        </div>

        <el-table :data="suppliers" v-loading="loading" row-key="id" :empty-text="t('admin.platformSuppliers.empty')">
          <el-table-column :label="t('admin.platformSuppliers.supplierNo')" min-width="140">
            <template #default="{ row }">
              <el-button link type="primary" @click="openReview(row)">{{ row.supplierNo || row.id }}</el-button>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.supplier')" min-width="180" prop="supplierName" />
          <el-table-column :label="t('admin.platformSuppliers.categories')" min-width="180">
            <template #default="{ row }">
              <div v-if="row.serviceCategories?.length" class="category-tags">
                <el-tag v-for="cat in row.serviceCategories" :key="cat.categoryId" effect="plain">
                  {{ categoryName(cat) }}
                </el-tag>
              </div>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.contact')" min-width="120" prop="contactPerson" />
          <el-table-column :label="t('admin.platformSuppliers.phone')" min-width="140" prop="mobile" />
          <el-table-column :label="t('admin.platformSuppliers.serviceCount')" width="130" prop="serviceCount" />
          <el-table-column :label="t('admin.platformSuppliers.onboarding')" width="140">
            <template #default="{ row }">
              <el-tag :type="quoteTagType(row.onboardingStatus)" effect="light">
                {{ onboardingText(row.onboardingStatus, row.onboardingStatusI18n) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.pendingReview')" width="140">
            <template #default="{ row }">
              <el-tag v-if="row.pendingReview === true" type="warning" effect="light">{{ t('admin.platformSuppliers.yes') }}</el-tag>
              <el-tag v-else-if="row.pendingReview === false" type="info" effect="light">{{ t('admin.platformSuppliers.no') }}</el-tag>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.latestSubmit')" min-width="150">
            <template #default="{ row }">{{ formatTime(row.latestSubmitTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.actions')" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openReview(row)">{{ t('admin.platformSuppliers.review') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          layout="prev, pager, next, total"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          @current-change="changePage"
        />
      </section>

    <el-drawer
      class="supplier-detail-drawer"
      :model-value="Boolean(detailId)"
      :title="profile.companyName || current?.supplierName || t('admin.platformSuppliers.detailTitle')"
      direction="rtl"
      size="min(980px, 100%)"
      @update:model-value="(open: boolean) => { if (!open) backToList() }"
    >
      <el-skeleton v-if="detailLoading" :rows="12" animated />
      <div v-else class="order-detail">
        <header class="order-detail__hero">
          <div>
            <div class="order-detail__eyebrow">{{ t('admin.platformSuppliers.supplierNo') }}</div>
            <h2 class="order-detail__title">{{ profile.supplierNo || current?.supplierNo || '—' }}</h2>
            <p class="order-detail__booked-at">{{ profile.companyName || '—' }}</p>
          </div>
          <div class="order-detail__amount">
            <span>{{ t('admin.platformSuppliers.onboarding') }}</span>
            <el-tag :type="quoteTagType(onboarding.status)" effect="light" round>{{ onboardingLabel(onboarding.status) }}</el-tag>
          </div>
        </header>

        <div v-if="Number(onboarding.status) === 1" class="order-detail__toolbar">
          <el-button type="primary" :loading="saving" @click="approveOnboarding">{{ t('admin.platformSuppliers.approveOnboarding') }}</el-button>
          <el-button type="danger" plain :loading="saving" @click="openReject('onboarding')">{{ t('admin.platformSuppliers.rejectOnboarding') }}</el-button>
        </div>
        <p v-if="onboarding.rejectReason" class="reject-note">{{ t('admin.platformSuppliers.rejectReason', { reason: onboarding.rejectReason }) }}</p>

        <div class="order-detail__columns">
          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>{{ t('admin.platformSuppliers.company') }}</h3>
              <dl class="order-detail__list">
                <div><dt>{{ t('admin.platformSuppliers.licenseNo') }}</dt><dd>{{ text(profile.tradeLicenseNo) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licenseExpiry') }}</dt><dd>{{ text(profile.licenseExpiry) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.vat') }}</dt><dd>{{ text(profile.vatTrn) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.years') }}</dt><dd>{{ text(profile.yearsInBusiness) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.address') }}</dt><dd>{{ text(profile.officeAddress) }}</dd></div>
              </dl>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t('admin.platformSuppliers.documents') }}</h3>
              <div v-for="group in documentGroups" :key="group.label" class="doc-group">
                <div class="doc-group__head">
                  <strong>{{ group.label }}</strong>
                  <span>{{ group.answer }}</span>
                </div>
                <div v-if="group.files.length" class="doc-grid">
                  <figure v-for="file in group.files" :key="file.url" class="doc-card">
                    <el-image
                      v-if="file.kind === 'image'"
                      :src="file.url"
                      :alt="file.name"
                      fit="cover"
                      :preview-src-list="imagePreviewList(group.files)"
                      :initial-index="imagePreviewIndex(group.files, file.url)"
                      preview-teleported
                      :z-index="6000"
                    />
                    <button v-else type="button" class="doc-card__file" @click="openFilePreview(file.url)">
                      {{ file.kind === 'pdf' ? 'PDF' : 'FILE' }}
                    </button>
                    <figcaption>{{ file.name }}</figcaption>
                  </figure>
                </div>
                <p v-else class="doc-empty">{{ t('admin.platformSuppliers.notUploaded') }}</p>
              </div>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t('admin.platformSuppliers.services') }}</h3>
              <el-table :data="services" row-key="spuId" :empty-text="t('admin.platformSuppliers.noServices')">
                <el-table-column :label="t('admin.platformSuppliers.category')" min-width="120">
                  <template #default="{ row }">{{ serviceCategory(row) }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.service')" min-width="140">
                  <template #default="{ row }">{{ serviceName(row) }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.workers')" width="140">
                  <template #default="{ row }">{{ row.workerCount ?? '—' }}</template>
                </el-table-column>
                <el-table-column class-name="phone-col" :label="t('admin.platformSuppliers.phones')" min-width="180">
                  <template #default="{ row }">
                    <div v-if="listedPhones(row.contactPhones).length" class="phone-list">
                      <span v-for="(phone, index) in listedPhones(row.contactPhones)" :key="`${phone}-${index}`">{{ phone }}</span>
                    </div>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.version')" width="90">
                  <template #default="{ row }">{{ row.versionNo || '—' }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.quoteStatus')" width="130">
                  <template #default="{ row }">
                    <el-tag :type="quoteTagType(row.status)" effect="light">{{ quoteStatusLabel(row.status, row.statusI18n) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.actions')" width="180" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="openSkus(row)">{{ t('admin.platformSuppliers.quote') }}</el-button>
                    <el-button v-if="Number(row.status) === 1" link type="primary" :loading="saving" @click="approveQuote(row)">{{ t('admin.platformSuppliers.approve') }}</el-button>
                    <el-button v-if="Number(row.status) === 1" link type="danger" :loading="saving" @click="openReject('quote', row)">{{ t('admin.platformSuppliers.reject') }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>

          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>{{ t('admin.platformSuppliers.contactTitle') }}</h3>
              <dl class="order-detail__list">
                <div><dt>{{ t('admin.platformSuppliers.contact') }}</dt><dd>{{ text(profile.contactPerson) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.phone') }}</dt><dd>{{ text(profile.mobile) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.whatsapp') }}</dt><dd>{{ text(profile.whatsapp) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.email') }}</dt><dd>{{ text(profile.email) }}</dd></div>
              </dl>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t('admin.platformSuppliers.capacity') }}</h3>
              <dl class="order-detail__list">
                <div><dt>{{ t('admin.platformSuppliers.availableWorkers') }}</dt><dd>{{ text(profile.totalAvailableWorkers) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.concurrent') }}</dt><dd>{{ text(profile.maxSimultaneousOrders) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.monthly') }}</dt><dd>{{ text(profile.monthlyCapacity) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.leadTime') }}</dt><dd>{{ profile.minLeadTimeHours == null ? '—' : t('admin.platformSuppliers.leadHours', { hours: profile.minLeadTimeHours }) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.workingHours') }}</dt><dd>{{ text(profile.workingHours) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.weekend') }}</dt><dd>{{ yesNo(profile.weekendService) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.holiday') }}</dt><dd>{{ yesNo(profile.publicHolidayService) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.sameDay') }}</dt><dd>{{ yesNo(profile.sameDayBooking) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.emergency') }}</dt><dd>{{ yesNo(profile.emergencyService) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.femaleStaff') }}</dt><dd>{{ staffText(profile.femaleStaffAvailable, profile.femaleStaffCount) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.maleStaff') }}</dt><dd>{{ staffText(profile.maleStaffAvailable, profile.maleStaffCount) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.ownVehicle') }}</dt><dd>{{ yesNo(profile.ownTransportation) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.ownEquipment') }}</dt><dd>{{ yesNo(profile.ownEquipment) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.taxInvoice') }}</dt><dd>{{ yesNo(profile.taxInvoiceAvailable) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.emaar') }}</dt><dd>{{ yesNo(profile.emaarOnboarded) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.otherCommunity') }}</dt><dd>{{ yesNo(profile.otherCommunityOnboarded) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.otherNote') }}</dt><dd>{{ text(profile.applyRenmark) }}</dd></div>
              </dl>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t('admin.platformSuppliers.serviceAreas') }}</h3>
              <p class="area-text">{{ profile.dubaiServiceAreas || areaNames || '—' }}</p>
            </section>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="filePreview.open"
      class="policy-preview"
      :title="filePreview.name"
      width="min(960px, 92vw)"
      append-to-body
      :z-index="6000"
      destroy-on-close
    >
      <div class="policy-preview__stage">
        <img v-if="filePreview.kind === 'image'" :src="filePreview.url" :alt="filePreview.name" />
        <iframe v-else-if="filePreview.kind === 'pdf'" :src="filePreview.url" :title="filePreview.name" />
        <p v-else>{{ t('admin.platformSuppliers.previewUnsupported') }}</p>
      </div>
    </el-dialog>

    <el-dialog v-model="skuOpen" :title="t('admin.platformSuppliers.quoteTitle', { name: skuTitle })" width="min(1080px, calc(100vw - 32px))" append-to-body>
      <p class="sku-meta">
        {{ quoteStatusLabel(skuStatus, skuStatusI18n) }}
        · {{ skuQuoteMode === 2 ? t('admin.platformSuppliers.unitPrice') : skuQuoteMode === 1 ? t('admin.platformSuppliers.fixedPrice') : t('admin.platformSuppliers.modeUnset') }}
        <span v-if="skuQuoteMode === 2"> {{ t('admin.platformSuppliers.perHour', { price: moneyText(skuUnitPrice) }) }}</span>
        <span v-if="skuRejectReason"> · {{ skuRejectReason }}</span>
      </p>
      <el-table v-loading="skuLoading" :data="skuRows" row-key="skuId" :empty-text="t('admin.platformSuppliers.noSpecs')">
        <el-table-column v-for="column in skuColumns" :key="column.key" :label="column.label" min-width="120">
          <template #default="{ row }">{{ row.specs[column.key] || '—' }}</template>
        </el-table-column>
        <el-table-column v-if="!skuColumns.length" label="SKU" prop="skuCode" min-width="120" />
        <el-table-column :label="t('admin.platformSuppliers.clientPrice')" width="120">
          <template #default="{ row }">{{ moneyText(clientPrice(row)) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.platformSuppliers.effectivePrice')" width="160">
          <template #default="{ row }">{{ moneyText(row.approvedPrice) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.platformSuppliers.staffCount')" width="90">
          <template #default="{ row }">{{ row.staffCount ?? '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.platformSuppliers.durationHours')" width="100">
          <template #default="{ row }">{{ row.serviceHours ?? '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.platformSuppliers.taxQuote')" width="130">
          <template #default="{ row }">{{ moneyText(row.quotePrice) }}</template>
        </el-table-column>
      </el-table>
      <section v-if="skuAttaches.length" class="sku-attaches">
        <h4>{{ t('admin.platformSuppliers.addons') }}</h4>
        <div v-for="item in skuAttaches" :key="item.attachValueId" class="sku-attach">
          <div>
            <strong>{{ item.name }}</strong>
            <small>{{ t('admin.platformSuppliers.addonMeta', { type: item.typeName, platform: moneyText(item.platformPrice), approved: moneyText(item.approvedPrice) }) }}</small>
          </div>
          <span>{{ item.offered ? moneyText(item.quotePrice) : t('admin.platformSuppliers.unavailable') }}</span>
        </div>
      </section>
      <template #footer>
        <el-button @click="skuOpen = false">{{ t('admin.platformSuppliers.close') }}</el-button>
        <el-button v-if="Number(skuStatus) === 1" :loading="saving" @click="approveQuote(skuTarget)">{{ t('admin.platformSuppliers.approve') }}</el-button>
        <el-button v-if="Number(skuStatus) === 1" type="danger" plain :loading="saving" @click="openReject('quote', skuTarget)">{{ t('admin.platformSuppliers.reject') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectOpen" :title="rejectMode === 'onboarding' ? t('admin.platformSuppliers.rejectOnboarding') : t('admin.platformSuppliers.rejectQuote')" width="460px" append-to-body>
      <el-input v-model="rejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="t('admin.platformSuppliers.reasonPlaceholder')" />
      <template #footer>
        <el-button @click="rejectOpen = false">{{ t('admin.platformSuppliers.cancel') }}</el-button>
        <el-button type="danger" :loading="saving" @click="submitReject">{{ t('admin.platformSuppliers.confirmReject') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { listBySpu, listSpuAttachCatalog } from '@/modules/admin/api/spu'
import { getAdminLocale } from '@/modules/admin/locales'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import {
  onboardingChangeStatus,
  onboardingDetail,
  onboardingPage,
  platformSupplierQuotePage,
  platformSupplierQuoteReview,
  platformSupplierQuoteServices,
  platformSupplierQuoteSkus,
  serviceCatalog,
} from '@/modules/admin/api/supplierWorkbench'

type ServiceCategory = {
  categoryId: number
  categoryName?: string
  nameI18n?: Record<string, string>
}

type SupplierRow = {
  id: number
  supplierNo?: string
  supplierName: string
  contactPerson: string
  mobile: string
  serviceCount: number
  serviceCategories?: ServiceCategory[]
  onboardingStatus?: number
  onboardingStatusI18n?: Record<string, string>
  pendingReview?: boolean
  latestSubmitTime?: string
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const keyword = ref('')
const quoteStatus = ref<number | ''>('')
const onboardingStatus = ref<number | '' | null>('')
const needReview = ref<'' | 'yes' | 'no' | null>('')
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const suppliers = ref<SupplierRow[]>([])

const detailId = computed(() => {
  const id = Number(route.query.id)
  return Number.isFinite(id) && id > 0 ? id : 0
})
const detailLoading = ref(false)
const saving = ref(false)
const current = ref<SupplierRow | null>(null)
const profile = reactive<Record<string, any>>({})
const services = ref<any[]>([])
const onboarding = reactive({ status: undefined as number | undefined, rejectReason: '' })
const areaNames = computed(() =>
  (profile.serviceAreas || []).map((area: any) => area.areaName).filter(Boolean).join('、'),
)

type DocFile = { url: string; name: string; kind: 'image' | 'pdf' | 'other' }
const filePreview = reactive({
  open: false,
  url: '',
  name: '',
  kind: 'other' as DocFile['kind'],
})
const text = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value))
const yesNo = (value: unknown) => (Number(value) === 1 ? t('admin.platformSuppliers.yes') : Number(value) === 0 ? t('admin.platformSuppliers.no') : '—')
const staffText = (available: unknown, count: unknown) => {
  if (available === null || available === undefined || available === '') return '—'
  if (Number(available) !== 1 || count === null || count === undefined || count === '') return yesNo(available)
  return t('admin.platformSuppliers.staffLine', { answer: yesNo(available), count })
}
const asFileList = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}
const fileNameFromUrl = (url: string) => {
  const path = decodeURIComponent(url.split('?')[0].split('#')[0])
  return path.split('/').filter(Boolean).pop() || url
}
const fileKind = (url: string): DocFile['kind'] => {
  const name = fileNameFromUrl(url).toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image'
  if (name.endsWith('.pdf')) return 'pdf'
  return 'other'
}
const toDocFiles = (value: unknown): DocFile[] =>
  asFileList(value).map((url) => ({ url, name: fileNameFromUrl(url), kind: fileKind(url) }))
const documentGroups = computed(() => {
  const groups = [
    { label: t('admin.platformSuppliers.publicLiability'), answer: yesNo(profile.publicLiabilityInsurance), files: toDocFiles(profile.publicLiabilityInsuranceFile) },
    { label: t('admin.platformSuppliers.employeeInsurance'), answer: yesNo(profile.employeeInsurance), files: toDocFiles(profile.employeeInsuranceFile) },
  ]
  const extra = profile.extra && typeof profile.extra === 'object' ? profile.extra as Record<string, unknown> : {}
  const extraLabels: Record<string, string> = {
    tradeLicenseFile: t('admin.platformSuppliers.tradeLicense'),
    licenseFile: t('admin.platformSuppliers.tradeLicense'),
    vatFile: t('admin.platformSuppliers.vatCertificate'),
  }
  Object.entries(extra).forEach(([key, value]) => {
    const files = toDocFiles(value).filter((file) => /^https?:\/\//i.test(file.url))
    if (files.length) groups.push({ label: extraLabels[key] || key, answer: '', files })
  })
  return groups
})
const imagePreviewList = (files: DocFile[]) =>
  files.filter((file) => file.kind === 'image').map((file) => file.url)
const imagePreviewIndex = (files: DocFile[], url: string) =>
  Math.max(0, imagePreviewList(files).indexOf(url))
const openFilePreview = (url: string) => {
  filePreview.url = url
  filePreview.name = fileNameFromUrl(url)
  filePreview.kind = fileKind(url)
  filePreview.open = true
}

const skuOpen = ref(false)
const skuLoading = ref(false)
const skuTitle = ref('')
const skuStatus = ref<number | undefined>()
const skuRejectReason = ref('')
const skuTarget = ref<any>(null)
const skuColumns = ref<{ key: string; label: string }[]>([])
const skuRows = ref<any[]>([])
const skuAttaches = ref<Array<{ attachValueId: number; typeName: string; name: string; platformPrice: unknown; approvedPrice: unknown; offered: boolean; quotePrice: unknown }>>([])
const skuQuoteMode = ref<number | null>(null)
const skuUnitPrice = ref<number | null>(null)
const skuStatusI18n = ref<Record<string, string> | null>(null)

const rejectOpen = ref(false)
const rejectMode = ref<'quote' | 'onboarding'>('quote')
const rejectReason = ref('')
const rejectTarget = ref<any>(null)

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const quoteStatusLabel = (status?: number, i18n?: Record<string, unknown> | null) => {
  const localized = specText(i18n)
  if (localized !== '—') return localized
  const keys = ['quoteDraft', 'quotePending', 'quoteApproved', 'quoteRejected']
  const key = keys[Number(status)]
  return key ? t(`admin.platformSuppliers.${key}`) : t('admin.platformSuppliers.quoteNone')
}
const quoteTagType = (status?: number) => (Number(status) === 1 ? 'warning' : Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : 'info')
const onboardingLabel = (status?: number) => {
  const keys = ['draft', 'pending', 'approved', 'rejected']
  const key = keys[Number(status)]
  return key ? t(`admin.platformSuppliers.${key}`) : '—'
}
const serviceName = (row: any) => {
  const localized = specText(row?.nameI18n)
  return localized !== '—' ? localized : (row?.spuName || '—')
}
const serviceCategory = (row: any) => {
  const localized = specText(row?.categoryNameI18n)
  return localized !== '—' ? localized : (row?.categoryName || '—')
}
const onboardingText = (status?: number, i18n?: Record<string, unknown> | null) => {
  const localized = specText(i18n)
  return localized !== '—' ? localized : onboardingLabel(status)
}
const onboardingStatusParam = () => {
  const value = onboardingStatus.value
  return value === '' || value == null ? undefined : Number(value)
}
const listedPhones = (phones?: string[]) => (phones || []).map((phone) => String(phone || '').trim()).filter(Boolean)
const moneyText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const clientPrice = (row: { platformPrice?: unknown; platformOriginalPrice?: unknown }) => {
  const sale = Number(row.platformPrice)
  if (Number.isFinite(sale) && sale > 0) return sale
  const original = Number(row.platformOriginalPrice)
  return Number.isFinite(original) ? original : null
}
const categoryName = (category: ServiceCategory) =>
  pickI18nText(category?.nameI18n, getAdminLocale(), category?.categoryName || '') || category?.categoryName || '—'
const specText = (value: unknown) => {
  if (value == null || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') return pickI18nText(value as Record<string, unknown>, getAdminLocale(), '—') || '—'
  return '—'
}
const formatTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type OnboardingListItem = {
  id?: number
  supplierNo?: string
  companyName?: string
  contactPerson?: string
  mobile?: string
  status?: number
  pendingReview?: boolean
  modifyTime?: string
  services?: ServiceCategory[]
}

const reviewChoice = () => (needReview.value === 'yes' || needReview.value === 'no' ? needReview.value : '')

const attachOnboardingStatus = async (rows: SupplierRow[]) => {
  if (!rows.length) return rows
  const wanted = new Set(rows.map((row) => Number(row.id)))
  const statusById = new Map<number, number | undefined>()
  const reviewById = new Map<number, boolean>()
  const statusPageSize = 200
  let statusPage = 1
  let statusTotal = 0
  do {
    const result = unwrap(await onboardingPage({ pageNum: statusPage, pageSize: statusPageSize })) || {}
    const list = Array.isArray(result.list) ? result.list : []
    statusTotal = Number(result.total || 0)
    list.forEach((item: OnboardingListItem) => {
      const id = Number(item.id)
      if (!wanted.has(id)) return
      const status = Number(item.status)
      statusById.set(id, Number.isFinite(status) ? status : undefined)
      if (typeof item.pendingReview === 'boolean') reviewById.set(id, item.pendingReview)
    })
    if (statusById.size >= wanted.size || list.length < statusPageSize) break
    statusPage += 1
  } while ((statusPage - 1) * statusPageSize < statusTotal && statusPage <= 5)
  return rows.map((row) => {
    const parsed = row.onboardingStatus == null ? NaN : Number(row.onboardingStatus)
    return {
      ...row,
      onboardingStatus: Number.isFinite(parsed) ? parsed : statusById.get(Number(row.id)),
      pendingReview: reviewById.get(Number(row.id)),
    }
  })
}

const collectOnboarding = async (review: 'yes' | 'no') => {
  const matched: OnboardingListItem[] = []
  const scanSize = 100
  let scanPage = 1
  let scanTotal = 0
  const wantReview = review === 'yes'
  do {
    const result = unwrap(await onboardingPage({
      pageNum: scanPage,
      pageSize: scanSize,
      ...(keyword.value ? { keyword: keyword.value } : {}),
      ...(onboardingStatusParam() == null ? {} : { status: onboardingStatusParam() }),
      pendingReview: wantReview,
    })) || {}
    const list = (Array.isArray(result.list) ? result.list : []) as OnboardingListItem[]
    scanTotal = Number(result.total || 0)
    list.forEach((item) => {
      if (item.pendingReview !== wantReview) return
      matched.push(item)
    })
    if (list.length < scanSize) break
    scanPage += 1
  } while ((scanPage - 1) * scanSize < scanTotal && scanPage <= 50)
  return matched
}

const collectQuoteRows = async () => {
  const rows: SupplierRow[] = []
  const scanSize = 100
  let scanPage = 1
  let scanTotal = 0
  do {
    const payload: Record<string, unknown> = { pageNum: scanPage, pageSize: scanSize }
    if (keyword.value) payload.keyword = keyword.value
    if (quoteStatus.value !== '') payload.quoteStatus = quoteStatus.value
    if (onboardingStatusParam() != null) payload.onboardingStatus = onboardingStatusParam()
    const result = unwrap(await platformSupplierQuotePage(payload)) || {}
    const list = (result.list || []) as SupplierRow[]
    rows.push(...list)
    scanTotal = Number(result.total || 0)
    if (list.length < scanSize) break
    scanPage += 1
  } while ((scanPage - 1) * scanSize < scanTotal && scanPage <= 50)
  return rows
}

const toReviewRow = (item: OnboardingListItem, quote?: SupplierRow): SupplierRow => {
  const groups = (item.services || []).filter((group) => group.categoryId)
  const serviceCount = groups.reduce((sum, group) => {
    const services = (group as { services?: unknown[] }).services
    return sum + (Array.isArray(services) ? services.length : 0)
  }, 0)
  return {
    id: Number(item.id),
    supplierNo: quote?.supplierNo || item.supplierNo,
    supplierName: quote?.supplierName || item.companyName || '',
    contactPerson: quote?.contactPerson || item.contactPerson || '',
    mobile: quote?.mobile || item.mobile || '',
    serviceCount: quote?.serviceCount ?? serviceCount,
    serviceCategories: quote?.serviceCategories?.length ? quote.serviceCategories : groups,
    onboardingStatus: quote?.onboardingStatus != null && quote.onboardingStatus !== undefined
      ? Number(quote.onboardingStatus)
      : (Number.isFinite(Number(item.status)) ? Number(item.status) : undefined),
    onboardingStatusI18n: quote?.onboardingStatusI18n,
    pendingReview: item.pendingReview,
    latestSubmitTime: quote?.latestSubmitTime || item.modifyTime,
  }
}

const loadSuppliers = async () => {
  loading.value = true
  try {
    const review = reviewChoice()
    if (review) {
      const [onboardingRows, quoteRows] = await Promise.all([
        collectOnboarding(review),
        collectQuoteRows(),
      ])
      const quoteById = new Map(quoteRows.map((row) => [Number(row.id), row]))
      const merged = onboardingRows
        .filter((item) => quoteStatus.value === '' || quoteById.has(Number(item.id)))
        .map((item) => toReviewRow(item, quoteById.get(Number(item.id))))
      total.value = merged.length
      const start = (pageNum.value - 1) * pageSize
      suppliers.value = merged.slice(start, start + pageSize)
      return
    }
    const payload: Record<string, unknown> = { pageNum: pageNum.value, pageSize }
    if (keyword.value) payload.keyword = keyword.value
    if (quoteStatus.value !== '') payload.quoteStatus = quoteStatus.value
    if (onboardingStatusParam() != null) payload.onboardingStatus = onboardingStatusParam()
    const page = unwrap(await platformSupplierQuotePage(payload)) || {}
    const rows = (page.list || []) as SupplierRow[]
    suppliers.value = await attachOnboardingStatus(rows)
    total.value = Number(page.total || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.loadFailed'))
  } finally {
    loading.value = false
  }
}

const search = () => {
  pageNum.value = 1
  loadSuppliers()
}
const changePage = (page: number) => {
  pageNum.value = page
  loadSuppliers()
}

const loadReview = async (supplierId: number) => {
  detailLoading.value = true
  try {
    const [detail, serviceList, catalog] = await Promise.all([
      onboardingDetail(supplierId),
      platformSupplierQuoteServices(supplierId),
      serviceCatalog(supplierId).catch(() => null),
    ])
    const nextProfile = unwrap(detail) || {}
    Object.keys(profile).forEach((key) => delete profile[key])
    Object.assign(profile, nextProfile)
    onboarding.status = nextProfile.status
    onboarding.rejectReason = nextProfile.rejectReason || ''
    const selection = new Map<number, { workerCount?: number; contactPhones: string[] }>()
    const categoryI18n = new Map<number, Record<string, string>>()
    ;(unwrap(catalog) || []).forEach((group: any) => {
      if (group?.categoryId && group?.nameI18n) categoryI18n.set(Number(group.categoryId), group.nameI18n)
      ;(group.services || []).forEach((service: any) => {
        if (!service.selected) return
        selection.set(Number(service.spuId), {
          workerCount: service.workerCount,
          contactPhones: Array.isArray(service.contactPhones) ? service.contactPhones : [],
        })
      })
    })
    services.value = (unwrap(serviceList) || []).map((row: any) => ({
      ...row,
      categoryNameI18n: categoryI18n.get(Number(row.categoryId)),
      ...(selection.get(Number(row.spuId)) || {}),
    }))
    current.value = {
      id: supplierId,
      supplierNo: nextProfile.supplierNo,
      supplierName: nextProfile.companyName || '',
      contactPerson: nextProfile.contactPerson || '',
      mobile: nextProfile.mobile || '',
      serviceCount: services.value.length,
      onboardingStatus: nextProfile.status,
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.reviewLoadFailed'))
  } finally {
    detailLoading.value = false
  }
}

const openReview = (row: SupplierRow) => {
  router.push({ path: '/admin/basic/suppliers', query: { id: String(row.id) } })
}
const backToList = () => {
  router.push({ path: '/admin/basic/suppliers' })
}

const approveOnboarding = async () => {
  if (!detailId.value) return
  try {
    await ElMessageBox.confirm(t('admin.platformSuppliers.approveOnboardingConfirm'), t('admin.platformSuppliers.approveOnboardingTitle'))
  } catch {
    return
  }
  saving.value = true
  try {
    await onboardingChangeStatus({ id: detailId.value, status: 2 })
    ElMessage.success(t('admin.platformSuppliers.approveOnboardingSuccess'))
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.approveOnboardingFailed'))
  } finally {
    saving.value = false
  }
}

const approveQuote = async (row: any) => {
  if (!detailId.value || !row?.spuId) return
  try {
    await ElMessageBox.confirm(
      t('admin.platformSuppliers.approveQuoteConfirm', { name: serviceName(row) || t('admin.platformSuppliers.thisService') }),
      t('admin.platformSuppliers.approveQuoteTitle'),
    )
  } catch {
    return
  }
  saving.value = true
  try {
    await platformSupplierQuoteReview({
      supplierId: detailId.value,
      spuId: row.spuId,
      status: 2,
    })
    ElMessage.success(t('admin.platformSuppliers.approveQuoteSuccess'))
    skuStatus.value = 2
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.approveQuoteFailed'))
  } finally {
    saving.value = false
  }
}

const openReject = (mode: 'quote' | 'onboarding', row?: any) => {
  rejectMode.value = mode
  rejectTarget.value = row || null
  rejectReason.value = ''
  rejectOpen.value = true
}

const submitReject = async () => {
  const reason = rejectReason.value.trim()
  if (!reason) {
    ElMessage.warning(t('admin.platformSuppliers.reasonRequired'))
    return
  }
  if (!detailId.value) return
  saving.value = true
  try {
    if (rejectMode.value === 'onboarding') {
      await onboardingChangeStatus({ id: detailId.value, status: 3, rejectReason: reason })
      ElMessage.success(t('admin.platformSuppliers.onboardingRejected'))
    } else {
      await platformSupplierQuoteReview({
        supplierId: detailId.value,
        spuId: rejectTarget.value?.spuId,
        status: 3,
        rejectReason: reason,
      })
      ElMessage.success(t('admin.platformSuppliers.quoteRejectedSuccess'))
      skuStatus.value = 3
      skuRejectReason.value = reason
    }
    rejectOpen.value = false
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const openSkus = async (row: any) => {
  if (!detailId.value) return
  skuTarget.value = row
  skuTitle.value = serviceName(row) || t('admin.platformSuppliers.serviceFallback')
  skuStatus.value = row.status
  skuStatusI18n.value = row.statusI18n || null
  skuRejectReason.value = row.rejectReason || ''
  skuQuoteMode.value = null
  skuUnitPrice.value = null
  skuColumns.value = []
  skuRows.value = []
  skuAttaches.value = []
  skuOpen.value = true
  skuLoading.value = true
  try {
    const quote = unwrap(await platformSupplierQuoteSkus(detailId.value, row.spuId)) || {}
    skuStatus.value = quote.status ?? row.status
    skuStatusI18n.value = quote.statusI18n || row.statusI18n || null
    skuRejectReason.value = quote.rejectReason || row.rejectReason || ''
    skuQuoteMode.value = quote.quoteMode == null ? null : Number(quote.quoteMode)
    skuUnitPrice.value = quote.unitPrice == null ? null : Number(quote.unitPrice)
    const quoted = new Map((quote.skus || []).map((sku: any) => [Number(sku.skuId), sku]))
    let columns: { key: string; label: string }[] = []
    let specSkus: any[] = []
    let catalogAttaches: any[] = []
    try {
      const detail = unwrap(await listBySpu(row.spuId)) || {}
      const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
      columns = specTypes.map((spec: any) => ({
        key: String(spec.specKey ?? spec.specTypeId),
        label: (() => {
          const localized = specText(spec.nameI18n)
          return localized !== '—' ? localized : (spec.specTypeName || localized)
        })(),
      }))
      specSkus = Array.isArray(detail.skus) ? detail.skus : []
      catalogAttaches = Array.isArray(detail.attaches) ? detail.attaches : []
    } catch {
      columns = []
      specSkus = []
    }
    skuColumns.value = columns
    const source = specSkus.length ? specSkus : (quote.skus || [])
    skuRows.value = source.map((sku: any) => {
      const saved = quoted.get(Number(sku.skuId)) || sku
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        specs: Object.fromEntries(columns.map((column) => [column.key, specText(sku[column.key])])),
        platformPrice: saved.platformPrice ?? sku.price,
        platformOriginalPrice: saved.platformOriginalPrice ?? sku.originalPrice,
        approvedPrice: saved.approvedPrice ?? null,
        staffCount: saved.staffCount ?? null,
        serviceHours: saved.serviceHours ?? null,
        quotePrice: saved.quotePrice ?? null,
      }
    })
    if (!catalogAttaches.length) {
      try {
        catalogAttaches = await listSpuAttachCatalog(row.spuId, catalogAttaches)
      } catch {
        catalogAttaches = []
      }
    }
    const savedAttaches = new Map((Array.isArray(quote.attaches) ? quote.attaches : []).map((item: any) => [Number(item.attachValueId), item]))
    const attachSource = catalogAttaches.length ? catalogAttaches : (Array.isArray(quote.attaches) ? quote.attaches : [])
    skuAttaches.value = attachSource.map((item: any) => {
      const saved = savedAttaches.get(Number(item.attachValueId)) || {}
      const localized = (i18n: unknown, plain: unknown) => {
        const text = specText(i18n)
        return text !== '—' ? text : (plain ? String(plain) : '—')
      }
      return {
        attachValueId: Number(item.attachValueId),
        typeName: localized(saved.attachTypeNameI18n || item.attachTypeNameI18n, saved.attachTypeName || item.attachTypeName),
        name: localized(saved.attachValueNameI18n || item.attachValueNameI18n, saved.attachValueName || item.attachValueName),
        platformPrice: saved.platformPrice ?? item.platformPrice ?? null,
        approvedPrice: saved.approvedPrice ?? null,
        offered: saved.canServe === true,
        quotePrice: saved.quotePrice ?? null,
      }
    })
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.quoteLoadFailed'))
    skuOpen.value = false
  } finally {
    skuLoading.value = false
  }
}

watch(detailId, (id) => {
  if (id) loadReview(id)
}, { immediate: true })

onMounted(loadSuppliers)
</script>

<style scoped>
.supplier-review { padding: 20px; color: #1c2433; }
.supplier-review__head h1 { margin: 0 0 6px; font-size: 24px; }
.supplier-review__head p { margin: 0 0 16px; color: #6d7686; }
.supplier-review__head--detail .el-button { margin-bottom: 8px; padding-left: 0; }
.board { padding: 14px; background: #fff; border: 1px solid #e7ebf2; border-radius: 14px; }
.board__bar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.board__bar .el-input { width: 240px; }
.board__bar .el-select { width: 220px; }
.board__bar .review-filter { width: 190px; }
.board__count { color: #6d7686; font-size: 13px; }
.board :deep(.el-pagination) { justify-content: flex-end; margin-top: 12px; }
.category-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.phone-list { display: flex; flex-direction: column; gap: 2px; line-height: 1.45; }
.supplier-review :deep(td.phone-col .cell) { white-space: normal; overflow: visible; text-overflow: clip; }
.sku-meta { margin: 0 0 10px; color: #6d7686; font-size: 13px; }
.sku-attaches { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.sku-attaches h4 { margin: 0; font-size: 14px; }
.sku-attach { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid #eadfce; border-radius: 10px; background: #fffdf8; }
.sku-attach div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.sku-attach small { color: #74685a; font-size: 12px; }
.sku-attach span { flex: 0 0 auto; font-weight: 700; }
.order-detail { min-height: 100%; color: #05152b; }
.order-detail__hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 4px 2px 8px; }
.order-detail__eyebrow { margin-bottom: 4px; color: #7a8494; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.order-detail__title { margin: 0; color: #05152b; font-size: 28px; line-height: 1.2; }
.order-detail__booked-at { margin: 8px 0 0; color: #697386; font-size: 13px; }
.order-detail__amount { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; color: #7a8494; font-size: 12px; }
.order-detail__toolbar { display: flex; justify-content: flex-end; gap: 8px; margin: 14px 0; }
.reject-note { margin: 0 0 14px; color: #c45656; font-size: 13px; }
.order-detail__columns { display: grid; grid-template-columns: minmax(0, 3fr) minmax(240px, 2fr); gap: 18px; }
.order-detail__stack { display: flex; flex-direction: column; gap: 18px; }
.order-detail__panel { padding: 18px 20px; border: 1px solid #e3e8ef; border-radius: 10px; background: #fff; box-shadow: 0 3px 12px rgb(5 21 43 / 5%); }
.order-detail__panel h3 { margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid #edf0f4; color: #05152b; font-size: 16px; }
.order-detail__list { margin: 0; }
.order-detail__list > div + div { margin-top: 13px; }
.order-detail__list dt { margin-bottom: 5px; color: #8791a1; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.order-detail__list dd { margin: 0; }
.doc-group + .doc-group { margin-top: 16px; }
.doc-group__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.doc-group__head span, .doc-empty, .area-text { color: #697386; font-size: 13px; }
.doc-empty, .area-text { margin: 0; }
.doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.doc-card { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; overflow: hidden; border: 1px solid #e3e8ef; border-radius: 10px; background: #f6f8fb; }
.doc-card :deep(.el-image), .doc-card__file { width: 100%; height: 96px; background: #fff; }
.doc-card :deep(.el-image) { cursor: zoom-in; }
.doc-card__file { display: grid; place-items: center; border: 0; color: #05152b; font-weight: 700; cursor: pointer; }
.doc-card figcaption { padding: 0 8px 8px; overflow: hidden; color: #526070; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 900px) {
  .order-detail__columns { grid-template-columns: 1fr; }
}
</style>

<style>
.supplier-detail-drawer .el-drawer__body { background: #f6f8fb; }
.policy-preview.el-dialog { overflow: hidden; }
.policy-preview .el-dialog__body { padding: 0 0 18px; }
.policy-preview__stage { display: grid; place-items: center; min-height: 240px; max-height: 78vh; overflow: auto; padding: 16px; background: #f3f5f8; }
.policy-preview__stage img { max-width: 100%; max-height: 72vh; object-fit: contain; background: #fff; }
.policy-preview__stage iframe { width: 100%; height: 72vh; border: 0; background: #fff; }
.policy-preview__stage p { margin: 24px; color: #526070; }
</style>
