<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          placeholder="搜索规格名称"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.specTypeId"
          placeholder="规格类型"
          clearable
          style="width: 180px"
        >
          <el-option v-for="t in specTypeOptions" :key="t.id" :label="t.displayName" :value="t.id" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增规格</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="名称" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column prop="typeName" label="规格类型" min-width="140" />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规格' : '新增规格'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :step="1" />
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
        <el-form-item label="规格类型" prop="specTypeId">
          <el-select v-model="form.specTypeId" placeholder="请选择规格类型" style="width: 100%">
            <el-option v-for="t in specTypeOptions" :key="t.id" :label="t.displayName" :value="t.id" />
          </el-select>
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
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSpecTypePage } from '@/modules/admin/api/specType';
import { getSpecValuePage, addOrUpdateSpecValue, deleteSpecValue } from '@/modules/admin/api/spec';

type Spec = {
  id: number;
  sort: number;
  specTypeId: number;
  typeName?: string;
  createdAt: string;
  displayName: string;
  nameI18n?: Record<string, string>;
};

const initialMock: Spec[] = [];

const specTypeOptions = ref<{ id: number; displayName: string; nameI18n?: Record<string, string> }[]>([]);

const list = ref<Spec[]>([]);
const query = reactive({
  nameKeyword: '',
  specTypeId: null as number | null,
  pageNum: 1,
  pageSize: 10,
});

const displayList = computed(() => list.value.map((item) => ({
  ...item,
  typeName: specTypeOptions.value.find((t) => t.id === item.specTypeId)?.displayName || '-',
})));
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<Spec>({
  id: 0,
  sort: 0,
  specTypeId: 0,
  createdAt: '',
  displayName: '',
  nameI18n: {},
});
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
  specTypeId: [{ required: true, message: '请选择规格类型', trigger: 'change' }],
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchList();
};

const reset = () => {
  query.nameKeyword = '';
  query.specTypeId = null;
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
    sort: list.value.length + 1,
    enabled: true,
    specTypeId: specTypeOptions.value[0]?.id ?? 0,
    createdAt: new Date().toISOString(),
    displayName: '',
    nameI18n: {},
  });
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
  dialogVisible.value = true;
};

const openEdit = (row: Spec) => {
  isEdit.value = true;
  Object.assign(form, { ...row });
  nameI18nList.value = row.nameI18n && Object.keys(row.nameI18n).length
    ? Object.entries(row.nameI18n).map(([lang, value]) => ({ lang, value: value as string }))
    : [{ lang: 'zh-CN', value: row.displayName || '' }];
  dialogVisible.value = true;
};

const save = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid) => {
    if (!valid) return;
    submitLoading.value = true;
    const zhName = nameI18nList.value.find((i) => i.lang === 'zh-CN' || i.lang === 'zh')?.value || nameI18nList.value[0]?.value || '';
    const enName = nameI18nList.value.find((i) => i.lang === 'en')?.value || '';
    const payload = {
      id: form.id || undefined,
      specTypeId: form.specTypeId,
      specValue: zhName,
      specValueEn: enName,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
      sort: form.sort,
    };
    addOrUpdateSpecValue(payload)
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

const toggleStatus = (row: Spec) => {
};

const remove = (row: Spec) => {
  ElMessageBox.confirm(`确定删除规格「${row.displayName}」吗？`, '提示', { type: 'warning' })
    .then(() => deleteSpecValue({ id: row.id }))
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

const fetchSpecTypes = async () => {
  const res = await getSpecTypePage({ pageNum: 1, pageSize: 200 });
  const data = res?.data ?? res ?? {};
  const records = Array.isArray(data.list) ? data.list : [];
  specTypeOptions.value = records.map((item: any) => ({
    id: item.specType?.id ?? item.id,
    displayName:
      item.nameI18n?.['zh-CN'] ||
      item.nameI18n?.['zh'] ||
      item.specType?.nameI18n?.['zh-CN'] ||
      item.specType?.nameI18n?.['zh'] ||
      item.specType?.typeName ||
      item.name || '',
    nameI18n: item.nameI18n || item.specType?.nameI18n,
  }));
  if (!form.specTypeId && specTypeOptions.value.length) form.specTypeId = specTypeOptions.value[0].id;
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await getSpecValuePage({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      nameKeyword: query.nameKeyword?.trim() || undefined,
      specTypeId: query.specTypeId || undefined,
    });
    const data = res?.data ?? res ?? {};
    const records = Array.isArray(data.list) ? data.list : [];
    list.value = records.map((item: any) => ({
      id: item.specValue?.id ?? item.id,
      displayName:
        item.nameI18n?.['zh-CN'] ||
        item.specValue?.nameI18n?.['zh-CN'] ||
        item.specValue?.specValue ||
        item.name || '',
      nameI18n: item.nameI18n || item.specValue?.nameI18n,
      sort: item.specValue?.sort ?? item.sort ?? 0,
      specTypeId: item.specValue?.specTypeId ?? item.specTypeId ?? item.specTypeId ?? 0,
      createdAt: item.specValue?.createTime || item.createTime || item.createdAt || '',
    }));
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取规格失败');
  } finally {
    tableLoading.value = false;
  }
};

const addI18n = () => {
  nameI18nList.value.push({ lang: 'zh-CN', value: '' });
};

const removeI18n = (idx: number) => {
  if (nameI18nList.value.length === 1) return;
  nameI18nList.value.splice(idx, 1);
};

onMounted(() => {
  fetchSpecTypes();
  fetchList();
});
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
