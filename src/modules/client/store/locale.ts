import { defineStore } from 'pinia';
import {
  CLIENT_LOCALE_STORAGE_KEY,
  CLIENT_DEFAULT_LOCALE,
  setClientLocale,
} from '@/modules/client/locales';

const STORAGE_KEY = CLIENT_LOCALE_STORAGE_KEY;

export const useLocaleStore = defineStore('client-locale', {
  state: () => ({
    locale: (localStorage.getItem(STORAGE_KEY) as string) || CLIENT_DEFAULT_LOCALE,
  }),
  actions: {
    setLocale(lang: string) {
      this.locale = setClientLocale(lang);
    },
  },
});
