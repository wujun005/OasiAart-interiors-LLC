<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const isMobile = () => {
  const ua = navigator.userAgent || '';
  const mobileRegex =
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isSmallScreen = window.innerWidth <= 820;
  return mobileRegex.test(ua) || isSmallScreen;
};

onMounted(() => {
  // 如果是支付成功/失败页面，不进行重定向（由路由守卫处理）
  if (route.path.indexOf('/payment/') === 0) {
    return;
  }
  
  // 其他页面如果是移动设备，重定向到 H5 首页
  if (isMobile()) {
    window.location.href = '/h5';
  }
});
</script>
