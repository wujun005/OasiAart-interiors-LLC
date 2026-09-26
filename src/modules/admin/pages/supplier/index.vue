<template>
  <div class="supplier-review">
      <header class="supplier-review__head">
        <div>
          <h1>供应商管理</h1>
          <p>审核供应商工作台提交的入驻资料和服务报价。点击供应商编号打开详情。</p>
        </div>
      </header>

      <section class="board">
        <div class="board__bar">
          <el-input
            v-model.trim="keyword"
            placeholder="公司、联系人、电话"
            clearable
            @keyup.enter="search"
            @clear="search"
          />
          <el-select v-model="quoteStatus" filterable @change="search">
            <el-option label="待审核报价" :value="1" />
            <el-option label="全部供应商" value="" />
            <el-option label="报价草稿" :value="0" />
            <el-option label="报价已通过" :value="2" />
            <el-option label="报价已拒绝" :value="3" />
          </el-select>
          <span class="board__count">{{ total }} 家</span>
        </div>

        <el-table :data="suppliers" v-loading="loading" row-key="id" empty-text="没有符合条件的供应商">
          <el-table-column label="供应商编号" min-width="140">
            <template #default="{ row }">
              <el-button link type="primary" @click="openReview(row)">{{ row.supplierNo || row.id }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="供应商" min-width="180" prop="supplierName" />
          <el-table-column label="服务大类" min-width="180">
            <template #default="{ row }">
              <div v-if="row.serviceCategories?.length" class="category-tags">
                <el-tag v-for="cat in row.serviceCategories" :key="cat.categoryId" effect="plain">
                  {{ categoryName(cat) }}
                </el-tag>
              </div>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column label="联系人" min-width="120" prop="contactPerson" />
          <el-table-column label="电话" min-width="140" prop="mobile" />
          <el-table-column label="已选服务" width="100" prop="serviceCount" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="quoteTagType(row.onboardingStatus)" effect="light">
                {{ onboardingLabel(row.onboardingStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近提交" min-width="150">
            <template #default="{ row }">{{ formatTime(row.latestSubmitTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openReview(row)">审核</el-button>
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
      :title="profile.companyName || current?.supplierName || '供应商详情'"
      direction="rtl"
      size="min(980px, 100%)"
      @update:model-value="(open: boolean) => { if (!open) backToList() }"
    >
      <el-skeleton v-if="detailLoading" :rows="12" animated />
      <div v-else class="order-detail">
        <header class="order-detail__hero">
          <div>
            <div class="order-detail__eyebrow">供应商编号</div>
            <h2 class="order-detail__title">{{ profile.supplierNo || current?.supplierNo || '—' }}</h2>
            <p class="order-detail__booked-at">{{ profile.companyName || '—' }}</p>
          </div>
          <div class="order-detail__amount">
            <span>入驻状态</span>
            <el-tag :type="quoteTagType(onboarding.status)" effect="light" round>{{ onboardingLabel(onboarding.status) }}</el-tag>
          </div>
        </header>

        <div v-if="Number(onboarding.status) === 1" class="order-detail__toolbar">
          <el-button type="primary" :loading="saving" @click="approveOnboarding">通过入驻</el-button>
          <el-button type="danger" plain :loading="saving" @click="openReject('onboarding')">驳回入驻</el-button>
        </div>
        <p v-if="onboarding.rejectReason" class="reject-note">驳回原因：{{ onboarding.rejectReason }}</p>

        <div class="order-detail__columns">
          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>公司资料</h3>
              <dl class="order-detail__list">
                <div><dt>执照号</dt><dd>{{ text(profile.tradeLicenseNo) }}</dd></div>
                <div><dt>执照到期</dt><dd>{{ text(profile.licenseExpiry) }}</dd></div>
                <div><dt>VAT / TRN</dt><dd>{{ text(profile.vatTrn) }}</dd></div>
                <div><dt>经营年限</dt><dd>{{ text(profile.yearsInBusiness) }}</dd></div>
                <div><dt>办公地址</dt><dd>{{ text(profile.officeAddress) }}</dd></div>
              </dl>
            </section>

            <section class="order-detail__panel">
              <h3>证照与保单</h3>
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
                <p v-else class="doc-empty">未上传</p>
              </div>
            </section>

            <section class="order-detail__panel">
              <h3>服务与报价</h3>
              <el-table :data="services" row-key="spuId" empty-text="这家供应商还没有勾选服务">
                <el-table-column label="分类" min-width="120" prop="categoryName" />
                <el-table-column label="服务" min-width="140" prop="spuName" />
                <el-table-column label="版本" width="70">
                  <template #default="{ row }">{{ row.versionNo || '—' }}</template>
                </el-table-column>
                <el-table-column label="报价状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="quoteTagType(row.status)" effect="light">{{ quoteStatusLabel(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="openSkus(row)">报价</el-button>
                    <el-button v-if="Number(row.status) === 1" link type="primary" :loading="saving" @click="approveQuote(row)">通过</el-button>
                    <el-button v-if="Number(row.status) === 1" link type="danger" :loading="saving" @click="openReject('quote', row)">拒绝</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>

          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>联系人</h3>
              <dl class="order-detail__list">
                <div><dt>联系人</dt><dd>{{ text(profile.contactPerson) }}</dd></div>
                <div><dt>电话</dt><dd>{{ text(profile.mobile) }}</dd></div>
                <div><dt>WhatsApp</dt><dd>{{ text(profile.whatsapp) }}</dd></div>
                <div><dt>邮箱</dt><dd>{{ text(profile.email) }}</dd></div>
              </dl>
            </section>

            <section class="order-detail__panel">
              <h3>服务能力</h3>
              <dl class="order-detail__list">
                <div><dt>可上岗人数</dt><dd>{{ text(profile.totalAvailableWorkers) }}</dd></div>
                <div><dt>同时接单</dt><dd>{{ text(profile.maxSimultaneousOrders) }}</dd></div>
                <div><dt>月产能</dt><dd>{{ text(profile.monthlyCapacity) }}</dd></div>
                <div><dt>最短提前</dt><dd>{{ profile.minLeadTimeHours == null ? '—' : `${profile.minLeadTimeHours} 小时` }}</dd></div>
                <div><dt>工作时间</dt><dd>{{ text(profile.workingHours) }}</dd></div>
                <div><dt>周末服务</dt><dd>{{ yesNo(profile.weekendService) }}</dd></div>
                <div><dt>公共假期</dt><dd>{{ yesNo(profile.publicHolidayService) }}</dd></div>
                <div><dt>当日预约</dt><dd>{{ yesNo(profile.sameDayBooking) }}</dd></div>
                <div><dt>紧急服务</dt><dd>{{ yesNo(profile.emergencyService) }}</dd></div>
                <div><dt>女性员工</dt><dd>{{ staffText(profile.femaleStaffAvailable, profile.femaleStaffCount) }}</dd></div>
                <div><dt>男性员工</dt><dd>{{ staffText(profile.maleStaffAvailable, profile.maleStaffCount) }}</dd></div>
                <div><dt>自有车辆</dt><dd>{{ yesNo(profile.ownTransportation) }}</dd></div>
                <div><dt>自有设备</dt><dd>{{ yesNo(profile.ownEquipment) }}</dd></div>
                <div><dt>可开税务发票</dt><dd>{{ yesNo(profile.taxInvoiceAvailable) }}</dd></div>
              </dl>
            </section>

            <section class="order-detail__panel">
              <h3>服务区域</h3>
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
        <p v-else>这个文件无法在页面里预览。</p>
      </div>
    </el-dialog>

    <el-dialog v-model="skuOpen" :title="`${skuTitle} · 报价`" width="min(860px, calc(100vw - 32px))" append-to-body>
      <p class="sku-meta">{{ quoteStatusLabel(skuStatus) }}<span v-if="skuRejectReason"> · {{ skuRejectReason }}</span></p>
      <el-table v-loading="skuLoading" :data="skuRows" row-key="skuId" empty-text="这个服务还没有规格">
        <el-table-column v-for="column in skuColumns" :key="column.key" :label="column.label" min-width="140">
          <template #default="{ row }">{{ row.specs[column.key] || '—' }}</template>
        </el-table-column>
        <el-table-column v-if="!skuColumns.length" label="SKU" prop="skuCode" min-width="140" />
        <el-table-column label="客户端价格" width="120">
          <template #default="{ row }">{{ moneyText(clientPrice(row)) }}</template>
        </el-table-column>
        <el-table-column label="当前生效价格" width="130">
          <template #default="{ row }">{{ moneyText(row.approvedPrice) }}</template>
        </el-table-column>
        <el-table-column label="本次报价" width="120">
          <template #default="{ row }">{{ moneyText(row.quotePrice) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="skuOpen = false">关闭</el-button>
        <el-button v-if="Number(skuStatus) === 1" :loading="saving" @click="approveQuote(skuTarget)">通过</el-button>
        <el-button v-if="Number(skuStatus) === 1" type="danger" plain :loading="saving" @click="openReject('quote', skuTarget)">拒绝</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectOpen" :title="rejectMode === 'onboarding' ? '驳回入驻' : '拒绝报价'" width="460px" append-to-body>
      <el-input v-model="rejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请填写原因" />
      <template #footer>
        <el-button @click="rejectOpen = false">取消</el-button>
        <el-button type="danger" :loading="saving" @click="submitReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listBySpu } from '@/modules/admin/api/spu'
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
  latestSubmitTime?: string
}

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const quoteStatus = ref<number | ''>(1)
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
const yesNo = (value: unknown) => (Number(value) === 1 ? '是' : Number(value) === 0 ? '否' : '—')
const staffText = (available: unknown, count: unknown) => {
  if (available === null || available === undefined || available === '') return '—'
  if (Number(available) !== 1 || count === null || count === undefined || count === '') return yesNo(available)
  return `${yesNo(available)} · ${count} 人`
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
    { label: '公众责任险', answer: yesNo(profile.publicLiabilityInsurance), files: toDocFiles(profile.publicLiabilityInsuranceFile) },
    { label: '雇员保险', answer: yesNo(profile.employeeInsurance), files: toDocFiles(profile.employeeInsuranceFile) },
  ]
  const extra = profile.extra && typeof profile.extra === 'object' ? profile.extra as Record<string, unknown> : {}
  const extraLabels: Record<string, string> = { tradeLicenseFile: '营业执照', licenseFile: '营业执照', vatFile: 'VAT 证书' }
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

const rejectOpen = ref(false)
const rejectMode = ref<'quote' | 'onboarding'>('quote')
const rejectReason = ref('')
const rejectTarget = ref<any>(null)

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const quoteStatusLabel = (status?: number) => ['草稿', '待审核', '已通过', '已拒绝'][status ?? -1] || '未报价'
const quoteTagType = (status?: number) => (Number(status) === 1 ? 'warning' : Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : 'info')
const onboardingLabel = (status?: number) => ['草稿', '已提交', '已通过', '已驳回'][Number(status)] || '—'
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

const attachOnboardingStatus = async (rows: SupplierRow[]) => {
  if (!rows.length) return rows
  const wanted = new Set(rows.map((row) => Number(row.id)))
  const statusById = new Map<number, number | undefined>()
  const statusPageSize = 200
  let statusPage = 1
  let statusTotal = 0
  do {
    const result = unwrap(await onboardingPage({ pageNum: statusPage, pageSize: statusPageSize })) || {}
    const list = Array.isArray(result.list) ? result.list : []
    statusTotal = Number(result.total || 0)
    list.forEach((item: { id?: number; status?: number }) => {
      const id = Number(item.id)
      if (!wanted.has(id)) return
      const status = Number(item.status)
      statusById.set(id, Number.isFinite(status) ? status : undefined)
    })
    if (statusById.size >= wanted.size || list.length < statusPageSize) break
    statusPage += 1
  } while ((statusPage - 1) * statusPageSize < statusTotal && statusPage <= 5)
  return rows.map((row) => ({
    ...row,
    onboardingStatus: statusById.get(Number(row.id)),
  }))
}

const loadSuppliers = async () => {
  loading.value = true
  try {
    const payload: Record<string, unknown> = { pageNum: pageNum.value, pageSize }
    if (keyword.value) payload.keyword = keyword.value
    if (quoteStatus.value !== '') payload.quoteStatus = quoteStatus.value
    const page = unwrap(await platformSupplierQuotePage(payload)) || {}
    const rows = (page.list || []) as SupplierRow[]
    suppliers.value = await attachOnboardingStatus(rows)
    total.value = Number(page.total || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '供应商加载失败')
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
    const [detail, serviceList] = await Promise.all([
      onboardingDetail(supplierId),
      platformSupplierQuoteServices(supplierId),
    ])
    const nextProfile = unwrap(detail) || {}
    Object.keys(profile).forEach((key) => delete profile[key])
    Object.assign(profile, nextProfile)
    onboarding.status = nextProfile.status
    onboarding.rejectReason = nextProfile.rejectReason || ''
    services.value = unwrap(serviceList) || []
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
    ElMessage.error(error?.message || '审核资料加载失败')
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
    await ElMessageBox.confirm('通过后这家供应商会启用。', '通过入驻')
  } catch {
    return
  }
  saving.value = true
  try {
    await onboardingChangeStatus({ id: detailId.value, status: 2 })
    ElMessage.success('入驻已通过')
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || '通过入驻失败')
  } finally {
    saving.value = false
  }
}

const approveQuote = async (row: any) => {
  if (!detailId.value || !row?.spuId) return
  try {
    await ElMessageBox.confirm(`通过「${row.spuName || '这项服务'}」后，这一版报价成为生效价。`, '通过报价')
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
    ElMessage.success('报价已通过')
    skuStatus.value = 2
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || '通过报价失败')
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
    ElMessage.warning('请填写原因')
    return
  }
  if (!detailId.value) return
  saving.value = true
  try {
    if (rejectMode.value === 'onboarding') {
      await onboardingChangeStatus({ id: detailId.value, status: 3, rejectReason: reason })
      ElMessage.success('入驻已驳回')
    } else {
      await platformSupplierQuoteReview({
        supplierId: detailId.value,
        spuId: rejectTarget.value?.spuId,
        status: 3,
        rejectReason: reason,
      })
      ElMessage.success('报价已拒绝')
      skuStatus.value = 3
      skuRejectReason.value = reason
    }
    rejectOpen.value = false
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || '拒绝失败')
  } finally {
    saving.value = false
  }
}

