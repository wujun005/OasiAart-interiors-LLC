import http from '@/modules/admin/utils/request';

// 规格值分页查询
export function getSpecValuePage(payload: any) {
  return http.post('/api/specType/specValue/page', payload);
}

// 新增或更新规格值
export function addOrUpdateSpecValue(payload: any) {
  return http.post('/api/specType/specValue/addOrUpdate', payload);
}

// 删除规格值
export function deleteSpecValue(payload: any) {
  return http.post('/api/specType/specValue/deleteSpecValue', payload);
}