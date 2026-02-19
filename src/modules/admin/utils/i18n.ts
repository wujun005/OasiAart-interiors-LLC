export const ADMIN_LANG_ZH = 'zh-CN';
export const ADMIN_LANG_EN = 'en';

export function resolveAdminNameLang(locale?: string) {
  return locale?.startsWith('en') ? ADMIN_LANG_EN : ADMIN_LANG_ZH;
}

export function pickI18nText(
  value: Record<string, unknown> | undefined | null,
  locale?: string,
  fallback = '',
) {
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const lang = resolveAdminNameLang(locale);
  const preferred =
    lang === ADMIN_LANG_EN
      ? [ADMIN_LANG_EN, 'en-US', ADMIN_LANG_ZH, 'zh']
      : [ADMIN_LANG_ZH, 'zh', ADMIN_LANG_EN, 'en-US'];

  for (const key of preferred) {
    const text = value[key];
    if (typeof text === 'string' && text.trim()) {
      return text.trim();
    }
  }

  const first = Object.values(value).find(
    (item) => typeof item === 'string' && item.trim(),
  );
  return typeof first === 'string' ? first.trim() : fallback;
}
