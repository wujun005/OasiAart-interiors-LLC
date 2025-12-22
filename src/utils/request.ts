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

// 处理错误，主要是用来处理axios请求错误
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

// 检查 token 是否过期
function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('expiresAt');
  if (expiresAt && Date.now() > parseInt(expiresAt)) {
    // 如果 token 过期
    return true;
  }
  return false;
}

// 处理 axios 请求
export function createHttpClient(overrides?: {
  baseURL?: string;
  timeout?: number;
}): AxiosInstance {
  const instance = axios.create({
    baseURL: overrides?.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: overrides?.timeout ?? 20_000,
  });

  // 请求拦截器：每次请求前检查 token 是否过期，若过期则清理并跳转到登录
  instance.interceptors.request.use((config) => {
    if (isTokenExpired()) {
      // 清理 localStorage 中的 token 等信息
      localStorage.clear();
      // 跳转到登录页
      window.location.href = '/login'; // 假设你的登录页面路径是 `/login`
      return Promise.reject('Token expired');
    }

    const token = getToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // 响应拦截器：统一处理 API 返回的结果
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
    (error) => {
      // 如果是 token 过期错误，直接清除 token 并跳转
      if (error.message === 'Token expired') {
        localStorage.clear();
        window.location.href = '/login'; // 跳转到登录页
      }
      return Promise.reject(normalizeAxiosError(error));
    }
  );

  return instance;
}

// 创建 http 客户端实例
export const http = createHttpClient();
export default http;
