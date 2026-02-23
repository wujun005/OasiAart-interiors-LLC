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

// /api/admin/user-menu/assign 设置用户的菜单权限
export function assignUserRole(payload: any) {
  return http.post('/api/admin/user-menu/assign', payload);
}

// /api/admin/user-menu/user/{adminUserId} 获取制定用户的菜单权限
export function getUserRoles(adminUserId: any) {
  return http.get(`/api/admin/user-menu/user/${adminUserId}`);
}

// /api/admin/user-menu/current 获取当前用户的菜单权限
export function getCurrentUserRoles() {
  return http.get('/api/admin/user-menu/current');
}

export function getAll() {
  return http.get('/api/admin/user-menu/all');
}

export default {
  getPage,
  getInfo,
  del,
  add,
  update,
  assignUserRole,
  getUserRoles,
  getCurrentUserRoles,
  getAll
};
