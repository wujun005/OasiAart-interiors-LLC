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
    path: '/payment',
    name: 'Payment',
    component: () => import('@/modules/client/pages/payment.vue'),
  },
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('@/modules/client/pages/payment-success.vue'),
    beforeEnter: (to, from, next) => {
      // 检测设备类型，如果是移动设备则重定向到 H5 页面
      const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 820;
      if (isMobile) {
        // 保留查询参数
        next({
          path: '/h5/payment/success',
          query: to.query,
          replace: true,
        });
      } else {
        next();
      }
    },
  },
  {
    path: '/payment/failure',
    name: 'PaymentFailure',
    component: () => import('@/modules/client/pages/payment-failure.vue'),
    beforeEnter: (to, from, next) => {
      // 检测设备类型，如果是移动设备则重定向到 H5 页面
      const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 820;
      if (isMobile) {
        // 保留查询参数
        next({
          path: '/h5/payment/failure',
          query: to.query,
          replace: true,
        });
      } else {
        next();
      }
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/client/pages/login.vue'),
  },
  {
    path: '/order-history',
    name: 'OrderHistory',
    component: () => import('@/modules/client/pages/order-history.vue'),
  },
  {
    path: '/order-detail/:id',
    name: 'OrderDetail',
    component: () => import('@/modules/client/pages/order-detail.vue'),
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
  scrollBehavior() {
    return { top: 0, left: 0 };
  },
});
export default router;
