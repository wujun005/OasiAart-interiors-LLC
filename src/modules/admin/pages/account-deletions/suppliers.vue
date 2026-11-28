<template>
  <main class="supplier-queue">
    <RouterLink :to="{ name: 'admin-account-deletions' }">{{ copy.consumerQueue }}</RouterLink>
    <header class="queue-header">
      <h1>{{ copy.title }}</h1>
      <el-button :loading="loading" @click="load">{{ copy.refresh }}</el-button>
    </header>
    <el-alert :title="copy.timeframe" :description="copy.reminder" type="info" :closable="false" show-icon />

    <section class="queue-panel">
      <div class="queue-filter">
        <el-select v-model="status" :aria-label="copy.status" @change="changeStatus">
          <el-option value="REQUESTED" :label="copy.REQUESTED" />
          <el-option value="IN_PROGRESS" :label="copy.IN_PROGRESS" />
          <el-option value="all" :label="copy.all" />
        </el-select>
      </div>
      <el-alert v-if="listError" :title="copy.listError" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows" row-key="requestId" :empty-text="copy.empty">
        <el-table-column prop="requestId" :label="copy.reference" min-width="270" />
        <el-table-column prop="supplierId" :label="copy.supplierId" min-width="105" />
        <el-table-column :label="copy.scope" min-width="155">
          <template #default="{ row }">{{ scopeLabel(row) }}</template>
        </el-table-column>
        <el-table-column :label="copy.status" min-width="125">
          <template #default="{ row }">{{ statusLabel(row) }}</template>
        </el-table-column>
        <el-table-column :label="copy.requestedAt" min-width="180">
          <template #default="{ row }">{{ date(row.requestedAt) }}</template>
        </el-table-column>
        <el-table-column :label="copy.actions" min-width="110">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="loading || saving" @click="open(row)">{{ copy.view }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" />
    </section>

    <el-dialog v-model="dialog" :title="copy.detail" width="min(650px, 94vw)" :close-on-click-modal="false" @close="clearDetail">
      <p v-if="detailLoading" role="status">{{ copy.loading }}</p>
      <el-alert v-if="detailError" :title="savingFailed ? copy.startError : copy.detailError" type="error" :closable="false" />
      <template v-if="selected">
        <dl class="queue-detail">
          <dt>{{ copy.reference }}</dt><dd>{{ selected.requestId }}</dd>
          <dt>{{ copy.supplierId }}</dt><dd>{{ selected.supplierId }}</dd>
          <dt>{{ copy.requesterId }}</dt><dd>{{ selected.adminUserId }}</dd>
          <dt>{{ copy.scope }}</dt><dd>{{ scopeLabel(selected) }}</dd>
          <dt>{{ copy.status }}</dt><dd>{{ statusLabel(selected) }}</dd>
          <dt>{{ copy.requestedAt }}</dt><dd>{{ date(selected.requestedAt) }}</dd>
          <template v-if="selected.startedAt">
            <dt>{{ copy.startedAt }}</dt><dd>{{ date(selected.startedAt) }}</dd>
            <dt>{{ copy.startedBy }}</dt><dd>{{ selected.startedBy }}</dd>
          </template>
        </dl>
      </template>
      <template #footer>
        <el-button @click="dialog = false">{{ copy.close }}</el-button>
        <el-button v-if="selected?.status === 'REQUESTED'" type="primary" :loading="saving" @click="start">{{ copy.start }}</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAdminAuthStorageValue } from '@/utils/auth-state';
import { adminMenuState } from '@/modules/admin/utils/menuPermission';
import { getSupplierDeletionQueueRecord, listSupplierDeletionQueue, startSupplierDeletionQueueRecord, type SupplierDeletionQueueRecord } from '@/modules/admin/api/supplierAccountDeletion';

const { locale } = useI18n();
const en = {
  consumerQueue: 'Customer deletion requests', title: 'Supplier deletion requests', refresh: 'Refresh',
  timeframe: 'Complete eligible requests within 7 business days',
  reminder: 'Check open orders and unsettled payments before deleting an account. If a request needs more time, tell the requester why and give them an expected completion date.',
  REQUESTED: 'Requested', IN_PROGRESS: 'In progress', all: 'All statuses', empty: 'No requests in this status',
  reference: 'Request reference', supplierId: 'Supplier ID', requesterId: 'Requester account ID',
  scope: 'Deletion scope', business: 'Business and staff accounts', staff: 'Staff account', status: 'Status',
  requestedAt: 'Requested (Dubai time)', startedAt: 'Started (Dubai time)', startedBy: 'Operator account ID',
  actions: 'Actions', view: 'View request', detail: 'Supplier deletion request', close: 'Close', start: 'Mark in progress',
  listError: 'Unable to load supplier requests. Refresh to try again.', detailError: 'Unable to load this request. Reopen it to try again.',
  startError: 'Unable to confirm the status change. Reopen the request to check its status.', loading: 'Loading request…',
};
const zh: typeof en = {
  consumerQueue: '消费者账户删除申请', title: '供应商注销申请', refresh: '刷新',
  timeframe: '符合条件的申请请在 7 个工作日内完成', reminder: '注销前请确认订单及款项均已处理。需要延期时，向申请人告知原因及预计完成日期。',
  REQUESTED: '待处理', IN_PROGRESS: '处理中', all: '全部状态', empty: '暂无该状态的申请',
  reference: '申请编号', supplierId: '供应商 ID', requesterId: '申请人账号 ID',
  scope: '注销范围', business: '企业及旗下员工账户', staff: '员工账户', status: '状态',
  requestedAt: '申请时间（迪拜）', startedAt: '开始处理时间（迪拜）', startedBy: '操作人账号 ID',
  actions: '操作', view: '查看申请', detail: '供应商注销申请详情', close: '关闭', start: '标记为处理中',
  listError: '无法加载供应商申请，请刷新后重试。', detailError: '无法加载该申请，请重新打开后重试。',
  startError: '未能确认状态变更，请重新打开查看最新状态。', loading: '正在加载申请…',
};
const copy = computed(() => locale.value.startsWith('zh') ? zh : en);
const pageSize = 20;
const page = ref(1);
const status = ref<'REQUESTED' | 'IN_PROGRESS' | 'all'>('REQUESTED');
const rows = ref<SupplierDeletionQueueRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const listError = ref(false);
const dialog = ref(false);
const selected = ref<SupplierDeletionQueueRecord | null>(null);
const detailLoading = ref(false);
const detailError = ref(false);
const saving = ref(false);
const savingFailed = ref(false);
let listGeneration = 0;
let detailGeneration = 0;
let loadedToken = '';
let observedToken = '';
let disposed = false;

