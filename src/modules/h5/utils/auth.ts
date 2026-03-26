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
  localStorage.setItem('token', String(token));
  if (payload?.tokenType) {
    localStorage.setItem('tokenType', String(payload.tokenType));
  }
  if (payload?.expiresIn !== undefined && payload?.expiresIn !== null) {
    const expiresAt = Date.now() + Number(payload.expiresIn);
    localStorage.setItem('expiresAt', String(expiresAt));
  }
  if (payload?.userId !== undefined && payload?.userId !== null) {
    localStorage.setItem('userId', String(payload.userId));
  }
  if (payload?.username) {
    localStorage.setItem('username', String(payload.username));
  }
  const resolvedAccount = account?.trim() || payload?.username || '';
  if (resolvedAccount) {
    localStorage.setItem('account', String(resolvedAccount));
  }
  if (extra?.email) {
    localStorage.setItem('email', extra.email);
  }
  if (extra?.phone) {
    localStorage.setItem('phone', extra.phone);
  }
  return true;
};
