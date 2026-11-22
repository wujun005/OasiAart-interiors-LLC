<template>
  <main class="banner-page">
    <header class="banner-page__head">
      <div>
        <p>MARKETING CENTER</p>
        <h1>{{ copy.title }}</h1>
      </div>
    </header>

    <div class="tabs">
      <button type="button" :class="{ on: tab === 'slides' }" @click="tab = 'slides'">{{ copy.slides }}</button>
      <button type="button" :class="{ on: tab === 'popups' }" @click="tab = 'popups'">{{ copy.popups }}</button>
    </div>

    <div v-if="tab === 'slides'" class="toolbar">
      <p>{{ copy.slideHint }}</p>
      <el-button v-if="canAction('btn:/admin/marketing/banners:create')" type="primary" @click="openCreate(3)">
        {{ copy.newSlide }}
      </el-button>
    </div>
    <div v-else class="toolbar">
      <p>{{ copy.popupHint }}</p>
      <el-button v-if="canAction('btn:/admin/marketing/banners:create')" type="primary" @click="openCreate(4)">
        {{ copy.newPopup }}
      </el-button>
    </div>

    <el-alert v-if="error" :title="error" type="error" :closable="false" />

    <section v-if="tab === 'slides'" v-loading="loading" class="slides">
      <article v-for="(row, index) in slides" :key="row.id" class="slide">
        <div class="slide__visual" :style="visualStyle(row)">
          <template v-if="row.cardStyle !== 2">
            <small>{{ text(row.eyebrowI18n, '') }}</small>
            <b>{{ text(row.titleI18n, row.title || '') }}<br><em>{{ text(row.titleLine2I18n, '') }}</em></b>
            <span>{{ text(row.subtitleI18n, '') }}</span>
            <strong v-if="text(row.badgeI18n, '')">{{ text(row.badgeI18n, '') }}</strong>
          </template>
          <small v-else-if="!row.pcImageUrl && !row.mobileImageUrl">{{ copy.noImage }}</small>
        </div>
        <div class="slide__meta">
          <div>
            <b>{{ copy.slideNo }} {{ index + 1 }} · {{ row.cardStyle === 2 ? copy.imageOnly : copy.template }}</b>
            <span :class="statusClass(row)">{{ text(row.statusI18n, '', statusLabel(row.status)) }}</span>
          </div>
          <p>{{ row.ctaLine || linkSummary(row) }}</p>
          <p>{{ period(row) }}</p>
          <p>CTR {{ Number(row.ctr || 0).toFixed(1) }}% <span>({{ row.clickCount || 0 }} / {{ row.impressionCount || 0 }})</span></p>
          <div class="slide__actions">
            <el-button size="small" :disabled="index === 0" @click="move(row, 1)">↑</el-button>
            <el-button size="small" :disabled="index === slides.length - 1" @click="move(row, 2)">↓</el-button>
            <el-button v-if="canAction('btn:/admin/marketing/banners:edit')" link type="primary" @click="openEdit(row.id)">{{ copy.edit }}</el-button>
            <el-button v-if="canAction('btn:/admin/marketing/banners:status') && row.rowAction" link @click="toggle(row)">
              {{ actionLabel(row.rowAction) }}
            </el-button>
          </div>
        </div>
      </article>
      <p v-if="!loading && !slides.length" class="empty">{{ copy.emptySlides }}</p>
    </section>

    <section v-else class="board">
      <el-table v-loading="loading" :data="popups" row-key="id" :empty-text="copy.emptyPopups">
        <el-table-column :label="copy.popup" min-width="220">
          <template #default="{ row }">
            <b>{{ text(row.titleI18n, row.title, copy.untitled) }}</b>
            <span v-if="row.couponCode" class="code">{{ row.couponCode }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="copy.trigger" min-width="160">
          <template #default="{ row }">
            <div>{{ triggerLabel(row) }}</div>
            <small>{{ frequencyLabel(row.popupFrequency) }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.audience" min-width="160">
          <template #default="{ row }">
            <div>{{ text(row.popupAudienceI18n, '', audienceLabel(row.popupAudience)) }}</div>
            <small>{{ text(row.popupPagesI18n, '', pagesLabel(row.popupPages)) }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="copy.period" min-width="160">
          <template #default="{ row }">{{ period(row) }}</template>
        </el-table-column>
        <el-table-column label="CTR" width="110">
          <template #default="{ row }">{{ Number(row.ctr || 0).toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column :label="copy.status" width="110">
          <template #default="{ row }"><span :class="statusClass(row)">{{ text(row.statusI18n, '', statusLabel(row.status)) }}</span></template>
        </el-table-column>
        <el-table-column :label="copy.actions" width="160" align="right">
          <template #default="{ row }">
            <el-button v-if="canAction('btn:/admin/marketing/banners:edit')" link type="primary" @click="openEdit(row.id)">{{ copy.edit }}</el-button>
            <el-button v-if="canAction('btn:/admin/marketing/banners:status') && row.rowAction" link @click="toggle(row)">
              {{ actionLabel(row.rowAction) }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="drawer" :title="form.id ? copy.edit : (form.slot === 4 ? copy.newPopup : copy.newSlide)" size="760px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item v-if="form.slot === 3" :label="copy.slideType">
          <el-select v-model="form.cardStyle">
            <el-option :value="1" :label="copy.templateOption" />
            <el-option :value="2" :label="copy.imageOption" />
          </el-select>
          <small class="hint">{{ form.cardStyle === 2 ? copy.imageHint : copy.templateHint }}</small>
        </el-form-item>

        <h3>{{ copy.images }}</h3>
        <div class="grid">
          <template v-if="form.slot === 3">
            <el-form-item :label="form.cardStyle === 2 ? copy.desktopEn : copy.desktop">
              <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('pcImageUrl')">
                <div class="upload" :style="imageStyle(form.pcImageUrl)">{{ form.pcImageUrl ? '' : copy.upload }}</div>
              </el-upload>
              <small>1920×600 · JPG/PNG/WebP</small>
            </el-form-item>
            <el-form-item :label="form.cardStyle === 2 ? copy.mobileEn : copy.mobile">
              <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('mobileImageUrl')">
                <div class="upload" :style="imageStyle(form.mobileImageUrl)">{{ form.mobileImageUrl ? '' : copy.upload }}</div>
              </el-upload>
              <small>750×900 · JPG/PNG/WebP</small>
            </el-form-item>
          </template>
          <template v-if="form.slot === 3 && form.cardStyle === 2">
            <el-form-item :label="copy.desktopZh">
              <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('pcImageUrlZh')">
                <div class="upload" :style="imageStyle(form.pcImageUrlZh)">{{ form.pcImageUrlZh ? '' : copy.upload }}</div>
              </el-upload>
            </el-form-item>
            <el-form-item :label="copy.mobileZh">
              <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('mobileImageUrlZh')">
                <div class="upload" :style="imageStyle(form.mobileImageUrlZh)">{{ form.mobileImageUrlZh ? '' : copy.upload }}</div>
              </el-upload>
            </el-form-item>
            <el-form-item :label="copy.altEn"><el-input v-model="form.altEn" maxlength="256" /></el-form-item>
            <el-form-item :label="copy.altZh"><el-input v-model="form.altZh" maxlength="256" /></el-form-item>
          </template>
          <el-form-item v-else-if="form.slot === 4" :label="copy.popupImage">
            <el-upload :show-file-list="false" accept="image/jpeg,image/png,image/webp" :http-request="uploadTo('pcImageUrl')">
              <div class="upload" :style="imageStyle(form.pcImageUrl)">{{ form.pcImageUrl ? '' : copy.upload }}</div>
            </el-upload>
            <small>800×800</small>
          </el-form-item>
        </div>

        <template v-if="form.slot === 4 || form.cardStyle !== 2">
          <h3>{{ copy.textEn }}</h3>
          <div class="grid">
            <el-form-item :label="copy.eyebrow"><el-input v-model="form.eyebrowEn" maxlength="64" /></el-form-item>
            <el-form-item :label="copy.button"><el-input v-model="form.buttonEn" maxlength="64" /></el-form-item>
            <el-form-item :label="copy.headline"><el-input v-model="form.titleEn" maxlength="128" /></el-form-item>
            <el-form-item :label="copy.headline2"><el-input v-model="form.title2En" maxlength="128" /></el-form-item>
          </div>
          <el-form-item :label="copy.subtitle"><el-input v-model="form.subtitleEn" maxlength="256" /></el-form-item>
          <el-form-item :label="copy.offer"><el-input v-model="form.badgeEn" maxlength="128" /></el-form-item>
          <h3>{{ copy.textZh }}</h3>
          <div class="grid">
            <el-form-item :label="copy.eyebrowZh"><el-input v-model="form.eyebrowZh" maxlength="64" /></el-form-item>
            <el-form-item :label="copy.buttonZh"><el-input v-model="form.buttonZh" maxlength="64" /></el-form-item>
            <el-form-item :label="copy.headlineZh"><el-input v-model="form.titleZh" maxlength="128" /></el-form-item>
            <el-form-item :label="copy.headline2Zh"><el-input v-model="form.title2Zh" maxlength="128" /></el-form-item>
          </div>
          <el-form-item :label="copy.subtitleZh"><el-input v-model="form.subtitleZh" maxlength="256" /></el-form-item>
          <el-form-item :label="copy.offerZh"><el-input v-model="form.badgeZh" maxlength="128" /></el-form-item>
        </template>

        <h3>{{ copy.linkSchedule }}</h3>
        <div class="grid">
          <el-form-item :label="copy.link">
            <el-select v-model="form.linkType">
              <el-option v-for="item in linkTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.linkType === 1" :label="copy.coupon">
            <el-select v-model="form.couponCode" filterable clearable>
              <el-option v-for="item in coupons" :key="item.code" :label="item.label" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.linkType === 2" :label="copy.page">
            <el-select v-model="form.pageCode" filterable allow-create default-first-option>
              <el-option v-for="item in pages" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.linkType === 3" :label="copy.service">
            <el-select v-model="form.spuId" filterable remote :remote-method="searchServices" :loading="serviceLoading">
              <el-option v-for="item in services" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.linkType === 4" :label="copy.category">
            <el-select v-model="form.categoryId" filterable>
              <el-option v-for="item in categories" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.linkType === 5" :label="copy.sku"><el-input-number v-model="form.skuId" :min="1" :precision="0" /></el-form-item>
          <el-form-item v-if="form.linkType === 7" :label="copy.campaign">
            <el-select v-model="form.campaignId" filterable>
              <el-option v-for="item in campaigns" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.linkType === 6" :label="copy.url"><el-input v-model="form.externalUrl" /></el-form-item>
          <el-form-item v-if="form.linkType !== 1 && form.linkType !== 0" :label="copy.alsoCoupon">
            <el-select v-model="form.couponCode" filterable clearable>
              <el-option v-for="item in coupons" :key="item.code" :label="item.label" :value="item.code" />
            </el-select>
            <small class="hint">{{ copy.couponHint }}</small>
          </el-form-item>
          <el-form-item :label="copy.start"><el-date-picker v-model="form.validStart" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item :label="copy.end"><el-date-picker v-model="form.validEnd" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item :label="copy.status">
            <el-select v-model="form.status">
              <el-option v-for="item in statuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>

        <template v-if="form.slot === 4">
          <h3>{{ copy.popupRules }}</h3>
          <div class="grid three">
            <el-form-item :label="copy.trigger">
              <el-select v-model="form.popupTrigger">
                <el-option :value="1" :label="copy.onEntry" />
                <el-option :value="2" :label="copy.delayed" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="form.popupTrigger === 2" :label="copy.delay">
              <el-input-number v-model="form.popupDelaySeconds" :min="0" :max="120" :precision="0" />
              <small class="hint">{{ copy.delayHint }}</small>
            </el-form-item>
            <el-form-item :label="copy.frequency">
              <el-select v-model="form.popupFrequency">
                <el-option :value="1" :label="copy.onceVisitor" />
                <el-option :value="2" :label="copy.everyOpen" />
                <el-option :value="3" :label="copy.onceDay" />
              </el-select>
            </el-form-item>
            <el-form-item :label="copy.audience">
              <el-select v-model="form.popupAudience">
                <el-option :value="1" :label="copy.everyone" />
                <el-option :value="2" :label="copy.guests" />
                <el-option :value="3" :label="copy.returning" />
              </el-select>
            </el-form-item>
            <el-form-item :label="copy.pages">
              <el-select v-model="form.popupPages">
                <el-option :value="1" :label="copy.homeOnly" />
                <el-option :value="2" :label="copy.allPages" />
              </el-select>
            </el-form-item>
          </div>
        </template>
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
import { upload } from '@/modules/admin/api/category';
import { campaignPage } from '@/modules/admin/api/campaign';
import { getPage as categoryPage } from '@/modules/admin/api/category';
import { couponPage } from '@/modules/admin/api/coupon';
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
import { page as servicePage } from '@/modules/admin/api/spu';
import { canAction } from '@/modules/admin/utils/menuPermission';

type Card = {
  id: number;
  slot?: number;
  cardStyle?: number;
  title?: string;
  titleI18n?: Record<string, string>;
  titleLine2I18n?: Record<string, string>;
  eyebrowI18n?: Record<string, string>;
  subtitleI18n?: Record<string, string>;
  badgeI18n?: Record<string, string>;
  buttonI18n?: Record<string, string>;
  altI18n?: Record<string, string>;
  status?: number;
  statusI18n?: Record<string, string>;
  displayStatus?: string;
  pcImageUrl?: string;
  mobileImageUrl?: string;
  pcImageUrlZh?: string;
  mobileImageUrlZh?: string;
  ctaLine?: string;
  couponCode?: string;
  pageCode?: string;
  linkType?: number;
  spuId?: number;
  categoryId?: number;
  skuId?: number;
  campaignId?: number;
  externalUrl?: string;
  popupTrigger?: number;
  popupDelaySeconds?: number;
  popupFrequency?: number;
  popupAudience?: number;
  popupAudienceI18n?: Record<string, string>;
  popupPages?: number;
  popupPagesI18n?: Record<string, string>;
  validStart?: string;
  validEnd?: string;
  sortNo?: number;
  impressionCount?: number;
  clickCount?: number;
  ctr?: number;
  rowAction?: string;
};

type Named = { id: number; label: string };
type Coded = { code: string; label: string };

const { locale } = useI18n();
const zh = computed(() => locale.value.startsWith('zh'));
const copy = computed(() => (zh.value ? {
  title: '横幅广告和弹出窗口', slides: '英雄轮转', popups: '弹出窗口',
  slideHint: '两种幻灯片：模板用照片做背景，并填写中英文；纯图片是已经排好文字的宣传图。自动播放 6 秒，同时展示最多 5 张。',
  popupHint: '同一时间只能有一个弹出窗口处于已安排或启用，而且时间不能重叠。',
  newSlide: '+ 新幻灯片', newPopup: '+ 新弹窗', slideNo: '幻灯片', template: '模板', imageOnly: '纯图片',
  noImage: '纯图片 · 还没有图片', edit: '编辑', emptySlides: '还没有幻灯片', emptyPopups: '还没有弹窗',
  popup: '弹窗', trigger: '触发', audience: '受众', period: '时间', status: '状态', actions: '操作', untitled: '未命名',
  slideType: '幻灯片类型', templateOption: '模板：照片背景 + 实时文字', imageOption: '纯图片：文字已经做进图片',
  templateHint: '文字在各屏幕上都清晰，也方便改文案。照片左侧留出大约 40% 给文字。',
  imageHint: '适合设计好的宣传图。需要英文图，中文图和手机图可以另外上传，否则手机上文字可能被裁掉。',
  images: '图片', desktop: '电脑端背景', mobile: '手机端背景', desktopEn: '电脑端 · 英文', mobileEn: '手机端 · 英文',
  desktopZh: '电脑端 · 中文', mobileZh: '手机端 · 中文', popupImage: '弹窗图片', upload: '上传',
  altEn: '替代文字（英文）', altZh: '替代文字（中文）',
  textEn: '英文文案', textZh: '中文文案', eyebrow: '分类眉题', eyebrowZh: '眉题',
  button: '按钮', buttonZh: '按钮', headline: '标题第一行', headline2: '标题第二行',
  headlineZh: '标题第一行', headline2Zh: '标题第二行', subtitle: '副标题', subtitleZh: '副标题',
  offer: '优惠条（可选）', offerZh: '优惠条（可选）',
  linkSchedule: '跳转与时间', link: '跳转', coupon: '优惠券', page: '页面', service: '服务',
  category: '类别', sku: '规格编号', campaign: '限时活动', url: '外链', alsoCoupon: '同时带上优惠券',
  couponHint: '关联的券或活动结束后，这条展示会自动不再出现。优惠文案要和券规则一致。',
  start: '开始', end: '结束', popupRules: '弹出规则', onEntry: '进入就弹', delayed: '延迟弹出',
  delay: '延迟秒数', delayHint: '不填为 3 秒。8 秒对应原型里的 After 8 seconds。',
  frequency: '频率', onceVisitor: '每位访客一次', everyOpen: '每次打开', onceDay: '每天一次',
  everyone: '所有人', guests: '游客和新客', returning: '回头客', pages: '页面', homeOnly: '仅首页', allPages: '全站',
  cancel: '取消', save: '保存', saved: '已保存', failed: '保存失败，请检查填写内容',
  pause: '暂停', resume: '启用', always: '一直展示',
} : {
  title: 'Banners & Pop-ups', slides: 'Hero Carousel', popups: 'Pop-ups',
  slideHint: 'Template uses your photo plus live English and Chinese text. Image only is a finished promo. Autoplay 6 s, up to 5 live slides.',
  popupHint: 'Only one scheduled or active pop-up can overlap in time.',
  newSlide: '+ New Slide', newPopup: '+ New Pop-up', slideNo: 'Slide', template: 'Template', imageOnly: 'Image only',
  noImage: 'Image only · no image yet', edit: 'Edit', emptySlides: 'No slides yet', emptyPopups: 'No pop-ups yet',
  popup: 'Pop-up', trigger: 'Trigger', audience: 'Audience', period: 'Period', status: 'Status', actions: 'Actions', untitled: 'Untitled',
  slideType: 'Slide type', templateOption: 'Template – photo background + live text', imageOption: 'Image only – text designed into the image',
  templateHint: 'Text stays sharp and is easy to translate. Keep the left 40% of the photo calm.',
  imageHint: 'Use a finished promo. English is required; add Chinese and mobile crops so phones do not cut the text.',
  images: 'Images', desktop: 'Desktop background', mobile: 'Mobile background', desktopEn: 'Desktop · English', mobileEn: 'Mobile · English',
  desktopZh: 'Desktop · 中文', mobileZh: 'Mobile · 中文', popupImage: 'Pop-up image', upload: 'Upload',
  altEn: 'Alt text (English)', altZh: 'Alt text (中文)',
  textEn: 'Text (English)', textZh: 'Text (中文)', eyebrow: 'Category label', eyebrowZh: '眉题',
  button: 'CTA button', buttonZh: '按钮', headline: 'Headline line 1', headline2: 'Headline line 2',
  headlineZh: '标题第一行', headline2Zh: '标题第二行', subtitle: 'Subtitle', subtitleZh: '副标题',
  offer: 'Offer card (optional)', offerZh: '优惠条（可选）',
  linkSchedule: 'Link & schedule', link: 'Linked offer / page', coupon: 'Coupon', page: 'Page', service: 'Service',
  category: 'Category', sku: 'SKU id', campaign: 'Campaign', url: 'URL', alsoCoupon: 'Also attach a coupon',
  couponHint: 'The slide goes offline when the linked coupon or campaign ends. Offer wording must match the coupon.',
  start: 'Start', end: 'End', popupRules: 'Pop-up rules', onEntry: 'On entry', delayed: 'After a delay',
  delay: 'Delay seconds', delayHint: 'Blank means 3 seconds. 8 seconds is the prototype’s After 8 seconds.',
  frequency: 'Frequency', onceVisitor: 'Once per visitor', everyOpen: 'Every visit', onceDay: 'Once per day',
  everyone: 'Everyone', guests: 'Guests & new customers', returning: 'Returning customers', pages: 'Pages', homeOnly: 'Home', allPages: 'All pages',
  cancel: 'Cancel', save: 'Save', saved: 'Saved', failed: 'Could not save. Check the form.',
  pause: 'Pause', resume: 'Enable', always: 'Always on',
}));

const tab = ref<'slides' | 'popups'>('slides');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const drawer = ref(false);
const slides = ref<Card[]>([]);
const popups = ref<Card[]>([]);
const coupons = ref<Coded[]>([]);
const campaigns = ref<Named[]>([]);
const categories = ref<Named[]>([]);
const services = ref<Named[]>([]);
const serviceLoading = ref(false);

const form = reactive(blank());

const statuses = computed(() => zhOptions([
  [0, '草稿', 'Draft'], [1, '已安排', 'Scheduled'], [2, '启用', 'Active'], [3, '暂停', 'Paused'],
]));
const linkTypes = computed(() => {
  const items: Array<[number, string, string]> = [
    [1, '优惠券', 'Coupon'], [2, '页面', 'Page'], [3, '服务', 'Service'],
    [4, '类别', 'Category'], [5, '规格', 'SKU'], [7, '限时活动', 'Campaign'], [6, '外链', 'URL'],
  ];
  if (form.slot === 4) items.unshift([0, '无跳转', 'No link']);
  return zhOptions(items);
});
const pages = computed(() => zhOptions([
  ['home', '首页', 'Home'], ['services', '全部服务', 'All services'], ['packages', '套餐', 'Packages'],
]).map((item) => ({ value: String(item.value), label: item.label })));

function zhOptions(items: Array<[number | string, string, string]>) {
  return items.map(([value, labelZh, labelEn]) => ({ value, label: zh.value ? labelZh : labelEn }));
}
function text(map: Record<string, string> | undefined, fallback?: string, empty?: string) {
  const language = String(locale.value || 'zh').split('-')[0];
  return map?.[language] || map?.zh || map?.en || fallback || empty || '';
}
function blank() {
  return {
    id: undefined as number | undefined,
    slot: 3,
    cardStyle: 1,
    linkType: 2,
    status: 0,
    validStart: '',
    validEnd: '',
    eyebrowEn: '', eyebrowZh: '', titleEn: '', titleZh: '', title2En: '', title2Zh: '',
    subtitleEn: '', subtitleZh: '', badgeEn: '', badgeZh: '', buttonEn: 'Book Now', buttonZh: '立即预约',
    altEn: '', altZh: '',
    pcImageUrl: '', mobileImageUrl: '', pcImageUrlZh: '', mobileImageUrlZh: '',
    couponCode: '', pageCode: 'home', spuId: undefined as number | undefined,
    categoryId: undefined as number | undefined, skuId: undefined as number | undefined,
    campaignId: undefined as number | undefined, externalUrl: '',
    popupTrigger: 1, popupDelaySeconds: 8, popupFrequency: 1, popupAudience: 1, popupPages: 1,
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
function optionId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}
function day(value?: string) {
  return value ? String(value).slice(0, 10) : '';
}
function i18n(en: string, chinese: string) {
  const map: Record<string, string> = {};
  if (en.trim()) map.en = en.trim();
  if (chinese.trim()) map.zh = chinese.trim();
  return Object.keys(map).length ? map : undefined;
}
function read(map: Record<string, string> | undefined, language: 'en' | 'zh') {
  return map?.[language] || '';
}
function statusLabel(status?: number) {
  return statuses.value.find((item) => item.value === status)?.label || '—';
}
function statusClass(row: Card) {
  const status = row.displayStatus || '';
  return ['tag', status === 'LIVE' || row.status === 2 ? 'on' : status === 'PAUSED' || row.status === 3 ? 'paused' : status === 'SCHEDULED' || row.status === 1 ? 'soon' : 'draft'];
}
function actionLabel(action?: string) {
  if (action === 'PAUSE') return copy.value.pause;
  return copy.value.resume;
}
function period(row: Card) {
  const start = day(row.validStart);
  const end = day(row.validEnd);
  if (!start && !end) return copy.value.always;
  return `${start || '—'} → ${end || '—'}`;
}
function triggerLabel(row: Card) {
  if (row.popupTrigger === 2) return `${copy.value.delayed} · ${row.popupDelaySeconds || 3}s`;
  return copy.value.onEntry;
}
function frequencyLabel(value?: number) {
  if (value === 2) return copy.value.everyOpen;
  if (value === 3) return copy.value.onceDay;
  return copy.value.onceVisitor;
}
function audienceLabel(value?: number) {
  if (value === 2) return copy.value.guests;
  if (value === 3) return copy.value.returning;
  return copy.value.everyone;
}
function pagesLabel(value?: number) {
  return value === 2 ? copy.value.allPages : copy.value.homeOnly;
}
function linkSummary(row: Card) {
  if (row.couponCode && row.linkType !== 1) return `${row.couponCode} → ${row.pageCode || row.externalUrl || row.spuId || ''}`;
  if (row.linkType === 1) return row.couponCode || '';
  if (row.linkType === 6) return row.externalUrl || '';
  if (row.linkType === 2) return row.pageCode || '';
  return '';
}
function visualStyle(row: Card) {
  const image = row.pcImageUrl || row.mobileImageUrl;
  if (row.cardStyle === 2 && image) return { backgroundImage: `url(${image})` };
  if (image) return { backgroundImage: `linear-gradient(90deg, rgba(6,24,47,.86) 38%, rgba(6,24,47,.15)), url(${image})` };
  return { background: 'linear-gradient(110deg, #06182f 30%, #3a5a7a)' };
}
function imageStyle(url: string) {
  return url ? { backgroundImage: `url(${url})` } : {};
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [bannerPage, popupPage] = await Promise.all([
      promotionPage({ slot: 3, pageNum: 1, pageSize: 100 }),
      promotionPage({ slot: 4, pageNum: 1, pageSize: 100 }),
    ]);
    slides.value = listOf(bannerPage).sort((a: Card, b: Card) => Number(a.sortNo || 0) - Number(b.sortNo || 0));
    popups.value = listOf(popupPage).sort((a: Card, b: Card) => Number(a.sortNo || 0) - Number(b.sortNo || 0));
  } catch (reason: any) {
    slides.value = [];
    popups.value = [];
    error.value = reason?.message || copy.value.failed;
  } finally {
    loading.value = false;
  }
}
async function loadChoices() {
  const [couponResult, campaignResult, categoryResult] = await Promise.all([
    couponPage({ pageNum: 1, pageSize: 100 }),
    campaignPage({ pageNum: 1, pageSize: 100 }),
    categoryPage({ pageNum: 1, pageSize: 200, level: '1' }),
  ]);
  coupons.value = listOf(couponResult).flatMap((item: any) => {
    const code = String(item.couponCode || '').trim();
    if (!code) return [];
    return [{ code, label: `${code} · ${text(item.nameI18n, item.name || '')}` }];
  });
  campaigns.value = listOf(campaignResult).flatMap((item: any) => {
    const id = optionId(item.id);
    if (!id) return [];
    return [{ id, label: text(item.nameI18n, item.name || String(id)) }];
  });
  categories.value = listOf(categoryResult).flatMap((item: any) => {
    const id = optionId(item.category?.id ?? item.id);
    if (!id) return [];
    return [{ id, label: text(item.nameI18n || item.category?.nameI18n, item.category?.name || item.name || String(id)) }];
  });
}
async function searchServices(query: string) {
  serviceLoading.value = true;
  try {
    const records = listOf(await servicePage({ pageNum: 1, pageSize: 20, nameKeyword: query.trim() || undefined }));
    const selected = services.value.filter((item) => item.id === form.spuId);
    const next = records.flatMap((item: any) => {
      const id = optionId(item.spu?.id ?? item.id);
      if (!id) return [];
      return [{ id, label: text(item.nameI18n, item.spu?.spuName || String(id)) }];
    });
    services.value = [...selected, ...next.filter((item) => !selected.some((kept) => kept.id === item.id))];
  } finally {
    serviceLoading.value = false;
  }
}
function openCreate(slot: 3 | 4) {
  Object.assign(form, blank(), { slot, linkType: slot === 4 ? 0 : 2 });
  drawer.value = true;
  loadChoices().catch(() => undefined);
}
async function openEdit(id: number) {
  const detail = body<Card>(await promotionDetail(id));
  Object.assign(form, blank(), {
    id: detail.id,
    slot: detail.slot || 3,
    cardStyle: detail.cardStyle || 1,
    linkType: detail.linkType ?? (detail.slot === 4 ? 0 : 2),
    status: detail.status ?? 0,
    validStart: day(detail.validStart),
    validEnd: day(detail.validEnd),
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
    altEn: read(detail.altI18n, 'en'),
    altZh: read(detail.altI18n, 'zh'),
    pcImageUrl: detail.pcImageUrl || '',
    mobileImageUrl: detail.mobileImageUrl || '',
    pcImageUrlZh: detail.pcImageUrlZh || '',
    mobileImageUrlZh: detail.mobileImageUrlZh || '',
    couponCode: detail.couponCode || '',
    pageCode: detail.pageCode || 'home',
    spuId: detail.spuId,
    categoryId: detail.categoryId,
    skuId: detail.skuId,
    campaignId: detail.campaignId,
    externalUrl: detail.externalUrl || '',
    popupTrigger: detail.popupTrigger || 1,
    popupDelaySeconds: detail.popupDelaySeconds || 8,
    popupFrequency: detail.popupFrequency || 1,
    popupAudience: detail.popupAudience || 1,
    popupPages: detail.popupPages || 1,
  });
  drawer.value = true;
  await loadChoices().catch(() => undefined);
  if (form.spuId) await searchServices('');
}
function uploadTo(field: 'pcImageUrl' | 'mobileImageUrl' | 'pcImageUrlZh' | 'mobileImageUrlZh') {
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
  if ((form.slot === 4 || form.cardStyle === 1) && !form.titleEn.trim() && !form.titleZh.trim()) {
    ElMessage.warning(zh.value ? '请填写标题' : 'Headline is required');
    return;
  }
  if (form.slot === 3 && form.cardStyle === 1 && form.linkType !== 0 && !form.buttonEn.trim() && !form.buttonZh.trim()) {
    ElMessage.warning(zh.value ? '请填写按钮文字' : 'Button text is required');
    return;
  }
  if (form.slot === 3 && form.cardStyle === 2 && !form.pcImageUrl && !form.mobileImageUrl) {
    ElMessage.warning(zh.value ? '请至少上传一张英文成品图' : 'Upload at least one English image');
    return;
  }
  if (form.slot === 3 && form.cardStyle === 2 && !form.altEn.trim()) {
    ElMessage.warning(zh.value ? '请填写英文替代文字' : 'Add English alt text');
    return;
  }
  if (form.slot === 3 && form.linkType === 0) {
    ElMessage.warning(zh.value ? '请设置按钮跳转' : 'Choose where the button goes');
    return;
  }
  if (form.linkType === 1 && !form.couponCode.trim()) {
    ElMessage.warning(zh.value ? '请选择优惠券' : 'Choose a coupon');
    return;
  }
  if (form.linkType === 2 && !form.pageCode.trim()) {
    ElMessage.warning(zh.value ? '请选择页面' : 'Choose a page');
    return;
  }
  if (form.linkType === 3 && !form.spuId) {
    ElMessage.warning(zh.value ? '请选择服务' : 'Choose a service');
    return;
  }
  if (form.linkType === 4 && !form.categoryId) {
    ElMessage.warning(zh.value ? '请选择类别' : 'Choose a category');
    return;
  }
  if (form.linkType === 5 && !form.skuId) {
    ElMessage.warning(zh.value ? '请填写规格编号' : 'Enter a SKU id');
    return;
  }
  if (form.linkType === 6 && !form.externalUrl.trim()) {
    ElMessage.warning(zh.value ? '请填写外链' : 'Enter a URL');
    return;
  }
  if (form.linkType === 7 && !form.campaignId) {
    ElMessage.warning(zh.value ? '请选择限时活动' : 'Choose a campaign');
    return;
  }
  const payload: PromotionSavePayload = {
    id: form.id,
    slot: form.slot,
    cardStyle: form.slot === 4 ? 1 : form.cardStyle,
    linkType: form.linkType,
    status: form.status,
    validStart: form.validStart || undefined,
    validEnd: form.validEnd || undefined,
    eyebrowI18n: i18n(form.eyebrowEn, form.eyebrowZh),
    titleI18n: i18n(form.titleEn, form.titleZh),
    titleLine2I18n: i18n(form.title2En, form.title2Zh),
    subtitleI18n: i18n(form.subtitleEn, form.subtitleZh),
    badgeI18n: i18n(form.badgeEn, form.badgeZh),
    buttonI18n: i18n(form.buttonEn, form.buttonZh),
    altI18n: i18n(form.altEn, form.altZh),
    pcImageUrl: form.pcImageUrl || undefined,
    mobileImageUrl: form.mobileImageUrl || undefined,
    pcImageUrlZh: form.pcImageUrlZh || undefined,
    mobileImageUrlZh: form.mobileImageUrlZh || undefined,
    couponCode: form.couponCode || undefined,
    pageCode: form.linkType === 2 ? form.pageCode || undefined : undefined,
    spuId: form.linkType === 3 ? form.spuId : undefined,
    categoryId: form.linkType === 4 ? form.categoryId : undefined,
    skuId: form.linkType === 5 ? form.skuId : undefined,
    campaignId: form.linkType === 7 ? form.campaignId : undefined,
    externalUrl: form.linkType === 6 ? form.externalUrl || undefined : undefined,
  };
  if (form.slot === 4) {
    payload.popupTrigger = form.popupTrigger;
    payload.popupDelaySeconds = form.popupTrigger === 2 ? form.popupDelaySeconds : undefined;
    payload.popupFrequency = form.popupFrequency;
    payload.popupAudience = form.popupAudience;
    payload.popupPages = form.popupPages;
  }
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

onMounted(load);
</script>

<style scoped>
.banner-page { display: flex; flex-direction: column; gap: 16px; }
.banner-page__head p { margin: 0; color: #0a7a6a; font-size: 11px; font-weight: 700; letter-spacing: 2px; }
.banner-page__head h1 { margin: 2px 0 0; font-size: 26px; }
.tabs { display: flex; gap: 8px; }
.tabs button { border: 1px solid #e3eaf2; background: #fff; border-radius: 10px; padding: 8px 16px; font-weight: 700; cursor: pointer; }
.tabs button.on { background: #06182f; color: #fff; border-color: #06182f; }
.toolbar { display: flex; align-items: center; gap: 16px; }
.toolbar p { margin: 0; color: #6b7a90; font-size: 13px; }
.slides { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.slide { overflow: hidden; border: 1px solid #e3eaf2; border-radius: 14px; background: #fff; }
.slide__visual { min-height: 150px; padding: 18px 20px; color: #fff; background-position: center; background-size: cover; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.slide__visual small { letter-spacing: 2px; font-size: 10px; font-weight: 700; opacity: .85; }
.slide__visual b { font-size: 20px; line-height: 1.2; }
.slide__visual em { color: #39dcc6; font-style: normal; }
.slide__visual span { font-size: 12px; opacity: .85; }
.slide__visual strong { width: fit-content; margin-top: 6px; padding: 4px 8px; border-radius: 8px; color: #06182f; background: #fff; font-size: 11px; }
.slide__meta { padding: 12px 14px; font-size: 12.5px; }
.slide__meta > div:first-child { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.slide__meta p { margin: 6px 0 0; color: #6b7a90; }
.slide__actions { display: flex; gap: 6px; align-items: center; margin-top: 8px; }
.board { padding: 8px 12px 16px; border: 1px solid #e3eaf2; border-radius: 16px; background: #fff; }
.board b, .slide__meta b { display: block; }
.board small, .code { color: #6b7a90; }
.code { margin-left: 8px; padding: 2px 8px; border-radius: 6px; background: #eef2f7; color: #0f1b2d; font-weight: 700; }
.tag { border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.tag.on { color: #0a7a6a; background: #e8faf7; }
.tag.soon { color: #2d5bd3; background: #eef3ff; }
.tag.paused { color: #b54708; background: #fff4e5; }
.tag.draft { color: #5b6676; background: #eef2f7; }
.empty { color: #6b7a90; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid.three { grid-template-columns: 1fr 1fr 1fr; }
h3 { margin: 18px 0 8px; font-size: 15px; }
.hint, .grid small { display: block; margin-top: 4px; color: #6b7a90; }
.upload { width: 180px; height: 90px; border: 1.5px dashed #e3eaf2; border-radius: 12px; background: #f8fafd center/cover no-repeat; display: grid; place-items: center; color: #6b7a90; }
@media (max-width: 1100px) { .slides, .grid, .grid.three { grid-template-columns: 1fr; } }
</style>
