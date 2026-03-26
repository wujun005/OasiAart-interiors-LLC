import { computed, ref } from 'vue';
import {
  clearStoredAuthState,
  getStoredAuthSnapshot,
  type StoredUserInfo,
} from '@/utils/auth-state';

/**
 * 检查用户是否已登录
 */
export const useAuth = () => {
  const isLoggedIn = ref(false);
  const userInfo = ref<StoredUserInfo>({});

  // 检查登录状态
  const checkLoginStatus = () => {
    const snapshot = getStoredAuthSnapshot();
    if (snapshot.isExpired) {
      clearAuth();
      return;
    }
    isLoggedIn.value = snapshot.isLoggedIn;
    userInfo.value = snapshot.userInfo;
  };

  // 清除登录信息
  const clearAuth = () => {
    clearStoredAuthState();
    isLoggedIn.value = false;
    userInfo.value = {};
  };

  // 立即检查一次登录状态（不等待 onMounted）
  checkLoginStatus();

  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    userInfo: computed(() => userInfo.value),
    checkLoginStatus,
    clearAuth,
  };
};
