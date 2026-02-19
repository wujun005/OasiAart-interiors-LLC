import {
  createHttpClient,
  setTokenGetter,
  type ApiEnvelope,
} from '@/utils/request';

const http = createHttpClient({
  baseURL: import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api',
});

export { http, createHttpClient, setTokenGetter };
export type { ApiEnvelope };
export default http;
