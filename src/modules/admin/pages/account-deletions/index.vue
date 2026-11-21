<template>
  <main class="deletion-queue">
    <header><div><p>HOURX HOME · PRIVACY</p><h1>{{ copy.title }}</h1><span>{{ copy.intro }}</span></div>
      <el-button :loading="loading" @click="load">{{ copy.refresh }}</el-button>
    </header>
    <el-alert :title="copy.sla" :description="copy.warning" type="warning" show-icon :closable="false" />
    <section class="queue-panel">
      <div class="filters"><el-select v-model="status" @change="changeStatus">
        <el-option v-for="key in ['requested', 'processing', 'completed', 'all']" :key="key" :value="key" :label="copy[key as keyof typeof copy]" />
      </el-select><span>{{ total }} {{ copy.requests }}</span></div>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows" row-key="requestId" border :empty-text="copy.empty">
        <el-table-column prop="requestId" :label="copy.requestId" min-width="280" />
        <el-table-column prop="userId" :label="copy.userId" width="120" />
        <el-table-column :label="copy.status" width="140"><template #default="{ row }">{{ copy[row.status as 'requested'] }}</template></el-table-column>
        <el-table-column :label="copy.requestedAt" min-width="185"><template #default="{ row }">{{ date(row.requestedAt) }}</template></el-table-column>
        <el-table-column :label="copy.actions" width="170"><template #default="{ row }"><el-button link type="primary" @click="open(row)">{{ copy.open }}</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pageNum" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="load" />
    </section>
    <el-dialog v-model="dialog" :title="copy.detail" width="min(680px, 94vw)" :close-on-click-modal="false" @closed="clearDetail">
      <template v-if="selected">
        <dl><dt>{{ copy.requestId }}</dt><dd>{{ selected.requestId }}</dd><dt>{{ copy.userId }}</dt><dd>{{ selected.userId }}</dd>
          <dt>{{ copy.status }}</dt><dd>{{ copy[selected.status] }}</dd><dt>{{ copy.requestedAt }}</dt><dd>{{ date(selected.requestedAt) }}</dd></dl>
        <el-alert :title="copy.manualTitle" :description="copy.manualDescription" type="info" :closable="false" />
        <ol class="steps"><li v-for="step in copy.steps" :key="step">{{ step }}</li></ol>
        <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
        <el-button v-if="selected.status === 'requested'" type="primary" :loading="saving" @click="start">{{ copy.start }}</el-button>
        <el-form v-else-if="selected.status === 'processing'" label-position="top">
          <el-form-item :label="copy.ticket"><el-input v-model="completion.ticketReference" maxlength="120" autocomplete="off" /></el-form-item>
          <el-form-item :label="copy.retention"><el-input v-model="completion.retentionSummary" type="textarea" :rows="4" maxlength="2000" show-word-limit :placeholder="copy.retentionHint" /></el-form-item>
          <div class="checks"><el-checkbox v-for="item in checks" :key="item.key" v-model="completion[item.key]">{{ item.label }}</el-checkbox></div>
          <el-button type="danger" :loading="saving" :disabled="!canComplete" @click="complete">{{ copy.complete }}</el-button>
        </el-form>
        <template v-else-if="selected.status === 'completed'"><p>{{ copy.completedAt }}: {{ date(selected.completedAt) }}</p><pre v-if="selected.completionAudit">{{ selected.completionAudit }}</pre></template>
      </template>
      <template #footer><el-button @click="dialog = false">{{ copy.close }}</el-button></template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { getAdminAuthStorageValue } from '@/utils/auth-state';
import { listDeletionRequests, getDeletionRequest, startDeletionRequest, completeDeletionRequest, type DeletionRequest, type DeletionCompletion } from '@/modules/admin/api/accountDeletion';

