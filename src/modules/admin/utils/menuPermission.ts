import { reactive } from 'vue';
import {
  getAdminUserRoleIds,
  getCurrentUserRoles,
  listEnabledRoles,
} from '@/modules/admin/api/user';
import { getAdminAuthStorageValue } from '@/utils/auth-state';
import { useAdminSessionStore } from '@/modules/admin/stores/session';
import { ADMIN_NO_ACCESS_PATH, pickAdminEntryPath } from '@/modules/admin/utils/adminEntry';

export type AdminMenuPermissionItem = {
  id: number | string;
  name: string;
  path: string;
  icon?: string;
  parentId: number | string;
  sortOrder: number;
  children: AdminMenuPermissionItem[];
};

type RawMenuItem = {
  id?: number | string;
  name?: string;
  path?: string;
  icon?: string;
  parentId?: number | string;
  sortOrder?: number;
  children?: RawMenuItem[] | null;
};

type FlatRawMenuItem = {
  id: number | string;
  name?: string;
  path?: string;
  icon?: string;
  parentId: number | string;
  sortOrder?: number;
};

type AdminMenuPermissionState = {
  loaded: boolean;
  lastToken: string;
  menus: AdminMenuPermissionItem[];
  flatMenus: AdminMenuPermissionItem[];
  allowedPaths: string[];
  firstPath: string;
};

const ROOT_PATH = '/admin';
const LOGIN_PATH = '/admin/login';
const SUPPLIER_PATH = '/admin/supplier-management';
const SUPPLIER_COVERAGE_PATH = `${SUPPLIER_PATH}/coverage-availability`;
const FIXED_OVERVIEW_MENU_ID = 'fixed-overview';
const FIXED_DEVELOPER_MENU_ID = 'fixed-developer-tools';
const FIXED_WHITELIST_MENU_ID = 'fixed-supplier-registration-whitelist';
const DEVELOPER_PATH = '/admin/developer';
const WHITELIST_PATH = '/admin/developer/supplier-registration-whitelist';
const PACKAGE_PATH = '/admin/package';
const PACKAGE_CATEGORY_PATH = '/admin/package/categories';
const PACKAGE_SERVICE_SUBCATEGORY_PATH = '/admin/package/service-subcategories';
const PACKAGE_SPEC_TYPE_PATH = '/admin/package/spec-types';
const PACKAGE_SPEC_PATH = '/admin/package/specs';
const PACKAGE_SERVICE_PATH = '/admin/package/services';
const PACKAGE_LIST_PATH = '/admin/package/packages';
const ANALYTICS_PATH = '/admin/analytics';
const FIXED_PACKAGE_MENU_ID = 'fixed-packages';
const FIXED_PACKAGE_CATEGORY_MENU_ID = 'fixed-package-categories';
const FIXED_PACKAGE_SERVICE_SUBCATEGORY_MENU_ID = 'fixed-package-service-subcategories';
const FIXED_PACKAGE_SPEC_TYPE_MENU_ID = 'fixed-package-spec-types';
const FIXED_PACKAGE_SPEC_MENU_ID = 'fixed-package-specs';
const FIXED_PACKAGE_SERVICE_MENU_ID = 'fixed-package-services';
const FIXED_PACKAGE_LIST_MENU_ID = 'fixed-package-list';
const MENU_PATH_ALIASES: Record<string, string> = {
  '/admin/supplier': '/admin/supplier-management',
  '/admin/supplier/profile': '/admin/supplier-management/profile',
  '/admin/supplier/overview': '/admin/supplier-management/overview',
  '/admin/supplier/service-area': SUPPLIER_COVERAGE_PATH,
  '/admin/supplier/availability': SUPPLIER_COVERAGE_PATH,
  '/admin/supplier/coverage-availability': SUPPLIER_COVERAGE_PATH,
  '/admin/supplier-management/service-area': SUPPLIER_COVERAGE_PATH,
  '/admin/supplier-management/availability': SUPPLIER_COVERAGE_PATH,
  '/admin/supplier/orders': '/admin/supplier-management/orders',
  '/admin/supplier/services': '/admin/supplier-management/pricing',
  '/admin/supplier-management/services': '/admin/supplier-management/pricing',
  '/admin/suppliers': '/admin/basic/suppliers',
};

