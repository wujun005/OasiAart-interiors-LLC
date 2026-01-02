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
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="stock" label="库存" width="100" />
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
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              编辑
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
      width="640px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" v-loading="detailLoading">
        <el-form-item label="价格" prop="product.price">
          <el-input-number v-model="form.product.price" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="库存" prop="product.stock">
          <el-input-number v-model="form.product.stock" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="排序" prop="product.sort">
          <el-input-number v-model="form.product.sort" :min="0" :step="1" />
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
};

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
const uploadList = ref<UploadUserFile[]>([]);
const uploadCount = ref(0);
const currencyOptions = ref<{ label: string; value: string }[]>([]);
const currencyLoading = ref(false);
const uploading = computed(() => uploadCount.value > 0);

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
});

const defaultI18nList = (): ProductI18n[] => [
  { langCode: 'zh-CN', name: '', details: '' },
  { langCode: 'en-US', name: '', details: '' },
];

const form = reactive<{
  product: ProductEntity;
  productI18nList: ProductI18n[];
  productImages: ProductImage[];
}>({
  product: defaultProduct(),
  productI18nList: defaultI18nList(),
  productImages: [],
});

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
  uploadList.value = [];
  uploadCount.value = 0;
  ensureCurrencyOption(form.product.currency);
  nextTick(() => formRef.value?.clearValidate());
};

const toRow = (item: any): ProductRow => {
  const product = item?.product ?? item ?? {};
  const i18nList: ProductI18n[] = item?.productI18nList ?? item?.i18nList ?? [];
  const imgs: ProductImage[] = item?.productImages ?? item?.images ?? [];
  const name = i18nList?.[0]?.name ?? product.name ?? '';
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

    form.product = {
      id: product.id,
      price: product.price ?? 0,
      stock: product.stock ?? 0,
      isOnSale: !!product.isOnSale,
      currency: product.currency ?? 'CNY',
      sort: product.sort ?? 0,
    };
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

const save = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    if (uploading.value) {
      ElMessage.warning('图片上传中，请稍候');
      return;
    }
    submitLoading.value = true;
    try {
      const payload = {
        product: form.product,
        productI18nList: form.productI18nList,
        productImages: form.productImages,
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
