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

// ========== 服务/商品相关接口 ==========

/**
 * 获取所有服务列表
 * @returns 服务列表
 */
export function getServicesList() {
  return http.get('/api/product/list');
}

/**
 * 分页获取服务
 * @param params 分页参数 { pageNum, pageSize, ... }
 * @returns 分页服务数据
 */
export function getServicesPage(params?: any) {
  return http.get('/api/product/page', { params });
}

/**
 * 获取服务详情
 * @param id 服务ID
 * @returns 服务详情
 */
export function getServiceDetail(id: string | number) {
  return http.get(`/api/product/${id}`);
}

export default {
  register,
  getServicesList,
  getServicesPage,
  getServiceDetail,
};
