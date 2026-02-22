import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@/modules/client/style/index.scss';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia';
import messages, { getClientLocale, setClientLocale } from './locales';

console.log('client', import.meta.env.VITE_CLIENT_API_PROXY_TARGET);

const locale = getClientLocale();
setClientLocale(locale);

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages,
});
console.log('client');
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(i18n);
app.mount('#app');
