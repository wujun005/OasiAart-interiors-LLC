import http from '@/modules/admin/utils/request';

// 规格类型分页查询///api/productAttachment/attachValue/page
export function getPage(payload: any) {
  return http.post('/api/productAttachment/attachValue/page', payload);
}

// 新增或更新规格类型
export function addOrUpdate(payload: any) {
  return http.post('/api/productAttachment/attachValue/addOrUpdate', payload);
}

// 删除规格类型/api/productAttachment/attachValue/deleteAttachValue
export function deleteAttachValue(payload: any) {
  return http.post('/api/productAttachment/attachValue/deleteAttachValue', payload);
}

