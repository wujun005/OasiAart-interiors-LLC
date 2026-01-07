import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Vant from 'vant'
import 'vant/lib/index.css'
import './style/index.scss'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import messages, { defaultLocale } from './locales'

const savedLocale = localStorage.getItem('h5-locale') || defaultLocale
const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: defaultLocale,
  messages,
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(Vant)
app.use(i18n)
app.mount('#app')
