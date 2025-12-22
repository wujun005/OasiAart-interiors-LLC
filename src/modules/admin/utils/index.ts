import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
const router = useRouter();

export const loginSuccess = (response: any) => {
  // 1. 保存 token 和其他用户信息
  const { token, userId, username, userType, expiresIn } = response.data;

  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId.toString());
  localStorage.setItem('username', username);
  localStorage.setItem('userType', userType);

  // 设置 token 的过期时间
  const expiresAt = Date.now() + expiresIn;
  localStorage.setItem('expiresAt', expiresAt.toString());

  // 2. 设置 Authorization Header 用于后续请求
  // 假设你用 axios 或 fetch 发起请求，设置请求的 header
  axios.defaults.headers['Authorization'] = `Bearer ${token}`;

  // 3. 提示用户登录成功
  ElMessage.success('登录成功');

  // 4. 跳转到首页或用户主页（根据你的需求设置跳转路径）
  router.push('/'); // 假设跳转到用户主页
};
