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

const AUTH_STORAGE_KEYS = [
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

export const getStoredAuthSnapshot = (): StoredAuthSnapshot => {
  const token = getLocalStorageValue('token');
  const expiresAt = getLocalStorageValue('expiresAt');
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
      username: getLocalStorageValue('username') || undefined,
      userId: getLocalStorageValue('userId') || undefined,
      email: getLocalStorageValue('email') || undefined,
      phone: getLocalStorageValue('phone') || undefined,
    },
  };
};

export const clearStoredAuthState = () => {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore localStorage clear failures in non-browser environments.
  }
};
