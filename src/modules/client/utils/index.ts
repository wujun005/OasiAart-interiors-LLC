import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import router from '../router';

export const loginSuccess = (response: any) => {
  console.log('========== loginSuccess 接收到的数据 ==========');
  console.log('response:', response);
  console.log('response 类型:', typeof response);
  console.log('response.data:', response?.data);
  console.log('是否为对象:', typeof response === 'object' && response !== null);
  
  // 检查数据结构
  if (response && typeof response === 'object') {
    console.log('response 的键:', Object.keys(response));
    if (response.data) {
      console.log('response.data 的键:', Object.keys(response.data));
    }
  }
  console.log('=============================================');
  
  // 1. 保存 token 和其他用户信息
  // 注意：如果响应拦截器已经提取了 data，这里 response 就是 data
  // 如果响应拦截器没有提取，这里需要 response.data
  const data = response.data || response;
  const { token, userId, username, userType, expiresIn } = data;
  
  console.log('提取的数据:', { token, userId, username, userType, expiresIn });

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

  // 3. 触发自定义事件，通知其他组件登录状态已更新
  window.dispatchEvent(new Event('storage'));

  // 4. 提示用户登录成功
  ElMessage.success('登录成功');

  // 5. 跳转到首页或用户主页（根据你的需求设置跳转路径）
  router.push('/'); // 假设跳转到用户主页
};
