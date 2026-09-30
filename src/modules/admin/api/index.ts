import http from '@/modules/admin/utils/request';

// 客户端用户登录
export function login(payload: any) {
  return http.post('/api/admin/auth/login', payload);
}

export function sendAdminVerifyCode(phone: string) {
  return http.post('/api/admin/auth/sendCode', { phone });
}

export function loginAdminByCode(payload: { phone: string; code: string }) {
  return http.post('/api/admin/auth/loginByCode', payload);
}

export function resetAdminPassword(payload: { phone: string; verifyCode: string; newPassword: string }) {
  return http.post('/api/admin/auth/reset-password', payload);
}

export default {
  login,
};
