<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.spec.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.subCategoryId"
          :placeholder="t('admin.spec.subcategoryPlaceholder')"
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
        <el-select
          v-model="query.specTypeId"
          :placeholder="t('admin.spec.specTypePlaceholder')"
          clearable
          style="width: 180px"
        >
          <el-option
            v-for="item in filteredQuerySpecTypeOptions"
            :key="item.id"
            :label="item.displayName"
            :value="item.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">{{
          t('admin.spec.actions.search')
        }}</el-button>
        <el-button @click="reset">{{
          t('admin.spec.actions.reset')
        }}</el-button>
        <el-button type="primary" @click="openCreate">{{
          t('admin.spec.actions.create')
        }}</el-button>
      </div>

      <el-table
        :data="displayList"
        border
        stripe
        row-key="id"
        v-loading="tableLoading"
      >
        <el-table-column
          prop="sort"
          :label="t('admin.spec.table.sort')"
          width="100"
        />
        <el-table-column :label="t('admin.spec.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column
          prop="typeName"
          :label="t('admin.spec.table.specType')"
          min-width="140"
        />
        <el-table-column
          :label="t('admin.spec.table.createdAt')"
          min-width="160"
        >
          <template #default="{ row }">{{
            formatDate(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column
          :label="t('admin.spec.table.actions')"
          width="180"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.spec.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.spec.actions.delete') }}
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
      :title="
        isEdit
          ? t('admin.spec.dialog.editTitle')
          : t('admin.spec.dialog.createTitle')
      "
      :close-on-click-modal="false"
      width="520px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item
          :label="t('admin.spec.form.subcategory')"
          prop="subCategoryId"
        >
          <el-select
            v-model="form.subCategoryId"
            :placeholder="t('admin.spec.form.subcategoryPlaceholder')"
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
        <el-form-item :label="t('admin.spec.form.specType')" prop="specTypeId">
          <el-select
            v-model="form.specTypeId"
            :placeholder="t('admin.spec.form.specTypePlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in filteredFormSpecTypeOptions"
              :key="item.id"
              :label="item.displayName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.spec.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in nameI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.spec.form.languagePlaceholder')"
                style="width: 140px"
              >
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model="item.value"
                :placeholder="t('admin.spec.form.namePlaceholder')"
              />
              <el-button
                link
                type="danger"
                :disabled="nameI18nList.length === 1"
                @click="removeI18n(idx)"
              >
                {{ t('admin.spec.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{
              t('admin.spec.actions.addLang')
            }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{
          t('admin.spec.actions.cancel')
        }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{
          t('admin.spec.actions.save')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getSpecTypePage } from '@/modules/admin/api/specType';
import {
  getSpecValuePage,
  addOrUpdateSpecValue,
  deleteSpecValue,
} from '@/modules/admin/api/spec';
import { pickI18nText } from '@/modules/admin/utils/i18n';
import { searchCategory } from '@/modules/admin/api/category';

type Spec = {
  id: number;
  sort: number;
  specTypeId: number | null;
  subCategoryId: number | null;
  typeName?: string;
  createdAt: string;
  displayName: string;
  nameI18n?: Record<string, string>;
};

type SpecTypeOption = {
  id: number;
  displayName: string;
  subCategoryId: number | null;
  nameI18n?: Record<string, string>;
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

const initialMock: Spec[] = [];
const { locale, t } = useI18n({ useScope: 'global' });

const specTypeOptions = ref<SpecTypeOption[]>([]);
const subCategoryOptions = ref<SubCategoryOption[]>([]);

const list = ref<Spec[]>([]);
const query = reactive({
  nameKeyword: '',
  subCategoryId: null as number | null,
  specTypeId: null as number | null,
  pageNum: 1,
  pageSize: 10,
});

const filteredQuerySpecTypeOptions = computed(() => {
  if (!query.subCategoryId) {
    return specTypeOptions.value;
  }
  return specTypeOptions.value.filter(
    (item) => item.subCategoryId === query.subCategoryId,
  );
});

const filteredFormSpecTypeOptions = computed(() => {
  if (!form.subCategoryId) {
    return specTypeOptions.value;
  }
  return specTypeOptions.value.filter(
    (item) => item.subCategoryId === form.subCategoryId,
  );
});

const findSubCategoryIdBySpecTypeId = (specTypeId: unknown) => {
  const id = normalizeOptionalId(specTypeId);
  if (!id) return null;
  return (
    specTypeOptions.value.find((item) => item.id === id)?.subCategoryId ?? null
  );
};

const displayList = computed(() =>
  list.value.map((item) => ({
    ...item,
    typeName:
      specTypeOptions.value.find((t) => t.id === item.specTypeId)
        ?.displayName || '-',
  })),
);
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<Spec>({
  id: 0,
  sort: 0,
  subCategoryId: null,
  specTypeId: null,
  createdAt: '',
  displayName: '',
  nameI18n: {},
});
const nameI18nList = ref<{ lang: string; value: string }[]>([
  { lang: 'zh-CN', value: '' },
]);

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find(
          (i) => !i.lang?.trim() || !i.value?.trim(),
        );
        if (invalid)
          return cb(new Error(t('admin.spec.validation.nameI18nIncomplete')));
        cb();
      },
      trigger: 'change',
    },
  ],
  subCategoryId: [
    {
      required: true,
      message: t('admin.spec.validation.subcategoryRequired'),
      trigger: 'change',
    },
  ],
  specTypeId: [
    {
      required: true,
      message: t('admin.spec.validation.specTypeRequired'),
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
  query.specTypeId = null;
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
  const subCategoryId = subCategoryOptions.value[0]?.id ?? null;
  const defaultSpecTypeId =
    specTypeOptions.value.find(
      (item) => !subCategoryId || item.subCategoryId === subCategoryId,
    )?.id ?? null;
  Object.assign(form, {
    id: 0,
    sort: list.value.length + 1,
    subCategoryId,
    specTypeId: defaultSpecTypeId,
    createdAt: new Date().toISOString(),
    displayName: '',
    nameI18n: {},
  });
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
  dialogVisible.value = true;
};

const openEdit = (row: Spec) => {
  isEdit.value = true;
  const subCategoryId =
    row.subCategoryId ?? findSubCategoryIdBySpecTypeId(row.specTypeId);
  Object.assign(form, { ...row, subCategoryId });
  nameI18nList.value =
    row.nameI18n && Object.keys(row.nameI18n).length
      ? Object.entries(row.nameI18n).map(([lang, value]) => ({
          lang,
          value: value as string,
        }))
      : [{ lang: 'zh-CN', value: row.displayName || '' }];
  dialogVisible.value = true;
};

const save = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid) => {
    if (!valid) return;
    submitLoading.value = true;
    const zhName =
      nameI18nList.value.find((i) => i.lang === 'zh-CN' || i.lang === 'zh')
        ?.value ||
      nameI18nList.value[0]?.value ||
      '';
    const enName = nameI18nList.value.find((i) => i.lang === 'en')?.value || '';
    const payload = {
      id: form.id || undefined,
      specTypeId: form.specTypeId || undefined,
      specValue: zhName,
      specValueEn: enName,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>(
        (acc, cur) => {
          if (cur.lang && cur.value) acc[cur.lang] = cur.value;
          return acc;
        },
        {},
      ),
      ...(isEdit.value ? { sort: form.sort } : {}),
    };
    addOrUpdateSpecValue(payload)
      .then(() => {
        ElMessage.success(t('admin.spec.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || t('admin.spec.message.saveFailed'));
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
};

const toggleStatus = (row: Spec) => {};

const remove = (row: Spec) => {
  const label = pickI18nText(row.nameI18n, locale.value, row.displayName || '');
  ElMessageBox.confirm(
    t('admin.spec.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deleteSpecValue({ id: row.id }))
    .then(() => {
      ElMessage.success(t('admin.spec.message.deleteSuccess'));
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

const fetchSpecTypes = async () => {
  const res = await getSpecTypePage({ pageNum: 1, pageSize: 500 });
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
  specTypeOptions.value = records
    .map((item: any) => {
      const specType = item.specType ?? item;
      const id = Number(specType.id ?? item.id);
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      const subCategoryId = normalizeOptionalId(
        specType.subCategoryId ??
          specType.categoryId ??
          specType.pcategoryId ??
          item.subCategoryId ??
          item.categoryId ??
          item.pcategoryId,
      );
      return {
        id,
        subCategoryId,
        displayName: pickI18nText(
          item.nameI18n || specType.nameI18n,
          locale.value,
          specType.typeName || item.name || '',
        ),
        nameI18n: item.nameI18n || specType.nameI18n,
      };
    })
    .filter((item): item is SpecTypeOption => Boolean(item));

  if (
    query.specTypeId &&
    !filteredQuerySpecTypeOptions.value.some(
      (item) => item.id === query.specTypeId,
    )
  ) {
    query.specTypeId = null;
  }

  if (
    form.specTypeId &&
    !filteredFormSpecTypeOptions.value.some(
      (item) => item.id === form.specTypeId,
    )
  ) {
    form.specTypeId = filteredFormSpecTypeOptions.value[0]?.id ?? null;
  }
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getSpecValuePage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      categoryId: query.subCategoryId || undefined,
      specTypeId: query.specTypeId || undefined,
    });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => ({
      id: item.specValue?.id ?? item.id,
      nameI18n: item.nameI18n || item.specValue?.nameI18n,
      displayName: pickI18nText(
        item.nameI18n || item.specValue?.nameI18n,
        locale.value,
        item.specValue?.specValue || item.name || '',
      ),
      sort: item.specValue?.sort ?? item.sort ?? 0,
      specTypeId: normalizeOptionalId(
        item.specValue?.specTypeId ?? item.specTypeId,
      ),
      subCategoryId:
        normalizeOptionalId(
          item.specValue?.subCategoryId ??
            item.specValue?.categoryId ??
            item.specValue?.pcategoryId ??
            item.subCategoryId ??
            item.categoryId ??
            item.pcategoryId,
        ) ??
        findSubCategoryIdBySpecTypeId(
          item.specValue?.specTypeId ?? item.specTypeId,
        ),
      createdAt:
        item.specValue?.createTime || item.createTime || item.createdAt || '',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.spec.message.fetchFailed'));
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
        return {
          id,
          displayName: pickI18nText(
            nameI18n,
            locale.value,
            category.categoryName ||
              item.categoryName ||
              item.displayName ||
              '',
          ),
          nameI18n,
        };
      })
      .filter((item): item is SubCategoryOption => Boolean(item));
  } catch (error) {
    console.error('fetch subcategory failed:', error);
    subCategoryOptions.value = [];
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
  await Promise.allSettled([fetchSubCategoryOptions(), fetchSpecTypes()]);
  fetchList();
});

watch(
  () => query.subCategoryId,
  () => {
    if (
      !filteredQuerySpecTypeOptions.value.some(
        (item) => item.id === query.specTypeId,
      )
    ) {
      query.specTypeId = null;
    }
  },
);

watch(
  () => form.subCategoryId,
  () => {
    if (
      !filteredFormSpecTypeOptions.value.some(
        (item) => item.id === form.specTypeId,
      )
    ) {
      form.specTypeId = filteredFormSpecTypeOptions.value[0]?.id ?? null;
    }
  },
);

watch(
  () => locale.value,
  async () => {
    await Promise.allSettled([fetchSubCategoryOptions(), fetchSpecTypes()]);
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
