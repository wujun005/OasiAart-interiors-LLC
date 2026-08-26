import http from '@/modules/admin/utils/request';

export function page(payload: any) {
  return http.post('/api/supplier/page', payload);
}

export function detail(id: number | string) {
  return http.get(`/api/supplier/detail/${id}`);
}

export function addOrUpdate(payload: any) {
  return http.post('/api/supplier/addOrUpdate', payload);
}

export function remove(payload: any) {
  return http.post('/api/supplier/delete', payload);
}

export function changeStatus(payload: any) {
  return http.post('/api/supplier/changeStatus', payload);
}

export default {
  page,
  detail,
  addOrUpdate,
  remove,
  changeStatus,
};
