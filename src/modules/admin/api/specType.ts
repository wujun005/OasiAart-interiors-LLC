import http from '@/modules/admin/utils/request';

// 规格类型分页查询
export function getSpecTypePage(payload: any) {
  return http.post('/api/specType/page', payload);
}

// 新增或更新规格类型
export function addOrUpdateSpecType(payload: any) {
  return http.post('/api/specType/addOrUpdateSpecType', payload);
}

// 删除规格类型
export function deleteSpecType(payload: any) {
  return http.post('/api/specType/deleteSpecType', payload);
}

