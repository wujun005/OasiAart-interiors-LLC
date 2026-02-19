import {
  createHttpClient,
  setTokenGetter,
  type ApiEnvelope,
} from '@/utils/request';

const http = createHttpClient({
  baseURL: `${import.meta.env.VITE_ADMIN_API_BASE_URL}/api` || '',
});

export { http, createHttpClient, setTokenGetter };
export type { ApiEnvelope };
export default http;
