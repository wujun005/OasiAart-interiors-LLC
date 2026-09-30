<template>
  <div class="catalog-page">
    <header class="page-header">
      <div>
        <p>{{ t('admin.notifications.description') }}</p>
        <h1>{{ t('admin.notifications.title') }}</h1>
      </div>
      <el-button type="primary" @click="openTest()">{{ t('admin.notifications.test') }}</el-button>
    </header>

    <section class="toolbar">
      <el-input
        v-model="keyword"
        clearable
        :placeholder="t('admin.notifications.keyword')"
        @keyup.enter="load"
        @clear="load"
      />
      <el-select v-model="channel" @change="load">
        <el-option :label="t('admin.notifications.allChannels')" value="" />
        <el-option label="Email" value="EMAIL" />
        <el-option label="WhatsApp" value="WHATSAPP" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="load">{{ t('admin.notifications.search') }}</el-button>
    </section>

    <div class="counts">
      <span>{{ t('admin.notifications.total', { count: summary.total }) }}</span>
      <span>{{ t('admin.notifications.emailCount', { count: summary.emailCount }) }}</span>
      <span>{{ t('admin.notifications.whatsAppCount', { count: summary.whatsAppCount }) }}</span>
    </div>

    <el-table v-loading="loading" :data="items" row-key="code" border>
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-table :data="row.variables || []" size="small">
            <el-table-column :label="t('admin.notifications.variable')" prop="name" min-width="140" />
            <el-table-column :label="t('admin.notifications.location')" prop="location" width="120" />
            <el-table-column :label="t('admin.notifications.source')" prop="source" min-width="280" />
          </el-table>
          <p v-if="!(row.variables || []).length" class="empty-note">{{ t('admin.notifications.noVariables') }}</p>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.notifications.name')" prop="name" min-width="180" />
      <el-table-column :label="t('admin.notifications.channel')" width="120">
        <template #default="{ row }">
          <el-tag :type="row.channel === 'WHATSAPP' ? 'success' : 'info'" effect="light">{{ row.channel || '—' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.notifications.scene')" prop="scene" min-width="140" />
      <el-table-column :label="t('admin.notifications.template')" prop="template" min-width="180" show-overflow-tooltip />
      <el-table-column :label="t('admin.notifications.trigger')" prop="trigger" min-width="220" show-overflow-tooltip />
      <el-table-column :label="t('admin.notifications.recipient')" min-width="180">
        <template #default="{ row }">
          <div>{{ row.recipient || '—' }}</div>
          <small>{{ row.recipientSource || '' }}</small>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.notifications.wired')" width="120">
        <template #default="{ row }">
          <el-tag :type="row.wired ? 'success' : 'warning'" effect="light">
            {{ row.wired ? t('admin.notifications.wiredYes') : t('admin.notifications.wiredNo') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.notifications.actions')" width="120" fixed="right">
        <template #default="{ row }">
          <el-button v-if="testOf(row.code)" link type="primary" @click="openTest(row)">{{ t('admin.notifications.test') }}</el-button>
          <span v-else class="empty-note">{{ t('admin.notifications.noTest') }}</span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="testOpen" class="notice-test-dialog" :title="t('admin.notifications.testTitle')" width="520px" append-to-body>
      <p class="test-hint">{{ t('admin.notifications.testHint') }}</p>
      <el-form label-position="top">
        <el-form-item :label="t('admin.notifications.notification')">
          <el-select v-model="testForm.code" filterable>
            <el-option v-for="item in testOptions" :key="item.code" :label="item.label" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.notifications.orderNo')">
          <el-input v-model="testForm.orderNo" :placeholder="t('admin.notifications.orderNoPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.notifications.overrideRecipient')">
          <el-input v-model="testForm.to" :placeholder="activeTest?.channel === 'WHATSAPP' ? t('admin.notifications.phonePlaceholder') : t('admin.notifications.emailPlaceholder')" />
        </el-form-item>
        <el-form-item v-if="activeTest?.outcomes.length" :label="t('admin.notifications.outcome')">
          <el-select v-model="testForm.outcome">
            <el-option v-for="item in activeTest.outcomes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activeTest?.reason" :label="t('admin.notifications.reason')">
          <el-input v-model="testForm.reason" type="textarea" :rows="3" maxlength="500" show-word-limit :placeholder="t('admin.notifications.reasonPlaceholder')" />
        </el-form-item>
      </el-form>
      <p class="test-hint">{{ t('admin.notifications.testNotice') }}</p>
      <template #footer>
        <el-button @click="testOpen = false">{{ t('admin.notifications.cancel') }}</el-button>
        <el-button type="primary" :loading="sending" @click="sendTest">{{ t('admin.notifications.send') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { listNotificationCatalog, testNotificationEmail, testNotificationWhatsApp } from '@/modules/admin/api/notification'

type Variable = { name?: string; location?: string; source?: string }
type Item = {
  code?: string
  channel?: string
  scene?: string
  name?: string
  template?: string
  trigger?: string
  recipient?: string
  recipientSource?: string
  wired?: boolean
  variables?: Variable[]
}

type Outcome = { value: string; label: string }
type TestSpec = { code: string; channel: 'EMAIL' | 'WHATSAPP'; type: string; outcomes: Outcome[]; reason: boolean }

const emailOutcomes = {
  cancel: [
    { value: 'REFUND_ISSUED', zh: '已退款', en: 'Refund issued' },
    { value: '6H', zh: '6 小时内不退', en: 'No refund within 6 hours' },
    { value: '3H', zh: '3 小时内不退', en: 'No refund within 3 hours' },
  ],
  resolution: [
    { value: 'REFUND', zh: '退款', en: 'Refund' },
    { value: 'CREDIT', zh: '账户余额', en: 'Account credit' },
    { value: 'RESERVICE', zh: '重新服务', en: 'Re-service' },
  ],
}
const whatsAppCancel = [
  { value: 'REFUND', zh: '退款', en: 'Refund' },
  { value: 'NO_REFUND', zh: '不退款', en: 'No refund' },
]

const testSpecs: TestSpec[] = [
  spec('order.email.booking-confirmed', 'EMAIL', 'A1'),
  spec('order.email.rescheduled', 'EMAIL', 'A2'),
  spec('order.email.hourx-rescheduled', 'EMAIL', 'A2.1', [], true),
  spec('order.email.customer-cancelled', 'EMAIL', 'A3', emailOutcomes.cancel),
  spec('order.email.hourx-cancelled', 'EMAIL', 'A4', [], true),
  spec('order.email.payment-receipt', 'EMAIL', 'B1'),
  spec('order.email.tax-invoice', 'EMAIL', 'B2'),
  spec('order.email.payment-failed', 'EMAIL', 'B3'),
  spec('order.email.complaint-ack', 'EMAIL', 'C1', [], true),
  spec('order.email.complaint-resolution', 'EMAIL', 'C2', emailOutcomes.resolution),
  spec('order.email.damage-claim', 'EMAIL', 'C3', [], true),
  spec('order.email.general-inquiry', 'EMAIL', 'D1', [], true),
  spec('order.email.pricing-quote', 'EMAIL', 'D2'),
  spec('order.email.out-of-office', 'EMAIL', 'D3'),
  spec('order.whatsapp.booking-confirm', 'WHATSAPP', 'A1'),
  spec('order.whatsapp.customer-rescheduled', 'WHATSAPP', 'A2'),
  spec('order.whatsapp.hourx-reschedule-customer', 'WHATSAPP', 'A2.1', [], true),
  spec('order.whatsapp.customer-cancel', 'WHATSAPP', 'A3', whatsAppCancel, true),
  spec('order.whatsapp.hourx-cancel-customer', 'WHATSAPP', 'A4', [], true),
  spec('order.whatsapp.supplier-assignment', 'WHATSAPP', 'ASSIGN'),
  spec('order.whatsapp.looks-good', 'WHATSAPP', 'LOOKSGOOD'),
  spec('order.whatsapp.ratings', 'WHATSAPP', 'COMPLETED'),
  spec('order.whatsapp.provider-arrived', 'WHATSAPP', 'ARRIVED'),
  spec('order.whatsapp.staff-paid', 'WHATSAPP', 'STAFF-PAID'),
]

function spec(code: string, channel: TestSpec['channel'], type: string, outcomes: { value: string; zh: string; en: string }[] = [], reason = false): TestSpec {
  return {
    code,
    channel,
    type,
    reason,
    outcomes: outcomes.map((item) => ({ value: item.value, label: item.zh })),
  }
}

const { t, locale } = useI18n({ useScope: 'global' })
const loading = ref(false)
const sending = ref(false)
const testOpen = ref(false)
const testForm = reactive({ code: '', orderNo: '', to: '', outcome: '', reason: '' })
const keyword = ref('')
const channel = ref('')
const items = ref<Item[]>([])
const summary = reactive({ total: 0, emailCount: 0, whatsAppCount: 0 })
const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)

const load = async () => {
  loading.value = true
  try {
    const data = unwrap(await listNotificationCatalog({
      channel: channel.value || undefined,
      keyword: keyword.value.trim() || undefined,
    })) || {}
    items.value = Array.isArray(data.items) ? data.items : []
    summary.total = Number(data.total || items.value.length)
    summary.emailCount = Number(data.emailCount || 0)
    summary.whatsAppCount = Number(data.whatsAppCount || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.notifications.loadFailed'))
  } finally {
    loading.value = false
  }
}

const localizedOutcomes = (code: string) => {
  const found = testSpecs.find((item) => item.code === code)
  if (!found) return []
  const english = String(locale.value || '').toLowerCase().startsWith('en')
  const source = found.code.endsWith('customer-cancelled')
    ? emailOutcomes.cancel
    : found.code.endsWith('complaint-resolution')
      ? emailOutcomes.resolution
      : found.code.endsWith('customer-cancel')
        ? whatsAppCancel
        : []
  return source.map((item) => ({ value: item.value, label: english ? item.en : item.zh }))
}

const testOf = (code?: string) => testSpecs.find((item) => item.code === code)
const activeTest = computed(() => {
  const found = testOf(testForm.code)
  if (!found) return null
  return { ...found, outcomes: localizedOutcomes(found.code) }
})
const testOptions = computed(() => testSpecs.map((item) => {
  const row = items.value.find((entry) => entry.code === item.code)
  const name = row?.name || item.code
  return { code: item.code, label: `${name} · ${item.type}` }
}))

watch(() => testForm.code, (code) => {
  testForm.outcome = localizedOutcomes(code)[0]?.value || ''
})

const openTest = (row?: Item) => {
  const next = row?.code && testOf(row.code) ? row.code : testSpecs[0].code
  testForm.code = next
  testForm.outcome = localizedOutcomes(next)[0]?.value || ''
  testForm.reason = ''
  testOpen.value = true
}

const sendTest = async () => {
  const current = activeTest.value
  const orderNo = testForm.orderNo.trim()
  if (!current) {
    ElMessage.warning(t('admin.notifications.typeRequired'))
    return
  }
  if (!orderNo) {
    ElMessage.warning(t('admin.notifications.orderRequired'))
    return
  }
  const name = testOptions.value.find((item) => item.code === current.code)?.label || current.type
  try {
    await ElMessageBox.confirm(
      t('admin.notifications.confirmBody', { name, orderNo }),
      t('admin.notifications.confirmTitle'),
    )
  } catch {
    return
  }
  sending.value = true
  try {
    const payload = {
      orderNo,
      type: current.type,
      to: testForm.to.trim() || undefined,
      outcome: current.outcomes.length ? testForm.outcome || undefined : undefined,
      reason: current.reason ? testForm.reason.trim() || undefined : undefined,
    }
    const result = current.channel === 'WHATSAPP'
      ? await testNotificationWhatsApp(payload)
      : await testNotificationEmail(payload)
    ElMessage.success(typeof result === 'string' && result ? result : t('admin.notifications.sent'))
    testOpen.value = false
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || t('admin.notifications.sendFailed'))
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.catalog-page { display: grid; gap: 16px; color: #05152b; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.page-header p { margin: 0 0 4px; color: #74685a; font-size: 13px; }
.page-header h1 { margin: 0; font-size: 28px; }
.test-hint { margin: 0 0 14px; color: #74685a; font-size: 13px; line-height: 1.5; }
:global(.notice-test-dialog .el-select),
:global(.notice-test-dialog .el-input),
:global(.notice-test-dialog .el-textarea) { width: 100%; }
.toolbar { display: flex; gap: 10px; }
.toolbar .el-input { max-width: 320px; }
.toolbar .el-select { width: 160px; }
.counts { display: flex; gap: 16px; color: #5c564c; font-size: 13px; }
.catalog-page :deep(.el-table) { border-radius: 12px; }
.catalog-page small, .empty-note { color: #7a7166; }
.empty-note { margin: 8px 0 0; }
</style>
