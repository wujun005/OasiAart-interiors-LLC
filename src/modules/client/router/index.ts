import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

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
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 };
  },
});
export default router;
