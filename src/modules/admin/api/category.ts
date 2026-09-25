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

// 拖拽排序：ids 按当前页拖拽后的展示顺序传递
export function sortCategories(ids: Array<number | string>) {
  return http.post('/api/category/sort', { ids });
}

// 删除商品 /api/category/deleteCategory
export function del(payload: any) {
  return http.post('/api/category/deleteCategory', payload);
}

// 上传文件
export function upload(payload: any) {
  return http.post('/api/file/upload', payload);
}

// /api/category/search 查询分类
export function searchCategory(payload: any) {
  return http.post('/api/category/search', payload);
}

// 分类名称模糊搜索（支持中文、英文及名称多语言）
export function fuzzySearchCategory(payload: any) {
  return http.post('/api/category/fuzzySearch', payload);
}
