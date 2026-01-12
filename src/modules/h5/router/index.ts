import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'h5-home',
    component: () => import('../pages/home.vue'),
    children: [
      {
        path: '',
        name: 'h5-home-index',
        component: () => import('../pages/home-index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'products',
        name: 'h5-products',
        component: () => import('../pages/product-list.vue'),
        meta: { title: '商品列表' },
      },
      {
        path: 'products/:id',
        name: 'h5-product-detail',
        component: () => import('../pages/product-detail.vue'),
        meta: { title: '商品详情' },
      },
        {
        path: 'about',
        name: 'about',
        component: () => import('../pages/about.vue'),
        meta: { title: '关于我们' },
      },
        {
        path: 'history',
        name: 'history',
        component: () => import('../pages/history.vue'),
        meta: { title: '历史订单' },
      },
    ],
  },
  {
    path: '/naviation',
    name: 'naviation',
    component: () => import('../pages/naviation/index.vue'),
    meta: { title: '导航' },
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
    path: '/payment',
    name: 'h5-payment',
    component: () => import('../pages/payment.vue'),
    meta: { title: '支付' },
  },
  {
    path: '/payment/success',
    name: 'h5-payment-success',
    component: () => import('../pages/payment-success.vue'),
    meta: { title: '支付成功' },
  },
  {
    path: '/payment/failure',
    name: 'h5-payment-failure',
    component: () => import('../pages/payment-failure.vue'),
    meta: { title: '支付失败' },
  },
  {
    path: '/order-detail/:id',
    name: 'h5-order-detail',
    component: () => import('../pages/order-detail.vue'),
    meta: { title: '订单详情' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'h5-not-found',
    component: () => import('../pages/not-found.vue'),
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
