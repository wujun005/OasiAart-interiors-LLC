import {
  createHttpClient,
  setTokenGetter,
  type ApiEnvelope,
} from '@/utils/request';
import { getClientLocale } from '@/modules/client/locales';

const http = createHttpClient({
  baseURL: import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api',
});

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers.language = getClientLocale();
  return config;
});

export { http, createHttpClient, setTokenGetter };
export type { ApiEnvelope };
export default http;
