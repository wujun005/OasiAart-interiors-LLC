<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-fields">
          <el-select
            v-model="query.categoryId"
            :placeholder="t('admin.packageList.filters.category')"
            clearable
            filterable
          >
            <el-option v-for="item in categoryOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <el-select v-model="query.status" :placeholder="t('admin.packageList.filters.status')" clearable>
            <el-option :label="t('admin.packageList.sale.on')" :value="1" />
            <el-option :label="t('admin.packageList.sale.off')" :value="0" />
          </el-select>
          <el-input
            v-model="query.nameKeyword"
            :placeholder="t('admin.packageList.filters.name')"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="toolbar-actions">
          <el-button type="primary" @click="handleSearch">{{ t('admin.packageList.actions.search') }}</el-button>
          <el-button @click="reset">{{ t('admin.packageList.actions.reset') }}</el-button>
          <el-button type="primary" @click="openCreate">{{ t('admin.packageList.actions.create') }}</el-button>
        </div>
      </div>

      <el-table
        :data="rows"
        border
        row-key="id"
        v-loading="tableLoading || sortSubmitting"
        :row-class-name="rowClassName"
        @dragover.prevent="handleDragOver"
        @drop.prevent="handleDrop"
      >
        <el-table-column :label="t('admin.packageList.table.sort')" width="64" align="center">
          <template #default="{ row }">
            <button
              class="sort-handle"
              type="button"
              :draggable="canSort && !tableLoading && !sortSubmitting"
              :disabled="!canSort || tableLoading || sortSubmitting"
              :title="t('admin.packageList.table.sortHint')"
              :aria-label="`${t('admin.packageList.table.sort')}: ${row.name}`"
              @dragstart.stop="handleDragStart(row, $event)"
              @dragend.stop="resetDrag"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="8" cy="6" r="1.5" />
                <circle cx="16" cy="6" r="1.5" />
                <circle cx="8" cy="12" r="1.5" />
                <circle cx="16" cy="12" r="1.5" />
                <circle cx="8" cy="18" r="1.5" />
                <circle cx="16" cy="18" r="1.5" />
              </svg>
            </button>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.image')" width="76">
          <template #default="{ row }">
            <div class="thumbs">
              <img v-if="row.images[0]" :src="row.images[0]" alt="" />
              <span v-else>-</span>
              <span v-if="row.images.length > 1" class="more">+{{ row.images.length - 1 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.name')" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.category')" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.categoryName || '-' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.services')" min-width="220">
          <template #default="{ row }">
            <ul v-if="row.services.length" class="bound-services">
              <li v-for="service in row.services" :key="service.key" class="bound-service">
                <RouterLink
                  v-if="service.id != null"
                  :to="{ path: '/admin/package/services', query: { editId: String(service.id) } }"
                >{{ service.name }}</RouterLink>
                <span v-else>{{ service.name }}</span>
              </li>
            </ul>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.status')" width="92">
          <template #default="{ row }">
            <span class="sale-status-button" :class="row.onShelf ? 'is-on' : 'is-off'">
              {{ row.onShelf ? t('admin.packageList.sale.on') : t('admin.packageList.sale.off') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.price')" width="120">
          <template #default="{ row }">
            <div class="price">
              <strong>{{ money(row.displaySalePrice) }}</strong>
              <span v-if="struckTotal(row)">{{ money(row.displayTotalPrice) }}</span>
              <em v-if="row.discount != null">{{ discountPercentText(row.discount) }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.createdUpdated')" width="168">
          <template #default="{ row }">
            <div class="date-line">{{ t('admin.packageList.table.createdAt') }}: {{ formatDate(row.createdAt) }}</div>
            <div class="date-line">{{ t('admin.packageList.table.updatedAt') }}: {{ formatDate(row.updatedAt) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageList.table.actions')" width="88" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" size="small" @click="openEdit(row)">{{ t('admin.packageList.actions.edit') }}</el-button>
              <el-button link type="primary" size="small" @click="toggleStatus(row)">
                {{ row.onShelf ? t('admin.packageList.actions.unshelf') : t('admin.packageList.actions.shelf') }}
              </el-button>
              <el-button link type="primary" size="small" :disabled="!row.previewUrl" @click="openPreview(row)">
                {{ t('admin.packageList.actions.preview') }}
              </el-button>
              <el-button link type="danger" size="small" @click="remove(row)">{{ t('admin.packageList.actions.delete') }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          layout="prev, pager, next, jumper, ->, total, sizes"
          :total="total"
          :page-sizes="[10, 20, 50]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('admin.packageList.dialog.editTitle') : t('admin.packageList.dialog.createTitle')"
      :close-on-click-modal="false"
      width="980px"
      top="6vh"
    >
      <el-form :key="formKey" label-width="110px" :disabled="detailLoading || submitLoading" v-loading="detailLoading">
        <el-form-item :label="t('admin.packageList.form.category')" required>
          <el-select v-model="form.categoryId" filterable :placeholder="t('admin.packageList.form.categoryPlaceholder')" style="width: 320px">
            <el-option v-for="item in formCategoryOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.packageList.form.validDays')" required>
          <el-input-number v-model="form.validDays" :min="1" :step="1" :precision="0" />
        </el-form-item>
        <el-form-item :label="t('admin.packageList.form.discount')" required>
          <div class="discount-field">
            <div class="discount-input">
              <el-input-number v-model="form.discountPercent" :min="1" :max="999" :precision="0" :step="1" />
              <span>%</span>
            </div>
            <p class="field-hint">{{ t('admin.packageList.form.discountHint') }}</p>
          </div>
        </el-form-item>
        <el-form-item :label="t('admin.packageList.form.images')">
          <el-upload
            v-model:file-list="imageFiles"
            :http-request="handleImageUpload"
            list-type="picture-card"
            accept="image/*"
            :limit="9"
            :on-exceed="() => ElMessage.warning(t('admin.packageList.message.uploadLimit'))"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('admin.bizTag.label')">
          <div class="biz-tag-picks">
            <span
              v-for="tag in selectedPackageTags"
              :key="tag.id"
              class="biz-tag-chip"
            >
              {{ tagPicker.englishLabel(tag) }}
              <button
                type="button"
                :aria-label="t('admin.bizTag.remove')"
                @click="tagPicker.remove(Number(tag.id))"
              >×</button>
            </span>
            <span
              v-for="(name, index) in pendingTagNames"
              :key="`${name}-${index}`"
              class="biz-tag-chip"
            >
              {{ name }}
              <button
                type="button"
                :aria-label="t('admin.bizTag.remove')"
                @click="pendingTagNames.splice(index, 1)"
              >×</button>
            </span>
            <input
              v-if="tagAdderOpen"
              ref="tagDraftRef"
              v-model="tagDraft"
              class="biz-tag-draft"
              type="text"
              maxlength="64"
              :placeholder="t('admin.bizTag.enPlaceholder')"
              @keydown.enter.prevent="confirmEnglishTag"
              @keydown.esc.prevent="closeTagAdder"
              @blur="confirmEnglishTag"
            />
            <button
              v-else
              type="button"
              class="biz-tag-add"
              :aria-label="t('admin.bizTag.create')"
              @click="openTagAdder"
            >
              <el-icon><Plus /></el-icon>
            </button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.packageList.form.name')">
          <el-input
            v-model="form.name"
            maxlength="128"
            :placeholder="t('admin.packageList.form.namePlaceholder')"
            style="width: 420px"
          />
        </el-form-item>

        <el-form-item v-for="field in textFields" :key="field.key" :label="field.label">
          <div class="i18n-list">
            <div v-for="(item, idx) in field.rows" :key="`${field.key}-${idx}`" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.packageList.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langEnCode')" value="en" />
                <el-option :label="t('admin.common.langZhCn')" value="zh" />
              </el-select>
              <el-input
                v-if="!field.rich"
                v-model="item.value"
                type="textarea"
                :rows="3"
                :placeholder="field.placeholder"
              />
              <div v-else class="quill-wrapper">
                <QuillEditor
                  v-model:content="item.value"
                  content-type="html"
                  theme="snow"
                  :placeholder="field.placeholder"
                />
              </div>
              <el-button link type="danger" :disabled="field.rows.length === 1" @click="field.rows.splice(idx, 1)">
                {{ t('admin.packageList.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addLang(field.rows)">{{ t('admin.packageList.actions.addLang') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.packageList.form.spu')" required>
          <div class="spu-picker">
            <section v-for="(block, index) in spuBlocks" :key="block.key" class="spu-block">
              <div class="spu-block__head">
                <strong>{{ t('admin.packageList.form.serviceIndex', { index: index + 1 }) }}</strong>
                <el-button link type="danger" :disabled="spuBlocks.length === 1" @click="removeBlock(block.key)">
                  {{ t('admin.packageList.actions.removeService') }}
                </el-button>
              </div>
              <div class="field-row">
                <span class="field-label">{{ t('admin.packageList.form.spu') }}</span>
                <el-select
                  :model-value="block.spuId"
                  filterable
                  clearable
                  :loading="spuLoading"
                  :placeholder="t('admin.packageList.form.spuPlaceholder')"
                  @visible-change="(open: boolean) => open && ensureSpus()"
                  @change="(spuId: number | null) => changeSpu(block, spuId)"
                >
                  <el-option v-for="item in spuOptionsFor(block)" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </div>
              <div v-if="block.spuId" class="field-row sku-row">
                <span class="field-label">{{ t('admin.packageList.form.sku') }}</span>
                <div>
                  <ul v-if="block.skus.length" class="sku-list">
                    <li v-for="sku in block.skus" :key="sku.skuId">
                      <span>{{ sku.specLabel }}</span>
                      <span v-if="sku.price != null" class="sku-prices">
                        <span>{{ t('admin.packageList.form.optionPrice') }} {{ money(sku.price) }}</span>
                        <span>{{ t('admin.packageList.form.optionDiscountPrice') }} {{ money(discountedSkuPrice(sku.price)) }}</span>
                      </span>
                      <span v-if="!sku.available">{{ t('admin.packageList.form.unavailable') }}</span>
                    </li>
                  </ul>
                  <p v-else class="field-hint">{{ t('admin.packageList.form.skuEmpty') }}</p>
                  <p class="field-hint">{{ t('admin.packageList.form.skuHint') }}</p>
                </div>
              </div>
              <div v-if="block.spuId" class="field-row">
                <span class="field-label">{{ t('admin.packageList.form.times') }}</span>
                <el-input-number v-model="block.redeemTimes" :min="1" :step="1" :precision="0" />
              </div>
            </section>
            <div class="spu-picker-actions">
              <el-button @click="addServiceBlock">{{ t('admin.packageList.actions.addService') }}</el-button>
              <el-button :loading="spuLoading" @click="refreshSpus">{{ t('admin.packageList.actions.refreshServices') }}</el-button>
              <a href="/admin/package/services" target="_blank" rel="noopener noreferrer">{{ t('admin.packageList.actions.manageServices') }}</a>
            </div>
            <div v-if="hasSelectedService" class="package-total">
              <div>
                <span>{{ t('admin.packageList.form.packageOriginal') }}</span>
                <strong>{{ money(packagePriceSummary.total) }}</strong>
              </div>
              <div>
                <span>{{ t('admin.packageList.form.packageSale') }}</span>
                <strong>{{ money(packagePriceSummary.sale) }}</strong>
              </div>
              <p class="field-hint">{{ t('admin.packageList.form.displayHint') }}</p>
            </div>
          </div>
        </el-form-item>
        <p class="draft-hint">{{ t('admin.packageList.form.draftHint') }}</p>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.packageList.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.packageList.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { UploadRequestOptions, UploadUserFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { useI18n } from 'vue-i18n';
import { getPackageCategoryPage } from '@/modules/admin/api/packageCategory';
import {
  addOrUpdatePackage,
  changePackageStatus,
  deletePackage,
  getPackageDetail,
  getPackagePage,
  sortPackages,
  uploadPackageImage,
} from '@/modules/admin/api/package';
import { listBySpu, page as spuPage } from '@/modules/admin/api/spu';
import { pickI18nText } from '@/modules/admin/utils/i18n';
import { useBizTagPicker } from '@/modules/admin/utils/bizTagPicker';
import { bizTagsByRef } from '@/modules/admin/api/bizTag';
import type { BizTag } from '@/modules/client/utils/biz-tag';

const LANG_ZH = 'zh';
const LANG_EN = 'en';
const route = useRoute();
const router = useRouter();
const packageListPath = '/admin/package/packages';
const positiveId = (value: unknown): number | null => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const tagPicker = useBizTagPicker();
const tagAdderOpen = ref(false);
const tagDraft = ref('');
const tagDraftRef = ref<HTMLInputElement | null>(null);
const pendingTagNames = ref<string[]>([]);
const selectedPackageTags = computed(() =>
  tagPicker.selectedIds.value
    .map((id) => tagPicker.options.value.find((tag) => Number(tag.id) === id))
    .filter((tag): tag is BizTag => Boolean(tag)),
);
const openTagAdder = () => {
  tagDraft.value = '';
  tagAdderOpen.value = true;
  nextTick(() => tagDraftRef.value?.focus());
};
const closeTagAdder = () => {
  tagDraft.value = '';
  tagAdderOpen.value = false;
};
const confirmEnglishTag = () => {
  if (!tagAdderOpen.value) return;
  const name = tagDraft.value.trim();
  if (!name) {
    closeTagAdder();
    return;
  }
  const existing = tagPicker.options.value.find(
    (tag) => tagPicker.englishLabel(tag).toLowerCase() === name.toLowerCase(),
  );
  const existingId = Number(existing?.id);
  if (existingId > 0) tagPicker.select(existingId);
  else if (!pendingTagNames.value.some((item) => item.toLowerCase() === name.toLowerCase())) {
    pendingTagNames.value.push(name);
  }
  closeTagAdder();
};

type LangRow = { lang: string; value: string };
type CategoryOption = { id: number; label: string; enabled: boolean };
type PackageRow = {
  id: number;
  name: string;
  categoryName: string;
  services: Array<{ key: string; id: number | null; name: string }>;
  images: string[];
  previewUrl: string;
  onShelf: boolean;
  discount: number | null;
  displayTotalPrice: number | null;
  displaySalePrice: number | null;
  displaySavedPrice: number | null;
  createdAt: string;
  updatedAt: string;
};
type SkuRow = {
  skuId: number;
  specLabel: string;
  price: number | null;
  redeemTimes: number;
  available: boolean;
};
type SpuOption = { id: number; name: string };
type SpuCatalogItem = {
  id: number;
  nameI18n?: Record<string, string>;
  fallbackName: string;
};
type SpuBlock = {
  key: number;
  spuId: number | null;
  spuName: string;
  redeemTimes: number;
  skus: SkuRow[];
  skuSeq: number;
};
type SavedSku = {
  skuId: number;
  redeemTimes: number;
  available: boolean;
  specLabel: string;
  price: number | null;
};

const { locale, t } = useI18n({ useScope: 'global' });
const normalizeLang = (lang: string) => {
  if (lang === 'zh-CN' || lang === 'zh') return LANG_ZH;
  if (lang === 'en-US' || lang === 'en') return LANG_EN;
  return lang;
};
const unwrap = (payload: any) => payload?.data ?? payload ?? {};
const defaultLangRows = (): LangRow[] => [{ lang: LANG_EN, value: '' }];
const toLangRows = (map?: Record<string, string>) => {
  const merged = new Map<string, string>();
  Object.entries(map || {}).forEach(([lang, value]) => {
    const key = normalizeLang(lang);
    const text = typeof value === 'string' ? value.trim() : '';
    if (!key || !text || merged.has(key)) return;
    merged.set(key, text);
  });
  const rows = [{ lang: LANG_EN, value: merged.get(LANG_EN) || '' }];
  const chinese = merged.get(LANG_ZH);
  if (chinese) rows.push({ lang: LANG_ZH, value: chinese });
  merged.forEach((value, lang) => {
    if (lang !== LANG_EN && lang !== LANG_ZH) rows.push({ lang, value });
  });
  return rows;
};
const isRichTextEmpty = (html?: string) => {
  if (!html) return true;
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
  return text.length === 0;
};
const plainText = (html?: string) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};
const rowsToMap = (rows: LangRow[], rich = false) => rows.reduce<Record<string, string>>((acc, item) => {
  const lang = normalizeLang(item.lang);
  const value = item.value?.trim();
  if (!lang || !value || (rich && isRichTextEmpty(value))) return acc;
  acc[lang] = value;
  return acc;
}, {});

const rows = ref<PackageRow[]>([]);
const categoryOptions = ref<CategoryOption[]>([]);
const query = reactive({
  nameKeyword: '',
  categoryId: null as number | null,
  status: null as number | null,
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const tableLoading = ref(false);
const sortSubmitting = ref(false);
const draggedId = ref<number | null>(null);
const dragOverId = ref<number | null>(null);
const hasFilters = computed(() => Boolean(
  query.nameKeyword.trim() || query.categoryId || query.status === 0 || query.status === 1,
));
const loadedFiltered = ref(true);
const canSort = computed(() => !hasFilters.value && !loadedFiltered.value);

const boundServices = (items: any): PackageRow['services'] => {
  const seen = new Set<string>();
  return (Array.isArray(items) ? items : []).flatMap((item: any, index: number) => {
    if (!item || typeof item !== 'object') return [];
    const id = positiveId(item.spuId);
    const hasId = id != null;
    const name = plainText(pickI18nText(item.spuNameI18n, locale.value, item.spuName || ''));
    if (!hasId && !name) return [];
    const key = hasId ? `spu:${id}` : `name:${name}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      key,
      id,
      name: name || t('admin.packageList.message.serviceFallback', { index: index + 1 }),
    }];
  });
};

const mapRow = (item: any): PackageRow => ({
  id: Number(item.id),
  name: plainText(pickI18nText(item.nameI18n, locale.value, item.packageName || '')),
  categoryName: pickI18nText(item.categoryNameI18n, locale.value, ''),
  services: boundServices(item.items),
  images: Array.isArray(item.imageUrls) ? item.imageUrls.filter(Boolean) : [],
  previewUrl: typeof item.previewUrl === 'string' ? item.previewUrl : '',
  onShelf: Number(item.status) === 1,
  discount: moneyNumber(item.discount),
  displayTotalPrice: moneyNumber(item.displayTotalPrice),
  displaySalePrice: moneyNumber(item.displaySalePrice),
  displaySavedPrice: moneyNumber(item.displaySavedPrice),
  createdAt: item.createTime || '',
  updatedAt: item.modifyTime || '',
});

const fetchCategories = async () => {
  try {
    const res = await getPackageCategoryPage({ pageNum: 1, pageSize: 200 });
    const data = unwrap(res);
    const list = Array.isArray(data.list) ? data.list : [];
    categoryOptions.value = list.map((item: any) => {
      const category = item.category || item;
      return {
        id: Number(category.id),
        label: pickI18nText(item.nameI18n, locale.value, category.categoryName || ''),
        enabled: Number(category.status) === 1,
      };
    }).filter((item: CategoryOption) => item.id);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packageList.message.categoryFailed'));
  }
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const filtered = hasFilters.value;
    const payload: Record<string, unknown> = {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    };
    if (query.nameKeyword.trim()) payload.nameKeyword = query.nameKeyword.trim();
    if (query.categoryId) payload.categoryId = query.categoryId;
    if (query.status === 0 || query.status === 1) payload.status = query.status;
    const res = await getPackagePage(payload);
    const data = unwrap(res);
    const list = Array.isArray(data.list) ? data.list : [];
    rows.value = list.map(mapRow);
    total.value = Number(data.total ?? list.length);
    loadedFiltered.value = filtered;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packageList.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchList();
};
const reset = () => {
  query.nameKeyword = '';
  query.categoryId = null;
  query.status = null;
  query.pageNum = 1;
  query.pageSize = 10;
  fetchList();
};
const onPageChange = (page: number) => {
  query.pageNum = page;
  fetchList();
};
const onSizeChange = (size: number) => {
  query.pageSize = size;
  query.pageNum = 1;
  fetchList();
};

const rowClassName = ({ row }: { row: PackageRow }) =>
  canSort.value && row.id === dragOverId.value && row.id !== draggedId.value ? 'sort-row--target' : '';
const dropIndex = (event: DragEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return -1;
  const row = target.closest('tbody tr');
  const body = row?.parentElement;
  if (!row || body?.tagName !== 'TBODY') return -1;
  return Array.from(body.children).indexOf(row);
};
const handleDragStart = (row: PackageRow, event: DragEvent) => {
  if (!canSort.value || tableLoading.value || sortSubmitting.value) {
    event.preventDefault();
    return;
  }
  draggedId.value = row.id;
  dragOverId.value = row.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(row.id));
  }
};
const handleDragOver = (event: DragEvent) => {
  if (!canSort.value || draggedId.value === null || sortSubmitting.value) return;
  const index = dropIndex(event);
  if (index < 0 || index >= rows.value.length) return;
  dragOverId.value = rows.value[index]?.id ?? null;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
};
const resetDrag = () => {
  draggedId.value = null;
  dragOverId.value = null;
};
const handleDrop = async (event: DragEvent) => {
  const sourceId = draggedId.value;
  const target = dropIndex(event);
  if (!canSort.value || sourceId === null || target < 0 || target >= rows.value.length || sortSubmitting.value) {
    resetDrag();
    return;
  }
  const source = rows.value.findIndex((item) => item.id === sourceId);
  if (source < 0 || source === target) {
    resetDrag();
    return;
  }
  const previous = [...rows.value];
  const next = [...rows.value];
  const [moved] = next.splice(source, 1);
  if (!moved) {
    resetDrag();
    return;
  }
  next.splice(target, 0, moved);
  rows.value = next;
  resetDrag();
  sortSubmitting.value = true;
  try {
    await sortPackages(next.map((item) => item.id));
    ElMessage.success(t('admin.packageList.message.sortSuccess'));
  } catch (error: any) {
    rows.value = previous;
    ElMessage.error(error?.message || t('admin.packageList.message.sortFailed'));
  } finally {
    sortSubmitting.value = false;
  }
};

const moneyNumber = (value: unknown) => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const money = (value?: number | null) => (value == null || Number.isNaN(Number(value)) ? '-' : Number(value).toFixed(2));
const struckTotal = (row: PackageRow) =>
  row.displayTotalPrice != null
  && row.displaySalePrice != null
  && row.displayTotalPrice > row.displaySalePrice;
const discountPercentText = (multiplier: number) => `${Math.round(multiplier * 100)}%`;
const percentToDiscount = (percent: number) => Number((percent / 100).toFixed(2));
const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const toggleStatus = async (row: PackageRow) => {
  const next = row.onShelf ? 0 : 1;
  try {
    await changePackageStatus({ id: row.id, status: next });
    row.onShelf = next === 1;
    ElMessage.success(next === 1 ? t('admin.packageList.sale.on') : t('admin.packageList.sale.off'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packageList.message.statusFailed'));
  }
};

const openPreview = (row: PackageRow) => {
  if (!row.previewUrl) return;
  window.open(row.previewUrl, '_blank', 'noopener');
};

const remove = (row: PackageRow) => {
  ElMessageBox.confirm(
    t('admin.packageList.message.deleteConfirm', { label: row.name || String(row.id) }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deletePackage({ id: row.id }))
    .then((res: any) => {
      const result = unwrap(res);
      const message = result?.message || t('admin.packageList.message.deleteSuccess');
      if (result?.action === 'OFF_SHELF') ElMessage.warning(message);
      else ElMessage.success(message);
      fetchList();
    })
    .catch((error: any) => {
      if (error === 'cancel' || error === 'close') return;
      ElMessage.error(error?.message || t('admin.packageList.message.deleteFailed'));
    });
};

const dialogVisible = ref(false);
const formKey = ref(0);
const isEdit = ref(false);
const detailLoading = ref(false);
const submitLoading = ref(false);
const editingId = ref<number | null>(null);
let detailRequestVersion = 0;
let linkedEditId: number | null = null;
let editLinkReady = false;
let componentActive = false;
const form = reactive({
  categoryId: null as number | null,
  validDays: 30,
  discountPercent: 100 as number | null,
  displayTotalPrice: null as number | null,
  displaySalePrice: null as number | null,
  displaySavedPrice: null as number | null,
  name: '',
});
const loadedNameI18n = ref<Record<string, string>>({});
const descRows = ref<LangRow[]>(defaultLangRows());
const serviceRows = ref<LangRow[]>(defaultLangRows());
const noticeRows = ref<LangRow[]>(defaultLangRows());
const imageFiles = ref<UploadUserFile[]>([]);
const spuBlocks = ref<SpuBlock[]>([]);
const spuLoading = ref(false);
const spuCatalog = ref<SpuCatalogItem[]>([]);
const spuCatalogLoaded = ref(false);
let spuCatalogInflight: Promise<void> | null = null;
const skuCatalogInflight = new Map<number, Promise<{ specTypes: any[]; skus: any[] }>>();
let serviceBlockSeed = 1;

const spuOptions = computed<SpuOption[]>(() => spuCatalog.value.map((item) => ({
  id: item.id,
  name: pickI18nText(item.nameI18n, locale.value, item.fallbackName),
})));

const spuOptionsFor = (block: SpuBlock) => {
  const options = [...spuOptions.value];
  if (block.spuId && !options.some((item) => item.id === block.spuId)) {
    options.unshift({ id: block.spuId, name: block.spuName || String(block.spuId) });
  }
  return options;
};

const formCategoryOptions = computed(() => {
  const enabled = categoryOptions.value.filter((item) => item.enabled);
  const current = categoryOptions.value.find((item) => item.id === form.categoryId);
  if (current && !enabled.some((item) => item.id === current.id)) return [current, ...enabled];
  return enabled;
});
const packageNamePayload = () => {
  const name = form.name.trim();
  if (!name) return {};
  const original = loadedNameI18n.value || {};
  if (name === packageNameText(original) && Object.keys(original).length) {
    const next = { ...original };
    if (!String(next.en || '').trim()) next.en = name;
    return next;
  }
  return { en: name };
};
const packageNameText = (map?: Record<string, string>) => {
  const rows = toLangRows(map);
  const english = rows.find((row) => row.lang === LANG_EN && row.value);
  const source = english || rows.find((row) => row.value);
  return plainText(source?.value || '');
};
const textFields = computed(() => [
  { key: 'desc', label: t('admin.packageList.form.desc'), rows: descRows.value, rich: false, placeholder: t('admin.packageList.form.textPlaceholder') },
  { key: 'service', label: t('admin.packageList.form.serviceContent'), rows: serviceRows.value, rich: true, placeholder: t('admin.packageList.form.serviceContentPlaceholder') },
  { key: 'notice', label: t('admin.packageList.form.bookingNotice'), rows: noticeRows.value, rich: true, placeholder: t('admin.packageList.form.textPlaceholder') },
]);

const addLang = (target: LangRow[]) => {
  const used = new Set(target.map((item) => normalizeLang(item.lang)));
  target.push({ lang: used.has(LANG_ZH) ? '' : LANG_ZH, value: '' });
};

const blankServiceBlock = (): SpuBlock => ({
  key: serviceBlockSeed++,
  spuId: null,
  spuName: '',
  redeemTimes: 1,
  skus: [],
  skuSeq: 0,
});

const resetForm = () => {
  editingId.value = null;
  form.categoryId = null;
  form.validDays = 30;
  form.discountPercent = 100;
  form.displayTotalPrice = null;
  form.displaySalePrice = null;
  form.displaySavedPrice = null;
  form.name = '';
  loadedNameI18n.value = {};
  descRows.value = defaultLangRows();
  serviceRows.value = defaultLangRows();
  noticeRows.value = defaultLangRows();
  imageFiles.value = [];
  spuBlocks.value = [blankServiceBlock()];
  tagPicker.reset();
  pendingTagNames.value = [];
  tagAdderOpen.value = false;
  tagDraft.value = '';
};

const specValueName = (value: any) => {
  const id = String(value?.specValueId ?? '');
  const localized = pickI18nText(value?.nameI18n, locale.value, '');
  const plain = String(value?.specValueName || '').trim();
  if (localized && localized !== id) return localized;
  if (plain && plain !== id) return plain;
  return localized || plain;
};
const skuCellText = (cell: any) => {
  if (cell == null) return '';
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell).trim();
  if (typeof cell !== 'object') return '';
  const named = cell.nameI18n && typeof cell.nameI18n === 'object' ? cell.nameI18n : cell;
  return pickI18nText(named, locale.value, '') || String(cell.specValueName || '').trim();
};
const skuLabelFromList = (sku: any, specTypes: any[]) => {
  const labels = (specTypes || [])
    .map((spec) => {
      const values = Array.isArray(spec?.values) ? spec.values : [];
      const raw = skuCellText(sku?.[String(spec?.specKey ?? spec?.specTypeId)]);
      if (/^\d+$/.test(raw)) {
        const match = values.find((value: any) => String(value?.specValueId) === raw);
        const name = match ? specValueName(match) : '';
        if (name) return name;
      }
      return raw;
    })
    .filter(Boolean);
  return labels.join(' / ') || sku.skuCode || String(sku.skuId);
};
const skuLabelFromDetail = (item: any) => {
  const labels = Object.values(item?.specValueNameI18n || {})
    .map((value) => pickI18nText(
      value && typeof value === 'object' && (value as any).nameI18n ? (value as any).nameI18n : value as Record<string, string>,
      locale.value,
      '',
    ))
    .filter((label) => Boolean(label) && !/^\d+$/.test(String(label)));
  return labels.join(' / ') || String(item.skuId);
};

const fetchSpuCatalog = async () => {
  const pageSize = 200;
  let pageNum = 1;
  let fetched = 0;
  let total = 0;
  const collected: any[] = [];
  do {
    const res = await spuPage({ pageNum, pageSize, packageService: 1 });
    const data = unwrap(res);
    const list = Array.isArray(data.list) ? data.list : [];
    collected.push(...list);
    fetched += list.length;
    const reportedTotal = Number(data.total);
    total = Number.isFinite(reportedTotal) && reportedTotal >= 0
      ? reportedTotal
      : fetched;
    if (!list.length || fetched >= total) break;
    pageNum += 1;
  } while (true);

  const seen = new Set<number>();
  spuCatalog.value = collected.filter((item: any) =>
    Number((item?.spu || item)?.packageService) === 1,
  ).map((item: any) => {
    const spu = item?.spu || item || {};
    return {
      id: Number(spu.id ?? item?.id),
      nameI18n: item?.nameI18n || spu.nameI18n,
      fallbackName: String(spu.spuName || item?.spuName || ''),
    };
  }).filter((item: SpuCatalogItem) => {
    if (item.id <= 0 || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  spuCatalogLoaded.value = true;
};

const ensureSpus = () => {
  if (spuCatalogLoaded.value) return Promise.resolve();
  if (spuCatalogInflight) return spuCatalogInflight;
  spuLoading.value = true;
  spuCatalogInflight = fetchSpuCatalog()
    .catch((error: any) => {
      ElMessage.error(error?.message || t('admin.packageList.message.spuFailed'));
    })
    .finally(() => {
      spuLoading.value = false;
      spuCatalogInflight = null;
    });
  return spuCatalogInflight;
};

const refreshSpus = () => {
  spuCatalogLoaded.value = false;
  return ensureSpus();
};

const loadSkuCatalog = async (spuId: number) => {
  const inflight = skuCatalogInflight.get(spuId);
  if (inflight) return inflight;

  const request = (async () => {
    const res = await listBySpu(spuId);
    const data = unwrap(res);
    return {
      specTypes: Array.isArray(data.specTypes) ? [...data.specTypes] : [],
      skus: Array.isArray(data.skus) ? [...data.skus] : [],
    };
  })();
  skuCatalogInflight.set(spuId, request);
  try {
    return await request;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packageList.message.skuFailed'));
    throw error;
  } finally {
    if (skuCatalogInflight.get(spuId) === request) skuCatalogInflight.delete(spuId);
  }
};

const loadSpuBlock = async (spuId: number, saved: SavedSku[]) => {
  try {
    const raw = await loadSkuCatalog(spuId);
    if (raw.skus.length) {
      return {
        skus: raw.skus.map((sku: any) => ({
          skuId: Number(sku.skuId),
          specLabel: skuLabelFromList(sku, raw.specTypes),
          price: sku.price == null ? null : Number(sku.price),
          redeemTimes: 1,
          available: true,
        })),
      };
    }
  } catch {}
  return {
    skus: saved.map((item) => ({
      skuId: item.skuId,
      specLabel: item.specLabel,
      price: item.price,
      redeemTimes: item.redeemTimes,
      available: item.available,
    })),
  };
};
const discountedSkuPrice = (price: number) => {
  const percent = Number(form.discountPercent);
  if (!Number.isInteger(percent) || percent < 1 || percent > 999) return null;
  return Math.round((price * (percent / 100) + Number.EPSILON) * 100) / 100;
};

const changeSpu = async (block: SpuBlock, spuId: number | null) => {
  if (!spuId) {
    block.skuSeq += 1;
    block.spuId = null;
    block.spuName = '';
    block.redeemTimes = 1;
    block.skus = [];
    return;
  }
  if (spuBlocks.value.some((item) => item.key !== block.key && item.spuId === spuId)) {
    ElMessage.warning(t('admin.packageList.message.serviceDuplicate'));
    return;
  }
  const option = spuOptionsFor(block).find((item) => item.id === spuId);
  const seq = ++block.skuSeq;
  block.spuId = spuId;
  block.spuName = option?.name || String(spuId);
  block.redeemTimes = 1;
  block.skus = [];
  const loaded = await loadSpuBlock(spuId, []);
  if (seq !== block.skuSeq) return;
  block.skus = loaded.skus;
};

const addServiceBlock = () => {
  const block = blankServiceBlock();
  spuBlocks.value.push(block);
  ensureSpus();
};

const removeBlock = (key: number) => {
  if (spuBlocks.value.length === 1) return;
  spuBlocks.value = spuBlocks.value.filter((block) => block.key !== key);
};

const fillFromDetail = async (detail: any, isCurrent = () => true) => {
  editingId.value = Number(detail.id);
  form.categoryId = detail.categoryId ? Number(detail.categoryId) : null;
  form.validDays = Number(detail.validDays || 1);
  const loadedDiscount = moneyNumber(detail.discount);
  form.discountPercent = loadedDiscount == null ? 100 : Math.round(loadedDiscount * 100);
  form.displayTotalPrice = moneyNumber(detail.displayTotalPrice);
  form.displaySalePrice = moneyNumber(detail.displaySalePrice);
  form.displaySavedPrice = moneyNumber(detail.displaySavedPrice);
  loadedNameI18n.value = { ...(detail.nameI18n || {}) };
  form.name = packageNameText(detail.nameI18n);
  descRows.value = toLangRows(detail.descI18n);
  serviceRows.value = toLangRows(detail.serviceContentTextI18n);
  noticeRows.value = toLangRows(detail.bookingNoticeI18n);
  const images = Array.isArray(detail.imageUrls) ? detail.imageUrls.filter(Boolean) : [];
  imageFiles.value = images.map((url: string, index: number) => ({ name: `image-${index + 1}`, url }));
  const grouped = new Map<number, { name: string; redeemTimes: number; skus: SavedSku[] }>();
  (Array.isArray(detail.items) ? detail.items : []).forEach((item: any) => {
    const spuId = Number(item.spuId);
    if (!spuId) return;
    const wholeService = Number(item.bindType) === 1 || !Number(item.skuId);
    const bucket = grouped.get(spuId) || {
      name: pickI18nText(item.spuNameI18n, locale.value, String(spuId)),
      redeemTimes: Math.max(1, Number(item.redeemTimes) || 1),
      skus: [],
    };
    if (wholeService) bucket.redeemTimes = Math.max(1, Number(item.redeemTimes) || 1);
    const skuId = Number(item.skuId);
    if (skuId) {
      bucket.skus.push({
        skuId,
        redeemTimes: 1,
        available: item.available !== false,
        specLabel: skuLabelFromDetail(item),
        price: item.skuPrice == null ? null : Number(item.skuPrice),
      });
    }
    (Array.isArray(item.skuOptions) ? item.skuOptions : []).forEach((option: any) => {
      const optionId = Number(option?.skuId);
      if (!optionId || bucket.skus.some((sku) => sku.skuId === optionId)) return;
      bucket.skus.push({
        skuId: optionId,
        redeemTimes: 1,
        available: true,
        specLabel: skuLabelFromDetail(option),
        price: option?.skuPrice == null ? null : Number(option.skuPrice),
      });
    });
    grouped.set(spuId, bucket);
  });
  const blocks = await Promise.all(
    [...grouped.entries()].map(async ([spuId, bucket]) => {
      const loaded = await loadSpuBlock(spuId, bucket.skus);
      return {
        key: serviceBlockSeed++,
        spuId,
        spuName: bucket.name,
        redeemTimes: bucket.redeemTimes,
        skus: loaded.skus,
        skuSeq: 0,
      };
    }),
  );
  if (isCurrent()) spuBlocks.value = blocks.length ? blocks : [blankServiceBlock()];
};

const clearEditQuery = (expectedId?: number) => {
  if (route.path !== packageListPath || !Object.prototype.hasOwnProperty.call(route.query, 'editId')) return;
  if (expectedId != null && positiveId(route.query.editId) !== expectedId) return;
  const query = { ...route.query };
  delete query.editId;
  return router.replace({ path: route.path, query, hash: route.hash }).catch(() => {});
};

const openCreate = () => {
  if (submitLoading.value) return;
  detailRequestVersion += 1;
  linkedEditId = null;
  detailLoading.value = false;
  void clearEditQuery();
  isEdit.value = false;
  resetForm();
  formKey.value += 1;
  dialogVisible.value = true;
  ensureSpus();
  tagPicker.loadOptions().catch((error: any) => {
    ElMessage.error(error?.message || t('admin.bizTag.saveFailed'));
  });
};

const openEditById = async (id: number, linked = false) => {
  const version = ++detailRequestVersion;
  linkedEditId = linked ? id : null;
  isEdit.value = true;
  resetForm();
  dialogVisible.value = true;
  detailLoading.value = true;
  const isCurrent = () => componentActive && version === detailRequestVersion && dialogVisible.value
    && (!linked || (linkedEditId === id && route.path === packageListPath && positiveId(route.query.editId) === id));
  ensureSpus();
  try {
    const [res, tagRes] = await Promise.all([getPackageDetail(id), bizTagsByRef(2, id), tagPicker.loadOptions()]);
    if (!isCurrent()) return;
    const detail = unwrap(res);
    if (!detail || typeof detail !== 'object' || positiveId(detail.id) !== id) {
      throw new Error(t('admin.packageList.message.detailFailed'));
    }
    await fillFromDetail(detail, isCurrent);
    if (!isCurrent()) return;
    const tagData = unwrap(tagRes);
    const tags: BizTag[] = Array.isArray(tagData) ? tagData : Array.isArray(tagData?.list) ? tagData.list : [];
    tagPicker.options.value = [...new Map([...tagPicker.options.value, ...tags].map((tag) => [Number(tag.id), tag])).values()];
    tagPicker.selectedIds.value = tags.map((tag) => Number(tag.id)).filter((tagId) => Number.isSafeInteger(tagId) && tagId > 0);
    formKey.value += 1;
  } catch (error: any) {
    if (!isCurrent()) return;
    linkedEditId = null;
    if (linked) void clearEditQuery(id);
    dialogVisible.value = false;
    editingId.value = null;
    ElMessage.error(error?.message || t('admin.packageList.message.detailFailed'));
  } finally {
    if (version === detailRequestVersion) detailLoading.value = false;
  }
};

const openEdit = (row: PackageRow) => {
  if (submitLoading.value) return;
  linkedEditId = null;
  void clearEditQuery();
  const id = positiveId(row.id);
  if (id == null) {
    detailRequestVersion += 1;
    detailLoading.value = false;
    dialogVisible.value = false;
    ElMessage.error(t('admin.packageList.message.detailFailed'));
    return;
  }
  return openEditById(id);
};

const syncLinkedEdit = () => {
  if (!editLinkReady || !componentActive) return;
  const hasQuery = route.path === packageListPath && Object.prototype.hasOwnProperty.call(route.query, 'editId');
  const id = hasQuery ? positiveId(route.query.editId) : null;
  if (id == null) {
    if (linkedEditId != null) {
      linkedEditId = null;
      detailRequestVersion += 1;
      detailLoading.value = false;
      dialogVisible.value = false;
    }
    if (hasQuery) {
      void clearEditQuery();
      ElMessage.error(t('admin.packageList.message.detailFailed'));
    }
    return;
  }
  if (linkedEditId === id && dialogVisible.value) return;
  void openEditById(id, true);
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const hasSelectedService = computed(() => spuBlocks.value.some((block) => block.spuId));
const packagePriceSummary = computed(() => {
  const percent = Number(form.discountPercent);
  const discountReady = Number.isInteger(percent) && percent >= 1 && percent <= 999;
  let total = 0;
  let sale = 0;
  let hasPrice = false;
  spuBlocks.value.forEach((block) => {
    if (!block.spuId) return;
    const times = Math.max(1, Number(block.redeemTimes) || 1);
    block.skus.forEach((sku) => {
      if (sku.price == null) return;
      hasPrice = true;
      total += Number(sku.price) * times;
      const discounted = discountedSkuPrice(Number(sku.price));
      if (discounted != null) sale += discounted * times;
    });
  });
  if (!hasPrice || !discountReady) return { total: null, sale: null };
  return { total: roundMoney(total), sale: roundMoney(sale) };
});

const selectedItems = () => {
  const items: Array<{ bindType: 1; spuId: number; quantity: number; redeemTimes: number; sort: number }> = [];
  spuBlocks.value.forEach((block) => {
    if (!block.spuId) return;
    items.push({
      bindType: 1,
      spuId: block.spuId,
      quantity: 1,
      redeemTimes: Math.max(1, Number(block.redeemTimes) || 1),
      sort: items.length,
    });
  });
  return items;
};

const save = async () => {
  if (detailLoading.value || submitLoading.value) return;
  if (!form.categoryId) {
    ElMessage.warning(t('admin.packageList.validation.categoryRequired'));
    return;
  }
  const discountPercent = Number(form.discountPercent);
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 999) {
    ElMessage.warning(t('admin.packageList.validation.discount'));
    return;
  }
  if (!form.validDays || form.validDays < 1) {
    ElMessage.warning(t('admin.packageList.validation.validDays'));
    return;
  }
  const items = selectedItems();
  if (!items.length) {
    ElMessage.warning(t('admin.packageList.validation.skuRequired'));
    return;
  }
  if (items.some((item) => !item.redeemTimes || item.redeemTimes < 1)) {
    ElMessage.warning(t('admin.packageList.validation.redeemTimes'));
    return;
  }
  const texts = [
    { rows: descRows.value, rich: false },
    { rows: serviceRows.value, rich: true },
    { rows: noticeRows.value, rich: true },
  ];
  if (texts.some(({ rows: list, rich }) => list.some((item) => {
    const filled = rich ? !isRichTextEmpty(item.value) : Boolean(item.value?.trim());
    return filled && !item.lang?.trim();
  }))) {
    ElMessage.warning(t('admin.packageList.validation.langRequired'));
    return;
  }
  submitLoading.value = true;
  const version = detailRequestVersion;
  try {
    await addOrUpdatePackage({
      id: editingId.value || undefined,
      categoryId: form.categoryId,
      validDays: form.validDays,
      discount: percentToDiscount(discountPercent),
      nameI18n: packageNamePayload(),
      descI18n: rowsToMap(descRows.value),
      serviceContentI18n: rowsToMap(serviceRows.value, true),
      bookingNoticeI18n: rowsToMap(noticeRows.value, true),
      imageUrls: imageFiles.value.map((file) => file.url).filter(Boolean),
      items,
      tags: tagPicker.saveItems(pendingTagNames.value),
    });
    if (version !== detailRequestVersion || !dialogVisible.value) return;
    pendingTagNames.value = [];
    ElMessage.success(t('admin.packageList.message.saveSuccess'));
    dialogVisible.value = false;
    fetchList();
  } catch (error: any) {
    if (version !== detailRequestVersion || !dialogVisible.value) return;
    const linkedId = linkedEditId;
    linkedEditId = null;
    if (linkedId != null) void clearEditQuery(linkedId);
    ElMessage.error(error?.message || t('admin.packageList.message.saveFailed'));
  } finally {
    submitLoading.value = false;
  }
};

const handleImageUpload = (options: UploadRequestOptions) => {
  const file = options.file as File & { uid?: number };
  const formData = new FormData();
  formData.append('file', file);
  uploadPackageImage(formData)
    .then((res: any) => {
      const url = typeof res === 'string' ? res : res?.url || res?.data?.url || res?.data;
      if (!url || typeof url !== 'string') throw new Error(t('admin.packageList.message.uploadFailed'));
      options.onSuccess?.({ url } as any, file as any);
      const target = imageFiles.value.find((item) => item.uid === file.uid);
      if (target) target.url = url;
    })
    .catch((error: any) => {
      ElMessage.error(error?.message || t('admin.packageList.message.uploadFailed'));
      options.onError?.(error as any);
    });
};

onMounted(async () => {
  componentActive = true;
  await Promise.allSettled([fetchCategories(), fetchList(), ensureSpus()]);
  if (!componentActive) return;
  editLinkReady = true;
  syncLinkedEdit();
});

onBeforeUnmount(() => {
  componentActive = false;
  detailRequestVersion += 1;
});

watch(() => [route.path, route.query.editId], syncLinkedEdit);

watch(dialogVisible, (open) => {
  if (open) return;
  const linkedId = linkedEditId;
  linkedEditId = null;
  detailRequestVersion += 1;
  detailLoading.value = false;
  if (linkedId != null) void clearEditQuery(linkedId);
});

watch(() => locale.value, () => {
  fetchCategories();
  fetchList();
});
</script>

<style scoped>
.bound-service a { color: var(--el-color-primary); text-decoration: none; }
.bound-service a:hover { text-decoration: underline; }
.spu-picker-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.spu-picker-actions .el-button + .el-button { margin-left: 0; }
.spu-picker-actions a { color: var(--el-color-primary); font-size: 14px; text-decoration: none; }
.biz-tag-picks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}
.biz-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px 0 10px;
  border: 1px solid #f3c7a0;
  border-radius: 4px;
  background: #fff4e8;
  color: #e07a2f;
  font-size: 13px;
  line-height: 1;
}
.biz-tag-chip button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #e07a2f;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.biz-tag-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 4px;
  background: #3b6cff;
  color: #fff;
  cursor: pointer;
}
.biz-tag-add :deep(svg) {
  width: 14px;
  height: 14px;
}
.biz-tag-draft {
  width: 168px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #f3c7a0;
  border-radius: 4px;
  background: #fff;
  color: #142033;
  font: inherit;
  font-size: 13px;
}
.biz-tag-draft:focus {
  outline: 2px solid rgba(59, 108, 255, 0.35);
  border-color: #3b6cff;
}
.page {
  padding: 12px;
  font-size: 12px;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.toolbar-fields,
.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-fields :deep(.el-input),
.toolbar-fields :deep(.el-select) {
  width: 200px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.sort-handle {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #7b8797;
  cursor: grab;
}
.sort-handle:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.sort-handle svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}
:deep(.el-table__body tr.sort-row--target > td.el-table__cell) {
  background: #f7f0e3 !important;
  box-shadow: inset 0 2px 0 var(--hx-champagne-500, #cfa45c);
}
.thumbs {
  position: relative;
  width: 34px;
  height: 34px;
}
.thumbs img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 4px;
}
.more {
  position: absolute;
  right: -6px;
  bottom: -4px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
}
.bound-services {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bound-service {
  padding: 3px 7px;
  border-radius: 4px;
  background: #eaf2ff;
  color: #2f7ee0;
  font-size: 11px;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
}
.table-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.sale-status-button {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
.sale-status-button.is-on {
  border-color: #c9ecd4;
  background: #e4f7ea;
  color: #1a8a3e;
}
.sale-status-button.is-off {
  border-color: #f7d3d1;
  background: #fdeceb;
  color: #e5484d;
}
.price {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.price span,
.price em {
  color: #94a3b8;
  font-style: normal;
  font-size: 12px;
}
.price span {
  text-decoration: line-through;
}
.discount-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.discount-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.package-total {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f8f5f0;
  color: #334155;
}
.package-total div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.package-total strong {
  font-size: 18px;
  color: #1f2937;
}
.package-total .field-hint {
  flex-basis: 100%;
}
.field-hint {
  margin: 0;
  color: #8a8176;
  font-size: 12px;
  line-height: 1.5;
}
.date-line {
  color: #606266;
  font-size: 11px;
  line-height: 1.55;
  white-space: nowrap;
}
.i18n-list,
.spu-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.i18n-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
}
.quill-wrapper {
  width: 100%;
}
.quill-wrapper :deep(.ql-toolbar) {
  border-radius: 4px 4px 0 0;
}
.quill-wrapper :deep(.ql-container) {
  min-height: 140px;
  border-radius: 0 0 4px 4px;
}
.quill-wrapper :deep(.ql-editor) {
  min-height: 120px;
}
.spu-block {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.spu-block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.field-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.field-row :deep(.el-select) {
  width: 100%;
}
.sku-row {
  align-items: flex-start;
}
.sku-list {
  margin: 0;
  padding: 0;
  list-style: none;
  color: #334155;
  line-height: 1.6;
}
.sku-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.sku-prices {
  display: inline-flex;
  gap: 12px;
  color: #64748b;
}
.field-label {
  color: #606266;
}
.draft-hint {
  margin: 0 0 0 110px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}
</style>
