<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input v-model="query.nameKeyword" placeholder="搜索分类名称" clearable @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增附加项分类</el-button>
      </div>

      <el-table :data="displayList" border stripe row-key="id" v-loading="tableLoading">
        <el-table-column label="名称" min-width="160">
          <template #default="{ row }">{{ row.displayName }}</template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑附加项分类' : '新增附加项分类'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPage, addOrUpdate, deleteAttachType } from '../../api/addonType';

type AddonCategory = {
  id: number;
  displayName: string;
  nameI18n?: Record<string, string>;
  updatedAt: string;
};

const list = ref<AddonCategory[]>([]);
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
  nameI18nList.value = [{ lang: 'zh-CN', value: '' }];
  dialogVisible.value = true;
};

const openEdit = (row: AddonCategory) => {
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
    const payload = {
      id: form.id || undefined,
      nameI18n: nameI18nList.value.reduce<Record<string, string>>((acc, cur) => {
        if (cur.lang && cur.value) acc[cur.lang] = cur.value;
        return acc;
      }, {}),
    };
    addOrUpdate(payload)
      .then(() => {
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        fetchList();
      })
      .catch((err: any) => ElMessage.error(err?.message || '保存失败'));
  });
};

const remove = (row: AddonCategory) => {
  ElMessageBox.confirm(`确定删除「${row.displayName}」吗？`, '提示', { type: 'warning' })
    .then(() => deleteAttachType({ id: row.id }))
    .then(() => {
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
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
        displayName: item.nameI18n?.['zh-CN'] || item.nameI18n?.['zh'] || attach.typeName || item.name || '',
        nameI18n: item.nameI18n,
        updatedAt: attach.modifyTime || item.updatedAt || item.modifyTime || attach.createTime || '',
      } as AddonCategory;
    });
    total.value = data.total ?? records.length;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取分类失败');
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
}
</style>
