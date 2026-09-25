<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model.trim="query.supplierName"
          :placeholder="t('admin.supplier.filters.supplierName')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.status"
          :placeholder="t('admin.supplier.filters.status')"
          clearable
        >
          <el-option :label="t('admin.common.enabled')" :value="1" />
          <el-option :label="t('admin.common.disabled')" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          {{ t('admin.supplier.actions.search') }}
        </el-button>
        <el-button @click="reset">
          {{ t('admin.supplier.actions.reset') }}
        </el-button>
        <el-button type="primary" @click="openCreate">
          {{ t('admin.supplier.actions.create') }}
        </el-button>
      </div>

      <el-table :data="suppliers" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column prop="supplierName" :label="t('admin.supplier.table.supplierName')" min-width="140" />
        <el-table-column prop="contactInfo" :label="t('admin.supplier.table.contactInfo')" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.contactInfo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" :label="t('admin.supplier.table.remark')" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplier.table.status')" width="88">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :loading="statusChangingId === row.id"
              @change="(value: string | number | boolean) => handleStatusChange(row, Boolean(value))"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplier.table.updatedAt')" width="148">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.supplier.table.actions')" width="132" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.supplier.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="removeSupplier(row)">
              {{ t('admin.supplier.actions.delete') }}
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
          :page-sizes="[10, 20, 50, 100]"
          @current-change="fetchSuppliers"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('admin.supplier.dialog.editTitle') : t('admin.supplier.dialog.createTitle')"
      :close-on-click-modal="false"
      width="760px"
      @closed="formRef?.clearValidate()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item :label="t('admin.supplier.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, index) in nameI18nList" :key="index" class="i18n-row">
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.supplier.form.languagePlaceholder')"
              >
                <el-option :label="t('admin.common.langZhCn')" value="zh" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model.trim="item.value"
                :placeholder="t('admin.supplier.form.namePlaceholder')"
                maxlength="100"
              />
              <el-button
                link
                type="danger"
                :disabled="nameI18nList.length === 1"
                @click="removeI18n(index)"
              >
                {{ t('admin.supplier.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">
              {{ t('admin.supplier.actions.addLang') }}
            </el-button>
          </div>
        </el-form-item>
        <div class="form-grid">
          <el-form-item :label="t('admin.supplier.form.contactInfo')" prop="contactInfo">
            <el-input
              v-model.trim="form.contactInfo"
              :placeholder="t('admin.supplier.form.contactInfoPlaceholder')"
              maxlength="255"
            />
          </el-form-item>
          <el-form-item :label="t('admin.supplier.form.status')">
            <el-radio-group v-model="form.status">
              <el-radio :value="1">{{ t('admin.common.enabled') }}</el-radio>
              <el-radio :value="0">{{ t('admin.common.disabled') }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
        <el-form-item :label="t('admin.supplier.form.remarkI18n')" prop="remarkI18n">
          <div class="i18n-list">
            <div v-for="(item, index) in remarkI18nList" :key="index" class="i18n-row i18n-row--textarea">
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.supplier.form.languagePlaceholder')"
              >
                <el-option :label="t('admin.common.langZhCn')" value="zh" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model="item.value"
                type="textarea"
                :rows="3"
                :placeholder="t('admin.supplier.form.remarkPlaceholder')"
                maxlength="500"
                show-word-limit
              />
              <el-button
                link
                type="danger"
                :disabled="remarkI18nList.length === 1"
                @click="removeRemarkI18n(index)"
              >
                {{ t('admin.supplier.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addRemarkI18n">
              {{ t('admin.supplier.actions.addLang') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ t('admin.supplier.actions.cancel') }}
        </el-button>
        <el-button type="primary" :loading="submitting" @click="save">
          {{ t('admin.supplier.actions.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
  addOrUpdate,
  changeStatus,
  detail,
  page,
  remove,
} from '@/modules/admin/api/supplier';
import {
  ADMIN_LANG_EN,
  pickI18nText,
} from '@/modules/admin/utils/i18n';

type SupplierRow = {
  id: number | string;
  supplierName: string;
  nameI18n?: Record<string, string>;
  contactInfo: string;
  remark: string;
  remarkI18n?: Record<string, string>;
  status: number;
  updatedAt: string;
};

const { locale, t } = useI18n({ useScope: 'global' });
const suppliers = ref<SupplierRow[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const statusChangingId = ref<number | string | null>(null);
const formRef = ref<FormInstance>();

const query = reactive({
  supplierName: '',
  status: '' as '' | number,
  pageNum: 1,
  pageSize: 10,
});

const createEmptyForm = () => ({
  id: null as number | string | null,
  supplierName: '',
  nameI18n: {} as Record<string, string>,
  contactInfo: '',
  remark: '',
  remarkI18n: {} as Record<string, string>,
  status: 1,
});

const form = reactive(createEmptyForm());
const createEmptyI18nItem = (value = '') => ({
  lang: ADMIN_LANG_EN,
  value,
});
const nameI18nList = ref<{ lang: string; value: string }[]>([
  createEmptyI18nItem(),
]);
const remarkI18nList = ref<{ lang: string; value: string }[]>([
  createEmptyI18nItem(),
]);

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_rule, _value, callback) => {
        const invalid = nameI18nList.value.find(
          (item) => !item.lang?.trim() || !item.value?.trim(),
        );
        if (invalid) {
          callback(new Error(t('admin.supplier.validation.nameI18nIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
  remarkI18n: [
    {
      validator: (_rule, _value, callback) => {
        const invalid = remarkI18nList.value.find(
          (item) => item.value?.trim() && !item.lang?.trim(),
        );
        if (invalid) {
          callback(new Error(t('admin.supplier.validation.remarkI18nIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
};

const normalizeStatus = (value: unknown) => {
  const normalized = String(value).trim().toUpperCase();
  if (value === true || value === 1 || normalized === '1' || normalized === 'ENABLED') return 1;
  return 0;
};

const parseSupplier = (item: any): SupplierRow => {
  const supplier = item?.supplier ?? item ?? {};
  const nameI18n = (
    supplier.nameI18n ??
    supplier.supplierNameI18n ??
    item?.nameI18n ??
    item?.supplierNameI18n ??
    {}
  ) as Record<string, string>;
  const remarkI18n = (
    supplier.remarkI18n ??
    item?.remarkI18n ??
    {}
  ) as Record<string, string>;
  const fallbackName = String(
    supplier.supplierName ?? supplier.name ?? item?.supplierName ?? item?.name ?? '',
  ).trim();
  return {
    id: supplier.id ?? supplier.supplierId ?? item?.id ?? item?.supplierId ?? '',
    supplierName: pickI18nText(nameI18n, locale.value, fallbackName),
    nameI18n,
    contactInfo: String(supplier.contactInfo ?? '').trim(),
    remark: pickI18nText(
      remarkI18n,
      locale.value,
      String(supplier.remark ?? '').trim(),
    ),
    remarkI18n,
    status: normalizeStatus(supplier.status ?? supplier.enabled ?? 1),
    updatedAt: String(
      supplier.updatedAt ?? supplier.modifyTime ?? supplier.createTime ?? '',
    ).trim(),
  };
};

const normalizePage = (payload: any) => {
  const root = payload?.data ?? payload ?? {};
  const records = Array.isArray(root)
    ? root
    : Array.isArray(root.list)
      ? root.list
      : Array.isArray(root.records)
        ? root.records
        : Array.isArray(root.data?.list)
          ? root.data.list
          : [];
  const totalValue = Number(root.total ?? root.data?.total ?? records.length);
  return {
    records,
    total: Number.isFinite(totalValue) ? totalValue : records.length,
  };
};

const buildPagePayload = () => {
  const payload: Record<string, string | number> = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  };
  if (query.supplierName) payload.supplierName = query.supplierName;
  if (query.status !== '') payload.status = query.status;
  return payload;
};

const fetchSuppliers = async () => {
  tableLoading.value = true;
  try {
    const res = await page(buildPagePayload());
    const parsed = normalizePage(res);
    suppliers.value = parsed.records.map(parseSupplier);
    total.value = parsed.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplier.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchSuppliers();
};

const reset = () => {
  query.supplierName = '';
  query.status = '';
  query.pageNum = 1;
  query.pageSize = 10;
  fetchSuppliers();
};

const handleSizeChange = (pageSize: number) => {
  query.pageSize = pageSize;
  query.pageNum = 1;
  fetchSuppliers();
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, createEmptyForm());
  nameI18nList.value = [createEmptyI18nItem()];
  remarkI18nList.value = [createEmptyI18nItem()];
  dialogVisible.value = true;
};

const setNameI18nList = (supplier: SupplierRow) => {
  nameI18nList.value = supplier.nameI18n && Object.keys(supplier.nameI18n).length
    ? Object.entries(supplier.nameI18n).map(([lang, value]) => ({ lang, value }))
    : [createEmptyI18nItem(supplier.supplierName || '')];
};

const setRemarkI18nList = (supplier: SupplierRow) => {
  remarkI18nList.value = supplier.remarkI18n && Object.keys(supplier.remarkI18n).length
    ? Object.entries(supplier.remarkI18n).map(([lang, value]) => ({ lang, value }))
    : [createEmptyI18nItem(supplier.remark || '')];
};

const openEdit = async (row: SupplierRow) => {
  isEdit.value = true;
  Object.assign(form, createEmptyForm(), row);
  setNameI18nList(row);
  setRemarkI18nList(row);
  dialogVisible.value = true;
  try {
    const res = await detail(row.id);
    const supplier = parseSupplier(res?.data ?? res ?? row);
    Object.assign(form, supplier);
    setNameI18nList(supplier);
    setRemarkI18nList(supplier);
  } catch (error: any) {
    dialogVisible.value = false;
    ElMessage.error(error?.message || t('admin.supplier.message.detailFailed'));
  }
};

const save = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const nameI18n = nameI18nList.value.reduce<Record<string, string>>(
      (result, item) => {
        if (item.lang && item.value) result[item.lang] = item.value;
        return result;
      },
      {},
    );
    const supplierName = nameI18n[ADMIN_LANG_EN] || Object.values(nameI18n)[0] || '';
    const remarkI18n = remarkI18nList.value.reduce<Record<string, string>>(
      (result, item) => {
        if (item.lang && item.value) result[item.lang] = item.value;
        return result;
      },
      {},
    );
    const remark = remarkI18n[ADMIN_LANG_EN] || Object.values(remarkI18n)[0] || '';
    const payload = {
      ...(form.id !== null && form.id !== '' ? { id: form.id } : {}),
      supplierName,
      nameI18n,
      contactInfo: form.contactInfo || undefined,
      remark,
      remarkI18n,
      status: form.status,
    };
    await addOrUpdate(payload);
    ElMessage.success(t('admin.supplier.message.saveSuccess'));
    dialogVisible.value = false;
    await fetchSuppliers();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplier.message.saveFailed'));
  } finally {
    submitting.value = false;
  }
};

const addI18n = () => {
  nameI18nList.value.push(createEmptyI18nItem());
};

const removeI18n = (index: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(index, 1);
};

const addRemarkI18n = () => {
  remarkI18nList.value.push(createEmptyI18nItem());
};

const removeRemarkI18n = (index: number) => {
  if (remarkI18nList.value.length === 1) return;
  remarkI18nList.value.splice(index, 1);
};

const removeSupplier = async (row: SupplierRow) => {
  try {
    await ElMessageBox.confirm(
      t('admin.supplier.message.deleteConfirm', { name: row.supplierName }),
      t('admin.common.confirmTitle'),
      { type: 'warning' },
    );
    await remove({ id: row.id });
    ElMessage.success(t('admin.supplier.message.deleteSuccess'));
    if (suppliers.value.length === 1 && query.pageNum > 1) query.pageNum -= 1;
    await fetchSuppliers();
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return;
    ElMessage.error(error?.message || t('admin.supplier.message.deleteFailed'));
  }
};

const handleStatusChange = async (row: SupplierRow, enabled: boolean) => {
  const nextStatus = enabled ? 1 : 0;
  statusChangingId.value = row.id;
  try {
    await changeStatus({ id: row.id, status: nextStatus });
    row.status = nextStatus;
    ElMessage.success(t('admin.supplier.message.statusSuccess'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplier.message.statusFailed'));
  } finally {
    statusChangingId.value = null;
  }
};

const formatDateTime = (value?: string) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

onMounted(fetchSuppliers);

watch(
  () => locale.value,
  () => fetchSuppliers(),
);
</script>

<style scoped>
.page {
  padding: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.toolbar .el-input,
.toolbar .el-select {
  width: 200px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 12px;
}

.i18n-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.i18n-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.i18n-row--textarea {
  align-items: start;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
