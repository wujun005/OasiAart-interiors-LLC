<template>
  <main class="campaign-page">
    <header class="campaign-page__head">
      <div>
        <p>MARKETING CENTER</p>
        <h1>{{ copy.title }}</h1>
      </div>
      <el-button v-if="canAction('btn:/admin/marketing/campaigns:create')" type="primary" @click="openCreate">
        {{ copy.create }}
      </el-button>
    </header>

    <p class="note">{{ copy.note }}</p>

    <section class="kpis">
      <article><span>{{ summary.liveTitle || copy.live }}</span><strong>{{ summary.liveCount ?? 0 }}</strong></article>
      <article><span>{{ summary.scheduledTitle || copy.scheduled }}</span><strong>{{ summary.scheduledCount ?? 0 }}</strong></article>
      <article><span>{{ summary.homeTitle || copy.home }}</span><strong>{{ summary.homeCount ?? 0 }}</strong></article>
      <article><span>{{ summary.quotaTitle || copy.usedQuota }}</span><strong>{{ summary.usedQuota ?? 0 }}</strong></article>
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
        <el-table-column :label="copy.campaign" min-width="220">
          <template #default="{ row }">
            <b>{{ text(row.nameI18n, row.name, '—') }}</b>
            <small>{{ text(row.targetScopeI18n, '', '') }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.offer" min-width="160">
          <template #default="{ row }">{{ offer(row) }}</template>
        </el-table-column>
        <el-table-column :label="copy.period" min-width="190">
          <template #default="{ row }">
            <div>{{ row.validStart || '—' }}</div>
            <small>{{ row.validEnd }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.spots" min-width="140">
          <template #default="{ row }">
            <div>{{ usage(row) }}</div>
            <div v-if="row.quota" class="bar"><i :style="{ width: `${usagePercent(row)}%` }" /></div>
          </template>
        </el-table-column>
        <el-table-column :label="copy.status" width="110">
          <template #default="{ row }">
            <span :class="statusClass(row.displayStatus)">{{ text(row.statusI18n, '', statusLabel(row.status)) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="copy.actions" width="210" align="right">
          <template #default="{ row }">
            <el-button v-if="canAction('btn:/admin/marketing/campaigns:edit')" link type="primary" @click="openEdit(row.id)">{{ copy.edit }}</el-button>
            <el-button v-if="canAction('btn:/admin/marketing/campaigns:status') && row.rowAction" link @click="toggle(row)">
              {{ actionLabel(row.rowAction) }}
            </el-button>
            <el-button v-if="canAction('btn:/admin/marketing/campaigns:end') && row.canEnd" link type="danger" @click="end(row)">
              {{ copy.end }}
            </el-button>
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

    <el-drawer v-model="drawer" :title="form.id ? copy.editTitle : copy.create" size="760px" :close-on-click-modal="false">
      <el-form label-position="top">
        <div class="grid">
          <el-form-item :label="copy.nameEn"><el-input v-model="form.nameEn" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.nameZh"><el-input v-model="form.nameZh" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.subtitleEn"><el-input v-model="form.subtitleEn" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.subtitleZh"><el-input v-model="form.subtitleZh" maxlength="128" /></el-form-item>
        </div>
        <h3>{{ copy.offer }}</h3>
        <div class="grid three">
          <el-form-item :label="copy.scope">
            <el-select v-model="form.targetScope">
              <el-option v-for="item in scopes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="copy.priceMode">
            <el-select v-model="form.priceMode">
              <el-option v-for="item in modes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.priceMode === 1" :label="copy.price">
            <el-input-number v-model="form.campaignPrice" :min="0.01" :precision="2" />
          </el-form-item>
          <el-form-item v-else :label="copy.percent">
            <el-input-number v-model="form.discountPercent" :min="0.01" :max="100" :precision="2" />
          </el-form-item>
          <el-form-item :label="copy.start">
            <el-date-picker v-model="form.validStart" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item :label="copy.endTime">
            <el-date-picker v-model="form.validEnd" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item :label="copy.status">
            <el-select v-model="form.status">
              <el-option v-for="item in statuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item v-if="form.targetScope === 2" :label="copy.categories">
          <el-select v-model="form.categoryIds" multiple filterable>
            <el-option v-for="item in categories" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 3 || form.targetScope === 4" :label="copy.services">
          <el-select v-model="form.spuIds" multiple filterable remote :remote-method="searchServices" :loading="serviceLoading" @change="loadSkus">
            <el-option v-for="item in services" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="needsHighlight" :label="copy.highlightService">
          <el-select v-model="highlightSpuId" filterable remote clearable :remote-method="searchServices" :loading="serviceLoading" @change="loadHighlightSkus">
            <el-option v-for="item in services" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 4" :label="copy.skus">
          <el-select v-model="form.skuIds" multiple filterable>
            <el-option v-for="item in skus" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 5" :label="copy.specs">
          <el-select v-model="form.specValueIds" multiple filterable remote :remote-method="searchSpecs" :loading="specLoading">
            <el-option v-for="item in specs" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="needsHighlight" :label="copy.highlight">
          <el-select v-model="form.highlightSkuId" filterable clearable>
            <el-option v-for="item in skus" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <h3>{{ copy.limits }}</h3>
        <div class="grid three">
          <el-form-item :label="copy.quota"><el-input-number v-model="form.quota" :min="1" /><small>{{ copy.blankUnlimited }}</small></el-form-item>
          <el-form-item :label="copy.perCustomer"><el-input-number v-model="form.perCustomerQuota" :min="1" /><small>{{ copy.blankUnlimited }}</small></el-form-item>
          <el-form-item :label="copy.sort"><el-input-number v-model="form.sortNo" :min="0" /></el-form-item>
        </div>
        <h3>{{ copy.display }}</h3>
        <div class="grid">
          <el-form-item :label="copy.badgeEn"><el-input v-model="form.badgeEn" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.badgeZh"><el-input v-model="form.badgeZh" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.cover"><el-input v-model="form.coverImage" maxlength="512" /></el-form-item>
        </div>
        <el-checkbox v-model="form.showOnHome">{{ copy.showHome }}</el-checkbox>
        <el-checkbox v-model="form.excludePackage">{{ copy.excludePackage }}</el-checkbox>
      </el-form>
      <template #footer>
        <el-button @click="drawer = false">{{ copy.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ copy.save }}</el-button>
      </template>
    </el-drawer>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPage as categoryPage } from '@/modules/admin/api/category';
import {
  campaignAdd,
  campaignDetail,
  campaignDisable,
  campaignEnable,
  campaignEnd,
  campaignPage,
  campaignUpdate,
  type CampaignSavePayload,
} from '@/modules/admin/api/campaign';
import { getSpecValuePage } from '@/modules/admin/api/spec';
import { page as servicePage, listBySpu } from '@/modules/admin/api/spu';
import { canAction } from '@/modules/admin/utils/menuPermission';

type Option = { id: number; label: string };
type CampaignRow = {
  id: number;
  name?: string;
  nameI18n?: Record<string, string>;
  targetScopeI18n?: Record<string, string>;
  priceMode?: number;
  campaignPrice?: number;
  discountPercent?: number;
  validStart?: string;
  validEnd?: string;
  quota?: number | null;
  usedCount?: number;
  status?: number;
  statusI18n?: Record<string, string>;
  displayStatus?: string;
  rowAction?: string;
  canEnd?: boolean;
};

const { locale } = useI18n();
const copy = computed(() => (locale.value.startsWith('zh') ? {
  title: '限时活动', create: '新建活动', note: '活动自动生效，顾客不需要输入券码。一笔订单只享受一次折扣；如果同时有优惠券，结算保留优惠更多的一个。套餐不参加活动。',
  live: '进行中的活动', scheduled: '已安排', home: '首页 Limited-time Deals', usedQuota: '已占用名额',
  search: '搜索活动名称', allStatus: '全部状态', searchAction: '查询', empty: '没有活动',
  campaign: '活动', offer: '优惠', period: '时间（迪拜）', spots: '名额', status: '状态', actions: '操作',
  edit: '编辑', editTitle: '编辑活动', end: '提前结束', nameEn: '英文名称', nameZh: '中文名称',
  subtitleEn: '英文副标题', subtitleZh: '中文副标题', scope: '适用范围', priceMode: '价格方式',
  price: '活动价 AED', percent: '折扣 %', start: '开始', endTime: '结束', categories: '服务分类',
  services: '服务', highlightService: '首页预订所属服务', skus: 'SKU', specs: '规格值', highlight: '首页预订 SKU', limits: '名额',
  quota: '总名额', perCustomer: '每位顾客名额', sort: '首页排序', blankUnlimited: '留空表示不限制',
  display: '展示', badgeEn: '角标英文', badgeZh: '角标中文', cover: '封面地址',
  showHome: '出现在首页 Limited-time Deals', excludePackage: '套餐不参加活动',
  cancel: '取消', save: '保存', saved: '活动已保存', failed: '保存失败，请检查填写内容',
  needName: '请至少填写一种语言的名称', needTime: '请填写开始和结束时间', needHighlight: '首页活动需要指定一个用于预订的 SKU',
  endAsk: '结束后新的下单不再使用这个活动。', ended: '活动已结束',
  enable: '启用', resume: '恢复', pause: '暂停', unlimited: '不限',
} : {
  title: 'Campaigns', create: 'New Campaign', note: 'Campaigns apply automatically, no code needed. One discount per order: if a customer also enters a coupon, checkout keeps whichever saves more. Packages are never in campaigns.',
  live: 'Live campaigns', scheduled: 'Scheduled', home: 'Homepage Limited-time Deals', usedQuota: 'Spots taken',
  search: 'Search campaign name', allStatus: 'All statuses', searchAction: 'Search', empty: 'No campaigns',
  campaign: 'Campaign', offer: 'Offer', period: 'Period (Dubai)', spots: 'Spots', status: 'Status', actions: 'Actions',
  edit: 'Edit', editTitle: 'Edit campaign', end: 'End early', nameEn: 'Name (English)', nameZh: 'Name (中文)',
  subtitleEn: 'Subtitle (English)', subtitleZh: 'Subtitle (中文)', scope: 'Applies to', priceMode: 'Offer',
  price: 'Campaign price AED', percent: 'Discount %', start: 'Start', endTime: 'End', categories: 'Categories',
  services: 'Services', highlightService: 'Service for the homepage SKU', skus: 'SKU', specs: 'Spec values', highlight: 'Homepage booking SKU', limits: 'Spots',
  quota: 'Total spots', perCustomer: 'Spots per customer', sort: 'Homepage order', blankUnlimited: 'Leave blank for no limit',
  display: 'Display', badgeEn: 'Tag (English)', badgeZh: 'Tag (中文)', cover: 'Cover image URL',
  showHome: 'Show on homepage Limited-time Deals', excludePackage: 'Packages are never in campaigns',
  cancel: 'Cancel', save: 'Save', saved: 'Campaign saved', failed: 'Could not save this campaign',
  needName: 'Enter the name in at least one language', needTime: 'Enter the start and end time', needHighlight: 'A homepage deal needs a SKU for Book Now',
  endAsk: 'New orders will stop using this campaign.', ended: 'Campaign ended',
  enable: 'Enable', resume: 'Resume', pause: 'Pause', unlimited: 'Unlimited',
}));

const statuses = computed(() => zhOptions([
  [0, '草稿', 'Draft'], [1, '已安排', 'Scheduled'], [2, '启用', 'Active'], [3, '暂停', 'Paused'], [4, '已结束', 'Ended'],
]));
const scopes = computed(() => zhOptions([
  [1, '全部服务', 'All services'], [2, '选定分类', 'Selected categories'], [3, '选定服务', 'Selected services'],
  [4, '指定 SKU', 'Selected SKUs'], [5, '指定规格值', 'Selected spec values'],
]));
const modes = computed(() => zhOptions([
  [1, '活动价', 'Campaign price'], [2, '折扣', 'Percent off'],
]));

function zhOptions(items: Array<[number, string, string]>) {
  return items.map(([value, labelZh, labelEn]) => ({ value, label: locale.value.startsWith('zh') ? labelZh : labelEn }));
}
function text(map: Record<string, string> | undefined, fallback: string | undefined, empty: string) {
  const language = String(locale.value || 'zh').split('-')[0];
  return map?.[language] || map?.zh || map?.en || fallback || empty;
}
function statusLabel(status?: number) {
  return statuses.value.find((item) => item.value === status)?.label || '—';
}
function statusClass(display?: string) {
  return ['tag', display === 'LIVE' ? 'on' : display === 'PAUSED' ? 'paused' : display === 'SCHEDULED' ? 'soon' : display === 'ENDED' ? 'ended' : 'draft'];
}
function actionLabel(action?: string) {
  if (action === 'PAUSE') return copy.value.pause;
  if (action === 'RESUME') return copy.value.resume;
  if (action === 'ENABLE') return copy.value.enable;
  return action || '';
}
function offer(row: CampaignRow) {
  if (Number(row.priceMode) === 1 && row.campaignPrice != null) return `AED ${Number(row.campaignPrice).toFixed(2)}`;
  if (row.discountPercent != null) return `${row.discountPercent}% off`;
  return '—';
}
function usage(row: CampaignRow) {
  const used = row.usedCount ?? 0;
  return row.quota ? `${used} / ${row.quota}` : `${used} · ${copy.value.unlimited}`;
}
function usagePercent(row: CampaignRow) {
  if (!row.quota) return 0;
  return Math.min(100, Math.round(((row.usedCount || 0) / row.quota) * 100));
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
function names(en: string, zh: string) {
  const map: Record<string, string> = {};
  if (en.trim()) map.en = en.trim();
  if (zh.trim()) map.zh = zh.trim();
  return map;
}
function optional(value: number | null | undefined) {
  return value == null || Number(value) <= 0 ? undefined : Number(value);
}
function blankForm() {
  return {
    id: undefined as number | undefined,
    nameEn: '', nameZh: '', subtitleEn: '', subtitleZh: '', badgeEn: '', badgeZh: '',
    targetScope: 3, priceMode: 2, discountPercent: 15 as number | null, campaignPrice: null as number | null,
    status: 0, quota: null as number | null, perCustomerQuota: 1 as number | null, sortNo: 0,
    validStart: '', validEnd: '', coverImage: '', showOnHome: true, excludePackage: true,
    categoryIds: [] as number[], spuIds: [] as number[], skuIds: [] as number[], specValueIds: [] as number[],
    highlightSkuId: undefined as number | undefined,
  };
}

const rows = ref<CampaignRow[]>([]);
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
const form = reactive(blankForm());
const categories = ref<Option[]>([]);
const services = ref<Option[]>([]);
const skus = ref<Option[]>([]);
const specs = ref<Option[]>([]);
const serviceLoading = ref(false);
const specLoading = ref(false);
const highlightSpuId = ref<number | undefined>();
const needsHighlight = computed(() => form.showOnHome && form.targetScope !== 3 && form.targetScope !== 4);

function remember(target: { value: Option[] }, items: Option[]) {
  const map = new Map(target.value.map((item) => [item.id, item]));
  items.forEach((item) => map.set(item.id, item));
  target.value = Array.from(map.values());
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const page = body<{ list?: CampaignRow[]; total?: number; summary?: Record<string, any> }>(await campaignPage({
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
async function loadCategories() {
  const records = listOf(await categoryPage({ pageNum: 1, pageSize: 200, level: '1' }));
  categories.value = records.flatMap((item: any) => {
    const id = optionId(item.category?.id ?? item.id);
    if (!id) return [];
    return [{ id, label: text(item.nameI18n, item.category?.name || item.name, String(id)) }];
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
async function loadSkus() {
  const selected = skus.value.filter((item) => form.skuIds.includes(item.id) || item.id === form.highlightSkuId);
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
  skus.value = selected;
  remember(skus, lists.flat());
}
async function loadHighlightSkus() {
  if (!highlightSpuId.value) return;
  const selected = skus.value.filter((item) => item.id === form.highlightSkuId);
  const data = body<{ specTypes?: any[]; skus?: any[] }>(await listBySpu(highlightSpuId.value));
  const specTypes = Array.isArray(data.specTypes) ? data.specTypes : [];
  const loaded = (Array.isArray(data.skus) ? data.skus : []).flatMap((sku) => {
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
  skus.value = selected;
  remember(skus, loaded);
}
async function searchSpecs(query: string) {
  specLoading.value = true;
  try {
    const records = listOf(await getSpecValuePage({ pageNum: 1, pageSize: 20, nameKeyword: query.trim() || undefined }));
    remember(specs, records.flatMap((item: any) => {
      const id = optionId(item.specValue?.id ?? item.id);
      if (!id) return [];
      const name = text(item.nameI18n || item.specValue?.nameI18n, item.specValue?.specValue || item.name, String(id));
      return [{ id, label: name }];
    }));
  } finally {
    specLoading.value = false;
  }
}
function openCreate() {
  Object.assign(form, blankForm());
  highlightSpuId.value = undefined;
  drawer.value = true;
  loadCategories();
}
async function openEdit(id: number) {
  const detail = body<Record<string, any>>(await campaignDetail(id));
  Object.assign(form, blankForm(), {
    id: detail.id,
    nameEn: detail.nameI18n?.en || '',
    nameZh: detail.nameI18n?.zh || '',
    subtitleEn: detail.subtitleI18n?.en || '',
    subtitleZh: detail.subtitleI18n?.zh || '',
    badgeEn: detail.badgeI18n?.en || '',
    badgeZh: detail.badgeI18n?.zh || '',
    targetScope: Number(detail.targetScope || 1),
    priceMode: Number(detail.priceMode || 2),
    discountPercent: detail.discountPercent ?? null,
    campaignPrice: detail.campaignPrice ?? null,
    status: Number(detail.status || 0),
    quota: detail.quota ?? null,
    perCustomerQuota: detail.perCustomerQuota ?? null,
    sortNo: Number(detail.sortNo || 0),
    validStart: detail.validStart || '',
    validEnd: detail.validEnd || '',
    coverImage: detail.coverImage || '',
    showOnHome: detail.showOnHome !== false,
    excludePackage: detail.excludePackage !== false,
    categoryIds: detail.categoryIds || [],
    spuIds: detail.spuIds || [],
    skuIds: detail.skuIds || [],
    specValueIds: detail.specValueIds || [],
    highlightSkuId: detail.highlightSkuId || undefined,
  });
  highlightSpuId.value = undefined;
  if (form.highlightSkuId) remember(skus, [{ id: form.highlightSkuId, label: String(form.highlightSkuId) }]);
  if (form.specValueIds.length) remember(specs, form.specValueIds.map((specId) => ({ id: specId, label: String(specId) })));
  drawer.value = true;
  await Promise.all([loadCategories(), form.spuIds.length ? loadSkus() : Promise.resolve()]);
}
async function save() {
  const nameI18n = names(form.nameEn, form.nameZh);
  if (!Object.keys(nameI18n).length) {
    ElMessage.warning(copy.value.needName);
    return;
  }
  if (!form.validStart || !form.validEnd) {
    ElMessage.warning(copy.value.needTime);
    return;
  }
  const highlightSkuId = !form.showOnHome
    ? undefined
    : form.targetScope === 4
      ? form.highlightSkuId || form.skuIds[0]
      : needsHighlight.value ? form.highlightSkuId : undefined;
  if (needsHighlight.value && !highlightSkuId) {
    ElMessage.warning(copy.value.needHighlight);
    return;
  }
  const subtitleI18n = names(form.subtitleEn, form.subtitleZh);
  const badgeI18n = names(form.badgeEn, form.badgeZh);
  const payload: CampaignSavePayload = {
    id: form.id,
    nameI18n,
    subtitleI18n: Object.keys(subtitleI18n).length ? subtitleI18n : undefined,
    targetScope: form.targetScope,
    priceMode: form.priceMode,
    validStart: form.validStart,
    validEnd: form.validEnd,
    status: form.status,
    quota: optional(form.quota),
    showOnHome: form.showOnHome,
    sortNo: Number(form.sortNo || 0),
    categoryIds: form.targetScope === 2 ? form.categoryIds : undefined,
    spuIds: form.targetScope === 3 ? form.spuIds : undefined,
    skuIds: form.targetScope === 4 ? form.skuIds : undefined,
    specValueIds: form.targetScope === 5 ? form.specValueIds : undefined,
    highlightSkuId,
    campaignPrice: form.priceMode === 1 ? form.campaignPrice ?? undefined : undefined,
    discountPercent: form.priceMode === 2 ? form.discountPercent ?? undefined : undefined,
    perCustomerQuota: optional(form.perCustomerQuota),
    coverImage: form.coverImage.trim() || undefined,
    badgeI18n: Object.keys(badgeI18n).length ? badgeI18n : undefined,
    excludePackage: form.excludePackage,
  };
  saving.value = true;
  try {
    if (form.id) await campaignUpdate(payload);
    else await campaignAdd(payload);
    ElMessage.success(copy.value.saved);
    drawer.value = false;
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  } finally {
    saving.value = false;
  }
}
async function toggle(row: CampaignRow) {
  try {
    if (row.rowAction === 'PAUSE') await campaignDisable(row.id);
    else await campaignEnable(row.id);
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  }
}
async function end(row: CampaignRow) {
  try {
    await ElMessageBox.confirm(copy.value.endAsk, copy.value.end, { type: 'warning' });
    await campaignEnd(row.id);
    ElMessage.success(copy.value.ended);
    await load();
  } catch (reason: any) {
    if (reason === 'cancel' || reason === 'close') return;
    ElMessage.error(reason?.message || copy.value.failed);
  }
}
onMounted(load);
</script>

<style scoped>
.campaign-page { display: flex; flex-direction: column; gap: 16px; padding: 20px 24px 40px; }
.campaign-page__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.campaign-page__head p { margin: 0; color: #0a7a6a; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; }
.campaign-page__head h1 { margin: 4px 0 0; font-size: 26px; }
.note { margin: 0; padding: 12px 16px; color: #234; background: #f4f7fb; border-radius: 12px; }
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.kpis article, .board { background: #fff; border: 1px solid #e3eaf2; border-radius: 16px; }
.kpis article { padding: 16px 18px; }
.kpis span, .board small, .campaign-page small { color: #6b7a90; }
.kpis strong { display: block; margin-top: 4px; font-size: 24px; }
.board { padding: 16px; }
.filters { display: flex; gap: 10px; margin-bottom: 12px; }
.filters .el-input { width: 260px; }
.bar { height: 6px; margin: 6px 0; background: #eef2f7; border-radius: 6px; overflow: hidden; }
.bar i { display: block; height: 100%; background: #102a48; }
.tag { border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; background: #eef2f7; }
.tag.on { color: #0a7a6a; background: #e8faf7; }
.tag.paused { color: #b54708; background: #fff4e5; }
.tag.soon { color: #2d5bd3; background: #eef3ff; }
.tag.ended { color: #667085; background: #f2f4f7; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.grid.three { grid-template-columns: 1fr 1fr 1fr; }
.grid :deep(.el-select), .grid :deep(.el-input-number), .grid :deep(.el-date-editor) { width: 100%; }
h3 { margin: 8px 0 12px; font-size: 15px; }
b, small { display: block; }
@media (max-width: 900px) { .kpis, .grid, .grid.three { grid-template-columns: 1fr; } }
</style>
