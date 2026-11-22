<template>
  <main class="coupon-page">
    <header class="coupon-page__head">
      <div>
        <p>MARKETING CENTER</p>
        <h1>{{ copy.title }}</h1>
      </div>
      <el-button v-if="canAction('btn:/admin/marketing/coupons:create')" type="primary" @click="openCreate">
        {{ copy.create }}
      </el-button>
    </header>

    <section class="kpis">
      <article><span>{{ text(summary.liveTitleI18n, summary.liveTitle, copy.live) }}</span><strong>{{ summary.liveCouponCount ?? 0 }}</strong></article>
      <article><span>{{ text(summary.orderTitleI18n, summary.orderTitle, copy.orders) }}</span><strong>{{ summary.usedOrderCount ?? 0 }}</strong></article>
      <article><span>{{ text(summary.costTitleI18n, summary.costTitle, copy.cost) }}</span><strong>{{ money(summary.platformCost) }}</strong></article>
      <article>
        <span>{{ text(summary.ruleTitleI18n, summary.ruleTitle, copy.rule) }}</span>
        <strong class="rule">{{ text(summary.rulePrimaryI18n, summary.rulePrimary, copy.oneDiscount) }}</strong>
        <small>{{ text(summary.ruleSecondaryI18n, summary.ruleSecondary, copy.supplierShare) }}</small>
      </article>
    </section>

    <section class="board">
      <form class="filters" @submit.prevent="search">
        <el-input v-model="keyword" clearable :placeholder="copy.search" />
        <el-select v-model="status" clearable :placeholder="copy.allStatus" @change="search">
          <el-option v-for="item in statuses" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button native-type="submit">{{ copy.searchAction }}</el-button>
      </form>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows" row-key="id" :empty-text="copy.empty">
        <el-table-column :label="copy.code" min-width="180">
          <template #default="{ row }">
            <b class="code">{{ row.couponCode }}</b>
            <small>{{ text(row.nameI18n, row.name, '') }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.offer" min-width="180">
          <template #default="{ row }">{{ text(row.offerI18n, row.offerText, '—') }}</template>
        </el-table-column>
        <el-table-column :label="copy.applies" min-width="180">
          <template #default="{ row }">
            <div>{{ text(row.serviceTextI18n, row.serviceText, '—') }}</div>
            <small>{{ text(row.customerScopeI18n, row.customerText, '') }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.usage" min-width="150">
          <template #default="{ row }">
            <div>{{ row.usagePrimary || '—' }}</div>
            <div class="bar"><i :style="{ width: `${row.usagePercent || 0}%` }" /></div>
            <small>{{ text(row.usageHintI18n, row.usageHint, '') }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.status" width="110">
          <template #default="{ row }"><span :class="statusClass(row.status)">{{ text(row.statusI18n, '', statusLabel(row.status)) }}</span></template>
        </el-table-column>
        <el-table-column :label="copy.actions" min-width="220" align="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :disabled="!row.couponCode" @click="openRedemptions(row)">{{ copy.redemptions }}</el-button>
              <el-button v-if="canAction('btn:/admin/marketing/coupons:edit')" link type="primary" @click="openEdit(row.id)">{{ copy.edit }}</el-button>
              <el-button v-if="canAction('btn:/admin/marketing/coupons:status') && row.rowAction" link @click="toggle(row)">
                {{ text(row.rowActionI18n, row.rowActionText, row.rowAction) }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="load"
      />
    </section>

    <el-drawer v-model="drawer" :title="form.id ? copy.editTitle : copy.create" size="720px" :close-on-click-modal="false">
      <el-form label-position="top">
        <div class="grid">
          <el-form-item :label="copy.nameEn"><el-input v-model="form.nameEn" maxlength="80" /></el-form-item>
          <el-form-item :label="copy.nameZh"><el-input v-model="form.nameZh" maxlength="80" /></el-form-item>
          <el-form-item :label="copy.allocation">
            <el-select v-model="form.allocationType">
              <el-option v-for="item in allocations" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="copy.code">
            <el-input v-model="form.couponCode" maxlength="64" class="mono" @blur="form.couponCode = form.couponCode.trim().toUpperCase()" />
          </el-form-item>
        </div>
        <h3>{{ copy.discount }}</h3>
        <div class="grid three">
          <el-form-item :label="copy.type">
            <el-select v-model="form.discountType">
              <el-option v-for="item in discountTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.discountType === 1" :label="copy.percent"><el-input-number v-model="form.discountPercent" :min="0.01" :max="100" :precision="2" /></el-form-item>
          <el-form-item v-if="form.discountType === 1" :label="copy.maxOrder"><el-input-number v-model="form.maxDiscountPerOrder" :min="0" :precision="2" /></el-form-item>
          <el-form-item :label="copy.minEligible"><el-input-number v-model="form.minQualifyingAmount" :min="0" :precision="2" /></el-form-item>
          <el-form-item :label="copy.platform">
            <el-input-number :model-value="form.platformRatio" :min="0" :max="100" :precision="2" @update:model-value="setPlatformRatio" />
          </el-form-item>
          <el-form-item :label="copy.supplier">
            <el-input-number :model-value="form.supplierRatio" :min="0" :max="100" :precision="2" @update:model-value="setSupplierRatio" />
          </el-form-item>
          <el-form-item :label="copy.status">
            <el-select v-model="form.status">
              <el-option v-for="item in statuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <div v-if="form.discountType === 3" class="tiers">
          <div v-for="(tier, index) in form.reductionRules" :key="index" class="tier">
            <el-input-number v-model="tier.threshold" :min="0.01" :precision="2" :placeholder="copy.spend" />
            <el-input-number v-model="tier.reduction" :min="0.01" :precision="2" :placeholder="copy.off" />
            <el-button link type="danger" @click="form.reductionRules.splice(index, 1)">{{ copy.remove }}</el-button>
          </div>
          <el-button @click="form.reductionRules.push({ threshold: null, reduction: null })">{{ copy.addTier }}</el-button>
        </div>
        <h3>{{ copy.who }}</h3>
        <div class="grid">
          <el-form-item :label="copy.customers">
            <el-select v-model="form.customerScope">
              <el-option v-for="item in customerScopes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="copy.services">
            <el-select v-model="form.serviceScope">
              <el-option v-for="item in serviceScopes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item v-if="form.customerScope === 4" :label="copy.pickCustomers">
          <el-select v-model="form.customerIds" multiple filterable remote :remote-method="searchCustomers" :loading="customerLoading">
            <el-option v-for="item in customers" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.serviceScope === 2" :label="copy.categories">
          <el-select v-model="form.categoryIds" multiple filterable>
            <el-option v-for="item in categories" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.serviceScope === 3 || form.serviceScope === 4" :label="copy.pickServices">
          <el-select v-model="form.spuIds" multiple filterable remote :remote-method="searchServices" :loading="serviceLoading" @change="loadSkus">
            <el-option v-for="item in services" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.serviceScope === 4" :label="copy.skus">
          <el-select v-model="form.skuIds" multiple filterable>
            <el-option v-for="item in skus" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.serviceScope === 5" :label="copy.packages">
          <el-select v-model="form.packageIds" multiple filterable remote :remote-method="searchPackages" :loading="packageLoading">
            <el-option v-for="item in packages" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <h3>{{ copy.limits }}</h3>
        <div class="grid three">
          <el-form-item :label="copy.total"><el-input-number v-model="form.totalUseLimit" :min="1" /><small>{{ copy.blankUnlimited }}</small></el-form-item>
          <el-form-item :label="copy.perUser"><el-input-number v-model="form.perCustomerUseLimit" :min="1" /></el-form-item>
          <el-form-item :label="copy.start"><el-date-picker v-model="form.validStart" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item :label="copy.end"><el-date-picker v-model="form.validEnd" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item v-if="form.allocationType === 4" :label="copy.batch"><el-input-number v-model="form.batchSize" :min="1" /></el-form-item>
        </div>
        <el-checkbox v-model="form.excludeVat">{{ copy.excludeVat }}</el-checkbox>
      </el-form>
      <template #footer>
        <el-button @click="drawer = false">{{ copy.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ copy.save }}</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="redemptionOpen" class="redemption-dialog" width="min(760px, calc(100vw - 32px))" :title="copy.redemptions">
      <p class="redemption-code">{{ redemptionCode }}</p>
      <el-alert v-if="redemptionError" :title="redemptionError" type="error" :closable="false" />
      <el-table v-loading="redemptionLoading" :data="redemptionRows" :empty-text="copy.redemptionEmpty">
        <el-table-column :label="copy.orderNo" min-width="150">
          <template #default="{ row }"><b class="code">{{ row.orderNo || '—' }}</b></template>
        </el-table-column>
        <el-table-column :label="copy.orderStatus" min-width="110">
          <template #default="{ row }">{{ text(row.orderStatusI18n, '', '—') }}</template>
        </el-table-column>
        <el-table-column :label="copy.redemptionStatus" min-width="110">
          <template #default="{ row }">
            <span :class="redemptionClass(row.redemptionStatus)">{{ text(row.redemptionStatusI18n, '', '—') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="copy.orderTime" min-width="150">
          <template #default="{ row }">{{ formatTime(row.orderTime) }}</template>
        </el-table-column>
        <el-table-column :label="copy.firstOrder" width="80">
          <template #default="{ row }">{{ row.firstOrder ? copy.yes : copy.no }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="redemptionTotal > redemptionPageSize"
        v-model:current-page="redemptionPage"
        :page-size="redemptionPageSize"
        :total="redemptionTotal"
        layout="prev, pager, next, total"
        @current-change="loadRedemptions"
      />
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { getPage as categoryPage } from '@/modules/admin/api/category';
import { pageCustomers, type CustomerRow } from '@/modules/admin/api/clientUser';
import { couponAdd, couponDetail, couponDisable, couponEnable, couponPage, couponRedemptions, couponUpdate, type CouponSavePayload } from '@/modules/admin/api/coupon';
import { getPackagePage } from '@/modules/admin/api/package';
import { page as servicePage, listBySpu } from '@/modules/admin/api/spu';
import { canAction } from '@/modules/admin/utils/menuPermission';

type Option = { id: number; label: string };
type CouponRow = {
  id: number;
  couponCode?: string;
  name?: string;
  nameI18n?: Record<string, string>;
  offerText?: string;
  offerI18n?: Record<string, string>;
  serviceText?: string;
  serviceTextI18n?: Record<string, string>;
  customerText?: string;
  customerScopeI18n?: Record<string, string>;
  status?: number;
  statusI18n?: Record<string, string>;
  usagePrimary?: string;
  usageHint?: string;
  usageHintI18n?: Record<string, string>;
  usagePercent?: number;
  rowAction?: string;
  rowActionText?: string;
  rowActionI18n?: Record<string, string>;
};

const { locale } = useI18n();
const copy = computed(() => (locale.value.startsWith('zh') ? {
  title: '优惠券', create: '新建优惠券', live: '生效中的券', orders: '已使用次数', cost: '平台承担金额', rule: '规则',
  oneDiscount: '每笔订单一次折扣', supplierShare: '供应商按填写的比例承担', search: '搜索券码或名称', allStatus: '全部状态',
  searchAction: '查询', empty: '没有优惠券', code: '券码', offer: '优惠', applies: '适用范围', usage: '使用情况',
  status: '状态', actions: '操作', edit: '编辑', redemptions: '核销记录', redemptionEmpty: '还没有核销记录',
  orderNo: '订单号', orderStatus: '订单状态', redemptionStatus: '核销状态', orderTime: '下单时间', firstOrder: '首单',
  yes: '是', no: '否',
  editTitle: '编辑优惠券', nameEn: '英文名称', nameZh: '中文名称',
  allocation: '发放方式', discount: '折扣', type: '类型', percent: '减免比例 %',
  maxOrder: '单笔最高减免', minEligible: '符合条件商品最低消费', platform: '平台承担 %', supplier: '供应商承担 %', who: '对象与范围',
  customers: '适用客户', services: '适用服务', pickCustomers: '指定客户', categories: '服务分类',
  pickServices: '服务', skus: 'SKU', packages: '套餐', limits: '次数与有效期', total: '总次数', perUser: '每位顾客次数',
  start: '开始', end: '结束', batch: '计划发放数量', blankUnlimited: '留空表示不限制',
  spend: '满', off: '减', addTier: '增加一档', remove: '删除',
  excludeVat: '按不含增值税金额计算', cancel: '取消', save: '保存', saved: '优惠券已保存', failed: '保存失败，请检查填写内容',
  fixedRetired: '固定金额已取消，请改为百分比或满减后再保存',
} : {
  title: 'Coupons', create: 'New Coupon', live: 'Live coupons', orders: 'Orders using a coupon', cost: 'Platform cost', rule: 'Rule',
  oneDiscount: 'One discount per order', supplierShare: 'Suppliers share the discount at the ratio you set', search: 'Search code or name', allStatus: 'All statuses',
  searchAction: 'Search', empty: 'No coupons', code: 'Code', offer: 'Offer', applies: 'Applies to', usage: 'Usage',
  status: 'Status', actions: 'Actions', edit: 'Edit', redemptions: 'Redemptions', redemptionEmpty: 'No redemptions yet',
  orderNo: 'Order', orderStatus: 'Order status', redemptionStatus: 'Redemption', orderTime: 'Order time', firstOrder: 'First order',
  yes: 'Yes', no: 'No',
  editTitle: 'Edit coupon', nameEn: 'Name (English)', nameZh: 'Name (中文)',
  allocation: 'Distribution', discount: 'Discount', type: 'Type', percent: 'Discount %',
  maxOrder: 'Max discount per order', minEligible: 'Min spend on eligible items', platform: 'Platform share %', supplier: 'Supplier share %', who: 'Who and where',
  customers: 'Customers', services: 'Applies to', pickCustomers: 'Specific customers', categories: 'Categories',
  pickServices: 'Services', skus: 'SKU', packages: 'Packages', limits: 'Limits and validity', total: 'Total uses', perUser: 'Uses per customer',
  start: 'Start', end: 'End', batch: 'Codes to issue', blankUnlimited: 'Leave blank for no limit',
  spend: 'Spend', off: 'Save', addTier: 'Add tier', remove: 'Remove',
  excludeVat: 'Calculate on the amount excluding VAT', cancel: 'Cancel', save: 'Save', saved: 'Coupon saved', failed: 'Could not save this coupon',
  fixedRetired: 'Fixed amount is no longer available. Choose a percentage or spend-and-save before saving.',
}));
const statuses = computed(() => zhOptions([
  [0, '草稿', 'Draft'], [1, '已安排', 'Scheduled'], [2, '启用', 'Active'], [3, '暂停', 'Paused'],
]));
const allocations = computed(() => zhOptions([
  [1, '公共代码', 'Public code'], [2, '分配给客户', 'Assign to customer'],
  [3, '自动（奖励）', 'Automatic reward'], [4, '批量唯一代码', 'Batch unique codes'],
]));
const discountTypes = computed(() => zhOptions([
  [1, '百分比', 'Percentage'], [3, '满减', 'Spend and save'],
]));
const customerScopes = computed(() => zhOptions([
  [1, '所有人', 'Everyone'], [2, '新客户', 'New customers'], [3, '回头客', 'Returning customers'], [4, '指定客户', 'Specific customers'],
]));
const serviceScopes = computed(() => zhOptions([
  [1, '所有服务', 'All services'], [2, '选定分类', 'Selected categories'],
  [3, '选定服务', 'Selected services'], [4, '指定 SKU', 'Selected SKU'],
  [5, '适用套餐', 'Selected packages'],
]));

function zhOptions(items: Array<[number, string, string]>) {
  return items.map(([value, labelZh, labelEn]) => ({ value, label: locale.value.startsWith('zh') ? labelZh : labelEn }));
}
function text(map: Record<string, string> | undefined, fallback: string | undefined, empty: string) {
  const language = String(locale.value || 'zh').split('-')[0];
  return map?.[language] || map?.zh || map?.en || fallback || empty;
}
function money(value?: number | null) {
  const amount = Number(value || 0);
  return `AED ${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function statusLabel(status?: number) {
  return statuses.value.find((item) => item.value === status)?.label || '—';
}
function statusClass(status?: number) {
  return ['tag', status === 2 ? 'on' : status === 3 ? 'paused' : status === 1 ? 'soon' : 'draft'];
}
function redemptionClass(status?: number) {
  return ['tag', status === 2 ? 'on' : status === 1 ? 'soon' : 'draft'];
}
function formatTime(value?: string | number | null) {
  if (value == null || value === '') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
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
function body<T>(payload: unknown): T {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  return (root.data && typeof root.data === 'object' ? root.data : root) as T;
}
function listOf(payload: unknown) {
  const data = body<Record<string, unknown>>(payload);
  const list = data.list ?? data.records;
  return Array.isArray(list) ? list : [];
}
function optionId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}
function blankForm() {
  return {
    id: undefined as number | undefined,
    nameEn: '', nameZh: '', couponCode: '', allocationType: 1, customerScope: 1, serviceScope: 1,
    status: 0, discountType: 1, platformRatio: 100, supplierRatio: 0, discountPercent: 10 as number | null,
    maxDiscountPerOrder: null as number | null,
    minQualifyingAmount: null as number | null, totalUseLimit: null as number | null,
    perCustomerUseLimit: 1 as number | null, batchSize: null as number | null,
    validStart: '', validEnd: '', customerIds: [] as number[], categoryIds: [] as number[],
    spuIds: [] as number[], skuIds: [] as number[], packageIds: [] as number[],
    reductionRules: [{ threshold: null, reduction: null }] as Array<{ threshold: number | null; reduction: number | null }>,
    excludeVat: true,
  };
}
function ratioCents(value: number | null | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.min(10000, Math.max(0, Math.round(amount * 100)));
}
function setPlatformRatio(value: number | null | undefined) {
  const platform = ratioCents(value);
  form.platformRatio = platform / 100;
  form.supplierRatio = (10000 - platform) / 100;
}
function setSupplierRatio(value: number | null | undefined) {
  const supplier = ratioCents(value);
  form.supplierRatio = supplier / 100;
  form.platformRatio = (10000 - supplier) / 100;
}

const rows = ref<CouponRow[]>([]);
const summary = ref<Record<string, any>>({});
const total = ref(0);
const pageNum = ref(1);
const pageSize = 20;
const keyword = ref('');
const status = ref<number | undefined>();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const drawer = ref(false);
const redemptionOpen = ref(false);
const redemptionLoading = ref(false);
const redemptionCode = ref('');
const redemptionRows = ref<Array<Record<string, any>>>([]);
const redemptionTotal = ref(0);
const redemptionPage = ref(1);
const redemptionPageSize = 10;
const redemptionError = ref('');
const form = reactive(blankForm());
const categories = ref<Option[]>([]);
const services = ref<Option[]>([]);
const skus = ref<Option[]>([]);
const packages = ref<Option[]>([]);
const customers = ref<Option[]>([]);
const serviceLoading = ref(false);
const packageLoading = ref(false);
const customerLoading = ref(false);

function remember(target: { value: Option[] }, items: Option[]) {
  const map = new Map(target.value.map((item) => [item.id, item]));
  items.forEach((item) => map.set(item.id, item));
  target.value = Array.from(map.values());
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const page = body<{ list?: CouponRow[]; total?: number; summary?: Record<string, any> }>(await couponPage({
      keyword: keyword.value.trim() || undefined,
      status: status.value,
      pageNum: pageNum.value,
      pageSize,
    }));
    rows.value = Array.isArray(page.list) ? page.list : [];
    total.value = Number(page.total || 0);
    summary.value = page.summary || {};
  } catch (reason: any) {
    rows.value = [];
    error.value = reason?.message || copy.value.failed;
  } finally {
    loading.value = false;
  }
}
function search() {
  pageNum.value = 1;
  load();
}
function openRedemptions(row: CouponRow) {
  redemptionCode.value = String(row.couponCode || '').trim();
  redemptionPage.value = 1;
  redemptionRows.value = [];
  redemptionTotal.value = 0;
  redemptionError.value = '';
  redemptionOpen.value = true;
  loadRedemptions();
}
async function loadRedemptions() {
  if (!redemptionCode.value) return;
  redemptionLoading.value = true;
  redemptionError.value = '';
  try {
    const page = body<{ list?: Array<Record<string, any>>; total?: number }>(await couponRedemptions({
      couponCode: redemptionCode.value,
      pageNum: redemptionPage.value,
      pageSize: redemptionPageSize,
    }));
    redemptionRows.value = Array.isArray(page.list) ? page.list : [];
    redemptionTotal.value = Number(page.total || 0);
  } catch (reason: any) {
    redemptionRows.value = [];
    redemptionError.value = reason?.message || copy.value.failed;
  } finally {
    redemptionLoading.value = false;
  }
}
async function loadCategories() {
  const records = listOf(await categoryPage({ pageNum: 1, pageSize: 200, level: '1' }));
  categories.value = records.flatMap((item: any) => {
    const id = optionId(item.category?.id ?? item.id);
    if (!id) return [];
    const name = text(item.nameI18n, item.category?.name || item.name, String(id));
    return [{ id, label: name }];
  });
}
async function searchServices(query: string) {
  serviceLoading.value = true;
  try {
    const records = listOf(await servicePage({ pageNum: 1, pageSize: 20, nameKeyword: query.trim() || undefined }));
    remember(services, records.flatMap((item: any) => {
      if (Number(item.spu?.packageService) === 1) return [];
      const id = optionId(item.spu?.id ?? item.id);
      if (!id) return [];
      return [{ id, label: text(item.nameI18n, item.spu?.spuName, String(id)) }];
    }));
  } finally {
    serviceLoading.value = false;
  }
}
async function searchPackages(query: string) {
  packageLoading.value = true;
  try {
    const records = listOf(await getPackagePage({ pageNum: 1, pageSize: 20, nameKeyword: query.trim() || undefined }));
    remember(packages, records.flatMap((item: any) => {
      const id = optionId(item.id);
      if (!id) return [];
      return [{ id, label: text(item.nameI18n, item.packageName, String(id)) }];
    }));
  } finally {
    packageLoading.value = false;
  }
}
async function loadSkus() {
  if (form.serviceScope !== 4) return;
  const selected = skus.value.filter((item) => form.skuIds.includes(item.id));
  if (!form.spuIds.length) {
    skus.value = selected;
    return;
  }
  const lists = await Promise.all(form.spuIds.map(async (spuId) => {
    const data = body<{ specTypes?: any[]; skus?: any[] }>(await listBySpu(spuId));
    const specTypes = Array.isArray(data.specTypes) ? data.specTypes : [];
    return (Array.isArray(data.skus) ? data.skus : []).flatMap((sku) => {
      const id = optionId(sku?.skuId ?? sku?.id);
      if (!id) return [];
      const labels = specTypes.map((spec) => {
        const raw = sku?.[String(spec?.specKey ?? spec?.specTypeId)];
        if (raw && typeof raw === 'object') return text(raw.nameI18n, raw.specValueName || raw.name, '');
        const value = raw == null ? '' : String(raw).trim();
        return /^\d+$/.test(value) ? '' : value;
      }).filter(Boolean);
      return [{ id, label: labels.join(' / ') || sku.skuCode || String(id) }];
    });
  }));
  const loaded = lists.flat();
  skus.value = selected;
  remember(skus, loaded);
}
function customerOption(item: CustomerRow) {
  const id = optionId(item.id);
  if (!id) return null;
  const label = [item.name, item.phone, item.email].map((part) => part?.trim()).filter(Boolean).join(' · ') || String(id);
  return { id, label };
}

async function searchCustomers(query: string) {
  const textQuery = query.trim();
  if (!textQuery) return;
  customerLoading.value = true;
  try {
    const pages = await Promise.all([
      pageCustomers({ pageNum: 1, pageSize: 20, name: textQuery }),
      pageCustomers({ pageNum: 1, pageSize: 20, phone: textQuery }),
      pageCustomers({ pageNum: 1, pageSize: 20, email: textQuery }),
    ]);
    const seen = new Set<number>();
    remember(customers, pages.flatMap((page) => (page?.list || []).flatMap((item) => {
      const option = customerOption(item);
      if (!option || seen.has(option.id)) return [];
      seen.add(option.id);
      return [option];
    })));
  } finally {
    customerLoading.value = false;
  }
}
function fillCustomers(detail: Record<string, any>) {
  const listed = Array.isArray(detail.customers) ? detail.customers : [];
  remember(customers, listed.flatMap((item: any) => {
    const id = optionId(item.id);
    return id ? [{ id, label: [item.name, item.phone].filter(Boolean).join(' · ') || String(id) }] : [];
  }));
}
function idList(value: unknown) {
  return (Array.isArray(value) ? value : []).flatMap((item) => {
    const id = optionId(item);
    return id ? [id] : [];
  });
}
function serviceOptions(detail: Record<string, any>) {
  const listed = Array.isArray(detail.services) ? detail.services : [];
  return listed.flatMap((item: any) => {
    const id = optionId(item.id);
    return id ? [{ id, label: text(item.nameI18n, item.name, String(id)) }] : [];
  });
}
function fillServices(detail: Record<string, any>) {
  remember(services, serviceOptions(detail));
}
function openCreate() {
  Object.assign(form, blankForm());
  drawer.value = true;
  loadCategories();
}
async function openEdit(id: number) {
  const detail = body<Record<string, any>>(await couponDetail(id));
  Object.assign(form, blankForm(), {
    id: detail.id,
    nameEn: detail.nameI18n?.en || '',
    nameZh: detail.nameI18n?.zh || '',
    couponCode: detail.couponCode || '',
    allocationType: Number(detail.allocationType || 1),
    customerScope: Number(detail.customerScope || 1),
    serviceScope: Number(detail.serviceScope || 1),
    status: Number(detail.status || 0),
    discountType: Number(detail.discountType) === 2 ? 1 : Number(detail.discountType || 1),
    platformRatio: ratioCents(detail.platformRatio ?? (detail.supplierRatio == null ? 100 : 100 - Number(detail.supplierRatio))) / 100,
    supplierRatio: ratioCents(detail.supplierRatio ?? (detail.platformRatio == null ? 0 : 100 - Number(detail.platformRatio))) / 100,
    discountPercent: detail.discountPercent ?? null,
    maxDiscountPerOrder: detail.maxDiscountPerOrder ?? null,
    minQualifyingAmount: detail.minQualifyingAmount ?? null,
    totalUseLimit: detail.totalUseLimit ?? null,
    perCustomerUseLimit: detail.perCustomerUseLimit ?? null,
    batchSize: detail.batchSize ?? null,
    validStart: String(detail.validStart || '').slice(0, 10),
    validEnd: String(detail.validEnd || '').slice(0, 10),
    customerIds: detail.customerIds || [],
    categoryIds: detail.categoryIds || [],
    spuIds: detail.spuIds || [],
    skuIds: detail.skuIds || [],
    packageIds: idList(detail.packageIds),
    reductionRules: detail.reductionRules?.length ? detail.reductionRules : [{ threshold: null, reduction: null }],
    excludeVat: detail.excludeVat !== false,
  });
  setPlatformRatio(form.platformRatio);
  fillCustomers(detail);
  if (Number(detail.serviceScope) === 4) remember(skus, serviceOptions(detail));
  else if (Number(detail.serviceScope) === 5) remember(packages, serviceOptions(detail));
  else fillServices(detail);
  if (Number(detail.discountType) === 2) ElMessage.warning(copy.value.fixedRetired);
  drawer.value = true;
  await Promise.all([loadCategories(), form.serviceScope === 4 ? loadSkus() : Promise.resolve()]);
}
function optional(value: number | null | undefined) {
  return value == null || Number(value) <= 0 ? undefined : Number(value);
}
async function save() {
  const nameI18n: Record<string, string> = {};
  if (form.nameEn.trim()) nameI18n.en = form.nameEn.trim();
  if (form.nameZh.trim()) nameI18n.zh = form.nameZh.trim();
  const payload: CouponSavePayload = {
    id: form.id,
    nameI18n,
    couponCode: form.couponCode.trim().toUpperCase(),
    allocationType: form.allocationType,
    customerScope: form.customerScope,
    serviceScope: form.serviceScope,
    validStart: form.validStart,
    validEnd: form.validEnd,
    status: form.status,
    discountType: form.discountType === 2 ? 1 : form.discountType,
    platformRatio: form.platformRatio,
    supplierRatio: form.supplierRatio,
    customerIds: form.customerScope === 4 ? form.customerIds : undefined,
    categoryIds: form.serviceScope === 2 ? form.categoryIds : undefined,
    spuIds: form.serviceScope === 3 ? form.spuIds : undefined,
    skuIds: form.serviceScope === 4 ? form.skuIds : undefined,
    packageIds: form.serviceScope === 5 ? form.packageIds : undefined,
    totalUseLimit: optional(form.totalUseLimit),
    perCustomerUseLimit: optional(form.perCustomerUseLimit),
    discountPercent: form.discountType === 1 ? form.discountPercent : undefined,
    maxDiscountPerOrder: optional(form.maxDiscountPerOrder),
    reductionRules: form.discountType === 3
      ? form.reductionRules.filter((tier) => tier.threshold && tier.reduction)
      : undefined,
    minQualifyingAmount: optional(form.minQualifyingAmount),
    batchSize: form.allocationType === 4 ? optional(form.batchSize) : undefined,
    excludeVat: form.excludeVat,
  };
  saving.value = true;
  try {
    if (form.id) await couponUpdate(payload);
    else await couponAdd(payload);
    ElMessage.success(copy.value.saved);
    drawer.value = false;
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  } finally {
    saving.value = false;
  }
}
async function toggle(row: CouponRow) {
  try {
    if (row.rowAction === 'PAUSE') await couponDisable(row.id);
    else await couponEnable(row.id);
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  }
}
onMounted(load);
</script>

<style scoped>
.coupon-page { display: flex; flex-direction: column; gap: 16px; padding: 20px 24px 40px; }
.coupon-page__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.coupon-page__head p { margin: 0; color: #0a7a6a; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; }
.coupon-page__head h1 { margin: 4px 0 0; font-size: 26px; }
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.kpis article, .board { background: #fff; border: 1px solid #e3eaf2; border-radius: 16px; }
.kpis article { padding: 16px 18px; }
.kpis span, .board small { color: #6b7a90; }
.kpis strong { display: block; margin-top: 4px; font-size: 24px; }
.kpis .rule { font-size: 15px; }
.board { padding: 16px; }
.filters { display: flex; gap: 10px; margin-bottom: 12px; }
.filters .el-input { width: 260px; }
.code { display: block; font-family: ui-monospace, Menlo, monospace; }
.row-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 2px 8px; }
.redemption-code { margin: 0 0 12px; font-family: ui-monospace, Menlo, monospace; font-weight: 700; }
.bar { height: 6px; margin: 6px 0; background: #eef2f7; border-radius: 6px; overflow: hidden; }
.bar i { display: block; height: 100%; background: #102a48; }
.tag { border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; background: #eef2f7; }
.tag.on { color: #0a7a6a; background: #e8faf7; }
.tag.paused { color: #b54708; background: #fff4e5; }
.tag.soon { color: #2d5bd3; background: #eef3ff; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.grid.three { grid-template-columns: 1fr 1fr 1fr; }
.grid :deep(.el-select), .grid :deep(.el-input-number), .grid :deep(.el-date-editor) { width: 100%; }
h3 { margin: 8px 0 12px; font-size: 15px; }
.tiers { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.tier { display: flex; gap: 8px; align-items: center; }
.mono :deep(input) { font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; }
@media (max-width: 900px) { .kpis, .grid, .grid.three { grid-template-columns: 1fr; } }
</style>
