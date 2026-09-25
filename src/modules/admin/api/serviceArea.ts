import http from '@/modules/admin/utils/request';

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

export async function listAreas(payload: Record<string, unknown> = {}) {
  return unwrap(await http.post('/api/platform/serviceArea/list', payload));
}

export async function saveArea(payload: Record<string, unknown>) {
  return unwrap(await http.post('/api/platform/serviceArea/save', payload));
}

export async function changeAreaStatus(payload: { id: number; status: number }) {
  return unwrap(await http.post('/api/platform/serviceArea/changeStatus', payload));
}

export async function deleteArea(id: number) {
  return unwrap(await http.post('/api/platform/serviceArea/delete', { id }));
}

export async function pageCommunities(payload: Record<string, unknown>) {
  return unwrap(await http.post('/api/platform/serviceArea/community/page', payload));
}

export async function saveCommunity(payload: Record<string, unknown>) {
  return unwrap(await http.post('/api/platform/serviceArea/community/save', payload));
}

export async function batchSaveCommunities(payload: { areaId: number; names: string[] }) {
  return unwrap(await http.post('/api/platform/serviceArea/community/batchSave', payload));
}

export async function changeCommunityStatus(payload: { id: number; status: number }) {
  return unwrap(await http.post('/api/platform/serviceArea/community/changeStatus', payload));
}

export async function deleteCommunity(id: number) {
  return unwrap(await http.post('/api/platform/serviceArea/community/delete', { id }));
}
