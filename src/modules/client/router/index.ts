import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // C端：/index 开头
  {
    path: '/',
    component: () => import('@/modules/client/pages/index.vue'),
    children: [],
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('@/modules/client/pages/services.vue'),
  },
  {
    path: '/services/:id',
    name: 'ServiceDetail',
    component: () => import('@/modules/client/pages/service-detail.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/modules/client/pages/about.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/client/pages/login.vue'),
  },

  // 默认跳转到 C端首页
  { path: '/', redirect: '/index' },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/client/pages/NotFound.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
export default router;
