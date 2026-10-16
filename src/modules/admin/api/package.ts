import http from '@/modules/admin/utils/request';

export function getPackagePage(payload: any) {
  return http.post('/api/package/page', payload);
}

export function getPackageDetail(id: number | string) {
  return http.get(`/api/package/detail/${id}`);
}

export function addOrUpdatePackage(payload: any) {
  return http.post('/api/package/addOrUpdate', payload);
}

export function changePackageStatus(payload: { id: number; status: number }) {
  return http.post('/api/package/changeStatus', payload);
}

export function sortPackages(ids: Array<number | string>) {
  return http.post('/api/package/sort', { ids });
}

export function deletePackage(payload: { id: number }) {
  return http.post('/api/package/delete', payload);
}

export function uploadPackageImage(payload: FormData) {
  return http.post('/api/file/upload', payload);
}
