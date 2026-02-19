<template>
  <div class="client-layout">
    <SiteHeader />
    <main class="client-layout__main">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from '@/modules/client/components/layout/SiteHeader.vue';
import SiteFooter from '@/modules/client/components/layout/SiteFooter.vue';

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

<style scoped lang="scss">
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.client-layout__main {
  flex: 1;
}
</style>
