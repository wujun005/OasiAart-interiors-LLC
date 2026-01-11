import axios from 'axios';

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
    // 直接返回响应数据
    return response.data;
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
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default http;
export { http };
