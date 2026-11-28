<template>
  <main class="promo-page">
    <header class="promo-page__head">
      <div>
        <p>MARKETING CENTER</p>
        <h1>{{ copy.title }}</h1>
      </div>
      <el-button v-if="canCreate" type="primary" @click="openCreate">{{ copy.create }}</el-button>
    </header>
    <p class="lead">{{ copy.lead }}</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />

    <section v-loading="loading" class="slides">
      <article v-for="(row, index) in slides" :key="row.id" class="slide">
        <div class="pair">
          <div class="pair__item">
            <span>{{ copy.pc }} <em v-if="row.showOnPc === false">{{ copy.hidden }}</em></span>
            <div class="pc-hero" :class="{ off: row.showOnPc === false }" :style="heroStyle(row.pcImageUrl || row.mobileImageUrl)">
              <div class="pc-hero__copy">
                <small>{{ text(row.eyebrowI18n, '') }}</small>
                <b><span>{{ text(row.titleI18n, row.title || copy.untitled) }}</span><em v-if="text(row.titleLine2I18n, '')">{{ text(row.titleLine2I18n, '') }}</em></b>
                <span>{{ text(row.subtitleI18n, '') }}</span>
                <div class="hero-actions"><strong v-if="text(row.badgeI18n, '')">{{ text(row.badgeI18n, '') }}</strong><i>{{ text(row.buttonI18n, copy.button) }}</i></div>
              </div>
            </div>
          </div>
          <div class="pair__item">
            <span>{{ copy.h5 }} <em v-if="row.showOnMobile === false">{{ copy.hidden }}</em></span>
            <div class="phone" :class="{ off: row.showOnMobile === false }">
              <div class="h5-hero__image" :style="photoStyle(row.mobileImageUrl || row.pcImageUrl)" />
              <div class="h5-hero__copy">
                <small>{{ text(row.eyebrowI18n, '') }}</small>
                <b><span>{{ text(row.titleI18n, row.title || copy.untitled) }}</span><em v-if="text(row.titleLine2I18n, '')">{{ text(row.titleLine2I18n, '') }}</em></b>
                <span>{{ text(row.subtitleI18n, '') }}</span>
                <div class="hero-actions"><strong v-if="text(row.badgeI18n, '')">{{ text(row.badgeI18n, '') }}</strong><i>{{ text(row.buttonI18n, copy.button) }}</i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="slide__meta">
          <div>
            <b>{{ slideName(index) }}</b>
            <span :class="statusClass(row)">{{ text(row.statusI18n, '', statusLabel(row.status)) }}</span>
          </div>
          <p>{{ copy.imageLink }}：{{ imageLabel(row) }}</p>
          <p>{{ copy.buttonLink }}：{{ buttonLabel(row) }}</p>
          <div class="slide__actions">
            <el-button v-if="canSort" size="small" :disabled="index === 0" @click="move(row, 1)">↑</el-button>
            <el-button v-if="canSort" size="small" :disabled="index === slides.length - 1" @click="move(row, 2)">↓</el-button>
            <el-button v-if="canEdit" link type="primary" @click="openEdit(row.id)">{{ copy.edit }}</el-button>
            <el-button v-if="canStatus && row.rowAction" link @click="toggle(row)">{{ actionLabel(row.rowAction) }}</el-button>
          </div>
        </div>
      </article>
      <p v-if="!loading && !slides.length" class="empty">{{ copy.empty }}</p>
    </section>

    <el-drawer v-model="drawer" :title="form.id ? copy.edit : copy.create" size="980px" :close-on-click-modal="false">
      <el-form label-position="top">
        <div class="live__bar">
          <strong>{{ copy.preview }}</strong>
          <el-radio-group v-model="previewLang" size="small">
            <el-radio-button value="zh">中文</el-radio-button>
            <el-radio-button value="en">English</el-radio-button>
          </el-radio-group>
        </div>
        <div class="pair">
          <div class="pair__item">
            <span>{{ copy.pc }}</span>
            <div class="pc-hero" :class="{ off: !form.showOnPc }" :style="heroStyle(form.pcImageUrl || form.mobileImageUrl)">
              <div class="pc-hero__copy">
                <small>{{ draft.eyebrow }}</small>
                <b><span>{{ draft.title }}</span><em v-if="draft.accent">{{ draft.accent }}</em></b>
                <span>{{ draft.subtitle }}</span>
                <div class="hero-actions"><strong v-if="draft.badge">{{ draft.badge }}</strong><i>{{ draft.button }}</i></div>
              </div>
            </div>
            <el-checkbox v-model="form.showOnPc">{{ copy.showPc }}</el-checkbox>
            <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('pcImageUrl')">
              <div class="upload" :style="imageStyle(form.pcImageUrl)">{{ form.pcImageUrl ? copy.replace : copy.upload }}</div>
            </el-upload>
          </div>
          <div class="pair__item">
            <span>{{ copy.h5 }}</span>
            <div class="phone" :class="{ off: !form.showOnMobile }">
              <div class="h5-hero__image" :style="photoStyle(form.mobileImageUrl || form.pcImageUrl)" />
              <div class="h5-hero__copy">
                <small>{{ draft.eyebrow }}</small>
                <b><span>{{ draft.title }}</span><em v-if="draft.accent">{{ draft.accent }}</em></b>
                <span>{{ draft.subtitle }}</span>
                <div class="hero-actions"><strong v-if="draft.badge">{{ draft.badge }}</strong><i>{{ draft.button }}</i></div>
              </div>
            </div>
            <el-checkbox v-model="form.showOnMobile">{{ copy.showH5 }}</el-checkbox>
            <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('mobileImageUrl')">
              <div class="upload" :style="imageStyle(form.mobileImageUrl)">{{ form.mobileImageUrl ? copy.replace : copy.upload }}</div>
            </el-upload>
            <small>{{ copy.mobileHint }}</small>
          </div>
        </div>
        <el-form-item :label="copy.imageLink">
          <el-checkbox v-model="form.imageSame">{{ copy.sameAsButton }}</el-checkbox>
          <div v-if="!form.imageSame && form.imageKind === 'custom'" class="route">
            <p class="route__legacy">{{ form.imageCustom }}</p>
            <el-button @click="form.imageKind = 'service'">{{ copy.useRoute }}</el-button>
          </div>
          <div v-else-if="!form.imageSame" class="route">
            <el-select v-model="form.imageKind">
              <el-option value="service" :label="copy.serviceDetail" />
              <el-option value="list" :label="copy.serviceList" />
              <el-option value="campaign" :label="copy.campaignServices" />
            </el-select>
            <el-select v-if="form.imageKind === 'service'" v-model="form.imageSpuId" filterable :loading="catalogLoading" :placeholder="copy.pickService">
              <el-option v-for="item in serviceChoices(form.imageSpuId)" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
            <el-select v-else-if="form.imageKind === 'campaign'" v-model="form.imageCampaignId" filterable :loading="catalogLoading" :placeholder="copy.pickCampaign">
              <el-option v-for="item in campaignChoices(form.imageCampaignId)" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
            <template v-else-if="form.imageKind === 'list'">
              <el-select v-model="form.imageList">
                <el-option value="all" :label="copy.allServices" />
                <el-option value="category" :label="copy.oneCategory" />
              </el-select>
              <el-tree-select
                v-if="form.imageList === 'category'"
                v-model="form.imageCategoryId"
                :data="categoryChoices(form.imageCategoryId)"
                check-strictly
                filterable
                :render-after-expand="false"
                :loading="catalogLoading"
                :placeholder="copy.pickCategory"
              />
            </template>
          </div>
          <small>{{ copy.imageLinkHint }}</small>
        </el-form-item>

        <h3>{{ copy.textEn }}</h3>
        <div class="grid">
          <el-form-item :label="copy.eyebrow"><el-input v-model="form.eyebrowEn" maxlength="64" placeholder="HOME CLEANING" /></el-form-item>
          <el-form-item :label="copy.badge"><el-input v-model="form.badgeEn" maxlength="128" placeholder="20% OFF" /></el-form-item>
          <el-form-item :label="copy.headline"><el-input v-model="form.titleEn" maxlength="128" placeholder="A Cleaner Home." /></el-form-item>
          <el-form-item :label="copy.headline2"><el-input v-model="form.title2En" maxlength="128" placeholder="A Better Deal." /></el-form-item>
        </div>
        <el-form-item :label="copy.subtitle"><el-input v-model="form.subtitleEn" maxlength="256" placeholder="From AED 45/hour · Minimum 2 hours" /></el-form-item>

        <h3>{{ copy.textZh }}</h3>
        <div class="grid">
          <el-form-item :label="copy.eyebrow"><el-input v-model="form.eyebrowZh" maxlength="64" /></el-form-item>
          <el-form-item :label="copy.badge"><el-input v-model="form.badgeZh" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.headline"><el-input v-model="form.titleZh" maxlength="128" /></el-form-item>
          <el-form-item :label="copy.headline2"><el-input v-model="form.title2Zh" maxlength="128" /></el-form-item>
        </div>
        <el-form-item :label="copy.subtitle"><el-input v-model="form.subtitleZh" maxlength="256" /></el-form-item>

        <h3>{{ copy.buttonSection }}</h3>
        <div class="grid">
          <el-form-item :label="copy.buttonEn"><el-input v-model="form.buttonEn" maxlength="64" placeholder="Book Home Cleaning" /></el-form-item>
          <el-form-item :label="copy.buttonZh"><el-input v-model="form.buttonZh" maxlength="64" placeholder="预约家庭清洁" /></el-form-item>
        </div>
        <el-form-item :label="copy.buttonLink">
          <div v-if="form.buttonKind === 'custom'" class="route">
            <p class="route__legacy">{{ form.buttonCustom }}</p>
            <el-button @click="form.buttonKind = 'service'">{{ copy.useRoute }}</el-button>
          </div>
          <div v-else class="route">
            <el-select v-model="form.buttonKind">
              <el-option value="service" :label="copy.serviceDetail" />
              <el-option value="list" :label="copy.serviceList" />
              <el-option value="campaign" :label="copy.campaignServices" />
            </el-select>
            <el-select v-if="form.buttonKind === 'service'" v-model="form.buttonSpuId" filterable :loading="catalogLoading" :placeholder="copy.pickService">
              <el-option v-for="item in serviceChoices(form.buttonSpuId)" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
            <el-select v-else-if="form.buttonKind === 'campaign'" v-model="form.buttonCampaignId" filterable :loading="catalogLoading" :placeholder="copy.pickCampaign">
              <el-option v-for="item in campaignChoices(form.buttonCampaignId)" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
            <template v-else-if="form.buttonKind === 'list'">
              <el-select v-model="form.buttonList">
                <el-option value="all" :label="copy.allServices" />
                <el-option value="category" :label="copy.oneCategory" />
              </el-select>
              <el-tree-select
                v-if="form.buttonList === 'category'"
                v-model="form.buttonCategoryId"
                :data="categoryChoices(form.buttonCategoryId)"
                check-strictly
                filterable
                :render-after-expand="false"
                :loading="catalogLoading"
                :placeholder="copy.pickCategory"
              />
            </template>
          </div>
          <small>{{ copy.buttonLinkHint }}</small>
        </el-form-item>
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
import type { UploadRequestOptions } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { campaignPage } from '@/modules/admin/api/campaign';
import { getPage as categoryPage, upload } from '@/modules/admin/api/category';
import { onShelfOptions } from '@/modules/admin/api/spu';
import {
  promotionAdd,
  promotionDetail,
  promotionDisable,
  promotionEnable,
  promotionPage,
  promotionSort,
  promotionUpdate,
  type PromotionSavePayload,
} from '@/modules/admin/api/promotion';
import { canAction } from '@/modules/admin/utils/menuPermission';

