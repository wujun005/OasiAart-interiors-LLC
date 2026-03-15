<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.subcategory.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">{{ t('admin.subcategory.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.subcategory.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.subcategory.actions.create') }}</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column prop="sort" :label="t('admin.subcategory.table.sort')" width="100" />
        <el-table-column :label="t('admin.subcategory.table.name')" min-width="180">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.subcategory.table.createdAt')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <!-- <el-table-column :label="t('admin.subcategory.table.updateBy')" min-width="140">
          <template #default="{ row }">{{ row.updateBy || '-' }}</template>
        </el-table-column> -->
        <el-table-column :label="t('admin.subcategory.table.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.subcategory.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.subcategory.actions.delete') }}
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
      :title="isEdit ? t('admin.subcategory.dialog.editTitle') : t('admin.subcategory.dialog.createTitle')"
      :close-on-click-modal="false"
      width="520px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item :label="t('admin.subcategory.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.subcategory.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.subcategory.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">
                {{ t('admin.subcategory.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ t('admin.subcategory.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.subcategory.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.subcategory.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getPage, add, update, del } from '@/modules/admin/api/category';
import { ADMIN_LANG_EN, pickI18nText } from '@/modules/admin/utils/i18n';

type SubCategoryRow = {
  id: number;
  sort: number;
  createdAt: string;
  updateBy: string;
  nameI18n?: Record<string, string>;
  displayName: string;
};

type SubCategoryForm = {
  id: number;
  nameI18n?: Record<string, string>;
  displayName: string;
};

const { locale, t } = useI18n({ useScope: 'global' });
const createEmptyI18nItem = (value = '') => ({
  lang: ADMIN_LANG_EN,
  value,
});
const list = ref<SubCategoryRow[]>([]);
const query = reactive({
  nameKeyword: '',
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const tableLoading = ref(false);

const displayList = computed(() => list.value);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<SubCategoryForm>({
  id: 0,
  nameI18n: {},
  displayName: '',
});
const nameI18nList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error(t('admin.subcategory.validation.nameI18nIncomplete')));
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
    nameI18n: {},
  });
  nameI18nList.value = [createEmptyI18nItem()];
  dialogVisible.value = true;
};

const openEdit = (row: SubCategoryRow) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    displayName: row.displayName,
    nameI18n: row.nameI18n || {},
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
    const action = isEdit.value ? update : add;
    const zhName = nameI18nList.value.find((i) => i.lang === 'zh-CN')?.value || nameI18nList.value[0]?.value || '';
    const enName = nameI18nList.value.find((i) => i.lang === 'en')?.value || '';
    const payload = {
      id: form.id || undefined,
      categoryName: zhName,
      categoryEnglishName: enName,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      pcategoryId: '0',
      rootId: '0',
      categoryDomain: '2',
    };
    action(payload)
      .then(() => {
        ElMessage.success(t('admin.subcategory.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || t('admin.subcategory.message.saveFailed'));
      })
      .finally(() => {
        submitLoading.value = false;
    });
  });
};

const remove = (row: SubCategoryRow) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || '',
  );
  ElMessageBox.confirm(
    t('admin.subcategory.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => del({ id: row.id }))
    .then(() => {
      ElMessage.success(t('admin.subcategory.message.deleteSuccess'));
      fetchList();
    })
    .catch((err: any) => {
      if (err === 'cancel' || err === 'close') return;
      ElMessage.error(err?.message || 'Request failed');
    });
};

const addI18n = () => {
  nameI18nList.value.push(createEmptyI18nItem());
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  const date = new Date(val);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      categoryDomain: '2',
    });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => ({
      id: item.category?.id ?? item.id,
      nameI18n: item.nameI18n || item.category?.nameI18n,
      displayName: pickI18nText(
        item.nameI18n || item.category?.nameI18n,
        locale.value,
        item.category?.categoryName || item.categoryName || item.name || '',
      ),
      sort: item.category?.sort ?? item.sort ?? 0,
      createdAt: item.category?.createTime || item.createdAt || item.createTime || '',
      updateBy:
        String(
          item.category?.updateBy ??
            item.updateBy ??
            item.category?.updateByName ??
            item.updateByName ??
            item.category?.updater ??
            item.updater ??
            '',
        ).trim() || '-',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.subcategory.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

onMounted(() => {
  fetchList();
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
  flex-wrap: wrap;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
