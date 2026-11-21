import http from '@/modules/admin/utils/request';

export function getDevConfig() {
  return http.get('/api/admin/dev-config');
}

export function saveDevConfig(payload: Record<string, unknown>) {
  return http.put('/api/admin/dev-config', payload);
}

export function saveShowOptionPrice(payload: Record<string, unknown>) {
  return http.put('/api/admin/dev-config/show-option-price', payload);
}

export function saveAddonWorkload(payload: Record<string, unknown>) {
  return http.put('/api/admin/dev-config/addon-workload', payload);
}