type Card = {
  id: number;
  title?: string;
  titleI18n?: Record<string, string>;
  titleLine2I18n?: Record<string, string>;
  eyebrowI18n?: Record<string, string>;
  subtitleI18n?: Record<string, string>;
  badgeI18n?: Record<string, string>;
  buttonI18n?: Record<string, string>;
  status?: number;
  statusI18n?: Record<string, string>;
  displayStatus?: string;
  pcImageUrl?: string;
  mobileImageUrl?: string;
  showOnPc?: boolean;
  showOnMobile?: boolean;
  imageLink?: string;
  linkType?: number;
  pageCode?: string;
  spuId?: number;
  categoryId?: number;
  campaignId?: number;
  externalUrl?: string;
  validStart?: string;
  validEnd?: string;
  sortNo?: number;
  rowAction?: string;
};

const { locale } = useI18n();
const zh = computed(() => locale.value.startsWith('zh'));
const copy = computed(() => (zh.value ? {
  title: '网页营销展示',
  lead: '保存后会出现在电脑端首页和 H5 首页。文字、按钮和链接两端共用，图片按端分别上传。上方预览就是顾客看到的样子。同时最多 5 张，每 6 秒切换。',
  create: '新建轮播', edit: '编辑', empty: '还没有轮播图',
  preview: '预览', pc: '电脑端', h5: 'H5', hidden: '不展示', showPc: '在电脑端首页展示', showH5: '在 H5 首页展示',
  mobileHint: '不上传时，H5 使用电脑端图片。',
  upload: '上传图片', replace: '更换图片', imageLink: '图片跳转', imageLinkHint: '不单独设置时，点击图片和按钮打开同一个页面。电脑端和 H5 都在站内跳转。',
  sameAsButton: '和按钮去同一个页面', serviceDetail: '服务详情', serviceList: '服务列表', campaignServices: '活动服务', allServices: '全部服务', oneCategory: '指定类别',
  pickService: '请选择服务', pickCategory: '请选择服务类别', pickCampaign: '请选择限时活动', useRoute: '改为站内页面', samePage: '和按钮相同',
  textEn: '英文文字', textZh: '中文文字', eyebrow: '眉题', headline: '标题', headline2: '标题第二行',
  subtitle: '副标题', badge: '角标', buttonSection: '按钮', button: '按钮', buttonEn: '按钮英文', buttonZh: '按钮中文',
  buttonLink: '按钮跳转', buttonLinkHint: '在当前网站内打开。选「活动服务」会打开这次限时活动里的全部服务。电脑端和 H5 各自打开自己的页面。',
  cancel: '取消', save: '保存', saved: '已保存', failed: '保存失败，请检查填写内容',
  pause: '暂停', resume: '启用', untitled: '未填写标题',
  needImage: '请上传轮播图', needDevice: '请至少选择电脑端或 H5', needTitle: '请填写标题', needButton: '请填写按钮文字', needButtonLink: '请选择按钮跳转的页面', needImageLink: '请选择图片跳转的页面',
} : {
  title: 'Website carousel',
  lead: 'Saved slides appear on the desktop homepage and the H5 homepage. Text, the button, and links are shared. Images are uploaded per device. The preview matches what customers see. Up to 5 slides, changing every 6 seconds.',
  create: 'New slide', edit: 'Edit', empty: 'No slides yet',
  preview: 'Preview', pc: 'Desktop', h5: 'H5', hidden: 'Hidden', showPc: 'Show on the desktop homepage', showH5: 'Show on the H5 homepage',
  mobileHint: 'H5 uses the desktop image when this is empty.',
  upload: 'Upload', replace: 'Replace', imageLink: 'Image destination', imageLinkHint: 'When this is left alone, the photo opens the same page as the button. Desktop and H5 stay inside the site.',
  sameAsButton: 'Same page as the button', serviceDetail: 'Service detail', serviceList: 'Service list', campaignServices: 'Offer services', allServices: 'All services', oneCategory: 'One category',
  pickService: 'Choose a service', pickCategory: 'Choose a category', pickCampaign: 'Choose an offer', useRoute: 'Choose an in-site page', samePage: 'Same as the button',
  textEn: 'English text', textZh: 'Chinese text', eyebrow: 'Eyebrow', headline: 'Headline', headline2: 'Second line',
  subtitle: 'Subtitle', badge: 'Badge', buttonSection: 'Button', button: 'Button', buttonEn: 'Button (English)', buttonZh: 'Button (中文)',
  buttonLink: 'Button destination', buttonLinkHint: 'Opens inside the site. Offer services opens every service in that limited-time offer. Desktop and H5 each use their own page.',
  cancel: 'Cancel', save: 'Save', saved: 'Saved', failed: 'Could not save. Check the form.',
  pause: 'Pause', resume: 'Enable', untitled: 'Untitled',
  needImage: 'Upload a slide image', needDevice: 'Choose desktop, H5, or both', needTitle: 'Enter a headline', needButton: 'Enter the button text', needButtonLink: 'Choose where the button goes', needImageLink: 'Choose where the photo goes',
}));

