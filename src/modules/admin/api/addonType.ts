import http from '@/modules/admin/utils/request';

// 规格类型分页查询//api/productAttachment/attachType/deleteAttachType
export function getPage(payload: any) {
  return http.post('/api/productAttachment/attachType/page', payload);
}

// 新增或更新规格类型
export function addOrUpdate(payload: any) {
  return http.post('/api/productAttachment/attachType/addOrUpdate', payload);
}

// 删除规格类型/api/productAttachment/attachType/deleteAttachType
export function deleteAttachType(payload: any) {
  return http.post('/api/productAttachment/attachType/deleteAttachType', payload);
}

