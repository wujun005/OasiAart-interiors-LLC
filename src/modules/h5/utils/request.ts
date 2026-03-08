import axios from 'axios';

type ApiSuccessEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  msg?: string;
  data?: T;
  errorCode?: string | null;
};

function isApiSuccessEnvelope(value: unknown): value is ApiSuccessEnvelope {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Record<string, unknown>;
  return typeof maybe.success === 'boolean';
}

function getServerMessage(payload: unknown, fallback = 'Request failed'): string {
  if (payload && typeof payload === 'object') {
    const maybe = payload as Record<string, unknown>;
    if (typeof maybe.message === 'string' && maybe.message.trim()) return maybe.message;
    if (typeof maybe.msg === 'string' && maybe.msg.trim()) return maybe.msg;
  }
  return fallback;
}

// 创建 axios 实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (isApiSuccessEnvelope(payload) && !payload.success) {
      return Promise.reject(
        Object.assign(new Error(getServerMessage(payload)), {
          code: payload.errorCode || 'BUSINESS_ERROR',
          data: payload,
        }),
      );
    }
    return payload;
  },
  (error) => {
    // 处理错误
    if (error.response) {
      // 401 未授权，清除 token 并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        // 可以在这里触发路由跳转，但为了避免循环依赖，由调用方处理
      }
      const status = error.response.status;
      const serverMessage = getServerMessage(error.response.data, error.message);
      return Promise.reject(
        Object.assign(new Error(serverMessage || `Request failed (${status ?? 'network'})`), {
          status,
          data: error.response.data,
          cause: error,
        }),
      );
    }
    return Promise.reject(error instanceof Error ? error : new Error('Unknown request error'));
  }
);

export default http;
export { http };