const canCreate = computed(() => canAction('btn:/admin/marketing/promotions:create'));
const canEdit = computed(() => canAction('btn:/admin/marketing/promotions:edit'));
const canStatus = computed(() => canAction('btn:/admin/marketing/promotions:status'));
const canSort = computed(() => canAction('btn:/admin/marketing/promotions:sort'));

const loading = ref(false);
const saving = ref(false);
const catalogLoading = ref(false);
const services = ref<Array<{ id: number; label: string }>>([]);
const campaigns = ref<Array<{ id: number; label: string }>>([]);
const categories = ref<Array<{ value: number; label: string; children?: Array<{ value: number; label: string }> }>>([]);
const error = ref('');
const drawer = ref(false);
const slides = ref<Card[]>([]);
const form = reactive(blank());
const previewLang = ref<'zh' | 'en'>('zh');
const draft = computed(() => {
  const english = previewLang.value === 'en';
  const pick = (en: string, chinese: string) => (english ? en.trim() || chinese.trim() : chinese.trim() || en.trim());
  return {
    eyebrow: pick(form.eyebrowEn, form.eyebrowZh),
    title: pick(form.titleEn, form.titleZh) || copy.value.untitled,
    accent: pick(form.title2En, form.title2Zh),
    subtitle: pick(form.subtitleEn, form.subtitleZh),
    badge: pick(form.badgeEn, form.badgeZh),
    button: pick(form.buttonEn, form.buttonZh) || copy.value.button,
  };
});

