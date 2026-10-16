import http from '@/modules/admin/utils/request';

export function getPackageCategoryPage(payload: any) {
  return http.post('/api/packageCategory/page', payload);
}

export function getPackageCategoryDetail(id: number | string) {
  return http.get(`/api/packageCategory/detail/${id}`);
}

export function addOrUpdatePackageCategory(payload: any) {
  return http.post('/api/packageCategory/addOrUpdate', payload);
}

export function deletePackageCategory(payload: { id: number }) {
  return http.post('/api/packageCategory/delete', payload);
}

export function changePackageCategoryStatus(payload: { id: number; status: number }) {
  return http.post('/api/packageCategory/changeStatus', payload);
}

export function sortPackageCategories(ids: Array<number | string>) {
  return http.post('/api/packageCategory/sort', { ids });
}

export function getPackageCategoryPreviewUrl() {
  return http.get('/api/packageCategory/previewUrl');
}

export function uploadPackageCategoryIcon(payload: FormData) {
  return http.post('/api/file/upload', payload);
}
