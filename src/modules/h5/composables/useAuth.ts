import { computed, ref } from 'vue';

interface UserInfo {
  email?: string;
  phone?: string;
  username?: string;
  userId?: string;
}

/**
 * 检查用户是否已登录
 */
export const useAuth = () => {
  const isLoggedIn = ref(false);
  const userInfo = ref<UserInfo>({});

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');
    
    if (token && expiresAt) {
      // 检查 token 是否过期
      const expiresAtNum = parseInt(expiresAt, 10);
      if (Date.now() < expiresAtNum) {
        isLoggedIn.value = true;
        // 从 localStorage 获取用户信息
        userInfo.value = {
          username: localStorage.getItem('username') || undefined,
          userId: localStorage.getItem('userId') || undefined,
          email: localStorage.getItem('email') || undefined,
          phone: localStorage.getItem('phone') || undefined,
        };
      } else {
        // Token 已过期，清除登录信息
        clearAuth();
      }
    } else {
      isLoggedIn.value = false;
      userInfo.value = {};
    }
  };

  // 清除登录信息
  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('email');
    localStorage.removeItem('phone');
    isLoggedIn.value = false;
    userInfo.value = {};
  };

  // 立即检查一次登录状态
  checkLoginStatus();

  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    userInfo: computed(() => userInfo.value),
    checkLoginStatus,
    clearAuth,
  };
};
