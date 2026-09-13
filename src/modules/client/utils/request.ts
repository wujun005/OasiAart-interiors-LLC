import {
  createHttpClient,
  setTokenGetter,
  type ApiEnvelope,
} from '@/utils/request';
import { getClientLocale } from '@/modules/client/locales';
import {
  clearStoredAuthState,
  getClientAuthStorageValue,
} from '@/utils/auth-state';

const http = createHttpClient({
  baseURL: import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api',
  auth: {
    getToken: () => getClientAuthStorageValue('token'),
    getExpiresAt: () => getClientAuthStorageValue('expiresAt'),
    clearAuth: clearStoredAuthState,
    loginPath: '/login',
  },
});
http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers.language = getClientLocale();
  console.log('import.meta.env.VITE_CLIENT_API_BASE_URL', import.meta.env.VITE_CLIENT_API_BASE_URL)
  return config;
});

export { http, createHttpClient, setTokenGetter };
export type { ApiEnvelope };
export default http;
