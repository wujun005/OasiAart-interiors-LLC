import http from '@/modules/admin/utils/request';

export function listSysConfigs(params: { keyword?: string; status?: boolean } = {}) {
  return http.get('/api/admin/sys-config/all', { params });
}

export function createSysConfig(payload: { configKey: string; configValue?: string; description?: string; status?: boolean }) {
  return http.post('/api/admin/sys-config', payload);
}

export function updateSysConfig(payload: { id: number | string; configKey?: string; configValue?: string; description?: string; status?: boolean }) {
  return http.put('/api/admin/sys-config', payload);
}

export function deleteSysConfig(id: number | string) {
  return http.delete(`/api/admin/sys-config/${id}`);
}
