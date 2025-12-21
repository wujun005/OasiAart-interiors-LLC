import axios, { AxiosError, type AxiosInstance } from 'axios';

type TokenGetter = () => string | null | undefined;

export interface ApiEnvelope<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

let getToken: TokenGetter = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export function setTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

function isApiEnvelope(value: unknown): value is ApiEnvelope {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Record<string, unknown>;
  return typeof maybe.code === 'number';
}

function normalizeAxiosError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;
    const serverMessage =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.msg ||
      axiosError.message;
    return Object.assign(new Error(serverMessage || `Request failed (${status ?? 'network'})`), {
      status,
      data: axiosError.response?.data,
      cause: error,
    });
  }
  return error instanceof Error ? error : new Error('Unknown request error');
}

export function createHttpClient(overrides?: {
  baseURL?: string;
  timeout?: number;
}): AxiosInstance {
  const instance = axios.create({
    baseURL: overrides?.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: overrides?.timeout ?? 20_000,
  });

  instance.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      const payload = response.data;
      if (isApiEnvelope(payload)) {
        const ok = payload.code === 0 || payload.code === 200;
        if (!ok) {
          throw Object.assign(new Error(payload.message || 'Request failed'), {
            code: payload.code,
            data: payload,
          });
        }
        return payload.data;
      }
      return payload;
    },
    (error) => Promise.reject(normalizeAxiosError(error)),
  );

  return instance;
}

export const http = createHttpClient();
export default http;

