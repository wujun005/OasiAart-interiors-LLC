const CLIENT_LOCALE_STORAGE_KEY = 'client-locale';
const CLIENT_DEFAULT_LOCALE = 'en';

const getStoredClientLocale = () => {
  if (typeof window === 'undefined') {
    return CLIENT_DEFAULT_LOCALE;
  }
  const stored = localStorage.getItem(CLIENT_LOCALE_STORAGE_KEY) || '';
  return stored.startsWith('zh') ? 'zh' : 'en';
};

const getH5RedirectPath = () => {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  if (
    path !== '/'
    && path !== '/login'
    && path !== '/register'
    && path !== '/profile'
    && path !== '/services/daily-cleaning'
    && path !== '/orders'
    && path !== '/orders/confirm'
    && !path.startsWith('/services/detail/')
  ) {
    return '';
  }
  const ua = navigator.userAgent || '';
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isNarrowViewport = window.innerWidth <= 768;
  if (!(isMobileUa || isNarrowViewport)) return '';
  if (path.startsWith('/services/detail/')) {
    return `/h5/#${path}`;
  }
  if (path === '/login') {
    return '/h5/#/login';
  }
  if (path === '/register') {
    return '/h5/#/register';
  }
  if (path === '/profile') {
    return '/h5/#/profile';
  }
  if (path === '/orders/confirm') {
    return '/h5/#/orders/confirm';
  }
  if (path === '/orders') {
    return '/h5/#/orders';
  }
  return path === '/services/daily-cleaning' ? '/h5/#/services/daily-cleaning' : '/h5/#/';
};

const redirectToH5IfNeeded = () => {
  const h5RedirectPath = getH5RedirectPath();
  if (!h5RedirectPath) {
    return false;
  }
  localStorage.setItem('h5-locale', getStoredClientLocale());
  window.location.replace(`${h5RedirectPath}${window.location.search}${window.location.hash}`);
  return true;
};

const bootstrapClientApp = async () => {
  const [
    { createApp },
    { createI18n },
    { createPinia },
    { default: ElementPlus },
    { default: App },
    { default: router },
    localeModule,
  ] = await Promise.all([
    import('vue'),
    import('vue-i18n'),
    import('pinia'),
    import('element-plus'),
    import('./App.vue'),
    import('./router'),
    import('./locales'),
    import('@/modules/client/style/index.scss'),
    import('element-plus/dist/index.css'),
  ]);

  const locale = localeModule.getClientLocale();
  localeModule.setClientLocale(locale);

  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: localeModule.default,
  });

  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);
  app.use(i18n);
  app.mount('#app');
};

if (!redirectToH5IfNeeded()) {
  void bootstrapClientApp();
}
