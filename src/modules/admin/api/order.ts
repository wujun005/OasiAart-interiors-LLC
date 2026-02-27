import http from '@/modules/admin/utils/request';

// 订单 /api/orderHeader/page
export function page(payload: any) {
  return http.post('/api/orderHeader/page', payload);
}

// /api/orderHeader/updateAdminRemark 订单备注
export function updateAdminRemark(payload: any) {
  return http.post('/api/orderHeader/updateAdminRemark', payload);
}

export default {
  page,
  updateAdminRemark,
};
