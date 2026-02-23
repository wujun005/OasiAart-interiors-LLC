<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          placeholder="搜索用户名"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" @click="openCreate">新增用户</el-button>
      </div>

      <el-table
        :data="users"
        border
        stripe
        v-loading="tableLoading"
        row-key="id"
      >
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="name" label="用户名" width="160" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="创建时间" min-width="200">
          <template #default="{ row }">
            <div class="meta">
              <!-- <span>{{ row.creator || '-' }}</span> -->
              <span class="time">{{ formatDate(row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="200">
          <template #default="{ row }">
            <div class="meta">
              <!-- <span>{{ row.updater || '-' }}</span> -->
              <span class="time">{{ formatDate(row.updateTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              @click="openAssignPermission(row)"
            >
              分配权限
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
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="480px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        v-loading="detailLoading"
      >
        <el-form-item label="用户名" prop="name">
          <el-input v-model="form.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="permissionDialogVisible"
      :title="`分配权限 - ${permissionTargetUser?.name || ''}`"
      width="540px"
      destroy-on-close
      @closed="onPermissionDialogClosed"
    >
      <el-tree
        ref="permissionTreeRef"
        v-loading="permissionLoading"
        class="permission-tree"
        node-key="id"
        show-checkbox
        default-expand-all
        :data="permissionTreeData"
        :props="permissionTreeProps"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="permissionSaving"
          @click="saveUserPermissions"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules, TreeInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import apis, {
  assignUserRole,
  getAll,
  getUserRoles,
} from '@/modules/admin/api/user';

type User = {
  id: number;
  name: string;
  phone: string;
  email: string;
  password?: string;
  createTime?: string;
  creator?: string;
  updateTime?: string;
  updater?: string;
};

type MenuPermissionItem = {
  id: number | string;
  name?: string;
  path?: string;
  icon?: string | null;
  parentId?: number | string | null;
  sortOrder?: number;
  children?: MenuPermissionItem[] | null;
};

type MenuPermissionNode = {
  id: number | string;
  name: string;
  path?: string;
  icon?: string;
  parentId: number | string;
  sortOrder: number;
  children: MenuPermissionNode[];
};

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  nameKeyword: '',
});
const users = ref<User[]>([]);
const total = ref(0);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const detailLoading = ref(false);
const submitLoading = ref(false);
const form = reactive<{ id?: number; name: string; phone: string; email: string; password: string }>({
  id: undefined,
  name: '',
  phone: '',
  email: '',
  password: '',
});
const permissionDialogVisible = ref(false);
const permissionLoading = ref(false);
const permissionSaving = ref(false);
const permissionTargetUser = ref<User | null>(null);
const permissionTreeRef = ref<TreeInstance>();
const permissionTreeData = ref<MenuPermissionNode[]>([]);
const permissionTreeProps = {
  label: 'name',
  children: 'children',
};

const rules: FormRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '长度 2-30 个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入合法的手机号', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' },
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'));
          return;
        }
        if (value && value.length < 6) {
          callback(new Error('密码至少 6 位'));
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
  const h = `${d.getHours()}`.padStart(2, '0');
  const min = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
};

const resetForm = () => {
  form.id = undefined;
  form.name = '';
  form.phone = '';
  form.email = '';
  form.password = '';
  nextTick(() => formRef.value?.clearValidate());
};

const extractList = (payload: any): { list: User[]; total: number; pageNum: number; pageSize: number } => {
  const page = payload?.data ?? payload ?? {};
  const list = Array.isArray(page.list) ? (page.list as User[]) : [];
  const total = typeof page.total === 'number' ? page.total : list.length;
  const pageNum = typeof page.pageNum === 'number' ? page.pageNum : query.pageNum;
  const pageSize = typeof page.pageSize === 'number' ? page.pageSize : query.pageSize;
  return { list, total, pageNum, pageSize };
};

const extractMenuList = (payload: any): MenuPermissionItem[] => {
  if (Array.isArray(payload)) return payload as MenuPermissionItem[];
  if (Array.isArray(payload?.data)) return payload.data as MenuPermissionItem[];
  if (Array.isArray(payload?.list)) return payload.list as MenuPermissionItem[];
  if (Array.isArray(payload?.data?.list)) return payload.data.list as MenuPermissionItem[];
  return [];
};

const flattenMenuList = (
  list: MenuPermissionItem[],
  parentId?: number | string,
  target: Omit<MenuPermissionNode, 'children'>[] = [],
) => {
  list.forEach((item) => {
    if (item?.id === undefined || item?.id === null) return;
    const currentParentId =
      parentId !== undefined
        ? parentId
        : item.parentId === undefined || item.parentId === null
          ? 0
          : item.parentId;
    target.push({
      id: item.id,
      name: item.name?.trim() || `菜单-${item.id}`,
      path: item.path || '',
      icon: item.icon || '',
      parentId: currentParentId,
      sortOrder: Number(item.sortOrder || 0),
    });
    if (Array.isArray(item.children) && item.children.length) {
      flattenMenuList(item.children, item.id, target);
    }
  });
  return target;
};

const collectLeafMenuIds = (list: MenuPermissionItem[]) => {
  const flat = flattenMenuList(list);
  if (!flat.length) return [];
  const parentIdSet = new Set(
    flat
      .map((item) => String(item.parentId))
      .filter((parentId) => parentId !== '0' && parentId !== ''),
  );
  const leafIds = flat
    .filter((item) => !parentIdSet.has(String(item.id)))
    .map((item) => item.id);
  return leafIds.length ? leafIds : flat.map((item) => item.id);
};

const buildPermissionTree = (list: MenuPermissionItem[]): MenuPermissionNode[] => {
  const flat = flattenMenuList(list);
  const nodeMap = new Map<string, MenuPermissionNode>();
  flat.forEach((item) => {
    nodeMap.set(String(item.id), {
      ...item,
      children: [],
    });
  });
  const roots: MenuPermissionNode[] = [];
  nodeMap.forEach((node) => {
    const parentKey = String(node.parentId);
    const parent =
      parentKey && parentKey !== '0' ? nodeMap.get(parentKey) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes: MenuPermissionNode[]) => {
    nodes.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return String(a.id).localeCompare(String(b.id));
    });
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
};

const fetchUsers = async () => {
  tableLoading.value = true;
  try {
    const params = {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      name: query.nameKeyword?.trim() || undefined,
    };
    const res = await apis.getPage(params);
    const { list, total: t, pageNum, pageSize } = extractList(res);
    users.value = list;
    total.value = t;
    query.pageNum = pageNum;
    query.pageSize = pageSize;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户列表失败');
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  query.pageNum = 1;
  fetchUsers();
};

const reset = () => {
  query.nameKeyword = '';
  query.pageNum = 1;
  fetchUsers();
};

const onPageChange = (page: number) => {
  query.pageNum = page;
  fetchUsers();
};

const onSizeChange = (size: number) => {
  query.pageSize = size;
  query.pageNum = 1;
  fetchUsers();
};

const openCreate = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEdit = async (row: User) => {
  isEdit.value = true;
  resetForm();
  dialogVisible.value = true;
  form.id = row.id;
  form.name = row.name || '';
  form.phone = row.phone || '';
  form.email = row.email || '';
  detailLoading.value = true;
  try {
    const detailRes = await apis.getInfo(row.id);
    const detail = detailRes?.data ?? detailRes;
    if (detail) {
      form.id = detail.id ?? form.id;
      form.name = detail.name ?? form.name;
      form.phone = detail.phone ?? form.phone;
      form.email = detail.email ?? form.email;
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户信息失败');
  } finally {
    detailLoading.value = false;
  }
};

const openAssignPermission = async (row: User) => {
  permissionTargetUser.value = row;
  permissionDialogVisible.value = true;
  permissionLoading.value = true;
  try {
    const [allMenuRes, userRoleRes] = await Promise.all([
      getAll(),
      getUserRoles(row.id),
    ]);
    const allMenus = extractMenuList(allMenuRes);
    const userMenus = extractMenuList(userRoleRes);
    permissionTreeData.value = buildPermissionTree(
      allMenus.length ? allMenus : userMenus,
    );

    const checkedKeys = collectLeafMenuIds(userMenus);
    await nextTick();
    // 只回显 getUserRoles 返回的叶子权限，避免父节点联动勾选整组子菜单
    permissionTreeRef.value?.setCheckedKeys(checkedKeys, false);
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户菜单权限失败');
  } finally {
    permissionLoading.value = false;
  }
};

const saveUserPermissions = async () => {
  const userId = permissionTargetUser.value?.id;
  if (!userId) return;
  permissionSaving.value = true;
  try {
    const checked = permissionTreeRef.value?.getCheckedKeys(false) || [];
    const halfChecked = permissionTreeRef.value?.getHalfCheckedKeys() || [];
    const menuIds = Array.from(new Set([...checked, ...halfChecked])).map(
      (id) => {
        const numericId = Number(id);
        return Number.isNaN(numericId) ? id : numericId;
      },
    );
    await assignUserRole({
      adminUserId: userId,
      menuIds,
    });
    ElMessage.success('权限分配成功');
    permissionDialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error?.message || '权限分配失败');
  } finally {
    permissionSaving.value = false;
  }
};

const onPermissionDialogClosed = () => {
  permissionTargetUser.value = null;
  permissionTreeData.value = [];
  permissionTreeRef.value = undefined;
};

const save = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const payload: any = {
        id: form.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };
      if (!isEdit.value || form.password) {
        payload.password = form.password;
      }
      if (isEdit.value) {
        await apis.update(payload);
        ElMessage.success('更新成功');
      } else {
        await apis.add(payload);
        ElMessage.success('新增成功');
      }
      dialogVisible.value = false;
      fetchUsers();
    } catch (error: any) {
      ElMessage.error(error?.message || '保存失败');
    } finally {
      submitLoading.value = false;
    }
  });
};

const remove = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.name}」吗？`, '提示', {
      type: 'warning',
    });
    await apis.del(row.id);
    ElMessage.success('删除成功');
    fetchUsers();
  } catch (error: any) {
    // 用户取消时不提示错误
    if (error?.message) {
      ElMessage.error(error.message);
    }
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.page {
  padding: 20px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
.toolbar .el-input {
  max-width: 260px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.4;
}
.meta .time {
  color: #888;
  font-size: 12px;
}
.permission-tree {
  max-height: 420px;
  overflow: auto;
  padding: 6px 0;
}
</style>
