<template>
  <div class="customer-page">
    <header class="customer-page__head">
      <p>{{ t('admin.customers.eyebrow') }}</p>
      <h1>{{ t('admin.customers.title') }}</h1>
    </header>

    <section class="kpis">
      <article>
        <span>{{ t('admin.customers.total') }}</span>
        <strong>{{ summary.totalCustomerCount ?? 0 }}</strong>
      </article>
      <article>
        <span>{{ t('admin.customers.monthNew', { month: summary.month || currentMonth }) }}</span>
        <strong>{{ summary.monthNewCount ?? 0 }}</strong>
      </article>
      <article>
        <span>{{ t('admin.customers.orderedCustomers') }}</span>
        <strong>{{ summary.orderedCustomerCount ?? 0 }}</strong>
      </article>
    </section>

    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="query.name"
          clearable
          :placeholder="t('admin.customers.searchName')"
          @keyup.enter="search"
        />
        <el-input
          v-model="query.phone"
          clearable
          :placeholder="t('admin.customers.searchPhone')"
          @keyup.enter="search"
        />
        <el-input
          v-model="query.email"
          class="email-filter"
          clearable
          :placeholder="t('admin.customers.searchEmail')"
          @keyup.enter="search"
        />
        <el-date-picker
          v-model="registeredRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :start-placeholder="t('admin.customers.registerStart')"
          :end-placeholder="t('admin.customers.registerEnd')"
        />
        <el-button type="primary" @click="search">{{ t('admin.customers.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.customers.reset') }}</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" border stripe row-key="id" :empty-text="t('admin.customers.empty')">
        <el-table-column :label="t('admin.customers.customer')" min-width="180">
          <template #default="{ row }">
            <div class="person">
              <el-avatar :size="32" :src="row.avatarUrl || undefined">{{ initial(row.name) }}</el-avatar>
              <div>
                <b>{{ text(row.name) }}</b>
                <small>ID {{ row.id }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.phone')" min-width="140">
          <template #default="{ row }">{{ text(row.phone) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.email')" min-width="200">
          <template #default="{ row }">{{ text(row.email) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.registered')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.registerTime) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.orders')" width="110" align="right">
          <template #default="{ row }">{{ row.orderCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.paidOrders')" width="120" align="right">
          <template #default="{ row }">{{ row.paidOrderCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.paidAmount')" min-width="140" align="right">
          <template #default="{ row }">{{ money(row.paidAmount) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.lastOrder')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.lastOrderTime) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.whatsapp')" width="110">
          <template #default="{ row }">{{ whatsapp(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.customers.status')" width="100">
          <template #default="{ row }">
            <span class="tag" :class="row.newCustomer ? 'tag--new' : 'tag--paid'">
              {{ row.newCustomer ? t('admin.customers.newCustomer') : t('admin.customers.paidCustomer') }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
  pageCustomers,
  type CustomerRow,
  type CustomerSummary,
} from '@/modules/admin/api/clientUser';
import { getAdminLocale } from '@/modules/admin/locales';

const { t } = useI18n({ useScope: 'global' });
const dash = () => t('admin.customers.dash');
const currentMonth = new Date().getMonth() + 1;
const loading = ref(false);
const rows = ref<CustomerRow[]>([]);
const total = ref(0);
const summary = ref<CustomerSummary>({});
const registeredRange = ref<string[]>([]);
const query = reactive({
  pageNum: 1,
  pageSize: 20,
  name: '',
  phone: '',
  email: '',
});

function text(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || dash();
}

function initial(name?: string) {
  const trimmed = name?.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : '?';
}

function formatDate(value?: string | null) {
  if (!value) return dash();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${pick('year')}-${pick('month')}-${pick('day')} ${pick('hour')}:${pick('minute')}`;
}

function money(value?: number | string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return dash();
  return `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function whatsapp(row: CustomerRow) {
  const labels = row.whatsappReachableI18n;
  if (!labels) return dash();
  return labels[getAdminLocale()] || labels.zh || labels.en || dash();
}

function keyword(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

async function load() {
  loading.value = true;
  try {
    const [registerStart, registerEnd] = registeredRange.value || [];
    const page = await pageCustomers({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      name: keyword(query.name),
      phone: keyword(query.phone),
      email: keyword(query.email),
      registerStart: registerStart || undefined,
      registerEnd: registerEnd || undefined,
    });
    rows.value = Array.isArray(page?.list) ? page.list : [];
    total.value = Number(page?.total || 0);
    summary.value = page?.summary || {};
  } catch (error) {
    rows.value = [];
    total.value = 0;
    const message = error instanceof Error ? error.message : '';
    ElMessage.error(message || t('admin.customers.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function search() {
  query.pageNum = 1;
  load();
}

function reset() {
  query.name = '';
  query.phone = '';
  query.email = '';
  registeredRange.value = [];
  search();
}

onMounted(load);
</script>

<style scoped>
.customer-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.customer-page__head p {
  margin: 0;
  color: #8a8378;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.customer-page__head h1 {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 650;
  color: #2c2824;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kpis article {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #efe8de;
  border-radius: 14px;
}

.kpis span {
  color: #8a8378;
  font-size: 13px;
}

.kpis strong {
  display: block;
  margin-top: 6px;
  color: #2c2824;
  font-size: 26px;
  font-weight: 650;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.toolbar :deep(.el-input) {
  width: 180px;
}

.toolbar :deep(.email-filter) {
  width: 220px;
}

.toolbar :deep(.el-date-editor) {
  width: 280px;
}

.person {
  display: flex;
  align-items: center;
  gap: 10px;
}

.person b,
.person small {
  display: block;
}

.person small {
  color: #8a8378;
  font-size: 12px;
}

.tag {
  display: inline-flex;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 18px;
}

.tag--new {
  color: #8a5a12;
  background: #f8efdc;
}

.tag--paid {
  color: #1f6b4a;
  background: #e7f4ec;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 900px) {
  .kpis {
    grid-template-columns: 1fr;
  }
}
</style>
