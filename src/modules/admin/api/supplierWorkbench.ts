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

export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/api/file/upload', formData);
}
