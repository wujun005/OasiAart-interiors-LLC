import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@/modules/client/style/index.scss';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createI18n } from 'vue-i18n';
import {
  adminMessages,
  getAdminLocale,
} from '@/modules/admin/locales';
import { loadAdminMenuPermissions } from '@/modules/admin/utils/menuPermission';

const locale = getAdminLocale();
const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh',
  messages: adminMessages,
});

document.documentElement.lang = locale;

const bootstrap = async () => {
  if (localStorage.getItem('token')) {
    try {
      await loadAdminMenuPermissions();
    } catch (error) {
      console.error('Failed to initialize admin menu permissions:', error);
    }
  }

  const app = createApp(App);
  app.use(router);
  app.use(i18n);
  app.use(ElementPlus);
  app.mount('#app');
};

bootstrap();