const openSkus = async (row: any) => {
  if (!detailId.value) return
  skuTarget.value = row
  skuTitle.value = row.spuName || '服务'
  skuStatus.value = row.status
  skuRejectReason.value = row.rejectReason || ''
  skuColumns.value = []
  skuRows.value = []
  skuOpen.value = true
  skuLoading.value = true
  try {
    const quote = unwrap(await platformSupplierQuoteSkus(detailId.value, row.spuId)) || {}
    skuStatus.value = quote.status ?? row.status
    skuRejectReason.value = quote.rejectReason || row.rejectReason || ''
    const quoted = new Map((quote.skus || []).map((sku: any) => [Number(sku.skuId), sku]))
    let columns: { key: string; label: string }[] = []
    let specSkus: any[] = []
    try {
      const detail = unwrap(await listBySpu(row.spuId)) || {}
      const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
      columns = specTypes.map((spec: any) => ({
        key: String(spec.specKey ?? spec.specTypeId),
        label: spec.specTypeName || specText(spec.nameI18n),
      }))
      specSkus = Array.isArray(detail.skus) ? detail.skus : []
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
        quotePrice: saved.quotePrice ?? null,
      }
    })
  } catch (error: any) {
    ElMessage.error(error?.message || '报价加载失败')
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
.board__bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.board__bar .el-input { width: 240px; }
.board__bar .el-select { width: 160px; }
.board__count { color: #6d7686; font-size: 13px; }
.board :deep(.el-pagination) { justify-content: flex-end; margin-top: 12px; }
.category-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.sku-meta { margin: 0 0 10px; color: #6d7686; font-size: 13px; }
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
