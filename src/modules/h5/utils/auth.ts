import {
  clearStoredAuthState,
  setClientAuthStorageValue,
} from '@/utils/auth-state';

export const H5_COUNTRY_CODE_OPTIONS = [
  { value: '+971', labelEn: 'UAE +971', labelZh: '阿联酋 +971' },
  { value: '+966', labelEn: 'Saudi Arabia +966', labelZh: '沙特阿拉伯 +966' },
  { value: '+1', labelEn: 'United States +1', labelZh: '美国 +1' },
  { value: '+44', labelEn: 'United Kingdom +44', labelZh: '英国 +44' },
  { value: '+91', labelEn: 'India +91', labelZh: '印度 +91' },
  { value: '+86', labelEn: 'China +86', labelZh: '中国 +86' },
] as const;

export const DEFAULT_H5_COUNTRY_CODE = '+971';

export const normalizePhoneNumber = (value: string) => value.replace(/[^\d]/g, '');

export const buildFullPhone = (countryCode: string, phone: string) =>
  `${countryCode}${normalizePhoneNumber(phone)}`;

export const openClientLegalPage = (path: '/terms' | '/privacy') => {
  window.location.assign(path);
};

export const saveClientToken = (raw: any, account?: string, extra?: { email?: string; phone?: string }) => {
  const payload = raw?.data ?? raw ?? {};
  const token = payload?.token || payload?.accessToken;
  if (!token) {
    return false;
  }
  clearStoredAuthState();
  setClientAuthStorageValue('token', token);
  if (payload?.tokenType) {
    setClientAuthStorageValue('tokenType', payload.tokenType);
  }
  if (payload?.expiresIn !== undefined && payload?.expiresIn !== null) {
    const expiresAt = Date.now() + Number(payload.expiresIn);
    setClientAuthStorageValue('expiresAt', expiresAt);
  }
  if (payload?.userId !== undefined && payload?.userId !== null) {
    setClientAuthStorageValue('userId', payload.userId);
  }
  if (payload?.username) {
    setClientAuthStorageValue('username', payload.username);
  }
  if (payload?.userType) {
    setClientAuthStorageValue('userType', payload.userType);
  }
  const resolvedAccount = account?.trim() || payload?.username || '';
  if (resolvedAccount) {
    setClientAuthStorageValue('account', resolvedAccount);
  }
  if (extra?.email) {
    setClientAuthStorageValue('email', extra.email);
  }
  if (extra?.phone) {
    setClientAuthStorageValue('phone', extra.phone);
  }
  if (!extra?.email && !extra?.phone && resolvedAccount) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedAccount)) {
      setClientAuthStorageValue('email', resolvedAccount);
    } else if (/^\+?[\d\s()-]+$/.test(resolvedAccount) && resolvedAccount.replace(/\D/g, '').length >= 7) {
      setClientAuthStorageValue('phone', resolvedAccount);
    }
  }
  return true;
};