export const adminMenuState = reactive<AdminMenuPermissionState>({
  loaded: false,
  lastToken: '',
  menus: [],
  flatMenus: [],
  allowedPaths: [],
  firstPath: ROOT_PATH,
});

let pendingLoad: Promise<void> | null = null;
let loadVersion = 0;

const normalizePath = (rawPath?: unknown): string => {
  if (typeof rawPath !== 'string') return '';
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed === '#') return '';
  if (/^https?:\/\//i.test(trimmed)) return '';
  const withoutQuery = trimmed.split('?')[0].split('#')[0].trim();
  if (!withoutQuery) return '';

  let path = withoutQuery;
  if (path === '/') {
    path = ROOT_PATH;
  } else if (path.startsWith('/api')) {
    return '';
  } else if (!path.startsWith('/')) {
    path = path.startsWith('admin/') ? `/${path}` : `${ROOT_PATH}/${path}`;
  } else if (!path.startsWith(ROOT_PATH)) {
    path = `${ROOT_PATH}${path}`;
  }
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return MENU_PATH_ALIASES[path] || path;
};

const parseMenuList = (res: any): RawMenuItem[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.list)) return res.list;
  if (Array.isArray(res?.data?.list)) return res.data.list;
  return [];
};

const flattenRawMenus = (
  list: RawMenuItem[],
  parentId?: number | string,
  target: FlatRawMenuItem[] = [],
) => {
  list.forEach((item) => {
    if (item?.id === undefined || item?.id === null) return;
    const currentParent =
      parentId !== undefined
        ? parentId
        : item.parentId === undefined || item.parentId === null
          ? 0
          : item.parentId;
    target.push({
      id: item.id,
      name: item.name,
      path: item.path,
      icon: item.icon ?? undefined,
      parentId: currentParent,
      sortOrder: item.sortOrder,
    });
    if (Array.isArray(item.children) && item.children.length) {
      flattenRawMenus(item.children, item.id, target);
    }
  });
  return target;
};

const sortMenus = (list: AdminMenuPermissionItem[]) => {
  list.sort((a, b) => {
    const orderA = Number(a.sortOrder || 0);
    const orderB = Number(b.sortOrder || 0);
    if (orderA !== orderB) return orderA - orderB;
    return String(a.id).localeCompare(String(b.id));
  });
  list.forEach((item) => sortMenus(item.children));
};

const flattenMenus = (
  list: AdminMenuPermissionItem[],
  target: AdminMenuPermissionItem[] = [],
) => {
  list.forEach((item) => {
    target.push(item);
    if (item.children.length) {
      flattenMenus(item.children, target);
    }
  });
  return target;
};

const findFirstPath = (list: AdminMenuPermissionItem[]): string => {
  for (const item of list) {
    const childPath = findFirstPath(item.children);
    if (childPath) return childPath;
    if (item.path && item.path !== LOGIN_PATH) return item.path;
  }
  return '';
};

const pruneMenus = (
  list: AdminMenuPermissionItem[],
): AdminMenuPermissionItem[] =>
  list
    .map((item) => ({
      ...item,
      children: pruneMenus(item.children),
    }))
    .filter((item) => {
      if (item.children.length > 0) return true;
      return !!item.path && item.path.startsWith(ROOT_PATH) && item.path !== LOGIN_PATH;
    });

const unwrap = (payload: any) => (
  payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
);

