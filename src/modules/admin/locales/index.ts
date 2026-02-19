import zh from './zh';
import en from './en';

export const ADMIN_LOCALE_STORAGE_KEY = 'admin-locale';
export const ADMIN_DEFAULT_LOCALE = 'zh';

export const adminMessages = {
  zh,
  en,
};

export type AdminLocale = keyof typeof adminMessages;

export function getAdminLocale(): AdminLocale {
  const saved = localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') {
    return saved;
  }
  return ADMIN_DEFAULT_LOCALE;
}
