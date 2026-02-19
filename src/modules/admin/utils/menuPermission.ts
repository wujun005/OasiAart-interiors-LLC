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
  const withoutQuery = trimmed.split('?')[0].split('#')[0].trim();
  if (!withoutQuery) return '';

  let path = withoutQuery;
  if (!path.startsWith('/')) {
    path = path.startsWith('admin/') ? `/${path}` : `${ROOT_PATH}/${path}`;
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

const hydrateMenuState = (list: RawMenuItem[]) => {
  const nodes = list
    .map((item): AdminMenuPermissionItem | null => {
      if (item.id === undefined || item.id === null) return null;
      return {
        id: item.id,
        name: item.name?.trim() || '',
        path: normalizePath(item.path),
        icon: item.icon?.trim() || '',
        parentId:
          item.parentId === undefined || item.parentId === null
            ? 0
            : item.parentId,
        sortOrder: Number(item.sortOrder || 0),
        children: [],
      };
    })
    .filter((item): item is AdminMenuPermissionItem => !!item)
    .filter((item) => !item.path || item.path.startsWith(ROOT_PATH));

  const nodeMap = new Map<string, AdminMenuPermissionItem>();
  nodes.forEach((node) => nodeMap.set(String(node.id), node));

  const roots: AdminMenuPermissionItem[] = [];
  nodes.forEach((node) => {
    const parentKey = String(node.parentId);
    const parent =
      parentKey && parentKey !== '0' ? nodeMap.get(parentKey) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortMenus(roots);

  const flat = flattenMenus(roots, []);
  const allowedPaths = Array.from(
    new Set(
      flat
        .map((item) => item.path)
        .filter((path) => !!path && path !== LOGIN_PATH),
    ),
  );

  adminMenuState.menus = roots;
  adminMenuState.flatMenus = flat;
  adminMenuState.allowedPaths = allowedPaths;
  adminMenuState.firstPath = findFirstPath(roots) || ROOT_PATH;
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
  if (parentMatched) return normalized;
  return '';
};

export const hasAdminMenuAccess = (path: string) =>
  !!resolveAllowedAdminPath(path);
