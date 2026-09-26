import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus, { ElSelect } from 'element-plus';
import 'element-plus/dist/index.css';
import '@/modules/admin/style/index.scss';
import { createI18n } from 'vue-i18n';
import {
  adminMessages,
  getAdminLocale,
} from '@/modules/admin/locales';
import { loadAdminMenuPermissions } from '@/modules/admin/utils/menuPermission';
import {
  clearAdminAuthState,
  clearLegacyAuthState,
  getAdminAuthSnapshot,
} from '@/utils/auth-state';

const locale = getAdminLocale();
const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: adminMessages,
});

document.documentElement.lang = locale;

const selectProps = ElSelect.props as Record<string, any>;
const filterableProp = selectProps?.filterable;
if (filterableProp === Boolean) {
  selectProps.filterable = { type: Boolean, default: true };
} else if (filterableProp && typeof filterableProp === 'object') {
  filterableProp.default = true;
}

const bootstrap = async () => {
  clearLegacyAuthState();
  const auth = getAdminAuthSnapshot();
  if (auth.isExpired) clearAdminAuthState();
  if (auth.isLoggedIn) {
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
