import http from '@/modules/client/utils/request';

export interface PasswordLoginPayload {
  account: string;
  password: string;
  username?: string;
  phoneOrEmail?: string;
}

export interface VerifyCodeLoginPayload {
  account: string;
  code?: string;
  verifyCode?: string;
  phoneOrEmail?: string;
}

export interface RegisterPayload {
  phone?: string;
  email?: string;
  password?: string;
  code?: string;
  smsCode?: string;
  verifyCode?: string;
}

export interface SendCodePayload {
  account?: string;
  phone?: string;
  email?: string;
  phoneOrEmail?: string;
}

export interface ChangePasswordByOldPayload {
  account: string;
  oldPassword: string;
  newPassword: string;
}

// 发送注册验证码 /api/client/auth/sendRegisterCode
export function register(payload: SendCodePayload) {
  return http.post('/api/client/auth/sendRegisterCode', payload);
}

// 更语义化的别名，便于页面调用
export const sendRegisterCode = register;

// 发送验证码 /api/client/auth/sendCode
export function sendCode(payload: SendCodePayload) {
  return http.post('/api/client/auth/sendCode', payload);
}

// 用户注册 /api/client/auth/registerByEmailPhone
export function registerByEmailPhone(payload: RegisterPayload) {
  return http.post('/api/client/auth/registerByEmailPhone', payload);
}

// 客户端账号密码登录 /api/client/auth/login
export function login(payload: PasswordLoginPayload) {
  return http.post('/api/client/auth/login', payload);
}

export const loginByPassword = login;

// 验证码登录 /api/client/auth/loginByVerifyCode
export function loginByVerifyCode(payload: VerifyCodeLoginPayload) {
  return http.post('/api/client/auth/loginByVerifyCode', payload);
}

export function changePasswordByOld(payload: ChangePasswordByOldPayload) {
  return http.post('/api/client/auth/changePasswordByOld', payload);
}

export default {
  register,
  sendRegisterCode,
  sendCode,
  registerByEmailPhone,
  login,
  loginByPassword,
  loginByVerifyCode,
  changePasswordByOld,
};
