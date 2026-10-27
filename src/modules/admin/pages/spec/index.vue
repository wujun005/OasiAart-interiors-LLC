<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="text('admin.spec.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.subCategoryId"
          :placeholder="text('admin.spec.subcategoryPlaceholder')"
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
          v-model="query.priced"
          :placeholder="text('admin.specType.table.priced')"
          clearable
          style="width: 200px"
        >
          <el-option :label="text('admin.specType.form.pricedNo')" :value="0" />
          <el-option :label="text('admin.specType.form.pricedYes')" :value="1" />
        </el-select>
        <el-select
          v-model="query.specTypeId"
          :placeholder="text('admin.spec.specTypePlaceholder')"
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
          text('admin.spec.actions.search')
        }}</el-button>
        <el-button @click="reset">{{
          text('admin.spec.actions.reset')
        }}</el-button>
        <el-button type="primary" @click="openCreate">{{
          text('admin.spec.actions.create')
        }}</el-button>
      </div>

      <el-table
        :data="displayList"
        border
        stripe
        row-key="id"
        v-loading="tableLoading"
      >
        <el-table-column :label="text('admin.spec.table.name')" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column
          prop="subCategoryName"
          :label="text('admin.spec.table.subcategory')"
          min-width="140"
        />
        <el-table-column
          prop="typeName"
          :label="text('admin.spec.table.specType')"
          min-width="140"
        />
        <el-table-column
          prop="pricingText"
          :label="text('admin.specType.table.priced')"
          min-width="180"
        />
        <el-table-column :label="text('admin.spec.table.price')" width="120">
          <template #default="{ row }">{{ row.priceText }}</template>
        </el-table-column>
        <el-table-column :label="text('admin.spec.table.remark')" min-width="200">
          <template #default="{ row }">
            <span class="remark-cell">{{ row.displayRemark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="text('admin.spec.table.createdAt')"
          width="148"
        >
          <template #default="{ row }">{{
            formatDate(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column
          :label="text('admin.spec.table.actions')"
          width="132"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ text('admin.spec.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ text('admin.spec.actions.delete') }}
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
          ? text('admin.spec.dialog.editTitle')
          : text('admin.spec.dialog.createTitle')
      "
      :close-on-click-modal="false"
      width="min(640px, calc(100vw - 32px))"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item
          :label="text('admin.spec.form.subcategory')"
          prop="subCategoryId"
        >
          <el-select
            v-model="form.subCategoryId"
            :placeholder="text('admin.spec.form.subcategoryPlaceholder')"
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
        <el-form-item :label="text('admin.spec.form.specType')" prop="specTypeId">
          <el-select
            v-model="form.specTypeId"
            :placeholder="text('admin.spec.form.specTypePlaceholder')"
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
        <el-form-item :label="text('admin.specType.form.priced')">
          <div class="priced-field">
            <el-radio-group v-model="pricing">
              <el-radio :value="0">{{ text('admin.specType.form.pricedNo') }}</el-radio>
              <el-radio :value="1">{{ text('admin.specType.form.pricedYes') }}</el-radio>
            </el-radio-group>
            <p class="field-hint">{{ text('admin.specType.form.pricedHint') }}</p>
          </div>
        </el-form-item>
        <el-form-item
          v-if="selectedSpecTypePriced"
          :label="text('admin.spec.form.price')"
          prop="price"
          required
        >
          <el-input-number
            v-model="form.price"
            :min="0"
            :max="99999999.99"
            :precision="2"
            :step="1"
            :placeholder="text('admin.spec.form.pricePlaceholder')"
            controls-position="right"
            style="width: 100%"
          />
          <p class="field-hint">{{ text('admin.spec.form.priceHint') }}</p>
        </el-form-item>
        <el-form-item :label="text('admin.spec.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in nameI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="text('admin.spec.form.languagePlaceholder')"
                style="width: 140px"
              >
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model="item.value"
                :placeholder="text('admin.spec.form.namePlaceholder')"
              />
              <el-button
                link
                type="danger"
                :disabled="nameI18nList.length === 1"
                @click="removeI18n(idx)"
              >
                {{ text('admin.spec.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{
              text('admin.spec.actions.addLang')
            }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="text('admin.spec.form.remarkI18n')">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in remarkI18nList"
              :key="idx"
              class="i18n-row i18n-row--textarea"
            >
              <el-select
                v-model="item.lang"
                :placeholder="text('admin.spec.form.languagePlaceholder')"
                style="width: 140px"
              >
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model="item.value"
                type="textarea"
                :rows="2"
                maxlength="500"
                show-word-limit
                :placeholder="text('admin.spec.form.remarkPlaceholder')"
              />
              <el-button
                link
                type="danger"
                :disabled="remarkI18nList.length === 1"
                @click="removeRemarkI18n(idx)"
              >
                {{ text('admin.spec.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addRemarkI18n">{{
              text('admin.spec.actions.addLang')
            }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{
          text('admin.spec.actions.cancel')
        }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{
          text('admin.spec.actions.save')
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
import { addOrUpdateSpecType, getSpecTypePage } from '@/modules/admin/api/specType';
import {
  getSpecValuePage,
  addOrUpdateSpecValue,
  deleteSpecValue,
} from '@/modules/admin/api/spec';
import { ADMIN_LANG_EN, pickI18nText } from '@/modules/admin/utils/i18n';
import { searchCategory } from '@/modules/admin/api/category';
import { getPage as getPackageServiceCategoryPage } from '@/modules/admin/api/packageServiceCategory';

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
  'admin.spec.searchPlaceholder': 'admin.packageCatalog.spec.searchPlaceholder',
  'admin.spec.specTypePlaceholder': 'admin.packageCatalog.spec.specTypePlaceholder',
  'admin.spec.actions.create': 'admin.packageCatalog.spec.actions.create',
  'admin.spec.table.specType': 'admin.packageCatalog.spec.table.specType',
  'admin.spec.dialog.createTitle': 'admin.packageCatalog.spec.dialog.createTitle',
  'admin.spec.dialog.editTitle': 'admin.packageCatalog.spec.dialog.editTitle',
  'admin.spec.form.remarkPlaceholder': 'admin.packageCatalog.spec.form.remarkPlaceholder',
  'admin.spec.form.specType': 'admin.packageCatalog.spec.form.specType',
  'admin.spec.form.specTypePlaceholder': 'admin.packageCatalog.spec.form.specTypePlaceholder',
  'admin.spec.validation.specTypeRequired': 'admin.packageCatalog.spec.validation.specTypeRequired',
  'admin.spec.message.fetchFailed': 'admin.packageCatalog.spec.message.fetchFailed',
  'admin.spec.message.deleteConfirm': 'admin.packageCatalog.spec.message.deleteConfirm',
  'admin.spec.subcategoryPlaceholder': 'admin.packageCatalog.subcategory.label',
  'admin.spec.table.subcategory': 'admin.packageCatalog.subcategory.label',
  'admin.spec.form.subcategory': 'admin.packageCatalog.subcategory.label',
  'admin.spec.form.subcategoryPlaceholder': 'admin.packageCatalog.subcategory.placeholder',
  'admin.spec.validation.subcategoryRequired': 'admin.packageCatalog.subcategory.required',
};
const text = (key: string, values?: Record<string, unknown>) =>
  t(props.catalog === 'package' ? packageLabelKey[key] || key : key, values || {});

type Spec = {
  id: number;
  sort: number;
  specTypeId: number | null;
  subCategoryId: number | null;
  typeName?: string;
  createdAt: string;
  displayName: string;
  nameI18n?: Record<string, string>;
  displayRemark?: string;
  remarkI18n?: Record<string, string>;
  price: number | null;
};

type SpecTypeOption = {
  id: number;
  displayName: string;
  subCategoryId: number | null;
  priced: 0 | 1;
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
const createEmptyI18nItem = (value = '') => ({
  lang: ADMIN_LANG_EN,
  value,
});

const specTypeOptions = ref<SpecTypeOption[]>([]);
const subCategoryOptions = ref<SubCategoryOption[]>([]);

const list = ref<Spec[]>([]);
const query = reactive({
  nameKeyword: '',
  subCategoryId: null as number | null,
  specTypeId: null as number | null,
  priced: null as 0 | 1 | null,
  pageNum: 1,
  pageSize: 10,
});

const activeCategoryIds = () => {
  if (props.catalog !== 'package') return [query.subCategoryId || undefined];
  return query.subCategoryId
    ? [query.subCategoryId]
    : subCategoryOptions.value.map((item) => item.id);
};

const matchesSpecTypeFilter = (item: SpecTypeOption) => {
  if (query.subCategoryId && item.subCategoryId !== query.subCategoryId) return false;
  if (query.priced === 0 || query.priced === 1) return item.priced === query.priced;
  return true;
};

const filteredQuerySpecTypeOptions = computed(() =>
  specTypeOptions.value.filter(matchesSpecTypeFilter),
);

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

const specTypeById = (specTypeId: unknown) =>
  specTypeOptions.value.find((item) => item.id === normalizeOptionalId(specTypeId));

const optionPrice = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const priceText = (row: Spec) => {
  if (specTypeById(row.specTypeId)?.priced !== 1 || row.price == null) return '-';
  return Number(row.price).toFixed(2);
};

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
      (item.subCategoryId ? subCategoryMap.value.get(item.subCategoryId) : '') ||
      '-',
    typeName: specTypeById(item.specTypeId)?.displayName || '-',
    pricingText:
      specTypeById(item.specTypeId)?.priced === 1
        ? text('admin.specType.form.pricedYes')
        : text('admin.specType.form.pricedNo'),
    priceText: priceText(item),
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
  displayRemark: '',
  remarkI18n: {},
  price: null,
});
const nameI18nList = ref<{ lang: string; value: string }[]>([
  createEmptyI18nItem(),
]);
const remarkI18nList = ref<{ lang: string; value: string }[]>([
  createEmptyI18nItem(),
]);

const pricing = ref<0 | 1>(0);
const selectedSpecTypePriced = computed(() => pricing.value === 1);
const syncPricing = () => {
  pricing.value = specTypeById(form.specTypeId)?.priced === 1 ? 1 : 0;
};

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find(
          (i) => !i.lang?.trim() || !i.value?.trim(),
        );
        if (invalid)
          return cb(new Error(text('admin.spec.validation.nameI18nIncomplete')));
        cb();
      },
      trigger: 'change',
    },
  ],
  subCategoryId: [
    {
      required: true,
      message: text('admin.spec.validation.subcategoryRequired'),
      trigger: 'change',
    },
  ],
  specTypeId: [
    {
      required: true,
      message: text('admin.spec.validation.specTypeRequired'),
      trigger: 'change',
    },
  ],
  price: [
    {
      validator: (_rule, value, callback) => {
        if (!selectedSpecTypePriced.value) {
          callback();
          return;
        }
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0 || amount > 99999999.99) {
          callback(new Error(text('admin.spec.validation.priceRequired')));
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
  query.subCategoryId = null;
  query.specTypeId = null;
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
  const subCategoryId = subCategoryOptions.value[0]?.id ?? null;
  const defaultSpecTypeId =
    specTypeOptions.value.find(
      (item) => !subCategoryId || item.subCategoryId === subCategoryId,
    )?.id ?? null;
  Object.assign(form, {
    id: 0,
    sort: 0,
    subCategoryId,
    specTypeId: defaultSpecTypeId,
    createdAt: new Date().toISOString(),
    displayName: '',
    nameI18n: {},
    displayRemark: '',
    remarkI18n: {},
    price: null,
  });
  nameI18nList.value = [createEmptyI18nItem()];
  remarkI18nList.value = [createEmptyI18nItem()];
  syncPricing();
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
      : [createEmptyI18nItem(row.displayName || '')];
  remarkI18nList.value =
    row.remarkI18n && Object.keys(row.remarkI18n).length
      ? Object.entries(row.remarkI18n).map(([lang, value]) => ({
          lang,
          value: value as string,
        }))
      : [createEmptyI18nItem(row.displayRemark || '')];
  syncPricing();
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
    const remarkI18n = remarkI18nList.value.reduce<Record<string, string>>(
      (acc, cur) => {
        if (cur.lang && cur.value?.trim()) acc[cur.lang] = cur.value.trim();
        return acc;
      },
      {},
    );
    const remark =
      remarkI18n['zh-CN'] ||
      remarkI18n.zh ||
      remarkI18n.en ||
      Object.values(remarkI18n)[0] ||
      '';
    const subCategoryId =
      form.subCategoryId ??
      findSubCategoryIdBySpecTypeId(form.specTypeId) ??
      undefined;
    const subCategoryIdStr = subCategoryId ? String(subCategoryId) : undefined;
    const nextPriced = pricing.value === 1 ? 1 : 0;
    const specType = specTypeById(form.specTypeId);
    const persistPricing =
      specType && specType.priced !== nextPriced
        ? addOrUpdateSpecType({
            id: specType.id,
            categoryId: specType.subCategoryId ?? subCategoryId,
            subCategoryId: specType.subCategoryId ?? subCategoryId,
            nameI18n: specType.nameI18n || {},
            priced: nextPriced,
          }).then(() => {
            specType.priced = nextPriced;
          })
        : Promise.resolve();
    const payload = {
      id: form.id || undefined,
      subCategoryId,
      categoryId: subCategoryId,
      pcategoryId: subCategoryIdStr,
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
      remark,
      remarkI18n,
      ...(isEdit.value ? { sort: form.sort } : {}),
      ...(selectedSpecTypePriced.value
        ? { price: Number(form.price) }
        : {}),
    };
    persistPricing
      .then(() => addOrUpdateSpecValue(payload))
      .then(() => {
        ElMessage.success(text('admin.spec.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || text('admin.spec.message.saveFailed'));
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
    text('admin.spec.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => deleteSpecValue({ id: row.id }))
    .then(() => {
      ElMessage.success(text('admin.spec.message.deleteSuccess'));
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
  const categoryIds = props.catalog === 'package'
    ? subCategoryOptions.value.map((item) => item.id)
    : [undefined];
  if (props.catalog === 'package' && !categoryIds.length) {
    specTypeOptions.value = [];
    return;
  }
  const records: any[] = [];
  for (const categoryId of categoryIds) {
    const res = await getSpecTypePage({
      pageNum: 1,
      pageSize: 500,
      categoryDomain: categoryDomain.value,
      categoryId,
    });
    const payload = res?.data ?? res ?? {};
    const page = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.list)
        ? payload.list
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.list)
            ? payload.data.list
            : [];
    records.push(...page);
  }
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
        priced: Number(specType.priced ?? item.priced) === 1 ? 1 : 0,
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

const mapSpecRecord = (item: any): Spec => ({
  id: item.specValue?.id ?? item.id,
  nameI18n: item.nameI18n || item.specValue?.nameI18n,
  remarkI18n: item.remarkI18n || item.specValue?.remarkI18n || {},
  displayName: pickI18nText(
    item.nameI18n || item.specValue?.nameI18n,
    locale.value,
    item.specValue?.specValue || item.name || '',
  ),
  displayRemark: pickI18nText(
    item.remarkI18n || item.specValue?.remarkI18n,
    locale.value,
    item.specValue?.remark || item.remark || '',
  ),
  sort: item.sort ?? item.specValue?.sort ?? 0,
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
  price: optionPrice(item.specValue?.price ?? item.price),
});

const pageRecords = (res: any) => {
  const data = res?.data ?? res ?? {};
  const records = Array.isArray(data.list)
    ? data.list
    : Array.isArray(data)
      ? data
      : [];
  const reported = Number(data.total);
  return {
    records,
    total: Number.isFinite(reported) ? reported : records.length,
  };
};

const loadPricedTypeIds = async () => {
  const ids = new Set<number>();
  const categoryIds = activeCategoryIds();
  if (props.catalog === 'package' && !categoryIds.length) return ids;
  for (const categoryId of categoryIds) {
  let pageNum = 1;
  let seen = 0;
  let reported = 0;
  do {
    const res = await getSpecTypePage({
      pageNum,
      pageSize: 200,
      priced: query.priced,
      categoryId: categoryId || undefined,
      categoryDomain: categoryDomain.value,
    });
    const page = pageRecords(res);
    page.records.forEach((item: any) => {
      const id = Number(item.specType?.id ?? item.id);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    });
    reported = page.total;
    seen += page.records.length;
    if (!page.records.length || seen >= reported) break;
    pageNum += 1;
  } while (pageNum <= 20);
  }
  return ids;
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const filtering = query.priced === 0 || query.priced === 1;
    const categoryIds = activeCategoryIds();
    if (props.catalog === 'package' && !categoryIds.length) {
      list.value = [];
      total.value = 0;
      return;
    }
    const request = {
      nameKeyword: query.nameKeyword?.trim() || undefined,
      categoryId: categoryIds.length === 1 ? categoryIds[0] : query.subCategoryId || undefined,
      specTypeId: query.specTypeId || undefined,
      categoryDomain: categoryDomain.value,
    };
    if (!filtering && categoryIds.length > 1) {
      const collected: any[] = [];
      for (const categoryId of categoryIds) {
        let pageNum = 1;
        let seen = 0;
        let reported = 0;
        do {
          const page = pageRecords(await getSpecValuePage({
            ...request,
            categoryId,
            pageNum,
            pageSize: 200,
          }));
          collected.push(...page.records);
          reported = page.total;
          seen += page.records.length;
          if (!page.records.length || seen >= reported) break;
          pageNum += 1;
        } while (pageNum <= 25);
      }
      const matched = collected.map(mapSpecRecord);
      total.value = matched.length;
      const start = (query.pageNum - 1) * query.pageSize;
      list.value = matched.slice(start, start + query.pageSize);
      return;
    }
    if (!filtering) {
      const page = pageRecords(await getSpecValuePage({
        ...request,
        pageNum: query.pageNum,
        pageSize: query.pageSize,
      }));
      list.value = page.records.map(mapSpecRecord);
      total.value = page.total;
      return;
    }
    const allowed = await loadPricedTypeIds();
    if (query.specTypeId && !allowed.has(query.specTypeId)) {
      list.value = [];
      total.value = 0;
      return;
    }
    const typeIds = query.specTypeId
      ? [query.specTypeId]
      : allowed.size <= 15
        ? [...allowed]
        : [undefined];
    const collected: any[] = [];
    for (const specTypeId of typeIds) {
      let pageNum = 1;
      let seen = 0;
      let reported = 0;
      do {
        const page = pageRecords(await getSpecValuePage({
          ...request,
          specTypeId,
          pageNum,
          pageSize: 200,
        }));
        collected.push(...page.records);
        reported = page.total;
        seen += page.records.length;
        if (!page.records.length || seen >= reported) break;
        pageNum += 1;
      } while (pageNum <= 25);
    }
    const matched = collected
      .map(mapSpecRecord)
      .filter((row) => row.specTypeId != null && allowed.has(row.specTypeId));
    total.value = matched.length;
    const start = (query.pageNum - 1) * query.pageSize;
    list.value = matched.slice(start, start + query.pageSize);
  } catch (error: any) {
    ElMessage.error(error?.message || text('admin.spec.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

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
  nameI18nList.value.push(createEmptyI18nItem());
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

const addRemarkI18n = () => {
  remarkI18nList.value.push(createEmptyI18nItem());
};

const removeRemarkI18n = (idx: number) => {
  if (remarkI18nList.value.length === 1) return;
  remarkI18nList.value.splice(idx, 1);
};

onMounted(async () => {
  await fetchSubCategoryOptions();
  await fetchSpecTypes();
  fetchList();
});

watch(
  () => [query.subCategoryId, query.priced],
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
  () => form.specTypeId,
  () => {
    if (dialogVisible.value) syncPricing();
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
    await fetchSubCategoryOptions();
    await fetchSpecTypes();
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
.i18n-list {
  width: 100%;
}
.i18n-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.i18n-row--textarea {
  align-items: flex-start;
}
.remark-cell {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 1.45;
  color: #606266;
}
</style>
