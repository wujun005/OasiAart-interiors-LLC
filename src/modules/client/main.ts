import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@/modules/client/style/index.scss';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createI18n } from 'vue-i18n'
import messages from './locales'

const i18n = createI18n({
  legacy: false, 
  locale: 'zh',
  messages,
})
console.log('client');
const app = createApp(App);
app.use(router);
app.use(ElementPlus)
app.use(i18n)
app.mount('#app');
