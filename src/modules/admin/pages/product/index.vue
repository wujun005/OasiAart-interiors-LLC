<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.product.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">{{ t('admin.product.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.product.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.product.actions.create') }}</el-button>
      </div>

      <el-table
        :data="products"
        border
        stripe
        v-loading="tableLoading"
        row-key="id"
      >
        <el-table-column :label="t('admin.product.table.image')" width="120">
          <template #default="{ row }">
            <div class="thumbs">
              <img
                v-for="(img, idx) in row.images.slice(0, 2)"
                :key="idx"
                :src="img"
                alt=""
              />
              <span v-if="row.images.length > 2" class="more"
                >+{{ row.images.length - 2 }}</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="t('admin.product.table.name')" min-width="160" />
        <el-table-column prop="categoryName" :label="t('admin.product.table.category')" min-width="140" />
        <el-table-column
          prop="subCategoryName"
          :label="t('admin.product.table.subcategory')"
          min-width="140"
        />
        <el-table-column prop="specNames" :label="t('admin.product.table.specs')" min-width="300">
          <template #default="{ row }">
            <el-tag
              v-for="name in row.specNames"
              :key="name"
              size="small"
              class="lang"
            >
              {{ name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.saleStatus')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isOnSale ? 'success' : 'info'">
              {{ row.isOnSale ? t('admin.product.sale.on') : t('admin.product.sale.off') }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="currency" label="币种" width="100" /> -->
        <el-table-column :label="t('admin.product.table.languages')" min-width="120">
          <template #default="{ row }">
            <el-tag
              v-for="lang in row.langs"
              :key="lang"
              size="small"
              class="lang"
            >
              {{ lang }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.createdAt')" min-width="200">
          <template #default="{ row }">{{
            formatDate(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.updatedAt')" min-width="200">
          <template #default="{ row }">{{
            formatDate(row.updatedAt)
          }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.actions')" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.product.actions.edit') }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              :disabled="!row.previewUrl"
              @click="openPreview(row)"
            >
              {{ t('admin.product.actions.preview') }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="openPriceDialog(row)"
            >
              {{ t('admin.product.actions.maintainPrice') }}
            </el-button>
            <el-button
              link
              :type="row.isOnSale ? 'warning' : 'success'"
              size="small"
              @click="toggleSale(row)"
            >
              {{ row.isOnSale ? t('admin.product.actions.takeOff') : t('admin.product.actions.putOn') }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="toggleRecommend(row)"
            >
              {{ row?.exclusive ? t('admin.product.actions.unrecommend') : t('admin.product.actions.recommend') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.product.actions.delete') }}
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
      :title="isEdit ? t('admin.product.dialog.editTitle') : t('admin.product.dialog.createTitle')"
      width="880px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        v-loading="detailLoading"
      >
        <el-form-item :label="t('admin.product.form.category')" prop="product.categoryId">
          <el-select
            v-model="form.product.categoryId"
            :placeholder="t('admin.product.form.categoryPlaceholder')"
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
        <el-form-item :label="t('admin.product.form.subcategory')" prop="product.subCategoryId">
          <el-select
            v-model="form.product.subCategoryId"
            :placeholder="t('admin.product.form.subcategoryPlaceholder')"
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

        <div class="group-box spec-groups">
          <div class="group-title">{{ t('admin.product.form.specGroupTitle') }}</div>
          <div
            v-for="(group, idx) in form.specGroups"
            :key="idx"
            class="spec-box"
          >
            <div class="spec-box__header">
              <div class="spec-box__title">{{ `${t('admin.product.form.specGroupPrefix')}${idx + 1}` }}</div>
              <el-button
                type="danger"
                link
                :disabled="form.specGroups.length === 1"
                @click="removeSpecGroup(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-form-item
              :prop="`specGroups.${idx}.specTypeId`"
              :label="t('admin.product.form.specType')"
              label-width="90px"
            >
              <el-select
                v-model="group.specTypeId"
                :placeholder="t('admin.product.form.specTypePlaceholder')"
                filterable
                style="width: 100%"
                @change="
                  () => {
                    group.specIds = group.specIds.filter((id) =>
                      filteredSpecOptions(
                        group.specTypeId,
                        form.product.subCategoryId,
                      ).some(
                        (o) => o.value === id,
                      ),
                    );
                  }
                "
              >
                <el-option
                  v-for="item in filteredSpecTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :prop="`specGroups.${idx}.specIds`"
              :label="t('admin.product.form.spec')"
              label-width="90px"
            >
              <el-select
                v-model="group.specIds"
                :placeholder="t('admin.product.form.specPlaceholder')"
                multiple
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in filteredSpecOptions(group.specTypeId, form.product.subCategoryId)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="" prop="specGroups">
            <el-button type="primary" link @click="addSpecGroup"
              >{{ t('admin.product.actions.addSpecGroup') }}</el-button
            >
          </el-form-item>
        </div>

        <div class="group-box spec-groups">
          <div class="group-title">{{ t('admin.product.form.addonGroupTitle') }}</div>
          <div
            v-for="(group, idx) in form.addonGroups"
            :key="idx"
            class="spec-box"
          >
            <div class="spec-box__header">
              <div class="spec-box__title">{{ `${t('admin.product.form.addonGroupPrefix')}${idx + 1}` }}</div>
              <el-button
                type="danger"
                link
                :disabled="form.addonGroups.length === 1"
                @click="removeAddonGroup(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-form-item
              :prop="`addonGroups.${idx}.categoryId`"
              :label="t('admin.product.form.addonCategory')"
              label-width="90px"
            >
              <el-select
                v-model="group.categoryId"
                :placeholder="t('admin.product.form.addonCategoryPlaceholder')"
                filterable
                style="width: 100%"
                @change="
                  () => {
                    group.addonIds = (group.addonIds || []).filter((id) =>
                      filteredAddonOptions(group.categoryId).some(
                        (o) => o.value === id,
                      ),
                    );
                  }
                "
              >
                <el-option
                  v-for="item in addonCategoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :prop="`addonGroups.${idx}.addonIds`"
              :label="t('admin.product.form.addon')"
              label-width="90px"
            >
              <el-select
                v-model="group.addonIds"
                :placeholder="t('admin.product.form.addonPlaceholder')"
                multiple
                filterable
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
            <el-button type="primary" link @click="addAddonGroup"
              >{{ t('admin.product.actions.addAddonGroup') }}</el-button
            >
          </el-form-item>
        </div>
        <el-form-item :label="t('admin.product.form.sale')" prop="product.isOnSale">
          <el-switch v-model="form.product.isOnSale" />
        </el-form-item>
        <!-- <el-form-item label="币种" prop="product.currency">
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
        </el-form-item> -->

        <div class="group-box">
          <div class="group-title">{{ t('admin.product.form.nameDescGroupTitle') }}</div>
        <el-form-item :label="t('admin.product.form.nameI18n')" prop="productI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.productI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.langCode"
                :placeholder="t('admin.product.form.languagePlaceholder')"
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
              <el-input v-model="item.name" :placeholder="t('admin.product.form.namePlaceholder')" class="full-width" />
              <el-button
                v-if="form.productI18nList.length > 1"
                type="danger"
                link
                @click="removeLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addLang">{{ t('admin.product.actions.addLang') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.product.form.descI18n')" prop="descI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.descI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.product.form.languagePlaceholder')"
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
              <el-input
                v-model="item.value"
                type="textarea"
                :rows="2"
                :placeholder="t('admin.product.form.descPlaceholder')"
                class="full-width"
              />
              <el-button
                v-if="form.descI18nList.length > 1"
                type="danger"
                link
                @click="removeDescLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addDescLang"
              >{{ t('admin.product.actions.addLang') }}</el-button
            >
          </div>
        </el-form-item>
        </div>

        <div class="group-box">
          <div class="group-title">{{ t('admin.product.form.serviceContentGroupTitle') }}</div>
        <el-form-item :label="t('admin.product.form.serviceContent')" prop="serviceContentI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.serviceContentI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.product.form.languagePlaceholder')"
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
              <el-input
                v-model="item.value"
                type="textarea"
                :rows="2"
                :placeholder="t('admin.product.form.serviceContentPlaceholder')"
                class="full-width"
              />
              <el-button
                v-if="form.serviceContentI18nList.length > 1"
                type="danger"
                link
                @click="removeServiceContentLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addServiceContentLang"
              >{{ t('admin.product.actions.addLang') }}</el-button
            >
          </div>
        </el-form-item>
        </div>

        <div class="group-box">
          <div class="group-title">{{ t('admin.product.form.bookingNoticeGroupTitle') }}</div>
        <el-form-item :label="t('admin.product.form.bookingNotice')" prop="bookingNoticeI18nList">
          <div class="i18n-list">
            <div
              v-for="(item, idx) in form.bookingNoticeI18nList"
              :key="idx"
              class="i18n-row"
            >
              <el-select
                v-model="item.lang"
                :placeholder="t('admin.product.form.languagePlaceholder')"
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
              <div class="quill-wrapper">
                <QuillEditor
                  v-model:content="item.value"
                  content-type="html"
                  theme="snow"
                  :placeholder="t('admin.product.form.bookingNoticePlaceholder')"
                />
              </div>
              <el-button
                v-if="form.bookingNoticeI18nList.length > 1"
                type="danger"
                link
                @click="removeBookingNoticeLang(idx)"
              >
                {{ t('admin.product.actions.delete') }}
              </el-button>
            </div>
            <el-button type="primary" link @click="addBookingNoticeLang"
              >{{ t('admin.product.actions.addLang') }}</el-button
            >
          </div>
        </el-form-item>
        </div>

        <el-form-item :label="t('admin.product.form.images')" prop="productImages">
          <el-upload
            :http-request="handleUpload"
            list-type="picture-card"
            :file-list="uploadList"
            multiple
            :on-remove="onRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div v-if="uploading" class="uploading-tip">
            {{ t('admin.product.message.uploadingTip') }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.product.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="uploading"
          :loading="submitLoading"
          @click="save"
        >
          {{ t('admin.product.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="priceDialogVisible" :title="t('admin.product.dialog.priceTitle')" width="1020px">
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
        <el-table-column :label="t('admin.product.table.originPrice')" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.originPrice" :min="0" :step="1" />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.product.table.discountPrice')" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.discountPrice" :min="0" :step="1" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="priceDialogVisible = false">{{ t('admin.product.actions.cancel') }}</el-button>
        <el-button type="primary" @click="savePrice">{{ t('admin.product.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import type {
  FormInstance,
  FormRules,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { QuillEditor } from '@vueup/vue-quill';
import { useI18n } from 'vue-i18n';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { upload, currencies } from '@/modules/admin/api/product';
import {
  page,
  addOrUpdate,
  deleteProduct,
  detial,
  enable,
  disable,
  batchUpdatePrices,
  listBySpu,
  enableExclusive,
  disableExclusive,
} from '@/modules/admin/api/spu';
import { getPage as getCategoryPage, searchCategory } from '@/modules/admin/api/category';
import { getSpecTypePage } from '@/modules/admin/api/specType';
import { getSpecValuePage } from '@/modules/admin/api/spec';
import { getPage as getAddonTypePage } from '@/modules/admin/api/addonType';
import { getPage as getAddonPage } from '@/modules/admin/api/addon';
import { pickI18nText } from '@/modules/admin/utils/i18n';

type ProductEntity = {
  id?: number;
  price?: number;
  stock?: number;
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
  previewUrl?: string;
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
  exclusive?: number;
};

type SpecGroup = {
  specTypeId: number | null;
  specIds: number[];
};

type AddonGroup = {
  categoryId: number | null;
  addonIds: number[];
};

const normalizeOptionalId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const subCategoryOptions = ref<
  { label: string; value: number; parentId: number | null }[]
>([]);
const { locale, t } = useI18n({ useScope: 'global' });

const categoryOptions = ref<{ label: string; value: number }[]>([]);

const specOptions = ref<
  { label: string; value: number; typeId: number | null; subCategoryId: number | null }[]
>([]);

const specTypeOptions = ref<
  { label: string; value: number; subCategoryId: number | null }[]
>([]);

const addonCategoryOptions = ref<{ label: string; value: number }[]>([]);

const addonOptions = ref<
  { label: string; value: number; categoryId: number; price?: number }[]
>([]);

const filteredAddonOptions = (categoryId: number | null) =>
  (addonOptions.value || []).filter(
    (o) => !categoryId || o.categoryId === categoryId,
  );

const subCategoryMap = computed(() => {
  const map = new Map<number, string>();
  subCategoryOptions.value.forEach((item) => map.set(item.value, item.label));
  return map;
});
const subCategoryParentMap = computed(() => {
  const map = new Map<number, number>();
  subCategoryOptions.value.forEach((item) => {
    if (item.parentId) {
      map.set(item.value, item.parentId);
    }
  });
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
const filteredSpecOptions = (
  typeId: number | null,
  subCategoryId?: number | null,
) =>
  specOptions.value.filter((item) => {
    const typeMatched = !typeId || item.typeId === typeId;
    const subCategoryMatched =
      !subCategoryId ||
      !item.subCategoryId ||
      item.subCategoryId === subCategoryId;
    return typeMatched && subCategoryMatched;
  });

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  nameKeyword: '',
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

type PriceRow = {
  id: string;
  specMap: Record<string, string>;
  originPrice: number;
  discountPrice?: number;
};
type PriceColumn = { key: string; label: string };
const priceRows = ref<PriceRow[]>([]);
const priceColumns = ref<PriceColumn[]>([]);

const normalizeCurrencyOptions = (
  list: any,
): { label: string; value: string }[] => {
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
  price: undefined as any,
  stock: undefined as any,
  isOnSale: true,
  currency: 'CNY',
  sort: undefined,
  categoryId: categoryOptions.value[0]?.value,
  subCategoryId: subCategoryOptions.value.find(
    (s) =>
      !categoryOptions.value[0]?.value ||
      !s.parentId ||
      s.parentId === categoryOptions.value[0]?.value,
  )?.value ?? subCategoryOptions.value[0]?.value,
  specTypeId: null,
  specIds: [],
});

const defaultI18nList = (): ProductI18n[] => [
  { langCode: 'zh-CN', name: '', details: '' },
  { langCode: 'en', name: '', details: '' },
];

const form = reactive<{
  product: ProductEntity;
  productI18nList: ProductI18n[];
  // 描述多语言
  descI18nList: { lang: string; value: string }[];
  // 服务内容
  serviceContentI18nList: { lang: string; value: string }[];
  // 预订须知
  bookingNoticeI18nList: { lang: string; value: string }[];
  productImages: ProductImage[];
  specGroups: SpecGroup[];
  addonGroups: AddonGroup[];
}>({
  product: defaultProduct(),
  productI18nList: defaultI18nList(),
  descI18nList: [{ lang: 'zh-CN', value: '' }],
  serviceContentI18nList: [{ lang: 'zh-CN', value: '' }],
  bookingNoticeI18nList: [{ lang: 'zh-CN', value: '' }],
  productImages: [],
  specGroups: [{ specTypeId: null, specIds: [] }],
  addonGroups: [
    { categoryId: addonCategoryOptions.value[0]?.value ?? null, addonIds: [] },
  ],
});

const filteredSubCategoryOptions = computed(() =>
  subCategoryOptions.value.filter(
    (item) =>
      !form.product.categoryId ||
      !item.parentId ||
      item.parentId === form.product.categoryId,
  ),
);

const filteredSpecTypeOptions = computed(() =>
  specTypeOptions.value.filter(
    (item) =>
      !form.product.subCategoryId ||
      !item.subCategoryId ||
      item.subCategoryId === form.product.subCategoryId,
  ),
);

const getDefaultSpecTypeId = () => filteredSpecTypeOptions.value[0]?.value ?? null;

const normalizeSpecGroup = (group: SpecGroup, autoFillType = true) => {
  const availableTypeIds = new Set(
    filteredSpecTypeOptions.value.map((item) => item.value),
  );
  if (
    group.specTypeId &&
    !availableTypeIds.has(group.specTypeId)
  ) {
    group.specTypeId = autoFillType ? getDefaultSpecTypeId() : null;
  } else if (!group.specTypeId && autoFillType) {
    group.specTypeId = getDefaultSpecTypeId();
  }
  const availableSpecIds = new Set(
    filteredSpecOptions(
      group.specTypeId,
      form.product.subCategoryId ?? null,
    ).map((item) => item.value),
  );
  group.specIds = (group.specIds || []).filter((id) => availableSpecIds.has(id));
};

const normalizeSpecGroups = (autoFillType = true) => {
  if (!form.specGroups.length) {
    form.specGroups = [{ specTypeId: autoFillType ? getDefaultSpecTypeId() : null, specIds: [] }];
    return;
  }
  form.specGroups.forEach((group) => normalizeSpecGroup(group, autoFillType));
};

const langOptions = computed(() => [
  { label: t('admin.common.langZhCn'), value: 'zh-CN' },
  { label: t('admin.common.langEnCode'), value: 'en' },
]);

const pickName = (
  value: Record<string, unknown> | undefined | null,
  fallback = '',
) => pickI18nText(value, locale.value, fallback);

const rules: FormRules = {
  'product.categoryId': [
    { required: true, message: t('admin.product.validation.categoryRequired'), trigger: 'change' },
  ],
  'product.subCategoryId': [{ required: false, trigger: 'change' }],
  // 'product.currency': [{ required: true, message: '请选择币种', trigger: 'change' }],
  productI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as ProductI18n[];
        if (!list || list.length === 0) {
          callback(new Error(t('admin.product.validation.nameI18nRequired')));
          return;
        }
        const invalid = list.find(
          (item) => !item.langCode || !item.name.trim(),
        );
        if (invalid) {
          callback(new Error(t('admin.product.validation.nameI18nIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  descI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as { lang: string; value: string }[];
        const invalid = list.find((item) => !item.lang || !item.value?.trim());
        if (invalid) return callback(new Error(t('admin.product.validation.descI18nIncomplete')));
        callback();
      },
      trigger: 'blur',
    },
  ],
  specGroups: [
    {
      validator: (_rule, value: SpecGroup[], callback) => {
        if (!value || !value.length) {
          callback(new Error(t('admin.product.validation.specGroupRequired')));
          return;
        }
        const invalid = value.find(
          (g) => !g.specTypeId || !g.specIds || g.specIds.length === 0,
        );
        if (invalid) {
          callback(new Error(t('admin.product.validation.specGroupIncomplete')));
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
          callback(new Error(t('admin.product.validation.addonGroupRequired')));
          return;
        }
        const invalid = value.find(
          (g) => !g.categoryId || !g.addonIds || g.addonIds.length === 0,
        );
        if (invalid) {
          callback(new Error(t('admin.product.validation.addonGroupIncomplete')));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
  serviceContentI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as { lang: string; value: string }[];
        const invalid = list.find((item) => !item.lang || !item.value?.trim());
        if (invalid) return callback(new Error(t('admin.product.validation.serviceContentIncomplete')));
        callback();
      },
      trigger: 'blur',
    },
  ],
  bookingNoticeI18nList: [
    {
      validator: (_rule, value, callback) => {
        const list = value as { lang: string; value: string }[];
        const candidates = list.filter(
          (item) => item.lang?.trim() || !isRichTextEmpty(item.value),
        );
        if (!candidates.length) {
          return callback(new Error(t('admin.product.validation.bookingNoticeRequired')));
        }
        const invalid = candidates.find(
          (item) => !item.lang?.trim() || isRichTextEmpty(item.value),
        );
        if (invalid) return callback(new Error(t('admin.product.validation.bookingNoticeIncomplete')));
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

const isRichTextEmpty = (html?: string) => {
  if (!html) return true;
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, '')
    .trim();
  return text.length === 0;
};

const resetForm = () => {
  form.product = defaultProduct();
  if (!form.product.subCategoryId && filteredSubCategoryOptions.value.length) {
    form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
  }
  form.productI18nList = defaultI18nList();
  form.descI18nList = [{ lang: 'zh-CN', value: '' }];
  form.serviceContentI18nList = [{ lang: 'zh-CN', value: '' }];
  form.bookingNoticeI18nList = [{ lang: 'zh-CN', value: '' }];
  form.productImages = [];
  form.specGroups = [
    {
      specTypeId: getDefaultSpecTypeId(),
      specIds: [],
    },
  ];
  form.addonGroups = [
    {
      categoryId: addonCategoryOptions.value[0]?.value ?? null,
      addonIds: [],
    },
  ];
  uploadList.value = [];
  uploadCount.value = 0;
  ensureCurrencyOption(form.product.currency);
  normalizeSpecGroups(true);
  nextTick(() => formRef.value?.clearValidate());
};

const toRow = (item: any): ProductRow => {
  // new page schema uses spu + i18n fields
  const spu = item?.spu ?? {};
  const previewUrl = item?.previewUrl || spu?.previewUrl || '';
  const nameI18n = item?.nameI18n ?? {};
  const descI18n = item?.descI18n ?? {};
  const i18nList: ProductI18n[] = Object.keys(nameI18n || {}).map((lang) => ({
    langCode: lang,
    name: nameI18n[lang],
    details: descI18n?.[lang] || '',
  }));
  const images: string[] = Array.isArray(item?.imageUrls)
    ? item.imageUrls.filter(Boolean)
    : [];

  const name = pickName(nameI18n, spu.spuName || '');

  const categoryIds: (string | number)[] = Array.isArray(item?.categoryIds)
    ? item.categoryIds
    : [];
  const categoryNameI18n = item?.categoryNameI18n || {};
  const categoryId = categoryIds[0] ? Number(categoryIds[0]) : undefined;
  const subCategoryId = categoryIds[1] ? Number(categoryIds[1]) : undefined;
  const getCatName = (id?: string | number) => {
    if (id === undefined || id === null) return '';
    const map = categoryNameI18n?.[String(id)];
    return pickName(map, '');
  };

  const specBindings: { specTypeId: number; specValueIds: number[] }[] =
    Array.isArray(item?.specBindings) ? item.specBindings : [];
  const specTypeNameI18n = item?.specTypeNameI18n || {};
  const specValueNameI18n = item?.specValueNameI18n || {};
  const specNames: string[] = specBindings.map((bind) => {
    const typeLabel = pickName(
      specTypeNameI18n?.[String(bind.specTypeId)],
      t('admin.product.fallback.specType', { id: bind.specTypeId }),
    );
    const valueLabels = (bind.specValueIds || []).map((vid) => {
      const map = specValueNameI18n?.[String(vid)];
      return pickName(map, t('admin.product.fallback.specValue', { id: vid }));
    });
    return `${typeLabel}: ${valueLabels.join(t('admin.product.text.separator'))}`;
  });

  return {
    id: spu.id ?? item.id ?? 0,
    name,
    images,
    previewUrl: typeof previewUrl === 'string' ? previewUrl : '',
    price: spu.price ?? undefined,
    stock: spu.stock ?? undefined,
    isOnSale:
      spu.status === 1 ||
      spu.status === '1' ||
      spu.status === true ||
      spu.status === 'ON' ||
      spu.status === 'on',
    currency: spu.currency ?? 'CNY',
    sort: undefined,
    createdAt: spu.createTime ?? spu.createdAt,
    updatedAt: spu.modifyTime ?? spu.updatedAt,
    langs: Array.isArray(i18nList)
      ? i18nList.map((i) => i.langCode).filter(Boolean)
      : [],
    categoryId,
    categoryName:
      getCatName(categoryId) || categoryMap.value.get(categoryId ?? -1) || '',
    subCategoryId,
    subCategoryName:
      getCatName(subCategoryId) ||
      subCategoryMap.value.get(subCategoryId ?? -1) ||
      '',
    specTypeId: undefined,
    specIds: [],
    specNames,
    exclusive: spu.exclusive ?? undefined,

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
    const res = await currencies({});
    const options = normalizeCurrencyOptions(res?.data ?? res);
    currencyOptions.value = options;
    ensureCurrencyOption(form.product.currency);
  } catch (error: any) {
    ensureCurrencyOption(form.product.currency);
    ElMessage.error(error?.message || t('admin.product.message.fetchCurrencyFailed'));
  } finally {
    currencyLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const [level1Res, level2Res] = await Promise.all([
      getCategoryPage({ pageNum: 1, pageSize: 200, level: '1' }),
      searchCategory({
        pageNum: 1,
        pageSize: 500,
        categoryDomain: '2',
        nameKeyword: '',
        offset: 0,
      }),
    ]);
    const normalizeList = (res: any) => {
      const payload = res?.data ?? res ?? {};
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload.list)) return payload.list;
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.data?.list)) return payload.data.list;
      return [];
    };
    const level1 = normalizeList(level1Res).map((item: any) => {
      const cat = item.category ?? item;
      const id = Number(cat.id ?? cat.categoryId);
      const nameI18n = item.nameI18n || cat.nameI18n || {};
      const label = pickName(
        nameI18n,
        cat.categoryName || item.displayName || cat.name || '',
      );
      return { value: id, label };
    });
    const level2 = normalizeList(level2Res)
      .map((item: any) => {
        const cat = item.category ?? item;
        const id = Number(cat.id ?? cat.categoryId ?? item.id);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        const parentId = normalizeOptionalId(
          cat.pcategoryId ??
            cat.parentId ??
            cat.rootId ??
            item.pcategoryId ??
            item.parentId ??
            item.rootId,
        );
        const nameI18n = item.nameI18n || cat.nameI18n || {};
        const label = pickName(
          nameI18n,
          cat.categoryName || item.categoryName || item.displayName || cat.name || '',
        );
        return { value: id, label, parentId };
      })
      .filter(
        (
          item,
        ): item is { label: string; value: number; parentId: number | null } =>
          Boolean(item),
      );
    categoryOptions.value = level1;
    subCategoryOptions.value = level2;
    // adjust defaults if empty
    if (!form.product.categoryId && level1.length)
      form.product.categoryId = level1[0].value;
    if (
      !form.product.subCategoryId ||
      !filteredSubCategoryOptions.value.some(
        (item) => item.value === form.product.subCategoryId,
      )
    ) {
      form.product.subCategoryId = filteredSubCategoryOptions.value[0]?.value;
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchCategoryFailed'));
  }
};

const fetchSpecTypes = async () => {
  try {
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
        const nameI18n = item.nameI18n || specType.nameI18n || {};
        const label = pickName(nameI18n, specType.typeName || item.name || '');
        const subCategoryId = normalizeOptionalId(
          specType.subCategoryId ??
            specType.categoryId ??
            specType.pcategoryId ??
            item.subCategoryId ??
            item.categoryId ??
            item.pcategoryId,
        );
        return { value: id, label, subCategoryId };
      })
      .filter(
        (
          item,
        ): item is { label: string; value: number; subCategoryId: number | null } =>
          Boolean(item),
      );
    normalizeSpecGroups(true);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchSpecTypeFailed'));
  }
};

const fetchSpecs = async () => {
  try {
    const res = await getSpecValuePage({ pageNum: 1, pageSize: 500 });
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
    specOptions.value = records
      .map((item: any) => {
        const specValue = item.specValue ?? item;
        const id = Number(specValue.id ?? item.id);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        const typeId = normalizeOptionalId(
          specValue.specTypeId ?? specValue.typeId ?? item.specTypeId,
        );
        const subCategoryId = normalizeOptionalId(
          specValue.subCategoryId ??
            specValue.categoryId ??
            specValue.pcategoryId ??
            item.subCategoryId ??
            item.categoryId ??
            item.pcategoryId,
        );
        const nameI18n = item.nameI18n || specValue.nameI18n || {};
        const label = pickName(nameI18n, specValue.specValue || item.name || '');
        return { value: id, label, typeId, subCategoryId };
      })
      .filter(
        (
          item,
        ): item is {
          label: string;
          value: number;
          typeId: number | null;
          subCategoryId: number | null;
        } => Boolean(item),
      );
    normalizeSpecGroups(true);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchSpecFailed'));
  }
};

const fetchAddonCategories = async () => {
  try {
    const res = await getAddonTypePage({ pageNum: 1, pageSize: 200 });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    addonCategoryOptions.value = records.map((item: any) => {
      const attach = item.attachType ?? item;
      const id = Number(attach.id ?? attach.typeId ?? attach.attachTypeId);
      const nameI18n = item.nameI18n || attach.nameI18n || {};
      const label = pickName(nameI18n, attach.typeName || '');
      return { value: id, label };
    });
    if (
      form.addonGroups.length &&
      !form.addonGroups[0].categoryId &&
      addonCategoryOptions.value.length
    ) {
      form.addonGroups[0].categoryId = addonCategoryOptions.value[0].value;
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchAddonCategoryFailed'));
  }
};

const fetchAddons = async () => {
  try {
    const res = await getAddonPage({ pageNum: 1, pageSize: 500 });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    addonOptions.value = records.map((item: any) => {
      const attach = item.attachValue ?? item;
      const id = Number(attach.id ?? attach.attachValueId);
      const categoryId = Number(attach.attachTypeId ?? attach.categoryId ?? 0);
      const nameI18n = item.nameI18n || attach.nameI18n || {};
      const label = pickName(nameI18n, attach.attachValue || '');
      return { value: id, label, categoryId, price: attach.price };
    });
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchAddonFailed'));
  }
};

const fetchProducts = async () => {
  tableLoading.value = true;
  try {
    const res = await page({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
    });
    const { list, total: t, pageNum, pageSize } = extractPage(res);
    products.value = list;
    total.value = t;
    query.pageNum = pageNum;
    query.pageSize = pageSize;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchListFailed'));
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
  query.nameKeyword = '';
  query.pageNum = 1;
  fetchProducts();
};

const addLang = () => {
  form.productI18nList.push({ langCode: '', name: '', details: '' });
};

const removeLang = (idx: number) => {
  form.productI18nList.splice(idx, 1);
};

const addDescLang = () => {
  form.descI18nList.push({ lang: '', value: '' });
};

const removeDescLang = (idx: number) => {
  if (form.descI18nList.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneDescLang'));
    return;
  }
  form.descI18nList.splice(idx, 1);
};

const addServiceContentLang = () => {
  form.serviceContentI18nList.push({ lang: '', value: '' });
};

const removeServiceContentLang = (idx: number) => {
  if (form.serviceContentI18nList.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneServiceLang'));
    return;
  }
  form.serviceContentI18nList.splice(idx, 1);
};

const addBookingNoticeLang = () => {
  form.bookingNoticeI18nList.push({ lang: '', value: '' });
};

const removeBookingNoticeLang = (idx: number) => {
  if (form.bookingNoticeI18nList.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneBookingNoticeLang'));
    return;
  }
  form.bookingNoticeI18nList.splice(idx, 1);
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

const openPreview = (row: ProductRow) => {
  const url = row.previewUrl?.trim();
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const openEdit = async (row: ProductRow) => {
  isEdit.value = true;
  resetForm();
  dialogVisible.value = true;
  detailLoading.value = true;
  try {
    const detailRes = await detial(row.id);
    const detail = detailRes?.data ?? detailRes ?? {};
    const spu = detail.spu ?? {};
    const nameI18n = detail.nameI18n || {};
    const descI18n = detail.descI18n || {};
    const serviceContentI18n = detail.serviceContentI18n || {};
    const bookingNoticeI18n = detail.bookingNoticeI18n || {};
    const images = Array.isArray(detail.imageUrls) ? detail.imageUrls : [];
    const categoryIds = Array.isArray(detail.categoryIds)
      ? detail.categoryIds
      : [];
    const specBindings: any[] = Array.isArray(detail.specBindings)
      ? detail.specBindings
      : [];
    const attachBindings: any[] = Array.isArray(detail.attachBindings)
      ? detail.attachBindings
      : [];

    const categoryId =
      (categoryIds[0] !== undefined ? Number(categoryIds[0]) : undefined) ??
      row.categoryId ??
      categoryOptions.value[0]?.value;
    const subCategoryId =
      (categoryIds[1] !== undefined ? Number(categoryIds[1]) : undefined) ??
      row.subCategoryId ??
      filteredSubCategoryOptions.value.find(
        (s) => !s.parentId || s.parentId === categoryId,
      )
        ?.value;
    form.product = {
      id: spu.id,
      price: spu.price ?? row.price,
      stock: spu.stock ?? row.stock,
      isOnSale:
        spu.status === 1 ||
        spu.status === '1' ||
        spu.status === true ||
        spu.status === 'ON' ||
        spu.status === 'on',
      currency: spu.currency ?? row.currency ?? 'CNY',
      sort: undefined,
      categoryId,
      subCategoryId,
      specTypeId: undefined,
      specIds: [],
    };
    const mappedSpecGroups: SpecGroup[] = specBindings.length
      ? specBindings.map((g: any) => ({
          specTypeId: g.specTypeId ?? null,
          specIds: Array.isArray(g.specValueIds) ? g.specValueIds : [],
        }))
      : [
          {
            specTypeId: null,
            specIds: [],
          },
        ];
    form.specGroups = mappedSpecGroups;
    normalizeSpecGroups(true);
    form.product.specIds = mappedSpecGroups[0]?.specIds ?? [];
    form.product.specTypeId = mappedSpecGroups[0]?.specTypeId ?? undefined;

    const mappedAddonGroups: AddonGroup[] = attachBindings.length
      ? attachBindings.map((g: any) => ({
          categoryId: g.attachTypeId ?? null,
          addonIds: Array.isArray(g.attachValueIds) ? g.attachValueIds : [],
        }))
      : [
          {
            categoryId: addonCategoryOptions.value[0]?.value ?? null,
            addonIds: [],
          },
        ];
    form.addonGroups = mappedAddonGroups;

    const i18nList =
      Object.keys(nameI18n).length > 0
        ? Object.keys(nameI18n).map((lang) => ({
            langCode: lang,
            name: nameI18n[lang],
            details: descI18n?.[lang] || '',
          }))
        : defaultI18nList();
    form.productI18nList = i18nList;
    form.descI18nList = Object.keys(descI18n || {}).length
      ? Object.keys(descI18n).map((lang) => ({ lang, value: descI18n[lang] }))
      : [{ lang: 'zh-CN', value: '' }];
    form.serviceContentI18nList = Object.keys(serviceContentI18n || {}).length
      ? Object.keys(serviceContentI18n).map((lang) => ({
          lang,
          value: serviceContentI18n[lang],
        }))
      : [{ lang: 'zh-CN', value: '' }];
    form.bookingNoticeI18nList = Object.keys(bookingNoticeI18n || {}).length
      ? Object.keys(bookingNoticeI18n).map((lang) => ({
          lang,
          value: bookingNoticeI18n[lang],
        }))
      : [{ lang: 'zh-CN', value: '' }];

    form.productImages = images.map((url: string, idx: number) => ({
      id: undefined,
      productId: spu.id,
      imageUrl: url,
      sort: undefined,
      createdAt: '',
    }));
    setUploadList(form.productImages);
    ensureCurrencyOption(form.product.currency);
    nextTick(() => formRef.value?.clearValidate());
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchDetailFailed'));
  } finally {
    detailLoading.value = false;
  }
};

const handleUpload = async (options: UploadRequestOptions) => {
  uploadCount.value += 1;
  try {
    const formData = new FormData();
    formData.append('file', options.file as File);
    const res = await upload(formData);
    const url =
      typeof res?.data === 'string'
        ? res.data
        : res?.data?.url || res?.url || '';
    if (!url) throw new Error(t('admin.product.message.uploadEmptyUrl'));
    form.productImages.push({ imageUrl: url, sort: form.productImages.length });
    uploadList.value.push({ name: options.file.name, url });
    options.onSuccess?.({ url } as any);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.uploadFailed'));
    options.onError?.(error);
  } finally {
    uploadCount.value = Math.max(0, uploadCount.value - 1);
  }
};

const onRemove = (file: UploadUserFile) => {
  const url = file.url;
  if (!url) return;
  form.productImages = form.productImages.filter(
    (item) => item.imageUrl !== url,
  );
  uploadList.value = uploadList.value.filter((item) => item.url !== url);
};

const addSpecGroup = () => {
  form.specGroups.push({
    specTypeId: getDefaultSpecTypeId(),
    specIds: [],
  });
};

const removeSpecGroup = (idx: number) => {
  if (form.specGroups.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneSpecGroup'));
    return;
  }
  form.specGroups.splice(idx, 1);
};

const onCategoryChange = () => {
  // 重置服务子类到当前类别下的第一个
  const target = filteredSubCategoryOptions.value[0];
  form.product.subCategoryId = target ? target.value : undefined;
};

const addAddonGroup = () => {
  form.addonGroups.push({
    categoryId: addonCategoryOptions.value[0]?.value ?? null,
    addonIds: [],
  });
};

const removeAddonGroup = (idx: number) => {
  if (form.addonGroups.length <= 1) {
    ElMessage.warning(t('admin.product.message.keepOneAddonGroup'));
    return;
  }
  form.addonGroups.splice(idx, 1);
};

const toggleSale = async (row: ProductRow) => {
  const targetStatus = !row.isOnSale;
  try {
    if (targetStatus) {
      await enable(row.id);
    } else {
      await disable(row.id);
    }
    row.isOnSale = targetStatus;
    ElMessage.success(
      t('admin.product.message.saleChanged', {
        status: targetStatus ? t('admin.product.sale.on') : t('admin.product.sale.off'),
      }),
    );
    fetchProducts();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.operationFailed'));
  }
};

const buildPriceTable = (
  specList: SpecGroup[],
  priceList?: {
    specKey: string;
    price?: number;
    originPrice?: number;
    discountPrice?: number;
  }[],
) => {
  priceColumns.value = specList.map((g, idx) => {
    const typeLabel =
      specTypeOptions.value.find((t) => t.value === g.specTypeId)?.label ||
      t('admin.product.fallback.specTypeIndex', { index: idx + 1 });
    return { key: `type${idx}`, label: typeLabel };
  });

  // 生成规格组合的笛卡尔积
  const specOptionsMap = new Map<number, string>();
  specOptions.value.forEach((s) => specOptionsMap.set(s.value, s.label));

  const originMap = new Map<string, number>();
  const discountMap = new Map<string, number>();
  (priceList || []).forEach((p) => {
    if (!p?.specKey) return;
    if (p.originPrice !== undefined)
      originMap.set(p.specKey, Number(p.originPrice) || 0);
    if (p.discountPrice !== undefined)
      discountMap.set(p.specKey, Number(p.discountPrice) || 0);
    if (p.price !== undefined && !originMap.has(p.specKey))
      originMap.set(p.specKey, Number(p.price) || 0);
  });
  const combos: PriceRow[] = [];
  const dfs = (depth: number, path: number[], pathLabels: string[]) => {
    if (depth === specList.length) {
      const specMap: Record<string, string> = {};
      pathLabels.forEach((label, i) => {
        specMap[`type${i}`] = label;
      });
      const key = path.join('-');
      const mockOrigin =
        originMap.get(key) ?? (path.reduce((a, b) => a + b, 0) || 1) * 10; // 模拟原价
      const mockDiscount = discountMap.get(key);
      combos.push({
        id: key,
        specMap,
        originPrice: mockOrigin,
        discountPrice: mockDiscount,
      });
      return;
    }
    const group = specList[depth];
    const ids = Array.isArray(group.specIds) ? group.specIds : [];
    ids.forEach((id) => {
      dfs(
        depth + 1,
        [...path, id],
        [...pathLabels, specOptionsMap.get(id) || `${id}`],
      );
    });
  };
  if (specList.length > 0) dfs(0, [], []);
  priceRows.value = combos;
};

const openPriceDialog = async (row: ProductRow) => {
  priceDialogVisible.value = true;
  priceLoading.value = true;
  try {
    const res = await listBySpu(row.id);
    const data = res?.data ?? res ?? {};
    const specTypes = Array.isArray(data.specTypes) ? data.specTypes : [];
    priceColumns.value = specTypes.map((st: any, idx: number) => {
      const label = pickName(st.nameI18n, st.specTypeName || t('admin.product.fallback.specTypeIndex', { index: idx + 1 }));
      const key = String(st.specKey ?? st.specTypeId ?? idx);
      return { key, label };
    });
    const skus = Array.isArray(data.skus) ? data.skus : [];
    priceRows.value = skus.map((sku: any) => {
      const specMap: Record<string, string> = {};
      priceColumns.value.forEach((col) => {
        const cell = sku[col.key];
        specMap[col.key] = pickName(cell, '');
      });
      return {
        id:
          sku.skuId ??
          sku.id ??
          sku.skuCode ??
          Math.random().toString(36).slice(2),
        specMap,
        originPrice: Number(sku.originalPrice ?? sku.originPrice ?? 0),
        discountPrice: Number(sku.price ?? sku.discountPrice ?? 0),
      };
    });
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.product.message.fetchSpecFailed'));
    priceRows.value = [];
    priceColumns.value = [];
  } finally {
    priceLoading.value = false;
  }
};

const savePrice = () => {
  const invalid = priceRows.value.find(
    (r) =>
      r.originPrice === null ||
      r.originPrice === undefined ||
      r.originPrice === '' ||
      Number.isNaN(Number(r.originPrice)),
  );
  if (invalid) {
    ElMessage.error(t('admin.product.message.originPriceRequired'));
    return;
  }
  const payload = priceRows.value.map((r) => ({
    skuId: r.id,
    skuCode: r.id,
    price: Number(r.discountPrice ?? 0),
    originalPrice: Number(r.originPrice ?? 0),
  }));
  batchUpdatePrices(payload)
    .then(() => {
      ElMessage.success(t('admin.product.message.priceSaved'));
      priceDialogVisible.value = false;
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || t('admin.product.message.saveFailed'));
    });
};

const save = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    if (uploading.value) {
      ElMessage.warning(t('admin.product.message.uploadingTip'));
      return;
    }
    submitLoading.value = true;
    try {
      // 同步兼容字段：取第一个规格组
      const firstGroup = form.specGroups[0] || {
        specTypeId: null,
        specIds: [],
      };
      form.product.specTypeId = firstGroup.specTypeId ?? undefined;
      form.product.specIds = firstGroup.specIds ?? [];
      // 确保分类与服务子类一致
      if (form.product.subCategoryId) {
        const parentId = subCategoryParentMap.value.get(
          form.product.subCategoryId,
        );
        if (parentId) {
          form.product.categoryId = parentId;
        }
      }
      if (
        !form.product.subCategoryId &&
        filteredSubCategoryOptions.value.length
      ) {
        form.product.subCategoryId = filteredSubCategoryOptions.value[0].value;
      }
      const nameI18n = form.productI18nList.reduce<Record<string, string>>(
        (acc, cur) => {
          if (cur.langCode && cur.name) acc[cur.langCode] = cur.name;
          return acc;
        },
        {},
      );
      const descI18n = form.descI18nList.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {});
      const serviceContentI18n = form.serviceContentI18nList.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {});
      const bookingNoticeI18n = form.bookingNoticeI18nList.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {});
      const payload = {
        id: form.product.id,
        spuCode: '',
        categoryId: form.product.categoryId
          ? String(form.product.categoryId)
          : undefined,
        spuName: nameI18n['zh-CN'] || Object.values(nameI18n)[0],
        spuEnglishName: nameI18n['en'] || nameI18n['en-US'],
        nameI18n,
        descI18n,
        serviceContentI18n,
        bookingNoticeI18n,
        status: form.product.isOnSale ? 1 : 0,
        sort: undefined,
        imageUrl: form.productImages[0]?.imageUrl,
        imageUrls: form.productImages
          .map((img) => img.imageUrl)
          .filter(Boolean),
        categoryIds: [form.product.categoryId, form.product.subCategoryId]
          .filter((v) => v !== undefined && v !== null)
          .map(String),
        specBindings: form.specGroups.map((g) => ({
          specTypeId: g.specTypeId,
          specValueIds: g.specIds,
        })),
        attachBindings: form.addonGroups.map((g) => ({
          attachTypeId: g.categoryId,
          attachValueIds: g.addonIds,
        })),
      };
      if (isEdit.value) {
        await addOrUpdate(payload);
        ElMessage.success(t('admin.product.message.updateSuccess'));
      } else {
        await addOrUpdate(payload);
        ElMessage.success(t('admin.product.message.createSuccess'));
      }
      dialogVisible.value = false;
      fetchProducts();
    } catch (error: any) {
      ElMessage.error(error?.message || t('admin.product.message.saveFailed'));
    } finally {
      submitLoading.value = false;
    }
  });
};
const toggleRecommend = async (row) => {
  if (row.exclusive) {
    await disableExclusive(row.id);
  } else {
    await enableExclusive(row.id);
  }
  ElMessage.success(t('admin.product.message.recommendUpdated'));
  fetchProducts();
};
const remove = async (row: ProductRow) => {
  try {
    await ElMessageBox.confirm(
      t('admin.product.message.deleteConfirm', { name: row.name }),
      t('admin.common.confirmTitle'),
      {
      type: 'warning',
      },
    );
    await deleteProduct(row.id);
    ElMessage.success(t('admin.product.message.deleteSuccess'));
    fetchProducts();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  }
};

onMounted(() => {
  fetchCurrencies();
  fetchCategories();
  fetchSpecTypes();
  fetchSpecs();
  fetchAddonCategories();
  fetchAddons();
  fetchProducts();
});

watch(
  () => form.product.subCategoryId,
  () => {
    normalizeSpecGroups(true);
  },
);

watch(
  () => locale.value,
  () => {
    fetchCategories();
    fetchSpecTypes();
    fetchSpecs();
    fetchAddonCategories();
    fetchAddons();
    fetchProducts();
  },
);
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
  grid-template-columns: 140px 1fr auto;
  gap: 8px;
  align-items: center;
}
.full-width {
  width: 100%;
}
.group-box {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.group-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}
.quill-wrapper {
  width: 100%;
}
.quill-wrapper :deep(.ql-container) {
  min-height: 140px;
  border-radius: 4px;
}
.quill-wrapper :deep(.ql-editor) {
  min-height: 120px;
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
