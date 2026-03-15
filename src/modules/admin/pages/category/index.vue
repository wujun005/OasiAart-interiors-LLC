<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.category.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">{{ t('admin.category.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.category.actions.reset') }}</el-button>
        <el-button type="primary" @click="openCreate">{{ t('admin.category.actions.create') }}</el-button>
        <el-button @click="openPreview">{{ t('admin.category.actions.preview') }}</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column :label="t('admin.category.table.name')" min-width="200">
          <template #default="{ row }">
            {{ row.displayName }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.category.table.icon')" width="120">
          <template #default="{ row }">
            <img v-if="row.iconUrl" :src="row.iconUrl" alt="" class="icon-thumb" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.category.table.status')" width="140">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-text="t('admin.common.enabled')"
              :inactive-text="t('admin.common.disabled')"
              inline-prompt
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.category.table.createdAt')" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.category.table.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.category.actions.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="remove(row)">
              {{ t('admin.category.actions.delete') }}
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
      :title="isEdit ? t('admin.category.dialog.editTitle') : t('admin.category.dialog.createTitle')"
      :close-on-click-modal="false"
      width="1000px"
    >
      <el-form ref="formRef" class="category-form" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="t('admin.category.form.icon')" prop="iconUrl">
          <el-upload
            :http-request="handleIconUpload"
            list-type="picture-card"
            :file-list="iconFileList"
            :on-remove="onIconRemove"
            accept="image/*"
            :limit="1"
            :on-exceed="() => ElMessage.warning(t('admin.category.message.uploadOnlyOne'))"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('admin.category.form.nameI18n')" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.category.form.languagePlaceholder')" style="width: 180px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.category.form.namePlaceholder')" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">
                {{ t('admin.category.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addI18n">{{ t('admin.category.actions.addLang') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="t('admin.category.form.bannerTitle')" prop="bannerTitleI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in bannerTitleList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.category.form.languagePlaceholder')" style="width: 180px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input v-model="item.value" :placeholder="t('admin.category.form.bannerTitlePlaceholder')" />
              <el-button link type="danger" :disabled="bannerTitleList.length===1" @click="removeBannerTitle(idx)">
                {{ t('admin.category.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addBannerTitle">{{ t('admin.category.actions.addLang') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.category.form.bannerDesc')" prop="bannerDescI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in bannerDescList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.category.form.languagePlaceholder')" style="width: 180px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model="item.value"
                type="textarea"
                :rows="4"
                :placeholder="t('admin.category.form.bannerDescPlaceholder')"
              />
              <el-button link type="danger" :disabled="bannerDescList.length===1" @click="removeBannerDesc(idx)">
                {{ t('admin.category.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addBannerDesc">{{ t('admin.category.actions.addLang') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.category.form.bannerTags')" prop="bannerTagsI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in bannerTagsList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" :placeholder="t('admin.category.form.languagePlaceholder')" style="width: 180px">
                <el-option :label="t('admin.common.langZhCn')" value="zh-CN" />
                <el-option :label="t('admin.common.langEnCode')" value="en" />
              </el-select>
              <el-input
                v-model="item.value"
                type="textarea" :rows="4" 
                :placeholder="t('admin.category.form.bannerTagsPlaceholder')"
              />
              <el-button link type="danger" :disabled="bannerTagsList.length===1" @click="removeBannerTags(idx)">
                {{ t('admin.category.actions.removeLang') }}
              </el-button>
            </div>
            <el-button link type="primary" @click="addBannerTags">{{ t('admin.category.actions.addLang') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('admin.category.form.status')" prop="enabled">
          <el-switch v-model="form.enabled" :active-text="t('admin.common.enabled')" :inactive-text="t('admin.common.disabled')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.category.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">{{ t('admin.category.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      class="category-preview-dialog"
      :title="t('admin.category.dialog.previewTitle')"
      :close-on-click-modal="false"
      width="1100px"
    >
      <div class="preview-panel">
        <h3 class="preview-panel__title">{{ t('admin.category.preview.title') }}</h3>
        <!-- <p class="preview-panel__subtitle">{{ t('admin.category.preview.subtitle') }}</p> -->
        <div v-if="!previewTiles.length" class="preview-panel__empty">
          {{ t('admin.category.preview.empty') }}
        </div>
        <div v-else class="preview-services-grid">
          <article
            v-for="item in previewTiles"
            :key="item.id"
            class="preview-services-grid__item"
            :class="{ 'preview-services-grid__item--placeholder': !item.icon }"
          >
            <div class="preview-services-grid__icon">
              <img v-if="item.icon" :src="item.icon" :alt="item.title" />
              <span v-else>{{ item.initial }}</span>
            </div>
            <p>{{ item.title }}</p>
          </article>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules, UploadUserFile, UploadRequestOptions } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getPage, add, update, del, changeStatus, upload } from '@/modules/admin/api/category';
import { ADMIN_LANG_EN, pickI18nText } from '@/modules/admin/utils/i18n';

type Category = {
  id: number;
  iconUrl?: string;
  nameI18n?: Record<string, string>;
  bannerTitleI18n?: Record<string, string>;
  bannerDescI18n?: Record<string, string>;
  bannerTagsI18n?: Record<string, string[]>;
  enabled: boolean;
  createdAt: string;
  displayName: string;
};

const list = ref<Category[]>([]);
const { locale, t } = useI18n({ useScope: 'global' });
const createEmptyI18nItem = (value = '') => ({
  lang: ADMIN_LANG_EN,
  value,
});
const query = reactive({
  nameKeyword: '',
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const tableLoading = ref(false);

const displayList = computed(() => list.value);

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      level: '1',
    });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => ({
      id: item.category?.id ?? item.id,
      displayName: pickI18nText(
        item.nameI18n || item.category?.nameI18n,
        locale.value,
        item.category?.categoryName || item.categoryName || item.name || '',
      ),
      nameI18n: item.nameI18n || item.category?.nameI18n,
      bannerTitleI18n: item.bannerTitleI18n || item.category?.bannerTitleI18n,
      bannerDescI18n: item.bannerDescI18n || item.category?.bannerDescI18n,
      bannerTagsI18n: item.bannerTagsI18n || item.category?.bannerTagsI18n,
      iconUrl: item.imageUrls?.[0] || item.iconUrl || item.icon,
      enabled: (item.category?.status ?? item.status) === 1,
      createdAt: item.category?.createTime || item.createdAt || item.createTime || '',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.category.message.fetchFailed'));
  } finally {
    tableLoading.value = false;
  }
};

const dialogVisible = ref(false);
const previewVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<Category>({
  id: 0,
  iconUrl: '',
  enabled: true,
  createdAt: '',
  displayName: '',
});
const iconFileList = ref<UploadUserFile[]>([]);
const nameI18nList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);
const bannerTitleList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);
const bannerDescList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);
const bannerTagsList = ref<{ lang: string; value: string }[]>([createEmptyI18nItem()]);

const previewTiles = computed(() => {
  const source = displayList.value || [];
  const enabledList = source.filter((item) => item.enabled);
  const target = enabledList.length ? enabledList : source;
  return target
    .map((item, index) => {
      const title = item.displayName?.trim() || t('admin.category.preview.unnamed');
      const initial = title.slice(0, 1).toUpperCase();
      return {
        id: String(item.id || `service-${index + 1}`),
        title,
        icon: item.iconUrl || '',
        initial,
      };
    })
    .slice(0, 10);
});

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error(t('admin.category.validation.nameI18nIncomplete')));
        cb();
      },
      trigger: 'change',
    },
  ],
  bannerTitleI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = bannerTitleList.value.find((i) => i.value && !i.lang?.trim());
        if (invalid) return cb(new Error(t('admin.category.validation.bannerTitleLang')));
        cb();
      },
      trigger: 'change',
    },
  ],
  bannerDescI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = bannerDescList.value.find((i) => i.value && !i.lang?.trim());
        if (invalid) return cb(new Error(t('admin.category.validation.bannerDescLang')));
        cb();
      },
      trigger: 'change',
    },
  ],
  bannerTagsI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = bannerTagsList.value.find((i) => i.value && !i.lang?.trim());
        if (invalid) return cb(new Error(t('admin.category.validation.bannerTagsLang')));
        cb();
      },
      trigger: 'change',
    },
  ],
  iconUrl: [{ required: true, message: t('admin.category.validation.iconRequired'), trigger: 'change' }],
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

