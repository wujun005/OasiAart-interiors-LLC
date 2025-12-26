import http from '@/modules/admin/utils/request';

// 更新订单
export function update(payload: any) {
  return http.put('/api/order', payload);
}

// 新增订单
export function add(payload: any) {
  return http.post('/api/order', payload);
}

// 查询订单
export function getInfo(id: any) {
  return http.get(`/api/order/${id}`);
}

// 删除订单
export function del(id: any) {
  return http.delete(`/api/order/${id}`);
}

// 分页查询
export function getPage(payload: any) {
  return http.get('/api/order/page', { params: payload });
}

// 上传文件
export function upload(payload: any) {
  return http.post('/api/file/upload', payload);
}

export default {
  getPage,
  getInfo,
  del,
  add,
  update,
  upload,
};
