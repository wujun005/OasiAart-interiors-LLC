import http from '../utils/request';

// ========== PayPal 支付相关接口 ==========

/**
 * 创建订单并拉起支付
 * @param payload 订单信息
 * @returns 支付跳转 URL
 */
export function createPaypalOrder(payload: any) {
  return http.post('/api/paypal/create-order-payment', payload);
}

/**
 * 支付成功回调
 * @param params 回调参数
 * @returns 订单信息
 */
export function paypalSuccessCallback(params?: any) {
  return http.get('/api/paypal/success-order', { params });
}

/**
 * 支付取消回调
 * @param params 回调参数
 * @returns 取消信息
 */
export function paypalCancelCallback(params?: any) {
  return http.get('/api/paypal/cancel', { params });
}

// ========== 订单相关接口 ==========

/**
 * 分页获取订单列表
 * @param params 分页参数
 * @returns 分页订单数据
 */
export function getOrderPage(params?: any) {
  return http.get('/api/order/page', { params });
}

/**
 * 获取订单详情
 * @param id 订单ID
 * @returns 订单详情
 */
export function getOrderDetail(id: string | number) {
  return http.get(`/api/order/${id}`);
}

export default {
  createPaypalOrder,
  paypalSuccessCallback,
  paypalCancelCallback,
  getOrderPage,
  getOrderDetail,
};
