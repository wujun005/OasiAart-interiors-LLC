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
          <template #default="{ row }"><span :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span></template>
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
          <el-form-item :label="copy.name"><el-input v-model="form.name" maxlength="80" /></el-form-item>
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
            <el-radio-group v-model="form.live">
              <el-radio :value="true">{{ copy.liveChoice }}</el-radio>
              <el-radio :value="false">{{ copy.offChoice }}</el-radio>
            </el-radio-group>
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
        <el-form-item :label="copy.customers">
          <el-select v-model="form.customerScope">
            <el-option v-for="item in customerScopes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.customerScope === 4" :label="copy.pickCustomers">
          <el-select v-model="form.customerIds" multiple filterable remote :remote-method="searchCustomers" :loading="customerLoading">
            <el-option v-for="item in customers" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="copy.scope">
          <div class="scope-checks">
            <el-checkbox v-model="scope.allServices">{{ copy.allServices }}</el-checkbox>
            <el-checkbox v-model="scope.allPackages">{{ copy.allPackages }}</el-checkbox>
            <el-checkbox v-model="scope.categories" @change="(checked) => onScopeCheck('categories', checked)">{{ copy.categories }}</el-checkbox>
            <el-checkbox v-model="scope.services" @change="(checked) => onScopeCheck('services', checked)">{{ copy.services }}</el-checkbox>
            <el-checkbox v-model="scope.skus" @change="(checked) => onScopeCheck('skus', checked)">{{ copy.skus }}</el-checkbox>
            <el-checkbox v-model="scope.packages" @change="(checked) => onScopeCheck('packages', checked)">{{ copy.packages }}</el-checkbox>
          </div>
          <small class="field-hint">{{ copy.scopeHint }}</small>
        </el-form-item>
        <el-form-item v-if="scope.categories" :label="copy.categories">
          <el-tree-select
            v-model="form.categoryIds"
            :data="categoryTree"
            multiple
            filterable
            check-strictly
            show-checkbox
            collapse-tags
            collapse-tags-tooltip
            :render-after-expand="false"
            :loading="categoryLoading"
            :placeholder="copy.categoryPlaceholder"
          />
          <small class="field-hint">{{ copy.categoryHint }}</small>
        </el-form-item>
        <el-form-item v-if="scope.services" :label="copy.services">
          <el-select v-model="form.spuIds" multiple filterable collapse-tags collapse-tags-tooltip :loading="shelfLoading" :placeholder="copy.servicePlaceholder">
            <el-option v-for="item in serviceOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <small class="field-hint">{{ copy.serviceHint }}</small>
        </el-form-item>
        <el-form-item v-if="scope.skus" :label="copy.skus">
          <el-select v-model="form.skuIds" multiple filterable collapse-tags collapse-tags-tooltip :loading="shelfLoading" :placeholder="copy.skuPlaceholder">
            <el-option-group v-for="group in skuGroups" :key="group.id" :label="group.label">
              <el-option v-for="item in group.skus" :key="item.id" :label="item.label" :value="item.id" />
            </el-option-group>
          </el-select>
          <small class="field-hint">{{ copy.skuHint }}</small>
        </el-form-item>
        <el-form-item v-if="scope.packages" :label="copy.packages">
          <el-select
            v-model="form.packageIds"
            multiple
            filterable
            remote
            collapse-tags
            collapse-tags-tooltip
            :remote-method="searchPackages"
            :loading="packageLoading"
            :placeholder="copy.packagePlaceholder"
          >
            <el-option v-for="item in packages" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <small class="field-hint">{{ copy.packageHint }}</small>
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
import { onShelfOptions } from '@/modules/admin/api/spu';
import { canAction } from '@/modules/admin/utils/menuPermission';

