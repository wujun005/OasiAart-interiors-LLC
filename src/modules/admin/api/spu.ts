import http from '@/modules/admin/utils/request';

// 规格类型分页查询/api/productSpu/page
export function page(payload: any) {
  return http.post('/api/productSpu/page', payload);
}

// 新增或更新规格类型/api/productSpu/addOrUpdate
export function addOrUpdate(payload: any) {
  return http.post('/api/productSpu/addOrUpdate', payload);
}

// 删除规格类型/api/productSpu/delete/{id}
export function deleteProduct(id) {
  return http.delete(`/api/productSpu/delete/${id}`);
}

// 详情/api/productSpu/{id}
export function detial(id) {
  return http.get(`/api/productSpu/${id}`);
}

// 启动 /api/productSpu/enable/{id}
export function enable(id) {
    return http.post(`/api/productSpu/enable/${id}`);
}

// 停用 /api/productSpu/disable/{id}
export function disable(id) {
    return http.post(`/api/productSpu/disable/${id}`);
}

// /api/productSku/listBySpu 查询SKU列表
export function listBySpu(id: any) {
    return http.get(`/api/productSku/listBySpu?productId=${id}`);
}

// /api/productSku/batchUpdatePrices 批量更新价格
export function batchUpdatePrices(payload: any) {
    return http.post(`/api/productSku/batchUpdatePrices`, payload);
}

// 上架特卖/api/productSpu/enableExclusive/{id}
export function enableExclusive(id: any) {
  return http.post(`/api/productSpu/enableExclusive/${id}`);
}

// 下架特卖/api/productSpu/enableExclusive/{id}
export function disableExclusive(id: any) {
  return http.post(`/api/productSpu/disableExclusive/${id}`);
}
