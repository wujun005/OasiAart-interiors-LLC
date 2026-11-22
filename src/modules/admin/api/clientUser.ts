import http from '@/modules/admin/utils/request';

export function registrationTrend(params?: { startDate?: string; endDate?: string }) {
  return http.get('/api/platform/clientUser/registrationTrend', { params });
}

export type CustomerSummary = {
  totalCustomerCount?: number;
  monthNewCount?: number;
  month?: number;
  orderedCustomerCount?: number;
};

export type CustomerRow = {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  registerTime?: string;
  orderCount?: number;
  paidOrderCount?: number;
  paidAmount?: number | string;
  lastOrderTime?: string;
  ordered?: boolean;
  newCustomer?: boolean;
  whatsappReachable?: number;
  whatsappReachableI18n?: Record<string, string>;
};

export type CustomerPage = {
  summary?: CustomerSummary;
  list?: CustomerRow[];
  total?: number;
  pageNum?: number;
  pageSize?: number;
  totalPages?: number;
};

export type CustomerPageQuery = {
  pageNum: number;
  pageSize: number;
  name?: string;
  phone?: string;
  email?: string;
  registerStart?: string;
  registerEnd?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

/** 成功响应没有数字 code 时，请求库不会拆包，列表在 data 里。 */
function unwrapCustomerPage(payload: unknown): CustomerPage {
  const root = asRecord(payload) || {};
  const nested = asRecord(root.data);
  const source = Array.isArray(root.list) || Array.isArray(root.records) ? root : nested || root;
  const list = source.list ?? source.records;
  return {
    summary: asRecord(source.summary) as CustomerSummary | undefined,
    list: Array.isArray(list) ? list as CustomerRow[] : [],
    total: Number(source.total || 0),
    pageNum: Number(source.pageNum || 0),
    pageSize: Number(source.pageSize || 0),
    totalPages: Number(source.totalPages || 0),
  };
}

export function pageCustomers(query: CustomerPageQuery) {
  return http.post('/api/platform/customer/page', query).then(unwrapCustomerPage);
}
