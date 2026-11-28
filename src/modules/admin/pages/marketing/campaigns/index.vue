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
            <span :class="statusClass(row.displayStatus)">{{ statusLabel(row.status) }}</span>
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
          <el-form-item :label="copy.name"><el-input v-model="form.name" maxlength="128" /></el-form-item>
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
            <el-radio-group v-model="form.live">
              <el-radio :value="true">{{ copy.liveChoice }}</el-radio>
              <el-radio :value="false">{{ copy.offChoice }}</el-radio>
            </el-radio-group>
            <small v-if="form.status === 4" class="field-hint">{{ copy.endedHint }}</small>
          </el-form-item>
        </div>
        <el-form-item v-if="form.targetScope === 2" :label="copy.categories">
          <el-select v-model="form.categoryIds" multiple filterable>
            <el-option v-for="item in categories" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 3 || form.targetScope === 4" :label="copy.services">
          <el-select v-model="form.spuIds" multiple filterable remote :remote-method="searchServices" :loading="serviceLoading" @change="onServicesChange">
            <el-option v-for="item in services" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="needsHighlight" :label="copy.highlightService">
          <el-select v-model="highlightSpuId" filterable remote clearable :remote-method="searchServices" :loading="serviceLoading" @change="onHighlightServiceChange">
            <el-option v-for="item in services" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 4" :label="copy.skus">
          <el-select v-model="form.skuIds" multiple filterable remote :remote-method="searchSkus" :loading="skuLoading" :placeholder="copy.skuPlaceholder">
            <el-option v-for="item in skus" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <small class="field-hint">{{ copy.skuHint }}</small>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 5" :label="copy.specs">
          <el-select v-model="form.specValueIds" multiple filterable remote :remote-method="searchSpecs" :loading="specLoading">
            <el-option v-for="item in specs" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.targetScope === 7" :label="copy.packages">
          <el-select v-model="form.packageIds" multiple filterable remote :remote-method="searchPackages" :loading="packageLoading" :placeholder="copy.packagePlaceholder">
            <el-option v-for="item in packages" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <small class="field-hint">{{ copy.packageHint }}</small>
        </el-form-item>
        <small v-if="packageScope" class="field-hint">{{ copy.packageScopeHint }}</small>
        <el-form-item v-if="needsHighlight" :label="copy.highlight">
          <el-select v-model="form.highlightSkuId" filterable remote clearable :remote-method="searchHighlightSkus" :loading="skuLoading" :placeholder="copy.skuPlaceholder">
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
        </div>
        <el-form-item :label="copy.cover">
          <div class="cover-upload">
            <img v-if="coverIsImage(form.coverImage)" :src="form.coverImage" alt="" />
            <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadCover">
              <el-button>{{ form.coverImage ? copy.replaceImage : copy.uploadImage }}</el-button>
            </el-upload>
            <el-button v-if="form.coverImage" link type="danger" @click="form.coverImage = ''">{{ copy.removeImage }}</el-button>
          </div>
          <small class="field-hint">{{ copy.coverHint }}</small>
          <small v-if="form.coverImage && !coverIsImage(form.coverImage)" class="field-hint cover-warn">{{ copy.coverNotImage }}</small>
        </el-form-item>
        <el-checkbox v-if="!packageScope" v-model="form.showOnHome">{{ copy.showHome }}</el-checkbox>
        <el-checkbox v-if="!packageScope" v-model="form.excludePackage">{{ copy.excludePackage }}</el-checkbox>
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
import type { UploadRequestOptions } from 'element-plus';
import { getPage as categoryPage, upload } from '@/modules/admin/api/category';
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
import { getPackagePage } from '@/modules/admin/api/package';
import { getSpecValuePage } from '@/modules/admin/api/spec';
import { fuzzySearchServices, listBySpu, onShelfOptions } from '@/modules/admin/api/spu';
import { canAction } from '@/modules/admin/utils/menuPermission';

