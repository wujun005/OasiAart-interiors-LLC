<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索商品名称"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增商品</el-button>
      </div>

      <el-table :data="products" border stripe v-loading="tableLoading" row-key="id">
        <el-table-column label="图片" width="120">
          <template #default="{ row }">
            <div class="thumbs">
              <img
                v-for="(img, idx) in row.images.slice(0, 2)"
                :key="idx"
                :src="img"
                alt=""
              />
              <span v-if="row.images.length > 2" class="more">+{{ row.images.length - 2 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="categoryName" label="一级分类" min-width="140" />
        <el-table-column prop="subCategoryName" label="二级分类" min-width="140" />
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="specNames" label="规格" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="name in row.specNames" :key="name" size="small" class="lang">
              {{ name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上架" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isOnSale ? 'success' : 'info'">
              {{ row.isOnSale ? '已上架' : '未上架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currency" label="币种" width="100" />
        <el-table-column label="语言" min-width="120">
          <template #default="{ row }">
            <el-tag v-for="lang in row.langs" :key="lang" size="small" class="lang">
              {{ lang }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="更新时间">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="openPriceDialog(row)">
              价格维护
            </el-button>
            <el-button
              link
              :type="row.isOnSale ? 'warning' : 'success'"
              size="small"
              @click="toggleSale(row)"
            >
              {{ row.isOnSale ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              删除
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
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

      <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="680px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        v-loading="detailLoading"
      >
        <el-form-item label="价格" prop="product.price">
          <el-input-number v-model="form.product.price" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="库存" prop="product.stock">
          <el-input-number v-model="form.product.stock" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="排序" prop="product.sort">
          <el-input-number v-model="form.product.sort" :min="0" :step="1" />
        </el-form-item>

        <el-form-item label="一级分类" prop="product.categoryId">
          <el-select
            v-model="form.product.categoryId"
            placeholder="请选择一级分类"
            filterable
            style="width: 100%"
            @change="onCategoryChange"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="二级分类" prop="product.subCategoryId">
          <el-select
            v-model="form.product.subCategoryId"
            placeholder="请选择二级分类"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in filteredSubCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <div class="spec-groups">
          <div
            v-for="(group, idx) in form.specGroups"
            :key="idx"
            class="spec-box"
          >
            <div class="spec-box__header">
              <div class="spec-box__title">规格{{ idx + 1 }}</div>
              <el-button
                type="danger"
                link
                :disabled="form.specGroups.length === 1"
                @click="removeSpecGroup(idx)"
              >
                删除
              </el-button>
            </div>
            <el-form-item :prop="`specGroups.${idx}.specTypeId`" label="规格类型" label-width="90px">
              <el-select
                v-model="group.specTypeId"
                placeholder="请选择规格类型"
                filterable
                style="width: 100%"
                @change="() => { group.specIds = group.specIds.filter((id) => filteredSpecOptions(group.specTypeId).some((o) => o.value === id)); }"
              >
                <el-option
                  v-for="item in specTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :prop="`specGroups.${idx}.specIds`" label="规格" label-width="90px">
              <el-select
                v-model="group.specIds"
                placeholder="请选择规格"
                multiple
                filterable
                collapse-tags
                style="width: 100%"
              >
                <el-option
                  v-for="item in filteredSpecOptions(group.specTypeId)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="" prop="specGroups">
            <el-button type="primary" link @click="addSpecGroup">+ 添加规格</el-button>
          </el-form-item>
        </div>

        <div class="spec-groups">
          <div
            v-for="(group, idx) in form.addonGroups"
            :key="idx"
            class="spec-box"
          >
            <div class="spec-box__header">
              <div class="spec-box__title">附加项{{ idx + 1 }}</div>
              <el-button
                type="danger"
                link
                :disabled="form.addonGroups.length === 1"
                @click="removeAddonGroup(idx)"
              >
                删除
              </el-button>
            </div>
            <el-form-item :prop="`addonGroups.${idx}.categoryId`" label="附加项分类" label-width="90px">
              <el-select
                v-model="group.categoryId"
                placeholder="请选择附加项分类"
                filterable
                style="width: 100%"
                @change="() => { group.addonIds = (group.addonIds || []).filter((id) => filteredAddonOptions(group.categoryId).some((o) => o.value === id)); }"
              >
                <el-option
                  v-for="item in addonCategoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :prop="`addonGroups.${idx}.addonIds`" label="附加项" label-width="90px">
              <el-select
                v-model="group.addonIds"
                placeholder="请选择附加项"
                multiple
                filterable
                collapse-tags
                style="width: 100%"
              >
                <el-option
                  v-for="item in filteredAddonOptions(group.categoryId)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="" prop="addonGroups">
            <el-button type="primary" link @click="addAddonGroup">+ 添加附加项</el-button>
          </el-form-item>
        </div>
        <el-form-item label="二级分类" prop="product.subCategoryId">
          <el-select
            v-model="form.product.subCategoryId"
            placeholder="请选择二级分类"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in subCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上架" prop="product.isOnSale">
          <el-switch v-model="form.product.isOnSale" />
        </el-form-item>
        <el-form-item label="币种" prop="product.currency">
          <el-select
            v-model="form.product.currency"
            filterable
            placeholder="选择币种"
            :loading="currencyLoading"
          >
            <el-option
              v-for="item in currencyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="多语言" prop="productI18nList">
          <div class="i18n-list">
            <div v-for="(item, idx) in form.productI18nList" :key="idx" class="i18n-row">
              <el-select
                v-model="item.langCode"
                placeholder="语言"
                filterable
                allow-create
                default-first-option
              >
                <el-option
                  v-for="lang in langOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <el-input v-model="item.name" placeholder="名称" />
              <el-input
                v-model="item.details"
                type="textarea"
                :rows="2"
                placeholder="详情描述"
              />
              <el-button
                v-if="form.productI18nList.length > 1"
                type="danger"
                link
                @click="removeLang(idx)"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" link @click="addLang">新增语言</el-button>
          </div>
        </el-form-item>

        <el-form-item label="图片" prop="productImages">
          <el-upload
            :http-request="handleUpload"
            list-type="picture-card"
            :file-list="uploadList"
            multiple
            :on-remove="onRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div v-if="uploading" class="uploading-tip">图片上传中，请稍候...</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="uploading" :loading="submitLoading" @click="save">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="priceDialogVisible" title="价格维护" width="720px">
      <el-table :data="priceRows" border stripe class="price-table">
        <el-table-column
          v-for="col in priceColumns"
          :key="col.key"
          :label="col.label"
          :prop="col.key"
          :min-width="120"
        >
          <template #default="{ row }">
            {{ row.specMap[col.key] }}
          </template>
        </el-table-column>
        <el-table-column label="原价" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.originPrice" :min="0" :step="1" />
          </template>
        </el-table-column>
        <el-table-column label="优惠价" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.discountPrice" :min="0" :step="1" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="priceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrice">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules, UploadRequestOptions, UploadUserFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/modules/admin/api/product';

type ProductEntity = {
  id?: number;
  price: number;
  stock: number;
  isOnSale: boolean;
  currency: string;
  sort?: number;
  categoryId?: number;
  subCategoryId?: number;
  specTypeId?: number;
  specIds?: number[];
  createdAt?: string;
  updatedAt?: string;
};

type ProductI18n = {
  id?: number;
  productId?: number;
  langCode: string;
  name: string;
  details?: string;
};

type ProductImage = {
  id?: number;
  productId?: number;
  imageUrl: string;
  sort?: number;
  createdAt?: string;
};

type ProductRow = {
  id: number;
  name: string;
  images: string[];
  price: number;
  stock: number;
  isOnSale: boolean;
  currency: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
  langs: string[];
  categoryId?: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;
  specTypeId?: number;
  specIds?: number[];
  specNames: string[];
};

type SpecGroup = {
  specTypeId: number | null;
  specIds: number[];
};

type AddonGroup = {
  categoryId: number | null;
  addonIds: number[];
};

const subCategoryOptions = ref([
  { label: '沙发', value: 101, parentId: 1 },
  { label: '茶几', value: 102, parentId: 1 },
  { label: '床', value: 201, parentId: 2 },
  { label: '衣柜', value: 202, parentId: 2 },
  { label: '空调清洗', value: 301, parentId: 3 },
  { label: '空调维修', value: 302, parentId: 3 },
  { label: '面部护理', value: 401, parentId: 4 },
  { label: 'SPA 按摩', value: 402, parentId: 4 },
]);

const categoryOptions = ref([
  { label: '日常保洁', value: 1 },
  { label: '粉刷', value: 2 },
  { label: 'AC Service', value: 3 },
  { label: 'salon & Spa', value: 4 },
]);

const specOptions = ref([
  { label: '金牌技师', value: 1, typeId: 1 },
  { label: '肉式技师', value: 2, typeId: 1 },
  { label: '瑜伽技师', value: 3, typeId: 1 },
  { label: '泰式按摩', value: 4, typeId: 2 },
  { label: '柔式按摩', value: 5, typeId: 2 },
  { label: '瑜伽按摩', value: 6, typeId: 2 },
  { label: '1小时', value: 7, typeId: 3 },
  { label: '2小时', value: 8, typeId: 3 },
  { label: '3小时', value: 9, typeId: 3 },
]);

const specTypeOptions = ref([
  { label: '技师类型', value: 1 },
  { label: '套餐类型', value: 2 },
  { label: '时长', value: 3 },
]);

const addonCategoryOptions = [
  { label: '清洁类', value: 1 },
  { label: '按摩类', value: 2 },
  { label: '工具类', value: 3 },
];

const addonOptions = ref([
  { label: '香薰', value: 17, categoryId: 2 },
  { label: '一次性耗材包', value: 18, categoryId: 3 },
  { value: 11, label: '中级清洁剂', categoryId: 1, price: 50 },
   { value: 12, label: '高级级清洁剂', categoryId: 1, price: 100 },
   { value: 13, label: '顶级清洁剂', categoryId: 1, price: 150 },
   { value: 14, label: '超级清洁剂', categoryId: 1, price: 200 },
  { value: 15, label: '香薰', categoryId: 2, price: 80 },
  { value: 16, label: '一次性耗材包', categoryId: 3, price: 20 },
]);

const filteredAddonOptions = (categoryId: number | null) =>
  (addonOptions.value || []).filter((o) => !categoryId || o.categoryId === categoryId);

const subCategoryMap = computed(() => {
  const map = new Map<number, string>();
  subCategoryOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});
const subCategoryParentMap = computed(() => {
  const map = new Map<number, number>();
  subCategoryOptions.value.forEach((item) => map.set(item.value, item.parentId));
  return map;
});
const categoryMap = computed(() => {
  const map = new Map<number, string>();
  categoryOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});

const specMap = computed(() => {
  const map = new Map<number, string>();
  specOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});
const filteredSpecOptions = (typeId: number | null) =>
  specOptions.value.filter((item) => !typeId || item.typeId === typeId);

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
});
const products = ref<ProductRow[]>([]);
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const detailLoading = ref(false);
const submitLoading = ref(false);
const priceDialogVisible = ref(false);
const priceLoading = ref(false);
const uploadList = ref<UploadUserFile[]>([]);
const uploadCount = ref(0);
const currencyOptions = ref<{ label: string; value: string }[]>([]);
const currencyLoading = ref(false);
const uploading = computed(() => uploadCount.value > 0);

type PriceRow = { id: string; specMap: Record<string, string>; originPrice: number; discountPrice?: number };
type PriceColumn = { key: string; label: string };
const priceRows = ref<PriceRow[]>([]);
const priceColumns = ref<PriceColumn[]>([]);

const normalizeCurrencyOptions = (list: any): { label: string; value: string }[] => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (item && typeof item === 'object') {
        const value = item.value ?? item.code ?? item.currency ?? item.key;
        const label = item.label ?? item.name ?? item.title ?? value;
        if (value) {
          const valueStr = String(value);
          return { label: label ? String(label) : valueStr, value: valueStr };
        }
      }
      return null;
    })
    .filter((item): item is { label: string; value: string } => !!item);
};

const ensureCurrencyOption = (value?: string) => {
  if (!value) return;
  const exists = currencyOptions.value.some((item) => item.value === value);
  if (!exists) {
    currencyOptions.value = [...currencyOptions.value, { label: value, value }];
  }
};

const defaultProduct = (): ProductEntity => ({
  id: undefined,
  price: 0,
  stock: 0,
  isOnSale: true,
  currency: 'CNY',
  sort: 0,
  categoryId: categoryOptions.value[0]?.value,
  subCategoryId: subCategoryOptions.value.find((s) => s.parentId === categoryOptions.value[0]?.value)?.value,
  specTypeId: specTypeOptions.value[0]?.value,
  specIds: [],
});

const defaultI18nList = (): ProductI18n[] => [
  { langCode: 'zh-CN', name: '', details: '' },
  { langCode: 'en-US', name: '', details: '' },
];

const form = reactive<{
  product: ProductEntity;
  productI18nList: ProductI18n[];
  productImages: ProductImage[];
  specGroups: SpecGroup[];
  addonGroups: AddonGroup[];
}>({
  product: defaultProduct(),
  productI18nList: defaultI18nList(),
  productImages: [],
  specGroups: [{ specTypeId: specTypeOptions.value[0]?.value ?? null, specIds: [] }],
  addonGroups: [{ categoryId: addonCategoryOptions[0].value, addonIds: [] }],
});

const filteredSubCategoryOptions = computed(() =>
  subCategoryOptions.value.filter(
    (item) => !form.product.categoryId || item.parentId === form.product.categoryId
  )
);

const langOptions = [
  { label: '中文(简体)', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

const rules: FormRules = {
  'product.price': [
    { required: true, message: '请输入价格', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入价格'));
        } else if (Number(value) < 0) {
          callback(new Error('价格需大于等于 0'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  'product.stock': [
    { required: true, message: '请输入库存', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入库存'));
        } else if (Number(value) < 0) {
          callback(new Error('库存需大于等于 0'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  'product.categoryId': [{ required: true, message: '请选择一级分类', trigger: 'change' }],
  'product.subCategoryId': [{ required: true, message: '请选择二级分类', trigger: 'change' }],
  'product.currency': [{ required: true, message: '请选择币种', trigger: 'change' }],
  productI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as ProductI18n[];
        if (!list || list.length === 0) {
          callback(new Error('请至少添加一条多语言名称'));
          return;
        }
        const invalid = list.find((item) => !item.langCode || !item.name.trim());
        if (invalid) {
          callback(new Error('请填写语言和名称'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  specGroups: [
    {
      validator: (_rule, value: SpecGroup[], callback) => {
        if (!value || !value.length) {
          callback(new Error('请至少添加一个规格'));
          return;
        }
        const invalid = value.find((g) => !g.specTypeId || !g.specIds || g.specIds.length === 0);
        if (invalid) {
          callback(new Error('每个规格需要选择规格类型和至少一个规格'));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
  addonGroups: [
    {
      validator: (_rule, value: AddonGroup[], callback) => {
        if (!value || !value.length) {
          callback(new Error('请至少添加一个附加项'));
          return;
        }
        const invalid = value.find((g) => !g.categoryId || !g.addonIds || g.addonIds.length === 0);
        if (invalid) {
          callback(new Error('每个附加项需选择分类并至少一个附加项'));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const resetForm = () => {
  form.product = defaultProduct();
  form.productI18nList = defaultI18nList();
  form.productImages = [];
  form.specGroups = [{ specTypeId: specTypeOptions.value[0]?.value ?? null, specIds: [] }];
  form.addonGroups = [{ categoryId: addonCategoryOptions[0].value, addonIds: [] }];
  uploadList.value = [];
  uploadCount.value = 0;
  ensureCurrencyOption(form.product.currency);
  if (!form.product.subCategoryId && filteredSubCategoryOptions.value.length) {
    form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
  }
  nextTick(() => formRef.value?.clearValidate());
};

const toRow = (item: any): ProductRow => {
  const product = item?.product ?? item ?? {};
  const i18nList: ProductI18n[] = item?.productI18nList ?? item?.i18nList ?? [];
  const imgs: ProductImage[] = item?.productImages ?? item?.images ?? [];
  const name = i18nList?.[0]?.name ?? product.name ?? '';
  const subId = product.subCategoryId ?? item.subCategoryId;
  const categoryId = product.categoryId ?? item.categoryId ?? subCategoryParentMap.value.get(subId ?? -1);
  const specListRaw = Array.isArray(item?.productSpecList) ? item.productSpecList : [];
  const specs: number[] = specListRaw.length
    ? specListRaw.flatMap((g: any) => (Array.isArray(g.specIds) ? g.specIds : []))
    : Array.isArray(product.specIds)
      ? product.specIds
      : Array.isArray(item.specIds)
        ? item.specIds
        : [];
  const specTypeId =
    specListRaw[0]?.specTypeId ??
    product.specTypeId ??
    item.specTypeId ??
    (specs.length ? specOptions.value.find((o) => o.value === specs[0])?.typeId : undefined);
  return {
    id: product.id ?? item.id ?? 0,
    name,
    images: imgs.map((img) => img.imageUrl || '').filter(Boolean),
    price: product.price ?? 0,
    stock: product.stock ?? 0,
    isOnSale: !!product.isOnSale,
    currency: product.currency ?? 'CNY',
    sort: product.sort,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    langs: Array.isArray(i18nList) ? i18nList.map((i) => i.langCode).filter(Boolean) : [],
    categoryId,
    categoryName: categoryMap.value.get(categoryId ?? -1) || '',
    subCategoryId: subId,
    subCategoryName: subCategoryMap.value.get(subId) || '',
    specTypeId,
    specIds: specs,
    specNames: specs.map((id) => specMap.value.get(id) || '').filter(Boolean),
  };
};

const extractPage = (payload: any) => {
  const page = payload?.data ?? payload ?? {};
  const listRaw = Array.isArray(page.list) ? page.list : [];
  const list = listRaw.map((item) => toRow(item));
  return {
    list,
    total: typeof page.total === 'number' ? page.total : list.length,
    pageNum: page.pageNum ?? query.pageNum,
    pageSize: page.pageSize ?? query.pageSize,
  };
};

const fetchCurrencies = async () => {
  currencyLoading.value = true;
  try {
    const res = await api.currencies({});
    const options = normalizeCurrencyOptions(res?.data ?? res);
    currencyOptions.value = options;
    ensureCurrencyOption(form.product.currency);
  } catch (error: any) {
    ensureCurrencyOption(form.product.currency);
    ElMessage.error(error?.message || '获取币种失败');
  } finally {
    currencyLoading.value = false;
  }
};

const fetchProducts = async () => {
  tableLoading.value = true;
  try {
    const res = await api.getPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      keyword: query.keyword?.trim() || undefined,
    });
    const { list, total: t, pageNum, pageSize } = extractPage(res);
    products.value = list;
    total.value = t;
    query.pageNum = pageNum;
    query.pageSize = pageSize;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取商品列表失败');
  } finally {
    tableLoading.value = false;
  }
};

const onPageChange = (page: number) => {
  query.pageNum = page;
  fetchProducts();
};

const onSizeChange = (size: number) => {
  query.pageSize = size;
  query.pageNum = 1;
  fetchProducts();
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchProducts();
};

const reset = () => {
  query.keyword = '';
  query.pageNum = 1;
  fetchProducts();
};

const addLang = () => {
  form.productI18nList.push({ langCode: '', name: '', details: '' });
};

const removeLang = (idx: number) => {
  form.productI18nList.splice(idx, 1);
};

const setUploadList = (images: ProductImage[]) => {
  uploadList.value = images
    .filter((img) => img.imageUrl)
    .map((img, idx) => ({
      name: `${img.id ?? idx}`,
      url: img.imageUrl,
    }));
};

const openCreate = () => {
  isEdit.value = false;
  resetForm();
  if (!form.product.subCategoryId && filteredSubCategoryOptions.value.length) {
    form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
  }
  dialogVisible.value = true;
};

const openEdit = async (row: ProductRow) => {
  isEdit.value = true;
  resetForm();
  dialogVisible.value = true;
  detailLoading.value = true;
  try {
    const detailRes = await api.getInfo(row.id);
    const detail = detailRes?.data ?? detailRes ?? {};
    const product = detail.product ?? detail ?? {};
    const i18nList = Array.isArray(detail.productI18nList) ? detail.productI18nList : defaultI18nList();
    const images = Array.isArray(detail.productImages) ? detail.productImages : [];

    const detailSpecGroups: SpecGroup[] = Array.isArray(detail.productSpecList)
      ? detail.productSpecList.map((g: any) => ({
          specTypeId: g.specTypeId ?? g.typeId ?? g.specType ?? null,
          specIds: Array.isArray(g.specIds) ? g.specIds : [],
        }))
      : [];
    const fallbackSpecIds = Array.isArray(product.specIds) ? product.specIds : Array.isArray(row.specIds) ? row.specIds : [];
    const fallbackSpecType =
      product.specTypeId ??
      row.specTypeId ??
      (fallbackSpecIds.length ? specOptions.value.find((o) => o.value === fallbackSpecIds[0])?.typeId : specTypeOptions.value[0]?.value);
    const detailAddonGroups: AddonGroup[] = Array.isArray(detail.productAddonList)
      ? detail.productAddonList.map((g: any) => ({
          categoryId: g.categoryId ?? null,
          addonIds: Array.isArray(g.addonIds) ? g.addonIds : [],
        }))
      : [];
    const categoryId =
      product.categoryId ??
      row.categoryId ??
      subCategoryParentMap.value.get(
        (product.subCategoryId ?? row.subCategoryId) ?? -1
      ) ??
      categoryOptions.value[0]?.value;
    form.product = {
      id: product.id,
      price: product.price ?? 0,
      stock: product.stock ?? 0,
      isOnSale: !!product.isOnSale,
      currency: product.currency ?? 'CNY',
      sort: product.sort ?? 0,
      categoryId,
      subCategoryId:
        product.subCategoryId ??
        row.subCategoryId ??
        filteredSubCategoryOptions.value.find((s) => s.parentId === categoryId)?.value ??
        subCategoryOptions.value.find((s) => s.parentId === categoryId)?.value,
      specTypeId: fallbackSpecType,
      specIds: fallbackSpecIds,
    };
    form.specGroups =
      detailSpecGroups.length > 0
        ? detailSpecGroups
        : [
            {
              specTypeId: fallbackSpecType ?? null,
              specIds: fallbackSpecIds.filter((id) => filteredSpecOptions(fallbackSpecType ?? null).some((o) => o.value === id)),
            },
          ];
    form.product.specIds = form.specGroups[0]?.specIds ?? [];
    form.product.specTypeId = form.specGroups[0]?.specTypeId ?? form.product.specTypeId;
    form.addonGroups =
      detailAddonGroups.length > 0
        ? detailAddonGroups
        : [
            {
              categoryId: addonCategoryOptions[0].value,
              addonIds: [],
            },
          ];
    form.productI18nList = i18nList.map((item) => ({
      id: item.id,
      productId: item.productId,
      langCode: item.langCode,
      name: item.name,
      details: item.details,
    }));
    form.productImages = images.map((img) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl,
      sort: img.sort,
      createdAt: img.createdAt,
    }));
    setUploadList(form.productImages);
    ensureCurrencyOption(form.product.currency);
    nextTick(() => formRef.value?.clearValidate());
  } catch (error: any) {
    ElMessage.error(error?.message || '获取商品详情失败');
  } finally {
    detailLoading.value = false;
  }
};

const handleUpload = async (options: UploadRequestOptions) => {
  uploadCount.value += 1;
  try {
    const formData = new FormData();
    formData.append('file', options.file as File);
    const res = await api.upload(formData);
    const url = typeof res?.data === 'string' ? res.data : res?.data?.url || res?.url || '';
    if (!url) throw new Error('上传返回地址为空');
    form.productImages.push({ imageUrl: url, sort: form.productImages.length });
    uploadList.value.push({ name: options.file.name, url });
    options.onSuccess?.({ url } as any);
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败');
    options.onError?.(error);
  } finally {
    uploadCount.value = Math.max(0, uploadCount.value - 1);
  }
};

const onRemove = (file: UploadUserFile) => {
  const url = file.url;
  if (!url) return;
  form.productImages = form.productImages.filter((item) => item.imageUrl !== url);
  uploadList.value = uploadList.value.filter((item) => item.url !== url);
};

const addSpecGroup = () => {
  form.specGroups.push({
    specTypeId: specTypeOptions.value[0]?.value ?? null,
    specIds: [],
  });
};

const removeSpecGroup = (idx: number) => {
  if (form.specGroups.length <= 1) {
    ElMessage.warning('至少保留一个规格');
    return;
  }
  form.specGroups.splice(idx, 1);
};

const onCategoryChange = (val: number | undefined | null) => {
  // 重置二级分类到当前类别下的第一个
  const target = filteredSubCategoryOptions.value[0];
  form.product.subCategoryId = target ? target.value : undefined;
};

const addAddonGroup = () => {
  form.addonGroups.push({
    categoryId: addonCategoryOptions[0].value,
    addonIds: [],
  });
};

const removeAddonGroup = (idx: number) => {
  if (form.addonGroups.length <= 1) {
    ElMessage.warning('至少保留一个附加项');
    return;
  }
  form.addonGroups.splice(idx, 1);
};

const toggleSale = (row: ProductRow) => {
  row.isOnSale = !row.isOnSale;
  ElMessage.success(`已${row.isOnSale ? '上架' : '下架'}`);
};

const buildPriceTable = (
  specList: SpecGroup[],
  priceList?: { specKey: string; price?: number; originPrice?: number; discountPrice?: number }[]
) => {
  priceColumns.value = specList.map((g, idx) => {
    const typeLabel = specTypeOptions.value.find((t) => t.value === g.specTypeId)?.label || `规格类型${idx + 1}`;
    return { key: `type${idx}`, label: typeLabel };
  });

  // 生成规格组合的笛卡尔积
  const specOptionsMap = new Map<number, string>();
  specOptions.value.forEach((s) => specOptionsMap.set(s.value, s.label));

  const originMap = new Map<string, number>();
  const discountMap = new Map<string, number>();
  (priceList || []).forEach((p) => {
    if (!p?.specKey) return;
    if (p.originPrice !== undefined) originMap.set(p.specKey, Number(p.originPrice) || 0);
    if (p.discountPrice !== undefined) discountMap.set(p.specKey, Number(p.discountPrice) || 0);
    if (p.price !== undefined && !originMap.has(p.specKey)) originMap.set(p.specKey, Number(p.price) || 0);
  });
  const combos: PriceRow[] = [];
  const dfs = (depth: number, path: number[], pathLabels: string[]) => {
    if (depth === specList.length) {
      const specMap: Record<string, string> = {};
      pathLabels.forEach((label, i) => {
        specMap[`type${i}`] = label;
      });
      const key = path.join('-');
      const mockOrigin = originMap.get(key) ?? (path.reduce((a, b) => a + b, 0) || 1) * 10; // 模拟原价
      const mockDiscount = discountMap.get(key);
      combos.push({ id: key, specMap, originPrice: mockOrigin, discountPrice: mockDiscount });
      return;
    }
    const group = specList[depth];
    const ids = Array.isArray(group.specIds) ? group.specIds : [];
    ids.forEach((id) => {
      dfs(depth + 1, [...path, id], [...pathLabels, specOptionsMap.get(id) || `${id}`]);
    });
  };
  if (specList.length > 0) dfs(0, [], []);
  priceRows.value = combos;
};

const openPriceDialog = async (row: ProductRow) => {
  priceDialogVisible.value = true;
  priceLoading.value = true;
  try {
    const detailRes = await api.getInfo(row.id);
    const detail = detailRes?.data ?? detailRes ?? {};
    const priceList = Array.isArray(detail.productPriceList)
      ? detail.productPriceList.map((p: any) => ({
          specKey: p.specKey ?? p.key ?? p.specIds?.join('-'),
          price: p.price ?? p.amount,
          originPrice: p.originPrice ?? p.price ?? p.amount,
          discountPrice: p.discountPrice ?? p.promoPrice ?? p.salePrice,
        }))
      : undefined;
    let specList: SpecGroup[] = Array.isArray(detail.productSpecList)
      ? detail.productSpecList.map((g: any) => ({
          specTypeId: g.specTypeId ?? g.typeId ?? g.specType ?? null,
          specIds: Array.isArray(g.specIds) ? g.specIds : [],
        }))
      : row.specIds && row.specIds.length
        ? [{ specTypeId: row.specTypeId ?? null, specIds: row.specIds }]
        : [];

    // 补齐空的规格组：没有规格时用所有规格类型及其可选规格做笛卡尔
    const ensureSpecIds = (g: SpecGroup) => {
      if (!g.specIds || g.specIds.length === 0) {
        g.specIds = specOptions.value.filter((s) => s.typeId === g.specTypeId).map((s) => s.value);
      }
      return g;
    };

    specList = specList.map((g) => ensureSpecIds({ ...g })).filter((g) => g.specIds.length);

    if (!specList.length) {
      specList = specTypeOptions.value.map((t) => ({
        specTypeId: t.value,
        specIds: specOptions.value.filter((s) => s.typeId === t.value).map((s) => s.value),
      }));
    }

    buildPriceTable(specList, priceList);
  } catch (error: any) {
    ElMessage.error(error?.message || '获取规格失败');
    priceRows.value = [];
    priceColumns.value = [];
  } finally {
    priceLoading.value = false;
  }
};

const savePrice = () => {
  const invalid = priceRows.value.find((r) => r.originPrice === null || r.originPrice === undefined || r.originPrice === '' || Number.isNaN(Number(r.originPrice)));
  if (invalid) {
    ElMessage.error('请填写所有原价');
    return;
  }
  // mock 保存
  priceDialogVisible.value = false;
  ElMessage.success('价格已保存（mock）');
};

const save = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    if (uploading.value) {
      ElMessage.warning('图片上传中，请稍候');
      return;
    }
    submitLoading.value = true;
    try {
      // 同步兼容字段：取第一个规格组
      const firstGroup = form.specGroups[0] || { specTypeId: null, specIds: [] };
      form.product.specTypeId = firstGroup.specTypeId ?? undefined;
      form.product.specIds = firstGroup.specIds ?? [];
      // 确保分类与二级分类一致
      if (form.product.subCategoryId) {
        const parentId = subCategoryParentMap.value.get(form.product.subCategoryId);
        if (parentId) {
          form.product.categoryId = parentId;
        }
      }
      if (!form.product.subCategoryId && filteredSubCategoryOptions.value.length) {
        form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
      }
      const payload = {
        product: form.product,
        productI18nList: form.productI18nList,
        productImages: form.productImages,
        productSpecList: form.specGroups,
        productAddonList: form.addonGroups,
      };
      if (isEdit.value) {
        await api.update(payload);
        ElMessage.success('更新成功');
      } else {
        await api.add(payload);
        ElMessage.success('新增成功');
      }
      dialogVisible.value = false;
      fetchProducts();
    } catch (error: any) {
      ElMessage.error(error?.message || '保存失败');
    } finally {
      submitLoading.value = false;
    }
  });
};

const remove = async (row: ProductRow) => {
  try {
    await ElMessageBox.confirm(`确认删除商品「${row.name}」吗？`, '提示', {
      type: 'warning',
    });
    await api.del(row.id);
    ElMessage.success('删除成功');
    fetchProducts();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  }
};

onMounted(() => {
  fetchCurrencies();
  fetchProducts();
});
</script>

<style scoped>
.page {
  padding: 20px;
}
.toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.thumbs {
  display: flex;
  align-items: center;
  gap: 6px;
}
.thumbs img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.more {
  font-size: 12px;
  color: #666;
}
.lang {
  margin-right: 4px;
}
.i18n-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.spec-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.spec-box {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  background: #fafbff;
}
.spec-box__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.spec-box__title {
  font-weight: 600;
}
.price-table {
  margin-bottom: 12px;
  max-height: 70vh;
  overflow: auto;
}
.i18n-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr auto;
  gap: 8px;
  align-items: center;
}
.uploading-tip {
  margin-top: 8px;
  color: #f59b00;
  font-size: 12px;
}
@media (max-width: 640px) {
  .i18n-row {
    grid-template-columns: 1fr;
  }
}
</style>
