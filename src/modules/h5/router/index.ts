import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'h5-home',
    component: () => import('../pages/home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/services',
    name: 'h5-services',
    component: () => import('../pages/services.vue'),
    meta: { title: '服务项目' },
  },
  {
    path: '/login',
    name: 'h5-login',
    component: () => import('../pages/login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'h5-not-found',
    component: () => import('../pages/not-found.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/h5'),
  routes,
  scrollBehavior: () => ({ top: 0, left: 0 }),
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `移动端-${to.meta.title}`
  }
})

export default router