const statuses = computed(() => [
  { value: 0, label: zh.value ? '草稿' : 'Draft' },
  { value: 1, label: zh.value ? '已安排' : 'Scheduled' },
  { value: 2, label: zh.value ? '启用' : 'Active' },
  { value: 3, label: zh.value ? '暂停' : 'Paused' },
  { value: 4, label: zh.value ? '已结束' : 'Ended' },
]);

function blank() {
  return {
    id: undefined as number | undefined,
    status: 2,
    validStart: '',
    validEnd: '',
    showOnPc: true,
    showOnMobile: true,
    pcImageUrl: '',
    mobileImageUrl: '',
    imageSame: true,
    imageKind: 'service' as 'service' | 'list' | 'campaign' | 'custom',
    imageSpuId: undefined as number | undefined,
    imageList: 'all' as 'all' | 'category',
    imageCategoryId: undefined as number | undefined,
    imageCampaignId: undefined as number | undefined,
    imageCustom: '',
    buttonKind: 'service' as 'service' | 'list' | 'campaign' | 'custom',
    buttonSpuId: undefined as number | undefined,
    buttonList: 'all' as 'all' | 'category',
    buttonCategoryId: undefined as number | undefined,
    buttonCampaignId: undefined as number | undefined,
    buttonCustom: '',
    eyebrowEn: '', eyebrowZh: '', titleEn: '', titleZh: '', title2En: '', title2Zh: '',
    subtitleEn: '', subtitleZh: '', badgeEn: '', badgeZh: '', buttonEn: '', buttonZh: '',
  };
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
function text(map: Record<string, string> | undefined, fallback?: string) {
  const language = String(locale.value || 'zh').split('-')[0];
  return map?.[language] || map?.zh || map?.en || fallback || '';
}
function read(map: Record<string, string> | undefined, language: 'en' | 'zh') {
  return map?.[language] || '';
}
function i18n(en: string, chinese: string) {
  const map: Record<string, string> = {};
  if (en.trim()) map.en = en.trim();
  if (chinese.trim()) map.zh = chinese.trim();
  return Object.keys(map).length ? map : undefined;
}
function day(value?: string) {
  return value ? String(value).slice(0, 10) : '';
}
type Jump = {
  kind: 'service' | 'list' | 'campaign' | 'custom';
  spuId?: number;
  list: 'all' | 'category';
  categoryId?: number;
  campaignId?: number;
  custom: string;
};
function positiveId(value: unknown) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}
function parsePath(raw?: string): Jump | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      path = url.hash.startsWith('#/') ? url.hash.slice(1) : `${url.pathname}${url.search}`;
    } catch {
      return { kind: 'custom', list: 'all', custom: value };
    }
  }
  let url: URL;
  try {
    url = new URL(path, 'http://local');
  } catch {
    return { kind: 'custom', list: 'all', custom: value };
  }
  let pathname = url.pathname.replace(/^\/h5(?=\/|$)/, '') || '/';
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  const campaign = pathname.match(/^\/campaigns\/(\d+)$/);
  if (campaign) return { kind: 'campaign', list: 'all', campaignId: Number(campaign[1]), custom: '' };
  const detail = pathname.match(/^\/services\/detail\/(\d+)$/);
  if (detail) return { kind: 'service', spuId: Number(detail[1]), list: 'all', custom: '' };
  if (pathname === '/services/search' || pathname === '/services' || pathname === '/services/daily-cleaning') {
    const categoryId = positiveId(url.searchParams.get('categoryId'));
    return categoryId
      ? { kind: 'list', list: 'category', categoryId, custom: '' }
      : { kind: 'list', list: 'all', custom: '' };
  }
  return { kind: 'custom', list: 'all', custom: value };
}
function jumpFromCard(row: Card): Jump {
  const type = Number(row.linkType || 0);
  if (type === 7 && positiveId(row.campaignId)) return { kind: 'campaign', list: 'all', campaignId: Number(row.campaignId), custom: '' };
  if (type === 3 && positiveId(row.spuId)) return { kind: 'service', spuId: Number(row.spuId), list: 'all', custom: '' };
  if (type === 4 && positiveId(row.categoryId)) return { kind: 'list', list: 'category', categoryId: Number(row.categoryId), custom: '' };
  const page = String(row.pageCode || '').trim();
  if (type === 2 && (page === 'services' || page === 'all-services')) return { kind: 'list', list: 'all', custom: '' };
  return parsePath(row.externalUrl || page) || { kind: 'service', list: 'all', custom: '' };
}
function serviceName(id?: number) {
  if (!id) return '';
  return services.value.find((item) => item.id === id)?.label || `#${id}`;
}
function categoryName(id?: number) {
  if (!id) return '';
  for (const node of categories.value) {
    if (node.value === id) return node.label;
    const child = node.children?.find((item) => item.value === id);
    if (child) return child.label;
  }
  return `#${id}`;
}
function campaignName(id?: number) {
  if (!id) return '';
  return campaigns.value.find((item) => item.id === id)?.label || `#${id}`;
}
function jumpText(jump: Jump) {
  if (jump.kind === 'campaign') return `${copy.value.campaignServices} · ${campaignName(jump.campaignId) || '—'}`;
  if (jump.kind === 'service') return `${copy.value.serviceDetail} · ${serviceName(jump.spuId) || '—'}`;
  if (jump.kind === 'list' && jump.list === 'category') return `${copy.value.serviceList} · ${categoryName(jump.categoryId) || '—'}`;
  if (jump.kind === 'list') return `${copy.value.serviceList} · ${copy.value.allServices}`;
  return jump.custom || '—';
}
function buttonLabel(row: Card) {
  return jumpText(jumpFromCard(row));
}
function imageLabel(row: Card) {
  const image = String(row.imageLink || '').trim();
  if (!image) return copy.value.samePage;
  return jumpText(parsePath(image) || { kind: 'custom', list: 'all', custom: image });
}
function serviceChoices(selected?: number) {
  if (!selected || services.value.some((item) => item.id === selected)) return services.value;
  return [{ id: selected, label: `#${selected}` }, ...services.value];
}
function campaignChoices(selected?: number) {
  if (!selected || campaigns.value.some((item) => item.id === selected)) return campaigns.value;
  return [{ id: selected, label: `#${selected}` }, ...campaigns.value];
}
function categoryChoices(selected?: number) {
  if (!selected) return categories.value;
  const present = categories.value.some((node) => node.value === selected || node.children?.some((child) => child.value === selected));
  return present ? categories.value : [{ value: selected, label: `#${selected}` }, ...categories.value];
}
function statusLabel(status?: number) {
  return statuses.value.find((item) => item.value === status)?.label || '—';
}
function statusClass(row: Card) {
  const status = row.displayStatus || '';
  return ['tag', status === 'LIVE' || row.status === 2 ? 'on' : status === 'PAUSED' || row.status === 3 ? 'paused' : status === 'SCHEDULED' || row.status === 1 ? 'soon' : 'draft'];
}
function slideName(index: number) {
  return zh.value ? `第 ${index + 1} 张` : `Slide ${index + 1}`;
}
function actionLabel(action?: string) {
  return action === 'PAUSE' ? copy.value.pause : copy.value.resume;
}
function heroStyle(image?: string) {
  if (!image) return {};
  return { backgroundImage: `linear-gradient(90deg, rgba(8, 22, 42, .9) 0%, rgba(8, 22, 42, .55) 46%, rgba(8, 22, 42, .05) 72%), url(${image})` };
}
function photoStyle(image?: string) {
  if (!image) return {};
  return { backgroundImage: `linear-gradient(180deg, transparent 62%, rgba(8, 22, 42, .72)), url(${image})` };
}
function imageStyle(url: string) {
  return url ? { backgroundImage: `url(${url})` } : {};
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const page = await promotionPage({ slot: 3, pageNum: 1, pageSize: 100 });
    slides.value = listOf(page).sort((a: Card, b: Card) => Number(a.sortNo || 0) - Number(b.sortNo || 0));
  } catch (reason: any) {
    slides.value = [];
    error.value = reason?.message || copy.value.failed;
  } finally {
    loading.value = false;
  }
}
function openCreate() {
  Object.assign(form, blank());
  previewLang.value = zh.value ? 'zh' : 'en';
  void loadCatalog();
  drawer.value = true;
}
async function openEdit(id: number) {
  const detail = body<Card>(await promotionDetail(id));
  Object.assign(form, blank(), {
    id: detail.id,
    status: Number(detail.status ?? 2),
    validStart: day(detail.validStart),
    validEnd: day(detail.validEnd),
    showOnPc: detail.showOnPc !== false,
    showOnMobile: detail.showOnMobile !== false,
    pcImageUrl: detail.pcImageUrl || '',
    mobileImageUrl: detail.mobileImageUrl || '',
    ...imageFields(detail.imageLink),
    ...buttonFields(detail),
    eyebrowEn: read(detail.eyebrowI18n, 'en'),
    eyebrowZh: read(detail.eyebrowI18n, 'zh'),
    titleEn: read(detail.titleI18n, 'en'),
    titleZh: read(detail.titleI18n, 'zh'),
    title2En: read(detail.titleLine2I18n, 'en'),
    title2Zh: read(detail.titleLine2I18n, 'zh'),
    subtitleEn: read(detail.subtitleI18n, 'en'),
    subtitleZh: read(detail.subtitleI18n, 'zh'),
    badgeEn: read(detail.badgeI18n, 'en'),
    badgeZh: read(detail.badgeI18n, 'zh'),
    buttonEn: read(detail.buttonI18n, 'en'),
    buttonZh: read(detail.buttonI18n, 'zh'),
  });
  previewLang.value = zh.value ? 'zh' : 'en';
  void loadCatalog();
  drawer.value = true;
}
function uploadTo(field: 'pcImageUrl' | 'mobileImageUrl') {
  return (options: UploadRequestOptions) => {
    const file = options.file as File;
    const data = new FormData();
    data.append('file', file);
    upload(data).then((result: any) => {
      const url = result?.data?.url || result?.data || result?.url;
      if (!url || typeof url !== 'string') throw new Error(copy.value.failed);
      form[field] = url;
      options.onSuccess?.({ url });
    }).catch((reason: any) => {
      ElMessage.error(reason?.message || copy.value.failed);
      options.onError?.(reason);
    });
  };
}
async function save() {
  const pcImageUrl = form.pcImageUrl.trim();
  const mobileImageUrl = form.mobileImageUrl.trim();
  if (!form.showOnPc && !form.showOnMobile) {
    ElMessage.warning(copy.value.needDevice);
    return;
  }
  if ((form.showOnPc || form.showOnMobile) && !pcImageUrl && !mobileImageUrl) {
    ElMessage.warning(copy.value.needImage);
    return;
  }
  if (!form.titleEn.trim() && !form.titleZh.trim()) {
    ElMessage.warning(copy.value.needTitle);
    return;
  }
  if (!form.buttonEn.trim() && !form.buttonZh.trim()) {
    ElMessage.warning(copy.value.needButton);
    return;
  }
  const button = buttonPayload();
  if (!button) {
    ElMessage.warning(copy.value.needButtonLink);
    return;
  }
  const imageLink = imagePayload();
  if (imageLink == null) {
    ElMessage.warning(copy.value.needImageLink);
    return;
  }
  const payload: PromotionSavePayload = {
    id: form.id,
    slot: 3,
    cardStyle: 1,
    status: form.status,
    validStart: form.validStart && form.validEnd ? form.validStart : undefined,
    validEnd: form.validStart && form.validEnd ? form.validEnd : undefined,
    showOnPc: form.showOnPc,
    showOnMobile: form.showOnMobile,
    pcImageUrl: pcImageUrl || mobileImageUrl,
    mobileImageUrl: mobileImageUrl || pcImageUrl,
    imageLink,
    ...button,
    eyebrowI18n: i18n(form.eyebrowEn, form.eyebrowZh),
    titleI18n: i18n(form.titleEn, form.titleZh),
    titleLine2I18n: i18n(form.title2En, form.title2Zh),
    subtitleI18n: i18n(form.subtitleEn, form.subtitleZh),
    badgeI18n: i18n(form.badgeEn, form.badgeZh),
    buttonI18n: i18n(form.buttonEn, form.buttonZh),
    altI18n: i18n(form.titleEn, form.titleZh),
  };
  saving.value = true;
  try {
    if (form.id) await promotionUpdate(payload);
    else await promotionAdd(payload);
    ElMessage.success(copy.value.saved);
    drawer.value = false;
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  } finally {
    saving.value = false;
  }
}
async function move(row: Card, direction: 1 | 2) {
  try {
    await promotionSort(row.id, direction);
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  }
}
async function toggle(row: Card) {
  try {
    if (row.rowAction === 'PAUSE') await promotionDisable(row.id);
    else await promotionEnable(row.id);
    await load();
  } catch (reason: any) {
    ElMessage.error(reason?.message || copy.value.failed);
  }
}