const openPreview = async () => {
  if (!displayList.value.length) {
    await fetchList();
  }
  previewVisible.value = true;
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, { id: 0, sort: 0, enabled: true, createdAt: '', displayName: '' });
  iconFileList.value = [];
  nameI18nList.value = [createEmptyI18nItem()];
  bannerTitleList.value = [createEmptyI18nItem()];
  bannerDescList.value = [createEmptyI18nItem()];
  bannerTagsList.value = [createEmptyI18nItem()];
  dialogVisible.value = true;
};

const openEdit = (row: Category) => {
  isEdit.value = true;
  Object.assign(form, { ...row });
  iconFileList.value = row.iconUrl
    ? [
        {
          name: 'icon',
          url: row.iconUrl,
        },
      ]
    : [];
  nameI18nList.value =
    row.nameI18n && Object.keys(row.nameI18n).length
      ? Object.entries(row.nameI18n).map(([lang, value]) => ({ lang, value: value as string }))
      : [createEmptyI18nItem(row.displayName || '')];
  bannerTitleList.value =
    row.bannerTitleI18n && Object.keys(row.bannerTitleI18n).length
      ? Object.entries(row.bannerTitleI18n).map(([lang, value]) => ({ lang, value: value as string }))
      : [createEmptyI18nItem()];
  bannerDescList.value =
    row.bannerDescI18n && Object.keys(row.bannerDescI18n).length
      ? Object.entries(row.bannerDescI18n).map(([lang, value]) => ({ lang, value: value as string }))
      : [createEmptyI18nItem()];
  bannerTagsList.value =
    row.bannerTagsI18n && Object.keys(row.bannerTagsI18n).length
      ? Object.entries(row.bannerTagsI18n).map(([lang, value]) => ({
          lang,
          value: Array.isArray(value) ? (value as string[]).join(',') : (value as string),
        }))
      : [createEmptyI18nItem()];
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
      level: '1',
      pcategoryId: '0',
      rootId: form.id || '0',
      imageUrl: form.iconUrl,
      imageUrls: form.iconUrl ? [form.iconUrl] : [],
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      bannerTitleI18n: bannerTitleList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      bannerDescI18n: bannerDescList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      bannerTagsI18n: bannerTagsList.value.reduce<Record<string, string[]>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value.split(',').map((s) => s.trim()).filter(Boolean);
        return acc;
      }, {}),
      categoryDomain: '1',
      status: form.enabled ? 1 : 0,
    };
    action(payload)
      .then(() => {
        ElMessage.success(t('admin.category.message.saveSuccess'));
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || t('admin.category.message.saveFailed'));
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
};

