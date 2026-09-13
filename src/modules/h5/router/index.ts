import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { clearStoredAuthState, getStoredAuthSnapshot } from '@/utils/auth-state';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'h5-home',
    component: () => import('../pages/home.vue'),
    meta: { title: 'On-Demand Home Services in Dubai | HourX Home' },
  },
  {
    path: '/login',
    name: 'h5-login',
    component: () => import('../pages/login.vue'),
  },
  {
    path: '/register',
    name: 'h5-register',
    component: () => import('../pages/register.vue'),
  },
  {
    path: '/profile',
    name: 'h5-profile',
    component: () => import('../pages/profile.vue'),
  },
  {
    path: '/profile/security',
    name: 'h5-profile-security',
    component: () => import('../pages/profile-security.vue'),
  },
  {
    path: '/services/daily-cleaning',
    name: 'h5-service-list',
    component: () => import('../pages/service-list.vue'),
  },
  {
    path: '/services/search',
    name: 'h5-service-search',
    component: () => import('../pages/service-list.vue'),
  },
  {
    path: '/services/detail/:spuId',
    name: 'h5-product-detail',
    component: () => import('../pages/product-detail.vue'),
  },
  {
    path: '/cart',
    name: 'h5-cart',
    component: () => import('../pages/cart.vue'),
  },
  {
    path: '/orders/confirm',
    name: 'h5-order-confirm',
    component: () => import('../pages/order-confirm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/success',
    name: 'h5-booking-success',
    component: () => import('../pages/booking-success.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'h5-orders',
    component: () => import('../pages/order-list.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:orderNo',
    name: 'h5-order-detail',
    component: () => import('../pages/order-detail.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory('/h5/'),
  routes,
  scrollBehavior: () => ({ top: 0, left: 0 }),
});

router.beforeEach((to) => {
  if (!to.meta?.requiresAuth) {
    return true;
  }

  const snapshot = getStoredAuthSnapshot();
  if (snapshot.isExpired) {
    clearStoredAuthState();
  }

  if (snapshot.isLoggedIn) {
    return true;
  }

  return {
    name: 'h5-login',
    query: { redirect: to.fullPath },
  };
});

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = String(to.meta.title);
  }
});

export default router;
