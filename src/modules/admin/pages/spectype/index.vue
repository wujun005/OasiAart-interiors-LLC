<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="text('admin.specType.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.priced"
          :placeholder="text('admin.specType.table.priced')"
          clearable
          style="width: 200px"
        >
          <el-option :label="text('admin.specType.form.pricedNo')" :value="0" />
          <el-option :label="text('admin.specType.form.pricedYes')" :value="1" />
        </el-select>
        <el-select
          v-model="query.subCategoryId"
          :placeholder="text('admin.specType.subcategoryPlaceholder')"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="item in subCategoryOptions"
            :key="item.id"
            :label="item.displayName"
            :value="item.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">{{ text('admin.specType.actions.search') }}</el-button>
        <el-button @click="reset">{{ text('admin.specType.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ text('admin.specType.actions.create') }}</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column :label="text('admin.specType.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column :label="text('admin.specType.table.subcategory')" min-width="140">
          <template #default="{ row }">{{ row.subCategoryName || '-' }}</template>
        </el-table-column>
        <el-table-column :label="text('admin.specType.table.priced')" min-width="168">
          <template #default="{ row }">
            {{ row.priced === 1 ? text('admin.specType.form.pricedYes') : text('admin.specType.form.pricedNo') }}
          </template>
        </el-table-column>
        <el-table-column :label="text('admin.specType.table.createdAt')" width="148">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="text('admin.specType.table.actions')" width="132" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ text('admin.specType.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ text('admin.specType.actions.delete') }}
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
      :title="isEdit ? text('admin.specType.dialog.editTitle') : text('admin.specType.dialog.createTitle')"
      :close-on-click-modal="false"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item :label="text('admin.specType.form.subcategory')" prop="subCategoryId">
          <el-select
            v-model="form.subCategoryId"
            :placeholder="text('admin.specType.form.subcategoryPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in subCategoryOptions"
              :key="item.id"
              :label="item.displayName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="text('admin.specType.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="text('admin.specType.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="text('admin.specType.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">
                {{ text('admin.specType.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ text('admin.specType.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="text('admin.specType.form.priced')">
          <div class="priced-field">
            <el-radio-group v-model="form.priced">
              <el-radio :value="0">{{ text('admin.specType.form.pricedNo') }}</el-radio>
              <el-radio :value="1">{{ text('admin.specType.form.pricedYes') }}</el-radio>
            </el-radio-group>
            <p class="field-hint">{{ text('admin.specType.form.pricedHint') }}</p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ text('admin.specType.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ text('admin.specType.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getSpecTypePage, addOrUpdateSpecType, deleteSpecType } from '@/modules/admin/api/specType';
import { searchCategory } from '@/modules/admin/api/category';
import { getPage as getPackageServiceCategoryPage } from '@/modules/admin/api/packageServiceCategory';
import { ADMIN_LANG_EN, pickI18nText } from '@/modules/admin/utils/i18n';

const props = withDefaults(defineProps<{ catalog?: 'service' | 'package' }>(), {
  catalog: 'service',
});
const { locale, t } = useI18n({ useScope: 'global' });
const categoryDomain = computed(() => (props.catalog === 'package' ? '4' : '2'));
const packageLabelKey: Record<string, string> = {
  'admin.specType.searchPlaceholder': 'admin.packageCatalog.specType.searchPlaceholder',
  'admin.specType.actions.create': 'admin.packageCatalog.specType.actions.create',
  'admin.specType.table.priced': 'admin.packageCatalog.specType.table.priced',
  'admin.specType.dialog.createTitle': 'admin.packageCatalog.specType.dialog.createTitle',
  'admin.specType.dialog.editTitle': 'admin.packageCatalog.specType.dialog.editTitle',
  'admin.specType.form.priced': 'admin.packageCatalog.specType.form.priced',
  'admin.specType.message.fetchFailed': 'admin.packageCatalog.specType.message.fetchFailed',
  'admin.specType.message.deleteConfirm': 'admin.packageCatalog.specType.message.deleteConfirm',
  'admin.specType.subcategoryPlaceholder': 'admin.packageCatalog.subcategory.label',
  'admin.specType.table.subcategory': 'admin.packageCatalog.subcategory.label',
  'admin.specType.form.subcategory': 'admin.packageCatalog.subcategory.label',
  'admin.specType.form.subcategoryPlaceholder': 'admin.packageCatalog.subcategory.placeholder',
  'admin.specType.validation.subcategoryRequired': 'admin.packageCatalog.subcategory.required',
};
const text = (key: string, values?: Record<string, unknown>) =>
  t(props.catalog === 'package' ? packageLabelKey[key] || key : key, values || {});

type SpecType = {
  id: number;
  displayName: string;
  subCategoryId: number | null;
  subCategoryName?: string;
  nameI18n?: Record<string, string>;
  priced: 0 | 1;
  createdAt: string;
};

type SubCategoryOption = {
  id: number;
  displayName: string;
  nameI18n?: Record<string, string>;
};

const normalizeOptionalId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const list = ref<SpecType[]>([]);
const subCategoryOptions = ref<SubCategoryOption[]>([]);
const createEmptyI18nItem = (value = '') => ({
  lang: ADMIN_LANG_EN,
  value,
});
const query = reactive({
  nameKeyword: '',
  subCategoryId: null as number | null,
  priced: null as 0 | 1 | null,
  pageNum: 1,
  pageSize: 10,
});

const subCategoryMap = computed(() => {
  const map = new Map<number, string>();
  subCategoryOptions.value.forEach((item) => {
    map.set(item.id, item.displayName);
  });
  return map;
});

const displayList = computed(() =>
  list.value.map((item) => ({
    ...item,
    subCategoryName:
      (item.subCategoryId ? subCategoryMap.value.get(item.subCategoryId) : '') || '-',
  })),
);
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<SpecType>({
  id: 0,
  displayName: '',
  subCategoryId: null,
  nameI18n: {},
  priced: 0,
  createdAt: '',
});
const nameI18nList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);

const rules: FormRules = {
  subCategoryId: [
    { required: true, message: text('admin.specType.validation.subcategoryRequired'), trigger: 'change' },
  ],
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error(text('admin.specType.validation.nameI18nIncomplete')));
        cb();
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
  query.subCategoryId = null;
  query.priced = null;
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

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: 0,
    displayName: '',
    subCategoryId: subCategoryOptions.value[0]?.id ?? null,
    nameI18n: {},
    priced: 0,
    createdAt: new Date().toISOString(),
  });
  nameI18nList.value = [createEmptyI18nItem()];
  dialogVisible.value = true;
};

const openEdit = (row: SpecType) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    displayName: row.displayName,
    subCategoryId: row.subCategoryId ?? null,
    nameI18n: row.nameI18n || {},
    priced: row.priced === 1 ? 1 : 0,
    createdAt: row.createdAt,
  });
  nameI18nList.value = row.nameI18n && Object.keys(row.nameI18n).length
    ? Object.entries(row.nameI18n).map(([lang, value]) => ({ lang, value: value as string }))
    : [createEmptyI18nItem(row.displayName || '')];
  dialogVisible.value = true;
};

const save = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid) => {
    if (!valid) return;
    submitLoading.value = true;
    const subCategoryId = normalizeOptionalId(form.subCategoryId) ?? undefined;
    if (!subCategoryId) {
      ElMessage.warning(text('admin.specType.validation.subcategoryRequired'));
      submitLoading.value = false;
      return;
    }
    const subCategoryIdStr = subCategoryId ? String(subCategoryId) : undefined;
    const payload = {
      id: form.id || undefined,
      subCategoryId,
      categoryId: subCategoryId,
      pcategoryId: subCategoryIdStr,
      priced: form.priced === 1 ? 1 : 0,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
    };
    addOrUpdateSpecType(payload)
      .then(() => {
        ElMessage.success(text('admin.specType.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || text('admin.specType.message.saveFailed'));
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
};

const remove = (row: SpecType) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || '',
  );
  ElMessageBox.confirm(
    text('admin.specType.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deleteSpecType({ id: row.id }))
    .then(() => {
      ElMessage.success(text('admin.specType.message.deleteSuccess'));
      fetchList();
    })
    .catch((err: any) => {
      if (err === 'cancel' || err === 'close') return;
      ElMessage.error(err?.message || 'Request failed');
    });
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  const date = new Date(val);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const readSpecTypePage = (res: any) => {
  const payload = res?.data ?? res ?? {};
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.list)
      ? payload.list
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.data?.list)
          ? payload.data.list
          : [];
  return {
    records,
    total: Number(payload.total ?? payload.data?.total ?? records.length) || 0,
  };
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const categoryIds = props.catalog === 'package'
      ? (query.subCategoryId
        ? [query.subCategoryId]
        : subCategoryOptions.value.map((item) => item.id))
      : [query.subCategoryId || undefined];
    if (props.catalog === 'package' && !categoryIds.length) {
      list.value = [];
      total.value = 0;
      return;
    }
    const request = {
      nameKeyword: query.nameKeyword?.trim() || undefined,
      priced: query.priced === 0 || query.priced === 1 ? query.priced : undefined,
      categoryDomain: categoryDomain.value,
    };
    const loadCategory = async (categoryId: number | undefined, pageNum: number, pageSize: number) =>
      readSpecTypePage(await getSpecTypePage({
        ...request,
        pageNum,
        pageSize,
        subCategoryId: categoryId,
        categoryId,
        pcategoryId: categoryId ? String(categoryId) : undefined,
      }));
    if (categoryIds.length <= 1) {
      const page = await loadCategory(categoryIds[0], query.pageNum, query.pageSize);
      list.value = page.records.map(mapSpecTypeRow);
      total.value = page.total;
      return;
    }
    const collected: any[] = [];
    for (const categoryId of categoryIds) {
      let pageNum = 1;
      let seen = 0;
      let reported = 0;
      do {
        const page = await loadCategory(categoryId, pageNum, 200);
        collected.push(...page.records);
        reported = page.total;
        seen += page.records.length;
        if (!page.records.length || seen >= reported) break;
        pageNum += 1;
      } while (pageNum <= 20);
    }
    total.value = collected.length;
    const start = (query.pageNum - 1) * query.pageSize;
    list.value = collected.slice(start, start + query.pageSize).map(mapSpecTypeRow);
    return;
  } catch (error: any) {
    ElMessage.error(error?.message || text('admin.specType.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const mapSpecTypeRow = (item: any) => ({
  id: item.specType?.id ?? item.id,
  subCategoryId: normalizeOptionalId(
    item.specType?.subCategoryId ??
      item.specType?.categoryId ??
      item.specType?.pcategoryId ??
      item.subCategoryId ??
      item.categoryId ??
      item.pcategoryId,
  ),
  nameI18n: item.nameI18n || item.specType?.nameI18n,
  priced: Number(item.specType?.priced ?? item.priced) === 1 ? 1 : 0,
  displayName: pickI18nText(
    item.nameI18n || item.specType?.nameI18n,
    locale.value,
    item.specType?.typeName || item.name || '',
  ),
  createdAt: item.specType?.createTime || item.createTime || item.createdAt || '',
});

const fetchSubCategoryOptions = async () => {
  try {
    const res = props.catalog === 'package'
      ? await getPackageServiceCategoryPage({ pageNum: 1, pageSize: 500 })
      : await searchCategory({
          pageNum: 1,
          pageSize: 500,
          categoryDomain: categoryDomain.value,
          nameKeyword: '',
          offset: 0,
        });
    const payload = res?.data ?? res ?? {};
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.list)
        ? payload.list
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.list)
            ? payload.data.list
            : [];
    subCategoryOptions.value = records
      .map((item: any) => {
        const category = item.category ?? item;
        const id = Number(category.id ?? category.categoryId ?? item.id);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        const nameI18n = item.nameI18n || category.nameI18n;
        const displayName = pickI18nText(
          nameI18n,
          locale.value,
          category.categoryName || item.categoryName || item.displayName || '',
        );
        return {
          id,
          displayName,
          nameI18n,
        };
      })
      .filter((item): item is SubCategoryOption => Boolean(item));
  } catch (error) {
    console.error('fetch subcategory failed:', error);
  }
};

const addI18n = () => {
  nameI18nList.value.push(createEmptyI18nItem());
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

onMounted(async () => {
  await fetchSubCategoryOptions();
  fetchList();
});

watch(
  () => locale.value,
  async () => {
    await fetchSubCategoryOptions();
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
  flex-wrap: wrap;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.priced-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.field-hint {
  margin: 0;
  color: #8a8176;
  font-size: 12px;
  line-height: 1.5;
}
</style>
