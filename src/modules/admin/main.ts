import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@/modules/client/style/index.scss';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createI18n } from 'vue-i18n'
import messages from '@/modules/client/locales'
const i18n = createI18n({
  legacy: false, 
  locale: 'zh',
  messages,
})
console.log('admin');
const app = createApp(App);
app.use(router);
app.use(i18n)
app.use(ElementPlus);
app.mount('#app');
