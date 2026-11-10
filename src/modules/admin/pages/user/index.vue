<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.nameKeyword"
          :placeholder="t('admin.user.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="query.phoneKeyword"
          :placeholder="t('admin.user.filters.phonePlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="query.emailKeyword"
          class="email-filter"
          :placeholder="t('admin.user.filters.emailPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.roleCode"
          clearable
          filterable
          :placeholder="t('admin.user.filters.rolePlaceholder')"
        >
          <el-option
            v-for="role in filterRoles"
            :key="role.id"
            :label="roleLabel(role)"
            :value="role.code"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">{{ t('admin.user.actions.search') }}</el-button>
        <el-button @click="reset">{{ t('admin.user.actions.reset') }}</el-button>
        <el-button v-if="accountKind === 'platform' && canAction('btn:/admin/users:create')" type="primary" @click="openCreate">{{ t('admin.user.actions.create') }}</el-button>
      </div>

      <el-table
        :data="users"
        border
        stripe
        v-loading="tableLoading"
        row-key="id"
      >
        <el-table-column prop="id" :label="t('admin.user.table.id')" width="72" />
        <el-table-column prop="name" :label="t('admin.user.table.name')" width="160" />
        <el-table-column prop="phone" :label="t('admin.user.table.phone')" width="140" />
        <el-table-column prop="email" :label="t('admin.user.table.email')" min-width="180" />
        <el-table-column :label="t('admin.user.table.roles')" width="128">
          <template #default="{ row }">
            <div v-if="row.roles?.length" class="role-tags">
              <el-tag v-for="role in row.roles" :key="role.id" effect="plain">{{ roleLabel(role) }}</el-tag>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.user.table.supplier')" min-width="180">
          <template #default="{ row }">
            <button
              v-if="row.supplierId"
              type="button"
              class="supplier-link"
              @click="openSupplier(row)"
            >
              <span>{{ supplierAccountName(row) }}</span>
              <span v-if="String(row.supplierName || '').trim() && row.supplierNo" class="time">{{ row.supplierNo }}</span>
            </button>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.user.table.createdAt')" width="148">
          <template #default="{ row }">
            <div class="meta">
              <!-- <span>{{ row.creator || '-' }}</span> -->
              <span class="time">{{ formatDate(row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.user.table.updatedAt')" width="148">
          <template #default="{ row }">
            <div class="meta">
              <span class="time">{{ formatDate(row.modifyTime || row.updateTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.user.table.actions')" width="340" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canAction('btn:/admin/users:edit')" link type="primary" size="small" @click="openEdit(row)">
              {{ t('admin.user.actions.edit') }}
            </el-button>
            <el-button v-if="canAction('btn:/admin/users:role')" link type="primary" size="small" @click="openAssignRole(row)">
              {{ t('admin.user.actions.assignRole') }}
            </el-button>
            <el-button v-if="canAction('btn:/admin/users:password')" link type="primary" size="small" @click="openPassword(row)">
              {{ t('admin.user.actions.changePassword') }}
            </el-button>
            <el-button
              v-if="canAction('btn:/admin/users:permission')"
              link
              type="warning"
              size="small"
              @click="openAssignPermission(row)"
            >
              {{ t('admin.user.actions.assignPermission') }}
            </el-button>
            <el-button v-if="canAction('btn:/admin/users:delete')" link type="danger" size="small" @click="remove(row)">
              {{ t('admin.user.actions.delete') }}
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
      :title="isEdit ? t('admin.user.dialog.editTitle') : t('admin.user.dialog.createTitle')"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        v-loading="detailLoading"
      >
        <el-form-item :label="t('admin.user.form.name')" prop="name">
          <el-input v-model="form.name" :placeholder="t('admin.user.form.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.user.form.phone')" prop="phone">
          <el-input v-model="form.phone" :placeholder="t('admin.user.form.phonePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.user.form.email')" prop="email">
          <el-input v-model="form.email" :placeholder="t('admin.user.form.emailPlaceholder')" />
        </el-form-item>
        <el-form-item v-if="!isEdit" :label="t('admin.user.form.password')" prop="password">
          <el-input
            v-model="form.password"
            :placeholder="t('admin.user.form.passwordPlaceholder')"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.user.actions.cancel') }}</el-button>
        <el-button v-if="canAction(isEdit ? 'btn:/admin/users:edit' : 'btn:/admin/users:create')" type="primary" :loading="submitLoading" @click="save">{{ t('admin.user.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="permissionDialogVisible"
      :title="t('admin.user.permission.title', { name: permissionTargetUser?.name || '' })"
      :close-on-click-modal="false"
      width="540px"
      destroy-on-close
      @closed="onPermissionDialogClosed"
    >
      <p class="permission-note">{{ t('admin.user.permission.hint') }}</p>
      <el-tree
        ref="permissionTreeRef"
        v-loading="permissionLoading"
        class="permission-tree"
        node-key="id"
        show-checkbox
        check-strictly
        default-expand-all
        :data="permissionTreeData"
        :props="permissionTreeProps"
        @check="onPermissionCheck"
      >
        <template #default="{ data }">
          <span class="permission-node">
            <span>{{ data.name }}</span>
            <em v-if="isButtonPermission(data)" class="permission-node__tag">{{ t('admin.user.permission.buttonTag') }}</em>
          </span>
        </template>
      </el-tree>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">{{ t('admin.user.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="permissionSaving"
          @click="saveUserPermissions"
        >
          {{ t('admin.user.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="roleDialogVisible"
      :title="t('admin.user.dialog.roleTitle', { name: roleTarget?.name || '' })"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form label-width="90px" v-loading="roleLoading">
        <el-form-item :label="t('admin.user.form.roles')">
          <el-select v-model="selectedRoleIds" multiple filterable style="width: 100%" :placeholder="t('admin.user.form.rolesPlaceholder')">
            <el-option v-for="role in assignableRoles" :key="role.id" :label="roleLabel(role)" :value="role.id" />
          </el-select>
        </el-form-item>
        <p v-if="keepsSupplierRole" class="role-note">{{ t('admin.user.form.supplierKept') }}</p>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">{{ t('admin.user.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="roleSaving" @click="saveRoles">{{ t('admin.user.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="passwordDialogVisible"
      :title="t('admin.user.dialog.passwordTitle', { name: passwordTarget?.name || '' })"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form label-width="90px">
        <el-form-item v-if="changingOwnPassword" :label="t('admin.user.form.oldPassword')">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password :placeholder="t('admin.user.form.oldPasswordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.user.form.newPassword')">
          <el-input v-model="passwordForm.newPassword" type="password" show-password :placeholder="t('admin.user.form.newPasswordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.user.form.confirmPassword')">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password :placeholder="t('admin.user.form.confirmPasswordPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">{{ t('admin.user.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="passwordSaving" @click="savePassword">{{ t('admin.user.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules, TreeInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import apis, {
  assignUserRole,
  getAdminUserRoleIds,
  getAll,
  getUserRoles,
  listEnabledRoles,
  updateAdminUserPassword,
  updateAdminUserRoles,
} from '@/modules/admin/api/user';
import { useAdminSessionStore } from '@/modules/admin/stores/session';
import { permissionKeysAfterToggle } from '@/modules/admin/utils/admin-button-permission';

type AccountRole = {
  id: number;
  code?: string;
  name?: string;
};

type User = {
  id: number;
  name: string;
  phone: string;
  email: string;
  password?: string;
  roles?: AccountRole[];
  supplierId?: number | null;
  supplierName?: string | null;
  supplierNo?: string | null;
  createTime?: string;
  creator?: string;
  modifyTime?: string;
  updateTime?: string;
  updater?: string;
};

const props = withDefaults(defineProps<{ accountKind?: 'platform' | 'supplier' }>(), {
  accountKind: 'platform',
});
const accountKind = computed(() => props.accountKind === 'supplier' ? 'supplier' : 'platform');
const PLATFORM_ROLE_CODES = new Set([
  'PLATFORM_CUSTOMER_SERVICE',
  'PLATFORM_OPERATIONS',
  'PLATFORM_FINANCE',
  'PLATFORM_BUSINESS_DEVELOPMENT',
]);
const SUPPLIER_ROLE_CODES = new Set(['SUPPLIER', 'SUPPLIER_STAFF']);

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
  phoneKeyword: '',
  emailKeyword: '',
  roleCode: '',
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
const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

const supplierAccountName = (row: User) => {
  const name = String(row.supplierName || '').trim();
  const no = String(row.supplierNo || '').trim();
  return name || no || String(row.supplierId);
};

const openSupplier = (row: User) => {
  if (!row.supplierId) return;
  void router.push({
    name: 'admin-basic-suppliers',
    query: { id: String(row.supplierId), tab: 'overview' },
  });
};
const currentUserId = ref(0);
const currentRoleCodes = ref<string[]>([]);
const enabledRoles = ref<AccountRole[]>([]);
const roleDialogVisible = ref(false);
const roleLoading = ref(false);
const roleSaving = ref(false);
const roleTarget = ref<User | null>(null);
const selectedRoleIds = ref<number[]>([]);
const passwordDialogVisible = ref(false);
const passwordSaving = ref(false);
const passwordTarget = ref<User | null>(null);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const unwrap = (payload: any) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload);
const isSuperAdmin = computed(() => currentRoleCodes.value.includes('SUPER_ADMIN'));
const roleInAccount = (code?: string) => {
  if (!code) return false;
  return accountKind.value === 'supplier'
    ? SUPPLIER_ROLE_CODES.has(code)
    : code === 'SUPER_ADMIN' || PLATFORM_ROLE_CODES.has(code);
};
const assignableRoles = computed(() => {
  const roles = enabledRoles.value.filter((role) => roleInAccount(role.code));
  if (accountKind.value === 'supplier') return isSuperAdmin.value ? roles : [];
  return isSuperAdmin.value
    ? roles
    : roles.filter((role) => role.code && PLATFORM_ROLE_CODES.has(role.code));
});
const filterRoles = computed(() => enabledRoles.value.filter((role) => roleInAccount(role.code)));
const keepsSupplierRole = computed(() => (
  accountKind.value === 'platform'
  && (roleTarget.value?.roles || []).some((role) => role.code && SUPPLIER_ROLE_CODES.has(role.code))
));
const changingOwnPassword = computed(() => Number(passwordTarget.value?.id) === currentUserId.value);
const roleLabel = (role: AccountRole) => {
  const key = role.code ? `admin.user.roles.${role.code}` : '';
  const text = key ? t(key) : '';
  return text && text !== key ? text : (role.name || role.code || '');
};

const rules: FormRules = {
  name: [
    { required: true, message: t('admin.user.validation.nameRequired'), trigger: 'blur' },
    { min: 2, max: 30, message: t('admin.user.validation.nameLength'), trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('admin.user.validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('admin.user.validation.emailInvalid'), trigger: 'blur' },
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error(t('admin.user.validation.passwordRequired')));
          return;
        }
        if (value && value.length < 6) {
          callback(new Error(t('admin.user.validation.passwordMin')));
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
      name: item.name?.trim() || t('admin.user.permission.menuFallback', { id: item.id }),
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

const isButtonPermission = (item: { path?: string }) =>
  String(item?.path || '').trim().startsWith('btn:');

const syncingPermissionTree = ref(false);
const onPermissionCheck = (
  data: MenuPermissionNode,
  state: { checkedKeys?: Array<string | number> },
) => {
  if (syncingPermissionTree.value) return;
  const next = permissionKeysAfterToggle(
    permissionTreeData.value,
    state.checkedKeys || [],
    data.id,
  );
  const current = new Set((state.checkedKeys || []).map((id) => String(id)));
  if (next.length === current.size && next.every((id) => current.has(id))) return;
  syncingPermissionTree.value = true;
  permissionTreeRef.value?.setCheckedKeys(next, false);
  nextTick(() => {
    syncingPermissionTree.value = false;
  });
};

const includePermissionAncestors = (
  nodes: MenuPermissionNode[],
  selected: Set<string>,
) => {
  nodes.forEach((node) => {
    includePermissionAncestors(node.children || [], selected);
    if (node.children?.some((child) => selected.has(String(child.id)))) {
      selected.add(String(node.id));
    }
  });
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
      phoneKeyword: query.phoneKeyword?.trim() || undefined,
      emailKeyword: query.emailKeyword?.trim() || undefined,
      roleCode: query.roleCode || undefined,
      accountKind: accountKind.value,
    };
    const res = await apis.getPage(params);
    const { list, total: t, pageNum, pageSize } = extractList(res);
    users.value = list;
    total.value = t;
    query.pageNum = pageNum;
    query.pageSize = pageSize;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.user.message.fetchFailed'));
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
  query.phoneKeyword = '';
  query.emailKeyword = '';
  query.roleCode = '';
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
    ElMessage.error(error?.message || t('admin.user.message.detailFailed'));
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

    const checkedKeys = flattenMenuList(userMenus).map((item) => item.id);
    await nextTick();
    permissionTreeRef.value?.setCheckedKeys(checkedKeys, false);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.user.message.permissionFetchFailed'));
  } finally {
    permissionLoading.value = false;
  }
};

const saveUserPermissions = async () => {
  const userId = permissionTargetUser.value?.id;
  if (!userId) return;
  permissionSaving.value = true;
  try {
    const checked = new Set(
      (permissionTreeRef.value?.getCheckedKeys(false) || []).map((id) => String(id)),
    );
    (permissionTreeRef.value?.getHalfCheckedKeys() || []).forEach((id) => {
      checked.add(String(id));
    });
    includePermissionAncestors(permissionTreeData.value, checked);
    const menuIds = Array.from(checked).map(
      (id) => {
        const numericId = Number(id);
        return Number.isNaN(numericId) ? id : numericId;
      },
    );
    await assignUserRole({
      adminUserId: userId,
      menuIds,
    });
    ElMessage.success(t('admin.user.message.permissionSaveSuccess'));
    permissionDialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.user.message.permissionSaveFailed'));
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
        ElMessage.success(t('admin.user.message.updateSuccess'));
      } else {
        await apis.add(payload);
        ElMessage.success(t('admin.user.message.createSuccess'));
      }
      dialogVisible.value = false;
      fetchUsers();
    } catch (error: any) {
      ElMessage.error(error?.message || t('admin.user.message.saveFailed'));
    } finally {
      submitLoading.value = false;
    }
  });
};

const remove = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      t('admin.user.message.deleteConfirm', { name: row.name }),
      t('admin.common.confirmTitle'),
      {
      type: 'warning',
      },
    );
    await apis.del(row.id);
    ElMessage.success(t('admin.user.message.deleteSuccess'));
    fetchUsers();
  } catch (error: any) {
    // 用户取消时不提示错误
    if (error?.message) {
      ElMessage.error(error.message);
    }
  }
};

const loadRoleContext = async () => {
  try {
    const me = await useAdminSessionStore().currentUser();
    currentUserId.value = Number(me?.id || 0);
    const [roleRes, mineRes] = await Promise.all([
      listEnabledRoles(),
      currentUserId.value ? getAdminUserRoleIds(currentUserId.value) : Promise.resolve([]),
    ]);
    const roles = unwrap(roleRes);
    enabledRoles.value = (Array.isArray(roles) ? roles : []).map((role: AccountRole) => ({
      id: Number(role.id),
      code: role.code,
      name: role.name,
    }));
    const mine = unwrap(mineRes);
    const mineIds = new Set((Array.isArray(mine) ? mine : []).map((id: number) => Number(id)));
    currentRoleCodes.value = enabledRoles.value
      .filter((role) => mineIds.has(role.id) && role.code)
      .map((role) => role.code as string);
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.user.message.roleFetchFailed'));
  }
};

const openAssignRole = async (row: User) => {
  roleTarget.value = row;
  roleDialogVisible.value = true;
  roleLoading.value = true;
  try {
    if (!enabledRoles.value.length || !currentUserId.value) await loadRoleContext();
    const allowed = new Set(assignableRoles.value.map((role) => role.id));
    selectedRoleIds.value = (row.roles || []).map((role) => Number(role.id)).filter((id) => allowed.has(id));
  } finally {
    roleLoading.value = false;
  }
};

const saveRoles = async () => {
  const userId = roleTarget.value?.id;
  if (!userId) return;
  const preserved = (roleTarget.value?.roles || [])
    .filter((role) => role.code && role.id != null && !roleInAccount(role.code))
    .map((role) => Number(role.id));
  const roleIds = Array.from(new Set([...selectedRoleIds.value, ...preserved]));
  if (!roleIds.length) {
    ElMessage.warning(t('admin.user.validation.rolesRequired'));
    return;
  }
  roleSaving.value = true;
  try {
    await updateAdminUserRoles({ userId, roleIds });
    ElMessage.success(t('admin.user.message.roleSaveSuccess'));
    roleDialogVisible.value = false;
    fetchUsers();
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.user.message.roleSaveFailed'));
  } finally {
    roleSaving.value = false;
  }
};

const openPassword = (row: User) => {
  passwordTarget.value = row;
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  passwordDialogVisible.value = true;
};

const savePassword = async () => {
  const userId = passwordTarget.value?.id;
  if (!userId) return;
  if (changingOwnPassword.value && !passwordForm.oldPassword.trim()) {
    ElMessage.warning(t('admin.user.validation.oldPasswordRequired'));
    return;
  }
  if (passwordForm.newPassword.trim().length < 6) {
    ElMessage.warning(t('admin.user.validation.passwordMin'));
    return;
  }
  if (!passwordForm.confirmPassword) {
    ElMessage.warning(t('admin.user.validation.confirmPasswordRequired'));
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning(t('admin.user.validation.passwordMismatch'));
    return;
  }
  passwordSaving.value = true;
  try {
    await updateAdminUserPassword({
      userId,
      newPassword: passwordForm.newPassword.trim(),
      ...(changingOwnPassword.value ? { oldPassword: passwordForm.oldPassword } : {}),
    });
    ElMessage.success(t('admin.user.message.passwordSaveSuccess'));
    passwordDialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.user.message.passwordSaveFailed'));
  } finally {
    passwordSaving.value = false;
  }
};

watch(accountKind, () => {
  query.roleCode = '';
  query.pageNum = 1;
  fetchUsers();
});

onMounted(() => {
  fetchUsers();
  loadRoleContext();
});
</script>

<style scoped>
.page {
  padding: 20px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
.toolbar .el-input,
.toolbar .el-select {
  width: 180px;
}
.toolbar .email-filter {
  width: 220px;
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
.permission-note {
  margin: 0 0 10px;
  color: #7a7166;
  font-size: 12px;
  line-height: 1.5;
}
.permission-tree {
  max-height: 420px;
  overflow: auto;
  padding: 6px 0;
}
.permission-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.permission-node__tag {
  padding: 0 5px;
  border-radius: 999px;
  background: #f3efe7;
  color: #7a6240;
  font-size: 11px;
  font-style: normal;
  line-height: 16px;
}
.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.role-tags :deep(.el-tag) {
  height: auto;
  max-width: 100%;
  white-space: normal;
  line-height: 1.35;
}
.supplier-link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--el-color-primary);
  cursor: pointer;
  font: inherit;
  line-height: 1.4;
  text-align: left;
}
.supplier-link:hover {
  text-decoration: underline;
}
.role-note {
  margin: 0 0 0 90px;
  color: #7a7166;
  font-size: 12px;
  line-height: 1.45;
}
</style>
