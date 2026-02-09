import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
// import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
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
        path: 'products',
        name: 'admin-products',
        component: () => import('@/modules/admin/pages/product/index.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/modules/admin/pages/user/index.vue'),
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

  // 默认跳转到 C端首页
  // { path: '/', redirect: '/admin' },

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

// 路由守卫：鉴权 + 角色
// router.beforeEach((to) => {
//   const auth = useAuthStore();
//   if (to.meta.requiresAuth && !auth.isLoggedIn) {
//     return { name: 'client-home' }; // 或跳登录页
//   }
//   if (to.meta.requiresRole && !auth.hasRole(to.meta.requiresRole as string)) {
//     return { name: 'not-found' }; // 或“无权限”页
//   }
// });

export default router;
