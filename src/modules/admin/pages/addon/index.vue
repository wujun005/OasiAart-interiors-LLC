<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.addon.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.categoryId" :placeholder="t('admin.addon.categoryPlaceholder')" clearable style="width: 200px">
          <el-option v-for="c in categoryOptions" :key="c.id" :label="c.displayName" :value="c.id" />
        </el-select>
        <el-button type="primary" @click="handleSearch">{{ t('admin.addon.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.addon.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.addon.actions.create') }}</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column :label="t('admin.addon.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column prop="categoryName" :label="t('admin.addon.table.category')" min-width="160" />
        <el-table-column prop="amount" :label="t('admin.addon.table.amount')" width="120" />
        <el-table-column :label="t('admin.addon.table.updatedAt')" min-width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.addon.table.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.addon.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.addon.actions.delete') }}
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
      :title="isEdit ? t('admin.addon.dialog.editTitle') : t('admin.addon.dialog.createTitle')"
      :close-on-click-modal="false"
      width="520px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="t('admin.addon.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.addon.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.addon.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">
                {{ t('admin.addon.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ t('admin.addon.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="t('admin.addon.form.category')" prop="categoryId">
          <el-select v-model="form.categoryId" :placeholder="t('admin.addon.form.categoryPlaceholder')" style="width: 100%">
            <el-option v-for="c in categoryOptions" :key="c.id" :label="c.displayName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('admin.addon.form.amount')" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.addon.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.addon.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getPage, addOrUpdate, deleteAttachValue } from '../../api/addon';
import { getPage as getAddonTypePage } from '../../api/addonType';
import { pickI18nText } from '@/modules/admin/utils/i18n';

type Addon = {
  id: number;
  categoryId: number | null;
  amount: number;
  updatedAt: string;
  displayName: string;
  nameI18n?: Record<string, string>;
};

const categoryOptions = ref<{ id: number; displayName: string; nameI18n?: Record<string, string> }[]>([]);
const { locale, t } = useI18n({ useScope: 'global' });

const list = ref<Addon[]>([]);
const query = reactive({
  nameKeyword: '',
  categoryId: null as number | null,
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<Addon>({
  id: 0,
  categoryId: null,
  amount: 0,
  updatedAt: '',
  displayName: '',
  nameI18n: {},
});
const nameI18nList = ref<{ lang: string; value: string }[]>([{ lang: 'zh-CN', value: '' }]);

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error(t('admin.addon.validation.nameI18nIncomplete')));
        cb();
      },
      trigger: 'change',
    },
  ],
  categoryId: [{ required: true, message: t('admin.addon.validation.categoryRequired'), trigger: 'change' }],
  amount: [{ required: true, message: t('admin.addon.validation.amountRequired'), trigger: 'blur' }],
};

const displayList = computed(() =>
  list.value.map((item) => ({
    ...item,
    categoryName: categoryOptions.value.find((c) => c.id === item.categoryId)?.displayName || '-',
  }))
);

const handleSearch = () => {
  query.pageNum = 1;
  fetchList();
};

const reset = () => {
  query.nameKeyword = '';
  query.categoryId = null;
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
    categoryId: categoryOptions.value[0]?.id ?? null,
    amount: 0,
    updatedAt: '',
    displayName: '',
    nameI18n: {},
  });
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
  dialogVisible.value = true;
};

const openEdit = (row: Addon) => {
  isEdit.value = true;
  Object.assign(form, { ...row });
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
    const zhName = nameI18nList.value.find((i) => i.lang === 'zh-CN' || i.lang === 'zh')?.value || nameI18nList.value[0]?.value || '';
    const enName = nameI18nList.value.find((i) => i.lang === 'en')?.value || '';
    const payload = {
      id: form.id || undefined,
      attachTypeId: form.categoryId,
      attachValue: zhName,
      attachValueEn: enName,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      amount: form.amount,
    };
    addOrUpdate(payload)
      .then(() => {
        ElMessage.success(t('admin.addon.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || t('admin.addon.message.saveFailed'));
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
};

const remove = (row: Addon) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || '',
  );
  ElMessageBox.confirm(
    t('admin.addon.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deleteAttachValue({ id: row.id }))
    .then(() => {
      ElMessage.success(t('admin.addon.message.deleteSuccess'));
      fetchList();
    })
    .catch((err: any) => {
      if (err === 'cancel' || err === 'close') return;
      ElMessage.error(err?.message || 'Request failed');
    });
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  const d = new Date(val);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fetchCategories = async () => {
  try {
    const res = await getAddonTypePage({ pageNum: 1, pageSize: 200 });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    categoryOptions.value = records.map((item: any) => ({
      id: item.id ?? item.attachType?.id,
      displayName: pickI18nText(
        item.nameI18n || item.attachType?.nameI18n,
        locale.value,
        item.attachType?.typeName || item.name || '',
      ),
      nameI18n: item.nameI18n || item.attachType?.nameI18n,
    }));
    if (!form.categoryId && categoryOptions.value.length) form.categoryId = categoryOptions.value[0].id;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.addon.message.fetchCategoryFailed'));
  }
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      attachTypeId: query.categoryId || undefined,
    });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => ({
      id: item.attachValue?.id ?? item.id,
      nameI18n: item.nameI18n || item.attachValue?.nameI18n,
      displayName: pickI18nText(
        item.nameI18n || item.attachValue?.nameI18n,
        locale.value,
        item.attachValue?.attachValue || item.name || '',
      ),
      categoryId: item.attachValue?.attachTypeId ?? item.attachTypeId ?? item.categoryId ?? null,
      amount: item.attachValue?.amount ?? item.amount ?? 0,
      updatedAt: item.attachValue?.modifyTime || item.attachValue?.updateTime || item.updatedAt || item.modifyTime || '',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.addon.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const addI18n = () => {
  nameI18nList.value.push({ lang: 'zh-CN', value: '' });
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

onMounted(() => {
  fetchCategories();
  fetchList();
});

watch(
  () => locale.value,
  () => {
    fetchCategories();
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
.i18n-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.i18n-row {
  display: flex;
  gap: 8px;
}
</style>
