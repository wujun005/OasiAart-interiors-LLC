<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          placeholder="搜索二级分类名称"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.parentId" placeholder="所属一级分类" clearable style="width: 200px">
          <el-option v-for="c in categories" :key="c.id" :label="c.displayName" :value="c.id" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增二级分类</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="名称" min-width="180">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column prop="parentName" label="所属一级分类" min-width="160" />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑二级分类' : '新增二级分类'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="所属一级分类" prop="parentId">
          <el-select v-model="form.parentId" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.displayName" :value="c.id" />
          </el-select>
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules, UploadUserFile, UploadRequestOptions } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getPage, add, update, del, changeStatus, upload } from '@/modules/admin/api/category';
import { pickI18nText } from '@/modules/admin/utils/i18n';

type SubCategory = {
  id: number;
  parentId: number;
  iconUrl?: string;
  sort: number;
  enabled: boolean;
  createdAt: string;
  nameI18n?: Record<string, string>;
  displayName: string;
};

const categories = ref<{ id: number; displayName: string }[]>([]);
const { locale } = useI18n({ useScope: 'global' });
const list = ref<SubCategory[]>([]);
const query = reactive({
  nameKeyword: '',
  parentId: null as number | null,
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const tableLoading = ref(false);

const categoryMap = computed(() => {
  const map = new Map<number, string>();
  categories.value.forEach((c) => map.set(c.id, c.displayName));
  return map;
});

const displayList = computed(() =>
  list.value.map((item) => ({
    ...item,
    parentName: categoryMap.value.get(item.parentId) || '-',
  }))
);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<SubCategory>({
  id: 0,
  parentId: 0,
  iconUrl: '',
  sort: 0,
  enabled: true,
  createdAt: '',
  nameI18n: {},
  displayName: '',
});
const iconFileList = ref<UploadUserFile[]>([]);
const nameI18nList = ref<{ lang: string; value: string }[]>([{ lang: 'zh-CN', value: '' }]);

const rules: FormRules = {
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  parentId: [{ required: true, message: '请选择一级分类', trigger: 'change' }],
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
  query.nameKeyword = '';
  query.parentId = null;
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
    parentId: categories.value[0]?.id ?? 0,
    iconUrl: '',
    sort: list.value.length + 1,
    enabled: true,
    createdAt: new Date().toISOString(),
    displayName: '',
    nameI18n: {},
  });
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
  iconFileList.value = [];
  dialogVisible.value = true;
};

const openEdit = (row: SubCategory) => {
  isEdit.value = true;
  Object.assign(form, { ...row });
  nameI18nList.value = row.nameI18n && Object.keys(row.nameI18n).length
    ? Object.entries(row.nameI18n).map(([lang, value]) => ({ lang, value: value as string }))
    : [{ lang: 'zh-CN', value: row.displayName || '' }];
  iconFileList.value = row.iconUrl ? [{ name: 'icon', url: row.iconUrl }] : [];
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
      level: '2',
      pcategoryId: form.parentId,
      rootId: form.parentId,
      imageUrl: form.iconUrl,
      imageUrls: form.iconUrl ? [form.iconUrl] : [],
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      categoryDomain: '1',
      status: form.enabled ? 1 : 0,
      sort: form.sort,
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

const toggleStatus = (row: SubCategory) => {
  changeStatus({ id: row.id, status: row.enabled ? 1 : 0 })
    .then(() => {
      ElMessage.success(`已${row.enabled ? '启用' : '停用'}`);
      fetchList();
    })
    .catch((err: any) => {
      ElMessage.error(err?.message || '更新状态失败');
      row.enabled = !row.enabled;
    });
};

const remove = (row: SubCategory) => {
  const label = pickI18nText(
    row.nameI18n,
    locale.value,
    row.displayName || '',
  );
  ElMessageBox.confirm(`确定删除二级分类「${label}」吗？`, '提示', { type: 'warning' })
    .then(() => del({ id: row.id }))
    .then(() => {
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
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

const addI18n = () => {
  nameI18nList.value.push({ lang: 'zh-CN', value: '' });
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

const fetchCategories = async () => {
  // 取一级分类 level = 1
  const res = await getPage({ pageNum: 1, pageSize: 100, level: '1' });
  const data = res?.data ?? res ?? {};
  const records = Array.isArray(data.list) ? data.list : [];
  categories.value = records.map((item: any) => ({
    id: item.category?.id ?? item.id,
    displayName: pickI18nText(
      item.nameI18n || item.category?.nameI18n,
      locale.value,
      item.category?.categoryName || item.categoryName || item.name || '',
    ),
  }));
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getPage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      level: '2',
      pcategoryId: query.parentId || undefined,
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
      parentId: Number(item.category?.pcategoryId ?? item.pcategoryId ?? query.parentId ?? 0),
      iconUrl: item.imageUrls?.[0] || item.iconUrl || item.icon,
      sort: item.category?.sort ?? item.sort ?? 0,
      enabled: (item.category?.status ?? item.status) === 1,
      createdAt: item.category?.createTime || item.createdAt || item.createTime || '',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取二级分类失败');
  } finally {
    tableLoading.value = false;
  }
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
.icon-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.icon-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