const { locale } = useI18n();
const en = {
  title: 'Account deletion requests', intro: 'Customer self-service requests · Platform super administrators only',
  refresh: 'Refresh', sla: 'Complete within 7 business days', warning: 'If more time is required, notify the customer of the reason and expected completion date. Starting work does not delete an account.',
  requested: 'Requested', processing: 'Processing', completed: 'Completed', all: 'All statuses', requests: 'requests',
  empty: 'No requests in this status', requestId: 'Request reference', userId: 'Customer ID', status: 'Status',
  requestedAt: 'Requested (Dubai time)', completedAt: 'Completed (Dubai time)', actions: 'Actions', open: 'View request', detail: 'Deletion fulfilment',
  manualTitle: 'Manual data erasure is required before completion',
  manualDescription: 'Use the backend account-deletion runbook. This page records and verifies fulfilment; it does not erase transactions, photos, processors or backups for you.',
  steps: [
    'Review bookings, refunds and unused package visits; resolve obligations and prevent new activity during final erasure.',
    'Erase the account, saved addresses, reviews, verification records, associated uploads and non-required tracking data. Remove saved payment details from processors.',
    'For records that must be retained, document the legal or dispute reason, restricted access and next review / erasure date in the fulfilment ticket.',
    'Confirm completion to the customer. Only then record completion below; the server also verifies that primary personal records are gone.',
  ],
  start: 'Start processing', ticket: 'Fulfilment ticket reference (no personal data)', retention: 'Retention review summary',
  retentionHint: 'List retained categories, reasons, policy references and review dates, or explicitly state none. Do not copy deleted personal data.',
  obligations: 'Bookings, refunds and package entitlements have been resolved.', erased: 'Account and associated personal data have been erased.',
  processors: 'External processors, uploads, caches and backup retention have been handled.', reviewed: 'Required retained records have reasons and review dates in the ticket.', notified: 'The customer has received completion confirmation.',
  complete: 'Record verified completion', confirm: 'Record completion only after the actual erasure and customer notification are finished. This cannot be undone from this page.',
  close: 'Close', cancel: 'Cancel', confirmButton: 'Confirm fulfilment', failed: 'Unable to load or update the request. Please refresh and try again.',
};
const zh: typeof en = {
  title: '账户删除申请', intro: '消费者自助申请 · 仅平台超级管理员可处理', refresh: '刷新', sla: '7 个工作日内完成删除',
  warning: '需要延期时，应向用户通知原因和预计完成时间。“开始处理”不代表账户已删除。',
  requested: '待处理', processing: '处理中', completed: '已完成', all: '全部状态', requests: '份申请', empty: '暂无该状态申请',
  requestId: '申请编号', userId: '消费者 ID', status: '状态', requestedAt: '申请时间（迪拜）', completedAt: '完成时间（迪拜）',
  actions: '操作', open: '查看申请', detail: '删除执行与验收', manualTitle: '完成验收前必须真正执行人工数据清理',
  manualDescription: '请按服务端账户删除操作手册执行。本页面记录并核验执行结果，不会替你删除交易、照片、第三方系统或备份数据。',
  steps: [
    '核实订单、退款及套餐剩余服务权益，解决相关义务；最终清理期间阻止新活动。',
    '删除账户、保存地址、评价、验证记录、关联上传文件及无需保留的追踪数据，并清理支付服务商保存的付款信息。',
    '必须保留的记录需在执行工单说明法定或争议处理原因、访问限制、下次复核或删除日期。',
    '向用户发送完成确认，再进行下方验收。服务端也会核验主要个人资料记录已经删除。',
  ],
  start: '开始处理', ticket: '执行工单编号（不要填个人资料）', retention: '留存复核摘要',
  retentionHint: '列出留存类别、原因、政策依据与复核日期；无留存请明确写“无”。不要复制已删除的个人资料。',
  obligations: '订单、退款及套餐权益已处理完毕。', erased: '账户及关联个人资料已实际删除。',
  processors: '第三方处理方、上传文件、缓存及备份留存已处理。', reviewed: '需留存记录已在工单说明原因和复核日期。', notified: '已向用户发送删除完成确认。',
  complete: '记录已核验完成', confirm: '仅在实际清理和用户通知均已完成后记录。本页面无法撤销该完成记录。', close: '关闭',
  cancel: '取消', confirmButton: '确认执行完成', failed: '无法读取或更新申请，请刷新后重试。',
};
const copy = computed(() => locale.value.startsWith('zh') ? zh : en);
const rows = ref<DeletionRequest[]>([]), total = ref(0), pageNum = ref(1), status = ref('requested');
const loading = ref(false), saving = ref(false), error = ref(''), detailError = ref(''), dialog = ref(false);
const selected = ref<DeletionRequest | null>(null);
const blank = (): DeletionCompletion => ({ ticketReference: '', retentionSummary: '', businessObligationsResolved: false, personalDataErased: false, externalProcessorsHandled: false, retentionReviewed: false, customerNotified: false });
const completion = reactive(blank());
const checks = computed(() => ([
  { key: 'businessObligationsResolved', label: copy.value.obligations }, { key: 'personalDataErased', label: copy.value.erased },
  { key: 'externalProcessorsHandled', label: copy.value.processors }, { key: 'retentionReviewed', label: copy.value.reviewed },
  { key: 'customerNotified', label: copy.value.notified },
] as const));
const canComplete = computed(() => checks.value.every(({ key }) => completion[key])
  && /^[A-Za-z0-9][A-Za-z0-9._/-]{2,119}$/.test(completion.ticketReference) && completion.retentionSummary.trim().length > 0);
