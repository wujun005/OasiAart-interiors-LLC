import clientMessages, { CLIENT_DEFAULT_LOCALE } from '@/modules/client/locales';
import zh from './zh';
import en from './en';

export const defaultLocale = CLIENT_DEFAULT_LOCALE;

export default {
  zh: {
    ...(clientMessages.zh || {}),
    h5: zh,
  },
  en: {
    ...(clientMessages.en || {}),
    h5: en,
  },
};
