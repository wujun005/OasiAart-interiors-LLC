<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.specType.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.subCategoryId"
          :placeholder="t('admin.specType.subcategoryPlaceholder')"
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
        <el-button type="primary" @click="handleSearch">{{ t('admin.specType.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.specType.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.specType.actions.create') }}</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column :label="t('admin.specType.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.specType.table.subcategory')" min-width="180">
          <template #default="{ row }">{{ row.subCategoryName || '-' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.specType.table.createdAt')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.specType.table.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.specType.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.specType.actions.delete') }}
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
      :title="isEdit ? t('admin.specType.dialog.editTitle') : t('admin.specType.dialog.createTitle')"
      :close-on-click-modal="false"
      width="520px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="t('admin.specType.form.subcategory')" prop="subCategoryId">
          <el-select
            v-model="form.subCategoryId"
            :placeholder="t('admin.specType.form.subcategoryPlaceholder')"
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
        <el-form-item :label="t('admin.specType.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.specType.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.specType.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">
                {{ t('admin.specType.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ t('admin.specType.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.specType.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.specType.actions.save') }}</el-button>
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
import { pickI18nText } from '@/modules/admin/utils/i18n';

type SpecType = {
  id: number;
  displayName: string;
  subCategoryId: number | null;
  subCategoryName?: string;
  nameI18n?: Record<string, string>;
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
const { locale, t } = useI18n({ useScope: 'global' });
const query = reactive({
  nameKeyword: '',
  subCategoryId: null as number | null,
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
  createdAt: '',
});
const nameI18nList = ref<{ lang: string; value: string }[]>([{ lang: 'zh-CN', value: '' }]);

const rules: FormRules = {
  subCategoryId: [
    { required: true, message: t('admin.specType.validation.subcategoryRequired'), trigger: 'change' },
  ],
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error(t('admin.specType.validation.nameI18nIncomplete')));
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
    createdAt: new Date().toISOString(),
  });
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
  dialogVisible.value = true;
};

const openEdit = (row: SpecType) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    displayName: row.displayName,
    subCategoryId: row.subCategoryId ?? null,
    nameI18n: row.nameI18n || {},
    createdAt: row.createdAt,
  });
  nameI18nList.value = row.nameI18n && Object.keys(row.nameI18n).length
    ? Object.entries(row.nameI18n).map(([lang, value]) => ({ lang, value: value as string }))
    : [{ lang: 'zh-CN', value: row.displayName || '' }];
  dialogVisible.value = true;
};

const save = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid) => {
    if (!valid) return;
    submitLoading.value = true;
    const subCategoryId = form.subCategoryId || undefined;
    const subCategoryIdStr = subCategoryId ? String(subCategoryId) : undefined;
    const payload = {
      id: form.id || undefined,
      subCategoryId,
      categoryId: subCategoryId,
      pcategoryId: subCategoryIdStr,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
    };
    addOrUpdateSpecType(payload)
      .then(() => {
        ElMessage.success(t('admin.specType.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || t('admin.specType.message.saveFailed'));
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
    t('admin.specType.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deleteSpecType({ id: row.id }))
    .then(() => {
      ElMessage.success(t('admin.specType.message.deleteSuccess'));
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

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getSpecTypePage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      subCategoryId: query.subCategoryId || undefined,
      categoryId: query.subCategoryId || undefined,
      pcategoryId: query.subCategoryId ? String(query.subCategoryId) : undefined,
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
    list.value = records.map((item: any) => ({
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
      displayName: pickI18nText(
        item.nameI18n || item.specType?.nameI18n,
        locale.value,
        item.specType?.typeName || item.name || '',
      ),
      createdAt: item.specType?.createTime || item.createTime || item.createdAt || '',
    }));
    total.value = payload.total ?? payload.data?.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.specType.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const fetchSubCategoryOptions = async () => {
  try {
    const res = await searchCategory({
      pageNum: 1,
      pageSize: 500,
      categoryDomain: '2',
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
  nameI18nList.value.push({ lang: 'zh-CN', value: '' });
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
</style>
