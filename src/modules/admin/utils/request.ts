import {
  createHttpClient,
  setTokenGetter,
  type ApiEnvelope,
} from '@/utils/request';
import { getAdminLocale } from '@/modules/admin/locales';
import {
  clearAdminAuthState,
  getAdminAuthStorageValue,
} from '@/utils/auth-state';

const http = createHttpClient({
  baseURL: `${import.meta.env.VITE_ADMIN_API_BASE_URL}/api` || '',
  auth: {
    getToken: () => getAdminAuthStorageValue('token'),
    getExpiresAt: () => getAdminAuthStorageValue('expiresAt'),
    clearAuth: clearAdminAuthState,
    loginPath: '/admin/login',
  },
});

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers.language = getAdminLocale();
  return config;
});

export { http, createHttpClient, setTokenGetter };
export type { ApiEnvelope };
export default http;
