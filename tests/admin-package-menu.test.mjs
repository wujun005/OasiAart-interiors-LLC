import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as adminEntry from '../src/modules/admin/utils/adminEntry.ts';

const source = readFileSync(new URL('../src/modules/admin/utils/menuPermission.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source.replaceAll('import.meta.env.DEV', 'false'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const packagePaths = [
  '/admin/package/categories',
  '/admin/package/service-subcategories',
  '/admin/package/spec-types',
  '/admin/package/specs',
  '/admin/package/services',
  '/admin/package/packages',
];
const packageSortOrders = [1, 2, 3, 4, 5, 6];
const plain = (value) => JSON.parse(JSON.stringify(value));

// Execute the real hydration and permission code, with only API, auth and Vue boundaries mocked.
async function loadMenus(menus, roleCodes = []) {
  const exports = {};
  runInNewContext(code, {
    exports,
    console,
    require(name) {
      if (name === 'vue') return { reactive: (state) => state };
      if (name === '@/modules/admin/api/user') return {
        getCurrentUserRoles: async () => ({ data: menus }),
        listEnabledRoles: async () => roleCodes.map((code, id) => ({ id: id + 1, code })),
        getAdminUserRoleIds: async () => roleCodes.map((_, id) => id + 1),
      };
      if (name === '@/utils/auth-state') return { getAdminAuthStorageValue: () => 'menu-test-token' };
      if (name === '@/modules/admin/stores/session') return {
        useAdminSessionStore: () => ({ currentUser: async () => ({ id: 1 }) }),
      };
      if (name === '@/modules/admin/utils/adminEntry') return adminEntry;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  await exports.loadAdminMenuPermissions();
  return exports;
}

function assertPackageGroup(api, parentId) {
  const state = api.adminMenuState;
  const parent = state.flatMenus.find((menu) => menu.path === '/admin/package');
  assert.ok(parent, 'package group exists');
  if (parentId !== undefined) assert.equal(parent.id, parentId);
  assert.deepEqual(plain(parent.children.map((child) => child.path)), packagePaths);
  assert.deepEqual(plain(parent.children.map((child) => child.sortOrder)), packageSortOrders);
  parent.children.forEach((child) => assert.equal(child.parentId, parent.id));
  packagePaths.forEach((path) => {
    assert.equal(state.flatMenus.filter((menu) => menu.path === path).length, 1);
    assert.ok(state.allowedPaths.includes(path));
    assert.equal(api.resolveAllowedAdminPath(path), path);
  });
  return parent;
}

test('a platform menu receives a complete package group beside services', async () => {
  const api = await loadMenus([{ id: 1, path: '/admin/products', name: 'Services' }]);
  const parent = assertPackageGroup(api);
  assert.equal(api.adminMenuState.menus[1], parent);
  assert.equal(parent.children[4].icon, 'goods');
});

test('an existing package list still receives the new service menu and reuses server IDs', async () => {
  const api = await loadMenus([{
    id: 10, path: '/admin/package', name: 'Packages', children: [
      { id: 11, path: packagePaths[0], name: 'Categories', sortOrder: 90 },
      { id: 12, path: packagePaths[5], name: 'Packages', sortOrder: 1 },
    ],
  }]);
  const parent = assertPackageGroup(api, 10);
  assert.equal(parent.children[0].id, 11);
  assert.equal(parent.children[5].id, 12);
});

test('existing service, category and list pages are regrouped without duplicate destinations', async () => {
  const api = await loadMenus([
    { id: 11, path: packagePaths[0], name: 'Categories' },
    { id: 12, path: packagePaths[5], name: 'Packages' },
    { id: 20, path: '/admin/basic', name: 'Basic', children: [
      { id: 21, path: packagePaths[4], name: 'Custom service label', icon: 'goods' },
      { id: 22, path: packagePaths[4], name: 'Duplicate service grant' },
      { id: 23, path: '/admin/basic/specs', name: 'Specifications' },
    ] },
  ]);
  const parent = assertPackageGroup(api);
  assert.deepEqual(plain(parent.children.map((child) => child.id)), [
    11,
    'fixed-package-service-subcategories',
    'fixed-package-spec-types',
    'fixed-package-specs',
    21,
    12,
  ]);
  assert.equal(parent.children[4].name, 'Custom service label');
  const basic = api.adminMenuState.flatMenus.find((menu) => menu.id === 20);
  assert.deepEqual(plain(basic.children.map((child) => child.id)), [23]);
});

test('a complete server package group keeps its identities and remains stable after reload', async () => {
  const api = await loadMenus([{
    id: 30, path: '/admin/package', name: 'Packages', children: [
      { id: 33, path: packagePaths[5], name: 'List', sortOrder: 1 },
      { id: 32, path: packagePaths[4], name: 'Services', sortOrder: 3 },
      { id: 31, path: packagePaths[0], name: 'Categories', sortOrder: 2 },
    ],
  }]);
  assert.deepEqual(plain(assertPackageGroup(api, 30).children.map((child) => child.id)), [
    31,
    'fixed-package-service-subcategories',
    'fixed-package-spec-types',
    'fixed-package-specs',
    32,
    33,
  ]);
  await api.loadAdminMenuPermissions(true);
  assert.deepEqual(plain(assertPackageGroup(api, 30).children.map((child) => child.id)), [
    31,
    'fixed-package-service-subcategories',
    'fixed-package-spec-types',
    'fixed-package-specs',
    32,
    33,
  ]);
});

test('supplier-only and empty-menu accounts receive no package grants', async () => {
  for (const [menus, roles] of [
    [[], []],
    [[{ id: 1, path: '/admin/supplier-management', children: [
      { id: 2, path: '/admin/supplier-management/orders' },
    ] }], []],
    [[{ id: 1, path: '/admin/supplier-management', children: [
      { id: 2, path: '/admin/supplier-management/profile' },
    ] }], ['SUPPLIER']],
  ]) {
    const api = await loadMenus(menus, roles);
    assert.equal(api.adminMenuState.allowedPaths.some((path) => path.startsWith('/admin/package')), false);
    packagePaths.forEach((path) => assert.equal(api.resolveAllowedAdminPath(path), ''));
  }
});
