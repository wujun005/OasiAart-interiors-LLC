import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
// import { useAuthStore } from '@/stores/auth';
import {
  ADMIN_NO_ACCESS_PATH,
  adminMenuState,
  getFirstAllowedAdminPath,
  isSupplierStaffOrdersOnly,
  loadAdminMenuPermissions,
  resolveAllowedAdminPath,
} from '@/modules/admin/utils/menuPermission';
import {
  clearAdminAuthState,
  getAdminAuthSnapshot,
} from '@/utils/auth-state';
import { isMobileDevice } from '@/utils/device';
import {
  SUPPLIER_MOBILE_BASE,
  SUPPLIER_MOBILE_SECTIONS,
  canAccessSupplierSection,
  supplierDesktopPath,
  supplierMobilePath,
  supplierResponsivePath,
  supplierSectionFromPath,
} from '@/modules/admin/utils/supplierMobile';

const routes: RouteRecordRaw[] = [
  {
    path: SUPPLIER_MOBILE_BASE,
    component: () => import('@/modules/admin/pages/supplier-management/mobile/Layout.vue'),
    redirect: (to) => ({ path: supplierMobilePath('overview'), query: to.query, hash: to.hash }),
    meta: { scope: 'admin', requiresAuth: true, requiresRole: 'admin', supplierMobile: true },
    children: SUPPLIER_MOBILE_SECTIONS.map((section) => ({
      path: section,
      name: `admin-supplier-mobile-${section}`,
      component: () => import('@/modules/admin/pages/supplier-management/mobile/index.vue'),
      props: { section },
    })),
  },
  // 管理端：/admin 开头
  {
    path: '/admin',
    component: () => import('@/modules/admin/index.vue'),
    children: [
      {
        path: '',
        name: 'admin-home',
        component: () => import('@/modules/admin/pages/home/index.vue'),
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/modules/admin/pages/orders/index.vue'),
      },
      {
        path: 'orders/h5',
        name: 'admin-orders-h5',
        component: () => import('@/modules/admin/pages/orders/index.vue'),
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/modules/admin/pages/product/index.vue'),
      },
      {
        path: 'packages',
        redirect: '/admin/package/packages',
      },
      {
        path: 'package',
        component: () => import('@/modules/admin/pages/basic/Layout.vue'),
        redirect: '/admin/package/categories',
        children: [
          {
            path: 'categories',
            name: 'admin-package-categories',
            component: () => import('@/modules/admin/pages/package-category/index.vue'),
          },
          {
            path: 'service-subcategories',
            name: 'admin-package-service-subcategories',
            component: () => import('@/modules/admin/pages/package-service-category/index.vue'),
          },
          {
            path: 'spec-types',
            name: 'admin-package-spec-types',
            component: () => import('@/modules/admin/pages/package-spec-type/index.vue'),
          },
          {
            path: 'specs',
            name: 'admin-package-specs',
            component: () => import('@/modules/admin/pages/package-spec/index.vue'),
          },
          {
            path: 'services',
            name: 'admin-package-services',
            component: () => import('@/modules/admin/pages/package-service/index.vue'),
          },
          {
            path: 'packages',
            name: 'admin-package-list',
            component: () => import('@/modules/admin/pages/package/index.vue'),
          },
        ],
      },
      {
        path: 'users',
        redirect: () => {
          if (adminMenuState.allowedPaths.includes('/admin/users/suppliers')
            && !adminMenuState.allowedPaths.includes('/admin/users/platform')) {
            return '/admin/users/suppliers';
          }
          return '/admin/users/platform';
        },
      },
      {
        path: 'users/platform',
        name: 'admin-users-platform',
        component: () => import('@/modules/admin/pages/user/index.vue'),
        props: { accountKind: 'platform' },
      },
      {
        path: 'users/suppliers',
        name: 'admin-users-suppliers',
        component: () => import('@/modules/admin/pages/user/index.vue'),
        props: { accountKind: 'supplier' },
      },
      {
        path: 'notifications',
        name: 'admin-notifications',
        component: () => import('@/modules/admin/pages/notification/index.vue'),
      },
      {
        path: 'review-notices',
        name: 'admin-review-notices',
        component: () => import('@/modules/admin/pages/review-notice/index.vue'),
      },
      {
        path: 'sys-config',
        name: 'admin-sys-config',
        component: () => import('@/modules/admin/pages/sys-config/index.vue'),
      },
      {
        path: 'developer',
        component: () => import('@/modules/admin/pages/basic/Layout.vue'),
        redirect: '/admin/developer/supplier-registration-whitelist',
        children: [
          {
            path: 'supplier-registration-whitelist',
            name: 'admin-supplier-registration-whitelist',
            component: () => import('@/modules/admin/pages/supplier-registration-whitelist/index.vue'),
          },
        ],
      },
      {
        path: 'supplier-management',
        component: () => import('@/modules/admin/pages/basic/Layout.vue'),
        redirect: (to) => ({ path: '/admin/supplier-management/overview', query: to.query }),
        children: [
          {
            path: 'overview',
            name: 'admin-supplier-overview',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'overview' },
          },
          {
            path: 'profile',
            name: 'admin-supplier-profile',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'profile' },
          },
          {
            path: 'service-area',
            name: 'admin-supplier-service-area',
            redirect: (to) => ({ path: '/admin/supplier-management/coverage-availability', query: to.query }),
          },
          {
            path: 'coverage-availability',
            name: 'admin-supplier-coverage-availability',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'coverage-availability' },
          },
          {
            path: 'staff',
            name: 'admin-supplier-staff',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'staff' },
          },
          { path: 'schedule', redirect: (to) => ({ path: '/admin/supplier-management/profile', query: to.query }) },
          {
            path: 'availability',
            name: 'admin-supplier-availability',
            redirect: (to) => ({ path: '/admin/supplier-management/coverage-availability', query: to.query }),
          },
          {
            path: 'orders',
            name: 'admin-supplier-orders',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'orders' },
          },
          {
            path: 'orders/h5',
            name: 'admin-supplier-orders-h5',
            redirect: (to) => ({ path: supplierMobilePath('orders'), query: to.query, hash: to.hash }),
          },
          {
            path: 'pricing',
            name: 'admin-supplier-pricing',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'pricing' },
          },
          {
            path: 'package-pricing',
            name: 'admin-supplier-package-pricing',
            component: () => import('@/modules/admin/pages/supplier-management/index.vue'),
            props: { section: 'package-pricing' },
          },
          { path: 'settlement', redirect: (to) => ({ path: '/admin/supplier-management/profile', query: to.query }) },
        ],
      },
      {
        path: 'basic',
        component: () => import('@/modules/admin/pages/basic/Layout.vue'),
        children: [
          {
            path: '',
            redirect: 'categories',
          },
          {
            path: 'categories',
            name: 'admin-basic-categories',
            component: () => import('@/modules/admin/pages/category/index.vue'),
          },
          {
            path: 'subcategories',
            name: 'admin-basic-subcategories',
            component: () => import('@/modules/admin/pages/subcategory/index.vue'),
          },
          {
            path: 'specs',
            name: 'admin-basic-specs',
            component: () => import('@/modules/admin/pages/spec/index.vue'),
          },
          {
            path: 'spec-types',
            name: 'admin-basic-spec-types',
            component: () => import('@/modules/admin/pages/spectype/index.vue'),
          },
          {
            path: 'addon-categories',
            name: 'admin-basic-addon-categories',
            component: () => import('@/modules/admin/pages/addonCategory/index.vue'),
          },
          {
            path: 'addons',
            name: 'admin-basic-addons',
            component: () => import('@/modules/admin/pages/addon/index.vue'),
          },
          {
            path: 'suppliers',
            name: 'admin-basic-suppliers',
            component: () => import('@/modules/admin/pages/supplier/index.vue'),
          },
          {
            path: 'quotes',
            name: 'admin-basic-quotes',
            component: () => import('@/modules/admin/pages/supplier/index.vue'),
            props: { desk: 'quotes' },
          },
          {
            path: 'service-areas',
            name: 'admin-basic-service-areas',
            component: () => import('@/modules/admin/pages/service-area/index.vue'),
          },
        ],
      },
    ],
    meta: { scope: 'admin', requiresAuth: true, requiresRole: 'admin' },
  },
  {
    path: '/admin/login',
    name: 'login',
    component: () => import('@/modules/admin/pages/login.vue'),
  },
  {
    path: ADMIN_NO_ACCESS_PATH,
    name: 'admin-no-access',
    component: () => import('@/modules/admin/pages/no-access.vue'),
  },

  // 默认跳转到 C端首页
  // { path: '/', redirect: '/admin' },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/admin',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const supplierLocation = /^\/admin\/supplier-management(?:\/|$)/i.test(to.path);
  if (!to.path.startsWith('/admin') && !supplierLocation) return true;
  if (to.path === '/admin/login') return true;

  const ordersPath = '/admin/orders';
  const ordersH5Path = '/admin/orders/h5';
  if (to.path === ordersPath && isMobileDevice()) {
    return { path: ordersH5Path, query: to.query, hash: to.hash, replace: true };
  }
  if (to.path === ordersH5Path && !isMobileDevice()) {
    return { path: ordersPath, query: to.query, hash: to.hash, replace: true };
  }

  if (
    import.meta.env.DEV &&
    to.query.preview === 'supplier' &&
    supplierLocation
  ) {
    const previewPath = supplierResponsivePath(to.path, {
      mobile: isMobileDevice() || to.path.toLowerCase().startsWith(SUPPLIER_MOBILE_BASE),
    });
    if (previewPath && previewPath !== to.path) {
      return { path: previewPath, query: to.query, hash: to.hash, replace: true };
    }
    return true;
  }

  const auth = getAdminAuthSnapshot();
  if (auth.isExpired) clearAdminAuthState();
  if (!auth.isLoggedIn) {
    return { path: '/admin/login', query: { redirect: to.fullPath } };
  }

  try {
    await loadAdminMenuPermissions();
  } catch (error) {
    console.error('Failed to load menu permissions:', error);
    return { path: '/admin/login', query: { redirect: to.fullPath } };
  }

  if (to.path === ADMIN_NO_ACCESS_PATH) {
    const home = getFirstAllowedAdminPath();
    if (home !== ADMIN_NO_ACCESS_PATH) return { path: home, replace: true };
    return true;
  }

  const staffOrdersOnly = isSupplierStaffOrdersOnly();
  const supplierSection = supplierSectionFromPath(to.path);
  if (supplierSection) {
    const section = staffOrdersOnly ? 'orders' : supplierSection;
    if (canAccessSupplierSection(section, adminMenuState.allowedPaths, staffOrdersOnly)) {
      const destination = supplierResponsivePath(to.path, { mobile: isMobileDevice(), staffOrdersOnly });
      if (destination && destination !== to.path) {
        return { path: destination, query: to.query, hash: to.hash, replace: true };
      }
      return true;
    }
    const fallback = SUPPLIER_MOBILE_SECTIONS.find((candidate) =>
      canAccessSupplierSection(candidate, adminMenuState.allowedPaths, staffOrdersOnly));
    if (fallback) {
      const path = supplierResponsivePath(supplierDesktopPath(fallback), { mobile: isMobileDevice(), staffOrdersOnly });
      return { path, replace: true };
    }
    const home = getFirstAllowedAdminPath();
    return { path: home.startsWith('/admin/supplier-management') ? ADMIN_NO_ACCESS_PATH : home, replace: true };
  }

  const permissionPath = to.path === ordersH5Path ? ordersPath : to.path;
  const targetPath = resolveAllowedAdminPath(permissionPath);
  if (to.path === ordersH5Path && targetPath) return true;
  if (targetPath) {
    if (targetPath !== to.path) {
      return { path: targetPath };
    }
    return true;
  }

  const fallbackPath = getFirstAllowedAdminPath();
  if (fallbackPath !== to.path) {
    return { path: fallbackPath, replace: true };
  }

  return true;
});

export default router;