let disposed = false, loadSerial = 0, detailSerial = 0;
let pageOwner = '', loadedOwner = '', selectedOwner = '';
const owner = () => getAdminAuthStorageValue('token') || '';
function syncOwner() {
  const next = owner();
  if (pageOwner === next) return false;
  pageOwner = next; loadedOwner = ''; selectedOwner = '';
  ++loadSerial; ++detailSerial; rows.value = []; total.value = 0; selected.value = null;
  dialog.value = false; saving.value = false; loading.value = false; error.value = ''; detailError.value = '';
  Object.assign(completion, blank());
  return true;
}
const active = (token: string | null | undefined) => {
  if (disposed) return false;
  if (owner() !== pageOwner) syncOwner();
  return owner() === token && pageOwner === token;
};
const message = (e: unknown) => e instanceof Error ? e.message : copy.value.failed;
const date = (value?: string) => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat(locale.value.startsWith('zh') ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
async function load() {
  syncOwner();
  const serial = ++loadSerial, token = owner(); loading.value = true; error.value = ''; rows.value = [];
  try { const data = await listDeletionRequests({ pageNum: pageNum.value, pageSize: 20, status: status.value === 'all' ? undefined : status.value }, token);
    if (active(token) && serial === loadSerial) { rows.value = data.list; total.value = data.total; loadedOwner = token; }
  } catch (e) { if (active(token) && serial === loadSerial) error.value = message(e); }
  finally { if (active(token) && serial === loadSerial) loading.value = false; }
}
function changeStatus() { pageNum.value = 1; void load(); }
async function open(row: DeletionRequest) {
  if (syncOwner() || loadedOwner !== owner()) { void load(); return; }
  const serial = ++detailSerial, token = owner(); selected.value = null; detailError.value = ''; Object.assign(completion, blank());
  try { const data = await getDeletionRequest(row.requestId, token); if (active(token) && serial === detailSerial) { selected.value = data; selectedOwner = token; dialog.value = true; } }
  catch (e) { if (active(token) && serial === detailSerial) error.value = message(e); }
}
function clearDetail() { ++detailSerial; selectedOwner = ''; selected.value = null; detailError.value = ''; Object.assign(completion, blank()); }
async function start() { await mutate(false); }
async function complete() {
  if (syncOwner() || !canComplete.value || saving.value || !selected.value || !dialog.value || selectedOwner !== owner()) return;
  const id = selected.value.requestId, serial = detailSerial, token = owner();
  try { await ElMessageBox.confirm(copy.value.confirm, copy.value.complete, { type: 'warning', confirmButtonText: copy.value.confirmButton, cancelButtonText: copy.value.cancel }); }
  catch { return; }
  if (active(token) && dialog.value && selectedOwner === token && serial === detailSerial && selected.value?.requestId === id) await mutate(true);
}
async function mutate(finishing: boolean) {
  if (syncOwner() || saving.value || !selected.value || !dialog.value || selectedOwner !== owner()) return;
  const id = selected.value.requestId, serial = detailSerial, token = owner(); saving.value = true; detailError.value = '';
  try { const data = finishing ? await completeDeletionRequest(id, { ...completion }, token) : await startDeletionRequest(id, token);
    if (active(token) && serial === detailSerial && selected.value?.requestId === id) { selected.value = data; void load(); }
  } catch (e) { if (active(token) && serial === detailSerial) detailError.value = message(e); }
  finally { if (active(token)) saving.value = false; }
}
const resume = () => { if (syncOwner()) void load(); };
onMounted(() => { window.addEventListener('storage', resume); window.addEventListener('focus', resume); void load(); });
onBeforeUnmount(() => { disposed = true; ++loadSerial; ++detailSerial; window.removeEventListener('storage', resume); window.removeEventListener('focus', resume); });
</script>

<style scoped lang="scss">
.deletion-queue { padding: 24px; color: #182334; header { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 22px; p { color: #8a7350; font-size: 12px; letter-spacing: .1em; } h1 { margin: 8px 0; font-size: 27px; } span { color: #666b73; } } }
.queue-panel { background: white; padding: 22px; border: 1px solid #e8e4dd; border-radius: 12px; margin-top: 22px; }
.filters { display: flex; align-items: center; gap: 20px; margin-bottom: 18px; .el-select { width: 200px; } }
.el-pagination { margin-top: 20px; } dl { display: grid; grid-template-columns: 160px 1fr; gap: 10px; dd { margin: 0; overflow-wrap: anywhere; } dt { color: #666b73; } }
.steps { padding-left: 23px; line-height: 1.6; li { margin-bottom: 8px; } }
.checks { display: grid; margin-bottom: 20px; gap: 10px; .el-checkbox { height: auto; white-space: normal; align-items: start; :deep(.el-checkbox__label) { white-space: normal; line-height: 1.5; } } }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f7f6f3; padding: 14px; }
@media (max-width: 600px) { .deletion-queue { padding: 12px; } .queue-panel { padding: 12px; } dl { grid-template-columns: 1fr; gap: 5px; } }
</style>
