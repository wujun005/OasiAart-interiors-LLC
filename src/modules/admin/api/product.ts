import http from '@/modules/admin/utils/request';

// 更新商品
export function update(payload: any) {
  return http.put('/api/product', payload);
}

// 新增商品
export function add(payload: any) {
  return http.post('/api/product', payload);
}

// 查询商品
export function getInfo(id: any) {
  return http.get(`/api/product/${id}`);
}

// 删除商品
export function del(id: any) {
  return http.delete(`/api/product/${id}`);
}

// 分页查询
export function getPage(payload: any) {
  return http.get('/api/product/page', { params: payload });
}

// 上传文件
export function upload(payload: any) {
  return http.post('/api/file/upload', payload);
}

export function currencies() {
  return http.get('/api/open/currencies');
}
export default {
  getPage,
  getInfo,
  del,
  add,
  update,
  upload,
  currencies,
};
