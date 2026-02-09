<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索分类名称"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增分类</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column label="名称" min-width="200">
          <template #default="{ row }">
            {{ row.displayName }}
          </template>
        </el-table-column>
        <el-table-column label="图标" width="120">
          <template #default="{ row }">
            <img v-if="row.iconUrl" :src="row.iconUrl" alt="" class="icon-thumb" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              active-text="启用"
              inactive-text="停用"
              inline-prompt
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="图标" prop="iconUrl">
          <el-upload
            :http-request="handleIconUpload"
            list-type="picture-card"
            :file-list="iconFileList"
            :on-remove="onIconRemove"
            accept="image/*"
            :limit="1"
            :on-exceed="() => ElMessage.warning('只能上传一张图片')"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="名称(多语言)" prop="nameI18n">
          <div class="i18n-list">
            <div v-for="(item, idx) in nameI18nList" :key="idx" class="i18n-row">
              <el-select v-model="item.lang" placeholder="语言" style="width: 140px">
                <el-option label="中文(zh-CN)" value="zh-CN" />
                <el-option label="英文(en)" value="en" />
              </el-select>
              <el-input v-model="item.value" placeholder="名称" />
              <el-button link type="danger" :disabled="nameI18nList.length===1" @click="removeI18n(idx)">删除</el-button>
            </div>
            <el-button link type="primary" @click="addI18n">+ 添加语言</el-button>
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules, UploadUserFile, UploadRequestOptions } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getPage, add, update, del, changeStatus, upload } from '@/modules/admin/api/category';

type Category = {
  id: number;
  iconUrl?: string;
  nameI18n?: Record<string, string>;
  enabled: boolean;
  createdAt: string;
  displayName: string;
};

const list = ref<Category[]>([]);
const query = reactive({
  keyword: '',
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
      keyword: query.keyword?.trim() || undefined,
      level: '1',
    });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => ({
      id: item.category?.id ?? item.id,
      displayName:
        item.nameI18n?.['zh-CN'] ||
        item.category?.nameI18n?.['zh-CN'] ||
        item.category?.categoryName ||
        item.categoryName ||
        item.name ||
        '',
      nameI18n: item.nameI18n || item.category?.nameI18n,
      iconUrl: item.imageUrls?.[0] || item.iconUrl || item.icon,
      enabled: (item.category?.status ?? item.status) === 1,
      createdAt: item.category?.createTime || item.createdAt || item.createTime || '',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取分类列表失败');
  } finally {
    tableLoading.value = false;
  }
};

const dialogVisible = ref(false);
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
const nameI18nList = ref<{ lang: string; value: string }[]>([{ lang: 'zh-CN', value: '' }]);

const rules: FormRules = {
  nameI18n: [
    {
      validator: (_r, _v, cb) => {
        const invalid = nameI18nList.value.find((i) => !i.lang?.trim() || !i.value?.trim());
        if (invalid) return cb(new Error('请完善多语言名称'));
        cb();
      },
      trigger: 'change',
    },
  ],
  iconUrl: [{ required: true, message: '请上传图标', trigger: 'change' }],
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchList();
};

const reset = () => {
  query.keyword = '';
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
  Object.assign(form, { id: 0, sort: 0, enabled: true, createdAt: '', displayName: '' });
  iconFileList.value = [];
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
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
      : [{ lang: 'zh-CN', value: row.name || row.displayName || '' }];
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
      categoryDomain: '1',
      status: form.enabled ? 1 : 0,
    };
    action(payload)
      .then(() => {
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => {
        ElMessage.error(err?.message || '保存失败');
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
      if (!url) throw new Error('上传失败');
      form.iconUrl = url;
      iconFileList.value = [{ name: file.name, url }];
      options.onSuccess?.({ url } as any, file as any);
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || '上传失败');
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
      ElMessage.success(`已${row.enabled ? '启用' : '停用'}`);
      fetchList();
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || '更新状态失败');
      row.enabled = !row.enabled; // revert
    });
};

const remove = (row: Category) => {
  const label = row.displayName || row.nameI18n?.['zh-CN'] || row.nameI18n?.['zh'] || '该分类';
  ElMessageBox.confirm(`确定删除分类「${label}」吗？`, '提示', { type: 'warning' })
    .then(() => {
      return del({ id: row.id });
    })
    .then(() => {
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  const date = new Date(val);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchList();
});

const addI18n = () => {
  nameI18nList.value.push({ lang: '', value: '' });
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
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
  grid-template-columns: 160px 1fr auto;
  gap: 8px;
  align-items: center;
}
</style>
