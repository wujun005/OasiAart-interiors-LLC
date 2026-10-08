import http from '@/modules/admin/utils/request';

export function onboardingPage(payload: Record<string, unknown> = {}) {
  return http.post('/api/supplier/onboarding/page', payload);
}

export function onboardingDetail(id: number | string) {
  return http.get(`/api/supplier/onboarding/detail/${id}`);
}

export function onboardingSave(payload: Record<string, unknown>) {
  return http.post('/api/supplier/onboarding/addOrUpdate', payload);
}

export function onboardingMine() {
  return http.get('/api/supplier/onboarding/mine');
}

export function onboardingResubmit(payload: Record<string, unknown>) {
  return http.post('/api/supplier/onboarding/resubmit', payload);
}

export function onboardingChangeStatus(payload: Record<string, unknown>) {
  return http.post('/api/supplier/onboarding/changeStatus', payload);
}

export function platformSupplierQuotePage(payload: Record<string, unknown>) {
  return http.post('/api/platform/supplierQuote/page', payload);
}

export function platformSupplierQuoteServices(supplierId: number | string) {
  return http.get('/api/platform/supplierQuote/services', { params: { supplierId } });
}

export function platformSupplierQuoteSkus(supplierId: number | string, spuId: number | string) {
  return http.get('/api/platform/supplierQuote/skus', { params: { supplierId, spuId } });
}

export function platformSupplierQuoteReview(payload: Record<string, unknown>) {
  return http.post('/api/platform/supplierQuote/review', payload);
}

export type ReviewNoticeItem = {
  kind?: string
  bizId?: number
  supplierId?: number
  spuId?: number
  supplierNo?: string
  supplierName?: string
  title?: string
  titleEn?: string
  status?: number
  submitTime?: string
  reviewTime?: string
  reviewerName?: string
}

export async function platformReviewNotice() {
  const raw = await http.get('/api/platform/reviewNotice') as {
    pending?: ReviewNoticeItem[]
    records?: ReviewNoticeItem[]
    data?: { pending?: ReviewNoticeItem[]; records?: ReviewNoticeItem[] }
  }
  const board = raw && typeof raw === 'object' && raw.data && !Array.isArray(raw.data) ? raw.data : raw
  return {
    pending: Array.isArray(board?.pending) ? board.pending : [],
    records: Array.isArray(board?.records) ? board.records : [],
  }
}

export function serviceCatalog(supplierId?: number | string) {
  return http.get('/api/supplier/tools/services', {
    params: supplierId ? { supplierId } : {},
  });
}

export function saveServices(payload: Record<string, unknown>) {
  return http.post('/api/supplier/tools/services/save', payload);
}

export function quoteList(supplierId: number | string) {
  return http.get('/api/supplier/tools/quotes', { params: { supplierId } });
}

export function saveQuoteDraft(payload: Record<string, unknown>) {
  return http.post('/api/supplier/tools/quotes/draft', payload);
}

export function submitQuote(payload: Record<string, unknown>) {
  return http.post('/api/supplier/tools/quotes/submit', payload);
}

export function serviceAreaList(payload: Record<string, unknown> = { status: 1 }) {
  return http.post('/api/platform/serviceArea/list', payload);
}

export function serviceCommunityPage(payload: Record<string, unknown>) {
  return http.post('/api/platform/serviceArea/community/page', payload);
}

export function supplierOrderPage(payload: Record<string, unknown>) {
  return http.post('/api/orderHeader/supplier/page', payload);
}

export function supplierAssignedOrders(payload: Record<string, unknown> = {}) {
  return http.post('/api/orderHeader/supplier/mine', payload);
}

export function supplierAssignedOrderDetail(orderId: number) {
  return http.get('/api/orderHeader/supplier/detail', { params: { orderId } });
}

export function supplierEventPage(payload: Record<string, unknown> = {}) {
  return http.post('/api/supplier/event/page', payload);
}

export function supplierEventSave(payload: Record<string, unknown>) {
  return http.post('/api/supplier/event/save', payload);
}

export function supplierChangeAcceptDispatch(payload: { id: number; acceptDispatch: 0 | 1 }) {
  return http.post('/api/supplier/changeAcceptDispatch', payload);
}

export function supplierChangeAcceptOrder(payload: { supplierId: number; spuId: number; acceptOrder: 0 | 1 }) {
  return http.post('/api/supplier/tools/services/changeAcceptOrder', payload);
}

export function supplierDepart(payload: { orderId: number }) {
  return http.post('/api/orderHeader/supplier/depart', payload);
}

export function supplierArrive(payload: { orderId: number; photos?: string[]; remark?: string | null }) {
  return http.post('/api/orderHeader/supplier/arrive', payload);
}

export function supplierComplete(payload: { orderId: number; photos?: string[]; remark?: string | null }) {
  return http.post('/api/orderHeader/supplier/complete', payload);
}

export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/api/file/upload', formData);
}
