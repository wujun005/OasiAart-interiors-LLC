import http from '@/modules/admin/utils/request';

export type OrderAdminEditPayload = {
  orderId: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  serviceAddress?: string;
  building?: string;
  roomNo?: string;
  community?: string;
  remark?: string;
  serviceTime?: string;
  timeRange?: number;
};

export type OrderExportScope = 'CURRENT_PAGE' | 'ALL' | 'SERVICE_DATE';

export type OrderStripeRefundPayload = {
  orderId: number;
  refundAmount?: number;
  deductHandlingFee?: boolean;
};

export type OrderExportPayload = {
  orderNo?: string;
  orderId?: number;
  customerName?: string;
  userPhone?: string;
  contactPhone?: string;
  productName?: string;
  productIds?: number[];
  adminRemark?: string;
  orderStatus?: number;
  orderStatuses?: number[];
  paymentStatus?: number;
  paymentStatuses?: number[];
  pageNum?: number;
  pageSize?: number;
  serviceTimeStart?: string;
  serviceTimeEnd?: string;
  rescheduleFilter?:
    | 'UNPROCESSED'
    | 'PROCESSED'
    | 'RESCHEDULED'
    | 'NOT_RESCHEDULED'
    | 'ALL';
  rescheduled?: boolean;
  exportScope?: OrderExportScope;
  orderIds?: number[];
};

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

// /api/orderHeader/edit 编辑订单联系人、地址、服务时间和客户备注
export function edit(payload: OrderAdminEditPayload) {
  return http.post('/api/orderHeader/edit', payload);
}

// /api/orderHeader/updateAdminRemark 订单备注
export function updateAdminRemark(payload: any) {
  return http.post('/api/orderHeader/updateAdminRemark', payload);
}

// /api/orderHeader/updateStatus 修改订单状态
export function updateOrderStatus(payload: { orderId: number; orderStatus: number }) {
  return http.post('/api/orderHeader/updateStatus', payload);
}

// /api/orderHeader/stripeRefund 对 Stripe 已支付订单退回剩余可退金额
export function stripeRefund(payload: OrderStripeRefundPayload) {
  return http.post('/api/orderHeader/stripeRefund', payload);
}

// 供应商下拉查询（订单分配弹窗）
export function querySuppliers(payload: any) {
  return http.post('/api/supplier/query', payload);
}

// 更新订单供应商；supplierId 为空时解除分配
export function updateSupplier(payload: {
  orderId: number;
  supplierId?: number | string | null;
}) {
  return http.post('/api/orderHeader/updateSupplier', payload);
}

// 导出订单 Excel
export function exportOrders(payload: OrderExportPayload) {
  return http.post('/api/orderHeader/export', payload, {
    responseType: 'blob',
    timeout: 60_000,
  });
}

export default {
  page,
  detail,
  edit,
  updateAdminRemark,
  updateOrderStatus,
  stripeRefund,
  querySuppliers,
  updateSupplier,
  exportOrders,
};
