import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { compileScript, parse } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import * as mobileMessages from '../src/modules/admin/pages/supplier-management/mobile/messages.ts';
import {
  SUPPLIER_DESKTOP_BASE, SUPPLIER_MOBILE_BASE, SUPPLIER_MOBILE_SECTIONS,
  canAccessSupplierSection, supplierDesktopPath, supplierMobilePath,
  supplierResponsivePath, supplierSectionFromPath, supplierAwareLoginRedirect,
} from '../src/modules/admin/utils/supplierMobile.ts';
import * as mobile from '../src/modules/admin/utils/supplierMobile.ts';

test('all supplier pages map between desktop and mobile without touching unrelated admin paths', () => {
  for (const section of SUPPLIER_MOBILE_SECTIONS) {
    const desktop = `${SUPPLIER_DESKTOP_BASE}/${section}`;
    const h5 = `${SUPPLIER_MOBILE_BASE}/${section}`;
    assert.equal(supplierMobilePath(desktop), h5);
    assert.equal(supplierDesktopPath(h5), desktop);
    assert.equal(supplierSectionFromPath(`${h5}?service=14#price`), section);
    assert.equal(supplierResponsivePath(desktop, { mobile: true }), h5);
    assert.equal(supplierResponsivePath(h5, { mobile: false }), desktop);
    assert.equal(supplierResponsivePath(h5, { mobile: true }), h5);
  }
  assert.equal(supplierResponsivePath('/admin/basic/suppliers', { mobile: true }), '');
  assert.equal(supplierMobilePath('/admin/supplier-management/private-tools'), '');
});

test('legacy supplier aliases land in their canonical mobile modules', () => {
  for (const alias of ['service-area', 'availability']) assert.equal(supplierMobilePath(`${SUPPLIER_DESKTOP_BASE}/${alias}`), `${SUPPLIER_MOBILE_BASE}/coverage-availability`);
  assert.equal(supplierMobilePath(`${SUPPLIER_DESKTOP_BASE}/orders/h5`), `${SUPPLIER_MOBILE_BASE}/orders`);
  assert.equal(supplierMobilePath(`${SUPPLIER_DESKTOP_BASE}/services`), `${SUPPLIER_MOBILE_BASE}/pricing`);
  assert.equal(supplierMobilePath(SUPPLIER_DESKTOP_BASE), `${SUPPLIER_MOBILE_BASE}/overview`);
});

test('mobile navigation respects exact page grants and staff-only restrictions', () => {
  const grants = [SUPPLIER_DESKTOP_BASE, supplierDesktopPath('orders'), supplierDesktopPath('profile')];
  assert.equal(canAccessSupplierSection('orders', grants), true);
  assert.equal(canAccessSupplierSection('profile', grants), true);
  assert.equal(canAccessSupplierSection('staff', grants), false);
  assert.equal(canAccessSupplierSection('pricing', grants), false);
  assert.equal(canAccessSupplierSection('overview', ['/admin']), false);
  assert.equal(canAccessSupplierSection('orders', [SUPPLIER_DESKTOP_BASE], true), true);
  assert.equal(canAccessSupplierSection('profile', grants, true), false);
  assert.equal(canAccessSupplierSection('orders', [], true), false);
  assert.equal(supplierResponsivePath(supplierDesktopPath('staff'), { mobile: false, staffOrdersOnly: true }), supplierMobilePath('orders'));
});

