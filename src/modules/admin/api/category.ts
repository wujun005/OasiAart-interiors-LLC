import http from '@/modules/admin/utils/request';

// 更新商品 /api/category/page
export function update(payload: any) {
  return http.post('/api/category/addOrUpdateCategory', payload);
}

// 新增商品 /api/category/addOrUpdateCategory
export function add(payload: any) {
  return http.post('/api/category/addOrUpdateCategory', payload);
}

// /api/category/changeStatus
export function changeStatus(payload: any) {
  return http.post('/api/category/changeStatus', payload);
}

// 分页查询
export function getPage(payload: any) {
  return http.post('/api/category/page', payload);
}

// 删除商品 /api/category/deleteCategory
export function del(payload: any) {
  return http.post('/api/category/deleteCategory', payload);
}

// 上传文件
export function upload(payload: any) {
  return http.post('/api/file/upload', payload);
}