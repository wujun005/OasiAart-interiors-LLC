import http from '@/modules/admin/utils/request';

// 客户端用户登录
export function login(payload: any) {
  return http.post('/api/admin/auth/login', payload);
}

export default {
  login,
};
