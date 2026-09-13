export interface StoredUserInfo {
  email?: string;
  phone?: string;
  username?: string;
  userId?: string;
}

export interface StoredAuthSnapshot {
  hasToken: boolean;
  isExpired: boolean;
  isLoggedIn: boolean;
  token?: string;
  expiresAt?: string;
  userInfo: StoredUserInfo;
}

export const CLIENT_AUTH_STORAGE_KEYS = {
  token: 'hourx.client.token',
  tokenType: 'hourx.client.tokenType',
  userId: 'hourx.client.userId',
  username: 'hourx.client.username',
  userType: 'hourx.client.userType',
  expiresAt: 'hourx.client.expiresAt',
  email: 'hourx.client.email',
  phone: 'hourx.client.phone',
  account: 'hourx.client.account',
} as const;

export const ADMIN_AUTH_STORAGE_KEYS = {
  token: 'hourx.admin.token',
  tokenType: 'hourx.admin.tokenType',
  userId: 'hourx.admin.userId',
  username: 'hourx.admin.username',
  userType: 'hourx.admin.userType',
  expiresAt: 'hourx.admin.expiresAt',
  email: 'hourx.admin.email',
  phone: 'hourx.admin.phone',
  account: 'hourx.admin.account',
} as const;

type AuthStorageField = keyof typeof CLIENT_AUTH_STORAGE_KEYS;
type AuthStorageScope = 'client' | 'admin';

const storageKeysByScope = {
  client: CLIENT_AUTH_STORAGE_KEYS,
  admin: ADMIN_AUTH_STORAGE_KEYS,
} as const;

const LEGACY_AUTH_STORAGE_KEYS = [
  'token',
  'tokenType',
  'userId',
  'username',
  'userType',
  'expiresAt',
  'email',
  'phone',
  'account',
] as const;

const getLocalStorageValue = (key: string): string => {
  try {
    return localStorage.getItem(key)?.trim() || '';
  } catch {
    return '';
  }
};

const getScopedAuthStorageValue = (
  scope: AuthStorageScope,
  field: AuthStorageField,
) => getLocalStorageValue(storageKeysByScope[scope][field]);

const setScopedAuthStorageValue = (
  scope: AuthStorageScope,
  field: AuthStorageField,
  value: unknown,
) => {
  try {
    const normalized = String(value ?? '').trim();
    const key = storageKeysByScope[scope][field];
    if (normalized) localStorage.setItem(key, normalized);
    else localStorage.removeItem(key);
  } catch {
    // Ignore localStorage failures in non-browser environments.
  }
};

const getAuthSnapshot = (scope: AuthStorageScope): StoredAuthSnapshot => {
  const token = getScopedAuthStorageValue(scope, 'token');
  const expiresAt = getScopedAuthStorageValue(scope, 'expiresAt');
  const expiresAtNumber = Number(expiresAt);
  const hasFiniteExpiresAt = expiresAt !== '' && Number.isFinite(expiresAtNumber);
  const isExpired = hasFiniteExpiresAt ? Date.now() >= expiresAtNumber : false;
  const hasToken = token !== '';

  return {
    hasToken,
    isExpired,
    isLoggedIn: hasToken && !isExpired,
    token: token || undefined,
    expiresAt: expiresAt || undefined,
    userInfo: {
      username: getScopedAuthStorageValue(scope, 'username') || undefined,
      userId: getScopedAuthStorageValue(scope, 'userId') || undefined,
      email: getScopedAuthStorageValue(scope, 'email') || undefined,
      phone: getScopedAuthStorageValue(scope, 'phone') || undefined,
    },
  };
};

const clearAuthState = (scope: AuthStorageScope) => {
  try {
    Object.values(storageKeysByScope[scope]).forEach((key) =>
      localStorage.removeItem(key),
    );
  } catch {
    // Ignore localStorage clear failures in non-browser environments.
  }
};

export const getStoredAuthSnapshot = () => getAuthSnapshot('client');
export const clearStoredAuthState = () => clearAuthState('client');
export const getClientAuthStorageValue = (field: AuthStorageField) =>
  getScopedAuthStorageValue('client', field);
export const setClientAuthStorageValue = (
  field: AuthStorageField,
  value: unknown,
) => setScopedAuthStorageValue('client', field, value);

export const getAdminAuthSnapshot = () => getAuthSnapshot('admin');
export const clearAdminAuthState = () => clearAuthState('admin');
export const getAdminAuthStorageValue = (field: AuthStorageField) =>
  getScopedAuthStorageValue('admin', field);
export const setAdminAuthStorageValue = (
  field: AuthStorageField,
  value: unknown,
) => setScopedAuthStorageValue('admin', field, value);

export const clearLegacyAuthState = () => {
  try {
    LEGACY_AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore localStorage clear failures in non-browser environments.
  }
};