const currentUserRoleCodes = async () => {
  const me = await useAdminSessionStore().currentUser();
  const userId = Number(me?.id || 0);
  if (!userId) return [] as string[];
  const [roleRes, mineRes] = await Promise.all([
    listEnabledRoles(),
    getAdminUserRoleIds(userId),
  ]);
  const roles = unwrap(roleRes);
  const mine = unwrap(mineRes);
  const mineIds = new Set((Array.isArray(mine) ? mine : []).map((id: number) => Number(id)));
  return (Array.isArray(roles) ? roles : [])
    .filter((role: { id?: number; code?: string }) => mineIds.has(Number(role.id)))
    .map((role: { code?: string }) => String(role.code || ''))
    .filter(Boolean);
};

const hasOverviewLeaf = (nodes: AdminMenuPermissionItem[]): boolean =>
  nodes.some((node) => (
    (node.path === ROOT_PATH && node.children.length === 0) || hasOverviewLeaf(node.children)
  ));

const hasMenuPath = (nodes: AdminMenuPermissionItem[], path: string): boolean =>
  nodes.some((node) => node.path === path || hasMenuPath(node.children, path));

const releaseOverviewPathFromGroups = (nodes: AdminMenuPermissionItem[]) => {
  nodes.forEach((node) => {
    if (node.path === ROOT_PATH && node.children.length > 0) {
      node.path = '';
    }
    releaseOverviewPathFromGroups(node.children);
  });
};

const collectPaths = (nodes: AdminMenuPermissionItem[], target: string[] = []) => {
  nodes.forEach((node) => {
    if (node.path) target.push(node.path);
    if (node.children.length) collectPaths(node.children, target);
  });
  return target;
};

const findMenuByPath = (
  nodes: AdminMenuPermissionItem[],
  path: string,
): AdminMenuPermissionItem | undefined => {
  for (const node of nodes) {
    if (node.path === path) return node;
    const found = findMenuByPath(node.children, path);
    if (found) return found;
  }
  return undefined;
};

const supplierPortalOrder = [
  `${SUPPLIER_PATH}/overview`,
  `${SUPPLIER_PATH}/profile`,
  `${SUPPLIER_PATH}/coverage-availability`,
  `${SUPPLIER_PATH}/service-area`,
  `${SUPPLIER_PATH}/availability`,
  `${SUPPLIER_PATH}/pricing`,
  `${SUPPLIER_PATH}/orders`,
  `${SUPPLIER_PATH}/staff`,
  `${SUPPLIER_PATH}/schedule`,
  `${SUPPLIER_PATH}/settlement`,
];

const pinSupplierStaffMenu = (roots: AdminMenuPermissionItem[]) => {
  const staffPath = `${SUPPLIER_PATH}/staff`;
  if (hasMenuPath(roots, staffPath)) return;
  const parent = findMenuByPath(roots, SUPPLIER_PATH);
  if (!parent) return;
  parent.children.push({
    id: 'supplier-staff',
    name: '员工管理',
    path: staffPath,
    icon: 'userfilled',
    parentId: parent.id,
    sortOrder: 80,
    children: [],
  });
};

const orderSupplierPortalMenus = (roots: AdminMenuPermissionItem[]) => {
  const parent = findMenuByPath(roots, SUPPLIER_PATH);
  if (!parent) return;
  parent.children.forEach((child) => {
    const index = supplierPortalOrder.indexOf(child.path);
    if (index >= 0) child.sortOrder = (index + 1) * 10;
  });
};