type Option = { id: number; label: string; productId?: number };
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
  title: '限时活动', create: '新建活动', note: '活动自动生效，顾客不需要输入券码。服务和套餐分开设置。一笔订单只保留优惠更多的一个。套餐活动显示在套餐页，不进首页限时卡片。',
  live: '进行中的活动', scheduled: '已安排', home: '首页 Limited-time Deals', usedQuota: '已占用名额',
  search: '搜索活动名称', allStatus: '全部状态', searchAction: '查询', empty: '没有活动',
  campaign: '活动', offer: '优惠', period: '时间（迪拜）', spots: '名额', status: '状态', actions: '操作',
  edit: '编辑', editTitle: '编辑活动', end: '提前结束', name: '活动名称', liveChoice: '上线', offChoice: '关闭',
  endedHint: '这个活动已经结束。选上线会重新打开，选关闭则保持结束。',
  subtitleEn: '英文副标题', subtitleZh: '中文副标题', scope: '适用范围', priceMode: '价格方式',
  price: '活动价 AED', percent: '折扣 %', start: '开始', endTime: '结束', categories: '服务分类',
  services: '服务', highlightService: '首页预订所属服务', skus: '预约选项', skuPlaceholder: '选择预约选项',
  skuHint: '选中服务后，这里列出该服务的全部预约选项。显示规格值，不显示商品编码。',
  specs: '规格值', packages: '套餐', packagePlaceholder: '选择上架套餐',
  packageHint: '只显示已上架套餐。折扣按套餐应付价计算。',
  packageScopeHint: '套餐折扣在套餐详情和套餐下单时生效，不会出现在首页限时卡片。',
  highlight: '首页预订选项', limits: '名额',
  quota: '总名额', perCustomer: '每位顾客名额', sort: '首页排序', blankUnlimited: '留空表示不限制',
  display: '展示', badgeEn: '角标英文', badgeZh: '角标中文', cover: '封面图片',
  uploadImage: '上传图片', replaceImage: '更换图片', removeImage: '移除',
  coverHint: '这张图显示在首页限时优惠卡片上。请上传图片，不要粘贴服务页面链接。',
  coverNotImage: '当前内容不是图片，卡片上不会显示。请重新上传一张图片。',
  showHome: '出现在首页 Limited-time Deals', excludePackage: '套餐不参加活动',
  cancel: '取消', save: '保存', saved: '活动已保存', failed: '保存失败，请检查填写内容',
  needName: '请填写活动名称', needTime: '请填写开始和结束时间', needHighlight: '首页活动需要指定一个用于预订的 SKU',
  needPackage: '请选择套餐',
  endAsk: '结束后新的下单不再使用这个活动。', ended: '活动已结束',
  enable: '启用', resume: '恢复', pause: '暂停', unlimited: '不限',
} : {
  title: 'Campaigns', create: 'New Campaign', note: 'Campaigns apply automatically, no code needed. Service and package offers are set separately. One order keeps whichever discount saves more. Package offers show on the package page, not on the homepage deal cards.',
  live: 'Live campaigns', scheduled: 'Scheduled', home: 'Homepage Limited-time Deals', usedQuota: 'Spots taken',
  search: 'Search campaign name', allStatus: 'All statuses', searchAction: 'Search', empty: 'No campaigns',
  campaign: 'Campaign', offer: 'Offer', period: 'Period (Dubai)', spots: 'Spots', status: 'Status', actions: 'Actions',
  edit: 'Edit', editTitle: 'Edit campaign', end: 'End early', name: 'Campaign name', liveChoice: 'Live', offChoice: 'Off',
  endedHint: 'This campaign has ended. Live opens it again. Off leaves it ended.',
  subtitleEn: 'Subtitle (English)', subtitleZh: 'Subtitle (中文)', scope: 'Applies to', priceMode: 'Offer',
  price: 'Campaign price AED', percent: 'Discount %', start: 'Start', endTime: 'End', categories: 'Categories',
  services: 'Services', highlightService: 'Service for the homepage option', skus: 'Booking options', skuPlaceholder: 'Choose a booking option',
  skuHint: 'After a service is selected, every booking option for that service is listed. Spec names are shown, product codes are hidden.',
  specs: 'Spec values', packages: 'Packages', packagePlaceholder: 'Choose listed packages',
  packageHint: 'Only listed packages are shown. The discount is taken from the package price.',
  packageScopeHint: 'Package discounts apply on the package page and at package checkout. They do not appear on the homepage deal cards.',
  highlight: 'Homepage booking option', limits: 'Spots',
  quota: 'Total spots', perCustomer: 'Spots per customer', sort: 'Homepage order', blankUnlimited: 'Leave blank for no limit',
  display: 'Display', badgeEn: 'Tag (English)', badgeZh: 'Tag (中文)', cover: 'Cover image',
  uploadImage: 'Upload image', replaceImage: 'Replace image', removeImage: 'Remove',
  coverHint: 'This image is shown on the homepage limited-time card. Upload an image. A service page link will not display.',
  coverNotImage: 'This is not an image, so the card cannot show it. Upload an image.',
  showHome: 'Show on homepage Limited-time Deals', excludePackage: 'Packages are never in campaigns',
  cancel: 'Cancel', save: 'Save', saved: 'Campaign saved', failed: 'Could not save this campaign',
  needName: 'Enter the campaign name', needTime: 'Enter the start and end time', needHighlight: 'A homepage deal needs a SKU for Book Now',
  needPackage: 'Select a package',
  endAsk: 'New orders will stop using this campaign.', ended: 'Campaign ended',
  enable: 'Enable', resume: 'Resume', pause: 'Pause', unlimited: 'Unlimited',
}));

