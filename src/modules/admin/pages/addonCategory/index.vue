<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.addonCategory.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">{{ t('admin.addonCategory.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.addonCategory.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.addonCategory.actions.create') }}</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column :label="t('admin.addonCategory.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.addonCategory.table.updatedAt')" min-width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.addonCategory.table.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.addonCategory.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.addonCategory.actions.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('admin.addonCategory.dialog.editTitle') : t('admin.addonCategory.dialog.createTitle')"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="t('admin.addonCategory.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.addonCategory.form.languagePlaceholder')" style="width: 140px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.addonCategory.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">
                {{ t('admin.addonCategory.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ t('admin.addonCategory.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.addonCategory.actions.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('admin.addonCategory.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getPage, addOrUpdate, deleteAttachType } from '../../api/addonType';
import { ADMIN_LANG_EN, pickI18nText } from '@/modules/admin/utils/i18n';

type AddonCategory = {
  id: number;
  displayName: string;
  nameI18n?: Record<string, string>;
  updatedAt: string;
};

const list = ref<AddonCategory[]>([]);
const { locale, t } = useI18n({ useScope: 'global' });
const createEmptyI18nItem = (value = '') => ({
  lang: ADMIN_LANG_EN,
  value,
});
const query = reactive({ nameKeyword: '', pageNum: 1, pageSize: 10 });
const total = ref(0);
const tableLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<AddonCategory>({
  id: 0,
  displayName: '',
  nameI18n: {},
  updatedAt: '',
});
const nameI18nList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error(t('admin.addonCategory.validation.nameI18nIncomplete')));
        cb();
      },
      trigger: 'change',
    },
  ],
};

const displayList = computed(() => list.value);

const handleSearch = () => {
  query.pageNum = 1;
  fetchList();
};
const reset = () => {
  query.nameKeyword = '';
  query.pageNum = 1;
  fetchList();
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, { id: 0, displayName: '', nameI18n: {}, updatedAt: '' });
  nameI18nList.value = [createEmptyI18nItem()];
  dialogVisible.value = true;
};

const openEdit = (row: AddonCategory) => {
  isEdit.value = true;
  Object.assign(form, { ...row });
  nameI18nList.value = row.nameI18n && Object.keys(row.nameI18n).length
    ? Object.entries(row.nameI18n).map(([lang, value]) => ({ lang, value: value as string }))
    : [createEmptyI18nItem(row.displayName || '')];
  dialogVisible.value = true;
};

const save = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid) => {
    if (!valid) return;
    const payload = {
      id: form.id || undefined,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
    };
    addOrUpdate(payload)
      .then(() => {
        ElMessage.success(t('admin.addonCategory.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => ElMessage.error(err?.message || t('admin.addonCategory.message.saveFailed')));
  });
};

const remove = (row: AddonCategory) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || '',
  );
  ElMessageBox.confirm(
    t('admin.addonCategory.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deleteAttachType({ id: row.id }))
    .then(() => {
      ElMessage.success(t('admin.addonCategory.message.deleteSuccess'));
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

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getPage({ pageNum: query.pageNum, pageSize: query.pageSize, nameKeyword: query.nameKeyword?.trim() || undefined });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => {
      const attach = item.attachType || {};
      return {
        id: attach.id ?? item.id ?? 0,
        displayName: pickI18nText(
          item.nameI18n || attach.nameI18n,
          locale.value,
          attach.typeName || item.name || '',
        ),
        nameI18n: item.nameI18n || attach.nameI18n,
        updatedAt: attach.modifyTime || item.updatedAt || item.modifyTime || attach.createTime || '',
      } as AddonCategory;
    });
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.addonCategory.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const addI18n = () => {
  nameI18nList.value.push(createEmptyI18nItem());
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
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
}
</style>
