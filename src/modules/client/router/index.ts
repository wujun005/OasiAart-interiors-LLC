import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ProfilePage from '@/modules/client/pages/profile.vue';

const routes: RouteRecordRaw[] = [
  // C端：/index 开头
  {
    path: '/',
    component: () => import('@/modules/client/pages/index.vue'),
    children: [],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/client/pages/login.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/modules/client/pages/register.vue'),
  },
  {
    path: '/services/daily-cleaning',
    name: 'service-list',
    component: () => import('@/modules/client/pages/service-list.vue'),
  },
  {
    path: '/services/detail/:spuId',
    name: 'product-detail',
    component: () => import('@/modules/client/pages/product-detail.vue'),
  },
  {
    path: '/orders/confirm',
    name: 'order-confirm',
    component: () => import('@/modules/client/pages/order-confirm.vue'),
  },
  {
    path: '/orders',
    name: 'order-list',
    component: () => import('@/modules/client/pages/order-list.vue'),
  },
  {
    path: '/join-us',
    name: 'join-us',
    component: () => import('@/modules/client/pages/join-us.vue'),
  },
  {
    path: '/terms',
    name: 'legal-terms',
    component: () => import('@/modules/client/pages/terms.vue'),
  },
  {
    path: '/privacy',
    name: 'legal-privacy',
    component: () => import('@/modules/client/pages/privacy.vue'),
  },
  {
    path: '/data-deletion',
    name: 'legal-data-deletion',
    component: () => import('@/modules/client/pages/data-deletion.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 96,
      };
    }
    return { top: 0, left: 0 };
  },
});
export default router;
