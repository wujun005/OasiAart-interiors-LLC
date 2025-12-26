import http from '@/modules/admin/utils/request';

// 更新用户
export function update(payload: any) {
  return http.put('/api/admin-user', payload);
}

// 新增用户
export function add(payload: any) {
  return http.post('/api/admin-user', payload);
}

// 查询用户
export function getInfo(id: any) {
  return http.get(`/api/admin-user/${id}`);
}

// 删除用户
export function del(id: any) {
  return http.delete(`/api/admin-user/${id}`);
}

// 分页查询
export function getPage(payload: any) {
  return http.get('/api/admin-user/page', { params: payload });
}

export default {
  getPage,
  getInfo,
  del,
  add,
  update
};
