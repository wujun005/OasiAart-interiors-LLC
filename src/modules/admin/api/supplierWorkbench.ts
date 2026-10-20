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

export function saveServiceContacts(payload: {
  supplierId: number;
  services: Array<{ spuId: number; workerCount: number; contactPhones: string[] }>;
}) {
  return http.post('/api/supplier/tools/services/contacts', payload);
}

export function quoteList(supplierId: number | string) {
  return http.get('/api/supplier/tools/quotes', { params: { supplierId } });
}

export function saveQuoteDraft(payload: Record<string, unknown>) {
  return http.post('/api/supplier/tools/quotes/draft', payload);
}

export function exportQuoteSheet() {
  return http.get('/api/supplier/tools/quotes/export', { responseType: 'blob' });
}

export function importQuoteSheet(file: File) {
  const body = new FormData();
  body.append('file', file);
  return http.post('/api/supplier/tools/quotes/import', body);
}

export function submitQuote(payload: Record<string, unknown>) {
  return http.post('/api/supplier/tools/quotes/submit', payload);
}

export function applyQuotePriceChange(payload: { supplierId: number; spuId: number; reason: string }) {
  return http.post('/api/supplier/tools/quotes/priceChange/apply', payload);
}

export function reviewQuotePriceChange(payload: { supplierId: number; spuId: number; status: 2 | 3; rejectReason?: string }) {
  return http.post('/api/platform/supplierQuote/priceChange/review', payload);
}

export function exportPlatformQuoteSheet(supplierId: number) {
  return http.get('/api/platform/supplierQuote/quotes/export', {
    params: { supplierId },
    responseType: 'blob',
  });
}

export function importPlatformQuoteSheet(supplierId: number, file: File) {
  const body = new FormData();
  body.append('supplierId', String(supplierId));
  body.append('file', file);
  return http.post('/api/platform/supplierQuote/quotes/import', body);
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

export function supplierAssignedOrderDetail(orderId: number, fulfillmentId?: number) {
  return http.get('/api/orderHeader/supplier/detail', {
    params: {
      orderId,
      ...(fulfillmentId ? { fulfillmentId } : {}),
    },
  });
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

/** Operational settings are independent of the immutable onboarding review snapshot. */
export function supplierOperationsMine() {
  return http.get('/api/supplier/operations/mine');
}

export function supplierCoverageSave(payload: { supplierId: number; areaIds: number[]; communityIds: number[] }) {
  return http.post('/api/supplier/operations/coverage/save', payload);
}

export function supplierChangeAcceptOrder(payload: { supplierId: number; spuId: number; acceptOrder: 0 | 1 }) {
  return http.post('/api/supplier/tools/services/changeAcceptOrder', payload);
}

export function supplierAccept(payload: { orderId: number; fulfillmentId?: number }) {
  return http.post('/api/orderHeader/supplier/accept', payload);
}

export function supplierReject(payload: { orderId: number; fulfillmentId?: number; rejectReason?: string }) {
  return http.post('/api/orderHeader/supplier/reject', payload);
}

export function assignOrderStaff(payload: { orderId: number; fulfillmentId?: number; staffUserIds: number[] }) {
  return http.post('/api/orderHeader/supplier/assignStaff', payload);
}

export function supplierDepart(payload: { orderId: number; fulfillmentId?: number }) {
  return http.post('/api/orderHeader/supplier/depart', payload);
}

export function supplierArrive(payload: { orderId: number; fulfillmentId?: number; photos?: string[]; remark?: string | null }) {
  return http.post('/api/orderHeader/supplier/arrive', payload);
}

export function supplierComplete(payload: { orderId: number; fulfillmentId?: number; photos?: string[]; remark?: string | null }) {
  return http.post('/api/orderHeader/supplier/complete', payload);
}

export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/api/file/upload', formData);
}

export function supplierStaffPage(payload: { pageNum?: number; pageSize?: number; keyword?: string } = {}) {
  return http.post('/api/supplier/staff/page', payload);
}

export function saveSupplierStaff(payload: {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  categoryIds?: number[];
}) {
  return http.post('/api/supplier/staff/save', payload);
}

export function updateSupplierStaffState(payload: { id: number; acceptJobs?: boolean; suspended?: boolean }) {
  return http.post('/api/supplier/staff/state', payload);
}

export function deleteSupplierStaff(ids: number[]) {
  return http.post('/api/supplier/staff/delete', { ids });
}

export function exportSupplierStaff() {
  return http.get('/api/supplier/staff/export', { responseType: 'blob' });
}

export function downloadSupplierStaffTemplate() {
  return http.get('/api/supplier/staff/template', { responseType: 'blob' });
}

export function importSupplierStaff(file: File) {
  const body = new FormData();
  body.append('file', file);
  return http.post('/api/supplier/staff/import', body);
}
