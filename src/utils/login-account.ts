export const DEFAULT_LOGIN_COUNTRY_CODE = '+971';

export const LOGIN_COUNTRY_CODE_OPTIONS = [
  { label: 'UAE +971', value: '+971' },
  { label: 'Saudi Arabia +966', value: '+966' },
  { label: 'United States +1', value: '+1' },
  { label: 'United Kingdom +44', value: '+44' },
  { label: 'India +91', value: '+91' },
  { label: 'China +86', value: '+86' },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHAR_PATTERN = /^\+?[\d\s()-]+$/;

export const isEmailLoginAccount = (value: string) => value.trim().includes('@');

export const resolveLoginAccount = (value: string, countryCode: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue || EMAIL_PATTERN.test(trimmedValue) || !PHONE_CHAR_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  const digits = trimmedValue.replace(/\D/g, '');
  if (!digits) return trimmedValue;
  if (trimmedValue.startsWith('+')) return `+${digits}`;

  const countryDigits = countryCode.replace(/\D/g, '');
  if (digits.startsWith(countryDigits)) return `+${digits}`;

  return `${countryCode}${digits.replace(/^0+/, '')}`;
};