const pinPackageMenu = (roots: AdminMenuPermissionItem[]) => {
  const paths = collectPaths(roots);
  if (!paths.length) return;
  const supplierOnly = paths.every((path) => path.startsWith('/admin/supplier-management'));
  if (supplierOnly) return;
  let parent = findMenuByPath(roots, PACKAGE_PATH);
  if (!parent) {
    parent = {
      id: FIXED_PACKAGE_MENU_ID,
      name: '套餐管理',
      path: PACKAGE_PATH,
      icon: 'present',
      parentId: 0,
      sortOrder: 0,
      children: [],
    };
    const productIndex = roots.findIndex((node) => node.path === '/admin/products');
    if (productIndex >= 0) roots.splice(productIndex + 1, 0, parent);
    else roots.push(parent);
  }

  const defaults = [
    { id: FIXED_PACKAGE_CATEGORY_MENU_ID, name: '套餐分类', path: PACKAGE_CATEGORY_PATH, icon: 'collection' },
    { id: FIXED_PACKAGE_SERVICE_SUBCATEGORY_MENU_ID, name: '套餐服务子类', path: PACKAGE_SERVICE_SUBCATEGORY_PATH, icon: 'folder-opened' },
    { id: FIXED_PACKAGE_SPEC_TYPE_MENU_ID, name: '套餐计价方式类型', path: PACKAGE_SPEC_TYPE_PATH, icon: 'ticket' },
    { id: FIXED_PACKAGE_SPEC_MENU_ID, name: '套餐计价方式', path: PACKAGE_SPEC_PATH, icon: 'tickets' },
    { id: FIXED_PACKAGE_SERVICE_MENU_ID, name: '套餐服务管理', path: PACKAGE_SERVICE_PATH, icon: 'goods' },
    { id: FIXED_PACKAGE_LIST_MENU_ID, name: '套餐列表', path: PACKAGE_LIST_PATH, icon: 'tickets' },
  ];
  const existing = new Map(defaults.map((item) => [item.path, findMenuByPath(roots, item.path)]));
  const childPaths = new Set(defaults.map((item) => item.path));
  // Reuse server menu IDs even when an older menu response puts pages at the root.
  // Remove duplicate destinations before attaching them to the package group.
  const detachPackageChildren = (nodes: AdminMenuPermissionItem[]) => {
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index]!;
      detachPackageChildren(node.children);
      if (childPaths.has(node.path)) nodes.splice(index, 1);
    }
  };
  detachPackageChildren(roots);
  const packageParent = parent;
  defaults.forEach((item, index) => {
    const child = existing.get(item.path) || { ...item, children: [] };
    packageParent.children.push({
      ...child,
      parentId: packageParent.id,
      sortOrder: index + 1,
    });
  });
  sortMenus(parent.children);
};

const pinUsageAnalytics = (roots: AdminMenuPermissionItem[]) => {
  const paths = collectPaths(roots);
  if (!paths.length) return;
  if (paths.every((path) => path.startsWith('/admin/supplier-management'))) return;
  if (hasMenuPath(roots, ANALYTICS_PATH)) return;
  const item: AdminMenuPermissionItem = {
    id: 'fixed-usage-analytics',
    name: '数据分析',
    path: ANALYTICS_PATH,
    icon: 'data-analysis',
    parentId: 0,
    sortOrder: 1,
    children: [],
  };
  const packageIndex = roots.findIndex((node) => node.path === PACKAGE_PATH);
  if (packageIndex >= 0) roots.splice(packageIndex + 1, 0, item);
  else roots.push(item);
};

const pinSuperAdminOverview = (roots: AdminMenuPermissionItem[]) => {
  releaseOverviewPathFromGroups(roots);
  if (!hasOverviewLeaf(roots)) {
    roots.push({
      id: FIXED_OVERVIEW_MENU_ID,
      name: '概览',
      path: ROOT_PATH,
      icon: 'house',
      parentId: 0,
      sortOrder: -1,
      children: [],
    });
  }
  if (!hasMenuPath(roots, WHITELIST_PATH)) {
    roots.push({
      id: FIXED_DEVELOPER_MENU_ID,
      name: '开发工具',
      path: DEVELOPER_PATH,
      icon: 'setting',
      parentId: 0,
      sortOrder: 90,
      children: [{
        id: FIXED_WHITELIST_MENU_ID,
        name: '供应商注册白名单',
        path: WHITELIST_PATH,
        icon: 'setting',
        parentId: FIXED_DEVELOPER_MENU_ID,
        sortOrder: 1,
        children: [],
      }],
    });
  }
};

