import http from '@/modules/client/utils/request';

// 客户端用户注册
export function register(payload: any) {
  return http.post('/api/client/auth/register', payload);
}
// 发送验证码
export function sendSmsCode(payload: any) {
  return http.post('/api/client/auth/send-sms-code', payload);
}

// 客户端用户登录
export function login(payload: any) {
  return http.post('/api/client/auth/login', payload);
}

export default {
  register,
};
