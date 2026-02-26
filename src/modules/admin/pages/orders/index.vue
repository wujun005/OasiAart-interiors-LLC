<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.orderNo"
          :placeholder="t('admin.orders.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">{{ t('admin.orders.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.orders.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.orders.actions.create') }}</el-button>
      </div>
      <el-table :data="orders" border stripe v-loading="tableLoading" row-key="id">
        <el-table-column prop="orderNo" :label="t('admin.orders.table.orderNo')" width="160" />
        <el-table-column prop="userId" :label="t('admin.orders.table.userId')" width="100" />
        <el-table-column :label="t('admin.orders.table.payStatus')" width="120">
          <template #default="{ row }">
            <el-tag :type="payStatusTag(row.payStatus)">{{ row.payStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.orderStatus')" width="120">
          <template #default="{ row }">
            <el-tag :type="orderStatusTag(row.orderStatus)">{{ row.orderStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" :label="t('admin.orders.table.amount')" width="120">
          <template #default="{ row }">{{ row.totalAmount }} {{ row.currency || 'CNY' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.createdAt')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.updatedAt')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.orders.table.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.orders.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.orders.actions.delete') }}
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
      v-model="dialogVisible"
      :title="isEdit ? t('admin.orders.dialog.editTitle') : t('admin.orders.dialog.createTitle')"
      width="520px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        v-loading="detailLoading"
      >
        <el-form-item :label="t('admin.orders.form.orderNo')" prop="orderNo">
          <el-input v-model="form.orderNo" :placeholder="t('admin.orders.form.orderNoPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.userId')" prop="userId">
          <el-input-number
            v-model="form.userId"
            :min="1"
            :step="1"
            :placeholder="t('admin.orders.form.userIdPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.payStatus')" prop="payStatus">
          <el-select v-model="form.payStatus" :placeholder="t('admin.orders.form.payStatusPlaceholder')" style="width: 100%">
            <el-option v-for="item in payStatusOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.orderStatus')" prop="orderStatus">
          <el-select
            v-model="form.orderStatus"
            :placeholder="t('admin.orders.form.orderStatusPlaceholder')"
            style="width: 100%"
          >
            <el-option v-for="item in orderStatusOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.totalAmount')" prop="totalAmount">
          <el-input-number v-model="form.totalAmount" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.currency')" prop="currency">
          <el-input v-model="form.currency" :placeholder="t('admin.orders.form.currencyPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.address')" prop="recipientAddress">
          <el-input v-model="form.recipientAddress" :placeholder="t('admin.orders.form.addressPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.phone')" prop="recipientPhone">
          <el-input v-model="form.recipientPhone" :placeholder="t('admin.orders.form.phonePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.orders.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.orders.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import api from '@/modules/admin/api/order';

type Order = {
  id?: number;
  orderNo: string;
  userId?: number;
  totalAmount: number;
  currency?: string;
  payStatus?: string;
  orderStatus?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  createdAt?: string;
  updatedAt?: string;
};

const payStatusOptions = ['UNPAID', 'PAID', 'REFUNDED'];
const orderStatusOptions = ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const { t } = useI18n({ useScope: 'global' });

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
});
const orders = ref<Order[]>([]);
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const detailLoading = ref(false);
const submitLoading = ref(false);

const form = reactive<Order>({
  id: undefined,
  orderNo: '',
  userId: undefined,
  totalAmount: 0,
  currency: 'CNY',
  payStatus: 'UNPAID',
  orderStatus: 'PENDING',
  recipientAddress: '',
  recipientPhone: '',
});

const rules: FormRules = {
  orderNo: [{ required: true, message: t('admin.orders.validation.orderNoRequired'), trigger: 'blur' }],
  userId: [{ required: true, message: t('admin.orders.validation.userIdRequired'), trigger: 'blur' }],
  payStatus: [{ required: true, message: t('admin.orders.validation.payStatusRequired'), trigger: 'change' }],
  orderStatus: [{ required: true, message: t('admin.orders.validation.orderStatusRequired'), trigger: 'change' }],
  totalAmount: [
    { required: true, message: t('admin.orders.validation.amountRequired'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error(t('admin.orders.validation.amountRequired')));
        } else if (Number(value) < 0) {
          callback(new Error(t('admin.orders.validation.amountNonNegative')));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  currency: [{ required: true, message: t('admin.orders.validation.currencyRequired'), trigger: 'blur' }],
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const payStatusTag = (status?: string) => {
  if (status === 'PAID') return 'success';
  if (status === 'REFUNDED') return 'info';
  if (status === 'UNPAID') return 'warning';
  return '';
};

const orderStatusTag = (status?: string) => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'SHIPPED' || status === 'CONFIRMED') return 'warning';
  if (status === 'CANCELLED') return 'info';
  return '';
};

const resetForm = () => {
  form.id = undefined;
  form.orderNo = '';
  form.userId = undefined;
  form.totalAmount = 0;
  form.currency = 'CNY';
  form.payStatus = 'UNPAID';
  form.orderStatus = 'PENDING';
  form.recipientAddress = '';
  form.recipientPhone = '';
  nextTick(() => formRef.value?.clearValidate());
};

const extractPage = (payload: any) => {
  const page = payload?.data ?? payload ?? {};
  const list = Array.isArray(page.list) ? page.list : [];
  const parsed = list.map((item) => {
    const order = item?.order ?? item ?? {};
    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      totalAmount: order.totalAmount ?? 0,
      currency: order.currency ?? 'CNY',
      payStatus: order.payStatus,
      orderStatus: order.orderStatus,
      recipientAddress: order.recipientAddress,
      recipientPhone: order.recipientPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: item?.orderItems ?? [],
    } as Order & { orderItems?: any[] };
  });
  return {
    list: parsed,
    total: typeof page.total === 'number' ? page.total : list.length,
    pageNum: page.pageNum ?? query.pageNum,
    pageSize: page.pageSize ?? query.pageSize,
  };
};

const fetchOrders = async () => {
  tableLoading.value = true;
  try {
    const res = await api.getPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      orderNo: query.orderNo?.trim() || undefined,
    });
    const { list, total: t, pageNum, pageSize } = extractPage(res);
    orders.value = list;
    total.value = t;
    query.pageNum = pageNum;
    query.pageSize = pageSize;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchOrders();
};

const reset = () => {
  query.orderNo = '';
  query.pageNum = 1;
  fetchOrders();
};

const onPageChange = (page: number) => {
  query.pageNum = page;
  fetchOrders();
};

const onSizeChange = (size: number) => {
  query.pageSize = size;
  query.pageNum = 1;
  fetchOrders();
};

const openCreate = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEdit = async (row: Order) => {
  isEdit.value = true;
  resetForm();
  dialogVisible.value = true;
  detailLoading.value = true;
  try {
    const detailRes = await api.getInfo(row.id);
    const detail = detailRes?.data ?? detailRes ?? {};
    const order = detail.order ?? detail ?? {};
    form.id = order.id ?? row.id;
    form.orderNo = order.orderNo ?? row.orderNo ?? '';
    form.userId = order.userId ?? row.userId;
    form.totalAmount = order.totalAmount ?? row.totalAmount ?? 0;
    form.currency = order.currency ?? row.currency ?? 'CNY';
    form.payStatus = order.payStatus ?? row.payStatus ?? 'UNPAID';
    form.orderStatus = order.orderStatus ?? row.orderStatus ?? 'PENDING';
    form.recipientAddress = order.recipientAddress ?? '';
    form.recipientPhone = order.recipientPhone ?? '';
    nextTick(() => formRef.value?.clearValidate());
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.orders.message.detailFailed'));
  } finally {
    detailLoading.value = false;
  }
};

const save = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const payload = {
        order: { ...form },
        orderItems: [],
      };
      if (isEdit.value) {
        await api.update(payload);
        ElMessage.success(t('admin.orders.message.updateSuccess'));
      } else {
        await api.add(payload);
        ElMessage.success(t('admin.orders.message.createSuccess'));
      }
      dialogVisible.value = false;
      fetchOrders();
    } catch (error: any) {
      ElMessage.error(error?.message || t('admin.orders.message.saveFailed'));
    } finally {
      submitLoading.value = false;
    }
  });
};

const remove = async (row: Order) => {
  try {
    await ElMessageBox.confirm(
      t('admin.orders.message.deleteConfirm', { orderNo: row.orderNo }),
      t('admin.common.confirmTitle'),
      {
      type: 'warning',
      },
    );
    await api.del(row.id);
    ElMessage.success(t('admin.orders.message.deleteSuccess'));
    fetchOrders();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  }
};

onMounted(fetchOrders);
</script>

<style scoped>
.page {
  padding: 20px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
.toolbar .el-input {
  max-width: 260px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
