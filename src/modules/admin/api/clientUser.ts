import http from '@/modules/admin/utils/request';

export function registrationTrend(params?: { startDate?: string; endDate?: string }) {
  return http.get('/api/platform/clientUser/registrationTrend', { params });
}
