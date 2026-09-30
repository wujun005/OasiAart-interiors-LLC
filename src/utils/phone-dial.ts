export const DEFAULT_PHONE_DIAL = '+971';

export const PHONE_DIAL_OPTIONS = [
  { value: '+971', en: 'UAE', zh: '阿联酋' },
  { value: '+966', en: 'Saudi Arabia', zh: '沙特' },
  { value: '+1', en: 'United States', zh: '美国' },
  { value: '+44', en: 'United Kingdom', zh: '英国' },
  { value: '+91', en: 'India', zh: '印度' },
  { value: '+86', en: 'China', zh: '中国' },
] as const;

export type PhoneDialOption = (typeof PHONE_DIAL_OPTIONS)[number];

const dialDigits = [...PHONE_DIAL_OPTIONS]
  .map((item) => ({ value: item.value, digits: item.value.replace(/\D/g, '') }))
  .sort((left, right) => right.digits.length - left.digits.length);

export const phoneDialLabel = (option: PhoneDialOption, locale: string) =>
  `${locale.startsWith('zh') ? option.zh : option.en} ${option.value}`;

export const splitPhone = (value: unknown, fallback = DEFAULT_PHONE_DIAL) => {
  const compact = String(value || '').replace(/[\s()-]/g, '');
  const digits = compact.replace(/\D/g, '');
  if (!digits) return { code: fallback, local: '' };
  const international = compact.startsWith('+') || compact.startsWith('00');
  if (international) {
    const match = dialDigits.find((dial) => digits.startsWith(dial.digits) && digits.length > dial.digits.length);
    if (match) {
      return { code: match.value, local: digits.slice(match.digits.length).replace(/^0+/, '') };
    }
  }
  return { code: fallback, local: digits.replace(/^0+/, '') };
};

export const joinPhone = (code: string, local: string) => {
  const digits = local.replace(/\D/g, '').replace(/^0+/, '');
  const dial = code.startsWith('+') ? code : `+${code.replace(/\D/g, '')}`;
  return digits ? `${dial}${digits}` : '';
};

export const nationalNumberOk = (local: string) => /^[1-9]\d{5,14}$/.test(local.replace(/\D/g, ''));
