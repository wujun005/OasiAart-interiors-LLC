import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'h5-home',
    component: () => import('../pages/home.vue'),
  },
];

const router = createRouter({
  history: createWebHistory('/h5'),
  routes,
  scrollBehavior: () => ({ top: 0, left: 0 }),
});

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `移动端-${to.meta.title}`;
  }
});

export default router;
