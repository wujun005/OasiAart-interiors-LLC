import {
  createHttpClient,
  setTokenGetter,
  type ApiEnvelope,
} from '@/utils/request';
import { getAdminLocale } from '@/modules/admin/locales';

const http = createHttpClient({
  baseURL: `${import.meta.env.VITE_ADMIN_API_BASE_URL}/api` || '',
});

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers.language = getAdminLocale();
  return config;
});

export { http, createHttpClient, setTokenGetter };
export type { ApiEnvelope };
export default http;
