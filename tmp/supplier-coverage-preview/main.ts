import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory, RouterLink, useRoute } from 'vue-router';
import { createI18n } from 'vue-i18n';
import axios from 'axios';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@/modules/admin/style/index.scss';
import AdminApp from '@/modules/admin/App.vue';
import CoveragePage from '@/modules/admin/pages/supplier-coverage/index.vue';
import { adminMessages } from '@/modules/admin/locales';
import http from '@/modules/admin/utils/request';
import { adminMenuState } from '@/modules/admin/utils/menuPermission';
import { mockDashboardRequest } from './fixtures';

http.defaults.adapter = mockDashboardRequest;
axios.defaults.adapter = mockDashboardRequest;

const params = new URLSearchParams(location.search);
const locale = params.get('locale') === 'en' ? 'en' : 'zh';
const orderAccess = params.get('orders') !== 'denied';
adminMenuState.allowedPaths = [
  '/admin/supplier-coverage', '/admin/basic/quotes', '/admin/basic/suppliers',
  '/admin/products', '/admin/package/packages',
  ...(orderAccess ? ['/admin/orders'] : []),
];
document.documentElement.lang = locale;
const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: adminMessages });
const quotePage = () => import('@/modules/admin/pages/supplier/index.vue');
const targetPreview = defineComponent(() => {
  const route = useRoute();
  return () => h('section', [
    h('h2', locale === 'zh' ? '预览链接目标' : 'Preview destination'),
    h('code', route.fullPath),
    h('p', [h(RouterLink, { to: { name: 'admin-supplier-coverage', query: { locale } } }, () => (
      locale === 'zh' ? '返回覆盖大盘' : 'Back to coverage'
    ))]),
  ]);
});
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', alias: '/admin/supplier-coverage', name: 'admin-supplier-coverage', component: CoveragePage },
    { path: '/admin/basic/quotes', name: 'admin-basic-quotes', component: quotePage, props: { desk: 'quotes' } },
    { path: '/admin/basic/suppliers', name: 'admin-basic-suppliers', component: quotePage },
    ...['/admin/orders', '/admin/products', '/admin/package/packages'].map(path => ({ path, component: targetPreview })),
  ],
});
const languageUrl = new URL(location.href);
languageUrl.searchParams.set('locale', locale === 'zh' ? 'en' : 'zh');
const preview = defineComponent(() => () => h('main', { class: 'preview-frame' }, [
  h('header', { class: 'preview-header' }, [
    h('h1', [
      i18n.global.t('admin.coverage.title'),
      h('small', locale === 'zh' ? '本地预览 · 模拟数据' : 'Local preview · synthetic data'),
    ]),
    h('a', { href: languageUrl.href }, locale === 'zh' ? 'English' : '中文'),
  ]),
  h(AdminApp),
]));

createApp(preview).use(router).use(i18n).use(ElementPlus).mount('#app');
