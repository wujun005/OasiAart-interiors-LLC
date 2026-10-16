<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.packageCategory.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">{{ t('admin.packageCategory.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.packageCategory.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.packageCategory.actions.create') }}</el-button>
        <el-tooltip :disabled="!!previewUrl" :content="t('admin.packageCategory.message.previewUnavailable')">
          <span>
            <el-button :disabled="!previewUrl" @click="openPreview">
              {{ t('admin.packageCategory.actions.preview') }}
            </el-button>
          </span>
        </el-tooltip>
      </div>

      <el-table
        class="category-sort-table"
        :data="displayList"
        border
        stripe
        row-key="id"
        v-loading="tableLoading || sortSubmitting"
        :row-class-name="categoryRowClassName"
        @dragover.prevent="handleCategoryDragOver"
        @drop.prevent="handleCategoryDrop"
      >
        <el-table-column
          v-if="canSortCategories"
          :label="t('admin.packageCategory.table.sort')"
          width="64"
          align="center"
          fixed="left"
        >
          <template #default="{ row }">
            <button
              class="category-sort-handle"
              type="button"
              :draggable="canSortCategories && !tableLoading && !sortSubmitting"
              :disabled="!canSortCategories || tableLoading || sortSubmitting"
              :title="t('admin.packageCategory.table.sortHint')"
              :aria-label="`${t('admin.packageCategory.table.sort')}: ${row.displayName}`"
              @dragstart.stop="handleCategoryDragStart(row, $event)"
              @dragend.stop="resetCategoryDrag"
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
        <el-table-column :label="t('admin.packageCategory.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.packageCategory.table.icon')" width="72">
          <template #default="{ row }">
            <img v-if="row.iconUrl" :src="row.iconUrl" alt="" class="icon-thumb" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageCategory.table.status')" width="88">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-text="t('admin.common.enabled')"
              :inactive-text="t('admin.common.disabled')"
              inline-prompt
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.packageCategory.table.createdAt')" width="148">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.packageCategory.table.actions')" width="132" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.packageCategory.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.packageCategory.actions.delete') }}
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
          :page-sizes="[5, 10, 20, 50]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('admin.packageCategory.dialog.editTitle') : t('admin.packageCategory.dialog.createTitle')"
      :close-on-click-modal="false"
      width="640px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item :label="t('admin.packageCategory.form.icon')">
          <el-upload
            :http-request="handleIconUpload"
            list-type="picture-card"
            :file-list="iconFileList"
            :on-remove="onIconRemove"
            accept="image/*"
            :limit="1"
            :on-exceed="() => ElMessage.warning(t('admin.packageCategory.message.uploadOnlyOne'))"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('admin.packageCategory.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.packageCategory.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langEnCode')" value="en" />
                <el-option :label="t('admin.common.langZhCn')" value="zh" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.packageCategory.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length === 1" @click="removeI18n(idx)">
                {{ t('admin.packageCategory.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ t('admin.packageCategory.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.packageCategory.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.packageCategory.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules, UploadRequestOptions, UploadUserFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  addOrUpdatePackageCategory,
  changePackageCategoryStatus,
  deletePackageCategory,
  getPackageCategoryDetail,
  getPackageCategoryPage,
  getPackageCategoryPreviewUrl,
  sortPackageCategories,
  uploadPackageCategoryIcon,
} from '@/modules/admin/api/packageCategory';
import { pickI18nText } from '@/modules/admin/utils/i18n';

const LANG_ZH = 'zh';
const LANG_EN = 'en';

type PackageCategory = {
  id: number;
  displayName: string;
  iconUrl?: string;
  nameI18n?: Record<string, string>;
  enabled: boolean;
  createdAt: string;
};

const normalizeLang = (lang: string) => {
  if (lang === 'zh-CN' || lang === 'zh') return LANG_ZH;
  if (lang === 'en-US' || lang === 'en') return LANG_EN;
  return lang;
};

const createDefaultNameList = () => [{ lang: LANG_EN, value: '' }];

const toNameList = (nameI18n?: Record<string, string>, fallback = '') => {
  const merged = new Map<string, string>();
  Object.entries(nameI18n || {}).forEach(([lang, value]) => {
    const key = normalizeLang(lang);
    const text = typeof value === 'string' ? value.trim() : '';
    if (!key || !text || merged.has(key)) return;
    merged.set(key, text);
  });
  const rest = [...merged.entries()].filter(([lang]) => lang !== LANG_ZH && lang !== LANG_EN);
  const list = [{ lang: LANG_EN, value: merged.get(LANG_EN) || '' }];
  const chinese = merged.get(LANG_ZH) || (!merged.size ? fallback.trim() : '');
  if (chinese) list.push({ lang: LANG_ZH, value: chinese });
  rest.forEach(([lang, value]) => list.push({ lang, value }));
  return list;
};

const list = ref<PackageCategory[]>([]);
const { locale, t } = useI18n({ useScope: 'global' });
const query = reactive({
  nameKeyword: '',
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const tableLoading = ref(false);
const sortSubmitting = ref(false);
const previewUrl = ref('');
const draggedCategoryId = ref<number | null>(null);
const dragOverCategoryId = ref<number | null>(null);
const hasCategoryFilterConditions = computed(() => Boolean(query.nameKeyword.trim()));
const loadedCategoriesAreFiltered = ref(true);
const canSortCategories = computed(
  () => !hasCategoryFilterConditions.value && !loadedCategoriesAreFiltered.value,
);
const displayList = computed(() => list.value);

const unwrapRecord = (payload: any) => payload?.data ?? payload ?? {};

const mapRow = (item: any): PackageCategory => {
  const category = item?.category || item || {};
  const nameI18n = item?.nameI18n || category.nameI18n;
  return {
    id: Number(category.id ?? item?.id),
    displayName: pickI18nText(
      nameI18n,
      locale.value,
      category.categoryName || item?.categoryName || item?.name || '',
    ),
    nameI18n,
    iconUrl: item?.imageUrls?.[0] || item?.iconUrl || '',
    enabled: Number(category.status ?? item?.status) === 1,
    createdAt: category.createTime || item?.createdAt || item?.createTime || '',
  };
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const requestHasFilters = hasCategoryFilterConditions.value;
    const res = await getPackageCategoryPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
    });
    const data = unwrapRecord(res);
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map(mapRow);
    total.value = Number(data.total ?? records.length);
    loadedCategoriesAreFiltered.value = requestHasFilters;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packageCategory.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const fetchPreviewUrl = async () => {
  try {
    const res = await getPackageCategoryPreviewUrl();
    const value = typeof res === 'string' ? res : res?.data;
    previewUrl.value = typeof value === 'string' ? value.trim() : '';
  } catch {
    previewUrl.value = '';
  }
};

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<PackageCategory>({
  id: 0,
  displayName: '',
  iconUrl: '',
  enabled: true,
  createdAt: '',
});
const iconFileList = ref<UploadUserFile[]>([]);
const nameI18nList = ref(createDefaultNameList());

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_rule, _value, callback) => {
        const rows = nameI18nList.value;
        const filled = rows.filter((item) => item.lang?.trim() && item.value?.trim());
        const hasEnglish = filled.some((item) => normalizeLang(item.lang) === LANG_EN);
        if (!hasEnglish) {
          callback(new Error(t('admin.packageCategory.validation.nameI18nRequired')));
          return;
        }
        if (rows.some((item) => item.value?.trim() && !item.lang?.trim())) {
          callback(new Error(t('admin.packageCategory.validation.nameI18nIncomplete')));
          return;
        }
        const langs = filled.map((item) => normalizeLang(item.lang));
        if (new Set(langs).size !== langs.length) {
          callback(new Error(t('admin.packageCategory.validation.nameI18nDuplicate')));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchList();
};

const reset = () => {
  query.nameKeyword = '';
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

const categoryRowClassName = ({ row }: { row: PackageCategory }) =>
  canSortCategories.value &&
  row.id === dragOverCategoryId.value &&
  row.id !== draggedCategoryId.value
    ? 'category-sort-row--target'
    : '';

const getCategoryDropIndex = (event: DragEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return -1;
  const row = target.closest('tbody tr');
  const body = row?.parentElement;
  if (!row || body?.tagName !== 'TBODY') return -1;
  return Array.from(body.children).indexOf(row);
};

const handleCategoryDragStart = (row: PackageCategory, event: DragEvent) => {
  if (!canSortCategories.value || tableLoading.value || sortSubmitting.value) {
    event.preventDefault();
    return;
  }
  draggedCategoryId.value = row.id;
  dragOverCategoryId.value = row.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(row.id));
  }
};

const handleCategoryDragOver = (event: DragEvent) => {
  if (!canSortCategories.value || draggedCategoryId.value === null || sortSubmitting.value) return;
  const targetIndex = getCategoryDropIndex(event);
  if (targetIndex < 0 || targetIndex >= list.value.length) return;
  dragOverCategoryId.value = list.value[targetIndex]?.id ?? null;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
};

const resetCategoryDrag = () => {
  draggedCategoryId.value = null;
  dragOverCategoryId.value = null;
};

const handleCategoryDrop = async (event: DragEvent) => {
  const draggedId = draggedCategoryId.value;
  const targetIndex = getCategoryDropIndex(event);
  if (
    !canSortCategories.value ||
    draggedId === null ||
    targetIndex < 0 ||
    targetIndex >= list.value.length ||
    sortSubmitting.value
  ) {
    resetCategoryDrag();
    return;
  }

  const sourceIndex = list.value.findIndex((item) => item.id === draggedId);
  if (sourceIndex < 0 || sourceIndex === targetIndex) {
    resetCategoryDrag();
    return;
  }

  const previous = [...list.value];
  const reordered = [...list.value];
  const [moved] = reordered.splice(sourceIndex, 1);
  if (!moved) {
    resetCategoryDrag();
    return;
  }
  reordered.splice(targetIndex, 0, moved);
  list.value = reordered;
  resetCategoryDrag();

  sortSubmitting.value = true;
  try {
    await sortPackageCategories(reordered.map((item) => item.id));
    ElMessage.success(t('admin.packageCategory.message.sortSuccess'));
  } catch (error: any) {
    list.value = previous;
    ElMessage.error(error?.message || t('admin.packageCategory.message.sortFailed'));
  } finally {
    sortSubmitting.value = false;
  }
};

const openPreview = () => {
  if (!previewUrl.value) return;
  window.open(previewUrl.value, '_blank', 'noopener');
};

const resetForm = () => {
  Object.assign(form, {
    id: 0,
    displayName: '',
    iconUrl: '',
    enabled: true,
    createdAt: '',
  });
  iconFileList.value = [];
  nameI18nList.value = createDefaultNameList();
};

const fillForm = (row: PackageCategory) => {
  Object.assign(form, row);
  iconFileList.value = row.iconUrl ? [{ name: 'icon', url: row.iconUrl }] : [];
  nameI18nList.value = toNameList(row.nameI18n, row.displayName);
};

const openCreate = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEdit = async (row: PackageCategory) => {
  isEdit.value = true;
  try {
    const res = await getPackageCategoryDetail(row.id);
    fillForm(mapRow(unwrapRecord(res)));
    dialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packageCategory.message.detailFailed'));
  }
};

const save = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid) => {
    if (!valid) return;
    submitLoading.value = true;
    const nameI18n = nameI18nList.value.reduce<Record<string, string>>((acc, item) => {
      const lang = normalizeLang(item.lang);
      if (lang && item.value?.trim()) acc[lang] = item.value.trim();
      return acc;
    }, {});
    const payload = {
      id: isEdit.value ? form.id : undefined,
      categoryName: nameI18n[LANG_ZH],
      categoryEnglishName: nameI18n[LANG_EN],
      nameI18n,
      imageUrls: form.iconUrl ? [form.iconUrl] : [],
      status: isEdit.value ? (form.enabled ? 1 : 0) : 1,
    };
    addOrUpdatePackageCategory(payload)
      .then(() => {
        ElMessage.success(t('admin.packageCategory.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((error: any) => {
        ElMessage.error(error?.message || t('admin.packageCategory.message.saveFailed'));
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
};

const handleIconUpload = (options: UploadRequestOptions) => {
  const file = options.file as File;
  const formData = new FormData();
  formData.append('file', file);
  uploadPackageCategoryIcon(formData)
    .then((res: any) => {
      const url = typeof res === 'string' ? res : res?.data?.url || res?.data || res?.url;
      if (!url || typeof url !== 'string') throw new Error(t('admin.packageCategory.message.uploadFailed'));
      form.iconUrl = url;
      iconFileList.value = [{ name: file.name, url }];
      options.onSuccess?.({ url } as any, file as any);
    })
    .catch((error: any) => {
      ElMessage.error(error?.message || t('admin.packageCategory.message.uploadFailed'));
      options.onError?.(error as any);
    });
};

const onIconRemove = () => {
  form.iconUrl = '';
  iconFileList.value = [];
};

const toggleStatus = (row: PackageCategory) => {
  changePackageCategoryStatus({ id: row.id, status: row.enabled ? 1 : 0 })
    .then(() => {
      ElMessage.success(
        t('admin.packageCategory.message.statusChanged', {
          status: row.enabled ? t('admin.common.enabled') : t('admin.common.disabled'),
        }),
      );
    })
    .catch((error: any) => {
      row.enabled = !row.enabled;
      ElMessage.error(error?.message || t('admin.packageCategory.message.statusChangeFailed'));
    });
};

const remove = (row: PackageCategory) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || t('admin.packageCategory.message.defaultLabel'),
  );
  ElMessageBox.confirm(
    t('admin.packageCategory.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deletePackageCategory({ id: row.id }))
    .then(() => {
      ElMessage.success(t('admin.packageCategory.message.deleteSuccess'));
      fetchList();
    })
    .catch((error: any) => {
      if (error === 'cancel' || error === 'close') return;
      ElMessage.error(error?.message || t('admin.packageCategory.message.deleteFailed'));
    });
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return val;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const addI18n = () => {
  const used = new Set(nameI18nList.value.map((item) => normalizeLang(item.lang)));
  nameI18nList.value.push({ lang: used.has(LANG_ZH) ? '' : LANG_ZH, value: '' });
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

onMounted(() => {
  fetchList();
  fetchPreviewUrl();
});

watch(
  () => locale.value,
  () => {
    fetchList();
  },
);
</script>

<style scoped>
.page {
  padding: 20px;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}
.toolbar :deep(.el-input) {
  width: 240px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.category-sort-handle {
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
.category-sort-handle:hover {
  background: var(--hx-ivory-150, #f4eee4);
  color: var(--hx-champagne-600, #a97b38);
}
.category-sort-handle:active {
  cursor: grabbing;
}
.category-sort-handle:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.category-sort-handle svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}
:deep(.el-table__body tr.category-sort-row--target > td.el-table__cell) {
  background: #f7f0e3 !important;
  box-shadow: inset 0 2px 0 var(--hx-champagne-500, #cfa45c);
}
.icon-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.i18n-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.i18n-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}
</style>
