import { defineStore } from 'pinia';

const STORAGE_KEY = 'client-locale';

export const useLocaleStore = defineStore('client-locale', {
  state: () => ({
    locale: (localStorage.getItem(STORAGE_KEY) as string) || 'zh',
  }),
  actions: {
    setLocale(lang: string) {
      this.locale = lang;
      localStorage.setItem(STORAGE_KEY, lang);
    },
  },
});