const statuses = computed(() => zhOptions([
  [2, '上线', 'Live'], [3, '关闭', 'Off'], [4, '已结束', 'Ended'],
]));
const scopes = computed(() => zhOptions([
  [1, '全部服务', 'All services'], [2, '选定分类', 'Selected categories'], [3, '选定服务', 'Selected services'],
  [4, '指定 SKU', 'Selected SKUs'], [5, '指定规格值', 'Selected spec values'],
  [6, '全部套餐', 'All packages'], [7, '指定套餐', 'Selected packages'],
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
  const zh = locale.value.startsWith('zh');
  if (status === 1 || status === 2) return zh ? '上线' : 'Live';
  if (status === 4) return zh ? '已结束' : 'Ended';
  return zh ? '关闭' : 'Off';
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
function sameName(value: string) {
  const name = value.trim();
  return name ? { zh: name, en: name } : {};
}
function optional(value: number | null | undefined) {
  return value == null || Number(value) <= 0 ? undefined : Number(value);
}
function blankForm() {
  return {
    id: undefined as number | undefined,
    name: '', subtitleEn: '', subtitleZh: '', badgeEn: '', badgeZh: '',
    targetScope: 3, priceMode: 2, discountPercent: 15 as number | null, campaignPrice: null as number | null,
    live: true, status: 0, quota: null as number | null, perCustomerQuota: 1 as number | null, sortNo: 0,
    validStart: '', validEnd: '', coverImage: '', showOnHome: true, excludePackage: true,
    categoryIds: [] as number[], spuIds: [] as number[], skuIds: [] as number[], specValueIds: [] as number[],
    packageIds: [] as number[],
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
const packages = ref<Option[]>([]);
const packageLoading = ref(false);
let packageQuery = 0;
const services = ref<Option[]>([]);
const skus = ref<Option[]>([]);
const specs = ref<Option[]>([]);
const serviceLoading = ref(false);
const skuLoading = ref(false);
const specLoading = ref(false);
const highlightSpuId = ref<number | undefined>();
const packageScope = computed(() => form.targetScope === 6 || form.targetScope === 7);
const needsHighlight = computed(() => form.showOnHome && !packageScope.value && form.targetScope !== 3 && form.targetScope !== 4);
type ShelfSku = { id: number; label: string };
type ShelfService = { id: number; label: string; skus: ShelfSku[] };
const shelf = ref<ShelfService[] | null>(null);
const trustedCover = ref('');
let shelfRequest: Promise<ShelfService[]> | null = null;

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
function resultList(payload: unknown) {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const data = Array.isArray(payload) ? payload : root.data;
  return Array.isArray(data) ? data : [];
}
function selectedServices() {
  const ids = new Set([...form.spuIds, ...(highlightSpuId.value ? [highlightSpuId.value] : [])]);
  return services.value.filter((item) => ids.has(item.id));
}
function coverIsImage(value: string) {
  const url = value.trim();
  if (!url) return false;
  if (trustedCover.value && trustedCover.value === url) return true;
  if (/\/(services|packages|campaigns|admin)(\/|$)/i.test(url)) return false;
  return /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?|#|$)/i.test(url);
}
function uploadCover(options: UploadRequestOptions) {
  const file = options.file as File;
  const data = new FormData();
  data.append('file', file);
  upload(data).then((result: any) => {
    const url = result?.data?.url || result?.data || result?.url;
    if (!url || typeof url !== 'string') throw new Error(copy.value.failed);
    form.coverImage = url;
    trustedCover.value = url;
    options.onSuccess?.({ url });
  }).catch((reason: any) => {
    ElMessage.error(reason?.message || copy.value.failed);
    options.onError?.(reason);
  });
}
async function ensureShelf() {
  if (shelf.value) return shelf.value;
  if (!shelfRequest) {
    shelfRequest = onShelfOptions().then((payload) => {
      const parsed = resultList(payload).flatMap((item: any) => {
        const id = optionId(item?.id);
        if (!id) return [];
        const skus = (Array.isArray(item?.skus) ? item.skus : []).flatMap((sku: any) => {
          const skuId = optionId(sku?.id);
          const label = text(sku?.nameI18n, sku?.name, '').trim();
          if (!skuId || !label) return [];
          return [{ id: skuId, label }];
        });
        return [{ id, label: text(item?.nameI18n, item?.name, String(id)), skus }];
      });
      shelf.value = parsed;
      return parsed;
    }).catch((reason) => {
      shelfRequest = null;
      throw reason;
    });
  }
  return shelfRequest;
}
async function skusForProduct(productId: number) {
  const catalog = (shelf.value || []).find((item) => item.id === productId);
  if (catalog) return catalog.skus;
  const detail = body<{ skus?: any[] }>(await listBySpu(productId));
  const rows = Array.isArray(detail?.skus) ? detail.skus : [];
  return rows.flatMap((sku: any) => {
    const id = optionId(sku?.skuId ?? sku?.id);
    const label = text(sku?.nameI18n, sku?.name, '').trim();
    if (!id || !label) return [];
    return [{ id, label }];
  });
}
async function bookingOptions(productIds: number[], prefixService: boolean) {
  const choices: Option[] = [];
  for (const productId of productIds) {
    const serviceName = services.value.find((item) => item.id === productId)?.label
      || shelf.value?.find((item) => item.id === productId)?.label
      || '';
    const rows = await skusForProduct(productId);
    rows.forEach((sku) => {
      const prefix = prefixService && productIds.length > 1 && serviceName ? `${serviceName} · ` : '';
      choices.push({ id: sku.id, productId, label: `${prefix}${sku.label}` });
    });
  }
  return choices;
}
function matchesKeyword(label: string, keyword: string) {
  return !keyword || label.toLowerCase().includes(keyword.toLowerCase());
}
async function searchServices(query: string) {
  const keyword = query.trim();
  const selected = selectedServices();
  if (!keyword) {
    services.value = selected;
    return;
  }
  serviceLoading.value = true;
  try {
    const records = resultList(await fuzzySearchServices({ nameKeyword: keyword, packageService: 0 }));
    services.value = selected;
    remember(services, records.flatMap((item: any) => {
      const id = optionId(item.id);
      if (!id) return [];
      return [{ id, label: text(item.nameI18n, item.name, String(id)) }];
    }));
  } finally {
    serviceLoading.value = false;
  }
}
function keptSkus() {
  return skus.value.filter((item) => form.skuIds.includes(item.id) || item.id === form.highlightSkuId);
}
function onServicesChange() {
  const allowed = new Set(form.spuIds);
  form.skuIds = form.skuIds.filter((id) => {
    const item = skus.value.find((sku) => sku.id === id);
    return !item?.productId || allowed.has(item.productId);
  });
  skus.value = keptSkus();
  void searchSkus('');
}
function onHighlightServiceChange() {
  const current = skus.value.find((item) => item.id === form.highlightSkuId);
  if (current?.productId && current.productId !== highlightSpuId.value) form.highlightSkuId = undefined;
  skus.value = keptSkus();
  void searchHighlightSkus('');
}
async function searchSkus(query: string) {
  const keyword = query.trim();
  const selected = keptSkus();
  if (!form.spuIds.length) {
    skus.value = selected;
    return;
  }
  skuLoading.value = true;
  try {
    await ensureShelf();
    const loaded = (await bookingOptions(form.spuIds, true)).filter((item) => matchesKeyword(item.label, keyword));
    skus.value = selected;
    remember(skus, loaded);
  } finally {
    skuLoading.value = false;
  }
}
async function searchHighlightSkus(query: string) {
  const keyword = query.trim();
  const selected = keptSkus();
  if (!highlightSpuId.value) {
    skus.value = selected;
    return;
  }
  skuLoading.value = true;
  try {
    await ensureShelf();
    const loaded = (await bookingOptions([highlightSpuId.value], false)).filter((item) => matchesKeyword(item.label, keyword));
    skus.value = selected;
    remember(skus, loaded);
  } finally {
    skuLoading.value = false;
  }
}
async function hydrateSelections() {
  try {
    await ensureShelf();
  } catch {
    // 上架目录暂时不可用时，仍保留详情里已经带回的规格名。
  }
  const catalog = shelf.value || [];
  remember(services, catalog.flatMap((item) => (form.spuIds.includes(item.id) ? [{ id: item.id, label: item.label }] : [])));
  const known = (Array.isArray(skus.value) ? skus.value : []).find((item) => item.id === form.highlightSkuId);
  const ownerId = known?.productId || catalog.find((item) => item.skus.some((sku) => sku.id === form.highlightSkuId))?.id;
  if (ownerId) {
    highlightSpuId.value = ownerId;
    const owner = catalog.find((item) => item.id === ownerId) || services.value.find((item) => item.id === ownerId);
    if (owner) remember(services, [{ id: owner.id, label: owner.label }]);
  }
  try {
    if (form.targetScope === 4 && form.spuIds.length) await searchSkus('');
    else if (needsHighlight.value && highlightSpuId.value) await searchHighlightSkus('');
  } catch {
    // 选项列表加载失败时，已经解析出的服务名和规格名仍然保留。
  }
}
async function searchPackages(query: string) {
  const ticket = ++packageQuery;
  packageLoading.value = true;
  try {
    const records = listOf(await getPackagePage({
      pageNum: 1,
      pageSize: query.trim() ? 50 : 100,
      status: 1,
      nameKeyword: query.trim() || undefined,
    }));
    if (ticket !== packageQuery) return;
    const selected = packages.value.filter((item) => form.packageIds.includes(item.id));
    const next = records.flatMap((item: any) => {
      const id = optionId(item.id);
      if (!id) return [];
      return [{ id, label: text(item.nameI18n, item.packageName, String(id)) }];
    });
    packages.value = [...selected, ...next.filter((item) => !selected.some((kept) => kept.id === item.id))];
  } finally {
    if (ticket === packageQuery) packageLoading.value = false;
  }
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
  trustedCover.value = '';
  services.value = [];
  skus.value = [];
  drawer.value = true;
  loadCategories();
}
async function openEdit(id: number) {
  const detail = body<Record<string, any>>(await campaignDetail(id));
  Object.assign(form, blankForm(), {
    id: detail.id,
    name: detail.nameI18n?.zh || detail.nameI18n?.en || detail.name || '',
    subtitleEn: detail.subtitleI18n?.en || '',
    subtitleZh: detail.subtitleI18n?.zh || '',
    badgeEn: detail.badgeI18n?.en || '',
    badgeZh: detail.badgeI18n?.zh || '',
    targetScope: Number(detail.targetScope || 1),
    priceMode: Number(detail.priceMode || 2),
    discountPercent: detail.discountPercent ?? null,
    campaignPrice: detail.campaignPrice ?? null,
    status: Number(detail.status || 0),
    live: Number(detail.status) === 1 || Number(detail.status) === 2,
    quota: detail.quota ?? null,
    perCustomerQuota: detail.perCustomerQuota ?? null,
    sortNo: Number(detail.sortNo || 0),
    validStart: detail.validStart || '',
    validEnd: detail.validEnd || '',
    coverImage: detail.coverImage || '',
    showOnHome: detail.showOnHome !== false,
    excludePackage: detail.excludePackage !== false,
    categoryIds: (Array.isArray(detail.categoryIds) ? detail.categoryIds : []).map(optionId).filter(Boolean),
    spuIds: (Array.isArray(detail.spuIds) ? detail.spuIds : []).map(optionId).filter(Boolean),
    skuIds: (Array.isArray(detail.skuIds) ? detail.skuIds : []).map(optionId).filter(Boolean),
    specValueIds: (Array.isArray(detail.specValueIds) ? detail.specValueIds : []).map(optionId).filter(Boolean),
    packageIds: (Array.isArray(detail.packageIds) ? detail.packageIds : []).map(optionId).filter(Boolean),
    highlightSkuId: optionId(detail.highlightSkuId) || undefined,
  });
  highlightSpuId.value = undefined;
  trustedCover.value = '';
  services.value = [];
  if (form.targetScope === 4 && !form.spuIds.length) {
    const parents = new Set<number>();
    (Array.isArray(detail.skuItems) ? detail.skuItems : []).forEach((item: any) => {
      const productId = optionId(item?.productId);
      if (productId) parents.add(productId);
    });
    form.spuIds = Array.from(parents);
  }
  remember(services, form.spuIds.map((id) => ({ id, label: String(id) })));
  skus.value = (Array.isArray(detail.skuItems) ? detail.skuItems : []).flatMap((item: any) => {
    const id = optionId(item.id);
    const label = text(item.nameI18n, item.name, '').trim();
    const productId = optionId(item.productId) || undefined;
    if (!id) return [];
    return [{ id, productId, label: label || String(id) }];
  });
  const highlightItem = (Array.isArray(detail.skuItems) ? detail.skuItems : []).find((item: any) => optionId(item?.id) === form.highlightSkuId);
  const highlightProductId = optionId(highlightItem?.productId);
  if (highlightProductId) highlightSpuId.value = highlightProductId;
  if (form.specValueIds.length) remember(specs, form.specValueIds.map((specId) => ({ id: specId, label: String(specId) })));
  if (form.packageIds.length) {
    packages.value = form.packageIds.map((id) => ({ id, label: String(id) }));
    void searchPackages('');
  }
  await hydrateSelections();
  drawer.value = true;
  await loadCategories();
}
async function save() {
  const nameI18n = sameName(form.name);
  if (!Object.keys(nameI18n).length) {
    ElMessage.warning(copy.value.needName);
    return;
  }
  if (!form.validStart || !form.validEnd) {
    ElMessage.warning(copy.value.needTime);
    return;
  }
  if (form.coverImage.trim() && !coverIsImage(form.coverImage)) {
    ElMessage.warning(copy.value.coverNotImage);
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
  if (form.targetScope === 7 && !form.packageIds.length) {
    ElMessage.warning(copy.value.needPackage);
    return;
  }
  const packageOffer = packageScope.value;
  const status = form.live
    ? 2
    : form.status === 4
      ? 4
      : (form.status === 1 || form.status === 2 || form.status === 3 ? 3 : 0);
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
    status,
    quota: optional(form.quota),
    showOnHome: packageOffer ? false : form.showOnHome,
    sortNo: Number(form.sortNo || 0),
    categoryIds: form.targetScope === 2 ? form.categoryIds : undefined,
    spuIds: form.targetScope === 3 || form.targetScope === 4 ? form.spuIds : undefined,
    skuIds: form.targetScope === 4 ? form.skuIds : undefined,
    specValueIds: form.targetScope === 5 ? form.specValueIds : undefined,
    packageIds: form.targetScope === 7 ? form.packageIds : undefined,
    highlightSkuId,
    campaignPrice: form.priceMode === 1 ? form.campaignPrice ?? undefined : undefined,
    discountPercent: form.priceMode === 2 ? form.discountPercent ?? undefined : undefined,
    perCustomerQuota: optional(form.perCustomerQuota),
    coverImage: form.coverImage.trim() || undefined,
    badgeI18n: Object.keys(badgeI18n).length ? badgeI18n : undefined,
    excludePackage: packageOffer ? false : form.excludePackage,
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
.field-hint { display: block; margin-top: 4px; color: var(--el-text-color-secondary); line-height: 1.4; }
.cover-upload { display: flex; align-items: center; gap: 12px; }
.cover-upload img { width: 96px; height: 64px; object-fit: cover; border-radius: 8px; background: #f4f7fb; }
.cover-warn { color: #b54708; }
h3 { margin: 8px 0 12px; font-size: 15px; }
b, small { display: block; }
@media (max-width: 900px) { .kpis, .grid, .grid.three { grid-template-columns: 1fr; } }
</style>
