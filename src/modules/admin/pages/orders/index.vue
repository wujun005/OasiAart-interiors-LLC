<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input v-model="query.orderNo" placeholder="搜索订单号" clearable @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增订单</el-button>
      </div>
      <el-table :data="orders" border stripe v-loading="tableLoading" row-key="id">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column label="支付状态" width="120">
          <template #default="{ row }">
            <el-tag :type="payStatusTag(row.payStatus)">{{ row.payStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="orderStatusTag(row.orderStatus)">{{ row.orderStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">{{ row.totalAmount }} {{ row.currency || 'CNY' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="160">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑订单' : '新增订单'" width="520px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        v-loading="detailLoading"
      >
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input-number v-model="form.userId" :min="1" :step="1" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="支付状态" prop="payStatus">
          <el-select v-model="form.payStatus" placeholder="请选择支付状态" style="width: 100%">
            <el-option v-for="item in payStatusOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态" prop="orderStatus">
          <el-select v-model="form.orderStatus" placeholder="请选择订单状态" style="width: 100%">
            <el-option v-for="item in orderStatusOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="totalAmount">
          <el-input-number v-model="form.totalAmount" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="币种" prop="currency">
          <el-input v-model="form.currency" placeholder="币种，如 CNY/USD" />
        </el-form-item>
        <el-form-item label="地址" prop="recipientAddress">
          <el-input v-model="form.recipientAddress" placeholder="收件地址" />
        </el-form-item>
        <el-form-item label="电话" prop="recipientPhone">
          <el-input v-model="form.recipientPhone" placeholder="收件电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
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
  orderNo: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  payStatus: [{ required: true, message: '请选择支付状态', trigger: 'change' }],
  orderStatus: [{ required: true, message: '请选择订单状态', trigger: 'change' }],
  totalAmount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入金额'));
        } else if (Number(value) < 0) {
          callback(new Error('金额需大于等于 0'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  currency: [{ required: true, message: '请输入币种', trigger: 'blur' }],
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
    ElMessage.error(error?.message || '获取订单失败');
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
    ElMessage.error(error?.message || '获取订单详情失败');
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
        ElMessage.success('更新成功');
      } else {
        await api.add(payload);
        ElMessage.success('新增成功');
      }
      dialogVisible.value = false;
      fetchOrders();
    } catch (error: any) {
      ElMessage.error(error?.message || '保存失败');
    } finally {
      submitLoading.value = false;
    }
  });
};

const remove = async (row: Order) => {
  try {
    await ElMessageBox.confirm(`确认删除订单「${row.orderNo}」吗？`, '提示', {
      type: 'warning',
    });
    await api.del(row.id);
    ElMessage.success('删除成功');
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