const hydrateMenuState = (list: RawMenuItem[], pinOverview = false, pinStaff = false) => {
  const rawFlatItems = flattenRawMenus(list);
  const nodeMap = new Map<string, AdminMenuPermissionItem>();

  rawFlatItems.forEach((item) => {
    const key = String(item.id);
    const normalizedPath = normalizePath(item.path);
    const normalizedParentId =
      item.parentId === undefined || item.parentId === null ? 0 : item.parentId;
    const existing = nodeMap.get(key);
    if (existing) {
      if (!existing.path && normalizedPath) {
        existing.path = normalizedPath;
      }
      if (!existing.name && item.name) {
        existing.name = item.name.trim();
      }
      if (!existing.icon && item.icon) {
        existing.icon = item.icon?.trim() || '';
      }
      return;
    }
    nodeMap.set(key, {
      id: item.id,
      name: item.name?.trim() || '',
      path: normalizedPath,
      icon: item.icon?.trim() || '',
      parentId: normalizedParentId,
      sortOrder: Number(item.sortOrder || 0),
      children: [],
    });
  });

  // Old coverage and availability grants now describe the same destination.
  // Retain one menu for each supplier path and reparent any existing children;
  // this only combines permissions that were present in the server response.
  const supplierMenuByPath = new Map<string, AdminMenuPermissionItem>();
  const duplicateMenuIds = new Map<string, string>();
  nodeMap.forEach((node, key) => {
    if (node.path !== SUPPLIER_PATH && !node.path.startsWith(`${SUPPLIER_PATH}/`)) return;
    const existing = supplierMenuByPath.get(node.path);
    if (!existing) {
      supplierMenuByPath.set(node.path, node);
      return;
    }
    duplicateMenuIds.set(key, String(existing.id));
    nodeMap.delete(key);
  });

  const roots: AdminMenuPermissionItem[] = [];
  nodeMap.forEach((node) => {
    const originalParentKey = String(node.parentId);
    const parentKey = duplicateMenuIds.get(originalParentKey) || originalParentKey;
    const parent =
      parentKey && parentKey !== '0' ? nodeMap.get(parentKey) : undefined;
    if (parent && parent !== node) {
      node.parentId = parent.id;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  if (pinOverview) {
    pinSuperAdminOverview(roots);
  }
  const prunedRoots = pruneMenus(roots);
  sortMenus(prunedRoots);
  pinPackageMenu(prunedRoots);
  pinUsageAnalytics(prunedRoots);
  if (pinStaff) {
    pinSupplierStaffMenu(prunedRoots);
    orderSupplierPortalMenus(prunedRoots);
    sortMenus(prunedRoots);
  }

  const flat = flattenMenus(prunedRoots, []);
  const allowedPaths = Array.from(
    new Set(
      flat
        .map((item) => item.path)
        .filter(
          (path) =>
            !!path && path !== LOGIN_PATH && path.startsWith(ROOT_PATH),
        ),
    ),
  );

  adminMenuState.menus = prunedRoots;
  adminMenuState.flatMenus = flat;
  adminMenuState.allowedPaths = allowedPaths;
  adminMenuState.firstPath = findFirstPath(prunedRoots) || ROOT_PATH;
};

export const resetAdminMenuPermissions = () => {
  loadVersion += 1;
  pendingLoad = null;
  adminMenuState.loaded = false;
  adminMenuState.lastToken = '';
  adminMenuState.menus = [];
  adminMenuState.flatMenus = [];
  adminMenuState.allowedPaths = [];
  adminMenuState.firstPath = ROOT_PATH;
};

export const loadAdminMenuPermissions = async (force = false) => {
  const token = getAdminAuthStorageValue('token');
  if (!token) {
    resetAdminMenuPermissions();
    const isSupplierDemoPreview =
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('preview') === 'supplier';
    if (isSupplierDemoPreview) {
      hydrateMenuState([]);
    }
    adminMenuState.loaded = true;
    return adminMenuState;
  }

  if (
    !force &&
    adminMenuState.loaded &&
    adminMenuState.lastToken &&
    adminMenuState.lastToken === token
  ) {
    return adminMenuState;
  }

  if (pendingLoad && !force) {
    await pendingLoad;
    return adminMenuState;
  }

  const version = loadVersion + 1;
  loadVersion = version;
  const task = (async () => {
    const res = await getCurrentUserRoles();
    if (version !== loadVersion) return;
    let roleCodes: string[] = [];
    try {
      roleCodes = await currentUserRoleCodes();
    } catch (error) {
      console.error('Failed to resolve the current account roles for the menu:', error);
    }
    if (version !== loadVersion) return;
    hydrateMenuState(
      parseMenuList(res),
      roleCodes.includes('SUPER_ADMIN'),
      roleCodes.includes('SUPPLIER'),
    );
    adminMenuState.lastToken = token;
    adminMenuState.loaded = true;
  })()
    .catch((error) => {
      if (version !== loadVersion) return;
      adminMenuState.loaded = false;
      adminMenuState.lastToken = '';
      adminMenuState.menus = [];
      adminMenuState.flatMenus = [];
      adminMenuState.allowedPaths = [];
      adminMenuState.firstPath = ROOT_PATH;
      throw error;
    })
    .finally(() => {
      if (pendingLoad === task) pendingLoad = null;
    });

  pendingLoad = task;
  await pendingLoad;
  return adminMenuState;
};

const SUPPLIER_OWNER_PATHS = [
  `${SUPPLIER_PATH}/overview`,
  `${SUPPLIER_PATH}/profile`,
  `${SUPPLIER_PATH}/pricing`,
  `${SUPPLIER_PATH}/staff`,
  SUPPLIER_COVERAGE_PATH,
];

export { ADMIN_NO_ACCESS_PATH };

export const getFirstAllowedAdminPath = () =>
  pickAdminEntryPath(adminMenuState.allowedPaths, adminMenuState.firstPath);

/** 纯员工子账号只有工作台父菜单和订单，没有资料、报价、区域或平台菜单。 */
export const isSupplierStaffOrdersOnly = () => {
  const allowed = adminMenuState.allowedPaths;
  const inSupplier = allowed.some(
    (path) => path === SUPPLIER_PATH || path.startsWith(`${SUPPLIER_PATH}/`),
  );
  if (!inSupplier) return false;
  if (SUPPLIER_OWNER_PATHS.some((path) => allowed.includes(path))) return false;
  return allowed.every(
    (path) => path === ROOT_PATH || path === SUPPLIER_PATH || path.startsWith(`${SUPPLIER_PATH}/`),
  );
};

export const resolveAllowedAdminPath = (path: string) => {
  const normalized = normalizePath(path);
  if (!normalized) return '';
  if (normalized === LOGIN_PATH) return LOGIN_PATH;
  if (!normalized.startsWith(ROOT_PATH)) return normalized;
  if (normalized === ADMIN_NO_ACCESS_PATH) return ADMIN_NO_ACCESS_PATH;
  if (normalized === '/admin/review-notices') {
    return adminMenuState.allowedPaths.includes('/admin/basic/suppliers') ? normalized : '';
  }

  if (adminMenuState.allowedPaths.includes(normalized)) {
    return normalized;
  }

  const childPath = adminMenuState.allowedPaths.find((allowedPath) =>
    allowedPath.startsWith(`${normalized}/`),
  );
  if (childPath) return childPath;

  const parentMatched = adminMenuState.allowedPaths.find(
    (allowedPath) =>
      allowedPath !== ROOT_PATH &&
      (normalized === allowedPath || normalized.startsWith(`${allowedPath}/`)),
  );
  // Stay on the requested child. Sending it back to a parent that redirects
  // here again aborts the navigation and leaves the user on the login page.
  if (parentMatched && normalized.startsWith(`${parentMatched}/`)) return normalized;
  if (parentMatched) return parentMatched;

  const overview = adminMenuState.allowedPaths.find((allowedPath) => allowedPath === ROOT_PATH);
  return overview && normalized.startsWith(`${ROOT_PATH}/`) ? overview : '';
};

export const hasAdminMenuAccess = (path: string) =>
  !!resolveAllowedAdminPath(path);
