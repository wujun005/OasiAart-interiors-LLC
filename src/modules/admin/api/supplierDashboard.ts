import http from '@/modules/admin/utils/request';

export function dashboardOverview() {
  return http.get('/api/platform/supplierDashboard/overview');
}

export function dashboardOnboardingTrend(params?: { startDate?: string; endDate?: string }) {
  return http.get('/api/platform/supplierDashboard/onboardingTrend', { params });
}

export function dashboardFulfillable(supplierId: number | string) {
  return http.get(`/api/platform/supplierDashboard/supplier/${encodeURIComponent(supplierId)}/fulfillable`);
}

export function dashboardFulfillableServices(supplierId: number | string) {
  return http.get(`/api/platform/supplierDashboard/supplier/${encodeURIComponent(supplierId)}/fulfillableServices`);
}

export function dashboardCatalog() {
  return http.get('/api/platform/supplierDashboard/catalog');
}

export function dashboardSuppliers(payload: Record<string, unknown>) {
  return http.post('/api/platform/supplierDashboard/suppliers', payload);
}

export function dashboardServiceSuppliers(spuId: number | string) {
  return http.get(`/api/platform/supplierDashboard/service/${encodeURIComponent(spuId)}/suppliers`);
}

export function dashboardPackageSuppliers(packageId: number | string) {
  return http.get(`/api/platform/supplierDashboard/package/${encodeURIComponent(packageId)}/suppliers`);
}
