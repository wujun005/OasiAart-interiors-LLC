import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
console.log('client');
const app = createApp(App);
app.use(router);
app.mount('#app');
