import http from '@/modules/admin/utils/request';

// 订单 /api/orderHeader/page
export function page(payload: any) {
  return http.post('/api/orderHeader/page', payload);
}

// /api/orderHeader/detail 订单详情
export function detail(orderId: number) {
  return http.get('/api/orderHeader/detail', {
    params: { orderId },
  });
}

// /api/orderHeader/updateAdminRemark 订单备注
export function updateAdminRemark(payload: any) {
  return http.post('/api/orderHeader/updateAdminRemark', payload);
}

// /api/orderHeader/updateStatus 修改订单状态
export function updateOrderStatus(payload: { orderId: number; orderStatus: number }) {
  return http.post('/api/orderHeader/updateStatus', payload);
}

// /api/orderHeader/stripeRefund 管理端执行 Stripe 退款
export function stripeRefund(payload: { orderId: number }) {
  return http.post('/api/orderHeader/stripeRefund', payload);
}

// 供应商下拉查询（订单分配弹窗）
export function querySuppliers(payload: any) {
  return http.post('/api/supplier/query', payload);
}

// 保存订单供应商
export function assignSupplier(payload: any) {
  return http.post('/api/orderHeader/assignSupplier', payload);
}

// 导出订单 Excel
export function exportOrders(payload: any) {
  return http.post('/api/orderHeader/export', payload, {
    responseType: 'blob',
    timeout: 60_000,
  });
}

export default {
  page,
  detail,
  updateAdminRemark,
  updateOrderStatus,
  stripeRefund,
  querySuppliers,
  assignSupplier,
  exportOrders,
};