type Option = { id: number; label: string };
type ShelfSku = { id: number; label: string };
type ShelfService = { id: number; label: string; skus: ShelfSku[] };
type CategoryNode = { value: number; label: string; children?: CategoryNode[] };
type ScopeKind = 'categories' | 'services' | 'skus' | 'packages';
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
  editTitle: '编辑优惠券', name: '优惠券名称', liveChoice: '上线', offChoice: '关闭',
  allocation: '发放方式', discount: '折扣', type: '类型', percent: '减免比例 %',
  maxOrder: '单笔最高减免', minEligible: '符合条件商品最低消费', platform: '平台承担 %', supplier: '供应商承担 %', who: '对象与范围',
  customers: '适用客户', pickCustomers: '指定客户', scope: '适用范围',
  scopeHint: '可同时勾选多项。所有服务覆盖任意服务订单，所有套餐覆盖任意套餐订单。指定项只对选中的内容生效。',
  allServices: '所有服务', allPackages: '所有套餐', categories: '指定服务类别', services: '指定服务',
  skus: '指定服务 SKU', packages: '指定套餐',
  categoryPlaceholder: '选择一级或二级类别', categoryHint: '提交选中的类别编号。一级、二级都可以选。',
  servicePlaceholder: '选择已上架服务', serviceHint: '只列出已上架的普通服务。',
  skuPlaceholder: '选择规格', skuHint: '规格值用｜连接，不显示商品编码。',
  packagePlaceholder: '搜索已上架套餐', packageHint: '只列出已上架套餐。',
  pickScope: '请选择适用范围', pickCategory: '请选择服务类别', pickService: '请选择服务',
  pickSku: '请选择服务规格', pickPackage: '请选择套餐', tooMany: '每一项最多选择 500 个',
  selectedSpecs: '已选规格',
  limits: '次数与有效期', total: '总次数', perUser: '每位顾客次数',
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
  editTitle: 'Edit coupon', name: 'Coupon name', liveChoice: 'Live', offChoice: 'Off',
  allocation: 'Distribution', discount: 'Discount', type: 'Type', percent: 'Discount %',
  maxOrder: 'Max discount per order', minEligible: 'Min spend on eligible items', platform: 'Platform share %', supplier: 'Supplier share %', who: 'Who and where',
  customers: 'Customers', pickCustomers: 'Specific customers', scope: 'Applies to',
  scopeHint: 'Select any combination. All services covers every service booking. All packages covers every package booking. A specific type only covers what you pick.',
  allServices: 'All services', allPackages: 'All packages', categories: 'Specific categories', services: 'Specific services',
  skus: 'Specific service options', packages: 'Specific packages',
  categoryPlaceholder: 'Choose a category', categoryHint: 'Level 1 and level 2 categories can both be selected.',
  servicePlaceholder: 'Choose listed services', serviceHint: 'Only listed regular services are shown.',
  skuPlaceholder: 'Choose options', skuHint: 'Option values are joined with ｜. Product codes are hidden.',
  packagePlaceholder: 'Search listed packages', packageHint: 'Only listed packages are shown.',
  pickScope: 'Select where this coupon applies', pickCategory: 'Select a category', pickService: 'Select a service',
  pickSku: 'Select a service option', pickPackage: 'Select a package', tooMany: 'Each list can include at most 500 items',
  selectedSpecs: 'Selected options',
  limits: 'Limits and validity', total: 'Total uses', perUser: 'Uses per customer',
  start: 'Start', end: 'End', batch: 'Codes to issue', blankUnlimited: 'Leave blank for no limit',
  spend: 'Spend', off: 'Save', addTier: 'Add tier', remove: 'Remove',
  excludeVat: 'Calculate on the amount excluding VAT', cancel: 'Cancel', save: 'Save', saved: 'Coupon saved', failed: 'Could not save this coupon',
  fixedRetired: 'Fixed amount is no longer available. Choose a percentage or spend-and-save before saving.',
}));
const statuses = computed(() => zhOptions([
  [2, '上线', 'Live'], [3, '关闭', 'Off'],
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
  const zh = locale.value.startsWith('zh');
  if (status === 1 || status === 2) return zh ? '上线' : 'Live';
  return zh ? '关闭' : 'Off';
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
    name: '', couponCode: '', allocationType: 1, customerScope: 1,
    live: true, status: 0, discountType: 1, platformRatio: 100, supplierRatio: 0, discountPercent: 10 as number | null,
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
const scope = reactive({
  allServices: false,
  allPackages: false,
  categories: false,
  services: false,
  skus: false,
  packages: false,
});
const shelf = ref<ShelfService[]>([]);
const categoryTree = ref<CategoryNode[]>([]);
const packages = ref<Option[]>([]);
const customers = ref<Option[]>([]);
const shelfLoading = ref(false);
const categoryLoading = ref(false);
const packageLoading = ref(false);
const customerLoading = ref(false);
let shelfRequest: Promise<void> | null = null;
let categoryRequest: Promise<void> | null = null;
let packageQuery = 0;
const serviceOptions = computed(() => shelf.value.filter((item) => item.id > 0));
const skuGroups = computed(() => shelf.value.filter((item) => item.skus.length));
function remember<T extends Option>(target: { value: T[] }, items: T[]) {
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
function resultList(payload: unknown) {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const data = Array.isArray(payload) ? payload : root.data;
  return Array.isArray(data) ? data : [];
}
function categoryOption(item: any): Option | null {
  const id = optionId(item?.category?.id ?? item?.id);
  if (!id) return null;
  return { id, label: text(item?.nameI18n, item?.category?.name || item?.name, String(id)) };
}
async function categoryRecords(extra: Record<string, unknown>) {
  const pageSize = 200;
  const rows: Option[] = [];
  for (let pageNum = 1; pageNum <= 5; pageNum += 1) {
    const page = body<{ list?: unknown[]; total?: number }>(await categoryPage({
      pageNum,
      pageSize,
      categoryDomain: 1,
      ...extra,
    }));
    const list = Array.isArray(page.list) ? page.list : [];
    list.forEach((item) => {
      const option = categoryOption(item);
      if (option) rows.push(option);
    });
    const total = Number(page.total || 0);
    if (!list.length || (total > 0 && rows.length >= total)) break;
  }
  return rows;
}
async function loadCategoryTree() {
  if (categoryRequest) return categoryRequest;
  categoryLoading.value = true;
  categoryRequest = (async () => {
    const parents = await categoryRecords({ level: 1 });
    const children = await Promise.all(parents.map(async (parent) => {
      try {
        return await categoryRecords({ level: 2, pcategoryId: String(parent.id) });
      } catch {
        return [] as Option[];
      }
    }));
    const nodes: CategoryNode[] = parents.map((parent, index) => {
      const nested = children[index].map((child) => ({ value: child.id, label: child.label }));
      return nested.length
        ? { value: parent.id, label: parent.label, children: nested }
        : { value: parent.id, label: parent.label };
    });
    const present = new Set<number>();
    nodes.forEach((node) => {
      present.add(node.value);
      node.children?.forEach((child) => present.add(child.value));
    });
    const previous = new Map(categoryTree.value.map((node) => [node.value, node.label]));
    form.categoryIds.forEach((id) => {
      if (present.has(id)) return;
      nodes.push({ value: id, label: previous.get(id) || String(id) });
    });
    categoryTree.value = nodes;
  })();
  try {
    await categoryRequest;
  } catch (reason: any) {
    categoryRequest = null;
    ElMessage.error(reason?.message || copy.value.failed);
  } finally {
    categoryLoading.value = false;
  }
}
function mergeShelf(incoming: ShelfService[]) {
  const map = new Map<number, ShelfService>();
  shelf.value.forEach((item) => map.set(item.id, { ...item, skus: item.skus.slice() }));
  incoming.forEach((item) => {
    const current = map.get(item.id);
    if (!current) {
      map.set(item.id, { ...item, skus: item.skus.slice() });
      return;
    }
    const skus = new Map(current.skus.map((sku) => [sku.id, sku]));
    item.skus.forEach((sku) => skus.set(sku.id, sku));
    map.set(item.id, { id: item.id, label: item.label || current.label, skus: Array.from(skus.values()) });
  });
  const owned = new Set<number>();
  map.forEach((item) => {
    if (item.id > 0) item.skus.forEach((sku) => owned.add(sku.id));
  });
  const loose = map.get(0);
  if (loose) {
    loose.skus = loose.skus.filter((sku) => !owned.has(sku.id));
    if (!loose.skus.length) map.delete(0);
  }
  const services = Array.from(map.values()).filter((item) => item.id > 0);
  const rest = map.get(0);
  shelf.value = rest ? [...services, rest] : services;
}
async function loadShelf() {
  if (shelfRequest) return shelfRequest;
  shelfLoading.value = true;
  shelfRequest = (async () => {
    const rows = resultList(await onShelfOptions());
    mergeShelf(rows.flatMap((item: any) => {
      const id = optionId(item?.id);
      if (!id) return [];
      const skus = (Array.isArray(item?.skus) ? item.skus : []).flatMap((sku: any) => {
        const skuId = optionId(sku?.id);
        const label = text(sku?.nameI18n, sku?.name, '').trim();
        if (!skuId || !label) return [];
        return [{ id: skuId, label }];
      });
      return [{ id, label: text(item?.nameI18n, item?.name, String(id)), skus }];
    }));
  })();
  try {
    await shelfRequest;
  } catch (reason: any) {
    shelfRequest = null;
    ElMessage.error(reason?.message || copy.value.failed);
  } finally {
    shelfLoading.value = false;
  }
}
function onScopeCheck(kind: ScopeKind, checked: unknown) {
  if (checked !== true) return;
  if (kind === 'categories') void loadCategoryTree();
  if (kind === 'services' || kind === 'skus') void loadShelf();
  if (kind === 'packages') void searchPackages('');
}
async function searchPackages(query: string) {
  const ticket = ++packageQuery;
  const keyword = query.trim();
  packageLoading.value = true;
  try {
    const records = listOf(await getPackagePage({
      pageNum: 1,
      pageSize: keyword ? 50 : 100,
      status: 1,
      nameKeyword: keyword || undefined,
    }));
    if (ticket !== packageQuery) return;
    const selected = packages.value.filter((item) => form.packageIds.includes(item.id));
    packages.value = selected;
    remember(packages, records.flatMap((item: any) => {
      const id = optionId(item.id);
      if (!id) return [];
      return [{ id, label: text(item.nameI18n, item.packageName, String(id)) }];
    }));
  } finally {
    if (ticket === packageQuery) packageLoading.value = false;
  }
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
function namedOptions(detail: Record<string, any>, targetType: string) {
  const listed = Array.isArray(detail.services) ? detail.services : [];
  return listed.flatMap((item: any) => {
    if (String(item?.targetType || '').toUpperCase() !== targetType) return [];
    const id = optionId(item.id);
    if (!id) return [];
    return [{ id, label: text(item.nameI18n, item.name, String(id)) }];
  });
}
function resetScope() {
  scope.allServices = false;
  scope.allPackages = false;
  scope.categories = false;
  scope.services = false;
  scope.skus = false;
  scope.packages = false;
}
function resetTargets() {
  shelf.value = [];
  shelfRequest = null;
  categoryTree.value = [];
  categoryRequest = null;
  packages.value = [];
  packageQuery += 1;
}
function seedTargets(detail: Record<string, any>) {
  const services = namedOptions(detail, 'SPU').map((item) => ({ id: item.id, label: item.label, skus: [] as ShelfSku[] }));
  const loose = namedOptions(detail, 'SKU');
  mergeShelf(loose.length
    ? [...services, { id: 0, label: copy.value.selectedSpecs, skus: loose }]
    : services);
  remember(packages, namedOptions(detail, 'PACKAGE'));
  categoryTree.value = namedOptions(detail, 'CATEGORY').map((item) => ({ value: item.id, label: item.label }));
}
function applyDetailScope(detail: Record<string, any>) {
  const categoryIds = idList(detail.categoryIds);
  const spuIds = idList(detail.spuIds);
  const skuIds = idList(detail.skuIds);
  const packageIds = idList(detail.packageIds);
  scope.allServices = detail.allServices === true;
  scope.allPackages = detail.allPackages === true;
  scope.categories = categoryIds.length > 0;
  scope.services = spuIds.length > 0;
  scope.skus = skuIds.length > 0;
  scope.packages = packageIds.length > 0;
  form.categoryIds = categoryIds;
  form.spuIds = spuIds;
  form.skuIds = skuIds;
  form.packageIds = packageIds;
}
function openCreate() {
  Object.assign(form, blankForm());
  resetScope();
  resetTargets();
  drawer.value = true;
}
async function openEdit(id: number) {
  const detail = body<Record<string, any>>(await couponDetail(id));
  Object.assign(form, blankForm(), {
    id: detail.id,
    name: detail.nameI18n?.zh || detail.nameI18n?.en || detail.name || '',
    couponCode: detail.couponCode || '',
    allocationType: Number(detail.allocationType || 1),
    customerScope: Number(detail.customerScope || 1),
    status: Number(detail.status || 0),
    live: Number(detail.status) === 1 || Number(detail.status) === 2,
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
    customerIds: idList(detail.customerIds),
    reductionRules: detail.reductionRules?.length ? detail.reductionRules : [{ threshold: null, reduction: null }],
    excludeVat: detail.excludeVat !== false,
  });
  setPlatformRatio(form.platformRatio);
  resetTargets();
  applyDetailScope(detail);
  seedTargets(detail);
  fillCustomers(detail);
  if (Number(detail.discountType) === 2) ElMessage.warning(copy.value.fixedRetired);
  drawer.value = true;
  if (scope.categories) void loadCategoryTree();
  if (scope.services || scope.skus) void loadShelf();
  if (scope.packages) void searchPackages('');
}
function boundScope() {
  const categoryIds = scope.categories ? idList(form.categoryIds) : [];
  const spuIds = scope.services ? idList(form.spuIds) : [];
  const skuIds = scope.skus ? idList(form.skuIds) : [];
  const packageIds = scope.packages ? idList(form.packageIds) : [];
  if (scope.categories && !categoryIds.length) {
    ElMessage.error(copy.value.pickCategory);
    return null;
  }
  if (scope.services && !spuIds.length) {
    ElMessage.error(copy.value.pickService);
    return null;
  }
  if (scope.skus && !skuIds.length) {
    ElMessage.error(copy.value.pickSku);
    return null;
  }
  if (scope.packages && !packageIds.length) {
    ElMessage.error(copy.value.pickPackage);
    return null;
  }
  if ([categoryIds, spuIds, skuIds, packageIds].some((ids) => ids.length > 500)) {
    ElMessage.error(copy.value.tooMany);
    return null;
  }
  if (!scope.allServices && !scope.allPackages && !categoryIds.length && !spuIds.length && !skuIds.length && !packageIds.length) {
    ElMessage.error(copy.value.pickScope);
    return null;
  }
  return {
    allServices: scope.allServices,
    allPackages: scope.allPackages,
    categoryIds,
    spuIds,
    skuIds,
    packageIds,
  };
}
function optional(value: number | null | undefined) {
  return value == null || Number(value) <= 0 ? undefined : Number(value);
}
async function save() {
  const nameI18n: Record<string, string> = {};
  const couponName = form.name.trim();
  if (couponName) {
    nameI18n.zh = couponName;
    nameI18n.en = couponName;
  }
  const chosen = boundScope();
  if (!chosen) return;
  const payload: CouponSavePayload = {
    id: form.id,
    nameI18n,
    couponCode: form.couponCode.trim().toUpperCase(),
    allocationType: form.allocationType,
    customerScope: form.customerScope,
    allServices: chosen.allServices,
    allPackages: chosen.allPackages,
    validStart: form.validStart,
    validEnd: form.validEnd,
    status: form.live ? 2 : (form.status === 1 || form.status === 2 || form.status === 3 ? 3 : 0),
    discountType: form.discountType === 2 ? 1 : form.discountType,
    platformRatio: form.platformRatio,
    supplierRatio: form.supplierRatio,
    customerIds: form.customerScope === 4 ? form.customerIds : undefined,
    categoryIds: chosen.categoryIds,
    spuIds: chosen.spuIds,
    skuIds: chosen.skuIds,
    packageIds: chosen.packageIds,
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
.coupon-page :deep(.el-drawer .el-select),
.coupon-page :deep(.el-drawer .el-tree-select) { width: 100%; }
.scope-checks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 12px; width: 100%; }
.field-hint { display: block; margin-top: 6px; color: #6b7a90; font-size: 12px; line-height: 1.45; }
h3 { margin: 8px 0 12px; font-size: 15px; }
.tiers { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.tier { display: flex; gap: 8px; align-items: center; }
.mono :deep(input) { font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; }
@media (max-width: 900px) { .kpis, .grid, .grid.three, .scope-checks { grid-template-columns: 1fr; } }
</style>