function routerHarness({ mobileDevice = true, staffOnly = false, grants = SUPPLIER_MOBILE_SECTIONS.map(supplierDesktopPath), loggedIn = true, preview = false } = {}) {
  let guard;
  let routeConfig;
  const source = readFileSync(new URL('../src/modules/admin/router/index.ts', import.meta.url), 'utf8').replaceAll('import.meta.env.DEV', String(preview));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  runInNewContext(code, {
    exports,
    console,
    require(name) {
      if (name === 'vue-router') return { createWebHistory: () => ({}), createRouter: (config) => { routeConfig = config; return { beforeEach: (fn) => { guard = fn; } }; } };
      if (name === '@/modules/admin/utils/menuPermission') return {
        ADMIN_NO_ACCESS_PATH: '/admin/no-access', adminMenuState: { allowedPaths: grants },
        getFirstAllowedAdminPath: () => grants[0] || '/admin/no-access',
        isSupplierStaffOrdersOnly: () => staffOnly, loadAdminMenuPermissions: async () => {},
        resolveAllowedAdminPath: (path) => grants.includes(path) ? path : '',
      };
      if (name === '@/utils/auth-state') return { clearAdminAuthState() {}, getAdminAuthSnapshot: () => ({ isExpired: false, isLoggedIn: loggedIn }) };
      if (name === '@/utils/device') return { isMobileDevice: () => mobileDevice };
      if (name === '@/modules/admin/utils/supplierMobile') return mobile;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { guard, routeConfig };
}
const location = (path, query = {}, hash = '') => ({ path, query, hash, fullPath: path + '?service=14' + hash });
const plain = (value) => JSON.parse(JSON.stringify(value));

test('the actual router redirects every phone deep link and preserves its query and hash', async () => {
  const { guard } = routerHarness();
  const query = { service: '14', quoteStep: 'review', staff: '42' };
  for (const section of SUPPLIER_MOBILE_SECTIONS) {
    assert.deepEqual(plain(await guard(location(supplierDesktopPath(section), query, '#details'))), { path: supplierMobilePath(section), query, hash: '#details', replace: true });
    assert.equal(await guard(location(supplierMobilePath(section), query, '#details')), true);
  }
});

test('the actual router returns owners to desktop and keeps staff in their mobile order workspace', async () => {
  const owner = routerHarness({ mobileDevice: false });
  assert.deepEqual(plain(await owner.guard(location(supplierMobilePath('pricing'), { service: '8' }, '#review'))), { path: supplierDesktopPath('pricing'), query: { service: '8' }, hash: '#review', replace: true });
  const staff = routerHarness({ mobileDevice: false, staffOnly: true, grants: [SUPPLIER_DESKTOP_BASE, supplierDesktopPath('orders')] });
  assert.deepEqual(plain(await staff.guard(location(supplierMobilePath('profile')))), { path: supplierMobilePath('orders'), query: {}, hash: '', replace: true });
  assert.equal(await staff.guard(location(supplierMobilePath('orders'))), true);
});

test('unauthorized owner modules fall back to an actual grant without showing the forbidden content', async () => {
  const { guard } = routerHarness({ grants: [SUPPLIER_DESKTOP_BASE, supplierDesktopPath('orders'), supplierDesktopPath('profile')] });
  assert.deepEqual(plain(await guard(location(supplierMobilePath('staff')))), { path: supplierMobilePath('orders'), replace: true });
  const noSupplierGrant = routerHarness({ grants: ['/admin/orders'] });
  assert.deepEqual(plain(await noSupplierGrant.guard(location(supplierMobilePath('profile')))), { path: '/admin/orders', replace: true });
});

test('mobile auth redirects retain the intended deep link and explicit development previews remain reachable', async () => {
  const anonymous = routerHarness({ loggedIn: false });
  const target = location(supplierMobilePath('pricing'), { service: '14' }, '#review');
  assert.deepEqual(plain(await anonymous.guard(target)), { path: '/admin/login', query: { redirect: target.fullPath } });
  const preview = routerHarness({ mobileDevice: false, loggedIn: false, preview: true });
  assert.equal(await preview.guard(location(supplierMobilePath('profile'), { preview: 'supplier' })), true);
});

test('login round trips restore supplier service, review and staff deep links with query and hash intact', async () => {
  const owner = routerHarness();
  const actualRouter = createRouter({ ...owner.routeConfig, history: createMemoryHistory() });
  for (const requested of [
    `${supplierMobilePath('pricing')}?service=502&quoteStep=review#quote`,
    `${supplierMobilePath('orders')}?staff=42&serviceDate=2026-10-31#visit`,
    `${supplierDesktopPath('pricing')}?service=502&quoteStep=review#quote`,
  ]) {
    const expectedDesktop = supplierDesktopPath(requested);
    const permissionCalls = [];
    const afterLogin = supplierAwareLoginRedirect(requested, (path) => { permissionCalls.push(path); return path === expectedDesktop ? path : ''; }, '/admin/no-access');
    assert.equal(afterLogin, requested);
    assert.deepEqual(permissionCalls, [expectedDesktop]);
    const resolved = actualRouter.resolve(afterLogin);
    const decision = await owner.guard(resolved);
    if (requested.startsWith(SUPPLIER_MOBILE_BASE)) assert.equal(decision, true);
    else assert.deepEqual(plain(decision), { path: supplierMobilePath('pricing'), query: { service: '502', quoteStep: 'review' }, hash: '#quote', replace: true });
  }
  const staffRequested = `${supplierMobilePath('orders')}?staff=42&order=31#visit`;
  const staffGrants = [supplierDesktopPath('orders')];
  const staffRedirect = supplierAwareLoginRedirect(staffRequested, path => staffGrants.includes(path) ? path : '', staffGrants[0]);
  assert.equal(staffRedirect, staffRequested);
  const staff = routerHarness({ staffOnly: true, grants: staffGrants, mobileDevice: false });
  assert.equal(await staff.guard(actualRouter.resolve(staffRedirect)), true);
});

test('login rejects external and protocol-relative targets and preserves other admin fallback behavior', () => {
  const calls = [];
  const resolve = (path) => { calls.push(path); return path.startsWith('/admin/orders') ? '/admin/orders' : ''; };
  for (const requested of ['https://evil.example/admin', '//evil.example/admin', '/\\evil.example/admin', '/administrator', '/admin/login?redirect=/admin', '/admin/LOGIN', '/admin/supplier-management/h5/unknown', null, ['//evil.example']]) {
    assert.equal(supplierAwareLoginRedirect(requested, resolve, '/admin/no-access'), '/admin/no-access');
  }
  assert.deepEqual(calls, []);
  assert.equal(supplierAwareLoginRedirect('/admin/orders?orderNo=123#detail', resolve, '/admin/no-access'), '/admin/orders');
  assert.equal(supplierAwareLoginRedirect(`${supplierMobilePath('pricing')}?service=99`, () => '', supplierDesktopPath('orders')), supplierDesktopPath('orders'));
});

test('the legacy order H5 route is a redirect and the new shell lives outside the desktop layout', () => {
  const { routeConfig } = routerHarness();
  const mobileRoute = routeConfig.routes.find(route => route.path === SUPPLIER_MOBILE_BASE);
  assert.equal(mobileRoute.children.length, SUPPLIER_MOBILE_SECTIONS.length);
  assert.equal(mobileRoute.meta.supplierMobile, true);
  const desktop = routeConfig.routes.find(route => route.path === '/admin');
  const supplier = desktop.children.find(route => route.path === 'supplier-management');
  const legacy = supplier.children.find(route => route.path === 'orders/h5');
  assert.deepEqual(plain(legacy.redirect({ query: { order: '31' }, hash: '#visit' })), { path: supplierMobilePath('orders'), query: { order: '31' }, hash: '#visit' });
});

test('case-insensitive matcher aliases cannot bypass supplier login or staff-only module checks', async () => {
  const owner = routerHarness();
  const matcher = createRouter({ ...owner.routeConfig, history: createMemoryHistory() });
  for (const path of [
    '/admin/supplier-management/h5/PROFILE',
    '/ADMIN/SUPPLIER-MANAGEMENT/H5/PROFILE',
    '/Admin/Supplier-Management/H5/Profile',
  ]) {
    // Exercise the real route matcher rather than assuming how casing resolves.
    assert.equal(matcher.resolve(path).name, 'admin-supplier-mobile-profile');
    assert.equal(supplierSectionFromPath(path), 'profile');
    assert.deepEqual(plain(await owner.guard(location(path, { section: 'BANK' }, '#Details'))), {
      path: supplierMobilePath('profile'), query: { section: 'BANK' }, hash: '#Details', replace: true,
    });
    const anonymous = routerHarness({ loggedIn: false });
    const target = location(path);
    assert.deepEqual(plain(await anonymous.guard(target)), { path: '/admin/login', query: { redirect: target.fullPath } });
    const staff = routerHarness({ staffOnly: true, grants: [SUPPLIER_DESKTOP_BASE, supplierDesktopPath('orders')] });
    assert.deepEqual(plain(await staff.guard(location(path))), {
      path: supplierMobilePath('orders'), query: {}, hash: '', replace: true,
    });
  }
  const restricted = routerHarness({ grants: [supplierDesktopPath('orders')] });
  assert.deepEqual(plain(await restricted.guard(location('/ADMIN/SUPPLIER-MANAGEMENT/H5/PRICING'))), {
    path: supplierMobilePath('orders'), replace: true,
  });
});

test('changing mobile modules closes the account menu and resets the content scroller, while filters keep its position', async () => {
  const filename = 'src/modules/admin/pages/supplier-management/mobile/Layout.vue';
  const { descriptor, errors } = parse(readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8'), { filename });
  assert.deepEqual(errors, []);
  const script = compileScript(descriptor, { id: 'mobile-layout-scroll-test' });
  const code = ts.transpileModule(script.content.replaceAll('import.meta.env.DEV', 'false'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const route = Vue.reactive({ path: supplierMobilePath('overview'), query: {} });
  const scrollCalls = [];
  const bodyClasses = new Set();
  const exports = {};
  runInNewContext(code, {
    exports,
    document: {
      body: { classList: { add: value => bodyClasses.add(value), remove: value => bodyClasses.delete(value) } },
      querySelector: (selector) => selector === '.supplier-mobile-content' ? { scrollTo: options => scrollCalls.push(plain(options)) } : null,
    },
    window: { clearInterval() {} },
    require(name) {
      if (name === 'vue') return Vue;
      if (name === 'vue-router') return { useRoute: () => route, useRouter: () => ({ push() {}, replace() {} }) };
      if (name === 'vue-i18n') return { useI18n: () => ({ t: key => key, locale: Vue.ref('zh') }) };
      if (name === 'axios') return { defaults: { headers: { common: {} } } };
      if (name === 'element-plus') return { ElMessage: {} };
      if (name === '@element-plus/icons-vue') return {};
      if (name === '@/modules/admin/locales') return { ADMIN_LOCALE_STORAGE_KEY: 'locale' };
      if (name === '@/utils/auth-state') return { getAdminAuthStorageValue: () => '', clearAdminAuthState() {} };
      if (name === '@/modules/admin/stores/session') return { useAdminSessionStore: () => ({ me: null, details: {}, currentUser: async () => null }) };
      if (name === '@/modules/admin/utils/menuPermission') return { adminMenuState: { allowedPaths: [] }, isSupplierStaffOrdersOnly: () => false };
      if (name === '@/modules/admin/utils/supplierMobile') return mobile;
      if (name === '@/modules/admin/utils/supplierShelfNotice') return { supplierShelfNoticeUnread: Vue.ref(false) };
      if (name === '@/modules/admin/api/user' || name === '@/modules/admin/api') return {};
      if (name === '@/utils/phone-dial') return { DEFAULT_PHONE_DIAL: '+971', PHONE_DIAL_OPTIONS: [] };
      if (name === './messages') return mobileMessages;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const renderer = Vue.createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {},
    setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null,
  });
  const app = renderer.createApp({ ...exports.default, render: () => null });
  const instance = app.mount({});
  const state = instance.$.setupState;
  assert.equal(bodyClasses.has('supplier-mobile-mode'), true);
  state.accountOpen = true;
  route.path = supplierMobilePath('profile');
  await Vue.nextTick();
  assert.equal(state.accountOpen, false);
  assert.deepEqual(scrollCalls, [{ top: 0 }]);
  route.query = { section: 'company' };
  await Vue.nextTick();
  assert.equal(scrollCalls.length, 1);
  route.path = supplierMobilePath('pricing');
  await Vue.nextTick();
  assert.deepEqual(scrollCalls, [{ top: 0 }, { top: 0 }]);
  app.unmount();
  assert.equal(bodyClasses.has('supplier-mobile-mode'), false);
});
