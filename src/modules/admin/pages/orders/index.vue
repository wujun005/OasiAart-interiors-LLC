<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-row">
          <el-input
            v-model.trim="query.orderNo"
            :placeholder="t('admin.orders.filters.orderNo')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model.trim="query.userPhone"
            :placeholder="t('admin.orders.filters.userPhone')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model.trim="query.contactPhone"
            :placeholder="t('admin.orders.filters.contactPhone')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model.trim="query.productName"
            :placeholder="t('admin.orders.filters.productName')"
            clearable
            @keyup.enter="handleSearch"
          />
          <div class="toolbar-time">
            <span class="toolbar-time__label">
              {{ t('admin.orders.table.serviceTime') }}
            </span>
            <el-date-picker
              v-model="query.serviceTimeRange"
              type="daterange"
              unlink-panels
              value-format="YYYY-MM-DD"
              :range-separator="t('admin.orders.filters.rangeSeparator')"
              :start-placeholder="t('admin.orders.filters.serviceTimeStart')"
              :end-placeholder="t('admin.orders.filters.serviceTimeEnd')"
              clearable
            />
          </div>
        </div>
        <div class="toolbar-row">
          <el-select
            v-model="query.orderStatus"
            :placeholder="t('admin.orders.filters.orderStatus')"
            clearable
          >
            <el-option
              v-for="item in orderStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="query.paymentStatus"
            :placeholder="t('admin.orders.filters.paymentStatus')"
            clearable
          >
            <el-option
              v-for="item in paymentStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            {{ t('admin.orders.actions.search') }}
          </el-button>
          <el-button @click="reset">
            {{ t('admin.orders.actions.reset') }}
          </el-button>
        </div>
      </div>

      <el-table :data="orders" border stripe v-loading="tableLoading" row-key="id">
        <el-table-column prop="orderNo" :label="t('admin.orders.table.orderNo')" min-width="180" />
        <el-table-column
          prop="productName"
          :label="t('admin.orders.table.productName')"
          min-width="160"
        />
        <el-table-column
          prop="specDescText"
          :label="t('admin.orders.table.specDesc')"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column
          prop="userPhone"
          :label="t('admin.orders.table.userPhone')"
          min-width="140"
        />
        <el-table-column
          prop="contactPhone"
          :label="t('admin.orders.table.contactPhone')"
          min-width="140"
        />
        <el-table-column
          prop="serviceTime"
          :label="t('admin.orders.table.serviceTime')"
          min-width="160"
        >
          <template #default="{ row }">
            {{ row.serviceTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.paymentStatus')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="paymentStatusTag(row.paymentStatusCode)">
              {{ row.paymentStatusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.orderStatus')" min-width="130">
          <template #default="{ row }">
            <el-tag :type="orderStatusTag(row.orderStatusCode)">
              {{ row.orderStatusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amountText" :label="t('admin.orders.table.amount')" min-width="120" />
        <el-table-column :label="t('admin.orders.table.createdAt')" min-width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="adminRemark"
          :label="t('admin.orders.table.adminRemark')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.adminRemark || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :disabled="!row.orderId"
              @click="openRemarkDialog(row)"
            >
              {{ t('admin.orders.actions.remark') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          layout="prev, pager, next, jumper, ->, total, sizes"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="remarkDialogVisible"
      :title="t('admin.orders.dialog.remarkTitle')"
      :close-on-click-modal="false"
      width="560px"
    >
      <el-form label-width="90px">
        <el-form-item :label="t('admin.orders.form.orderNo')">
          <el-input :model-value="remarkForm.orderNo" disabled />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.adminRemark')">
          <el-input
            v-model="remarkForm.adminRemark"
            type="textarea"
            :rows="5"
            :placeholder="t('admin.orders.form.adminRemarkPlaceholder')"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">
          {{ t('admin.orders.actions.cancel') }}
        </el-button>
        <el-button type="primary" :loading="remarkSubmitting" @click="submitRemark">
          {{ t('admin.orders.actions.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { page, updateAdminRemark } from '@/modules/admin/api/order';

type I18nText = Record<string, string>;

type OrderRow = {
  orderId: number | null;
  id: string | number;
  orderNo: string;
  userPhone: string;
  contactPhone: string;
  productName: string;
  adminRemark: string;
  specDescText: string;
  serviceTime: string;
  orderStatusCode: number | null;
  paymentStatusCode: number | null;
  orderStatusText: string;
  paymentStatusText: string;
  amountText: string;
  createdAt: string;
};

type RawSpecSelection = {
  specTypeId?: number | string;
  specValueId?: number | string;
  specTypeName?: string;
  specValueName?: string;
};

type RawAttachDetail = {
  attachTypeId?: number | string;
  attachValueId?: number | string;
  quantity?: number | string;
  amountWithTax?: number | string;
};

const orderStatusNameMap: Record<string, number> = {
  CREATED: 0,
  PENDING_PAYMENT: 1,
  PAID: 2,
  PROCESSING: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  CLOSED: 6,
};

const paymentStatusNameMap: Record<string, number> = {
  UNPAID: 0,
  PENDING_PAYMENT: 0,
  PARTIAL_PAID: 1,
  PARTIALLY_PAID: 1,
  PAID: 2,
  REFUNDED: 3,
};

const { t, locale } = useI18n({ useScope: 'global' });

const orderStatusOptions = computed(() => [
  { value: 0, label: t('admin.orders.status.orderCreated') },
  { value: 1, label: t('admin.orders.status.orderPendingPayment') },
  { value: 2, label: t('admin.orders.status.orderPaid') },
  { value: 3, label: t('admin.orders.status.orderProcessing') },
  { value: 4, label: t('admin.orders.status.orderCompleted') },
  { value: 5, label: t('admin.orders.status.orderCancelled') },
  { value: 6, label: t('admin.orders.status.orderClosed') },
]);

const paymentStatusOptions = computed(() => [
  { value: 0, label: t('admin.orders.status.paymentPending') },
  { value: 1, label: t('admin.orders.status.paymentPartial') },
  { value: 2, label: t('admin.orders.status.paymentPaid') },
  { value: 3, label: t('admin.orders.status.paymentRefunded') },
]);

const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const defaultServiceTimeRange = (): [string, string] => {
  const today = getTodayString();
  return [today, today];
};

const query = reactive({
  orderNo: '',
  userPhone: '',
  contactPhone: '',
  productName: '',
  serviceTimeRange: defaultServiceTimeRange() as [string, string],
  orderStatus: '' as '' | number,
  paymentStatus: '' as '' | number,
  pageNum: 1,
  pageSize: 10,
});

const orders = ref<OrderRow[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const remarkDialogVisible = ref(false);
const remarkSubmitting = ref(false);
const remarkForm = reactive({
  orderId: null as number | null,
  orderNo: '',
  adminRemark: '',
});

const formatDateTime = (value?: string) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  const ss = `${d.getSeconds()}`.padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};

const paymentStatusTag = (code: number | null) => {
  if (code === 2) return 'success';
  if (code === 3) return 'info';
  if (code === 0 || code === 1) return 'warning';
  return '';
};

const orderStatusTag = (code: number | null) => {
  if (code === 4) return 'success';
  if (code === 5 || code === 6) return 'info';
  if (code === 0 || code === 1 || code === 2 || code === 3) return 'warning';
  return '';
};

const formatAmount = (raw: unknown) => {
  if (raw === null || raw === undefined || raw === '') return '-';
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(raw);
  return Number.isInteger(num) ? `${num}` : num.toFixed(2);
};

const normalizeCode = (
  value: unknown,
  nameMap: Record<string, number>,
): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num;
  }
  const key = String(value).trim().toUpperCase();
  if (!key) return null;
  return key in nameMap ? nameMap[key] : null;
};

const normalizeOrderId = (value: unknown): number | null => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (i18n?: I18nText, fallback = ''): string => {
  const valueMap = i18n || {};
  const preferredLangs = getPreferredLangs();
  for (const lang of preferredLangs) {
    const value = valueMap[lang];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === 'string' && value.trim(),
  );
  if (typeof firstValue === 'string') {
    return firstValue.trim();
  }
  return fallback;
};

const getI18nMapValue = (
  source: Record<string, I18nText> | undefined,
  id: unknown,
  fallback = '',
) => {
  const key = String(id ?? '').trim();
  if (!key || !source || typeof source !== 'object') {
    return fallback;
  }
  return pickI18nValue(source[key], fallback);
};

const joinLabelValue = (label: string, value: string) => {
  const normalizedLabel = String(label || '').trim();
  const normalizedValue = String(value || '').trim();
  if (!normalizedLabel) return normalizedValue;
  if (!normalizedValue) return normalizedLabel;
  if (/[：:]$/.test(normalizedLabel)) {
    return `${normalizedLabel}${normalizedValue}`;
  }
  return `${normalizedLabel}: ${normalizedValue}`;
};

const getOrderStatusText = (code: number | null) => {
  if (code === 0) return t('admin.orders.status.orderCreated');
  if (code === 1) return t('admin.orders.status.orderPendingPayment');
  if (code === 2) return t('admin.orders.status.orderPaid');
  if (code === 3) return t('admin.orders.status.orderProcessing');
  if (code === 4) return t('admin.orders.status.orderCompleted');
  if (code === 5) return t('admin.orders.status.orderCancelled');
  if (code === 6) return t('admin.orders.status.orderClosed');
  return '-';
};

const getPaymentStatusText = (code: number | null) => {
  if (code === 0) return t('admin.orders.status.paymentPending');
  if (code === 1) return t('admin.orders.status.paymentPartial');
  if (code === 2) return t('admin.orders.status.paymentPaid');
  if (code === 3) return t('admin.orders.status.paymentRefunded');
  return '-';
};

const parseSpecDescText = (item: any) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {};
  const specTypeNameI18n = (
    order.specTypeNameI18n ?? item.specTypeNameI18n ?? {}
  ) as Record<string, I18nText>;
  const specValueNameI18n = (
    order.specValueNameI18n ?? item.specValueNameI18n ?? {}
  ) as Record<string, I18nText>;
  const attachTypeNameI18n = (
    order.attachTypeNameI18n ?? item.attachTypeNameI18n ?? {}
  ) as Record<string, I18nText>;
  const attachValueNameI18n = (
    order.attachValueNameI18n ?? item.attachValueNameI18n ?? {}
  ) as Record<string, I18nText>;
  const selections = (
    Array.isArray(order.specSelections)
      ? order.specSelections
      : Array.isArray(item.specSelections)
        ? item.specSelections
        : []
  ) as RawSpecSelection[];
  const specValues = selections
    .map((s) => {
      const typeName =
        String(s?.specTypeName || '').trim() ||
        getI18nMapValue(specTypeNameI18n, s?.specTypeId);
      const valueName =
        String(s?.specValueName || '').trim() ||
        getI18nMapValue(specValueNameI18n, s?.specValueId);
      return joinLabelValue(typeName, valueName);
    })
    .filter(Boolean);
  const attachDetails = (
    Array.isArray(order.attachDetails)
      ? order.attachDetails
      : Array.isArray(item.attachDetails)
        ? item.attachDetails
        : []
  ) as RawAttachDetail[];
  const attachValues = attachDetails
    .map((attach) => {
      const typeName = getI18nMapValue(attachTypeNameI18n, attach?.attachTypeId);
      const valueName = getI18nMapValue(attachValueNameI18n, attach?.attachValueId);
      const quantity = Number(attach?.quantity ?? 0);
      const summary = joinLabelValue(typeName, valueName);
      if (!summary) {
        return '';
      }
      return quantity > 0 ? `${summary} x ${quantity}` : summary;
    })
    .filter(Boolean);
  const values = [...specValues, ...attachValues];
  if (values.length) return values.join(' / ');
  const fallback = String(order.specDesc ?? item.specDesc ?? '').trim();
  return fallback || '-';
};

const parseAmountText = (item: any) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {};
  const explicitAmount =
    order.totalAmount ??
    item.totalAmount ??
    order.orderAmount ??
    item.orderAmount ??
    order.amount ??
    item.amount;
  const currency = String(order.currency ?? item.currency ?? '').trim();
  if (explicitAmount !== null && explicitAmount !== undefined && explicitAmount !== '') {
    const amountText = formatAmount(explicitAmount);
    return currency ? `${amountText} ${currency}` : amountText;
  }
  const attachList = (
    Array.isArray(order.attachDetails)
      ? order.attachDetails
      : Array.isArray(item.attachDetails)
        ? item.attachDetails
        : []
  ) as RawAttachDetail[];
  const attachTotal = attachList.reduce((sum, attach) => {
    const current = Number(attach?.amountWithTax ?? 0);
    return Number.isFinite(current) ? sum + current : sum;
  }, 0);
  if (attachTotal > 0) {
    const totalText = formatAmount(attachTotal);
    return currency ? `${totalText} ${currency}` : totalText;
  }
  return '-';
};

const normalizePage = (payload: any) => {
  const root = payload?.data ?? payload ?? {};
  if (Array.isArray(root.list)) {
    return {
      list: root.list,
      total: Number(root.total ?? root.list.length) || root.list.length,
      pageNum: Number(root.pageNum ?? query.pageNum) || query.pageNum,
      pageSize: Number(root.pageSize ?? query.pageSize) || query.pageSize,
    };
  }
  if (Array.isArray(root.data?.list)) {
    const pageData = root.data;
    return {
      list: pageData.list,
      total: Number(pageData.total ?? pageData.list.length) || pageData.list.length,
      pageNum: Number(pageData.pageNum ?? query.pageNum) || query.pageNum,
      pageSize: Number(pageData.pageSize ?? query.pageSize) || query.pageSize,
    };
  }
  if (Array.isArray(root.data)) {
    return {
      list: root.data,
      total: Number(root.total ?? root.data.length) || root.data.length,
      pageNum: Number(root.pageNum ?? query.pageNum) || query.pageNum,
      pageSize: Number(root.pageSize ?? query.pageSize) || query.pageSize,
    };
  }
  return { list: [], total: 0, pageNum: query.pageNum, pageSize: query.pageSize };
};

const parseOrderRow = (item: any): OrderRow => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {};
  const orderId = normalizeOrderId(
    order.orderId ?? item.orderId ?? order.id ?? item.id,
  );
  const rawOrderStatus =
    order.orderStatus ?? item.orderStatus ?? order.status ?? item.status;
  const rawPaymentStatus =
    order.paymentStatus ?? item.paymentStatus ?? order.payStatus ?? item.payStatus;
  const productNameI18n = (order.productNameI18n ?? item.productNameI18n ?? {}) as I18nText;
  const orderStatusNameI18n = (
    order.orderStatusNameI18n ?? item.orderStatusNameI18n ?? {}
  ) as I18nText;
  const paymentStatusNameI18n = (
    order.paymentStatusNameI18n ?? item.paymentStatusNameI18n ?? {}
  ) as I18nText;
  const orderStatusCode = normalizeCode(
    rawOrderStatus,
    orderStatusNameMap,
  );
  const paymentStatusCode = normalizeCode(
    rawPaymentStatus,
    paymentStatusNameMap,
  );

  return {
    orderId,
    id: orderId ?? String(order.orderNo ?? item.orderNo ?? ''),
    orderNo: String(order.orderNo ?? item.orderNo ?? '').trim(),
    userPhone: String(order.userPhone ?? item.userPhone ?? order.phone ?? item.phone ?? '').trim(),
    contactPhone: String(
      order.contactPhone ?? item.contactPhone ?? order.recipientPhone ?? item.recipientPhone ?? '',
    ).trim(),
    productName: pickI18nValue(
      productNameI18n,
      String(order.productName ?? item.productName ?? order.spuName ?? item.spuName ?? '').trim(),
    ),
    adminRemark: String(order.adminRemark ?? item.adminRemark ?? '').trim(),
    specDescText: parseSpecDescText(item),
    serviceTime: String(order.serviceTime ?? item.serviceTime ?? '').trim(),
    orderStatusCode,
    paymentStatusCode,
    orderStatusText: pickI18nValue(
      orderStatusNameI18n,
      orderStatusCode === null
        ? String(rawOrderStatus ?? '').trim() || '-'
        : getOrderStatusText(orderStatusCode),
    ),
    paymentStatusText: pickI18nValue(
      paymentStatusNameI18n,
      paymentStatusCode === null
        ? String(rawPaymentStatus ?? '').trim() || '-'
        : getPaymentStatusText(paymentStatusCode),
    ),
    amountText: parseAmountText(item),
    createdAt: String(order.orderTime ?? item.orderTime ?? order.createTime ?? item.createTime ?? '').trim(),
  };
};

const normalizeOptionalParam = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower === 'undefined' || lower === 'null') return '';
  return text;
};

const normalizeOptionalNumberParam = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const requestPayload = computed(() => {
  const payload: Record<string, any> = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  };

  const orderNo = normalizeOptionalParam(query.orderNo);
  if (orderNo) payload.orderNo = orderNo;

  const userPhone = normalizeOptionalParam(query.userPhone);
  if (userPhone) payload.userPhone = userPhone;

  const contactPhone = normalizeOptionalParam(query.contactPhone);
  if (contactPhone) payload.contactPhone = contactPhone;

  const productName = normalizeOptionalParam(query.productName);
  if (productName) payload.productName = productName;

  const [rawServiceTimeStart = '', rawServiceTimeEnd = ''] = Array.isArray(query.serviceTimeRange)
    ? query.serviceTimeRange
    : ['', ''];
  const serviceTimeStart = normalizeOptionalParam(rawServiceTimeStart);
  const serviceTimeEnd = normalizeOptionalParam(rawServiceTimeEnd);
  if (serviceTimeStart) payload.serviceTimeStart = serviceTimeStart;
  if (serviceTimeEnd) payload.serviceTimeEnd = serviceTimeEnd;

  const orderStatus = normalizeOptionalNumberParam(query.orderStatus);
  if (orderStatus !== null) payload.orderStatus = orderStatus;

  const paymentStatus = normalizeOptionalNumberParam(query.paymentStatus);
  if (paymentStatus !== null) payload.paymentStatus = paymentStatus;

  return payload;
});

const fetchOrders = async () => {
  tableLoading.value = true;
  try {
    const res = await page(requestPayload.value);
    const parsed = normalizePage(res);
    orders.value = (parsed.list || []).map(parseOrderRow);
    total.value = parsed.total;
    query.pageNum = parsed.pageNum;
    query.pageSize = parsed.pageSize;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const openRemarkDialog = (row: OrderRow) => {
  if (!row.orderId) {
    ElMessage.warning(t('admin.orders.message.remarkOrderIdMissing'));
    return;
  }
  remarkForm.orderId = row.orderId;
  remarkForm.orderNo = row.orderNo;
  remarkForm.adminRemark = row.adminRemark || '';
  remarkDialogVisible.value = true;
};

const submitRemark = async () => {
  if (!remarkForm.orderId) {
    ElMessage.warning(t('admin.orders.message.remarkOrderIdMissing'));
    return;
  }
  remarkSubmitting.value = true;
  try {
    await updateAdminRemark({
      orderId: remarkForm.orderId,
      adminRemark: remarkForm.adminRemark || '',
    });
    ElMessage.success(t('admin.orders.message.remarkSaveSuccess'));
    remarkDialogVisible.value = false;
    const target = orders.value.find((item) => item.orderId === remarkForm.orderId);
    if (target) target.adminRemark = remarkForm.adminRemark || '';
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.remarkSaveFailed'));
  } finally {
    remarkSubmitting.value = false;
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchOrders();
};

const reset = () => {
  query.orderNo = '';
  query.userPhone = '';
  query.contactPhone = '';
  query.productName = '';
  query.serviceTimeRange = defaultServiceTimeRange();
  query.orderStatus = '';
  query.paymentStatus = '';
  query.pageNum = 1;
  query.pageSize = 10;
  fetchOrders();
};

const onPageChange = (pageNum: number) => {
  query.pageNum = pageNum;
  fetchOrders();
};

const onSizeChange = (pageSize: number) => {
  query.pageSize = pageSize;
  query.pageNum = 1;
  fetchOrders();
};

onMounted(fetchOrders);
</script>

<style scoped>
.page {
  padding: 20px;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.toolbar-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.toolbar-time {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-time__label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}
.toolbar .el-input,
.toolbar .el-select,
.toolbar .el-date-editor {
  width: 180px;
}
.toolbar-time .el-date-editor {
  width: 280px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