function buttonFields(row: Card) {
  const jump = jumpFromCard(row);
  return {
    buttonKind: jump.kind,
    buttonSpuId: jump.spuId,
    buttonList: jump.list,
    buttonCategoryId: jump.categoryId,
    buttonCampaignId: jump.campaignId,
    buttonCustom: jump.custom,
  };
}
function imageFields(raw?: string) {
  const jump = parsePath(raw);
  if (!jump) {
    return { imageSame: true, imageKind: 'service' as const, imageList: 'all' as const, imageCustom: '' };
  }
  return {
    imageSame: false,
    imageKind: jump.kind,
    imageSpuId: jump.spuId,
    imageList: jump.list,
    imageCategoryId: jump.categoryId,
    imageCampaignId: jump.campaignId,
    imageCustom: jump.custom,
  };
}
function buttonPayload(): Pick<PromotionSavePayload, 'linkType' | 'spuId' | 'categoryId' | 'pageCode' | 'campaignId' | 'externalUrl'> | null {
  if (form.buttonKind === 'custom') {
    const externalUrl = form.buttonCustom.trim();
    return externalUrl ? { linkType: 6, externalUrl } : null;
  }
  if (form.buttonKind === 'service') {
    return form.buttonSpuId ? { linkType: 3, spuId: form.buttonSpuId } : null;
  }
  if (form.buttonKind === 'campaign') {
    return form.buttonCampaignId ? { linkType: 7, campaignId: form.buttonCampaignId } : null;
  }
  if (form.buttonKind === 'list' && form.buttonList === 'category') {
    return form.buttonCategoryId ? { linkType: 4, categoryId: form.buttonCategoryId } : null;
  }
  if (form.buttonKind === 'list') return { linkType: 2, pageCode: 'services' };
  return null;
}
function imagePayload() {
  if (form.imageSame) return '';
  if (form.imageKind === 'custom') return form.imageCustom.trim() || null;
  if (form.imageKind === 'service') return form.imageSpuId ? `/services/detail/${form.imageSpuId}` : null;
  if (form.imageKind === 'campaign') return form.imageCampaignId ? `/campaigns/${form.imageCampaignId}` : null;
  if (form.imageKind === 'list' && form.imageList === 'category') return form.imageCategoryId ? `/services/search?categoryId=${form.imageCategoryId}` : null;
  if (form.imageKind === 'list') return '/services/search';
  return null;
}
function optionId(value: unknown) {
  return positiveId((value as { id?: unknown } | null)?.id ?? value);
}
async function categoryRecords(extra: Record<string, unknown>) {
  const rows: Array<{ id: number; label: string }> = [];
  for (let pageNum = 1; pageNum <= 5; pageNum += 1) {
    const page = body<{ list?: unknown[]; total?: number }>(await categoryPage({
      pageNum,
      pageSize: 200,
      categoryDomain: 1,
      ...extra,
    }));
    const list = Array.isArray(page.list) ? page.list : [];
    list.forEach((item) => {
      const record = item as { id?: unknown; name?: string; nameI18n?: Record<string, string>; category?: { id?: unknown; name?: string } };
      const id = optionId(record.category?.id ?? record.id);
      if (!id) return;
      rows.push({ id, label: text(record.nameI18n, record.category?.name || record.name, String(id)) });
    });
    const total = Number(page.total || 0);
    if (!list.length || (total > 0 && rows.length >= total)) break;
  }
  return rows;
}
async function loadCampaigns() {
  const rows: Array<{ id: number; label: string }> = [];
  for (let pageNum = 1; pageNum <= 5; pageNum += 1) {
    const page = body<{ list?: unknown[]; total?: number }>(await campaignPage({ pageNum, pageSize: 100 }));
    const list = Array.isArray(page.list) ? page.list : [];
    list.forEach((item) => {
      const record = item as { id?: unknown; name?: string; nameI18n?: Record<string, string>; status?: number };
      const id = optionId(record.id);
      if (!id || Number(record.status) === 4) return;
      rows.push({ id, label: text(record.nameI18n, record.name, String(id)) });
    });
    const total = Number(page.total || 0);
    if (!list.length || (total > 0 && rows.length >= total)) break;
  }
  campaigns.value = rows;
}
async function loadCatalog() {
  if (catalogLoading.value || (services.value.length && categories.value.length && campaigns.value.length)) return;
  catalogLoading.value = true;
  try {
    const shelf = body<unknown[]>(await onShelfOptions());
    const rows = Array.isArray(shelf) ? shelf : [];
    services.value = rows.flatMap((item) => {
      const record = item as { id?: unknown; name?: string; nameI18n?: Record<string, string> };
      const id = optionId(record.id);
      return id ? [{ id, label: text(record.nameI18n, record.name, String(id)) }] : [];
    });
    const parents = await categoryRecords({ level: 1 });
    const children = await Promise.all(parents.map(async (parent) => {
      try {
        return await categoryRecords({ level: 2, pcategoryId: String(parent.id) });
      } catch {
        return [];
      }
    }));
    categories.value = parents.map((parent, index) => {
      const nested = children[index].map((child) => ({ value: child.id, label: child.label }));
      return nested.length
        ? { value: parent.id, label: parent.label, children: nested }
        : { value: parent.id, label: parent.label };
    });
    await loadCampaigns();
  } catch {
    services.value = [];
    categories.value = [];
    campaigns.value = [];
  } finally {
    catalogLoading.value = false;
  }
}