const handleIconUpload = (options: UploadRequestOptions) => {
  const file = options.file as File;
  const formData = new FormData();
  formData.append('file', file);
  upload(formData)
    .then((res: any) => {
      const url = res?.data?.url || res?.data || res?.url;
      if (!url) throw new Error(t('admin.category.message.uploadFailed'));
      form.iconUrl = url;
      iconFileList.value = [{ name: file.name, url }];
      options.onSuccess?.({ url } as any, file as any);
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || t('admin.category.message.uploadFailed'));
      options.onError?.(err as any);
    });
};

const onIconRemove = () => {
  form.iconUrl = '';
  iconFileList.value = [];
};

const toggleStatus = (row: Category) => {
  changeStatus({ id: row.id, status: row.enabled ? 1 : 0 })
    .then(() => {
      ElMessage.success(
        t('admin.category.message.statusChanged', {
          status: row.enabled ? t('admin.common.enabled') : t('admin.common.disabled'),
        }),
      );
      fetchList();
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || t('admin.category.message.statusChangeFailed'));
      row.enabled = !row.enabled; // revert
    });
};

const remove = (row: Category) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || t('admin.category.message.defaultLabel'),
  );
  ElMessageBox.confirm(
    t('admin.category.message.deleteConfirm', { label }),
    t('admin.common.confirmTitle'),
    { type: 'warning' },
  )
    .then(() => {
      return del({ id: row.id });
    })
    .then(() => {
      ElMessage.success(t('admin.category.message.deleteSuccess'));
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

onMounted(() => {
  fetchList();
});

watch(
  () => locale.value,
  () => {
    fetchList();
  },
);

const addI18n = () => {
  nameI18nList.value.push(createEmptyI18nItem());
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

const addBannerTitle = () => {
  bannerTitleList.value.push(createEmptyI18nItem());
};
const removeBannerTitle = (idx: number) => {
  if (bannerTitleList.value.length === 1) return;
  bannerTitleList.value.splice(idx, 1);
};
const addBannerDesc = () => {
  bannerDescList.value.push(createEmptyI18nItem());
};
const removeBannerDesc = (idx: number) => {
  if (bannerDescList.value.length === 1) return;
  bannerDescList.value.splice(idx, 1);
};
const addBannerTags = () => {
  bannerTagsList.value.push(createEmptyI18nItem());
};
const removeBannerTags = (idx: number) => {
  if (bannerTagsList.value.length === 1) return;
  bannerTagsList.value.splice(idx, 1);
};
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
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.icon-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.i18n-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.i18n-row {
  display: grid;
  grid-template-columns: 180px minmax(560px, 1fr) auto;
  gap: 8px;
  align-items: center;
}
.category-form :deep(.el-input),
.category-form :deep(.el-textarea) {
  width: 100%;
}
.preview-panel {
  padding: 8px 12px 16px;
}
.preview-panel__title {
  margin: 0;
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}
.preview-panel__subtitle {
  margin: 16px 0 0;
  text-align: center;
  color: rgba(15, 23, 42, 0.55);
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
}
.preview-panel__empty {
  margin-top: 36px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
.preview-services-grid {
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  row-gap: 42px;
}
.preview-services-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  transition: transform 0.2s ease;
}
.preview-services-grid__item:hover {
  transform: translateY(-4px);
}
.preview-services-grid__icon {
  width: 112px;
  height: 112px;
  border-radius: 24px;
  background: rgba(57, 114, 245, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-services-grid__icon img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}
.preview-services-grid__icon span {
  font-size: 28px;
  font-weight: 700;
  color: #3972f5;
}
.preview-services-grid__item p {
  margin: 0;
  min-height: 28px;
  text-align: center;
  color: rgba(15, 23, 42, 0.9);
  font-size: 20px;
  line-height: 1.4;
  font-weight: 800;
}
.preview-services-grid__item--placeholder:hover {
  transform: none;
}
@media (max-width: 1200px) {
  .preview-services-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .preview-services-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .preview-services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
