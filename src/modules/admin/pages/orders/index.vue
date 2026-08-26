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
          <el-button :loading="exportLoading" @click="handleExport">
            {{ t('admin.orders.actions.export') }}
          </el-button>
        </div>
      </div>

      <el-table :data="orders" border stripe v-loading="tableLoading" row-key="id">
        <el-table-column prop="orderNo" :label="t('admin.orders.table.orderNo')" min-width="180">
          <template #default="{ row }">
            <el-button
              v-if="row.orderNo"
              class="order-number-link"
              link
              type="primary"
              @click="openOrderDetail(row)"
            >
              {{ row.orderNo }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
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
          prop="attachDetailsText"
          :label="t('admin.orders.table.attachDetails')"
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
          prop="serviceAddress"
          :label="t('admin.orders.table.serviceAddress')"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.serviceAddress || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="supplierName"
          :label="t('admin.orders.table.supplierName')"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.supplierName || '-' }}
          </template>
        </el-table-column>
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
        <el-table-column :label="t('admin.orders.table.orderStatus')" min-width="190">
          <template #default="{ row }">
            <el-select
              class="order-status-select"
              :model-value="row.orderStatusCode"
              :disabled="!row.orderId || updatingStatusOrderId !== null"
              :loading="updatingStatusOrderId === row.id"
              @change="(value: number) => handleOrderStatusChange(row, value)"
            >
              <el-option
                v-for="item in orderStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          prop="paymentIntentId"
          :label="t('admin.orders.table.paymentIntentId')"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.paymentIntentId || '-' }}
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
        <el-table-column :label="t('admin.orders.table.actions')" width="400" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canReviewRefund(row)"
              link
              type="danger"
              size="small"
              :loading="stripeRefundSubmitting && stripeRefundForm.orderId === row.orderId"
              @click="openStripeRefundDialog(row)"
            >
              {{ t('admin.orders.actions.refundReview') }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              :disabled="!row.orderId"
              @click="openAssignDialog(row)"
            >
              {{ t('admin.orders.actions.assignSupplier') }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              :loading="copyingOrderId === row.id"
              @click="copySupplierInfo(row)"
            >
              {{ t('admin.orders.actions.copySupplier') }}
            </el-button>
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

    <el-drawer
      v-model="detailDrawerVisible"
      :title="t('admin.orders.dialog.detailTitle')"
      size="min(980px, 100%)"
      @closed="closeOrderDetail"
    >
      <el-skeleton v-if="detailLoading" :rows="12" animated />
      <div v-else-if="detailRow" class="order-detail">
        <header class="order-detail__hero">
          <div>
            <div class="order-detail__eyebrow">{{ t('admin.orders.detail.orderId') }}</div>
            <h2 class="order-detail__title">#{{ displayValue(detailRow.orderNo) }}</h2>
            <p class="order-detail__booked-at">
              {{ t('admin.orders.detail.bookedAt') }}:
              {{ formatDateTime(detailRow.createdAt) }}
            </p>
          </div>
          <div class="order-detail__amount">
            <span>{{ t('admin.orders.detail.totalAmount') }}</span>
            <strong>{{ displayValue(detailRow.amountText) }}</strong>
          </div>
        </header>

        <section class="order-detail__status-bar">
          <strong>{{ t('admin.orders.detail.statusControl') }}</strong>
          <div class="order-detail__tags">
            <el-tag :type="paymentStatusTag(detailRow.paymentStatusCode)" round>
              {{ detailRow.paymentStatusText }}
            </el-tag>
            <el-tag :type="orderStatusTag(detailRow.orderStatusCode)" round>
              {{ detailRow.orderStatusText }}
            </el-tag>
          </div>
        </section>

        <div class="order-detail__columns">
          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>{{ t('admin.orders.detail.serviceBooked') }}</h3>
              <div class="order-detail__service-heading">
                <strong>{{ displayValue(detailRow.productName) }}</strong>
                <strong>{{ displayValue(detailRow.serviceAmountText) }}</strong>
              </div>
              <dl class="order-detail__list">
                <div>
                  <dt>{{ t('admin.orders.table.specDesc') }}</dt>
                  <dd>{{ displayValue(detailRow.specDescText) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.table.attachDetails') }}</dt>
                  <dd>{{ displayValue(detailRow.attachDetailsText) }}</dd>
                </div>
              </dl>
              <div class="order-detail__schedule">
                <span>{{ t('admin.orders.detail.scheduledAt') }}</span>
                <strong>{{ displayValue(detailRow.serviceTime) }}</strong>
              </div>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t('admin.orders.detail.financialSummary') }}</h3>
              <div v-if="detailRow.lineItems.length" class="order-detail__line-items">
                <div
                  v-for="(lineItem, index) in detailRow.lineItems"
                  :key="`${lineItem.lineType}-${lineItem.name}-${index}`"
                  class="order-detail__line-item"
                >
                  <div class="order-detail__line-item-main">
                    <strong>{{ displayValue(lineItem.name) }}</strong>
                    <span v-if="lineItem.lineType">{{ lineItem.lineType }}</span>
                  </div>
                  <div class="order-detail__line-item-amount">
                    <strong>{{ lineItem.amountWithTaxText }}</strong>
                    <small>
                      {{ t('admin.orders.detail.quantity') }}:
                      {{ lineItem.quantity ?? '-' }}
                      · {{ t('admin.orders.detail.beforeTax') }}:
                      {{ lineItem.amountWithoutTaxText }}
                      · {{ t('admin.orders.detail.lineTax') }}:
                      {{ lineItem.taxAmountText }}
                    </small>
                  </div>
                </div>
              </div>
              <div class="order-detail__summary-row">
                <span>{{ t('admin.orders.detail.subtotal') }}</span>
                <strong>{{ displayValue(detailRow.subtotalText) }}</strong>
              </div>
              <div class="order-detail__summary-row">
                <span>{{ t('admin.orders.detail.tax') }}</span>
                <strong>{{ displayValue(detailRow.taxText) }}</strong>
              </div>
              <div class="order-detail__summary-row order-detail__summary-row--total">
                <span>{{ t('admin.orders.detail.totalAmount') }}</span>
                <strong>{{ displayValue(detailRow.amountText) }}</strong>
              </div>
            </section>
          </div>

          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>{{ t('admin.orders.detail.bookingNotes') }}</h3>
              <div class="order-detail__note">
                {{ displayValue(detailRow.customerRemark || detailRow.adminRemark) }}
              </div>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t('admin.orders.detail.customerDetails') }}</h3>
              <dl class="order-detail__list order-detail__list--customer">
                <div>
                  <dt>{{ t('admin.orders.detail.customerName') }}</dt>
                  <dd>{{ displayValue(detailRow.customerName) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.table.userPhone') }}</dt>
                  <dd>{{ displayValue(detailRow.userPhone) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.table.contactPhone') }}</dt>
                  <dd>{{ displayValue(detailRow.contactPhone) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.detail.accountEmail') }}</dt>
                  <dd>{{ displayValue(detailRow.userEmail || detailRow.customerEmail) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.detail.contactEmail') }}</dt>
                  <dd>{{ displayValue(detailRow.contactEmail) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.table.serviceAddress') }}</dt>
                  <dd>{{ displayValue(detailRow.serviceAddress) }}</dd>
                </div>
                <div>
                  <dt>{{ t('admin.orders.table.supplierName') }}</dt>
                  <dd>{{ displayValue(detailRow.supplierName) }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <section class="order-detail__panel order-detail__payment">
          <h3>{{ t('admin.orders.detail.paymentDetails') }}</h3>
          <dl class="order-detail__payment-grid">
            <div>
              <dt>{{ t('admin.orders.detail.paymentGateway') }}</dt>
              <dd>{{ displayValue(detailRow.paymentGateway) }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.orders.table.paymentStatus') }}</dt>
              <dd class="order-detail__success">{{ detailRow.paymentStatusText }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.orders.table.paymentIntentId') }}</dt>
              <dd>{{ displayValue(detailRow.paymentIntentId) }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.orders.detail.paidAt') }}</dt>
              <dd>{{ formatDateTime(detailRow.paidAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.orders.detail.paymentMethod') }}</dt>
              <dd>{{ displayValue(detailRow.paymentMethod) }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.orders.detail.paymentMethodDetail') }}</dt>
              <dd>{{ displayValue(detailRow.paymentMethodDetail) }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.orders.detail.cardLast4') }}</dt>
              <dd>{{ displayValue(detailRow.cardLast4) }}</dd>
            </div>
          </dl>
        </section>
      </div>
      <template #footer>
        <el-button
          v-if="canStripeRefund"
          type="danger"
          @click="openStripeRefundDialog"
        >
          {{ t('admin.orders.actions.refundReview') }}
        </el-button>
        <el-button @click="detailDrawerVisible = false">
          {{ t('admin.orders.actions.close') }}
        </el-button>
      </template>
    </el-drawer>

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

    <el-dialog
      v-model="assignDialogVisible"
      :title="t('admin.orders.dialog.assignSupplierTitle')"
      :close-on-click-modal="false"
      width="520px"
    >
      <el-form label-width="100px">
        <el-form-item :label="t('admin.orders.form.orderNo')">
          <el-input :model-value="assignForm.orderNo" disabled />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.supplier')" required>
          <el-select
            v-model="assignForm.supplierId"
            filterable
            remote
            clearable
            :remote-method="loadSupplierOptions"
            :loading="supplierLoading"
            :placeholder="t('admin.orders.form.supplierPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in supplierOptions"
              :key="item.id"
              :label="item.supplierName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">
          {{ t('admin.orders.actions.cancel') }}
        </el-button>
        <el-button type="primary" :loading="assignSubmitting" @click="submitSupplierAssignment">
          {{ t('admin.orders.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="stripeRefundDialogVisible"
      :title="t('admin.orders.dialog.refundReviewTitle')"
      :close-on-click-modal="false"
      :show-close="!stripeRefundSubmitting"
      width="520px"
    >
      <el-alert
        :title="t('admin.orders.refund.warning')"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form class="stripe-refund-form" label-width="130px">
        <el-form-item :label="t('admin.orders.form.orderNo')">
          <el-input :model-value="stripeRefundForm.orderNo" disabled />
        </el-form-item>
        <el-form-item :label="t('admin.orders.refund.amount')">
          <strong class="stripe-refund-form__amount">{{ stripeRefundForm.amountText }}</strong>
          <div class="stripe-refund-form__hint">
            {{ t('admin.orders.refund.amountHint') }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="stripeRefundSubmitting" @click="stripeRefundDialogVisible = false">
          {{ t('admin.orders.actions.cancel') }}
        </el-button>
        <el-button type="danger" :loading="stripeRefundSubmitting" @click="submitStripeRefund">
          {{ t('admin.orders.refund.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
  assignSupplier,
  detail as getOrderDetail,
  exportOrders,
  page,
  querySuppliers,
  stripeRefund,
  updateOrderStatus,
  updateAdminRemark,
} from '@/modules/admin/api/order';
import { detail as getSupplierDetail } from '@/modules/admin/api/supplier';

type I18nText = Record<string, string>;

type OrderRow = {
  orderId: number | null;
  id: string | number;
  orderNo: string;
  userPhone: string;
  contactPhone: string;
  customerName: string;
  customerEmail: string;
  contactEmail: string;
  userEmail: string;
  customerRemark: string;
  serviceAddress: string;
  supplierId: number | string | null;
  supplierName: string;
  productName: string;
  adminRemark: string;
  specDescText: string;
  attachDetailsText: string;
  serviceTime: string;
  orderStatusCode: number | null;
  paymentStatusCode: number | null;
  orderStatusText: string;
  paymentStatusText: string;
  paymentIntentId: string;
  paymentMethod: string;
  paymentMethodDetail: string;
  paymentGateway: string;
  cardLast4: string;
  paidAt: string;
  serviceAmountText: string;
  subtotalText: string;
  taxText: string;
  amountText: string;
  createdAt: string;
  lineItems: OrderLineItem[];
};

type OrderLineItem = {
  lineType: string;
  name: string;
  quantity: number | null;
  amountWithTaxText: string;
  amountWithoutTaxText: string;
  taxAmountText: string;
};

type SupplierOption = {
  id: number | string;
  supplierName: string;
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
  amount?: number | string;
  totalPrice?: number | string;
  attachTypeName?: string;
  attachValueName?: string;
};

const orderStatusNameMap: Record<string, number> = {
  CREATED: 0,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  PAID: 2,
  AWAITING_ASSIGNMENT: 3,
  ASSIGNED: 4,
  ON_THE_WAY: 5,
  IN_PROGRESS: 6,
  PROCESSING: 6,
  COMPLETED: 7,
  CANCELLED: 8,
  CANCELED: 8,
  REFUNDING: 9,
  REFUNDED: 10,
};

const paymentStatusNameMap: Record<string, number> = {
  UNPAID: 0,
  PAID: 1,
  CANCELLED: 2,
  FAILED: 3,
  REFUNDING: 4,
  REFUNDED: 5,
  REFUNDED_FAIL: 6,
  REFUND_FAILED: 6,
};

const { t, locale } = useI18n({ useScope: 'global' });

const orderStatusOptions = computed(() => [
  { value: 0, label: t('admin.orders.status.orderCreated') },
  { value: 1, label: t('admin.orders.status.orderPendingPayment') },
  { value: 2, label: t('admin.orders.status.orderConfirmed') },
  { value: 3, label: t('admin.orders.status.orderAwaitingAssignment') },
  { value: 4, label: t('admin.orders.status.orderAssigned') },
  { value: 5, label: t('admin.orders.status.orderOnTheWay') },
  { value: 6, label: t('admin.orders.status.orderInProgress') },
  { value: 7, label: t('admin.orders.status.orderCompleted') },
  { value: 8, label: t('admin.orders.status.orderCancelled') },
  { value: 9, label: t('admin.orders.status.orderRefunding') },
  { value: 10, label: t('admin.orders.status.orderRefunded') },
]);

const paymentStatusOptions = computed(() => [
  { value: 0, label: t('admin.orders.status.paymentUnpaid') },
  { value: 1, label: t('admin.orders.status.paymentPaid') },
  { value: 2, label: t('admin.orders.status.paymentCancelled') },
  { value: 3, label: t('admin.orders.status.paymentFailed') },
  { value: 4, label: t('admin.orders.status.paymentRefunding') },
  { value: 5, label: t('admin.orders.status.paymentRefunded') },
  { value: 6, label: t('admin.orders.status.paymentRefundFailed') },
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
const exportLoading = ref(false);
const copyingOrderId = ref<OrderRow['id'] | null>(null);
const updatingStatusOrderId = ref<OrderRow['id'] | null>(null);
const detailDrawerVisible = ref(false);
const detailRow = ref<OrderRow | null>(null);
const detailLoading = ref(false);
const detailRequestId = ref(0);
const stripeRefundDialogVisible = ref(false);
const stripeRefundSubmitting = ref(false);
const stripeRefundForm = reactive({
  orderId: null as number | null,
  orderNo: '',
  amountText: '',
});
const remarkDialogVisible = ref(false);
const remarkSubmitting = ref(false);
const remarkForm = reactive({
  orderId: null as number | null,
  orderNo: '',
  adminRemark: '',
});
const assignDialogVisible = ref(false);
const assignSubmitting = ref(false);
const supplierLoading = ref(false);
const supplierOptions = ref<SupplierOption[]>([]);
const assignForm = reactive({
  orderId: null as number | null,
  orderNo: '',
  supplierId: null as number | string | null,
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

const displayValue = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text || '-';
};

const canReviewRefund = (row: OrderRow | null | undefined) => {
  if (!row?.orderId) return false;
  const hasStripePayment = Boolean(String(row.paymentIntentId || '').trim());
  return hasStripePayment && row.orderStatusCode === 9 && row.paymentStatusCode === 4;
};

const canStripeRefund = computed(() => canReviewRefund(detailRow.value));

const openOrderDetail = async (row: OrderRow) => {
  detailRow.value = row;
  detailDrawerVisible.value = true;
  if (!row.orderId) {
    ElMessage.warning(t('admin.orders.message.detailOrderIdMissing'));
    return;
  }

  const requestId = ++detailRequestId.value;
  detailLoading.value = true;
  try {
    const response = await getOrderDetail(row.orderId);
    if (requestId === detailRequestId.value) {
      detailRow.value = normalizeOrderDetail(response, row);
    }
  } catch (error: any) {
    if (requestId === detailRequestId.value) {
      ElMessage.error(error?.message || t('admin.orders.message.detailFailed'));
    }
  } finally {
    if (requestId === detailRequestId.value) {
      detailLoading.value = false;
    }
  }
};

const closeOrderDetail = () => {
  detailRequestId.value += 1;
  detailLoading.value = false;
  detailRow.value = null;
};

const openStripeRefundDialog = (targetRow?: OrderRow) => {
  const row = targetRow ?? detailRow.value;
  if (!row?.orderId || !canReviewRefund(row)) return;
  stripeRefundForm.orderId = row.orderId;
  stripeRefundForm.orderNo = row.orderNo;
  stripeRefundForm.amountText = row.amountText;
  stripeRefundDialogVisible.value = true;
};

const submitStripeRefund = async () => {
  if (stripeRefundSubmitting.value || !stripeRefundForm.orderId) return;
  try {
    await ElMessageBox.confirm(
      t('admin.orders.refund.confirmFull', { amount: stripeRefundForm.amountText }),
      t('admin.orders.refund.confirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('admin.orders.refund.confirm'),
        cancelButtonText: t('admin.orders.actions.cancel'),
        confirmButtonClass: 'el-button--danger',
      },
    );
  } catch {
    return;
  }

  stripeRefundSubmitting.value = true;
  try {
    const response = await stripeRefund({
      orderId: stripeRefundForm.orderId,
    });
    const refundId = typeof response === 'string'
      ? response
      : typeof response?.data === 'string'
        ? response.data
        : '';
    stripeRefundDialogVisible.value = false;
    ElMessage.success(
      refundId
        ? t('admin.orders.refund.successWithId', { refundId })
        : t('admin.orders.refund.success'),
    );

    const current = detailRow.value;
    const provisional = current
      ? {
          ...current,
          orderStatusCode: 10,
          paymentStatusCode: 5,
          orderStatusText: getOrderStatusText(10),
          paymentStatusText: getPaymentStatusText(5),
        }
      : null;
    if (provisional) detailRow.value = provisional;

    await fetchOrders();
    const refreshedRow = orders.value.find((item) => item.orderId === stripeRefundForm.orderId);
    const detailBase = refreshedRow ?? provisional;
    if (detailDrawerVisible.value && detailBase) {
      detailLoading.value = true;
      try {
        const detailResponse = await getOrderDetail(stripeRefundForm.orderId);
        detailRow.value = normalizeOrderDetail(detailResponse, detailBase);
      } catch (error: any) {
        ElMessage.error(error?.message || t('admin.orders.message.detailFailed'));
      } finally {
        detailLoading.value = false;
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.refund.failed'));
  } finally {
    stripeRefundSubmitting.value = false;
  }
};

const handleOrderStatusChange = async (row: OrderRow, nextStatus: number) => {
  if (!row.orderId) {
    ElMessage.warning(t('admin.orders.message.statusOrderIdMissing'));
    return;
  }
  if (!Number.isInteger(nextStatus) || nextStatus < 0 || nextStatus > 10) {
    return;
  }
  if (row.orderStatusCode === nextStatus) {
    return;
  }

  updatingStatusOrderId.value = row.id;
  try {
    await updateOrderStatus({
      orderId: row.orderId,
      orderStatus: nextStatus,
    });
    row.orderStatusCode = nextStatus;
    row.orderStatusText = getOrderStatusText(nextStatus);
    ElMessage.success(t('admin.orders.message.statusUpdateSuccess'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.statusUpdateFailed'));
  } finally {
    updatingStatusOrderId.value = null;
  }
};

const paymentStatusTag = (code: number | null) => {
  if (code === 1) return 'success';
  if (code === 2 || code === 5) return 'info';
  if (code === 0 || code === 4) return 'warning';
  if (code === 3 || code === 6) return 'danger';
  return '';
};

const orderStatusTag = (code: number | null) => {
  if (code === 2 || code === 7 || code === 10) return 'success';
  if (code === 0 || code === 8) return 'info';
  if (code === 1 || code === 3 || code === 5 || code === 9) return 'warning';
  if (code === 4 || code === 6) return 'primary';
  return '';
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
  return key in nameMap ? nameMap[key] ?? null : null;
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
  if (code === 2) return t('admin.orders.status.orderConfirmed');
  if (code === 3) return t('admin.orders.status.orderAwaitingAssignment');
  if (code === 4) return t('admin.orders.status.orderAssigned');
  if (code === 5) return t('admin.orders.status.orderOnTheWay');
  if (code === 6) return t('admin.orders.status.orderInProgress');
  if (code === 7) return t('admin.orders.status.orderCompleted');
  if (code === 8) return t('admin.orders.status.orderCancelled');
  if (code === 9) return t('admin.orders.status.orderRefunding');
  if (code === 10) return t('admin.orders.status.orderRefunded');
  return '-';
};

const getPaymentStatusText = (code: number | null) => {
  if (code === 0) return t('admin.orders.status.paymentUnpaid');
  if (code === 1) return t('admin.orders.status.paymentPaid');
  if (code === 2) return t('admin.orders.status.paymentCancelled');
  if (code === 3) return t('admin.orders.status.paymentFailed');
  if (code === 4) return t('admin.orders.status.paymentRefunding');
  if (code === 5) return t('admin.orders.status.paymentRefunded');
  if (code === 6) return t('admin.orders.status.paymentRefundFailed');
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
  if (specValues.length) return specValues.join(' / ');
  const fallback = String(order.specDesc ?? item.specDesc ?? '').trim();
  return fallback || '-';
};

const parseAttachDetailsText = (item: any) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {};
  const attachItems = (
    Array.isArray(order.attachItems)
      ? order.attachItems
      : Array.isArray(item.attachItems)
        ? item.attachItems
        : []
  )
    .map((attach: unknown) => String(attach ?? '').trim())
    .filter(Boolean);
  const attachTypeNameI18n = (
    order.attachTypeNameI18n ?? item.attachTypeNameI18n ?? {}
  ) as Record<string, I18nText>;
  const attachValueNameI18n = (
    order.attachValueNameI18n ?? item.attachValueNameI18n ?? {}
  ) as Record<string, I18nText>;
  const attachDetails = (
    Array.isArray(order.attachDetails)
      ? order.attachDetails
      : Array.isArray(item.attachDetails)
        ? item.attachDetails
        : Array.isArray(order.attachSelections)
          ? order.attachSelections
          : Array.isArray(item.attachSelections)
            ? item.attachSelections
        : []
  ) as RawAttachDetail[];
  const attachValues = attachDetails
    .map((attach) => {
      const typeName =
        String(attach?.attachTypeName || '').trim() ||
        getI18nMapValue(attachTypeNameI18n, attach?.attachTypeId);
      const valueName =
        String(attach?.attachValueName || '').trim() ||
        getI18nMapValue(attachValueNameI18n, attach?.attachValueId);
      const quantity = Number(attach?.quantity ?? 0);
      const summary = joinLabelValue(typeName, valueName);
      if (!summary) {
        return '';
      }
      const quantityText = quantity > 0 ? `${summary} x ${quantity}` : summary;
      const priceText = formatMoneyText(
        attach?.amountWithTax ?? attach?.totalPrice ?? attach?.amount,
      );
      return priceText === '-' ? quantityText : `${quantityText} · ${priceText}`;
    })
    .filter(Boolean);
  if (attachValues.length) return attachValues.join(' / ');
  return attachItems.length ? attachItems.join(' / ') : '-';
};

const formatMoneyText = (value: unknown) => {
  const text = String(value ?? '').trim();
  if (!text) return '-';
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return text;
  return `AED ${numeric.toFixed(2)}`;
};

const parseMoneyText = (item: any, fields: string[]) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {};
  for (const field of fields) {
    const value = order?.[field] ?? item?.[field];
    const text = String(value ?? '').trim();
    if (text && text !== '-') {
      return formatMoneyText(value);
    }
  }
  return '-';
};

const parseAmountText = (item: any) => {
  return parseMoneyText(item, [
    'amountText',
    'orderAmount',
    'amountWithTax',
    'totalAmountWithTax',
    'totalAmount',
    'amount',
  ]);
};

const parseLineItems = (item: any): OrderLineItem[] => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {};
  const rawItems = Array.isArray(order.lineItems)
    ? order.lineItems
    : Array.isArray(item?.lineItems)
      ? item.lineItems
      : [];

  return rawItems.map((lineItem: any) => {
    const quantity = Number(lineItem?.quantity);
    return {
      lineType: String(lineItem?.lineType ?? '').trim(),
      name: String(lineItem?.name ?? '').trim(),
      quantity: Number.isFinite(quantity) ? quantity : null,
      amountWithTaxText: formatMoneyText(lineItem?.amountWithTax),
      amountWithoutTaxText: formatMoneyText(lineItem?.amountWithoutTax),
      taxAmountText: formatMoneyText(lineItem?.taxAmount),
    };
  });
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
  const supplierNameI18n = (
    order.supplierNameI18n ??
    item.supplierNameI18n ??
    order.supplier?.nameI18n ??
    item.supplier?.nameI18n ??
    {}
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
    customerName: String(
      order.customerName ??
        item.customerName ??
        order.contactName ??
        item.contactName ??
        order.recipientName ??
        item.recipientName ??
        order.userName ??
        item.userName ??
        order.user?.name ??
        item.user?.name ??
        [order.firstName ?? item.firstName, order.lastName ?? item.lastName]
          .filter(Boolean)
          .join(' ') ??
        '',
    ).trim(),
    customerEmail: String(
      order.customerEmail ??
        item.customerEmail ??
        order.userEmail ??
        item.userEmail ??
        order.contactEmail ??
        item.contactEmail ??
        order.email ??
        item.email ??
        order.user?.email ??
        item.user?.email ??
        '',
    ).trim(),
    contactEmail: String(
      order.contactEmail ?? item.contactEmail ?? order.recipientEmail ?? item.recipientEmail ?? '',
    ).trim(),
    userEmail: String(
      order.userEmail ??
        item.userEmail ??
        order.customerEmail ??
        item.customerEmail ??
        order.user?.email ??
        item.user?.email ??
        '',
    ).trim(),
    customerRemark: String(
      order.customerRemark ??
        item.customerRemark ??
        order.bookingRemark ??
        item.bookingRemark ??
        order.customerNotes ??
        item.customerNotes ??
        order.remark ??
        item.remark ??
        '',
    ).trim(),
    serviceAddress: String(
      order.serviceAddress ??
        item.serviceAddress ??
        order.fullAddress ??
        item.fullAddress ??
        order.address ??
        item.address ??
        '',
    ).trim(),
    supplierId:
      order.supplierId ??
      item.supplierId ??
      order.supplier?.id ??
      item.supplier?.id ??
      null,
    supplierName: pickI18nValue(
      supplierNameI18n,
      String(
        order.supplierName ??
          item.supplierName ??
          order.supplier?.supplierName ??
          item.supplier?.supplierName ??
          order.supplier?.name ??
          item.supplier?.name ??
          '',
      ).trim(),
    ),
    productName: pickI18nValue(
      productNameI18n,
      String(order.productName ?? item.productName ?? order.spuName ?? item.spuName ?? '').trim(),
    ),
    adminRemark: String(order.adminRemark ?? item.adminRemark ?? '').trim(),
    specDescText: parseSpecDescText(item),
    attachDetailsText: parseAttachDetailsText(item),
    serviceTime: String(
      order.serviceTime ??
        item.serviceTime ??
        order.serviceDateTime ??
        item.serviceDateTime ??
        '',
    ).trim(),
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
    paymentIntentId: String(
      order.paymentIntentId ??
        item.paymentIntentId ??
        order.paymentIntentld ??
        item.paymentIntentld ??
        '',
    ).trim(),
    paymentMethod: String(
      order.paymentMethodName ??
        item.paymentMethodName ??
        order.paymentMethod ??
        item.paymentMethod ??
        '',
    ).trim(),
    paymentMethodDetail: String(
      order.paymentMethodDetail ?? item.paymentMethodDetail ?? '',
    ).trim(),
    paymentGateway: String(
      order.paymentGateway ??
        item.paymentGateway ??
        order.paymentChannelName ??
        item.paymentChannelName ??
        order.paymentChannel ??
        item.paymentChannel ??
        '',
    ).trim(),
    cardLast4: String(order.cardLast4 ?? item.cardLast4 ?? '').trim(),
    paidAt: String(
      order.paidTime ??
        item.paidTime ??
        order.paymentTime ??
        item.paymentTime ??
        order.payTime ??
        item.payTime ??
        '',
    ).trim(),
    serviceAmountText: parseMoneyText(item, [
      'serviceAmountWithTax',
      'serviceAmount',
      'baseAmountWithTax',
      'baseAmount',
      'skuAmount',
    ]),
    subtotalText: parseMoneyText(item, [
      'subtotalText',
      'subtotal',
      'subtotalAmount',
      'amountWithoutTax',
    ]),
    taxText: parseMoneyText(item, ['taxText', 'taxAmount', 'vatAmount', 'vat']),
    amountText: parseAmountText(item),
    createdAt: String(order.orderTime ?? item.orderTime ?? order.createTime ?? item.createTime ?? '').trim(),
    lineItems: parseLineItems(item),
  };
};

const preferPopulatedText = (primary: string, fallback: string) => {
  const value = String(primary ?? '').trim();
  return value && value !== '-' ? value : fallback;
};

const normalizeOrderDetail = (payload: any, fallback: OrderRow): OrderRow => {
  const root = payload?.data ?? payload ?? {};
  const rawLineItems = Array.isArray(root.lineItems) ? root.lineItems : [];
  const sumLineItemAmount = (field: 'amountWithTax' | 'amountWithoutTax' | 'taxAmount') => {
    const values = rawLineItems
      .map((lineItem: any) => Number(lineItem?.[field]))
      .filter((value: number) => Number.isFinite(value));
    return values.length ? values.reduce((total: number, value: number) => total + value, 0) : undefined;
  };
  const attachItems = Array.isArray(root.attachItems)
    ? root.attachItems
    : fallback.attachDetailsText && fallback.attachDetailsText !== '-'
      ? [fallback.attachDetailsText]
      : [];
  const parsed = parseOrderRow({
    ...fallback,
    ...root,
    orderId: root.orderId ?? fallback.orderId,
    orderNo: root.orderNo ?? fallback.orderNo,
    productName: fallback.productName || root.productName,
    specDesc: root.specDesc ?? fallback.specDescText,
    attachItems,
    serviceAddress: root.serviceAddress ?? fallback.serviceAddress,
    serviceTime: root.serviceTime ?? fallback.serviceTime,
    contactPhone: root.contactPhone ?? fallback.contactPhone,
    contactEmail: root.contactEmail ?? fallback.contactEmail,
    customerName: root.userName ?? fallback.customerName,
    customerEmail: root.userEmail ?? fallback.customerEmail,
    userEmail: root.userEmail ?? fallback.userEmail,
    customerRemark: root.remark ?? fallback.customerRemark,
    orderTime: root.orderTime ?? fallback.createdAt,
    paymentGateway: root.paymentGateway ?? fallback.paymentGateway,
    paymentMethod: fallback.paymentMethod,
    paymentMethodDetail: root.paymentMethodDetail ?? fallback.paymentMethodDetail,
    cardLast4: root.cardLast4 ?? fallback.cardLast4,
    paidTime: root.paidTime ?? fallback.paidAt,
    amountWithTax:
      root.amountWithTax ?? sumLineItemAmount('amountWithTax') ?? fallback.amountText,
    amountWithoutTax:
      root.amountWithoutTax ?? sumLineItemAmount('amountWithoutTax') ?? fallback.subtotalText,
    taxAmount: root.taxAmount ?? sumLineItemAmount('taxAmount') ?? fallback.taxText,
    orderStatus: root.orderStatus ?? fallback.orderStatusCode,
    paymentStatus: root.paymentStatus ?? fallback.paymentStatusCode,
  });
  const lineItems = parsed.lineItems.map((lineItem) => {
    const type = lineItem.lineType.toUpperCase();
    if (
      fallback.productName &&
      (type.includes('SERVICE') || type.includes('PRODUCT') || type.includes('SKU'))
    ) {
      return { ...lineItem, name: fallback.productName };
    }
    return lineItem;
  });
  const serviceLineItem = lineItems.find((lineItem) => {
    const type = lineItem.lineType.toUpperCase();
    return type.includes('SERVICE') || type.includes('PRODUCT') || type.includes('SKU');
  }) ?? lineItems.find((lineItem) => {
    const type = lineItem.lineType.toUpperCase();
    return !type.includes('ADD') && !type.includes('ATTACH');
  });

  return {
    ...fallback,
    ...parsed,
    orderStatusCode: parsed.orderStatusCode ?? fallback.orderStatusCode,
    paymentStatusCode: parsed.paymentStatusCode ?? fallback.paymentStatusCode,
    orderStatusText: preferPopulatedText(parsed.orderStatusText, fallback.orderStatusText),
    paymentStatusText: preferPopulatedText(parsed.paymentStatusText, fallback.paymentStatusText),
    paymentIntentId: preferPopulatedText(parsed.paymentIntentId, fallback.paymentIntentId),
    supplierName: preferPopulatedText(parsed.supplierName, fallback.supplierName),
    serviceAmountText: serviceLineItem
      ? serviceLineItem.amountWithTaxText
      : preferPopulatedText(parsed.serviceAmountText, fallback.serviceAmountText),
    lineItems,
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

const normalizeSupplierOptions = (payload: any): SupplierOption[] => {
  const root = payload?.data ?? payload ?? {};
  const records = Array.isArray(root)
    ? root
    : Array.isArray(root.list)
      ? root.list
      : Array.isArray(root.records)
        ? root.records
        : Array.isArray(root.options)
          ? root.options
          : Array.isArray(root.data)
            ? root.data
            : [];

  return records
    .map((item: any) => {
      const supplier = item?.supplier ?? item ?? {};
      const id = supplier.id ?? supplier.supplierId ?? supplier.value ?? item?.id ?? item?.supplierId ?? item?.value;
      const nameI18n = (
        supplier.nameI18n ??
        supplier.supplierNameI18n ??
        item?.nameI18n ??
        item?.supplierNameI18n ??
        {}
      ) as I18nText;
      const supplierName = pickI18nValue(
        nameI18n,
        String(
          supplier.supplierName ??
            supplier.name ??
            supplier.label ??
            item?.supplierName ??
            item?.name ??
            item?.label ??
            '',
        ).trim(),
      );
      if (id === null || id === undefined || !supplierName) return null;
      return { id, supplierName };
    })
    .filter((item: SupplierOption | null): item is SupplierOption => !!item);
};

const loadSupplierOptions = async (keyword = '') => {
  supplierLoading.value = true;
  try {
    const supplierName = normalizeOptionalParam(keyword);
    const res = await querySuppliers(supplierName ? { supplierName } : {});
    const nextOptions = normalizeSupplierOptions(res);
    const currentOption = supplierOptions.value.find(
      (item) => item.id === assignForm.supplierId,
    );
    supplierOptions.value = currentOption && !nextOptions.some((item) => item.id === currentOption.id)
      ? [currentOption, ...nextOptions]
      : nextOptions;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.supplierFetchFailed'));
  } finally {
    supplierLoading.value = false;
  }
};

const openAssignDialog = async (row: OrderRow) => {
  if (!row.orderId) {
    ElMessage.warning(t('admin.orders.message.assignOrderIdMissing'));
    return;
  }
  assignForm.orderId = row.orderId;
  assignForm.orderNo = row.orderNo;
  assignForm.supplierId = row.supplierId;
  supplierOptions.value = row.supplierId && row.supplierName
    ? [{ id: row.supplierId, supplierName: row.supplierName }]
    : [];
  assignDialogVisible.value = true;
  await loadSupplierOptions();
};

const submitSupplierAssignment = async () => {
  if (!assignForm.orderId) {
    ElMessage.warning(t('admin.orders.message.assignOrderIdMissing'));
    return;
  }
  if (assignForm.supplierId === null || assignForm.supplierId === '') {
    ElMessage.warning(t('admin.orders.validation.supplierRequired'));
    return;
  }

  assignSubmitting.value = true;
  try {
    await assignSupplier({
      orderId: assignForm.orderId,
      supplierId: assignForm.supplierId,
    });
    ElMessage.success(t('admin.orders.message.assignSuccess'));
    assignDialogVisible.value = false;
    await fetchOrders();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.assignFailed'));
  } finally {
    assignSubmitting.value = false;
  }
};

const normalizeSupplierCopyInfo = (payload: any, fallbackName = '') => {
  const root = payload?.data ?? payload ?? {};
  const supplier = root?.supplier ?? root;
  const nameI18n = (
    root?.nameI18n ??
    root?.supplierNameI18n ??
    supplier?.nameI18n ??
    supplier?.supplierNameI18n ??
    {}
  ) as I18nText;
  return {
    supplierName: pickI18nValue(
      nameI18n,
      String(supplier?.supplierName ?? supplier?.name ?? fallbackName).trim(),
    ),
    contactInfo: String(supplier?.contactInfo ?? '').trim(),
  };
};

const writeClipboardText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to the selection-based copy flow when clipboard permission is unavailable.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) {
    throw new Error(t('admin.orders.message.copySupplierFailed'));
  }
};

const formatCopyField = (label: string, value: unknown) => {
  const normalizedLabel = String(label || '').trim().replace(/[：:]$/, '');
  const rawValue = String(value ?? '').trim();
  const normalizedValue = rawValue === '-' ? '' : rawValue;
  const separator = locale.value === 'zh' ? '：' : ': ';
  return `${normalizedLabel}${separator}${normalizedValue}`;
};

const copySupplierInfo = async (row: OrderRow) => {
  copyingOrderId.value = row.id;
  try {
    const supplier = row.supplierId
      ? normalizeSupplierCopyInfo(
          await getSupplierDetail(row.supplierId),
          row.supplierName,
        )
      : {
          supplierName: row.supplierName || '',
          contactInfo: '',
        };
    const content = [
      formatCopyField(t('admin.orders.table.orderNo'), row.orderNo),
      formatCopyField(t('admin.orders.table.productName'), row.productName),
      formatCopyField(t('admin.orders.table.specDesc'), row.specDescText),
      formatCopyField(t('admin.orders.table.attachDetails'), row.attachDetailsText),
      formatCopyField(t('admin.orders.table.serviceAddress'), row.serviceAddress),
      formatCopyField(t('admin.orders.copyFields.servicePhone'), row.contactPhone),
      formatCopyField(t('admin.orders.table.serviceTime'), row.serviceTime),
      formatCopyField(t('admin.supplier.table.supplierName'), supplier.supplierName),
      formatCopyField(t('admin.supplier.table.contactInfo'), supplier.contactInfo),
    ].join('\n');
    await writeClipboardText(content);
    ElMessage.success(t('admin.orders.message.copySupplierSuccess'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.copySupplierFailed'));
  } finally {
    copyingOrderId.value = null;
  }
};

const getExportFileName = () => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    `${now.getMonth() + 1}`.padStart(2, '0'),
    `${now.getDate()}`.padStart(2, '0'),
  ].join('');
  const time = [
    `${now.getHours()}`.padStart(2, '0'),
    `${now.getMinutes()}`.padStart(2, '0'),
    `${now.getSeconds()}`.padStart(2, '0'),
  ].join('');
  return `orders-${date}-${time}.xlsx`;
};

const handleExport = async () => {
  exportLoading.value = true;
  try {
    const filters = { ...requestPayload.value };
    delete filters.pageNum;
    delete filters.pageSize;
    const response = await exportOrders(filters);
    const rawBlob = response instanceof Blob ? response : (response as any)?.data;
    if (!(rawBlob instanceof Blob)) {
      throw new Error(t('admin.orders.message.exportInvalidFile'));
    }
    if (rawBlob.size === 0) {
      throw new Error(t('admin.orders.message.exportInvalidFile'));
    }
    if (rawBlob.type.includes('json')) {
      const text = await rawBlob.text();
      let message = t('admin.orders.message.exportFailed');
      try {
        const payload = JSON.parse(text);
        message = payload?.message || payload?.msg || message;
      } catch {
        message = text || message;
      }
      throw new Error(message);
    }

    const url = URL.createObjectURL(rawBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getExportFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    ElMessage.success(t('admin.orders.message.exportSuccess'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.exportFailed'));
  } finally {
    exportLoading.value = false;
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
.order-number-link {
  height: auto;
  padding: 0;
  font-weight: 600;
}
.order-status-select {
  width: 160px;
}
.stripe-refund-form {
  margin-top: 20px;
}
.stripe-refund-form__amount {
  display: flex;
  min-height: 40px;
  align-items: center;
  color: #05152b;
  font-size: 15px;
}
.stripe-refund-form__hint {
  margin-top: 6px;
  color: #7a8494;
  font-size: 12px;
  line-height: 1.5;
}
.order-detail {
  min-height: 100%;
  padding: 4px;
  color: #05152b;
}
.order-detail__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 4px 2px 20px;
}
.order-detail__eyebrow {
  margin-bottom: 4px;
  color: #7a8494;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.order-detail__title {
  margin: 0;
  color: #05152b;
  font-size: 28px;
  line-height: 1.2;
}
.order-detail__booked-at {
  margin: 8px 0 0;
  color: #697386;
  font-size: 13px;
}
.order-detail__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  color: #7a8494;
  font-size: 12px;
}
.order-detail__amount strong {
  color: #0b8f55;
  font-size: 22px;
}
.order-detail__status-bar,
.order-detail__panel {
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 3px 12px rgb(5 21 43 / 5%);
}
.order-detail__status-bar {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
  padding: 13px 18px;
}
.order-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.order-detail__columns {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr);
  gap: 18px;
}
.order-detail__stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.order-detail__panel {
  padding: 18px 20px;
}
.order-detail__panel h3 {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf0f4;
  color: #05152b;
  font-size: 16px;
}
.order-detail__service-heading,
.order-detail__summary-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.order-detail__service-heading {
  margin-bottom: 16px;
  font-size: 15px;
}
.order-detail__list,
.order-detail__payment-grid {
  margin: 0;
}
.order-detail__list > div + div {
  margin-top: 13px;
}
.order-detail__list dt,
.order-detail__payment-grid dt {
  margin-bottom: 5px;
  color: #8791a1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.order-detail__list dd,
.order-detail__payment-grid dd {
  margin: 0;
  color: #303b4b;
  font-size: 13px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.order-detail__schedule {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #edf0f4;
  color: #7a8494;
  font-size: 12px;
}
.order-detail__schedule strong {
  color: #1769c2;
  font-size: 15px;
}
.order-detail__line-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf0f4;
}
.order-detail__line-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f7f9fc;
}
.order-detail__line-item-main,
.order-detail__line-item-amount {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-detail__line-item-main span {
  align-self: flex-start;
  padding: 2px 7px;
  border-radius: 999px;
  background: #e8eef7;
  color: #52627a;
  font-size: 10px;
  font-weight: 700;
}
.order-detail__line-item-amount {
  align-items: flex-end;
  color: #05152b;
  text-align: right;
}
.order-detail__line-item-amount small {
  color: #8791a1;
  font-size: 11px;
  line-height: 1.45;
}
.order-detail__summary-row--total {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf0f4;
  color: #05152b;
  font-size: 15px;
}
.order-detail__summary-row + .order-detail__summary-row:not(.order-detail__summary-row--total) {
  margin-top: 10px;
}
.order-detail__summary-row--total strong {
  color: #0b8f55;
  font-size: 18px;
}
.order-detail__note {
  min-height: 76px;
  padding: 13px 14px;
  border: 1px solid #e9edf2;
  border-radius: 7px;
  background: #fafbfc;
  color: #5f6978;
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.order-detail__list--customer > div + div {
  margin-top: 14px;
}
.order-detail__payment {
  margin-top: 18px;
}
.order-detail__payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 20px;
}
.order-detail__success {
  color: #0b8f55 !important;
  font-weight: 700;
}
.order-detail__payment-method {
  display: flex;
  gap: 6px;
  margin-top: 16px;
  color: #8791a1;
  font-size: 12px;
}
.order-detail__payment-method strong {
  color: #303b4b;
}
@media (max-width: 760px) {
  .page {
    padding: 12px;
  }
  .order-detail__hero {
    flex-direction: column;
  }
  .order-detail__amount {
    align-items: flex-start;
  }
  .order-detail__status-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
  .order-detail__columns,
  .order-detail__payment-grid {
    grid-template-columns: 1fr;
  }
  .order-detail__panel {
    padding: 16px;
  }
  .order-detail__line-item {
    flex-direction: column;
  }
  .order-detail__line-item-amount {
    align-items: flex-start;
    text-align: left;
  }
}
</style>