function token() {
  const value = getAdminAuthStorageValue('token');
  return value && adminMenuState.superAdmin && adminMenuState.lastToken === value ? value : '';
}

function clearDetail() {
  detailGeneration++;
  selected.value = null;
  detailLoading.value = false;
  detailError.value = false;
  saving.value = false;
  savingFailed.value = false;
}

function syncSession() {
  const current = token();
  if (observedToken !== current) {
    observedToken = current;
    listGeneration++;
    loadedToken = '';
    rows.value = [];
    total.value = 0;
    page.value = 1;
    loading.value = false;
    listError.value = false;
    dialog.value = false;
    clearDetail();
  }
  return current;
}

const active = (owner: string) => !disposed && Boolean(owner) && syncSession() === owner;
const scopeLabel = (row: SupplierDeletionQueueRecord) => row.scope === 'SUPPLIER_ACCOUNT' ? copy.value.business : copy.value.staff;
const statusLabel = (row: SupplierDeletionQueueRecord) => copy.value[row.status];
const date = (value: string) => new Intl.DateTimeFormat(locale.value.startsWith('zh') ? 'zh-CN' : 'en-GB', {
  timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));

async function load() {
  const owner = syncSession();
  if (!owner) return;
  const generation = ++listGeneration;
  loading.value = true;
  listError.value = false;
  rows.value = [];
  loadedToken = '';
  try {
    const data = await listSupplierDeletionQueue({
      pageNum: page.value, pageSize, status: status.value === 'all' ? undefined : status.value,
    }, owner);
    if (active(owner) && generation === listGeneration) {
      rows.value = data.list;
      total.value = data.total;
      loadedToken = owner;
    }
  } catch {
    if (active(owner) && generation === listGeneration) listError.value = true;
  } finally {
    if (active(owner) && generation === listGeneration) loading.value = false;
  }
}

function changeStatus() {
  if (page.value !== 1) page.value = 1;
  void load();
}

async function open(row: SupplierDeletionQueueRecord) {
  const owner = syncSession();
  if (!owner || loadedToken !== owner || loading.value || saving.value || !rows.value.includes(row)) return;
  clearDetail();
  const generation = detailGeneration;
  dialog.value = true;
  detailLoading.value = true;
  try {
    const detail = await getSupplierDeletionQueueRecord(row.requestId, owner);
    if (active(owner) && generation === detailGeneration) selected.value = detail;
  } catch {
    if (active(owner) && generation === detailGeneration) detailError.value = true;
  } finally {
    if (active(owner) && generation === detailGeneration) detailLoading.value = false;
  }
}

async function start() {
  const owner = syncSession();
  const request = selected.value;
  if (!owner || !dialog.value || saving.value || request?.status !== 'REQUESTED') return;
  const generation = detailGeneration;
  saving.value = true;
  detailError.value = false;
  savingFailed.value = false;
  try {
    const detail = await startSupplierDeletionQueueRecord(request.requestId, owner);
    if (!active(owner)) return;
    if (generation === detailGeneration) selected.value = detail;
    void load();
  } catch {
    if (active(owner) && generation === detailGeneration) {
      savingFailed.value = true;
      detailError.value = true;
      selected.value = null;
    }
  } finally {
    if (active(owner) && generation === detailGeneration) saving.value = false;
  }
}

function resume() {
  const previous = observedToken;
  if (syncSession() !== previous) void load();
}

onMounted(() => {
  window.addEventListener('focus', resume);
  window.addEventListener('storage', resume);
  void load();
});
onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener('focus', resume);
  window.removeEventListener('storage', resume);
});
</script>

<style scoped>
.supplier-queue { padding: 24px; color: #182334; }
.supplier-queue > a { display: inline-block; padding: 6px 0; color: #1d4ed8; font-weight: 600; }
.queue-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 8px 0 18px; }
.queue-header h1 { margin: 0; font-size: clamp(21px, 4vw, 27px); }
.queue-panel { margin-top: 20px; padding: 18px; background: white; border: 1px solid #e8e4dd; border-radius: 12px; }
.queue-filter { max-width: 200px; margin-bottom: 16px; }
.queue-panel :deep(.el-pagination) { margin-top: 16px; }
.queue-detail { display: grid; grid-template-columns: minmax(130px, .7fr) minmax(120px, 1fr); gap: 9px 16px; }
.queue-detail dt { color: #58606b; }
.queue-detail dd { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 600px) { .supplier-queue, .queue-panel { padding: 12px; } }
</style>
