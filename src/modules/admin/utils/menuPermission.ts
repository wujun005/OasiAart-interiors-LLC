import { reactive } from 'vue';
import { getCurrentUserRoles } from '@/modules/admin/api/user';

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

export const adminMenuState = reactive<AdminMenuPermissionState>({
  loaded: false,
  lastToken: '',
  menus: [],
  flatMenus: [],
  allowedPaths: [],
  firstPath: ROOT_PATH,
});

let pendingLoad: Promise<void> | null = null;

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
  return path;
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

const hydrateMenuState = (list: RawMenuItem[]) => {
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

  const roots: AdminMenuPermissionItem[] = [];
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

  const prunedRoots = pruneMenus(roots);
  sortMenus(prunedRoots);

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
  adminMenuState.loaded = false;
  adminMenuState.lastToken = '';
  adminMenuState.menus = [];
  adminMenuState.flatMenus = [];
  adminMenuState.allowedPaths = [];
  adminMenuState.firstPath = ROOT_PATH;
  pendingLoad = null;
};

export const loadAdminMenuPermissions = async (force = false) => {
  const token = localStorage.getItem('token') || '';
  if (!token) {
    resetAdminMenuPermissions();
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

  pendingLoad = (async () => {
    const res = await getCurrentUserRoles();
    const list = parseMenuList(res);
    hydrateMenuState(list);
    adminMenuState.lastToken = token;
    adminMenuState.loaded = true;
  })()
    .catch((error) => {
      resetAdminMenuPermissions();
      adminMenuState.loaded = true;
      throw error;
    })
    .finally(() => {
      pendingLoad = null;
    });

  await pendingLoad;
  return adminMenuState;
};

export const getFirstAllowedAdminPath = () =>
  adminMenuState.firstPath || ROOT_PATH;

export const resolveAllowedAdminPath = (path: string) => {
  const normalized = normalizePath(path);
  if (!normalized) return '';
  if (normalized === LOGIN_PATH) return LOGIN_PATH;
  if (!normalized.startsWith(ROOT_PATH)) return normalized;

  if (adminMenuState.allowedPaths.includes(normalized)) {
    return normalized;
  }

  const childPath = adminMenuState.allowedPaths.find((allowedPath) =>
    allowedPath.startsWith(`${normalized}/`),
  );
  if (childPath) return childPath;

  const parentMatched = adminMenuState.allowedPaths.find(
    (allowedPath) =>
      normalized === allowedPath || normalized.startsWith(`${allowedPath}/`),
  );
  return parentMatched || '';
};

export const hasAdminMenuAccess = (path: string) =>
  !!resolveAllowedAdminPath(path);
