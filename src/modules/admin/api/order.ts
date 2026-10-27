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
  refundReason: string;
  refundReasonRemark?: string;
};

export type RefundReasonOption = {
  code: string;
  nameI18n?: Record<string, string>;
  remarkRequired?: boolean;
};

export type OrderOperationLog = {
  id: number;
  bizNo?: string;
  operatorName?: string;
  operatorType?: string;
  operationType?: string;
  operationTypeI18n?: Record<string, string>;
  operateTime?: string;
  contentI18n?: Record<string, string>;
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
  packageOrder?: boolean;
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

export function serviceTimeRanges() {
  return http.get('/api/orderHeader/serviceTimeRanges');
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

// /api/orderHeader/refund-reasons 管理端 Stripe 退款原因枚举
export async function getRefundReasons(): Promise<RefundReasonOption[]> {
  const response = await http.get('/api/orderHeader/refund-reasons');
  if (Array.isArray(response)) return response as RefundReasonOption[];
  const data = response && typeof response === 'object'
    ? (response as { data?: unknown }).data
    : null;
  return Array.isArray(data) ? data as RefundReasonOption[] : [];
}

// 供应商下拉查询（订单分配弹窗）
export function querySuppliers(payload: any) {
  return http.post('/api/supplier/query', payload);
}

// 整单更新供应商。页面传一个 ID，覆盖全部未完成服务及后续预约；空数组解除分配。
export function updateSupplier(payload: {
  orderId: number;
  supplierIds: Array<number | string>;
}) {
  return http.post('/api/orderHeader/updateSupplier', payload);
}

// 把供应商派到履约单。已在名单里的保留原进度，不会写成已接单。
// 只有一条未完成履约时可以不传 fulfillmentId，有多条时必传。
export function dispatchSupplier(payload: {
  orderId: number;
  fulfillmentId?: number;
  supplierIds: number[];
}) {
  return http.post('/api/orderHeader/dispatchSupplier', payload);
}

// /api/orderHeader/operationLogs 按订单号查询全链路操作记录
export async function operationLogs(orderNo: string): Promise<OrderOperationLog[]> {
  const response = await http.get('/api/orderHeader/operationLogs', {
    params: { orderNo },
  });
  if (Array.isArray(response)) return response as OrderOperationLog[];
  const data = response && typeof response === 'object'
    ? (response as { data?: unknown }).data
    : null;
  return Array.isArray(data) ? data as OrderOperationLog[] : [];
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
  getRefundReasons,
  operationLogs,
  querySuppliers,
  updateSupplier,
  dispatchSupplier,
  exportOrders,
};