onMounted(() => {
  void loadCatalog();
  void load();
});
</script>

<style scoped>
.promo-page { display: flex; flex-direction: column; gap: 16px; }
.promo-page__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.promo-page__head p { margin: 0; color: #0a7a6a; font-size: 11px; font-weight: 700; letter-spacing: 2px; }
.promo-page__head h1 { margin: 2px 0 0; font-size: 26px; }
.lead { margin: 0; color: #6b7a90; font-size: 13px; line-height: 1.5; }
.slides { display: flex; flex-direction: column; gap: 16px; }
.slide { overflow: hidden; border: 1px solid #e3eaf2; border-radius: 16px; background: #fff; }
.pair { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 16px; align-items: start; }
.slide > .pair { padding: 14px 14px 0; }
.pair__item { display: flex; flex-direction: column; gap: 8px; }
.pair__item > span { color: #6b7a90; font-size: 12px; font-weight: 700; }
.pair__item > span em { margin-left: 6px; color: #b54708; font-style: normal; }
.pc-hero, .phone { color: #fff; background: #08162a; }
.pc-hero { min-height: 220px; padding: 24px; border-radius: 16px; background-position: center right; background-size: cover; display: flex; align-items: center; }
.pc-hero__copy { width: min(280px, 72%); }
.phone { width: 220px; padding: 8px; border-radius: 28px; }
.h5-hero__image { height: 112px; border-radius: 20px 20px 8px 8px; background: #16324f center/cover no-repeat; }
.h5-hero__copy { padding: 10px 8px 12px; }
.pc-hero small, .h5-hero__copy small { display: flex; align-items: center; gap: 8px; color: #d7b56d; letter-spacing: .16em; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.pc-hero small:not(:empty)::before, .h5-hero__copy small:not(:empty)::before { content: ''; width: 16px; height: 1px; background: currentColor; }
.pc-hero b, .h5-hero__copy b { display: block; margin-top: 8px; font-size: 26px; line-height: 1.1; letter-spacing: -.03em; }
.h5-hero__copy b { font-size: 18px; }
.pc-hero em, .h5-hero__copy em { display: block; color: #d7b56d; font-style: normal; }
.pc-hero__copy > span, .h5-hero__copy > span { display: block; margin-top: 8px; color: rgb(255 255 255 / 78%); font-size: 12px; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
.hero-actions strong, .hero-actions i { border-radius: 8px; padding: 7px 10px; font-size: 11px; font-style: normal; font-weight: 700; }
.hero-actions strong { color: #d7b56d; background: transparent; border: 1px solid rgb(215 181 109 / 45%); }
.hero-actions i { color: #102033; background: #f4f1ea; }
.hero-actions i::after { content: ' →'; }
.pc-hero.off, .phone.off { opacity: .4; }
.live__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.slide__meta { padding: 12px 14px; font-size: 12.5px; }
.slide__meta > div:first-child { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.slide__meta p { margin: 6px 0 0; color: #6b7a90; word-break: break-all; }
.slide__actions { display: flex; gap: 6px; align-items: center; margin-top: 8px; }
.tag { border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.tag.on { color: #0a7a6a; background: #e8faf7; }
.tag.soon { color: #2d5bd3; background: #eef3ff; }
.tag.paused { color: #b54708; background: #fff4e5; }
.tag.draft { color: #5b6676; background: #eef2f7; }
.empty { color: #6b7a90; }
.route { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.route > * { min-width: 160px; flex: 1; }
.route__legacy { flex: 1 1 100%; margin: 0; color: #6b7a90; word-break: break-all; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
h3 { margin: 18px 0 8px; font-size: 15px; }
.grid small, .el-form-item small { display: block; margin-top: 4px; color: #6b7a90; }
.upload { width: 220px; height: 110px; border: 1.5px dashed #e3eaf2; border-radius: 12px; background: #f8fafd center/cover no-repeat; display: grid; place-items: center; color: #6b7a90; }
@media (max-width: 1100px) { .pair, .grid { grid-template-columns: 1fr; } .phone { width: min(220px, 100%); } }
</style>
